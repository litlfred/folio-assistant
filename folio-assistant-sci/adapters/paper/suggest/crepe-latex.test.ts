/**
 * Crepe's math editor (Milkdown Crepe 7.22.2, the version the ✍ suggest
 * runtime loads), run headless over this library's paper blocks. The test
 * pins what Crepe does unrepaired and shows the paper profile's repairs fixing
 * it (bean `4dx7`; owner, 2026-10-14: "make sure Crepe's math editor is valid
 * for folio-assistant-sci").
 *
 * Front matter is stripped first. A block's `.md` carries YAML that Crepe
 * would rewrite into a thematic break and a setext heading, and the runtime
 * edits the body only.
 */

import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { crepeFeatureConfigs, inlineMathNodeView, useLatexAtoms } from "./crepe-latex";
import { checkSuggestion, macroTable } from "./latex-check";

GlobalRegistrator.register({ url: "http://localhost/" });
// KaTeX refuses quirks mode; happy-dom starts in it.
Object.defineProperty(document, "compatMode", { value: "CSS1Compat" });

const { Crepe } = await import("@milkdown/crepe");
const { InitReady, nodeViewCtx, remarkPluginsCtx } = await import("@milkdown/kit/core");
// The KaTeX Crepe itself depends on (`^0.18`), resolved from Crepe's own
// package, not a KaTeX of this instance's: the root's hoisted KaTeX is
// folio-assistant-core's 0.16, the version the published site renders with,
// and declaring a second one here put a nested `node_modules` in this
// directory that check-environment refuses (bean 3vc1).
const CREPE_ENTRY = fileURLToPath(import.meta.resolve("@milkdown/crepe"));
const katex = (await import(createRequire(CREPE_ENTRY).resolve("katex"))).default;

afterAll(() => GlobalRegistrator.unregister());

const SCI = join(import.meta.dir, "..", "..", "..");
const LIB = join(SCI, "library");
const PREAMBLE = readFileSync(join(SCI, "adapters", "paper", "latex", "paper-preamble.tex"), "utf8");
const MACROS = macroTable({ LM: { tex: "\\mathrm{LM}" } }, PREAMBLE);
const KATEX_MACROS = { "\\LM": "\\mathrm{LM}" };
const body = (md: string) => md.replace(/^---\n[\s\S]*?\n---\n/, "");

/** Every library section whose body has math, as the runtime would load it. */
const MATH_SECTIONS = readdirSync(LIB).flatMap((d) => {
  let files: string[] = [];
  try { files = readdirSync(join(LIB, d, "sections")).filter((f) => f.endsWith(".md")); } catch { return []; }
  return files.map((f) => ({ name: `${d}/${f}`, md: body(readFileSync(join(LIB, d, "sections", f), "utf8")) })).filter((s) => s.md.includes("$"));
});
const SEC006 = MATH_SECTIONS.find((s) => s.name.endsWith("sec-006-latex-export.md"))!;

interface Run { markdown: string; html: string }

async function crepe(md: string, repaired: boolean): Promise<Run> {
  const root = document.createElement("div");
  document.body.appendChild(root);
  const c = new Crepe({ root, defaultValue: md, featureConfigs: crepeFeatureConfigs(Crepe.Feature, KATEX_MACROS) });
  if (repaired) {
    // When `$remark` plugins register (after InitReady, before the schema builds the parser), placed first.
    c.editor.use((ctx) => async () => {
      await ctx.wait(InitReady);
      ctx.update(remarkPluginsCtx, useLatexAtoms(MACROS) as never);
      ctx.update(nodeViewCtx, (v) => [...v, ["math_inline", inlineMathNodeView(katex, KATEX_MACROS)] as never]);
    });
  }
  await c.create();
  const run = { markdown: c.getMarkdown(), html: root.innerHTML };
  await c.destroy();
  root.remove();
  return run;
}

const mathSpans = (s: string) => [...s.matchAll(/\$\$[\s\S]+?\$\$|\$[^$\n]+\$/g)].map((m) => m[0]);

