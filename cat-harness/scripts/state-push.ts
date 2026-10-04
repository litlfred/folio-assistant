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
 * Rebuilt by bean `nij4` on one implementation: every graph is spliced by
 * branch-store's {@link pushMount}, once per graph, to the branch that
 * graph's mount was read from. The `state/` worktree push is gone with the
 * worktree (`state-mount.ts`).
 *
 * ## Why not `git push`
 *
 * Because that is the lost update. A push of the tree the editor started from
 * reverts a sibling's write to a DIFFERENT file landed meanwhile, and
 * overwrites a sibling's write to the SAME file outright. What goes to the
 * remote instead is a SPLICE: only the paths that actually changed, grafted
 * onto whatever the tip is now, every other file carried across by id.
 *
 * ## The `expect` is the whole safety story
 *
 * The mount marker records the blob each file had at the mounted tip, which IS
 * what the editor read. That is exactly `Change.expect`. A sibling who edited
 * the same file since gets this write stopped as `conflict` with the paths
 * named, and NOTHING is pushed for that graph — rather than one of the two
 * edits quietly disappearing. A file the editor created carries
 * `expect: null`, so two sessions creating the same bean are told instead of
 * both believing they did.
 *
 * ## Which graphs: the declarations AND the mounts
 *
 * Every declared tip-keyed graph, plus every graph mounted in this worktree
 * whose declaration has since gone. A mount's marker records its branch, so
 * it needs no declaration to push — and edits in a mount nobody declares any
 * more must not be stranded where no command reaches them.
 *
 * ## It never discards edits
 *
 * On `conflict` or `failed` the mount is left exactly as it is: the edits are
 * the only copy.
 */

import {
  mountedIds,
  pendingMountChanges,
  pushMount,
  readMarker,
  tipLocations,
  type BranchStoreOptions,
  type Change,
  type TipLocation,
  type WriteResult,
} from "./branch-store.js";
import { repoRootOf } from "./state-mount.js";

export interface PushOptions {
  repoRoot?: string;
  message?: string;
  /** Report what would be sent and send nothing. */
  dryRun?: boolean;
  /** Push only this graph id. */
  id?: string;
  /** Passed to `BranchStore.open` — tests point it at a scratch store. */
  store?: BranchStoreOptions;
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

export type PushResult = {
  state: "no-mount" | "nothing" | "would-push" | "pushed" | "failed" | "partial";
  reason: string;
  graphs: GraphPush[];
};

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
      const changes = pendingMountChanges(loc.id, { repoRoot: root });
      const message = opts.message ?? `state: ${loc.id} from its mount`;
      const w = pushMount(loc.id, message, { repoRoot: root, store: opts.store });
      if (w.state === "refused") graphs.push({ ...base, state: "refused", reason: w.reason });
      else graphs.push({ ...base, state: w.state, reason: w.reason, write: w, changes });
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
      return { state: "would-push", reason: `${changes.length} path(s) across ${n} graph(s) would be spliced`, graphs };
    }
    const pushed = graphs.filter((g) => g.state === "pushed");
    if (pushed.length === 0) return { state: "nothing", reason: `no graph had changes to push`, graphs };
    return { state: "pushed", reason: `${pushed.length} of ${n} graph(s) pushed, each to its own branch`, graphs };
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
  let locations: TipLocation[];
  try {
    locations = tipLocations(root);
  } catch (e) {
    return { state: "failed", reason: `could not read the directory declarations: ${(e as Error).message}`, graphs: [] };
  }
  // A mount whose declaration has gone still pushes, to the branch its marker recorded.
  for (const id of mountedIds(root)) {
    if (locations.some((l) => l.id === id)) continue;
    const m = readMarker(root, id);
    if (m) locations.push({ id, path: m.path, branch: m.branch, keyedBy: "tip" });
  }
  if (opts.id !== undefined) locations = locations.filter((l) => l.id === opts.id);
  if (locations.length === 0) {
    const what = opts.id === undefined ? "no graph is declared at a branch tip or mounted here" : `\`${opts.id}\` is neither declared at a branch tip nor mounted here`;
    return { state: "no-mount", reason: `${what}; run \`bun run state:mount\` first`, graphs: [] };
  }
  return pushFanOut(root, locations, opts);
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
  if (r.graphs.length) {
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
  return L.concat(r.reason + ".").join("\n");
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const at = argv.indexOf("-m");
  const i = argv.indexOf("--id");
  const r = pushState({
    dryRun: argv.includes("--dry-run"),
    message: at === -1 ? undefined : argv[at + 1],
    id: i === -1 ? undefined : argv[i + 1],
  });
  if (argv.includes("--json")) console.log(JSON.stringify(r, null, 2));
  else console.log(report(r));
  // `partial` counts: a graph whose splice did not settle is a finding even
  // when its siblings' did.
  process.exit(r.state === "failed" || r.state === "partial" ? 1 : 0);
}
