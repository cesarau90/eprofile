import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { computeStatus, parseProfile } from "@/lib/profile";
import { LinkButton } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSettings();

  let published: { slug: string; fullName: string; headline: string; photoUrl: string }[] = [];
  if (settings.allowPublicIndex) {
    const rows = await prisma.student.findMany({
      where: { user: { active: true }, NOT: { publishedData: null } },
      orderBy: { publishedAt: "desc" },
      take: 24,
    });
    published = rows
      .filter((r) => computeStatus(r) === "published" || r.publishedData)
      .map((r) => {
        const d = parseProfile(r.publishedData);
        return { slug: r.slug, fullName: d.fullName, headline: d.headline, photoUrl: d.photoUrl };
      });
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="text-lg font-bold text-brand-700">{settings.siteName}</span>
          <LinkButton href="/login" variant="secondary">
            Iniciar sesión
          </LinkButton>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {settings.siteName}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">{settings.tagline}</p>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          Tarjeta de presentación digital para estudiantes: perfil, CV en PDF, proyectos, contacto y
          código QR, siempre en el mismo enlace.
        </p>
      </section>

      {settings.allowPublicIndex ? (
        <section className="mx-auto max-w-5xl px-4 pb-20">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">EProfiles publicadas</h2>
          {published.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Aún no hay EProfiles publicadas.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {published.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/${p.slug}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
                  >
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photoUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 font-bold text-brand-700">
                        {p.fullName.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{p.fullName}</p>
                      <p className="truncate text-sm text-slate-500">{p.headline}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        Proyecto académico · Asignatura Nuevas Tecnologías
      </footer>
    </main>
  );
}
