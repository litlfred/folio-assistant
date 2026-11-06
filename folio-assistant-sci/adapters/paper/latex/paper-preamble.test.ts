/**
 * The paper print template's contract: it defines every macro the paper
 * renderer emits, and it carries no folio's notation.
 *
 * The first half is what made its deletion (`34a70659c7`) silently fatal: the
 * renderer kept emitting `\blockannot`, `\refterm` and the rest, and the only
 * definitions were in one folio's generated `main.tex`. The second half is the
 * owner's D1 split (2026-10-04): notation belongs to the folio, so a
 * notation macro reappearing here would be the template drifting back into
 * one paper's preamble. See `README.md`.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const TEMPLATE = readFileSync(join(import.meta.dir, "paper-preamble.tex"), "utf-8");

/** Lines that are not wholly a comment, so a macro NAMED in prose does not count. */
const code = TEMPLATE.split("\n")
  .filter((l) => !/^\s*%/.test(l))
  .join("\n");

function defines(name: string): boolean {
  const n = name.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
  return new RegExp(`\\\\(?:newcommand|renewcommand|providecommand|DeclareRobustCommand|def)\\*?\\s*\\{?\\\\${n}(?![A-Za-z])`).test(code);
}

describe("paper-preamble.tex", () => {
  // Emitted by render-latex.ts / generate-block-tex.ts / generate-main-tex.ts.
  for (const m of ["blockannot", "sectionannot", "chapterannot", "defterm", "refterm", "uses", "proofstatuslegend"]) {
    it(`defines \\${m}, which the paper renderer emits`, () => {
      expect(defines(m)).toBe(true);
    });
  }

  it("is a full preamble: a document class and no \\begin{document}", () => {
    expect(code).toMatch(/\\documentclass/);
    expect(code).not.toMatch(/\\begin\{document\}/);
  });

  // Decision D1/D2: these are litlfred/qou's notation, carried in its fragment.
  for (const m of ["bigbowtie", "varTheta", "pp", "yng", "unicode"]) {
    it(`does not define the folio notation macro \\${m}`, () => {
      expect(defines(m)).toBe(false);
    });
  }

  it("does not map 𝓑 or 𝔙, the two unicode maps that are notation", () => {
    expect(code).not.toMatch(/\\newunicodechar\{𝓑\}/u);
    expect(code).not.toMatch(/\\newunicodechar\{𝔙\}/u);
  });

  // The 2026-08-22 removal must not come back through the platform copy: each
  // of these turned a loud error into silently wrong mathematics.
  it("does not restore any of the 16 typo macros qou removed", () => {
    for (const m of ["pic", "xid", "xiZ", "xiA", "pid", "nuk", "varepsilonk", "varepsilonq", "foralln", "omegadV", "omegads", "Gammat", "psiK", "pia", "lambdaL", "inftydt"]) {
      expect(defines(m)).toBe(false);
    }
  });
});
