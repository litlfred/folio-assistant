/**
 * The `bun test` files a pull request can affect, for the four
 * `typescript-test` shards of `code-quality-gates.yml` (bean
 * `folio-assistant-k3vv` child "PRs run only affected tests"; owner,
 * 2026-11-05, "do it all properly, shave every second").
 *
 * On a pull request only. A push to `main`, `merge_group`, `workflow_dispatch`
 * and the nightly run keep the WHOLE suite, so nothing goes unchecked: what a
 * pull request leaves out, the push of its merge runs.
 *
 * ## What "changed" means in this checkout
 *
 * This checkout is an index: almost all of its code is REMOTE MOUNTS laid
 * down from `index.lock.json`. So a re-pin, which changes one line of the
 * lock, changes many files on disk. The changed paths are therefore
 *
 * - the files the pull request changes in this repository (`HEAD^1..HEAD` of
 *   the merge commit Actions checks out), and
 * - for every mounted directory whose `treeDigest` the lock changed, the
 *   files that changed upstream between the two pinned commits, mapped from
 *   `upstreamPath` to the mounted `path`. When the upstream diff cannot be
 *   read, the WHOLE directory counts as changed — a slower run, never a
 *   missed one.
 *
 * ## Which tests a changed path selects
 *
 * 1. `affectedTests` (cat-harness-tools `scripts/affected-tests.ts`): every
 *    test whose relative-import closure holds a changed file. It also answers
 *    "all" for a lockfile, manifest, bunfig, tsconfig or test preload.
 * 2. A test whose source NAMES a changed file (its basename, or
 *    `parent/basename` for a generic name such as `README.md`): the fixture
 *    reads, workflow YAML and spawned scripts the import closure does not see.
 *    Over-selection is the safe direction.
 *
 * Everything here that cannot be determined answers "all": a missing
 * `affected-tests.ts` (before the re-pin that brings it), an unreadable lock,
 * a changed instance set, a failed `git` call.
 *
 * Usage: bun .github/scripts/pr-test-scope.ts --out <file.json>
 *        (run from the checkout root, on the merge commit of a pull request)
 *
 * @module .github/scripts/pr-test-scope
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

export type Scope =
  | { kind: "all"; why: string; changed?: string[] }
  | { kind: "some"; files: string[]; why: Record<string, string>; changed: string[] };

/** Changes that reach every test, beyond what `affectedTests` already knows. */
const EVERYTHING = new Set(["index.config.json", ".github/mount-from-lock.sh"]);

/** Basenames too common to identify a file by themselves. */
const GENERIC = new Set(["README.md", "AGENTS.md", "CLAUDE.md", "GEMINI.md", "index.ts", "index.md", "index.json", "types.ts", "mod.ts", "SKILL.md"]);

interface LockDir {
  path: string;
  upstreamPath: string;
  treeDigest: string;
}
interface LockInstance {
  instance: string;
  repository: string;
  sha: string;
  upstreamRoot: string;
  path: string;
  declaration: { file: string; sha256: string };
  directories: LockDir[];
  assets?: { src: string; sha256: string }[];
}

function git(cwd: string, args: string[]): string | undefined {
  const r = spawnSync("git", args, { cwd, encoding: "utf-8", maxBuffer: 256 * 1024 * 1024 });
  return r.status === 0 ? r.stdout : undefined;
}

