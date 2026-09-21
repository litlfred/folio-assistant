#!/usr/bin/env bun
/**
 * Validate every committed FHIR IG artefact index against its schema.
 *
 * @module scripts/check-artifact-index
 *
 * ## Why this exists beside `ingest:ig:check`
 *
 * They answer different questions, and only one of them can be asked in CI.
 *
 * `ingest:ig:check` re-derives an index from the IG's published output and
 * fails if the committed copy differs. That is the stronger check and it needs
 * the source — smart-trust's `gh-pages` is 342,656 files — which no CI runner
 * here carries. Exempted from the gate set for that reason, with the exemption
 * written down in `gates.ts` rather than left as a silence.
 *
 * This one needs nothing but the repository. It asks whether each committed
 * index is a VALID `folio-fhir-artifact-index/v1` document: schema-conformant,
 * `count` agreeing with `artifacts.length`, keys unique, no DAK overlay on an
 * index that declares `dakApi: "absent"`.
 *
 * That is not the whole of what `ingest:ig:check` would catch, and this file
 * does not pretend otherwise. What it does catch is the failure that is
 * actually likely: a hand-edit. `smart-trust/AGENTS.md` says nothing under the
 * graph is authored, and a gate is how that stops being a request.
 *
 * ## Three outcomes
 *
 * Finding no index is **not** a pass. A repository that declares no
 * `fhir-artifact-index` graph has nothing to check and says so; a scan that
 * silently returned zero would read exactly like a clean run, which is the
 * shape this repository has paid for twice (`dh4f`, `xom7`).
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { FhirArtifactIndexSchema, materializationCensus } from "../../folio-assistant-core/schemas/fhir-artifact-index.js";
import { declarationPathIn, repoRootFor } from "../schemas/cat-harness.js";

const ROOT = repoRootFor(join(import.meta.dir, ".."));

/**
 * Every `fhir-artifact-index/index.json` under an instance.
 *
 * Found by walking the repository's top level for a `harness.json` that
 * declares a directory holding the `fhir-artifact-index` graph — resolved from
 * the DECLARATION, never from a hardcoded path, so relocating an instance does
 * not silently take it out of the scan.
 */
function declaredIndexes(): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(ROOT).sort()) {
    if (!statSync(join(ROOT, entry)).isDirectory()) continue;
    // RESOLVED, never composed: since #695 an instance declares itself in
    // `<name>.config.json`, so there is no single filename to join. Composing
    // one is how a reader stops seeing every instance the moment the
    // convention moves — which is exactly what this scan must not do.
    const decl = declarationPathIn(join(ROOT, entry));
    if (decl === undefined) continue;
    let parsed: { directories?: Array<{ path?: string; graphKinds?: string[] }> };
    try {
      parsed = JSON.parse(readFileSync(decl, "utf8"));
    } catch {
      console.error(`✗ ${decl.slice(ROOT.length + 1)} is not readable JSON — that is a failure, not a skip`);
      process.exitCode = 1;
      continue;
    }
    for (const d of parsed.directories ?? []) {
      if (!d.graphKinds?.includes("fhir-artifact-index") || !d.path) continue;
      out.push(join(ROOT, entry, d.path, "index.json"));
    }
  }
  return out;
}

const indexes = declaredIndexes();

if (indexes.length === 0) {
  console.log("? no instance declares a `fhir-artifact-index` graph — nothing to check.");
  console.log("  This is NOT a pass over indexes that exist; it is an absence of subjects.");
  process.exit(0);
}

let failed = 0;
for (const path of indexes) {
  const rel = path.slice(ROOT.length + 1);
  if (!existsSync(path)) {
    console.error(`✗ ${rel}: declared as a fhir-artifact-index graph, but no index.json is there`);
    failed++;
    continue;
  }
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    console.error(`✗ ${rel}: not readable JSON — ${e instanceof Error ? e.message : String(e)}`);
    failed++;
    continue;
  }
  const parsed = FhirArtifactIndexSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`✗ ${rel}: does not validate as folio-fhir-artifact-index/v1`);
    for (const issue of parsed.error.issues.slice(0, 5)) {
      console.error(`    ${issue.path.join(".")}: ${issue.message}`);
    }
    if (parsed.error.issues.length > 5) console.error(`    …and ${parsed.error.issues.length - 5} more`);
    failed++;
    continue;
  }
  const ix = parsed.data;
  const census = materializationCensus(ix.artifacts);
  console.log(
    `✓ ${rel}: ${ix.count} artefacts, dakApi=${ix.dakApi}, ` +
      `${Object.entries(census).map(([k, v]) => `${k}=${v}`).join(" ")}`,
  );
}

if (failed > 0) {
  console.error(`\n✗ ${failed} of ${indexes.length} artefact index/indexes did not validate.`);
  console.error("  Nothing under a fhir-artifact-index graph is hand-authored — re-run `ingest:ig`");
  console.error("  against the IG's published output rather than editing the file.");
  process.exit(1);
}
console.log(`\n✓ ${indexes.length} artefact index/indexes validate`);
