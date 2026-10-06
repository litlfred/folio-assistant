/**
 * The generic pipeline slots folio-assistant-sci fills, as ONE typed table.
 *
 * Each `pipeline-plugins/<slot>.json` node names this table and its slot (bean
 * riit, step 3b): the node is what says the slot is filled, this table is what
 * `tsc` checks against the generic side's own contract (`PipelinePlugins`), so
 * a shape that drifts from what the callers expect fails here rather than at
 * the call. Moved out of `contributions.ts`, which no longer returns plugins.
 *
 * The imports still reach into `cat-harness/` because those files have not
 * moved yet (bean `squu`'s follow-up move PR). That direction (sci → lower) is
 * allowed; the move turns each into a local path.
 *
 * @module folio-assistant-sci/content/pipeline/plugin-slots
 */
import type { PipelinePlugins } from "../../../cat-harness/content/pipeline/pipeline-plugins.js";
import { declarationStarts, stripLeanComments } from "../../../cat-harness/content/pipeline/lean-lexer.js";
import { registerDefaultChapterProfiles } from "../../../cat-harness/content/pipeline/_folio-chapter-profiles.qou.js";
import { runPreflight } from "../../../cat-harness/content/pipeline/latex-preflight.js";
import { computeStats, leanFileStatus, resolveLeanFile } from "../../../cat-harness/scripts/lean-coverage.js";

export const PIPELINE_IMPLEMENTATIONS: PipelinePlugins = {
  "lean-lexer": { stripLeanComments, declarationStarts },
  "chapter-profile-defaults": { registerDefaults: registerDefaultChapterProfiles },
  "latex-preflight": { runPreflight },
  "lean-coverage": { resolveLeanFile, leanFileStatus, computeStats },
};
