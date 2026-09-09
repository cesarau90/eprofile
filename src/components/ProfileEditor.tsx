"use client";

import * as React from "react";
import Link from "next/link";
import { ProfileData, emptyProfile, publishBlockReason } from "@/lib/profile";
import { CV_TEMPLATES } from "@/lib/cv-templates";
import { Button, Field, Input, Textarea, Alert, Badge } from "./ui";
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

const SECTIONS = [
  { id: "portada", label: "Portada" },
  { id: "contacto", label: "Contacto" },
  { id: "experiencia", label: "Experiencia" },
  { id: "formacion", label: "Formación académica" },
  { id: "habilidades", label: "Habilidades" },
  { id: "proyectos", label: "Proyectos" },
  { id: "reconocimientos", label: "Reconocimientos" },
  { id: "cv", label: "Plantilla del CV" },
] as const;

function Spinner() {
  return (
    <svg className="anim-spinner h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="4" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function useArray<T>(value: T[], onChange: (v: T[]) => void, blank: T) {
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

function rowHasInfo(row: unknown): boolean {
  if (!row || typeof row !== "object") return false;
  return Object.values(row as Record<string, unknown>).some((v) => {
    if (typeof v === "string") return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "boolean") return false;
    return v != null;
  });
}

function RowShell({
  children,
  onRemove,
  onUp,
  onDown,
  title,
  index,
  total,
  highlight,
}: {
  children: React.ReactNode;
  onRemove: () => void;
  onUp: () => void;
  onDown: () => void;
  title: string;
  index: number;
  total: number;
  highlight?: boolean;
}) {
  const ctrl =
    "rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 transition duration-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent";
  return (
    <div
      className={`anim-row-in rounded-lg border border-slate-200 p-4 transition duration-200 hover:border-brand-200 ${
        highlight ? "ring-added" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onUp}
            disabled={index === 0}
            className={ctrl}
            title="Subir"
            aria-label={`Subir ${title}`}
          >
            ↑ Subir
          </button>
          <button
            type="button"
            onClick={onDown}
            disabled={index === total - 1}
            className={ctrl}
            title="Bajar"
            aria-label={`Bajar ${title}`}
          >
            ↓ Bajar
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 transition duration-200 hover:bg-red-50"
            title={`Eliminar ${title}`}
            aria-label={`Eliminar ${title}`}
          >
            Eliminar
          </button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Accordion({
  id,
  title,
  count,
  summary,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  count?: number;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="anim-in-up scroll-mt-28 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {typeof count === "number" ? <Badge tone="slate">{count}</Badge> : null}
        </span>
        <span
          aria-hidden
          className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>
      {!open && summary ? <p className="mt-1 text-sm text-slate-500">{summary}</p> : null}
      <div className={`acc-wrap ${open ? "open" : ""}`}>
        <div className="acc-inner">
          <div className="pt-4">{children}</div>
        </div>
      </div>
    </section>
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

  const [openIds, setOpenIds] = React.useState<Set<string>>(new Set(["portada"]));
  const [activeId, setActiveId] = React.useState<string>("portada");
  const [flash, setFlash] = React.useState<string | null>(null);

  function isOpen(id: string) {
    return openIds.has(id);
  }
  function toggle(id: string) {
    setOpenIds((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function expandAll() {
    setOpenIds(new Set(SECTIONS.map((s) => s.id)));
  }
  function collapseAll() {
    setOpenIds(new Set());
  }
  function goTo(id: string) {
    setOpenIds((s) => new Set(s).add(id));
    setActiveId(id);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  React.useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el != null,
    );
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: [0, 0.15, 0.5, 1] },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  React.useEffect(() => {
    if (!flash) return;
    const key = flash;
    const t = window.setTimeout(() => setFlash((c) => (c === key ? null : c)), 1300);
    return () => window.clearTimeout(t);
  }, [flash]);

  React.useEffect(() => {
    if (result?.ok && (pending === null)) {
      const t = window.setTimeout(() => setResult((r) => (r?.ok ? null : r)), 4000);
      return () => window.clearTimeout(t);
    }
  }, [result, pending]);

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

  const eduApi = useArray(data.education, (v) => patch({ education: v }), emptyProfile.education[0] ?? {
    institution: "", degree: "", start: "", end: "", description: "",
  });
  const expApi = useArray(data.experience, (v) => patch({ experience: v }), {
    organization: "", role: "", start: "", end: "", description: "",
  });
  const skillsApi = useArray(data.skills, (v) => patch({ skills: v }), { category: "", items: [] });
  const projectsApi = useArray(data.projects, (v) => patch({ projects: v }), {
    name: "", description: "", tech: "", role: "", url: "", academic: false,
  });
  const awardsApi = useArray(data.awards, (v) => patch({ awards: v }), {
    title: "", issuer: "", date: "", description: "",
  });

  function makeUX<T>(
    name: string,
    api: {
      add: () => void;
      remove: (i: number) => void;
      update: (i: number, patch: Partial<T>) => void;
      move: (i: number, dir: -1 | 1) => void;
    },
    rows: T[],
  ) {
    return {
      ...api,
      add: () => {
        api.add();
        setFlash(`${name}-${rows.length}`);
      },
      remove: (i: number) => {
        if (rowHasInfo(rows[i]) && !window.confirm("¿Eliminar este elemento? Se perderá la información escrita.")) {
          return;
        }
        api.remove(i);
      },
    };
  }

  const exp = makeUX("exp", expApi, data.experience);
  const edu = makeUX("edu", eduApi, data.education);
  const skills = makeUX("skills", skillsApi, data.skills);
  const projects = makeUX("projects", projectsApi, data.projects);
  const awards = makeUX("awards", awardsApi, data.awards);

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

  const publishDisabled = pending !== null || !!blockReason || dirty;
  const publishReason = blockReason
    ? `Para publicar: ${blockReason} (se requiere al menos nombre y carrera).`
    : dirty
      ? "Guarda el borrador antes de publicar."
      : null;

  const summary = {
    contacto: [data.contact.email, data.contact.phone, data.contact.linkedin, data.contact.github, data.contact.website].filter(Boolean).length,
  };

  return (
    <div className="anim-fade-in lg:grid lg:grid-cols-[190px_1fr] lg:gap-8">
      {/* Navegación por secciones — escritorio */}
      <nav className="anim-in-left sticky top-4 hidden h-fit self-start lg:block">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Secciones</p>
        <ul className="space-y-0.5">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => goTo(s.id)}
                className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm transition duration-200 ${
                  activeId === s.id
                    ? "bg-brand-50 font-medium text-brand-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2 px-3">
          <button type="button" onClick={expandAll} className="text-xs text-brand-600 hover:underline">
            Expandir todo
          </button>
          <span className="text-slate-300">·</span>
          <button type="button" onClick={collapseAll} className="text-xs text-brand-600 hover:underline">
            Contraer todo
          </button>
        </div>
      </nav>

      <div className="min-w-0 space-y-5">
        {/* Barra de estado + acciones (compacta) */}
        <div className="anim-in-up sticky top-0 z-20 rounded-xl border border-slate-200 bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Estado:</span>
              {status === "published" && !hasChanges ? (
                <Badge tone="green">Publicado</Badge>
              ) : status === "empty" ? (
                <Badge tone="slate">Vacío</Badge>
              ) : (
                <Badge tone="amber">Borrador sin publicar</Badge>
              )}
              {dirty ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Cambios sin guardar
                </span>
              ) : null}
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => run("draft")}
                disabled={pending !== null}
                className="px-3 py-1.5 text-xs transition duration-200"
              >
                {pending === "draft" ? <Spinner /> : null}
                {pending === "draft" ? "Guardando…" : "Guardar borrador"}
              </Button>
              <Link
                href={`/${slug}/preview`}
                target="_blank"
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 transition duration-200 hover:bg-slate-50"
              >
                Previsualizar
              </Link>
              <Button
                onClick={() => run("publish")}
                disabled={publishDisabled}
                title={publishReason ?? undefined}
                className="px-3 py-1.5 text-xs transition duration-200"
              >
                {pending === "publish" ? <Spinner /> : null}
                {pending === "publish" ? "Publicando…" : "Publicar"}
              </Button>
            </div>
          </div>
          {publishReason ? (
            <p className="mt-1.5 text-xs text-amber-700">{publishReason}</p>
          ) : null}
          {hasChanges && status !== "published" ? (
            <p className="mt-1.5 text-xs text-slate-500">
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
            <div className="anim-fade-in mt-2">
              <Alert kind={result.ok ? "success" : "error"}>{result.message}</Alert>
            </div>
          ) : null}
        </div>

        {/* Selector de sección — celular */}
        <div className="lg:hidden">
          <label htmlFor="goto-section" className="sr-only">
            Ir a sección
          </label>
          <select
            id="goto-section"
            value={activeId}
            onChange={(e) => goTo(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition duration-200 focus:border-brand-500"
          >
            {SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                Ir a sección: {s.label}
              </option>
            ))}
          </select>
          <div className="mt-2 flex gap-3">
            <button type="button" onClick={expandAll} className="text-xs text-brand-600 hover:underline">
              Expandir todo
            </button>
            <button type="button" onClick={collapseAll} className="text-xs text-brand-600 hover:underline">
              Contraer todo
            </button>
          </div>
        </div>

        {/* Portada */}
        <Accordion id="portada" title="Portada" open={isOpen("portada")} onToggle={() => toggle("portada")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre completo *" htmlFor="fullName">
              <Input id="fullName" value={data.fullName} onChange={(e) => patch({ fullName: e.target.value })} className="transition duration-200" />
            </Field>
            <Field label="Carrera o profesión *" htmlFor="headline">
              <Input id="headline" value={data.headline} onChange={(e) => patch({ headline: e.target.value })} className="transition duration-200" />
            </Field>
            <Field label="Ubicación" htmlFor="location">
              <Input id="location" value={data.location} onChange={(e) => patch({ location: e.target.value })} className="transition duration-200" />
            </Field>

            <div className="sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-slate-700">Fotografía</span>
              <div className="flex items-start gap-4 rounded-lg border border-slate-200 p-3">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
                  {data.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.photoUrl} alt="Vista previa de la foto" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">Sin foto</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <input
                    id="photo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadPhoto(f);
                    }}
                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 disabled:opacity-50"
                  />
                  <p className="mt-1 text-xs text-slate-500">JPG o PNG, hasta 4 MB.</p>
                  {uploading ? (
                    <p className="anim-fade-in mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-700">
                      <Spinner /> Subiendo…
                    </p>
                  ) : data.photoUrl ? (
                    <button type="button" className="mt-2 text-xs font-medium text-red-600 underline" onClick={removePhoto}>
                      Quitar foto
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <Field label="Reseña breve" htmlFor="bio" hint="2 o 3 líneas sobre quién eres.">
                <Textarea id="bio" value={data.bio} onChange={(e) => patch({ bio: e.target.value })} maxLength={600} />
              </Field>
            </div>
          </div>
        </Accordion>

        {/* Contacto */}
        <Accordion
          id="contacto"
          title="Contacto y enlaces"
          count={summary.contacto}
          summary="Correo, teléfono y enlaces a tus redes."
          open={isOpen("contacto")}
          onToggle={() => toggle("contacto")}
        >
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
        </Accordion>

        {/* Experiencia */}
        <Accordion
          id="experiencia"
          title="Experiencia"
          count={data.experience.length}
          summary={data.experience.length === 0 ? "Sin experiencia (se ocultará en público)." : `${data.experience.length} elemento(s).`}
          open={isOpen("experiencia")}
          onToggle={() => toggle("experiencia")}
        >
          <div className="mb-4 flex justify-end">
            <Button variant="secondary" onClick={exp.add} className="transition duration-200">+ Añadir</Button>
          </div>
          <div className="space-y-4">
            {data.experience.length === 0 ? (
              <p className="text-sm text-slate-500">Sin experiencia. Esta sección se ocultará en público.</p>
            ) : null}
            {data.experience.map((row, i) => (
              <RowShell
                key={i}
                title={`Experiencia ${i + 1}`}
                index={i}
                total={data.experience.length}
                highlight={flash === `exp-${i}`}
                onRemove={() => exp.remove(i)}
                onUp={() => exp.move(i, -1)}
                onDown={() => exp.move(i, 1)}
              >
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
        </Accordion>

        {/* Formación */}
        <Accordion
          id="formacion"
          title="Formación académica"
          count={data.education.length}
          summary={`${data.education.length} elemento(s).`}
          open={isOpen("formacion")}
          onToggle={() => toggle("formacion")}
        >
          <div className="mb-4 flex justify-end">
            <Button variant="secondary" onClick={edu.add} className="transition duration-200">+ Añadir</Button>
          </div>
          <div className="space-y-4">
            {data.education.map((row, i) => (
              <RowShell
                key={i}
                title={`Formación ${i + 1}`}
                index={i}
                total={data.education.length}
                highlight={flash === `edu-${i}`}
                onRemove={() => edu.remove(i)}
                onUp={() => edu.move(i, -1)}
                onDown={() => edu.move(i, 1)}
              >
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
        </Accordion>

        {/* Habilidades */}
        <Accordion
          id="habilidades"
          title="Habilidades por categoría"
          count={data.skills.length}
          summary={`${data.skills.length} categoría(s).`}
          open={isOpen("habilidades")}
          onToggle={() => toggle("habilidades")}
        >
          <div className="mb-4 flex justify-end">
            <Button variant="secondary" onClick={skills.add} className="transition duration-200">+ Añadir categoría</Button>
          </div>
          <div className="space-y-4">
            {data.skills.map((row, i) => (
              <RowShell
                key={i}
                title={`Categoría ${i + 1}`}
                index={i}
                total={data.skills.length}
                highlight={flash === `skills-${i}`}
                onRemove={() => skills.remove(i)}
                onUp={() => skills.move(i, -1)}
                onDown={() => skills.move(i, 1)}
              >
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
        </Accordion>

        {/* Proyectos */}
        <Accordion
          id="proyectos"
          title="Proyectos"
          count={data.projects.length}
          summary={`${data.projects.length} elemento(s).`}
          open={isOpen("proyectos")}
          onToggle={() => toggle("proyectos")}
        >
          <div className="mb-4 flex justify-end">
            <Button variant="secondary" onClick={projects.add} className="transition duration-200">+ Añadir</Button>
          </div>
          <div className="space-y-4">
            {data.projects.map((row, i) => (
              <RowShell
                key={i}
                title={`Proyecto ${i + 1}`}
                index={i}
                total={data.projects.length}
                highlight={flash === `projects-${i}`}
                onRemove={() => projects.remove(i)}
                onUp={() => projects.move(i, -1)}
                onDown={() => projects.move(i, 1)}
              >
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
        </Accordion>

        {/* Reconocimientos */}
        <Accordion
          id="reconocimientos"
          title="Reconocimientos"
          count={data.awards.length}
          summary={`${data.awards.length} elemento(s).`}
          open={isOpen("reconocimientos")}
          onToggle={() => toggle("reconocimientos")}
        >
          <div className="mb-4 flex justify-end">
            <Button variant="secondary" onClick={awards.add} className="transition duration-200">+ Añadir</Button>
          </div>
          <div className="space-y-4">
            {data.awards.map((row, i) => (
              <RowShell
                key={i}
                title={`Reconocimiento ${i + 1}`}
                index={i}
                total={data.awards.length}
                highlight={flash === `awards-${i}`}
                onRemove={() => awards.remove(i)}
                onUp={() => awards.move(i, -1)}
                onDown={() => awards.move(i, 1)}
              >
                <Field label="Título"><Input value={row.title} onChange={(e) => awards.update(i, { title: e.target.value })} /></Field>
                <Field label="Otorgado por"><Input value={row.issuer} onChange={(e) => awards.update(i, { issuer: e.target.value })} /></Field>
                <Field label="Fecha"><Input value={row.date} onChange={(e) => awards.update(i, { date: e.target.value })} /></Field>
                <div className="sm:col-span-2">
                  <Field label="Descripción"><Textarea value={row.description} onChange={(e) => awards.update(i, { description: e.target.value })} /></Field>
                </div>
              </RowShell>
            ))}
          </div>
        </Accordion>

        {/* Plantilla de CV */}
        <Accordion
          id="cv"
          title="Plantilla del CV en PDF"
          summary="El PDF se genera con tus datos publicados y la plantilla elegida."
          open={isOpen("cv")}
          onToggle={() => toggle("cv")}
        >
          <p className="mb-4 text-sm text-slate-500">
            El PDF se genera con tus datos publicados y la plantilla elegida.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {CV_TEMPLATES.map((t) => (
              <label
                key={t.id}
                className={`cursor-pointer rounded-lg border p-3 text-sm transition duration-200 ${
                  data.cvTemplate === t.id ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"
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
        </Accordion>

        <div className="flex flex-wrap justify-end gap-2 pb-16">
          <Button variant="secondary" onClick={() => run("draft")} disabled={pending !== null}>
            {pending === "draft" ? <Spinner /> : null}
            {pending === "draft" ? "Guardando…" : "Guardar borrador"}
          </Button>
          <Button onClick={() => run("publish")} disabled={publishDisabled} title={publishReason ?? undefined}>
            {pending === "publish" ? <Spinner /> : null}
            {pending === "publish" ? "Publicando…" : "Publicar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
