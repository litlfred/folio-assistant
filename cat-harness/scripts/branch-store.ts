#!/usr/bin/env bun
/**
 * branch-store — a generic store for a directory whose `storage.keyedBy` is
 * `"tip"`: ONE live copy, kept on its own branch, whose tip IS the current
 * state. Bean `2h76`, arc `fs43` (issue #1850), proposal
 * `docs/proposals/state-branch-2026-10-02.md` §3.2 / §3.4.
 *
 * The owner, 2026-10-02: *"go with cat/cat-harness/todos and
 * cat/cat-harness/beans as their own named sub-graph branches"* — and *"(not
 * all named subgraphs get own branch, especially not semi-static KG
 * content)"*. So the store is one ref per STATE subgraph; skills, schemas and
 * processes stay on `main`.
 *
 * ## The layout it reads and writes
 *
 * ```
 * cat/cat-harness/beans   (orphan; never merged)
 * ├── README.md
 * ├── manifest.json        state-manifest/v1, keyedBy: "tip"
 * └── beans/**             paths mirror the checkout
 * ```
 *
 * The root `manifest.json` is what makes a branch a state branch. A read of a
 * branch without one — or with a foreign `$schema`, or `keyedBy` other than
 * `tip` — is `corrupt`, never a hit: a reader must not take a stray branch's
 * files for the work plan.
 *
 * ## Four read states, and a miss is never empty-clean
 *
 * | state | meaning |
 * |---|---|
 * | hit | the branch verifies and the path is there |
 * | miss | determined absent: no branch, or no such path at the tip |
 * | corrupt | present but unusable: no/foreign manifest, a tree where a file was asked for, unparseable JSON |
 * | unknown | could not determine: the remote or git failed. **Never a pass.** |
 *
 * ## The write path — modelled on `qa-store.ts`, not shared with it
 *
 * Fetch the tip, SPLICE the changed paths into its tree (every other file is
 * carried across by id), `commit-tree -p tip`, push WITHOUT `-f`. On
 * rejection, back off (`waitFor`, the `backoff-sleep.ts` numbers) and rebuild
 * on the new tip — {@link WRITE_ATTEMPTS} attempts. The server's ref lock is
 * the concurrency primitive, so a sibling's write to another file survives.
 *
 * Two writers editing the SAME file is the case a splice alone cannot settle:
 * the second would silently replace the first. A change may therefore carry
 * `expect` — the blob id its author read (or `null`, "must not exist") — and
 * when the tip disagrees the write stops as `conflict` and pushes nothing. The
 * caller re-reads and decides; the store never merges content.
 *
 * `qa-store.ts` (arc 3fva) has the same loop for commit-keyed entries. It is
 * deliberately not refactored onto this module here; whether it adopts this
 * one is 3fva's call.
 *
 * ## Where its git objects live
 *
 * In a PRIVATE bare repository, `<git-common-dir>/branch-store.git` (or
 * `BRANCH_STORE_DIR`), never in the checkout's object store: a `--filter`
 * fetch turns the repository it runs in into a partial clone, and a reader
 * must not do that to a contributor's checkout. The checkout's
 * `http.*.extraheader` (CI's token) is carried in the ENVIRONMENT
 * (`GIT_CONFIG_COUNT`), never in argv.
 *
 * ## Not wired to anything yet
 *
 * No reader or writer of `beans/` or `todos/` uses this module, and no
 * declaration sets `keyedBy: "tip"`: `main` stays authoritative until the
 * steward-run flip on #1850. {@link resolveTipLocation} is what the flip will
 * read.
 *
 * Usage:
 *   bun run cat-harness/scripts/branch-store.ts read --branch B <path>
 *   bun run cat-harness/scripts/branch-store.ts ls   --branch B [<dir>]
 *   bun run cat-harness/scripts/branch-store.ts where --id <directory-id>
 *
 * @module scripts/branch-store
 * @covers beans
 * @covers todos
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { instanceRootsIn, resolveDirectories } from "../schemas/cat-harness.js";
// `readDeclaration` throws on the `folio` kind unless core has registered it —
// the same side-effect import `qa-store.ts` carries, same reason.
import "../schemas/folio-graph-kind.js";
import { waitFor } from "../src/core/retry.js";
import { PUSH_BASE_MS, PUSH_CAP_MS } from "./backoff-sleep.js";

// ── Constants ────────────────────────────────────────────────────────────

export const MANIFEST_FILE = "manifest.json";
export const MANIFEST_SCHEMA = "state-manifest/v1";
/** Root files a write may not touch: they describe the branch, not the subgraph. */
export const RESERVED = new Set([MANIFEST_FILE, "README.md"]);
export const WRITE_ATTEMPTS = 3;
/** The identity the seed branches were written as. */
export const STATE_BOT = { name: "folio-state-bot", email: "folio-state-bot@users.noreply.github.com" };

