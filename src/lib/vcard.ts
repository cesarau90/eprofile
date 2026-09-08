import type { ProfileData } from "./profile";

function esc(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildVCard(p: ProfileData, publicUrl: string): string {
  const parts = p.fullName.trim().split(/\s+/);
  const last = parts.length > 1 ? parts.slice(1).join(" ") : "";
  const first = parts[0] ?? "";
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(last)};${esc(first)};;;`,
    `FN:${esc(p.fullName)}`,
    p.headline ? `TITLE:${esc(p.headline)}` : "",
    p.contact.email ? `EMAIL;TYPE=INTERNET:${esc(p.contact.email)}` : "",
    p.contact.phone ? `TEL;TYPE=CELL:${esc(p.contact.phone)}` : "",
    p.contact.website ? `URL:${esc(p.contact.website)}` : "",
    p.contact.linkedin ? `X-SOCIALPROFILE;TYPE=linkedin:${esc(p.contact.linkedin)}` : "",
    p.contact.github ? `X-SOCIALPROFILE;TYPE=github:${esc(p.contact.github)}` : "",
    p.location ? `ADR;TYPE=WORK:;;${esc(p.location)};;;;` : "",
    `URL:${esc(publicUrl)}`,
    p.bio ? `NOTE:${esc(p.bio)}` : "",
    `REV:${new Date().toISOString()}`,
    "END:VCARD",
  ];
  return lines.filter(Boolean).join("\r\n");
}
