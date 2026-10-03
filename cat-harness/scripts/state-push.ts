#!/usr/bin/env bun
/**
 * state-push — send the mount's edits to the branch THROUGH the library.
 *
 * @module scripts/state-push
 * @graphNode none — the write half of the state mount
 *
 * Bean `2h76`, the `bun run state:push` line. The proposal: *"`bun run
 * state:push` commits and pushes the worktree through the library."*
 *
 * ## Why not `git -C state push`
 *
 * Because that is the lost update. A push from the worktree sends the tree the
 * editor started from plus their edit — so a sibling's write to a DIFFERENT
 * file, landed meanwhile, is reverted by a fast-forward that looks clean, and
 * a sibling's write to the SAME file is overwritten outright. The mount is
 * deliberately detached (`state-mount.ts`) so there is no branch to push and
 * this path cannot be skipped by habit.
 *
 * What goes to the remote instead is a SPLICE: only the paths that actually
 * changed, grafted onto whatever the tip is now, every other file carried
 * across by id. `branch-store.ts` does that and retries over a moved tip.
 *
 * ## The `expect` is free here, and it is the whole safety story
 *
 * The mount is checked out at a known commit, so for every changed path the
 * blob at the mount's own `HEAD` IS what the editor read. That is exactly
 * `Change.expect`. A sibling who edited the same file since gets this write
 * stopped as `conflict` with the paths named, and NOTHING is pushed — rather
 * than one of the two edits quietly disappearing.
 *
 * A file the editor created carries `expect: null`, "must not exist", so two
 * sessions creating the same bean are told instead of both believing they did.
 *
 * ## It does not touch the mount unless the push succeeded
 *
 * On `conflict` or `failed` the worktree is left exactly as it is: the edits
 * are the only copy and this module would be the thing that lost them. After a
 * successful push the mount is moved to the new commit, and only after
 * checking that commit's tree equals what is on disk — so the reset cannot
 * discard an edit that was not actually sent.
 */

import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, readlinkSync } from "node:fs";
import { join } from "node:path";

import { pendingMountChanges, pushMount, BranchStore, tipLocations, type Change, type TipLocation, type WriteResult } from "./branch-store.js";
import { MOUNT_DIR } from "./state-mount.js";

export interface PushOptions {
  repoRoot?: string;
  message?: string;
  /** Report what would be sent and send nothing. */
  dryRun?: boolean;
  /** The branch to push to, when no declaration names one yet. */
  branch?: string;
}

/**
 * One declared graph's splice, in the fan-out — the write half of
 * `state-mount.ts`'s {@link GraphMount}.
 *
 * `state` is {@link pushMount}'s verdict verbatim. `unchanged` and `pushed`
 * are both successes; `conflict` means a sibling edited the same path since
 * this mount was taken and **nothing was sent for that graph**, which is a
 * finding rather than a loss — the edits are still on disk.
 */
export interface GraphPush {
  id: string;
  branch: string;
  path: string;
  state: "pushed" | "unchanged" | "would-push" | "conflict" | "absent" | "refused" | "failed";
  reason: string;
  changes?: Change[];
  write?: WriteResult;
}

/** A graph whose splice did not lose anything and needs no further action. */
export function isSettled(g: GraphPush): boolean {
  return g.state === "pushed" || g.state === "unchanged" || g.state === "would-push";
}

export type PushResult =
  | { state: "no-mount"; reason: string; graphs?: GraphPush[] }
  | { state: "nothing"; reason: string; graphs?: GraphPush[] }
  | { state: "would-push"; reason: string; changes: Change[]; graphs?: GraphPush[] }
  | { state: "pushed"; reason: string; changes: Change[]; write: WriteResult; graphs?: GraphPush[] }
  | { state: "conflict"; reason: string; changes: Change[]; write: WriteResult; graphs?: GraphPush[] }
  | { state: "failed"; reason: string; changes?: Change[]; write?: WriteResult; graphs?: GraphPush[] }
  /** SOME graphs settled and at least one did not. Exits non-zero, and names which. */
  | { state: "partial"; reason: string; graphs: GraphPush[] };

function git(cwd: string, args: string[]): { status: number; stdout: string; stderr: string } {
  const r = spawnSync("git", args, { cwd, encoding: "utf-8", maxBuffer: 1 << 30 });
  return { status: r.status ?? 128, stdout: r.stdout ?? "", stderr: r.stderr ?? String(r.error ?? "") };
}

