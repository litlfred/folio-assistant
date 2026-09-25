/**
 * The artefact index of a published FHIR Implementation Guide.
 *
 * @module schemas/fhir-artifact-index
 * @graphNode schema
 *
 * ## What this models, and why it is not `catalogue`
 *
 * A published IG is a remote corpus modelled by reference — which is
 * {@link module:schemas/catalogue} word for word, and the two share
 * {@link MaterializationSchema} for exactly that reason. What they do not
 * share is a SHAPE. A catalogue node is a container or an item with a
 * `flavour`; a FHIR artefact is a `resourceType` at a CANONICAL URL, published
 * simultaneously in several representations, in a versioned package, against a
 * FHIR version. None of those five facts has anywhere to live on a
 * `CatalogueNode`, and a `flavour: "fhir"` that smuggled them into free text
 * would be a catalogue that cannot answer the only questions anybody asks of
 * an IG.
 *
 * So: different code, not different rules — the test AGENTS.md sets for adding
 * a content type, applied one level down to a graph kind.
 *
 * ## The index is RECONSTRUCTED, never downloaded
 *
 * This is the finding that shaped the module, measured 2026-09-21 against the
 * `gh-pages` branch of `WorldHealthOrganization/smart-trust` (342,656 files;
 * IG v1.8.0; FHIR 5.0.0):
 *
 * > **No IG publishes an artefact-index instance document.**
 *
 * `ValueSets.schema.json` and `LogicalModels.schema.json` sit at the published
 * ROOT — not under `schemas/`, contrary to how `dak-api.html` links them — and
 * both are JSON *Schemas* describing the shape of an enumeration response.
 * Each carries an `example` block that happens to hold the real list. There is
 * no `ValueSets.json`. An ingest that went looking for the index would find a
 * description of one.
 *
 * Hence {@link IndexProvenanceSchema}, and hence its being REQUIRED: every
 * field in this graph was assembled from some file, and a reader who cannot
 * tell which cannot tell a transcription from an inference.
 *
 * ## Two layers, and only one of them is universal
 *
 * | layer | supplies | present in |
 * |---|---|---|
 * | IG-publisher standard | `package/.index.json`, `canonicals.json`, `artifacts.html`, `package.manifest.json` | **every** IG |
 * | DAK API | `.schema.json`, `.displays.json`, `.openapi.json`, `.jsonld` per artefact, plus JSON-LD contexts | only IGs that publish one |
 *
 * The standard layer is the SPINE and the DAK API is an {@link DakOverlaySchema |
 * overlay}. That ordering is what keeps the type valid for an IG with no DAK
 * API — the overlay is simply absent — and it is why `dak` is optional on an
 * artefact rather than the artefact being optional on a DAK entry.
 *
 * ## Two traps, recorded so no pipeline re-learns them
 *
 * **`openapi/openapi.json` is not the DAK API.** In smart-trust that path
 * holds the *DDCC Gateway* API — a domain API about certificate exchange that
 * merely lives there. A pipeline globbing for `openapi` will file a subject-
 * matter API as an artefact descriptor. {@link DakOverlaySchema.openapi} is
 * therefore keyed off the ARTEFACT's name, never off a directory scan.
 *
 * **`.index.json` is lossy.** Its Organization entries in smart-trust carry a
 * truncated `"type": "["`. `canonicals.json` gives `id`/`type`/`url`/`version`/
 * `name` and is the better spine for anything canonical; `.index.json` is the
 * better spine for the rest, because it is the only file listing artefacts
 * that have no canonical URL at all. Neither is sufficient alone, which is why
 * {@link IndexProvenanceSchema} records both rather than naming a winner.
 *
 * ## Counts
 *
 * {@link FhirArtifactIndexSchema} carries a `count`, and it is checked against
 * `artifacts.length` by a refinement rather than trusted. This is not the
 * "never quote a count from prose" rule being broken — that rule is about
 * PROSE, where a number is a claim nothing re-derives. A machine-written count
 * that fails validation when it disagrees with the array is the opposite: it
 * is the claim and its check shipped together. The published enumeration
 * schemas require `count` too, so dropping it would make a round-trip to the
 * DAK API's own shape lossy.
 */
import { z } from "zod";
import { MaterializationSchema } from "./materialization.js";

export const FHIR_ARTIFACT_INDEX_SCHEMA_TAG = "folio-fhir-artifact-index/v1";
export const FHIR_ARTIFACT_SCHEMA_TAG = "folio-fhir-artifact/v1";

