"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/auth";
import { hashPassword, passwordIssues } from "@/lib/password";
import { normalizeSlug, slugIssue, emptyProfile } from "@/lib/profile";
import { getSettings, saveSettings } from "@/lib/settings";

export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  /** "warning" pinta el mensaje en ámbar (p. ej. al desactivar una cuenta). */
  tone?: "success" | "warning";
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createStudentAction(_p: ActionState, form: FormData): Promise<ActionState> {
  await requirePlatformAdmin();

  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const slug = normalizeSlug(String(form.get("slug") || ""));

  if (!EMAIL_RE.test(email)) return { error: "Correo con formato inválido." };
  const si = slugIssue(slug);
  if (si) return { error: si };
  const pi = passwordIssues(password);
  if (pi.length) return { error: `Contraseña: ${pi.join(" ")}` };

  const [emailTaken, slugTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.student.findUnique({ where: { slug } }),
  ]);
  if (emailTaken) return { error: "Ya existe una cuenta con ese correo." };
  if (slugTaken) return { error: "Ese slug ya está en uso." };

  await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      role: "STUDENT",
      student: { create: { slug, draftData: JSON.stringify(emptyProfile) } },
    },
  });

  revalidatePath("/admin");
  return { ok: true, message: `Cuenta creada para ${email} en /${slug}.` };
}

export async function setActiveAction(userId: string, active: boolean): Promise<ActionState> {
  await requirePlatformAdmin();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Cuenta no encontrada." };
  if (user.role === "PLATFORM_ADMIN") return { error: "No se puede desactivar una cuenta de administrador." };
  await prisma.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/admin");
  return active
    ? { ok: true, message: "Cuenta reactivada.", tone: "success" }
    : { ok: true, message: "Cuenta desactivada. Su EProfile deja de verse.", tone: "warning" };
}

export async function deleteStudentAction(studentId: string, confirmSlug: string): Promise<ActionState> {
  await requirePlatformAdmin();
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return { error: "Estudiante no encontrado." };
  if (confirmSlug !== student.slug) return { error: "El slug de confirmación no coincide." };
  // onDelete: Cascade en User->Student; borramos el User para limpiar todo.
  await prisma.user.delete({ where: { id: student.userId } });
  revalidatePath("/admin");
  return { ok: true, message: `Cuenta /${student.slug} eliminada.` };
}

export async function resetPasswordAction(userId: string, newPassword: string): Promise<ActionState> {
  await requirePlatformAdmin();
  const pi = passwordIssues(newPassword);
  if (pi.length) return { error: `Contraseña: ${pi.join(" ")}` };
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Cuenta no encontrada." };
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(newPassword) } });
  revalidatePath("/admin");
  return { ok: true, message: "Contraseña restablecida." };
}

export async function saveSettingsAction(_p: ActionState, form: FormData): Promise<ActionState> {
  await requirePlatformAdmin();
  const current = await getSettings();
  await saveSettings({
    siteName: String(form.get("siteName") || current.siteName).trim() || current.siteName,
    tagline: String(form.get("tagline") || "").trim(),
    contactEmail: String(form.get("contactEmail") || "").trim(),
    allowPublicIndex: form.get("allowPublicIndex") === "on",
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { ok: true, message: "Ajustes guardados." };
}
