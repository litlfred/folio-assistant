#!/usr/bin/env bun
/**
 * The CI cone. A pull request's CI skips a check whose inputs are unchanged
 * since main's last green run (bean `4rbc`, issue #2456, building on `f017`).
 *
 * @module scripts/ci-cone
 * @graphNode none — a CI helper behind `gate-shell.sh`, not a gate itself
 *
 * ## The rule: declared or derived, never inferred
 *
 * Owner, 2026-10-07: *"derived is BEST"*, then *"DERIVED = no drift, no extra
 * data fields"*. `f017` skips a check only on DECLARED inputs, and every
 * skippable declaration is `{tracked}`, the whole tree. So any PR moves every
 * fingerprint, and a PR skips nothing. Measured on `1d28c5c4562`: a one-line
 * bean edit moved the fingerprint of checks that never read beans.
 *
 * This module adds the second source, the DERIVED read set. It is computed from
 * the run itself and is never stored as authored or committed data:
 *
 * 1. **Record (a push to main).** Every candidate check runs under
 *    `strace -f`. The files, directories and absent paths that run touched
 *    inside the checkout are its read set. They are recorded with the state of
 *    each one and the check's `f017` fingerprint (script closure, audited
 *    environment, tool versions and `--against` baseline, but not the tree),
 *    in `build/ci-cone/records.json`. The workflow caches that file under
 *    main's sha. It holds only what that run measured.
 * 2. **Decide (a pull request).** The PR restores the record of its nearest
 *    main ancestor. It re-computes the fingerprint on its own tree, and the
 *    state of every recorded path. It skips only on an exact match, and says
 *    `SKIPPED — inputs unchanged since <sha>`, never "passed".
 *
 * ## Why an exact match is enough
 *
 * The verdict and its read set come from the same run, so there is no
 * declaration that could drift from the code. Take a run on main that read the
 * set R and passed. A PR run with the same code (the fingerprint hashes the
 * script's import closure) and the same content at every path in R starts in
 * the same state. The input-site audit (`input-sites.ts`) makes every other
 * input hashed or refused: the environment, the clock, the network and git
 * history. So the PR run would take the same path, read the same R and give
 * the same answer. A data-dependent read is covered, because the files that
 * decided which path the run took are in R and their content must match.
 *
 * **The caveat.** A trace covers only the path that run took. The argument
 * above is what makes that enough, and it holds only for a check whose reads
 * the trace can enumerate. Anything else is recorded as undetermined, never
 * as clean, so it always runs:
 * - a write inside the checkout;
 * - a relative path whose directory the trace does not name;
 * - a syscall this parser does not classify;
 * - more than {@link MAX_PATHS} paths;
 * - a `tree` site (git's view of the tree, refused by `f017` for any input set
 *   narrower than `{tracked}`);
 * - a `traced` input site the run reached.
 *
 * ## What is left out of a read set, each for a reason
 *
 * - **Paths outside the checkout** (system libraries, `/tmp`, the bun install
 *   cache). These are the environment. `f017` hashes the bun and git versions
 *   and the audited variables, and accepts the same exposure.
 * - **The top-level `node_modules/`.** `bun.lock` pins it, every fingerprint
 *   hashes `bun.lock`, and CI installs with `--frozen-lockfile`. A NESTED
 *   `node_modules` is not pinned that way (bean `xd1g`), so it is read like
 *   any other directory.
 * - **`.git/` read by a `git` process.** What git answers is an input site,
 *   audited and hashed by `f017` (`head`, `refs`) or refused (`tree`). The
 *   script's own reads of `.git` are kept.
 * - **This module's own directory and the input-hash cache.** They are
 *   written by the recording machinery, never read by a check.
 */
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, lstatSync, statSync, mkdirSync, readdirSync, readFileSync, readlinkSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, normalize, resolve } from "node:path";
import {
  againstRefsOf,
  checkFingerprint,
  FileDigests,
  qaBaselineIdentity,
  RECIPE_VERSION,
  TRACKED,
  type BaselineResolver,
  type Fingerprint,
  type PairIO,
} from "./input-hash.ts";
import { openTrace } from "./input-trace.ts";
import { collectTaskIo } from "./task-io.ts";
import { scriptsOf } from "../schemas/script-table.ts";

/** Bump when the parser or the read-set rules change. A record from another version is ignored, so every check runs. */
export const TRACER_VERSION = 2;

/** Where the records live, relative to the checkout. `build/` is git-ignored, and the workflow caches this directory. */
export const CONE_DIR = join("build", "ci-cone");
export const RECORD_FILE = join(CONE_DIR, "records.json");

