import * as React from "react";
import { ProfileData, visibleSections } from "@/lib/profile";
import { Badge } from "./ui";
import { Avatar } from "./Avatar";
import { ContactActions } from "./ContactActions";

/* --- Iconos (inline, sin dependencias) --- */
const I = "h-4 w-4 flex-shrink-0";
const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={I} aria-hidden>
    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={I} aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={I} aria-hidden>
    <path d="M6.5 4h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={I} aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4M11 10v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={I} aria-hidden>
    <path d="M9 19c-4 1.4-4-2.2-6-2.6m12 5.6v-3.9a3.4 3.4 0 0 0-1-2.6c3-.3 6-1.5 6-6.6a5 5 0 0 0-1.4-3.5 4.7 4.7 0 0 0-.1-3.5s-1.1-.3-3.6 1.3a12.4 12.4 0 0 0-6.6 0C6.7 1.1 5.6 1.4 5.6 1.4a4.7 4.7 0 0 0-.1 3.5A5 5 0 0 0 4 8.4c0 5 3 6.3 6 6.6a3.4 3.4 0 0 0-1 2.5V22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={I} aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9S14.5 18.5 12 21C9.5 18.5 8.5 15 8.5 12S9.5 5.5 12 3Z" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);
const ProjectIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 flex-shrink-0" aria-hidden>
    <path d="M4 7a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);
const AwardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 flex-shrink-0" aria-hidden>
    <circle cx="12" cy="9" r="5" stroke="currentColor" strokeWidth="1.8" />
    <path d="m8.5 13.5-1.5 7 5-3 5 3-1.5-7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const SKILL_TONES = [
  "bg-brand-50 text-brand-700",
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-800",
  "bg-sky-50 text-sky-700",
  "bg-rose-50 text-rose-700",
  "bg-violet-50 text-violet-700",
];

