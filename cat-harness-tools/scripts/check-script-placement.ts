#!/usr/bin/env bun
/**
 * Does every script live in the manifest of the layer it runs?
 *
 * Bean `ar1s` phase 4 split the root `package.json`'s 509 scripts by layer
 * (`cat-harness/schemas/script-table.ts`). A script whose command names one
 * layer's paths belongs to that layer; one naming several belongs to the one
 * that needs all the others (its declared `needs`, transitively); one naming
 * none, or naming layers no single one needs, belongs to the root, the
 * aggregate. Without this check the next added script lands in the root out of
 * habit, and the table drifts back to the one file a split cannot divide.
 *
 * The layers and their order are READ from each instance's declaration, never
 * listed here. A submodule (another repository's checkout) is not a layer of
 * this one: a script running its code stays at the root.
 *
 *   bun run cat check:script-placement
 *
 * @covers none — it places scripts by the paths their commands name; it judges no graph
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

import { instanceRootsIn } from "../../cat-harness/schemas/instance-roots.ts";
import { readScriptTable } from "../../cat-harness/schemas/script-table.ts";
import { mountScopeFor } from "../../cat-harness/schemas/remote-mount.ts";

const REPO = resolve(import.meta.dir, "..", "..");

/** The layers of this repository (not submodules), each with its declared `needs`. */
export function layersOf(repo: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const inst of instanceRootsIn(repo)) {
    if (resolve(inst) === resolve(repo)) continue;
    if (existsSync(join(inst, ".git"))) continue; // a submodule: another repository
    const name = basename(inst);
    const decl = join(inst, `${name}.json`);
    const needs = existsSync(decl)
      ? (((JSON.parse(readFileSync(decl, "utf-8")) as { needs?: unknown[] }).needs ?? []) as unknown[])
          .map((n) => (typeof n === "string" ? n : ((n as { id?: string; path?: string }).id ?? (n as { path?: string }).path ?? "")))
          .filter(Boolean)
      : [];
    out.set(relative(repo, inst), needs);
  }
  return out;
}

/** The manifest a command belongs in: a layer's `package.json`, or the root's. */
export function ownerOf(command: string, layers: Map<string, string[]>, foreign: ReadonlySet<string> = new Set()): string {
  const closure = (l: string, seen = new Set<string>()): Set<string> => {
    for (const n of layers.get(l) ?? []) if (!seen.has(n)) { seen.add(n); closure(n, seen); }
    return seen;
  };
  const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // A MOUNTED layer (bean `nn8e`) still counts when following `needs` — a
  // layer above it reaches the rest of the stack through it — but it cannot
  // OWN a script here: its manifest belongs to its own repository.
  const named = [...layers.keys()].filter((l) => !foreign.has(l)).filter((l) => new RegExp(`(^|[\\s"'=(/])${esc(l)}(/|$|[\\s"')])`).test(command));
  if (named.length === 0) return "package.json";
  const owners = named.filter((c) => named.every((o) => o === c || closure(c).has(o)));
  return owners.length === 1 ? `${owners[0]}/package.json` : "package.json";
}

export interface PlacementVerdict {
  /** 0 placed, 1 a script in the wrong manifest (or a name declared twice), 2 a mounted manifest could not be resolved. */
  exit: 0 | 1 | 2;
  lines: string[];
}

/**
 * Judge every script's placement.
 *
 * A mounted instance's manifest is not POLICED here (its repository keeps
 * it, bean `nn8e`), but whether it can be READ is: the script table takes a
 * mounted `package.json` only when the mount lock vouches for its bytes
 * (owner, 2026-10-07, "Option A, by reference"; `schemas/script-table.ts`).
 * One that cannot be vouched for is could-not-determine (exit 2), never
 * skipped as if it held nothing, because its scripts are in no table at all.
 */
export function placementVerdict(repo: string): PlacementVerdict {
  const layers = layersOf(repo);
  const foreign = new Set([...layers.keys()].filter((l) => mountScopeFor(join(repo, l)) !== undefined));
  let read: ReturnType<typeof readScriptTable>;
  try {
    read = readScriptTable(repo);
  } catch (e) {
    return { exit: 1, lines: [`✗ ${(e as Error).message}`] };
  }
  const { table, unresolved } = read;
  const wrong: string[] = [];
  for (const e of table.values()) {
    if (e.name === "cat" && e.manifest === "package.json") continue; // the runner itself
    // A mounted instance's manifest is its own repository's to keep (bean `nn8e`):
    // its scripts sit where that repository put them, and this checkout cannot move them.
    if (e.manifest !== "package.json" && mountScopeFor(dirname(join(repo, e.manifest))) !== undefined) continue;
    const want = ownerOf(e.command, layers, foreign);
    if (want !== e.manifest) wrong.push(`  ${e.name}: in ${e.manifest}, belongs in ${want}\n      ${e.command}`);
  }
  const lines: string[] = [];
  if (wrong.length > 0) {
    lines.push(`✗ ${wrong.length} script(s) in the wrong manifest:\n${wrong.join("\n")}`);
    lines.push("  A layer's scripts go in its package.json under `checkoutScripts`; the root keeps only what runs no single layer.");
  }
  if (unresolved.length > 0) {
    lines.push(`❔ could not determine: ${unresolved.length} remote-mounted manifest(s) no mount lock vouches for; their scripts are in no table:`);
    for (const u of unresolved) lines.push(`  ${u.manifest}${u.instance ? ` (mounted \`${u.instance}\`)` : ""}: ${u.why}`);
    lines.push("  Re-mount so the lock vouches for the manifest (`bun run cat mount:remote`), or move the edits upstream.");
    return { exit: 2, lines };
  }
  if (wrong.length > 0) return { exit: 1, lines };
  return { exit: 0, lines: [`✓ ${table.size} script(s), each in the manifest of the layer it runs`] };
}

if (import.meta.main) {
  const v = placementVerdict(REPO);
  for (const l of v.lines) (v.exit === 0 ? console.log : console.error)(l);
  process.exit(v.exit);
}
