#!/usr/bin/env bun
/**
 * Reconcile the specifications this repository depends on against what it
 * actually uses — and MATERIALIZE the operative vocabulary into the graph.
 *
 * Owner, 2026-09-20: *"if you import scheam (e.g DC, ingest it through the
 * proper pipline …)"*, *"(dont need to materalize, but should reference
 * specific version being used)"*, *"some schema that is operational should be
 * in KG"*, *"(materizlied through the tooling)"*.
 *
 * So: the SPECIFICATION is referenced, by edition. The TERMS WE BRANCH ON are
 * derived from the corpus by this tool and written into the record — never
 * hand-listed, because a hand-listed vocabulary is a transcription and drifts
 * from what the code does the first time somebody adds an element.
 *
 * Usage:
 *   bun run cat-harness/scripts/external-schemas.ts            # report
 *   bun run cat-harness/scripts/external-schemas.ts --write    # refresh terms
 *   bun run cat-harness/scripts/external-schemas.ts --check    # CI
 *
 * @module scripts/external-schemas
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  ExternalSchemaSchema,
  undeclaredNamespaces,
  unusedNamespaces,
  type ExternalSchema,
} from "../../folio-assistant-core/schemas/external-schema.js";

import { FOLIO_BPMN_NS, OWN_XML_NAMESPACES } from "../schemas/namespaces.js";
import { portableSegment } from "../schemas/portable-path";

const ROOT = resolve(import.meta.dir, "..");
const REGISTRY = join(ROOT, "external-schemas");

/** Every declared record, parsed — a malformed one fails here, not at use. */
export function loadSpecs(dir = REGISTRY): ExternalSchema[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ExternalSchemaSchema.parse(JSON.parse(readFileSync(join(dir, f), "utf-8"))));
}

/** XML namespaces the corpus declares, read from the files that declare them. */
export function namespacesInUse(root = ROOT): string[] {
  const out: string[] = [];
  const dir = join(root, "processes");
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".bpmn") || f.endsWith(".dmn"))) {
    const src = readFileSync(join(dir, f), "utf-8");
    for (const m of src.matchAll(/xmlns(?::[a-zA-Z0-9]+)?="([^"]+)"/g)) out.push(m[1]!);
  }
  return [...new Set(out)].sort();
}

/**
 * BPMN elements the corpus actually contains.
 *
 * Derived, per "materialized through the tooling". The alternative — listing
 * the dozen somebody remembers — goes stale the first time a diagram uses a
 * thirteenth, and goes stale silently.
 */
export function bpmnTermsInUse(root = ROOT): string[] {
  const dir = join(root, "processes");
  if (!existsSync(dir)) return [];
  const out = new Set<string>();
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".bpmn"))) {
    for (const m of readFileSync(join(dir, f), "utf-8").matchAll(/<(bpmn:[a-zA-Z]+)/g)) {
      out.add(m[1]!);
    }
  }
  return [...out].sort();
}

/** Dublin Core `schema.element[.qualifier]` terms the catalogue records use. */
export function dcTermsInUse(repoRoot = resolve(ROOT, "..")): string[] {
  const out = new Set<string>();
  for (const inst of readdirSync(repoRoot, { withFileTypes: true })) {
    if (!inst.isDirectory() || inst.name.startsWith(".")) continue;
    const dir = join(repoRoot, inst.name, "catalogue", "records");
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      const doc = JSON.parse(readFileSync(join(dir, f), "utf-8")) as {
        fields?: Array<{ schema: string; element: string; qualifier?: string }>;
      };
      for (const x of doc.fields ?? []) {
        out.add(`${x.schema}.${x.element}${x.qualifier ? `.${x.qualifier}` : ""}`);
      }
    }
  }
  return [...out].sort();
}

/** Which deriver feeds which record. Keyed by id so a record opts in. */
const DERIVERS: Record<string, () => string[]> = {
  "omg-bpmn-2.0": () => bpmnTermsInUse(),
  "dcmi-terms": () => dcTermsInUse(),
};

