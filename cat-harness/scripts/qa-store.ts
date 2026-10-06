#!/usr/bin/env bun
/**
 * qa-store — the ONE read/write API for QA results kept on the orphan
 * `qa-reports` branch. Bean `16ei`, arc `3fva`, proposal
 * `docs/proposals/qa-reports-branch-and-test-process-2026-10-01.md` §2.
 *
 * ## The layout it reads and writes
 *
 * ```
 * qa-reports  (orphan; never merged; author folio-qa-bot)
 * ├── index.json                       qa-reports-index/v1: newest entry per ref
 * ├── main/<commit-sha>/               one tree per main commit that published
 * │   ├── manifest.json                qa-reports-manifest/v1
 * │   └── <instance>/test/results/**   byte-identical to the checkout's layout
 * └── pr/<number>/<head-sha>/…         same shape (owner ruling D3)
 * ```
 *
 * ## Four states, and a miss is never empty-clean
 *
 * Every read answers one of `hit` / `miss` / `corrupt` / `unknown`, and the CLI
 * maps them onto lake-cache's exit codes plus one:
 *
 * | state | exit | meaning |
 * |---|---|---|
 * | hit | 0 | the entry (and the path asked for) is there and verifies |
 * | miss | 1 | determined absent: no branch, no entry, or no such path in it |
 * | usage | 2 | the question was malformed (bad `--ref`, ambiguous sha prefix) |
 * | corrupt | 3 | present but unusable: no/foreign manifest, payload tree mismatch, unparseable JSON |
 * | unknown | 4 | could not determine: the remote or git failed. **Never a pass.** |
 *
 * A reader that renders `miss` as "no findings" is the `dh4f` defect; the
 * readers-audit (`qa-readers-audit-2026-10-01.md`, C4–C11) is a catalogue of
 * exactly that, so the type does not let a miss carry a file list at all.
 *
 * ## The design inputs the spike (`3ds9`) measured, each kept here
 *
 * 1. **Read in one batch.** A snapshot fetches the tip with
 *    `--depth=1 --filter=blob:none` (trees only), then fetches every missing
 *    blob of the entry in ONE `fetch --stdin` round trip. `git show` per file
 *    over a blob:none clone is one round trip per file (0.56 s each).
 * 2. **Push with `-c pack.useSparse=false`**, so blobs already on the remote
 *    under another `main/<sha>/` are not resent (368 KiB → 666 bytes).
 * 3. **Hash through a private `GIT_INDEX_FILE`** (`git add` + `write-tree`):
 *    0.09 s against 12.1 s for per-file `hash-object`, same tree id.
 * 4. **Tolerate `push negotiation failed; proceeding anyway`** on stderr: the
 *    push's exit code is the verdict, never its stderr.
 * 5. **Never `-f`.** Fetch the tip, splice this entry in, `commit-tree -p tip`,
 *    push; on rejection back off ({@link waitFor}, the same numbers as
 *    `backoff-sleep.ts`) and rebuild on the new tip — 3 attempts. The server's
 *    ref lock is the concurrency primitive, so a sibling's entry survives.
 *
 * ## Where its git objects live
 *
 * In a PRIVATE bare repository, `<git-common-dir>/qa-store.git`, never in the
 * checkout's own object store: a `--filter` fetch turns the repository it runs
 * in into a partial clone by rewriting its config, and a reader must not do
 * that to a contributor's checkout. CI's checkout token (`http.*.extraheader`)
 * is carried across in the ENVIRONMENT (`GIT_CONFIG_COUNT`), never in argv.
 *
 * Usage:
 *   bun run qa:fetch [--ref main|<sha>|main/<sha>|pr/<n>|pr/<n>/<sha>] [--into DIR] [--prefix P]
 *   bun run qa:publish --ref main/<sha>|pr/<n>/<sha> [--root DIR ...] [--gates-result R]
 *   bun run qa:publish --github --completeness FILE [--gates-result R]   # CI: derive the key, skip forks,
 *                                                       # refuse an incomplete qa:refresh report (bean 3hk4)
 *   bun run qa:prune [--apply] [--pr-states FILE]       # dry run unless --apply
 *   bun run cat-harness/scripts/qa-store.ts read --ref R <path>
 *   bun run cat-harness/scripts/qa-store.ts where
 *
 * @module scripts/qa-store
 * @covers qa
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

import { instanceRootsIn, resolveDirectories } from "../schemas/cat-harness.js";
// `readDeclaration` throws on the `folio` kind unless core has registered it —
// the same side-effect import `check-declared-dirs.ts` carries, same reason.
import "../schemas/folio-graph-typology.js";
import { waitFor } from "../src/core/retry.js";
import { PUSH_BASE_MS, PUSH_CAP_MS } from "./backoff-sleep.js";
import { TreeStore } from "./branch-store.js";

// ── Constants ────────────────────────────────────────────────────────────

/**
 * The branch's name, and the names it had before, newest first. Owner
 * 2026-10-02: special branches are `cat/<harness>/<name>` (note on `fs43`,
 * bean `tlk2`), superseding the interim `cat-` prefix of bean `32f6`. The
 * legacy list empties when bean `oycs` says every remote is renamed.
 */
export const QA_BRANCH = "cat/cat-harness/qa-reports";
export const LEGACY_QA_BRANCHES: readonly string[] = ["cat-qa-reports", "qa-reports"];
/** The branch when no declaration names one (proposal §2.4). */
export const DEFAULT_QA_BRANCH = QA_BRANCH;
export const MANIFEST_FILE = "manifest.json";
export const MANIFEST_SCHEMA = "qa-reports-manifest/v1";
export const INDEX_FILE = "index.json";
export const INDEX_SCHEMA = "qa-reports-index/v1";
/** Write attempts, the first included. Proposal §2.2 and spike finding 4. */
export const PUBLISH_ATTEMPTS = 3;
/** The committer the branch is written as. */
export const QA_BOT = { name: "folio-qa-bot", email: "folio-qa-bot@users.noreply.github.com" };

/** lake-cache's exit codes, plus `unknown`, which lake-cache has no word for. */
export const QA_EXIT = { hit: 0, miss: 1, usage: 2, corrupt: 3, unknown: 4 } as const;

// ── Types ────────────────────────────────────────────────────────────────

export type QaState = "hit" | "miss" | "corrupt" | "unknown";

/** Not a hit. A miss carries no data on purpose: there is nothing to read as clean. */
export type QaNotHit = { state: "miss" | "corrupt" | "unknown"; reason: string };

/** A store key: where ONE run's results live on the branch. */
export type QaKey = { kind: "main"; sha: string } | { kind: "pr"; pr: number; sha: string };

/** What a reader may ask for — a key, or "the newest" of a ref. */
export type QaRefSpec =
  | { kind: "main-latest" }
  | { kind: "main"; sha: string }
  | { kind: "pr-latest"; pr: number }
  | { kind: "pr"; pr: number; sha: string };

export interface QaReadHit {
  state: "hit";
  /** The resolved key path, e.g. `main/<sha>`. */
  key: string;
  /** The branch commit it was read from. */
  tip: string;
}

export type QaFileRead = (QaReadHit & { path: string; text: string }) | QaNotHit;
export type QaTreeRead =
  | (QaReadHit & { prefix: string; files: Map<string, string> })
  | (QaNotHit & { bad?: string[] });

export interface QaManifest {
  $schema: typeof MANIFEST_SCHEMA;
  key: string;
  /** The commit the results describe (a PR's HEAD sha for `pr/…`). */
  source: string;
  /** The commit actually checked out when it differs (a PR's merge commit). */
  checkout?: string;
  pr?: number;
  /** Repository-relative roots that were published. */
  roots: string[];
  /** The tree of the payload WITHOUT this manifest — what a reader verifies. */
  payloadTree: string;
  files: number;
  bytes: number;
  written_at: string;
  producer?: { run?: string; gates?: string };
  /**
   * What `qa:refresh` said of the working copy this entry was built from (bean
   * `3hk4`): `tracked` (the commit's own committed copy) or `computed` (the
   * declared writers ran into an empty tree), and the files per writer. Absent
   * on an entry published without a report, which `--github` refuses.
   */
  completeness?: { mode: string; files: number; families: Record<string, number> };
}

