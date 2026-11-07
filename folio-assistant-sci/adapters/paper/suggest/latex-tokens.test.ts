/**
 * The paper profile's token rules: the same LaTeX references the edit-links
 * runtime shielded and checked before they moved here, and the same verdicts.
 */

import { describe, expect, test } from "bun:test";
import { latexReferenceTokens } from "./latex-tokens";

const [rule] = latexReferenceTokens();
const wellFormed = (s: string) => rule!.valid!.test(s.replace(rule!.trim!, ""));
const found = (md: string) => Array.from(md.matchAll(rule!.find!), (m) => m[0]);

describe("latex-tokens", () => {
  test("one rule, with every pattern the runtime reads", () => {
    expect(latexReferenceTokens().map((r) => r.id)).toEqual(["latex-reference"]);
    expect(rule!.find!.global).toBe(true);
    expect(rule!.valid!.global || rule!.trim!.global).toBe(false);
  });

  test("shields a command with one braced argument, and nothing else", () => {
    const md = "See \\cref{thm:a} and \\emph{x}, not $x^2$ or \\alpha.";
    expect(Array.from(md.matchAll(new RegExp(rule!.shield!.source, "g")), (m) => m[0])).toEqual(["\\cref{thm:a}", "\\emph{x}"]);
  });

  test("a reference is well-formed with one argument, trailing punctuation aside", () => {
    expect(found("By \\cite{k}, \\ref{a}. and (\\eqref{e})").map(wellFormed)).toEqual([true, true, true]);
    expect(found("By \\cite{k and \\ref{} and \\cref{a{b}}").map(wellFormed)).toEqual([false, false, false]);
    expect(found("\\citep{k} is not one of them")).toEqual([]);
  });
});
