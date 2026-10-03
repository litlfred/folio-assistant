#!/usr/bin/env bun
/**
 * state-mount — put the state branch on disk, or say loudly that it is not there.
 *
 * @module scripts/state-mount
 * @graphNode none — a session-start step over a declared `storage` directory
 *
 * Bean `2h76` part 4, arc `fs43`. The session-start hook calls this; it is also
 * `bun run state:mount` by hand.
 *
 * ## The failure this exists to make impossible
 *
 * The proposal names it as a falsifier: *"If the session-start hook's fetch
 * fails silently and `beans list` returns empty, the agent reads 'no work' —
 * the third state collapsing into zero."* An empty work-plan and an unreachable
 * work-plan look identical to an agent, and the agent acts on the first
 * reading. So every failure here is LOUD: a non-zero exit, and a block on
 * stdout — the hook's stdout IS the agent's context — that says in as many
 * words that an empty `beans list` must not be believed.
 *
 * ## Why a worktree at all, when `branch-store` can read the branch
 *
 * Because `beans` is third-party and reads `beans/defs` off a disk. A library
 * read cannot serve it. So the branch tip is checked out at `state/` as a READ
 * SURFACE, and writes still go through `branch-store`'s splice-write
 * (`state-store.ts`), never `git push` from this worktree. That is why it is
 * mounted **detached**: a detached worktree has no branch to push, so the
 * splice-write path cannot be bypassed by habit.
 *
 * ## It is inert until the cutover, and that is not a failure
 *
 * No declaration sets `storage` yet (`DirectoryStorageSchema`), so
 * {@link tipLocations} is empty and this reports `not-enabled` and exits 0.
 * `main` stays authoritative until Phase 3 (bean `9ofm`). A mount that treated
 * "nothing is kept on a branch" as an error would fail every session over a
 * branch nothing reads — which is the same crying-wolf that teaches an agent to
 * ignore the loud case.
 *
 * ## It never discards work
 *
 * A mount that is already present and DIRTY is left exactly as it is and
 * reported, never re-created. The worktree holds state somebody may be
 * mid-edit on; `git worktree remove --force` would be a silent data loss, and
 * this module's whole purpose is that state is not lost silently.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { tipLocations, type TipLocation } from "./branch-store.js";

/** Where the branch is checked out, relative to the checkout root. */
export const MOUNT_DIR = "state";
/** The ref the fetch lands on; private so no local branch invites a push. */
const MOUNT_REF = "refs/state-mount/tip";
const MANIFEST_FILE = "manifest.json";
const MANIFEST_SCHEMA = "state-manifest/v1";

export type MountResult =
  | { state: "not-enabled"; reason: string; locations: TipLocation[] }
  | { state: "mounted"; reason: string; path: string; branch: string; tip: string; locations: TipLocation[] }
  | { state: "dirty"; reason: string; path: string; locations: TipLocation[] }
  | { state: "failed"; reason: string; locations: TipLocation[] };

export interface MountOptions {
  repoRoot?: string;
  /** Mount even when no declaration is tip-keyed — the cutover uses this. */
  force?: boolean;
  /** The branch to mount when `force` is set and no declaration names one. */
  branch?: string;
}

function git(cwd: string, args: string[]): { status: number; stdout: string; stderr: string } {
  const r = spawnSync("git", args, { cwd, encoding: "utf-8" });
  return { status: r.status ?? 128, stdout: r.stdout ?? "", stderr: r.stderr ?? String(r.error ?? "") };
}

function repoRootOf(cwd = process.cwd()): string {
  const r = git(cwd, ["rev-parse", "--show-toplevel"]);
  if (r.status !== 0) throw new Error(`not inside a git checkout: ${cwd}`);
  return r.stdout.trim();
}

