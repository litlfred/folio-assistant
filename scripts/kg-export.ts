#!/usr/bin/env bun
/**
 * Dump the instance's knowledge graph to one JSON file, for publication.
 *
 * `agentic-harness` has no renderer. `folio` is the only `renderable` graph
 * kind and it belongs to `folio-assist-core`, so the harness cannot put its own
 * knowledge graph on a page the way a folio puts a chapter on one. That is the
 * right boundary and this does not move it: the export is **data**, not a
 * rendered document. Something else may draw it.
 *
 * ## Why not `generate-registry.ts`
 *
 * That script exists and writes `.claude/skills/registry.json`. Measured on
 * `main` 2026-09-18: 69 KB, uncommitted, not gitignored, and published
 * nowhere — a build artifact with no consumer. It is also **partial in a way
 * the numbers hide**: `registry.skills` was 23 because it reads only
 * `.claude/skills/local/*.json`, while the tree holds 126 skill `.md` files.
 * Package skills appear in it as bare name lists inside `registry.packages`,
 * so the thing an agent actually reads — the instruction body's front matter —
 * is absent. BPMN processes, DMN tables, the graph-kind registry and the
 * directory declaration are absent entirely.
 *
 * This exports the graph; the registry stays what it is, a runtime manifest.
 *
 * ## The edges are the point
 *
 * A list of skills is not a graph. What makes this worth publishing is that
 * BPMN activities carry `<folio:skill ref="…"/>` and sit in a lane, so the
 * export can say **which process step is implemented by which skill, performed
 * by which role** — a relation that exists on disk today and that no tool
 * surfaces. `check:workflow-refs` already guarantees those refs resolve, so
 * this does not re-validate them.
 *
 * ## Three states
 *
 * A source that cannot be read is **reported in `problems[]` and counted**,
 * never silently dropped. An export that quietly omits half a corpus is worse
 * than no export: a consumer sees a well-formed graph and cannot tell it is
 * looking at part of one. Bean `dh4f` is the local precedent.
 *
 * @module scripts/kg-export
 */
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { FOLIO_NS } from "../schemas/namespaces.js";
import { loadProcessModel } from "../src/workflow/process-model.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Directories holding a skill's **instruction body** (`<name>.md`).
 *
 * Must stay in step with `knownSkills()` in `scripts/check-workflow-refs.ts`.
 * The first version of this file listed only these and reported 11 BPMN skill
 * refs as dangling — they were not. They resolve through `SKILL_IO_DIR` below,
 * which this collector did not know about, so the export was a partial graph
 * presented as a whole one: precisely the failure the module doc warns about,
 * committed in the module that warns about it.
 */
const SKILL_MD_DIRS = [
  "skills/content-lifecycle",
  "src/skills",
  "skills/folio-core",
  "skills/folio-document-adapter",
  "skills/folio-paper-adapter",
  ".claude/skills/local",
];

/**
 * A directory per skill holding its **I/O contract** — `input.schema.json` and
 * `output.schema.json`.
 *
 * This is the other facet of a skill, not another kind of skill: a name may
 * have an instruction body, an I/O contract, or both. Keying the graph by name
 * rather than by file is what lets the two meet, and what makes "declared
 * somewhere, written nowhere" visible.
 */
const SKILL_IO_DIR = "schemas/skills";

/** `.claude/skills/<group>/*.json` — the typed nodes beside the skills. */
const REGISTRY_GROUPS: Record<string, string> = {
  actors: "Actor",
  capabilities: "Capability",
  roles: "Role",
  requirements: "Requirement",
};

const WORKFLOW_DIR = "docs/workflows";

interface Node {
  "@id": string;
  "@type": string;
  [k: string]: unknown;
}

interface Export {
  "@context": Record<string, string>;
  repository: string;
  generatedAt: string;
  /** Node counts by `@type`, so a consumer can spot a truncated graph. */
  counts: Record<string, number>;
  /** Sources that could not be read. NEVER empty-by-omission — see module doc. */
  problems: string[];
  "@graph": Node[];
}

/** Parse the `name:` and `description:` out of a skill's YAML front matter. */
function frontMatter(text: string): { name?: string; description?: string } {
  if (!text.startsWith("---")) return {};
  const end = text.indexOf("\n---", 3);
  if (end === -1) return {};
  const block = text.slice(3, end);
  const out: { name?: string; description?: string } = {};
  const name = block.match(/^name:\s*(.+)$/m);
  if (name) out.name = name[1].trim();
  // `description: >` folds onto following indented lines.
  const desc = block.match(/^description:\s*(?:>[-+]?\s*\n((?:[ \t]+.*\n?)+)|(.+))$/m);
  if (desc) out.description = (desc[1] ?? desc[2] ?? "").split("\n").map((l) => l.trim()).join(" ").trim();
  return out;
}

