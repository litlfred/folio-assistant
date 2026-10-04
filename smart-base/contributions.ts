/**
 * What `smart-base` contributes to a folio that depends on it: the `dak`
 * content adapter, its 21 block kinds, and the DAK QA checkers.
 *
 * ## The first contributor of an ADAPTER and BLOCK KINDS
 *
 * `folio-assistant-sci/contributions.ts` contributes QA checkers and a tool.
 * Until bean `1335` nothing contributed an adapter or a block kind, and core's
 * content model named the `dak` adapter itself — `CONTENT_ADAPTERS = ["paper",
 * "dak"]`, `DAK_BLOCK_KINDS` and five companion tables in core's
 * `block-kinds.ts` — so `dak-blocks.ts` could not leave for smart-base without
 * core importing a harness. Registration is the way out: core's built-in
 * vocabulary narrows to what core owns (`paper`), and "every kind, including
 * contributed ones" becomes a runtime question asked of a
 * `ContributionRegistry`. Design: `cat-harness/docs/proposals/dak-kinds-contribution-2026-10-02.md`.
 *
 * ## What each kind carries
 *
 * A contributed kind carries what a built-in one carries, as far as a moved
 * reader needs it: its builder name (manifest discovery), its label prefix,
 * and its JSON-LD folio type and DoCO co-type (`typesForKind`). All of it is
 * DERIVED from smart-base's own tables below rather than re-listed here — two
 * places naming the same set are two places for them to disagree.
 *
 * ## The checkers, not the criteria
 *
 * The five `dak-*` criteria stay declared in core's `QA_CRITERIA_REGISTRY`,
 * marked `checker_contributed`, which is the cut sci made for the
 * elaboration-cost checkers. `sourceFile` is required and relative to THIS
 * instance's root, which `loadContributions` pins from the dependency entry:
 * the sweep freshness-hashes the bytes of the file defining each checker, and
 * a checker with no bytes to hash is a verdict that never goes stale.
 *
 * Adds nothing that was not there before the move. DAK AUTHORING support is
 * a different bean.
 *
 * @module smart-base/contributions
 */

import type { CheckerPaths, CheckerResult, CompanionRole } from "../cat-harness/schemas/block-qa.js";
import { DAK_ADAPTER } from "./schemas/dak-kinds.js";
import { DAK_AUTOMATED_CHECKERS } from "./content/pipeline/qa-checkers-dak.js";

/** Where each contributed checker is defined, relative to this instance. */
const DAK_CHECKERS = "content/pipeline/qa-checkers-dak.ts";

/**
 * The companion roles a DAK block can carry — the row `ADAPTER_COMPANION_ROLES`
 * held for `dak` in core until bean `1335`.
 */
export const DAK_COMPANION_ROLES: CompanionRole[] = ["md", "ts", "bpmn", "dmn", "xlsx", "fsh", "cql", "feature"];

export default function contribute(): {
  name: string;
  adapter: { name: string; module: string; companionRoles: CompanionRole[] };
  qaCheckers: Array<{
    criterion: string;
    check: (paths: CheckerPaths) => CheckerResult;
    sourceFile: string;
  }>;
} {
  return {
    // Overwritten by `loadContributions` from the dependency entry; stated so
    // this file reads honestly on its own.
    name: "smart-base",
    adapter: {
      name: DAK_ADAPTER,
      // The adapter's vocabulary module. No `ContentAdapter` class exists for
      // `dak` — there was none in core either; adding one would be authoring
      // support, which this move does not add.
      module: "./schemas/dak-blocks.ts",
      companionRoles: DAK_COMPANION_ROLES,
    },
    // No `blockKinds`: since bean riit, step 3, the kinds are
    // `folio-block-kind/v1` nodes in `smart-base/block-kinds/`, which
    // `loadContributions` registers for every folio whose dependency tree
    // includes smart-base — the same reach this array had.
    // Derived from the module's own dispatch table, as sci's are.
    qaCheckers: Object.entries(DAK_AUTOMATED_CHECKERS).map(([criterion, check]) => ({
      criterion,
      check,
      sourceFile: DAK_CHECKERS,
    })),
  };
}
