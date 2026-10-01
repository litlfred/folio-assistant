/**
 * smart-base's document kinds that are GENERATED rather than authored.
 *
 * `dak.json` — the DAK as a document kind: a fixed structure of the ten
 * components, one section each, built from `DAK_COMPONENTS` (the list) and
 * `DAK_CARDS` (each component's title and description). Both already state the
 * components; restating them by hand in a JSON file would give the repository a
 * third copy free to drift. `--check` regenerates in memory and fails on a
 * difference, which is what makes a hand edit visibly a defect.
 *
 * `l1.json` and `dth.json` are authored, not generated: their sections are
 * read from publications (owner, 2026-10-01: the SMART Guidelines paper, the
 * WHO guideline-development handbook and the DTHs), not from code.
 *
 *   bun run smart-base/scripts/gen-document-kinds.ts [--check]
 *
 * Stage D5 of the smart-* separation, #1767, bean `qvxh`.
 *
 * @module smart-base/scripts/gen-document-kinds
 * @covers document-kinds
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { DAK_COMPONENTS, DAK_UNFORMALIZED_COMPONENTS } from "../../cat-harness/schemas/block-kinds.ts";
import {
  DOCUMENT_KIND_COVERAGE_SCHEMA_TAG,
  DOCUMENT_KIND_SCHEMA_TAG,
  DocumentKindCoverageSchema,
  DocumentKindSchema,
  type DocumentKind,
  type DocumentKindCoverage,
} from "../../cat-harness/schemas/document-kind.ts";
import { directoriesForGraph, instanceRootsIn, readDeclaration, repoRootFor } from "../../cat-harness/schemas/cat-harness.ts";
import { DAK_CARDS } from "../../cat-harness/scripts/gen-dak-components-figure.ts";

const OUT = resolve(import.meta.dir, "..", "document-kinds");
const GENERATOR = "smart-base/scripts/gen-document-kinds.ts";

/** The DAK as a fixed-structure document kind, one section per component. */
export function dakKind(): DocumentKind {
  const kind: DocumentKind = {
    $schema: DOCUMENT_KIND_SCHEMA_TAG,
    id: "dak",
    title: "Digital Adaptation Kit (DAK)",
    description:
      "The L2 layer of a WHO SMART Guideline: the ten components that make a guideline's " +
      "recommendations operational, ahead of the L3 FHIR IG that implements them. Fixed: a " +
      "DAK has exactly these components, in this order.",
    structure: "fixed",
    sections: DAK_COMPONENTS.map((c) => ({
      id: c,
      title: DAK_CARDS[c].title,
      required: true,
      description:
        DAK_CARDS[c].bullets.join(" ") +
        ((DAK_UNFORMALIZED_COMPONENTS as readonly string[]).includes(c)
          ? " Not yet a field of its own in WHO's DAK logical model."
          : ""),
    })),
    sources: [
      { ref: "https://www.who.int/publications/i/item/9789240099456", note: "WHO DAK guidance" },
      { ref: "https://www.who.int/publications/i/item/9789240085138", note: "WHO DAK guidance" },
      { ref: "https://github.com/litlfred/folio-assistant/issues/1614", note: "owner ruling 2026-09-30: ten components" },
    ],
    generatedBy: GENERATOR,
  };
  return DocumentKindSchema.parse(kind);
}

/**
 * Which DAK component an ingested IG artefact realises — the owner's answer to
 * Q2 (2026-10-01): computed from its FHIR resource type, and, for a
 * StructureDefinition, from the category the IG's OWN `artifacts.html` files it
 * under. WHO knowledge, so it lives here rather than in fhir-harness.
 *
 * Five rules and no more: each is a placement the WHO SMART L3 conventions make
 * unambiguous. Everything else — value sets, profiles, examples, a trust
 * network's endpoints — is reported as unplaced rather than forced into a
 * component it only arguably belongs to.
 */
