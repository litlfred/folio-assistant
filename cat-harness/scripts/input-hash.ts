/**
 * Input-hash staleness skipping for `bun run regen` — bean `xpcu`.
 *
 * @module scripts/input-hash
 * @graphNode none — a local-only cache helper for `regen-after-merge.ts`
 *
 * ## What it answers
 *
 * *"Has anything this verify/write pair depends on changed since the last time
 * it came back green?"* If not, asking it again cannot produce a different
 * answer, and `regen` skips it.
 *
 * The fingerprint of a pair is a hash over:
 *
 * - every file matched by its DECLARED inputs and outputs (`task-io.ts`) —
 *   path and content, sorted, so the order a glob walks in does not matter;
 * - the package.json command line of the check and of the writer;
 * - the source of every script those commands run, plus every module those
 *   scripts import by a relative path, transitively;
 * - `bun.lock`, so a dependency bump invalidates everything;
 * - when the declaration names {@link TRACKED}, the whole working tree as
 *   version control sees it — for the scripts that walk every instance.
 *
 * What it does NOT see, and why that is acceptable only because every entry in
 * `task-io.ts` was read first: files outside the declaration that the script
 * reads anyway, ignored files, environment variables, the clock, the network,
 * and modules a script SPAWNS rather than imports (declare those, or use
 * {@link TRACKED}).
 *
 * ## "Could not determine" is never "clean"
 *
 * Every way of not knowing returns `{ undetermined: reason }`, and the caller
 * RUNS the pair. Specifically:
 *
 * - the pair has no input declaration (most pairs — the declarations start with
 *   the slowest ones);
 * - a declared input or output glob matches **no file** — a declaration over
 *   nothing would make the fingerprint constant, which is the vacuous pass this
 *   repository refuses everywhere else;
 * - a command does not resolve to script files this module can read (a binary
 *   such as `tsc`, an inline shell expression);
 * - an imported module uses a NON-LITERAL dynamic import, whose target cannot
 *   be followed.
 *
 * ## The cache is local, never committed, and off in CI
 *
 * It lives at `build/regen-cache/input-hashes.json`, and `build/` is
 * git-ignored. A hash is recorded only for a pair that ended `current` or
 * `regenerated` in a run that reached its fixed point — a pair that was
 * skipped keeps the hash it had. `CI` set in the environment disables it, as
 * does `--no-cache`, so CI asks every pair exactly as before.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

/** Where the cache lives, relative to the repository root. `build/` is git-ignored. */
export const CACHE_FILE = join("build", "regen-cache", "input-hashes.json");

/** Bump to invalidate every recorded hash when the fingerprint's recipe changes. */
export const RECIPE_VERSION = 1;

export type Fingerprint = { hash: string; files: number; wholeTree?: boolean } | { undetermined: string };

/** What a pair declares about itself, in `task-io.ts`. */
export interface PairIO {
  inputs?: readonly string[] | undefined;
  outputs?: readonly string[] | undefined;
}

/**
 * The script files a package.json command runs, following `bun run <script>`.
 *
 * Returns `undefined` when any segment of the command runs something that is
 * not a readable script file — that is could-not-determine, not "no sources".
 */
export function entryFiles(
  root: string,
  scripts: Readonly<Record<string, string>>,
  script: string,
  seen: Set<string> = new Set(),
): string[] | undefined {
  if (seen.has(script)) return [];
  seen.add(script);
  const command = scripts[script];
  if (command === undefined) return undefined;
  const out: string[] = [];
  for (const segment of command.split(/&&|\|\||;/)) {
    const tokens = segment.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    let found = false;
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]!.replace(/^["']|["']$/g, "");
      if (/\.(m?[jt]s|py|sh)$/.test(t) && existsSync(join(root, t))) {
        out.push(t);
        found = true;
      } else if (t === "run" && tokens[i - 1] === "bun" && tokens[i + 1] !== undefined) {
        const next = tokens[i + 1]!;
        if (scripts[next] !== undefined) {
          const nested = entryFiles(root, scripts, next, seen);
          if (nested === undefined) return undefined;
          out.push(...nested);
          found = true;
          i++;
        }
      }
    }
    if (!found) return undefined;
  }
  return out;
}

