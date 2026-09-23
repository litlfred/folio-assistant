#!/usr/bin/env bun
/**
 * UML for every NAMED SUB-GRAPH a harness declares — PlantUML and Mermaid
 * from one model.
 *
 * Owner, 2026-09-23: *"cat-harness/uml/overview/<sub-graph path> … the
 * groupings are derived from node schema kinds and named sub-graphs … and can
 * just be used/declared colors in css in themes. justthedocs renders as
 * needed."* And: *"sections are sub-graphs in a harness … bootstrap/processes
 * is one section … bootstrap/schema, bootstrap/scenarios"*.
 *
 * So nothing here invents a grouping. The groups are read:
 *
 * - **Section** — one entry of an instance's declaration (`<instance>.json`
 *   `directories[]`), named `<instance>/<entry id>`. That is the unit the
 *   harness already declares, so it is the unit a diagram draws.
 * - **Node schema kind** — each of the entry's `graphKinds`, resolved through
 *   {@link resolveKindValidator}: the Zod schema the registry names, turned
 *   into JSON Schema (`toJsonSchema`) and then into classes. A kind
 *   with no validator is drawn as an EMPTY section that says so — *could not
 *   determine*, never an empty-but-valid box.
 * - **Colour** — a CSS class per graph kind (`fa_uml_kind_<kind>`), coloured
 *   in `docs/assets/css/uml.css`. No colour is written into either diagram.
 *
 * ## Two renderings, cross-referenced
 *
 * Per section and per instance:
 *
 * ```
 * uml/overview/<instance>.puml|.mmd              every section of the instance
 * uml/overview/<instance>/<section>.puml|.mmd    one section, with attributes
 * docs/uml/overview/…/<same>.md                  the page: renders the Mermaid,
 *                                                links both sources
 * ```
 *
 * The page renders Mermaid because just-the-docs already loads it and it
 * puts a real CSS class on a node, which PlantUML's SVG does not. The
 * `.puml` is there for the PlantUML look and for offline use, and its header
 * names the page. Both are written from the same {@link Section} list, so
 * neither can say something the other does not.
 *
 * Usage:
 *   bun run cat-harness/scripts/gen-uml-overview.ts           # write
 *   bun run cat-harness/scripts/gen-uml-overview.ts --check   # stale or orphaned?
 *
 * @module scripts/gen-uml-overview
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import type { z } from "zod";

import { toJsonSchema } from "../schemas/to-json-schema.js";

import { instanceDirectoryForGraph, instanceRootsIn, readDeclaration, siteDir } from "../schemas/cat-harness.js";
import { BASE_GRAPH_KINDS, resolveGraphKind } from "../schemas/graph-kind-registry.js";
import { readUmlPalette } from "./uml-palette.js";
import { resolveKindValidator, resolveNodeSchemas, type NodeSchemaResolution } from "../schemas/kind-validator.js";

const HARNESS = resolve(import.meta.dir, "..");
/** Colours for the `.puml`, read from `uml.css` so both renderings agree. */
const PALETTE = readUmlPalette(HARNESS);
const REPO = resolve(HARNESS, "..");
// declared-path-literal: the conventional fallback when no declaration names the directory
const UML_ROOT = join(instanceDirectoryForGraph(HARNESS, "uml") ?? join(HARNESS, "uml"), "overview");
const OWN = readDeclaration(HARNESS);
if (!OWN) throw new Error(`${HARNESS} declares no instance — nothing to draw`);
/** This instance's own site, where the pages are rendered. */
const DOCS_ROOT = join(HARNESS, siteDir(OWN), "uml", "overview");
const REPO_URL = "https://github.com/litlfred/folio-assistant";
const SITE_URL = OWN.canonicalUrl ?? "";
const GENERATOR = relative(REPO, import.meta.path);

// ── The model ─────────────────────────────────────────────────────────────

interface Attr {
  name: string;
  type: string;
  mult: string;
}

