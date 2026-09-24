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
 *   3a. every `materialization.localPath` names a file that is THERE. Bean
 *      `yl5w`: this was the one edge nothing verified, and all three
 *      `ORIGINAL` claims resolved to nothing while the run printed
 *      "every metadataRef, libraryId and parent path resolves" — a clean
 *      pass over exactly the state the three-state model exists to make
 *      impossible. `materialized` is supposed to mean the bytes are here;
 *      an unchecked `localPath` makes that adjective decorative;
 *   4. the census, printed rather than asserted, because the ratio of
 *      referenced to materialized is the whole point of a catalogue by
 *      reference and a number nobody looks at is a number nobody checks.
 *
 * @covers catalogue
 */
import { existsSync, readFileSync, readdirSync } from "fs";
import { join, relative, resolve } from "path";
import { CatalogueNodeSchema, CatalogueSchema, materializationCensus, type CatalogueNode } from "../../folio-assistant-core/schemas/catalogue.js";
import { DublinCoreRecordSchema } from "../../folio-assistant-core/schemas/dublin-core.js";
import { instanceDirectoryForGraph } from "../../cat-harness/schemas/cat-harness.js";
import { checkLocalPath } from "./lib/local-path.js";

const INSTANCE = resolve(import.meta.dir, "..");
const REPO = resolve(INSTANCE, "..");
/**
 * Where ingested content lives — READ from this instance's declaration.
 *
 * It was `join(REPO, "cat-harness", "library")`, with a comment promising the
 * move would be "a one-line change and a visible one". It was one line. But a
 * literal is only visible to whoever greps for it, and the point of
 * `harness.json` is that nobody has to: bean `frs5` moved the three entries
 * here and this is now read rather than written down.
 *
 * `instanceDirectoryForGraph`, not `directoryForGraph`: this script checks
 * THIS instance's catalogue against THIS instance's library, and a sibling
 * declaring one of its own is not an ambiguity to refuse over. Bean `a02m`.
 */
const LIBRARY =
  instanceDirectoryForGraph(INSTANCE, "library") ??
  // declared-path-literal: the convention fallback, at the call site so the
  // choice is visible. Absent means the declaration was lost, which the
  // libraryId check below then reports per node rather than crashing here.
  join(INSTANCE, "library");

const problems: string[] = [];
const cat = CatalogueSchema.parse(JSON.parse(readFileSync(join(INSTANCE, "catalogue", "catalogue.json"), "utf8")));
const dir = join(INSTANCE, "catalogue", cat.nodesDir);

const nodes: CatalogueNode[] = [];
// Ids of nodes that are PRESENT, including ones that failed to validate.
//
// `ids` was built from `nodes` alone, so a single malformed node dropped out
// of the set and every child of it then reported `parent ... is not a node in
// this catalogue` — a cascade of findings about nodes that are fine, pointing
// away from the one file that is not. One defect reading as N+1, with the real
// one buried among its own consequences.
//
// The id is read from the raw JSON because that is what a parent points AT; it
// does not require the node to be well-formed, and a node too broken to yield
// an id simply is not in the set, which is then true.
const present = new Set<string>();
for (const f of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(join(dir, f), "utf8"));
  } catch (e) {
    problems.push(`${f}: is not JSON — ${(e as Error).message.split("\n")[0]}`);
    continue;
  }
  const id = (raw as { id?: unknown })?.id;
  if (typeof id === "string" && id.length > 0) present.add(id);
  try {
    nodes.push(CatalogueNodeSchema.parse(raw));
  } catch (e) {
    problems.push(`${f}: does not validate — ${(e as Error).message.split("\n")[0]}`);
  }
}
const ids = present;

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
  for (const b of n.bitstreams ?? []) {
    const m = b.materialization;
    const lp = m?.localPath;
    if (m === undefined || lp === undefined) continue;
    // Three states, and the third is not an error: `lib/local-path.ts` carries
    // why unreadable and absent must not be reported the same way.
    const { state, detail: why } = checkLocalPath(INSTANCE, lp);
    if (state === "ok") continue;
    if (state === "unknown") {
      problems.push(
        `${n.id}: ${b.bundle} localPath "${lp}" COULD NOT BE CHECKED — ${why}. ` +
          `That is not a pass: unreadable and absent are different facts and this run can tell neither.`,
      );
      continue;
    }
    problems.push(
      `${n.id}: ${b.bundle} localPath "${lp}"${why ? ` ${why} and` : ""} does not exist — ` +
        `an edge to nothing, and this one claims state "${m.state}". ` +
        `\`materialized\` means the bytes are HERE; localPath is instance-relative, so it resolves under ` +
        `${relative(REPO, INSTANCE) || "."}/ and nowhere else.`,
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
// ITEMS and FILES, separately -- they were one number until 2026-09-20, when
// the home page turned out to publish the item count the statistics page does
// not. 273,559 items across 1,057,223 files is 3.86 files per item, so a
// completeness fraction built from the wrong one is wrong by that factor, and
// this line printed the file count under the word "files" while the field it
// read was named for items.
console.log(
  `\n  Upstream: ${cat.totalItemsUpstream?.toLocaleString() ?? "unknown"} items across ` +
    `${cat.totalFilesUpstream?.toLocaleString() ?? "unknown"} files, ` +
    `${cat.totalBytesUpstream ? (cat.totalBytesUpstream / 1024 ** 3).toFixed(2) + " GiB" : "unknown"}.`,
);
console.log(`  The gap between ${census.materialized} and that is the point of a catalogue by reference.\n`);

if (problems.length) {
  console.error(`✗ ${problems.length} problem(s):`);
  for (const p of problems) console.error(`    ${p}`);
  process.exit(1);
}
console.log("✓ every node validates; every metadataRef, libraryId, localPath and parent path resolves\n");
