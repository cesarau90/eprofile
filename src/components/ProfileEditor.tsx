"use client";

import * as React from "react";
import Link from "next/link";
import { ProfileData, emptyProfile, publishBlockReason } from "@/lib/profile";
import { CV_TEMPLATES } from "@/lib/cv-templates";
import { Button, Field, Input, Textarea, Alert, Badge, Card } from "./ui";
import { Avatar } from "./Avatar";
import {
  saveDraftAction,
  publishAction,
  discardDraftAction,
  type SaveResult,
} from "@/app/[slug]/admin/actions";

type Props = {
  slug: string;
  initialData: ProfileData;
  initialHasChanges: boolean;
  initialStatus: "empty" | "draft" | "published";
};

function useArray<T>(
  value: T[],
  onChange: (v: T[]) => void,
  blank: T,
) {
  return {
    add: () => onChange([...value, structuredClone(blank)]),
    remove: (i: number) => onChange(value.filter((_, j) => j !== i)),
    update: (i: number, patch: Partial<T>) =>
      onChange(value.map((row, j) => (j === i ? { ...row, ...patch } : row))),
    move: (i: number, dir: -1 | 1) => {
      const j = i + dir;
      if (j < 0 || j >= value.length) return;
      const copy = [...value];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      onChange(copy);
    },
  };
}

