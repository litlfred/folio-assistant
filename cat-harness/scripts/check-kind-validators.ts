#!/usr/bin/env bun
/**
 * Every graph kind that declares a validator — does it actually load?
 *
 * Bean `folio-assistant-i31r`. Two failure modes, and only one of them fails
 * the build:
 *
 * 1. **A declared validator that does not resolve** — a wrong path, a missing
 *    export, or a module that exports an interface rather than a Zod schema.
 *    That is a defect and it fails. It is also not hypothetical: the three
 *    `schema` paths on these kinds silently became instance-relative when
 *    `#437` moved the instance under `cat-harness/`, and nothing noticed,
 *    because nothing read them.
 * 2. **A kind with no validator at all** — reported, never failed. 13 of 16
 *    base kinds are in that state today and one is `qa`, the largest
 *    generated graph here. Failing on it would make the check unrunnable;
 *    hiding it would report a clean sweep over most of the corpus.
 *
 * `--require-all` turns state 2 into a failure, for the day the gap is meant
 * to be closed.
 *
 * @module folio-assistant/scripts/check-kind-validators
 */

import { BASE_GRAPH_KINDS } from "../schemas/cat-harness.js";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { directoriesForGraph } from "../schemas/cat-harness.js";
import { resolveKindValidator, resolveNodeSchemas } from "../schemas/kind-validator.js";

/** The INSTANCE root — this file lives at `<instance>/scripts/`. */
const instanceRoot = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

export interface ValidatorSweep {
  resolved: string[];
  undeclared: string[];
  unresolvable: { kind: string; reason: string }[];
}

export async function sweep(root: string): Promise<ValidatorSweep> {
  const out: ValidatorSweep = { resolved: [], undeclared: [], unresolvable: [] };
  for (const kind of Object.keys(BASE_GRAPH_KINDS)) {
    const r = await resolveKindValidator(kind, root);
    if (r.state === "resolved") out.resolved.push(kind);
    else if (r.state === "undeclared") out.undeclared.push(kind);
    else out.unresolvable.push({ kind: r.kind, reason: r.reason });
  }
  return out;
}

/** What a per-family sweep found for one kind that declares `nodeSchemas`. */
export interface FamilySweep {
  kind: string;
  /** Tag → [nodes, nodes that parsed] — parsed only for Zod families. */
  counts: Record<string, { nodes: number; checked: number; parsed: number; state: string }>;
  /** A tag on disk the map does not name — the map claimed completeness. */
  unmapped: { tag: string; example: string }[];
  /** A family whose reference does not resolve. */
  unresolvable: { tag: string; reason: string }[];
  /** A node that fails its family's Zod schema. */
  invalid: { file: string; issue: string }[];
}

function jsonFiles(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? jsonFiles(p) : p.endsWith(".json") ? [p] : [];
  });
}

/**
 * Bean `rdkm`: for every kind that declares `nodeSchemas`, read each JSON
 * node in its declared directories, route it by its `$schema` tag, and
 * validate it where the family has a Zod schema. A tag the map does not name
 * fails — declaring the map is the claim that it is complete.
 */
