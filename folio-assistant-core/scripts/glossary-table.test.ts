import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { GlossarySchema } from "../schemas/glossary.ts";
import { acronymsTable, glossaryTablesOf, GlossaryTablesSchema, replaceTable, termsTable } from "./glossary-table.ts";

const G = GlossarySchema.parse({
  $schema: "folio-glossary/v1",
  id: "doc",
  title: "Doc",
  terms: [
    { id: "dpi", prefLabel: "Digital Public Infrastructure", altLabel: ["DPI"], definition: "Shared digital systems.", status: "candidate" },
    { id: "reg", prefLabel: "Registry", definition: "An authoritative system\nof record.", editorialNote: "Under review", status: "candidate" },
    { id: "hie", prefLabel: "Health Information Exchange", editorialNote: "To be included before publication", status: "candidate" },
    { id: "repo", prefLabel: "Repository", status: "candidate" },
  ],
});

const A = GlossarySchema.parse({
  $schema: "folio-glossary/v1",
  id: "acr",
  title: "Acronyms",
  terms: [
    { id: "ai", prefLabel: "Artificial Intelligence", notation: "AI", status: "candidate" },
    { id: "x", prefLabel: "No acronym", status: "candidate" },
    { id: "sdg", prefLabel: "Sustainable Development Goal", notation: "SDG", status: "candidate" },
  ],
});

describe("glossary-table", () => {
  it("prints labels with their altLabels, and the editorial note in brackets after the definition", () => {
    expect(termsTable(G)).toBe(
      [
        "| **Term** | **Description** |",
        "| --- | --- |",
        "| Digital Public Infrastructure (DPI) | Shared digital systems. |",
        "| Registry | An authoritative system<br>of record. [Under review] |",
        "| Health Information Exchange | [To be included before publication] |",
        "| Repository |   |",
      ].join("\n"),
    );
  });

  it("lists only terms with a notation as acronyms, the first row standing as the header", () => {
    expect(acronymsTable(A)).toBe(["| AI | Artificial Intelligence |", "| --- | --- |", "| SDG | Sustainable Development Goal |"].join("\n"));
  });

  it("keeps a caption above the table and footnotes below it", () => {
    expect(replaceTable("*Glossary*\n\n| a |\n| --- |\n\n[^1]: n\n", "| b |\n| --- |")).toBe("*Glossary*\n\n| b |\n| --- |\n\n[^1]: n\n");
  });

  it("refuses a config path that leaves the instance", () => {
    const r = GlossaryTablesSchema.safeParse({ $schema: "folio-glossary-tables/v1", tables: [{ glossary: "../g.json", block: "b.md", kind: "terms" }] });
    expect(r.success).toBe(false);
  });

  it("draws every table the instance's config names", () => {
    const root = mkdtempSync(join(tmpdir(), "glossary-table-"));
    mkdirSync(join(root, "glossary"));
    writeFileSync(join(root, "glossary", "doc.glossary.json"), JSON.stringify(G));
    writeFileSync(join(root, "t.md"), "| old |\n| --- |\n");
    writeFileSync(
      join(root, "glossary", "glossary-tables.json"),
      JSON.stringify({ $schema: "folio-glossary-tables/v1", tables: [{ glossary: "glossary/doc.glossary.json", block: "t.md", kind: "terms" }] }),
    );
    const out = glossaryTablesOf(root);
    expect(out).toHaveLength(1);
    expect(out[0]!.content.startsWith("| **Term** |")).toBe(true);
  });
});