function RowShell({
  children,
  onRemove,
  onUp,
  onDown,
  title,
}: {
  children: React.ReactNode;
  onRemove: () => void;
  onUp: () => void;
  onDown: () => void;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</span>
        <div className="flex gap-1">
          <button type="button" onClick={onUp} className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100" aria-label="Subir">
            ↑
          </button>
          <button type="button" onClick={onDown} className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100" aria-label="Bajar">
            ↓
          </button>
          <button type="button" onClick={onRemove} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">
            Eliminar
          </button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function ProfileEditor({ slug, initialData, initialHasChanges, initialStatus }: Props) {
  const [data, setData] = React.useState<ProfileData>(initialData);
  const [result, setResult] = React.useState<SaveResult | null>(null);
  const [pending, setPending] = React.useState<null | "draft" | "publish" | "discard">(null);
  const [dirty, setDirty] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(initialHasChanges);
  const [status, setStatus] = React.useState(initialStatus);
  const [uploading, setUploading] = React.useState(false);

  function patch(p: Partial<ProfileData>) {
    setData((d) => ({ ...d, ...p }));
    setDirty(true);
  }
  function patchContact(p: Partial<ProfileData["contact"]>) {
    setData((d) => ({ ...d, contact: { ...d.contact, ...p } }));
    setDirty(true);
  }

  const blockReason = publishBlockReason(data);

  async function run(kind: "draft" | "publish" | "discard") {
    setPending(kind);
    setResult(null);
    try {
      let r: SaveResult;
      if (kind === "draft") r = await saveDraftAction(slug, data);
      else if (kind === "publish") r = await publishAction(slug);
      else r = await discardDraftAction(slug);
      setResult(r);
      if (r.ok && kind === "draft") {
        setDirty(false);
        setHasChanges(true);
        setStatus("draft");
      }
      if (r.ok && kind === "publish") {
        setHasChanges(false);
        setStatus("published");
      }
      if (r.ok && kind === "discard") {
        window.location.reload();
      }
    } catch {
      setResult({ ok: false, message: "Ocurrió un error de red. Intenta de nuevo." });
    } finally {
      setPending(null);
    }
  }

  const edu = useArray(data.education, (v) => patch({ education: v }), emptyProfile.education[0] ?? {
    institution: "", degree: "", start: "", end: "", description: "",
  });
  const exp = useArray(data.experience, (v) => patch({ experience: v }), {
    organization: "", role: "", start: "", end: "", description: "",
  });
  const skills = useArray(data.skills, (v) => patch({ skills: v }), { category: "", items: [] });
  const projects = useArray(data.projects, (v) => patch({ projects: v }), {
    name: "", description: "", tech: "", role: "", url: "", academic: false,
  });
  const awards = useArray(data.awards, (v) => patch({ awards: v }), {
    title: "", issuer: "", date: "", description: "",
  });

  async function uploadPhoto(file: File) {
    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (data.photoUrl) fd.append("previous", data.photoUrl);
      const res = await fetch(`/api/p/${slug}/photo`, { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al subir la imagen");
      patch({ photoUrl: json.url });
      setResult({ ok: true, message: "Foto cargada. Recuerda guardar el borrador." });
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : "Error al subir la imagen" });
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto() {
    const url = data.photoUrl;
    patch({ photoUrl: "" });
    if (!url) return;
    try {
      await fetch(`/api/p/${slug}/photo`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    } catch {
      /* la referencia ya se quitó del borrador; el blob huérfano no es crítico */
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra de estado + acciones */}
      <Card className="sticky top-0 z-10">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Estado:</span>
            {status === "published" && !hasChanges ? (
              <Badge tone="green">Publicado</Badge>
            ) : status === "empty" ? (
              <Badge tone="slate">Vacío</Badge>
            ) : (
              <Badge tone="amber">Borrador sin publicar</Badge>
            )}
            {dirty ? <span className="text-xs text-amber-600">· cambios sin guardar</span> : null}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => run("draft")} disabled={pending !== null}>
              {pending === "draft" ? "Guardando…" : "Guardar borrador"}
            </Button>
            <Link
              href={`/${slug}/preview`}
              target="_blank"
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Previsualizar
            </Link>
            <Button
              onClick={() => run("publish")}
              disabled={pending !== null || !!blockReason || dirty}
              title={
                blockReason
                  ? blockReason
                  : dirty
                    ? "Guarda el borrador antes de publicar"
                    : undefined
              }
            >
              {pending === "publish" ? "Publicando…" : "Publicar"}
            </Button>
          </div>
        </div>
        {blockReason ? (
          <p className="mt-2 text-xs text-amber-700">
            Para publicar: {blockReason} (se requiere al menos nombre y carrera)
          </p>
        ) : dirty ? (
          <p className="mt-2 text-xs text-slate-500">Guarda el borrador para poder publicar.</p>
        ) : null}
        {hasChanges && status !== "published" ? (
          <p className="mt-2 text-xs text-slate-500">
            El contenido público anterior se mantiene visible mientras no publiques.{" "}
            <button
              type="button"
              className="text-red-600 underline"
              onClick={() => {
                if (confirm("¿Descartar el borrador y volver al contenido publicado?")) run("discard");
              }}
            >
              Descartar borrador
            </button>
          </p>
        ) : null}
        {result ? (
          <div className="mt-3">
            <Alert kind={result.ok ? "success" : "error"}>{result.message}</Alert>
          </div>
        ) : null}
      </Card>

      {/* Encabezado */}
      <Card>
        <h2 className="mb-4 text-base font-semibold">Portada</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre completo *" htmlFor="fullName">
            <Input id="fullName" value={data.fullName} onChange={(e) => patch({ fullName: e.target.value })} />
          </Field>
          <Field label="Carrera o profesión *" htmlFor="headline">
            <Input id="headline" value={data.headline} onChange={(e) => patch({ headline: e.target.value })} />
          </Field>
          <Field label="Ubicación" htmlFor="location">
            <Input id="location" value={data.location} onChange={(e) => patch({ location: e.target.value })} />
          </Field>
          <Field label="Foto" htmlFor="photo" hint="JPG o PNG, hasta 4 MB.">
            <input
              id="photo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadPhoto(f);
              }}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Reseña breve" htmlFor="bio" hint="2 o 3 líneas sobre quién eres.">
              <Textarea id="bio" value={data.bio} onChange={(e) => patch({ bio: e.target.value })} maxLength={600} />
            </Field>
          </div>
          {data.photoUrl ? (
            <div className="sm:col-span-2 flex items-center gap-3">
              <Avatar
                src={data.photoUrl}
                fullName={data.fullName || "?"}
                className="h-16 w-16 rounded-lg text-sm"
              />
              <button type="button" className="text-xs text-red-600 underline" onClick={removePhoto}>
                Quitar foto
              </button>
            </div>
          ) : null}
        </div>
      </Card>

      {/* Contacto */}
      <Card>
        <h2 className="mb-4 text-base font-semibold">Contacto y enlaces</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Correo" htmlFor="c-email">
            <Input id="c-email" type="email" value={data.contact.email} onChange={(e) => patchContact({ email: e.target.value })} />
          </Field>
          <Field label="Teléfono" htmlFor="c-phone">
            <Input id="c-phone" value={data.contact.phone} onChange={(e) => patchContact({ phone: e.target.value })} />
          </Field>
          <Field label="LinkedIn (URL)" htmlFor="c-in">
            <Input id="c-in" value={data.contact.linkedin} onChange={(e) => patchContact({ linkedin: e.target.value })} placeholder="https://linkedin.com/in/…" />
          </Field>
          <Field label="GitHub (URL)" htmlFor="c-gh">
            <Input id="c-gh" value={data.contact.github} onChange={(e) => patchContact({ github: e.target.value })} placeholder="https://github.com/…" />
          </Field>
          <Field label="Sitio web (URL)" htmlFor="c-web">
            <Input id="c-web" value={data.contact.website} onChange={(e) => patchContact({ website: e.target.value })} />
          </Field>
        </div>
      </Card>

      {/* Experiencia */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Experiencia</h2>
          <Button variant="secondary" onClick={exp.add}>+ Añadir</Button>
        </div>
        <div className="space-y-4">
          {data.experience.length === 0 ? (
            <p className="text-sm text-slate-500">Sin experiencia. Esta sección se ocultará en público.</p>
          ) : null}
          {data.experience.map((row, i) => (
            <RowShell key={i} title={`Experiencia ${i + 1}`} onRemove={() => exp.remove(i)} onUp={() => exp.move(i, -1)} onDown={() => exp.move(i, 1)}>
              <Field label="Puesto"><Input value={row.role} onChange={(e) => exp.update(i, { role: e.target.value })} /></Field>
              <Field label="Organización"><Input value={row.organization} onChange={(e) => exp.update(i, { organization: e.target.value })} /></Field>
              <Field label="Inicio"><Input value={row.start} onChange={(e) => exp.update(i, { start: e.target.value })} placeholder="2023" /></Field>
              <Field label="Fin"><Input value={row.end} onChange={(e) => exp.update(i, { end: e.target.value })} placeholder="Actual" /></Field>
              <div className="sm:col-span-2">
                <Field label="Descripción"><Textarea value={row.description} onChange={(e) => exp.update(i, { description: e.target.value })} /></Field>
              </div>
            </RowShell>
          ))}
        </div>
      </Card>

      {/* Formación */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Formación académica</h2>
          <Button variant="secondary" onClick={edu.add}>+ Añadir</Button>
        </div>
        <div className="space-y-4">
          {data.education.map((row, i) => (
            <RowShell key={i} title={`Formación ${i + 1}`} onRemove={() => edu.remove(i)} onUp={() => edu.move(i, -1)} onDown={() => edu.move(i, 1)}>
              <Field label="Título / grado"><Input value={row.degree} onChange={(e) => edu.update(i, { degree: e.target.value })} /></Field>
              <Field label="Institución"><Input value={row.institution} onChange={(e) => edu.update(i, { institution: e.target.value })} /></Field>
              <Field label="Inicio"><Input value={row.start} onChange={(e) => edu.update(i, { start: e.target.value })} /></Field>
              <Field label="Fin"><Input value={row.end} onChange={(e) => edu.update(i, { end: e.target.value })} /></Field>
              <div className="sm:col-span-2">
                <Field label="Descripción"><Textarea value={row.description} onChange={(e) => edu.update(i, { description: e.target.value })} /></Field>
              </div>
            </RowShell>
          ))}
        </div>
      </Card>

      {/* Habilidades */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Habilidades por categoría</h2>
          <Button variant="secondary" onClick={skills.add}>+ Añadir categoría</Button>
        </div>
        <div className="space-y-4">
          {data.skills.map((row, i) => (
            <RowShell key={i} title={`Categoría ${i + 1}`} onRemove={() => skills.remove(i)} onUp={() => skills.move(i, -1)} onDown={() => skills.move(i, 1)}>
              <Field label="Categoría"><Input value={row.category} onChange={(e) => skills.update(i, { category: e.target.value })} placeholder="Técnicas, Blandas, Idiomas…" /></Field>
              <Field label="Habilidades (separadas por coma)">
                <Input
                  value={row.items.join(", ")}
                  onChange={(e) => skills.update(i, { items: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                />
              </Field>
            </RowShell>
          ))}
        </div>
      </Card>

      {/* Proyectos */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Proyectos</h2>
          <Button variant="secondary" onClick={projects.add}>+ Añadir</Button>
        </div>
        <div className="space-y-4">
          {data.projects.map((row, i) => (
            <RowShell key={i} title={`Proyecto ${i + 1}`} onRemove={() => projects.remove(i)} onUp={() => projects.move(i, -1)} onDown={() => projects.move(i, 1)}>
              <Field label="Nombre"><Input value={row.name} onChange={(e) => projects.update(i, { name: e.target.value })} /></Field>
              <Field label="Tu rol"><Input value={row.role} onChange={(e) => projects.update(i, { role: e.target.value })} /></Field>
              <Field label="Tecnologías"><Input value={row.tech} onChange={(e) => projects.update(i, { tech: e.target.value })} /></Field>
              <Field label="Enlace (URL)"><Input value={row.url} onChange={(e) => projects.update(i, { url: e.target.value })} /></Field>
              <div className="sm:col-span-2">
                <Field label="Descripción"><Textarea value={row.description} onChange={(e) => projects.update(i, { description: e.target.value })} /></Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={row.academic} onChange={(e) => projects.update(i, { academic: e.target.checked })} />
                Es un proyecto académico
              </label>
            </RowShell>
          ))}
        </div>
      </Card>

      {/* Reconocimientos */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Reconocimientos</h2>
          <Button variant="secondary" onClick={awards.add}>+ Añadir</Button>
        </div>
        <div className="space-y-4">
          {data.awards.map((row, i) => (
            <RowShell key={i} title={`Reconocimiento ${i + 1}`} onRemove={() => awards.remove(i)} onUp={() => awards.move(i, -1)} onDown={() => awards.move(i, 1)}>
              <Field label="Título"><Input value={row.title} onChange={(e) => awards.update(i, { title: e.target.value })} /></Field>
              <Field label="Otorgado por"><Input value={row.issuer} onChange={(e) => awards.update(i, { issuer: e.target.value })} /></Field>
              <Field label="Fecha"><Input value={row.date} onChange={(e) => awards.update(i, { date: e.target.value })} /></Field>
              <div className="sm:col-span-2">
                <Field label="Descripción"><Textarea value={row.description} onChange={(e) => awards.update(i, { description: e.target.value })} /></Field>
              </div>
            </RowShell>
          ))}
        </div>
      </Card>

      {/* Plantilla de CV (punto extra) */}
      <Card>
        <h2 className="mb-2 text-base font-semibold">Plantilla del CV en PDF</h2>
        <p className="mb-4 text-sm text-slate-500">
          El PDF se genera con tus datos publicados y la plantilla elegida.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {CV_TEMPLATES.map((t) => (
            <label
              key={t.id}
              className={`cursor-pointer rounded-lg border p-3 text-sm ${
                data.cvTemplate === t.id ? "border-brand-500 bg-brand-50" : "border-slate-200"
              }`}
            >
              <input
                type="radio"
                name="cvTemplate"
                className="sr-only"
                checked={data.cvTemplate === t.id}
                onChange={() => patch({ cvTemplate: t.id })}
              />
              <span className="block font-medium text-slate-800">{t.label}</span>
              <span className="mt-1 block text-xs text-slate-500">{t.description}</span>
            </label>
          ))}
        </div>
      </Card>

      <div className="flex justify-end gap-2 pb-16">
        <Button variant="secondary" onClick={() => run("draft")} disabled={pending !== null}>
          {pending === "draft" ? "Guardando…" : "Guardar borrador"}
        </Button>
        <Button onClick={() => run("publish")} disabled={pending !== null || !!blockReason || dirty}>
          {pending === "publish" ? "Publicando…" : "Publicar"}
        </Button>
      </div>
    </div>
  );
}
