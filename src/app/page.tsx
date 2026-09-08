import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { computeStatus, parseProfile } from "@/lib/profile";
import { LinkButton } from "@/components/ui";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";

type Card = { slug: string; fullName: string; headline: string; bio: string; photoUrl: string };

export default async function HomePage() {
  const settings = await getSettings();

  let published: Card[] = [];
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
        return {
          slug: r.slug,
          fullName: d.fullName,
          headline: d.headline,
          bio: d.bio,
          photoUrl: d.photoUrl,
        };
      });
  }

  const hasList = settings.allowPublicIndex && published.length > 0;

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
          <span className="text-lg font-bold text-brand-700">{settings.siteName}</span>
          <LinkButton href="/login" variant="secondary">
            Iniciar sesión
          </LinkButton>
        </div>
      </header>

      {/* Hero compacto */}
      <section className="border-b border-brand-100 bg-brand-50">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {settings.siteName}
            </h1>
            <p className="mt-3 text-base text-slate-700 sm:text-lg">{settings.tagline}</p>
            <p className="mt-2 text-sm text-slate-600">
              Tarjeta de presentación digital para estudiantes: perfil, CV en PDF, proyectos,
              contacto y código QR, siempre en el mismo enlace.
            </p>
            <div className="mt-6">
              <LinkButton href={hasList ? "#perfiles" : "/login"}>
                {hasList ? "Ver perfiles" : "Entrar"}
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {settings.allowPublicIndex ? (
        <section id="perfiles" className="mx-auto w-full max-w-5xl flex-1 scroll-mt-4 px-4 py-10">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">EProfiles publicadas</h2>
          {published.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Aún no hay EProfiles publicadas.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {published.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/${p.slug}`}
                    className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar
                        src={p.photoUrl}
                        fullName={p.fullName}
                        className="h-16 w-16 flex-shrink-0 rounded-xl text-lg"
                      />
                      <div className="min-w-0 pt-0.5">
                        <p className="font-semibold text-slate-900">{p.fullName}</p>
                        <p className="mt-0.5 text-sm text-brand-700">{p.headline}</p>
                      </div>
                    </div>
                    {p.bio ? (
                      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{p.bio}</p>
                    ) : null}
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 group-hover:gap-1.5">
                      Ver perfil
                      <span aria-hidden>→</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <div className="flex-1" />
      )}

      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-400">
        {settings.siteName} · Proyecto académico — Asignatura Nuevas Tecnologías
      </footer>
    </main>
  );
}