/** A read set larger than this is not enumerated: the check is recorded as undetermined. */
export const MAX_PATHS = 20000;

/**
 * A trace file larger than this is not parsed: the check is recorded as
 * undetermined. Measured 2026-10-07: `kg:audit:all:check` spawns a process
 * per instance, and parsing its whole trace in memory aborted the recorder
 * (exit 134) after the check itself had passed.
 */
export const MAX_TRACE_BYTES = 256 * 1024 * 1024;

/** What `strace` traces: every path-taking syscall, `getcwd`, and process creation for the cwd of each child. */
export const STRACE_ARGS = ["-f", "-qq", "-y", "-s", "65536", "-e", "trace=%file,getcwd,clone,clone3,fork,vfork", "-e", "signal=none"] as const;

/** One git command a traced run executed: where, and with what arguments (after `git`). */
export interface GitCall {
  /** Repo-relative directory it ran in (`""` for the root). */
  cwd: string;
  args: string[];
}

export type ReadSet = { paths: string[]; git: GitCall[] } | { undetermined: string };

/**
 * Git subcommands the cone may REPLAY on a PR to ask git's view of the tree
 * again (a `tree` site). Each only reads, and takes no input on stdin. Any
 * other git command a run executes makes its read set undetermined.
 */
const GIT_READ_ONLY = new Set([
  "ls-files", "ls-tree", "rev-parse", "cat-file", "show", "log", "rev-list", "merge-base", "for-each-ref",
  "show-ref", "describe", "name-rev", "diff", "diff-tree", "check-ignore", "config", "grep", "version",
]);

/**
 * The replayable form of a git command line, or why it is not one. Global
 * options are `-C <dir>` (folded into the cwd), `-c <k=v>`, `--no-pager` and
 * `--no-optional-locks`; anything else before the subcommand is refused.
 */
export function gitReplayable(cwd: string, argv: readonly string[]): GitCall | { undetermined: string } {
  let dir = cwd;
  let i = 0;
  const args: string[] = [];
  for (; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "-C") {
      const next = argv[++i];
      if (next === undefined) return { undetermined: "git -C with no directory" };
      dir = normalize(join(dir === "" ? "." : dir, next)).replace(/^\.$/, "");
      continue;
    }
    if (a === "-c") {
      const next = argv[++i];
      if (next === undefined) return { undetermined: "git -c with no value" };
      args.push(a, next);
      continue;
    }
    if (a === "--no-pager" || a === "--no-optional-locks") {
      args.push(a);
      continue;
    }
    if (a.startsWith("-")) return { undetermined: `git global option ${a}` };
    break;
  }
  const sub = argv[i];
  if (sub === undefined) return { undetermined: "git with no subcommand" };
  const rest = argv.slice(i + 1);
  if (!GIT_READ_ONLY.has(sub)) return { undetermined: `git ${sub} is not a read-only command the cone replays` };
  if (rest.some((a) => /^--(stdin|batch|output|ext-diff|textconv|edit)/.test(a))) return { undetermined: `git ${sub} ${rest.join(" ")} reads stdin, writes or runs a helper` };
  if (sub === "config" && !rest.some((a) => /^(--get|--get-all|--get-regexp|--list|-l)$/.test(a))) return { undetermined: "git config without a read flag" };
  if (dir.startsWith("..") || dir.startsWith("/")) return { undetermined: `git -C outside the checkout (${dir})` };
  return { cwd: dir, args: [...args, sub, ...rest] };
}

// ── Parsing a trace ─────────────────────────────────────────────────────────

const WRITE_FLAGS = /\b(O_WRONLY|O_RDWR|O_CREAT|O_TRUNC|O_APPEND|O_TMPFILE)\b/;

/**
 * Where each syscall names a path: `[dirfdIndex | -1, pathIndex]` pairs, and
 * whether the syscall WRITES there. A `%file` syscall not in this table makes
 * the read set undetermined. An unknown syscall is never assumed harmless.
 */
