/**
 * Prueba dirigida: la sesión del administrador NO debe cerrarse al operar el
 * panel (/admin). Regresión del bug: crear una cuenta cerraba la sesión porque
 * GET /logout destruía la cookie y los navegadores/Next hacían prefetch de ese
 * enlace tras el revalidate.
 *
 * Uso:  npm run test:admin-session
 */
import { readFileSync } from "fs";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { emptyProfile } from "../src/lib/profile";

const MAX_AGE = 60 * 60 * 24 * 7;
// @prisma/client carga .env al instanciarse; leemos el secreto después de eso.
let COOKIE_SECRET: Uint8Array;

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}`); }
}

/** Replica de createSession (sin cookies()). */
async function mintSession(uid: string) {
  return new SignJWT({ uid })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(COOKIE_SECRET);
}

/** Replica de getCurrentUser: resuelve el usuario a partir del token de cookie. */
async function resolveSession(prisma: PrismaClient, token: string) {
  try {
    const { payload } = await jwtVerify(token, COOKIE_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.uid as string } });
    if (!user || !user.active) return null;
    return user;
  } catch {
    return null;
  }
}

async function main() {
  console.log("→ Preparando base de datos (migrate deploy + seed)…");
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });

  // Cargar .env si el entorno no trae las variables (tsx no lo hace solo).
  if (!process.env.SESSION_SECRET || !process.env.DATABASE_URL) {
    try {
      const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
      for (const line of env.split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    } catch {
      /* sin .env: se usará el entorno */
    }
  }

  const prisma = new PrismaClient();
  if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET no está configurado");
  COOKIE_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);
  const TEMP_EMAIL = "temp.admin-session@eprofile.test";
  const TEMP_SLUG = "temp-admin-session";
  const TEMP_PW = "Temporal123!";

  // limpieza previa por si una corrida anterior falló
  await prisma.user.deleteMany({ where: { email: TEMP_EMAIL } });
  await prisma.student.deleteMany({ where: { slug: TEMP_SLUG } });

  const admin = await prisma.user.findFirstOrThrow({ where: { role: "PLATFORM_ADMIN" } });
  const adminToken = await mintSession(admin.id);

  console.log("\n[0] Estado inicial");
  check("la sesión del admin resuelve como PLATFORM_ADMIN",
    (await resolveSession(prisma, adminToken))?.role === "PLATFORM_ADMIN");

  async function assertAdminIntact(label: string) {
    const u = await resolveSession(prisma, adminToken);
    check(`la sesión del admin sigue activa tras ${label}`,
      !!u && u.id === admin.id && u.role === "PLATFORM_ADMIN" && u.active);
  }

  console.log("\n[1] Crear cuenta de estudiante");
  const created = await prisma.user.create({
    data: {
      email: TEMP_EMAIL,
      passwordHash: await bcrypt.hash(TEMP_PW, 10),
      role: "STUDENT",
      student: { create: { slug: TEMP_SLUG, draftData: JSON.stringify(emptyProfile) } },
    },
    include: { student: true },
  });
  check("la cuenta se guarda con su slug", created.student?.slug === TEMP_SLUG);
  check("el nuevo estudiante puede autenticarse con sus credenciales",
    await bcrypt.compare(TEMP_PW, created.passwordHash));
  check("el nuevo estudiante NO es admin", created.role === "STUDENT");
  await assertAdminIntact("crear la cuenta");

  console.log("\n[2] El admin puede entrar al panel del nuevo estudiante");
  {
    const s = await prisma.student.findUnique({ where: { slug: TEMP_SLUG } });
    const u = await resolveSession(prisma, adminToken);
    // requireProfileAccess: un PLATFORM_ADMIN siempre pasa
    check("requireProfileAccess daría acceso al admin",
      !!s && !!u && u.role === "PLATFORM_ADMIN");
  }

  console.log("\n[3] Restablecer contraseña del estudiante");
  const NEW_PW = "Nueva4567!";
  await prisma.user.update({ where: { id: created.id }, data: { passwordHash: await bcrypt.hash(NEW_PW, 10) } });
  {
    const u = await prisma.user.findUniqueOrThrow({ where: { id: created.id } });
    check("la contraseña nueva verifica", await bcrypt.compare(NEW_PW, u.passwordHash));
  }
  await assertAdminIntact("restablecer contraseña");

  console.log("\n[4] Desactivar / reactivar");
  await prisma.user.update({ where: { id: created.id }, data: { active: false } });
  check("estudiante desactivado no resuelve sesión",
    (await resolveSession(prisma, await mintSession(created.id))) === null);
  await assertAdminIntact("desactivar");
  await prisma.user.update({ where: { id: created.id }, data: { active: true } });
  check("estudiante reactivado vuelve a resolver sesión",
    (await resolveSession(prisma, await mintSession(created.id)))?.id === created.id);
  await assertAdminIntact("reactivar");

  console.log("\n[5] Eliminar");
  await prisma.user.delete({ where: { id: created.id } });
  check("al borrar el User se borra el Student (cascade)",
    (await prisma.student.count({ where: { slug: TEMP_SLUG } })) === 0);
  await assertAdminIntact("eliminar");

  console.log("\n[6] GET /logout ya no destruye la sesión");
  const logoutSrc = readFileSync(new URL("../src/app/logout/route.ts", import.meta.url), "utf8");
  const getBody = logoutSrc.slice(logoutSrc.indexOf("export async function GET"));
  check("el handler GET no llama a destroySession", !getBody.includes("destroySession"));
  check("existe un handler POST para cerrar sesión", logoutSrc.includes("export async function POST"));
  check("PanelHeader cierra sesión por POST (form), no por <a>/Link",
    readFileSync(new URL("../src/components/PanelHeader.tsx", import.meta.url), "utf8")
      .includes('action="/logout" method="post"'));

  await prisma.$disconnect();

  console.log(`\n──────\nResultado: ${passed} pasadas, ${failed} fallidas`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
