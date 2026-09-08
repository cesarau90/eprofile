import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { put, del } from "@vercel/blob";
import { requireProfileAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function hasBlobToken() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

/**
 * Extrae el `pathname` del blob (carpeta `perfiles/…`) a partir de:
 *  - la ruta interna `/api/media/perfiles/archivo.jpg`
 *  - una URL completa `https://….blob.vercel-storage.com/perfiles/archivo.jpg`
 * Devuelve null si no corresponde a una foto de perfil.
 */
function blobPathname(ref: string | null | undefined): string | null {
  if (!ref) return null;
  let path = ref;
  if (/^https?:\/\//i.test(ref)) {
    try {
      path = new URL(ref).pathname;
    } catch {
      return null;
    }
  }
  path = path.replace(/^\/?(api\/media\/)?/, "");
  return /^perfiles\/[A-Za-z0-9._-]+$/.test(path) ? path : null;
}

/** Borra un blob de la carpeta de perfiles (ignora errores). */
async function deleteBlob(ref: string | null | undefined) {
  const path = blobPathname(ref);
  if (!path) return;
  try {
    await del(path);
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

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length === 0) {
    return NextResponse.json({ error: "El archivo llegó vacío. Intenta de nuevo." }, { status: 400 });
  }

  const name = `perfiles/${params.slug}-${randomUUID()}.${TYPES[file.type]}`;
  await put(name, bytes, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: false,
  });

  // Reemplazo: si venía una foto anterior en Blob, la borramos.
  const previous = form.get("previous");
  if (typeof previous === "string") await deleteBlob(previous);

  // Se guarda la ruta servida por la propia app (evita que el navegador
  // consulte *.blob.vercel-storage.com, que algunas redes bloquean).
  return NextResponse.json({ url: `/api/media/${name}` });
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
