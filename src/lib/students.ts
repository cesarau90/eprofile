import { prisma } from "./prisma";
import { parseProfile, computeStatus } from "./profile";
import { siteUrl } from "./settings";

export function publicUrlFor(slug: string) {
  return `${siteUrl()}/${slug}`;
}

/** Perfil público: solo si la cuenta está activa y hay contenido publicado. */
export async function getPublicProfile(slug: string) {
  const student = await prisma.student.findUnique({
    where: { slug },
    include: { user: { select: { active: true } } },
  });
  if (!student || !student.user.active || !student.publishedData) return null;
  return { student, data: parseProfile(student.publishedData) };
}

export async function listStudentsForAdmin() {
  const students = await prisma.student.findMany({
    orderBy: { createdAt: "asc" },
    include: { user: { select: { email: true, active: true, role: true, createdAt: true } } },
  });
  return students.map((s) => ({
    id: s.id,
    userId: s.userId,
    slug: s.slug,
    email: s.user.email,
    active: s.user.active,
    status: computeStatus(s),
    publishedAt: s.publishedAt,
    updatedAt: s.updatedAt,
  }));
}
