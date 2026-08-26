/**
 * The block kinds, as a runtime value — in a leaf module so anything can
 * read it.
 *
 * This list used to live in `types.ts`, which is where its consumers
 * mostly are. But `types.ts` imports schemas from `constraints.ts` at
 * module scope, so `constraints.ts` could not import back without a
 * runtime cycle — and its `appliesTo` arrays are built during module
 * initialisation, exactly when a cycle leaves the import undefined.
 *
 * That is why `constraints.ts` spelled its kind lists out by hand, and
 * why several of them ended up narrower than the rule they gated: a
 * kind missing from `appliesTo` is skipped by `validate.ts` without a
 * word. This module imports nothing, so there is no longer a reason for
 * any list of kinds to be written out anywhere.
 *
 * `types.ts` re-exports `BLOCK_KINDS` and `BlockKind`, so existing
 * importers are unaffected, and keeps the compile-time proof that this
 * array and the `Block` union cover each other — that check needs the
 * union, which necessarily lives with the types.
 *
 * @module schemas/block-kinds
 */

/**
 * Every block kind, as a RUNTIME value.
 *
 * `Block` is a type and is erased at compile time, so anything that has
 * to recognise a block by reading its source — the QA pipeline's block
 * discovery, the propagation sweeps, the viewer registry, the constraint
 * table — needs a list it can actually iterate. Seven such lists existed,
 * hand-maintained and independent, and every one of them was short.
 *
 * The cost was silent. `readBlockManifest` returns `undefined` for an
 * unrecognised builder and `walkBlocks` skips whatever it returns
 * `undefined` for, so on the qou corpus 461 blocks — 445 `table`, 16
 * `algorithm` — were never yielded, never swept, and never audited.
 * Roughly 13% of the corpus, excluded by a stale regex rather than by
 * any decision.
 */
export const BLOCK_KINDS = [
  "definition",
  "theorem",
  "lemma",
  "proposition",
  "corollary",
  "algorithm",
  "conjecture",
  "example",
  "remark",
  "proof",
  "simulator",
  "prose",
  "equation",
  "diagram",
  "table",
] as const;

export type BlockKind = (typeof BLOCK_KINDS)[number];

/**
 * `BLOCK_KINDS` as a regex alternation, for the several places that
 * identify a block by scanning its `.ts` source for the builder call.
 *
 * Those call sites need different surrounding patterns — anchored vs
 * not, `export default` required or optional, followed by `(` or by
 * `({` — so they build their own regex around this rather than sharing
 * one. What they must NOT do is spell out the alternation, which is how
 * five of them came to list 13 of the 15 kinds.
 */
export const BLOCK_KIND_ALT = BLOCK_KINDS.join("|");

// ── Adapter scoping ──────────────────────────────────────────────

/**
 * The content adapters a folio can hold.
 *
 * `folio.config.json` already carries `contentType` and `adapter`, and the
 * platform ships `adapters/paper/`. This names the dimension so that block
 * kinds and QA criteria can be scoped to it instead of living in one global
 * pool.
 */
export const CONTENT_ADAPTERS = ["paper", "dak"] as const;
export type ContentAdapter = (typeof CONTENT_ADAPTERS)[number];

/**
 * The `paper` adapter's block kinds — the fifteen above.
 *
 * An alias rather than a second list: `BLOCK_KINDS` *is* the paper set, and
 * the compile-time exhaustiveness proof in `types.ts` pins it to the `Block`
 * union. Duplicating it here is precisely the drift this module exists to
 * prevent.
 */
export const PAPER_BLOCK_KINDS = BLOCK_KINDS;

/**
 * The `dak` adapter's block kinds — WHO SMART Guidelines L2 and L3.
 *
 * Taken from the component lists this repo already treats as canonical:
 * `schemas/skills/l2-dak-authoring/input.schema.json` (the nine DAK
 * components) and `schemas/skills/l3-fhir-authoring/input.schema.json` (the
 * ten FHIR artefact types). WHO's own starter kit could not be consulted
 * directly — `smart.who.int` and `build.fhir.org` return the same 403 policy
 * denial as `who.int` — so these mirror the repo's schemas, not the published
 * IG.
 *
 * ## Declared, not yet authorable
 *
 * These kinds are **not** members of the `Block` union and have no builder,
 * no Zod schema and no viewer registration. Authoring a DAK block is a
 * separate piece of work; what exists today is the vocabulary, so that QA
 * criteria can be scoped by adapter and so the ingest writer has names to
 * emit. `walkBlocks` will not discover a `.ts` declaring one of these until
 * that work lands — which is the honest state, rather than a kind that looks
 * supported and silently yields nothing.
 */
export const DAK_BLOCK_KINDS = [
  // L2 — Digital Adaptation Kit components.
  "persona",
  "user-scenario",
  "business-process",
  "data-element",
  "decision-table",
  "scheduling-logic",
  "indicator",
  "functional-requirement",
  "non-functional-requirement",
  // L3 — FHIR implementation-guide artefacts.
  "logical-model",
  "profile",
  "value-set",
  "questionnaire",
  "cql-library",
  "structure-map",
  "plan-definition",
  "measure",
  "test-case",
  "actor-definition",
] as const;

export type DakBlockKind = (typeof DAK_BLOCK_KINDS)[number];

/** Every kind any adapter recognises. */
export const ALL_BLOCK_KINDS = [...PAPER_BLOCK_KINDS, ...DAK_BLOCK_KINDS] as const;
export type AnyBlockKind = BlockKind | DakBlockKind;

/** Which kinds belong to which adapter. */
export const ADAPTER_BLOCK_KINDS: Record<ContentAdapter, readonly string[]> = {
  paper: PAPER_BLOCK_KINDS,
  dak: DAK_BLOCK_KINDS,
};

const KIND_TO_ADAPTER: ReadonlyMap<string, ContentAdapter> = new Map(
  CONTENT_ADAPTERS.flatMap((a) =>
    ADAPTER_BLOCK_KINDS[a].map((k) => [k, a] as [string, ContentAdapter]),
  ),
);

/**
 * The adapter a block kind belongs to, or `undefined` for an unknown kind.
 *
 * `undefined` is deliberately not defaulted to `"paper"`. A criterion that
 * silently treats an unrecognised kind as a paper block is how a math axis
 * would come to run against a ValueSet — the caller must decide what an
 * unknown kind means rather than inherit a guess.
 */
export function adapterForKind(kind: string): ContentAdapter | undefined {
  return KIND_TO_ADAPTER.get(kind);
}
