"use client";

import * as React from "react";
import { LinkButton } from "./ui";

export function ContactActions({
  slug,
  publicUrl,
  fullName,
  contact,
}: {
  slug: string;
  publicUrl: string;
  fullName: string;
  contact: { email?: string; phone?: string };
}) {
  const [copied, setCopied] = React.useState(false);

  return (
    <div className="no-print mt-6 flex flex-wrap gap-2">
      <LinkButton href={`/api/p/${slug}/cv`} variant="primary" target="_blank">
        Descargar CV (PDF)
      </LinkButton>
      <a
        href={`/api/p/${slug}/vcard`}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
        download={`${slug}.vcf`}
      >
        Guardar contacto (vCard)
      </a>
      <LinkButton href={`/${slug}/cv`} variant="secondary">
        Ver CV
      </LinkButton>
      <LinkButton href={`/${slug}/card`} variant="secondary">
        Tarjeta con QR
      </LinkButton>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(publicUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            /* clipboard no disponible */
          }
        }}
        className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        aria-label={`Copiar enlace público de ${fullName}`}
      >
        {copied ? "¡Enlace copiado!" : "Copiar enlace"}
      </button>
    </div>
  );
}
