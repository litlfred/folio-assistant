import { describe, expect, test } from "bun:test";
import { stripLineComments } from "../../content/pipeline/qa-checkers-extended";

/**
 * Chapter manifests are read with a non-greedy `blocks: \[([\s\S]*?)\]`, so a
 * `]` anywhere inside a comment ends the array early and every block after it
 * disappears from the position map. A block with no position is silently exempt
 * from `detangler-no-forward-ref`, and edges pointing at it are skipped — the
 * checker reports clean on material it never looked at.
 *
 * These pin the stripping that has to happen first.
 */
const blocksOf = (src: string) =>
  [...stripLineComments(src).matchAll(/blocks\s*:\s*\[([\s\S]*?)\]/g)].flatMap((m) =>
    [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]),
  );

describe("stripLineComments", () => {
  test("a ] inside a comment no longer truncates the array", () => {
    // The real case: a note mentioning `uses: []` sat mid-array in mass-theory
    // and hid every block below it.
    const src = `blocks: [
      "alpha",
      // four consumers are the EW blocks there, and it has \`uses: []\` today
      "beta",
      "gamma",
    ],`;
    expect(blocksOf(src)).toEqual(["alpha", "beta", "gamma"]);
  });

  test("a slug quoted inside a comment is not counted as a block", () => {
    // This one is worse than a miscount: the phantom entry also advanced the
    // position counter, shifting every later block in the chapter by one.
    const src = `blocks: [
      "alpha",
      // "ghost" was relocated to another chapter in July
      "beta",
    ],`;
    expect(blocksOf(src)).toEqual(["alpha", "beta"]);
  });

  test("a // inside a string is left alone", () => {
    const src = `title: "See https://example.com/docs", blocks: ["alpha"],`;
    expect(stripLineComments(src)).toContain("https://example.com/docs");
    expect(blocksOf(src)).toEqual(["alpha"]);
  });

  test("handles all three quote characters", () => {
    const src = `a: 'http://x/y', b: \`http://z/w\`, c: "http://p/q",`;
    expect(stripLineComments(src)).toBe(src);
  });

  test("an escaped quote does not end the string early", () => {
    const src = `title: "a \\" b // not a comment", blocks: ["alpha"],`;
    expect(stripLineComments(src)).toContain("// not a comment");
    expect(blocksOf(src)).toEqual(["alpha"]);
  });

  test("line structure is preserved so line-oriented parses still line up", () => {
    const src = `one\n// two\nthree\n`;
    expect(stripLineComments(src).split("\n").length).toBe(src.split("\n").length);
  });

  test("a comment at end of file without a trailing newline is dropped", () => {
    expect(stripLineComments(`"alpha", // trailing`).trim()).toBe(`"alpha",`);
  });

  test("source with no comments is returned unchanged", () => {
    const src = `blocks: [\n  "alpha",\n  "beta",\n],\n`;
    expect(stripLineComments(src)).toBe(src);
  });
});
