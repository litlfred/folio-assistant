#!/usr/bin/env bun
/**
 * gen-schema-docs.ts — Generate human-readable Markdown reference pages from the
 * JSON Schema files that define each skill's input/output contract.
 *
 * Source of truth:  schemas/skills/<skill>/{input,output}.schema.json
 * Output:           docs/reference/skills/<skill>.md  (+ docs/reference/skills/index.md)
 *
 * The generated pages are committed to the repo (so they are browsable on
 * GitHub directly) and re-generated in CI before the docs site is deployed to
 * GitHub Pages. Run locally with:
 *
 *     bun run scripts/gen-schema-docs.ts
 *
 * This generator is intentionally dependency-free (no external JSON-Schema
 * tooling) so it runs in any environment that has `bun`.
 *
 * @module scripts/gen-schema-docs
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "fs";
import { join, resolve } from "path";

const REPO_ROOT = resolve(import.meta.dir, "..");
const SKILLS_DIR = join(REPO_ROOT, "schemas", "skills");
const OUT_DIR = join(REPO_ROOT, "docs", "reference", "skills");

interface JsonSchema {
  $id?: string;
  title?: string;
  description?: string;
  type?: string | string[];
  enum?: unknown[];
  const?: unknown;
  default?: unknown;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  required?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema | JsonSchema[];
  additionalProperties?: boolean | JsonSchema;
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
  [key: string]: unknown;
}

/** Render the human-readable type label for a schema node. */
function typeLabel(schema: JsonSchema): string {
  if (schema.enum) {
    return schema.enum.map((v) => `\`${JSON.stringify(v)}\``).join(" \\| ");
  }
  if (schema.const !== undefined) return `\`${JSON.stringify(schema.const)}\` (const)`;
  if (schema.oneOf) return "one of (see below)";
  if (schema.anyOf) return "any of (see below)";
  if (schema.allOf) return "all of (see below)";

  const t = Array.isArray(schema.type) ? schema.type.join(" \\| ") : schema.type;
  if (t === "array") {
    const items = Array.isArray(schema.items) ? schema.items[0] : schema.items;
    if (items) return `array<${typeLabel(items)}>`;
    return "array";
  }
  if (schema.format) return `${t ?? "string"} (${schema.format})`;
  return t ?? "any";
}

/** Render constraint annotations (min/max, pattern, default) as a compact note. */
function constraintNote(schema: JsonSchema): string {
  const parts: string[] = [];
  if (schema.default !== undefined) parts.push(`default: \`${JSON.stringify(schema.default)}\``);
  if (schema.minimum !== undefined) parts.push(`min: ${schema.minimum}`);
  if (schema.maximum !== undefined) parts.push(`max: ${schema.maximum}`);
  if (schema.minLength !== undefined) parts.push(`minLength: ${schema.minLength}`);
  if (schema.maxLength !== undefined) parts.push(`maxLength: ${schema.maxLength}`);
  if (schema.pattern) parts.push(`pattern: \`${schema.pattern}\``);
  return parts.join(", ");
}

/**
 * Render a schema's properties as a Markdown table. Recurses one level into
 * nested objects / array-of-object items, emitting sub-tables under headings.
 */
function renderProperties(schema: JsonSchema, headingLevel: number, pathPrefix = ""): string {
  const lines: string[] = [];
  const required = new Set(schema.required ?? []);
  const props = schema.properties ?? {};

  if (Object.keys(props).length === 0) {
    if (schema.type === "array") {
      const items = Array.isArray(schema.items) ? schema.items[0] : schema.items;
      if (items && items.properties) {
        return renderProperties(items, headingLevel, pathPrefix);
      }
    }
    return "_No properties defined._\n";
  }

  lines.push("| Field | Type | Required | Description |");
  lines.push("|-------|------|----------|-------------|");

  const nested: Array<{ name: string; schema: JsonSchema }> = [];

  for (const [name, prop] of Object.entries(props)) {
    const req = required.has(name) ? "**yes**" : "no";
    let desc = prop.description ?? "";
    const note = constraintNote(prop);
    if (note) desc = desc ? `${desc} (${note})` : note;
    lines.push(`| \`${name}\` | ${typeLabel(prop)} | ${req} | ${desc} |`);

    // Queue nested object / array-of-object for a sub-table.
    if (prop.type === "object" && prop.properties) {
      nested.push({ name, schema: prop });
    } else if (prop.type === "array") {
      const items = Array.isArray(prop.items) ? prop.items[0] : prop.items;
      if (items && items.type === "object" && items.properties) {
        nested.push({ name: `${name}[]`, schema: items });
      }
    }
  }

  lines.push("");

  for (const { name, schema: ns } of nested) {
    const h = "#".repeat(Math.min(headingLevel, 6));
    const label = pathPrefix ? `${pathPrefix}.${name}` : name;
    lines.push(`${h} \`${label}\``);
    lines.push("");
    lines.push(renderProperties(ns, headingLevel + 1, label));
  }

  return lines.join("\n");
}

