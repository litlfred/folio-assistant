/**
 * The paper profile's ✍ suggest checks (bean `4dx7`), held against a real
 * block of this instance's library: LeanArchitect §3.4, "LaTeX Export"
 * (`library/arxiv-2601.22554v1/blocks/prose-sec-006.jsonld`), reached the way
 * the runtime reaches it — the block node, then its `text`. It carries inline
 * math, preamble macros (`\lean`, `\leanok`, `\uses`), references (`\label`,
 * `\cref`), comments and two environments.
 */

import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  checkLatex,
  citeKeysFromReferenceNodes,
  checkSuggestion,
  labelsFromBlockNodes,
  latexSpans,
  macroArity,
  macroTable,
  macroTableFromKatex,
  parseNewcommands,
  protectLatex,
  restoreLatex,
} from "./latex-check";

const SCI = join(import.meta.dir, "..", "..", "..");
const PAPER = join(SCI, "library", "arxiv-2601.22554v1");
const NODE = join(PAPER, "blocks", "prose-sec-006.jsonld");
const node = JSON.parse(readFileSync(NODE, "utf8")) as { text: string; label?: string };
const BLOCK = readFileSync(join(dirname(NODE), node.text), "utf8");
const PREAMBLE = readFileSync(join(SCI, "adapters", "paper", "latex", "paper-preamble.tex"), "utf8");
const MACROS = macroTable({ pair: { tex: "\\langle #1, #2 \\rangle" } }, PREAMBLE);
const BLOCK_NODES = readdirSync(join(PAPER, "blocks"))
  .filter((f) => f.endsWith(".jsonld"))
  .map((f) => JSON.parse(readFileSync(join(PAPER, "blocks", f), "utf8")) as { label?: unknown });
const OPTS = { macros: MACROS, kg: { labels: labelsFromBlockNodes(BLOCK_NODES), citeKeys: [] as string[] } };

const edit = (from: string, to: string) => {
  expect(BLOCK).toContain(from);
  return BLOCK.replace(from, () => to); // a function: a string replacement would read `$$` as `$`
};
const errors = (fs: ReturnType<typeof checkLatex>) => fs.filter((f) => f.severity === "error");

describe("the real block", () => {
  test("is the LaTeX-bearing one this suite claims", () => {
    for (const s of ["$N$", "\\begin{theorem}", "\\end{proof}", "\\uses{lem:zero-add, lem:succ-add}", "\\cref{", "% Statement"]) {
      expect(BLOCK).toContain(s);
    }
  });

  test("is well formed: no syntax errors as ingested", () => {
    expect(errors(checkLatex(BLOCK, OPTS))).toEqual([]);
  });

  test("its dangling example labels are warnings, never errors", () => {
    // The labels name blocks of the paper's EXAMPLE blueprint, not of this KG.
    const w = checkLatex(BLOCK, OPTS);
    expect(w.length).toBeGreaterThan(0);
    expect(new Set(w.map((f) => f.severity))).toEqual(new Set(["warning"]));
    expect(w.map((f) => f.subject)).toContain("def:nat");
    // `thm:add-comm` is defined by the block's own `\label`.
    expect(w.map((f) => f.subject)).not.toContain("thm:add-comm");
  });
});

describe("round trip", () => {
  test("an untouched block reports nothing", () => {
    expect(checkSuggestion(BLOCK, BLOCK, OPTS)).toEqual([]);
  });

  test("protecting then restoring gives the block back byte for byte", () => {
    const p = protectLatex(BLOCK, MACROS);
    expect(p).not.toBe(BLOCK);
    expect(restoreLatex(p)).toBe(BLOCK);
  });

  test("both environments are kept verbatim, whole", () => {
    const spans = latexSpans(BLOCK, MACROS).map(([a, b]) => BLOCK.slice(a, b));
    expect(spans.some((s) => s.startsWith("\\begin{theorem}") && s.endsWith("\\end{theorem}"))).toBe(true);
    expect(spans.some((s) => s.startsWith("\\begin{proof}") && s.endsWith("\\end{proof}"))).toBe(true);
    expect(spans).toContain("\\inputleannode{label}");
  });
});

