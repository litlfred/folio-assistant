/**
 * The landing page's sections follow one order on every harnessed site and read
 * the navbar's own rows (owner, 2026-11-28: "landing page and navbar should
 * align"). These tests pin the pure parts and one run on a fixture site.
 *
 * @module cat-harness-tools/scripts/tests/landing-sections.test
 */
import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { alsoItems, landingSections, liveThenAll, withDocumentKgLinks, writeLandingSections } from "../gen-landing-sections.js";

const base = {
  instance: "x",
  title: "X Folio",
  description: "X — what it **is**",
  visualisers: [],
  about: [],
  dependencies: [],
  dependencyFolders: [],
  harnessJsonld: () => false,
};

describe("landing sections", () => {
  it("are in the owner's order: Folders, Processes, Visualizers, Harnesses", () => {
    const { rest } = landingSections({
      ...base,
      processes: "en/cat-harness/processes/x/",
      rail: {
        links: [{ label: "Code", href: "@fa-rail-to-root@/en/cat-harness/code/x/" }],
        pages: [{ label: "QA", href: "@fa-rail-to-root@/qa/" }],
        harnesses: [{ label: "X Folio", href: "@fa-rail-to-root@/en/cat-harness/harness/x/" }],
      },
    });
    const at = (id: string) => rest.indexOf(`id="${id}"`);
    expect(at("folders")).toBeGreaterThanOrEqual(0);
    expect(at("folders")).toBeLessThan(at("processes"));
    expect(at("processes")).toBeLessThan(at("visualizers"));
    expect(at("visualizers")).toBeLessThan(at("harnesses"));
  });

  it("show folders with a page first and the rest, with their reason, behind a toggle", () => {
    const { rest } = landingSections({
      ...base,
      rail: {
        links: [
          { label: "Code", href: "@fa-rail-to-root@/en/cat-harness/code/x/", description: "Source code, X Folio" },
          { label: "Cache", note: "no viewer yet" },
        ],
      },
    });
    const [shown, hidden] = rest.split("<details");
    expect(shown).toContain('href="en/cat-harness/code/x/"');
    expect(shown).not.toContain("Cache");
    expect(shown).toContain("— Source code<"); // the layer's own title is not repeated
    expect(hidden).toContain("Cache");
    expect(hidden).toContain("no viewer yet");
  });

  it("put the tools page with the processes and never repeat a document as a visualiser", () => {
    const { rest } = landingSections({
      ...base,
      documentPages: new Set(["en/paper/"]),
      rail: {
        pages: [
          { label: "Paper", href: "@fa-rail-to-root@/en/paper/" },
          { label: "Tools — x", href: "@fa-rail-to-root@/en/cat-harness/tools/x/" },
          { label: "QA", href: "@fa-rail-to-root@/qa/" },
        ],
      },
    });
    const vis = rest.slice(rest.indexOf('id="visualizers"'));
    expect(rest).toContain('<a href="en/cat-harness/tools/x/">Tools</a>');
    expect(vis).not.toContain("en/paper/");
    expect(vis).not.toContain("tools/x/");
    expect(vis).toContain('href="qa/"');
  });

  it("say so when nothing opens", () => {
    expect(liveThenAll([], [], "Show all")).toContain("None on this site yet");
  });

  it("link each document's KG only where the site holds it", () => {
    const html = '<li><a href="en/a/index.html">A</a></li>\n<li><a href="en/b/index.html">B</a></li>';
    const out = withDocumentKgLinks(html, (p) => p === "a/graph.jsonld");
    expect(out).toContain('<a href="a/graph.jsonld">KG (JSON-LD)</a></li>');
    expect(out).not.toContain("b/graph.jsonld");
  });

  it("split the old list into this site's pages and the about links", () => {
    const html = '<h2>\n  Also on this site\n</h2>\n<ul>\n<li><a href="contributing/">Contributing</a></li>\n<li><a href="qa/">QA</a></li>\n</ul>';
    const a = alsoItems(html);
    expect(a.about).toHaveLength(1);
    expect(a.visualisers).toEqual(['<li><a href="qa/">QA</a></li>']);
  });
});

describe("writeLandingSections", () => {
  const site = () => {
    const d = mkdtempSync(join(tmpdir(), "landing-"));
    mkdirSync(join(d, "a"));
    writeFileSync(join(d, "a", "graph.jsonld"), "{}");
    return d;
  };

  it("rewrites the generated document landing", () => {
    const d = site();
    writeFileSync(join(d, "index.html"), '<main><h1>\n  Documents\n</h1>\n<ul>\n<li><a href="en/a/index.html">A</a></li>\n</ul></main>');
    expect(writeLandingSections(d, d, "x")).toContain("written");
    const out = readFileSync(join(d, "index.html"), "utf-8");
    expect(out).toContain('<h2 id="documents">Documents</h2>');
    expect(out).toContain('id="folders"');
    expect(out.indexOf('id="folders"')).toBeLessThan(out.indexOf("</main>"));
    expect(out).toContain("a/graph.jsonld");
    // Idempotent: a second pass leaves it.
    expect(writeLandingSections(d, d, "x")).toBe("already has the sections");
  });

  it("leaves a layer's own home page alone", () => {
    const d = site();
    const own = "<main><h1>Welcome</h1></main>";
    writeFileSync(join(d, "index.html"), own);
    expect(writeLandingSections(d, d, "x")).toContain("left as is");
    expect(readFileSync(join(d, "index.html"), "utf-8")).toBe(own);
  });
});
