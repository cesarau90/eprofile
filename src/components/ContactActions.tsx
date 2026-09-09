"use client";

import * as React from "react";

const I = "h-4 w-4 flex-shrink-0";
const IconDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" className={I} aria-hidden>
    <path d="M12 3v12m0 0 4-4m-4 4-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const IconContact = () => (
  <svg viewBox="0 0 24 24" fill="none" className={I} aria-hidden>
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="9" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M5.5 17c.6-1.8 2-2.7 3.5-2.7s2.9.9 3.5 2.7M15 9h4M15 13h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const IconDoc = () => (
  <svg viewBox="0 0 24 24" fill="none" className={I} aria-hidden>
    <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M13 3v5h5M8 13h8M8 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const IconQr = () => (
  <svg viewBox="0 0 24 24" fill="none" className={I} aria-hidden>
    <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
    <rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
    <rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
    <path d="M14 14h3v3M20 20v.01M17 20v.01M20 17v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const IconLink = () => (
  <svg viewBox="0 0 24 24" fill="none" className={I} aria-hidden>
    <path d="M9 15 15 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M11 6.5 12.5 5a4 4 0 0 1 5.7 5.7L16.5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M13 17.5 11.5 19a4 4 0 0 1-5.7-5.7L7.5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" className={I} aria-hidden>
    <path d="m5 13 4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const primary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md";
const secondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm";

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
      <a href={`/api/p/${slug}/cv`} target="_blank" rel="noopener noreferrer" className={primary}>
        <IconDownload /> Descargar CV
      </a>
      <a href={`/api/p/${slug}/vcard`} download={`${slug}.vcf`} className={secondary}>
        <IconContact /> Guardar contacto
      </a>
      <a href={`/${slug}/cv`} className={secondary}>
        <IconDoc /> Ver CV
      </a>
      <a href={`/${slug}/card`} className={secondary}>
        <IconQr /> Tarjeta con QR
      </a>
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
        className={`${secondary} ${copied ? "border-green-300 bg-green-50 text-green-700" : ""}`}
        aria-label={`Copiar enlace público de ${fullName}`}
      >
        {copied ? (
          <span className="anim-pop-in inline-flex items-center gap-2">
            <IconCheck /> ¡Enlace copiado!
          </span>
        ) : (
          <>
            <IconLink /> Copiar enlace
          </>
        )}
      </button>
    </div>
  );
}
