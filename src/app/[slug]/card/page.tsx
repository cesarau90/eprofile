import { notFound } from "next/navigation";
import { getPublicProfile, publicUrlFor } from "@/lib/students";
import { CardView } from "@/components/CardView";

export const dynamic = "force-dynamic";

export default async function CardPage({ params }: { params: { slug: string } }) {
  const profile = await getPublicProfile(params.slug);
  if (!profile) notFound();
  const d = profile.data;
  const url = publicUrlFor(params.slug);

  return (
    <CardView
      slug={params.slug}
      url={url}
      data={{ fullName: d.fullName, headline: d.headline, contact: d.contact }}
    />
  );
}
