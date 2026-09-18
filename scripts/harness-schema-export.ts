#!/usr/bin/env bun
/**
 * Publish the declaration's JSON Schema at a dereferenceable `$id`.
 *
 * The other half of a self-describing graph. `<stub>.jsonld` says what this
 * instance contains; this says what a declaration *is*, and lives at the URL
 * its own `$id` names — so a consumer holding an `cat-harness.json` it does
 * not understand has somewhere to go.
 *
 * ## The trick, from `WorldHealthOrganization/smart-base`
 *
 * `generate_logical_model_schemas.py` mints `$id` as
 * `{schema_base_url}/StructureDefinition-{model}.schema.json` — the URL the
 * file is actually served from — and `generate_dak_api_hub.py` then renders
 * each schema as browsable HTML at that address. The schema is not merely
 * *described* somewhere; it **is** its own documentation endpoint.
 *
 * Copied here with one deliberate difference. smart-base derives its schemas
 * from FHIR StructureDefinitions; ours derive from Zod, because
 * `directory-conventions` §"What lives in the `schemas` graph" settled that
 * the `.ts` is authoritative and every other form is generated. So this is a
 * third rendering of `CatHarnessDeclarationSchema`, beside the JSON-LD — not
 * a second authority.
 *
 * ## Why `$id` must be absolute or absent
 *
 * A relative `$id` is legal and useless: `$ref` resolution against it depends
 * on where the fetcher happened to get the file, so two consumers can resolve
 * the same schema differently. When no `canonicalUrl` is declared this writes
 * **no** `$id` rather than a plausible-looking relative one — the same rule
 * `kg-export` follows for `@id`, and for the same reason.
 *
 * @module scripts/harness-schema-export
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { zodToJsonSchema } from "zod-to-json-schema";

import { CatHarnessDeclarationSchema, artefactStub, readDeclaration } from "../schemas/cat-harness.js";
import { ToolDefinitionSchema } from "../schemas/tool.js";
import { TOOL_TYPES } from "../schemas/tool-types.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export interface SchemaExportOptions {
  baseUrl?: string;
}

export function buildDeclarationSchema(opts: SchemaExportOptions = {}): Record<string, unknown> {
  const decl = readDeclaration(ROOT);
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8")) as { name?: string };
  const stub = decl ? artefactStub(decl) : (pkg.name ?? "instance");
  const base = (opts.baseUrl ?? decl?.canonicalUrl ?? "").replace(/\/+$/, "");

  const schema = zodToJsonSchema(CatHarnessDeclarationSchema, {
    name: "CatHarnessDeclaration",
    $refStrategy: "none",
  }) as Record<string, unknown>;

  return {
    ...schema,
    // Absolute or absent — never relative. See the module note.
    ...(base ? { $id: `${base}/kg/${stub}.schema.json` } : {}),
    title: "CatHarness declaration",
    description:
      "The root declaration every instance carries as `cat-harness.json`: what it is called, " +
      "where it publishes, and which directories it scans for which kind of graph. " +
      "Generated from `CatHarnessDeclarationSchema` in schemas/cat-harness.ts, which is authoritative.",
    ...(base ? { $comment: `Instance graph: ${base}/kg/${stub}.jsonld` } : {}),
  };
}

/**
 * The shared I/O type vocabulary Tool ports reference, as one `$defs` document.
 *
 * Named for what it DEFINES (`tool-types.schema.json`), not for the instance —
 * unlike `<stub>.schema.json`. The rule: an instance artefact takes the
 * instance's name; a vocabulary document takes the vocabulary's, because the
 * same vocabulary means the same thing in every instance and renaming it per
 * repo would make two copies of one type look like two types.
 */
export function buildToolTypes(opts: SchemaExportOptions = {}): Record<string, unknown> {
  const decl = readDeclaration(ROOT);
  const base = (opts.baseUrl ?? decl?.canonicalUrl ?? "").replace(/\/+$/, "");
  const defs: Record<string, unknown> = {};
  for (const [name, schema] of Object.entries(TOOL_TYPES)) {
    defs[name] = zodToJsonSchema(schema, { $refStrategy: "none" });
  }
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    ...(base ? { $id: `${base}/kg/tool-types.schema.json` } : {}),
    title: "Tool I/O types",
    description:
      "The shared types a Tool's io.inputs/io.outputs reference by absolute IRI. " +
      "Generated from schemas/tool-types.ts, which is authoritative.",
    $defs: defs,
  };
}

/** What a Tool node is. Generated from `ToolDefinitionSchema`. */
export function buildToolSchema(opts: SchemaExportOptions = {}): Record<string, unknown> {
  const decl = readDeclaration(ROOT);
  const base = (opts.baseUrl ?? decl?.canonicalUrl ?? "").replace(/\/+$/, "");
  const schema = zodToJsonSchema(ToolDefinitionSchema, {
    name: "ToolDefinition",
    $refStrategy: "none",
  }) as Record<string, unknown>;
  return {
    ...schema,
    ...(base ? { $id: `${base}/kg/tool.schema.json` } : {}),
    title: "Tool definition",
    description:
      "One concrete way to exercise a skill. A skill states a capability generically; " +
      "a Tool names the skills it satisfies and how to install and invoke it. " +
      "Generated from schemas/tool.ts, which is authoritative.",
  };
}

if (import.meta.main) {
  const arg = (f: string): string | undefined => {
    const i = process.argv.indexOf(f);
    return i !== -1 ? process.argv[i + 1] : undefined;
  };
  const baseUrl = arg("--base-url") ?? process.env.KG_BASE_URL;
  const decl = readDeclaration(ROOT);
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8")) as { name?: string };
  const stub = decl ? artefactStub(decl) : (pkg.name ?? "instance");

  const outDir = arg("--out-dir") ?? join(ROOT, "_kg");
  mkdirSync(outDir, { recursive: true });

  // Instance artefact takes the instance's name; vocabulary documents take
  // the vocabulary's. See buildToolTypes.
  const files: Array<[string, Record<string, unknown>]> = [
    [`${stub}.schema.json`, buildDeclarationSchema({ baseUrl })],
    ["tool.schema.json", buildToolSchema({ baseUrl })],
    ["tool-types.schema.json", buildToolTypes({ baseUrl })],
  ];
  for (const [name, schema] of files) {
    const out = join(outDir, name);
    writeFileSync(out, JSON.stringify(schema, null, 2) + "\n");
    console.log(`${relative(ROOT, out)}`);
    console.log(`  $id  ${schema.$id ?? "(none — no canonicalUrl declared)"}`);
  }
}
