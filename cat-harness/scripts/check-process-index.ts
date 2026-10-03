#!/usr/bin/env bun
/**
 * The workflow page's process table covers every declared BPMN — read from the
 * published named-subgraph JSON-LD, the only store it has.
 *
 * The "Every workflow in the repo" table was hand-written until bean `ax6r`
 * and drifted. It was then drawn from a plain-JSON projection; the owner's
 * ruling of 2026-10-03 ("Move to JSON-LD") retired that second store, and the
 * page now walks `docs/subgraph/index.jsonld` down to every `processes`
 * subgraph's `index.hydrated.jsonld`. This gate asks the same questions of
 * the same files:
 *
 *   1. the repository index, every harness root and every `processes`
 *      subgraph it reaches exist and validate against `schemas/subgraph-manifest.ts`;
 *   2. every `.bpmn` an instance in this graph's corpus declares has a
 *      `Process` node there — recomputed from the declarations, so the
 *      published files cannot vouch for themselves;
 *   3. every such node carries its diagram's documentation (`summary`), and
 *      a `depiction` names an SVG that is there;
 *   4. no node names a diagram that is not declared;
 *   5. the page still carries the container the view mounts on, with a
 *      `<noscript>` fallback.
 *
 * ## What it does NOT cover, said rather than skipped
 *
 * A diagram declared by an instance OUTSIDE this graph's corpus —
 * `bootstrap` and `bootstrap-tools`, which sit below this instance and whose
 * processes the `pve3` ruling keeps out of its graph (#432) — has no node
 * here and cannot have one without re-carrying bootstrap's process into the
 * root's graph. Those are LISTED on every run as not covered, with the
 * reason; the count is never folded into a clean total. Which instances are
 * outside is computed (`kgDirectories` over the corpus `kg-export` reads),
 * not named here, so a new instance in the corpus that is missing from the
 * files fails rather than being excused.
 *
 * Staleness (the files differ from what the generator writes now) is
 * `subgraph:jsonld:check`'s, not this gate's.
 *
 * Usage:  bun run check:process-index
 * Exit:   0 covered (with any out-of-graph diagrams listed) · 1 a covered
 *         instance's diagram is missing or undocumented, a node is stale, or
 *         the page lost its mount
 *
 * @covers processes, docs
 */
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

import { corpusScopeFor, kgDirectories, workflowFiles } from "./known-skills.ts";
import { SubgraphHydratedSchema, SubgraphIndexSchema, SUBGRAPH_HYDRATED_FILE, SUBGRAPH_INDEX_FILE } from "../schemas/subgraph-manifest.ts";
import { findInstanceRoot, instanceRootsIn, readDeclaration, repoRootFor, siteDirFor } from "../schemas/cat-harness.ts";
import { subgraphOutDir } from "./gen-subgraph-jsonld.ts";

const ROOT = resolve(import.meta.dir, "..");
const REPO = repoRootFor(ROOT);
const SITE = join(ROOT, siteDirFor(ROOT));
const OUT = join(ROOT, subgraphOutDir(ROOT));
const PAGE = join(ROOT, "content", "docs", "publication-workflow", "every-workflow-in-the-repo.md");

type Doc = Record<string, unknown>;
const list = (v: unknown): unknown[] => (v == null ? [] : Array.isArray(v) ? v : [v]);
const repoRel = (abs: string): string => relative(REPO, abs).split(sep).join("/");

/** Every `.bpmn` any instance under the repository declares, by owning instance root. */
export function declaredDiagrams(repoRoot: string = REPO): Map<string, string> {
  const out = new Map<string, string>();
  for (const inst of instanceRootsIn(repoRoot)) {
    for (const abs of workflowFiles(inst, "instance")) {
      if (abs.endsWith(".bpmn") && !out.has(repoRel(abs))) out.set(repoRel(abs), resolve(inst));
    }
  }
  return out;
}

/** The instance roots whose knowledge-graph directories this graph frames — the corpus `kg-export` reads. */
export function framedInstances(root: string = ROOT): Set<string> {
  const out = new Set<string>();
  for (const d of kgDirectories(root, corpusScopeFor(root))) {
    const inst = findInstanceRoot(d.absPath);
    if (inst !== undefined) out.add(resolve(inst));
  }
  return out;
}

/** A Process node as the gate reads it, with the instance tree it was found in. */
export interface PublishedProcess { id: string; sourcePath: string; summary?: string; depiction?: string; harness: string }

/**
 * Every Process in every `processes` subgraph the repository index reaches,
 * read from the files on disk, plus what could not be read.
 */
