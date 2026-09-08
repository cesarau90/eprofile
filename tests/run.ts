/**
 * Pruebas de aceptación (sin servidor HTTP): validan la lógica de negocio
 * directamente contra la base de datos sembrada y las funciones puras.
 *
 * Uso:  npm run test   (ejecuta db push + seed + estas comprobaciones)
 */
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  computeStatus,
  hasUnpublishedChanges,
  parseProfile,
  publishBlockReason,
  slugIssue,
  visibleSections,
  emptyProfile,
} from "../src/lib/profile";
import { buildVCard } from "../src/lib/vcard";
import { renderCvPdf } from "../src/lib/cv-pdf";
import QRCode from "qrcode";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
  }
}

async function main() {
  console.log("→ Preparando base de datos de prueba (db push + seed)…");
  execSync("npx prisma db push --skip-generate --accept-data-loss", { stdio: "inherit" });
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });

  const prisma = new PrismaClient();

  console.log("\n[1] Autenticación por roles");
  const admin = await prisma.user.findFirst({ where: { role: "PLATFORM_ADMIN" } });
  check("existe una cuenta PLATFORM_ADMIN", !!admin);
  const juanUser = await prisma.user.findFirst({
    where: { role: "STUDENT" },
    include: { student: true },
  });
  check("existe al menos una cuenta STUDENT", !!juanUser);
  check(
    "el hash de contraseña del admin verifica con la contraseña de seed",
    !!admin &&
      (await bcrypt.compare(process.env.SEED_ADMIN_PASSWORD || "Admin123!", admin.passwordHash)),
  );
  check(
    "una contraseña incorrecta NO verifica",
    !!admin && !(await bcrypt.compare("incorrecta", admin.passwordHash)),
  );

  console.log("\n[2] Estados de perfil (vacío / borrador / publicado)");
  const juan = await prisma.student.findUnique({ where: { slug: "juan-perez" } });
  const maria = await prisma.student.findUnique({ where: { slug: "maria-lopez" } });
  check("juan-perez está 'published'", !!juan && computeStatus(juan) === "published");
  check("juan-perez NO tiene cambios sin publicar", !!juan && !hasUnpublishedChanges(juan));
  check("maria-lopez tiene cambios en borrador sin publicar", !!maria && hasUnpublishedChanges(maria));
  check("maria-lopez computeStatus === 'draft'", !!maria && computeStatus(maria) === "draft");

  console.log("\n[3] Separación borrador / publicado");
  const mPub = parseProfile(maria!.publishedData);
  const mDraft = parseProfile(maria!.draftData);
  check(
    "el borrador de maria tiene más proyectos que lo publicado",
    mDraft.projects.length > mPub.projects.length,
  );
  check(
    "lo publicado de maria NO contiene el proyecto en borrador",
    !mPub.projects.some((p) => p.name.includes("reciclaje")),
  );

  console.log("\n[4] Reglas de publicación (mínimo nombre y carrera)");
  check("perfil vacío NO se puede publicar", publishBlockReason(emptyProfile) !== null);
  check(
    "perfil solo con nombre NO se puede publicar",
    publishBlockReason({ ...emptyProfile, fullName: "Ana" }) !== null,
  );
  check(
    "perfil con nombre y carrera SÍ se puede publicar",
    publishBlockReason({ ...emptyProfile, fullName: "Ana", headline: "Diseño" }) === null,
  );

  console.log("\n[5] Slug único y válido");
  check("slug 'ab' es inválido (muy corto)", slugIssue("ab") !== null);
  check("slug 'admin' está reservado", slugIssue("admin") !== null);
  check("slug 'juan-perez' es válido", slugIssue("juan-perez") === null);
  check(
    "el slug de juan-perez es único en la BD",
    (await prisma.student.count({ where: { slug: "juan-perez" } })) === 1,
  );

  console.log("\n[6] Aislamiento entre estudiantes (a nivel de datos)");
  const otherStudent = await prisma.student.findFirst({ where: { slug: { not: "juan-perez" } } });
  check(
    "juan y otro estudiante son registros y cuentas distintas",
    !!otherStudent && otherStudent.userId !== juan!.userId,
  );

  console.log("\n[7] Perfil público: activo + publicado");
  // Desactivamos temporalmente a juan y comprobamos que deja de ser visible.
  await prisma.user.update({ where: { id: juan!.userId }, data: { active: false } });
  const juanInactive = await prisma.student.findUnique({
    where: { slug: "juan-perez" },
    include: { user: true },
  });
  check(
    "cuenta desactivada => no se sirve el perfil público",
    !(juanInactive!.user.active && juanInactive!.publishedData),
  );
  await prisma.user.update({ where: { id: juan!.userId }, data: { active: true } });

  console.log("\n[8] Secciones vacías ocultas");
  const vis = visibleSections(emptyProfile);
  check("perfil vacío: ninguna sección visible", Object.values(vis).every((v) => v === false));
  const visJuan = visibleSections(parseProfile(juan!.publishedData));
  check("perfil de juan: proyectos visibles", visJuan.projects === true);

  console.log("\n[9] CV en PDF (mismos datos publicados)");
  const pdf = await renderCvPdf(parseProfile(juan!.publishedData));
  check("el PDF se genera y pesa > 1 KB", pdf.length > 1024);
  check("el PDF empieza con la firma %PDF", pdf.subarray(0, 4).toString() === "%PDF");

  console.log("\n[10] vCard válida con datos publicados");
  const vcf = buildVCard(parseProfile(juan!.publishedData), "http://localhost:3000/juan-perez");
  check("vCard tiene BEGIN/END", vcf.startsWith("BEGIN:VCARD") && vcf.trim().endsWith("END:VCARD"));
  check("vCard incluye el nombre completo", vcf.includes("FN:Juan Pérez"));
  check("vCard incluye la URL pública", vcf.includes("http://localhost:3000/juan-perez"));

  console.log("\n[11] QR de la ruta pública");
  const qr = await QRCode.toBuffer("http://localhost:3000/juan-perez");
  check("el QR PNG se genera (> 100 bytes)", qr.length > 100);
  check("el QR PNG tiene firma PNG", qr.subarray(1, 4).toString() === "PNG");

  console.log("\n[12] Persistencia: cambio publicado se lee de la BD");
  const before = parseProfile(juan!.publishedData).bio;
  await prisma.student.update({
    where: { slug: "juan-perez" },
    data: { publishedData: JSON.stringify({ ...parseProfile(juan!.publishedData), bio: "Bio actualizada" }) },
  });
  const reread = await prisma.student.findUnique({ where: { slug: "juan-perez" } });
  check("la nueva bio persiste en la base de datos", parseProfile(reread!.publishedData).bio === "Bio actualizada");
  // restaurar
  await prisma.student.update({
    where: { slug: "juan-perez" },
    data: { publishedData: JSON.stringify({ ...parseProfile(reread!.publishedData), bio: before }) },
  });

  console.log("\n[13] Flujo admin: crear cuenta → editar → publicar → visible en su ruta");
  const hashPw = await bcrypt.hash("Prueba123!", 10);
  const created = await prisma.user.create({
    data: {
      email: "test.e2e@eprofile.test",
      passwordHash: hashPw,
      role: "STUDENT",
      student: { create: { slug: "test-e2e", draftData: JSON.stringify(emptyProfile) } },
    },
    include: { student: true },
  });
  check("cuenta creada con slug 'test-e2e'", created.student?.slug === "test-e2e");
  let pub = await import("../src/lib/students").then((m) => m.getPublicProfile("test-e2e"));
  check("perfil recién creado NO es público (sin publicar)", pub === null);

  // editar borrador
  const newData = { ...emptyProfile, fullName: "Test E2E", headline: "QA", bio: "Hola" };
  await prisma.student.update({
    where: { slug: "test-e2e" },
    data: { draftData: JSON.stringify(newData) },
  });
  pub = await import("../src/lib/students").then((m) => m.getPublicProfile("test-e2e"));
  check("con borrador pero sin publicar sigue sin ser público", pub === null);

  // publicar
  const st = await prisma.student.findUniqueOrThrow({ where: { slug: "test-e2e" } });
  check("el borrador cumple el mínimo para publicar", publishBlockReason(parseProfile(st.draftData)) === null);
  await prisma.student.update({
    where: { slug: "test-e2e" },
    data: { publishedData: st.draftData, publishedAt: new Date() },
  });
  pub = await import("../src/lib/students").then((m) => m.getPublicProfile("test-e2e"));
  check("tras publicar, el perfil es visible en su ruta", pub?.data.fullName === "Test E2E");

  // desactivar
  await prisma.user.update({ where: { id: created.id }, data: { active: false } });
  pub = await import("../src/lib/students").then((m) => m.getPublicProfile("test-e2e"));
  check("cuenta desactivada → el perfil deja de verse", pub === null);

  // limpiar
  await prisma.user.delete({ where: { id: created.id } });
  check("eliminar la cuenta borra también al estudiante (cascade)", (await prisma.student.count({ where: { slug: "test-e2e" } })) === 0);

  await prisma.$disconnect();

  console.log(`\n──────────────────────────────\nResultado: ${passed} pasadas, ${failed} fallidas`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
