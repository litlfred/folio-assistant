#!/usr/bin/env bun
/**
 * Every `fallbackRole` on a skill's required capability names a real role.
 *
 * Bean `folio-assistant-85e8`. The field exists because the degradation
 * model could express *use a different tool* and not *use a different kind
 * of participant* — the owner's case, 2026-09-20: an air-gapped actor whose
 * API cannot be reached, where a person signs instead.
 *
 * ## Why the field ships WITH a check
 *
 * Because this repository has just spent a day finding declarations that
 * resolve to nothing and are read by no one — skill front-matter `roles:`
 * (254 undeclared uses, bean `qif9`), 110 skills bound to no role (`y1w9`),
 * `capabilities[]` holding three kinds at once (`ind9`). A new optional
 * string field pointing at a registry is the exact shape that goes inert.
 *
 * So: a `fallbackRole` that names nothing is a **hard failure**, not a
 * report. The field is new, so the count starts at zero and gating from the
 * first commit costs nobody anything — unlike `agents-xref`, which had a
 * backlog and rightly reported before it gated.
 *
 * ## The vacuity guard
 *
 * A check over a field nobody has populated passes trivially, which is not
 * the same as passing. This repository has paid for that three times: a
 * `grep` over zero Lean files printing OK, a `ruff` scan of missing paths
 * reporting a baseline it never computed, and `readme:sync:check` passing
 * over a README with no markers.
 *
 * So the run SAYS when it examined nothing, and `--require-use` turns that
 * into a failure — for the day somebody wants to assert the mechanism is
 * actually exercised. The default stays quiet-but-honest, because a field
 * legitimately has no uses on the day it is added.
 *
 * Usage:
 *   bun run check:fallback-roles
 *   bun run check:fallback-roles -- --require-use   # fail if nothing uses it
 *
 * @module scripts/check-fallback-roles
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { kgRoots } from "./known-skills.js";
import { readRoleGraph } from "../schemas/role-graph.js";

const ROOT = resolve(import.meta.dir, "..");

/** One `fallbackRole` occurrence, with enough to find it again. */
export interface FallbackRoleUse {
  file: string;
  role: string;
}

/**
 * Every declared role id, across every declared knowledge-graph root.
 *
 * Through `kgRoots` and `readRoleGraph` rather than a literal path: the
 * `kg` directory is declared in `harness.json` and an instance may put it
 * anywhere, so a hardcoded `skills/roles/roles.json` is one relocation away
 * from checking nothing. `check:declared-paths` caught exactly that in the
 * first draft of this file.
 */
export function declaredRoles(root: string): Set<string> {
  const out = new Set<string>();
  for (const kgRoot of kgRoots(root)) {
    for (const r of readRoleGraph(kgRoot)?.roles ?? []) out.add(r.id);
  }
  return out;
}

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    // Every segment, not just the first — the dot-prefix guard this repo
    // already applies in `directory-conventions`.
    if (e.startsWith(".") || e === "node_modules") continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith(".ts") && !e.endsWith(".test.ts")) out.push(p);
  }
  return out;
}

/**
 * Find every `fallbackRole: "…"` in the scanned trees.
 *
 * A regex rather than the type checker, deliberately: the value must be a
 * literal for this to be checkable at all, and a computed one should be
 * visible as a miss rather than silently resolved.
 */
export function fallbackRoleUses(root: string, dirs: string[]): FallbackRoleUse[] {
  const out: FallbackRoleUse[] = [];
  for (const d of dirs) {
    for (const f of walk(join(root, d))) {
      const text = readFileSync(f, "utf-8");
      for (const m of text.matchAll(/fallbackRole:\s*["'`]([^"'`]+)["'`]/g)) {
        out.push({ file: relative(root, f), role: m[1]! });
      }
    }
  }
  return out;
}

/** The trees a skill's capability refs can live in. */
export const SCANNED = ["skills", "src", "schemas", "content", "adapters"];

if (import.meta.main) {
  const requireUse = process.argv.includes("--require-use");
  const roles = declaredRoles(ROOT);
  const uses = fallbackRoleUses(ROOT, SCANNED);
  const bad = uses.filter((u) => !roles.has(u.role));

  console.log(
    `fallbackRole: ${uses.length} use(s) across ${SCANNED.length} tree(s), ` +
      `against ${roles.size} declared role(s)`,
  );

  if (uses.length === 0) {
    // Stated, not implied. "Nothing to check" and "everything checked out"
    // are different answers and must not print the same.
    console.log(
      "\n⚠ EXAMINED NOTHING — no `fallbackRole` is declared anywhere yet.\n" +
        "  That is not a pass. The field was added by bean " +
        "`folio-assistant-85e8`\n  and is expected to have its first use in the " +
        "signing process (`r0rq`).",
    );
    process.exit(requireUse ? 1 : 0);
  }

  if (bad.length === 0) {
    console.log(`\n✓ every fallbackRole resolves against skills/roles/roles.json`);
    process.exit(0);
  }

  console.log(`\n✗ ${bad.length} fallbackRole(s) name no declared role:`);
  for (const b of bad) console.log(`  · ${b.file}  →  "${b.role}"`);
  console.log(
    `\nAdd the role to skills/roles/roles.json, or correct the name. A ` +
      `reference-shaped\nvalue that resolves to nothing is the defect this ` +
      `check exists to prevent.`,
  );
  process.exit(1);
}
