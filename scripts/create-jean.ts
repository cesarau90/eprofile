import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { profileSchema, type ProfileData } from "../src/lib/profile";

const prisma = new PrismaClient();

const SLUG = "jean-barrera";
const EMAIL = (process.env.JEAN_EMAIL || "jean.barrea@iest.edu.mx").toLowerCase();
const PASSWORD = process.env.JEAN_PASSWORD || "Estudiante123!";

const jean: ProfileData = profileSchema.parse({
  fullName: "Jean Barrera",
  headline: "Estudiante de Sistemas y Negocios Digitales",
  location: "Tampico, Tamaulipas",
  bio: "Estudiante de Sistemas y Negocios Digitales con interés en la inteligencia artificial y el análisis de datos. Aprendo sobre todo con proyectos de la escuela.",
  photoUrl: "",
  contact: {
    email: EMAIL,
    phone: "833 431 9714",
    linkedin: "",
    github: "",
    website: "",
  },
  education: [
    {
      institution: "IEST Anáhuac",
      degree: "Sistemas y Negocios Digitales (en curso)",
      start: "2023",
      end: "2027",
      description: "",
    },
  ],
  experience: [],
  skills: [
    { category: "Técnicas", items: ["Python", "Pandas", "SQL", "Power BI"] },
    { category: "Idiomas", items: ["Español (nativo)", "Inglés (intermedio)"] },
  ],
  projects: [
    {
      name: "Clasificador de imágenes con IA",
      description: "Proyecto escolar: modelo sencillo para clasificar imágenes por categoría.",
      tech: "Python",
      role: "Desarrollador",
      url: "",
      academic: true,
    },
    {
      name: "Asistente virtual (NEO)",
      description: "Proyecto escolar: asistente que ayuda con tareas de organización como recordatorios y correos.",
      tech: "Python",
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
  const data = JSON.stringify(jean);

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
