#!/usr/bin/env bun
/**
 * Build the prefix-sharded identifier lookup over a catalogue's REFERENCED
 * nodes, or check that the committed one is current.
 *
 * @module large-datasets/scripts/gen-id-lookup
 *
 * Bean `folio-assistant-4pm8`. The shape and the budget are in
 * `../schemas/id-lookup.ts`; this file only selects the nodes and writes
 * the files.
 *
 * ## What is indexed
 *
 * Every catalogue node whose OWN `materialization.state` is `referenced`. A
 * materialised node is not here: it is held, so the site's ordinary search
 * finds it, and indexing it twice would give one node two answers. A node
 * with no upstream URL is refused rather than indexed with an empty link,
 * because a lookup that finds a node and cannot say where it is held has
 * found nothing a reader can use.
 *
 * The catalogue directory is found through `who-iris.json`'s declaration,
 * never a literal path, so a move cannot turn this into a build over nothing.
 * An empty selection is refused for the same reason.
 *
 * ## `--check`
 *
 * Rebuilds in memory and compares with the committed directory byte for
 * byte, in both directions: a file that differs, a file missing, and a file
 * the build would no longer write (a stale shard) all fail. A stale shard is
 * the one that matters most, because it still answers lookups for a node the
 * catalogue no longer references.
 *
 * Usage:
 *   bun run id-lookup           # write large-datasets/id-lookup/who-iris/
 *   bun run id-lookup:check     # fail if it is stale
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { CatalogueNodeSchema } from "../../folio-assistant-core/schemas/catalogue.js";
import { buildIdLookup, type IdEntry } from "../schemas/id-lookup.js";

const INSTANCE = resolve(import.meta.dir, "..");
const REPO = resolve(INSTANCE, "..");

/** The one corpus indexed today, by instance name. */
export const SOURCE = "who-iris";

/** Where the index for `source` is written. */
export function outDirFor(source: string): string {
  return join(INSTANCE, "id-lookup", source);
}

/** The catalogue nodes directory, through the source instance's declaration. */
export function catalogueNodesDir(source: string): string {
  const inst = join(REPO, source);
  const decl = JSON.parse(readFileSync(join(inst, `${source}.json`), "utf8")) as {
    directories?: Array<{ path: string; graphKinds?: string[] }>;
  };
  const d = decl.directories?.find((x) => x.graphKinds?.includes("catalogue"));
  if (!d) throw new Error(`${source}.json declares no directory of graph kind "catalogue"`);
  const cat = JSON.parse(readFileSync(join(inst, d.path, "catalogue.json"), "utf8")) as { nodesDir: string };
  return join(inst, d.path, cat.nodesDir);
}

/** The referenced nodes of a catalogue, as lookup entries. */
export function referencedEntries(nodesDir: string): IdEntry[] {
  const out: IdEntry[] = [];
  for (const f of readdirSync(nodesDir).filter((x) => x.endsWith(".json")).sort()) {
    const n = CatalogueNodeSchema.parse(JSON.parse(readFileSync(join(nodesDir, f), "utf8")));
    if (n.materialization.state !== "referenced") continue;
    const url = n.materialization.provenance?.upstream;
    if (!url) throw new Error(`${f}: referenced node ${n.id} has no provenance.upstream; a lookup could not say where it is held`);
    out.push({ id: n.id, title: n.title, url });
  }
  return out;
}

/** Every file currently under `dir`, relative to it. */
function listFiles(dir: string, base = dir): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p, base));
    else out.push(relative(base, p));
  }
  return out.sort();
}

/** Compare a built index with a directory. Empty means current. */
export function staleness(files: Map<string, string>, dir: string): string[] {
  const problems: string[] = [];
  const present = new Set(listFiles(dir));
  for (const [f, body] of files) {
    if (!present.has(f)) problems.push(`${f}: missing`);
    else if (readFileSync(join(dir, f), "utf8") !== body) problems.push(`${f}: differs`);
  }
  for (const f of present) if (!files.has(f)) problems.push(`${f}: stale — the build no longer writes it`);
  return problems;
}

export function build(source = SOURCE): Map<string, string> {
  const nodesDir = catalogueNodesDir(source);
  const entries = referencedEntries(nodesDir);
  return buildIdLookup(entries, {
    source,
    selection: `every node under ${relative(REPO, nodesDir)}/ whose materialization.state is "referenced"`,
  }).files;
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const t0 = performance.now();
  const files = build();
  const dir = outDirFor(SOURCE);
  const rel = relative(REPO, dir);
  if (check) {
    const problems = staleness(files, dir);
    if (problems.length) {
      console.error(`id-lookup: ${rel} is stale (${problems.length}):\n  ${problems.join("\n  ")}\nRun \`bun run id-lookup\`.`);
      process.exit(1);
    }
    console.log(`id-lookup: ${rel} is current (${files.size} files).`);
  } else {
    rmSync(dir, { recursive: true, force: true });
    for (const [f, body] of files) {
      mkdirSync(dirname(join(dir, f)), { recursive: true });
      writeFileSync(join(dir, f), body);
    }
    console.log(`id-lookup: wrote ${files.size} files to ${rel} in ${(performance.now() - t0).toFixed(0)} ms.`);
  }
}
