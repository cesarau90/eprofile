import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { requireProfileAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  // requireProfileAccess redirige si no hay permiso; en un route handler
  // eso lanza NEXT_REDIRECT, que Next convierte en respuesta 307. Suficiente
  // para bloquear el acceso no autorizado.
  await requireProfileAccess(params.slug);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "La solicitud no es un formulario válido." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
  }
  if (!TYPES[file.type]) {
    return NextResponse.json({ error: "Formato no permitido. Usa PNG, JPG o WebP." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen supera los 4 MB." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const name = `${params.slug}-${randomUUID()}.${TYPES[file.type]}`;
  await writeFile(path.join(dir, name), bytes);

  return NextResponse.json({ url: `/uploads/${name}` });
}
