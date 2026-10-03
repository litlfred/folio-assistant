#!/usr/bin/env bun
/**
 * state-mount — put every branch-kept subgraph on disk, or say loudly that it is not there.
 *
 * @module scripts/state-mount
 * @graphNode none — a session-start step over the declared subgraph sources
 *
 * Bean `2h76` part 4, arc `fs43`; rebuilt by bean `nij4`. The session-start
 * hook calls this; it is also `bun run state:mount` by hand.
 *
 * ## One implementation, reached through the command everyone already uses
 *
 * Main carried two mount/push pairs after #1982 and #1957 both merged: this
 * file's `state/` worktree, and branch-store's `mountTip` / `pushMount`. Owner
 * ruling 2026-10-03 (bean `nij4`): keep the `state:mount` / `state:push`
 * COMMANDS and run them on branch-store's code, which round-trips bytes, modes
 * and symlinks and keys a mount by directory id. So this file decides WHICH
 * subgraphs to mount and how loudly to report; the mounting is `mountTip`'s.
 *
 * ## Which subgraphs: the declared source, dispatched on its kind
 *
 * Every declared directory is asked through `declaredSubgraph`, the one lookup
 * that folds a config override, `source` and the legacy `storage` together.
 * `tipLocations` is NOT used here: it reads `storage` alone, so a subgraph
 * declared the current way (`source: { kind: "branch" }`) is invisible to it.
 *
 * | source | here |
 * |---|---|
 * | `directory` | nothing to do — the content is the checkout |
 * | `branch`, keyed by `tip` | mounted at the declared path |
 * | `branch`, keyed by `commit` | not a mount's — `qa-store` reads it per commit |
 * | anything else | REFUSED, loudly: a kind this file was not written for is not guessed at |
 *
 * ## The failure this exists to make impossible
 *
 * The proposal names it as a falsifier: *"If the session-start hook's fetch
 * fails silently and `beans list` returns empty, the agent reads 'no work' —
 * the third state collapsing into zero."* An empty work-plan and an unreachable
 * work-plan look identical to an agent, and the agent acts on the first
 * reading. So every failure here is LOUD: a non-zero exit, and a block on
 * stdout — the hook's stdout IS the agent's context — that says in as many
 * words that an empty `beans list` must not be believed. `mountTip` reports a
 * miss as a miss, never as an empty mount, and a branch without a
 * `state-manifest/v1` root manifest as `corrupt`.
 *
 * ## It is inert until the cutover, and that is not a failure
 *
 * While no declaration keeps a subgraph on a branch tip this reports
 * `not-enabled` and exits 0. A mount that treated "nothing is kept on a
 * branch" as an error would fail every session over a branch nothing reads —
 * the crying-wolf that teaches an agent to ignore the loud case.
 *
 * ## It never discards work
 *
 * A mount with unpushed edits is reported `dirty` and left exactly as it is,
 * never re-read over. Its files are somebody's work in progress, and this
 * module's whole purpose is that state is not lost silently.
 */

import { spawnSync } from "node:child_process";
import { relative } from "node:path";

import { instanceRootsIn, readDeclaration } from "../schemas/cat-harness.js";
import { declaredSubgraph } from "../schemas/harness-config.js";
import { mountChanges, mountTip, type BranchStoreOptions, type TipLocation } from "./branch-store.js";

/** One declared subgraph this cannot act on, and why. */
export interface Refusal {
  id: string;
  reason: string;
}

/** Which subgraphs live at a branch tip, and which declarations could not be read as one. */
export interface BranchSubgraphs {
  locations: TipLocation[];
  refused: Refusal[];
}

/** One subgraph's outcome. */
export type IdMount =
  | { id: string; state: "mounted"; into: string; branch: string; tip: string; files: number }
  | { id: string; state: "dirty"; into: string; reason: string }
  | { id: string; state: "failed"; reason: string };

export type MountResult = { state: "not-enabled" | "mounted" | "dirty" | "failed"; reason: string; mounts: IdMount[] };

export interface MountOptions {
  repoRoot?: string;
  /** Mount only this subgraph id. */
  id?: string;
  /** Passed to `BranchStore.open` — tests point it at a scratch store. */
  store?: BranchStoreOptions;
}

export function repoRootOf(cwd = process.cwd()): string {
  const r = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf-8" });
  if (r.status !== 0) throw new Error(`not inside a git checkout: ${cwd}`);
  return r.stdout.trim();
}

/**
 * Every declared subgraph kept at a branch tip, across the checkout's
 * instances — asked from the DECLARING instance, so an id two instances both
 * declare resolves to each one's own entry instead of throwing as ambiguous.
 */
export function branchSubgraphs(repoRoot: string): BranchSubgraphs {
  const locations: TipLocation[] = [];
  const refused: Refusal[] = [];
  for (const inst of instanceRootsIn(repoRoot)) {
    for (const { id } of readDeclaration(inst)?.directories ?? []) {
      let sub: ReturnType<typeof declaredSubgraph>;
      try {
        sub = declaredSubgraph(inst, id);
      } catch (e) {
        refused.push({ id, reason: (e as Error).message });
        continue;
      }
      if (!sub) continue;
      const src = sub.source;
      switch (src.kind) {
        case "directory":
          continue;
        case "branch": {
          if (src.keyedBy !== "tip") continue; // per-commit entries are qa-store's, not a mount's
          const path = relative(repoRoot, sub.entry.absPath).split("\\").join("/").replace(/\/+$/, "");
          if (!locations.some((l) => l.id === id && l.path === path)) locations.push({ id, path, branch: src.branch, keyedBy: "tip" });
          continue;
        }
        default: {
          const unknown: never = src;
          refused.push({ id, reason: `source kind ${JSON.stringify((unknown as { kind?: unknown }).kind)} is not one a mount knows` });
        }
      }
    }
  }
  return { locations: locations.sort((a, b) => a.id.localeCompare(b.id)), refused };
}

