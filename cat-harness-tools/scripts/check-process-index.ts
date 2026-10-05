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
 * ## Diagrams of instances this graph does not frame
 *
 * `bootstrap` and `bootstrap-tools` sit below this instance, and the `pve3`
 * ruling keeps their processes out of its graph (#432). They publish their
 * OWN subgraphs at their own sites (bootstrap-tools#7), and the repository
 * index links each with `seeAlso` (bean `t8c4`). Such a diagram is covered
 * when that link is there AND the build that publishes those subgraphs —
 * bootstrap-tools' `buildSubgraphs`, run here in process, nothing fetched —
 * holds a documented Process node for it, keyed by its `source` IRI (those
 * files carry no `sourcePath`). An unframed instance with no such link is
 * LISTED as not covered, with the reason, and never folded into a clean
 * total. Which instances are unframed is computed (`framedInstances`, the
 * generator's own answer), not named here.
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
import { HARNESS_ROOT } from "./lib/roots.ts";
import { existsSync, readFileSync } from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";

import { workflowFiles } from "../../cat-harness/scripts/known-skills.ts";
import { SubgraphHydratedSchema, SubgraphIndexSchema, SUBGRAPH_HYDRATED_FILE, SUBGRAPH_INDEX_FILE } from "../../cat-harness/schemas/subgraph-manifest.ts";
import { instanceRootsIn, readDeclaration, repoRootFor, siteDirFor } from "../../cat-harness/schemas/cat-harness.ts";
import { framedInstances as framedRoots, subgraphOutDir } from "../../cat-harness/scripts/gen-subgraph-jsonld.ts";
import { readKnowledgeGraphDeclaration } from "../../bootstrap-tools/schemas/declaration.ts";
import { buildSubgraphs, publicationBase } from "../../bootstrap-tools/scripts/subgraph-jsonld.ts";
import { builtDocsRoute } from "../../cat-harness/scripts/docs-route.ts";

const ROOT = HARNESS_ROOT;
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

/**
 * The instance roots whose knowledge-graph directories this graph frames —
 * `gen-subgraph-jsonld`'s own answer, so the gate and the generator cannot
 * disagree about which diagrams are covered.
 */
export function framedInstances(root: string = ROOT): Set<string> {
  return new Set(framedRoots(root));
}

/** Each repository's instances by declared name, read once per run. */
const instanceByName = new Map<string, Map<string, string>>();

/**
 * A published Process's diagram, repository-relative. Its `sourcePath` is
 * relative to the instance that EXPORTED it — the one whose tree it is in,
 * named by `harness` — since each instance is framed from its own export
 * (bean `4ak5` item 2). It was relative to this instance while one
 * checkout-scope export carried every framed instance's processes.
 */
export function diagramPath(p: PublishedProcess, repoRoot: string = REPO): string {
  let byName = instanceByName.get(repoRoot);
  if (byName === undefined) {
    byName = new Map(instanceRootsIn(repoRoot).flatMap((r) => {
      const name = readDeclaration(r)?.name;
      return name === undefined ? [] : [[name, r] as const];
    }));
    instanceByName.set(repoRoot, byName);
  }
  return relative(repoRoot, resolve(byName.get(p.harness) ?? ROOT, p.sourcePath)).split(sep).join("/");
}

/** A Process node as the gate reads it, with the instance tree it was found in. */
export interface PublishedProcess { id: string; sourcePath: string; summary?: string; depiction?: string; harness: string }

/**
 * Every Process in every `processes` subgraph the repository index reaches,
 * read from the files on disk, plus what could not be read.
 */
export function publishedProcesses(outDir: string = OUT): { processes: PublishedProcess[]; problems: string[]; repoIri?: string; seeAlso: string[] } {
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
  if (!repo) return { processes, problems, seeAlso: [] };
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
      if (!top || !list(top.holdsGraph).some((k) => /graphTypology\/processes$/.test(String(k)))) continue;
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
  return { processes, problems, repoIri, seeAlso: list(repo.seeAlso).map(String) };
}

/**
 * The diagrams an instance this graph does NOT frame publishes as documented
 * Process nodes in its OWN subgraphs (bean `t8c4`) — bootstrap's, which
 * bootstrap-tools publishes at bootstrap's site. Counted only when the
 * repository index links that site (`seeAlso`), since that link is how the
 * page finds it. Computed with the build that publishes them, run here in
 * process: nothing is fetched, so a gate does not depend on a site being up,
 * and the files cannot vouch for themselves any more than ours can. Those
 * files carry no `sourcePath`; a node is keyed by its `source` IRI under the
 * instance's publication base.
 */
export function unframedProcesses(seeAlso: readonly string[], framed: ReadonlySet<string>, repoRoot: string = REPO): { byPath: Map<string, PublishedProcess>; problems: string[] } {
  const byPath = new Map<string, PublishedProcess>();
  const problems: string[] = [];
  for (const inst of instanceRootsIn(repoRoot)) {
    if (framed.has(resolve(inst))) continue;
    const decl = readKnowledgeGraphDeclaration(inst);
    const base = publicationBase(decl);
    if (!decl || !base || !seeAlso.includes(`${base}subgraph/`)) continue;
    let build: ReturnType<typeof buildSubgraphs>;
    try {
      build = buildSubgraphs(inst);
    } catch (e) {
      problems.push(`${decl.name}: its subgraphs could not be built — ${String(e)}`);
      continue;
    }
    for (const p of build.problems) problems.push(`${decl.name}: ${p}`);
    for (const [file, text] of build.files) {
      if (!file.endsWith(`/${SUBGRAPH_HYDRATED_FILE}`)) continue;
      const walk = (node: Doc): void => {
        for (const m of list(node.hasMember) as Doc[]) {
          if (!list(m["@type"]).some((t) => String(t).replace(/^.*[#:/]/, "") === "Process")) continue;
          const source = typeof m.source === "string" ? m.source : "";
          if (!source.startsWith(base)) { problems.push(`${String(m["@id"])}: its source ${JSON.stringify(source)} is not under ${base}`); continue; }
          const path = repoRel(join(inst, source.slice(base.length)));
          byPath.set(path, {
            id: String(m["@id"]),
            sourcePath: path,
            summary: typeof m.summary === "string" ? m.summary : undefined,
            harness: decl.name,
          });
        }
        for (const c of list(node.hasSubgraph) as Doc[]) walk(c);
      };
      walk(JSON.parse(text) as Doc);
    }
  }
  return { byPath, problems };
}

if (import.meta.main) {
  const { processes, problems, repoIri, seeAlso } = publishedProcesses();
  const declared = declaredDiagrams();
  const framed = framedInstances();
  const unframed = unframedProcesses(seeAlso, framed);
  problems.push(...unframed.problems);
  const byPath = new Map<string, PublishedProcess>();
  for (const p of processes) {
    const path = diagramPath(p);
    if (byPath.has(path)) problems.push(`two Process nodes for one diagram: ${path}`);
    byPath.set(path, p);
    if (!declared.has(path)) problems.push(`a Process node for an undeclared diagram: ${path} (${p.id})`);
    if (!p.summary) problems.push(`a Process node carries no documentation: ${path} — give the diagram a <bpmn:documentation> of its own`);
    if (p.depiction) {
      const base = (repoIri ?? "").replace(/subgraph\/$/, "");
      // The SVG is in the docs tree, published under its route (`docs/<built>`
      // since 2026-10-05, issue #2188) — so the route is what separates the
      // depiction's site path from the file in the docs source.
      const route = `${builtDocsRoute(basename(ROOT), REPO)}/`;
      const sitePath = p.depiction.startsWith(base) ? p.depiction.slice(base.length) : undefined;
      const local = sitePath?.startsWith(route) ? join(SITE, sitePath.slice(route.length)) : undefined;
      if (!local || !existsSync(local)) problems.push(`a Process node depicts an SVG that is not there: ${p.depiction}`);
    }
  }
  for (const [path, p] of unframed.byPath) {
    if (!declared.has(path)) problems.push(`a Process node for an undeclared diagram: ${path} (${p.id})`);
    if (!p.summary) problems.push(`a Process node carries no documentation: ${path} — give the diagram a <bpmn:documentation> of its own`);
  }
  const outside: string[] = [];
  for (const [path, inst] of declared) {
    if (byPath.has(path) || unframed.byPath.has(path)) continue;
    if (framed.has(inst)) problems.push(`declared but not a Process node in any published processes subgraph: ${path}`);
    else outside.push(`${path}  (${readDeclaration(inst)?.name ?? relative(REPO, inst)})`);
  }
  if (processes.length === 0) problems.push("the published subgraphs hold no process — a sweep over nothing has cleared nothing");

  const page = existsSync(PAGE) ? readFileSync(PAGE, "utf-8") : "";
  if (!/data-fa-process-index\b/.test(page)) problems.push(`${PAGE} no longer carries the [data-fa-process-index] container`);
  if (!/<noscript>/.test(page)) problems.push(`${PAGE} has no <noscript> fallback for the process table`);

  if (outside.length) {
    console.log(`Not covered — declared by an instance outside this graph whose own subgraphs the repository index does not link (pve3, t8c4):`);
    for (const o of outside.sort()) console.log(`  · ${o}`);
  }
  if (problems.length) {
    console.error("Process index — the published JSON-LD does not cover the declarations:");
    for (const p of problems) console.error(`  ✗ ${p}`);
    process.exit(1);
  }
  console.log(
    `Process index: ${processes.length + unframed.byPath.size} of ${declared.size} declared diagram(s) are documented Process nodes in the published subgraphs ` +
    `(${unframed.byPath.size} in the subgraphs of instances this graph does not frame, linked by seeAlso); ` +
    `${outside.length} not covered${outside.length ? " (listed above)" : ""}; page mount present.`,
  );
}
