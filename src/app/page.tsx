import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { computeStatus, parseProfile } from "@/lib/profile";
import { LinkButton } from "@/components/ui";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";

type Card = { slug: string; fullName: string; headline: string; bio: string; photoUrl: string };

/** Cuadro decorativo tipo QR (no codifica nada; solo ilustra la EProfile). */
function MiniQR() {
  const cells = [
    0b1111111, 0b1000001, 0b1011101, 0b1011101, 0b1011101, 0b1000001, 0b1111111,
  ];
  return (
    <svg viewBox="0 0 7 7" className="h-12 w-12 rounded-md bg-white p-1 shadow-sm" aria-hidden>
      {cells.flatMap((row, y) =>
        Array.from({ length: 7 }, (_, x) =>
          row & (1 << (6 - x)) ? (
            <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#4338ca" />
          ) : null,
        ),
      )}
    </svg>
  );
}

/** Vista previa visual de una EProfile para el hero (estática, sin datos personales). */
function ProfilePreview() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-brand-100 bg-white p-5 shadow-xl shadow-brand-900/5">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-lg font-bold text-brand-700">
          EP
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">Tu nombre</p>
          <p className="truncate text-sm text-brand-700">Ingeniería · Tu universidad</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {["React", "TypeScript", "SQL", "UX", "Git"].map((s) => (
          <span
            key={s}
            className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-center text-xs font-medium text-white">
          Descargar CV
        </span>
        <span className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-center text-xs font-medium text-slate-700">
          Guardar contacto
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
        <MiniQR />
        <p className="text-xs text-slate-500">
          Un solo enlace con tu perfil, CV, proyectos y contacto.
        </p>
      </div>
    </div>
  );
}

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

      {/* Hero: dos columnas en escritorio, apiladas en celular */}
      <section className="relative overflow-hidden border-b border-brand-100 bg-brand-50">
        {/* Fondo suave y discreto */}
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

        <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 sm:py-14 lg:grid-cols-2 lg:gap-12">
          <div className="max-w-xl">
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

          <div className="flex justify-center lg:justify-end">
            <ProfilePreview />
          </div>
        </div>
      </section>

      {settings.allowPublicIndex ? (
        <section id="perfiles" className="mx-auto w-full max-w-6xl flex-1 scroll-mt-4 px-4 py-10">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">EProfiles publicadas</h2>
          {published.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Aún no hay EProfiles publicadas.
            </p>
          ) : (
            <ul className="mx-auto grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {published.map((p) => (
                <li key={p.slug} className="flex">
                  <Link
                    href={`/${p.slug}`}
                    aria-label={`Ver el perfil de ${p.fullName}`}
                    className="group flex w-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                  >
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />
                      Perfil publicado
                    </span>

                    <div className="mt-3 flex items-start gap-4">
                      <Avatar
                        src={p.photoUrl}
                        fullName={p.fullName}
                        className="h-20 w-20 flex-shrink-0 rounded-xl text-xl"
                        imgClassName="object-cover"
                      />
                      <div className="min-w-0 pt-1">
                        <p className="font-semibold text-slate-900">{p.fullName}</p>
                        <p className="mt-0.5 text-sm text-brand-700">{p.headline}</p>
                      </div>
                    </div>

                    {p.bio ? (
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">{p.bio}</p>
                    ) : null}

                    <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 transition group-hover:border-brand-300 group-hover:bg-brand-100">
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