describe("a valid edit is accepted", () => {
  test("rewriting the math", () => {
    const after = edit("Addition in $N$ is commutative.", "Addition in $\\mathbb{N}$ is commutative: $\\frac{a+b}{1} = b + a$.");
    expect(checkSuggestion(BLOCK, after, OPTS)).toEqual([]);
  });

  test("using a paper macro with its two arguments", () => {
    expect(checkSuggestion(BLOCK, edit("By induction and then", "By induction on $\\pair{a}{b}$ and then"), OPTS)).toEqual([]);
  });

  test("deleting a whole environment", () => {
    const a = BLOCK.indexOf("\\begin{proof}");
    const b = BLOCK.indexOf("\\end{proof}") + "\\end{proof}".length;
    expect(checkSuggestion(BLOCK, BLOCK.slice(0, a) + BLOCK.slice(b), OPTS)).toEqual([]);
  });

  test("a reference to a label the KG lacks: a warning, never an error", () => {
    const f = checkSuggestion(BLOCK, edit("\\uses{def:nat}", "\\uses{def:nat, def:nowhere}"), OPTS);
    expect(f.map((x) => [x.severity, x.code, x.subject])).toEqual([["warning", "unknown-label", "def:nowhere"]]);
  });

  test("a citation the bibliography lacks: a warning", () => {
    const f = checkSuggestion(BLOCK, edit("inspired by doc-gen4.", "inspired by doc-gen4~\\cite[§2]{docgen4}."), OPTS);
    expect(f.map((x) => [x.severity, x.code, x.subject])).toEqual([["warning", "unknown-cite", "docgen4"]]);
  });
});

describe("an unbalanced edit is reported", () => {
  test("an unclosed brace in math", () => {
    const f = checkSuggestion(BLOCK, edit("Addition in $N$", "Addition in $\\mathbb{N$"), OPTS);
    expect(f.map((x) => [x.severity, x.code])).toEqual([["error", "unclosed-brace"]]);
    expect(f[0]!.line).toBe(BLOCK.slice(0, BLOCK.indexOf("Addition in $N$")).split("\n").length);
  });

  test("a stray closing brace", () => {
    const f = checkSuggestion(BLOCK, edit("\\uses{def:nat}", "\\uses{def:nat}}"), OPTS);
    expect(f.map((x) => x.code)).toEqual(["unmatched-close-brace"]);
  });

  test("an environment left open", () => {
    const f = checkSuggestion(BLOCK, edit("\\end{proof}", ""), OPTS);
    expect(f.map((x) => [x.code, x.subject])).toEqual([["unclosed-environment", "proof"]]);
  });

  test("environments closed out of order", () => {
    const after = edit("% Text\n\\end{theorem}", "% Text\n\\begin{itemize}\n\\end{theorem}\n\\end{itemize}");
    const f = checkSuggestion(BLOCK, after, OPTS).map((x) => [x.code, x.subject]);
    expect(f).toContainEqual(["mismatched-end", "itemize"]);
    expect(f.every(([c]) => c !== "unknown-label")).toBe(true);
  });

  test("a macro short of its arguments: built-in, preamble and paper", () => {
    const n = (s: string) => checkSuggestion(BLOCK, edit("Addition in $N$", s), OPTS).map((x) => [x.code, x.subject]);
    expect(n("Addition in $\\frac{a}$")).toEqual([["missing-argument", "frac"]]);
    expect(n("Addition in $\\pair{a}$")).toEqual([["missing-argument", "pair"]]);
    expect(n("Addition in $\\leanstatusmark{a}$")).toEqual([["missing-argument", "leanstatusmark"]]);
  });

  test("an unclosed display math", () => {
    const f = checkSuggestion(BLOCK, edit("Addition in $N$", "Addition in $$N"), OPTS);
    expect(f.map((x) => x.code)).toEqual(["unclosed-display-math"]);
  });
});

