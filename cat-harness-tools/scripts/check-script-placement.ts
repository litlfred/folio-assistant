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
import { basename, join, relative, resolve } from "node:path";

import { instanceRootsIn } from "../../cat-harness/schemas/instance-roots.ts";
import { scriptTable } from "../../cat-harness/schemas/script-table.ts";

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
export function ownerOf(command: string, layers: Map<string, string[]>): string {
  const closure = (l: string, seen = new Set<string>()): Set<string> => {
    for (const n of layers.get(l) ?? []) if (!seen.has(n)) { seen.add(n); closure(n, seen); }
    return seen;
  };
  const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const named = [...layers.keys()].filter((l) => new RegExp(`(^|[\\s"'=(/])${esc(l)}(/|$|[\\s"')])`).test(command));
  if (named.length === 0) return "package.json";
  const owners = named.filter((c) => named.every((o) => o === c || closure(c).has(o)));
  return owners.length === 1 ? `${owners[0]}/package.json` : "package.json";
}

if (import.meta.main) {
  const layers = layersOf(REPO);
  let table;
  try {
    table = scriptTable(REPO);
  } catch (e) {
    console.error(`✗ ${(e as Error).message}`);
    process.exit(1);
  }
  const wrong: string[] = [];
  for (const e of table.values()) {
    if (e.name === "cat" && e.manifest === "package.json") continue; // the runner itself
    const want = ownerOf(e.command, layers);
    if (want !== e.manifest) wrong.push(`  ${e.name}: in ${e.manifest}, belongs in ${want}\n      ${e.command}`);
  }
  if (wrong.length > 0) {
    console.error(`✗ ${wrong.length} script(s) in the wrong manifest:\n${wrong.join("\n")}`);
    console.error("  A layer's scripts go in its package.json under `checkoutScripts`; the root keeps only what runs no single layer.");
    process.exit(1);
  }
  console.log(`✓ ${table.size} script(s), each in the manifest of the layer it runs`);
}
