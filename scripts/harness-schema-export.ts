#!/usr/bin/env bun
/**
 * Publish the declaration's JSON Schema at a dereferenceable `$id`.
 *
 * The other half of a self-describing graph. `<stub>.jsonld` says what this
 * instance contains; this says what a declaration *is*, and lives at the URL
 * its own `$id` names — so a consumer holding an `agent-harness.json` it does
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
 * third rendering of `AgentHarnessDeclarationSchema`, beside the JSON-LD — not
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
import { writeFileSync, mkdirSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { zodToJsonSchema } from "zod-to-json-schema";

import { AgentHarnessDeclarationSchema, artefactStub, readDeclaration } from "../schemas/agent-harness.js";
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

  const schema = zodToJsonSchema(AgentHarnessDeclarationSchema, {
    name: "AgentHarnessDeclaration",
    $refStrategy: "none",
  }) as Record<string, unknown>;

  return {
    ...schema,
    // Absolute or absent — never relative. See the module note.
    ...(base ? { $id: `${base}/kg/${stub}.schema.json` } : {}),
    title: "AgentHarness declaration",
    description:
      "The root declaration every instance carries as `agent-harness.json`: what it is called, " +
      "where it publishes, and which directories it scans for which kind of graph. " +
      "Generated from `AgentHarnessDeclarationSchema` in schemas/agent-harness.ts, which is authoritative.",
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

/**
 * Where a skill's I/O contract is published, and therefore what its `$id` is.
 *
 * **One function, so an `$id` is never hand-written.** Measured on `main` at
 * 2026-09-18: all 44 files under `schemas/skills/` carried
 * `https://github.com/litlfred/folio-assistant/schemas/skills/<skill>/<io>.schema.json`,
 * which **does not resolve** — a fetch returns 403, because GitHub's browse
 * route needs `/blob/<ref>/` and that segment was never there. Nor were the
 * files served from anywhere else: `_kg/` held only the three documents this
 * script already emitted.
 *
 * That is the same defect `AGENTS.md` records for the README's chapter table —
 * a link COMPOSED by convention and checked against nothing — repeated one
 * layer down, and it matters more here. `schemas/tool.ts` requires a Tool's
 * `io.*.schema` to be an absolute IRI precisely so "the types it names have to
 * exist somewhere fetchable"; a Tool node pointing at a 403 would satisfy the
 * schema and mean nothing. So the contracts had to become fetchable before a
 * single Tool could be written against one.
 *
 * `gen-schema-docs.ts` was already emitting a CORRECT `/blob/main/` link for
 * the same file, which is why nobody noticed: the documentation link worked
 * while the identity did not, and nothing had ever dereferenced an `$id`.
 */
export function skillIoIri(base: string, skill: string, io: string): string {
  return `${base.replace(/\/+$/, "")}/kg/skills/${skill}/${io}.schema.json`;
}

/** One skill I/O contract, as found on disk. */
export interface SkillIoContract {
  skill: string;
  /** `input` or `output` — the file stem before `.schema.json`. */
  io: string;
  /** Repo-relative source path. */
  source: string;
  /** Published path under the output directory. */
  published: string;
  schema: Record<string, unknown>;
}

/**
 * Every `schemas/skills/<skill>/<io>.schema.json`, with `$id` minted.
 *
 * The source files are authoritative for their *content*; the `$id` is
 * **computed** from the declared `canonicalUrl` and overwritten here rather
 * than trusted from the file. A hand-written identity is a string nothing
 * checks, which is exactly how 44 of them came to be dead at once.
 */
export function buildSkillIoContracts(opts: SchemaExportOptions = {}): SkillIoContract[] {
  const decl = readDeclaration(ROOT);
  const base = (opts.baseUrl ?? decl?.canonicalUrl ?? "").replace(/\/+$/, "");
  const dir = join(ROOT, "schemas", "skills");
  if (!existsSync(dir)) return [];

  const out: SkillIoContract[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    for (const f of readdirSync(join(dir, e.name))) {
      if (!f.endsWith(".schema.json")) continue;
      const io = f.slice(0, -".schema.json".length);
      const source = join("schemas", "skills", e.name, f);
      const schema = JSON.parse(readFileSync(join(ROOT, source), "utf-8")) as Record<string, unknown>;
      out.push({
        skill: e.name,
        io,
        source,
        published: join("skills", e.name, f),
        schema: {
          ...schema,
          // Absolute or absent, never relative and never composed by hand.
          // Same rule the three documents above follow.
          ...(base ? { $id: skillIoIri(base, e.name, io) } : {}),
        },
      });
    }
  }
  return out.sort((a, b) => a.source.localeCompare(b.source));
}

/**
 * Source files whose stored `$id` disagrees with where they are published.
 *
 * Reported rather than silently corrected on export, because a mismatch means
 * somebody hand-edited an identity — and a generator that quietly papers over
 * that is how the next 44 go bad without anyone seeing it.
 */
export function staleSkillIoIds(opts: SchemaExportOptions = {}): Array<{ source: string; stored: string; expected: string }> {
  const bad: Array<{ source: string; stored: string; expected: string }> = [];
  for (const c of buildSkillIoContracts(opts)) {
    const expected = c.schema.$id as string | undefined;
    if (expected === undefined) continue; // No canonicalUrl declared — nothing to check against.
    const stored = JSON.parse(readFileSync(join(ROOT, c.source), "utf-8")).$id as string | undefined;
    if (stored !== expected) bad.push({ source: c.source, stored: stored ?? "(none)", expected });
  }
  return bad;
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

  // `--check` VERIFIES AND WRITES NOTHING.
  //
  // A check that writes is a check that can pass by fixing the thing it was
  // asked to report. It would also mean CI's verification step mutating the
  // tree it is verifying, which makes a later "the tree is clean" assertion
  // meaningless. So the two modes are exclusive and the check runs first.
  if (process.argv.includes("--check")) {
    // Deliberately against the DECLARED base, not `--base-url`: a source `$id`
    // is always canonical. A preview overrides the base at export time only —
    // `feature-staging.yml` passes its own — and checking a staging build's
    // base against the committed files would report all 44 as stale on every
    // branch build.
    const stale = staleSkillIoIds();
    if (stale.length > 0) {
      console.error(`${stale.length} skill I/O schema(s) carry an $id that is not where they publish:`);
      for (const b of stale) console.error(`  ✗ ${b.source}\n      stored   ${b.stored}\n      expected ${b.expected}`);
      console.error("\nRun `bun run kg:schema` to rewrite them.");
      process.exit(1);
    }
    const n = buildSkillIoContracts().length;
    console.log(`✓ every skill I/O $id matches its published location (${n} contract(s))`);
    process.exit(0);
  }

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

  // The per-skill I/O contracts, published at the `$id` each one claims.
  const contracts = buildSkillIoContracts({ baseUrl });
  for (const c of contracts) {
    const out = join(outDir, c.published);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(c.schema, null, 2) + "\n");
  }
  if (contracts.length > 0) {
    console.log(
      `${relative(ROOT, join(outDir, "skills"))}/  ` +
        `(${contracts.length} contract(s) across ${new Set(contracts.map((c) => c.skill)).size} skill(s))`,
    );
    console.log(`  $id  ${contracts[0].schema.$id ?? "(none — no canonicalUrl declared)"}  …`);
  }
}
