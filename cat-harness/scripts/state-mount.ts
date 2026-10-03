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
 *
 * ## A branch PER GRAPH — the fan-out (owner ruling 2026-10-03)
 *
 * This module used to mount ONE branch at one `state/` directory, and refused
 * outright above one declared branch, because decision D4 had chosen a single
 * `state` branch with the graphs as directories inside it. The owner reversed
 * that default on 2026-10-03:
 *
 * > *"Keep per-graph branches"*
 *
 * > *"i dont think we need a speciifc "state" branch or mount, several
 * > potnential subgraphs can be a part of state"*
 *
 * So each declared tip-keyed directory lives on the branch ITS OWN
 * declaration names, and is mounted at ITS OWN declared path. What this
 * function contributes is only the FAN-OUT: the per-directory mount already
 * exists as {@link mountTip} (`branch-store.ts`, reached by hand as
 * `branch-store.ts mount --id <directory-id>`), and it is reused rather than
 * reimplemented — it round-trips bytes, modes and symlinks, and keeps a
 * per-worktree marker, none of which this module should own a second copy of.
 *
 * Collisions that the single `MOUNT_REF` constant below would have caused do
 * not arise on that path: {@link mountTip} reaches a branch through
 * `BranchStore`, whose `privateRef` is `refs/<ns>/<kind>/<pid>-<seq>`, unique
 * per process AND per call.
 *
 * ## One graph failing must not let the others read clean (bean `1xhc`)
 *
 * A fan-out invites exactly the defect `1xhc` is about: a step that did not
 * fire looks like one that passed. So the aggregate keeps the three answers
 * apart — every graph mounted, SOME mounted and these named ones did not, and
 * "could not determine" — a failing graph never stops its siblings being
 * mounted, and the process exits non-zero when anything failed, because
 * `session-start-coord-sweep.sh` calls this with `|| true` and the printed
 * block and the exit status are then the only carriers of the finding.
 *
 * `stale` is deliberately NOT a failure: it means a prior mount with unpushed
 * edits was left untouched, so the graph is still on disk and readable. That
 * is the per-graph form of the `dirty` state below, and for the same reason —
 * nothing was discarded.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { mountTip, readMarker, tipLocations, type TipLocation } from "./branch-store.js";

/** Where the branch is checked out, relative to the checkout root. */
export const MOUNT_DIR = "state";
/** The ref the fetch lands on; private so no local branch invites a push. */
const MOUNT_REF = "refs/state-mount/tip";
const MANIFEST_FILE = "manifest.json";
const MANIFEST_SCHEMA = "state-manifest/v1";

/**
 * One declared graph's outcome in the fan-out. `state` is {@link mountTip}'s
 * verdict, carried through verbatim rather than flattened to a boolean, so a
 * `miss` (determined absent), a `corrupt` branch and an `unknown` (could not
 * ask — **never** a pass) stay three different answers.
 *
 * `stale` is this module's one addition: {@link mountTip} returns `refused`
 * both for a prior mount holding unpushed edits and for a path it must not
 * clobber, and only the first means the graph is nevertheless on disk and
 * readable. Separating them is what lets a session with edits in flight exit
 * 0 without that silence also covering a graph that is simply not there.
 */
interface GraphMountBase {
  id: string;
  /** Repository-relative, as declared — where the files were put. */
  path: string;
  branch: string;
  reason: string;
}

/**
 * A mounted graph ALWAYS has the tip it was read at, and a graph that is not
 * mounted never pretends to one. That is why this is a union rather than one
 * interface with `tip?: string`: an optional tip makes "mounted" and "has a
 * tip" two facts that can disagree, and every reader then has to handle a
 * state the mount cannot actually be in.
 */
export type GraphMount =
  | (GraphMountBase & { state: "mounted"; tip: string; files?: number })
  | (GraphMountBase & { state: "stale" | "refused" | "miss" | "corrupt" | "unknown" });

/** A graph whose files are on disk and readable, whether or not it just moved. */
export function isPresent(g: GraphMount): boolean {
  return g.state === "mounted" || g.state === "stale";
}