const SYSCALLS: Readonly<Record<string, { paths: readonly (readonly [number, number])[]; write: boolean | "flags" }>> = {
  open: { paths: [[-1, 0]], write: "flags" },
  openat: { paths: [[0, 1]], write: "flags" },
  openat2: { paths: [[0, 1]], write: "flags" },
  creat: { paths: [[-1, 0]], write: true },
  stat: { paths: [[-1, 0]], write: false },
  lstat: { paths: [[-1, 0]], write: false },
  stat64: { paths: [[-1, 0]], write: false },
  lstat64: { paths: [[-1, 0]], write: false },
  newfstatat: { paths: [[0, 1]], write: false },
  fstatat64: { paths: [[0, 1]], write: false },
  statx: { paths: [[0, 1]], write: false },
  access: { paths: [[-1, 0]], write: false },
  faccessat: { paths: [[0, 1]], write: false },
  faccessat2: { paths: [[0, 1]], write: false },
  readlink: { paths: [[-1, 0]], write: false },
  readlinkat: { paths: [[0, 1]], write: false },
  statfs: { paths: [[-1, 0]], write: false },
  getxattr: { paths: [[-1, 0]], write: false },
  lgetxattr: { paths: [[-1, 0]], write: false },
  listxattr: { paths: [[-1, 0]], write: false },
  llistxattr: { paths: [[-1, 0]], write: false },
  inotify_add_watch: { paths: [[-1, 1]], write: false },
  execve: { paths: [[-1, 0]], write: false },
  execveat: { paths: [[0, 1]], write: false },
  chdir: { paths: [[-1, 0]], write: false },
  mkdir: { paths: [[-1, 0]], write: true },
  mkdirat: { paths: [[0, 1]], write: true },
  rmdir: { paths: [[-1, 0]], write: true },
  unlink: { paths: [[-1, 0]], write: true },
  unlinkat: { paths: [[0, 1]], write: true },
  rename: { paths: [[-1, 0], [-1, 1]], write: true },
  renameat: { paths: [[0, 1], [2, 3]], write: true },
  renameat2: { paths: [[0, 1], [2, 3]], write: true },
  link: { paths: [[-1, 0], [-1, 1]], write: true },
  linkat: { paths: [[0, 1], [2, 3]], write: true },
  symlink: { paths: [[-1, 1]], write: true },
  symlinkat: { paths: [[1, 2]], write: true },
  chmod: { paths: [[-1, 0]], write: true },
  fchmodat: { paths: [[0, 1]], write: true },
  fchmodat2: { paths: [[0, 1]], write: true },
  chown: { paths: [[-1, 0]], write: true },
  lchown: { paths: [[-1, 0]], write: true },
  fchownat: { paths: [[0, 1]], write: true },
  truncate: { paths: [[-1, 0]], write: true },
  utime: { paths: [[-1, 0]], write: true },
  utimes: { paths: [[-1, 0]], write: true },
  utimensat: { paths: [[0, 1]], write: true },
  futimesat: { paths: [[0, 1]], write: true },
  mknod: { paths: [[-1, 0]], write: true },
  mknodat: { paths: [[0, 1]], write: true },
  setxattr: { paths: [[-1, 0]], write: true },
  lsetxattr: { paths: [[-1, 0]], write: true },
  removexattr: { paths: [[-1, 0]], write: true },
  lremovexattr: { paths: [[-1, 0]], write: true },
};

/** Syscalls that are traced for the cwd bookkeeping only. */
const PROCESS_CALLS = new Set(["clone", "clone3", "fork", "vfork", "getcwd", "fchdir"]);

/** Split a syscall's argument list at top-level commas, respecting quotes and brackets. */
export function splitArgs(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  let inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (inStr) {
      cur += c;
      if (c === "\\") {
        cur += s[++i] ?? "";
      } else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "(" || c === "[" || c === "{" || c === "<") depth++;
    else if (c === ")" || c === "]" || c === "}" || c === ">") depth--;
    if (c === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.trim() !== "") out.push(cur.trim());
  return out;
}

/** The C-escaped string literal strace printed, decoded; `undefined` when the argument is not a string. */
export function unquote(arg: string): string | undefined {
  const m = /^"((?:[^"\\]|\\.)*)"(\.\.\.)?$/.exec(arg);
  if (m === null || m[2] !== undefined) return undefined; // `...` = truncated: not a whole path
  return m[1]!.replace(/\\(x[0-9a-fA-F]{2}|[0-7]{1,3}|.)/g, (_, e: string) => {
    if (e[0] === "x") return String.fromCharCode(parseInt(e.slice(1), 16));
    if (/^[0-7]+$/.test(e)) return String.fromCharCode(parseInt(e, 8));
    return ({ n: "\n", t: "\t", r: "\r", v: "\v", f: "\f" } as Record<string, string>)[e] ?? e;
  });
}

