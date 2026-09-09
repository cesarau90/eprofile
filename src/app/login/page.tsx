"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Field, Input, Button, Alert } from "@/components/ui";

const BENEFITS = [
  "Perfil profesional siempre actualizado.",
  "CV y contacto en un solo enlace.",
  "Publicación segura administrada por el estudiante.",
];

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

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
    <main className="relative min-h-screen overflow-hidden bg-brand-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-brand-100"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-brand-300/30 blur-3xl"
      />

      <div className="relative mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:gap-12">
        {/* Columna informativa: segunda en celular, primera en escritorio */}
        <section className="order-2 max-w-xl lg:order-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-brand-700 hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            <span aria-hidden>←</span> Volver a perfiles
          </Link>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            EProfile
          </h1>
          <p className="mt-3 text-sm text-slate-700 sm:text-base">
            Tu tarjeta de presentación digital: perfil, CV y contacto en un mismo enlace.
          </p>

          <ul className="mt-6 hidden space-y-3 sm:block">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-slate-700">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700"
                >
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>
        </section>

        {/* Columna del formulario: primera en celular */}
        <section className="order-1 w-full justify-self-center lg:order-2 lg:justify-self-end">
          <div className="w-full max-w-sm rounded-2xl border border-brand-100 bg-white p-6 shadow-xl shadow-brand-900/5 sm:p-7">
            <h2 className="text-lg font-semibold text-slate-900">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-slate-500">
              Paneles de estudiante y de administrador de plataforma.
            </p>

            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              {error ? (
                <div aria-live="assertive">
                  <Alert kind="error">{error}</Alert>
                </div>
              ) : null}

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
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-3 text-xs font-medium text-brand-700 hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </Field>

              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Iniciando sesión…" : "Iniciar sesión"}
              </Button>
            </form>

            <p className="mt-4 text-xs text-slate-400">
              ¿No tienes cuenta? El administrador de la plataforma crea las cuentas de estudiante.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
