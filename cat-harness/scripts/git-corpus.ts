#!/usr/bin/env bun
/**
 * What files this REPOSITORY contains — asked of git, never of the disk.
 *
 * ## Why it is a module rather than a habit
 *
 * A scanner that walks the filesystem behind a hand-written denylist is wrong
 * in two directions at once, and this repository has now paid for both:
 *
 * - **`ramz`, 2026-09-25.** `check-context-emission` walked from the
 *   repository root skipping `node_modules`, `_kg`, `_site`, `_docs` and
 *   `.git`. A clean checkout of `main` failed `bun test` over **145** JSON-LD
 *   documents under the gitignored `cat-harness/ingest-staging/` — one
 *   machine's residue, reported as this repository's corpus, in a test whose
 *   own name is *"the real corpus"*.
 * - **`rsi6`, 2026-09-26.** `check-subgraphs` walked declared directories with
 *   a bare glob. The moment a gate installed a publishable package's
 *   devDependencies, it descended into `node_modules/` and reported **31
 *   broken links** — every one of them inside a third-party README
 *   (`sucrase` pointing at its own `./CONTRIBUTING.md`, `expect-type` at its
 *   own `./src/index.ts`). Not one was a fact about this repository.
 *
 * The second is the sharper lesson: the walk was *correct* for five days and
 * became wrong because something else in the tree changed. A denylist encodes
 * what happened to be there when it was written.
 *
 * `xd1g` counted **11** scanners here walking from a root with no gitignore
 * awareness, and said the rule wants stating once rather than copying eleven
 * times. This is that statement.
 *
 * ## The contract, and the distinction callers must keep
 *
 * `undefined` and `[]` are **different answers**:
 *
 * - `undefined` — git could not answer. Not a work tree, no git on `PATH`, a
 *   non-zero exit. The caller must fall back or report *could not determine*.
 * - `[]` — git looked and there are none.
 *
 * Collapsing them is how a check reports a clean corpus it never read, which
 * is the `dh4f` shape this repository names in its own conventions.
 *
 * **Tracked PLUS untracked-not-ignored**, never `--cached` alone: a file a
 * contributor has just written and not yet staged is part of the change under
 * test, and a check that cannot see it passes on the very file it exists to
 * examine.
 *
 * @covers cat-harness
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * The files git accounts for under {@link dir}, as absolute paths — or
 * `undefined` when git cannot answer.
 *
 * @param dir       directory to ask about; its repository is inferred
 * @param pathspec  optional git pathspecs, e.g. `["*.md"]`. Omitted means all.
 */
export function gitCorpus(dir: string, pathspec: readonly string[] = []): string[] | undefined {
  if (!existsSync(dir)) return undefined;
  const r = spawnSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "--", ...pathspec],
    { cwd: dir, encoding: "utf-8" },
  );
  if (r.error !== undefined || r.status !== 0) return undefined;
  return r.stdout
    .split("\0")
    .filter((p) => p.length > 0)
    .map((p) => join(dir, p));
}

/**
 * Whether {@link dir} is inside a git work tree at all.
 *
 * Separate from {@link gitCorpus} because a caller sometimes needs to say
 * *which* of the two `undefined` cases it hit — "this fixture is a bare temp
 * directory" reads very differently in a report from "git is broken here".
 */
export function inWorkTree(dir: string): boolean {
  if (!existsSync(dir)) return false;
  const r = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd: dir,
    encoding: "utf-8",
  });
  return r.error === undefined && r.status === 0 && r.stdout.trim() === "true";
}