export async function sweepFamilies(root: string): Promise<FamilySweep[]> {
  const out: FamilySweep[] = [];
  for (const [kind, def] of Object.entries(BASE_GRAPH_KINDS)) {
    if (!def.nodeSchemas) continue;
    const fams = await resolveNodeSchemas(kind, root);
    const byTag = new Map(fams.map((f) => [f.tag, f]));
    const s: FamilySweep = { kind, counts: {}, unmapped: [], unresolvable: [], invalid: [] };
    for (const f of fams) if (f.state === "unresolvable") s.unresolvable.push({ tag: f.tag, reason: f.reason });
    for (const dir of directoriesForGraph(root, kind)) {
      for (const file of jsonFiles(dir)) {
        let node: unknown;
        try {
          node = JSON.parse(readFileSync(file, "utf8"));
        } catch {
          continue; // not a node; a malformed file is another check's finding
        }
        const tag = (node as { $schema?: unknown } | null)?.$schema;
        if (typeof tag !== "string") continue;
        const fam = byTag.get(tag);
        const rel = relative(root, file);
        if (!fam) {
          if (!s.unmapped.some((u) => u.tag === tag)) s.unmapped.push({ tag, example: rel });
          continue;
        }
        const c = (s.counts[tag] ??= { nodes: 0, checked: 0, parsed: 0, state: fam.state });
        c.nodes++;
        if (fam.state !== "resolved") continue;
        c.checked++;
        const r = fam.schema.safeParse(node);
        if (r.success) c.parsed++;
        else s.invalid.push({ file: rel, issue: `${r.error.issues[0]?.path.join(".")}: ${r.error.issues[0]?.message}` });
      }
    }
    out.push(s);
  }
  return out;
}

async function main(): Promise<number> {
  const requireAll = process.argv.includes("--require-all");
  const families = await sweepFamilies(instanceRoot);
  let familyFail = false;
  for (const f of families) {
    const nodes = Object.values(f.counts).reduce((a, c) => a + c.nodes, 0);
    console.log(`${f.kind}: ${Object.keys(f.counts).length} $schema famil(ies) over ${nodes} node(s)`);
    for (const [tag, c] of Object.entries(f.counts)) {
      console.log(
        c.checked
          ? `  ✓ ${tag}: ${c.parsed}/${c.checked} parse`
          : c.state === "untyped"
            ? `  · ${tag}: ${c.nodes} node(s), NO declared type — could not determine`
            : `  · ${tag}: ${c.nodes} node(s), a TypeScript shape, not runnable — could not determine`,
      );
    }
    if (nodes === 0) {
      console.log(`  ✗ EXAMINED NOTHING — ${f.kind} declares nodeSchemas and no node was found`);
      familyFail = true;
    }
    for (const u of f.unmapped) console.log(`  ✗ unmapped family ${u.tag} (e.g. ${u.example})`);
    for (const u of f.unresolvable) console.log(`  ✗ ${u.tag}: ${u.reason}`);
    if (f.unmapped.length || f.unresolvable.length) familyFail = true;
    for (const i of f.invalid.slice(0, 10)) console.log(`  ✗ ${i.file} — ${i.issue}`);
    if (f.invalid.length) familyFail = true;
  }
  if (families.length) console.log("");
  const r = await sweep(instanceRoot);
  const total = r.resolved.length + r.undeclared.length + r.unresolvable.length;

  if (total === 0) {
    // A sweep over no kinds has not passed. This repository has paid three
    // times for a check that ticked over an empty set.
    console.log("⚠ EXAMINED NOTHING — no graph kinds are registered");
    return 1;
  }

  console.log(`${total} graph kind(s): ${r.resolved.length} with a validator that loads`);
  for (const k of r.resolved) console.log(`  ✓ ${k}`);

  if (r.unresolvable.length > 0) {
    console.log(`\n✗ ${r.unresolvable.length} declare a validator that does not resolve:`);
    for (const u of r.unresolvable) console.log(`  ✗ ${u.kind}: ${u.reason}`);
    return 1;
  }

  const msg =
    `${r.undeclared.length} kind(s) declare no validator — a node of those kinds ` +
    `cannot be checked, and must be reported as "could not determine" rather than ` +
    `as valid: ${r.undeclared.join(", ")}`;
  if (r.undeclared.length > 0) {
    if (requireAll) {
      console.log(`\n✗ ${msg}`);
      return 1;
    }
    console.log(`\n⚠ ${msg}`);
  }
  if (familyFail) {
    console.log(`\n✗ a declared $schema family is unmapped, unresolvable, or has a node that fails it`);
    return 1;
  }
  console.log(`\n✓ every declared validator resolves to a runnable Zod schema`);
  return 0;
}

if (import.meta.main) process.exit(await main());