/** The path a `-y` fd decoration names: `AT_FDCWD</x>` or `5</x>` gives `/x`. */
function fdPath(arg: string): string | undefined {
  const m = /^(?:AT_FDCWD|-?\d+)<(.*)>$/.exec(arg);
  return m === null ? undefined : m[1];
}

interface Call {
  pid: number;
  name: string;
  args: string[];
  ret: string;
}

/** Join `<unfinished ...>` with its `<... resumed>`, in the order the calls STARTED. */
function calls(text: string): Call[] | { undetermined: string } {
  const pending = new Map<number, { index: number; head: string }>();
  const done: { index: number; line: string; pid: number }[] = [];
  let index = 0;
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (line === "") continue;
    const m = /^(\d+)\s+(.*)$/.exec(line);
    if (m === null) continue;
    const pid = Number(m[1]);
    const body = m[2]!;
    if (body.startsWith("+++") || body.startsWith("---")) continue; // exit and signal notes
    const resumed = /^<\.\.\. (\w+) resumed>(.*)$/.exec(body);
    if (resumed !== null) {
      const p = pending.get(pid);
      if (p === undefined) return { undetermined: `pid ${pid}: a resumed ${resumed[1]} with no start` };
      pending.delete(pid);
      done.push({ index: p.index, line: p.head + resumed[2]!, pid });
      continue;
    }
    const unfinished = /^(.*?)\s*<unfinished \.\.\.>$/.exec(body);
    if (unfinished !== null) {
      pending.set(pid, { index: index++, head: unfinished[1]! });
      continue;
    }
    done.push({ index: index++, line: body, pid });
  }
  // A call left unfinished when its process died has no result, but its
  // arguments are known, and that is all a read set needs.
  for (const [pid, p] of pending) done.push({ index: p.index, line: `${p.head}) = ?`, pid });
  done.sort((a, b) => a.index - b.index);
  const out: Call[] = [];
  for (const d of done) {
    const m = /^(\w+)\((.*)\)\s+=\s+(.*)$/.exec(d.line);
    if (m === null) return { undetermined: `unparsed trace line: ${d.line.slice(0, 160)}` };
    out.push({ pid: d.pid, name: m[1]!, args: splitArgs(m[2]!), ret: m[3]! });
  }
  return out;
}

/**
 * The repo-relative paths a traced run touched, or why they cannot be
 * enumerated. `root` is the checkout; paths outside it are left out (see the
 * module comment for why, and for the other exclusions).
 */
export function parseTrace(text: string, root: string): ReadSet {
  const parsed = calls(text);
  if ("undetermined" in parsed) return parsed;
  const roots = [...new Set([resolve(root), safeRealpath(root)])];
  /** Each process's cwd, shared by the tasks created with CLONE_FS (threads). */
  const cwd = new Map<number, { dir: string | undefined }>();
  /** The pids that exec'd `git`, whose reads of `.git` are git's answer, not the script's. */
  const gitPids = new Set<number>();
  const cell = (pid: number) => {
    let c = cwd.get(pid);
    if (c === undefined) {
      c = { dir: undefined };
      cwd.set(pid, c);
    }
    return c;
  };
  const paths = new Set<string>();
  const git = new Map<string, GitCall>();
  const writes: string[] = [];
  for (const c of parsed) {
    const me = cell(c.pid);
    for (const a of c.args) {
      if (a.startsWith("AT_FDCWD<")) me.dir = fdPath(a);
    }
    if (c.name === "getcwd") {
      const p = c.args[0] === undefined ? undefined : unquote(c.args[0]);
      if (p !== undefined && /^\d+$/.test(c.ret)) me.dir = p;
      continue;
    }
    if (c.name === "fchdir") {
      if (/^0\b/.test(c.ret)) me.dir = fdPath(c.args[0] ?? "");
      continue;
    }
    if (c.name === "clone" || c.name === "clone3" || c.name === "fork" || c.name === "vfork") {
      const child = /^(\d+)/.exec(c.ret);
      if (child === null) continue;
      const shared = c.args.some((a) => /\bCLONE_FS\b/.test(a));
      cwd.set(Number(child[1]), shared ? me : { dir: me.dir });
      continue;
    }
    const spec = SYSCALLS[c.name];
    if (spec === undefined) {
      if (PROCESS_CALLS.has(c.name)) continue;
      return { undetermined: `unclassified syscall ${c.name}` };
    }
    let write = spec.write === true || (spec.write === "flags" && c.args.some((a) => WRITE_FLAGS.test(a)));
    for (const [fdIndex, pathIndex] of spec.paths) {
      const raw = c.args[pathIndex];
      if (raw === undefined || raw === "NULL") continue;
      const p = unquote(raw);
      if (p === undefined) return { undetermined: `${c.name}: a path strace did not print whole (${raw.slice(0, 80)})` };
      let abs: string;
      if (p === "") {
        continue; // AT_EMPTY_PATH: the fd itself, already recorded when it was opened
      } else if (p.startsWith("/")) {
        abs = normalize(p).replace(/(.)\/+$/, "$1");
      } else {
        const base = fdIndex >= 0 ? fdPath(c.args[fdIndex] ?? "") : me.dir;
        if (base === undefined) return { undetermined: `${c.name}("${p}") from pid ${c.pid}: relative to a directory the trace does not name` };
        abs = normalize(join(base, p)).replace(/(.)\/+$/, "$1");
      }
      if (c.name === "execve" && /(^|\/)git$/.test(abs) && /^0\b/.test(c.ret)) {
        gitPids.add(c.pid);
        const argv = arrayArg(c.args[1] ?? "");
        if (argv === undefined) return { undetermined: `a git command line strace did not print whole (${(c.args[1] ?? "").slice(0, 80)})` };
        const where = me.dir === undefined ? undefined : repoRelative(roots, me.dir);
        if (where === undefined) return { undetermined: `git ${argv.slice(1).join(" ")} ran outside the checkout, or where the trace does not say` };
        const call = gitReplayable(where, argv.slice(1));
        if ("undetermined" in call) return call;
        git.set(JSON.stringify(call), call);
      }
      if (c.name === "chdir") {
        if (/^0\b/.test(c.ret)) me.dir = abs;
        write = false;
      }
      const rel = repoRelative(roots, abs);
      if (rel === undefined || excluded(rel, gitPids.has(c.pid))) continue;
      if (write) writes.push(`${c.name} ${rel || "."}`);
      else paths.add(rel);
    }
  }
  if (writes.length > 0) return { undetermined: `the check writes inside the checkout (${writes.slice(0, 3).join(", ")})` };
  if (paths.size > MAX_PATHS) return { undetermined: `the run touched ${paths.size} paths, more than ${MAX_PATHS}` };
  return { paths: [...paths].sort(), git: [...git.values()] };
}