function run(argv: string[]): number {
  const write = argv.includes("--write");
  const check = argv.includes("--check");
  const specs = loadSpecs();

  if (specs.length === 0) {
    // Third state. An empty registry in a repo that plainly uses BPMN is not
    // a clean result; it is the defect this tool was written for.
    console.error("no external-schema records, yet this repository consumes external namespaces.");
    console.error("That is `could not determine`, not a pass.");
    return 2;
  }

  // ── OURS is not a specification we conform to ────────────────────────
  //
  // `namespacesInUse` reads every `xmlns` a diagram binds, and some of them
  // are namespaces this project MINTS. Asking the external registry about
  // those is a category error, and it was not a harmless one: the two
  // spellings of our own BPMN extension namespace (bean `0d99`) were reported
  // as two undeclared SPECIFICATIONS, so the finding told the reader to go and
  // write registry records for an IRI this project owns. A gate whose remedy
  // is wrong is worse than one that says nothing — somebody follows it.
  //
  // So the two questions are asked separately, because they have different
  // answers. An EXTERNAL namespace must have a record naming its edition. An
  // OWN namespace must be spelt exactly ONE way; there is no edition to pin,
  // and nothing external to conform to.
  const inUse = namespacesInUse();
  const own = inUse.filter((ns) => (OWN_XML_NAMESPACES as readonly string[]).includes(ns));
  const external = inUse.filter((ns) => !(OWN_XML_NAMESPACES as readonly string[]).includes(ns));
  const undeclared = undeclaredNamespaces(external, specs);
  const unused = unusedNamespaces(external, specs);

  // Drift, not absence: an XML namespace is compared by STRING, so a second
  // spelling means a consumer matching on the first skips every element in the
  // second — silently, and while parsing without error.
  const drifted = own.filter((ns) => ns !== FOLIO_BPMN_NS);

  let stale = 0;
  for (const s of specs) {
    const derive = DERIVERS[s.id];
    if (!derive) continue;
    const found = derive();
    const have = new Set(s.terms.map((t) => t.term));
    const missing = found.filter((t) => !have.has(t));
    const gone = [...have].filter((t) => !found.includes(t));
    if (missing.length === 0 && gone.length === 0) continue;
    stale++;
    console.log(`${s.id}: ${missing.length} new term(s), ${gone.length} no longer used`);
    for (const t of missing.slice(0, 6)) console.log(`    + ${t}`);
    for (const t of gone.slice(0, 6)) console.log(`    - ${t}`);
    if (write) {
      // Kept reasons for terms that survive; a new term gets a placeholder
      // the author replaces. NOT invented prose: "derived, not yet described"
      // is honest and greppable, and a plausible-sounding invention is not.
      const prior = new Map(s.terms.map((t) => [t.term, t.operative]));
      s.terms = found.map((term) => ({
        term,
        operative: prior.get(term) ?? "derived from the corpus; what this repository does with it is not yet described",
      }));
      // A specification id is an identifier, not a filename. Safe on the read
      // side — `loadSpecs` walks the directory rather than composing a name —
      // so encoding only the writer cannot split the two apart.
      writeFileSync(join(REGISTRY, `${portableSegment(s.id)}.json`), JSON.stringify(s, null, 2) + "\n");
    }
  }

  console.log(`\n${specs.length} specification(s) referenced:`);
  for (const s of specs) {
    console.log(`  ${s.authority.padEnd(5)} ${s.title} ${s.version}  (${s.use}, ${s.terms.length} operative term(s))`);
  }

  if (undeclared.length > 0) {
    console.error(`\n✗ ${undeclared.length} namespace(s) in use that no record declares:`);
    for (const ns of undeclared) console.error(`    ${ns}`);
    console.error("  Conforming to a specification nobody named is the defect this registry ends.");
  }
  if (unused.length > 0) {
    console.log(`\n· ${unused.length} declared namespace(s) nothing uses — a record outliving its dependency:`);
    for (const ns of unused) console.log(`    ${ns}`);
  }

  if (drifted.length > 0) {
    console.error(`\n✗ our OWN namespace is spelt ${drifted.length + 1} ways, not one:`);
    console.error(`    ${FOLIO_BPMN_NS}   (canonical — schemas/namespaces.ts)`);
    for (const ns of drifted) console.error(`    ${ns}   ✗`);
    console.error("  Rebind every `xmlns:folio` to the canonical IRI. This is not cosmetic:");
    console.error("  an extension element under the other IRI is invisible to a consumer");
    console.error("  matching on this one, and the file still parses.");
  }

  if (check && (undeclared.length > 0 || drifted.length > 0 || stale > 0)) {
    if (stale > 0) console.error(`\n✗ ${stale} record(s) have stale operative terms. Run with --write and commit.`);
    return 1;
  }
  if (undeclared.length > 0 || drifted.length > 0) return 1;
  console.log(
    `\n✓ ${external.length} external namespace(s) declared with their edition; ` +
      `${own.length} own namespace(s), one spelling each`,
  );
  return 0;
}

if (import.meta.main) process.exit(run(process.argv.slice(2)));