/** Mount each branch-kept subgraph at its declared path, or report why not. Never throws for an expected state. */
export function mountState(opts: MountOptions = {}): MountResult {
  const root = opts.repoRoot ?? repoRootOf();
  let found: BranchSubgraphs;
  try {
    found = branchSubgraphs(root);
  } catch (e) {
    return { state: "failed", reason: `could not read the directory declarations: ${(e as Error).message}`, mounts: [] };
  }
  const want = (id: string) => opts.id === undefined || id === opts.id;
  const mounts: IdMount[] = found.refused.filter((r) => want(r.id)).map((r) => ({ id: r.id, state: "failed", reason: r.reason }));
  const locations = found.locations.filter((l) => want(l.id));
  if (locations.length === 0 && mounts.length === 0) {
    if (opts.id !== undefined) return { state: "failed", reason: `no declared subgraph \`${opts.id}\` is kept at a branch tip`, mounts };
    return {
      state: "not-enabled",
      reason: "no declared subgraph is kept at a branch tip, so the checkout is still authoritative; nothing to mount",
      mounts,
    };
  }

  for (const loc of locations) {
    // Somebody's unpushed edits: report, never re-read over them.
    let pending;
    try {
      pending = mountChanges(loc.id, root);
    } catch (e) {
      mounts.push({ id: loc.id, state: "failed", reason: `could not read the existing mount: ${(e as Error).message}` });
      continue;
    }
    if (pending && pending.length > 0) {
      mounts.push({ id: loc.id, state: "dirty", into: loc.path, reason: `${pending.length} unpushed change(s); left untouched` });
      continue;
    }
    const r = mountTip(loc, { repoRoot: root, store: opts.store });
    if (r.state === "mounted") mounts.push({ id: loc.id, state: "mounted", into: r.into, branch: r.branch, tip: r.tip, files: r.files });
    else mounts.push({ id: loc.id, state: "failed", reason: `${r.state}: ${r.reason}` });
  }

  const failed = mounts.filter((m) => m.state === "failed").length;
  if (failed) return { state: "failed", reason: `${failed} of ${mounts.length} subgraph(s) could not be mounted`, mounts };
  const dirty = mounts.filter((m) => m.state === "dirty").length;
  if (dirty) return { state: "dirty", reason: `${dirty} of ${mounts.length} mount(s) hold unpushed edits`, mounts };
  return { state: "mounted", reason: `${mounts.length} subgraph(s) mounted`, mounts };
}

function line(m: IdMount, root?: string): string {
  if (m.state === "mounted") {
    const at = root ? relative(root, m.into) || "." : m.into;
    return `- \`${m.id}\` at \`${at}/\` — ${m.files} file(s) from \`${m.branch}\`@\`${m.tip.slice(0, 12)}\``;
  }
  if (m.state === "dirty") return `- \`${m.id}\` at \`${m.into}/\` — ⚠️ ${m.reason}`;
  return `- \`${m.id}\` — 🛑 ${m.reason}`;
}

/**
 * The markdown the session-start hook injects. A failure is deliberately
 * shouty and says what NOT to believe, because the agent's next move after
 * reading this is to read the work-plan.
 */
export function report(r: MountResult, root?: string): string {
  const L: string[] = ["## State branch mount", ""];
  const each = r.mounts.map((m) => line(m, root));
  if (r.state === "not-enabled") {
    L.push(`Not enabled — ${r.reason}.`, "", "Beans and todos are read from the checkout, as usual.");
    return L.join("\n");
  }
  if (r.state === "mounted") {
    L.push(`Mounted — ${r.reason}:`, "", ...each, "");
    L.push("Write through `bun run state:push`: it splices only what changed onto the tip, so a sibling's edit to the same file is a conflict, never an overwrite.");
    return L.join("\n");
  }
  if (r.state === "dirty") {
    L.push(`⚠️ **${r.reason}, and those were left untouched.**`, "", ...each, "");
    L.push("Nothing was discarded. Push (`bun run state:push`) or revert those changes before expecting the mount to move.");
    return L.join("\n");
  }
  L.push(
    `🛑 **THE STATE MOUNT FAILED — do not trust an empty work-plan.**`,
    "",
    `Reason: ${r.reason}`,
    "",
    ...each,
    ...(each.length ? [""] : []),
    `A subgraph that failed is NOT on disk, so anything reading beans or todos from it will report **nothing**, and`,
    `"no beans" and "could not reach the beans" look identical from there. An empty \`beans list\` right now is`,
    `**not** evidence that there is no work.`,
    "",
    "Fix the mount (`bun run state:mount`) or read the work-plan from the checkout before deciding there is none.",
  );
  return L.join("\n");
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const at = argv.indexOf("--id");
  const root = repoRootOf();
  const r = mountState({ repoRoot: root, id: at === -1 ? undefined : argv[at + 1] });
  if (argv.includes("--json")) console.log(JSON.stringify(r, null, 2));
  else console.log(report(r, root));
  // Loud means a non-zero exit too: a hook that only prints is a hook a wrapper can swallow.
  process.exit(r.state === "failed" ? 1 : 0);
}
