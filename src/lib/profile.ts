import { z } from "zod";

/** Estructura del contenido de un perfil (borrador o publicado). */
export const profileSchema = z.object({
  fullName: z.string().trim().max(120).default(""),
  headline: z.string().trim().max(120).default(""), // carrera o profesión
  bio: z.string().trim().max(600).default(""),
  photoUrl: z.string().trim().max(500).default(""),
  location: z.string().trim().max(120).default(""),
  contact: z
    .object({
      email: z.string().trim().max(160).default(""),
      phone: z.string().trim().max(40).default(""),
      linkedin: z.string().trim().max(300).default(""),
      github: z.string().trim().max(300).default(""),
      website: z.string().trim().max(300).default(""),
    })
    .default({}),
  education: z
    .array(
      z.object({
        institution: z.string().trim().max(160).default(""),
        degree: z.string().trim().max(160).default(""),
        start: z.string().trim().max(20).default(""),
        end: z.string().trim().max(20).default(""),
        description: z.string().trim().max(500).default(""),
      }),
    )
    .default([]),
  experience: z
    .array(
      z.object({
        organization: z.string().trim().max(160).default(""),
        role: z.string().trim().max(160).default(""),
        start: z.string().trim().max(20).default(""),
        end: z.string().trim().max(20).default(""),
        description: z.string().trim().max(600).default(""),
      }),
    )
    .default([]),
  skills: z
    .array(
      z.object({
        category: z.string().trim().max(80).default(""),
        items: z.array(z.string().trim().max(60)).default([]),
      }),
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string().trim().max(160).default(""),
        description: z.string().trim().max(800).default(""),
        tech: z.string().trim().max(240).default(""),
        role: z.string().trim().max(160).default(""),
        url: z.string().trim().max(300).default(""),
        academic: z.boolean().default(false),
      }),
    )
    .default([]),
  awards: z
    .array(
      z.object({
        title: z.string().trim().max(160).default(""),
        issuer: z.string().trim().max(160).default(""),
        date: z.string().trim().max(20).default(""),
        description: z.string().trim().max(400).default(""),
      }),
    )
    .default([]),
  cvTemplate: z.enum(["classic", "modern", "compact"]).default("classic"),
});

export type ProfileData = z.infer<typeof profileSchema>;

export const emptyProfile: ProfileData = profileSchema.parse({});

export function parseProfile(raw: string | null | undefined): ProfileData {
  if (!raw) return emptyProfile;
  try {
    return profileSchema.parse(JSON.parse(raw));
  } catch {
    return emptyProfile;
  }
}

export type ProfileStatus = "empty" | "draft" | "published";

export function hasMinimumContent(p: ProfileData): boolean {
  return p.fullName.trim().length > 0 && p.headline.trim().length > 0;
}

/** Motivo por el que no se puede publicar, o null si sí se puede. */
export function publishBlockReason(p: ProfileData): string | null {
  if (!p.fullName.trim()) return "Falta el nombre completo.";
  if (!p.headline.trim()) return "Falta la carrera o profesión.";
  return null;
}

export function computeStatus(student: {
  publishedData: string | null;
  draftData: string;
}): ProfileStatus {
  const draft = parseProfile(student.draftData);
  if (!student.publishedData) {
    return hasMinimumContent(draft) || JSON.stringify(draft) !== JSON.stringify(emptyProfile)
      ? "draft"
      : "empty";
  }
  const pub = parseProfile(student.publishedData);
  return JSON.stringify(draft) === JSON.stringify(pub) ? "published" : "draft";
}

export function hasUnpublishedChanges(student: {
  publishedData: string | null;
  draftData: string;
}): boolean {
  const draft = JSON.stringify(parseProfile(student.draftData));
  const pub = student.publishedData
    ? JSON.stringify(parseProfile(student.publishedData))
    : null;
  return draft !== pub;
}

/** Slug: minúsculas, números y guiones. Único y permanente. */
export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quitar acentos/diacríticos
    .replace(/[^a-z0-9]+/g, "-") // espacios y símbolos -> guion
    .replace(/-+/g, "-") // sin guiones duplicados
    .replace(/^-+|-+$/g, "") // sin guiones iniciales ni finales
    .slice(0, 40)
    .replace(/-+$/g, ""); // el corte a 40 no debe dejar un guion final
}

/**
 * Igual que `normalizeSlug`, pero para escribir en vivo en el input: conserva
 * un único guion final para poder teclear "juan-" y luego "perez". Al enviar,
 * el servidor vuelve a pasar el valor por `normalizeSlug` (estricto).
 */
export function normalizeSlugInput(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]+/g, "-") // caracteres no permitidos -> guion
    .replace(/-+/g, "-") // sin guiones duplicados
    .replace(/^-+/, "") // sin guiones iniciales (el final sí se permite al teclear)
    .slice(0, 40);
}

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "logout",
  "_next",
  "favicon.ico",
  "public",
  "assets",
]);

export function slugIssue(slug: string): string | null {
  if (slug.length < 3) return "El slug debe tener al menos 3 caracteres.";
  if (!/^[a-z0-9-]+$/.test(slug))
    return "Solo se permiten minúsculas, números y guiones.";
  if (RESERVED_SLUGS.has(slug)) return "Ese slug está reservado por el sistema.";
  return null;
}

/** Secciones visibles: una sección vacía nunca se muestra en público. */
export function visibleSections(p: ProfileData) {
  return {
    bio: p.bio.trim().length > 0,
    education: p.education.some((e) => e.institution || e.degree),
    experience: p.experience.some((e) => e.organization || e.role),
    skills: p.skills.some((s) => s.category && s.items.length > 0),
    projects: p.projects.some((pr) => pr.name),
    awards: p.awards.some((a) => a.title),
    contact:
      !!p.contact.email ||
      !!p.contact.phone ||
      !!p.contact.linkedin ||
      !!p.contact.github ||
      !!p.contact.website,
  };
}