/**
 * How the IG's published output was reached.
 *
 * `gh-pages` and `output` are the two the request named, and they are NOT the
 * same evidence: `output/` is a LOCAL build whose contents depend on who ran
 * the publisher and when, while `gh-pages` is what the world can see. An index
 * built from the first and labelled as the second would assert public
 * availability for artefacts that may never have been published.
 */
export const IG_SOURCE_KINDS = ["gh-pages", "output", "url"] as const;
export type IgSourceKind = (typeof IG_SOURCE_KINDS)[number];

export const IgSourceSchema = z
  .object({
    kind: z.enum(IG_SOURCE_KINDS),
    /** The URI the artefacts are published AT — what a `published` URL is resolved against. */
    of: z.string().min(1),
    /** Git revision of the branch read, when the source was a checkout. Absent means not established. */
    revision: z.string().min(1).optional(),
    /** When the source was read. An index with no read date cannot be told from a current one. */
    readAt: z.string().min(1),
  })
  .strict();
export type IgSource = z.infer<typeof IgSourceSchema>;

/**
 * Which published file each part of the index came out of.
 *
 * REQUIRED, and every field is a published path rather than a description.
 * The module doc says why: no IG publishes an index, so every row here was
 * assembled, and "assembled from `canonicals.json`" and "assembled from an
 * `example` block inside a schema" are different degrees of evidence that a
 * reader must be able to tell apart.
 *
 * A field absent means that file was not present in the source — which is a
 * fact about the IG, not a gap in the ingest. `artifactsHtml` absent means the
 * IG published no artefact page, and every artefact's `category` will then be
 * absent too, rather than guessed.
 */
export const IndexProvenanceSchema = z
  .object({
    /** `package.manifest.json` — package id, version, FHIR version, build date. */
    packageManifest: z.string().min(1).optional(),
    /** `canonicals.json` — the spine for anything with a canonical URL. */
    canonicals: z.string().min(1).optional(),
    /** `package.tgz` -> `package/.index.json` — the spine for everything else. Lossy; see the module doc. */
    packageIndex: z.string().min(1).optional(),
    /** `artifacts.html` — the ONLY source of an artefact's editorial category. */
    artifactsHtml: z.string().min(1).optional(),
    /**
     * The DAK API enumeration schemas, when present.
     *
     * Named in the plural and as PATHS because there is one per enumerated
     * type (`ValueSets.schema.json`, `LogicalModels.schema.json`, ...) and
     * because what was read is a schema's `example`, not a response.
     */
    dakEnumerations: z.array(z.string().min(1)).optional(),
  })
  .strict();
export type IndexProvenance = z.infer<typeof IndexProvenanceSchema>;

/**
 * One published representation of one artefact.
 *
 * `url` is absolute and RESOLVED, never composed — the same rule
 * `readme-sections.ts` applies to a README link, and for the same reason: a
 * composed URL is a guess that looks like a fact.
 */
export const RepresentationSchema = z
  .object({
    url: z.string().min(1),
    /** Instance-relative path, present iff these bytes were materialised. */
    localPath: z.string().min(1).optional(),
    bytes: z.number().int().nonnegative().optional(),
  })
  .strict();
export type Representation = z.infer<typeof RepresentationSchema>;

/**
 * The representations the IG publisher emits for every artefact.
 *
 * All optional: an IG may omit Turtle, and an artefact that exists only as an
 * example has no `html` page of its own.
 */
export const PublishedFormatsSchema = z
  .object({
    json: RepresentationSchema.optional(),
    xml: RepresentationSchema.optional(),
    ttl: RepresentationSchema.optional(),
    html: RepresentationSchema.optional(),
  })
  .strict();
export type PublishedFormats = z.infer<typeof PublishedFormatsSchema>;

/**
 * The DAK API overlay — the JSON Schema / JSON-LD surface, where one exists.
 *
 * This is the half the request is actually about: "recreate artefact index
 * linking to json/jsonschema". An artefact with no `dak` is not a defect; it
 * is an artefact the DAK API does not cover, and in smart-trust that is 655 of
 * 674.
 *
 * `codeCount` and `propertyCount` are the two fields the published enumeration
 * schemas define, kept under their own names rather than merged into one
 * `count`: a ValueSet's code count and a logical model's property count are
 * different measurements, and a reader handed `count: 5` could not say which.
 */