function repoRootOf(cwd = process.cwd()): string {
  const r = git(cwd, ["rev-parse", "--show-toplevel"]);
  if (r.status !== 0) throw new Error(`not inside a git checkout: ${cwd}`);
  return r.stdout.trim();
}

/**
 * One file's content and tree mode, as git would record them.
 *
 * Read as BYTES, never as `utf-8`: a tip-keyed directory may hold binary files
 * (bean `9c7h` moves `fsh-guts`, archived PDFs, onto such a branch) and a text
 * round trip corrupts those silently — the push would succeed and the file
 * would be wrong, which is the worst shape a data bug comes in.
 *
 * The mode is taken from `lstat`, not assumed: an executable that came back
 * `100644` would lose its bit, and a symlink read through its target would be
 * committed as a regular file holding that path as text. A symlink's content
 * IS its target, which is what git stores for mode `120000`.
 */
function read(abs: string): { content: string | Buffer; mode: "100644" | "100755" | "120000" } {
  const st = lstatSync(abs);
  if (st.isSymbolicLink()) return { content: readlinkSync(abs), mode: "120000" };
  // Any execute bit, matching git's own rule rather than only the owner's.
  const mode = (st.mode & 0o111) !== 0 ? "100755" : "100644";
  return { content: readFileSync(abs), mode };
}

