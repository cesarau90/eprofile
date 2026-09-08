import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-5xl font-bold text-brand-700">404</p>
      <h1 className="text-lg font-semibold text-slate-900">Esta EProfile no está disponible</h1>
      <p className="max-w-sm text-sm text-slate-500">
        La dirección no existe, el perfil aún no se ha publicado o la cuenta está desactivada.
      </p>
      <Link href="/" className="mt-2 text-sm font-medium text-brand-600 hover:underline">
        Ir al inicio
      </Link>
    </main>
  );
}