export interface QaIndex {
  $schema: typeof INDEX_SCHEMA;
  main?: { sha: string; written_at: string };
  pr?: Record<string, { sha: string; written_at: string }>;
}

export interface QaStoreOptions {
  /** The checkout root. Default: `git rev-parse --show-toplevel` from cwd. */
  repoRoot?: string;
  /** The remote URL or path. Default: env `QA_STORE_REMOTE`, else the checkout's `origin`. */
  remote?: string;
  /** Default: the declared `storage.branch`, else {@link DEFAULT_QA_BRANCH}. */
  branch?: string;
  /** The private bare repository. Default: env `QA_STORE_DIR`, else `<git-common-dir>/qa-store.git`. */
  storeDir?: string;
  /** Injected for tests; default sleeps the backoff synchronously. */
  sleep?: (ms: number) => void;
  /** Called after the tree is built and before each push — tests widen the race window with it. */
  beforePush?: (attempt: number) => void;
  /** Progress lines; default stderr. */
  log?: (line: string) => void;
}

/** A malformed question — exit 2, never folded into miss. */
export class QaUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QaUsageError";
  }
}

// ── Keys and refs ────────────────────────────────────────────────────────

const FULL_SHA = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/;
const SHA_PREFIX = /^[0-9a-f]{7,64}$/;

/** `main/<sha>` or `pr/<n>/<sha>`. */
export function keyPath(key: QaKey): string {
  return key.kind === "main" ? `main/${key.sha}` : `pr/${key.pr}/${key.sha}`;
}

/** Parse a WRITE key. A full sha is required: a key is an identity, not a search. */
export function parseQaKey(s: string): QaKey {
  const m = /^main\/([0-9a-f]+)$/.exec(s);
  if (m && FULL_SHA.test(m[1]!)) return { kind: "main", sha: m[1]! };
  const p = /^pr\/([1-9][0-9]*)\/([0-9a-f]+)$/.exec(s);
  if (p && FULL_SHA.test(p[2]!)) return { kind: "pr", pr: Number(p[1]), sha: p[2]! };
  throw new QaUsageError(`not a store key: "${s}" — expected main/<full-sha> or pr/<n>/<full-sha>`);
}

/** Parse a READ ref: `main`, `<sha>`, `main/<sha>`, `pr/<n>`, `pr/<n>/<sha>`. */
export function parseQaRef(s: string): QaRefSpec {
  if (s === "main") return { kind: "main-latest" };
  if (SHA_PREFIX.test(s)) return { kind: "main", sha: s };
  const m = /^main\/([0-9a-f]{7,64})$/.exec(s);
  if (m) return { kind: "main", sha: m[1]! };
  const p = /^pr\/([1-9][0-9]*)(?:\/([0-9a-f]{7,64}))?$/.exec(s);
  if (p) return p[2] ? { kind: "pr", pr: Number(p[1]), sha: p[2] } : { kind: "pr-latest", pr: Number(p[1]) };
  throw new QaUsageError(`not a qa ref: "${s}" — expected main | <sha> | main/<sha> | pr/<n> | pr/<n>/<sha>`);
}

// ── Location (the declaration) ───────────────────────────────────────────

export interface QaDirectory {
  /** The declaring instance's root, absolute. */
  instance: string;
  id: string;
  /** Repository-relative, no trailing slash — the path on the branch too. */
  path: string;
  absPath: string;
  present: boolean;
  storage?: import("../schemas/cat-harness.js").DirectoryStorage;
}

export interface QaLocation {
  /** The branch every storage-backed `qa` directory names, or the default. */
  branch: string;
  keyedBy: "commit";
  /** True when at least one `qa` directory declares `storage`. */
  declared: boolean;
  directories: QaDirectory[];
}

/**
 * Where QA results live: every declared `qa` directory across the checkout's
 * instances, and the branch their `storage` names.
 *
 * Two directories naming DIFFERENT branches is refused rather than resolved by
 * order: one store per checkout is the design, and picking one would hand half
 * the readers a branch their writer never wrote.
 */
export function resolveQaLocation(repoRoot: string = gitTopLevel()): QaLocation {
  const directories: QaDirectory[] = [];
  const seen = new Set<string>();
  for (const inst of instanceRootsIn(repoRoot)) {
    for (const d of resolveDirectories([{ name: "(local)", root: inst, own: true }])) {
      if (!d.graphTypologies.includes("qa" as never) || seen.has(d.absPath)) continue;
      seen.add(d.absPath);
      const storage = d.storage;
      directories.push({
        instance: inst,
        id: d.id,
        path: relative(repoRoot, d.absPath).split("\\").join("/").replace(/\/+$/, ""),
        absPath: d.absPath,
        present: existsSync(d.absPath) && statSync(d.absPath).isDirectory(),
        ...(storage ? { storage } : {}),
      });
    }
  }
  directories.sort((a, b) => a.path.localeCompare(b.path));
  // A qa directory is keyed by commit, so its storage is one branch; the resolver refuses a family.
  const branches = [...new Set(directories.flatMap((d) => (d.storage && "branch" in d.storage ? [d.storage.branch] : [])))];
  if (branches.length > 1) {
    throw new QaUsageError(`qa directories declare ${branches.length} storage branches (${branches.join(", ")}); one store per checkout`);
  }
  return { branch: branches[0] ?? DEFAULT_QA_BRANCH, keyedBy: "commit", declared: branches.length === 1, directories };
}

// ── Which name the branch has ────────────────────────────────────────────

/**
 * The names to look for, in order. A declaration naming EITHER spelling of the
 * QA branch gets both, new first, so a folio whose declaration predates the
 * rename still finds a renamed remote; any other name is taken as given.
 */
export function qaBranchCandidates(declared: string): string[] {
  return declared === QA_BRANCH || LEGACY_QA_BRANCHES.includes(declared) ? [QA_BRANCH, ...LEGACY_QA_BRANCHES] : [declared];
}

/**
 * The rule, for readers AND writers: the first candidate that exists on the
 * remote, else the first candidate. Writers follow it too, so nothing creates
 * the new name beside a live legacy one and blocks the rename — GitHub's
 * branch rename refuses a target that exists, and keeps no redirect for git.
 */
export function pickQaBranch(candidates: readonly string[], present: ReadonlySet<string>): string {
  return candidates.find((c) => present.has(c)) ?? candidates[0]!;
}

// ── Git plumbing ─────────────────────────────────────────────────────────
//
// The plumbing itself is `branch-store.ts`'s `TreeStore` (bean `2h76`); what
// is left here is only what locates the checkout it runs in.

function gitTopLevel(cwd = process.cwd()): string {
  // input-site: baseline #128d75cd — the qa-reports store's remote, bare store and auth; a check reaches it only to read the entry its --against names
  const r = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf-8" });
  if (r.status !== 0) throw new QaUsageError(`not inside a git checkout: ${cwd}`);
  return r.stdout.trim();
}

/**
 * The store: a private bare repository plus how to reach the remote.
 *
 * Built once per (storeDir, remote, branch) and reused for the process, so a
 * reader asking for 487 files fetches the tip once and the blobs once.
 */
