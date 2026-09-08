import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Link,
} from "@react-pdf/renderer";
import type { ProfileData } from "./profile";
import { visibleSections } from "./profile";
import { CV_TEMPLATES, type TemplateId } from "./cv-templates";

export { CV_TEMPLATES };

const palette: Record<TemplateId, { accent: string; heading: string; sidebar: string }> = {
  classic: { accent: "#1f2937", heading: "#111827", sidebar: "#f3f4f6" },
  modern: { accent: "#4f46e5", heading: "#312e81", sidebar: "#eef2ff" },
  compact: { accent: "#0f766e", heading: "#134e4a", sidebar: "#f0fdfa" },
};

function makeStyles(t: TemplateId) {
  const c = palette[t];
  const compact = t === "compact";
  return StyleSheet.create({
    page: {
      padding: compact ? 28 : 40,
      fontSize: compact ? 9.5 : 10.5,
      fontFamily: "Helvetica",
      color: "#1f2937",
      lineHeight: 1.4,
    },
    name: { fontSize: compact ? 20 : 24, fontFamily: "Helvetica-Bold", color: c.heading },
    headline: { fontSize: compact ? 11 : 13, color: c.accent, marginTop: 2 },
    contactRow: { marginTop: 6, fontSize: 9, color: "#4b5563" },
    section: { marginTop: compact ? 12 : 16 },
    sectionTitle: {
      fontSize: compact ? 11 : 12,
      fontFamily: "Helvetica-Bold",
      color: c.heading,
      textTransform: "uppercase",
      letterSpacing: 1,
      borderBottomWidth: 1,
      borderBottomColor: c.accent,
      paddingBottom: 2,
      marginBottom: 6,
    },
    item: { marginBottom: 6 },
    itemHeader: { flexDirection: "row", justifyContent: "space-between" },
    itemTitle: { fontFamily: "Helvetica-Bold" },
    itemSub: { color: "#4b5563", fontStyle: "italic" },
    dates: { color: "#6b7280", fontSize: 9 },
    tag: {
      backgroundColor: c.sidebar,
      color: c.heading,
      paddingVertical: 2,
      paddingHorizontal: 5,
      borderRadius: 3,
      marginRight: 4,
      marginBottom: 4,
      fontSize: 8.5,
    },
    tagRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 3 },
    bio: { marginTop: 8, color: "#374151" },
    academicBadge: { color: c.accent, fontSize: 8.5, fontFamily: "Helvetica-Bold" },
  });
}

function CvDocument({ data }: { data: ProfileData }) {
  const s = makeStyles(data.cvTemplate);
  const vis = visibleSections(data);
  const contactBits = [
    data.contact.email,
    data.contact.phone,
    data.location,
    data.contact.linkedin,
    data.contact.github,
    data.contact.website,
  ].filter(Boolean);

  return (
    <Document title={`CV — ${data.fullName}`} author={data.fullName}>
      <Page size="A4" style={s.page}>
        <View>
          <Text style={s.name}>{data.fullName || "Sin nombre"}</Text>
          {data.headline ? <Text style={s.headline}>{data.headline}</Text> : null}
          {contactBits.length > 0 ? (
            <Text style={s.contactRow}>{contactBits.join("  ·  ")}</Text>
          ) : null}
          {vis.bio ? <Text style={s.bio}>{data.bio}</Text> : null}
        </View>

        {vis.experience ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Experiencia</Text>
            {data.experience.map((e, i) => (
              <View key={i} style={s.item} wrap={false}>
                <View style={s.itemHeader}>
                  <Text style={s.itemTitle}>
                    {e.role}
                    {e.organization ? ` — ${e.organization}` : ""}
                  </Text>
                  <Text style={s.dates}>
                    {[e.start, e.end].filter(Boolean).join(" – ")}
                  </Text>
                </View>
                {e.description ? <Text>{e.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {vis.education ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Formación académica</Text>
            {data.education.map((e, i) => (
              <View key={i} style={s.item} wrap={false}>
                <View style={s.itemHeader}>
                  <Text style={s.itemTitle}>
                    {e.degree}
                    {e.institution ? ` — ${e.institution}` : ""}
                  </Text>
                  <Text style={s.dates}>
                    {[e.start, e.end].filter(Boolean).join(" – ")}
                  </Text>
                </View>
                {e.description ? <Text>{e.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {vis.projects ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Proyectos</Text>
            {data.projects.map((p, i) => (
              <View key={i} style={s.item} wrap={false}>
                <View style={s.itemHeader}>
                  <Text style={s.itemTitle}>{p.name}</Text>
                  {p.academic ? (
                    <Text style={s.academicBadge}>Académico</Text>
                  ) : null}
                </View>
                {p.role ? <Text style={s.itemSub}>{p.role}</Text> : null}
                {p.description ? <Text>{p.description}</Text> : null}
                {p.tech ? <Text style={s.dates}>Tecnologías: {p.tech}</Text> : null}
                {p.url ? <Link src={p.url}><Text style={s.dates}>{p.url}</Text></Link> : null}
              </View>
            ))}
          </View>
        ) : null}

        {vis.skills ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Habilidades</Text>
            {data.skills.map((g, i) => (
              <View key={i} style={s.item}>
                <Text style={s.itemTitle}>{g.category}</Text>
                <View style={s.tagRow}>
                  {g.items.map((it, j) => (
                    <Text key={j} style={s.tag}>
                      {it}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {vis.awards ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Reconocimientos</Text>
            {data.awards.map((a, i) => (
              <View key={i} style={s.item} wrap={false}>
                <View style={s.itemHeader}>
                  <Text style={s.itemTitle}>
                    {a.title}
                    {a.issuer ? ` — ${a.issuer}` : ""}
                  </Text>
                  <Text style={s.dates}>{a.date}</Text>
                </View>
                {a.description ? <Text>{a.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

export async function renderCvPdf(data: ProfileData): Promise<Buffer> {
  return renderToBuffer(<CvDocument data={data} />);
}