const IMPORT_RE =
  /(?:^|[^\w$.])(?:import|export)\s[^'"`;]*?from\s*["']([^"']+)["']|(?:^|[^\w$.])import\s*["']([^"']+)["']|(?:import|require)\s*\(\s*["']([^"']+)["']\s*\)/g;
const DYNAMIC_NONLITERAL_RE = /(?:^|[^\w$.])import\s*\(\s*(?!["'])[^)\s]/m;

/**
 * Source with comments that START A LINE removed — `/* … *\/` blocks and `//`
 * lines — so an `import("./x")` written in a docblock is not followed.
 * Deliberately not a tokenizer, and deliberately line-anchored: a `/*` inside a
 * string such as `"src/**\/*.md"` never starts a line, so it cannot swallow the
 * code after it. A comment that survives can only ADD an edge or an
 * undetermined — never hide a real import.
 */
export function stripComments(text: string): string {
  return text.replace(/^\s*\/\*[\s\S]*?\*\//gm, "").replace(/^\s*\/\/.*$/gm, "");
}

function resolveModule(fromFile: string, spec: string): string | undefined {
  const base = resolve(dirname(fromFile), spec);
  const candidates = [
    base,
    base.replace(/\.js$/, ".ts"),
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    join(base, "index.ts"),
    join(base, "index.js"),
  ];
  for (const c of candidates) {
    try {
      if (statSync(c).isFile()) return c;
    } catch {
      /* try the next */
    }
  }
  return undefined;
}

/**
 * Every source file reachable from `entries` by RELATIVE imports, repo-relative
 * and sorted. Bare specifiers (packages) are covered by `bun.lock` instead.
 */
export function sourceClosure(root: string, entries: readonly string[]): { files: string[] } | { undetermined: string } {
  const seen = new Set<string>();
  const stack = entries.map((e) => resolve(root, e));
  while (stack.length > 0) {
    const file = stack.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    if (!/\.(m?[jt]sx?)$/.test(file)) continue;
    const text = stripComments(readFileSync(file, "utf-8"));
    if (DYNAMIC_NONLITERAL_RE.test(text)) {
      return { undetermined: `${relative(root, file)} has a non-literal dynamic import` };
    }
    for (const m of text.matchAll(IMPORT_RE)) {
      const spec = m[1] ?? m[2] ?? m[3];
      if (spec === undefined || !spec.startsWith(".")) continue;
      const target = resolveModule(file, spec);
      // An import that does not resolve is a module Bun would fail to load;
      // the script will fail when run, so running it is the right answer.
      if (target === undefined) return { undetermined: `${relative(root, file)} imports unresolvable ${spec}` };
      stack.push(target);
    }
  }
  return { files: [...seen].map((f) => relative(root, f)).sort() };
}

/** Expand declared globs to repo-relative files, sorted. A glob matching nothing is reported. */
export function expandGlobs(root: string, globs: readonly string[]): { files: string[] } | { undetermined: string } {
  const files = new Set<string>();
  for (const g of globs) {
    let hits = 0;
    if (!/[*?[{]/.test(g)) {
      // A plain path: a file, or a directory meaning everything under it.
      const abs = join(root, g);
      if (!existsSync(abs)) return { undetermined: `declared path ${g} does not exist` };
      if (statSync(abs).isFile()) {
        files.add(g);
        continue;
      }
      return expandGlobs(root, [...globs.filter((x) => x !== g), `${g.replace(/\/$/, "")}/**/*`]);
    }
    for (const f of new Bun.Glob(g).scanSync({ cwd: root, onlyFiles: true, dot: true })) {
      if (/(^|\/)(node_modules|\.git)\//.test(f)) continue;
      files.add(f);
      hits++;
    }
    if (hits === 0) return { undetermined: `declared glob ${g} matches no file` };
  }
  return { files: [...files].sort() };
}

/**
 * The input token that means "the whole working tree as version control sees
 * it": every tracked file's content and every untracked, non-ignored file's
 * content. For scripts that walk every instance, skill and bean — declaring a
 * narrower list for those would be a guess, and a guess that misses a file is
 * a false skip.
 */
export const TRACKED = "{tracked}";

/**
 * A digest of the working tree's tracked and untracked-but-not-ignored files.
 *
 * Cheap because unmodified tracked files are identified by the blob id the
 * index already holds; only files that differ from the index, and untracked
 * ones, are read and hashed. Submodules appear as their recorded commit; a
 * submodule with changes in its own tree cannot be hashed from here, so it
 * makes the digest UNDETERMINED rather than silently omitted.
 */
export function trackedTreeDigest(root: string, digests: FileDigests): { hash: string } | { undetermined: string } {
  const git = (args: string[]): string | undefined => {
    const r = Bun.spawnSync(["git", ...args], { cwd: root, stdout: "pipe", stderr: "pipe" });
    return r.exitCode === 0 ? r.stdout.toString() : undefined;
  };
  const staged = git(["ls-files", "-s", "-z"]);
  const modified = git(["ls-files", "-m", "-z"]);
  const deleted = git(["ls-files", "-d", "-z"]);
  const untracked = git(["ls-files", "-o", "--exclude-standard", "-z"]);
  if (staged === undefined || modified === undefined || deleted === undefined || untracked === undefined) {
    return { undetermined: "could not list the working tree" };
  }
  const split = (s: string) => s.split("\0").filter(Boolean);
  const gone = new Set(split(deleted));
  const changed = new Set(split(modified).filter((p) => !gone.has(p)));
  const h = createHash("sha256");
  for (const line of split(staged)) {
    // "<mode> <blob> <stage>\t<path>"
    const tab = line.indexOf("\t");
    const path = line.slice(tab + 1);
    const [mode, blob] = line.slice(0, tab).split(" ");
    if (gone.has(path)) {
      h.update(`gone ${path}\n`);
    } else if (changed.has(path)) {
      if (mode === "160000") return { undetermined: `submodule ${path} has changes in its own tree` };
      try {
        h.update(`file ${path} ${digests.digest(path)}\n`);
      } catch {
        return { undetermined: `could not read ${path}` };
      }
    } else {
      h.update(`blob ${path} ${blob}\n`);
    }
  }
  for (const path of split(untracked).sort()) {
    try {
      h.update(`new ${path} ${digests.digest(path)}\n`);
    } catch {
      return { undetermined: `could not read untracked ${path}` };
    }
  }
  return { hash: h.digest("hex") };
}

/** Memoised per-file content digests, keyed by path + size + mtime. */
export class FileDigests {
  private memo = new Map<string, { key: string; digest: string }>();
  /** The tracked-tree digest, computed at most once per instance. */
  tree: ReturnType<typeof trackedTreeDigest> | undefined;
  constructor(private root: string) {}
  digest(rel: string): string {
    const abs = join(this.root, rel);
    const st = statSync(abs);
    const key = `${st.size}:${st.mtimeMs}`;
    const hit = this.memo.get(rel);
    if (hit !== undefined && hit.key === key) return hit.digest;
    const digest = createHash("sha256").update(readFileSync(abs)).digest("hex");
    this.memo.set(rel, { key, digest });
    return digest;
  }
  /** Forget everything — call after writers ran, since mtimes can tie within a tick. */
  clear(): void {
    this.memo.clear();
    this.tree = undefined;
  }
}

/**
 * The fingerprint of one pair, or why it could not be computed.
 *
 * `scriptNames` are the npm scripts the pair runs (check, and writer if any).
 */
export function fingerprint(
  root: string,
  scripts: Readonly<Record<string, string>>,
  scriptNames: readonly string[],
  io: PairIO | undefined,
  digests: FileDigests = new FileDigests(root),
): Fingerprint {
  if (io?.inputs === undefined) return { undetermined: "no input declaration in task-io.ts" };
  const wholeTree = io.inputs.includes(TRACKED);
  let tree: { hash: string } | undefined;
  if (wholeTree) {
    digests.tree ??= trackedTreeDigest(root, digests);
    if ("undetermined" in digests.tree) return digests.tree;
    tree = digests.tree;
  }
  const globs = [...io.inputs.filter((g) => g !== TRACKED), ...(io.outputs ?? [])];
  const declared = expandGlobs(root, globs);
  if ("undetermined" in declared) return declared;

  const entries: string[] = [];
  for (const s of scriptNames) {
    const e = entryFiles(root, scripts, s);
    if (e === undefined) return { undetermined: `\`${s}\` does not resolve to script files` };
    entries.push(...e);
  }
  // Under TRACKED every script source is already in the tree digest — including
  // modules loaded by a computed path and scripts that are spawned rather than
  // imported, which the closure cannot follow. The entries were still resolved
  // above, so a command that runs a binary is undetermined either way.
  const closure = wholeTree ? { files: [] as string[] } : sourceClosure(root, entries);
  if ("undetermined" in closure) return closure;

  const h = createHash("sha256");
  h.update(`recipe ${RECIPE_VERSION}\n`);
  for (const s of scriptNames) h.update(`script ${s} = ${scripts[s]}\n`);
  h.update(`io ${JSON.stringify(io)}\n`);
  if (tree !== undefined) h.update(`tree ${tree.hash}\n`);
  const all = new Set([...declared.files, ...closure.files]);
  if (existsSync(join(root, "bun.lock"))) all.add("bun.lock");
  const sorted = [...all].sort();
  for (const f of sorted) h.update(`${f}\0${digests.digest(f)}\n`);
  return { hash: h.digest("hex"), files: sorted.length, wholeTree: tree !== undefined };
}

export interface HashCache {
  version: number;
  pairs: Record<string, string>;
}

/** Read the cache; anything unreadable is an empty cache, which makes every pair run. */
export function loadCache(root: string): HashCache {
  try {
    const raw = JSON.parse(readFileSync(join(root, CACHE_FILE), "utf-8")) as HashCache;
    if (raw.version === RECIPE_VERSION && typeof raw.pairs === "object" && raw.pairs !== null) return raw;
  } catch {
    /* absent or corrupt — start empty */
  }
  return { version: RECIPE_VERSION, pairs: {} };
}

export function saveCache(root: string, cache: HashCache): void {
  const path = join(root, CACHE_FILE);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(cache, null, 2)}\n`);
}

/** Whether the cache may be used at all in this environment. */
export function cacheEnabled(argv: readonly string[], env: Readonly<Record<string, string | undefined>>): boolean {
  if (argv.includes("--no-cache")) return false;
  const ci = env.CI;
  if (ci !== undefined && ci !== "" && ci !== "0" && ci.toLowerCase() !== "false") return false;
  return true;
}

/** The decision for one pair, with the reason `--explain` prints. */
export type SkipDecision = { skip: true; why: string } | { skip: false; why: string };

function scope(fp: { files: number; wholeTree?: boolean }): string {
  return fp.wholeTree ? "the whole working tree" : `${fp.files} files`;
}

export function decide(cache: HashCache | undefined, key: string, fp: Fingerprint): SkipDecision {
  if (cache === undefined) return { skip: false, why: "cache disabled (--no-cache or CI)" };
  if ("undetermined" in fp) return { skip: false, why: `inputs could not be determined: ${fp.undetermined}` };
  const prev = cache.pairs[key];
  if (prev === undefined) return { skip: false, why: `no hash recorded at a previous green run (${scope(fp)})` };
  if (prev !== fp.hash) return { skip: false, why: `inputs changed since the last green run (${scope(fp)})` };
  return { skip: true, why: `inputs unchanged since the last green run (${scope(fp)})` };
}
