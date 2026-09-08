import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { getPublicProfile, publicUrlFor } from "@/lib/students";

export const dynamic = "force-dynamic";

// QR de la ruta pública definitiva. Funciona sin iniciar sesión.
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const profile = await getPublicProfile(params.slug);
  if (!profile) return new Response("Perfil no disponible", { status: 404 });

  const url = publicUrlFor(params.slug);
  const png = await QRCode.toBuffer(url, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#0f172a", light: "#ffffff" },
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="qr-${params.slug}.png"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
