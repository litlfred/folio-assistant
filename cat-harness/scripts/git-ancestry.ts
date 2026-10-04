/**
 * Is one commit an ancestor of another — with "cannot tell" as its own answer.
 *
 * `git merge-base --is-ancestor A B` exits non-zero for TWO different facts,
 * and every caller that reads the exit code as a boolean conflates them:
 *
 * - **B does not descend from A.** A real answer — exit 1.
 * - **This repository cannot see enough history to say.** Not an answer.
 *
 * On a shallow clone the second wears the first's clothes, and the shape of
 * the disguise was measured rather than assumed. In a `--depth 1` clone the
 * older commit is **absent**, so git exits **128 (bad object)** — not 1:
 *
 * ```
 * $ git -C shallow merge-base --is-ancestor <root> HEAD ; echo $?
 * 128                      # and <root> IS an ancestor
 * $ git -C full    merge-base --is-ancestor <root> HEAD ; echo $?
 * 0
 * ```
 *
 * That matters because of HOW the callers read it. `survey.ts` and
 * `merge-leftover.ts` test a wrapper's `.ok`; `check-quiet-claim-liveness.ts`
 * wraps the call in `try`/`catch`. **Every one of those turns 128 into "not an
 * ancestor"** — the same wrong answer a false 1 would give, reached by a
 * different road. Exit 1 is still handled here as the real negative it is, but
 * the case that bites in practice is the missing object.
 *
 * CI checks out with `fetch-depth`, agent containers clone `--depth 1`, and
 * every submodule here arrives shallow — so this is the normal case rather
 * than the edge one, and a caller that trusts the exit code is confidently
 * wrong exactly where it is least able to notice.
 *
 * ## Measured, 2026-10-04
 *
 * Resolving a submodule-gitlink conflict on PR #2046 by hand, `--is-ancestor`
 * answered non-zero in BOTH directions for both submodules, so the pins were
 * recorded as *diverged* in a commit message that is now on `main`. Deepening
 * the two submodules and asking again:
 *
 * | submodule | branch pin | main pin | truth |
 * |---|---|---|---|
 * | `bootstrap` | `ebfa406` (10-01) | `5761204` (10-02) | main's **fast-forwards** |
 * | `bootstrap-tools` | `3046412` (10-01) | `7ac5150` (10-04) | main's **fast-forwards** |
 *
 * Neither pair had diverged. The resolution taken happened to be right; the
 * reason recorded for it was false, which is the worse half — a wrong fact in
 * a commit message outlives the commit and gets cited.
 *
 * {@link resolveGitlink} in `merge-base.ts` already got this right for the
 * merge path, and its docblock names the trap outright: *"a conflict here
 * usually means a SHALLOW submodule, where neither pin can be shown to descend
 * from the other"*. That logic was a local closure, so nothing outside that one
 * function could reuse it, and four other call sites asked the bare question.
 * This module is that closure, lifted and named, so there is one implementation
 * of the question rather than one correct and several hopeful.
 *
 * ## What this does NOT do
 *
 * It does not decide what `unknown` means for you. A reader that must not treat
 * "cannot tell" as "no" has to branch on three cases, and the point of the
 * union return is that the compiler makes it. `audit-coverage`'s rule applies
 * here one level down: **could-not-determine is never rendered as clean**, and
 * it is never rendered as its negation either.
 *
 * @module cat-harness/scripts/git-ancestry
 * @covers none — a git query helper; it judges no declared graph
 */
import { spawnSync } from "node:child_process";

/**
 * Three answers, because there are three.
 *
 * `unknown` carries its reason so a caller can report WHY it could not tell
 * rather than just that it could not — the difference between a finding a
 * person can act on and a shrug.
 */
export type Ancestry =
  | { known: true; ancestor: boolean }
  | { known: false; reason: string };

/** `true`/`false` only when known — otherwise the fallback, stated by the caller. */
export function ancestorOr(a: Ancestry, fallback: boolean): boolean {
  return a.known ? a.ancestor : fallback;
}

