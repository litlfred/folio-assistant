/**
 * `folio-glossary/v1`: a glossary as W3C SKOS. Core's `glossary` graph kind
 * (`cat-harness/schemas/glossary-graph-kind.ts` registers the name).
 *
 * Owner, 2026-09-23: *"put glossary into folio-assistant-core"*, *"it should be
 * part of general pracice w/ glossary/ page"*, and *"can glossary be
 * refefences to external skos schema?"*. Yes, three ways, all SKOS:
 *
 * | how | here |
 * |---|---|
 * | a local term linked to an external concept | `exactMatch` / `closeMatch` / `broadMatch` / `narrowMatch` on a {@link Term} |
 * | a glossary that lists external terms without copying them | `members`: external concept IRIs, emitted as a `skos:Collection` |
 * | a whole external scheme | the declaration's `remoteGraphs` entry with `graphKinds: ["glossary"]`: known about, not held |
 *
 * Bean `lqo9` settled the rest before this was written, and it is followed,
 * not re-decided:
 * - **SKOS is the model**, `notation` is the code, and version and provenance
 *   sit on the scheme as Dublin Core (`hasVersion`, `modified`, `source`).
 * - **Three states, not two**: `authored`, `candidate` (extracted, not yet
 *   curated), `could-not-extract` (visible, with its reason). A candidate is
 *   not a definition, and nobody reading the page should mistake one for it.
 * - **A term's IRI lives in the instance namespace**, never in the asset that
 *   first defined it: moving the asset must not move the term.
 * - **Reuse is by membership, never by copying a definition.**
 * - **Not named `GlossaryEntry`**, which is already taken twice.
 *
 * @module folio-assistant-core/schemas/glossary
 * @graphNode schema
 */
import { z } from "zod";

export const GLOSSARY_SCHEMA_ID = "folio-glossary/v1" as const;

export const SKOS_NS = "http://www.w3.org/2004/02/skos/core#" as const;
export const DCTERMS_NS = "http://purl.org/dc/terms/" as const;

/** The three states from bean `lqo9`. */
export const TERM_STATUSES = ["authored", "candidate", "could-not-extract"] as const;
export type TermStatus = (typeof TERM_STATUSES)[number];

/** A local id: the tail of a term's IRI. Lowercase, so an IRI never differs from another by case alone. */
const LOCAL_ID = /^[a-z0-9][a-z0-9._-]*$/;
/** An absolute IRI: an external concept, a source, a scheme. */
const Iri = z.string().regex(/^[a-z][a-z0-9+.-]*:\/\/\S+$/i, "an absolute IRI");

/**
 * Text in one language, or per language (BCP 47 keys). SKOS's multilingual
 * labels are why a plain string is not the only shape.
 */
export const LangTextSchema = z.union([
  z.string().min(1),
  z.record(z.string().regex(/^[a-z]{2,3}(-[A-Za-z0-9]+)*$/), z.string().min(1)).refine((r) => Object.keys(r).length > 0),
]);
export type LangText = z.infer<typeof LangTextSchema>;

export const TermSchema = z
  .object({
    id: z.string().regex(LOCAL_ID),
    prefLabel: LangTextSchema,
    altLabel: z.array(z.string().min(1)).optional(),
    definition: LangTextSchema.optional(),
    /** The code. SKOS's own word for it. */
    notation: z.string().min(1).optional(),
    scopeNote: z.string().min(1).optional(),
    /** Local term ids or absolute IRIs. */
    broader: z.array(z.string().min(1)).optional(),
    related: z.array(z.string().min(1)).optional(),
    exactMatch: z.array(Iri).optional(),
    closeMatch: z.array(Iri).optional(),
    broadMatch: z.array(Iri).optional(),
    narrowMatch: z.array(Iri).optional(),
    /** Where the term came from: a repository path (with #anchor) or an IRI. */
    source: z.string().min(1).optional(),
    status: z.enum(TERM_STATUSES),
    /** Required for `could-not-extract`: a person must be able to act on it. */
    reason: z.string().min(1).optional(),
  })
  .strict()
  .refine((t) => t.status !== "authored" || t.definition !== undefined, {
    message: "an authored term has a definition; without one it is a candidate",
    path: ["definition"],
  })
  .refine((t) => t.status !== "could-not-extract" || t.reason !== undefined, {
    message: "could-not-extract says why",
    path: ["reason"],
  });
export type Term = z.infer<typeof TermSchema>;

