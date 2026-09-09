"use client";

import * as React from "react";
import Link from "next/link";
import { initialsOf } from "./Avatar";

const I = "h-4 w-4 flex-shrink-0";
const IconBack = () => (
  <svg viewBox="0 0 24 24" fill="none" className={I} aria-hidden>
    <path d="M15 6 9 12l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconPrint = () => (
  <svg viewBox="0 0 24 24" fill="none" className={I} aria-hidden>
    <path d="M7 9V4h10v5M7 19h10v-6H7v6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M7 15H5a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);
const IconDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" className={I} aria-hidden>
    <path d="M12 3v12m0 0 4-4m-4 4-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

const btn =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm";

type CardData = {
  fullName: string;
  headline: string;
  contact: { email?: string; phone?: string };
};

export function CardView({
  slug,
  data,
  url,
}: {
  slug: string;
  data: CardData;
  url: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const shortPath = url.replace(/^https?:\/\//, "");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard no disponible */
    }
  }

  return (
    <main className="card-print-page mx-auto max-w-2xl px-4 py-10">
      <div className="no-print mb-8 flex flex-wrap gap-2">
        <Link href={`/${slug}`} className={btn}>
          <IconBack /> Volver
        </Link>
        <button type="button" onClick={() => window.print()} className={btn}>
          <IconPrint /> Imprimir tarjeta
        </button>
        <a href={`/api/p/${slug}/qr`} download={`qr-${slug}.png`} className={btn}>
          <IconDownload /> Descargar QR
        </a>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copiar enlace público de ${data.fullName}`}
          className={`${btn} ${copied ? "border-green-300 bg-green-50 text-green-700" : ""}`}
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

      <div className="anim-card-in biz-card-slot">
        <div className="biz-card-stage">
          <div className="biz-card overflow-hidden rounded-[3mm] border border-slate-200 bg-gradient-to-br from-brand-50 via-white to-brand-100 shadow-lg print:shadow-none">
            <div className="flex h-full">
              {/* Datos */}
              <div className="flex min-w-0 flex-1 flex-col justify-between p-[4mm]">
                <div className="min-w-0">
                  <div className="flex items-center gap-[1.5mm]">
                    <span className="flex h-[7mm] w-[7mm] items-center justify-center rounded-[1.5mm] bg-brand-600 text-[3mm] font-bold text-white">
                      {initialsOf(data.fullName)}
                    </span>
                    <span className="text-[2.6mm] font-semibold tracking-wide text-brand-700">EProfile</span>
                  </div>
                  <p className="mt-[2.5mm] text-[4mm] font-bold leading-tight text-slate-900">
                    {data.fullName}
                  </p>
                  <p className="mt-[1mm] text-[2.9mm] font-medium leading-snug text-brand-700">
                    {data.headline}
                  </p>
                </div>
                <div className="space-y-[0.6mm] text-[2.5mm] leading-snug text-slate-600">
                  {data.contact.email ? <p className="break-words">{data.contact.email}</p> : null}
                  {data.contact.phone ? <p>{data.contact.phone}</p> : null}
                </div>
              </div>

              {/* QR */}
              <div className="flex flex-col items-center justify-center gap-[1.5mm] bg-white/60 p-[3mm]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/p/${slug}/qr`}
                  alt={`Código QR que abre ${url}`}
                  width={200}
                  height={200}
                  className="h-[26mm] w-[26mm] rounded-[1mm] bg-white p-[1.5mm]"
                />
                <p className="max-w-[30mm] text-center text-[2mm] leading-tight text-slate-500">
                  Escanea para ver mi EProfile
                </p>
                <p className="max-w-[30mm] break-all text-center text-[2mm] font-medium leading-tight text-slate-600">
                  {shortPath}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="no-print mt-6 text-center text-sm text-slate-500">
        El código QR apunta a <span className="font-mono">{url}</span> y funciona sin iniciar sesión.
      </p>
    </main>
  );
}
