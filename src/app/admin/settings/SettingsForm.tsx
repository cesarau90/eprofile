"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Card, Field, Input, Button, Alert } from "@/components/ui";
import { saveSettingsAction, type ActionState } from "../actions";
import type { PlatformSettings } from "@/lib/settings";

function Save() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar ajustes"}</Button>;
}

export function SettingsForm({ settings }: { settings: PlatformSettings }) {
  const [state, action] = useFormState(saveSettingsAction, {} as ActionState);
  return (
    <Card>
      <form action={action} className="space-y-4">
        {state.error ? <Alert kind="error">{state.error}</Alert> : null}
        {state.ok ? <Alert kind="success">{state.message}</Alert> : null}
        <Field label="Nombre de la plataforma" htmlFor="siteName">
          <Input id="siteName" name="siteName" defaultValue={settings.siteName} required />
        </Field>
        <Field label="Lema / descripción corta" htmlFor="tagline">
          <Input id="tagline" name="tagline" defaultValue={settings.tagline} />
        </Field>
        <Field label="Correo de contacto de la plataforma" htmlFor="contactEmail">
          <Input id="contactEmail" name="contactEmail" type="email" defaultValue={settings.contactEmail} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="allowPublicIndex" defaultChecked={settings.allowPublicIndex} />
          Mostrar el directorio público de EProfiles en la portada
        </label>
        <Save />
      </form>
    </Card>
  );
}
