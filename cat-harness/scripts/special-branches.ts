/**
 * The harness's SPECIAL branches — long-lived data and cache branches that a
 * process writes and reads, as opposed to a feature or pull-request branch.
 * Bean `folio-assistant-32f6`.
 *
 * Owner, 2026-10-02, verbatim: *"need to prefix 'special' branches with cat-,
 * cat-qa-reports, cat-fhir-ast, cat-lean-cacje (or whatever), not sure if any
 * more. gh-pages stays as is"*.
 *
 * ## One declaration, checked copies
 *
 * This file is the ONE place the names are declared. The scripts and
 * workflows that run in a folio — `lake-cache.sh`, the restore action, the
 * Python fetchers — cannot import TypeScript (a folio may have no `bun` on the
 * path when it restores a cache), so they carry a copy of the prefix. Each
 * copy is listed in {@link MIRRORS}, and `tests/special-branches.test.ts`
 * fails if a copy disagrees with this file. An unavoidable duplicate is
 * fine; an unchecked one is not (`directory-conventions`).
 *
 * ## The transition: new name first, then the legacy name
 *
 * Every reader AND writer resolves a branch the same way
 * ({@link resolveBranch}):
 *
 *   1. the new `cat-` name, if it exists on the remote;
 *   2. otherwise the legacy name, if THAT exists;
 *   3. otherwise the new name.
 *
 * Writers follow the same rule as readers on purpose. If a writer created a
 * `cat-` branch while the legacy one still existed, the owner's rename
 * (`POST /repos/{o}/{r}/branches/{old}/rename`, which keeps a redirect) would
 * be refused — its target would already exist — and the two families would
 * then diverge. With this rule nothing creates a `cat-` branch for a key that
 * already has a legacy one, so the rename is the only step that moves a key.
 *
 * ## Removing the fallback
 *
 * When every remote that carries a legacy name has been renamed — this
 * repository AND each folio repository that holds a `lake-cache/*` family —
 * empty each entry's `legacy` list, delete the fallback branch in each
 * mirror, and let the mirror test go green on the new names alone. That is
 * bean `folio-assistant-oycs`; do it no earlier than one full
 * `lake-cache-refresh` cycle after the last rename, so a run that started
 * before the rename has finished.
 *
 * `gh-pages` is listed so the question "is this special?" has one answer, and
 * is never renamed: GitHub Pages serves from it by name.
 */

/** One special branch, or one family of branches sharing a prefix. */
export interface SpecialBranch {
  /** Stable id; never changes when the name does. */
  readonly id: string;
  /**
   * `branch` — one branch, named exactly {@link name}.
   * `family` — many branches, each `{name}{key}` (`name` ends in `/`).
   */
  readonly shape: "branch" | "family";
  /** The name (or family prefix) every writer creates from now on. */
  readonly name: string;
  /**
   * Names (or prefixes) still READ, newest first, until the remote branches
   * are renamed. Empty once the transition is over.
   */
  readonly legacy: readonly string[];
  /** What the branch holds, in one line. */
  readonly holds: string;
  /** Where the writer lives — a workflow, a script, or a pull request not yet on `main`. */
  readonly writers: readonly string[];
  /** Which repositories carry it. */
  readonly repos: string;
}

