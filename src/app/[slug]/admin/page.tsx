import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfileAccess } from "@/lib/auth";
import { parseProfile, computeStatus, hasUnpublishedChanges } from "@/lib/profile";
import { ProfileEditor } from "@/components/ProfileEditor";
import { PanelHeader } from "@/components/PanelHeader";
import { Alert } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Panel del estudiante" };

export default async function StudentAdminPage({ params }: { params: { slug: string } }) {
  const { actingAsAdmin } = await requireProfileAccess(params.slug);

  const student = await prisma.student.findUnique({
    where: { slug: params.slug },
    include: { user: { select: { email: true, active: true } } },
  });
  if (!student) notFound();

  const draft = parseProfile(student.draftData);
  const status = computeStatus(student);
  const hasChanges = hasUnpublishedChanges(student);

  return (
    <div className="min-h-screen bg-slate-50">
      <PanelHeader
        title={`Editar EProfile · /${params.slug}`}
        subtitle={student.user.email}
        right={
          <Link
            href={`/${params.slug}`}
            target="_blank"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50"
          >
            Ver pública ↗
          </Link>
        }
      />
      <main className="mx-auto max-w-5xl px-4 py-6">
        {actingAsAdmin ? (
          <div className="mb-4">
            <Alert kind="warning">
              Estás editando este perfil como <strong>administrador de plataforma</strong>.
            </Alert>
          </div>
        ) : null}
        <ProfileEditor
          slug={params.slug}
          initialData={draft}
          initialHasChanges={hasChanges}
          initialStatus={status}
        />
      </main>
    </div>
  );
}
