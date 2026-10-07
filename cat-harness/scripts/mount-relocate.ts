#!/usr/bin/env bun
/**
 * mount:relocate — change the directory a remote KG is mounted at, when its
 * default (`<name>/`) collides with something the downstream already has.
 *
 * @module scripts/mount-relocate
 * @graphNode none — a command-line tool over declared remote mounts
 * @covers none — it moves a mount and rewrites its declaration and lock entry; it judges no graph
 *
 * Bean `t4xb`, owner 2026-10-07 (#2468): "give the user an easy skill + Tool
 * to change the directory the remote KG is mounted at". The workflow is the
 * skill `kg-core/pinned-remote-dependency` §"Mount path collisions and
 * relocation"; this is the `mount-relocate` Tool.
 *
 *   bun run cat mount:relocate <instance> --to <dir> [--plan] [--root <dir>]
 *
 * 1. `<dir>` passes the same collision check a mount does (declared
 *    directories, reserved root names, every other mount), and must not be a
 *    populated directory already.
 * 2. The new path is written as `overrides.<instance>.path` on the mount that
 *    brings the instance in, through `writeDeclaredMounts` — the one write
 *    path for mounts.
 * 3. Mounted and matching the lock: the directory is MOVED on disk and its
 *    lock entry rewritten (digests are relative to each directory, so they do
 *    not change). Drifted: refused, nothing changed — move the edits upstream
 *    first; work is never discarded. Not mounted yet: only the declaration
 *    changes, then `mount:remote` lays it down.
 * 4. `--plan` says what would change and writes nothing.
 *
 * Relocating on disk does NOT change the harness's URL namespace: the route
 * is `<base>/<harness>/<visualizer>/` wherever the bytes sit.
 *
 * Exit: 0 relocated (or planned), 1 refused, 2 could not determine.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { checkoutRootFor, readDeclaration } from "../schemas/cat-harness.js";
import { readDeclaredMounts, writeDeclaredMounts } from "../schemas/index-config.js";
import { MountPathSchema, mountLockPathFor, readMountLock, type LockedInstance, type RemoteMount } from "../schemas/remote-mount.js";
import { modifiedSince, mountRemote, pathCollisions } from "./remote-mount.ts";
import { type UrlFor } from "./remote-tree.ts";

export interface RelocateResult {
  state: "relocated" | "planned" | "refused" | "could-not-determine";
  /** What was (or, with `plan`, would be) done, one line each. */
  steps: string[];
  detail: string;
}

const strip = (p: string): string => p.replace(/\/+$/, "");
const rebase = (p: string, from: string, to: string): string => (p === from ? to : p.startsWith(`${from}/`) ? `${to}${p.slice(from.length)}` : p);

