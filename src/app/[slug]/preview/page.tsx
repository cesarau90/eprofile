import { notFound } from "next/navigation";
import Link from "next/link";
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
      <div className="no-print anim-fade-in sticky top-0 z-30 border-b border-amber-300 bg-amber-100/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm text-amber-900">
          <span>
            Vista previa del <strong>borrador</strong> · no es visible para el público.
          </span>
          <Link
            href={`/${params.slug}/admin`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400 bg-white/70 px-3 py-1 font-medium text-amber-900 transition duration-300 hover:bg-white"
          >
            <span aria-hidden>←</span> Volver al editor
          </Link>
        </div>
      </div>
      <ProfileView data={draft} slug={params.slug} publicUrl={publicUrlFor(params.slug)} />
    </main>
  );
}
