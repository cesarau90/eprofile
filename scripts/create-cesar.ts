import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { profileSchema, type ProfileData } from "../src/lib/profile";

const prisma = new PrismaClient();

const SLUG = "cesar-del-angel";
const EMAIL = (process.env.CESAR_EMAIL || "augusto.delangel@iest.edu.mx").toLowerCase();
const PASSWORD = process.env.CESAR_PASSWORD || "Estudiante123!";

const cesar: ProfileData = profileSchema.parse({
  fullName: "César Augusto del Ángel Castillo",
  headline: "Estudiante de Sistemas y Negocios Digitales",
  location: "México",
  bio: "Estudiante de Sistemas y Negocios Digitales. Me interesa el desarrollo web y usar la tecnología para resolver problemas reales. Aprendo haciendo, sobre todo con proyectos de la escuela.",
  photoUrl: "",
  contact: {
    email: EMAIL,
    phone: "",
    linkedin: "",
    github: "https://github.com/cesarau90",
    website: "",
  },
  education: [
    {
      institution: "Universidad",
      degree: "Sistemas y Negocios Digitales (en curso)",
      start: "",
      end: "",
      description: "Carrera enfocada en tecnología y negocios: programación, bases de datos, desarrollo web y análisis de datos. Actualmente en la asignatura Nuevas Tecnologías.",
    },
  ],
  experience: [],
  skills: [
    { category: "Técnicas", items: ["JavaScript", "React", "SQL", "HTML y CSS", "Git"] },
    { category: "Idiomas", items: ["Español (nativo)", "Inglés (lectura técnica)"] },
  ],
  projects: [
    {
      name: "Administración de comedor",
      description: "Proyecto escolar: pequeña aplicación para registrar menús y las raciones servidas del día, con un reporte simple de consumo.",
      tech: "React, SQL",
      role: "Desarrollador",
      url: "",
      academic: true,
    },
    {
      name: "EProfile",
      description: "Proyecto de la asignatura Nuevas Tecnologías: plataforma de tarjetas de presentación digitales para estudiantes, con perfil público, CV en PDF y código QR.",
      tech: "Next.js, TypeScript, SQL",
      role: "Desarrollador",
      url: "",
      academic: true,
    },
    {
      name: "Citas para barbería",
      description: "Proyecto escolar: aplicación para agendar citas en una barbería, con horarios disponibles y registro de clientes.",
      tech: "React, SQL",
      role: "Desarrollador",
      url: "",
      academic: true,
    },
  ],
  awards: [],
  cvTemplate: "modern",
});

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const data = JSON.stringify(cesar);

  const existing = await prisma.student.findUnique({ where: { slug: SLUG } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.userId },
      data: { email: EMAIL, passwordHash, active: true, role: "STUDENT" },
    });
    await prisma.student.update({
      where: { slug: SLUG },
      data: { draftData: data, publishedData: data, publishedAt: new Date() },
    });
  } else {
    await prisma.user.create({
      data: {
        email: EMAIL,
        passwordHash,
        role: "STUDENT",
        student: {
          create: { slug: SLUG, draftData: data, publishedData: data, publishedAt: new Date() },
        },
      },
    });
  }

  console.log(`Perfil creado y publicado:`);
  console.log(`  ${EMAIL} / ${PASSWORD}  ->  /${SLUG}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
