import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { put, del } from "@vercel/blob";
import { requireProfileAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function hasBlobToken() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

/** Borra un blob solo si la URL pertenece a Vercel Blob (ignora errores). */
async function deleteBlob(url: string | null | undefined) {
  if (!url || !/\.public\.blob\.vercel-storage\.com\//.test(url)) return;
  try {
    await del(url);
  } catch {
    /* el blob ya no existe o el token no aplica: no es fatal */
  }
}

/** Sube o reemplaza la foto. Acepta `file` y, opcionalmente, `previous` (URL a borrar). */
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  // requireProfileAccess redirige si no hay permiso; en un route handler
  // eso lanza NEXT_REDIRECT, que Next convierte en respuesta 307. Suficiente
  // para bloquear el acceso no autorizado.
  await requireProfileAccess(params.slug);

  if (!hasBlobToken()) {
    return NextResponse.json(
      { error: "Almacenamiento de imágenes no configurado (falta BLOB_READ_WRITE_TOKEN)." },
      { status: 503 },
    );
  }

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

  const name = `perfiles/${params.slug}-${randomUUID()}.${TYPES[file.type]}`;
  const blob = await put(name, file, { access: "public", contentType: file.type });

  // Reemplazo: si venía una foto anterior en Blob, la borramos.
  const previous = form.get("previous");
  if (typeof previous === "string") await deleteBlob(previous);

  return NextResponse.json({ url: blob.url });
}

/** Elimina la foto actual. Acepta `{ url }` en el cuerpo JSON. */
export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  await requireProfileAccess(params.slug);

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  await deleteBlob(body.url);
  return NextResponse.json({ ok: true });
}
