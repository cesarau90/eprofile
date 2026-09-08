"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireProfileAccess } from "@/lib/auth";
import { profileSchema, parseProfile, publishBlockReason } from "@/lib/profile";

export type SaveResult = { ok: boolean; message: string };

export async function saveDraftAction(slug: string, raw: unknown): Promise<SaveResult> {
  await requireProfileAccess(slug);

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Hay datos con formato inválido. Revisa el formulario." };
  }

  const student = await prisma.student.findUnique({ where: { slug } });
  if (!student) return { ok: false, message: "Estudiante no encontrado." };

  await prisma.student.update({
    where: { slug },
    data: { draftData: JSON.stringify(parsed.data) },
  });

  revalidatePath(`/${slug}/admin`);
  revalidatePath(`/${slug}/preview`);
  return { ok: true, message: "Borrador guardado. Aún no es visible en público." };
}

export async function publishAction(slug: string): Promise<SaveResult> {
  await requireProfileAccess(slug);

  const student = await prisma.student.findUnique({ where: { slug } });
  if (!student) return { ok: false, message: "Estudiante no encontrado." };

  const draft = parseProfile(student.draftData);
  const block = publishBlockReason(draft);
  if (block) return { ok: false, message: `No se puede publicar: ${block}` };

  await prisma.student.update({
    where: { slug },
    data: {
      publishedData: JSON.stringify(draft),
      publishedAt: new Date(),
    },
  });

  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/admin`);
  revalidatePath(`/${slug}/cv`);
  revalidatePath(`/${slug}/card`);
  return { ok: true, message: "¡Publicado! Los cambios ya son visibles en tu EProfile pública." };
}

export async function discardDraftAction(slug: string): Promise<SaveResult> {
  await requireProfileAccess(slug);
  const student = await prisma.student.findUnique({ where: { slug } });
  if (!student) return { ok: false, message: "Estudiante no encontrado." };
  if (!student.publishedData) {
    return { ok: false, message: "No hay contenido publicado al cual volver." };
  }
  await prisma.student.update({
    where: { slug },
    data: { draftData: student.publishedData },
  });
  revalidatePath(`/${slug}/admin`);
  return { ok: true, message: "Borrador descartado. Volviste al contenido publicado." };
}