interface UmlClass {
  /** Unique within an instance diagram. */
  id: string;
  title: string;
  /** The stereotype: which schema this class was read from. */
  source: string;
  kind: string;
  attrs: Attr[];
}

interface Composition {
  from: string;
  to: string;
  label: string;
  mult: string;
}

interface Section {
  instance: string;
  /** The declaration entry's id — the sub-graph's name within its instance. */
  id: string;
  /** Repo-relative directory. */
  path: string;
  kinds: string[];
  classes: UmlClass[];
  compositions: Composition[];
  /** Kinds whose node schema could not be determined, with the reason. */
  undetermined: { kind: string; reason: string }[];
}

// ── JSON Schema → classes ─────────────────────────────────────────────────

type Json = Record<string, unknown>;

function typeOf(s: Json): string {
  if (s.const !== undefined) return JSON.stringify(s.const);
  if (Array.isArray(s.enum)) {
    const vals = (s.enum as unknown[]).map(String);
    return vals.length <= 6 ? vals.join(" | ") : `enum(${vals.length})`;
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
    return min > 0 ? `${min}..*` : "0..*";
  }
  return required ? "1" : "0..1";
}

/** `roles` → `Role`, `directories` → `Directory`. A label, never an id. */
function singular(prop: string): string {
  const base = prop.replace(/ies$/, "y").replace(/(ss)$/, "$1").replace(/s$/, "");
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function safeId(s: string): string {
  return s.replace(/[^A-Za-z0-9_]/g, "_");
}

/**
 * One class per object in the schema that has named properties: the root,
 * and every array-of-objects property (a composition). Depth is bounded
 * because a class box past the second level is detail nobody reads.
 */
function decompose(
  schema: Json,
  title: string,
  source: string,
  kind: string,
  prefix: string,
  out: { classes: UmlClass[]; compositions: Composition[] },
  depth = 0,
): string {
  const id = safeId(`${prefix}_${title}`);
  const props = (schema.properties ?? {}) as Record<string, Json>;
  const req = new Set((schema.required ?? []) as string[]);
  const attrs: Attr[] = [];
  for (const [name, s] of Object.entries(props)) {
    const items = s.type === "array" ? ((s.items ?? {}) as Json) : undefined;
    if (depth < 2 && items?.type === "object" && items.properties) {
      const child = decompose(items, singular(name), source, kind, prefix, out, depth + 1);
      out.compositions.push({ from: id, to: child, label: name, mult: multOf(s, req.has(name)) });
      continue;
    }
    attrs.push({ name, type: typeOf(s), mult: multOf(s, req.has(name)) });
  }
  // A root that resolved to a schema but yields no properties is a converter
  // failure, not an empty shape: the Zod 3 → 4 upgrade made every class come
  // out empty here, silently, while the object model's edge check caught it.
  if (depth === 0 && Object.keys(props).length === 0 && schema.type === "object") {
    throw new Error(`${source}: JSON Schema has no properties — is the Zod → JSON Schema converter current?`);
  }
  if (!out.classes.some((c) => c.id === id)) out.classes.push({ id, title, source, kind, attrs });
  return id;
}

/** One `$schema` family, as a class — or as the finding it is. */
function drawFamily(
  f: NodeSchemaResolution,
  kind: string,
  prefix: string,
  acc: { classes: UmlClass[]; compositions: Composition[] },
  section: Section,
): void {
  const title = f.tag;
  if (f.state === "resolved") {
    const json = toJsonSchema(f.schema as z.ZodType) as Json;
    decompose(json, title, `json: ${f.ref.exportName}`, kind, `${prefix}_${safeId(f.tag)}`, acc);
  } else if (f.state === "shape") {
    acc.classes.push({
      id: safeId(`${prefix}_${f.tag}`),
      title,
      source: `ts: ${f.ref.exportName}`,
      kind,
      attrs: f.fields.map((x) => ({ name: x.name, type: x.type, mult: x.optional ? "0..1" : "1" })),
    });
  } else if (f.state === "external") {
    acc.classes.push({ id: safeId(`${prefix}_${f.tag}`), title: f.spec, source: `ext: ${f.spec}`, kind, attrs: [] });
  } else if (f.state === "untyped") {
    acc.classes.push({ id: safeId(`${prefix}_${f.tag}`), title, source: `untyped: written by ${f.writtenBy}`, kind, attrs: [] });
  } else {
    section.undetermined.push({ kind: `${kind} ${f.tag}`, reason: f.reason });
  }
}

/** Every `$schema` tag carried by a JSON file under `dir`. */
function tagsUnder(dir: string): Set<string> {
  const out = new Set<string>();
  const walkDir = (d: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(d);
    } catch {
      return;
    }
    for (const e of entries) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walkDir(p);
      else if (p.endsWith(".json")) {
        try {
          const tag = (JSON.parse(readFileSync(p, "utf8")) as { $schema?: unknown })?.$schema;
          if (typeof tag === "string") out.add(tag);
        } catch {
          // not a node
        }
      }
    }
  };
  walkDir(dir);
  return out;
}

