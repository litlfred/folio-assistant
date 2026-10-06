/**
 * A GRAPH TYPOLOGY as a node of the knowledge graph, declared by the harness that
 * owns it (bean dmx1). Owner, 2026-10-04: *"there should not be a central
 * registry for declaring mount tools and subgraph types"*, and, asked where a
 * kind is declared, a `typologies/` graph of one node per kind (option 1 of 3) —
 * the way `tools/` holds Tool definitions as nodes.
 *
 * A harness declares a directory of graph typology `typologies`; each `*.json` in it is
 * one {@link GraphTypologyNodeSchema}. The registry a reader sees is the base
 * layer's own kinds plus every declared node across the instances, loaded
 * lazily by `graph-typology-registry.ts` on first use, and a name declared by two
 * files is refused, naming both.
 *
 * The fields are `GraphTypologyDef`'s, one for one, plus `kind` (the file says what
 * it declares) and `avatar` (so the kind's mark travels with the kind, rather
 * than in a second central table). A compile-time check below keeps the two in
 * step: a field added to `GraphTypologyDef` and not here fails to typecheck.
 *
 * A LEAF: Zod only, so the registry can import it without a cycle.
 *
 * @module cat-harness/schemas/graph-typology-node
 * @graphNode schema
 */
import { z } from "zod";

import type { GraphTypologyDef } from "./graph-typology-registry";

export const GRAPH_TYPOLOGY_NODE_TAG = "folio-graph-typology/v1" as const;

const NodeSchemaRefSchema = z.union([
  z.object({ validator: z.string().min(1), generated: z.literal(true).optional() }).strict(),
  z.object({ shape: z.string().min(1), generated: z.literal(true).optional() }).strict(),
  z.object({ external: z.string().min(1), generated: z.literal(true).optional() }).strict(),
  // Listed with no code: a `folio-validator/v1` node names this family (bean riit).
  z.object({ generated: z.literal(true).optional() }).strict(),
]);

/** A kind's mark: SVG path data in a 24×24 box, a hue angle, and why. As `schemas/avatars.ts` `Avatar`. */
export const KindAvatarSchema = z
  .object({
    glyph: z.string().min(1),
    tone: z.number().int().min(0).max(359),
    reads: z.string().min(1),
  })
  .strict();
export type KindAvatar = z.infer<typeof KindAvatarSchema>;

export const GraphTypologyNodeSchema = z
  .object({
    $schema: z.literal(GRAPH_TYPOLOGY_NODE_TAG),
    /**
     * The kind's word, as a directory's `graphTypologies` names it. `kind`, NOT
     * `name`: a JSON file whose `name` equals its filename stem is how
     * `findDeclarationFile` recognises an INSTANCE declaration, so a node
     * spelled with `name` made `typologies/` read as a directory of four instances
     * (measured on the first move, 2026-10-04).
     */
    kind: z.string().regex(/^[a-z][a-z0-9-]*$/, "a lower-case kind word, e.g. ig-ast"),
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
    /** The navbar tile icon (an icon name, as `graph-tiles.ts` spells it). */
    tileIcon: z.string().min(1).optional(),
    /** `false`: never part of a published graph (sod4 #5). */
    published: z.literal(false).optional(),
    /** The directory may be scanned for skill bodies (sod4 #5). */
    skillBearing: z.literal(true).optional(),
    /** The kind is harness knowledge-graph content (sod4 #5). */
    kgContent: z.literal(true).optional(),
    /** What a directory of this kind holds: the kind table's `contents`, generated from here. */
    description: z.string().min(1).optional(),
    renderableNote: z.string().min(1).optional(),
    anyLayer: z.literal(true).optional(),
    /** WHY the kind sits in its layer and renders as it does: what a code comment said on a listed kind. Not read by any reader. */
    rationale: z.string().min(1).optional(),
  })
  .strict();
export type GraphTypologyNode = z.infer<typeof GraphTypologyNodeSchema>;

/** The registry entry a node declares: everything but its own name and tag. */
export function kindDefOf(node: GraphTypologyNode): GraphTypologyDef {
  const { $schema: _tag, kind: _kind, rationale: _why, ...def } = node;
  return def as GraphTypologyDef;
}

// Every GraphTypologyDef field has a home on the node (a field added to the def
// and not here is a type error on this line).
type _EveryDefFieldIsDeclarable = Exclude<keyof GraphTypologyDef, keyof GraphTypologyNode> extends never ? true : never;
export const _everyDefFieldIsDeclarable: _EveryDefFieldIsDeclarable = true;
