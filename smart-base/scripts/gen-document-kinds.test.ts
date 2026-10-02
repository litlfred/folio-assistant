/**
 * The DAK document kind is the ten components, generated, in order.
 *
 * Calibrated: removing a component from `DAK_COMPONENTS` fails the first test
 * against the committed `dak.json` (and `smart-base:document-kinds:check`).
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { DAK_COMPONENTS } from "../schemas/dak-kinds.ts";
import { DocumentKindSchema } from "../platform.js";
import { dakCoverage, dakKind, kindSetProblems } from "./gen-document-kinds.ts";
import { pinnedTerms } from "./pin-smart-kg.ts";

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

describe("the authored kinds resolve as a set (bean pebe)", () => {
  const read = (id: string) =>
    DocumentKindSchema.parse(JSON.parse(readFileSync(join(import.meta.dir, "..", "document-kinds", `${id}.json`), "utf-8")));
  const kinds = ["dak", "l1", "l1-guideline", "dth"].map(read);
  const pinned = pinnedTerms();
  it("the committed kinds have no problem", () => {
    expect(kindSetProblems(kinds, pinned)).toEqual([]);
  });
  it("l1-guideline and dth both extend l1, and neither redeclares its sections", () => {
    expect(kinds.filter((k) => k.extends === "l1").map((k) => k.id).sort()).toEqual(["dth", "l1-guideline"]);
  });
  it("every section and every kind names a source", () => {
    for (const k of kinds.filter((k) => k.id !== "dak")) for (const s of k.sections) expect(s.sources?.length ?? 0).toBeGreaterThan(0);
  });
  // Calibration: each case is the committed set with ONE thing broken.
  const dth = kinds.find((k) => k.id === "dth")!;
  const others = kinds.filter((k) => k.id !== "dth");
  it("an extends that names no kind", () => {
    expect(kindSetProblems([...others, { ...dth, extends: "l9" }], pinned).join()).toContain('extends "l9"');
  });
  it("an extends chain that loops", () => {
    const l1 = kinds.find((k) => k.id === "l1")!;
    const looped = [...kinds.filter((k) => k.id !== "l1"), { ...l1, extends: "dth" }];
    expect(kindSetProblems(looped, pinned).join()).toContain("loops");
  });
  it("a child redeclaring a section its parent has", () => {
    const dup = { ...dth, sections: [...dth.sections, { ...dth.sections[0]!, id: "introduction" }] };
    expect(kindSetProblems([...others, dup], pinned).join()).toContain('"introduction" is already its parent');
  });
  it("a modelledBy term the pinned smart-kg snapshot does not declare", () => {
    const bad = { ...dth, sections: dth.sections.map((s, i) => (i === 0 ? { ...s, modelledBy: ["sgkg-l2#not-a-class"] } : s)) };
    expect(kindSetProblems([...others, bad], pinned).join()).toContain("sgkg-l2#not-a-class");
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
