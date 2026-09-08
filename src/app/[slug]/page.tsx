import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProfile, publicUrlFor } from "@/lib/students";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const profile = await getPublicProfile(params.slug);
  if (!profile) return { title: "Perfil no encontrado" };
  const { data } = profile;
  return {
    title: `${data.fullName} — ${data.headline}`,
    description: data.bio || `EProfile de ${data.fullName}`,
    openGraph: {
      title: `${data.fullName} — ${data.headline}`,
      description: data.bio,
      images: data.photoUrl ? [data.photoUrl] : undefined,
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const profile = await getPublicProfile(params.slug);
  if (!profile) notFound();
  const { data } = profile;

  // Import diferido para no cargar el componente de acciones en el server bundle innecesariamente
  const { ProfileView } = await import("@/components/ProfileView");

  return (
    <main className="min-h-screen bg-white">
      <ProfileView data={data} slug={params.slug} publicUrl={publicUrlFor(params.slug)} />
    </main>
  );
}
