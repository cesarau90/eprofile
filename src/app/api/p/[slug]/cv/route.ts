import { NextRequest } from "next/server";
import { getPublicProfile } from "@/lib/students";
import { renderCvPdf } from "@/lib/cv-pdf";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const profile = await getPublicProfile(params.slug);
  if (!profile) return new Response("Perfil no disponible", { status: 404 });

  const pdf = await renderCvPdf(profile.data);
  const filename = `CV-${params.slug}.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
