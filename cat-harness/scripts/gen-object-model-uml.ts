#!/usr/bin/env bun
/**
 * Render the harness object model as PlantUML, with every class's attributes
 * DERIVED from the JSON Schema behind it.
 *
 * Five packages — schema, scenario, process, state, test — and the classes in
 * them. The picture is the one on the "Harness Object Model" deck; what this
 * adds is that nothing inside a class box is transcribed. Each box is read
 * from a schema, and the stereotype names which one:
 *
 * - `«json: X»` — a JSON Schema generated from the Zod schema `X` in
 *   `schemas/` (`zod-to-json-schema`, the same route `generate-schemas.ts` and
 *   `harness-schema-export.ts` take).
 * - `«ext: …»` — a schema this repository does not own: the WHO SMART DAK's
 *   own JSON Schema for User Story (read from `smart-base/`), the beans CLI's
 *   GraphQL schema for Bean, OMG BPMN 2.0 for Process.
 *
 * Relationships are declared below, but each one names the schema path that
 * carries it and the generator REFUSES to write if that path is not in the
 * derived schema — so an edge cannot outlive the field it was drawn from. The
 * three edges that live in BPMN extension attributes rather than in any JSON
 * Schema (`folio:role`, `folio:skill`, `folio:bean`) are drawn dashed and say
 * so.
 *
 * Usage:
 *   bun run cat-harness/scripts/gen-object-model-uml.ts           # write
 *   bun run cat-harness/scripts/gen-object-model-uml.ts --check   # stale?
 *
 * `--check` needs the `beans` CLI for the Bean class; without it the result is
 * "could not check" (exit 2), never a pass.
 *
 * @module scripts/gen-object-model-uml
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { ZodTypeAny } from "zod";

import { ActorDefSchema, RoleDefSchema } from "../schemas/role-graph.js";
import { SkillDefinitionSchema } from "../schemas/skill-package.js";
import { TaskRefSchema } from "../schemas/carried-note.js";
import { TodoNodeSchema } from "../schemas/todo.js";
import { TestRunSchema } from "../schemas/test-run.js";
import { KgQaReportSchema } from "../schemas/kg-qa.js";
import { ExternalSchemaSchema } from "../../folio-assistant-core/schemas/external-schema.js";
import { instanceDirectoryForGraph } from "../schemas/cat-harness.js";

const HARNESS = resolve(import.meta.dir, "..");
const REPO = resolve(HARNESS, "..");
/**
 * In THIS instance's declared `uml` directory, beside the per-sub-graph
 * diagrams `gen-uml-overview.ts` writes under `uml/overview/`.
 */
const OUT = join(
  // declared-path-literal: the conventional fallback when no declaration names the directory
  instanceDirectoryForGraph(HARNESS, "uml") ?? join(HARNESS, "uml"),
  "harness-object-model.puml",
);
const DAK_USER_STORY = join(
  REPO,
  "smart-base/fhir-artifact-index/dak/StructureDefinition-FunctionalRequirement.schema.json",
);
const BPMN_RECORD = join(
  instanceDirectoryForGraph(HARNESS, "external-schema") ?? join(HARNESS, "external-schemas"),
  "omg-bpmn-2.0.json",
);

// ── JSON Schema, reduced to what a class box shows ────────────────────────

type Json = Record<string, unknown>;

interface Attr {
  name: string;
  type: string;
  mult: string;
}

function typeOf(s: Json): string {
  if (s.const !== undefined) return JSON.stringify(s.const);
  if (Array.isArray(s.enum)) {
    const vals = (s.enum as unknown[]).map(String);
    return vals.length <= 8 ? vals.join(" | ") : `enum(${vals.length})`;
  }
  const alts = (s.anyOf ?? s.oneOf) as Json[] | undefined;
  if (alts) return [...new Set(alts.map(typeOf))].join(" | ");
  if (s.type === "array") {
    const inner = typeOf((s.items ?? {}) as Json);
    return inner.includes(" | ") ? `list<${inner}>` : `${inner}[]`;
  }
  if (s.type === "object" && s.additionalProperties && !s.properties) {
    return `map<${typeOf(s.additionalProperties as Json)}>`;
  }
  if (Array.isArray(s.type)) return (s.type as string[]).join(" | ");
  if (typeof s.type === "string") return s.format ? `${s.type}<${s.format}>` : s.type;
  return "any";
}

