/**
 * Formal-edge extractor — elaborated `lean.ref` → `lean.ref` dependencies for
 * the content graph, with no LeanArchitect and no attribute in the folio's Lean.
 *
 * ## What it does
 *
 * 1. Collects the TAGGED set: every block's `lean.ref` declaration.
 * 2. Lists the folio's BUILT modules (`.olean` under `.lake/build/lib/lean`).
 *    A tagged declaration in an unbuilt module is reported missing, never
 *    silently given no dependencies.
 * 3. Fills `../../lean/formal-edges.template.lean` with an `import` per built
 *    module and runs it with `lake env lean` inside the folio's Lake project.
 *    It applies LeanArchitect's dependency rule with the tagged set in place of
 *    `@[blueprint]`: recurse THROUGH untagged constants, stop AT tagged ones;
 *    statement deps from the type, proof deps from the value.
 * 4. Writes the `--ingest` JSONL and, with `--ingest`, records it in the formal
 *    cache as `source: "elaborated"` via core's `lean-atlas-ingest.ts`.
 *
 * ## Why here and not in core
 *
 * Owner, 2026-09-29: the extractor is tools and skills in folio-assistant-sci.
 * Core keeps only the content model — the `elaborated` label and the cache it
 * reads — per "f-a-core has high level processes only, no tooling".
 *
 * ## Evidence
 *
 * folio-assistant#1492, small-cluster measurement: on 691 qou declarations the
 * template reproduces LeanArchitect v4.25.0 on 172/172 edges with 30 % tagged,
 * plus 2 `structure`-field edges LeanArchitect omits. The lexical `--scan`
 * fallback it replaces had recall 0.63 against the same ground truth.
 *
 * ## Usage
 *
 *   bun run folio-assistant-sci/content/pipeline/formal-edges.ts \
 *     --lake-dir <folio Lake project> [--root <content root>] [--out <jsonl>] [--ingest]
 *
 * @module folio-assistant-sci/content/pipeline/formal-edges
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { dirname, join, relative, resolve } from "path";
import { spawnSync } from "child_process";
import { parseLeanRef, refToDecl } from "../../../cat-harness/content/pipeline/content-graph";
import { walkBlocks } from "../../../cat-harness/content/pipeline/qa-utils";
import { ingestMode } from "../../../cat-harness/content/pipeline/lean-atlas-ingest";
import { findContentRepoRoot } from "../../../cat-harness/content/pipeline/repo-root";
import { folioDir } from "../../../cat-harness/schemas/cat-harness.js";

/** The placeholder line in the template that the module imports replace. */
export const IMPORTS_MARKER = "-- FORMAL_EDGES_IMPORTS";

export const TEMPLATE_PATH = resolve(import.meta.dir, "../../lean/formal-edges.template.lean");

/** A tagged declaration and the `.lean` a block ties it to, if any. */
export interface Tagged {
  decl: string;
  leanPath?: string;
}

/** One line the Lean side writes. */
export interface ExtractedRow {
  decl: string;
  kind?: string;
  type_deps?: string[];
  value_deps?: string[];
  missing?: boolean;
}

/** Every block's `lean.ref` declaration, deduplicated, first block wins. */
export function collectTagged(contentRoot: string, repoRoot: string): Tagged[] {
  const seen = new Map<string, Tagged>();
  for (const b of walkBlocks(contentRoot)) {
    const decl = refToDecl(parseLeanRef(readFileSync(b.ts, "utf-8")));
    if (!decl || seen.has(decl)) continue;
    seen.set(decl, { decl, leanPath: b.lean ? relative(repoRoot, b.lean) : undefined });
  }
  return [...seen.values()].sort((a, b) => a.decl.localeCompare(b.decl));
}

/** Module names of every `.olean` the folio's own Lake build produced. */
export function builtModules(lakeDir: string): string[] {
  const lib = join(lakeDir, ".lake", "build", "lib", "lean");
  if (!existsSync(lib)) return [];
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".olean")) out.push(relative(lib, p).slice(0, -".olean".length).split(/[\\/]/).join("."));
    }
  };
  walk(lib);
  return out.sort();
}

