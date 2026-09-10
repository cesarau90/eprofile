"use client";

import * as React from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Card, Field, Input, Button, Alert, Badge } from "@/components/ui";
import { normalizeSlug } from "@/lib/profile";
import {
  createStudentAction,
  setActiveAction,
  deleteStudentAction,
  resetPasswordAction,
  type ActionState,
} from "./actions";

type Student = {
  id: string;
  userId: string;
  slug: string;
  email: string;
  active: boolean;
  status: "empty" | "draft" | "published";
  publishedAt: Date | null;
  updatedAt: Date;
};

/* --- Iconos simples (inline, sin dependencias) --- */
const iconCls = "h-4 w-4 flex-shrink-0";
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconCls} aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconCls} aria-hidden>
      <rect x="4" y="10" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconCls} aria-hidden>
      <path d="M9 15 15 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11 6.5 12.5 5a4 4 0 0 1 5.7 5.7L16.5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13 17.5 11.5 19a4 4 0 0 1-5.7-5.7L7.5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function EnterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconCls} aria-hidden>
      <path d="M10 17 15 12 10 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 12H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M21 4v16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconCls} aria-hidden>
      <rect x="7" y="5" width="3.5" height="14" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.5" y="5" width="3.5" height="14" rx="1" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconCls} aria-hidden>
      <circle cx="8" cy="15" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="m11 12 9-9m-3 0 3 3m-6 0 2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconCls} aria-hidden>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Spinner() {
  return (
    <svg className="anim-spinner h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="4" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

const iconBtn =
  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

function StatusBadge({ status }: { status: Student["status"] }) {
  if (status === "published") return <Badge tone="green">Publicado</Badge>;
  if (status === "draft") return <Badge tone="amber">Borrador</Badge>;
  return <Badge tone="slate">Vacío</Badge>;
}

function SummaryCard({
  label,
  value,
  delay,
}: {
  label: string;
  value: number;
  delay: number;
}) {
  return (
    <div
      className="anim-in-up rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function CreateSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {pending ? <Spinner /> : <MailIcon />}
      {pending ? "Creando…" : "Crear cuenta"}
    </Button>
  );
}

export function AdminClient({ students }: { students: Student[] }) {
  const [createState, createAction] = useFormState(createStudentAction, {} as ActionState);
  const [slug, setSlug] = React.useState("");
  const createFormRef = React.useRef<HTMLFormElement>(null);

  // Al crear con éxito: limpiar el formulario (sin tocar la sesión ni navegar).
  React.useEffect(() => {
    if (createState.ok) {
      createFormRef.current?.reset();
      setSlug("");
    }
  }, [createState]);
  const [rowMsg, setRowMsg] = React.useState<Record<string, ActionState>>({});
  const [busy, setBusy] = React.useState<string | null>(null);

  function setMsg(id: string, s: ActionState) {
    setRowMsg((m) => ({ ...m, [id]: s }));
  }

  const stats = {
    total: students.length,
    published: students.filter((s) => s.status === "published").length,
    draft: students.filter((s) => s.status === "draft").length,
    active: students.filter((s) => s.active).length,
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total de estudiantes" value={stats.total} delay={0} />
        <SummaryCard label="Perfiles publicados" value={stats.published} delay={60} />
        <SummaryCard label="Perfiles en borrador" value={stats.draft} delay={120} />
        <SummaryCard label="Cuentas activas" value={stats.active} delay={180} />
      </section>

      <Card className="anim-in-up border-brand-100" >
        <div className="mb-4 border-b border-slate-100 pb-3">
          <h2 className="text-lg font-semibold text-slate-900">Crear cuenta de estudiante</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Se genera el acceso y la ruta pública del perfil.
          </p>
        </div>
        <form ref={createFormRef} action={createAction} className="grid gap-4 sm:grid-cols-3">
          <Field label="Correo" htmlFor="c-email">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <MailIcon />
              </span>
              <Input id="c-email" name="email" type="email" required placeholder="estudiante@ejemplo.com" className="pl-9 transition duration-200" />
            </div>
          </Field>
          <Field label="Contraseña inicial" htmlFor="c-pw" hint="Mín. 8, con letra y número.">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <LockIcon />
              </span>
              <Input id="c-pw" name="password" type="text" required minLength={8} className="pl-9 transition duration-200" />
            </div>
          </Field>
          <Field label="Slug (ruta pública)" htmlFor="c-slug" hint={slug ? `eprofile.com/${slug}` : "minúsculas y guiones"}>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <LinkIcon />
              </span>
              <Input
                id="c-slug"
                name="slug"
                required
                value={slug}
                onChange={(e) => setSlug(normalizeSlug(e.target.value))}
                placeholder="juan-perez"
                className="pl-9 transition duration-200"
              />
            </div>
          </Field>
          <div className="sm:col-span-3 flex flex-wrap items-center gap-3">
            <CreateSubmit />
            {createState.error ? (
              <div className="anim-fade-in">
                <Alert kind="error">{createState.error}</Alert>
              </div>
            ) : null}
            {createState.ok ? (
              <div className="anim-fade-in">
                <Alert kind="success">{createState.message}</Alert>
              </div>
            ) : null}
          </div>
        </form>
      </Card>

      <Card className="anim-in-up">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Estudiantes</h2>
        {students.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no hay estudiantes. Crea la primera cuenta arriba.</p>
        ) : (
          <div>
            <div className="hidden border-b border-slate-200 pb-2 text-left text-xs uppercase tracking-wide text-slate-500 md:grid md:grid-cols-[1.4fr_0.8fr_0.8fr_2fr] md:gap-3">
              <span>Slug / correo</span>
              <span>Perfil</span>
              <span>Cuenta</span>
              <span>Acciones</span>
            </div>
            <div className="space-y-3 md:space-y-0">
              {students.map((s, i) => (
                <StudentRow
                  key={s.id}
                  s={s}
                  index={i}
                  busy={busy === s.id}
                  setBusy={setBusy}
                  msg={rowMsg[s.id]}
                  setMsg={setMsg}
                />
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function StudentRow({
  s,
  index,
  busy,
  setBusy,
  msg,
  setMsg,
}: {
  s: Student;
  index: number;
  busy: boolean;
  setBusy: (v: string | null) => void;
  msg?: ActionState;
  setMsg: (id: string, s: ActionState) => void;
}) {
  const [open, setOpen] = React.useState<null | "reset" | "delete">(null);
  const [pw, setPw] = React.useState("");
  const [confirmSlug, setConfirmSlug] = React.useState("");
  const [pendingBtn, setPendingBtn] = React.useState<string | null>(null);

  async function wrap(key: string, fn: () => Promise<ActionState>) {
    setBusy(s.id);
    setPendingBtn(key);
    try {
      setMsg(s.id, await fn());
    } finally {
      setBusy(null);
      setPendingBtn(null);
    }
  }

  return (
    <div
      className="anim-in-up rounded-xl border border-slate-200 p-4 transition duration-200 hover:border-brand-200 hover:shadow-md md:grid md:grid-cols-[1.4fr_0.8fr_0.8fr_2fr] md:items-start md:gap-3 md:rounded-none md:border-x-0 md:border-t-0 md:border-b md:border-slate-100 md:p-0 md:py-4 md:hover:translate-y-0 md:hover:border-slate-200 md:hover:bg-slate-50/60 md:hover:shadow-none"
      style={{ animationDelay: `${Math.min(index * 45, 300)}ms` }}
    >
      <div>
        <Link href={`/${s.slug}`} target="_blank" className="font-medium text-brand-600 transition duration-200 hover:underline">
          /{s.slug}
        </Link>
        <div className="text-xs text-slate-500">{s.email}</div>
      </div>

      <div className="mt-3 md:mt-0">
        <span className="text-xs font-medium uppercase text-slate-400 md:hidden">Perfil: </span>
        <StatusBadge status={s.status} />
      </div>

      <div className="mt-2 md:mt-0">
        <span className="text-xs font-medium uppercase text-slate-400 md:hidden">Cuenta: </span>
        {s.active ? <Badge tone="green">Activa</Badge> : <Badge tone="red">Inactiva</Badge>}
      </div>

      <div className="mt-3 md:mt-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/${s.slug}/admin`}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition duration-200 hover:bg-brand-700 hover:shadow-md"
          >
            <EnterIcon />
            Entrar al panel
          </Link>
          <button
            disabled={busy}
            onClick={() => wrap("active", () => setActiveAction(s.userId, !s.active))}
            className={`${iconBtn} border-slate-300 text-slate-600 hover:bg-slate-50`}
          >
            {pendingBtn === "active" ? <Spinner /> : <PauseIcon />}
            {s.active ? "Desactivar" : "Reactivar"}
          </button>
          <button
            disabled={busy}
            onClick={() => setOpen(open === "reset" ? null : "reset")}
            className={`${iconBtn} border-slate-300 text-slate-600 hover:bg-slate-50`}
          >
            <KeyIcon />
            Restablecer contraseña
          </button>
          <button
            disabled={busy}
            onClick={() => setOpen(open === "delete" ? null : "delete")}
            className={`${iconBtn} ml-auto border-red-300 text-red-600 hover:bg-red-50 md:ml-2`}
          >
            <TrashIcon />
            Eliminar
          </button>
        </div>

        {open === "reset" ? (
          <div className="anim-pop-in mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-3">
            <Field label="Nueva contraseña">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <LockIcon />
                </span>
                <Input value={pw} onChange={(e) => setPw(e.target.value)} type="text" className="w-48 pl-9" />
              </div>
            </Field>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={async () => {
                await wrap("reset", () => resetPasswordAction(s.userId, pw));
                setPw("");
                setOpen(null);
              }}
            >
              {pendingBtn === "reset" ? <Spinner /> : null}
              Guardar
            </Button>
          </div>
        ) : null}

        {open === "delete" ? (
          <div className="anim-pop-in mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <Field label={`Escribe "${s.slug}" para confirmar`} error="Esta acción no se puede deshacer.">
              <Input value={confirmSlug} onChange={(e) => setConfirmSlug(e.target.value)} className="w-48" />
            </Field>
            <Button
              variant="danger"
              disabled={busy || confirmSlug !== s.slug}
              onClick={() => wrap("delete", () => deleteStudentAction(s.id, confirmSlug))}
            >
              {pendingBtn === "delete" ? <Spinner /> : <TrashIcon />}
              Eliminar definitivamente
            </Button>
          </div>
        ) : null}

        {msg?.error ? <p className="anim-fade-in mt-2 text-xs text-red-600">{msg.error}</p> : null}
        {msg?.ok ? <p className="anim-fade-in mt-2 text-xs text-green-600">{msg.message}</p> : null}
      </div>
    </div>
  );
}
