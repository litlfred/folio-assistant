#!/usr/bin/env bun
/**
 * check:mount-tracked — no tracked file may exist under any remote mount's
 * effective path.
 *
 * @module scripts/check-mount-tracked
 * @graphNode none — a gate over the remote-mount declaration, the lock and git
 * @covers none — it asks git about paths the mounts own; it judges no graph's content
 *
 * Owner-approved, 2026-10-07 (#2468). Mounted bytes are another repository's
 * at a pin; they are git-ignored and never committed. The mount itself already
 * refuses to LAND on tracked bytes; this is the other half: nothing may be
 * COMMITTED under a mount path afterwards, where a re-mount would refuse it and
 * a reader would take it for the upstream's.
 *
 * Paths come from the declaration (`readDeclaredMounts`: each mount's
 * `overrides.<name>.path`, else `<name>`) and from the lock (every instance it
 * laid down, the closure included). For each, `git ls-files -- <path>` must be
 * empty.
 *
 * Exit: 0 clean, 1 tracked files under a mount, 2 could not determine.
 */
import { spawnSync } from "node:child_process";
import { join, relative } from "node:path";

import { checkoutRootFor, readDeclaration } from "../schemas/cat-harness.js";
import { readDeclaredMounts } from "../schemas/index-config.js";
import { mountLockPathFor, readMountLock } from "../schemas/remote-mount.js";
import { declaringInstances } from "./remote-mount.ts";

export interface TrackedUnderMount {
  /** The mount path, relative to the checkout. */
  path: string;
  /** The mounted instance that owns the path. */
  instance: string;
  /** Tracked files under it, checkout-relative. */
  files: string[];
}

export interface MountTrackedVerdict {
  state: "clean" | "tracked" | "could-not-determine";
  findings: TrackedUnderMount[];
  reasons: string[];
  /** How many mount paths were asked about. */
  paths: number;
}

/** Every effective mount path an instance root declares or locks, relative to that root. */
export function mountPathsOf(instanceRoot: string): Map<string, string> {
  const out = new Map<string, string>();
  const decl = readDeclaration(instanceRoot);
  for (const m of readDeclaredMounts(instanceRoot).mounts) out.set((m.overrides?.[m.harness]?.path ?? m.harness).replace(/\/+$/, ""), m.harness);
  if (decl) {
    const lock = readMountLock(mountLockPathFor(instanceRoot, decl.name));
    if (lock.ok) for (const i of lock.lock.instances) out.set(i.path.replace(/\/+$/, ""), i.instance);
  }
  return out;
}

export function checkMountTracked(checkout: string): MountTrackedVerdict {
  const findings: TrackedUnderMount[] = [];
  const reasons: string[] = [];
  let paths = 0;
  const { roots, unreadable } = declaringInstances(checkout);
  for (const u of unreadable) reasons.push(`${u.root}: declaration unreadable (${u.why}); it may declare mounts`);
  for (const root of roots) {
    let owned: Map<string, string>;
    try {
      owned = mountPathsOf(root);
    } catch (e) {
      reasons.push(`${root}: ${(e as Error).message}`);
      continue;
    }
    for (const [path, instance] of owned) {
      paths++;
      const r = spawnSync("git", ["ls-files", "--", path], { cwd: root, encoding: "utf-8" });
      if (r.status !== 0) {
        reasons.push(`git ls-files -- ${path} exited ${r.status}: ${(r.stderr ?? "").trim()}`);
        continue;
      }
      const files = r.stdout.split("\n").filter(Boolean);
      if (files.length) findings.push({ path: relative(checkout, join(root, path)) || path, instance, files: files.map((f) => relative(checkout, join(root, f))) });
    }
  }
  return { state: reasons.length ? "could-not-determine" : findings.length ? "tracked" : "clean", findings, reasons, paths };
}

if (import.meta.main) {
  const v = checkMountTracked(checkoutRootFor(process.cwd()));
  for (const f of v.findings) {
    console.error(`✗ ${f.files.length} tracked file(s) under \`${f.path}/\`, which mount \`${f.instance}\` owns: ${f.files.slice(0, 10).join(", ")}${f.files.length > 10 ? ", …" : ""}`);
  }
  if (v.findings.length) console.error("  Mounted code is git-ignored and never committed. Move the change upstream as a PR to the fork, then `git rm --cached` the path (a person decides).");
  for (const r of v.reasons) console.error(`❔ could not determine: ${r}`);
  if (v.state === "clean") console.log(`✓ no tracked file under any of ${v.paths} mount path(s)`);
  process.exit(v.state === "clean" ? 0 : v.state === "tracked" ? 1 : 2);
}