// ── Reading the harnesses ─────────────────────────────────────────────────

/**
 * A kind with no runtime validator may still say where its shape is written
 * down (`GraphKindDef.schema`). Two cases are drawable:
 *
 * - a pinned **external-schema record** (`folio-external-schema/v1`) — the
 *   class carries the spec's edition and the operative terms the corpus
 *   uses, which is what BPMN has instead of a JSON Schema;
 * - a **module** — drawn as a class naming it, with no attributes, because a
 *   TypeScript interface cannot be read here and inventing fields would be
 *   worse than showing none.
 */
function fromSchemaField(
  kind: string,
  prefix: string,
  acc: { classes: UmlClass[]; compositions: Composition[] },
): boolean {
  const where = BASE_GRAPH_KINDS[kind]?.schema;
  if (!where) return false;
  const abs = join(HARNESS, where);
  if (where.endsWith(".json") && existsSync(abs)) {
    const rec = JSON.parse(readFileSync(abs, "utf8")) as Json;
    if (rec.$schema === "folio-external-schema/v1") {
      const terms = ((rec.terms ?? []) as Json[]).map((t) => String(t.term));
      acc.classes.push({
        id: safeId(`${prefix}_${String(rec.id)}`),
        title: String(rec.title),
        source: `ext: ${String(rec.id)}`,
        kind,
        attrs: terms.map((t) => ({ name: t, type: "element", mult: "0..*" })),
      });
      return true;
    }
  }
  acc.classes.push({ id: safeId(`${prefix}_${kind}_shape`), title: kind, source: `schema: ${where}`, kind, attrs: [] });
  return true;
}