describe("what is not an error", () => {
  test("TeX's single-token arguments: \\frac12", () => {
    expect(errors(checkLatex("$\\frac12 + \\sqrt[3]x$", OPTS))).toEqual([]);
  });

  test("a percent sign in prose, a dollar in prose, braces in code", () => {
    const md = "Up 50% this year; it costs $5.\n\nNext paragraph.\n\n```lean\nexample : {x // x > 0} := ⟨1, by simp⟩ }\n```\n\nand `}` inline.\n";
    expect(checkLatex(md, OPTS)).toEqual([]);
  });

  test("escaped braces", () => {
    expect(checkLatex("$\\{ x \\mid x > 0 \\}$", OPTS)).toEqual([]);
  });

  test("an unknown macro: no shape, so no arity complaint", () => {
    expect(checkLatex("$\\mysterious$ and \\inputleannode", OPTS)).toEqual([]);
  });
});

describe("the macro table", () => {
  test("argument counts from a body, as blueprint-layout counts them", () => {
    expect(macroArity("\\langle #1, #2 \\rangle")).toBe(2);
    expect(macroArity("\\mathrm{LM}")).toBe(0);
  });

  test("\\newcommand shapes from the paper preamble, optional arguments apart", () => {
    const t = parseNewcommands(PREAMBLE);
    expect(t.lean).toEqual({ args: 1, optional: false });
    expect(t.leanok).toEqual({ args: 0, optional: false });
    expect(t.blockannot).toEqual({ args: 3, optional: true });
    expect(t.chapterannot).toEqual({ args: 2, optional: false });
  });

  test("the paper's own macros win over the preamble and built-ins", () => {
    expect(macroTable({ frac: { tex: "#1/#2/#3" } }).frac).toEqual({ args: 3, optional: false });
  });
});

describe("cite keys from the KG", () => {
  test("reference nodes by their `references/<key>` IRI, and CSL entries by id", () => {
    const keys = citeKeysFromReferenceNodes([
      { "@id": "references/milnor1965" },
      { "@id": "https://litlfred.github.io/folio/references/garoufalidis2004" },
      { "@id": "library/arxiv-2601.22554v1/blocks/prose-sec-006" },
      { id: "kassel1995" },
    ]);
    expect([...keys].sort()).toEqual(["garoufalidis2004", "kassel1995", "milnor1965"]);
  });

  test("a key the bibliography holds is not warned about; one it lacks is", () => {
    const kg = { citeKeys: citeKeysFromReferenceNodes([{ "@id": "references/docgen4" }]) };
    const ok = edit("inspired by doc-gen4.", "inspired by doc-gen4~\\cite{docgen4}.");
    const bad = edit("inspired by doc-gen4.", "inspired by doc-gen4~\\cite{nowhere}.");
    expect(checkSuggestion(BLOCK, ok, { macros: MACROS, kg })).toEqual([]);
    expect(checkSuggestion(BLOCK, bad, { macros: MACROS, kg }).map((f) => [f.severity, f.subject])).toEqual([["warning", "nowhere"]]);
  });
});

describe("macroTableFromKatex", () => {
  test("built-ins, then each page macro's arity from its body", () => {
    const t = macroTableFromKatex({ "\\LM": "\\mathrm{LM}", "\\pair": "\\langle #1, #2 \\rangle", "\\bad name": "x" });
    expect(t.frac).toEqual({ args: 2, optional: false });
    expect(t.LM).toEqual({ args: 0, optional: false });
    expect(t.pair).toEqual({ args: 2, optional: false });
    expect(t["bad name"]).toBeUndefined();
    expect(checkLatex("$\\pair{a}$", { macros: t }).map((f) => f.severity)).toEqual(["error"]);
  });
});