/**
 * The commit-keyed store: {@link TreeStore}'s plumbing, nothing added.
 *
 * Bean `2h76` part 1. This class was 200 lines of git plumbing that
 * `branch-store.ts` had a second copy of — `mktree` and `setPath` were
 * byte-identical but for a `private`, `must` identical outright. The copy that
 * survives is {@link TreeStore}, and the three axes the two actually differed
 * on are its constructor arguments.
 *
 * It takes the CANDIDATE names ({@link qaBranchCandidates}: the new
 * `cat/cat-harness/qa-reports` first, then the legacy spellings), which
 * TreeStore already carries; `fetchTip` reports which one answered.
 */
class Store extends TreeStore {
  constructor(
    dir: string,
    remote: string,
    candidates: readonly string[],
    authEnv: Record<string, string>,
    log?: (line: string) => void,
  ) {
    // TreeStore (bean `2h76` part 1) carries the candidate list and settles
    // `branch` on every fetchTip by the same rule as pickQaBranch: the first
    // name the remote has, else the first (#1801 merged onto #1982).
    super(dir, remote, candidates, authEnv, { identity: QA_BOT, refNamespace: "qa-store", log });
  }
}

/** The checkout's own `http.*.extraheader` lines, carried in env (never argv). */
function authEnvFrom(repoRoot: string): Record<string, string> {
  // input-site: baseline #d6d10161 — the qa-reports store's remote, bare store and auth; a check reaches it only to read the entry its --against names
  const r = spawnSync("git", ["config", "--get-regexp", "^http\\..*extraheader$"], { cwd: repoRoot, encoding: "utf-8" });
  if (r.status !== 0 || !r.stdout.trim()) return {};
  const env: Record<string, string> = {};
  const lines = r.stdout.trim().split("\n");
  // input-site: baseline #d641fe25 — the qa-reports store's remote, bare store and auth; a check reaches it only to read the entry its --against names
  const base = Number(process.env.GIT_CONFIG_COUNT ?? 0) || 0;
  lines.forEach((line, i) => {
    const sp = line.indexOf(" ");
    env[`GIT_CONFIG_KEY_${base + i}`] = line.slice(0, sp);
    env[`GIT_CONFIG_VALUE_${base + i}`] = line.slice(sp + 1);
  });
  env.GIT_CONFIG_COUNT = String(base + lines.length);
  return env;
}

const stores = new Map<string, Store>();

function openStore(opts: QaStoreOptions = {}): { store: Store; repoRoot: string } {
  const repoRoot = opts.repoRoot ?? gitTopLevel();
  // input-site: baseline #82ec2164 — the qa-reports store's remote, bare store and auth; a check reaches it only to read the entry its --against names
  let remote = opts.remote ?? process.env.QA_STORE_REMOTE;
  if (!remote) {
    // input-site: baseline #68c082a4 — the qa-reports store's remote, bare store and auth; a check reaches it only to read the entry its --against names
    const r = spawnSync("git", ["remote", "get-url", "origin"], { cwd: repoRoot, encoding: "utf-8" });
    if (r.status !== 0) throw new QaUsageError(`no remote: ${repoRoot} has no \`origin\`; pass --remote or QA_STORE_REMOTE`);
    remote = r.stdout.trim();
  }
  let branch = opts.branch;
  if (!branch) {
    try {
      branch = resolveQaLocation(repoRoot).branch;
    } catch (e) {
      if (e instanceof QaUsageError) throw e;
      branch = DEFAULT_QA_BRANCH;
    }
  }
  // input-site: baseline #ed418525 — the qa-reports store's remote, bare store and auth; a check reaches it only to read the entry its --against names
  let storeDir = opts.storeDir ?? process.env.QA_STORE_DIR;
  if (!storeDir) {
    // input-site: baseline #f48bd6b7 — the qa-reports store's remote, bare store and auth; a check reaches it only to read the entry its --against names
    const c = spawnSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: repoRoot, encoding: "utf-8" });
    if (c.status !== 0) throw new QaUsageError(`cannot find the git directory of ${repoRoot}`);
    storeDir = join(c.stdout.trim(), "qa-store.git");
  }
  const candidates = qaBranchCandidates(branch);
  const id = `${resolve(storeDir)}|${remote}|${candidates.join(",")}`;
  let store = stores.get(id);
  if (!store) {
    store = new Store(resolve(storeDir), remote, candidates, authEnvFrom(repoRoot), opts.log);
    stores.set(id, store);
  }
  return { store, repoRoot };
}

// ── Reading ──────────────────────────────────────────────────────────────

/** One resolved entry, its blobs made local on first content read. */
interface Snapshot {
  key: string;
  tip: string;
  entry: string;
  manifest: QaManifest;
  /** path (relative to the entry, i.e. repository-relative) → blob sha, payload only. */
  blobs?: Map<string, string>;
  contents?: Map<string, Buffer>;
}

type SnapshotResult = { state: "hit"; snap: Snapshot } | QaNotHit;

const snapshots = new Map<string, SnapshotResult>();

/** Forget every memoised tip and entry — a test, or a long-lived process, re-reading the branch. */
export function clearQaCache(): void {
  snapshots.clear();
  stores.clear();
}

function readIndex(store: Store, rootTree: string): { state: "ok"; index?: QaIndex } | QaNotHit {
  const e = store.lookup(rootTree, INDEX_FILE);
  if (!e) return { state: "ok" };
  if (!store.ensureBlobs(rootTree, [e.sha])) return { state: "unknown", reason: `could not fetch ${INDEX_FILE}` };
  try {
    const idx = JSON.parse(store.blobText(e.sha)) as QaIndex;
    if (idx.$schema !== INDEX_SCHEMA) return { state: "corrupt", reason: `${INDEX_FILE} is not ${INDEX_SCHEMA}` };
    return { state: "ok", index: idx };
  } catch (err) {
    return { state: "corrupt", reason: `${INDEX_FILE} does not parse: ${(err as Error).message}` };
  }
}

/** Resolve a spec to a key path on `rootTree`. */
function resolveSpec(store: Store, rootTree: string, spec: QaRefSpec): { state: "ok"; key: string } | QaNotHit {
  if (spec.kind === "main" || spec.kind === "pr") {
    const parent = spec.kind === "main" ? "main" : `pr/${spec.pr}`;
    if (FULL_SHA.test(spec.sha)) {
      const key = `${parent}/${spec.sha}`;
      return store.lookup(rootTree, key) ? { state: "ok", key } : { state: "miss", reason: `no entry ${key}` };
    }
    const dir = store.lookup(rootTree, parent);
    const names = dir?.type === "tree" ? store.lsTree(dir.sha).map((e) => e.name).filter((n) => n.startsWith(spec.sha)) : [];
    if (names.length === 0) return { state: "miss", reason: `no entry ${parent}/${spec.sha}…` };
    if (names.length > 1) throw new QaUsageError(`ambiguous sha prefix ${spec.sha}: ${names.length} entries under ${parent}/`);
    return { state: "ok", key: `${parent}/${names[0]}` };
  }
  const idx = readIndex(store, rootTree);
  if (idx.state !== "ok") return idx;
  const parent = spec.kind === "main-latest" ? "main" : `pr/${spec.pr}`;
  const hasAny = Boolean(store.lookup(rootTree, parent));
  const latest = spec.kind === "main-latest" ? idx.index?.main : idx.index?.pr?.[String(spec.pr)];
  if (!latest) {
    return hasAny
      ? { state: "corrupt", reason: `entries exist under ${parent}/ but ${INDEX_FILE} names none of them` }
      : { state: "miss", reason: `no entry under ${parent}/` };
  }
  const key = `${parent}/${latest.sha}`;
  return store.lookup(rootTree, key)
    ? { state: "ok", key }
    : { state: "corrupt", reason: `${INDEX_FILE} names ${key}, which is not on the branch` };
}