/** Mount the state branch at {@link MOUNT_DIR}, or report why not. Never throws for an expected state. */
export function mountState(opts: MountOptions = {}): MountResult {
  const root = opts.repoRoot ?? repoRootOf();
  let locations: TipLocation[];
  try {
    locations = tipLocations(root);
  } catch (e) {
    return { state: "failed", reason: `could not read the directory declarations: ${(e as Error).message}`, locations: [] };
  }

  const branches = [...new Set(locations.map((l) => l.branch))];
  if (branches.length === 0 && !opts.force) {
    return {
      state: "not-enabled",
      reason: "no declared directory sets `storage.keyedBy: \"tip\"`, so `main` is still authoritative; nothing to mount",
      locations,
    };
  }
  if (branches.length > 1) {
    return {
      state: "failed",
      reason:
        `${branches.length} different state branches are declared (${branches.join(", ")}), and this mounts ONE ` +
        `directory. Decision D4 chose one \`state\` branch with graphs as directories inside it; a branch per graph ` +
        `(D4 option b) needs a mount per branch, which is not built.`,
      locations,
    };
  }
  const branch = branches[0] ?? opts.branch;
  if (!branch) return { state: "failed", reason: "--force was given but no branch is declared and none was passed", locations };

  const path = join(root, MOUNT_DIR);

  // An existing mount with local edits is somebody's work in progress. Report, never clobber.
  if (existsSync(path)) {
    const st = git(path, ["status", "--porcelain"]);
    if (st.status === 0 && st.stdout.trim() !== "") {
      return { state: "dirty", reason: `${MOUNT_DIR}/ has uncommitted changes; left untouched`, path, locations };
    }
  }

  const fetched = git(root, ["fetch", "-q", "--no-tags", "--depth=1", "origin", `+refs/heads/${branch}:${MOUNT_REF}`]);
  if (fetched.status !== 0) {
    return {
      state: "failed",
      reason: `could not fetch ${branch} from origin: ${fetched.stderr.trim() || `git exited ${fetched.status}`}`,
      locations,
    };
  }
  const rev = git(root, ["rev-parse", MOUNT_REF]);
  if (rev.status !== 0) return { state: "failed", reason: `fetched ${branch} but ${MOUNT_REF} does not resolve`, locations };
  const tip = rev.stdout.trim();

  // A state branch is identified by its manifest, not by its name (the name is being changed, bean `32f6`).
  const manifest = git(root, ["show", `${tip}:${MANIFEST_FILE}`]);
  if (manifest.status !== 0) {
    return { state: "failed", reason: `${branch} has no root ${MANIFEST_FILE}; it is not a state branch`, locations };
  }
  try {
    const parsed = JSON.parse(manifest.stdout) as { $schema?: unknown; keyedBy?: unknown };
    if (parsed.$schema !== MANIFEST_SCHEMA) {
      return { state: "failed", reason: `${branch}:${MANIFEST_FILE} is ${String(parsed.$schema)}, not ${MANIFEST_SCHEMA}`, locations };
    }
    if (parsed.keyedBy !== "tip") {
      return { state: "failed", reason: `${branch} is keyed by ${String(parsed.keyedBy)}, not tip`, locations };
    }
  } catch (e) {
    return { state: "failed", reason: `${branch}:${MANIFEST_FILE} does not parse: ${(e as Error).message}`, locations };
  }

  if (existsSync(path)) {
    const at = git(path, ["rev-parse", "HEAD"]);
    if (at.status === 0 && at.stdout.trim() === tip) {
      return { state: "mounted", reason: `already at ${tip.slice(0, 12)}`, path, branch, tip, locations };
    }
    // Clean and behind: move it forward. Detached, so there is no branch to push from.
    const moved = git(path, ["checkout", "-q", "--detach", tip]);
    if (moved.status !== 0) {
      return { state: "failed", reason: `could not move ${MOUNT_DIR}/ to ${tip.slice(0, 12)}: ${moved.stderr.trim()}`, locations };
    }
    return { state: "mounted", reason: `moved to ${tip.slice(0, 12)}`, path, branch, tip, locations };
  }

  const added = git(root, ["worktree", "add", "--detach", "-q", MOUNT_DIR, tip]);
  if (added.status !== 0) {
    return { state: "failed", reason: `could not add the worktree at ${MOUNT_DIR}/: ${added.stderr.trim()}`, locations };
  }
  return { state: "mounted", reason: `mounted at ${tip.slice(0, 12)}`, path, branch, tip, locations };
}

/**
 * The markdown the session-start hook injects. A failure is deliberately
 * shouty and says what NOT to believe, because the agent's next move after
 * reading this is to read the work-plan.
 */
export function report(r: MountResult): string {
  const L: string[] = ["## State branch mount", ""];
  if (r.state === "not-enabled") {
    L.push(`Not enabled — ${r.reason}.`, "", "Beans and todos are read from the checkout, as usual.");
    return L.join("\n");
  }
  if (r.state === "mounted") {
    L.push(`Mounted \`${MOUNT_DIR}/\` from \`${r.branch}\` — ${r.reason}.`, "");
    L.push(`Declared tip-keyed: ${r.locations.map((l) => `\`${l.id}\``).join(", ") || "(none)"}.`, "");
    L.push("It is DETACHED on purpose: write through `bun run state:push`, never `git push` from `" + MOUNT_DIR + "/`.");
    return L.join("\n");
  }
  if (r.state === "dirty") {
    L.push(`⚠️ **\`${MOUNT_DIR}/\` has uncommitted changes and was left untouched.** ${r.reason}.`, "");
    L.push("Nothing was discarded. Push or revert those changes before expecting this mount to move.");
    return L.join("\n");
  }
  L.push(
    `🛑 **THE STATE MOUNT FAILED — do not trust an empty work-plan.**`,
    "",
    `Reason: ${r.reason}`,
    "",
    `\`${MOUNT_DIR}/\` is NOT on disk, so anything reading beans or todos from it will report **nothing**, and`,
    `"no beans" and "could not reach the beans" look identical from there. An empty \`beans list\` right now is`,
    `**not** evidence that there is no work.`,
    "",
    "Fix the mount (`bun run state:mount`) or read the work-plan from the checkout before deciding there is none.",
  );
  if (r.locations.length) L.push("", `Declared tip-keyed: ${r.locations.map((l) => `\`${l.id}\``).join(", ")}.`);
  return L.join("\n");
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const r = mountState({ force: argv.includes("--force"), branch: argv[argv.indexOf("--branch") + 1] });
  if (argv.includes("--json")) console.log(JSON.stringify(r, null, 2));
  else console.log(report(r));
  // Loud means a non-zero exit too: a hook that only prints is a hook a wrapper can swallow.
  process.exit(r.state === "failed" ? 1 : 0);
}
