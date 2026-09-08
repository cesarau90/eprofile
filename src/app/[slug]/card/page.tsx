import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicProfile, publicUrlFor } from "@/lib/students";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function CardPage({ params }: { params: { slug: string } }) {
  const profile = await getPublicProfile(params.slug);
  if (!profile) notFound();
  const d = profile.data;
  const url = publicUrlFor(params.slug);

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <div className="no-print mb-6 flex items-center gap-3">
        <Link href={`/${params.slug}`} className="text-sm text-brand-600 hover:underline">
          ← Volver
        </Link>
        <PrintButton label="Imprimir tarjeta" />
        <a
          href={`/api/p/${params.slug}/qr`}
          download={`qr-${params.slug}.png`}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Descargar QR
        </a>
      </div>

      {/* Tarjeta de presentación imprimible (~85 x 55 mm) */}
      <div className="mx-auto flex w-[340px] items-center gap-4 rounded-xl border border-slate-300 bg-white p-5 shadow-md print:shadow-none">
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-slate-900">{d.fullName}</p>
          <p className="truncate text-sm text-brand-700">{d.headline}</p>
          <div className="mt-2 space-y-0.5 text-xs text-slate-600">
            {d.contact.email ? <p className="truncate">{d.contact.email}</p> : null}
            {d.contact.phone ? <p>{d.contact.phone}</p> : null}
            <p className="truncate text-slate-400">{url.replace(/^https?:\/\//, "")}</p>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/p/${params.slug}/qr`}
          alt={`Código QR que abre ${url}`}
          width={96}
          height={96}
          className="h-24 w-24 flex-shrink-0"
        />
      </div>

      <p className="no-print mt-6 text-center text-sm text-slate-500">
        El código QR apunta a <span className="font-mono">{url}</span> y funciona sin iniciar sesión.
      </p>
    </main>
  );
}
