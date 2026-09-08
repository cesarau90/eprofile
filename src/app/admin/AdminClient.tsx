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

function StatusBadge({ status }: { status: Student["status"] }) {
  if (status === "published") return <Badge tone="green">Publicado</Badge>;
  if (status === "draft") return <Badge tone="amber">Borrador</Badge>;
  return <Badge tone="slate">Vacío</Badge>;
}

function CreateSubmit() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Creando…" : "Crear cuenta"}</Button>;
}

export function AdminClient({ students }: { students: Student[] }) {
  const [createState, createAction] = useFormState(createStudentAction, {} as ActionState);
  const [slug, setSlug] = React.useState("");
  const [rowMsg, setRowMsg] = React.useState<Record<string, ActionState>>({});
  const [busy, setBusy] = React.useState<string | null>(null);

  function setMsg(id: string, s: ActionState) {
    setRowMsg((m) => ({ ...m, [id]: s }));
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-4 text-base font-semibold">Crear cuenta de estudiante</h2>
        <form action={createAction} className="grid gap-4 sm:grid-cols-3">
          <Field label="Correo" htmlFor="c-email">
            <Input id="c-email" name="email" type="email" required placeholder="estudiante@ejemplo.com" />
          </Field>
          <Field label="Contraseña inicial" htmlFor="c-pw" hint="Mín. 8, con letra y número.">
            <Input id="c-pw" name="password" type="text" required minLength={8} />
          </Field>
          <Field label="Slug (ruta pública)" htmlFor="c-slug" hint={slug ? `eprofile.com/${slug}` : "minúsculas y guiones"}>
            <Input
              id="c-slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => setSlug(normalizeSlug(e.target.value))}
              placeholder="juan-perez"
            />
          </Field>
          <div className="sm:col-span-3 flex items-center gap-3">
            <CreateSubmit />
            {createState.error ? <Alert kind="error">{createState.error}</Alert> : null}
            {createState.ok ? <Alert kind="success">{createState.message}</Alert> : null}
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold">Estudiantes</h2>
        {students.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no hay estudiantes. Crea la primera cuenta arriba.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2 pr-3">Slug / correo</th>
                  <th className="py-2 pr-3">Perfil</th>
                  <th className="py-2 pr-3">Cuenta</th>
                  <th className="py-2 pr-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <StudentRow key={s.id} s={s} busy={busy === s.id} setBusy={setBusy} msg={rowMsg[s.id]} setMsg={setMsg} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function StudentRow({
  s,
  busy,
  setBusy,
  msg,
  setMsg,
}: {
  s: Student;
  busy: boolean;
  setBusy: (v: string | null) => void;
  msg?: ActionState;
  setMsg: (id: string, s: ActionState) => void;
}) {
  const [open, setOpen] = React.useState<null | "reset" | "delete">(null);
  const [pw, setPw] = React.useState("");
  const [confirmSlug, setConfirmSlug] = React.useState("");

  async function wrap(fn: () => Promise<ActionState>) {
    setBusy(s.id);
    try {
      setMsg(s.id, await fn());
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <tr className="border-b border-slate-100 align-top">
        <td className="py-3 pr-3">
          <Link href={`/${s.slug}`} target="_blank" className="font-medium text-brand-600 hover:underline">
            /{s.slug}
          </Link>
          <div className="text-xs text-slate-500">{s.email}</div>
        </td>
        <td className="py-3 pr-3">
          <StatusBadge status={s.status} />
        </td>
        <td className="py-3 pr-3">
          {s.active ? <Badge tone="green">Activa</Badge> : <Badge tone="red">Inactiva</Badge>}
        </td>
        <td className="py-3 pr-3">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${s.slug}/admin`}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-50"
            >
              Entrar al panel
            </Link>
            <button
              disabled={busy}
              onClick={() => wrap(() => setActiveAction(s.userId, !s.active))}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              {s.active ? "Desactivar" : "Reactivar"}
            </button>
            <button
              disabled={busy}
              onClick={() => setOpen(open === "reset" ? null : "reset")}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-50"
            >
              Restablecer contraseña
            </button>
            <button
              disabled={busy}
              onClick={() => setOpen(open === "delete" ? null : "delete")}
              className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Eliminar
            </button>
          </div>

          {open === "reset" ? (
            <div className="mt-2 flex flex-wrap items-end gap-2 rounded-md bg-slate-50 p-2">
              <Field label="Nueva contraseña">
                <Input value={pw} onChange={(e) => setPw(e.target.value)} type="text" className="w-48" />
              </Field>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={async () => {
                  await wrap(() => resetPasswordAction(s.userId, pw));
                  setPw("");
                  setOpen(null);
                }}
              >
                Guardar
              </Button>
            </div>
          ) : null}

          {open === "delete" ? (
            <div className="mt-2 flex flex-wrap items-end gap-2 rounded-md bg-red-50 p-2">
              <Field label={`Escribe "${s.slug}" para confirmar`} error="Esta acción no se puede deshacer.">
                <Input value={confirmSlug} onChange={(e) => setConfirmSlug(e.target.value)} className="w-48" />
              </Field>
              <Button
                variant="danger"
                disabled={busy || confirmSlug !== s.slug}
                onClick={() => wrap(() => deleteStudentAction(s.id, confirmSlug))}
              >
                Eliminar definitivamente
              </Button>
            </div>
          ) : null}

          {msg?.error ? <p className="mt-2 text-xs text-red-600">{msg.error}</p> : null}
          {msg?.ok ? <p className="mt-2 text-xs text-green-600">{msg.message}</p> : null}
        </td>
      </tr>
    </>
  );
}