const norm = (p: string): string => (p === "." || p === "" ? "" : p.replace(/^\.\//, "").replace(/\/+$/, ""));

/** The files changed upstream between two commits, or undefined when they cannot be read. */
export type UpstreamDiff = (repository: string, from: string, to: string) => string[] | undefined;

export const gitUpstreamDiff: UpstreamDiff = (repository, from, to) => {
  const dir = mkdtempSync(join(tmpdir(), "pr-scope-"));
  if (git(dir, ["init", "-q", "--bare"]) === undefined) return undefined;
  const url = `https://github.com/${repository}`;
  // Trees only: a name diff reads no blob.
  if (git(dir, ["fetch", "-q", "--depth=1", "--filter=blob:none", url, from, to]) === undefined) return undefined;
  const out = git(dir, ["diff-tree", "-r", "--name-only", "--no-renames", from, to]);
  return out === undefined ? undefined : out.split("\n").filter(Boolean);
};

/**
 * The mounted paths a lock change alters. A path ending in `/` stands for
 * every file under it. Returns "all" when the instance set itself changed.
 */
export function lockChanges(base: { instances?: LockInstance[] }, head: { instances?: LockInstance[] }, diff: UpstreamDiff): string[] | { all: string } {
  const before = new Map((base.instances ?? []).map((i) => [i.instance, i]));
  const after = head.instances ?? [];
  if (after.length !== before.size || after.some((i) => !before.has(i.instance))) return { all: "the lock mounts a different set of instances" };
  const out: string[] = [];
  for (const h of after) {
    const b = before.get(h.instance)!;
    if (b.path !== h.path || b.upstreamRoot !== h.upstreamRoot || b.repository !== h.repository) {
      out.push(`${h.path}/`);
      continue;
    }
    if (b.declaration.sha256 !== h.declaration.sha256) out.push(`${h.path}/${h.declaration.file}`);
    const oldAssets = new Map((b.assets ?? []).map((a) => [a.src, a.sha256]));
    for (const a of h.assets ?? []) if (oldAssets.get(a.src) !== a.sha256) out.push(`${h.path}/${a.src}`);
    const oldDirs = new Map(b.directories.map((d) => [d.path, d]));
    const moved = h.directories.filter((d) => {
      const o = oldDirs.get(d.path);
      return o === undefined || o.treeDigest !== d.treeDigest || o.upstreamPath !== d.upstreamPath;
    });
    if (moved.length === 0) continue;
    const upstream = b.sha === h.sha ? undefined : diff(h.repository, b.sha, h.sha);
    for (const d of moved) {
      if (upstream === undefined || oldDirs.get(d.path)?.upstreamPath !== d.upstreamPath) {
        out.push(`${d.path}/`);
        continue;
      }
      const up = norm(d.upstreamPath);
      for (const f of upstream) {
        if (up === "") out.push(`${d.path}/${f}`);
        else if (f.startsWith(`${up}/`)) out.push(`${d.path}/${f.slice(up.length + 1)}`);
        else if (f === up) out.push(d.path); // a directory mounted from a single file (hydrated)
      }
    }
  }
  return out;
}

/** `changed`, with each `dir/` prefix expanded to the files under it on disk. */
export function expand(root: string, changed: readonly string[]): string[] {
  const out = new Set<string>();
  const walk = (rel: string): void => {
    const abs = join(root, rel);
    let st;
    try {
      st = statSync(abs);
    } catch {
      return;
    }
    if (!st.isDirectory()) {
      out.add(rel);
      return;
    }
    for (const e of readdirSync(abs)) if (e !== "node_modules" && e !== ".git") walk(join(rel, e));
  };
  for (const c of changed) {
    if (c.endsWith("/")) walk(c.slice(0, -1));
    else out.add(c);
  }
  return [...out].sort();
}

/** The string a test would carry to name `path`: its basename, or `parent/basename` for a generic one. */
export function nameOf(path: string): string {
  const b = basename(path);
  if (!GENERIC.has(b)) return b;
  const parent = basename(dirname(path));
  return parent && parent !== "." ? `${parent}/${b}` : b;
}

/** The tests among `tests` whose source names one of `changed`. */
export function testsNaming(root: string, changed: readonly string[], tests: readonly string[]): Record<string, string> {
  const names = [...new Set(changed.map(nameOf))].filter((n) => n.length >= 6);
  const why: Record<string, string> = {};
  if (names.length === 0) return why;
  for (const t of tests) {
    let text: string;
    try {
      text = readFileSync(join(root, t), "utf-8");
    } catch {
      continue;
    }
    const hit = names.find((n) => text.includes(n));
    if (hit !== undefined) why[t] = `names ${hit}`;
  }
  return why;
}

type AffectedModule = {
  affectedTests: (root: string, changed: readonly string[], tests?: readonly string[]) => { kind: "all"; why: string } | { kind: "some"; files: string[]; why: Record<string, string> };
  testFilesUnder: (root: string) => string[];
};

/** The scope for `changed` (repo-relative, `dir/` prefixes allowed), given the selector module. */
export function scopeFor(root: string, changed: readonly string[], mod: AffectedModule): Scope {
  const everything = changed.find((c) => EVERYTHING.has(c));
  if (everything !== undefined) return { kind: "all", why: `${everything} changes what every test runs over`, changed: [...changed] };
  const files = expand(root, changed);
  const tests = mod.testFilesUnder(root);
  const sel = mod.affectedTests(root, files, tests);
  if (sel.kind === "all") return { kind: "all", why: sel.why, changed: files };
  const why: Record<string, string> = { ...testsNaming(root, files, tests), ...sel.why };
  return { kind: "some", files: Object.keys(why).sort(), why, changed: files };
}

/** The share of `files` that shard `k` of `n` runs: every n-th file of the sorted list, from the k-th. */
export function shareOf(files: readonly string[], k: number, n: number): string[] {
  return [...files].sort().filter((_, i) => i % n === k - 1);
}

/**
 * Whether the checked-out `cqg_judge.py` refuses to let main reuse a PR run
 * that judged only a selection (folio-assistant#2963, `SCOPED_STEP`). Without
 * that refusal, `verdict-reuse.sh` could hand a PR's partial run to the push
 * of its merge, and main would skip the whole suite. The push runs the judge
 * of this same tree, so checking it here makes the merge order irrelevant.
 */
export function judgeRefusesScopedReuse(root: string): boolean {
  try {
    return /^SCOPED_STEP = /m.test(readFileSync(join(root, ".github/scripts/cqg_judge.py"), "utf-8"));
  } catch {
    return false;
  }
}

export async function computeScope(root: string, diff: UpstreamDiff = gitUpstreamDiff): Promise<Scope> {
  if (!judgeRefusesScopedReuse(root))
    return { kind: "all", why: ".github/scripts/cqg_judge.py does not yet refuse to reuse a selection for main (#2963)" };
  const modPath = resolve(root, "cat-harness-tools/scripts/affected-tests.ts");
  if (!existsSync(modPath)) return { kind: "all", why: "cat-harness-tools/scripts/affected-tests.ts is not in the pinned cat-harness-tools yet" };
  const mod = (await import(modPath)) as AffectedModule;
  // The merge commit's first parent is the base it was merged into.
  if (git(root, ["rev-parse", "--verify", "-q", "HEAD^1"]) === undefined) git(root, ["fetch", "-q", "--no-tags", "--deepen=1", "origin"]);
  const names = git(root, ["diff", "--name-only", "--no-renames", "HEAD^1", "HEAD"]);
  if (names === undefined) return { kind: "all", why: "the pull request's own diff (HEAD^1..HEAD) could not be read" };
  const own = names.split("\n").filter(Boolean);
  const changed = [...own];
  if (own.includes("index.lock.json")) {
    const base = git(root, ["show", "HEAD^1:index.lock.json"]);
    if (base === undefined) return { kind: "all", why: "the base index.lock.json could not be read" };
    let lc;
    try {
      lc = lockChanges(JSON.parse(base), JSON.parse(readFileSync(join(root, "index.lock.json"), "utf-8")), diff);
    } catch (e) {
      return { kind: "all", why: `index.lock.json could not be compared: ${(e as Error).message}` };
    }
    if (!Array.isArray(lc)) return { kind: "all", why: lc.all, changed };
    changed.push(...lc);
  }
  return scopeFor(root, changed, mod);
}

if (import.meta.main) {
  const i = process.argv.indexOf("--out");
  const out = i > 0 ? process.argv[i + 1] : undefined;
  if (!out) {
    console.error("usage: bun .github/scripts/pr-test-scope.ts --out <file.json>");
    process.exit(2);
  }
  let scope: Scope;
  try {
    scope = await computeScope(process.cwd());
  } catch (e) {
    scope = { kind: "all", why: `the scope could not be computed: ${(e as Error).message}` };
  }
  writeFileSync(out, JSON.stringify(scope, null, 1) + "\n");
  const n = scope.kind === "all" ? "ALL" : String(scope.files.length);
  console.log(`pr-test-scope: ${n} test file(s) — ${scope.kind === "all" ? scope.why : `${scope.changed.length} changed path(s)`}`);
  if (scope.kind === "some") for (const f of scope.files) console.log(`  ${f}  (${scope.why[f]})`);
}
