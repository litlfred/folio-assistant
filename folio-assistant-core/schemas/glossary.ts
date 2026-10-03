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

import { PROV_CONTEXT } from "../../cat-harness/schemas/prov.ts";
import { STANDARD_PREFIXES } from "../../cat-harness/schemas/vocab-mapping-fhir.ts";
import { applyVocabMapping, contextBindings, vocabMapping, type VocabMapping } from "../../cat-harness/schemas/vocab-mapping.ts";
import { fileURLToPath } from "node:url";

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
    /**
     * Local ids of the terms this definition USES — what a reader must know
     * first (dcterms:requires). In an `ordered` glossary each must come
     * earlier; the scheme refuses one that does not.
     */
    requires: z.array(z.string().min(1)).optional(),
    /** The schema or standard that defines the term (rdfs:isDefinedBy). */
    isDefinedBy: Iri.optional(),
    /**
     * The concept's IRI when its defining vocabulary already mints one. The
     * glossary then DESCRIBES that concept — its labels, translations, order —
     * rather than minting a second IRI for the same term. Owner, 2026-09-30
     * (bean `xsqm`, "one SKOS", option A): bootstrap's terms are
     * `<bootstrap>/ns#Node`, not also `…ns#glossary/terms/node`.
     */
    iri: Iri.optional(),
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
    /**
     * The terms are in a LOGICAL order, each defined only by terms above it,
     * and a reader should meet them in that order — not alphabetically. The
     * owner, 2026-09-29, of bootstrap's terms: keep "logical rather than
     * alphabetical order". Published as a skos:OrderedCollection.
     */
    ordered: z.boolean().optional(),
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
    // `requires` names terms of THIS glossary; in an ordered one, earlier ones.
    const at = new Map(g.terms.map((t, i) => [t.id, i]));
    g.terms.forEach((t, i) => {
      (t.requires ?? []).forEach((ref, j) => {
        const k = at.get(ref);
        const why =
          k === undefined ? `"${ref}" is not a term in this glossary`
          : k === i ? `a term does not require itself`
          : g.ordered && k > i ? `"${ref}" comes after "${t.id}", and this glossary is ordered`
          : undefined;
        if (why) ctx.addIssue({ code: "custom", path: ["terms", i, "requires", j], message: why });
      });
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
 * One candidate's AUTOMATED matches, as `check:term-mapping` found them:
 * `exactMatch` where its label matched a concept's prefLabel, `closeMatch`
 * where only an altLabel or a cross-vocabulary display did. Every value is an
 * absolute IRI. Resolving `<scheme>:<id>` is the caller's job, and a value it
 * cannot resolve is left out rather than invented.
 */
export interface AutomatedMatch {
  term: string;
  exactMatch: string[];
  closeMatch: string[];
}

/**
 * The named graph a scheme's automated matches live in.
 *
 * `_` cannot begin a term id (`LOCAL_ID`), so this never collides with a
 * term's IRI, which is `<scheme>/<id>`.
 */
export function automatedGraphIri(ns: string, g: Pick<Glossary, "id">): string {
  return `${schemeIri(ns, g)}/_automated-matches`;
}

/** The blank node naming one run of the check: it has no release address. */
export const AUTOMATED_RUN = "_:term-mapping-run";

/**
 * The automated matches, kept apart from everything a person wrote, and
 * saying so in PROV. Owner, 2026-10-02: publish both `exactMatch` and
 * `closeMatch`, "each marked as AUTOMATED".
 *
 * **A named graph, not the default graph.** Every other triple in a scheme
 * document is in the default graph and is something a person decided. That
 * includes an authored term's `skos:exactMatch`. These are a label match.
 * In their own graph, the assertion and its provenance are one thing: a
 * triple is in that graph BECAUSE a program matched it. Rejected:
 *
 * - **RDF reification** (`rdf:Statement`) DESCRIBES a triple without
 *   asserting it, so the owner's "publish as `skos:exactMatch`" would not
 *   hold. Pairing it with the plain triple lets any reader that ignores the
 *   reification read an unmarked `exactMatch`, which is the one confusion
 *   the marker exists to prevent.
 * - **RDF-star / JSON-LD-star** annotation is not in JSON-LD 1.1.
 * - **`skos:note` on the concept** is a literal that no processor can join
 *   to the match it is about.
 *
 * **The marker is PROV, in PROV-JSONLD's shape** (rule
 * `ld-prov-in-prov-jsonld-shape`). The graph is an `Entity` with a qualified
 * `Generation` by an `Activity`. The activity's `Association` names the
 * agent as a `prov:SoftwareAgent`, and no person appears anywhere in the
 * chain.
 *
 * The activity is a blank node. A run of a check has no release address,
 * and minting one would be the invented address that
 * `ld-link-is-the-node-release-address` refuses. No timestamp is written,
 * so an unchanged result regenerates byte-identically.
 *
 * `agent` is the agent's release address, or `undefined` when it has none.
 * In that case the agent is a blank node that still carries its type. It is
 * never a string under a term that coerces to `@id`.
 */
function automatedNodes(
  graphIri: string,
  idOf: (termId: string) => string,
  matches: readonly AutomatedMatch[],
  agent: string | undefined,
): Record<string, unknown>[] {
  const link = (xs: Iterable<string>) => [...new Set(xs)].sort().map((x) => ({ "@id": x }));
  const inner = [...matches]
    .sort((a, b) => (a.term < b.term ? -1 : a.term > b.term ? 1 : 0))
    .map((m) => {
      const self = idOf(m.term);
      const exact = new Set(m.exactMatch.filter((x) => x !== self));
      // exactMatch is a sub-property of closeMatch in SKOS, so a concept
      // already stated exact is not restated as close.
      const close = m.closeMatch.filter((x) => x !== self && !exact.has(x));
      return {
        "@id": self,
        ...(exact.size ? { "skos:exactMatch": link(exact) } : {}),
        ...(close.length ? { "skos:closeMatch": link(close) } : {}),
      };
    })
    .filter((n) => Object.keys(n).length > 1);
  if (!inner.length) return [];
  return [
    {
      "@id": graphIri,
      "@type": "Entity",
      label: "Automated label matches from check:term-mapping. Not confirmed by a person.",
      "@graph": inner,
    },
    { "@type": "Generation", entity: graphIri, activity: AUTOMATED_RUN },
    {
      "@id": AUTOMATED_RUN,
      "@type": "Activity",
      label: "check:term-mapping: a normalised-label match against authorised vocabularies, run by a program",
    },
    {
      "@type": "Association",
      activity: AUTOMATED_RUN,
      agent: { ...(agent ? { "@id": agent } : {}), "@type": "prov:SoftwareAgent" },
    },
  ];
}

let licenceNaming: VocabMapping | undefined;

/**
 * A glossary's licence, by the `licence-naming` table row a library item's
 * licence uses too (finding D4, bean `gzkt`, owner 2026-10-03). The key is the
 * row's predicate written as a CURIE, because this document's context binds
 * prefixes rather than terms: `dcterms:license`, as before the table existed.
 */
export function licenceTerms(license: string | undefined): Record<string, unknown> {
  licenceNaming ??= vocabMapping(fileURLToPath(new URL("../../cat-harness", import.meta.url)), "licence-naming");
  const applied = applyVocabMapping(licenceNaming, { license });
  const curies = contextBindings([licenceNaming], {
    inContext: { dcterms: DCTERMS_NS },
    prefixes: STANDARD_PREFIXES,
    only: ["license"],
  });
  return Object.fromEntries(Object.entries(applied).map(([k, v]) => [curies[k] ?? k, v]));
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
export function toSkos(
  g: Glossary,
  ns: string,
  automated?: { matches: readonly AutomatedMatch[]; agent: string | undefined },
): Record<string, unknown> {
  const scheme = schemeIri(ns, g);
  // A term that names its own concept IRI is referred to by it, everywhere.
  const own = new Map(g.terms.filter((t) => t.iri).map((t) => [t.id, t.iri!]));
  const idOf = (termId: string) => own.get(termId) ?? termIri(ns, g, termId);
  const ref = (r: string) => ({ "@id": /^[a-z][a-z0-9+.-]*:\/\//i.test(r) ? r : idOf(r) });
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
      // The `licence-naming` row a library item's licence comes from too
      // (finding D4, bean `gzkt`): one row, so one predicate for both.
      ...licenceTerms(g.license),
    },
  ];
  for (const t of g.terms) {
    const node: Record<string, unknown> = {
      "@id": idOf(t.id),
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
    if (t.requires?.length) node["dcterms:requires"] = t.requires.map(ref);
    if (t.isDefinedBy) node["rdfs:isDefinedBy"] = { "@id": t.isDefinedBy };
    if (t.source) node["dcterms:source"] = t.source;
    if (t.status !== "authored") node["skos:note"] = t.reason ? `${t.status}: ${t.reason}` : t.status;
    graph.push(node);
  }
  if (g.ordered && g.terms.length) {
    // The order is part of what was said: a reader meets each term after the
    // terms its definition uses. SKOS states it with an OrderedCollection,
    // whose memberList is an RDF list — `@list` in JSON-LD.
    graph.push({
      "@id": `${scheme}#order`,
      "@type": "skos:OrderedCollection",
      "skos:prefLabel": `${g.title}, in order`,
      "skos:memberList": { "@list": g.terms.map((t) => ({ "@id": idOf(t.id) })) },
    });
  }
  if (g.members?.length) {
    graph.push({
      "@id": `${scheme}#members`,
      "@type": "skos:Collection",
      "skos:prefLabel": `${g.title}: external terms`,
      "skos:member": g.members.map((m) => ({ "@id": m })),
    });
  }
  const context = { skos: SKOS_NS, dcterms: DCTERMS_NS, rdfs: "http://www.w3.org/2000/01/rdf-schema#" };
  const prov = automated ? automatedNodes(automatedGraphIri(ns, g), idOf, automated.matches, automated.agent) : [];
  if (!prov.length) return { "@context": context, "@graph": graph };
  // PROV-JSONLD's context comes FIRST and ours after it, so our prefixes win
  // any clash. It is named by URL and never fetched here: a reader that
  // verifies serves the copy pinned by sha256 (`publish:verify`'s
  // localLoader). Every @id is absolute, so no @base is relied on; in a
  // remote context it would be ignored anyway (`ld-no-base-in-a-remote-context`).
  return {
    "@context": [PROV_CONTEXT, { ...context, prov: "http://www.w3.org/ns/prov#" }],
    "@graph": [...graph, ...prov],
  };
}
