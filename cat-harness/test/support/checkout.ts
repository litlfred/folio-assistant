/**
 * Which checkout holds this instance, and whether it is the AGGREGATE.
 *
 * ## Why a test needs to ask (bean `ho66`)
 *
 * cat-harness is rehearsed as the repository it will be once separated: its
 * tracked files, and its declared closure's, laid out as sibling clones with
 * nothing above them (`probeStandalone` in `cat-harness-tools/scripts/seed-ready.ts`).
 * A handful of tests read what only the aggregate checkout holds — the bean
 * store and the todo graph at its root, another instance's tree, or a
 * committed output that was generated with the higher instances present.
 * Run alone, they fail on a missing input rather than on a defect, and that
 * failure looks exactly like a regression.
 *
 * The owner's ruling (2026-10-05) was to skip or guard those reads in a
 * principled way. This is the guard, and it is ONE predicate so that "needs
 * the aggregate" means the same thing at every call site.
 *
 * ## Derived, never configured
 *
 * The answer comes from the filesystem and the declarations — git's own
 * toplevel, and whether that toplevel holds instances other than this one —
 * never from an environment variable or a hardcoded path. A switch somebody
 * sets is a switch somebody forgets, and then the test is skipped in the one
 * checkout where it can run.
 *
 * git rather than `checkoutRootFor`, because two of the tests that use this
 * are tests OF `checkoutRootFor`: an oracle computed by the function under
 * test can only agree with it.
 *
 * ## A skip, visibly
 *
 * Callers use `test.skipIf(!inAggregate())`, so a standalone run REPORTS the
 * skip rather than counting a pass; in the aggregate every guarded test runs
 * exactly as before. A test whose subject can be found in cat-harness's own
 * content is rewritten to read that instead, and does not use this at all.
 *
 * @module test/support/checkout
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { instanceRootsIn } from "../../schemas/cat-harness.js";

/** The cat-harness instance root — the directory this file's `test/` sits in. */
export const INSTANCE = resolve(import.meta.dir, "..", "..");

/**
 * The working tree git says holds `dir` — the main checkout, an agent's
 * worktree, or a standalone clone.
 *
 * Throws rather than guessing when `dir` is in no git work tree: "could not
 * determine" must not turn into either answer.
 */
export function checkoutHolding(dir: string): string {
  const r = spawnSync("git", ["-C", dir, "rev-parse", "--show-toplevel"], { encoding: "utf-8" });
  const top = r.status === 0 ? r.stdout.trim() : "";
  if (top === "") {
    throw new Error(`cannot determine the checkout holding ${dir}: it is not in a git work tree (${r.stderr.trim() || "no output"})`);
  }
  return resolve(top);
}

/**
 * Whether `instanceRoot` sits inside a checkout that aggregates other
 * instances — the monorepo — rather than being a checkout of its own.
 *
 * True when git's toplevel is not the instance itself AND declares at least
 * one instance besides it. A standalone clone is its own toplevel, so false.
 */
export function inAggregate(instanceRoot: string = INSTANCE): boolean {
  const inst = resolve(instanceRoot);
  const top = checkoutHolding(inst);
  if (top === inst) return false;
  return instanceRootsIn(top).some((r) => resolve(r) !== inst);
}