export const DAK_RULES: readonly { component: string; resourceType: string; category?: string }[] = [
  { component: "generic-personas", resourceType: "ActorDefinition" },
  { component: "functional-and-non-functional-requirements", resourceType: "Requirements" },
  { component: "core-data-elements", resourceType: "StructureDefinition", category: "Structures: Logical Models" },
  { component: "decision-support-logic", resourceType: "PlanDefinition" },
  { component: "decision-support-logic", resourceType: "Library" },
  { component: "programme-indicators", resourceType: "Measure" },
];

const METHOD =
  "Computed from each artefact's FHIR resource type (owner, 2026-10-01): ActorDefinition → personas; " +
  "Requirements → requirements; a StructureDefinition the IG files under 'Structures: Logical Models' → " +
  "core data elements; PlanDefinition and Library → decision-support logic; Measure → indicators. " +
  "Anything else is listed as unplaced.";

interface IndexArtifact { key: string; resourceType: string; id: string; title?: string; name?: string; category?: string }

/** The DAK view of one ingested IG's artefact index. */
export function dakCoverage(subject: string, from: string, artifacts: readonly IndexArtifact[]): DocumentKindCoverage {
  const sections = DAK_COMPONENTS.map((c) => ({ id: c as string, members: [] as { key: string; label: string }[] }));
  const unplaced = new Map<string, number>();
  for (const a of artifacts) {
    const rule = DAK_RULES.find((r) => r.resourceType === a.resourceType && (r.category === undefined || r.category === a.category));
    if (rule === undefined) {
      unplaced.set(a.resourceType, (unplaced.get(a.resourceType) ?? 0) + 1);
      continue;
    }
    sections.find((s) => s.id === rule.component)!.members.push({ key: a.key, label: a.title ?? a.name ?? a.id });
  }
  for (const s of sections) s.members.sort((x, y) => x.key.localeCompare(y.key));
  return DocumentKindCoverageSchema.parse({
    $schema: DOCUMENT_KIND_COVERAGE_SCHEMA_TAG,
    kind: "dak",
    subject,
    from,
    method: METHOD,
    total: artifacts.length,
    sections,
    unplaced: [...unplaced].map(([group, count]) => ({ group, count })).sort((x, y) => y.count - x.count || x.group.localeCompare(y.group)),
    generatedBy: GENERATOR,
  });
}

/** Every instance holding a fhir-artifact-index, as [subject, repo-relative index path, artefacts]. */
function ingestedIgs(repoRoot: string): [string, string, IndexArtifact[]][] {
  const out: [string, string, IndexArtifact[]][] = [];
  for (const root of instanceRootsIn(repoRoot)) {
    const subject = readDeclaration(root)?.name;
    if (!subject) continue;
    for (const dir of directoriesForGraph(root, "fhir-artifact-index")) {
      const path = join(dir, "index.json");
      if (!existsSync(path)) continue;
      const ix = JSON.parse(readFileSync(path, "utf-8")) as { artifacts?: IndexArtifact[] };
      out.push([subject, relative(repoRoot, path).split("\\").join("/"), ix.artifacts ?? []]);
    }
  }
  return out.sort((a, b) => a[0].localeCompare(b[0]));
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const repoRoot = repoRootFor(resolve(import.meta.dir, ".."));
  const files = new Map<string, string>([[join(OUT, "dak.json"), `${JSON.stringify(dakKind(), null, 2)}\n`]]);
  for (const [subject, from, artifacts] of ingestedIgs(repoRoot)) {
    files.set(join(OUT, `dak.coverage.${subject}.json`), `${JSON.stringify(dakCoverage(subject, from, artifacts), null, 2)}\n`);
  }
  if (check) {
    let bad = 0;
    for (const [target, body] of files) {
      const ok = existsSync(target) && readFileSync(target, "utf-8") === body;
      if (!ok) { console.log(`✗ ${relative(process.cwd(), target)} is stale — run without --check`); bad++; }
    }
    if (bad === 0) console.log(`✓ ${files.size} document-kind file(s) current`);
    process.exit(bad === 0 ? 0 : 1);
  }
  mkdirSync(OUT, { recursive: true });
  for (const [target, body] of files) {
    writeFileSync(target, body);
    console.log(`${relative(process.cwd(), target)} written`);
  }
}
