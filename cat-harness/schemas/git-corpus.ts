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
 * `xd1g` counted **11** scanners under `scripts/` walking from a root with no
 * gitignore awareness, and said the rule wants stating once rather than copying
 * eleven times. This is that statement.
 *
 * ## Why it lives in `schemas/` and not beside the scripts that use it
 *
 * It sat in `scripts/` until 2026-09-26. Then a **thirteenth** ignore-blind scan
 * turned up in `skills/graph-management/kg-detangle.ts`, outside the directory
 * `xd1g`'s survey searched — and the one whose output is COMMITTED, so its wrong
 * answer was pinned and then republished: `cat-harness/schemas`'s `size` read
 * **1441** where git accounts for **227**, the difference being
 * `block-qa-schema/node_modules` and `dist/`.
 *
 * The owner ruled the placement: **a skill does not know about a script, and a
 * script belongs to `tools`.** Importing this from `skills/` while it lived in
 * `scripts/` would have minted the first `skills/` -> `scripts/` edge in the
 * repository — measured the same day, and there were **zero**. `tools/` was not
 * the answer either: it imports `../schemas/*` and nothing else, so a rule placed
 * there could not be reached from `schemas/` or `scripts/` without inverting that.
 *
 * `schemas/` is the one home legal from all four directions today AND still legal
 * once scripts become tools, because `tools/` -> `schemas/` is already the only
 * edge `tools/` has. Its neighbour `layer-direction.ts` is the precedent rather
 * than an analogy: a shared verdict used by `check:partition` in `scripts/` and by
 * `kg-detangle` in `skills/`, for the same reason and by the same two callers
 * (bean `j79e`).
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
 * @module schemas/git-corpus
 * @graphNode none — asks git which files exist: a corpus rule, not a schema
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