async function sectionsOf(instanceRoot: string): Promise<Section[]> {
  const decl = readDeclaration(instanceRoot);
  if (!decl) return [];
  const out: Section[] = [];
  for (const entry of decl.directories) {
    const section: Section = {
      instance: decl.name,
      id: entry.id,
      path: relative(REPO, join(instanceRoot, entry.path)).replace(/\\/g, "/"),
      kinds: entry.graphKinds.map((k) => resolveGraphKind(k).kind),
      classes: [],
      compositions: [],
      undetermined: [],
    };
    const acc = { classes: section.classes, compositions: section.compositions };
    const prefix = `${decl.name}_${entry.id}`;
    for (const kind of section.kinds) {
      // `cat-harness` beside another kind is the umbrella, not a node kind: on
      // `["schemas", "cat-harness"]` it says "a schema IS a knowledge-graph
      // node" (graph-kind-registry.ts, §"`cat-harness` SURVIVES"). Drawing it
      // as a second, undetermined box would invent a kind nobody declared.
      if (kind === "cat-harness" && section.kinds.length > 1) continue;
      // A base kind's validator is a path in the harness that DEFINES the
      // kind. Resolving it only against the declaring instance made every
      // downstream sub-graph — bootstrap/scenarios — unresolvable.
      // Bean `rdkm`: a kind that names its `$schema` families is drawn one
      // class per family — seven for `qa` — rather than as one kind-level box.
      const families = await resolveNodeSchemas(kind, HARNESS);
      if (families.length) {
        // Only the families THIS sub-graph holds. The map is the kind's, across
        // every harness; drawing all of it put cat-harness's voice schemas in
        // bootstrap/skills, which holds none of them.
        const here = tagsUnder(join(REPO, section.path));
        const present = families.filter((f) => here.has(f.tag));
        for (const f of present) drawFamily(f, kind, prefix, acc, section);
        if (present.length === 0) {
          section.undetermined.push({
            kind,
            reason: `no node here carries a $schema family ${kind} names (${families.length} named)`,
          });
        }
        continue;
      }
      let v = await resolveKindValidator(kind, instanceRoot);
      if (v.state === "unresolvable" && instanceRoot !== HARNESS && BASE_GRAPH_KINDS[kind]) {
        v = await resolveKindValidator(kind, HARNESS);
      }
      if (v.state === "resolved") {
        const json = toJsonSchema(v.schema as z.ZodType) as Json;
        decompose(json, v.ref.exportName.replace(/Schema$/, ""), `json: ${v.ref.exportName}`, kind, prefix, acc);
        continue;
      }
      if (fromSchemaField(kind, prefix, acc)) continue;
      section.undetermined.push({ kind, reason: v.state === "undeclared" ? "no validator registered" : v.reason });
    }
    out.push(section);
  }
  return out;
}

// ── PlantUML ──────────────────────────────────────────────────────────────