function readSchema(path: string): JsonSchema | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as JsonSchema;
  } catch (e) {
    console.error(`  ! failed to parse ${path}: ${(e as Error).message}`);
    return null;
  }
}

function renderSkillPage(skill: string, input: JsonSchema | null, output: JsonSchema | null): string {
  const title = (input?.title || output?.title || skill).replace(/ (Input|Output)$/i, "");
  const lines: string[] = [];
  lines.push("---");
  lines.push("layout: default");
  lines.push(`title: ${title}`);
  lines.push("parent: Skill schema reference");
  lines.push("---");
  lines.push("");
  lines.push(`# ${title}`);
  lines.push("");
  lines.push(`> Skill id: \`${skill}\``);
  lines.push("");
  lines.push("_Generated from JSON Schema — do not edit by hand. Run `bun run scripts/gen-schema-docs.ts`._");
  lines.push("");

  if (input) {
    lines.push("## Input");
    lines.push("");
    if (input.description) lines.push(input.description + "\n");
    lines.push(renderProperties(input, 3));
    lines.push("");
    lines.push(`[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/${skill}/input.schema.json)`);
    lines.push("");
  }

  if (output) {
    lines.push("## Output");
    lines.push("");
    if (output.description) lines.push(output.description + "\n");
    lines.push(renderProperties(output, 3));
    lines.push("");
    lines.push(`[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/${skill}/output.schema.json)`);
    lines.push("");
  }

  return lines.join("\n");
}

function main(): void {
  if (!existsSync(SKILLS_DIR)) {
    console.error(`Schema directory not found: ${SKILLS_DIR}`);
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const skills = readdirSync(SKILLS_DIR)
    .filter((d) => statSync(join(SKILLS_DIR, d)).isDirectory())
    .sort();

  const indexRows: string[] = [];

  for (const skill of skills) {
    const input = readSchema(join(SKILLS_DIR, skill, "input.schema.json"));
    const output = readSchema(join(SKILLS_DIR, skill, "output.schema.json"));
    if (!input && !output) {
      console.warn(`  - ${skill}: no schemas, skipping`);
      continue;
    }
    const page = renderSkillPage(skill, input, output);
    writeFileSync(join(OUT_DIR, `${skill}.md`), page);
    const title = (input?.title || output?.title || skill).replace(/ (Input|Output)$/i, "");
    const desc = (input?.description || output?.description || "").replace(/\|/g, "\\|");
    indexRows.push(`| [${title}](${skill}.html) | \`${skill}\` | ${desc} |`);
    console.log(`  ✓ ${skill}.md`);
  }

  // Index page
  const index: string[] = [];
  index.push("---");
  index.push("layout: default");
  index.push("title: Skill schema reference");
  index.push("nav_order: 6");
  index.push("has_children: true");
  index.push("---");
  index.push("");
  index.push("# Skill schema reference");
  index.push("");
  index.push("Every folio-assistant skill declares a typed **input** and **output** contract as");
  index.push("JSON Schema (draft-07). These pages are generated from those schemas so the");
  index.push("published reference can never drift from what the framework actually validates.");
  index.push("");
  index.push("| Skill | Id | Description |");
  index.push("|-------|----|-------------|");
  index.push(...indexRows);
  index.push("");
  index.push("See also the [TypeScript API reference](../../api/) for the content-object model");
  index.push("(`Block`, `Chapter`, `Paper`, builders, and runtime Zod constraints).");
  index.push("");
  writeFileSync(join(OUT_DIR, "index.md"), index.join("\n"));
  console.log(`  ✓ index.md (${indexRows.length} skills)`);
  console.log(`\nWrote schema docs to ${OUT_DIR}`);
}

main();
