import { describe, expect, test } from "bun:test";
import { candidates, merge, readRows, sectionKind, splitAcronym, termId, termSection } from "./glossary-from-source.ts";

const terms = `| Term | Definition |
| --- | --- |
| Care pathway | A complex intervention.<br>With parts. |
| Digital adaptation kits (DAKs) | Software-neutral documentation. |
**Minimum viable product**: A product with the least features.
Deploy – Make the software available.`;
const abbrev = `---
section_title: "Abbreviations"
---
| Abbreviation | Definition |
| --- | --- |
| MVP | minimum viable product |
| ANC | antenatal care |`;

describe("glossary-from-source (folio-assistant-core#498)", () => {
  test("readsRowsWithLines", () => {
    expect(readRows(terms).map((r) => [r.head, r.line])).toEqual([
      ["Care pathway", 3],
      ["Digital adaptation kits (DAKs)", 4],
      ["Minimum viable product", 5],
      ["Deploy", 6],
    ]);
    expect(readRows(terms)[0]!.body).toBe("A complex intervention.\nWith parts.");
  });

  test("sectionKindFromTitle", () => {
    expect(sectionKind(abbrev)).toBe("abbreviations");
    expect(sectionKind("## Glossary\n")).toBe("terms");
    expect(sectionKind("## Introduction\n")).toBeUndefined();
  });

  test("bracketedAcronymNotation", () => {
    expect(splitAcronym("Digital adaptation kits (DAKs)")).toEqual({ label: "Digital adaptation kits", acronym: "DAK" });
    expect(splitAcronym("Care (general)")).toEqual({ label: "Care (general)" });
    expect(termId("Person-centred point of service")).toBe("person-centred-point-of-service");
  });

  test("acronymsFoldIntoTerms", () => {
    const t = candidates([
      { path: "g.md", kind: "terms", md: terms },
      { path: "a.md", kind: "abbreviations", md: abbrev },
    ]);
    expect(t.find((x) => x.id === "minimum-viable-product")!.notation).toBe("MVP");
    expect(t.find((x) => x.id === "digital-adaptation-kits")!.notation).toBe("DAK");
    const anc = t.find((x) => x.id === "antenatal-care")!;
    expect([anc.notation, anc.definition, anc.status, anc.source]).toEqual(["ANC", undefined, "candidate", "a.md#L7"]);
    expect(t.every((x) => x.status === "candidate")).toBe(true);
  });

  test("headingTermOneRow", () => {
    const md = `---\nsection_title: "2.1.1. Actor"\n---\n### 2.1.1. Actor\n\n<a id="x"></a>\n\nA human or [tool](#t) in the system.\n\n> NOTE`;
    const row = readRows(termSection(md)!)[0]!;
    expect([row.head, row.body, row.line]).toEqual(["Actor", "A human or tool in the system.", 8]);
  });

  test("mergeKeepsPersonOwned", () => {
    const found = candidates([{ path: "g.md", kind: "terms", md: terms }]);
    const first = merge(undefined, found, { id: "s", title: "S" });
    const edited = {
      ...first,
      terms: first.terms.map((t) => (t.id === "deploy" ? { ...t, status: "authored" as const, definition: "Ship it.", scopeNote: "Adopted." } : t)),
    };
    const again = merge(edited, found, { id: "s", title: "S" });
    expect(again.terms.find((t) => t.id === "deploy")!.definition).toBe("Ship it.");
    expect(again.terms.length).toBe(first.terms.length);
    expect(merge(first, found, { id: "s", title: "S" })).toEqual(first);
  });
});
