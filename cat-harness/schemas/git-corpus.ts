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
import { Glob } from "bun";

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

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

/**
 * A glob scan over the files GIT accounts for — the shared form of the rule
 * `xd1g` asks to be stated once rather than re-implemented eleven times.
 *
 * ## Why this and not a git pathspec
 *
 * Handing the same pattern to `gitCorpus` as a PATHSPEC looks equivalent and
 * is not: a git pathspec's star crosses a path separator by default, while a
 * Bun `Glob` single star does not. So a caller porting a pattern from one to
 * the other changes what it matches without changing a character of it. This keeps the PATTERN semantics exactly as the caller
 * wrote them and changes only where the candidate list comes from, which is
 * the whole of the conversion and the only part that can be verified by
 * comparing counts.
 *
 * ## The fallback is recorded, not silent
 *
 * `git` answering is not guaranteed — a temp fixture is not a work tree, and
 * `gates` must stay runnable where git cannot be asked. So an unavailable git
 * falls back to the bare scan and SAYS SO in `source`. A measurement pinned
 * from a bare walk counts whatever is on the machine and has to be legible as
 * such; that is `kg-detangle`'s `corpusFallbacks` rule, and collapsing the two
 * into one silent answer is the `dh4f` shape.
 *
 * @param root     directory the pattern is relative to
 * @param pattern  a Bun `Glob` pattern, exactly as a `scanSync` caller writes it
 * @returns paths RELATIVE to `root`, sorted, and which corpus they came from
 */
export function gitScan(
  root: string,
  pattern: string,
): { files: string[]; source: "git" | "walk" } {
  const glob = new Glob(pattern);
  const tracked = gitCorpus(root);
  if (tracked === undefined) {
    return {
      files: [...glob.scanSync({ cwd: root, onlyFiles: true })].sort(),
      source: "walk",
    };
  }
  return {
    files: tracked
      .map((abs) => relative(root, abs).split(/[\\/]/).join("/"))
      .filter((rel) => glob.match(rel))
      .sort(),
    source: "git",
  };
}

/**
 * Every file git accounts for under `root` that `keep` admits, as ABSOLUTE
 * paths — the walk-shaped half of {@link gitScan}.
 *
 * `xd1g`'s ten remaining scanners are recursive `readdirSync` walks, not glob
 * scans, so the glob form does not fit them. What they all share is a
 * hand-written skip list — `node_modules`, `.git`, a dot-directory rule — and
 * a predicate on the filename. This replaces the walk and keeps the
 * predicate.
 *
 * ## `keep` receives a `/`-joined path RELATIVE to `root`
 *
 * Relative, so a predicate cannot accidentally match something in the absolute
 * prefix — `/home/runner/node_modules/checkout/...` would defeat an
 * `includes("node_modules")` test written against an absolute path, and a
 * scanner whose corpus depends on where the checkout lives is the class of bug
 * this whole file exists for. `/`-joined so one predicate reads the same on
 * either platform.
 *
 * ## The dot-directory rule does NOT come for free, and that is deliberate
 *
 * Every one of these walks skips dot-directories. Git does not: `.github/`,
 * `.claude/` and `.beans.yml` are tracked content, so the git corpus is WIDER
 * there than the walk it replaces. Folding a dot rule in here would silently
 * change what several scanners read, and folding it in *invisibly* is worse
 * than either choice — so the caller states its own rule in `keep`, and the
 * two-sided control (nothing swept that git ignores, nothing LOST that the
 * walk admitted) is what proves it kept it.
 *
 * @param root  directory to enumerate
 * @param keep  admits a repo-relative, `/`-joined path
 */
export function gitFiles(
  root: string,
  keep: (rel: string) => boolean,
): { files: string[]; source: "git" | "walk" } {
  const tracked = gitCorpus(root);
  if (tracked !== undefined) {
    return {
      files: tracked.filter((abs) => keep(relative(root, abs).split(sep).join("/"))).sort(),
      source: "git",
    };
  }
  // The fallback, and it skips only what git could not have told us about
  // anyway: `.git` itself is never content, and `node_modules` is ignored in
  // every checkout this runs in. Everything else is left to `keep`, so the two
  // paths admit the same set wherever git can answer.
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name === ".git" || e.name === "node_modules") continue;
      const abs = join(dir, e.name);
      if (e.isDirectory()) walk(abs);
      else if (keep(relative(root, abs).split(sep).join("/"))) out.push(abs);
    }
  };
  if (existsSync(root)) walk(root);
  return { files: out.sort(), source: "walk" };
}

/**
 * "Is this file part of the repository's corpus?", for a page-text scan.
 *
 * BESIDE `gitCorpus` rather than in its caller, and exported, because the fix
 * has to be FALSIFIABLE. It was inline in `kg-audit.ts` first — untestable
 * twice over: nothing could show it working, and `kg-audit.ts` has no
 * `import.meta.main` guard, so a test that imported it RAN THE WHOLE AUDIT
 * and then hit the script's own `process.exit(0)`. An untestable corpus rule
 * is how the defect below survived.
 *
 * Three states, kept apart deliberately:
 *
 * | case | answer | why |
 * |---|---|---|
 * | git listed it | **in** | tracked, or untracked-and-not-ignored |
 * | under `repoRoot`, git did not list it | **out** | gitignored — the defect |
 * | NOT under `repoRoot` | **in** | a sibling checkout (`docsLayers` can return one) is outside this corpus and cannot be judged by it |
 * | git could not answer (`undefined`) | **in**, everything | an unanswerable question is not an empty answer |
 *
 * The defect, measured 2026-09-26 (bean `xd1g`; the shape `rsi6` and
 * `kg-detangle` already paid for): the page walk excluded `_site`,
 * `node_modules` and `vendor` BY NAME, and a name list cannot be complete.
 * This container held SIX gitignored `.md`/`.html` files a fresh checkout does
 * not — five `index.html` under `_kg/` and a `.pytest_cache/README.md` — none
 * matching an excluded name. Their text entered the page corpus, so every
 * criterion asking "is this mentioned on a page?" could answer differently
 * here than in CI.
 *
 * NOT claimed: that this fixes any verdict today. Running the writer with it
 * changed no sidecar, so the exposure is LATENT. It is fixed because a
 * measurement that depends on what a gate happened to install is not a
 * measurement, not because it is currently wrong.
 */
export function corpusPredicate(repoRoot: string): (abs: string) => boolean {
  const corpus = gitCorpus(repoRoot, ["*.md", "*.html"]);
  if (corpus === undefined) return () => true;
  const tracked = new Set(corpus.map((f) => resolve(repoRoot, f)));
  return (abs: string): boolean => !abs.startsWith(`${repoRoot}/`) || tracked.has(abs);
}
