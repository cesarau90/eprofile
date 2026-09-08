import type { ProfileData } from "./profile";

export type TemplateId = ProfileData["cvTemplate"];

export const CV_TEMPLATES: { id: TemplateId; label: string; description: string }[] = [
  { id: "classic", label: "Clásica", description: "Sobria, en gris. Ideal para cualquier sector." },
  { id: "modern", label: "Moderna", description: "Acentos en índigo, títulos destacados." },
  { id: "compact", label: "Compacta", description: "Más densa, en verde. Cabe más en una página." },
];