/**
 * Which shape produced the result. There is no top-level `tip` on a mounted
 * result for either: with several graphs mounted there is no single tip, so a
 * required one would be a lie and an optional one would be the defect above
 * one level up. **A caller that wants a tip reads it off the graph**, where it
 * is required.
 */
export type MountMode = "fan-out" | "single-worktree";

export type MountResult =
  | { state: "not-enabled"; reason: string; locations: TipLocation[]; graphs: GraphMount[]; mode?: undefined }
  /** Every graph that was asked for is present. */
  | { state: "mounted"; reason: string; locations: TipLocation[]; graphs: GraphMount[]; mode: MountMode }
  /** SOME graphs are present and at least one is not. Exits non-zero: the ones that failed are named. */
  | { state: "partial"; reason: string; locations: TipLocation[]; graphs: GraphMount[]; mode: MountMode }
  | { state: "dirty"; reason: string; path: string; locations: TipLocation[]; graphs: GraphMount[]; mode?: MountMode }
  | { state: "failed"; reason: string; locations: TipLocation[]; graphs: GraphMount[]; mode?: MountMode };

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

/**
 * Mount every declared tip-keyed directory, each from the branch its own
 * declaration names and at its own declared path. Never throws for an
 * expected state.
 *
 * With `--force` and nothing declared, falls back to
 * {@link mountSingleWorktree} — the pre-ruling whole-branch worktree at
 * {@link MOUNT_DIR}, which is what the cutover drives before any declaration
 * points at a branch.
 */
export function mountState(opts: MountOptions = {}): MountResult {
  const root = opts.repoRoot ?? repoRootOf();
  let locations: TipLocation[];
  try {
    locations = tipLocations(root);
  } catch (e) {
    // Could not ask. Never a pass: the declarations are the only thing that
    // says which graphs should be here at all.
    return { state: "failed", reason: `could not read the directory declarations: ${(e as Error).message}`, locations: [], graphs: [] };
  }

  if (locations.length === 0) {
    if (!opts.force) {
      return {
        state: "not-enabled",
        reason: "no declared directory sets `storage.keyedBy: \"tip\"`, so `main` is still authoritative; nothing to mount",
        locations,
        graphs: [],
      };
    }
    if (!opts.branch) {
      return { state: "failed", reason: "--force was given but no branch is declared and none was passed", locations, graphs: [] };
    }
    return mountSingleWorktree(root, opts.branch, locations);
  }

  return fanOut(root, locations);
}

/**
 * One {@link mountTip} per declared directory, aggregated. A graph that fails
 * is recorded and the loop CONTINUES: stopping at the first failure would
 * leave the rest in the one state bean `1xhc` forbids — not attempted, and
 * indistinguishable from fine.
 */
function fanOut(root: string, locations: TipLocation[]): MountResult {
  const graphs: GraphMount[] = [];
  for (const loc of locations) {
    const base = { id: loc.id, path: loc.path, branch: loc.branch };
    try {
      const r = mountTip(loc, { repoRoot: root });
      if (r.state === "mounted") {
        graphs.push({ ...base, state: "mounted", reason: `${r.files} file(s) at ${r.tip.slice(0, 12)}`, tip: r.tip, files: r.files });
      } else if (r.state === "refused" && readMarker(root, loc.id) !== undefined) {
        // A prior mount is on disk and was left untouched — the graph is
        // readable, and nothing was discarded.
        graphs.push({ ...base, state: "stale", reason: r.reason });
      } else {
        graphs.push({ ...base, state: r.state, reason: r.reason });
      }
    } catch (e) {
      // A throw for ONE graph must not take the sweep with it.
      graphs.push({ ...base, state: "unknown", reason: `mounting ${loc.id} threw: ${(e as Error).message}` });
    }
  }

  const present = graphs.filter(isPresent);
  const failed = graphs.filter((g) => !isPresent(g));
  const n = graphs.length;
  if (failed.length === 0) {
    return { state: "mounted", mode: "fan-out", reason: `${n} declared graph(s), all present`, locations, graphs };
  }
  if (present.length === 0) {
    return { state: "failed", mode: "fan-out", reason: `none of the ${n} declared graph(s) could be mounted`, locations, graphs };
  }
  return {
    state: "partial",
    mode: "fan-out",
    reason: `${present.length} of ${n} declared graph(s) mounted; ${failed.map((g) => g.id).join(", ")} did not`,
    locations,
    graphs,
  };
}

