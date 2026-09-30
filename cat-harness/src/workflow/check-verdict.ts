/**
 * The verdict for ONE commit's check runs — in THREE states, not two.
 *
 * ## Why this is not `ci-health`
 *
 * `check:ci-health` asks whether the **workflows** are passing on the default
 * branch, across recent history. This asks a narrower question about a single
 * commit: *given this SHA's check runs, may I merge, must I fix, or do I not
 * yet know?* The two come apart — a workflow can be healthy in general while
 * one commit's run was cancelled, and a commit can be green while a workflow
 * has been red for a month on a path this commit did not touch.
 *
 * ## The defect this exists to stop
 *
 * Measured 2026-09-30. An agent watching `main` after a merge folded
 * `cancelled` into the failure set and reported **main red** on a commit whose
 * every hard gate had passed — `Repository gates`, `TypeScript`, `End-to-end`,
 * `Skill-registration`, all green. The one cancelled run was `build-and-deploy`
 * from `docs-site.yml`, superseded by the next push.
 *
 * Reporting that as a failure sends the next reader hunting for a defect that
 * does not exist. Reporting it as a pass is worse. It is neither, and the
 * `ci-health` skill already says so:
 *
 * > `cancelled` as a **third state**, and saying **whose** contention a
 * > cancellation was.
 *
 * ## `stale` belongs with `cancelled`, not with failure
 *
 * GitHub marks a check run `stale` when a **newer run supersedes it**. That is
 * the same concurrency fact as a cancellation, not a verdict about the code —
 * so it is `undetermined` here. Classifying it as a failure was the first
 * draft's second bug, found while falsifying the first.
 *
 * ## Precedence, and why each step is in this order
 *
 * 1. **failure wins over everything.** A run that failed is a fact about the
 *    tree; a cancellation alongside it does not soften that.
 * 2. **pending beats cancelled.** While anything is still running, nothing is
 *    concluded — a cancelled run plus an in-flight one is `pending`, because
 *    the in-flight one may yet fail.
 * 3. **cancelled/stale, with nothing failed, is `undetermined`** — never a pass.
 * 4. Only then, `pass`.
 *
 * An **empty** run list and an **unreadable** response are BOTH `undetermined`
 * rather than `pass`. A check set that is vacuously satisfied is the `dh4f`
 * shape: a consumer that looked at nothing and reported a clean run.
 *
 * @module src/workflow/check-verdict
 */

/** GitHub's `conclusion` values that are a verdict about the tree. */
const FAILED = new Set(["failure", "timed_out", "action_required"]);

/**
 * Conclusions that mean "a newer run took over", not "this is wrong".
 * See the module docblock for why `stale` is here and not in {@link FAILED}.
 */
const SUPERSEDED = new Set(["cancelled", "stale"]);

/**
 * Jobs that carry no verdict about the tree. A staging workflow's teardown
 * steps report `skipped` on every ordinary run; counting them would make the
 * "no judgeable runs" case unreachable.
 */
const NOT_A_VERDICT = new Set(["cleanup", "cleanup-dispatch"]);

export interface CheckRun {
  readonly name: string;
  /** `queued` | `in_progress` | `completed` */
  readonly status: string;
  readonly conclusion?: string | null;
}

export type VerdictState = "pass" | "fail" | "pending" | "undetermined";

export interface Verdict {
  readonly state: VerdictState;
  /** The check names that decided it — empty for `pass`. */
  readonly names: readonly string[];
  /** Why, in one line, for a reader who sees only this. */
  readonly because: string;
}

/**
 * Classify a commit's check runs.
 *
 * `runs` is `undefined` when the response could not be read at all — which is
 * `undetermined`, never `pass`.
 */
export function verdictOf(runs: readonly CheckRun[] | undefined): Verdict {
  if (runs === undefined) {
    return {
      state: "undetermined",
      names: [],
      because: "the check-run response could not be read — NOT a pass",
    };
  }
  const judgeable = runs.filter((r) => !NOT_A_VERDICT.has(r.name));
  if (judgeable.length === 0) {
    return {
      state: "undetermined",
      names: [],
      because:
        runs.length === 0
          ? "no check runs on this commit — NOT a pass, a check set nobody ran is not a green one"
          : "every run is a teardown job carrying no verdict — NOT a pass",
    };
  }
  const failed = judgeable.filter((r) => FAILED.has(r.conclusion ?? "")).map((r) => r.name);
  if (failed.length > 0) {
    return { state: "fail", names: failed, because: "a check failed" };
  }
  const pending = judgeable.filter((r) => r.status !== "completed").map((r) => r.name);
  if (pending.length > 0) {
    // Deliberately ABOVE the superseded case: an in-flight run may yet fail,
    // so a cancellation beside it concludes nothing.
    return { state: "pending", names: pending, because: `${pending.length} still running` };
  }
  const superseded = judgeable.filter((r) => SUPERSEDED.has(r.conclusion ?? "")).map((r) => r.name);
  if (superseded.length > 0) {
    return {
      state: "undetermined",
      names: superseded,
      because: "cancelled or superseded by a newer run — neither a pass nor a failure",
    };
  }
  return { state: "pass", names: [], because: `${judgeable.length} check(s) completed clean` };
}

/**
 * WHOSE contention was it? The check run cannot say; the branch can.
 *
 * `newerCommits` is what `git log <sha>..origin/<branch>` returned — so an
 * empty list means the branch has NOT moved past this commit, and the
 * cancellation is therefore unexplained rather than explained by concurrency.
 * Saying "probably concurrency" there would be the guess this whole module
 * exists to refuse.
 */
export function explainSuperseded(newerCommits: readonly string[]): string {
  if (newerCommits.length === 0) {
    return (
      "cancelled, and the branch has NOT moved past this commit. Nothing here " +
      "explains it — say could-not-determine and look, rather than assuming concurrency."
    );
  }
  const head = newerCommits[newerCommits.length - 1]!;
  return (
    `cancelled, and the branch HAS moved past this commit — superseded by: ${head}. ` +
    "That is concurrency, not a failure. Judge the newer commit instead."
  );
}

/** The process exit code for a state. `undetermined` is its own, never 0. */
export function exitCodeFor(state: VerdictState): 0 | 1 | 2 {
  return state === "pass" ? 0 : state === "fail" ? 1 : 2;
}
