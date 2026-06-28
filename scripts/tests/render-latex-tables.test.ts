/**
 * Render-pipeline tests — tables are wrapped in `adjustbox` so over-wide
 * `tabular`s scale down to `\textwidth` instead of spilling past the margin
 * (the "Overfull \hbox" class that dominates a full qou build).
 *
 * Both table emitters are covered:
 *   - the GFM-table renderer (`renderTable`)
 *   - the HTML-`<table>` converter (`htmlTableToLatex`)
 *
 * The wrapper only ever *shrinks* (`max width=\linewidth`), so narrow tables
 * are visually untouched — but the markup is still emitted unconditionally,
 * which is what these tests pin.
 */

import { describe, test, expect } from "bun:test";
import {
  markdownToLatex,
  validateLatexAst,
  chooseColumnSpec,
} from "../../content/pipeline/render-latex";

const GFM_TABLE = `
| Name | Value | Notes |
|:-----|:-----:|------:|
| alpha | 1 | first |
| beta | 2 | second |
`;

const HTML_TABLE = `<table>
<thead><tr><th>A</th><th align="center">B</th></tr></thead>
<tbody><tr><td>x</td><td>y</td></tr></tbody>
</table>`;

/** Assertions shared by both table-rendering paths. */
function expectAdjustboxWrapped(out: string): void {
  // The wrapper is present, scaling down to the text width.
  expect(out).toContain("\\begin{adjustbox}{max width=\\linewidth}");
  expect(out).toContain("\\end{adjustbox}");

  // Exactly one wrapper per table (no double-wrapping).
  expect(out.match(/\\begin\{adjustbox\}/g)?.length).toBe(1);
  expect(out.match(/\\end\{adjustbox\}/g)?.length).toBe(1);

  // adjustbox must nest OUTSIDE the tabular: open before, close after.
  expect(out.indexOf("\\begin{adjustbox}")).toBeLessThan(
    out.indexOf("\\begin{tabular}"),
  );
  expect(out.lastIndexOf("\\end{tabular}")).toBeLessThan(
    out.lastIndexOf("\\end{adjustbox}"),
  );

  // The rendered LaTeX still parses cleanly (balanced environments, no bare #).
  const v = validateLatexAst(out);
  expect(v.errors).toEqual([]);
  expect(v.valid).toBe(true);
}

describe("table rendering wraps tabular in adjustbox", () => {
  test("GFM markdown table (renderTable path)", () => {
    const out = markdownToLatex(GFM_TABLE);
    expect(out).toContain("\\begin{tabular}");
    expectAdjustboxWrapped(out);
  });

  test("HTML <table> (htmlTableToLatex path)", () => {
    const out = markdownToLatex(HTML_TABLE);
    expect(out).toContain("\\begin{tabular}");
    expectAdjustboxWrapped(out);
  });

  test("booktabs rules are preserved inside the wrapper", () => {
    const out = markdownToLatex(GFM_TABLE);
    expect(out).toContain("\\toprule");
    expect(out).toContain("\\midrule");
    expect(out).toContain("\\bottomrule");
  });

  test("non-table prose is not wrapped (no spurious adjustbox)", () => {
    const out = markdownToLatex("Just a paragraph with a $\\sum_i x_i$ formula.");
    expect(out).not.toContain("adjustbox");
  });
});

describe("smart column sizing for over-wide tables", () => {
  // A table wide only because of one long prose column.
  const PROSE = `
| Term | Type | Description |
|------|------|-------------|
| Foo | scalar | A fairly long description that certainly exceeds forty-five characters so it must wrap |
| Bar | vector | Another long description well over the forty-five character threshold to ensure wrapping |`;

  // A table wide because of many short, non-wrappable columns.
  const DENSE = `
| C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 |
|----|----|----|----|----|----|----|----|
| aaaaaaaaa | bbbbbbbbb | ccccccccc | ddddddddd | eeeeeeeee | fffffffff | ggggggggg | hhhhhhhhh |`;

  test("narrow table keeps a plain l/c/r spec (no p{} wrapping)", () => {
    const out = markdownToLatex("| A | B | C |\n|:--|:-:|--:|\n| 1 | 2 | 3 |");
    expect(out).toContain("\\begin{tabular}{l c r}");
    expect(out).not.toContain("p{");
  });

  test("over-wide prose table wraps its long column at a computed p{<frac>\\linewidth}", () => {
    const out = markdownToLatex(PROSE);
    expect(out).toContain(">{\\raggedright\\arraybackslash}p{");
    expect(out).toMatch(/p\{0\.\d+\\linewidth\}/); // fraction of the local line width
    expect(out).toContain("\\begin{adjustbox}{max width=\\linewidth}"); // safety net kept
    expect(validateLatexAst(out).errors).toEqual([]);
  });

  test("over-wide DENSE table (nothing wraps) stays plain for adjustbox to scale", () => {
    const out = markdownToLatex(DENSE);
    expect(out).not.toContain("p{");
    expect(out).toContain("\\begin{adjustbox}{max width=\\linewidth}");
  });

  test("chooseColumnSpec: fits → plain; one long prose column → weighted p{}", () => {
    // all-short cells → spec unchanged
    expect(chooseColumnSpec([["a", "b"], ["c", "d"]], ["l", "c"])).toBe("l c");
    // a genuinely long prose cell → that column becomes p{<frac>\linewidth},
    // the short column stays atomic (l)
    const spec = chooseColumnSpec(
      [["Key", "A long definition that runs well past forty-five characters to force a wrap here"]],
      ["l", "l"],
    );
    expect(spec).toMatch(/^l>\{\\raggedright\\arraybackslash\}p\{0\.\d+\\linewidth\}$/);
  });
});