/** First `# heading` — the fallback title when there is no front matter. */
function firstHeading(text: string): string | undefined {
  return text.match(/^#\s+(.+)$/m)?.[1].trim();
}

interface SkillFacts {
  instructions?: string;
  title?: string;
  description?: string;
  fmName?: string;
  lines?: number;
  packages: string[];
  inputSchema?: string;
  outputSchema?: string;
}

function collectSkills(problems: string[]): Node[] {
  const byName = new Map<string, SkillFacts>();
  const get = (n: string): SkillFacts =>
    byName.get(n) ?? (byName.set(n, { packages: [] }), byName.get(n)!);

  for (const dir of SKILL_MD_DIRS) {
    const abs = join(ROOT, dir);
    if (!existsSync(abs)) continue; // A package this instance does not carry.
    for (const f of readdirSync(abs)) {
      if (!f.endsWith(".md")) continue;
      let text: string;
      try {
        text = readFileSync(join(abs, f), "utf-8");
      } catch (e) {
        problems.push(`unreadable skill ${dir}/${f}: ${e instanceof Error ? e.message : String(e)}`);
        continue;
      }
      const name = f.slice(0, -3);
      const s = get(name);
      const fm = frontMatter(text);
      // A name defined in two packages is recorded, not silently overwritten:
      // bare name is the identifier a BPMN ref uses, so a duplicate is a real
      // ambiguity somebody has to resolve.
      s.packages.push(dir);
      s.instructions ??= `${dir}/${f}`;
      s.fmName ??= fm.name;
      s.description ??= fm.description;
      s.title ??= firstHeading(text);
      s.lines ??= text.split("\n").length;
    }
  }

  const ioRoot = join(ROOT, SKILL_IO_DIR);
  if (existsSync(ioRoot)) {
    for (const e of readdirSync(ioRoot, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const s = get(e.name);
      const inp = join(ioRoot, e.name, "input.schema.json");
      const out = join(ioRoot, e.name, "output.schema.json");
      if (existsSync(inp)) s.inputSchema = `${SKILL_IO_DIR}/${e.name}/input.schema.json`;
      if (existsSync(out)) s.outputSchema = `${SKILL_IO_DIR}/${e.name}/output.schema.json`;
    }
  }

  return [...byName.entries()].map(([name, s]) => ({
    "@id": `${FOLIO_NS}skill/${name}`,
    "@type": `${FOLIO_NS}Skill`,
    name,
    declaredName: s.fmName !== name ? s.fmName : undefined,
    title: s.title,
    description: s.description,
    packages: s.packages,
    instructions: s.instructions,
    lines: s.lines,
    inputSchema: s.inputSchema,
    outputSchema: s.outputSchema,
    // The two facets, stated rather than left to be inferred from absence.
    hasInstructions: s.instructions !== undefined,
    hasIOContract: s.inputSchema !== undefined || s.outputSchema !== undefined,
    ambiguous: s.packages.length > 1 ? s.packages : undefined,
  }));
}

function collectRegistryNodes(problems: string[]): Node[] {
  const nodes: Node[] = [];
  for (const [group, type] of Object.entries(REGISTRY_GROUPS)) {
    const abs = join(ROOT, ".claude", "skills", group);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs)) {
      if (!f.endsWith(".json")) continue;
      try {
        const d = JSON.parse(readFileSync(join(abs, f), "utf-8")) as Record<string, unknown>;
        const id = String(d.id ?? d.name ?? f.slice(0, -5));
        nodes.push({ "@id": `${FOLIO_NS}${type.toLowerCase()}/${id}`, "@type": `${FOLIO_NS}${type}`, ...d });
      } catch (e) {
        problems.push(`unparseable ${group}/${f}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }
  return nodes;
}

function collectPackages(problems: string[]): Node[] {
  const nodes: Node[] = [];
  const skillsRoot = join(ROOT, "skills");
  if (!existsSync(skillsRoot)) return nodes;
  for (const d of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const mf = join(skillsRoot, d.name, "package-manifest.json");
    if (!existsSync(mf)) continue;
    try {
      const m = JSON.parse(readFileSync(mf, "utf-8")) as Record<string, unknown>;
      nodes.push({
        "@id": `${FOLIO_NS}package/${d.name}`,
        "@type": `${FOLIO_NS}SkillPackage`,
        name: m.name ?? d.name,
        version: m.version,
        description: m.description,
        declaresSkills: m.skills ?? [],
        providesCapabilities: m.providesCapabilities ?? [],
        requiresCapabilities: m.requiresCapabilities ?? [],
      });
    } catch (e) {
      problems.push(`unparseable manifest skills/${d.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return nodes;
}

async function collectProcesses(problems: string[]): Promise<Node[]> {
  const nodes: Node[] = [];
  const dir = join(ROOT, WORKFLOW_DIR);
  if (!existsSync(dir)) return nodes;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".bpmn")) continue;
    const path = join(dir, f);
    try {
      const m = await loadProcessModel(path);
      nodes.push({
        "@id": `${FOLIO_NS}process/${m.id}`,
        "@type": `${FOLIO_NS}Process`,
        name: m.name,
        enforcement: m.enforcement,
        source: relative(ROOT, m.source),
        startNodes: m.startNodes,
        nodeCount: m.nodes.size,
        flowCount: m.flows.size,
      });
      for (const n of m.nodes.values()) {
        nodes.push({
          "@id": `${FOLIO_NS}process/${m.id}/node/${n.id}`,
          "@type": `${FOLIO_NS}ProcessNode`,
          name: n.name,
          kind: n.kind,
          bpmnType: n.type,
          partOf: `${FOLIO_NS}process/${m.id}`,
          // The edges nothing else surfaces.
          performedBy: n.lane,
          implementedBy: n.skills,
          touchesWorkPlan: n.touchesWorkPlan,
          workPlanOp: n.workPlanOp,
          relaxable: n.relaxable,
          decisionRef: n.decisionRef,
          incoming: n.incoming,
          outgoing: n.outgoing,
        });
      }
    } catch (e) {
      problems.push(`unloadable process ${WORKFLOW_DIR}/${f}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return nodes;
}

function collectDeclaration(problems: string[]): Node[] {
  const f = join(ROOT, "agent-harness.json");
  if (!existsSync(f)) return [];
  try {
    const d = JSON.parse(readFileSync(f, "utf-8")) as {
      directories?: Array<{ id: string; path: string; graph: string; summary?: string }>;
    };
    return (d.directories ?? []).map((x) => ({
      "@id": `${FOLIO_NS}directory/${x.id}`,
      "@type": `${FOLIO_NS}Directory`,
      name: x.id,
      path: x.path,
      graph: x.graph,
      summary: x.summary,
    }));
  } catch (e) {
    problems.push(`unparseable agent-harness.json: ${e instanceof Error ? e.message : String(e)}`);
    return [];
  }
}

/** Strip `undefined` so the published JSON has no empty keys. */
function compact(n: Node): Node {
  return Object.fromEntries(Object.entries(n).filter(([, v]) => v !== undefined)) as Node;
}

export async function buildExport(): Promise<Export> {
  const problems: string[] = [];
  const graph = [
    ...collectSkills(problems),
    ...collectRegistryNodes(problems),
    ...collectPackages(problems),
    ...(await collectProcesses(problems)),
    ...collectDeclaration(problems),
  ].map(compact);

  const counts: Record<string, number> = {};
  for (const n of graph) counts[String(n["@type"]).replace(FOLIO_NS, "")] = (counts[String(n["@type"]).replace(FOLIO_NS, "")] ?? 0) + 1;

  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8")) as { name?: string };
  return {
    "@context": { folio: FOLIO_NS },
    repository: pkg.name ?? "folio-assistant",
    generatedAt: new Date().toISOString(),
    counts,
    problems,
    "@graph": graph,
  };
}

if (import.meta.main) {
  const outArg = process.argv.indexOf("--out");
  const out = outArg !== -1 ? process.argv[outArg + 1] : join(ROOT, "_kg", "kg.json");
  const data = await buildExport();

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(data, null, 2) + "\n");

  console.log(`KG export → ${relative(ROOT, out)}`);
  for (const [t, n] of Object.entries(data.counts).sort()) console.log(`  ${String(n).padStart(5)}  ${t}`);
  console.log(`  ${String(data["@graph"].length).padStart(5)}  total`);

  if (data.problems.length > 0) {
    console.error(`\n${data.problems.length} source(s) could not be read:`);
    for (const p of data.problems) console.error(`  ✗ ${p}`);
    // Reported, and non-zero: a partial graph must not pass for a whole one.
    process.exit(1);
  }
}
