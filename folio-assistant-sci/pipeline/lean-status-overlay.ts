/**
 * The live Lean status a block's PDF margin mark shows: the `block-status-overlay`
 * pipeline slot this instance fills (bean `saqd`, row `pipeline/build.ts`).
 *
 * The generic paper → LaTeX builder (`cat-harness-tools/pipeline/build.ts`)
 * hands every block it loads to this slot. Here the block's hand-set `lean`
 * field is overlaid with what the actual `.lean` file says, so the ∀ margin
 * marks reflect the formalisation rather than the (usually `not_checked`)
 * manifest value: without it every mark reads "drafted" even when the proof is
 * sorry-free. The `.lean` is resolved sibling-or-`lean.ref` under the paper's
 * Lake library root (`<paperDir>/lean`), then classified.
 *
 * Moved here from `build.ts` unchanged; a composition that does not mount this
 * layer leaves the slot empty and the builder keeps the manifest's own value.
 *
 * @module folio-assistant-sci/pipeline/lean-status-overlay
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Block } from "@litlfred/cat-harness-tools/schemas/types.ts";
import { leanFileStatus, resolveLeanFile } from "../scripts/lean-coverage.js";

/** Overlay a block's `lean.sorryFree` and `lean.validation` from its resolved `.lean` file. */
export function overlayBlockStatus(block: Block, tsPath: string, paperDir: string): void {
  if (!block || !("lean" in block) || !block.lean) return;
  const leanFile = resolveLeanFile(tsPath, readFileSync(tsPath, "utf-8"), join(paperDir, "lean"));
  if (!leanFile) return;
  const st = leanFileStatus(leanFile);
  block.lean.sorryFree = st.sorryFree;
  // Keep an explicit validation only when the manifest hasn't already
  // recorded a stronger CI verdict.
  if (!block.lean.validation || block.lean.validation === "not_checked") {
    block.lean.validation = st.validation;
  }
}
