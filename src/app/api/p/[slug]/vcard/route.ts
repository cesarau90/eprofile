import { NextRequest } from "next/server";
import { getPublicProfile, publicUrlFor } from "@/lib/students";
import { buildVCard } from "@/lib/vcard";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const profile = await getPublicProfile(params.slug);
  if (!profile) return new Response("Perfil no disponible", { status: 404 });

  const vcf = buildVCard(profile.data, publicUrlFor(params.slug));
  return new Response(vcf, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${params.slug}.vcf"`,
      "Cache-Control": "no-store",
    },
  });
}