/**
 * The pre-ruling mount: the WHOLE branch, as a detached worktree, at
 * {@link MOUNT_DIR}. Reached only by `--force` with nothing declared, which is
 * the cutover's own path — a declaration is what the fan-out above needs, and
 * the cutover writes the branch before any declaration names it.
 *
 * It is left as it was on purpose. Bean `nij4` (#1997) is consolidating the
 * two mount implementations on `main` onto {@link mountTip}, at which point
 * this function is a clean subtraction rather than a merge.
 */
/**
 * The single-worktree mount's result. Its one entry carries the tip, so
 * "mounted" and "has a tip" cannot come apart here either. The synthetic id is
 * {@link MOUNT_DIR}, because this path runs precisely when NO declaration
 * names the directory and there is therefore no declared id to use.
 */
function mountedSingle(branch: string, tip: string, reason: string, locations: TipLocation[]): MountResult {
  return {
    state: "mounted",
    mode: "single-worktree",
    reason,
    locations,
    graphs: [{ id: MOUNT_DIR, path: MOUNT_DIR, branch, state: "mounted", reason, tip }],
  };
}

function mountSingleWorktree(root: string, branch: string, locations: TipLocation[]): MountResult {
  const graphs: GraphMount[] = [];
  const path = join(root, MOUNT_DIR);

  // An existing mount with local edits is somebody's work in progress. Report, never clobber.
  if (existsSync(path)) {
    const st = git(path, ["status", "--porcelain"]);
    if (st.status === 0 && st.stdout.trim() !== "") {
      return { state: "dirty", reason: `${MOUNT_DIR}/ has uncommitted changes; left untouched`, path, locations, graphs };
    }
  }

  const fetched = git(root, ["fetch", "-q", "--no-tags", "--depth=1", "origin", `+refs/heads/${branch}:${MOUNT_REF}`]);
  if (fetched.status !== 0) {
    return {
      state: "failed",
      reason: `could not fetch ${branch} from origin: ${fetched.stderr.trim() || `git exited ${fetched.status}`}`,
      locations,
    graphs,
    };
  }
  const rev = git(root, ["rev-parse", MOUNT_REF]);
  if (rev.status !== 0) return { state: "failed", reason: `fetched ${branch} but ${MOUNT_REF} does not resolve`, locations, graphs };
  const tip = rev.stdout.trim();

  // A state branch is identified by its manifest, not by its name (the name is being changed, bean `32f6`).
  const manifest = git(root, ["show", `${tip}:${MANIFEST_FILE}`]);
  if (manifest.status !== 0) {
    return { state: "failed", reason: `${branch} has no root ${MANIFEST_FILE}; it is not a state branch`, locations, graphs };
  }
  try {
    const parsed = JSON.parse(manifest.stdout) as { $schema?: unknown; keyedBy?: unknown };
    if (parsed.$schema !== MANIFEST_SCHEMA) {
      return { state: "failed", reason: `${branch}:${MANIFEST_FILE} is ${String(parsed.$schema)}, not ${MANIFEST_SCHEMA}`, locations, graphs };
    }
    if (parsed.keyedBy !== "tip") {
      return { state: "failed", reason: `${branch} is keyed by ${String(parsed.keyedBy)}, not tip`, locations, graphs };
    }
  } catch (e) {
    return { state: "failed", reason: `${branch}:${MANIFEST_FILE} does not parse: ${(e as Error).message}`, locations, graphs };
  }

  if (existsSync(path)) {
    const at = git(path, ["rev-parse", "HEAD"]);
    if (at.status === 0 && at.stdout.trim() === tip) {
      return mountedSingle(branch, tip, `already at ${tip.slice(0, 12)}`, locations);
    }
    // Clean and behind: move it forward. Detached, so there is no branch to push from.
    const moved = git(path, ["checkout", "-q", "--detach", tip]);
    if (moved.status !== 0) {
      return { state: "failed", reason: `could not move ${MOUNT_DIR}/ to ${tip.slice(0, 12)}: ${moved.stderr.trim()}`, locations, graphs };
    }
    return mountedSingle(branch, tip, `moved to ${tip.slice(0, 12)}`, locations);
  }

  const added = git(root, ["worktree", "add", "--detach", "-q", MOUNT_DIR, tip]);
  if (added.status !== 0) {
    return { state: "failed", reason: `could not add the worktree at ${MOUNT_DIR}/: ${added.stderr.trim()}`, locations, graphs };
  }
  return mountedSingle(branch, tip, `mounted at ${tip.slice(0, 12)}`, locations);
}