/** An `execve` argv array as strace prints it, or `undefined` when any element was cut short. */
function arrayArg(arg: string): string[] | undefined {
  const m = /^\[(.*)\]$/.exec(arg);
  if (m === null) return undefined;
  const out: string[] = [];
  for (const a of splitArgs(m[1]!)) {
    const u = unquote(a);
    if (u === undefined) return undefined;
    out.push(u);
  }
  return out;
}

function safeRealpath(p: string): string {
  try {
    return realpathSync(p);
  } catch {
    return resolve(p);
  }
}

function repoRelative(roots: readonly string[], abs: string): string | undefined {
  for (const r of roots) {
    if (abs === r) return "";
    if (abs.startsWith(`${r}/`)) return abs.slice(r.length + 1);
  }
  return undefined;
}

/** The exclusions the module comment gives reasons for. */
export function excluded(rel: string, byGit: boolean): boolean {
  if (rel === "node_modules" || rel.startsWith("node_modules/")) return true;
  if (rel === CONE_DIR || rel.startsWith(`${CONE_DIR}/`)) return true;
  const cacheDir = join("build", "regen-cache");
  if (rel === cacheDir || rel.startsWith(`${cacheDir}/`)) return true;
  if (byGit && /(^|\/)\.git(\/|$)/.test(rel)) return true;
  return false;
}

// ── The state of a path ─────────────────────────────────────────────────────

/**
 * What a path holds now, as one string: `absent`, a directory's sorted entry
 * names, a symlink's target with what it resolves to, or a file's content
 * digest. A path the run only `stat`ed is hashed by content too, so a size or
 * type it read cannot change unnoticed.
 */
export function pathState(root: string, rel: string, digests: FileDigests): string {
  const abs = rel === "" ? root : join(root, rel);
  let st;
  try {
    st = lstatSync(abs);
  } catch {
    return "absent";
  }
  if (st.isSymbolicLink()) {
    let target = "?";
    try {
      target = readlinkSync(abs);
    } catch {
      /* raced away */
    }
    let resolved = "dangling";
    try {
      resolved = statState(abs, rel, digests);
    } catch {
      /* dangling link */
    }
    return `link ${target} -> ${resolved}`;
  }
  return statState(abs, rel, digests);
}