export const SPECIAL_BRANCHES: readonly SpecialBranch[] = [
  {
    id: "gh-pages",
    shape: "branch",
    name: "gh-pages",
    legacy: [],
    holds: "the published docs site and staging previews; GitHub Pages serves it by name — NOT renamed",
    writers: [".github/workflows/docs-site.yml", ".github/workflows/feature-staging.yml", ".github/workflows/folio-staging.yml"],
    repos: "this repository and every folio",
  },
  {
    id: "qa-reports",
    shape: "branch",
    name: "cat-qa-reports",
    legacy: ["qa-reports"],
    holds: "derived QA verdicts, commit-keyed under main/<sha>/ and pr/<n>/<sha>/ (arc 3fva)",
    writers: ["code-quality-gates.yml `qa-publish` job via scripts/qa-store.ts — on PR #1764/#1801, not on main yet"],
    repos: "this repository (and, per #1801, each folio's own)",
  },
  {
    id: "lake-cache",
    shape: "family",
    name: "cat-lake-cache/",
    legacy: ["lake-cache/"],
    holds: "Lean .lake build caches, one branch per <package>-<toolchain-slug>",
    writers: [
      ".github/workflows/lake-cache-refresh.yml",
      "cat-harness/scripts/lake-cache.sh seed --push / contribute",
      "cat-harness/scripts/lake-cache-produce.py",
      "cat-harness/scripts/reseed-lean-cache.sh",
    ],
    repos: "folio repositories with Lean (e.g. litlfred/qou); none in this repository",
  },
  {
    id: "fhir-ast",
    shape: "family",
    name: "cat-fhir-ast/",
    legacy: ["fhir-ast/"],
    holds: "FHIR IG Publisher AST + tx cache, one branch per IG package id",
    writers: ["fhir-harness ig-cache.sh seed --push — on PR #1816, not on main yet"],
    repos: "IG folio repositories (litlfred/smart-trust, litlfred/smart-base)",
  },
  {
    id: "state",
    shape: "branch",
    name: "cat-state",
    legacy: ["state"],
    holds: "process-written state graphs (beans, workflow instances, todos) — seeded, not authoritative until arc fs43 Phase 3",
    writers: ["folio-state-bot, by hand from the fs43 session (no workflow yet)"],
    repos: "this repository",
  },
];

/** A copy of a name that cannot import this file, and the line that must carry it. */
export interface Mirror {
  readonly file: string;
  readonly id: string;
  /** Substrings the file must contain: the new name, and every legacy one still read. */
  readonly mustContain: (b: SpecialBranch) => readonly string[];
}

const both = (b: SpecialBranch) => [b.name, ...b.legacy];

/**
 * Every copy of a special-branch name outside this file that a reader or
 * writer actually uses. Comments and prose that mention a name are NOT
 * listed: they describe, they do not resolve.
 */
export const MIRRORS: readonly Mirror[] = [
  { file: "cat-harness/scripts/lake-cache.sh", id: "lake-cache", mustContain: (b) => [`CACHE_PREFIX="${b.name.replace(/\/$/, "")}"`, ...b.legacy.map((l) => `LEGACY_CACHE_PREFIX="${l.replace(/\/$/, "")}"`)] },
  { file: "cat-harness/scripts/lake-cache-fetch.sh", id: "lake-cache", mustContain: both },
  { file: "cat-harness/scripts/lake-cache-fetch-multi.py", id: "lake-cache", mustContain: both },
  { file: "cat-harness/scripts/lake-cache-produce.py", id: "lake-cache", mustContain: both },
  { file: "cat-harness/scripts/reseed-lean-cache.sh", id: "lake-cache", mustContain: both },
  { file: ".github/actions/lake-cache-restore/action.yml", id: "lake-cache", mustContain: both },
  { file: "cat-harness/templates/paper/github/actions/lake-cache-restore/action.yml", id: "lake-cache", mustContain: both },
  { file: ".github/workflows/lake-cache-refresh.yml", id: "lake-cache", mustContain: both },
];

export function specialBranch(id: string): SpecialBranch {
  const b = SPECIAL_BRANCHES.find((x) => x.id === id);
  if (!b) throw new Error(`no special branch '${id}' — declared: ${SPECIAL_BRANCHES.map((x) => x.id).join(", ")}`);
  return b;
}

/**
 * The names to try for `id` (and, for a family, `key`), in order: the new
 * name, then each legacy name.
 */
export function candidateNames(id: string, key = ""): string[] {
  const b = specialBranch(id);
  if (b.shape === "family" && !key) throw new Error(`'${id}' is a family; pass the key (e.g. <package>-<slug>)`);
  if (b.shape === "branch" && key) throw new Error(`'${id}' is a single branch; it takes no key`);
  return [b.name, ...b.legacy].map((n) => n + key);
}

/**
 * The branch to read from AND write to, given the names that exist on the
 * remote: the first candidate that exists, else the new name. See the file
 * docblock for why writers use this too.
 */
export function resolveBranch(id: string, existing: ReadonlySet<string>, key = ""): string {
  const names = candidateNames(id, key);
  return names.find((n) => existing.has(n)) ?? names[0];
}

/** Is `ref` (a plain branch name) one of the special branches, under any name? */
export function isSpecialBranch(ref: string): SpecialBranch | undefined {
  return SPECIAL_BRANCHES.find((b) =>
    [b.name, ...b.legacy].some((n) => (b.shape === "family" ? ref.startsWith(n) : ref === n)),
  );
}