// ── Types ────────────────────────────────────────────────────────────────

export type NotHit = { state: "miss" | "corrupt" | "unknown"; reason: string };

export interface Hit {
  state: "hit";
  /** The branch actually read — the first candidate the remote has. */
  branch: string;
  tip: string;
}

export type FileRead = (Hit & { path: string; blob: string; text: string }) | NotHit;
export type JsonRead<T = unknown> = (Hit & { path: string; blob: string; value: T }) | NotHit;
export type DirRead = (Hit & { path: string; entries: Array<{ name: string; type: "blob" | "tree"; sha: string }> }) | NotHit;
export type TreeRead = (Hit & { prefix: string; files: Map<string, string> }) | NotHit;

/**
 * One change to splice onto the tip. `content: null` removes the path.
 * `expect`, when given, is the blob id the author read (`null`: the path must
 * not exist); a tip that disagrees stops the write as `conflict`.
 */
export interface Change {
  path: string;
  content: string | null;
  expect?: string | null;
}

export type WriteState = "pushed" | "unchanged" | "conflict" | "absent" | "failed";
export interface WriteResult {
  state: WriteState;
  reason: string;
  branch: string;
  commit?: string;
  attempts: number;
  /** For `conflict`: each path whose tip blob differed from `expect`. */
  conflicts?: Array<{ path: string; expected: string | null; actual: string | null }>;
}

export interface BranchStoreOptions {
  /** The checkout root. Default: `git rev-parse --show-toplevel` from cwd. */
  repoRoot?: string;
  /** The remote URL or path. Default: env `BRANCH_STORE_REMOTE`, else the checkout's `origin`. */
  remote?: string;
  /** The private bare repository. Default: env `BRANCH_STORE_DIR`, else `<git-common-dir>/branch-store.git`. */
  storeDir?: string;
  /** Injected for tests; default sleeps the backoff synchronously. */
  sleep?: (ms: number) => void;
  /** Called after the tree is built and before each push — tests widen the race window with it. */
  beforePush?: (attempt: number) => void;
  /** Progress lines; default stderr. */
  log?: (line: string) => void;
}

/** A malformed question — never folded into miss. */
export class BranchStoreUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BranchStoreUsageError";
  }
}

// ── Location (the declaration) ───────────────────────────────────────────

export interface TipLocation {
  id: string;
  /** Repository-relative, no trailing slash — the path on the branch too. */
  path: string;
  branch: string;
}

/**
 * The declared directory `id` whose `storage.keyedBy` is `tip`, across the
 * checkout's instances. Refuses a directory that is undeclared, unstored, or
 * commit-keyed, rather than guessing a branch: the default for "no
 * declaration" is `main`, which is not this store.
 */
/**
 * Every declared directory that is kept at a branch tip, across the instances
 * in this checkout.
 *
 * The companion to {@link resolveTipLocation}: that answers "which branch for
 * THIS id", this answers "is anything kept on a branch at all". The
 * session-start mount needs the second question, because the honest answer
 * today is "nothing is" — no declaration sets `storage` yet — and a mount that
 * treated that as a failure would fail every session over a branch that
 * nothing reads.
 *
 * Returns them sorted by id so a caller's output is stable.
 */