function statState(abs: string, rel: string, digests: FileDigests): string {
  let names: string[] | undefined;
  try {
    names = readdirSync(abs).sort();
  } catch {
    names = undefined;
  }
  if (names !== undefined) return `dir ${createHash("sha256").update(names.join("\0")).digest("hex")}`;
  return `file ${digests.digest(rel)}`;
}

/** The key a git call is recorded under. */
export function gitKey(c: GitCall): string {
  return JSON.stringify([c.cwd, ...c.args]);
}

/** What a git command answers now: its exit status and the digests of what it printed. */
export function gitState(root: string, c: GitCall): string {
  const r = Bun.spawnSync(["git", ...c.args], { cwd: c.cwd === "" ? root : join(root, c.cwd), stdout: "pipe", stderr: "pipe", stdin: "ignore" });
  const h = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
  return `exit ${r.exitCode} out ${h(r.stdout)} err ${h(r.stderr)}`;
}

// ── Records ─────────────────────────────────────────────────────────────────

/** One check's verdict on main, with what it read. */
export interface ConeCheck {
  /** The main commit whose green run recorded it. */
  sha: string;
  /** The `f017` fingerprint without the tree: script closure, audited env, tools, baseline. */
  base: string;
  /** Every path the run touched inside the checkout, and its state after the run. */
  reads: Record<string, string>;
  /** Every git command it ran ({@link gitKey}), and what that command answered after the run. */
  git: Record<string, string>;
}

export interface ConeRecords {
  version: number;
  recipe: number;
  /** The main commit whose run wrote this file. */
  sha: string;
  checks: Record<string, ConeCheck>;
}

/** The record file, or `undefined` when it is absent, corrupt or from another recipe — then every check runs. */
export function loadRecords(root: string): ConeRecords | undefined {
  try {
    const raw = JSON.parse(readFileSync(join(root, RECORD_FILE), "utf-8")) as ConeRecords;
    if (raw.version === TRACER_VERSION && raw.recipe === RECIPE_VERSION && typeof raw.checks === "object" && raw.checks !== null) return raw;
  } catch {
    /* absent or corrupt */
  }
  return undefined;
}

export function saveRecords(root: string, records: ConeRecords): void {
  const path = join(root, RECORD_FILE);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(records, null, 1)}\n`);
}

/**
 * The fingerprint a cone record is keyed on: `f017`'s, over the script, the
 * audited environment, the tools and the baseline, but with NO tree input,
 * because the read set stands in for the tree. Only a check that `task-io`
 * declares `{tracked}` is a candidate. That declaration is the claim, read
 * for writes, that `f017` already relies on.
 */
export function coneFingerprint(
  root: string,
  scripts: Readonly<Record<string, string>>,
  script: string,
  io: PairIO | undefined,
  digests: FileDigests,
  baseline: BaselineResolver | undefined,
): Fingerprint {
  if (io?.inputs?.includes(TRACKED) !== true) return { undetermined: "not declared {tracked} in task-io, so not a candidate" };
  return checkFingerprint(root, scripts, script, { inputs: [], outputs: io.outputs }, digests, baseline, { treeReplayed: true });
}

export type ConeDecision = { skip: true; sha: string; why: string } | { skip: false; why: string };

/** Whether a PR may skip `script`: its fingerprint and every recorded path match main's green run exactly. */
export function decideCone(records: ConeRecords | undefined, script: string, fp: Fingerprint, root: string, digests: FileDigests): ConeDecision {
  if (records === undefined) return { skip: false, why: "no record from a green main run" };
  const rec = records.checks[script];
  if (rec === undefined) return { skip: false, why: `main's run ${records.sha.slice(0, 12)} recorded nothing for this check` };
  if ("undetermined" in fp) return { skip: false, why: `inputs could not be determined: ${fp.undetermined}` };
  if (fp.hash !== rec.base) return { skip: false, why: "the script, its imports, the audited environment or the baseline changed" };
  for (const [p, state] of Object.entries(rec.reads)) {
    let now: string;
    try {
      now = pathState(root, p, digests);
    } catch (e) {
      return { skip: false, why: `could not read ${p}: ${(e as Error).message}` };
    }
    if (now !== state) return { skip: false, why: `${p || "."} changed` };
  }
  if (typeof rec.git !== "object" || rec.git === null) return { skip: false, why: "the record has no git answers" };
  for (const [key, state] of Object.entries(rec.git)) {
    let call: GitCall;
    try {
      const [cwd, ...args] = JSON.parse(key) as string[];
      call = { cwd: cwd!, args };
    } catch {
      return { skip: false, why: `an unreadable git record ${key}` };
    }
    if (gitState(root, call) !== state) return { skip: false, why: `git ${call.args.join(" ")} answers differently` };
  }
  return { skip: true, sha: rec.sha, why: `inputs unchanged since ${rec.sha} (${Object.keys(rec.reads).length} paths)` };
}