function pumlEsc(s: string): string {
  return s.replace(/"/g, "'");
}

function puml(name: string, pageUrl: string, sections: Section[], withAttrs: boolean): string {
  const L = [
    `' GENERATED by ${GENERATOR} — do not edit.`,
    `' Rendered page (Mermaid, same model): ${pageUrl}`,
    `@startuml ${safeId(name)}`,
    "!pragma layout elk",
    "!theme plain",
    "skinparam classAttributeIconSize 0",
    "skinparam shadowing false",
    "skinparam packageStyle rectangle",
    "hide empty methods",
    "",
  ];
  for (const s of sections) {
    L.push(`package "${s.instance}/${s.id}" as ${safeId(`pkg_${s.instance}_${s.id}`)} <<${s.kinds.join(", ")}>> {`);
    for (const c of s.classes) {
      L.push(`  class "${pumlEsc(c.title)}" as ${c.id} <<${pumlEsc(c.source)}>> ${PALETTE.kind(c.kind)} {`);
      if (withAttrs) for (const a of c.attrs) L.push(`    ${a.name} [${a.mult}] : ${pumlEsc(a.type)}`);
      L.push("  }");
    }
    for (const u of s.undetermined) {
      L.push(`  note "${u.kind}: no node schema declared\\n(${u.reason}: could not determine)" as ${safeId(`n_${s.instance}_${s.id}_${u.kind}`)}`);
    }
    L.push("}");
  }
  L.push("");
  for (const s of sections) {
    for (const c of s.compositions) L.push(`${c.from} *-- "${c.mult}" ${c.to} : ${c.label}`);
  }
  L.push("@enduml");
  return L.join("\n") + "\n";
}

// ── Mermaid ───────────────────────────────────────────────────────────────

/** Mermaid class-diagram member text: no braces, no angle brackets. */
function mmdText(s: string): string {
  return s.replace(/[{}]/g, "").replace(/</g, "~").replace(/>/g, "~").replace(/"/g, "'");
}

function mmd(sections: Section[], withAttrs: boolean): string {
  // LR for a multi-section overview: dagre lays unconnected groups side by
  // side along the CROSS axis, so LR stacks the sub-graphs vertically — one
  // readable column instead of a strip too wide to scroll. Owner, 2026-09-23.
  const L = ["classDiagram", sections.length > 1 ? "  direction LR" : "  direction TB"];
  for (const s of sections) {
    L.push(`  namespace ${safeId(`${s.instance}__${s.id}`)} {`);
    for (const c of s.classes) {
      L.push(`    class ${c.id}["${mmdText(c.title)}"] {`);
      L.push(`      <<${mmdText(c.source)}>>`);
      if (withAttrs) for (const a of c.attrs) L.push(`      ${mmdText(a.name)} [${a.mult}] ${mmdText(a.type)}`);
      L.push("    }");
    }
    for (const u of s.undetermined) {
      const id = safeId(`n_${s.instance}_${s.id}_${u.kind}`);
      L.push(`    class ${id}["${u.kind}: no node schema"] {`);
      L.push("      <<could not determine>>");
      L.push("    }");
    }
    L.push("  }");
  }
  for (const s of sections) {
    for (const c of s.compositions) L.push(`  ${c.from} *-- "${c.mult}" ${c.to} : ${mmdText(c.label)}`);
    // Mermaid's grammar takes neither a hyphen in a class name nor a list
    // of classes (a comma separates NODE ids), hence underscores and one
    // statement per class.
    for (const c of s.classes) L.push(`  cssClass "${c.id}" fa_uml_kind_${safeId(c.kind)}`);
    for (const u of s.undetermined) {
      const id = safeId(`n_${s.instance}_${s.id}_${u.kind}`);
      L.push(`  cssClass "${id}" fa_uml_kind_${safeId(u.kind)}`);
      L.push(`  cssClass "${id}" fa_uml_undetermined`);
    }
  }
  return L.join("\n") + "\n";
}

// ── Pages ─────────────────────────────────────────────────────────────────

function page(opts: {
  title: string;
  lead: string;
  sourceBase: string;
  mermaid: string;
  sections: Section[];
  links?: { label: string; href: string }[];
}): string {
  const blob = `${REPO_URL}/blob/main`;
  const L = [
    "---",
    `title: "UML — ${opts.title}"`,
    "nav_exclude: true",
    "---",
    "",
    `# UML — ${opts.title}`,
    "",
    `Generated by \`${GENERATOR}\` — do not edit. ${opts.lead}`,
    "",
    `**Sources (same model):** [PlantUML](${blob}/${opts.sourceBase}.puml) · [Mermaid](${blob}/${opts.sourceBase}.mmd)`,
    "",
    "```mermaid",
    opts.mermaid.trimEnd(),
    "```",
    "",
    "| sub-graph | directory | graph kinds | node schema |",
    "|---|---|---|---|",
  ];
  for (const s of opts.sections) {
    const found = [...new Set(s.classes.map((c) => c.source.replace(/^json: /, "")))];
    const missing = s.undetermined.map((u) => `${u.kind}: *could not determine*`);
    L.push(`| \`${s.instance}/${s.id}\` | \`${s.path}\` | ${s.kinds.join(", ")} | ${[...found.map((f) => `\`${f}\``), ...missing].join("; ")} |`);
  }
  if (opts.links?.length) {
    L.push("", "## Sub-graphs", "");
    for (const l of opts.links) L.push(`- [${l.label}](${l.href})`);
  }
  return L.join("\n") + "\n";
}

// ── main ──────────────────────────────────────────────────────────────────

async function build(): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const instances: { name: string; sections: Section[] }[] = [];
  for (const root of instanceRootsIn(REPO)) {
    const sections = await sectionsOf(root);
    if (sections.length === 0) continue;
    instances.push({ name: sections[0].instance, sections });
  }
  instances.sort((a, b) => a.name.localeCompare(b.name));

  const umlRel = relative(REPO, UML_ROOT).replace(/\\/g, "/");
  for (const inst of instances) {
    const pageUrl = `${SITE_URL}/uml/overview/${inst.name}.html`;
    const overviewMmd = mmd(inst.sections, true);
    files.set(join(UML_ROOT, `${inst.name}.puml`), puml(inst.name, pageUrl, inst.sections, true));
    files.set(join(UML_ROOT, `${inst.name}.mmd`), overviewMmd);
    files.set(
      join(DOCS_ROOT, `${inst.name}.md`),
      page({
        title: inst.name,
        lead: `Every named sub-graph the \`${inst.name}\` harness declares, one box each, with the node schema kinds found in it.`,
        sourceBase: `${umlRel}/${inst.name}`,
        mermaid: overviewMmd,
        sections: inst.sections,
        links: inst.sections.map((s) => ({ label: `${s.instance}/${s.id}`, href: `${inst.name}/${s.id}.html` })),
      }),
    );
    for (const s of inst.sections) {
      const base = `${inst.name}/${s.id}`;
      const sectionMmd = mmd([s], true);
      files.set(join(UML_ROOT, `${base}.puml`), puml(`${inst.name}_${s.id}`, `${SITE_URL}/uml/overview/${base}.html`, [s], true));
      files.set(join(UML_ROOT, `${base}.mmd`), sectionMmd);
      files.set(
        join(DOCS_ROOT, `${base}.md`),
        page({
          title: `${s.instance}/${s.id}`,
          lead: `The \`${s.id}\` sub-graph of \`${inst.name}\` (\`${s.path}\`), with every attribute read from its node schema.`,
          sourceBase: `${umlRel}/${base}`,
          mermaid: sectionMmd,
          sections: [s],
          links: [{ label: `← all of ${inst.name}`, href: `../${inst.name}.html` }],
        }),
      );
    }
  }
  const index = [
    "---",
    'title: "UML overview"',
    "nav_exclude: true",
    "---",
    "",
    "# UML overview",
    "",
    `Generated by \`${GENERATOR}\` — do not edit. One diagram per harness and one per named sub-graph it declares. Classes are read from each graph kind's node schema; colours come from \`docs/assets/css/uml.css\`.`,
    "",
    ...instances.map((i) => `- [${i.name}](${i.name}.html) — ${i.sections.length} sub-graph(s)`),
  ];
  files.set(join(DOCS_ROOT, "index.md"), index.join("\n") + "\n");
  return files;
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

