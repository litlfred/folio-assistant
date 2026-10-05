/**
 * A content adapter's block VOCABULARY as a KG node: `folio-content-adapter/v1`,
 * one JSON file per adapter in a `content-adapters/` graph the owning harness
 * declares (bean riit, step 5).
 *
 * Owner, 2026-10-05 (option 1 of 3): the vocabulary — the `adapter` every
 * block-kind node names — is a node; the server adapter CLASS is not. The two
 * do not line up: `document` has a class (`DocumentContentAdapter`) and no
 * vocabulary of its own, its kinds being `paper` kinds whose profile is
 * `document`; `dak` has a vocabulary and no class. So the classes stay where
 * they are, as `contentAdapters` data in each `<instance>.json`, and this node
 * replaces the two central tables keyed on the vocabulary: `CONTENT_ADAPTERS`
 * in `block-kinds.ts` and `ADAPTER_COMPANION_ROLES` in `block-qa.ts`, plus the
 * `adapter` smart-base contributed through code.
 *
 * A LEAF: Zod only, so `block-kinds.ts` and `block-qa.ts` can parse with it.
 *
 * @graphNode schema
 * @module cat-harness/schemas/content-adapter-node
 */
import { z } from "zod";

/**
 * The companion files a block can have, one role per sibling format. Declared
 * in this leaf, and re-exported by `block-qa.ts` where it is documented, so a
 * content-adapter node's `companionRoles` is checked against the same list.
 */
export const COMPANION_ROLES = [
  "md",
  "ts",
  "lean",
  "bpmn",
  "dmn",
  "xlsx",
  "fsh",
  "cql",
  "feature",
] as const;

export const CONTENT_ADAPTER_NODE_SCHEMA = "folio-content-adapter/v1" as const;

export const ContentAdapterNodeSchema = z
  .object({
    $schema: z.literal(CONTENT_ADAPTER_NODE_SCHEMA),
    /** The vocabulary's name: what a block-kind node's `adapter` names. */
    name: z.string().regex(/^[a-z][a-z0-9-]*$/),
    /**
     * Whether cat-harness's CODE types this vocabulary's blocks (`BlockSchema`
     * in `schemas/types.ts`). A typed vocabulary's kinds are the platform's
     * own and may not be redefined by a contributor; an untyped one reaches a
     * folio only through its dependency tree. `check:kind-validators` holds
     * the typed set to the `ContentAdapter` type the code asserts.
     */
    typed: z.boolean(),
    /** Which companion roles this vocabulary's blocks can have. */
    companionRoles: z.array(z.enum(COMPANION_ROLES)).min(1),
    /**
     * The vocabulary's own module, `path.ts`, relative to the declaring
     * instance — for an untyped vocabulary, the code that defines its blocks.
     */
    vocabulary: z.string().regex(/^(?![a-z][a-z0-9-]*:)(?!\/)(?!\.\.)[^#\s]+\.ts$/).optional(),
    rationale: z.string().optional(),
  })
  .strict();

export type ContentAdapterNode = z.infer<typeof ContentAdapterNodeSchema>;