/** Verify an entry: a manifest of our schema whose `payloadTree` is the entry minus itself. */
function verifyEntry(store: Store, entry: string, key: string): { state: "ok"; manifest: QaManifest } | QaNotHit {
  const entries = store.lsTree(entry);
  const m = entries.find((e) => e.name === MANIFEST_FILE && e.type === "blob");
  if (!m) return { state: "corrupt", reason: `${key} has no ${MANIFEST_FILE}` };
  if (!store.ensureBlobs(entry, [m.sha])) return { state: "unknown", reason: `could not fetch ${key}/${MANIFEST_FILE}` };
  let manifest: QaManifest;
  try {
    manifest = JSON.parse(store.blobText(m.sha)) as QaManifest;
  } catch (err) {
    return { state: "corrupt", reason: `${key}/${MANIFEST_FILE} does not parse: ${(err as Error).message}` };
  }
  if (manifest.$schema !== MANIFEST_SCHEMA) return { state: "corrupt", reason: `${key}/${MANIFEST_FILE} is not ${MANIFEST_SCHEMA}` };
  if (typeof manifest.payloadTree !== "string") return { state: "corrupt", reason: `${key}/${MANIFEST_FILE} carries no payloadTree to verify against` };
  const payload = entries.filter((e) => e.name !== MANIFEST_FILE);
  const actual = payload.length ? store.mktree(payload) : "";
  if (actual !== manifest.payloadTree) {
    return { state: "corrupt", reason: `${key}: payload tree ${actual || "(empty)"} ≠ manifest's ${manifest.payloadTree}` };
  }
  return { state: "ok", manifest };
}

function snapshot(ref: string, opts: QaStoreOptions): SnapshotResult {
  const spec = parseQaRef(ref);
  const { store } = openStore(opts);
  const memo = `${store.dir}|${store.remote}|${store.candidates.join(",")}|${ref}`;
  const hit = snapshots.get(memo);
  if (hit) return hit;
  let result: SnapshotResult;
  try {
    result = buildSnapshot(store, spec);
  } catch (e) {
    if (e instanceof QaUsageError) throw e;
    result = { state: "unknown", reason: (e as Error).message };
  }
  // Only a determined answer is memoised: an `unknown` may be a blip.
  if (result.state !== "unknown") snapshots.set(memo, result);
  return result;
}

function buildSnapshot(store: Store, spec: QaRefSpec): SnapshotResult {
  const t = store.fetchTip();
  if (t.state === "absent") return { state: "miss", reason: `branch ${store.branch} does not exist on the remote` };
  if (t.state === "unknown") return t;
  const rootTree = store.must(["rev-parse", `${t.tip}^{tree}`]).trim();
  const r = resolveSpec(store, rootTree, spec);
  if (r.state !== "ok") return r;
  const entry = store.lookup(rootTree, r.key)!;
  if (entry.type !== "tree") return { state: "corrupt", reason: `${r.key} is a ${entry.type}, not a tree` };
  const v = verifyEntry(store, entry.sha, r.key);
  if (v.state !== "ok") return v;
  return { state: "hit", snap: { key: r.key, tip: t.tip, entry: entry.sha, manifest: v.manifest } };
}

/** Every payload blob of the entry, fetched in one batch the first time anything is read. */
function contentsOf(snap: Snapshot, store: Store): QaNotHit | undefined {
  if (snap.contents) return undefined;
  const left = store.hydrate(snap.entry);
  if (left > 0) return { state: "unknown", reason: `${left} blob(s) of ${snap.key} could not be fetched` };
  const out = store.must(["ls-tree", "-r", "-z", snap.entry]);
  const blobs = new Map<string, string>();
  for (const l of out.split("\0").filter(Boolean)) {
    const tab = l.indexOf("\t");
    const [, type, sha] = l.slice(0, tab).split(" ");
    const path = l.slice(tab + 1);
    if (type === "blob" && path !== MANIFEST_FILE) blobs.set(path, sha!);
  }
  const bytes = store.catBlobs([...new Set(blobs.values())]);
  snap.blobs = blobs;
  snap.contents = new Map([...blobs].map(([p, s]) => [p, bytes.get(s)!]));
  return undefined;
}

function toRepoPath(path: string, repoRoot: string): string {
  const rel = isAbsolute(path) ? relative(repoRoot, path) : path;
  const norm = rel.split("\\").join("/").replace(/^\.\//, "").replace(/\/+$/, "");
  if (norm.startsWith("../") || norm === "..") throw new QaUsageError(`path outside the checkout: ${path}`);
  return norm;
}

/**
 * Read ONE file from the store. `path` is repository-relative (or absolute
 * inside the checkout) — the same path the file has in the working copy.
 *
 * The first read of an entry hydrates the whole entry in one batch, so a
 * caller looping over many files pays one round trip, not one per file.
 * A `.json` file that does not parse is `corrupt`, not a hit with bad text.
 */
export function readQa(ref: string, path: string, opts: QaStoreOptions = {}): QaFileRead {
  const s = snapshot(ref, opts);
  if (s.state !== "hit") return s;
  const { store, repoRoot } = openStore(opts);
  const rel = toRepoPath(path, repoRoot);
  const fail = contentsOf(s.snap, store);
  if (fail) return fail;
  const buf = s.snap.contents!.get(rel);
  if (!buf) return { state: "miss", reason: `${s.snap.key} has no ${rel}` };
  const text = buf.toString("utf-8");
  if (rel.endsWith(".json")) {
    try {
      JSON.parse(text);
    } catch (e) {
      return { state: "corrupt", reason: `${s.snap.key}/${rel} does not parse: ${(e as Error).message}` };
    }
  }
  return { state: "hit", key: s.snap.key, tip: s.snap.tip, path: rel, text };
}

/**
 * Read every file under `prefix` (repository-relative directory). A prefix the
 * entry does not hold is a `miss` — never an empty map, because git stores no
 * empty directory and an empty map would read as "examined, nothing found".
 */
export function readQaTree(ref: string, prefix: string, opts: QaStoreOptions = {}): QaTreeRead {
  const s = snapshot(ref, opts);
  if (s.state !== "hit") return s;
  const { store, repoRoot } = openStore(opts);
  const rel = toRepoPath(prefix, repoRoot);
  const fail = contentsOf(s.snap, store);
  if (fail) return fail;
  const files = new Map<string, string>();
  const bad: string[] = [];
  for (const [p, buf] of s.snap.contents!) {
    if (rel !== "" && p !== rel && !p.startsWith(rel + "/")) continue;
    const text = buf.toString("utf-8");
    if (p.endsWith(".json")) {
      try {
        JSON.parse(text);
      } catch {
        bad.push(p);
      }
    }
    files.set(p, text);
  }
  if (bad.length) return { state: "corrupt", reason: `${bad.length} file(s) under ${rel || "/"} do not parse`, bad };
  if (files.size === 0) return { state: "miss", reason: `${s.snap.key} has nothing under ${rel || "/"}` };
  return { state: "hit", key: s.snap.key, tip: s.snap.tip, prefix: rel, files };
}

/** The verified manifest of an entry. */
export function readQaManifest(ref: string, opts: QaStoreOptions = {}): (QaReadHit & { manifest: QaManifest }) | QaNotHit {
  const s = snapshot(ref, opts);
  if (s.state !== "hit") return s;
  return { state: "hit", key: s.snap.key, tip: s.snap.tip, manifest: s.snap.manifest };
}

/**
 * Every payload path of an entry with its BLOB ID, read from trees alone — no
 * blob is fetched, so comparing a whole checkout against an entry costs one
 * trees-only fetch. Bean `5hox`: removal is gated on the entry holding a
 * hash-identical copy, and a hash is exactly what a tree already records.
 * Paths are repository-relative, as in the checkout; the manifest is excluded.
 */
export function readQaBlobIds(ref: string, opts: QaStoreOptions = {}): (QaReadHit & { blobs: Map<string, string> }) | QaNotHit {
  const s = snapshot(ref, opts);
  if (s.state !== "hit") return s;
  const { store } = openStore(opts);
  const r = store.git(["ls-tree", "-r", "-z", s.snap.entry], { env: { GIT_NO_LAZY_FETCH: "1" } });
  if (r.status !== 0) return { state: "unknown", reason: `ls-tree of ${s.snap.key} failed: ${r.stderr.trim()}` };
  const blobs = new Map<string, string>();
  for (const l of r.stdout.toString().split("\0").filter(Boolean)) {
    const tab = l.indexOf("\t");
    const [, type, sha] = l.slice(0, tab).split(" ");
    const path = l.slice(tab + 1);
    if (type === "blob" && path !== MANIFEST_FILE) blobs.set(path, sha!);
  }
  return { state: "hit", key: s.snap.key, tip: s.snap.tip, blobs };
}

export interface QaFetchResult {
  state: QaState;
  reason?: string;
  key?: string;
  written?: number;
  /** Files under the published roots that exist locally and are NOT in the entry. Reported, never deleted. */
  extra?: string[];
}

/**
 * Materialise an entry into the working `test/results/` paths, in one batch.
 *
 * It WRITES and never deletes. A local file the entry does not hold is listed
 * in `extra`, because silently removing it would be a deletion nobody decided
 * (`deletion-requires-confirmation`) and silently keeping it unreported would
 * let a stale verdict pass as fetched.
 */
export function fetchQa(args: { ref: string; into?: string; prefix?: string }, opts: QaStoreOptions = {}): QaFetchResult {
  const t = readQaTree(args.ref, args.prefix ?? "", opts);
  if (t.state !== "hit") return { state: t.state, reason: t.reason };
  const { repoRoot } = openStore(opts);
  const into = resolve(args.into ?? repoRoot);
  for (const [p, text] of t.files) {
    const dest = join(into, p);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, text);
  }
  const m = readQaManifest(args.ref, opts);
  const extra: string[] = [];
  if (m.state === "hit") {
    for (const root of m.manifest.roots) {
      const abs = join(into, root);
      if (!existsSync(abs)) continue;
      for (const f of readdirSync(abs, { recursive: true, withFileTypes: true })) {
        if (!f.isFile()) continue;
        const parent = (f as { parentPath?: string; path?: string }).parentPath ?? (f as { path?: string }).path ?? abs;
        const rel = relative(into, join(parent, f.name)).split("\\").join("/");
        if (!t.files.has(rel) && (!args.prefix || rel.startsWith(args.prefix))) extra.push(rel);
      }
    }
  }
  return { state: "hit", key: t.key, written: t.files.size, extra: extra.sort() };
}