// Guarded: an import must write nothing. `declared-directory-resolves.test.ts`
// imports every module that resolves a declared directory, and an unguarded
// run rewrote the generated files on import (in CI, where the output differs).
async function main(): Promise<void> {
  const check = process.argv.includes("--check");
  const files = await build();
  const existing = [...walk(UML_ROOT), ...walk(DOCS_ROOT)];
  // Only this generator's own kinds of output count as orphans.
  const orphans = existing.filter((p) => !files.has(p) && /\.(puml|mmd|md)$/.test(p));

  if (check) {
    const stale = [...files].filter(([p, text]) => !existsSync(p) || readFileSync(p, "utf8") !== text).map(([p]) => p);
    if (stale.length || orphans.length) {
      for (const p of stale) console.error(`stale: ${relative(REPO, p)}`);
      for (const p of orphans) console.error(`orphan: ${relative(REPO, p)}`);
      console.error(`run: bun run ${GENERATOR}`);
      process.exit(1);
    }
    console.log(`UML overview is current — ${files.size} file(s)`);
  } else {
    for (const p of orphans) rmSync(p);
    for (const [p, text] of files) {
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, text);
    }
    console.log(`wrote ${files.size} file(s) under ${relative(REPO, UML_ROOT)} and ${relative(REPO, DOCS_ROOT)}${orphans.length ? `; removed ${orphans.length} orphan(s)` : ""}`);
  }
}

if (import.meta.main) await main();
