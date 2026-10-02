/**
 * The DAK document kind is the ten components, generated, in order.
 *
 * Calibrated: removing a component from `DAK_COMPONENTS` fails the first test
 * against the committed `dak.json` (and `smart-base:document-kinds:check`).
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { DAK_COMPONENTS } from "../../cat-harness/schemas/block-kinds.ts";
import { DocumentKindSchema } from "../../cat-harness/schemas/document-kind.ts";
import { dakCoverage, dakKind } from "./gen-document-kinds.ts";

const committed = DocumentKindSchema.parse(JSON.parse(readFileSync(join(import.meta.dir, "..", "document-kinds", "dak.json"), "utf-8")));

describe("the DAK document kind", () => {
  it("has one section per DAK component, in DAK_COMPONENTS order", () => {
    expect(committed.sections.map((s) => s.id)).toEqual([...DAK_COMPONENTS]);
  });
  it("is fixed: every section required", () => {
    expect(committed.structure).toBe("fixed");
    expect(committed.sections.every((s) => s.required)).toBe(true);
  });
  it("says which component WHO's logical model does not yet formalize", () => {
    expect(committed.sections.find((s) => s.id === "scheduling-logic")!.description).toContain("Not yet a field");
  });
  it("the committed file is what the generator writes", () => {
    expect(committed).toEqual(dakKind());
  });
});

describe("the document-kind schema refuses what a kind may not be", () => {
  const base = { ...dakKind() };
  it("a fixed structure with an optional section", () => {
    const k = { ...base, sections: base.sections.map((s, i) => (i === 0 ? { ...s, required: false } : s)) };
    expect(DocumentKindSchema.safeParse(k).success).toBe(false);
  });
  it("a kind that names no source", () => {
    expect(DocumentKindSchema.safeParse({ ...base, sources: [] }).success).toBe(false);
  });
  it("two sections with one id", () => {
    expect(DocumentKindSchema.safeParse({ ...base, sections: [...base.sections, base.sections[0]] }).success).toBe(false);
  });
});

describe("the DAK view of an ingested IG (owner Q2: computed from resource type)", () => {
  const a = (key: string, resourceType: string, category?: string) => ({ key, resourceType, id: key, category });
  const cov = dakCoverage("x", "x/index.json", [
    a("ActorDefinition/p", "ActorDefinition"),
    a("Measure/m", "Measure"),
    a("Library/l", "Library"),
    a("StructureDefinition/lm", "StructureDefinition", "Structures: Logical Models"),
    a("StructureDefinition/prof", "StructureDefinition", "Structures: Resource Profiles"),
    a("ValueSet/v", "ValueSet"),
  ]);
  const members = (id: string) => cov.sections.find((s) => s.id === id)!.members.map((m) => m.key);

  it("places each rule's resource type in its component", () => {
    expect(members("generic-personas")).toEqual(["ActorDefinition/p"]);
    expect(members("programme-indicators")).toEqual(["Measure/m"]);
    expect(members("decision-support-logic")).toEqual(["Library/l"]);
    expect(members("core-data-elements")).toEqual(["StructureDefinition/lm"]);
  });
  it("a profile is not a data element, and nothing unruled is forced into a component", () => {
    expect(cov.unplaced).toEqual([
      { group: "StructureDefinition", count: 1 },
      { group: "ValueSet", count: 1 },
    ]);
  });
  it("placed plus unplaced is every artefact", () => {
    const placed = cov.sections.reduce((n, s) => n + s.members.length, 0);
    expect(placed + cov.unplaced.reduce((n, u) => n + u.count, 0)).toBe(cov.total);
  });
});
