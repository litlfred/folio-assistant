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