export function tipLocations(repoRoot: string = gitTopLevel()): TipLocation[] {
  const out: TipLocation[] = [];
  for (const inst of instanceRootsIn(repoRoot)) {
    for (const d of resolveDirectories([{ name: "(local)", root: inst, own: true }])) {
      if (d.storage?.keyedBy !== "tip") continue;
      const path = relative(repoRoot, d.absPath).split("\\").join("/").replace(/\/+$/, "");
      if (!out.some((o) => o.id === d.id)) out.push({ id: d.id, path, branch: d.storage.branch });
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

export function resolveTipLocation(id: string, repoRoot: string = gitTopLevel()): TipLocation {
  for (const inst of instanceRootsIn(repoRoot)) {
    for (const d of resolveDirectories([{ name: "(local)", root: inst, own: true }])) {
      if (d.id !== id) continue;
      if (!d.storage) throw new BranchStoreUsageError(`directory ${id} declares no storage; it lives on main`);
      if (d.storage.keyedBy !== "tip") throw new BranchStoreUsageError(`directory ${id} is keyed by ${d.storage.keyedBy}, not tip`);
      const path = relative(repoRoot, d.absPath).split("\\").join("/").replace(/\/+$/, "");
      return { id, path, branch: d.storage.branch };
    }
  }
  throw new BranchStoreUsageError(`no declared directory has id ${id}`);
}

// ── Git plumbing ─────────────────────────────────────────────────────────

export interface GitResult {
  status: number;
  stdout: Buffer;
  stderr: string;
}
export interface GitOpts {
  input?: string | Buffer;
  env?: Record<string, string>;
  /** `qa-store`'s plumbing passes this; kept here so one {@link TreeStore} serves both. */
  cwd?: string;
}
export interface TreeEntry {
  mode: string;
  type: string;
  sha: string;
  name: string;
}

function gitTopLevel(cwd = process.cwd()): string {
  const r = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf-8" });
  if (r.status !== 0) throw new BranchStoreUsageError(`not inside a git checkout: ${cwd}`);
  return r.stdout.trim();
}

/** The checkout's own `http.*.extraheader` lines, carried in env (never argv). */
function authEnvFrom(repoRoot: string): Record<string, string> {
  const r = spawnSync("git", ["config", "--get-regexp", "^http\\..*extraheader$"], { cwd: repoRoot, encoding: "utf-8" });
  if (r.status !== 0 || !r.stdout.trim()) return {};
  const env: Record<string, string> = {};
  const lines = r.stdout.trim().split("\n");
  const base = Number(process.env.GIT_CONFIG_COUNT ?? 0) || 0;
  lines.forEach((line, i) => {
    const sp = line.indexOf(" ");
    env[`GIT_CONFIG_KEY_${base + i}`] = line.slice(0, sp);
    env[`GIT_CONFIG_VALUE_${base + i}`] = line.slice(sp + 1);
  });
  env.GIT_CONFIG_COUNT = String(base + lines.length);
  return env;
}

/** Split and check a branch-relative path. Absolute, `..`, and empty segments are usage errors. */
function segments(path: string): string[] {
  const segs = path.split("/").filter((s) => s !== "" && s !== ".");
  if (path.startsWith("/") || segs.some((s) => s === "..")) throw new BranchStoreUsageError(`not a branch-relative path: ${path}`);
  return segs;
}

/** The tip of the first candidate branch the remote has. */
export type Tip = { state: "ok"; branch: string; tip: string } | { state: "absent"; branch: string } | { state: "unknown"; branch: string; reason: string };

/**
 * A tip-keyed branch store: a private bare repository, a remote, and the
 * branch names to look under (the first is canonical; later ones are earlier
 * names the remote may still carry).
 */
/**
 * The git-plumbing half of a branch store, shared by every keying.
 *
 * ## Why this is one class and not two
 *
 * `qa-store.ts` (arc `3fva`, commit-keyed) and {@link BranchStore} (tip-keyed)
 * both reach a branch the same way: fetch its tip trees-only, walk and splice
 * trees by id, hydrate blobs in ONE round trip, `commit-tree`, push without
 * `-f`. Bean `2h76` part 1 is to have one copy of that, and this is it.
 *
 * Measured before extracting, method by method: `mktree` and `setPath` were
 * byte-identical across the two files but for a `private` modifier, and `must`
 * was identical outright. The rest differed only in three axes, which are
 * therefore the constructor's parameters rather than forks of the code:
 *
 *   identity      which bot authors the commit (`QA_BOT` / `STATE_BOT`)
 *   refNamespace  `refs/<ns>/…`, so concurrent readers never contend for a lock
 *   branches      ONE branch, or ordered CANDIDATES for a rename in flight
 *
 * The candidate list is the one real behavioural difference and it is a
 * superset: a single-branch caller passes `[branch]` and
 * {@link TreeStore.fetchTip} resolves it to itself. That is why the unified
 * `Tip` carries `branch` — a commit-keyed caller ignores it, a migrating one
 * needs to know which name answered.
 *
 * Plumbing is PUBLIC here, where `BranchStore` had kept its copy private. A
 * private method is right for one consumer; this module now has three —
 * `qa-store`, `BranchStore`, and `9c7h`'s `fsh-guts` — and a store they cannot
 * call is one they would each re-copy, which is the duplication this removes.
 */
export class TreeStore {
  readonly env: NodeJS.ProcessEnv;
  readonly log: (line: string) => void;
  /** Ordered names to try; the tip resolves to the first that EXISTS. */
  readonly candidates: readonly string[];
  /** The name writes land on — whichever answered the last {@link fetchTip}, else the first candidate. */
  branch: string;
  private seq = 0;
  private readonly refNamespace: string;

  constructor(
    readonly dir: string,
    readonly remote: string,
    branches: readonly string[],
    authEnv: Record<string, string>,
    opts: { identity: { name: string; email: string }; refNamespace: string; log?: (line: string) => void },
  ) {
    if (branches.length === 0) throw new Error("TreeStore needs at least one branch name");
    this.candidates = [...branches];
    this.branch = this.candidates[0]!;
    this.refNamespace = opts.refNamespace;
    this.log = opts.log ?? ((l) => console.error(l));
    this.env = {
      ...process.env,
      ...authEnv,
      GIT_TERMINAL_PROMPT: "0",
      GIT_AUTHOR_NAME: opts.identity.name,
      GIT_AUTHOR_EMAIL: opts.identity.email,
      GIT_COMMITTER_NAME: opts.identity.name,
      GIT_COMMITTER_EMAIL: opts.identity.email,
    };
    // A bare store of our own: the caller's GIT_* must not reach it.
    delete this.env.GIT_DIR;
    delete this.env.GIT_WORK_TREE;
    delete this.env.GIT_INDEX_FILE;
    if (!existsSync(join(dir, "HEAD"))) {
      const init = spawnSync("git", ["init", "-q", "--bare", dir], { env: this.env });
      if (init.status !== 0) throw new Error(`git init --bare ${dir} failed: ${init.stderr?.toString()}`);
    }
    const cur = this.git(["config", "--get", "remote.origin.url"]);
    if (cur.status !== 0) this.must(["remote", "add", "origin", remote]);
    else if (cur.stdout.toString().trim() !== remote) this.must(["remote", "set-url", "origin", remote]);
  }

  git(args: string[], opts: GitOpts = {}): GitResult {
    const r = spawnSync("git", [`--git-dir=${this.dir}`, ...args], {
      cwd: opts.cwd,
      env: { ...this.env, ...opts.env },
      input: opts.input,
      maxBuffer: 1 << 30,
    });
    return {
      status: r.status ?? (r.error ? 128 : 0),
      stdout: (r.stdout as Buffer | null) ?? Buffer.alloc(0),
      stderr: (r.stderr as Buffer | null)?.toString() ?? String(r.error ?? ""),
    };
  }

  must(args: string[], opts: GitOpts = {}): string {
    const r = this.git(args, opts);
    if (r.status !== 0) throw new Error(`git ${args.join(" ")} → ${r.status}: ${r.stderr.trim()}`);
    return r.stdout.toString();
  }

  /** A ref name unique to this process and call, so concurrent readers never contend for one lock. */
  privateRef(kind: string): string {
    return `refs/${this.refNamespace}/${kind}/${process.pid}-${++this.seq}`;
  }

  /**
   * The resolved tip, trees only. `absent` is a DETERMINED absence (ls-remote
   * answered, and named none of the candidates); a failed ls-remote is `unknown`.
   * Sets {@link branch} to whichever candidate answered.
   */
  fetchTip(): Tip {
    const ls = this.git(["ls-remote", "--heads", "origin", ...this.candidates.map((c) => `refs/heads/${c}`)]);
    if (ls.status !== 0) return { state: "unknown", branch: this.branch, reason: `ls-remote failed: ${ls.stderr.trim()}` };
    const present = new Set(
      ls.stdout
        .toString()
        .split("\n")
        .map((l) => l.split("\t")[1]?.trim().replace(/^refs\/heads\//, ""))
        .filter((b): b is string => Boolean(b)),
    );
    const found = this.candidates.find((c) => present.has(c));
    this.branch = found ?? this.candidates[0]!;
    if (!found) return { state: "absent", branch: this.branch };
    const ref = this.privateRef("tip");
    const f = this.git(["fetch", "-q", "--no-tags", "--depth=1", "--filter=blob:none", "origin", `+refs/heads/${found}:${ref}`]);
    if (f.status !== 0) return { state: "unknown", branch: found, reason: `fetch of ${found} failed: ${f.stderr.trim()}` };
    const tip = this.must(["rev-parse", ref]).trim();
    this.git(["update-ref", "-d", ref]);
    return { state: "ok", branch: found, tip };
  }

  /** `ls-tree -z` of one tree, parsed. */
  lsTree(tree: string): TreeEntry[] {
    const out = this.must(["ls-tree", "-z", tree]);
    return out
      .split("\0")
      .filter(Boolean)
      .map((l) => {
        const tab = l.indexOf("\t");
        const [mode, type, sha] = l.slice(0, tab).split(" ");
        return { mode: mode!, type: type!, sha: sha!, name: l.slice(tab + 1) };
      });
  }

  /**
   * The object at `path` under `tree`, or undefined. Takes a slash-separated
   * string or pre-split segments — the two callers had one each.
   */
  lookup(tree: string, path: string | readonly string[]): TreeEntry | undefined {
    const segs = typeof path === "string" ? path.split("/").filter(Boolean) : path;
    let cur: TreeEntry | undefined = { mode: "040000", type: "tree", sha: tree, name: "" };
    for (const seg of segs) {
      if (cur.type !== "tree") return undefined;
      cur = this.lsTree(cur.sha).find((e) => e.name === seg);
      if (!cur) return undefined;
    }
    return cur;
  }

  mktree(entries: TreeEntry[]): string {
    const input = entries.map((e) => `${e.mode} ${e.type} ${e.sha}\t${e.name}\0`).join("");
    return this.must(["mktree", "-z", "--missing"], { input }).trim();
  }

  /**
   * `tree` with `path` set to `entry`, or removed when `entry` is undefined.
   * A directory emptied by a removal is removed too: git has no empty tree
   * entry, and writing one would be a determined-empty that means nothing.
   * Returns undefined when the whole tree became empty.
   */
  setPath(tree: string | undefined, path: string[], entry: TreeEntry | undefined): string | undefined {
    const [head, ...rest] = path;
    const entries = tree ? this.lsTree(tree) : [];
    const others = entries.filter((e) => e.name !== head);
    let replacement: TreeEntry | undefined;
    if (rest.length === 0) {
      replacement = entry ? { ...entry, name: head! } : undefined;
    } else {
      const child = entries.find((e) => e.name === head && e.type === "tree");
      const sub = this.setPath(child?.sha, rest, entry);
      replacement = sub ? { mode: "040000", type: "tree", sha: sub, name: head! } : undefined;
    }
    const next = replacement ? [...others, replacement] : others;
    return next.length ? this.mktree(next) : undefined;
  }

  /** Blobs reachable from `tree` that are not in the store yet — without fetching them lazily. */
  missingObjects(tree: string): string[] {
    const r = this.git(["rev-list", "--objects", "--missing=print", "--no-object-names", tree]);
    if (r.status !== 0) throw new Error(`rev-list over ${tree} failed: ${r.stderr.trim()}`);
    return r.stdout
      .toString()
      .split("\n")
      .filter((l) => l.startsWith("?"))
      .map((l) => l.slice(1));
  }

  /**
   * Make every blob under `tree` local, in ONE round trip (spike finding 1).
   * Falls back to an unfiltered depth-1 fetch of the branch when the server
   * refuses a want by object id. Returns how many are still missing.
   */
  hydrate(tree: string): number {
    let missing = this.missingObjects(tree);
    if (missing.length === 0) return 0;
    const batch = this.git(
      ["-c", "fetch.negotiationAlgorithm=noop", "fetch", "-q", "--stdin", "--no-tags", "--no-write-fetch-head", "--filter=blob:none", "origin"],
      { input: missing.join("\n") + "\n" },
    );
    missing = this.missingObjects(tree);
    if (missing.length && batch.status !== 0) {
      const ref = this.privateRef("full");
      this.git(["fetch", "-q", "--no-tags", "--depth=1", "origin", `+refs/heads/${this.branch}:${ref}`]);
      this.git(["update-ref", "-d", ref]);
      missing = this.missingObjects(tree);
    }
    return missing.length;
  }

  /**
   * Make `shas` (blobs somewhere under `tree`) local, in one round trip, without
   * hydrating the rest of `tree`. Presence is asked of `rev-list --missing=print`
   * because every presence probe git 2.43 offers fetches lazily, one object at a time.
   */
  ensureBlobs(tree: string, shas: string[]): boolean {
    const want = new Set(shas);
    const missing = this.missingObjects(tree).filter((s) => want.has(s));
    if (missing.length === 0) return true;
    this.git(
      ["-c", "fetch.negotiationAlgorithm=noop", "fetch", "-q", "--stdin", "--no-tags", "--no-write-fetch-head", "--filter=blob:none", "origin"],
      { input: missing.join("\n") + "\n" },
    );
    return !this.missingObjects(tree).some((s) => want.has(s));
  }

  /** Contents of many blobs in one `cat-file --batch` process. */
  catBlobs(shas: string[]): Map<string, Buffer> {
    const out = new Map<string, Buffer>();
    if (shas.length === 0) return out;
    const r = this.git(["cat-file", "--batch"], { input: shas.join("\n") + "\n", env: { GIT_NO_LAZY_FETCH: "1" } });
    if (r.status !== 0) throw new Error(`cat-file --batch failed: ${r.stderr.trim()}`);
    const buf = r.stdout;
    let i = 0;
    for (const sha of shas) {
      const nl = buf.indexOf(10, i);
      const header = buf.subarray(i, nl).toString();
      const parts = header.split(" ");
      if (parts[1] === "missing") throw new Error(`blob ${sha} is missing from the store`);
      const size = Number(parts[2]);
      out.set(sha, buf.subarray(nl + 1, nl + 1 + size));
      i = nl + 1 + size + 1;
    }
    return out;
  }

  blobText(sha: string): string {
    return this.catBlobs([sha]).get(sha)!.toString("utf-8");
  }

  hashBlob(content: string): string {
    return this.must(["hash-object", "-w", "--stdin"], { input: content }).trim();
  }
}

export class BranchStore extends TreeStore {
  private readonly sleep: (ms: number) => void;
  private readonly beforePush?: (attempt: number) => void;

  private constructor(
    dir: string,
    remote: string,
    branches: string[],
    authEnv: Record<string, string>,
    opts: BranchStoreOptions,
  ) {
    if (branches.length === 0) throw new BranchStoreUsageError("no branch named");
    super(dir, remote, branches, authEnv, { identity: STATE_BOT, refNamespace: "branch-store", log: opts.log });
    this.sleep = opts.sleep ?? ((ms) => Bun.sleepSync(ms));
    this.beforePush = opts.beforePush;
  }

  /**
   * Open the store for `branch` (or several candidate names, canonical
   * first). Pass a {@link TipLocation}'s `branch` once a declaration exists.
   */
  static open(branch: string | string[], opts: BranchStoreOptions = {}): BranchStore {
    const branches = Array.isArray(branch) ? branch : [branch];
    for (const b of branches) {
      if (!/^(?!-)(?!refs\/)[A-Za-z0-9._/-]+$/.test(b) || b.includes("..")) throw new BranchStoreUsageError(`not a plain branch name: ${b}`);
    }
    const repoRoot = opts.repoRoot ?? gitTopLevel();
    let remote = opts.remote ?? process.env.BRANCH_STORE_REMOTE;
    if (!remote) {
      const r = spawnSync("git", ["remote", "get-url", "origin"], { cwd: repoRoot, encoding: "utf-8" });
      if (r.status !== 0) throw new BranchStoreUsageError(`no remote: ${repoRoot} has no \`origin\`; pass remote or BRANCH_STORE_REMOTE`);
      remote = r.stdout.trim();
    }
    let storeDir = opts.storeDir ?? process.env.BRANCH_STORE_DIR;
    if (!storeDir) {
      const c = spawnSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: repoRoot, encoding: "utf-8" });
      if (c.status !== 0) throw new BranchStoreUsageError(`cannot find the git directory of ${repoRoot}`);
      storeDir = join(c.stdout.trim(), "branch-store.git");
    }
    return new BranchStore(resolve(storeDir), remote, branches, authEnvFrom(repoRoot), opts);
  }









  /** {@link TreeStore.missingObjects} as a set — this class probes membership. */
  private missing(tree: string): Set<string> {
    return new Set(this.missingObjects(tree));
  }



  // ── Reading ────────────────────────────────────────────────────────────

  /** The tip, verified as a state branch: a root manifest, `state-manifest/v1`, `keyedBy: "tip"`. */
  private verifiedTip(): (Hit & { tree: string }) | NotHit {
    let t: Tip;
    try {
      t = this.fetchTip();
    } catch (e) {
      return { state: "unknown", reason: String(e) };
    }
    if (t.state === "absent") return { state: "miss", reason: `branch ${this.candidates.join(" / ")} does not exist on the remote` };
    if (t.state === "unknown") return { state: "unknown", reason: t.reason };
    try {
      const tree = this.must(["rev-parse", `${t.tip}^{tree}`]).trim();
      const m = this.lookup(tree, [MANIFEST_FILE]);
      if (!m || m.type !== "blob") return { state: "corrupt", reason: `${t.branch} has no root ${MANIFEST_FILE}; not a state branch` };
      if (!this.ensureBlobs(tree, [m.sha])) return { state: "unknown", reason: `could not fetch ${MANIFEST_FILE} of ${t.branch}` };
      let manifest: { $schema?: unknown; keyedBy?: unknown };
      try {
        manifest = JSON.parse(this.catBlobs([m.sha]).get(m.sha)!.toString("utf-8"));
      } catch (e) {
        return { state: "corrupt", reason: `${t.branch}:${MANIFEST_FILE} does not parse: ${(e as Error).message}` };
      }
      if (manifest?.$schema !== MANIFEST_SCHEMA) return { state: "corrupt", reason: `${t.branch}:${MANIFEST_FILE} is ${String(manifest?.$schema)}, not ${MANIFEST_SCHEMA}` };
      if (manifest.keyedBy !== "tip") return { state: "corrupt", reason: `${t.branch} is keyed by ${String(manifest.keyedBy)}, not tip` };
      return { state: "hit", branch: t.branch, tip: t.tip, tree };
    } catch (e) {
      return { state: "unknown", reason: String(e) };
    }
  }

  /** One file at the tip. A directory where a file was asked for is `corrupt`. */
  readFile(path: string): FileRead {
    const segs = segments(path);
    const v = this.verifiedTip();
    if (v.state !== "hit") return v;
    const e = this.lookup(v.tree, segs);
    if (!e) return { state: "miss", reason: `${path} is not on ${v.branch} at ${v.tip.slice(0, 12)}` };
    if (e.type !== "blob") return { state: "corrupt", reason: `${path} on ${v.branch} is a ${e.type}, not a file` };
    if (!this.ensureBlobs(v.tree, [e.sha])) return { state: "unknown", reason: `could not fetch ${path} from ${v.branch}` };
    return { state: "hit", branch: v.branch, tip: v.tip, path: segs.join("/"), blob: e.sha, text: this.catBlobs([e.sha]).get(e.sha)!.toString("utf-8") };
  }

  /** {@link readFile}, parsed. Unparseable JSON is `corrupt`, never `miss`. */
  readJson<T = unknown>(path: string): JsonRead<T> {
    const r = this.readFile(path);
    if (r.state !== "hit") return r;
    try {
      const { text: _text, ...rest } = r;
      return { ...rest, value: JSON.parse(r.text) as T };
    } catch (e) {
      return { state: "corrupt", reason: `${path} on ${r.branch} does not parse: ${(e as Error).message}` };
    }
  }

  /** The entries of one directory at the tip (`""` is the root). A file where a directory was asked for is `corrupt`. */
  listDir(path: string): DirRead {
    const segs = segments(path);
    const v = this.verifiedTip();
    if (v.state !== "hit") return v;
    const e = segs.length ? this.lookup(v.tree, segs) : { mode: "040000", type: "tree", sha: v.tree, name: "" };
    if (!e) return { state: "miss", reason: `${path} is not on ${v.branch} at ${v.tip.slice(0, 12)}` };
    if (e.type !== "tree") return { state: "corrupt", reason: `${path} on ${v.branch} is a ${e.type}, not a directory` };
    const entries = this.lsTree(e.sha)
      .filter((x) => x.type === "blob" || x.type === "tree")
      .map((x) => ({ name: x.name, type: x.type as "blob" | "tree", sha: x.sha }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { state: "hit", branch: v.branch, tip: v.tip, path: segs.join("/"), entries };
  }

  /** Every file under `prefix` at the tip, fetched in one batch. Paths are branch-relative. */
  readTree(prefix: string): TreeRead {
    const segs = segments(prefix);
    const v = this.verifiedTip();
    if (v.state !== "hit") return v;
    const e = segs.length ? this.lookup(v.tree, segs) : { mode: "040000", type: "tree", sha: v.tree, name: "" };
    if (!e) return { state: "miss", reason: `${prefix} is not on ${v.branch} at ${v.tip.slice(0, 12)}` };
    if (e.type !== "tree") return { state: "corrupt", reason: `${prefix} on ${v.branch} is a ${e.type}, not a directory` };
    const blobs = new Map<string, string>();
    for (const l of this.must(["ls-tree", "-r", "-z", e.sha]).split("\0").filter(Boolean)) {
      const tab = l.indexOf("\t");
      const [, type, sha] = l.slice(0, tab).split(" ");
      if (type === "blob") blobs.set([...segs, l.slice(tab + 1)].join("/"), sha!);
    }
    const shas = [...new Set(blobs.values())];
    if (!this.ensureBlobs(e.sha, shas)) return { state: "unknown", reason: `some blobs under ${prefix} could not be fetched` };
    const bytes = this.catBlobs(shas);
    const files = new Map([...blobs].map(([p, s]) => [p, bytes.get(s)!.toString("utf-8")]));
    return { state: "hit", branch: v.branch, tip: v.tip, prefix: segs.join("/"), files };
  }

  // ── Writing ────────────────────────────────────────────────────────────

  /**
   * Splice `changes` onto the tip and push without `-f`, retried on a moved
   * tip. Every path not named is carried across untouched.
   *
   * - `absent` — the branch does not exist. Seeding one is a steward act
   *   (it carries the manifest), so this store never creates it.
   * - `unchanged` — the tip already holds exactly this content; nothing pushed.
   * - `conflict` — an `expect` disagreed with the tip; nothing pushed.
   * - `failed` — gave up after {@link WRITE_ATTEMPTS}, or the tip is not a state branch.
   */
  write(changes: Change[], message: string): WriteResult {
    if (changes.length === 0) throw new BranchStoreUsageError("no changes to write");
    const parsed = changes.map((c) => {
      const segs = segments(c.path);
      if (segs.length === 0) throw new BranchStoreUsageError("cannot write the branch root");
      if (segs.length === 1 && RESERVED.has(segs[0]!)) throw new BranchStoreUsageError(`${segs[0]} describes the branch; a write may not touch it`);
      return { ...c, segs };
    });
    const seen = new Set<string>();
    for (const c of parsed) {
      const k = c.segs.join("/");
      if (seen.has(k)) throw new BranchStoreUsageError(`${k} is named twice in one write`);
      seen.add(k);
    }
    // Hash once: the blob ids do not depend on the tip.
    const blobs = parsed.map((c) => (c.content === null ? undefined : this.must(["hash-object", "-w", "--stdin"], { input: c.content }).trim()));

    let lastReason = "";
    for (let attempt = 1; attempt <= WRITE_ATTEMPTS; attempt++) {
      const v = this.verifiedTip();
      if (v.state === "miss") return { state: "absent", reason: v.reason, branch: this.branch, attempts: attempt };
      if (v.state === "corrupt") return { state: "failed", reason: v.reason, branch: this.branch, attempts: attempt };
      if (v.state !== "hit") {
        lastReason = v.reason;
      } else {
        const conflicts: NonNullable<WriteResult["conflicts"]> = [];
        let tree: string = v.tree;
        parsed.forEach((c, i) => {
          const cur = this.lookup(v.tree, c.segs);
          const actual = cur ? cur.sha : null;
          if (c.expect !== undefined && c.expect !== actual) conflicts.push({ path: c.segs.join("/"), expected: c.expect, actual });
          const blob = blobs[i];
          tree = this.setPath(tree, c.segs, blob ? { mode: "100644", type: "blob", sha: blob, name: "" } : undefined) ?? this.mktree([]);
        });
        if (conflicts.length) {
          return { state: "conflict", reason: `${conflicts.length} path(s) changed on ${v.branch} since they were read`, branch: v.branch, attempts: attempt, conflicts };
        }
        if (tree === v.tree) return { state: "unchanged", reason: `${v.branch} already holds this content`, branch: v.branch, attempts: attempt };
        // --no-gpg-sign: the branch is written as the bot; a contributor's
        // `commit.gpgSign` must not put their key on the bot's commit.
        const commit = this.must(["commit-tree", "--no-gpg-sign", tree, "-p", v.tip, "-m", message]).trim();
        this.beforePush?.(attempt);
        // NO -f: a non-fast-forward is rejected by the server's ref lock and
        // we rebuild on what landed. The exit code is the verdict.
        const push = this.git(["-c", "pack.useSparse=false", "push", "-q", "origin", `${commit}:refs/heads/${v.branch}`]);
        if (push.status === 0) return { state: "pushed", reason: `pushed on attempt ${attempt}`, branch: v.branch, commit, attempts: attempt };
        lastReason = push.stderr
          .split("\n")
          .filter((l) => l.trim() && !/push negotiation failed|expected 'acknowledgments'/.test(l))
          .join(" | ");
      }
      if (attempt < WRITE_ATTEMPTS) {
        const ms = waitFor(attempt, PUSH_BASE_MS, PUSH_CAP_MS);
        this.log(`branch-store: attempt ${attempt} on ${this.branch} did not land (${lastReason}); retrying in ${ms} ms`);
        this.sleep(ms);
      }
    }
    return { state: "failed", reason: `gave up after ${WRITE_ATTEMPTS} attempts: ${lastReason}`, branch: this.branch, attempts: WRITE_ATTEMPTS };
  }
}

// ── CLI ──────────────────────────────────────────────────────────────────

/** hit 0, miss 1, usage 2, corrupt 3, unknown 4 — qa-store's and lake-cache's numbers. */
export const EXIT = { hit: 0, miss: 1, usage: 2, corrupt: 3, unknown: 4 } as const;

export function main(argv: string[]): number {
  const [cmd, ...rest] = argv;
  const pos: string[] = [];
  const named = new Map<string, string>();
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]!;
    if (a.startsWith("--")) named.set(a.slice(2), rest[++i] ?? "");
    else pos.push(a);
  }
  try {
    if (cmd === "where") {
      const id = named.get("id");
      if (!id) throw new BranchStoreUsageError("where needs --id <directory-id>");
      console.log(JSON.stringify(resolveTipLocation(id), null, 2));
      return 0;
    }
    const branch = named.get("branch");
    if (!branch) throw new BranchStoreUsageError(`${cmd ?? "(none)"} needs --branch B`);
    const store = BranchStore.open(branch.split(","));
    if (cmd === "read") {
      const r = store.readFile(pos[0] ?? "");
      if (r.state === "hit") process.stdout.write(r.text);
      else console.error(`branch-store: ${r.state}: ${r.reason}`);
      return EXIT[r.state];
    }
    if (cmd === "ls") {
      const r = store.listDir(pos[0] ?? "");
      if (r.state === "hit") for (const e of r.entries) console.log(`${e.type === "tree" ? "d" : "f"} ${e.name}`);
      else console.error(`branch-store: ${r.state}: ${r.reason}`);
      return EXIT[r.state];
    }
    throw new BranchStoreUsageError(`unknown command ${cmd ?? "(none)"}; expected read | ls | where`);
  } catch (e) {
    if (e instanceof BranchStoreUsageError) {
      console.error(`branch-store: ${e.message}`);
      return EXIT.usage;
    }
    throw e;
  }
}

if (import.meta.main) process.exit(main(process.argv.slice(2)));
