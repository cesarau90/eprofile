"use client";

import * as React from "react";

/** Iniciales (máx. 2) a partir del nombre completo. */
export function initialsOf(fullName: string): string {
  return (
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}

/**
 * Normaliza la URL de la foto para que siempre se sirva desde el propio
 * dominio (`/api/media/...`). Las fotos antiguas guardaban la URL directa de
 * Vercel Blob, que algunas redes bloquean.
 */
function normalizeSrc(src?: string | null): string | undefined {
  if (!src) return undefined;
  const m = src.match(
    /^https?:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/(perfiles\/[A-Za-z0-9._-]+)$/i,
  );
  if (m) return `/api/media/${m[1]}`;
  return src;
}

/**
 * Foto de perfil con respaldo automático a iniciales.
 * Si `src` está vacío o la imagen falla al cargar, muestra las iniciales
 * en vez del icono de imagen rota.
 */
export function Avatar({
  src,
  fullName,
  className = "",
  imgClassName = "",
}: {
  src?: string | null;
  fullName: string;
  /** Clases de tamaño/forma; se aplican al contenedor y a la imagen. */
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = React.useState(false);
  const resolved = normalizeSrc(src);
  React.useEffect(() => setFailed(false), [resolved]);
  const showImg = !!resolved && !failed;

  if (showImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolved}
        alt={`Fotografía de ${fullName}`}
        onError={() => setFailed(true)}
        className={`object-cover ${className} ${imgClassName}`}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={`flex items-center justify-center bg-brand-100 font-bold text-brand-700 ${className}`}
    >
      {initialsOf(fullName)}
    </div>
  );
}
