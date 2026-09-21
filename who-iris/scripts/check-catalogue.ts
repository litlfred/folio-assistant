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
 *   4. every `materialization.localPath` on a `materialized` node or bitstream
 *      names something that is THERE — see below;
 *   5. the census, printed rather than asserted, because the ratio of
 *      referenced to materialized is the whole point of a catalogue by
 *      reference and a number nobody looks at is a number nobody checks.
 *
 * ## `localPath` was the unchecked edge, and the pass sentence hid it
 *
 * Bean `yl5w`. Until 2026-09-21 this script ended with
 *
 * > ✓ every node validates; every metadataRef, libraryId and parent path resolves
 *
 * which is true, exhaustive-sounding, and silent about the one field that says
 * **where the bytes are**. `MaterializationSchema` requires `localPath` when
 * `state` is `materialized` — *"bytes that are here are somewhere"* — and a
 * non-empty string is all a schema can require. Three of nine `localPath`
 * values named nothing while their nodes claimed `materialized`, and the check
 * reported a clean run over them. A library viewer resolving those renders
 * three broken links and no error. The `dh4f` shape, in the check written to
 * stop exactly this class one field over.
 *
 * **Instance-relative, by declaration rather than by choice.**
 * `MaterializationSchema.localPath` says *"Where the bytes landed,
 * instance-relative"*, and `metadataRef` above is already resolved against
 * `INSTANCE` the same way. So this settles nothing that `yt7j` is holding
 * open: that bean is about `coverage.*` being repo-root relative while a
 * directory's path is instance-relative, and it warns against changing
 * resolution behaviour without the owner. Nothing here changes; this field
 * already had an answer and nobody was reading it.
 */
import { existsSync, readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { CatalogueNodeSchema, CatalogueSchema, materializationCensus, type CatalogueNode } from "../../folio-assistant-core/schemas/catalogue.js";
import { DublinCoreRecordSchema } from "../../folio-assistant-core/schemas/dublin-core.js";
import { instanceDirectoryForGraph } from "../../cat-harness/schemas/cat-harness.js";
import { BASELINE_FILE, readBaseline } from "./catalogue-baseline.js";

const INSTANCE = resolve(import.meta.dir, "..");
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

/**
 * Dead `localPath`s already known, repaired BY THEIR OWNER.
 *
 * The same shape as `bean-bodies-baseline.json` and for the same reason: the
 * three this check found on the day it was written are a CONTENT correction,
 * not a path typo. Each carries a `fixity.sha256` and a gate reading
 * `sourceLoss: permitted` on the basis that the bytes are held locally -- a
 * gate permitted on a false basis. Rewriting another instance's gate verdicts
 * is not a checker's to do on its own initiative, so a NEW dead path fails
 * while the backlog is listed, and an entry that stops matching is reported as
 * stale so the file shrinks.
 *
 * Missing or unparseable is an EMPTY baseline, never a pass: the effect is
 * that every finding fails, which is the safe direction.
 */
const baseline = readBaseline(() => readFileSync(join(INSTANCE, BASELINE_FILE), "utf8"));

const matchedBaseline = new Set<string>();
const outstanding: string[] = [];

/**
 * Every materialisation a node carries, node-level and per bitstream, each
 * with where it was found.
 *
 * A generic walk for `localPath` was the alternative and is worse: it would
 * also find the field on anything the schema later gains, reporting positions
 * that mean nothing to a reader and resolving paths whose base may not be the
 * instance. Enumerating the two places the schema actually defines keeps the
 * check honest about its own scope -- if a third appears, this goes red on a
 * type error rather than silently skipping it.
 */
function materializations(n: CatalogueNode): { mat: CatalogueNode["materialization"]; where: string }[] {
  return [
    { mat: n.materialization, where: "" },
    ...n.bitstreams.map((b, i) => ({ mat: b.materialization, where: ` bitstreams[${i}]` })),
  ];
}

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

  // A node carries ONE materialisation and each bitstream carries its own --
  // `BitstreamSchema` says so: "An item may be referenced while one of its
  // bitstreams is materialised". So both are checked, and the bitstream is
  // named by index, because three nodes' worth of "localPath does not exist"
  // with no position is a finding nobody can act on.
  for (const m of materializations(n)) {
    if (m.mat.state !== "materialized" || !m.mat.localPath) continue;
    if (existsSync(join(INSTANCE, m.mat.localPath))) continue;
    const key = `${n.id}${m.where}`;
    const line =
      `${key}: localPath "${m.mat.localPath}" does not exist, while state is "materialized". ` +
      `Either the bytes are not here -- in which case the state is wrong -- or they moved and this did not. ` +
      `A viewer resolving this renders a broken link and no error.`;
    if (baseline.has(key)) {
      matchedBaseline.add(key);
      outstanding.push(line);
    } else {
      problems.push(line);
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

for (const line of outstanding) console.error(`  \u00b7 outstanding ${line}`);
const staleBaseline = [...baseline].filter((k) => !matchedBaseline.has(k)).sort();
for (const k of staleBaseline) {
  console.error(`  \u00b7 baseline entry "${k}" no longer matches -- repaired; remove it from ${BASELINE_FILE}`);
}
if (outstanding.length) {
  console.error(
    `\n  ${outstanding.length} outstanding localPath defect(s), listed not failed. Repaired by the catalogue's\n` +
      `  owner: the bytes are not here, so the STATE is what is wrong -- and each also carries a\n` +
      `  \`sourceLoss: permitted\` gate whose basis is that the bytes are held locally. See ${BASELINE_FILE}.`,
  );
}

if (problems.length) {
  console.error(`✗ ${problems.length} problem(s):`);
  for (const p of problems) console.error(`    ${p}`);
  process.exit(1);
}
console.log(
  `\u2713 every node validates; every metadataRef, libraryId, parent path and materialized localPath resolves` +
    `${outstanding.length ? ` (${outstanding.length} baselined)` : ""}\n`,
);