export function publishedProcesses(outDir: string = OUT): { processes: PublishedProcess[]; problems: string[]; repoIri?: string } {
  const problems: string[] = [];
  const processes: PublishedProcess[] = [];
  const read = (abs: string, schema: typeof SubgraphIndexSchema | typeof SubgraphHydratedSchema): Doc | undefined => {
    if (!existsSync(abs)) { problems.push(`${relative(ROOT, abs)} is missing — run \`bun run subgraph:jsonld\``); return undefined; }
    const doc = JSON.parse(readFileSync(abs, "utf-8")) as Doc;
    const parsed = schema.safeParse(doc);
    if (!parsed.success) problems.push(`${relative(ROOT, abs)} does not validate: ${parsed.error.issues[0]?.message ?? "unknown"}`);
    return doc;
  };
  const repo = read(join(outDir, SUBGRAPH_INDEX_FILE), SubgraphIndexSchema);
  if (!repo) return { processes, problems };
  const repoIri = String(repo["@id"]);
  const fileOf = (iri: string, file: string): string | undefined => {
    if (!iri.startsWith(repoIri)) { problems.push(`${iri} is not under the repository's subgraph IRI ${repoIri}`); return undefined; }
    return join(outDir, iri.slice(repoIri.length), file);
  };
  for (const rootIri of list(repo.hasSubgraph).map(String)) {
    const rootFile = fileOf(rootIri, SUBGRAPH_INDEX_FILE);
    const root = rootFile ? read(rootFile, SubgraphIndexSchema) : undefined;
    if (!root) continue;
    for (const topIri of list(root.hasSubgraph).map(String)) {
      const topFile = fileOf(topIri, SUBGRAPH_INDEX_FILE);
      const top = topFile ? read(topFile, SubgraphIndexSchema) : undefined;
      if (!top || !list(top.holdsGraph).some((k) => /graphKind\/processes$/.test(String(k)))) continue;
      const hydFile = fileOf(topIri, SUBGRAPH_HYDRATED_FILE);
      const hyd = hydFile ? read(hydFile, SubgraphHydratedSchema) : undefined;
      if (!hyd) continue;
      const walk = (node: Doc): void => {
        for (const m of list(node.hasMember) as Doc[]) {
          if (!list(m["@type"]).some((t) => String(t).replace(/^.*[#:/]/, "") === "Process")) continue;
          processes.push({
            id: String(m["@id"]),
            sourcePath: String(m.sourcePath ?? ""),
            summary: typeof m.summary === "string" ? m.summary : undefined,
            depiction: typeof m.depiction === "string" ? m.depiction : undefined,
            harness: String(root.name ?? ""),
          });
        }
        for (const c of list(node.hasSubgraph) as Doc[]) walk(c);
      };
      walk(hyd);
    }
  }
  return { processes, problems, repoIri };
}

if (import.meta.main) {
  const { processes, problems, repoIri } = publishedProcesses();
  const declared = declaredDiagrams();
  const framed = framedInstances();
  // A node's `sourcePath` is relative to the instance that EXPORTED it — this one.
  const byPath = new Map<string, PublishedProcess>();
  for (const p of processes) {
    const path = repoRel(resolve(ROOT, p.sourcePath));
    if (byPath.has(path)) problems.push(`two Process nodes for one diagram: ${path}`);
    byPath.set(path, p);
    if (!declared.has(path)) problems.push(`a Process node for an undeclared diagram: ${path} (${p.id})`);
    if (!p.summary) problems.push(`a Process node carries no documentation: ${path} — give the diagram a <bpmn:documentation> of its own`);
    if (p.depiction) {
      const base = (repoIri ?? "").replace(/subgraph\/$/, "");
      const local = p.depiction.startsWith(base) ? join(SITE, p.depiction.slice(base.length)) : undefined;
      if (!local || !existsSync(local)) problems.push(`a Process node depicts an SVG that is not there: ${p.depiction}`);
    }
  }
  const outside: string[] = [];
  for (const [path, inst] of declared) {
    if (byPath.has(path)) continue;
    if (framed.has(inst)) problems.push(`declared but not a Process node in any published processes subgraph: ${path}`);
    else outside.push(`${path}  (${readDeclaration(inst)?.name ?? relative(REPO, inst)})`);
  }
  if (processes.length === 0) problems.push("the published subgraphs hold no process — a sweep over nothing has cleared nothing");

  const page = existsSync(PAGE) ? readFileSync(PAGE, "utf-8") : "";
  if (!/data-fa-process-index\b/.test(page)) problems.push(`${PAGE} no longer carries the [data-fa-process-index] container`);
  if (!/<noscript>/.test(page)) problems.push(`${PAGE} has no <noscript> fallback for the process table`);

  if (outside.length) {
    console.log(`Not covered — declared by an instance outside this graph (pve3: its processes publish through its own graph, which frames no subgraphs):`);
    for (const o of outside.sort()) console.log(`  · ${o}`);
  }
  if (problems.length) {
    console.error("Process index — the published JSON-LD does not cover the declarations:");
    for (const p of problems) console.error(`  ✗ ${p}`);
    process.exit(1);
  }
  console.log(
    `Process index: ${processes.length} of ${declared.size} declared diagram(s) are documented Process nodes in the published subgraphs; ` +
    `${outside.length} not covered (listed above); page mount present.`,
  );
}