function Section({
  id,
  title,
  delay,
  children,
}: {
  id: string;
  title: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="anim-in-up scroll-mt-24"
      style={{ animationDelay: `${delay}ms` }}
    >
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
  return (
    <span className="whitespace-nowrap text-sm font-medium tabular-nums text-slate-500">{t}</span>
  );
}

function Timeline({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-6 border-l-2 border-slate-200 pl-6">{children}</ul>;
}

function TimelineItem({
  title,
  subtitle,
  start,
  end,
  description,
}: {
  title: string;
  subtitle?: string;
  start: string;
  end: string;
  description?: string;
}) {
  return (
    <li className="relative">
      <span
        aria-hidden
        className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-brand-400 shadow-sm"
      />
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <p className="font-medium text-slate-900">
          {title}
          {subtitle ? <span className="text-slate-500"> · {subtitle}</span> : null}
        </p>
        <DateRange start={start} end={end} />
      </div>
      {description ? (
        <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{description}</p>
      ) : null}
    </li>
  );
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

  const primarySkills = data.skills
    .filter((s) => s.items.length > 0)
    .flatMap((s) => s.items)
    .slice(0, 6);

  const navLinks = [
    vis.experience && { id: "experiencia", label: "Experiencia" },
    vis.education && { id: "formacion", label: "Formación" },
    vis.skills && { id: "habilidades", label: "Habilidades" },
    vis.projects && { id: "proyectos", label: "Proyectos" },
    vis.awards && { id: "reconocimientos", label: "Reconocimientos" },
    vis.contact && { id: "contacto", label: "Contacto" },
  ].filter(Boolean) as { id: string; label: string }[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      {/* Hero */}
      <header className="anim-in-up overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-brand-100 p-6 shadow-xl shadow-brand-900/5 sm:p-8">
        {/* Identidad: foto centrada junto a nombre / carrera / ubicación */}
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
          <Avatar
            src={data.photoUrl}
            fullName={data.fullName}
            className="h-32 w-32 flex-shrink-0 rounded-2xl text-3xl shadow-md ring-4 ring-white sm:h-36 sm:w-36"
          />
          <div className="min-w-0 flex-1">
            <h1 className="anim-in-up text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl" style={{ animationDelay: "80ms" }}>
              {data.fullName}
            </h1>
            {data.headline ? (
              <p className="anim-in-up mt-1 text-lg font-medium text-brand-700" style={{ animationDelay: "140ms" }}>
                {data.headline}
              </p>
            ) : null}
            {data.location ? (
              <p className="anim-in-up mt-1.5 inline-flex items-center gap-1.5 text-sm text-slate-500" style={{ animationDelay: "200ms" }}>
                <PinIcon /> {data.location}
              </p>
            ) : null}
          </div>
        </div>

        {vis.bio ? (
          <p className="anim-in-up mt-5 whitespace-pre-line text-slate-600" style={{ animationDelay: "260ms" }}>
            {data.bio}
          </p>
        ) : null}

        {primarySkills.length > 0 ? (
          <div className="anim-in-up mt-4 flex flex-wrap justify-center gap-1.5 sm:justify-start" style={{ animationDelay: "320ms" }}>
            {primarySkills.map((s, i) => (
              <span
                key={i}
                className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-100"
              >
                {s}
              </span>
            ))}
          </div>
        ) : null}

        <div className="anim-in-up" style={{ animationDelay: "380ms" }}>
          <ContactActions slug={slug} publicUrl={publicUrl} fullName={data.fullName} contact={data.contact} />
        </div>
      </header>

      {/* Navegación interna */}
      {navLinks.length > 0 ? (
        <nav
          aria-label="Secciones del perfil"
          className="no-print anim-in-up mt-6 flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white/80 p-2 backdrop-blur"
          style={{ animationDelay: "120ms" }}
        >
          {navLinks.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition duration-300 hover:bg-slate-100 hover:text-slate-900"
            >
              {l.label}
            </a>
          ))}
        </nav>
      ) : null}

      <div className="mt-12 space-y-12">
        {vis.experience ? (
          <Section id="experiencia" title="Experiencia" delay={0}>
            <Timeline>
              {data.experience
                .filter((e) => e.organization || e.role)
                .map((e, i) => (
                  <TimelineItem
                    key={i}
                    title={e.role}
                    subtitle={e.organization}
                    start={e.start}
                    end={e.end}
                    description={e.description}
                  />
                ))}
            </Timeline>
          </Section>
        ) : null}

        {vis.education ? (
          <Section id="formacion" title="Formación académica" delay={40}>
            <Timeline>
              {data.education
                .filter((e) => e.institution || e.degree)
                .map((e, i) => (
                  <TimelineItem
                    key={i}
                    title={e.degree}
                    subtitle={e.institution}
                    start={e.start}
                    end={e.end}
                    description={e.description}
                  />
                ))}
            </Timeline>
          </Section>
        ) : null}

        {vis.skills ? (
          <Section id="habilidades" title="Habilidades" delay={40}>
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
                          className={`rounded-md px-2.5 py-1 text-sm transition duration-300 ${SKILL_TONES[i % SKILL_TONES.length]}`}
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
          <Section id="proyectos" title="Proyectos" delay={40}>
            <ul className="grid gap-4 sm:grid-cols-2">
              {data.projects
                .filter((p) => p.name)
                .map((p, i) => (
                  <li
                    key={i}
                    className="group rounded-xl border border-slate-200 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2">
                        <span className="mt-0.5 text-brand-500">
                          <ProjectIcon />
                        </span>
                        <p className="font-medium text-slate-900">{p.name}</p>
                      </div>
                      {p.academic ? <Badge tone="indigo">Académico</Badge> : null}
                    </div>
                    {p.role ? <p className="mt-1 text-xs italic text-slate-500">{p.role}</p> : null}
                    {p.description ? (
                      <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{p.description}</p>
                    ) : null}
                    {p.tech ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.tech
                          .split(/[,·]/)
                          .map((t) => t.trim())
                          .filter(Boolean)
                          .map((t, j) => (
                            <span key={j} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              {t}
                            </span>
                          ))}
                      </div>
                    ) : null}
                    {p.url ? (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-sm font-medium text-brand-600 transition duration-300 hover:underline"
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
          <Section id="reconocimientos" title="Reconocimientos" delay={40}>
            <ul className="space-y-3">
              {data.awards
                .filter((a) => a.title)
                .map((a, i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded-xl border border-slate-200 p-4 transition duration-300 hover:border-brand-200"
                  >
                    <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                      <AwardIcon />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <p className="font-medium text-slate-900">
                          {a.title}
                          {a.issuer ? <span className="text-slate-500"> · {a.issuer}</span> : null}
                        </p>
                        {a.date ? <span className="text-sm text-slate-500">{a.date}</span> : null}
                      </div>
                      {a.description ? <p className="mt-1 text-sm text-slate-600">{a.description}</p> : null}
                    </div>
                  </li>
                ))}
            </ul>
          </Section>
        ) : null}

        {vis.contact ? (
          <Section id="contacto" title="Contacto" delay={40}>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <ul className="grid gap-3 text-sm sm:grid-cols-2">
                {data.contact.email ? (
                  <li>
                    <a className="inline-flex items-center gap-2 text-slate-700 transition duration-300 hover:text-brand-700" href={`mailto:${data.contact.email}`}>
                      <span className="text-brand-500"><MailIcon /></span>
                      {data.contact.email}
                    </a>
                  </li>
                ) : null}
                {data.contact.phone ? (
                  <li>
                    <a className="inline-flex items-center gap-2 text-slate-700 transition duration-300 hover:text-brand-700" href={`tel:${data.contact.phone}`}>
                      <span className="text-brand-500"><PhoneIcon /></span>
                      {data.contact.phone}
                    </a>
                  </li>
                ) : null}
                {data.contact.linkedin ? (
                  <li>
                    <a className="inline-flex items-center gap-2 text-slate-700 transition duration-300 hover:text-brand-700" href={data.contact.linkedin} target="_blank" rel="noopener noreferrer">
                      <span className="text-brand-500"><LinkedInIcon /></span>
                      LinkedIn
                    </a>
                  </li>
                ) : null}
                {data.contact.github ? (
                  <li>
                    <a className="inline-flex items-center gap-2 text-slate-700 transition duration-300 hover:text-brand-700" href={data.contact.github} target="_blank" rel="noopener noreferrer">
                      <span className="text-brand-500"><GitHubIcon /></span>
                      GitHub
                    </a>
                  </li>
                ) : null}
                {data.contact.website ? (
                  <li>
                    <a className="inline-flex items-center gap-2 text-slate-700 transition duration-300 hover:text-brand-700" href={data.contact.website} target="_blank" rel="noopener noreferrer">
                      <span className="text-brand-500"><GlobeIcon /></span>
                      Sitio web
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          </Section>
        ) : null}
      </div>

      <footer className="mt-16 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
        EProfile · {publicUrl}
      </footer>
    </div>
  );
}
