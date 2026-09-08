import { NextRequest } from "next/server";
import { head } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sirve las imágenes de Vercel Blob a través del propio dominio de la app.
 * Así funcionan detrás de filtros de red que bloquean *.blob.vercel-storage.com
 * pero permiten el dominio del sitio.
 */
export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  const pathname = params.path.map(decodeURIComponent).join("/");

  // Solo servimos la carpeta de fotos de perfil.
  if (!pathname.startsWith("perfiles/")) {
    return new Response("No encontrado", { status: 404 });
  }

  try {
    const meta = await head(pathname);
    const upstream = await fetch(meta.url, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      return new Response("No encontrado", { status: 404 });
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": meta.contentType || "application/octet-stream",
        "Content-Length": String(meta.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}