/** The template with one `import` per module in place of the marker. */
export function fillTemplate(template: string, modules: string[]): string {
  if (!template.includes(IMPORTS_MARKER)) throw new Error(`template has no ${IMPORTS_MARKER} line`);
  return template.replace(IMPORTS_MARKER, modules.map((m) => `import ${m}`).join("\n"));
}

/**
 * Rows the Lean side wrote → `--ingest` records. Missing declarations are
 * returned separately and NEVER become records: an empty dependency list
 * would read as "depends on nothing" rather than "was not checked".
 */
export function toIngestRecords(
  rows: ExtractedRow[],
  tagged: Tagged[],
): { records: Array<{ decl: string; type_deps: string[]; value_deps: string[]; lean_path?: string }>; missing: string[] } {
  const paths = new Map(tagged.map((t) => [t.decl, t.leanPath]));
  const records = [];
  const missing: string[] = [];
  for (const r of rows) {
    if (r.missing) { missing.push(r.decl); continue; }
    records.push({
      decl: r.decl,
      type_deps: [...(r.type_deps ?? [])].sort(),
      value_deps: [...(r.value_deps ?? [])].sort(),
      ...(paths.get(r.decl) ? { lean_path: paths.get(r.decl) } : {}),
    });
  }
  return { records, missing: missing.sort() };
}

export function parseRows(jsonl: string): ExtractedRow[] {
  return jsonl.split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l) as ExtractedRow);
}

// ── CLI ─────────────────────────────────────────────────────────

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const lakeDir = opt("--lake-dir");
  if (!lakeDir) {
    console.error("usage: formal-edges.ts --lake-dir <folio Lake project> [--root <content root>] [--out <jsonl>] [--ingest]");
    process.exit(2);
  }
  const repoRoot = findContentRepoRoot();
  const contentRoot = opt("--root") ? resolve(opt("--root")!) : folioDir(repoRoot);
  const work = join(resolve(lakeDir), ".lake", "formal-edges");
  mkdirSync(work, { recursive: true });

  const tagged = collectTagged(contentRoot, repoRoot);
  const modules = builtModules(resolve(lakeDir));
  if (!modules.length) {
    // Could-not-determine is not clean: say so and exit non-zero.
    console.error(`no built modules under ${lakeDir}/.lake/build/lib/lean — run \`lake build\` first`);
    process.exit(2);
  }
  const driver = join(work, "Driver.lean");
  writeFileSync(driver, fillTemplate(readFileSync(TEMPLATE_PATH, "utf-8"), modules));
  writeFileSync(join(work, "tagged.txt"), tagged.map((t) => t.decl).join("\n") + "\n");
  const rawOut = join(work, "edges.raw.jsonl");

  const r = spawnSync("lake", ["env", "lean", driver], {
    cwd: resolve(lakeDir),
    env: { ...process.env, FORMAL_EDGES_TAGGED: join(work, "tagged.txt"), FORMAL_EDGES_OUT: rawOut },
    stdio: "inherit",
  });
  if (r.status !== 0 || !existsSync(rawOut)) {
    console.error(`lake env lean exited ${r.status ?? "on a signal"}; no edges written`);
    process.exit(1);
  }

  const { records, missing } = toIngestRecords(parseRows(readFileSync(rawOut, "utf-8")), tagged);
  const out = resolve(opt("--out") ?? join(work, "edges.jsonl"));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, records.map((x) => JSON.stringify(x)).join("\n") + "\n");
  console.log(`${tagged.length} lean.ref targets; ${records.length} extracted; ${missing.length} not found in the built environment`);
  if (missing.length) console.log(`  missing (first 10): ${missing.slice(0, 10).join(", ")}`);
  console.log(`wrote ${out}`);
  if (args.includes("--ingest")) ingestMode(repoRoot, out, "elaborated");
}
