import { describe, expect, test } from "bun:test";
import { documentTexFences, texFenceHash } from "./document-tex-fences.ts";

const fence = (body: string) => "Before.\n\n```tex\n" + body + "\n```\n\nAfter.";
const TIKZ = "\\begin{equation}\\label{eq:x}\n\\begin{tikzcd} A \\ar[r] & B \\end{tikzcd}\n\\end{equation}";

describe("documentTexFences", () => {
  test("a fence with a pre-rendered SVG of the same hash shows the SVG, with its label as an anchor", () => {
    const svgs = new Map([[texFenceHash(TIKZ), "ch/rendered/b-0.svg"]]);
    const used = new Set<string>();
    const out = documentTexFences(fence(TIKZ), { math: true, svgs, used });
    expect(out).toContain('<a id="eq:x"></a><img class="fa-tex-svg" src="ch/rendered/b-0.svg"');
    expect(out).not.toContain("```");
    expect([...used]).toEqual(["ch/rendered/b-0.svg"]);
  });
  test("an SVG for another source is never shown", () => {
    const out = documentTexFences(fence(TIKZ), { math: true, svgs: new Map([["000000000000", "x.svg"]]) });
    expect(out).toContain("[Diagram: not yet rendered]");
    expect(out).not.toContain("x.svg");
  });
  test("an equation fence becomes display math, unwrapped, with its label kept as an anchor", () => {
    const out = documentTexFences(fence("\\begin{equation}\\label{eq:y}\na = b\n\\end{equation}"), { math: true, svgs: new Map() });
    expect(out).toContain('<a id="eq:y"></a>\n\n$$\na = b\n$$');
    expect(out).not.toContain("\\label");
  });
  test("align stays align for KaTeX; without math it is a placeholder", () => {
    const src = "\\begin{align*}\na &= b\n\\end{align*}";
    expect(documentTexFences(fence(src), { math: true, svgs: new Map() })).toContain("$$\n\\begin{align*}");
    expect(documentTexFences(fence(src), { math: false, svgs: new Map() })).toContain("tex-ph");
  });
});