/**
 * The record of one traced run, or why it records nothing. A record needs all
 * of these: the run passed, it reached no `traced` site, its trace can be
 * enumerated, and its fingerprint was the same before and after the run.
 */
export function coneRecordOf(args: {
  sha: string;
  passed: boolean;
  before: Fingerprint;
  after: Fingerprint;
  reads: ReadSet;
  reached: string | undefined;
  root: string;
  digests: FileDigests;
}): ConeCheck | { none: string } {
  if (!args.passed) return { none: "the check did not pass" };
  if ("undetermined" in args.before) return { none: args.before.undetermined };
  if ("undetermined" in args.after || args.after.hash !== args.before.hash) return { none: "its inputs moved while it ran" };
  if (args.reached !== undefined) return { none: `the run reached a traced input site (${args.reached})` };
  if ("undetermined" in args.reads) return { none: args.reads.undetermined };
  const reads: Record<string, string> = {};
  for (const p of args.reads.paths) reads[p] = pathState(args.root, p, args.digests);
  const git: Record<string, string> = {};
  for (const c of args.reads.git) git[gitKey(c)] = gitState(args.root, c);
  return { sha: args.sha, base: args.before.hash, reads, git };
}

// ── CLI ─────────────────────────────────────────────────────────────────────

function summary(line: string): void {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (path) appendFileSync(path, `${line}\n`);
}

function straceWorks(): boolean {
  const r = Bun.spawnSync(["strace", "-f", "-qq", "-o", "/dev/null", "true"], { stdout: "ignore", stderr: "ignore" });
  return r.exitCode === 0;
}

/** What {@link recordRun} and {@link decideRun} take; tests pass `io` and `baseline` directly. */
export interface ConeRunOpts {
  root: string;
  scripts: Readonly<Record<string, string>>;
  script: string;
  io: PairIO | undefined;
  baseline: BaselineResolver | undefined;
  /** The main commit this run is on (`GITHUB_SHA`). */
  sha: string;
  /** `ignore` silences the check's own output (tests). */
  stdio?: "inherit" | "ignore";
  /** What runs a script by name: `bun run cat` (bean `ar1s` P4), which tests replace. */
  runner?: readonly string[];
}

/** How a gate step runs a script by name, since #2448: `bun run cat <name>`. */
export const RUNNER = ["bun", "run", "cat"] as const;

/**
 * Run `bun run <script>` under the tracer, and record (or forget) what it
 * read. The returned exit code is the check's own; recording never changes it.
 * A check that is not a candidate, or whose fingerprint is undetermined, runs
 * untraced and is not recorded.
 */
export function recordRun(o: ConeRunOpts): { code: number; note: string } {
  const stdio = o.stdio ?? "inherit";
  const plain = (why: string) => {
    const r = Bun.spawnSync([...(o.runner ?? RUNNER), o.script], { cwd: o.root, stdin: stdio, stdout: stdio, stderr: stdio });
    return { code: r.exitCode ?? 1, note: `not traced — ${why}` };
  };
  let before: Fingerprint;
  try {
    before = coneFingerprint(o.root, o.scripts, o.script, o.io, new FileDigests(o.root), o.baseline);
  } catch (e) {
    before = { undetermined: (e as Error).message };
  }
  if ("undetermined" in before) return plain(before.undetermined);
  const trace = openTrace(o.root);
  const log = join(tmpdir(), `ci-cone-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.strace`);
  const r = Bun.spawnSync(["strace", ...STRACE_ARGS, "-o", log, ...(o.runner ?? RUNNER), o.script], {
    cwd: o.root,
    stdin: stdio,
    stdout: stdio,
    stderr: stdio,
    env: trace.env,
  });
  let code = r.exitCode ?? 1;
  if (code !== 0) {
    // The verdict must be the check's, never the tracer's. A traced run that
    // failed is asked again, untraced, and THAT exit status is the answer.
    const again = Bun.spawnSync([...(o.runner ?? RUNNER), o.script], { cwd: o.root, stdin: stdio, stdout: stdio, stderr: stdio });
    code = again.exitCode ?? 1;
    rmSync(log, { force: true });
    return { code, note: `not recorded — the traced run exited ${r.exitCode ?? r.signalCode}; re-run untraced, which exited ${code}` };
  }
  let note: string;
  try {
    const digests = new FileDigests(o.root);
    const rec = coneRecordOf({
      sha: o.sha,
      passed: code === 0,
      before,
      after: coneFingerprint(o.root, o.scripts, o.script, o.io, digests, o.baseline),
      reads: !existsSync(log)
        ? { undetermined: "no trace was written" }
        : statSync(log).size > MAX_TRACE_BYTES
          ? { undetermined: `the trace is ${statSync(log).size} bytes, more than ${MAX_TRACE_BYTES}` }
          : parseTrace(readFileSync(log, "utf-8"), o.root),
      reached: trace.reached(againstRefsOf(o.scripts, o.script)),
      root: o.root,
      digests,
    });
    const records = loadRecords(o.root) ?? { version: TRACER_VERSION, recipe: RECIPE_VERSION, sha: o.sha, checks: {} };
    if ("none" in rec) {
      delete records.checks[o.script];
      note = `not recorded — ${rec.none}`;
    } else {
      records.checks[o.script] = rec;
      note = `recorded (${Object.keys(rec.reads).length} paths)`;
    }
    saveRecords(o.root, records);
  } catch (e) {
    // Recording is never allowed to change the check's verdict.
    note = `not recorded — ${(e as Error).message}`;
  } finally {
    rmSync(log, { force: true });
  }
  return { code, note };
}

