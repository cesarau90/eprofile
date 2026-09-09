import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth";
import { listStudentsForAdmin } from "@/lib/students";
import { PanelHeader } from "@/components/PanelHeader";
import { AdminClient } from "./AdminClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel de plataforma" };

export default async function AdminPage() {
  await requirePlatformAdmin();
  const students = await listStudentsForAdmin();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="anim-fade-in">
        <PanelHeader
          title="Panel del administrador de plataforma"
          subtitle={`${students.length} estudiante(s)`}
          right={
            <Link href="/admin/settings" className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50">
              Ajustes
            </Link>
          }
        />
      </div>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <AdminClient students={students} />
      </main>
    </div>
  );
}
