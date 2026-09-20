#!/usr/bin/env bun
/**
 * Every catalogue node validates, and every reference it makes resolves.
 *
 * Usage: `bun run who-iris/scripts/check-catalogue.ts`
 *
 * ## Why a script and not only a Zod schema
 *
 * `CatalogueNodeSchema` can require `metadataRef` to be a non-empty string. It
 * cannot check that the file is THERE — and that is exactly the defect this
 * script was written after: the first cut of the catalogue set
 * `metadataRef: "catalogue/records/wpr-rdo-2020-003-eng.dc.json"` on a node
 * while `catalogue/records/` did not exist at all. Every node validated. The
 * same class as a dangling `satisfies` in `check-tools.ts`: an edge to nothing,
 * which reads as a relationship.
 *
 * It checks four things a schema structurally cannot:
 *
 *   1. every `metadataRef` resolves, and the file it names parses as a
 *      `folio-dublin-core/v1` record;
 *   2. every `libraryId` names a directory that is actually ingested — the
 *      catalogue and `library/` agreeing about what exists;
 *   3. every `parents` path names nodes that are in the catalogue;
 *   4. the census, printed rather than asserted, because the ratio of
 *      referenced to materialized is the whole point of a catalogue by
 *      reference and a number nobody looks at is a number nobody checks.
 */
import { existsSync, readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { CatalogueNodeSchema, CatalogueSchema, materializationCensus, type CatalogueNode } from "../../folio-assistant-core/schemas/catalogue.js";
import { DublinCoreRecordSchema } from "../../folio-assistant-core/schemas/dublin-core.js";

const INSTANCE = resolve(import.meta.dir, "..");
const REPO = resolve(INSTANCE, "..");
/**
 * Where ingested content lives TODAY — still `cat-harness/library/`, because
 * the three WHO entries have not moved yet (bean `frs5`). Named here rather
 * than assumed so the move is a one-line change and a visible one.
 */
const LIBRARY = join(REPO, "cat-harness", "library");

const problems: string[] = [];
const cat = CatalogueSchema.parse(JSON.parse(readFileSync(join(INSTANCE, "catalogue", "catalogue.json"), "utf8")));
const dir = join(INSTANCE, "catalogue", cat.nodesDir);

const nodes: CatalogueNode[] = [];
for (const f of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  try {
    nodes.push(CatalogueNodeSchema.parse(JSON.parse(readFileSync(join(dir, f), "utf8"))));
  } catch (e) {
    problems.push(`${f}: does not validate — ${(e as Error).message.split("\n")[0]}`);
  }
}
const ids = new Set(nodes.map((n) => n.id));

for (const n of nodes) {
  if (n.metadataRef) {
    const p = join(INSTANCE, n.metadataRef);
    if (!existsSync(p)) {
      problems.push(`${n.id}: metadataRef ${n.metadataRef} does not exist — an edge to nothing, which reads as a relationship`);
    } else {
      try {
        const raw = JSON.parse(readFileSync(p, "utf8"));
        for (const k of Object.keys(raw)) if (k.startsWith("_")) delete raw[k];
        DublinCoreRecordSchema.parse(raw);
      } catch (e) {
        problems.push(`${n.id}: ${n.metadataRef} is not a valid folio-dublin-core/v1 record — ${(e as Error).message.split("\n")[0]}`);
      }
    }
  }
  if (n.libraryId && !existsSync(join(LIBRARY, n.libraryId, "structure.json"))) {
    problems.push(
      `${n.id}: libraryId "${n.libraryId}" is not ingested (no structure.json under ${LIBRARY}). ` +
        `The catalogue and library/ disagree about what exists.`,
    );
  }
  for (const path of n.parents) {
    for (const step of path) {
      if (!ids.has(step)) problems.push(`${n.id}: parent path names "${step}", which is not a node in this catalogue`);
    }
  }
}

const census = materializationCensus(nodes);
console.log(`\nwho-iris catalogue — ${nodes.length} node(s)\n`);
for (const [k, v] of Object.entries(census)) console.log(`  ${k.padEnd(14)} ${v}`);
console.log(
  `\n  Upstream: ${cat.totalItemsUpstream?.toLocaleString() ?? "unknown"} files, ` +
    `${cat.totalBytesUpstream ? (cat.totalBytesUpstream / 1024 ** 3).toFixed(2) + " GiB" : "unknown"}.`,
);
console.log(`  The gap between ${census.materialized} and that is the point of a catalogue by reference.\n`);

if (problems.length) {
  console.error(`✗ ${problems.length} problem(s):`);
  for (const p of problems) console.error(`    ${p}`);
  process.exit(1);
}
console.log("✓ every node validates; every metadataRef, libraryId and parent path resolves\n");