function multOf(s: Json, required: boolean): string {
  if (s.type === "array") {
    const min = (s.minItems as number | undefined) ?? 0;
    return min > 0 ? `[${min}..*]` : "[0..*]";
  }
  return required ? "[1]" : "[0..1]";
}

/**
 * Properties as attributes. A nested object is flattened ONE level with a
 * dotted name — `tags.roles` — because that is how the relationship paths
 * below address it, and a second level is detail a class box cannot carry.
 */
function attrsOf(schema: Json, prefix = "", depth = 0): Attr[] {
  const props = (schema.properties ?? {}) as Record<string, Json>;
  const req = new Set((schema.required ?? []) as string[]);
  const out: Attr[] = [];
  for (const [name, s] of Object.entries(props)) {
    const full = prefix + name;
    if (depth === 0 && s.type === "object" && s.properties) {
      out.push(...attrsOf(s, `${full}.`, 1));
      continue;
    }
    const items = s.type === "array" ? ((s.items ?? {}) as Json) : undefined;
    const t = items?.type === "object" && items.properties
      ? `{${Object.keys(items.properties as Json).join(", ")}}[]`
      : typeOf(s);
    out.push({ name: full, type: t, mult: multOf(s, req.has(name)) });
  }
  return out;
}

function fromZod(schema: ZodTypeAny): Json {
  return zodToJsonSchema(schema, { $refStrategy: "none" }) as Json;
}

function readJson(path: string): Json {
  return JSON.parse(readFileSync(path, "utf8")) as Json;
}

// ── The beans CLI's own schema ────────────────────────────────────────────

/** Scalar fields of `type Bean` from `beans graphql --schema`, or null. */
function beanAttrs(): Attr[] | null {
  const r = spawnSync("beans", ["graphql", "--schema"], { encoding: "utf8" });
  if (r.status !== 0 || !r.stdout) return null;
  const body = /type Bean \{([\s\S]*?)\n\}/.exec(r.stdout)?.[1];
  if (!body) return null;
  const out: Attr[] = [];
  for (const m of body.matchAll(/^\s*(\w+)(\([^)]*\))?:\s*([\w[\]!]+)\s*$/gm)) {
    const [, name, args, gql] = m;
    if (args) continue; // resolved traversals, not stored fields
    const list = gql.startsWith("[");
    const base = gql.replace(/[[\]!]/g, "");
    if (base === "Bean") continue; // `parent` — the resolved form of parentId
    out.push({
      name,
      type: list ? `${base}[]` : base,
      mult: list ? "[0..*]" : gql.endsWith("!") ? "[1]" : "[0..1]",
    });
  }
  return out;
}

// ── The model ─────────────────────────────────────────────────────────────

interface ClassDef {
  id: string;
  title: string;
  pkg: "scenario" | "process" | "state" | "schema" | "test";
  source: string; // the stereotype
  attrs: Attr[];
  note?: string;
}

interface Edge {
  from: string;
  to: string;
  /** Attribute of `from` that carries it — asserted, unless `via` is set. */
  path?: string;
  /** For an edge no JSON Schema carries: where it is declared instead. */
  via?: string;
  label: string;
  mult?: string;
}

