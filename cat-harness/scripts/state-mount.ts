#!/usr/bin/env bun
/**
 * state-mount — put the state branch on disk, or say loudly that it is not there.
 *
 * @module scripts/state-mount
 * @graphNode none — a session-start step over a declared `storage` directory
 * @covers none — it MAKES graphs readable and judges none of them. It became a
 * gate in `code-quality-gates.yml` (bean `9ofm`), where it runs before the
 * bean gates, and `audit:coverage` correctly asked what it covers. The honest
 * answer is nothing: a mount that reported coverage of `beans` would let the
 * nine gates that actually judge the store be removed without the census
 * noticing — coverage by the step that merely fetched it.
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
 * ## One implementation (bean `nij4`)
 *
 * This module used to check the whole branch out as a detached worktree at
 * `state/`. Main then carried two mount implementations, that one and
 * {@link mountTip}. Owner ruling 2026-10-03 (bean `nij4`): keep ONE. The
 * worktree path is gone; every mount is {@link mountTip}'s, which round-trips
 * bytes, modes and symlinks and keeps a per-worktree marker. `beans` reads
 * `beans/defs` off a disk, and a mount at the declared path serves it the
 * same way the worktree did.
 *
 * ## Which graphs: the RESOLVED source
 *
 * {@link tipLocations} reads each declaration's resolved source — a config
 * override, then `source`, then the legacy `storage` (bean `doy3`) — so a
 * graph declared `source: { kind: "branch", keyedBy: "tip" }` is mounted, a
 * `directory` source is the checkout itself, and a `commit`-keyed branch is
 * qa-store's, not a mount's.
 *
 * ## It is inert until the cutover, and that is not a failure
 *
 * While no declaration keeps a graph at a branch tip, {@link tipLocations} is
 * empty and this reports `not-enabled` and exits 0. A mount that treated
 * "nothing is kept on a branch" as an error would fail every session over a
 * branch nothing reads — which is the same crying-wolf that teaches an agent
 * to ignore the loud case.
 *
 * ## It never discards work
 *
 * A mount holding unpushed edits is left exactly as it is and reported
 * `stale`, never re-read over. Its files are somebody's work in progress, and
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

import { mountTip, pendingMountChanges, tipLocations, type BranchStoreOptions, type TipLocation } from "./branch-store.js";
import { instanceRootsIn, nestedDirectories, readDeclaration } from "../schemas/cat-harness.js";
import { tools } from "../tools/discover.js";

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
 * 0 without that silence also covering a graph that is simply not there — so
 * it is decided by ASKING for the pending edits before mounting, not inferred
 * from a refusal plus a marker: a marker is also present when the refusal is
 * that the path is still tracked, and that graph is not mounted at all.
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

export type MountResult =
  | { state: "not-enabled"; reason: string; locations: TipLocation[]; graphs: GraphMount[] }
  /** Every graph that was asked for is present. */
  | { state: "mounted"; reason: string; locations: TipLocation[]; graphs: GraphMount[] }
  /** SOME graphs are present and at least one is not. Exits non-zero: the ones that failed are named. */
  | { state: "partial"; reason: string; locations: TipLocation[]; graphs: GraphMount[] }
  | { state: "failed"; reason: string; locations: TipLocation[]; graphs: GraphMount[] };

export interface MountOptions {
  repoRoot?: string;
  /** Mount only this declared directory id. */
  id?: string;
  /** Passed to `BranchStore.open` — tests point it at a scratch store. */
  store?: BranchStoreOptions;
}

function git(cwd: string, args: string[]): { status: number; stdout: string; stderr: string } {
  const r = spawnSync("git", args, { cwd, encoding: "utf-8" });
  return { status: r.status ?? 128, stdout: r.stdout ?? "", stderr: r.stderr ?? String(r.error ?? "") };
}

export function repoRootOf(cwd = process.cwd()): string {
  const r = git(cwd, ["rev-parse", "--show-toplevel"]);
  if (r.status !== 0) throw new Error(`not inside a git checkout: ${cwd}`);
  return r.stdout.trim();
}

/**
 * Mount every declared tip-keyed directory, each from the branch its own
 * declaration names and at its own declared path. Never throws for an
 * expected state.
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
  if (opts.id !== undefined) {
    locations = locations.filter((l) => l.id === opts.id);
    if (locations.length === 0) {
      return { state: "failed", reason: `no declared directory \`${opts.id}\` is kept at a branch tip`, locations, graphs: [] };
    }
  }
  if (locations.length === 0) {
    return {
      state: "not-enabled",
      reason: "no declared directory is kept at a branch tip, so `main` is still authoritative; nothing to mount",
      locations,
      graphs: [],
    };
  }
  return fanOut(root, locations, opts.store);
}

/**
 * One {@link mountTip} per declared directory, aggregated. A graph that fails
 * is recorded and the loop CONTINUES: stopping at the first failure would
 * leave the rest in the one state bean `1xhc` forbids — not attempted, and
 * indistinguishable from fine.
 */
