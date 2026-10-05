/**
 * build-folio-site (owner, 2026-10-05): lightweight static shells at
 * <route>/<paper>/<chapter>/<section>/ that load KG content dynamically. Run
 * over a folio `init-folio` actually scaffolds, as build-document-site's tests are.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { buildFolioSite, sectionSlug, shellHtml, type SiteOutline } from "./build-folio-site.js";
import { initFolio } from "../../cat-harness/scripts/init-folio.js";

const REPO_ROOT = resolve(import.meta.dir, "../..");
let roots: string[] = [];
afterEach(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
  roots = [];
});

function scaffold(): string {
  const d = mkdtempSync(join(tmpdir(), "folsite-"));
  roots.push(d);
  initFolio({ targetDir: d, slug: "handbook", title: "Handbook", authors: ["A"], contentType: "document", skipVcs: true, link: "submodule" } as Parameters<typeof initFolio>[0]);
  symlinkSync(REPO_ROOT, join(d, "folio-assistant"));
  return d;
}

describe("build-folio-site", () => {
  test("shells exist at <route>/<paper>/<chapter>/<section>/, and each is tiny", async () => {
    const d = scaffold();
    const out = join(d, "_site");
    const r = await buildFolioSite(d, out);
    expect(r.errors).toEqual([]);
    const base = join(out, "cat-harness", "folio");
    const outline = JSON.parse(readFileSync(join(base, "handbook", "outline.json"), "utf-8")) as SiteOutline;
    expect(outline.$schema).toBe("folio-site-outline/v1");
    const ch = outline.chapters[0]!;
    const sec = ch.sections[0]!;
    for (const p of [[], ["handbook"], ["handbook", ch.slug], ["handbook", ch.slug, sec.slug]]) {
      const f = join(base, ...p, "index.html");
      expect(existsSync(f)).toBe(true);
      expect(statSync(f).size).toBeLessThan(2048);
    }
    expect(existsSync(join(base, "assets", "folio-site.js"))).toBe(true);
  });

  test("a block payload is the block's KG node plus its rendered html, and every label maps to its section page", async () => {
    const d = scaffold();
    const out = join(d, "_site");
    await buildFolioSite(d, out);
    const base = join(out, "cat-harness", "folio", "handbook");
    const outline = JSON.parse(readFileSync(join(base, "outline.json"), "utf-8")) as SiteOutline;
    const sec = outline.chapters[0]!.sections[0]!;
    const node = JSON.parse(readFileSync(join(base, sec.blocks[0]!), "utf-8")) as { html: string; label?: string };
    expect(node.html).toContain('<a id="prose:overview"></a>');
    expect(outline.labels["prose:overview"]).toBe(`${outline.chapters[0]!.slug}/${sec.slug}`);
  });

  test("the route is configurable, and a shell's links are relative to its own depth", async () => {
    const d = scaffold();
    const out = join(d, "_site");
    await buildFolioSite(d, out, { route: "docs/x" });
    expect(existsSync(join(out, "docs", "x", "handbook", "index.html"))).toBe(true);
    expect(shellHtml("T", 3, { paper: "p", path: "a/b" })).toContain('src="../../../assets/folio-site.js"');
    expect(shellHtml("T", 0, {})).toContain('data-root="./"');
  });

  test("section slugs drop the label prefix and never collide", () => {
    const taken = new Set<string>();
    expect(sectionSlug({ label: "sec:braid-group", title: "x" }, taken)).toBe("braid-group");
    expect(sectionSlug({ title: "Braid group" }, taken)).toBe("braid-group-2");
    expect(sectionSlug({ title: "$q$-Langlands" }, taken)).toBe("q-langlands");
  });
});

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { preambleMacros, texFences } from "./build-folio-site.js";
import { qaBlockHtml } from "./folio-site-qa.js";
import { citationsToHtml, renderDocumentHtml, texInMarkdown } from "./build-document-site.js";

describe("rendered-content handling and QA (owner, 2026-10-05)", () => {
  test("a ```tex fence becomes its pre-rendered SVG only when the HASH matches", () => {
    const md = "```tex\n\\begin{tikzcd} A \\ar[r] & B \\end{tikzcd}\n```\n";
    const real = createHash("sha256").update("\\begin{tikzcd} A \\ar[r] & B \\end{tikzcd}").digest("hex").slice(0, 12);
    const hit = texFences(md, { math: true, rendered: [{ hash: real, url: "rendered/x-0.svg" }], asset: () => "rendered/ch/x-0.svg" });
    expect(hit).toContain('<img data-src="rendered/ch/x-0.svg"');
    const stale = texFences(md, { math: true, rendered: [{ hash: "000000000000", url: "rendered/x-0.svg" }], asset: () => "rendered/ch/x-0.svg" });
    expect(stale).not.toContain("<img");
    expect(stale).toContain("[Diagram]");
  });

  test("an equation fence with no SVG becomes display math, unwrapped and unlabelled", () => {
    const out = texFences("```tex\n\\begin{equation}\\label{eq:a} x = 1 \\end{equation}\n```\n", { math: true, rendered: [], asset: () => undefined });
    expect(out).toContain("$$\nx = 1\n$$");
  });

  test("preamble \\newcommand and \\DeclareMathOperator become KaTeX macros", () => {
    const d = mkdtempSync(join(tmpdir(), "pre-"));
    roots.push(d);
    mkdirSync(join(d, "latex"));
    writeFileSync(join(d, "latex", "p.tex"), "\\newcommand{\\pp}{p} % prime\n\\newcommand{\\ip}[2]{\\langle #1,#2\\rangle}\n\\DeclareMathOperator{\\Hom}{Hom}\n");
    expect(preambleMacros(d)).toEqual({ "\\pp": "p", "\\ip": "\\langle #1,#2\\rangle", "\\Hom": "\\operatorname{Hom}" });
  });

  test("TeX that Markdown misreads is rewritten to an equivalent KaTeX accepts", () => {
    expect(texInMarkdown("$\\text{$n$-body}$")).toBe("$\\text{\\(n\\)-body}$");
    expect(texInMarkdown("| $\\langle a | b\\rangle$ | x |")).toContain("\\langle a \\vert  b\\rangle");
    expect(texInMarkdown("$a$$b$")).toBe("$a$ $b$");
    expect(texInMarkdown("see \\ref{eq:x}")).toBe('see <a href="#eq:x">eq:x</a>');
    expect(texInMarkdown("$\\begin{psmallmatrix} a \\end{psmallmatrix}$")).toBe("$\\left(\\begin{smallmatrix} a \\end{smallmatrix}\\right)$");
  });

  test("a citation wrapped across lines is one citation; fenced code is left alone", () => {
    expect(citationsToHtml("as in \\cite{a,\n  b}; done")).toBe('as in <span class="cite" data-keys="a b">[a, b]</span>; done');
    const fenced = "```tex\n\\cite{x}\n```\n\n\\cite{y}";
    expect(citationsToHtml(fenced)).toBe('```tex\n\\cite{x}\n```\n\n<span class="cite" data-keys="y">[y]</span>');
    expect(citationsToHtml("a\n\nb")).toBe("a\n\nb");
  });

  test("the QA reads the HTML a reader gets: raw TeX, stray dollars and KaTeX errors are findings", async () => {
    const html = await renderDocumentHtml("Fine $x^2$ and bad $\\frac{1$ and raw \\begin{foo} text.", { math: true });
    const { findings } = await qaBlockHtml("b", html, { math: true, macros: {} });
    const classes = findings.map((f) => f.class).sort();
    expect(classes).toContain("raw-tex");
    expect(classes).toContain("katex");
    const clean = await qaBlockHtml("c", await renderDocumentHtml("A $\\langle a, b\\rangle$ & $x<y$.", { math: true }), { math: true, macros: {} });
    expect(clean.findings).toEqual([]);
  });
});