function run(repo: string, ...args: string[]) {
  return spawnSync("git", ["-C", repo, ...args], { encoding: "utf-8" });
}

function isShallow(repo: string): boolean {
  return run(repo, "rev-parse", "--is-shallow-repository").stdout?.trim() === "true";
}

/** Does `repo` have this object as a commit? */
function has(repo: string, oid: string): boolean {
  return run(repo, "cat-file", "-e", `${oid}^{commit}`).status === 0;
}

/**
 * Is `a` an ancestor of `b` in `repo`?
 *
 * Deepens a shallow repository ONCE before answering, and fetches a missing
 * object once, because the cheap failure is a history that was simply not
 * downloaded. A question still unanswerable after that is `unknown`, never
 * `false`.
 *
 * `deepen: false` for a caller that must not touch the network — it then gets
 * `unknown` rather than a guess, which is the whole contract.
 */
export function isAncestor(
  repo: string,
  a: string,
  b: string,
  opts: { deepen?: boolean } = {},
): Ancestry {
  const deepen = opts.deepen !== false;

  for (const oid of [a, b]) {
    if (has(repo, oid)) continue;
    if (!deepen) return { known: false, reason: `${oid.slice(0, 9)} is not in this checkout` };
    run(repo, "fetch", "-q", "origin", oid);
    if (!has(repo, oid)) {
      return { known: false, reason: `${oid.slice(0, 9)} could not be fetched from origin` };
    }
  }

  const ask = () => {
    const r = run(repo, "merge-base", "--is-ancestor", a, b);
    // 0 = yes, 1 = a real no, anything else is NOT an answer. 128 is the one
    // that actually occurs — a bad object on a shallow clone, measured above —
    // and `staging-cleanup` independently carries an `unevaluated` string for
    // an `--is-ancestor` that "exited 128: bad object".
    if (r.status === 0) return { known: true as const, ancestor: true };
    if (r.status === 1) return { known: true as const, ancestor: false };
    return null;
  };

  // A negative from a shallow repository is not trusted until the history is
  // whole. The 128 case is caught above by the object check, so this guards
  // the subtler one: both commits present, the path between them cut.
  // Order matters — the common case is a full clone, and a deepen is a
  // network round trip.
  const first = ask();
  if (first && (first.ancestor || !isShallow(repo))) return first;

  if (!deepen) {
    return first
      ? { known: false, reason: "a negative from a shallow repository, not deepened" }
      : { known: false, reason: "git could not evaluate the ancestry" };
  }

  if (isShallow(repo)) {
    run(repo, "fetch", "-q", "--unshallow", "origin");
    if (isShallow(repo)) run(repo, "fetch", "-q", "--deepen=2147483647", "origin");
  }

  const second = ask();
  if (!second) return { known: false, reason: "git could not evaluate the ancestry" };
  if (!second.ancestor && isShallow(repo)) {
    return { known: false, reason: "the history is shallow and could not be deepened" };
  }
  return second;
}

/**
 * Which of two commits descends from the other, if either.
 *
 * The question {@link resolveGitlink} actually asks, and the one a person
 * comparing two pins means. `"diverged"` is only ever returned on a history
 * whole enough to prove it, which is exactly the claim this module exists to
 * stop being made carelessly.
 */
export type Relation =
  | { rel: "same" }
  | { rel: "a-descends" | "b-descends" }
  | { rel: "diverged" }
  | { rel: "unknown"; reason: string };

export function relate(repo: string, a: string, b: string, opts: { deepen?: boolean } = {}): Relation {
  if (a === b) return { rel: "same" };
  const bInA = isAncestor(repo, b, a, opts);
  if (!bInA.known) return { rel: "unknown", reason: bInA.reason };
  if (bInA.ancestor) return { rel: "a-descends" };
  const aInB = isAncestor(repo, a, b, opts);
  if (!aInB.known) return { rel: "unknown", reason: aInB.reason };
  if (aInB.ancestor) return { rel: "b-descends" };
  return { rel: "diverged" };
}
