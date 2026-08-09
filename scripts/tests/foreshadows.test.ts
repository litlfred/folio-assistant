import { describe, expect, test } from "bun:test";
import { CONSTRAINT_RULES } from "../../schemas/constraints";
import { parseForeshadows } from "../../content/pipeline/qa-checkers-extended";

const rule = CONSTRAINT_RULES.find((r) => r.id === "foreshadows-subset-of-uses")!;

// The constraint only reads the block, so the context is never consulted.
const ctx = {} as Parameters<typeof rule.check>[1];

describe("parseForeshadows", () => {
  test("reads a single-line declaration", () => {
    expect(
      parseForeshadows(`export default prose({ foreshadows: ["def:x"] });`),
    ).toEqual(["def:x"]);
  });

  test("reads a multi-line declaration", () => {
    const src = `export default prose({\n  foreshadows: [\n    "def:x",\n    "thm:y",\n  ],\n});\n`;
    expect(parseForeshadows(src)).toEqual(["def:x", "thm:y"]);
  });

  test("absent field yields nothing", () => {
    expect(parseForeshadows(`export default prose({ uses: ["def:x"] });`)).toEqual([]);
  });

  test("empty array yields nothing", () => {
    expect(parseForeshadows(`export default prose({ foreshadows: [] });`)).toEqual([]);
  });
});

describe("foreshadows-subset-of-uses", () => {
  test("passes when every entry is also in uses[]", () => {
    const block = { kind: "prose", uses: ["def:x", "thm:y"], foreshadows: ["thm:y"] };
    expect(rule.check(block as never, ctx)).toBeNull();
  });

  test("fails when an entry is not in uses[]", () => {
    // The drift this exists to catch: the uses[] edge is removed or renamed,
    // the foreshadow declaration lingers, and the exemption applies to nothing
    // while still looking deliberate.
    const block = { kind: "prose", uses: ["def:x"], foreshadows: ["thm:gone"] };
    const msg = rule.check(block as never, ctx);
    expect(msg).toContain("thm:gone");
  });

  test("fails when uses[] is absent entirely", () => {
    const block = { kind: "prose", foreshadows: ["thm:y"] };
    expect(rule.check(block as never, ctx)).toContain("thm:y");
  });

  test("no foreshadows is not a finding", () => {
    expect(rule.check({ kind: "prose", uses: ["def:x"] } as never, ctx)).toBeNull();
  });

  test("empty foreshadows is not a finding", () => {
    const block = { kind: "prose", uses: ["def:x"], foreshadows: [] };
    expect(rule.check(block as never, ctx)).toBeNull();
  });

  test("reports every offender, not just the first", () => {
    const block = { kind: "prose", uses: [], foreshadows: ["a:1", "b:2"] };
    const msg = rule.check(block as never, ctx)!;
    expect(msg).toContain("a:1");
    expect(msg).toContain("b:2");
  });
});
