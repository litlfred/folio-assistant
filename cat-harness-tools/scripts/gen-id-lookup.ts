#!/usr/bin/env bun
/**
 * Build the prefix-sharded identifier lookup over a catalogue's REFERENCED
 * nodes, or check that the committed one is current.
 *
 * @module cat-harness-tools/scripts/gen-id-lookup
 * @covers catalogue — every referenced node of the catalogue must resolve through the committed shards
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
 * Which corpora are indexed is read off the checkout: every instance that
 * declares a directory with id `id-lookup` hosts one, written THERE, and its
 * catalogue is found through the same instance's declaration — never a literal
 * path or a name, so a move cannot turn this into a build over nothing. An
 * empty selection is refused for the same reason.
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
 *   bun run id-lookup                    # write every hosted index (who-iris/id-lookup/ today)
 *   bun run id-lookup:check              # fail if any is stale
 *   bun run id-lookup -- --source <name> # one instance's only
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { checkoutDirectories } from "../../cat-harness/schemas/harness-config.ts";
import { buildIdLookup, CatalogueNodeReadSchema, type IdEntry } from "../../cat-harness/schemas/id-lookup.js";

const TOOLS = resolve(import.meta.dir, "..");
const REPO = resolve(TOOLS, "..");

/**
 * The declared id an instance gives the directory that HOSTS its generated
 * lookup (D3: an instance hosts its own generated outputs; bean `j7ql`).
 *
 * Found by id rather than by instance name, so this generator names no corpus:
 * it named `"who-iris"` as a constant until 2026-10-01, which was an upward
 * name from the layer below every catalogue. Overrides match on id, never on
 * path, so an id is the stable handle a relocation keeps.
 */
export const ID_LOOKUP_DIR_ID = "id-lookup";

/** One checkout directory, as the checkout overlay resolves it. */
function dirsOf(source: string): ReturnType<typeof checkoutDirectories> {
  return checkoutDirectories(REPO).filter((d) => d.declaredBy === source);
}

/** Every instance in the checkout that hosts an identifier lookup, sorted. */
export function indexedSources(): string[] {
  return [...new Set(checkoutDirectories(REPO).filter((d) => d.id === ID_LOOKUP_DIR_ID).map((d) => d.declaredBy))].sort();
}

/**
 * The one source when the checkout hosts exactly one lookup. Refuses when it
 * hosts none (a build over nothing reads as a clean run) or several (picking
 * "the first" is the `dh4f` shape); a caller with several names one.
 */
export function defaultSource(): string {
  const all = indexedSources();
  if (all.length !== 1) {
    throw new Error(
      `${all.length} instances in this checkout declare a \`${ID_LOOKUP_DIR_ID}\` directory` +
        (all.length ? ` (${all.join(", ")}); name one with --source` : "; there is nothing to index"),
    );
  }
  return all[0]!;
}

/** Where the index for `source` is written: that instance's declared `id-lookup` directory. */
export function outDirFor(source: string): string {
  const d = dirsOf(source).find((x) => x.id === ID_LOOKUP_DIR_ID);
  if (!d) throw new Error(`${source} declares no directory with id "${ID_LOOKUP_DIR_ID}"`);
  return d.absPath;
}

/** The catalogue nodes directory, through the source instance's declaration. */
export function catalogueNodesDir(source: string): string {
  const d = dirsOf(source).find((x) => x.graphKinds.includes("catalogue" as never));
  if (!d) throw new Error(`${source} declares no directory of graph kind "catalogue"`);
  const cat = JSON.parse(readFileSync(join(d.absPath, "catalogue.json"), "utf8")) as { nodesDir: string };
  return join(d.absPath, cat.nodesDir);
}

/** The library directory of `source`, through its declaration. */
export function libraryDirOfSource(source: string): string {
  const d = dirsOf(source).find((x) => x.graphKinds.includes("library" as never));
  if (!d) throw new Error(`${source} declares no library directory`);
  return d.absPath;
}

/** The referenced nodes of a catalogue, as lookup entries. */
export function referencedEntries(nodesDir: string): IdEntry[] {
  const out: IdEntry[] = [];
  for (const f of readdirSync(nodesDir).filter((x) => x.endsWith(".json")).sort()) {
    const n = CatalogueNodeReadSchema.parse(JSON.parse(readFileSync(join(nodesDir, f), "utf8")));
    if (n.materialization.state !== "referenced") continue;
    const url = n.materialization.provenance?.upstream;
    if (!url) throw new Error(`${f}: referenced node ${n.id} has no provenance.upstream; a lookup could not say where it is held`);
    out.push({ id: n.id, title: n.title, url });
  }
  return out;
}

/**
 * The file at the top of an index directory that is NOT the index's: the
 * declared directory's own subgraph README, written by `readme:subgraphs`
 * because the directory is a declared one in its host instance (bean `j7ql`).
 * This build neither writes nor removes it.
 */
const NOT_THE_INDEX = new Set(["README.md"]);

/** Every index file currently under `dir`, relative to it. */
function listFiles(dir: string, base = dir): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p, base));
    else if (!(dir === base && NOT_THE_INDEX.has(e.name))) out.push(relative(base, p));
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

export function build(source: string): Map<string, string> {
  const nodesDir = catalogueNodesDir(source);
  const entries = referencedEntries(nodesDir);
  return buildIdLookup(entries, {
    source,
    selection: `every node under ${relative(REPO, nodesDir)}/ whose materialization.state is "referenced"`,
  }).files;
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const at = process.argv.indexOf("--source");
  const sources = at >= 0 ? [process.argv[at + 1] ?? ""] : indexedSources();
  if (sources.length === 0 || sources.includes("")) {
    console.error(`id-lookup: no source — no instance in this checkout declares a \`${ID_LOOKUP_DIR_ID}\` directory, or --source has no value.`);
    process.exit(1);
  }
  let failed = false;
  for (const source of sources) {
    const t0 = performance.now();
    const files = build(source);
    const dir = outDirFor(source);
    const rel = relative(REPO, dir);
    if (check) {
      const problems = staleness(files, dir);
      if (problems.length) {
        console.error(`id-lookup: ${rel} is stale (${problems.length}):\n  ${problems.join("\n  ")}\nRun \`bun run id-lookup\`.`);
        failed = true;
        continue;
      }
      console.log(`id-lookup: ${rel} is current (${files.size} files).`);
    } else {
      // Remove what the build no longer writes, never the whole directory:
      // it is a declared directory of its host and carries that README.
      for (const f of listFiles(dir)) if (!files.has(f)) rmSync(join(dir, f), { force: true });
      for (const [f, body] of files) {
        mkdirSync(dirname(join(dir, f)), { recursive: true });
        writeFileSync(join(dir, f), body);
      }
      console.log(`id-lookup: wrote ${files.size} files to ${rel} in ${(performance.now() - t0).toFixed(0)} ms.`);
    }
  }
  if (failed) process.exit(1);
}
