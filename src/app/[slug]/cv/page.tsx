import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicProfile } from "@/lib/students";
import { visibleSections } from "@/lib/profile";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function CvPage({ params }: { params: { slug: string } }) {
  const profile = await getPublicProfile(params.slug);
  if (!profile) notFound();
  const d = profile.data;
  const vis = visibleSections(d);
  const contactBits = [
    d.contact.email,
    d.contact.phone,
    d.location,
    d.contact.linkedin,
    d.contact.github,
    d.contact.website,
  ].filter(Boolean);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="no-print mb-6 flex flex-wrap items-center gap-2">
        <Link href={`/${params.slug}`} className="text-sm text-brand-600 hover:underline">
          ← Volver a la EProfile
        </Link>
        <span className="text-slate-300">|</span>
        <a
          href={`/api/p/${params.slug}/cv`}
          target="_blank"
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Descargar PDF
        </a>
        <PrintButton />
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <header className="border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-bold text-slate-900">{d.fullName}</h1>
          <p className="text-lg text-brand-700">{d.headline}</p>
          {contactBits.length > 0 ? (
            <p className="mt-2 text-sm text-slate-500">{contactBits.join("  ·  ")}</p>
          ) : null}
        </header>

        {vis.bio ? <p className="mt-4 whitespace-pre-line text-slate-700">{d.bio}</p> : null}

        {vis.experience ? (
          <CvSection title="Experiencia">
            {d.experience
              .filter((e) => e.organization || e.role)
              .map((e, i) => (
                <div key={i} className="mb-3">
                  <div className="flex justify-between">
                    <p className="font-semibold">
                      {e.role}
                      {e.organization ? ` — ${e.organization}` : ""}
                    </p>
                    <span className="text-sm text-slate-500">
                      {[e.start, e.end].filter(Boolean).join(" – ")}
                    </span>
                  </div>
                  {e.description ? (
                    <p className="text-sm text-slate-600 whitespace-pre-line">{e.description}</p>
                  ) : null}
                </div>
              ))}
          </CvSection>
        ) : null}

        {vis.education ? (
          <CvSection title="Formación académica">
            {d.education
              .filter((e) => e.institution || e.degree)
              .map((e, i) => (
                <div key={i} className="mb-3">
                  <div className="flex justify-between">
                    <p className="font-semibold">
                      {e.degree}
                      {e.institution ? ` — ${e.institution}` : ""}
                    </p>
                    <span className="text-sm text-slate-500">
                      {[e.start, e.end].filter(Boolean).join(" – ")}
                    </span>
                  </div>
                  {e.description ? (
                    <p className="text-sm text-slate-600 whitespace-pre-line">{e.description}</p>
                  ) : null}
                </div>
              ))}
          </CvSection>
        ) : null}

        {vis.projects ? (
          <CvSection title="Proyectos">
            {d.projects
              .filter((p) => p.name)
              .map((p, i) => (
                <div key={i} className="mb-3">
                  <p className="font-semibold">
                    {p.name}
                    {p.academic ? (
                      <span className="ml-2 rounded bg-brand-100 px-1.5 py-0.5 text-xs text-brand-700">
                        Académico
                      </span>
                    ) : null}
                  </p>
                  {p.description ? (
                    <p className="text-sm text-slate-600 whitespace-pre-line">{p.description}</p>
                  ) : null}
                  {p.tech ? <p className="text-xs text-slate-500">Tecnologías: {p.tech}</p> : null}
                </div>
              ))}
          </CvSection>
        ) : null}

        {vis.skills ? (
          <CvSection title="Habilidades">
            {d.skills
              .filter((s) => s.category && s.items.length)
              .map((g, i) => (
                <p key={i} className="mb-1 text-sm">
                  <span className="font-semibold">{g.category}:</span> {g.items.join(", ")}
                </p>
              ))}
          </CvSection>
        ) : null}

        {vis.awards ? (
          <CvSection title="Reconocimientos">
            {d.awards
              .filter((a) => a.title)
              .map((a, i) => (
                <div key={i} className="mb-2">
                  <p className="font-semibold">
                    {a.title}
                    {a.issuer ? ` — ${a.issuer}` : ""}{" "}
                    <span className="font-normal text-slate-500">{a.date}</span>
                  </p>
                  {a.description ? <p className="text-sm text-slate-600">{a.description}</p> : null}
                </div>
              ))}
          </CvSection>
        ) : null}
      </article>
    </main>
  );
}

function CvSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 border-b border-slate-200 pb-1 text-sm font-bold uppercase tracking-wide text-slate-700">
        {title}
      </h2>
      {children}
    </section>
  );
}
