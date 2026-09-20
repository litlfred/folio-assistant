import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { checkCanonicalNoNumerology } from "../../content/pipeline/qa-checkers-extended";

function md(body: string): string {
  const dir = mkdtempSync(join(tmpdir(), "numerology-"));
  const p = join(dir, "block.md");
  writeFileSync(p, body);
  return p;
}

describe("checkCanonicalNoNumerology", () => {
  test("flags numerology asserted as significant", () => {
    expect(
      checkCanonicalNoNumerology(
        md("The predicted ratio miraculously agrees with the measured value.\n"),
      ).result,
    ).toBe("fail");
  });

  test("flags a bare happens-to-equal claim", () => {
    expect(
      checkCanonicalNoNumerology(
        md("The constant happens to equal the observed slope, which supports it.\n"),
      ).result,
    ).toBe("fail");
  });

  test("does NOT flag prose that disclaims the coincidence", () => {
    // The criterion exists to reward exactly this. Firing here punishes the
    // paper for being careful.
    expect(
      checkCanonicalNoNumerology(
        md(
          "It is a numerical coincidence at an unrelated anchor, not a\n" +
            "parameter-free evaluation on the substrate.\n",
        ),
      ).result,
    ).toBe("pass");
  });

  test("sees a disclaimer that wraps onto a later line", () => {
    // The regression that motivated this: hard-wrapped prose puts the phrase
    // and its caveat on different physical lines, so a per-line check
    // structurally cannot see the caveat.
    const body =
      "The evaluation anchors on a value which is not the substrate modulus.\n" +
      "It is a numerical coincidence at an unrelated anchor,\n" +
      "and it does not determine the constant, which stays open.\n";
    expect(checkCanonicalNoNumerology(md(body)).result).toBe("pass");
  });

  test("a disclaimer in a DIFFERENT paragraph does not launder a claim", () => {
    // Scope is the paragraph. A caveat elsewhere in the file must not excuse
    // numerology asserted here.
    const body =
      "The ratio miraculously agrees with experiment.\n" +
      "\n" +
      "Elsewhere: this is not a derivation and does not determine anything.\n";
    expect(checkCanonicalNoNumerology(md(body)).result).toBe("fail");
  });

  test("negation alone does not suppress a boast", () => {
    // "not accidental" is a negation, but it does not deny that the match
    // establishes something — it asserts the opposite. Must still fail.
    const body =
      "The agreement here is not accidental — the match is miraculous\n" +
      "and confirms the mechanism outright.\n";
    expect(checkCanonicalNoNumerology(md(body)).result).toBe("fail");
  });

  test("reports the line the phrase is actually on", () => {
    const body = "intro\n\nfiller line\nthe fit is miraculous here\n";
    const r = checkCanonicalNoNumerology(md(body));
    expect(r.result).toBe("fail");
    expect(r.hits[0].line).toBe(4);
  });

  test("clean prose passes", () => {
    expect(
      checkCanonicalNoNumerology(md("The bound follows from the lemma.\n")).result,
    ).toBe("pass");
  });
});
