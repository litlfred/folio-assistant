#!/usr/bin/env bun
/**
 * The workflow page's process table covers every declared BPMN — no row
 * missing, no row for a diagram nobody declares.
 *
 * The "Every workflow in the repo" table was hand-written until bean `ax6r`
 * and drifted: it named a bootstrap directory that does not exist, a file that
 * does not exist, and left two bootstrap diagrams out. It is now drawn at
 * runtime from `assets/processes/index.json`, which `docs:auto` writes. That
 * moves the question from "did somebody add a row" to "does the published
 * data cover the declarations", and this answers it:
 *
 *   1. the projection exists and validates against its `$schema` family;
 *   2. every `.bpmn` any instance declares is a row — recomputed from the
 *      declarations, so the projection cannot vouch for itself;
 *   3. no row names a file that is not declared (or not there);
 *   4. the page still carries the container the view mounts on, with a
 *      `<noscript>` fallback — a projection nobody draws covers nothing.
 *
 * Staleness (the projection differs from what `docs:auto` would write now) is
 * `docs:auto:check`'s, not this gate's.
 *
 * Usage:  bun run check:process-index
 * Exit:   0 covered · 1 a declared diagram is missing, a row is stale, or the page lost its mount
 *
 * @covers processes, docs
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { declaredDiagrams, missingFromIndex, type ProcessIndex } from "./lib/process-index.ts";
import { ProcessIndexSchema } from "../schemas/site-indexes.ts";
import { repoRootFor, siteDirFor } from "../schemas/cat-harness.ts";

const ROOT = resolve(import.meta.dir, "..");
const REPO = repoRootFor(ROOT);
const DATA = join(ROOT, siteDirFor(ROOT), "assets", "processes", "index.json");
const PAGE = join(ROOT, "content", "docs", "publication-workflow", "every-workflow-in-the-repo.md");

const problems: string[] = [];

let index: ProcessIndex | undefined;
if (!existsSync(DATA)) {
  problems.push(`${DATA} is missing — run \`bun run docs:auto\``);
} else {
  const parsed = ProcessIndexSchema.safeParse(JSON.parse(readFileSync(DATA, "utf-8")));
  if (!parsed.success) problems.push(`${DATA} does not validate: ${parsed.error.issues[0]?.message ?? "unknown"}`);
  else index = parsed.data as ProcessIndex;
}

if (index) {
  for (const path of missingFromIndex(index, REPO)) problems.push(`declared but not a row: ${path}`);
  // The other direction: a row whose file is gone, or no longer declared.
  const declared = new Set(declaredDiagrams(REPO));
  for (const row of index.processes) {
    if (!declared.has(row.path)) problems.push(`a row for an undeclared diagram: ${row.path}`);
    if (row.svg && !existsSync(join(ROOT, siteDirFor(ROOT), row.svg.slice(1)))) {
      problems.push(`a row links an SVG that is not there: ${row.svg}`);
    }
  }
  if (index.processes.length === 0) problems.push("the projection holds no process — a sweep over nothing has cleared nothing");
}

const page = existsSync(PAGE) ? readFileSync(PAGE, "utf-8") : "";
if (!/data-fa-process-index\b/.test(page)) problems.push(`${PAGE} no longer carries the [data-fa-process-index] container`);
if (!/<noscript>/.test(page)) problems.push(`${PAGE} has no <noscript> fallback for the process table`);

if (problems.length) {
  console.error("Process index — the workflow page's table does not cover the declarations:");
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`Process index: ${index!.processes.length} declared diagram(s), every one a row; page mount present.`);