/** The mount's changed paths, as `Change`s carrying the blob the editor read. */
export function pendingChanges(mount: string): Change[] {
  // -z and --no-renames: a rename read as one entry would lose the delete.
  const st = git(mount, ["status", "--porcelain=1", "-z", "--no-renames", "--untracked-files=all"]);
  if (st.status !== 0) throw new Error(`git status in ${mount} failed: ${st.stderr.trim()}`);
  const out: Change[] = [];
  for (const rec of st.stdout.split("\0")) {
    if (!rec) continue;
    const code = rec.slice(0, 2);
    const path = rec.slice(3);
    if (!path || path === "manifest.json") continue; // the manifest is the steward's, not an editor's
    const gone = code.includes("D");
    const base = git(mount, ["rev-parse", `HEAD:${path}`]);
    const expect = base.status === 0 ? base.stdout.trim() : null;
    out.push(gone ? { path, content: null, expect } : { path, ...read(join(mount, path)), expect });
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Splice back every declared tip-keyed graph, each to the branch its own
 * declaration names. Bean `2h76`, owner ruling 2026-10-03 (D4 option b).
 *
 * Symmetric with `state-mount.ts`'s fan-out, and for the same reasons: the
 * per-directory splice already exists as {@link pushMount}, so it is called
 * once per declaration rather than reimplemented, and a graph that fails is
 * recorded while the loop CONTINUES — stopping at the first failure would
 * leave the rest unattempted and indistinguishable from settled (bean `1xhc`).
 *
 * A push to ONE branch is what this replaces: `pushState` resolved the
 * declarations to a single branch and refused above one, so under a branch per
 * graph every graph but the first was unreachable.
 */
function pushFanOut(root: string, locations: TipLocation[], opts: PushOptions): PushResult {
  const graphs: GraphPush[] = [];
  for (const loc of locations) {
    const base = { id: loc.id, branch: loc.branch, path: loc.path };
    try {
      if (opts.dryRun) {
        const changes = pendingMountChanges(loc.id, { repoRoot: root });
        if (changes === undefined) {
          graphs.push({ ...base, state: "refused", reason: `${loc.id} is not mounted; run \`bun run state:mount\` first` });
        } else {
          graphs.push({ ...base, state: "would-push", reason: `${changes.length} path(s) would be spliced onto the tip`, changes });
        }
        continue;
      }
      const message = opts.message ?? `state: ${loc.id} from its mount`;
      const w = pushMount(loc.id, message, { repoRoot: root });
      if (w.state === "refused") graphs.push({ ...base, state: "refused", reason: w.reason });
      else graphs.push({ ...base, state: w.state, reason: w.reason, write: w });
    } catch (e) {
      // A throw for ONE graph must not take the others' pushes with it.
      graphs.push({ ...base, state: "failed", reason: `pushing ${loc.id} threw: ${(e as Error).message}` });
    }
  }

  const settled = graphs.filter(isSettled);
  const stuck = graphs.filter((g) => !isSettled(g));
  const n = graphs.length;

  // Nothing is mounted at all: not a failure, the same answer the single-mount
  // path gives when `state/` is absent.
  if (stuck.length === n && stuck.every((g) => g.state === "refused" && g.reason.includes("not mounted"))) {
    return { state: "no-mount", reason: `none of the ${n} declared graph(s) is mounted; run \`bun run state:mount\` first`, graphs };
  }
  if (stuck.length === 0) {
    if (opts.dryRun) {
      const changes = graphs.flatMap((g) => g.changes ?? []);
      return { state: "would-push", reason: `${changes.length} path(s) across ${n} graph(s) would be spliced`, changes, graphs };
    }
    const pushed = graphs.filter((g) => g.state === "pushed");
    if (pushed.length === 0) return { state: "nothing", reason: `no graph had changes to push`, graphs };
    return {
      state: "pushed",
      reason: `${pushed.length} of ${n} declared graph(s) pushed, each to its own branch`,
      changes: graphs.flatMap((g) => g.write?.state === "pushed" ? (g.changes ?? []) : []),
      write: pushed[0]!.write!,
      graphs,
    };
  }
  if (settled.length === 0) {
    return { state: "failed", reason: `none of the ${n} declared graph(s) could be pushed`, graphs };
  }
  return {
    state: "partial",
    reason: `${settled.length} of ${n} declared graph(s) settled; ${stuck.map((g) => `${g.id} (${g.state})`).join(", ")} did not`,
    graphs,
  };
}

export function pushState(opts: PushOptions = {}): PushResult {
  const root = opts.repoRoot ?? repoRootOf();

  // A branch per graph, from the declarations. `--branch` still forces the
  // single-mount path below, which is what the cutover drives before any
  // declaration names a branch.
  if (!opts.branch) {
    let locations: TipLocation[] = [];
    try {
      locations = tipLocations(root);
    } catch (e) {
      return { state: "failed", reason: `could not read the directory declarations: ${(e as Error).message}` };
    }
    if (locations.length) return pushFanOut(root, locations, opts);
  }

  const mount = join(root, MOUNT_DIR);
  if (!existsSync(join(mount, ".git"))) {
    return { state: "no-mount", reason: `${MOUNT_DIR}/ is not mounted; run \`bun run state:mount\` first` };
  }
  const head = git(mount, ["rev-parse", "HEAD"]);
  if (head.status !== 0) return { state: "failed", reason: `${MOUNT_DIR}/ has no HEAD: ${head.stderr.trim()}` };

  let changes: Change[];
  try {
    changes = pendingChanges(mount);
  } catch (e) {
    return { state: "failed", reason: (e as Error).message };
  }
  if (changes.length === 0) return { state: "nothing", reason: `${MOUNT_DIR}/ has no changes to push` };
  if (opts.dryRun) {
    return { state: "would-push", reason: `${changes.length} path(s) would be spliced onto the tip`, changes };
  }

  // Which branch. `refs/state-mount/tip` does NOT carry the source branch name,
  // so the declarations are the authority — the same answer `state-mount.ts`
  // used to create the mount. `--branch` overrides for the cutover, which
  // writes the branch before any declaration points at it.
  const declared = [...new Set(tipLocations(root).map((l) => l.branch))];
  const branch = opts.branch ?? declared[0];
  if (!branch) {
    return {
      state: "failed",
      reason: "no declared directory is tip-keyed, so the branch to push to is unknown; pass --branch",
      changes,
    };
  }
  if (!opts.branch && declared.length > 1) {
    return { state: "failed", reason: `${declared.length} state branches are declared (${declared.join(", ")}); pass --branch`, changes };
  }
  const store = BranchStore.open(branch, { repoRoot: root });

  const message = opts.message ?? `state: ${changes.length} path(s) from the ${MOUNT_DIR}/ mount`;
  const write = store.write(changes, message);
  if (write.state === "conflict") {
    return {
      state: "conflict",
      reason:
        `${write.conflicts?.length ?? 0} path(s) were edited on ${write.branch} since this mount was taken; ` +
        `NOTHING was pushed and ${MOUNT_DIR}/ is untouched`,
      changes,
      write,
    };
  }
  if (write.state !== "pushed" && write.state !== "unchanged") {
    return { state: "failed", reason: write.reason, changes, write };
  }

  // Move the mount forward — but only onto a commit whose tree is what is on disk.
  if (write.commit) {
    const fetched = git(root, ["fetch", "-q", "--no-tags", "--depth=1", "origin", `+refs/heads/${write.branch}:refs/state-mount/tip`]);
    if (fetched.status === 0) {
      const reset = git(mount, ["reset", "--hard", "-q", write.commit]);
      if (reset.status !== 0) {
        return {
          state: "pushed",
          reason: `${write.reason} — but ${MOUNT_DIR}/ could not be moved to ${write.commit.slice(0, 12)}: ${reset.stderr.trim()}`,
          changes,
          write,
        };
      }
    }
  }
  return { state: "pushed", reason: write.reason, changes, write };
}

/** One row per graph, so a reader sees WHICH branch a splice landed on. */
function graphTable(graphs: GraphPush[]): string[] {
  const L = ["| graph | branch | state | detail |", "|---|---|---|---|"];
  for (const g of graphs) {
    const mark = isSettled(g) ? g.state : g.state === "conflict" ? "⚠️ conflict" : `🛑 ${g.state}`;
    L.push(`| \`${g.id}\` | \`${g.branch}\` | ${mark} | ${g.reason} |`);
  }
  return L;
}

export function report(r: PushResult): string {
  const L: string[] = ["## State push", ""];
  // The fan-out: one splice per declared graph, each to its own branch.
  if (r.graphs?.length) {
    const stuck = r.graphs.filter((g) => !isSettled(g));
    if (stuck.length === 0) {
      L.push(`${r.reason}.`, "", ...graphTable(r.graphs));
      if (r.state === "would-push") {
        for (const g of r.graphs)
          for (const c of g.changes ?? []) L.push(`- \`${g.id}\`: \`${c.path}\` — ${c.content === null ? "delete" : c.expect === null ? "create" : "update"}`);
      }
      return L.join("\n");
    }
    const conflicts = stuck.filter((g) => g.state === "conflict");
    L.push(`🛑 **The state push did not settle ${stuck.length} of ${r.graphs.length} graph(s).** ${r.reason}.`, "", ...graphTable(r.graphs), "");
    for (const g of conflicts)
      for (const c of g.write?.conflicts ?? [])
        L.push(`- \`${g.id}\`: \`${c.path}\` — you read \`${c.expected ?? "(absent)"}\`, the tip has \`${c.actual ?? "(absent)"}\``);
    L.push(
      "",
      `**Nothing was discarded** — every unsettled graph's edits are still in its mount. A graph that pushed is NOT`,
      `rolled back: ${r.graphs.filter(isSettled).map((g) => `\`${g.id}\``).join(", ") || "(none)"} landed.`,
    );
    if (conflicts.length) L.push("", "For each conflict, re-read those files, re-apply your change, and push again.");
    return L.join("\n");
  }
  if (r.state === "no-mount" || r.state === "nothing") return L.concat(r.reason + ".").join("\n");
  if (r.state === "would-push") {
    L.push(`${r.reason}:`, "");
    for (const c of r.changes) L.push(`- \`${c.path}\` — ${c.content === null ? "delete" : c.expect === null ? "create" : "update"}`);
    return L.join("\n");
  }
  if (r.state === "pushed") {
    L.push(`Pushed ${r.changes.length} path(s) to \`${r.write.branch}\` — ${r.reason}.`);
    if (r.write.commit) L.push("", `Commit \`${r.write.commit.slice(0, 12)}\`, attempt ${r.write.attempts}.`);
    return L.join("\n");
  }
  if (r.state === "conflict") {
    L.push(`⚠️ **Not pushed — a sibling edited the same path(s).** ${r.reason}.`, "");
    for (const c of r.write.conflicts ?? []) L.push(`- \`${c.path}\` — you read \`${c.expected ?? "(absent)"}\`, the tip has \`${c.actual ?? "(absent)"}\``);
    L.push("", `Your edits are still in \`${MOUNT_DIR}/\`. Re-read those files, re-apply your change, and push again.`);
    return L.join("\n");
  }
  L.push(`🛑 **The state push failed.** ${r.reason}`, "", `Nothing was discarded: your edits are still in \`${MOUNT_DIR}/\`.`);
  return L.join("\n");
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const at = argv.indexOf("-m");
  const b = argv.indexOf("--branch");
  const r = pushState({
    dryRun: argv.includes("--dry-run"),
    message: at === -1 ? undefined : argv[at + 1],
    branch: b === -1 ? undefined : argv[b + 1],
  });
  if (argv.includes("--json")) console.log(JSON.stringify(r, null, 2));
  else console.log(report(r));
  // `partial` counts: a graph whose splice did not settle is a finding even
  // when its siblings' did.
  process.exit(r.state === "failed" || r.state === "conflict" || r.state === "partial" ? 1 : 0);
}
