/**
 * The two files a NAMED SUBGRAPH publishes — `index.jsonld` (referenced) and
 * `index.hydrated.jsonld` (dereferenced) — as one schema with two forms.
 *
 * The contract is `skills/kg/kg-core/kg-export.md` §"Named subgraphs — one
 * IRI, two files, framed from one graph" (bean `c1m4`). This module is what a
 * consumer validates against; `scripts/gen-subgraph-jsonld.ts` writes the
 * files and validates every one it writes against this before it writes it.
 *
 * ## One base with the harness, not a parallel "directory with members" type
 *
 * A harness instance IS a named subgraph — the root of its own tree — and a
 * subgraph is a directory of a declared graph. Both are what
 * {@link GraphNodeDirectoryShape} already describes, so the subgraph node is
 * that shape, PICKED rather than restated: `path` and the label fields come
 * from it unchanged. Two of its fields are deliberately not carried, and each
 * has the JSON-LD form instead:
 *
 * - `id` — the node's identity is its `@id`, the directory IRI. A second,
 *   local identifier beside it is two answers to "which subgraph is this?".
 * - `graphTypologies` — the KG carries kinds as `holdsGraph` LINKS to GraphTypology
 *   nodes (kg-export removed `graphTypologies` from its directory nodes as
 *   denormalised for exactly this reason), so a literal list here would be a
 *   second, unlinked spelling of one fact.
 *
 * ## The two forms differ only in what a member IS
 *
 * - In the INDEX a direct member is a pointer — `@id`, `@type` and its label —
 *   and a child subgraph is its IRI, nothing more.
 * - In the HYDRATED file a member is the whole node, and a child subgraph is
 *   the child's own subgraph node, nested, with ITS members inline. So
 *   "every node of `skills/sdlc`" is one fetch.
 *
 * Both have the directory IRI as root `@id`, and both name the shared context
 * by URL: an inline `@context` object is rejected by the type, because the
 * contract says the context is never inlined.
 *
 * @graphNode schema
 */

import { z } from "zod";
import { GraphNodeDirectoryShape } from "./cat-harness.js";

/**
 * A subgraph IRI: `<BASE_URL>/subgraph/<HARNESS>/<PATH>/` — always a directory.
 * `<BASE_URL>/subgraph/` itself is the REPOSITORY's level, above every harness
 * root (bean `ax6r`): index only, and its children are the harness roots.
 */
export const SubgraphIriSchema = z
  .string()
  .url()
  .refine((s) => /\/subgraph\/(?:[^/]+\/(?:.+\/)?)?$/.test(s), {
    message: "a subgraph IRI is <BASE_URL>/subgraph/[<HARNESS>/[<PATH>/]], ending in /",
  });

/** The shared base: the declared-directory shape, picked, plus the JSON-LD identity. */
const SubgraphNodeBase = GraphNodeDirectoryShape.pick({ path: true, title: true, description: true }).extend({
  "@id": SubgraphIriSchema,
  "@type": z.string().min(1),
  /** The subgraph's label: the harness name at the root, the instance-relative path below it. */
  name: z.string().min(1),
  /** Links to the GraphTypology nodes this subgraph holds. */
  holdsGraph: z.array(z.string().min(1)).optional(),
});

// ── Payloads (bean `f233`) ──────────────────────────────────────────────
//
// The SKELETON is the two subgraph files; the MUSCLE is here. A node's heavy
// content — the bytes one of its pointer fields names — is published once,
// under the hex SHA-256 of those bytes, and every subgraph file that carries
// the node links to it by that IRI. The contract is
// `skills/kg/kg-core/kg-export.md` §"Payloads — heavy content by content
// address".

/**
 * Where payloads are written, relative to the docs site root, and published,
 * relative to the base URL — the same path for both:
 * `<BASE_URL>/payload/sha256/<hex>` (owner ruling, 2026-10-03).
 */
export const PAYLOAD_PATH = "payload/sha256";

/** A sidecar is `<hex>` plus this; it carries the media type. */
export const PAYLOAD_SIDECAR_SUFFIX = ".json";

/** The tag a payload sidecar declares itself with — the file says what it is. */
export const PAYLOAD_SIDECAR_SCHEMA = "cat-harness-payload/v1";

/** Lower-case hex SHA-256 — the whole of a payload's name. */
export const Sha256HexSchema = z.string().regex(/^[0-9a-f]{64}$/, "a payload name is 64 lower-case hex digits");

/** `<BASE_URL>/payload/sha256/<hex>` — no extension, ever. */
export const PayloadIriSchema = z
  .string()
  .url()
  .refine((s) => new RegExp(`/${PAYLOAD_PATH}/[0-9a-f]{64}$`).test(s), {
    message: `a payload IRI is <BASE_URL>/${PAYLOAD_PATH}/<hex>, with no extension`,
  });

/**
 * The `payload` link a node carries in BOTH subgraph files: the payload's IRI,
 * plus its digest and size, so a consumer can verify what it fetched — and
 * decide whether to fetch it at all — without dereferencing anything. The
 * digest is the IRI's last segment by construction; the refinement makes that
 * checked rather than assumed.
 */
export const PayloadLinkSchema = z
  .strictObject({
    "@id": PayloadIriSchema,
    sha256: Sha256HexSchema,
    bytes: z.number().int().nonnegative(),
  })
  .refine((l) => l["@id"].endsWith(`/${l.sha256}`), { message: "a payload link's sha256 is its IRI's last segment" });
export type PayloadLink = z.infer<typeof PayloadLinkSchema>;

