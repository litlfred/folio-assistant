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
 * @module folio-assistant-sci/contributions
 */

import type {
  CheckerPaths,
  CheckerResult,
} from "../cat-harness/schemas/block-qa.js";
import { COST_AUTOMATED_CHECKERS } from "./content/pipeline/qa-checkers-cost.js";

/** Where each contributed checker is defined, relative to this instance. */
const COST_CHECKERS = "content/pipeline/qa-checkers-cost.ts";

export default function contribute(): {
  name: string;
  qaCheckers: Array<{
    criterion: string;
    check: (paths: CheckerPaths) => CheckerResult;
    sourceFile: string;
  }>;
} {
  return {
    // Overwritten by `loadContributions` from the dependency entry — the root
    // declared the name, and a contributor that could rename itself could
    // impersonate another's namespace. Stated anyway so this file reads
    // honestly on its own.
    name: "folio-assistant-sci",
    // Derived from the module's own dispatch table rather than re-listed here.
    // Two places naming the same set is two places for them to disagree, and
    // the table is what the checkers are actually registered under.
    qaCheckers: Object.entries(COST_AUTOMATED_CHECKERS).map(([criterion, check]) => ({
      criterion,
      check,
      sourceFile: COST_CHECKERS,
    })),
  };
}
