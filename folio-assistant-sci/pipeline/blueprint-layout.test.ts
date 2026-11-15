/**
 * The blueprint layout (bean `a1ku`) — a paper's `blueprint/src/`, derived
 * from its manifest and rendered chapters, in the layout leanblueprint builds.
 *
 * Verified end to end outside this suite: qou's unital-groebner-bases paper
 * through plasTeX 3.1 + leanblueprint 0.0.20 builds its dependency graph
 * (23 nodes, 22 `\lean`). plasTeX needs `kpsewhich` to `\input` a file in a
 * subdirectory; without it `macros/common` is "not found", every theorem
 * environment is unrecognised, and plasTeX dies with
 * `unhashable type: 'definition'`. CI's TeX Live image has it.
 */

import { describe, expect, test } from "bun:test";
import { ENV_NAMES } from "../../cat-harness-tools/pipeline/render-latex";
import { buildBlueprintLayout, macroArity, theoremDeclarations } from "./blueprint-layout";
import type { FormalView } from "./blueprint-export";

const CHAPTER = String.raw`\chapter{One}\chapterannot{one}{ch:one}
\section{S}\sectionannot{sec:s}
\begin{definition}[{Group}]
  \label{def:group}
  \blockannot[compiled]{def:group}{Foo.Group}{ch/def-group.md}
  \uses{rem:why}
A group $\LM(x)$.
\end{definition}
\begin{lemma}[{L}]
  \label{lem:l}
  \blockannot[stubbed]{lem:l}{Foo.l}{ch/lem-l.md}
Stated.
\end{lemma}`;

const formal: FormalView = { source: "elaborated", typeDeps: new Map([["lem:l", ["def:group"]]]), valueDeps: new Map() };

const layout = buildBlueprintLayout({
  paper: { title: "Rings & Things_2", authors: ["A. One", "B. Two"], macros: { LM: { tex: "\\mathrm{LM}" }, pair: { tex: "\\langle #1, #2 \\rangle" } } },
  chapters: [CHAPTER],
  formal,
});
const f = layout.files;

describe("the blueprint layout", () => {
  test("layoutHasLeanblueprintFiles", () => {
    expect(Object.keys(f).sort()).toEqual(
      ["content.tex", "extra_styles.css", "latexmkrc", "macros/common.tex", "macros/print.tex", "macros/web.tex", "plastex.cfg", "print.tex", "web.tex"],
    );
    expect(f["plastex.cfg"]).toContain("plugins=plastexdepgraph plastexshowmore leanblueprint");
    expect(f["web.tex"]).toContain("\\usepackage[showmore, dep_graph]{blueprint}");
  });

  test("contentHasLeanAndFormalUses", () => {
    expect(f["content.tex"]).toContain("\\lean{Foo.Group}");
    expect(f["content.tex"]).toContain("\\uses{def:group}");
    expect(f["content.tex"]).not.toContain("rem:why");
    expect(layout.export.removedEditorial).toBe(1);
  });

  test("marginAnnotationsReadThenStripped", () => {
    expect(f["content.tex"]).not.toMatch(/\\(blockannot|sectionannot|chapterannot)/);
    // ...and were read: the compiled definition is \leanok, the stubbed lemma is not.
    expect(layout.export.leanok).toBe(1);
  });

  test("everyEnvDeclaredTheoremFirst", () => {
    const common = f["macros/common.tex"]!;
    const decls = theoremDeclarations();
    expect(decls[0]).toBe("\\newtheorem{theorem}{Theorem}");
    for (const env of new Set(Object.values(ENV_NAMES))) {
      if (env === "proof") continue; // amsthm's own
      expect(common).toMatch(new RegExp(`\\\\newtheorem\\{${env}\\}`));
    }
    expect(common.indexOf("\\theoremstyle{definition}")).toBeLessThan(common.indexOf("\\newtheorem{definition}"));
  });

  test("paperMacrosWithArity", () => {
    expect(macroArity("\\langle #1, #2 \\rangle")).toBe(2);
    expect(f["macros/common.tex"]).toContain("\\newcommand{\\LM}{\\mathrm{LM}}");
    expect(f["macros/common.tex"]).toContain("\\newcommand{\\pair}[2]{\\langle #1, #2 \\rangle}");
  });

  test("titleAuthorsEscapedAndInPdfOnly", () => {
    expect(f["print.tex"]).toContain("\\title{Rings \\& Things\\_2}");
    expect(f["print.tex"]).toContain("\\author{A. One \\and B. Two}");
    expect(f["web.tex"]).toContain("\\author{A. One, B. Two}");
  });

  test("pdfGetsNoOpTwins", () => {
    for (const c of ["\\lean", "\\leanok", "\\uses", "\\proves"]) expect(f["macros/print.tex"]).toContain(c);
  });

  test("everyFileSaysGenerated", () => {
    for (const [name, text] of Object.entries(f)) expect(text, name).toMatch(/GENERATED/);
  });
});