function build(beans: Attr[] | null): { classes: ClassDef[]; edges: Edge[] } {
  const bpmn = readJson(BPMN_RECORD);
  const terms = ((bpmn.terms ?? []) as Json[]).map((t) => String(t.term).replace(/^bpmn:/, ""));
  const taskTerms = terms.filter((t) => /task|callActivity/i.test(t));
  const processTerms = terms.filter((t) => /^(process|laneSet|lane|sequenceFlow|startEvent|endEvent|exclusiveGateway|parallelGateway)$/.test(t));

  const classes: ClassDef[] = [
    { id: "Actor", title: "Actor", pkg: "scenario", source: "json: ActorDefSchema", attrs: attrsOf(fromZod(ActorDefSchema)) },
    { id: "Role", title: "Role", pkg: "scenario", source: "json: RoleDefSchema", attrs: attrsOf(fromZod(RoleDefSchema)) },
    { id: "Skill", title: "Skill", pkg: "scenario", source: "json: SkillDefinitionSchema", attrs: attrsOf(fromZod(SkillDefinitionSchema)) },
    {
      id: "UserStory", title: "User Story", pkg: "scenario",
      source: "ext: SMART DAK FunctionalRequirement",
      attrs: attrsOf(readJson(DAK_USER_STORY)),
      note: "As a <actor> I want <capability>\nso that <benefit> — smart-base SGUserStory.\nThe harness itself still holds stories as\nRole.useCases (free text).",
    },
    {
      id: "Process", title: "Process", pkg: "process",
      source: `ext: ${String(bpmn.authority)} BPMN ${String(bpmn.version)}`,
      attrs: processTerms.map((t) => ({ name: `bpmn:${t}`, type: "element", mult: "" })),
      note: "XSD, not JSON Schema: the elements\nlisted are the operative terms pinned\nin external-schemas/omg-bpmn-2.0.json.",
    },
    {
      id: "Task", title: "Task", pkg: "process", source: "json: TaskRefSchema",
      attrs: [
        ...attrsOf(fromZod(TaskRefSchema)),
        ...taskTerms.map((t) => ({ name: `bpmn:${t}`, type: "element", mult: "" })),
      ],
    },
    { id: "Todo", title: "Todo", pkg: "state", source: "json: TodoNodeSchema", attrs: attrsOf(fromZod(TodoNodeSchema)) },
    {
      id: "Bean", title: "Bean", pkg: "state", source: "ext: beans GraphQL type Bean",
      attrs: beans ?? [],
      note: beans ? undefined : "could not determine: the beans CLI\nwas not on PATH when this was generated",
    },
    { id: "ExternalSchema", title: "External Schema", pkg: "schema", source: "json: ExternalSchemaSchema", attrs: attrsOf(fromZod(ExternalSchemaSchema)) },
    { id: "TestRun", title: "Test Run", pkg: "test", source: "json: TestRunSchema", attrs: attrsOf(fromZod(TestRunSchema)) },
    { id: "KgQaReport", title: "KG QA Report", pkg: "test", source: "json: KgQaReportSchema", attrs: attrsOf(fromZod(KgQaReportSchema)) },
  ];

  const edges: Edge[] = [
    { from: "Actor", to: "Role", path: "roles", label: "takes on", mult: "0..*" },
    { from: "Role", to: "Role", path: "inherits", label: "inherits", mult: "0..*" },
    { from: "Role", to: "Skill", path: "skills", label: "carries", mult: "0..*" },
    { from: "UserStory", to: "Role", path: "actor", label: "as a", mult: "0..*" },
    { from: "Task", to: "Process", path: "process", label: "in", mult: "1" },
    { from: "Task", to: "Role", via: "folio:role ref on the lane / Role.lanes", label: "in lane of", mult: "1" },
    { from: "Task", to: "Skill", via: "folio:skill ref", label: "uses", mult: "1" },
    { from: "Task", to: "Bean", via: "folio:bean op", label: "bean op", mult: "0..1" },
    { from: "Todo", to: "Role", path: "tags.roles", label: "tags", mult: "0..*" },
    { from: "Todo", to: "Process", path: "tags.processes", label: "tags", mult: "0..*" },
    { from: "Todo", to: "Task", path: "tags.tasks", label: "tags", mult: "0..*" },
    { from: "Todo", to: "Actor", path: "tags.identities", label: "identities[].actor", mult: "0..*" },
    { from: "Bean", to: "Bean", path: "parentId", label: "parent", mult: "0..1" },
    { from: "Bean", to: "Bean", path: "blockingIds", label: "blocks", mult: "0..*" },
    { from: "KgQaReport", to: "Role", path: "subject.kind", label: "audits", mult: "1" },
    { from: "KgQaReport", to: "Process", path: "subject.kind", label: "audits", mult: "1" },
    { from: "KgQaReport", to: "Skill", path: "subject.kind", label: "audits", mult: "1" },
  ];
  return { classes, edges };
}

/** Every `path` edge must name an attribute the derived schema has. */
function assertEdges(classes: ClassDef[], edges: Edge[]): string[] {
  const byId = new Map(classes.map((c) => [c.id, c]));
  const problems: string[] = [];
  for (const e of edges) {
    const from = byId.get(e.from);
    if (!from || !byId.has(e.to)) {
      problems.push(`${e.from} → ${e.to}: unknown class`);
      continue;
    }
    if (!e.path) continue;
    if (from.id === "Bean" && from.attrs.length === 0) continue; // undetermined, said in its note
    if (!from.attrs.some((a) => a.name === e.path)) {
      problems.push(`${e.from} → ${e.to}: ${e.path} is not in ${from.source}`);
    }
  }
  return problems;
}