describe("the library's math survives Crepe", () => {
  test("there is math to test", () => {
    expect(MATH_SECTIONS.length).toBeGreaterThanOrEqual(5);
    expect(SEC006).toBeDefined();
  });

  test("the LaTeX-export block round-trips byte for byte, repaired or not", async () => {
    expect((await crepe(SEC006.md, false)).markdown).toBe(SEC006.md);
    expect((await crepe(SEC006.md, true)).markdown).toBe(SEC006.md);
  });

  test("with the repairs, every math span in every section comes back unchanged", async () => {
    for (const s of MATH_SECTIONS) {
      // Prose that only TALKS about `$` (a delimiter list) is not math. Crepe escapes it, and that is right.
      const want = mathSpans(s.md).filter((m) => !/^\$, \$$/.test(m));
      const got = mathSpans((await crepe(s.md, true)).markdown);
      for (const m of want) expect({ section: s.name, kept: got.includes(m) }).toEqual({ section: s.name, kept: true });
    }
  });

  test("Crepe's own output for a section passes the syntax checks", async () => {
    for (const s of MATH_SECTIONS) {
      const out = (await crepe(s.md, true)).markdown;
      expect({ section: s.name, errors: checkSuggestion(s.md, out, { macros: MACROS }).filter((f) => f.severity === "error") })
        .toEqual({ section: s.name, errors: [] });
    }
  });
});

describe("repair 1: inline math gets the paper's macros", () => {
  const MD = "Inline $\\LM(x)$.\n";
  const errorRed = /#cc0000/;

  test("unrepaired, Crepe 7.22.2 ignores katexOptions.macros inline", async () => {
    expect((await crepe(MD, false)).html).toMatch(errorRed);
  });

  test("repaired, the macro renders and the source is kept", async () => {
    const r = await crepe(MD, true);
    expect(r.html).not.toMatch(errorRed);
    expect(r.html).toContain('data-type="math_inline"');
    expect(r.markdown).toBe(MD);
  });
});

describe("repair 2: LaTeX outside math is kept verbatim", () => {
  const CASES = [
    "\\begin{theorem}[Fermat]\n\\label{thm:f}\nFor $n>2$ there are no $a,b,c$.\n\\end{theorem}\n",
    "See \\cite[p.~3]{milnor1965} and \\eqref{eq:one}.\n",
    "Before.\n\n\\begin{proof}[Sketch]\nFirst.\n\nSecond, by \\cref{lem:a}.\n\\end{proof}\n\nAfter.\n",
  ];

  test("unrepaired, Crepe escapes optional arguments into broken LaTeX", async () => {
    expect((await crepe(CASES[0]!, false)).markdown).toContain("\\begin{theorem}\\[Fermat]");
    expect((await crepe(CASES[1]!, false)).markdown).toContain("\\cite\\[p.\\~3]");
  });

  test("repaired, each comes back byte for byte", async () => {
    for (const md of CASES) expect((await crepe(md, true)).markdown).toBe(md);
  });

  test("an edit outside the LaTeX still lands, and the LaTeX beside it is untouched", async () => {
    const md = CASES[1]!.replace("See", "Compare");
    const out = (await crepe(md, true)).markdown;
    expect(out).toBe(md);
    expect(checkSuggestion(CASES[1]!, out, { macros: MACROS })).toEqual([]);
  });
});

describe("what Crepe changes and the repairs leave alone", () => {
  test("`$$x$$` written inline comes back as `$x$`", async () => {
    // remark-math reads both as inlineMath. The site renders both inline, so the meaning is the same.
    expect((await crepe("Inline $$x^2$$ here.\n", true)).markdown).toBe("Inline $x^2$ here.\n");
  });

  test("display math, with an aligned environment inside it, is Crepe's own and round-trips", async () => {
    const md = "$$\n\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}\n$$\n";
    expect((await crepe(md, false)).markdown).toBe(md);
    expect((await crepe(md, true)).markdown).toBe(md);
  });
});

beforeAll(() => expect(katex.version.startsWith("0.18")).toBe(true));
