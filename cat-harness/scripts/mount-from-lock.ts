#!/usr/bin/env bun
/**
 * Lay down every remote mount a committed lock records — from the LOCK alone,
 * with nothing but Node's own modules.
 *
 * ## Why a second mounter
 *
 * `remote-mount.ts` (bean `0mpw`) PLANS a mount: it reads the harness's
 * declaration at the pin, follows `needs` across the closure, checks trust and
 * writes the lock. To do that it reads declarations through
 * `schemas/cat-harness.ts`, whose import closure reaches six modules under
 * `bootstrap-tools/schemas/` (measured 2026-10-07: `declared-order`, `graph`,
 * `requirement`, `model-registry`, `release-iri`, `declaration`). That is fine
 * while `bootstrap-tools` arrives as a git submodule. It is a bootstrapping
 * loop the moment `bootstrap-tools` itself arrives by remote mount: the tool
 * that would fetch it cannot be loaded until it is there (bean `nn8e`, #2462,
 * blocker B2).
 *
 * This script breaks the loop by doing the one part that needs no
 * declaration: REPLAYING a lock. Every decision — which instances, which
 * repository, which commit, which directories, where — was made when the lock
 * was written and is committed; what is left is fetch, copy and verify. So it
 * imports only `node:*`, runs on a fresh clone with no submodule, and is what
 * CI and the session-start hook run first. `mount:remote` stays the only
 * writer of a lock.
 *
 * ## What it guarantees
 *
 * - **Pinned and verified.** Each instance is fetched at the lock's 40-char
 *   SHA, and each directory's bytes must hash to the lock's `treeDigest`
 *   (the same digest `kg-parts.ts` computes) — a mismatch is undone and
 *   reported, never kept. Trust was checked when the lock was written; the
 *   digest is what makes replaying it safe.
 * - **Never over somebody's work.** A path that holds tracked files, or holds
 *   bytes that no longer hash to the lock, is left untouched and reported.
 * - **Three states.** `mounted` / `current` exit 0, `missing` (refused or
 *   absent) exits 1, `could-not-determine` (fetch failed, lock unreadable)
 *   exits 2 — never folded into one another.
 *
 * Usage:
 *   bun run cat mount:lock                 # lay down / refresh every locked mount
 *   bun run cat mount:lock -- --check      # no network: is every locked mount on disk and intact?
 *   bun run cat mount:lock -- --root <dir> # the downstream instance root (default: cwd)
 *
 * `CAT_MOUNT_URL_PREFIX` replaces `https://github.com` in fetch URLs (tests
 * serve local bare repositories this way); a repository that is already a URL
 * or an absolute path is used as it stands.
 *
 * @graphNode none — a command-line tool; the lock's shape is `schemas/remote-mount.ts`
 * @covers none — replays a lock; `mount:remote:check` is the gate on the lock itself
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";

/** The lock's shape, read structurally — this file may not import the schema (see the header). */
export interface LockDir {
  id: string;
  path: string;
  upstreamPath: string;
  treeDigest: string;
  files: number;
}
export interface LockInstance {
  instance: string;
  repository: string;
  sha: string;
  upstreamRoot: string;
  path: string;
  declaration: { file: string; sha256: string };
  directories: LockDir[];
}

export type State = "mounted" | "current" | "missing" | "could-not-determine";
export interface Outcome {
  instance: string;
  state: State;
  detail: string;
}

const SHA = /^[0-9a-f]{40}$/;
const DIGEST = /^[0-9a-f]{64}$/;

// ── Digest — byte-identical to kg-parts.ts `treeEntries` + `treeDigest` ──────

export function treeFiles(dir: string): string[] {
  const files: string[] = [];
  const walk = (d: string): void => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) walk(p);
      else if (e.isFile()) files.push(relative(dir, p).split("\\").join("/"));
    }
  };
  if (existsSync(dir)) walk(dir);
  return files.sort();
}

const sha256 = (b: string | Buffer): string => createHash("sha256").update(b).digest("hex");

export function digestOf(dir: string): { treeDigest: string; files: number } {
  const files = treeFiles(dir);
  const listing = files.map((f) => `${sha256(readFileSync(join(dir, f)))}  ${f}\n`).join("");
  return { treeDigest: sha256(listing), files: files.length };
}