export const GlossarySchema = z
  .object({
    $schema: z.literal(GLOSSARY_SCHEMA_ID),
    /** The scheme's local id: the tail of its IRI. */
    id: z.string().regex(LOCAL_ID),
    title: z.string().min(1),
    description: z.string().min(1).optional(),
    /** dcterms:hasVersion. */
    hasVersion: z.string().min(1).optional(),
    /** dcterms:modified, a date. */
    modified: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
    /** dcterms:source: what the terms were drawn from. */
    source: z.string().min(1).optional(),
    /** The licence the terms are published under: an SPDX id or a URL. */
    license: z.string().min(1).optional(),
    terms: z.array(TermSchema).default([]),
    /** External concept IRIs this glossary lists without copying: a `skos:Collection`. */
    members: z.array(Iri).optional(),
  })
  .strict()
  .superRefine((g, ctx) => {
    const ids = new Set<string>();
    g.terms.forEach((t, i) => {
      if (ids.has(t.id)) ctx.addIssue({ code: "custom", path: ["terms", i, "id"], message: `term id "${t.id}" appears twice` });
      ids.add(t.id);
    });
    // A local reference must name a term here; anything else must be an IRI.
    g.terms.forEach((t, i) => {
      for (const field of ["broader", "related"] as const) {
        (t[field] ?? []).forEach((ref, j) => {
          if (!ids.has(ref) && !/^[a-z][a-z0-9+.-]*:\/\//i.test(ref)) {
            ctx.addIssue({
              code: "custom",
              path: ["terms", i, field, j],
              message: `"${ref}" is neither a term in this glossary nor an absolute IRI`,
            });
          }
        });
      }
    });
  });
export type Glossary = z.infer<typeof GlossarySchema>;

/** The IRI of a scheme, and of a term in it: `<ns>glossary/<scheme>` and `…/<term>`. */
export function schemeIri(ns: string, g: Pick<Glossary, "id">): string {
  return `${ns}glossary/${g.id}`;
}
export function termIri(ns: string, g: Pick<Glossary, "id">, termId: string): string {
  return `${schemeIri(ns, g)}/${termId}`;
}

function langValues(t: LangText): Array<{ "@value": string; "@language"?: string }> {
  return typeof t === "string"
    ? [{ "@value": t }]
    : Object.entries(t).map(([lang, v]) => ({ "@value": v, "@language": lang }));
}

/**
 * The glossary as SKOS JSON-LD. `ns` is the declaring instance's namespace,
 * so the IRIs follow the instance, not the file (bean `lqo9`).
 *
 * A candidate or could-not-extract term is emitted too, with its status as a
 * `skos:note` so a consumer reading only SKOS can still tell it is not a
 * curated definition. Leaving it out would make the graph claim fewer terms
 * than the page shows.
 */
export function toSkos(g: Glossary, ns: string): Record<string, unknown> {
  const scheme = schemeIri(ns, g);
  const ref = (r: string) => ({ "@id": /^[a-z][a-z0-9+.-]*:\/\//i.test(r) ? r : termIri(ns, g, r) });
  const iris = (xs?: string[]) => (xs && xs.length ? { value: xs.map((x) => ({ "@id": x })) } : undefined);
  const graph: Record<string, unknown>[] = [
    {
      "@id": scheme,
      "@type": "skos:ConceptScheme",
      "skos:prefLabel": g.title,
      ...(g.description ? { "skos:definition": g.description } : {}),
      ...(g.hasVersion ? { "dcterms:hasVersion": g.hasVersion } : {}),
      ...(g.modified ? { "dcterms:modified": g.modified } : {}),
      ...(g.source ? { "dcterms:source": g.source } : {}),
      ...(g.license ? { "dcterms:license": g.license } : {}),
    },
  ];
  for (const t of g.terms) {
    const node: Record<string, unknown> = {
      "@id": termIri(ns, g, t.id),
      "@type": "skos:Concept",
      "skos:inScheme": { "@id": scheme },
      "skos:prefLabel": langValues(t.prefLabel),
    };
    if (t.altLabel?.length) node["skos:altLabel"] = t.altLabel;
    if (t.definition) node["skos:definition"] = langValues(t.definition);
    if (t.notation) node["skos:notation"] = t.notation;
    if (t.scopeNote) node["skos:scopeNote"] = t.scopeNote;
    if (t.broader?.length) node["skos:broader"] = t.broader.map(ref);
    if (t.related?.length) node["skos:related"] = t.related.map(ref);
    for (const m of ["exactMatch", "closeMatch", "broadMatch", "narrowMatch"] as const) {
      const v = iris(t[m]);
      if (v) node[`skos:${m}`] = v.value;
    }
    if (t.source) node["dcterms:source"] = t.source;
    if (t.status !== "authored") node["skos:note"] = t.reason ? `${t.status}: ${t.reason}` : t.status;
    graph.push(node);
  }
  if (g.members?.length) {
    graph.push({
      "@id": `${scheme}#members`,
      "@type": "skos:Collection",
      "skos:prefLabel": `${g.title}: external terms`,
      "skos:member": g.members.map((m) => ({ "@id": m })),
    });
  }
  return { "@context": { skos: SKOS_NS, dcterms: DCTERMS_NS }, "@graph": graph };
}
