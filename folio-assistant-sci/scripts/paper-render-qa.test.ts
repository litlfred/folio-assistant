import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { leanMatcher, renderQa } from "./paper-render-qa.ts";

const ROOT = mkdtempSync(join(tmpdir(), "render-qa-"));
afterAll(() => rmSync(ROOT, { recursive: true, force: true }));

function build(name: string, chapter: string, log = "", main = ""): string {
  const d = join(ROOT, name);
  mkdirSync(join(d, "chapters"), { recursive: true });
  writeFileSync(join(d, "chapters", "ch1.tex"), chapter);
  if (log) writeFileSync(join(d, "main.log"), log);
  if (main) writeFileSync(join(d, "main.tex"), main);
  return d;
}

describe("paper render QA, on the rendering axis", () => {
  test("leanNamespacesComeFromTheFolio", () => {
    const m = leanMatcher(["MyPaper"]);
    expect(m("MyPaper.Foo.bar")).toBe(true);
    expect(m("QOU.Foo.bar")).toBe(false);
    expect(m("CommRing")).toBe(true);
    expect(m("sorry")).toBe(true);
  });

  test("findsEachCheckAndCountsIt", () => {
    const tex =
      "\\blockannot{def:x}{k}{ch/x.md} We use \\texttt{MyPaper.Foo} and \\texttt{def:other}; a quantum- universe.\n" +
      "\\begin{definition}\\label{def:long}" + " word".repeat(130) + "\\end{definition}\n" +
      "See https://github.com/OWNER/REPO/blob/x.\n";
    const r = renderQa(build("a", tex, "Label `def:x' multiply defined."), { root: ROOT, namespaces: ["MyPaper"] });
    expect(r.leanInNarrative.map((h) => h.text)).toEqual(["MyPaper.Foo", "def:other"]);
    expect(r.brokenHyphens.map((h) => h.text)).toEqual(["quantum- universe"]);
    expect(r.longDefinitions).toEqual([{ block: "def:long", words: 130 }]);
    expect(r.multiplyDefined).toEqual(["def:x"]);
    expect(r.placeholderLinks).toHaveLength(1);
    expect(r.checks["placeholder-link"]).toBe("fail");
    expect(r.counts).toEqual({ fail: 1, warn: 4 });
  });

  test("aCleanBuildPassesAndNoLogIsNotApplicable", () => {
    const r = renderQa(build("b", "\\blockannot{def:y}{k}{ch/y.md} Plain prose.\n"), { root: ROOT, namespaces: [] });
    expect(r.counts).toEqual({ pass: 4, na: 1 });
    expect(r.checks["multiply-defined"]).toBe("n/a");
  });

  test("noRenderedPaperIsNotApplicableNotClean", () => {
    const empty = join(ROOT, "empty");
    mkdirSync(empty, { recursive: true });
    const r = renderQa(empty, { root: ROOT, namespaces: [] });
    expect(r.counts).toEqual({ na: 5 });
    expect(r.reason).toContain("not applicable, not clean");
  });
});