export function relocate(instanceRoot: string, instance: string, toRaw: string, opts: { plan?: boolean; urlFor?: UrlFor } = {}): RelocateResult {
  const to = strip(toRaw);
  if (!MountPathSchema.safeParse(to).success || to === "") {
    return { state: "refused", steps: [], detail: `\`${toRaw}\` is not a repository-relative directory with no dot-prefixed segment` };
  }
  const decl = readDeclaration(instanceRoot);
  if (!decl) return { state: "could-not-determine", steps: [], detail: `${instanceRoot} holds no declaration` };
  let mounts: RemoteMount[];
  try {
    mounts = readDeclaredMounts(instanceRoot).mounts;
  } catch (e) {
    return { state: "could-not-determine", steps: [], detail: (e as Error).message };
  }
  const lockRead = readMountLock(mountLockPathFor(instanceRoot, decl.name));
  const lock = lockRead.ok ? lockRead.lock : undefined;
  const entry = lock?.instances.find((i) => i.instance === instance);
  const mount = mounts.find((m) => m.harness === instance) ?? (entry ? mounts.find((m) => m.harness === entry.via) : undefined);
  if (!mount) return { state: "could-not-determine", steps: [], detail: `no declared remote mount brings in \`${instance}\`` };
  const from = strip(entry?.path ?? mount.overrides?.[instance]?.path ?? instance);
  if (from === to) return { state: "relocated", steps: [], detail: `\`${instance}\` already lands at \`${to}/\`; nothing to do` };

  // The same check a mount makes, with this instance at its NEW path and
  // every other locked or declared mount where it lands now.
  const others = [
    ...(lock?.instances ?? []).filter((i) => i.instance !== instance).map((i) => ({ instance: i.instance, path: i.path })),
    ...mounts.filter((m) => m.harness !== instance && !(lock?.instances ?? []).some((i) => i.instance === m.harness)).map((m) => ({ instance: m.harness, path: strip(m.overrides?.[m.harness]?.path ?? m.harness) })),
  ];
  const clash = pathCollisions(instanceRoot, [...others, { instance, path: to }]).get(instance);
  if (clash) return { state: "refused", steps: [], detail: `refused, nothing changed: ${clash.join("; ")}` };
  const target = join(instanceRoot, to);
  if (existsSync(target) && readdirSync(target).length > 0) {
    return { state: "refused", steps: [], detail: `refused, nothing changed: \`${to}/\` is already a populated directory; choose an empty or absent one` };
  }

  const steps: string[] = [];
  const mounted = entry !== undefined && existsSync(join(instanceRoot, entry.path));
  if (mounted) {
    const edited = modifiedSince(instanceRoot, entry!);
    if (edited.length) {
      return {
        state: "refused",
        steps: [],
        detail: `refused, nothing changed: ${edited.join(", ")} no longer match the lock. Those edits are somebody's work: move them upstream as a PR to the fork first, then relocate`,
      };
    }
    steps.push(`move \`${from}/\` → \`${to}/\` on disk`, `rewrite \`${instance}\`'s lock entry: path \`${from}\` → \`${to}\``);
  }
  steps.push(`write \`overrides.${instance}.path = "${to}"\` on mount \`${mount.harness}\` (index.config.json, via writeDeclaredMounts)`);
  if (!mounted) steps.push("mount it: `bun run cat mount:remote`");
  if (opts.plan) return { state: "planned", steps, detail: "--plan: nothing was written" };

  const next = mounts.map((m) =>
    m.harness === mount.harness ? { ...m, overrides: { ...(m.overrides ?? {}), [instance]: { ...(m.overrides?.[instance] ?? {}), path: to } } } : m,
  );
  try {
    writeDeclaredMounts(instanceRoot, next);
  } catch (e) {
    return { state: "refused", steps: [], detail: `refused before anything changed: ${(e as Error).message}` };
  }
  if (mounted) {
    mkdirSync(dirname(target), { recursive: true });
    if (existsSync(target)) rmdirSync(target); // checked empty above; rmdir refuses anything else
    renameSync(join(instanceRoot, from), target);
    const file = mountLockPathFor(instanceRoot, decl.name);
    const raw = JSON.parse(readFileSync(file, "utf-8")) as { mounts: Array<{ harness: string; ref: string }>; instances: LockedInstance[] };
    raw.instances = raw.instances.map((i) =>
      i.instance !== instance
        ? i
        : {
            ...i,
            path: to,
            directories: i.directories.map((d) => ({ ...d, path: rebase(d.path, from, to) })),
            assets: (i.assets ?? []).map((a) => ({ ...a, path: rebase(a.path, from, to) })),
          },
    );
    writeFileSync(file, JSON.stringify(raw, null, 2) + "\n");
    return { state: "relocated", steps, detail: `\`${instance}\` moved to \`${to}/\`; declaration and lock rewritten. Its route is unchanged: <base>/${instance}/<visualizer>/` };
  }
  const r = mountRemote({ instanceRoot, urlFor: opts.urlFor });
  const o = r.plan.outcomes.find((x) => x.instance === instance);
  return o?.state === "mounted"
    ? { state: "relocated", steps, detail: `\`${instance}\` declared at \`${to}/\` and mounted there` }
    : { state: o?.state === "could-not-determine" ? "could-not-determine" : "refused", steps, detail: `declared at \`${to}/\`, but the mount did not land: ${o?.detail ?? "no outcome"}` };
}

export const HELP = `bun run cat mount:relocate <instance> --to <dir> [--plan] [--root <dir>]

Change the directory a remote-mounted instance lands at (bean t4xb). <dir> is
checked against the directories this checkout declares, the reserved root names
and every other mount. A mounted, unedited instance is moved and its lock entry
rewritten; an edited one is refused (move the edits upstream first); an
unmounted one is declared at <dir> and mounted. --plan writes nothing.
Relocating does not change the instance's route: <base>/<instance>/<visualizer>/.`;

if (import.meta.main) {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h") || argv.length === 0) {
    console.log(HELP);
    process.exit(argv.length === 0 ? 2 : 0);
  }
  const arg = (f: string): string | undefined => {
    const i = argv.indexOf(f);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const instance = argv[0]!;
  const to = arg("--to");
  if (!to) {
    console.error("mount:relocate: --to <dir> is required");
    process.exit(2);
  }
  const root = arg("--root") ? resolve(arg("--root")!) : checkoutRootFor(process.cwd());
  const r = relocate(root, instance, to, { plan: argv.includes("--plan") });
  for (const s of r.steps) console.log(`  · ${s}`);
  console.log(`${r.state}: ${r.detail}`);
  process.exit(r.state === "relocated" || r.state === "planned" ? 0 : r.state === "refused" ? 1 : 2);
}