// ── Writing ──────────────────────────────────────────────────────────────

export type QaPublishState = "published" | "present" | "empty" | "incomplete" | "failed";

export interface QaPublishResult {
  state: QaPublishState;
  key: string;
  reason: string;
  commit?: string;
  attempts: number;
  /** The entry tree written, or that would have been. */
  entry?: string;
}

function defaultSleep(ms: number): void {
  Bun.sleepSync(ms);
}

/**
 * Build the entry tree for `roots` through a private index (spike finding 3).
 * Never touches the checkout's index or object store.
 */
function buildEntry(
  store: Store,
  repoRoot: string,
  key: QaKey,
  roots: string[],
  extra: Partial<QaManifest>,
): { entry: string; manifest: QaManifest } | undefined {
  // input-site: baseline #66be449e — the qa-reports store's remote, bare store and auth; a check reaches it only to read the entry its --against names
  const tmp = mkdtempSync(join(tmpdir(), "qa-store-index-"));
  try {
    const env = { GIT_INDEX_FILE: join(tmp, "index") };
    // -f: once `test/results/` is .gitignored (when `storage` is set) the
    // working copy is ignored by design, and it is still what gets published.
    store.must([`--work-tree=${repoRoot}`, "add", "-f", "--", ...roots], { env, cwd: repoRoot });
    const payload = store.must(["write-tree"], { env }).trim();
    const listing = store.must(["ls-tree", "-r", "-l", "-z", payload]);
    let files = 0;
    let bytes = 0;
    for (const l of listing.split("\0").filter(Boolean)) {
      files++;
      bytes += Number(l.slice(0, l.indexOf("\t")).trim().split(/\s+/)[3]) || 0;
    }
    if (files === 0) return undefined;
    if (store.lsTree(payload).some((e) => e.name === MANIFEST_FILE)) {
      throw new QaUsageError(`a root publishes a top-level ${MANIFEST_FILE}, which would shadow the entry's own`);
    }
    const manifest: QaManifest = {
      $schema: MANIFEST_SCHEMA,
      key: keyPath(key),
      source: key.sha,
      ...(key.kind === "pr" ? { pr: key.pr } : {}),
      ...extra,
      roots,
      payloadTree: payload,
      files,
      bytes,
      // input-site: baseline #18c2fdfe — the qa-reports store's remote, bare store and auth; a check reaches it only to read the entry its --against names
      written_at: extra.written_at ?? new Date().toISOString(),
    };
    const mblob = store.hashBlob(JSON.stringify(manifest, null, 2) + "\n");
    const entry = store.mktree([...store.lsTree(payload), { mode: "100644", type: "blob", sha: mblob, name: MANIFEST_FILE }]);
    return { entry, manifest };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/** The index with `key` recorded as its ref's newest entry. A corrupt index is rebuilt from this entry. */
function nextIndex(store: Store, base: string | undefined, key: QaKey, writtenAt: string): string {
  let idx: QaIndex = { $schema: INDEX_SCHEMA };
  if (base) {
    const r = readIndex(store, base);
    if (r.state === "ok" && r.index) idx = r.index;
    else if (r.state !== "ok") store.log(`qa-store: ${r.reason}; rewriting ${INDEX_FILE} from this entry`);
  }
  const rec = { sha: key.sha, written_at: writtenAt };
  if (key.kind === "main") idx.main = rec;
  else idx.pr = { ...(idx.pr ?? {}), [String(key.pr)]: rec };
  return store.hashBlob(JSON.stringify(idx, null, 2) + "\n");
}

/**
 * The write loop every change to the branch goes through: fetch the tip,
 * `build(tip)` a new root tree on it, `commit-tree -p tip`, push WITHOUT `-f`,
 * and on rejection back off and rebuild on the new tip.
 *
 * `build` returns `done` to stop without pushing (already present, nothing to
 * prune). This is the helper `check:workflows`' `qa-reports-unretried`
 * requires every push to go through.
 */
function writeLoop(
  store: Store,
  opts: QaStoreOptions,
  message: string,
  build: (tip: string | undefined, base: string | undefined) => { tree: string } | { done: string },
): { state: "pushed" | "done" | "failed"; reason: string; commit?: string; attempts: number } {
  const sleep = opts.sleep ?? defaultSleep;
  let lastReason = "";
  for (let attempt = 1; attempt <= PUBLISH_ATTEMPTS; attempt++) {
    const t = store.fetchTip();
    if (t.state === "unknown") {
      lastReason = t.reason;
    } else {
      const tip = t.state === "ok" ? t.tip : undefined;
      const base = tip ? store.must(["rev-parse", `${tip}^{tree}`]).trim() : undefined;
      const b = build(tip, base);
      if ("done" in b) return { state: "done", reason: b.done, attempts: attempt };
      // --no-gpg-sign: the branch is written as folio-qa-bot, and a contributor's
      // `commit.gpgSign` must not put their key on the bot's commit.
      const parent = tip ? ["-p", tip] : [];
      const commit = store.must(["commit-tree", "--no-gpg-sign", b.tree, ...parent, "-m", message]).trim();
      opts.beforePush?.(attempt);
      // NO -f (spike finding 4): a non-fast-forward is rejected by the
      // server's ref lock and we rebuild on what landed. The exit code is the
      // verdict; `push negotiation failed; proceeding anyway` on stderr is a
      // proxy artefact and is not (spike finding 5).
      const push = store.git(["-c", "pack.useSparse=false", "push", "-q", "origin", `${commit}:refs/heads/${store.branch}`]);
      if (push.status === 0) return { state: "pushed", reason: `pushed on attempt ${attempt}`, commit, attempts: attempt };
      lastReason = push.stderr
        .split("\n")
        .filter((l) => l.trim() && !/push negotiation failed|expected 'acknowledgments'/.test(l))
        .join(" | ");
    }
    if (attempt < PUBLISH_ATTEMPTS) {
      const ms = waitFor(attempt, PUSH_BASE_MS, PUSH_CAP_MS);
      store.log(`qa-store: attempt ${attempt} did not land (${lastReason}); retrying in ${ms} ms`);
      sleep(ms);
    }
  }
  return { state: "failed", reason: `gave up after ${PUBLISH_ATTEMPTS} attempts: ${lastReason}`, attempts: PUBLISH_ATTEMPTS };
}

/**
 * Publish `roots` (repository-relative directories) as the entry `ref`.
 *
 * - An entry already at `ref` is never overwritten: `present`, exit 0 — a CI
 *   re-run of the same commit is a no-op, and the first write stands.
 * - Roots that do not exist are skipped and named; none existing is `empty`.
 * - Every other entry on the branch is carried across untouched.
 */
export function publishQa(
  args: {
    ref: string;
    roots: string[];
    checkout?: string;
    producer?: QaManifest["producer"];
    writtenAt?: string;
    /**
     * The refresh report's account of the tree (bean `3hk4`). When given, the
     * entry must hold exactly `completeness.files` files, or nothing is
     * written (`incomplete`): a tree that changed between the account and the
     * publish is not the tree that was judged complete.
     */
    completeness?: QaManifest["completeness"];
  },
  opts: QaStoreOptions = {},
): QaPublishResult {
  const key = parseQaKey(args.ref);
  const kp = keyPath(key);
  const { store, repoRoot } = openStore(opts);
  const roots: string[] = [];
  const skipped: string[] = [];
  for (const r of args.roots) {
    const rel = toRepoPath(r, repoRoot);
    if (rel === "") throw new QaUsageError("refusing to publish the whole checkout; name its test/results roots");
    if (existsSync(join(repoRoot, rel))) roots.push(rel);
    else skipped.push(rel);
  }
  if (skipped.length) store.log(`qa-store: not in the checkout, skipped: ${skipped.join(", ")}`);
  // input-site: baseline #0a597796 — the qa-reports store's remote, bare store and auth; a check reaches it only to read the entry its --against names
  const writtenAt = args.writtenAt ?? new Date().toISOString();
  const built = roots.length
    ? buildEntry(store, repoRoot, key, roots, {
        written_at: writtenAt,
        ...(args.checkout && args.checkout !== key.sha ? { checkout: args.checkout } : {}),
        ...(args.producer ? { producer: args.producer } : {}),
        ...(args.completeness ? { completeness: args.completeness } : {}),
      })
    : undefined;
  if (!built) return { state: "empty", key: kp, reason: "no files under any root; nothing to publish", attempts: 0 };
  if (args.completeness && built.manifest.files !== args.completeness.files) {
    return {
      state: "incomplete",
      key: kp,
      reason:
        `the tree holds ${built.manifest.files} file(s) and the refresh report accounted for ${args.completeness.files}; ` +
        "something wrote or removed files between the two, so this is not the tree that was judged complete — nothing published",
      attempts: 0,
    };
  }

  const r = writeLoop(store, opts, `qa-reports: ${kp} (${built.manifest.files} files, ${built.manifest.bytes} bytes)`, (_tip, base) => {
    const existing = base ? store.lookup(base, kp) : undefined;
    if (existing) {
      // Same PAYLOAD is "identical": the manifest differs by its timestamp on
      // every run, so comparing entry trees would call every re-run different.
      const payload = existing.type === "tree" ? store.lsTree(existing.sha).filter((e) => e.name !== MANIFEST_FILE) : [];
      const same = payload.length > 0 && store.mktree(payload) === built.manifest.payloadTree;
      return {
        done:
          same
            ? `${kp} is already on ${store.branch}, identical`
            : `${kp} is already on ${store.branch} with different content (${existing.sha}); the first write stands`,
      };
    }
    const withEntry = store.setPath(base, kp.split("/"), { mode: "040000", type: "tree", sha: built.entry, name: "" })!;
    const idx = nextIndex(store, base, key, writtenAt);
    return { tree: store.setPath(withEntry, [INDEX_FILE], { mode: "100644", type: "blob", sha: idx, name: "" })! };
  });
  clearSnapshotsFor(store);
  if (r.state === "pushed") return { state: "published", key: kp, reason: r.reason, commit: r.commit, attempts: r.attempts, entry: built.entry };
  if (r.state === "done") return { state: "present", key: kp, reason: r.reason, attempts: r.attempts, entry: built.entry };
  return { state: "failed", key: kp, reason: r.reason, attempts: r.attempts, entry: built.entry };
}

function clearSnapshotsFor(store: Store): void {
  for (const k of snapshots.keys()) if (k.startsWith(`${store.dir}|`)) snapshots.delete(k);
}

// ── Completeness: what `qa:refresh` said of the tree (bean `3hk4`) ───────

/** The `$schema` of `qa-refresh.ts`'s report. Here, because the publish reads it. */
export const REFRESH_SCHEMA = "qa-refresh/v1";

/**
 * Is a `qa:refresh` report well-formed and COMPLETE? The publish's one
 * question of it. Anything else — absent, foreign, incomplete — is a refusal
 * with its reason, never a publish of a partial tree as if it were whole.
 */
export function refreshReportComplete(
  r: unknown,
): { ok: true; completeness: NonNullable<QaManifest["completeness"]> } | { ok: false; reason: string } {
  const x = r as { $schema?: unknown; files?: unknown; reasons?: unknown; complete?: unknown; mode?: unknown; families?: unknown } | undefined;
  if (!x || x.$schema !== REFRESH_SCHEMA) return { ok: false, reason: `not a ${REFRESH_SCHEMA} report` };
  if (typeof x.files !== "number" || !Array.isArray(x.reasons)) return { ok: false, reason: "the report carries no file count or reasons" };
  if (x.complete !== true) {
    return { ok: false, reason: `the refresh was INCOMPLETE: ${(x.reasons as string[]).join("; ") || "no reason given"}` };
  }
  return {
    ok: true,
    completeness: { mode: String(x.mode), files: x.files, families: (x.families ?? {}) as Record<string, number> },
  };
}

// ── CI: what to publish, and when not to ────────────────────────────────

export type PublishDecision = { publish: true; ref: string; checkout: string } | { publish: false; reason: string };

/**
 * Derive the key from a GitHub Actions run — or say why there is none.
 *
 * A FORK PR's `GITHUB_TOKEN` is read-only (spike `3ds9`), so its push would
 * fail; the decision is to skip with that reason stated, never to attempt and
 * fail, and never to skip silently.
 */
export function githubPublishDecision(env: Record<string, string | undefined>, event: unknown): PublishDecision {
  const name = env.GITHUB_EVENT_NAME;
  const sha = env.GITHUB_SHA ?? "";
  if (name === "push") {
    if (env.GITHUB_REF !== "refs/heads/main") return { publish: false, reason: `a push to ${env.GITHUB_REF ?? "?"} is not main; only main/<sha> is keyed for pushes` };
    if (!FULL_SHA.test(sha)) return { publish: false, reason: "GITHUB_SHA is missing or not a full sha" };
    return { publish: true, ref: `main/${sha}`, checkout: sha };
  }
  if (name === "pull_request") {
    const pr = (event as { pull_request?: { number?: number; head?: { sha?: string; repo?: { full_name?: string } | null } } })?.pull_request;
    if (!pr?.number || !pr.head?.sha) return { publish: false, reason: "the event payload carries no pull_request number or head sha" };
    const head = pr.head.repo?.full_name;
    if (!head || head !== env.GITHUB_REPOSITORY) {
      return {
        publish: false,
        reason: `fork PR (${head ?? "deleted repository"} → ${env.GITHUB_REPOSITORY}): its GITHUB_TOKEN is read-only, so pr/${pr.number}/<sha> cannot be written from this run`,
      };
    }
    return { publish: true, ref: `pr/${pr.number}/${pr.head.sha}`, checkout: sha };
  }
  return { publish: false, reason: `event \`${name ?? "(none)"}\` is not keyed: the store holds main/<sha> and pr/<n>/<sha> only` };
}

// ── Prune ────────────────────────────────────────────────────────────────

export type PrState = { state: "open" } | { state: "closed"; closedAt: string } | { state: "unknown" };

export interface PrunePlan {
  remove: string[];
  keep: number;
  /** Why each kept PR with a determined-unknown state was kept. */
  notes: string[];
}

const DAY = 86_400_000;

/**
 * The retention rule, pure (proposal §2.2): every `main/<sha>` for
 * `keepDays`; after that, one per UTC day (the newest written that day); the
 * newest `main` entry always. `pr/<n>` goes `prDays` after the PR closed. A PR
 * whose state could not be determined is KEPT and named — could-not-determine
 * never deletes.
 */
export function planPrune(
  main: Array<{ sha: string; writtenAt: string }>,
  prs: Array<{ pr: number; entries: number }>,
  prState: (pr: number) => PrState,
  now: Date,
  opts: { keepDays?: number; prDays?: number; newestMain?: string } = {},
): PrunePlan {
  const keepDays = opts.keepDays ?? 90;
  const prDays = opts.prDays ?? 7;
  const remove: string[] = [];
  const notes: string[] = [];
  let keep = 0;
  const byDay = new Map<string, Array<{ sha: string; t: number }>>();
  for (const m of main) {
    const t = Date.parse(m.writtenAt);
    if (Number.isNaN(t)) {
      keep++;
      notes.push(`main/${m.sha}: no readable written_at; kept`);
      continue;
    }
    if (now.getTime() - t <= keepDays * DAY || m.sha === opts.newestMain) {
      keep++;
      continue;
    }
    const day = new Date(t).toISOString().slice(0, 10);
    byDay.set(day, [...(byDay.get(day) ?? []), { sha: m.sha, t }]);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => b.t - a.t || a.sha.localeCompare(b.sha));
    keep++;
    for (const x of list.slice(1)) remove.push(`main/${x.sha}`);
  }
  for (const { pr, entries } of prs) {
    const s = prState(pr);
    if (s.state === "closed" && now.getTime() - Date.parse(s.closedAt) > prDays * DAY) {
      remove.push(`pr/${pr}`);
    } else {
      keep += entries;
      if (s.state === "unknown") notes.push(`pr/${pr}: state unknown; kept`);
    }
  }
  return { remove: remove.sort(), keep, notes };
}

export interface PruneResult {
  state: "pruned" | "nothing" | "dry-run" | "failed" | "absent";
  plan?: PrunePlan;
  reason: string;
  commit?: string;
}

/**
 * Apply {@link planPrune} as a NEW commit on the tip (`commit-tree -p`): the
 * history is never rewritten, only the tip's tree loses entries. Through the
 * same retry loop as a publish, re-planned on every attempt so a sibling's
 * fresh entry is never judged against a stale tip. Dry run unless `apply`.
 */
export function pruneQa(
  args: { now?: Date; apply?: boolean; prState?: (pr: number) => PrState; keepDays?: number; prDays?: number },
  opts: QaStoreOptions = {},
): PruneResult {
  const { store } = openStore(opts);
  // input-site: baseline #2f3d53ee — the qa-reports store's remote, bare store and auth; a check reaches it only to read the entry its --against names
  const now = args.now ?? new Date();
  const prState = args.prState ?? (() => ({ state: "unknown" }) as PrState);
  let lastPlan: PrunePlan | undefined;

  const planFor = (base: string): PrunePlan => {
    const mainDir = store.lookup(base, "main");
    const entries = (mainDir?.type === "tree" ? store.lsTree(mainDir.sha) : []).map((e) => ({
      sha: e.name,
      manifest: store.lsTree(e.sha).find((x) => x.name === MANIFEST_FILE)?.sha,
    }));
    // Every manifest in ONE round trip; a manifest that cannot be fetched or
    // read leaves its entry with no date, and an undated entry is kept.
    store.ensureBlobs(base, entries.flatMap((e) => (e.manifest ? [e.manifest] : [])));
    const main: Array<{ sha: string; writtenAt: string }> = [];
    for (const e of entries) {
      let writtenAt = "";
      try {
        writtenAt = e.manifest ? (JSON.parse(store.blobText(e.manifest)) as QaManifest).written_at : "";
      } catch {
        writtenAt = "";
      }
      main.push({ sha: e.sha, writtenAt });
    }
    const prDir = store.lookup(base, "pr");
    const prs = (prDir?.type === "tree" ? store.lsTree(prDir.sha) : []).map((e) => ({ pr: Number(e.name), entries: store.lsTree(e.sha).length }));
    const idx = readIndex(store, base);
    return planPrune(main, prs, prState, now, {
      keepDays: args.keepDays,
      prDays: args.prDays,
      newestMain: idx.state === "ok" ? idx.index?.main?.sha : undefined,
    });
  };

  if (!args.apply) {
    const t = store.fetchTip();
    if (t.state === "absent") return { state: "absent", reason: `branch ${store.branch} does not exist` };
    if (t.state === "unknown") return { state: "failed", reason: t.reason };
    const plan = planFor(store.must(["rev-parse", `${t.tip}^{tree}`]).trim());
    return { state: "dry-run", plan, reason: `would remove ${plan.remove.length} entr(ies); kept ${plan.keep}` };
  }

  const r = writeLoop(store, opts, "qa-reports: prune", (tip, base) => {
    if (!base) return { done: `branch ${store.branch} does not exist` };
    const plan = (lastPlan = planFor(base));
    if (plan.remove.length === 0) return { done: "nothing to prune" };
    let tree: string | undefined = base;
    for (const p of plan.remove) tree = store.setPath(tree, p.split("/"), undefined);
    const idx = readIndex(store, base);
    if (idx.state === "ok" && idx.index?.pr) {
      const pr = { ...idx.index.pr };
      for (const p of plan.remove) if (p.startsWith("pr/")) delete pr[p.slice(3)];
      const blob = store.hashBlob(JSON.stringify({ ...idx.index, pr }, null, 2) + "\n");
      tree = store.setPath(tree, [INDEX_FILE], { mode: "100644", type: "blob", sha: blob, name: "" });
    }
    return { tree: tree ?? store.mktree([]) };
  });
  clearSnapshotsFor(store);
  if (r.state === "pushed") return { state: "pruned", plan: lastPlan, reason: r.reason, commit: r.commit };
  if (r.state === "done") return { state: r.reason.includes("does not exist") ? "absent" : "nothing", plan: lastPlan, reason: r.reason };
  return { state: "failed", plan: lastPlan, reason: r.reason };
}

// ── CLI ──────────────────────────────────────────────────────────────────

function flags(argv: string[]): { pos: string[]; one: (n: string) => string | undefined; many: (n: string) => string[]; has: (n: string) => boolean } {
  const pos: string[] = [];
  const vals = new Map<string, string[]>();
  const bools = new Set<string>();
  const VALUED = new Set(["ref", "into", "prefix", "root", "remote", "branch", "store", "gates-result", "pr-states", "now", "completeness"]);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (!a.startsWith("--")) {
      pos.push(a);
      continue;
    }
    const [k, inline] = a.slice(2).split(/=(.*)/s, 2) as [string, string | undefined];
    if (VALUED.has(k)) {
      const v = inline ?? argv[++i];
      if (v === undefined) throw new QaUsageError(`--${k} needs a value`);
      vals.set(k, [...(vals.get(k) ?? []), v]);
    } else bools.add(k);
  }
  return { pos, one: (n) => vals.get(n)?.at(-1), many: (n) => vals.get(n) ?? [], has: (n) => bools.has(n) };
}

