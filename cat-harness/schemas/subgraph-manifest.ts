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
 * - `graphKinds` — the KG carries kinds as `holdsGraph` LINKS to GraphKind
 *   nodes (kg-export removed `graphKinds` from its directory nodes as
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

/** A subgraph IRI: `<BASE_URL>/subgraph/<HARNESS>/<PATH>/` — always a directory. */
export const SubgraphIriSchema = z
  .string()
  .url()
  .refine((s) => /\/subgraph\/[^/]+\/(?:.+\/)?$/.test(s), {
    message: "a subgraph IRI is <BASE_URL>/subgraph/<HARNESS>/<PATH>/, ending in /",
  });

/** The shared base: the declared-directory shape, picked, plus the JSON-LD identity. */
const SubgraphNodeBase = GraphNodeDirectoryShape.pick({ path: true, title: true, description: true }).extend({
  "@id": SubgraphIriSchema,
  "@type": z.string().min(1),
  /** The subgraph's label: the harness name at the root, the instance-relative path below it. */
  name: z.string().min(1),
  /** Links to the GraphKind nodes this subgraph holds. */
  holdsGraph: z.array(z.string().min(1)).optional(),
});

/** A member as the INDEX carries it: enough to find it, label it and type it. */
export const SubgraphPointerSchema = z.strictObject({
  "@id": z.string().url(),
  "@type": z.string().min(1),
  name: z.string().optional(),
  title: z.string().optional(),
});

/** A member as the HYDRATED file carries it: the whole KG node, open-ended. */
export const SubgraphMemberSchema = z.looseObject({
  "@id": z.string().url(),
  "@type": z.string().min(1),
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

/** `index.jsonld`. */
export const SubgraphIndexSchema = SubgraphIndexNodeSchema.extend({ "@context": ContextUrl }).strict();
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
