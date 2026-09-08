"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Field, Input, Button, Alert } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo iniciar sesión.");
        setPending(false);
        return;
      }
      router.push(data.redirect || "/");
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 block text-center text-xl font-bold text-brand-700">
          EProfile
        </Link>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-slate-500">
            Paneles de estudiante y de administrador de plataforma.
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            {error ? <Alert kind="error">{error}</Alert> : null}
            <Field label="Correo" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="tucorreo@ejemplo.com"
              />
            </Field>
            <Field label="Contraseña" htmlFor="password">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </Field>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Entrando…" : "Iniciar sesión"}
            </Button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          ¿No tienes cuenta? El administrador de la plataforma crea las cuentas de estudiante.
        </p>
      </div>
    </main>
  );
}
