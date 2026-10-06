/**
 * Input-hash staleness skipping for `bun run regen` and `bun run gates` —
 * beans `xpcu`, `f017`.
 *
 * @module scripts/input-hash
 * @graphNode none — a local-only cache helper for `regen-after-merge.ts` and `gates.ts`
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
 *   version control sees it — for the scripts that walk every instance;
 * - for every `--against <ref>` a command passes, the IDENTITY of the baseline
 *   that ref resolves to on the `qa-reports` branch (see {@link againstRefsOf}).
 *
 * ## A baseline is an input that is not in the tree
 *
 * Eight gates run `--check --against main`: they judge the fresh run against
 * the latest `main` entry on the `qa-reports` branch and fail only on what is
 * NEW against it. That entry moves every time `main` publishes, while nothing
 * in the working tree changes — so a fingerprint over files alone would skip a
 * pair whose verdict the moved baseline could change. The baseline's identity
 * (the resolved entry key and its verified payload tree) is therefore hashed
 * like any other input, and a baseline that cannot be resolved — offline, no
 * branch, a corrupt entry — is undetermined, so the pair runs.
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
 * ## Two kinds of entry, one file
 *
 * `pairs` is regen's: a verify/write pair (check AND writer) at a green run.
 * `checks` is a CHECK SCRIPT ALONE, recorded from a run of that script that
 * exited 0 with its inputs unmoved across the run ({@link recordCheckRun}) —
 * by `gates`, or by `regen` asking the check. Both commands read it, so the
 * `gates` run that follows a `regen` on the same tree does not ask again what
 * `regen` just asked (bean `f017`), and a gate listed twice in the workflow
 * is asked once.
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
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { readQaManifest, type QaStoreOptions } from "./qa-store.ts";
import { auditClosure, SiteMemo } from "./input-sites.ts";

/** Where the cache lives, relative to the repository root. `build/` is git-ignored. */
export const CACHE_FILE = join("build", "regen-cache", "input-hashes.json");

/** Bump to invalidate every recorded hash when the fingerprint's recipe changes. */
export const RECIPE_VERSION = 3;

export type Fingerprint = { hash: string; files: number; wholeTree?: boolean } | { undetermined: string };

/**
 * Resolve an `--against` ref to the identity of the baseline it names, or say
 * why it could not. Injected so tests need no `qa-reports` branch; the real
 * one is {@link qaBaselineIdentity}.
 */
export type BaselineResolver = (ref: string) => { id: string } | { undetermined: string };

/**
 * The real {@link BaselineResolver}: the `qa-reports` entry `ref` resolves to,
 * as `<key> <payloadTree>` — the same identity `qa-store` verifies an entry
 * by, so two reads that hash alike read byte-identical baselines. Not the
 * branch TIP: a tip moves on every PR publish, which would invalidate every
 * `--against main` pair for entries it never reads.
 *
 * Memoised per resolver, `unknown` included: one regen run asks the same ref
 * for several pairs, and an unreachable remote should cost one timeout, not
 * eight. Any state but a hit — `miss`, `corrupt`, `unknown` — is undetermined.
 */
export function qaBaselineIdentity(opts: QaStoreOptions = {}): BaselineResolver {
  const memo = new Map<string, { id: string } | { undetermined: string }>();
  return (ref) => {
    const hit = memo.get(ref);
    if (hit !== undefined) return hit;
    let out: { id: string } | { undetermined: string };
    if (ref === "") {
      out = { undetermined: "no ref given" };
    } else {
      try {
        const m = readQaManifest(ref, opts);
        out = m.state === "hit" ? { id: `${m.key} ${m.manifest.payloadTree}` } : { undetermined: `${m.state}: ${m.reason}` };
      } catch (e) {
        out = { undetermined: (e as Error).message };
      }
    }
    memo.set(ref, out);
    return out;
  };
}

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

/**
 * Every `--against <ref>` (or `--against=<ref>`) the command of `script` passes,
 * following `bun run <script>` the way {@link entryFiles} does. Sorted and
 * de-duplicated. A bare `--against` with no ref is returned as `""`, which the
 * resolver cannot resolve — the script itself would refuse it, so running it
 * is the right answer.
 */
