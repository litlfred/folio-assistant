#!/usr/bin/env bun
/**
 * Publish the declaration's JSON Schema at a dereferenceable `$id`.
 *
 * The other half of a self-describing graph. `<stub>.jsonld` says what this
 * instance contains; this says what a declaration *is*, and lives at the URL
 * its own `$id` names — so a consumer holding an `harness.json` it does
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
 * @covers schemas, cat-harness
 */
import { writeFileSync, mkdirSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { namedJsonSchema, toJsonSchema } from "../schemas/to-json-schema.ts";

import { CatHarnessDeclarationSchema, artefactStub, readDeclaration, renderingPath, repoRootFor } from "../schemas/cat-harness.js";
import { tools } from "../tools/discover.js";
import { ToolDefinitionSchema } from "../schemas/tool.js";
import { TOOL_TYPES } from "../schemas/tool-types.js";
import { stagingFields } from "./staging-stamp.js";
import { instanceDirectoryForGraph } from "../schemas/cat-harness.js";

/**
 * THIS INSTANCE'S OWN `schemas` directory, or the convention.
 *
 * declared-path-literal: the fallback is at the call site so the choice is
 * visible. `schemas/` declares TWO graphs — it is a knowledge-graph node AND
 * the schema definitions — which is why the `schemas` one is asked for by name
 * rather than being handed a single-home guess.
 *
 * `instanceDirectoryForGraph`, not `directoriesForGraph(...)[0]`, because every use
 * below composes a path INSIDE this directory. The question is "where is MY
 * schemas directory", not "who declares schemas" — and from the `cat-harness`
 * root those have different answers: measured 2026-09-20, `schemas` resolves
 * to FOUR homes (`cat-harness/`, `folio-assistant-core/`, `large-datasets/`,
 * `detangle/`), three of them arriving through the dependency overlay and
 * belonging to somebody else. `[0]` was right only because the resolver
 * happens to order the root's own declarations first; a reordering would have
 * sent this generator's output into another checkout, silently. Bean `a02m`.
 */
function schemasRoot(root: string): string {
  return instanceDirectoryForGraph(root, "schemas") ?? join(root, "schemas");
}


const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export interface SchemaExportOptions {
  baseUrl?: string;
}

export function buildDeclarationSchema(opts: SchemaExportOptions = {}): Record<string, unknown> {
  const decl = readDeclaration(ROOT);
  const pkg = JSON.parse(readFileSync(join(repoRootFor(ROOT), "package.json"), "utf-8")) as { name?: string };
  const stub = decl ? artefactStub(decl) : (pkg.name ?? "instance");
  const base = (opts.baseUrl ?? decl?.canonicalUrl ?? "").replace(/\/+$/, "");

  const schema = namedJsonSchema(CatHarnessDeclarationSchema, "CatHarnessDeclaration");

  return {
    ...schema,
    // Absolute or absent — never relative. See the module note.
    ...(base ? { $id: renderingPath(base, `${stub}.schema.json`) } : {}),
    title: "CatHarness declaration",
    description:
      "The root declaration every instance carries as `<name>.json`: what it is called, " +
      "where it publishes, and which directories it scans for which kind of graph. " +
      "Generated from `CatHarnessDeclarationSchema` in schemas/cat-harness.ts, which is authoritative.",
    ...(base ? { $comment: `Instance graph: ${renderingPath(base, `${stub}.jsonld`)}` } : {}),
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
    defs[name] = toJsonSchema(schema);
  }
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    ...(base ? { $id: renderingPath(base, "tool-types.schema.json") } : {}),
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
  const schema = namedJsonSchema(ToolDefinitionSchema, "ToolDefinition");
  return {
    ...schema,
    ...(base ? { $id: renderingPath(base, "tool.schema.json") } : {}),
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
  return renderingPath(base, "skills", skill, `${io}.schema.json`);
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
  const dir = join(schemasRoot(ROOT), "skills");
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

/**
 * Rewrite each source file's stored `$id` to where it actually publishes.
 *
 * **This existed only as a sentence until 2026-09-19.** `--check` printed
 * "Run `bun run kg:schema` to rewrite them", and `kg:schema` writes `_kg/` —
 * build output — leaving the committed sources untouched. So the one remedy
 * the gate named did not perform it, and the only way past a legitimate
 * relocation was to hand-edit 44 identities: precisely the act the gate exists
 * to catch. Found by moving the renderings off `kg/`, which made all 44 stale
 * at once.
 *
 * **It writes the `$id` and nothing else.** The source is authoritative for its
 * content; only the identity is computed. Keys keep their order because the
 * object is rebuilt from the parsed file with `$id` replaced in place, so the
 * diff is one line per file and reviewable as such.
 *
 * Separate from `--check` on the repo's own rule: a check that writes can pass
 * by fixing what it was asked to report.
 */
/**
 * How a Tool node spells "produced by this command".
 *
 * A literal, in the file that IS the command — the one place where naming it is
 * not a second declaration of somebody else's fact. A node claiming an artefact
 * this script writes carries exactly this string in `invoke.shell`, which is the
 * link `artefactDeclarationDrift` follows.
 */
const SELF_INVOCATION = "bun run kg:schema";

/**
 * Artefacts a Tool node declares itself authoritative for, by published path.
 *
 * Reads `maintains` off the `tools` graph — see {@link ToolMaintainsSchema} in
 * `schemas/tool.ts`. The base is irrelevant here: the comparison is on the
 * path relative to the instance base, which is what the declaration carries.
 */
export function declaredArtefacts(): Map<string, { tool: string; source: string; producedBy?: string }> {
  const out = new Map<string, { tool: string; source: string; producedBy?: string }>();
  // `tools()` with no argument, so the I/O type IRIs are minted against the
  // DECLARED base. Passing `""` makes them relative and `defineTool` refuses
  // the node — correctly: a Tool whose schema refs do not dereference is not a
  // Tool anyone can use. The base is irrelevant to the comparison below, which
  // is on the artefact path relative to it, but the node still has to be valid
  // to be read at all.
  for (const t of tools()) {
    for (const m of t.maintains ?? []) {
      // `producedBy` is the declaring Tool's own invocation, carried through so
      // the reconciliation below can tell which artefacts THIS command is
      // answerable for. See `artefactDeclarationDrift`.
      out.set(m.artefact, { tool: t.id, source: m.source, producedBy: t.invoke.shell });
    }
  }
  return out;
}

/**
 * Where the declared relation and the produced files disagree.
 *
 * **Both directions, because one is half a guarantee.** `undeclared` catches a
 * new artefact nobody added a Tool node for — which is how the relation drifts
 * back into this script's local array, where it lived until 2026-09-19.
 * `unproduced` catches a declaration that rotted: a Tool still claiming an
 * artefact this instance no longer writes, which a consumer of the published
 * graph would follow to a 404.
 *
 * `missingSource` is the third finding and a different failure again: the
 * declaration names a module that is not in the tree. That is not "the artefact
 * is wrong" — the artefact may be perfectly correct — it is the PROVENANCE
 * being unfollowable, and the remedy is the opposite (fix the path, not the
 * build).
 *
 * ## `unproduced` is scoped to what THIS command writes, and that is a narrowing
 *
 * It was not, until 2026-09-20. `maintains` says a Tool is authoritative for a
 * published artefact; it never said the artefact is produced by the schema
 * exporter. The three original carriers all happened to be, so the check was
 * written against that coincidence and reported the first counterexample as
 * drift: `ns-vocabulary` and `content-context` maintain `ns/vocabulary.jsonld`
 * and `ns/content/v1.jsonld`, which `.github/workflows/docs-site.yml` publishes
 * — both declarations true, both flagged.
 *
 * So the comparison now runs only over artefacts whose declaring Tool invokes
 * this command. That keeps the rot guarantee exactly where this script can
 * honour it and stops it claiming one it cannot: this script has no way to know
 * whether the site build wrote a file into `_site/`, and a check that answers a
 * question it cannot see is worse than one that declines to.
 *
 * **Coverage of the others is therefore now absent HERE, not merely narrower** —
 * an artefact maintained by some other producer can rot to a 404 and nothing in
 * this script notices. That was the honest cost of the narrowing, and it is now
 * paid: `scripts/check-maintained-artefacts.ts` asks the same question where the
 * answer exists, against the assembled `_site/` rather than against this script's
 * output, and treats an unbuilt tree as could-not-determine rather than as a pass.
 * Bean `6f1x`.
 *
 * `undeclared` is unchanged and still runs over everything produced: a file this
 * command writes with no Tool declaring it is the drift that put this relation
 * in a local array until 2026-09-19, and that direction needs no scoping.
 */
export function artefactDeclarationDrift(produced: readonly string[]): {
  undeclared: string[];
  unproduced: Array<{ artefact: string; tool: string }>;
  missingSource: Array<{ artefact: string; tool: string; source: string }>;
} {
  const declared = declaredArtefacts();
  const producedSet = new Set(produced);
  const undeclared = produced.filter((a) => !declared.has(a)).sort();
  const unproduced: Array<{ artefact: string; tool: string }> = [];
  const missingSource: Array<{ artefact: string; tool: string; source: string }> = [];
  for (const [artefact, d] of declared) {
    // Only this command's own artefacts: see the note above on the narrowing.
    if (d.producedBy === SELF_INVOCATION && !producedSet.has(artefact)) {
      unproduced.push({ artefact, tool: d.tool });
    }
    if (!existsSync(join(ROOT, d.source))) {
      missingSource.push({ artefact, tool: d.tool, source: d.source });
    }
  }
  return {
    undeclared,
    unproduced: unproduced.sort((a, b) => a.artefact.localeCompare(b.artefact)),
    missingSource: missingSource.sort((a, b) => a.artefact.localeCompare(b.artefact)),
  };
}

export function writeSkillIoIds(opts: SchemaExportOptions = {}): string[] {
  const written: string[] = [];
  for (const { source, stored, expected } of staleSkillIoIds(opts)) {
    const abs = join(ROOT, source);
    const doc = JSON.parse(readFileSync(abs, "utf-8")) as Record<string, unknown>;
    if (stored === "(none)" && !("$id" in doc)) {
      // A file with no `$id` at all: put it FIRST, which is where every other
      // one carries it and where a reader looks for a document's identity.
      writeFileSync(abs, JSON.stringify({ $id: expected, ...doc }, null, 2) + "\n");
    } else {
      doc.$id = expected;
      writeFileSync(abs, JSON.stringify(doc, null, 2) + "\n");
    }
    written.push(source);
  }
  return written;
}

/**
 * The schema documents this instance publishes, and their published names.
 *
 * Extracted so `--check` and the write path read the SAME list. It was a local
 * array inside the write branch, which meant the drift check below could only
 * have compared the declaration against a second copy of it — two answers to
 * "what does this instance produce", which is the defect the declaration
 * exists to remove.
 *
 * Instance artefact takes the instance's name; vocabulary documents take the
 * vocabulary's. See `buildToolTypes`.
 */
export function schemaFiles(stub: string, baseUrl?: string): Array<[string, Record<string, unknown>]> {
  return [
    [`${stub}.schema.json`, buildDeclarationSchema({ baseUrl })],
    ["tool.schema.json", buildToolSchema({ baseUrl })],
    ["tool-types.schema.json", buildToolTypes({ baseUrl })],
  ];
}

if (import.meta.main) {
  const arg = (f: string): string | undefined => {
    const i = process.argv.indexOf(f);
    return i !== -1 ? process.argv[i + 1] : undefined;
  };
  const baseUrl = arg("--base-url") ?? process.env.KG_BASE_URL;
  const decl = readDeclaration(ROOT);
  const pkg = JSON.parse(readFileSync(join(repoRootFor(ROOT), "package.json"), "utf-8")) as { name?: string };
  const stub = decl ? artefactStub(decl) : (pkg.name ?? "instance");

  // `--check` VERIFIES AND WRITES NOTHING.
  //
  // A check that writes is a check that can pass by fixing the thing it was
  // asked to report. It would also mean CI's verification step mutating the
  // tree it is verifying, which makes a later "the tree is clean" assertion
  // meaningless. So the two modes are exclusive and the check runs first.
  if (process.argv.includes("--write-ids")) {
    const written = writeSkillIoIds();
    if (written.length === 0) console.log("✓ every skill I/O $id already matches its published location");
    else {
      console.log(`Rewrote ${written.length} skill I/O $id(s):`);
      for (const w of written) console.log(`  ${w}`);
    }
    process.exit(0);
  }

  if (process.argv.includes("--check")) {
    // Deliberately against the DECLARED base, not `--base-url`: a source `$id`
    // is always canonical. A preview overrides the base at export time only —
    // `feature-staging.yml` passes its own — and checking a staging build's
    // base against the committed files would report all 44 as stale on every
    // branch build.
    // The DECLARED relation, checked both ways. See `artefactDeclarationDrift`.
    const drift = artefactDeclarationDrift(schemaFiles(stub).map(([n]) => n));
    if (drift.undeclared.length + drift.unproduced.length + drift.missingSource.length > 0) {
      console.error("the `maintains` declaration and the produced schemas disagree:");
      for (const a of drift.undeclared) {
        console.error(`  ✗ ${a}\n      produced, but no Tool node declares it. Add a \`maintains\` entry in tools/index.ts.`);
      }
      for (const u of drift.unproduced) {
        console.error(`  ✗ ${u.artefact}\n      declared by Tool "${u.tool}", but this instance does not produce it.`);
      }
      for (const m of drift.missingSource) {
        console.error(`  ✗ ${m.artefact}\n      Tool "${m.tool}" names source ${m.source}, which is not in the tree.`);
      }
      process.exit(1);
    }

    const stale = staleSkillIoIds();
    if (stale.length > 0) {
      console.error(`${stale.length} skill I/O schema(s) carry an $id that is not where they publish:`);
      for (const b of stale) console.error(`  ✗ ${b.source}\n      stored   ${b.stored}\n      expected ${b.expected}`);
      console.error("\nRun `bun run kg:schema:ids` to rewrite them.");
      process.exit(1);
    }
    const n = buildSkillIoContracts().length;
    console.log(`✓ every skill I/O $id matches its published location (${n} contract(s))`);
    console.log(`✓ every published schema is declared by a Tool node (${declaredArtefacts().size} maintained)`);
    process.exit(0);
  }

  // `_kg/` is a REPOSITORY build output — gitignored at the repository root,
  // beside `node_modules/`, `_site/` and `test-results/`, and read from there
  // by the e2e specs and `test-server.mjs`, both of which run at that root.
  // `ROOT` became the INSTANCE root with the move (bean `wggr`), so this
  // default started writing `cat-harness/_kg/` while every reader still looked
  // one level up — and the stale pre-move copy at the old path made it look
  // fine locally.
const outDir = arg("--out-dir") ?? join(repoRootFor(ROOT), "_kg");
  mkdirSync(outDir, { recursive: true });

  // Which build wrote these. Stamped at WRITE time, not in the builders: the
  // `build*` functions describe what a declaration IS, which is the same answer
  // in every run, and folding a run id into them would make two calls in one
  // process return documents that differ. See `scripts/staging-stamp.ts` for
  // why it is absent rather than fabricated outside CI.
  //
  // JSON Schema draft-07 ignores keywords it does not know, so this is inert
  // for validation and readable for a human — the same trade the JSON-LD export
  // makes, and it is why both use the one key.
  const staging = stagingFields();

  const files = schemaFiles(stub, baseUrl);
  for (const [name, schema] of files) {
    const out = join(outDir, name);
    writeFileSync(out, JSON.stringify({ ...schema, ...staging }, null, 2) + "\n");
    console.log(`${relative(ROOT, out)}`);
    console.log(`  $id  ${schema.$id ?? "(none — no canonicalUrl declared)"}`);
  }

  // The per-skill I/O contracts, published at the `$id` each one claims.
  const contracts = buildSkillIoContracts({ baseUrl });
  for (const c of contracts) {
    const out = join(outDir, c.published);
    mkdirSync(dirname(out), { recursive: true });
    // The contracts are stamped too. They are the artefacts a Tool node's
    // `io.*.schema` dereferences to, so "which build is this contract from" is
    // the question with the most riding on it, not the least.
    writeFileSync(out, JSON.stringify({ ...c.schema, ...staging }, null, 2) + "\n");
  }
  if (contracts.length > 0) {
    console.log(
      `${relative(ROOT, join(outDir, "skills"))}/  ` +
        `(${contracts.length} contract(s) across ${new Set(contracts.map((c) => c.skill)).size} skill(s))`,
    );
    console.log(`  $id  ${contracts[0].schema.$id ?? "(none — no canonicalUrl declared)"}  …`);
  }
}
