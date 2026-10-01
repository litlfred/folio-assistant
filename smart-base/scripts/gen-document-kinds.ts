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
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { DAK_COMPONENTS, DAK_UNFORMALIZED_COMPONENTS } from "../../cat-harness/schemas/block-kinds.ts";
import { DOCUMENT_KIND_SCHEMA_TAG, DocumentKindSchema, type DocumentKind } from "../../cat-harness/schemas/document-kind.ts";
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

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const target = join(OUT, "dak.json");
  const body = `${JSON.stringify(dakKind(), null, 2)}\n`;
  if (check) {
    const ok = existsSync(target) && readFileSync(target, "utf-8") === body;
    console.log(ok ? `✓ ${relative(process.cwd(), target)} current` : `✗ ${relative(process.cwd(), target)} is stale — run without --check`);
    process.exit(ok ? 0 : 1);
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(target, body);
  console.log(`${relative(process.cwd(), target)}: ${dakKind().sections.length} sections`);
}