/**
 * `<hex>.json`, beside `<hex>`: the one home of the media type.
 *
 * A sidecar and not an extension, because the IRI is extensionless by ruling
 * — `<hex>.md` would be a second address for one payload — and GitHub Pages
 * types a file by its extension, so an extensionless payload is served as
 * `application/octet-stream` whatever it holds. A consumer holding only the
 * IRI appends `.json` to learn what it fetched. Not on the link: one fact,
 * one place, and the sidecar is the place that travels with the bytes.
 */
export const PayloadSidecarSchema = z.strictObject({
  $schema: z.literal(PAYLOAD_SIDECAR_SCHEMA),
  sha256: Sha256HexSchema,
  bytes: z.number().int().nonnegative(),
  mediaType: z.string().regex(/^[a-z]+\/[a-z0-9.+-]+(?:; ?[a-z]+=[A-Za-z0-9-]+)?$/, "an RFC 6838 media type"),
});
export type PayloadSidecar = z.infer<typeof PayloadSidecarSchema>;

/**
 * WHAT IS HEAVY — the node fields whose TARGET is published as a payload,
 * keyed by node class.
 *
 * Decided from measurement (2026-10-03, kg-export over this instance: 3,120
 * nodes, 2.5 MB of metadata, no literal field over 4.6 KB). The graph already
 * holds no body inline, so "heavy" is what its pointers name:
 *
 * - **Heavy:** Markdown bodies — a skill's instruction body (300 files,
 *   3.0 MB) and a declared asset's (3 files, 12 KB). An asset that is an
 *   image is heavy by the same entry; none is declared today.
 * - **Not heavy, yet:** a process's BPMN (78 files, 1.5 MB) and a decision's
 *   DMN (10, 58 KB). Their topology is already decomposed into graph nodes,
 *   and the XML is the source file of its own declared graph rather than a
 *   node's body.
 * - **Not heavy:** a schema's `.ts` module (161 files, 2.5 MB) — code, not
 *   content.
 * - **Deep provenance:** none is in the graph today, so nothing to move.
 *
 * Adding a row here is the whole change to make a field heavy.
 */
export const HEAVY_POINTERS: ReadonlyArray<{ readonly type: string; readonly field: string }> = [
  { type: "Skill", field: "instructionsPath" },
  { type: "Asset", field: "path" },
];

/**
 * A payload's media type, by its SOURCE file's extension. An extension not
 * listed is a problem, never a guess: a payload declared under the wrong type
 * is worse than one not published.
 */
export const PAYLOAD_MEDIA_TYPES: Readonly<Record<string, string>> = {
  md: "text/markdown; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  pdf: "application/pdf",
};

/** A member as the INDEX carries it: enough to find it, label it, type it, and reach its payload. */
export const SubgraphPointerSchema = z.strictObject({
  "@id": z.string().url(),
  "@type": z.string().min(1),
  name: z.string().optional(),
  title: z.string().optional(),
  payload: PayloadLinkSchema.optional(),
});

/** A member as the HYDRATED file carries it: the whole KG node, open-ended — its payload a link, never the body. */
export const SubgraphMemberSchema = z.looseObject({
  "@id": z.string().url(),
  "@type": z.string().min(1),
  payload: PayloadLinkSchema.optional(),
});

export const SubgraphIndexNodeSchema = SubgraphNodeBase.extend({
  hasMember: z.array(SubgraphPointerSchema).optional(),
  hasSubgraph: z.array(SubgraphIriSchema).optional(),
}).strict();

export type SubgraphHydratedNode = z.infer<typeof SubgraphNodeBase> & {
  hasMember?: Array<z.infer<typeof SubgraphMemberSchema>>;
  hasSubgraph?: SubgraphHydratedNode[];
};

export const SubgraphHydratedNodeSchema: z.ZodType<SubgraphHydratedNode> = z.lazy(() =>
  SubgraphNodeBase.extend({
    hasMember: z.array(SubgraphMemberSchema).optional(),
    hasSubgraph: z.array(SubgraphHydratedNodeSchema).optional(),
  }).strict(),
);

/** The `@context` is a URL, never an inline object. */
const ContextUrl = z.string().url();

/**
 * `index.jsonld`. `seeAlso` is the REPOSITORY level's only (bean `t8c4`): the
 * repository indexes of instances in this checkout whose diagrams this build
 * does not frame (`pve3` — bootstrap publishes through its own graph). A link,
 * not membership: nothing here claims to hold their nodes.
 */
export const SubgraphIndexSchema = SubgraphIndexNodeSchema.extend({
  "@context": ContextUrl,
  seeAlso: z.array(z.string().url()).optional(),
}).strict();
export type SubgraphIndex = z.infer<typeof SubgraphIndexSchema>;

/** `index.hydrated.jsonld`. */
export const SubgraphHydratedSchema = SubgraphNodeBase.extend({
  "@context": ContextUrl,
  hasMember: z.array(SubgraphMemberSchema).optional(),
  hasSubgraph: z.array(SubgraphHydratedNodeSchema).optional(),
}).strict();
export type SubgraphHydrated = z.infer<typeof SubgraphHydratedSchema>;

/**
 * Where the shared subgraph `@context` is written, relative to the instance
 * root, and published, relative to the base URL — the same path for both,
 * beside `ns/content/v1.jsonld`.
 */
export const SUBGRAPH_CONTEXT_PATH = "ns/subgraph/v1.jsonld";

/** The two file names under every subgraph IRI. The root has the first only. */
export const SUBGRAPH_INDEX_FILE = "index.jsonld";
export const SUBGRAPH_HYDRATED_FILE = "index.hydrated.jsonld";