// ── Reading the lock ─────────────────────────────────────────────────────────

/** The lock's name since 2026-10-07: the generated companion to `index.config.json`. */
export const INDEX_LOCK = "index.lock.json";
/** The retired name, `<root-instance>.mount-lock.json` — still READ, so a downstream folio or an old branch replays. */
export const LEGACY_LOCK_SUFFIX = ".mount-lock.json";

/**
 * The lock file(s) beside `root`: `index.lock.json`, else every legacy
 * `*.mount-lock.json`. BOTH present is an error naming both, never a merge.
 *
 * RESTATED from `lockFilesIn` in `schemas/instance-roots.ts` rather than
 * imported, because this file imports nothing but `node:*` (the header says
 * why); `mount-from-lock.test.ts` holds the two to the same answers.
 */
export function lockNames(root: string): { names: string[]; conflict?: string } {
  let entries: string[];
  try {
    entries = readdirSync(root);
  } catch {
    return { names: [] };
  }
  const legacy = entries.filter((n) => n.endsWith(LEGACY_LOCK_SUFFIX)).sort();
  if (entries.includes(INDEX_LOCK)) {
    if (legacy.length > 0) {
      return {
        names: [],
        conflict: `${join(root, INDEX_LOCK)} and ${legacy.map((n) => join(root, n)).join(", ")} both exist — one lock per checkout; keep ${INDEX_LOCK} (\`git mv\` the legacy one over it, or remove the stale one) rather than have two replayed`,
      };
    }
    return { names: [INDEX_LOCK] };
  }
  return { names: legacy };
}

/** Every lock beside `root` ({@link lockNames}), parsed structurally. A malformed one — or two that conflict — is an answer, not a skip. */
export function readLocks(root: string): { file: string; instances?: LockInstance[]; error?: string }[] {
  const { names, conflict } = lockNames(root);
  if (conflict !== undefined) return [{ file: join(root, INDEX_LOCK), error: conflict }];
  return names.map((n) => {
    const file = join(root, n);
    try {
      const raw = JSON.parse(readFileSync(file, "utf-8")) as { $schema?: unknown; instances?: unknown };
      if (raw.$schema !== "cat-harness-mount-lock/v1") return { file, error: `not a cat-harness-mount-lock/v1 lock` };
      if (!Array.isArray(raw.instances)) return { file, error: "no `instances` array" };
      const bad = (raw.instances as LockInstance[]).find(
        (i) =>
          typeof i?.instance !== "string" ||
          typeof i.repository !== "string" ||
          !SHA.test(String(i.sha)) ||
          typeof i.path !== "string" ||
          !Array.isArray(i.directories) ||
          i.directories.some((d) => typeof d?.path !== "string" || typeof d.upstreamPath !== "string" || !DIGEST.test(String(d.treeDigest))),
      );
      if (bad) return { file, error: `instance \`${String((bad as { instance?: unknown })?.instance)}\` is malformed` };
      return { file, instances: raw.instances as LockInstance[] };
    } catch (e) {
      return { file, error: `not JSON: ${(e as Error).message}` };
    }
  });
}

/** A lock path may not climb out of the root or land on it. */
function safeRel(p: string): boolean {
  const parts = p.split("/");
  return p !== "" && !p.startsWith("/") && !parts.includes("..") && !parts.some((s) => s.startsWith("."));
}

// ── git ──────────────────────────────────────────────────────────────────────

function git(cwd: string, args: string[]): { status: number; stdout: string; stderr: string } {
  const r = spawnSync("git", args, { cwd, encoding: "utf-8", maxBuffer: 1 << 28 });
  return { status: r.status ?? 128, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

export function urlFor(repository: string): string {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(repository) || repository.startsWith("/")) return repository;
  const prefix = process.env.CAT_MOUNT_URL_PREFIX;
  return prefix ? `${prefix.replace(/\/+$/, "")}/${repository}` : `https://github.com/${repository}.git`;
}

function tracked(root: string, rel: string): boolean {
  const r = git(root, ["ls-files", "--", rel]);
  return r.status === 0 && r.stdout.trim() !== "";
}

function ensureIgnored(root: string, rel: string): void {
  if (git(root, ["rev-parse", "--git-dir"]).status !== 0) return;
  if (git(root, ["check-ignore", "-q", "--no-index", `${rel}/`]).status === 0) return;
  const prefix = git(root, ["rev-parse", "--show-prefix"]).stdout.trim();
  const file = resolve(root, git(root, ["rev-parse", "--git-path", "info/exclude"]).stdout.trim());
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, `# remote mount (bean nn8e) — bun run cat mount:lock\n/${prefix}${rel}/\n`);
}

