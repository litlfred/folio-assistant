/**
 * The blueprint export writes the FORMAL relation into `\uses`, removes the
 * editorial one, and takes `\leanok` from the status the render already
 * computed. folio-assistant#1492.
 */

import { describe, expect, test } from "bun:test";
import { checkProblems, exportBlueprint, type FormalView } from "./blueprint-export";

/** The shape render-latex.ts emits for a statement and its proof. */
const TEX = String.raw`\begin{document}
\begin{definition}[{Group}]
  \label{def:group}
  \blockannot[compiled]{def:group}{Foo.Group}{ch/def-group.md}
A group is ...
\end{definition}
\begin{theorem}[{Lagrange}]
  \label{thm:lagrange}
  \blockannot[drafted]{thm:lagrange}{Foo.lagrange}{ch/thm-lagrange.md}
  \uses{def:group, rem:motivation}
The order of a subgroup divides ...
\end{theorem}
\begin{proof}
  \label{prf:lagrange}
  \blockannot[drafted]{prf:lagrange}{}{ch/prf-lagrange.md}
  \uses{def:group}
By cosets.
\end{proof}
\begin{theorem}[{Cauchy}]
  \label{thm:cauchy}
  \blockannot[compiled]{thm:cauchy}{Foo.cauchy}{ch/thm-cauchy.md}
Stated.
\end{theorem}
\begin{proof}
Done.
\end{proof}
\begin{remark}[{Motivation}]
  \label{rem:motivation}
  \blockannot[drafted]{rem:motivation}{}{ch/rem-motivation.md}
Why.
\end{remark}
\end{document}`;

const view = (over: Partial<FormalView> = {}): FormalView => ({
  source: "elaborated",
  typeDeps: new Map([["thm:lagrange", ["def:group"]], ["thm:cauchy", ["def:group", "def:not-rendered"]]]),
  valueDeps: new Map([["thm:lagrange", ["lem:cosets", "thm:cauchy"]], ["thm:cauchy", ["thm:lagrange"]]]),
  ...over,
});

describe("blueprint export", () => {
  const r = exportBlueprint(TEX, view());

  test("removesEditorialUses", () => {
    expect(r.removedEditorial).toBe(2);
    expect(r.tex).not.toMatch(/\\uses\{[^}]*rem:motivation/); // the editorial-only edge is gone
  });

  test("leanFromRefOnStatementsOnly", () => {
    expect(r.tex).toContain("\\lean{Foo.Group}");
    expect(r.tex).toContain("\\lean{Foo.lagrange}");
    expect(r.lean).toBe(3);
  });

  test("leanokStatementStatedProofCompiled", () => {
    const lagrange = r.tex.slice(r.tex.indexOf("{Lagrange}"), r.tex.indexOf("By cosets."));
    // statement stated → \leanok; its proof drafted → no \leanok in the proof
    expect(lagrange.split("\\leanok").length - 1).toBe(1);
    const cauchy = r.tex.slice(r.tex.indexOf("{Cauchy}"), r.tex.indexOf("Done."));
    expect(cauchy.split("\\leanok").length - 1).toBe(2);
  });

  test("typeDepsInStatementValueInProof", () => {
    const stmt = r.tex.slice(r.tex.indexOf("{Lagrange}"), r.tex.indexOf("\\end{theorem}"));
    expect(stmt).toContain("\\uses{def:group}");
    const proof = r.tex.slice(r.tex.indexOf("\\begin{proof}"), r.tex.indexOf("By cosets."));
    expect(proof).toContain("\\uses{thm:cauchy}");
  });

  test("danglingTargetDroppedReported", () => {
    expect(r.tex).not.toContain("def:not-rendered");
    expect(r.tex).not.toContain("lem:cosets");
    expect(r.dangling).toEqual(["def:not-rendered", "lem:cosets"]);
  });

  test("formalSourceStamped", () => {
    expect(r.tex.split("\n")[0]).toContain('source "elaborated"');
    expect(checkProblems(r)).toEqual([]);
  });

  test("noFormalCacheUnavailable", () => {
    const none = exportBlueprint(TEX, view({ source: undefined, typeDeps: new Map(), valueDeps: new Map() }));
    expect(none.tex).not.toMatch(/\\uses\{/);
    expect(none.tex.split("\n")[0]).toContain("UNAVAILABLE");
    expect(checkProblems(none)[0]).toContain("unavailable");
  });

  test("scanGraphFailsCheck", () => {
    const scan = exportBlueprint(TEX, view({ source: "scan" }));
    expect(scan.tex.split("\n")[0]).toContain("NOT elaborated");
    expect(checkProblems(scan)[0]).toContain('"scan"');
  });

  test("valueDepsWithoutProofReported", () => {
    const tex = TEX.replace(/\\begin\{proof\}\nDone\.\n\\end\{proof\}\n/, "");
    expect(exportBlueprint(tex, view()).valueWithoutProof).toEqual(["thm:cauchy"]);
  });

  test("selfEdgeDropped", () => {
    const self = exportBlueprint(TEX, view({ typeDeps: new Map([["thm:lagrange", ["thm:lagrange", "def:group"]]]), valueDeps: new Map() }));
    expect(self.tex).toContain("\\uses{def:group}");
    expect(self.tex).not.toMatch(/\\uses\{[^}]*thm:lagrange/);
  });
});
