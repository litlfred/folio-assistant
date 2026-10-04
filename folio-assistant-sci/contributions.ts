/**
 * What `folio-assistant-sci` contributes to a folio that depends on it.
 *
 * ## The first real contributor
 *
 * `ContributionRegistry` was written for the repository split (Phase 0.1 of
 * #223) and, until this module, had **no production consumer at all** — every
 * reference outside `schemas/contributions.ts` was its own test. A mechanism
 * with no caller is free to be subtly wrong in ways no test shape catches,
 * which is what bean `rfev` exists to end.
 *
 * ## Why the checkers and not the criteria
 *
 * `proof-compile-cost` and `proof-no-cost-regression` stay declared in core's
 * `QA_CRITERIA_REGISTRY`. A criterion is a rule about content; a checker is
 * the tooling that answers it, and elaboration cost is a Lean measurement.
 * That is the owner's cut — *"f-a-core has high level processes only, no
 * tooling"* — so the rule stays put and the tool moves here.
 *
 * ## `sourceFile` is not decoration
 *
 * The sweep skips a criterion whose verdict is still fresh, and freshness is
 * `script_hash`, computed over the bytes of the file that defines the checker.
 * A checker handed over as a bare function has nothing to hash, and
 * `qa-criteria-registry.ts` records what that costs: a criterion whose hash
 * does not track its checker **never invalidates** — its verdicts stay fresh
 * forever and editing the checker changes nothing. So the path is required,
 * and it is relative to THIS instance's root, which `loadContributions` pins
 * from the dependency entry rather than taking from this file.
 *
 * ## Pipeline plugins (bean `squu`)
 *
 * Generic pipeline code used to import four of this layer's modules directly:
 * the Lean lexer, the LaTeX preflight, Lean coverage and one folio's default
 * chapter profiles. Those files go straight to this instance (owner ruling
 * 2026-10-01 ~18:15), so the generic callers now ask
 * `content/pipeline/pipeline-plugins.ts` for a slot and THIS module fills it.
 * The imports below still reach into `cat-harness/` because the files have
 * not moved yet. That direction (sci → lower) is allowed, and the move PR
 * turns each into a local `./content/…` or `./scripts/…` path.
 *
 * @module folio-assistant-sci/contributions
 */

import { FORMAL_EDGES_TOOL, registerFormalEdgesTools } from "./content/pipeline/formal-edges-mcp.js";

export default function contribute(): {
  name: string;
  tools: Array<{ name: string; register: (server: unknown) => void }>;
} {
  return {
    // Overwritten by `loadContributions` from the dependency entry — the root
    // declared the name, and a contributor that could rename itself could
    // impersonate another's namespace. Stated anyway so this file reads
    // honestly on its own.
    name: "folio-assistant-sci",
    // No `qaCheckers` or `pipelinePlugins` (bean riit, step 3b): each is a
    // node in this instance's `qa-checkers/` and `pipeline-plugins/` graphs,
    // which `loadContributions` registers through the dependency tree. The
    // checker table stays in qa-checkers-cost.ts and the slot table moved to
    // content/pipeline/plugin-slots.ts; the nodes name both.
    // The formal-edge extractor (folio-assistant#1492). Lean tooling, so it
    // lives here and reaches the server as a contribution: the server walks
    // declared dependencies and never names this instance.
    tools: [{ name: FORMAL_EDGES_TOOL, register: registerFormalEdgesTools }],
  };
}