/** Shallow, blobless fetch of one commit, then a sparse checkout of `paths`. Returns the work tree. */
function fetchAt(repository: string, sha: string, paths: string[]): string {
  const dir = mkdtempSync(join(tmpdir(), "mount-from-lock-"));
  const steps: string[][] = [
    ["init", "-q"],
    ["fetch", "-q", "--depth", "1", "--filter=blob:none", urlFor(repository), sha],
    ["sparse-checkout", "set", "--no-cone", ...paths],
    ["checkout", "-q", "FETCH_HEAD"],
  ];
  for (const s of steps) {
    const r = git(dir, s);
    if (r.status !== 0) {
      rmSync(dir, { recursive: true, force: true });
      throw new Error(`git ${s[0]} failed: ${r.stderr.trim().split("\n").pop() ?? r.status}`);
    }
  }
  const head = git(dir, ["rev-parse", "FETCH_HEAD"]).stdout.trim();
  if (head !== sha) {
    rmSync(dir, { recursive: true, force: true });
    throw new Error(`the remote served ${head} for ${sha}`);
  }
  return dir;
}

// ── One instance ─────────────────────────────────────────────────────────────

/** Is every locked directory of `inst` on disk with the locked digest? Lists the ones that are not. */
function drift(root: string, inst: LockInstance): { absent: string[]; changed: string[] } {
  const absent: string[] = [];
  const changed: string[] = [];
  const decl = join(root, inst.path, inst.declaration.file);
  if (!existsSync(decl)) absent.push(`${inst.path}/${inst.declaration.file}`);
  else if (sha256(readFileSync(decl)) !== inst.declaration.sha256) changed.push(`${inst.path}/${inst.declaration.file}`);
  for (const d of inst.directories) {
    const abs = join(root, d.path);
    if (!existsSync(abs)) absent.push(d.path);
    else if (digestOf(abs).treeDigest !== d.treeDigest) changed.push(d.path);
  }
  return { absent, changed };
}

export function checkInstance(root: string, inst: LockInstance): Outcome {
  const { absent, changed } = drift(root, inst);
  if (changed.length) return { instance: inst.instance, state: "missing", detail: `${changed.join(", ")} no longer hash to the lock` };
  if (absent.length) return { instance: inst.instance, state: "missing", detail: `not on disk: ${absent.join(", ")} — run \`bun run cat mount:lock\`` };
  return { instance: inst.instance, state: "current", detail: `${inst.directories.length} director${inst.directories.length === 1 ? "y" : "ies"} at ${inst.sha.slice(0, 12)}` };
}