export function againstRefsOf(
  scripts: Readonly<Record<string, string>>,
  script: string,
  seen: Set<string> = new Set(),
): string[] {
  if (seen.has(script)) return [];
  seen.add(script);
  const command = scripts[script];
  if (command === undefined) return [];
  const refs = new Set<string>();
  const tokens = command.split(/\s+/).filter(Boolean).map((t) => t.replace(/^["']|["']$/g, ""));
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (t === "--against") {
      const next = tokens[i + 1];
      refs.add(next === undefined || next.startsWith("--") || /^(&&|\|\||;)$/.test(next) ? "" : next);
    } else if (t.startsWith("--against=")) {
      refs.add(t.slice("--against=".length));
    } else if (t === "run" && tokens[i - 1] === "bun" && scripts[tokens[i + 1] ?? ""] !== undefined) {
      for (const r of againstRefsOf(scripts, tokens[i + 1]!, seen)) refs.add(r);
    }
  }
  return [...refs].sort();
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
  const ignored = git(["ls-files", "-o", "-i", "--exclude-standard", "--directory", "-z"]);
  if (ignored === undefined) return { undetermined: "could not list the ignored files" };
  for (const entry of split(ignored).sort()) {
    const r = ignoredDigest(root, entry, h);
    if (r !== undefined) return { undetermined: r };
  }
  return { hash: h.digest("hex") };
}

/**
 * Ignored files are part of "the whole working tree" too: a check that walks a
 * directory with `readdirSync` or `Bun.Glob` reads them whether or not git
 * does — the shape of the `:pages:check` that passed locally on an untracked
 * loader and failed on a clean checkout. So each one's path, size and mtime is
 * hashed (no content read: a touched file costs a skip, never a false one).
 *
 * Left out, each for a stated reason:
 * - `node_modules/` at any depth — its content is what `bun.lock` pins, and
 *   `bun.lock` is in every fingerprint;
 * - the input-hash cache itself, which every run rewrites;
 * - a directory holding its own `.git` — another checkout (an agent worktree
 *   under `.claude/worktrees/`), which is a different repository's tree.
 */
function ignoredDigest(root: string, entry: string, h: ReturnType<typeof createHash>): string | undefined {
  const rel = entry.replace(/\/$/, "");
  if (/(^|\/)node_modules$/.test(rel) || rel === dirname(CACHE_FILE) || rel === CACHE_FILE) return undefined;
  const walk = (r: string): string | undefined => {
    let st;
    try {
      st = statSync(join(root, r));
    } catch {
      return undefined; // gone between the listing and the stat: nothing to read
    }
    if (!st.isDirectory()) {
      if (r !== CACHE_FILE) h.update(`ignored ${r} ${st.size}:${st.mtimeMs}\n`);
      return undefined;
    }
    if (/(^|\/)node_modules$/.test(r) || r === dirname(CACHE_FILE) || existsSync(join(root, r, ".git"))) return undefined;
    let names: string[];
    try {
      names = readdirSync(join(root, r)).sort();
    } catch {
      return `could not list ignored ${r}`;
    }
    for (const n of names) {
      const bad = walk(`${r}/${n}`);
      if (bad !== undefined) return bad;
    }
    return undefined;
  };
  return walk(rel);
}

/**
 * What a `head` / `refs` site reads, named by commit id. A commit id is a hash
 * of its whole history, so "HEAD is the same commit" is "every `git log` from
 * HEAD answers the same" — except across a SHALLOW boundary, which `git fetch
 * --deepen` moves without moving HEAD; its file is hashed too. A ref that does
 * not resolve is hashed as missing, which is itself an answer the check sees.
 */
function historyLine(root: string, head: boolean, refs: readonly string[]): { line: string } | { undetermined: string } {
  const git = (args: string[]) => Bun.spawnSync(["git", ...args], { cwd: root, stdout: "pipe", stderr: "pipe" });
  let line = "";
  const names = [...(head ? ["HEAD"] : []), ...refs];
  for (const name of names) {
    const r = git(["rev-parse", "--verify", "--quiet", `${name}^{commit}`]);
    line += `ref ${name} = ${r.exitCode === 0 ? r.stdout.toString().trim() : "missing"}\n`;
  }
  const shallowPath = git(["rev-parse", "--git-path", "shallow"]);
  if (shallowPath.exitCode !== 0) return { undetermined: "could not locate the shallow file" };
  const sp = resolve(root, shallowPath.stdout.toString().trim());
  line += `shallow ${existsSync(sp) ? createHash("sha256").update(readFileSync(sp)).digest("hex") : "none"}\n`;
  return { line };
}

const RUNTIME_ENV = ["BUN_OPTIONS", "NODE_OPTIONS", "GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "TZ", "LANG", "LC_ALL"] as const;

/** `bun` and `git` versions — a tool upgrade can change an answer with no file changing. */
let toolVersions: string | undefined;
function toolsLine(): string {
  if (toolVersions === undefined) {
    const git = Bun.spawnSync(["git", "--version"], { stdout: "pipe", stderr: "pipe" });
    // The variables that change how bun or git behave for EVERY script, whatever it reads itself.
    const runtimeEnv = RUNTIME_ENV.map((n) => `${n}=${JSON.stringify(process.env[n] ?? null)}`).join(" ");
    toolVersions = `tools bun ${Bun.version} ${Bun.revision} ${git.exitCode === 0 ? git.stdout.toString().trim() : "git?"} ${runtimeEnv}\n`;
  }
  return toolVersions;
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
  /** Per-file input-site scans (`input-sites.ts`), shared by every fingerprint of a run. */
  readonly sites = new SiteMemo();
  /** Forget everything — call after writers ran, since mtimes can tie within a tick. */
  clear(): void {
    this.memo.clear();
    this.sites.clear();
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
  baseline?: BaselineResolver,
): Fingerprint {
  if (io?.inputs === undefined) return { undetermined: "no input declaration in task-io.ts" };
  const seenScripts = new Set<string>();
  const refs = [...new Set(scriptNames.flatMap((s) => againstRefsOf(scripts, s, seenScripts)))].sort();
  const baselines: string[] = [];
  for (const ref of refs) {
    if (baseline === undefined) return { undetermined: `\`--against ${ref}\` names a baseline and no resolver was given` };
    const b = baseline(ref);
    if ("undetermined" in b) return { undetermined: `baseline --against ${ref || "(no ref)"}: ${b.undetermined}` };
    baselines.push(`against ${ref} = ${b.id}\n`);
  }
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
  // Every source the check runs is AUDITED (`input-sites.ts`): a line that can
  // read the environment, the network, the clock, git history or a computed
  // module must carry a reviewed, pinned annotation saying what it reads, or
  // the fingerprint is undetermined. Under TRACKED the files themselves are
  // already in the tree digest; the audit is what makes "the tree" the whole
  // input. A non-TypeScript script cannot be audited, so it is undetermined.
  const foreign = entries.find((e) => !/\.(m?[jt]sx?)$/.test(e));
  if (foreign !== undefined) return { undetermined: `${foreign} is not TypeScript/JavaScript, so its reads cannot be audited` };
  const audit = auditClosure(root, entries, digests.sites);
  if ("undetermined" in audit) return audit;
  if (audit.needsTree && !wholeTree) {
    return { undetermined: "a source reads the working tree through git (`tree` site), which only a {tracked} declaration covers" };
  }
  if (audit.needsBaseline && refs.length === 0) {
    return { undetermined: "a source reads the qa-reports store, and the command names no --against baseline whose identity could be hashed" };
  }
  for (const name of audit.envUnset) {
    if ((process.env[name] ?? "") !== "") return { undetermined: `$${name} is set, and names something outside the tree` };
  }
  const closure = { files: wholeTree ? ([] as string[]) : audit.files };

  const h = createHash("sha256");
  h.update(`recipe ${RECIPE_VERSION}\n`);
  h.update(toolsLine());
  for (const name of audit.env) h.update(`env ${name} = ${JSON.stringify(process.env[name] ?? null)}\n`);
  if (audit.needsHead || audit.refs.length > 0) {
    const hist = historyLine(root, audit.needsHead, audit.refs);
    if ("undetermined" in hist) return hist;
    h.update(hist.line);
  }
  for (const s of scriptNames) h.update(`script ${s} = ${scripts[s]}\n`);
  h.update(`io ${JSON.stringify(io)}\n`);
  if (tree !== undefined) h.update(`tree ${tree.hash}\n`);
  for (const b of baselines) h.update(b);
  const all = new Set([...declared.files, ...closure.files]);
  if (existsSync(join(root, "bun.lock"))) all.add("bun.lock");
  const sorted = [...all].sort();
  for (const f of sorted) h.update(`${f}\0${digests.digest(f)}\n`);
  return { hash: h.digest("hex"), files: sorted.length, wholeTree: tree !== undefined };
}

export interface HashCache {
  version: number;
  /** Verify/write PAIR (`regen`'s key, check and writer) → fingerprint at its last green run. */
  pairs: Record<string, string>;
  /**
   * A CHECK SCRIPT ALONE → its fingerprint the last time it was RUN and
   * exited 0, by `regen` or by `gates` (bean `f017`). Shared, so a gate `regen`
   * just asked on this tree is not asked again by the `gates` run that
   * follows it, and vice versa. Absent in a cache written before it existed.
   */
  checks?: Record<string, string>;
}

/** Read the cache; anything unreadable is an empty cache, which makes every pair run. */
export function loadCache(root: string): HashCache {
  try {
    const raw = JSON.parse(readFileSync(join(root, CACHE_FILE), "utf-8")) as HashCache;
    if (raw.version === RECIPE_VERSION && typeof raw.pairs === "object" && raw.pairs !== null) {
      const checks = typeof raw.checks === "object" && raw.checks !== null ? raw.checks : {};
      return { ...raw, checks };
    }
  } catch {
    /* absent or corrupt — start empty */
  }
  return { version: RECIPE_VERSION, pairs: {}, checks: {} };
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

/**
 * The fingerprint of ONE check script — what `gates` runs, and what a `regen`
 * pair's check runs — over the same inputs as {@link fingerprint}, minus any
 * writer. `io` is the script's own declaration (`task-io.ts`); without
 * `inputs` it is undetermined, so the script is always run.
 */
export function checkFingerprint(
  root: string,
  scripts: Readonly<Record<string, string>>,
  script: string,
  io: PairIO | undefined,
  digests: FileDigests = new FileDigests(root),
  baseline?: BaselineResolver,
): Fingerprint {
  return fingerprint(root, scripts, [script], io, digests, baseline);
}

/** Whether a check script may be skipped: its inputs hash to its last recorded pass. */
export function decideCheck(cache: HashCache | undefined, script: string, fp: Fingerprint): SkipDecision {
  if (cache === undefined) return { skip: false, why: "cache disabled (--no-cache or CI)" };
  if ("undetermined" in fp) return { skip: false, why: `inputs could not be determined: ${fp.undetermined}` };
  const prev = cache.checks?.[script];
  if (prev === undefined) return { skip: false, why: `no hash recorded at a previous pass of this check (${scope(fp)})` };
  if (prev !== fp.hash) return { skip: false, why: `inputs changed since this check last passed (${scope(fp)})` };
  return { skip: true, why: `inputs unchanged since this check last passed (${scope(fp)})` };
}

/**
 * Record — or forget — one RUN of a check script, in place.
 *
 * `before` is the fingerprint taken just before it ran and `after` just after
 * (with fresh digests). A hash is recorded only when the run exited 0 AND the
 * two agree: equal fingerprints mean nothing the check reads moved while it was
 * reading, so the pass is a fact about exactly the inputs that hash names. Any
 * other combination — red, undetermined, or inputs that moved underneath it
 * (a writer beside it, a person editing, the check writing its own input) —
 * DELETES the entry, so a later run cannot skip on the strength of it.
 */
export function recordCheckRun(
  cache: HashCache,
  script: string,
  passed: boolean,
  before: Fingerprint,
  after: Fingerprint,
): void {
  cache.checks ??= {};
  if (passed && "hash" in before && "hash" in after && before.hash === after.hash) cache.checks[script] = before.hash;
  else delete cache.checks[script];
}
