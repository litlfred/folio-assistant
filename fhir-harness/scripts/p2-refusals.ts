#!/usr/bin/env bun
/**
 * @covers fhir-artifact-index, qa
 *
 * P2's refusal record: every XML and Turtle representation an IG publishes
 * that this pipeline does not render (bean `ntyj`, `ig-publisher-reduction` P2).
 *
 * Owner, 2026-10-01: *"Keep P2 as approved: drop XML and Turtle, and treat the
 * refusal record as an accepted"* — an accepted, documented difference from
 * the standard render. This file IS that record, one per IG, so that
 * "publishes no Turtle" and "we ignored its Turtle" stay distinguishable:
 *
 * - `xml`, `ttl` — each representation the IG PUBLISHED and this pipeline
 *   refuses, with where the Publisher serves it (a reader follows that link);
 * - `not-published` — each artefact for which the IG published NO XML or no
 *   Turtle, so its absence from the two lists above is a fact about the IG,
 *   not a gap in this record.
 *
 * Read from the instance's artefact index (`fhir-artifact-index/index.json`),
 * whose `published` URLs the ingest recorded; written as a `qa-results/v1`
 * sidecar in the instance's `test/results/`. Generic: nothing here knows whose
 * IG it is.
 *
 *   bun run fhir-harness/scripts/p2-refusals.ts --instance <dir> [--check]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { artifactPageName, type FhirArtifactIndex } from "../schemas/fhir-artifact-index.js";
import { sourceHashOf, type QaResult } from "../../cat-harness/scripts/qa-results.ts";

const REPO = resolve(import.meta.dir, "..", "..");
const REASON =
  "P2 (ig-publisher-reduction, approved 2026-09-30; owner 2026-10-01): XML and Turtle are not rendered — an accepted, documented difference from the standard render";

/**
 * The Publisher's view page for a representation: StructureDefinitions get
 * `.profile.<rep>.html`, and the ImplementationGuide none — its XML and Turtle
 * files are published with no page (measured on smart-trust, 2026-10-01: the
 * record then names exactly the Publisher's 1,354 XML/TTL view pages).
 */
export function publisherViewPage(a: { resourceType: string; id: string }, rep: "xml" | "ttl"): string | undefined {
  if (a.resourceType === "ImplementationGuide") return undefined;
  return `${artifactPageName(a)}${a.resourceType === "StructureDefinition" ? ".profile" : ""}.${rep}.html`;
}

export function refusals(ix: FhirArtifactIndex, script: string): QaResult {
  const fam = (rep: "xml" | "ttl") => {
    const entries = ix.artifacts
      .filter((a) => a.published?.[rep]?.url)
      .map((a) => {
        const page = publisherViewPage(a, rep);
        return { artifact: a.key, published: a.published![rep]!.url, ...(page ? { publisherPage: page } : {}), reason: REASON };
      });
    return {
      summary: `${rep === "xml" ? "XML" : "Turtle"} representations ${ix.packageId ?? ix.id} publishes that this pipeline refuses to render (P2); each stays reachable at the Publisher's URL`,
      count: entries.length,
      entries,
    };
  };
  const none = ix.artifacts
    .filter((a) => !a.published?.xml?.url || !a.published?.ttl?.url)
    .map((a) => ({ artifact: a.key, missing: (["xml", "ttl"] as const).filter((r) => !a.published?.[r]?.url) }));
  const xml = fam("xml");
  const ttl = fam("ttl");
  return {
    $schema: "qa-results/v1",
    producer: { script, script_hash: sourceHashOf(join(REPO, script)) },
    subject: { kind: "fhir-ig", id: ix.packageId ?? ix.id },
    families: {
      xml,
      ttl,
      "not-published": {
        summary: "Artefacts for which the IG published no XML or no Turtle — not refused, because there was nothing to refuse",
        count: none.length,
        entries: none,
      },
    },
    // Refusals are the record's findings; `not-published` is context, not a finding.
    total: xml.count + ttl.count,
  };
}

if (import.meta.main) {
  const i = process.argv.indexOf("--instance");
  const inst = i >= 0 ? process.argv[i + 1] : undefined;
  if (!inst) {
    console.error("usage: p2-refusals.ts --instance <dir> [--check]");
    process.exit(2);
  }
  const root = resolve(process.cwd(), inst);
  const indexPath = join(root, "fhir-artifact-index", "index.json");
  if (!existsSync(indexPath)) {
    console.error(`${relative(REPO, indexPath)} does not exist — no IG, so nothing to refuse (not a pass)`);
    process.exit(1);
  }
  const ix = JSON.parse(readFileSync(indexPath, "utf8")) as FhirArtifactIndex;
  const record = refusals(ix, relative(REPO, join(import.meta.dir, "p2-refusals.ts")));
  const out = join(root, "test", "results", "p2-refusals.qa-results.json");
  const text = `${JSON.stringify(record, null, 2)}\n`;
  if (process.argv.includes("--check")) {
    if (!existsSync(out) || readFileSync(out, "utf8") !== text) {
      console.error(`✗ ${relative(REPO, out)} is stale — run without --check and commit it`);
      process.exit(1);
    }
    console.log(`✓ ${relative(REPO, out)} is current`);
  } else {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, text);
    const f = record.families;
    console.log(`${relative(REPO, out)}: ${f.xml!.count} XML + ${f.ttl!.count} Turtle refused; ${f["not-published"]!.count} artefact(s) with a representation the IG did not publish`);
  }
}