/** Whether a PR run may skip `script` against the restored records. Any error is "run". */
export function decideRun(o: Omit<ConeRunOpts, "sha" | "stdio" | "runner">): ConeDecision {
  try {
    const digests = new FileDigests(o.root);
    const fp = coneFingerprint(o.root, o.scripts, o.script, o.io, digests, o.baseline);
    return decideCone(loadRecords(o.root), o.script, fp, o.root, digests);
  } catch (e) {
    return { skip: false, why: `could not decide: ${(e as Error).message}` };
  }
}

function main(argv: readonly string[]): number {
  const [cmd, script] = argv;
  const root = process.cwd();
  const env = process.env;
  const scripts = scriptsOf(root);
  if (cmd === "prepare") {
    // Which mode this job's gate steps run in, through $GITHUB_ENV.
    const out = env.GITHUB_ENV;
    const push = env.GITHUB_EVENT_NAME === "push" && env.GITHUB_REF === "refs/heads/main";
    let mode = "";
    if (push) {
      if (straceWorks()) mode = "record";
      else console.log("ci-cone: strace does not run here, so this main run records nothing and no PR skips against it");
    } else if (env.GITHUB_EVENT_NAME === "pull_request") {
      const rec = loadRecords(root);
      if (rec === undefined) console.log("ci-cone: no usable record from a green main run, so every check runs");
      else {
        mode = "skip";
        console.log(`ci-cone: restored ${Object.keys(rec.checks).length} check record(s) from main ${rec.sha}`);
        summary(
          `### CI cone (bean \`4rbc\`)\n\nRecords restored from main \`${rec.sha}\`. A check listed below was NOT run: ` +
            "every path its green run on that commit read, and its script fingerprint, are unchanged here.\n",
        );
      }
    }
    if (out && mode !== "") appendFileSync(out, `CI_CONE_MODE=${mode}\n`);
    console.log(`ci-cone: mode ${mode || "off"}`);
    return 0;
  }
  if (script === undefined || (cmd !== "decide" && cmd !== "run")) {
    console.error("usage: ci-cone.ts prepare | decide <script> | run <script>");
    return 2;
  }
  let io: PairIO | undefined;
  try {
    io = collectTaskIo(root)[script];
  } catch (e) {
    console.log(`ci-cone: task-io could not be read (${(e as Error).message})`);
  }
  const opts = { root, scripts, script, io, baseline: qaBaselineIdentity({ repoRoot: root }) };
  if (cmd === "decide") {
    // Exit 0 means SKIP. Every other outcome means run.
    const d = decideRun(opts);
    if (!d.skip) {
      console.log(`ci-cone: runs — ${d.why}`);
      return 1;
    }
    console.log(`▸ bun run cat ${script}   SKIPPED — inputs unchanged since ${d.sha}`);
    summary(`- \`${script}\` SKIPPED — ${d.why}`);
    return 0;
  }
  const { code, note } = recordRun({ ...opts, sha: env.GITHUB_SHA ?? "local" });
  console.log(`ci-cone: ${script} ${note}`);
  return code;
}

if (import.meta.main) process.exit(main(process.argv.slice(2)));

