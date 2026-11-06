import { describe, expect, test } from "bun:test";
import { IG_SOURCES, withIgnoredAst, withIgSection } from "./ig-instantiate.ts";

describe("ig-instantiate", () => {
  test("declares the IG sources that exist, and keeps the rest of the config", () => {
    const next = withIgSection({ instances: [], contentTypes: { other: { x: 1 } } }, (p) => p !== "ig.ini");
    expect(next).toEqual({ instances: [], contentTypes: { other: { x: 1 }, ig: { include: ["sushi-config.yaml", "input/"] } } });
  });

  test("an existing ig section is the author's: nothing changes", () => {
    expect(withIgSection({ contentTypes: { ig: { include: ["input/fsh/"] } } }, () => true)).toBeUndefined();
  });

  test("a repository with none of the sources is not an IG, and is refused", () => {
    expect(() => withIgSection({}, () => false)).toThrow(/not an IG repository/);
    expect(IG_SOURCES).toContain("input/");
  });

  test("output-ast/ is ignored once, the author's lines kept", () => {
    expect(withIgnoredAst("output/\n")).toBe("output/\noutput-ast/\n");
    expect(withIgnoredAst("output/")).toBe("output/\noutput-ast/\n");
    expect(withIgnoredAst("/output-ast/\n")).toBe("/output-ast/\n");
  });
});
