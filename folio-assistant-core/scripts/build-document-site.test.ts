/**
 * build-document-site (bean fyu2) over a folio `init-folio` actually
 * scaffolds, with the platform linked the way a folio links it. Not a
 * hand-made fixture: the point is that the command a new folio's staging
 * workflow runs works on what that folio starts as.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { appendFileSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { buildDocumentSite, citationsToHtml, documentManifests, katexMacros, renderDocumentHtml, splitBlocks, type Outline } from "./build-document-site.js";
import { readPositions } from "../schemas/changeset.js";
import { initFolio } from "../../cat-harness/scripts/init-folio.js";

const REPO_ROOT = resolve(import.meta.dir, "../..");

let roots: string[] = [];
afterEach(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
  roots = [];
});

function scaffold(): string {
  const d = mkdtempSync(join(tmpdir(), "docsite-"));
  roots.push(d);
  initFolio({ targetDir: d, slug: "handbook", title: "Handbook", authors: ["A"], contentType: "document", skipVcs: true, link: "submodule" } as Parameters<typeof initFolio>[0]);
  symlinkSync(REPO_ROOT, join(d, "folio-assistant"));
  return d;
}

describe("build-document-site", () => {
  test("a freshly scaffolded document folio builds: index, one page per document, block anchors intact", async () => {
    const d = scaffold();
    const out = join(d, "_site");
    const r = await buildDocumentSite(d, out);
    expect(r.errors).toEqual([]);
    expect(r.documents.map((x) => x.slug)).toEqual(["handbook"]);
    expect(existsSync(join(out, "index.html"))).toBe(true);
    const html = readFileSync(join(out, "handbook", "index.html"), "utf-8");
    // The anchors the review page and the ChangeSet link to, by label.
    expect(html).toContain('<a id="prose:overview"></a>');
    expect(html).toContain('<a id="chap:introduction"></a>');
    expect(readFileSync(join(out, "index.html"), "utf-8")).toContain('href="handbook/index.html"');
  });

  test("a Markdown table in a block renders as a <table>, not raw pipes (fz39)", async () => {
    const d = scaffold();
    appendFileSync(join(d, "folio", "handbook", "introduction", "overview.md"), "\n\n| Role | who |\n|---|---|\n| Bootstrapping Agent | you |\n");
    const out = join(d, "_site");
    await buildDocumentSite(d, out);
    const html = readFileSync(join(out, "handbook", "index.html"), "utf-8");
    expect(html).toContain("<table>");
    expect(html).toContain("<td>Bootstrapping Agent</td>");
    expect(html).not.toContain("| Bootstrapping Agent |");
  });

  test("outline.json lists sections in manifest order, keyed exactly as the ChangeSet keys them (eb4l)", async () => {
    const d = scaffold();
    const out = join(d, "_site");
    await buildDocumentSite(d, out);
    const outline = JSON.parse(readFileSync(join(out, "outline.json"), "utf-8")) as Outline;
    expect(outline.$schema).toBe("folio-outline/v1");
    const sections = outline.documents.flatMap((doc) => doc.chapters.flatMap((c) => c.sections));
    expect(sections.map((s) => s.blocks)).toEqual([["prose:overview"]]);
    // The join the review page relies on: every section the ChangeSet can name is in the outline.
    const csKeys = new Set([...readPositions(join(d, "folio")).values()].map((p) => p.section));
    expect(new Set(sections.map((s) => s.key))).toEqual(csKeys);
  });

  test("a folio with no document is an error, not an empty site", async () => {
    const d = mkdtempSync(join(tmpdir(), "docsite-empty-"));
    roots.push(d);
    expect(documentManifests(d)).toEqual([]);
    const r = await buildDocumentSite(d, join(d, "_site"));
    expect(r.errors[0]).toContain("no document manifest");
    expect(existsSync(join(d, "_site", "index.html"))).toBe(false);
  });
});

describe("the harness rail lands in the page, not in its stylesheet (owner, 2026-10-05)", () => {
  test("every page's first <body and <main are the real tags, after the style", async () => {
    // The rail injector finds a page's first body and main tags BY TEXT. A
    // CSS comment that named them put the whole navigation inside <style>,
    // and the published page lost both its rail and its gutters.
    const d = scaffold();
    const out = join(d, "_site");
    await buildDocumentSite(d, out);
    for (const f of [join(out, "index.html"), join(out, "handbook", "index.html"), join(out, "review", "index.html")]) {
      const html = readFileSync(f, "utf-8");
      const styleEnd = html.indexOf("</style>");
      expect({ f, body: html.indexOf("<body") > styleEnd, main: html.indexOf("<main") > styleEnd }).toEqual({ f, body: true, main: true });
    }
  });
});

describe("paper content: math, glossary directives and citations (owner, 2026-10-05)", () => {
  test("with math on, an equation is claimed before emphasis and marked for KaTeX", async () => {
    const html = await renderDocumentHtml("Let $a_i * b_j$ hold, and\n\n$$\\sum_i x_i$$\n", { math: true });
    expect(html).toContain('class="language-math math-inline">a_i * b_j</code>');
    expect(html).toContain("math-display");
    expect(html).not.toContain("<em>");
  });

  test("with math off, a document's dollar amounts stay prose", async () => {
    const html = await renderDocumentHtml("It cost $5 million and $3 more.", { math: false });
    expect(html).not.toContain("math-inline");
    expect(html).toContain("$5 million and $3 more.");
  });

  test(":defterm becomes a definition with an id, :refterm links to it", async () => {
    const html = await renderDocumentHtml("A :defterm[braid]{#braid-group} is here; see :refterm[braids]{#braid-group}.", { math: false });
    expect(html).toContain('<dfn class="defterm" id="term-braid-group">braid</dfn>');
    expect(html).toContain('<a class="refterm" href="#term-braid-group">braids</a>');
  });

  test("a directive of any other name is put back as the text it was written as", async () => {
    const html = await renderDocumentHtml("Ratio note:alpha stays.", { math: false });
    expect(html).toContain("note:alpha stays.");
  });

  test("\\cite becomes a citation label, but not inside fenced code", () => {
    const md = "As in \\cite{a, b}.\n```tex\n\\cite{c}\n```\n";
    const out = citationsToHtml(md);
    expect(out).toContain('<span class="cite" data-keys="a b">[a, b]</span>');
    expect(out).toContain("\\cite{c}");
  });

  test("the macro table is the viewer's: \\name -> tex from the paper manifest", () => {
    expect(katexMacros({ qou: { tex: "\\mathbf{Q}" } })["\\qou"]).toBe("\\mathbf{Q}");
    expect(katexMacros(undefined)["\\bigbowtie"]).toBe("\\bowtie");
  });
});

describe("lazy pages: the block text as data (bean v433)", () => {
  test("splitBlocks keeps headings and anchors in the shell, never splits inside a fence", () => {
    const md = [
      "# Chapter", "", '<a id="chap:one"></a>', "", "## Section", "",
      '<a id="prose:a"></a>', "Block A text.", "", "```", '<a id="prose:not-an-anchor"></a>', "# not a heading", "```", "",
      '<a id="prose:b"></a>', "Block B text.", "", "## Next",
    ].join("\n");
    const s = splitBlocks(md, new Set(["prose:a", "prose:b", "prose:not-an-anchor"]));
    expect(s.blocks.map((b) => b.label)).toEqual(["prose:a", "prose:b"]);
    expect(s.blocks[0]!.markdown).toContain("# not a heading");
    expect(s.blocks[0]!.markdown).toContain("Block A text.");
    expect(s.shell).toContain('<a id="chap:one"></a>');
    expect(s.shell).toContain('<div class="fa-blk" data-blk="prose:a"></div>');
    expect(s.shell).not.toContain("Block A text.");
    expect(s.shell).toContain("## Next");
  });

  test("--lazy always: a shell, chunked block JSON, and the whole text in full.html", async () => {
    const d = scaffold();
    appendFileSync(join(d, "folio", "handbook", "introduction", "overview.md"), "\n\n| Role | who |\n|---|---|\n| Bootstrapping Agent | you |\n");
    const out = join(d, "_site");
    const r = await buildDocumentSite(d, out, { lazy: "always", actions: { repo: "o/r" } });
    expect(r.errors).toEqual([]);
    const shell = readFileSync(join(out, "handbook", "index.html"), "utf-8");
    expect(shell).toContain('<a id="prose:overview"></a>');
    expect(shell).toContain('<div class="fa-blk" data-blk="prose:overview"></div>');
    expect(shell).not.toContain("<td>Bootstrapping Agent</td>");
    expect(shell).toContain('id="fa-blocks"');
    expect(shell).toContain('href="full.html"');
    // compact links on the shell, full links on the one-page version
    expect(shell).toContain('data-src="folio/handbook/introduction/overview.md"');
    const chunk = JSON.parse(readFileSync(join(out, "handbook", "blocks", "000.json"), "utf-8")) as Record<string, string>;
    expect(chunk["prose:overview"]).toContain("<td>Bootstrapping Agent</td>");
    const full = readFileSync(join(out, "handbook", "full.html"), "utf-8");
    expect(full).toContain("<td>Bootstrapping Agent</td>");
    expect(full).toContain("https://github.com/o/r/edit/main/folio/handbook/introduction/overview.md");
  });

  test("auto stays one page below the threshold", async () => {
    const d = scaffold();
    const out = join(d, "_site");
    await buildDocumentSite(d, out);
    expect(existsSync(join(out, "handbook", "full.html"))).toBe(false);
    expect(existsSync(join(out, "handbook", "blocks"))).toBe(false);
  });
});
