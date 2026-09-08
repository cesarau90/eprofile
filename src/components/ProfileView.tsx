import * as React from "react";
import { ProfileData, visibleSections } from "@/lib/profile";
import { Badge } from "./ui";
import { Avatar } from "./Avatar";
import { ContactActions } from "./ContactActions";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20">
      <h2 id={`${id}-title`} className="text-lg font-semibold text-slate-900">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DateRange({ start, end }: { start: string; end: string }) {
  const t = [start, end].filter(Boolean).join(" – ");
  if (!t) return null;
  return <span className="text-sm text-slate-500">{t}</span>;
}

export function ProfileView({
  data,
  slug,
  publicUrl,
}: {
  data: ProfileData;
  slug: string;
  publicUrl: string;
}) {
  const vis = visibleSections(data);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      {/* Portada: foto, nombre, carrera, reseña */}
      <header className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
        <Avatar
          src={data.photoUrl}
          fullName={data.fullName}
          className="h-32 w-32 flex-shrink-0 rounded-2xl text-3xl shadow-md"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {data.fullName}
          </h1>
          {data.headline ? (
            <p className="mt-1 text-lg text-brand-700">{data.headline}</p>
          ) : null}
          {data.location ? (
            <p className="mt-1 text-sm text-slate-500">{data.location}</p>
          ) : null}
          {vis.bio ? (
            <p className="mt-3 whitespace-pre-line text-slate-600">{data.bio}</p>
          ) : null}
        </div>
      </header>

      <ContactActions slug={slug} publicUrl={publicUrl} fullName={data.fullName} contact={data.contact} />

      <div className="mt-12 space-y-12">
        {vis.experience ? (
          <Section id="experiencia" title="Experiencia">
            <ul className="space-y-5">
              {data.experience
                .filter((e) => e.organization || e.role)
                .map((e, i) => (
                  <li key={i} className="border-l-2 border-slate-200 pl-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="font-medium text-slate-900">
                        {e.role}
                        {e.organization ? (
                          <span className="text-slate-500"> · {e.organization}</span>
                        ) : null}
                      </p>
                      <DateRange start={e.start} end={e.end} />
                    </div>
                    {e.description ? (
                      <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
                        {e.description}
                      </p>
                    ) : null}
                  </li>
                ))}
            </ul>
          </Section>
        ) : null}

        {vis.education ? (
          <Section id="formacion" title="Formación académica">
            <ul className="space-y-5">
              {data.education
                .filter((e) => e.institution || e.degree)
                .map((e, i) => (
                  <li key={i} className="border-l-2 border-slate-200 pl-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="font-medium text-slate-900">
                        {e.degree}
                        {e.institution ? (
                          <span className="text-slate-500"> · {e.institution}</span>
                        ) : null}
                      </p>
                      <DateRange start={e.start} end={e.end} />
                    </div>
                    {e.description ? (
                      <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
                        {e.description}
                      </p>
                    ) : null}
                  </li>
                ))}
            </ul>
          </Section>
        ) : null}

        {vis.skills ? (
          <Section id="habilidades" title="Habilidades">
            <div className="space-y-4">
              {data.skills
                .filter((s) => s.category && s.items.length > 0)
                .map((g, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-slate-700">{g.category}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {g.items.map((it, j) => (
                        <span
                          key={j}
                          className="rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-700"
                        >
                          {it}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </Section>
        ) : null}

        {vis.projects ? (
          <Section id="proyectos" title="Proyectos">
            <ul className="grid gap-4 sm:grid-cols-2">
              {data.projects
                .filter((p) => p.name)
                .map((p, i) => (
                  <li key={i} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-slate-900">{p.name}</p>
                      {p.academic ? <Badge tone="indigo">Académico</Badge> : null}
                    </div>
                    {p.role ? (
                      <p className="mt-0.5 text-xs italic text-slate-500">{p.role}</p>
                    ) : null}
                    {p.description ? (
                      <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                        {p.description}
                      </p>
                    ) : null}
                    {p.tech ? (
                      <p className="mt-2 text-xs text-slate-500">Tecnologías: {p.tech}</p>
                    ) : null}
                    {p.url ? (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline"
                      >
                        Ver proyecto →
                      </a>
                    ) : null}
                  </li>
                ))}
            </ul>
          </Section>
        ) : null}

        {vis.awards ? (
          <Section id="reconocimientos" title="Reconocimientos">
            <ul className="space-y-4">
              {data.awards
                .filter((a) => a.title)
                .map((a, i) => (
                  <li key={i} className="border-l-2 border-slate-200 pl-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="font-medium text-slate-900">
                        {a.title}
                        {a.issuer ? (
                          <span className="text-slate-500"> · {a.issuer}</span>
                        ) : null}
                      </p>
                      {a.date ? (
                        <span className="text-sm text-slate-500">{a.date}</span>
                      ) : null}
                    </div>
                    {a.description ? (
                      <p className="mt-1 text-sm text-slate-600">{a.description}</p>
                    ) : null}
                  </li>
                ))}
            </ul>
          </Section>
        ) : null}

        {vis.contact ? (
          <Section id="contacto" title="Contacto">
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              {data.contact.email ? (
                <li>
                  <a className="text-brand-600 hover:underline" href={`mailto:${data.contact.email}`}>
                    {data.contact.email}
                  </a>
                </li>
              ) : null}
              {data.contact.phone ? (
                <li>
                  <a className="text-brand-600 hover:underline" href={`tel:${data.contact.phone}`}>
                    {data.contact.phone}
                  </a>
                </li>
              ) : null}
              {data.contact.linkedin ? (
                <li>
                  <a
                    className="text-brand-600 hover:underline"
                    href={data.contact.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn
                  </a>
                </li>
              ) : null}
              {data.contact.github ? (
                <li>
                  <a
                    className="text-brand-600 hover:underline"
                    href={data.contact.github}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                </li>
              ) : null}
              {data.contact.website ? (
                <li>
                  <a
                    className="text-brand-600 hover:underline"
                    href={data.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Sitio web
                  </a>
                </li>
              ) : null}
            </ul>
          </Section>
        ) : null}
      </div>

      <footer className="mt-16 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
        EProfile · {publicUrl}
      </footer>
    </div>
  );
}