function exitFor(state: QaState): number {
  return QA_EXIT[state];
}

function readPrStates(file: string): (pr: number) => PrState {
  const rows = JSON.parse(readFileSync(file, "utf-8")) as Array<{ number: number; state: string; closedAt?: string | null }>;
  const map = new Map<number, PrState>();
  for (const r of rows) {
    if (r.state === "OPEN") map.set(r.number, { state: "open" });
    else if (r.closedAt) map.set(r.number, { state: "closed", closedAt: r.closedAt });
  }
  return (pr) => map.get(pr) ?? { state: "unknown" };
}

export function main(argv: string[]): number {
  const f = flags(argv);
  const [cmd, ...rest] = f.pos;
  const opts: QaStoreOptions = {
    ...(f.one("remote") ? { remote: f.one("remote") } : {}),
    ...(f.one("branch") ? { branch: f.one("branch") } : {}),
    ...(f.one("store") ? { storeDir: f.one("store") } : {}),
  };
  const json = f.has("json");
  const say = (o: unknown, line: string) => console.log(json ? JSON.stringify(o, null, 2) : line);

  switch (cmd) {
    case "where": {
      const loc = resolveQaLocation(opts.repoRoot);
      say(loc, [
        `qa store: branch ${loc.branch} (${loc.declared ? "declared" : "default — no qa directory declares storage yet"}), keyed by ${loc.keyedBy}`,
        ...loc.directories.map((d) => `  ${d.present ? "present" : "absent "} ${d.path}${d.storage && "branch" in d.storage ? `  → ${d.storage.branch}` : ""}`),
      ].join("\n"));
      return 0;
    }
    case "fetch": {
      const r = fetchQa({ ref: f.one("ref") ?? "main", into: f.one("into"), prefix: f.one("prefix") }, opts);
      say(r, r.state === "hit"
        ? `qa:fetch HIT ${r.key}: wrote ${r.written} file(s)` + (r.extra?.length ? `; ${r.extra.length} local file(s) not in the entry (left in place): ${r.extra.slice(0, 5).join(", ")}${r.extra.length > 5 ? ", …" : ""}` : "")
        : `qa:fetch ${r.state.toUpperCase()}: ${r.reason}${r.state === "miss" ? " — a miss is not a clean result" : ""}`);
      return exitFor(r.state);
    }
    case "read": {
      const path = rest[0];
      if (!path) throw new QaUsageError("read needs a path");
      const r = readQa(f.one("ref") ?? "main", path, opts);
      if (r.state === "hit") process.stdout.write(r.text);
      else console.error(`qa read ${r.state.toUpperCase()}: ${r.reason}`);
      return exitFor(r.state);
    }
    case "publish": {
      const repoRoot = gitTopLevel();
      let ref = f.one("ref");
      let checkout: string | undefined;
      if (f.has("github")) {
        let event: unknown;
        try {
          // input-site: baseline #d7f91bed — the qa-reports store's remote, bare store and auth; a check reaches it only to read the entry its --against names
          event = process.env.GITHUB_EVENT_PATH ? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf-8")) : undefined;
        } catch {
          event = undefined;
        }
        // input-site: baseline #9cc42cff — the qa-reports store's remote, bare store and auth; a check reaches it only to read the entry its --against names
        const d = githubPublishDecision(process.env, event);
        if (!d.publish) {
          // A notice in the run summary, and exit 0: a skipped publish is a
          // stated decision, not a failure — and not silence either.
          console.log(`::notice title=qa:publish skipped::${d.reason}`);
          return 0;
        }
        ref = d.ref;
        checkout = d.checkout;
      }
      if (!ref) throw new QaUsageError("publish needs --ref main/<sha> | pr/<n>/<sha>, or --github in CI");
      // Bean `3hk4`: a CI publish states what produced its tree. Without a
      // complete `qa:refresh` report, a fresh checkout after `5hox` would be
      // stored as a one-file entry that reads as the record of the commit.
      let completeness: QaManifest["completeness"];
      const reportFile = f.one("completeness");
      if (reportFile !== undefined || f.has("github")) {
        if (reportFile === undefined) {
          console.error("qa:publish INCOMPLETE: --github needs --completeness <qa:refresh report>; nothing published");
          return QA_EXIT.unknown;
        }
        let parsed: unknown;
        try {
          parsed = JSON.parse(readFileSync(reportFile, "utf-8"));
        } catch (e) {
          console.error(`qa:publish INCOMPLETE: the refresh report ${reportFile} could not be read (${(e as Error).message}); nothing published`);
          return QA_EXIT.unknown;
        }
        const c = refreshReportComplete(parsed);
        if (!c.ok) {
          console.error(`qa:publish INCOMPLETE: ${c.reason}; nothing published`);
          return QA_EXIT.unknown;
        }
        completeness = c.completeness;
      }
      const roots = f.many("root").length ? f.many("root") : resolveQaLocation(repoRoot).directories.filter((d) => d.present).map((d) => d.path);
      // input-site: baseline #f79bad10 — the qa-reports store's remote, bare store and auth; a check reaches it only to read the entry its --against names
      const run = process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : undefined;
      const gates = f.one("gates-result");
      const r = publishQa(
        { ref, roots, checkout, ...(run || gates ? { producer: { ...(run ? { run } : {}), ...(gates ? { gates } : {}) } } : {}), ...(completeness ? { completeness } : {}) },
        { ...opts, repoRoot },
      );
      say(r, `qa:publish ${r.state.toUpperCase()} ${r.key}: ${r.reason}${r.commit ? ` (${r.commit})` : ""}`);
      return r.state === "published" || r.state === "present" ? 0 : r.state === "empty" ? QA_EXIT.miss : QA_EXIT.unknown;
    }
    case "prune": {
      // input-site: baseline #ec29a4c5 — the qa-reports store's remote, bare store and auth; a check reaches it only to read the entry its --against names
      const now = f.one("now") ? new Date(f.one("now")!) : new Date();
      if (Number.isNaN(now.getTime())) throw new QaUsageError(`--now is not a date: ${f.one("now")}`);
      const prState = f.one("pr-states") ? readPrStates(f.one("pr-states")!) : undefined;
      if (!prState) console.error("qa:prune: no --pr-states; every pr/<n> is of unknown state and is KEPT");
      const r = pruneQa({ now, apply: f.has("apply"), prState }, opts);
      say(r, [
        `qa:prune ${r.state.toUpperCase()}: ${r.reason}${r.commit ? ` (${r.commit})` : ""}`,
        ...(r.plan?.remove ?? []).map((p) => `  - ${p}`),
        ...(r.plan?.notes ?? []).map((n) => `  · ${n}`),
      ].join("\n"));
      return r.state === "failed" ? QA_EXIT.unknown : 0;
    }
    default:
      throw new QaUsageError(`unknown command "${cmd ?? ""}" — fetch | read | publish | prune | where`);
  }
}

if (import.meta.main) {
  let code: number;
  try {
    code = main(process.argv.slice(2));
  } catch (e) {
    if (e instanceof QaUsageError) {
      console.error(`qa-store: ${e.message}`);
      code = QA_EXIT.usage;
    } else {
      console.error(`qa-store: could not determine — ${(e as Error).message}. This is NOT a pass.`);
      code = QA_EXIT.unknown;
    }
  }
  process.exit(code);
}