// ── PlantUML ──────────────────────────────────────────────────────────────

const PKG = {
  scenario: "#E8F0EE",
  process: "#EEE9F5",
  state: "#F6EEDF",
  schema: "#E9EDF3",
  test: "#F4E6E6",
} as const;

function esc(s: string): string {
  return s.replace(/"/g, "'");
}

function render(classes: ClassDef[], edges: Edge[]): string {
  const L: string[] = [
    "' GENERATED by cat-harness/scripts/gen-object-model-uml.ts — do not edit.",
    "' Class attributes are derived from each model's JSON Schema; the",
    "' stereotype names which. Regenerate after changing any schema it reads.",
    "@startuml harness-object-model",
    "' ELK routes edges around class boxes; dot and smetana draw through them.",
    "!pragma layout elk",
    "skinparam nodesep 60",
    "skinparam ranksep 80",
    "!theme plain",
    "skinparam classAttributeIconSize 0",
    "skinparam shadowing false",
    "skinparam packageStyle rectangle",
    "skinparam stereotypeCBackgroundColor #FDFDFB",
    "hide empty methods",
    "",
    "title Harness object model — attributes derived from JSON Schema",
    "",
  ];
  for (const pkg of Object.keys(PKG) as (keyof typeof PKG)[]) {
    L.push(`package ${pkg} ${PKG[pkg]} {`);
    for (const c of classes.filter((x) => x.pkg === pkg)) {
      L.push(`  class "${c.title}" as ${c.id} <<${esc(c.source)}>> {`);
      for (const a of c.attrs) {
        L.push(`    ${a.name}${a.mult ? ` ${a.mult}` : ""} : ${esc(a.type)}`);
      }
      L.push("  }");
    }
    if (pkg === "schema") {
      L.push('  class "JSON Schema" as JsonSchema <<draft-07, from Zod>> {');
      L.push("    $schema [1] : string<uri>");
      L.push("    properties [0..*] : schema");
      L.push("  }");
      L.push("  JsonSchema ..> ExternalSchema : $ref / conformsTo");
    }
    L.push("}");
    L.push("");
  }
  for (const c of classes.filter((x) => x.note)) {
    L.push(`note bottom of ${c.id}`);
    L.push(...c.note!.split("\n").map((l) => `  ${l}`));
    L.push("end note");
  }
  L.push("");
  for (const e of edges) {
    const arrow = e.via ? "..>" : "-->";
    const carried = e.via ? `«${e.via}»` : e.path === e.label ? undefined : e.path;
    const m = e.mult ? ` "${e.mult}"` : "";
    L.push(`${e.from} ${arrow}${m} ${e.to} : ${esc(e.label)}${carried ? `\\n${esc(carried)}` : ""}`);
  }
  L.push("");
  L.push("scenario ..> schema : <<conformsTo>>");
  L.push("process ..> schema : <<conformsTo>>");
  L.push("state ..> schema : <<conformsTo>>");
  L.push("test ..> schema : <<conformsTo>>");
  L.push("@enduml");
  return L.join("\n") + "\n";
}

// ── main ──────────────────────────────────────────────────────────────────

const check = process.argv.includes("--check");
if (!existsSync(DAK_USER_STORY)) {
  console.error(`could not determine: ${DAK_USER_STORY} is missing`);
  process.exit(2);
}
const beans = beanAttrs();
const { classes, edges } = build(beans);
const problems = assertEdges(classes, edges);
if (problems.length) {
  console.error("Relationships not carried by their schema:\n  " + problems.join("\n  "));
  process.exit(1);
}
const text = render(classes, edges);

if (check) {
  if (!beans) {
    console.error("could not check: the beans CLI is not on PATH, so the Bean class cannot be derived");
    process.exit(2);
  }
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (current !== text) {
    console.error(`${OUT} is stale — run: bun run cat-harness/scripts/gen-object-model-uml.ts`);
    process.exit(1);
  }
  console.log("harness-object-model.puml is current");
} else {
  writeFileSync(OUT, text);
  console.log(`wrote ${OUT} (${classes.length} classes, ${edges.length} relationships)`);
}