/**
 * The markdown the session-start hook injects. A failure is deliberately
 * shouty and says what NOT to believe, because the agent's next move after
 * reading this is to read the work-plan.
 */
/** One table row per graph, so a reader sees WHICH graph is in which state. */
function graphTable(graphs: GraphMount[]): string[] {
  const L = ["| graph | branch | path | state | detail |", "|---|---|---|---|---|"];
  for (const g of graphs) {
    const mark = g.state === "mounted" ? "mounted" : g.state === "stale" ? "⚠️ stale" : `🛑 ${g.state}`;
    L.push(`| \`${g.id}\` | \`${g.branch}\` | \`${g.path}\` | ${mark} | ${g.reason} |`);
  }
  return L;
}

export function report(r: MountResult): string {
  const L: string[] = ["## State branch mount", ""];
  if (r.state === "not-enabled") {
    L.push(`Not enabled — ${r.reason}.`, "", "Beans and todos are read from the checkout, as usual.");
    return L.join("\n");
  }
  if (r.state === "mounted" && r.mode === "single-worktree") {
    const g = r.graphs[0]!;
    L.push(`Mounted \`${MOUNT_DIR}/\` from \`${g.branch}\` — ${r.reason}.`, "");
    L.push(`Declared tip-keyed: ${r.locations.map((l) => `\`${l.id}\``).join(", ") || "(none)"}.`, "");
    L.push("It is DETACHED on purpose: write through `bun run state:push`, never `git push` from `" + MOUNT_DIR + "/`.");
    return L.join("\n");
  }
  // The fan-out: a branch per graph.
  if (r.mode === "fan-out" && (r.state === "mounted" || r.state === "partial" || r.state === "failed")) {
    const present = r.graphs.filter(isPresent);
    const failed = r.graphs.filter((g) => !isPresent(g));
    const undetermined = failed.filter((g) => g.state === "unknown");

    if (failed.length === 0) {
      L.push(`Mounted ${present.length} declared graph(s), each from its own branch at its own declared path.`, "");
      L.push(...graphTable(r.graphs), "");
      L.push("Write through `bun run state:push`, never `git push` from a mount.");
      return L.join("\n");
    }

    L.push(
      `🛑 **THE STATE MOUNT FAILED FOR ${failed.length} OF ${r.graphs.length} GRAPH(S) — do not trust an empty work-plan.**`,
      "",
      ...graphTable(r.graphs),
      "",
      `Not mounted: ${failed.map((g) => `\`${g.id}\` (${g.path})`).join(", ")}. Anything reading those paths will report`,
      `**nothing**, and "no beans" and "could not reach the beans" look identical from there. An empty \`beans list\``,
      `right now is **not** evidence that there is no work.`,
    );
    if (undetermined.length) {
      L.push(
        "",
        `${undetermined.length} graph(s) are **could not determine**, not determined-absent: ` +
          `${undetermined.map((g) => `\`${g.id}\``).join(", ")}. That is never a pass.`,
      );
    }
    if (present.length) {
      // Say what DID work, or a reader concludes the whole mount is gone.
      L.push(
        "",
        `Still present and readable: ${present.map((g) => `\`${g.id}\` (${g.path})`).join(", ")} — ` +
          `a partial mount is not a rollback, and nothing was discarded.`,
      );
    }
    L.push("", "Fix the mount (`bun run state:mount`) or read the work-plan from the checkout before deciding there is none.");
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
  // Loud means a non-zero exit too: a hook that only prints is a hook a wrapper
  // can swallow, and the sweep calls this with `|| true`. `partial` counts: a
  // graph that did not mount is a finding even when its siblings did.
  process.exit(r.state === "failed" || r.state === "partial" ? 1 : 0);
}
