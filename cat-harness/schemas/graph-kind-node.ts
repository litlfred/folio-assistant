/**
 * A GRAPH KIND as a node of the knowledge graph, declared by the harness that
 * owns it (bean dmx1). Owner, 2026-10-04: *"there should not be a central
 * registry for declaring mount tools and subgraph types"*, and, asked where a
 * kind is declared, a `kinds/` graph of one node per kind (option 1 of 3) —
 * the way `tools/` holds Tool definitions as nodes.
 *
 * A harness declares a directory of graph kind `kinds`; each `*.json` in it is
 * one {@link GraphKindNodeSchema}. The registry a reader sees is the base
 * layer's own kinds plus every declared node across the instances, loaded
 * lazily by `graph-kind-registry.ts` on first use, and a name declared by two
 * files is refused, naming both.
 *
 * The fields are `GraphKindDef`'s, one for one, plus `name` (the file says what
 * it declares) and `avatar` (so the kind's mark travels with the kind, rather
 * than in a second central table). A compile-time check below keeps the two in
 * step: a field added to `GraphKindDef` and not here fails to typecheck.
 *
 * A LEAF: Zod only, so the registry can import it without a cycle.
 *
 * @module cat-harness/schemas/graph-kind-node
 */
import { z } from "zod";

import type { GraphKindDef } from "./graph-kind-registry";

export const GRAPH_KIND_NODE_TAG = "folio-graph-kind/v1" as const;

const NodeSchemaRefSchema = z.union([
  z.object({ validator: z.string().min(1), generated: z.literal(true).optional() }).strict(),
  z.object({ shape: z.string().min(1), generated: z.literal(true).optional() }).strict(),
  z.object({ external: z.string().min(1), generated: z.literal(true).optional() }).strict(),
]);

/** A kind's mark: SVG path data in a 24×24 box, a hue angle, and why. As `schemas/avatars.ts` `Avatar`. */
export const KindAvatarSchema = z
  .object({
    glyph: z.string().min(1),
    tone: z.number().int().min(0).max(359),
    reads: z.string().min(1),
  })
  .strict();

export const GraphKindNodeSchema = z
  .object({
    $schema: z.literal(GRAPH_KIND_NODE_TAG),
    /** The kind's word, as a directory's `graphKinds` names it. */
    name: z.string().regex(/^[a-z][a-z0-9-]*$/, "a lower-case kind word, e.g. ig-ast"),
    title: z.string().min(1).optional(),
    layer: z.literal("core").optional(),
    perInstance: z.literal(true).optional(),
    renderable: z.boolean(),
    recordsWork: z.boolean().optional(),
    holds: z.enum(["content", "context", "state", "derived"]),
    summary: z.string().min(1),
    schema: z.string().min(1).optional(),
    validator: z.string().min(1).optional(),
    validatorNotApplicable: z.string().min(1).optional(),
    nodeSchemas: z.record(z.string().min(1), NodeSchemaRefSchema).optional(),
    declarationFile: z.string().min(1).optional(),
    concernGroups: z.literal(true).optional(),
    within: z.string().min(1).optional(),
    avatar: KindAvatarSchema.optional(),
    /** WHY the kind sits in its layer and renders as it does: what a code comment said on a listed kind. Not read by any reader. */
    rationale: z.string().min(1).optional(),
  })
  .strict();
export type GraphKindNode = z.infer<typeof GraphKindNodeSchema>;

/** The registry entry a node declares: everything but its own name and tag. */
export function kindDefOf(node: GraphKindNode): GraphKindDef {
  const { $schema: _tag, name: _name, rationale: _why, ...def } = node;
  return def as GraphKindDef;
}

// Every GraphKindDef field has a home on the node (a field added to the def
// and not here is a type error on this line).
type _EveryDefFieldIsDeclarable = Exclude<keyof GraphKindDef, keyof GraphKindNode> extends never ? true : never;
export const _everyDefFieldIsDeclarable: _EveryDefFieldIsDeclarable = true;