export function mountInstance(root: string, inst: LockInstance): Outcome {
  const id = inst.instance;
  const bad = [inst.path, ...inst.directories.map((d) => d.path)].find((p) => !safeRel(p));
  if (bad !== undefined) return { instance: id, state: "could-not-determine", detail: `lock path \`${bad}\` climbs out of the checkout or is dot-prefixed` };
  const { absent, changed } = drift(root, inst);
  if (changed.length) {
    return { instance: id, state: "missing", detail: `left untouched: ${changed.join(", ")} no longer hash to the lock — edits there are somebody's work; move them upstream or delete the directory, then re-mount` };
  }
  if (absent.length === 0) return checkInstance(root, inst);
  const trackedPath = inst.directories.map((d) => d.path).find((p) => tracked(root, p));
  if (trackedPath) return { instance: id, state: "missing", detail: `\`${trackedPath}/\` holds tracked files — a mount never lands on tracked bytes` };

  const upstreamDecl = inst.upstreamRoot ? `${inst.upstreamRoot.replace(/\/+$/, "")}/${inst.declaration.file}` : inst.declaration.file;
  const sparse = [`/${upstreamDecl}`, ...inst.directories.map((d) => (d.upstreamPath === "." ? "/*" : `/${d.upstreamPath.replace(/\/+$/, "")}/`))];
  let work: string;
  try {
    work = fetchAt(inst.repository, inst.sha, sparse);
  } catch (e) {
    return { instance: id, state: "could-not-determine", detail: `could not fetch ${inst.repository}@${inst.sha.slice(0, 12)}: ${(e as Error).message}` };
  }
  try {
    const written: string[] = [];
    const declSrc = join(work, upstreamDecl);
    if (!existsSync(declSrc) || sha256(readFileSync(declSrc)) !== inst.declaration.sha256) {
      return { instance: id, state: "could-not-determine", detail: `the declaration \`${upstreamDecl}\` at ${inst.sha.slice(0, 12)} is absent or does not hash to the lock` };
    }
    for (const d of inst.directories) {
      if (!absent.includes(d.path)) continue;
      const src = d.upstreamPath === "." ? work : join(work, d.upstreamPath);
      if (!existsSync(src)) {
        for (const w of written) rmSync(join(root, w), { recursive: true, force: true });
        return { instance: id, state: "missing", detail: `\`${d.upstreamPath}\` is not in ${inst.repository}@${inst.sha.slice(0, 12)}, though the lock records it` };
      }
      const dst = join(root, d.path);
      mkdirSync(dirname(dst), { recursive: true });
      cpSync(src, dst, { recursive: true, verbatimSymlinks: true, force: true, filter: (from) => from !== join(work, ".git") });
      written.push(d.path);
      const got = digestOf(dst).treeDigest;
      if (got !== d.treeDigest) {
        for (const w of written) rmSync(join(root, w), { recursive: true, force: true });
        return { instance: id, state: "could-not-determine", detail: `\`${d.path}\` fetched at ${inst.sha.slice(0, 12)} hashes to ${got.slice(0, 12)}, the lock says ${d.treeDigest.slice(0, 12)} — removed, not kept` };
      }
    }
    const declDst = join(root, inst.path, inst.declaration.file);
    if (!existsSync(declDst)) {
      mkdirSync(dirname(declDst), { recursive: true });
      cpSync(declSrc, declDst);
    }
    ensureIgnored(root, inst.path);
    for (const d of inst.directories) ensureIgnored(root, d.path);
    const files = inst.directories.reduce((n, d) => n + d.files, 0);
    return { instance: id, state: "mounted", detail: `${written.length} director${written.length === 1 ? "y" : "ies"}, ${files} file(s) from ${inst.repository}@${inst.sha.slice(0, 12)}` };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

// ── All of them ──────────────────────────────────────────────────────────────

export function exitCode(outcomes: Outcome[]): 0 | 1 | 2 {
  if (outcomes.some((o) => o.state === "could-not-determine")) return 2;
  if (outcomes.some((o) => o.state === "missing")) return 1;
  return 0;
}

export function run(root: string, check: boolean): { outcomes: Outcome[]; locks: number } {
  const outcomes: Outcome[] = [];
  const locks = readLocks(root);
  for (const l of locks) {
    if (l.error) {
      outcomes.push({ instance: relative(root, l.file), state: "could-not-determine", detail: l.error });
      continue;
    }
    for (const inst of l.instances!) outcomes.push(check ? checkInstance(root, inst) : mountInstance(root, inst));
  }
  return { outcomes, locks: locks.length };
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const check = argv.includes("--check");
  const at = argv.indexOf("--root");
  const root = resolve(at >= 0 && argv[at + 1] ? argv[at + 1]! : process.cwd());
  const { outcomes, locks } = run(root, check);
  if (locks === 0) {
    console.log(`mount:lock: not-enabled — no ${INDEX_LOCK} (or legacy *${LEGACY_LOCK_SUFFIX}) in ${root}`);
    process.exit(0);
  }
  for (const o of outcomes) console.log(`  ${o.state.padEnd(20)} ${o.instance.padEnd(22)} ${o.detail}`);
  const code = exitCode(outcomes);
  console.log(`mount:lock${check ? " --check" : ""}: ${outcomes.length} instance(s) — ${code === 0 ? "OK" : code === 1 ? "MISSING" : "COULD NOT DETERMINE"}`);
  process.exit(code);
}