export const DakOverlaySchema = z
  .object({
    /** `schemas/<name>.schema.json` — the JSON Schema for this artefact. */
    schema: RepresentationSchema.optional(),
    /** `schemas/<name>.displays.json` — display strings, keyed by code. */
    displays: RepresentationSchema.optional(),
    /** `schemas/<name>.openapi.json` — this ARTEFACT's OpenAPI fragment. Never `openapi/openapi.json`; see the module doc. */
    openapi: RepresentationSchema.optional(),
    /** `<name>.jsonld` — the JSON-LD vocabulary, published at the IG ROOT, not under `schemas/`. */
    jsonld: RepresentationSchema.optional(),
    /** Number of codes, for a ValueSet. */
    codeCount: z.number().int().nonnegative().optional(),
    /** Number of properties, for a logical model. */
    propertyCount: z.number().int().nonnegative().optional(),
  })
  .strict();
export type DakOverlay = z.infer<typeof DakOverlaySchema>;

/**
 * One artefact of the IG.
 *
 * `canonical` is OPTIONAL and that is load-bearing: examples and instance
 * resources have no canonical URL, and they are a majority of a large IG. A
 * schema that required one would push the ingest into minting canonicals that
 * resolve to nothing — the `collection/hq-publications` failure in the
 * who-iris catalogue, where inventing a UUID to fill a slot was refused for
 * the same reason.
 *
 * `category` is the editorial grouping from `artifacts.html`
 * ("Terminology: Value Sets"). Absent means the IG published no artefact page,
 * never "uncategorised" — the three-state discipline this repository applies
 * to every determination.
 */
export const FhirArtifactSchema = z
  .object({
    $schema: z.literal(FHIR_ARTIFACT_SCHEMA_TAG).optional(),
    /** Stable within the index: `<resourceType>/<id>`, which is unique where a bare id is not. */
    key: z.string().min(1),
    resourceType: z.string().min(1),
    id: z.string().min(1),
    name: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    /** FHIR canonical URL. Absent for examples and instances; see the doc above. */
    canonical: z.string().min(1).optional(),
    version: z.string().min(1).optional(),
    /** Editorial grouping from `artifacts.html`. Absent means the IG published no artefact page. */
    category: z.string().min(1).optional(),
    published: PublishedFormatsSchema,
    dak: DakOverlaySchema.optional(),
    materialization: MaterializationSchema,
  })
  .strict();
export type FhirArtifact = z.infer<typeof FhirArtifactSchema>;

/**
 * A JSON-LD context the IG publishes for its own consumers.
 *
 * Indexed at the IG level rather than per artefact because a context is shared
 * — smart-trust's `tng-context/v1.jsonld` binds terms drawn from four separate
 * ValueSets — so hanging it off any one artefact would misstate what it covers.
 */
export const JsonLdContextSchema = z
  .object({
    id: z.string().min(1),
    representation: RepresentationSchema,
    /** Canonical URLs of the artefacts whose terms this context binds, where that could be established. */
    binds: z.array(z.string().min(1)).optional(),
  })
  .strict();
export type JsonLdContext = z.infer<typeof JsonLdContextSchema>;

/**
 * The index document — one per published IG.
 *
 * `dakApi` is a three-state determination and NOT a boolean derived from
 * whether any artefact carries an overlay. "This IG publishes no DAK API" and
 * "the ingest did not look" are different facts, and only the first is a
 * reason to stop ingesting.
 */
/**
 * A DAK sidecar the enumeration lists that could not be bound to an artefact.
 *
 * RECORDED RATHER THAN DROPPED, and that is the whole reason this type exists.
 * smart-immunizations publishes 198 JSON Schemas and the first ingest bound
 * 188 — the ten Logical Models are named after the model's TITLE
 * (`StructureDefinition-IMMZ_C4_Create_client_record`) while the artefact's id
 * is `IMMZC4`, so a filename composed as `<ResourceType>-<id>` missed every
 * one of them. The count came out ten short and nothing said so.
 *
 * A printed warning would have been gone by the next run. An entry here
 * survives in the committed index, so "this IG names its sidecars in a way we
 * cannot bind" and "this IG has no sidecars" stay different facts.
 */
export const UnboundSidecarSchema = z
  .object({
    /** The sidecar file the enumeration named. */
    filename: z.string().min(1),
    /** Its title, as the enumeration gives it — usually the only human handle on what was missed. */
    title: z.string().min(1).optional(),
    /** Which enumeration listed it. */
    enumeration: z.string().min(1),
    /** Why no artefact matched: the strategies tried, in order. */
    reason: z.string().min(1),
  })
  .strict();
