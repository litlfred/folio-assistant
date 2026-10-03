#!/usr/bin/env bun
/**
 * state-push — send each mount's edits to its branch THROUGH the library.
 *
 * @module scripts/state-push
 * @graphNode none — the write half of the state mount
 *
 * Bean `2h76`, the `bun run state:push` line; rebuilt on branch-store's
 * `pushMount` by bean `nij4` (see `state-mount.ts` for the ruling). This file
 * chooses which mounts to push and reports; the splice is `pushMount`'s.
 *
 * ## Which mounts: the markers, not the declarations
 *
 * Every id with a mount marker in THIS worktree is pushed, declared or not. A
 * declaration removed while a mount still holds edits must not make those
 * edits unpushable — that is the silent loss this module exists to prevent.
 * The marker records the branch, so nothing has to be re-resolved.
 *
 * ## Why not `git push`
 *
 * Because that is the lost update. A push of the tree the editor started from
 * reverts a sibling's write to a DIFFERENT file landed meanwhile, and
 * overwrites a sibling's write to the SAME file outright. What goes to the
 * remote is a SPLICE: only the paths that changed, grafted onto whatever the
 * tip is now, every other file carried across by id.
 *
 * ## The `expect` is the whole safety story
 *
 * The marker records the blob each file had at the mounted tip, so every
 * change carries what the editor read. A sibling who edited the same file
 * since gets this write stopped as `conflict` with the paths named, and
 * NOTHING is pushed. A file the editor created carries `expect: null`, so two
 * sessions creating the same bean are told instead of both believing they did.
 * Bytes, executable bits and symlinks are read as git records them.
 *
 * ## It does not touch the mount
 *
 * On `conflict` or `failed` the files are left exactly as they are: the edits
 * are the only copy.
 */

import type { BranchStoreOptions, Change, WriteResult } from "./branch-store.js";
import { mountChanges, mountedIds, pushMount } from "./branch-store.js";
import { repoRootOf } from "./state-mount.js";

export interface PushOptions {
  repoRoot?: string;
  message?: string;
  /** Report what would be sent and send nothing. */
  dryRun?: boolean;
  /** Push only this mounted id. */
  id?: string;
  /** Passed to `BranchStore.open` — tests point it at a scratch store. */
  store?: BranchStoreOptions;
}

type IdState = "nothing" | "would-push" | "pushed" | "conflict" | "failed";

/** One mount's outcome. */
export interface IdPush {
  id: string;
  state: IdState;
  reason: string;
  changes: Change[];
  write?: WriteResult;
}

export type PushResult = { state: "no-mount" | IdState; reason: string; pushes: IdPush[] };

/** Worst first: the overall state is the worst any one mount reached. */
const RANK: IdState[] = ["failed", "conflict", "pushed", "would-push", "nothing"];

export function pushState(opts: PushOptions = {}): PushResult {
  const root = opts.repoRoot ?? repoRootOf();
  const ids = mountedIds(root).filter((id) => opts.id === undefined || id === opts.id);
  if (ids.length === 0) {
    const what = opts.id === undefined ? "nothing is mounted" : `\`${opts.id}\` is not mounted`;
    return { state: "no-mount", reason: `${what} in this worktree; run \`bun run state:mount\` first`, pushes: [] };
  }

  const pushes: IdPush[] = ids.map((id): IdPush => {
    let changes: Change[];
    try {
      changes = mountChanges(id, root) ?? [];
    } catch (e) {
      return { id, state: "failed", reason: (e as Error).message, changes: [] };
    }
    if (changes.length === 0) return { id, state: "nothing", reason: "no local edits", changes };
    if (opts.dryRun) return { id, state: "would-push", reason: `${changes.length} path(s) would be spliced onto the tip`, changes };
    const write = pushMount(id, opts.message ?? `state: ${changes.length} path(s) from the ${id} mount`, { repoRoot: root, store: opts.store });
    if (write.state === "pushed" || write.state === "unchanged") return { id, state: "pushed", reason: write.reason, changes, write };
    if (write.state === "conflict") {
      return {
        id,
        state: "conflict",
        reason: `${write.conflicts?.length ?? 0} path(s) were edited on ${write.branch} since this mount was taken; NOTHING was pushed and the mount is untouched`,
        changes,
        write,
      };
    }
    return { id, state: "failed", reason: `${write.state}: ${write.reason}`, changes, ...("branch" in write ? { write } : {}) };
  });

  const state = RANK.find((s) => pushes.some((p) => p.state === s))!;
  const n = pushes.filter((p) => p.state === state).length;
  return { state, reason: `${n} of ${pushes.length} mount(s) ${state}`, pushes };
}

function verb(c: Change): string {
  return c.content === null ? "delete" : c.expect === null || c.expect === undefined ? "create" : "update";
}

export function report(r: PushResult): string {
  const L: string[] = ["## State push", ""];
  if (r.state === "no-mount") return L.concat(r.reason + ".").join("\n");
  for (const p of r.pushes) {
    if (p.state === "nothing") {
      L.push(`- \`${p.id}\` — nothing to push.`);
    } else if (p.state === "would-push") {
      L.push(`- \`${p.id}\` — ${p.reason}:`);
      for (const c of p.changes) L.push(`  - \`${c.path}\` — ${verb(c)}`);
    } else if (p.state === "pushed") {
      L.push(`- \`${p.id}\` — pushed ${p.changes.length} path(s) to \`${p.write?.branch}\`: ${p.reason}.`);
      if (p.write?.commit) L.push(`  Commit \`${p.write.commit.slice(0, 12)}\`, attempt ${p.write.attempts}.`);
    } else if (p.state === "conflict") {
      L.push(`- \`${p.id}\` — ⚠️ **not pushed: a sibling edited the same path(s).** ${p.reason}.`);
      for (const c of p.write?.conflicts ?? []) L.push(`  - \`${c.path}\` — you read \`${c.expected ?? "(absent)"}\`, the tip has \`${c.actual ?? "(absent)"}\``);
      L.push("  Your edits are still in the mount. Re-read those files, re-apply your change, and push again.");
    } else {
      L.push(`- \`${p.id}\` — 🛑 **the push failed.** ${p.reason}. Nothing was discarded: your edits are still in the mount.`);
    }
  }
  return L.join("\n");
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const val = (flag: string) => {
    const i = argv.indexOf(flag);
    return i === -1 ? undefined : argv[i + 1];
  };
  const r = pushState({ dryRun: argv.includes("--dry-run"), message: val("-m"), id: val("--id") });
  if (argv.includes("--json")) console.log(JSON.stringify(r, null, 2));
  else console.log(report(r));
  process.exit(r.state === "failed" || r.state === "conflict" ? 1 : 0);
}
