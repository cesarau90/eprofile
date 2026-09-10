import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { profileSchema, type ProfileData } from "../src/lib/profile";

const prisma = new PrismaClient();

function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

const juan: ProfileData = profileSchema.parse({
  fullName: "Juan Pérez",
  headline: "Ingeniería en Sistemas Computacionales",
  location: "Guadalajara, México",
  bio: "Estudiante de últimos semestres con interés en desarrollo web y datos. Me gusta construir proyectos que se puedan usar de verdad y documentarlos bien.",
  photoUrl: "",
  contact: {
    email: "juan.perez@eprofile.test",
    phone: "+52 33 1234 5678",
    linkedin: "https://www.linkedin.com/in/ejemplo-juan-perez",
    github: "https://github.com/ejemplo-juanperez",
    website: "",
  },
  education: [
    {
      institution: "Universidad Tecnológica",
      degree: "Ing. en Sistemas Computacionales",
      start: "2021",
      end: "2025",
      description: "Promedio 9.2. Enfoque en desarrollo de software y bases de datos.",
    },
  ],
  experience: [
    {
      organization: "Laboratorio de Innovación (universidad)",
      role: "Desarrollador web (becario)",
      start: "2024",
      end: "Actual",
      description: "Mantenimiento de una app interna en Next.js y PostgreSQL. Automatización de reportes.",
    },
  ],
  skills: [
    { category: "Técnicas", items: ["TypeScript", "React", "Next.js", "SQL", "Prisma", "Git"] },
    { category: "Blandas", items: ["Trabajo en equipo", "Comunicación", "Organización"] },
    { category: "Idiomas", items: ["Español (nativo)", "Inglés (B2)"] },
  ],
  projects: [
    {
      name: "EProfile",
      description: "Plataforma de tarjetas de presentación digitales para estudiantes. Rol full-stack.",
      tech: "Next.js, TypeScript, Prisma, Tailwind",
      role: "Desarrollador full-stack",
      url: "",
      academic: true,
    },
    {
      name: "Bot de recordatorios",
      description: "Servicio que envía recordatorios de tareas por correo.",
      tech: "Node.js, cron",
      role: "Autor",
      url: "",
      academic: false,
    },
  ],
  awards: [
    {
      title: "2.º lugar Hackathon Universitario",
      issuer: "Universidad Tecnológica",
      date: "2024",
      description: "Prototipo de accesibilidad web.",
    },
  ],
  cvTemplate: "modern",
});

const mariaPublished: ProfileData = profileSchema.parse({
  fullName: "María López",
  headline: "Lic. en Diseño de Interacción",
  location: "CDMX, México",
  bio: "Diseñadora enfocada en experiencia de usuario y sistemas de diseño.",
  contact: {
    email: "maria.lopez@eprofile.test",
    phone: "+52 55 8765 4321",
    linkedin: "https://www.linkedin.com/in/ejemplo-maria-lopez",
    github: "",
    website: "https://ejemplo-maria.design",
  },
  education: [
    {
      institution: "Universidad del Valle",
      degree: "Lic. en Diseño de Interacción",
      start: "2020",
      end: "2024",
      description: "",
    },
  ],
  experience: [
    {
      organization: "Estudio Norte",
      role: "Diseñadora UX junior",
      start: "2023",
      end: "Actual",
      description: "Investigación con usuarios y prototipado en Figma.",
    },
  ],
  skills: [
    { category: "Diseño", items: ["Figma", "Design Systems", "Prototipado", "Accesibilidad"] },
    { category: "Investigación", items: ["Entrevistas", "Pruebas de usabilidad"] },
  ],
  projects: [
    {
      name: "Rediseño de portal académico",
      description: "Proyecto de titulación: rediseño del portal de servicios escolares.",
      tech: "Figma, Maze",
      role: "Diseñadora principal",
      url: "",
      academic: true,
    },
  ],
  awards: [],
  cvTemplate: "classic",
});

// Borrador pendiente: María agregó una habilidad y un proyecto que aún NO publica.
const mariaDraft: ProfileData = profileSchema.parse({
  ...mariaPublished,
  bio: "Diseñadora enfocada en experiencia de usuario, sistemas de diseño y accesibilidad. (Actualización en borrador.)",
  skills: [
    ...mariaPublished.skills,
    { category: "Código", items: ["HTML", "CSS", "JavaScript básico"] },
  ],
  projects: [
    ...mariaPublished.projects,
    {
      name: "App de reciclaje (concepto)",
      description: "Concepto de app para puntos de reciclaje. Aún en borrador.",
      tech: "Figma",
      role: "Diseñadora",
      url: "",
      academic: false,
    },
  ],
});

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@eprofile.test").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
  const s1Email = (process.env.SEED_STUDENT1_EMAIL || "juan.perez@eprofile.test").toLowerCase();
  const s1Password = process.env.SEED_STUDENT1_PASSWORD || "Estudiante123!";
  const s2Email = (process.env.SEED_STUDENT2_EMAIL || "maria.lopez@eprofile.test").toLowerCase();
  const s2Password = process.env.SEED_STUDENT2_PASSWORD || "Estudiante123!";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: await hash(adminPassword), role: "PLATFORM_ADMIN", active: true },
    create: { email: adminEmail, passwordHash: await hash(adminPassword), role: "PLATFORM_ADMIN" },
  });

  // Contenido de perfil (draftData / publishedData / publishedAt) SOLO se
  // escribe al crear la cuenta por primera vez. En cuentas que ya existen, el
  // seed nunca toca el contenido: el estado (borrador/publicado) lo controla
  // únicamente el usuario con "Guardar borrador" / "Publicar". Antes, un
  // `student.update` incondicional revertía a María a "borrador" cada vez que
  // corría el seed (p. ej. `npm run test`).
  async function seedStudent(
    email: string,
    password: string,
    slug: string,
    initial: { draftData: string; publishedData: string | null; publishedAt: Date | null },
  ) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash: await hash(password), active: true },
      create: {
        email,
        passwordHash: await hash(password),
        role: "STUDENT",
        student: { create: { slug, ...initial } },
      },
      include: { student: true },
    });
    // Cuenta preexistente sin ficha de estudiante: crearla una sola vez.
    if (!user.student) {
      await prisma.student.create({ data: { userId: user.id, slug, ...initial } });
    }
  }

  // Estudiante 1: perfil PUBLICADO y sin cambios pendientes.
  await seedStudent(s1Email, s1Password, "juan-perez", {
    draftData: JSON.stringify(juan),
    publishedData: JSON.stringify(juan),
    publishedAt: new Date(),
  });

  // Estudiante 2: perfil PUBLICADO + BORRADOR pendiente (cambios no publicados).
  await seedStudent(s2Email, s2Password, "maria-lopez", {
    draftData: JSON.stringify(mariaDraft),
    publishedData: JSON.stringify(mariaPublished),
    publishedAt: new Date(Date.now() - 86400_000),
  });

  await prisma.setting.upsert({
    where: { key: "siteName" },
    update: {},
    create: { key: "siteName", value: "EProfile" },
  });

  console.log("Seed completado:");
  console.log(`  Admin:      ${adminEmail} / ${adminPassword}`);
  console.log(`  Estudiante: ${s1Email} / ${s1Password}  -> /juan-perez (publicado)`);
  console.log(`  Estudiante: ${s2Email} / ${s2Password}  -> /maria-lopez (publicado + borrador)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
