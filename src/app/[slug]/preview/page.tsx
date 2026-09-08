import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfileAccess } from "@/lib/auth";
import { parseProfile } from "@/lib/profile";
import { publicUrlFor } from "@/lib/students";
import { ProfileView } from "@/components/ProfileView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vista previa del borrador", robots: { index: false } };

export default async function PreviewPage({ params }: { params: { slug: string } }) {
  await requireProfileAccess(params.slug);

  const student = await prisma.student.findUnique({ where: { slug: params.slug } });
  if (!student) notFound();

  const draft = parseProfile(student.draftData);

  return (
    <main className="min-h-screen bg-white">
      <div className="no-print bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
        Vista previa del <strong>borrador</strong> · esta versión no es visible para el público.
      </div>
      <ProfileView data={draft} slug={params.slug} publicUrl={publicUrlFor(params.slug)} />
    </main>
  );
}
