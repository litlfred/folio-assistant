/**
 * `strengthFinding` over the code lists this layer actually declares, plus a
 * retired code built in the test (bean `55ao`).
 */
import { describe, expect, it } from "bun:test";
import { join } from "node:path";

import { loadCodeLists } from "@litlfred/cat-harness-tools/schemas/library/code-list.js";
import { recommendation } from "@litlfred/cat-harness-tools/schemas/builders.js";
import { strengthFinding } from "./recommendation-strength.js";

const lists = loadCodeLists([join(import.meta.dir, "..", "code-lists")]);

describe("the code lists core declares", () => {
  it("are the two strength vocabularies, each a valid folio-code-list/v1", () => {
    expect([...lists.keys()].sort()).toEqual(["grade-recommendation-strength", "rfc2119-requirement-level"]);
    expect(lists.get("grade-recommendation-strength")!.codes.map((c) => c.code)).toEqual(["strong", "conditional"]);
  });
});

describe("strengthFinding", () => {
  it("a code in a declared list resolves", () => {
    expect(strengthFinding({ list: "grade-recommendation-strength", code: "conditional" }, lists)).toBeNull();
    expect(strengthFinding({ list: "rfc2119-requirement-level", code: "should-not" }, lists)).toBeNull();
  });

  it("no strength is not a finding: the field is optional", () => {
    expect(strengthFinding(undefined, lists)).toBeNull();
  });

  it("an undeclared list is named, with the lists that ARE declared", () => {
    expect(strengthFinding({ list: "grade", code: "strong" }, lists)).toMatch(/"grade".*declared: grade-recommendation-strength, rfc2119-requirement-level/);
  });

  it("a code the list does not hold is named, with the codes it does", () => {
    expect(strengthFinding({ list: "grade-recommendation-strength", code: "weak" }, lists)).toMatch(/"weak".*codes: strong, conditional/);
  });

  it("a retired code is refused as a value", () => {
    const withRetired = new Map(lists);
    const g = lists.get("grade-recommendation-strength")!;
    withRetired.set(g.id, { ...g, codes: [...g.codes, { code: "weak", label: "Weak", definition: "The earlier name for conditional.", status: "retired" }] });
    expect(strengthFinding({ list: g.id, code: "weak" }, withRetired)).toMatch(/retired/);
  });
});

describe("the recommendation builder carries strength and about", () => {
  it("validates a strength reference and the DAK link, with a folio-chosen label", () => {
    const b = recommendation({ label: "who-anc:iron-folate", title: "Iron and folic acid", strength: { list: "grade-recommendation-strength", code: "strong" }, about: ["hi:anc-supplementation"] });
    expect(b).toMatchObject({ kind: "recommendation", strength: { code: "strong" }, about: ["hi:anc-supplementation"] });
  });

  it("refuses a strength that is free text rather than a reference", () => {
    expect(() => recommendation({ label: "r:1", strength: "strong" as never })).toThrow();
  });
});
