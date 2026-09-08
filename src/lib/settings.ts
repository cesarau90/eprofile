import { prisma } from "./prisma";

export type PlatformSettings = {
  siteName: string;
  tagline: string;
  contactEmail: string;
  allowPublicIndex: boolean;
};

export const defaultSettings: PlatformSettings = {
  siteName: "EProfile",
  tagline: "Tarjeta de presentación digital",
  contactEmail: "",
  allowPublicIndex: true,
};

export async function getSettings(): Promise<PlatformSettings> {
  const rows = await prisma.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    siteName: map.siteName ?? defaultSettings.siteName,
    tagline: map.tagline ?? defaultSettings.tagline,
    contactEmail: map.contactEmail ?? defaultSettings.contactEmail,
    allowPublicIndex:
      map.allowPublicIndex != null
        ? map.allowPublicIndex === "true"
        : defaultSettings.allowPublicIndex,
  };
}

export async function saveSettings(s: PlatformSettings) {
  const entries: [string, string][] = [
    ["siteName", s.siteName],
    ["tagline", s.tagline],
    ["contactEmail", s.contactEmail],
    ["allowPublicIndex", String(s.allowPublicIndex)],
  ];
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } }),
    ),
  );
}

export function siteUrl(): string {
  // 1) Valor explícito. 2) Dominio de producción que Vercel inyecta solo
  // (VERCEL_PROJECT_PRODUCTION_URL, sin protocolo). 3) Fallback local.
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const raw = explicit || (vercel ? `https://${vercel}` : "http://localhost:3000");
  return raw.replace(/\/$/, "");
}