export type UnboundSidecar = z.infer<typeof UnboundSidecarSchema>;

export const DAK_API_STATES = ["unknown", "absent", "present"] as const;
export type DakApiState = (typeof DAK_API_STATES)[number];

export const FhirArtifactIndexSchema = z
  .object({
    $schema: z.literal(FHIR_ARTIFACT_INDEX_SCHEMA_TAG),
    /** Instance id — the directory this index lives in, e.g. `smart-trust`. */
    id: z.string().min(1),
    title: z.string().min(1),
    /** NPM-style package id, e.g. `smart.who.int.trust`. */
    packageId: z.string().min(1).optional(),
    version: z.string().min(1).optional(),
    fhirVersion: z.array(z.string().min(1)).optional(),
    /** The canonical base every artefact's canonical URL extends, e.g. `http://smart.who.int/trust`. */
    canonicalBase: z.string().min(1).optional(),
    /** The IG's own build timestamp, verbatim from `package.manifest.json`. Not reformatted: a transcription that normalises is no longer a transcription. */
    builtAt: z.string().min(1).optional(),
    source: IgSourceSchema,
    provenance: IndexProvenanceSchema,
    dakApi: z.enum(DAK_API_STATES),
    contexts: z.array(JsonLdContextSchema).optional(),
    /**
     * Sidecars an enumeration listed that bound to no artefact. Absent means
     * none; an empty array is not written. See {@link UnboundSidecarSchema}
     * for why these are recorded rather than warned about and forgotten.
     */
    dakUnbound: z.array(UnboundSidecarSchema).optional(),
    count: z.number().int().nonnegative(),
    artifacts: z.array(FhirArtifactSchema),
  })
  .strict()
  .refine((ix) => ix.count === ix.artifacts.length, {
    message: "count must equal artifacts.length — a count that disagrees with its array is the failure this field exists to catch",
    path: ["count"],
  })
  .refine((ix) => ix.dakApi !== "absent" || ix.artifacts.every((a) => a.dak === undefined), {
    message: "dakApi is 'absent' but an artefact carries a DAK overlay",
    path: ["dakApi"],
  })
  .refine((ix) => new Set(ix.artifacts.map((a) => a.key)).size === ix.artifacts.length, {
    message: "artifact keys must be unique within an index",
    path: ["artifacts"],
  });
export type FhirArtifactIndex = z.infer<typeof FhirArtifactIndexSchema>;

/**
 * How many artefacts are in each materialisation state.
 *
 * Mirrors `materializationCensus` in `catalogue.ts` deliberately: the question
 * "what have we actually got" is asked of both graphs by the same reader, and
 * two functions with different shapes would make the two answers
 * incomparable.
 */
export function materializationCensus(artifacts: FhirArtifact[]): Record<string, number> {
  const census: Record<string, number> = { unknown: 0, referenced: 0, materialized: 0 };
  for (const a of artifacts) census[a.materialization.state] = (census[a.materialization.state] ?? 0) + 1;
  return census;
}

/**
 * How many artefacts carry each part of the DAK overlay.
 *
 * Reported per SIDECAR rather than as one "has DAK" tally, because the four
 * are independently published: smart-trust emits `.displays.json` for every
 * ValueSet but for no logical model, and a single count would hide that.
 */
export function dakOverlayCensus(artifacts: FhirArtifact[]): Record<string, number> {
  const census: Record<string, number> = { schema: 0, displays: 0, openapi: 0, jsonld: 0 };
  for (const a of artifacts) {
    if (!a.dak) continue;
    for (const k of ["schema", "displays", "openapi", "jsonld"] as const) {
      if (a.dak[k]) census[k] += 1;
    }
  }
  return census;
}

/**
 * Artefacts grouped by their `artifacts.html` category.
 *
 * Artefacts with no category are grouped under `undefined` rather than under a
 * coined "Other": the IG's own artefact page HAS a literal "Other" section,
 * and inventing a second one with the same name would make "Other" mean two
 * different things in one index.
 */
export function byCategory(artifacts: FhirArtifact[]): Map<string | undefined, FhirArtifact[]> {
  const out = new Map<string | undefined, FhirArtifact[]>();
  for (const a of artifacts) {
    const bucket = out.get(a.category) ?? [];
    bucket.push(a);
    out.set(a.category, bucket);
  }
  return out;
}
