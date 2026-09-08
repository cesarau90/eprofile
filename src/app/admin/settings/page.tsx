import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { PanelHeader } from "@/components/PanelHeader";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ajustes de la plataforma" };

export default async function SettingsPage() {
  await requirePlatformAdmin();
  const settings = await getSettings();

  return (
    <div className="min-h-screen bg-slate-50">
      <PanelHeader
        title="Ajustes generales"
        right={
          <Link href="/admin" className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50">
            ← Volver
          </Link>
        }
      />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <SettingsForm settings={settings} />
      </main>
    </div>
  );
}
