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