function fanOut(root: string, locations: TipLocation[], store?: BranchStoreOptions): MountResult {
  const graphs: GraphMount[] = [];
  for (const loc of locations) {
    const base = { id: loc.id, path: loc.path, branch: loc.branch };
    try {
      // A prior mount holding unpushed edits is somebody's work: on disk,
      // readable, and left untouched. Asked BEFORE mounting, never inferred.
      const pending = pendingMountChanges(loc.id, { repoRoot: root });
      if (pending !== undefined && pending.length > 0) {
        graphs.push({ ...base, state: "stale", reason: `${pending.length} unpushed change(s) left untouched; push them with \`bun run state:push\`` });
        continue;
      }
      const r = mountTip(loc, { repoRoot: root, store });
      if (r.state === "mounted") {
        graphs.push({ ...base, state: "mounted", reason: `${r.files} file(s) at ${r.tip.slice(0, 12)}`, tip: r.tip, files: r.files });
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
    return { state: "mounted", reason: `${n} declared graph(s), all present`, locations, graphs };
  }
  if (present.length === 0) {
    return { state: "failed", reason: `none of the ${n} declared graph(s) could be mounted`, locations, graphs };
  }
  return {
    state: "partial",
    reason: `${present.length} of ${n} declared graph(s) mounted; ${failed.map((g) => g.id).join(", ")} did not`,
    locations,
    graphs,
  };
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
  const present = r.graphs.filter(isPresent);
  const failed = r.graphs.filter((g) => !isPresent(g));
  const stale = r.graphs.filter((g) => g.state === "stale");
  if (r.graphs.length > 0 && failed.length === 0) {
    L.push(`Mounted ${present.length} declared graph(s), each from its own branch at its own declared path.`, "");
    L.push(...graphTable(r.graphs), "");
    if (stale.length) {
      L.push(`⚠️ ${stale.map((g) => `\`${g.id}\``).join(", ")} hold unpushed edits and were left untouched. Nothing was discarded.`, "");
    }
    L.push("Write through `bun run state:push`, never `git push` from a mount.");
    return L.join("\n");
  }

  const undetermined = failed.filter((g) => g.state === "unknown");
  L.push(
    failed.length
      ? `🛑 **THE STATE MOUNT FAILED FOR ${failed.length} OF ${r.graphs.length} GRAPH(S) — do not trust an empty work-plan.**`
      : `🛑 **THE STATE MOUNT FAILED — do not trust an empty work-plan.**`,
    "",
  );
  if (r.graphs.length) L.push(...graphTable(r.graphs), "");
  else L.push(`Reason: ${r.reason}`, "");
  L.push(
    failed.length
      ? `Not mounted: ${failed.map((g) => `\`${g.id}\` (${g.path})`).join(", ")}. Anything reading those paths will report`
      : `Nothing was mounted. Anything reading a branch-kept graph will report`,
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

/**
 * A store this module does not mount, and the Tool its declaration hands it to
 * (bean j9cs, owner 2026-10-04: *"there should not be a central registry for
 * declaring mount tools"*).
 *
 * `state:mount` implements ONE keying, `tip`. A `family` (one branch per IG
 * package or Lean toolchain) and a `route` store (a published site) are put on
 * disk, or on their CDN, by a Tool the declaration names in `storage.tool`.
 * This lists each with that Tool's command, so the mount DISPATCHES through
 * the declaration rather than knowing every keying. It does not run them: a
 * family member is chosen by a key (`keyFrom`) only the caller knows.
 */
export interface DelegatedStore {
  id: string;
  path: string;
  /** The branch, or for a family its prefix. */
  branch: string;
  keyedBy: string;
  tool?: string;
  /** The Tool's shell command, when it declares one. */
  invoke?: string;
}

export function delegatedStores(root: string = repoRootOf()): DelegatedStore[] {
  const byId = new Map(tools().map((t) => [t.id, t]));
  const out: DelegatedStore[] = [];
  for (const inst of instanceRootsIn(root)) {
    let decl;
    try {
      decl = readDeclaration(inst);
    } catch {
      continue; // an unreadable declaration is check:declared-dirs' finding
    }
    if (!decl) continue;
    for (const d of [...(decl.directories ?? []), ...nestedDirectories(inst, decl)]) {
      const st = d.storage as { keyedBy?: string; branch?: string; branchPrefix?: string; tool?: string } | undefined;
      if (!st?.keyedBy || !["family", "route", "route-family"].includes(st.keyedBy)) continue;
      const tool = st.tool;
      const shell = tool ? (byId.get(tool)?.invoke as { shell?: string } | undefined)?.shell : undefined;
      out.push({
        id: d.id,
        path: d.path,
        branch: st.branch ?? st.branchPrefix ?? "",
        keyedBy: st.keyedBy,
        ...(tool ? { tool } : {}),
        ...(shell ? { invoke: shell } : {}),
      });
    }
  }
  return out;
}

/** The section the command prints after the mount table: what is not mounted here, and by which Tool. */
export function delegatedReport(stores: readonly DelegatedStore[]): string {
  if (stores.length === 0) return "";
  const L = [
    "",
    "",
    "### Not mounted here: handed to the Tool each declaration names",
    "",
    "| graph | keyed by | branch | Tool | command |",
    "|---|---|---|---|---|",
  ];
  for (const s of stores) {
    const tool = s.tool ? `\`${s.tool}\`` : "⚠️ none declared";
    L.push(`| \`${s.id}\` | ${s.keyedBy} | \`${s.branch}\` | ${tool} | ${s.invoke ? `\`${s.invoke}\`` : "—"} |`);
  }
  return L.join("\n");
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const at = argv.indexOf("--id");
  const r = mountState({ id: at === -1 ? undefined : argv[at + 1] });
  if (argv.includes("--json")) console.log(JSON.stringify(r, null, 2));
  else console.log(report(r) + delegatedReport(delegatedStores()));
  // Loud means a non-zero exit too: a hook that only prints is a hook a wrapper
  // can swallow, and the sweep calls this with `|| true`. `partial` counts: a
  // graph that did not mount is a finding even when its siblings did.
  process.exit(r.state === "failed" || r.state === "partial" ? 1 : 0);
}
