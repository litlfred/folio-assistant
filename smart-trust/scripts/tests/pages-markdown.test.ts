/**
 * The smart-trust pages are MARKDOWN, and their links resolve to files.
 *
 * These pages used to be HTML wearing front matter: a full `<style>` sheet
 * that re-declared `body`, its own colour scheme and its own
 * `prefers-color-scheme` block, then `<table>`/`<tr>`/`<h2>` for every row and
 * heading. `index.md` was **631 lines, 186 of them HTML**. Everything in that
 * list is something just-the-docs already does, and a page that redeclares it
 * is a page that stops matching the theme the first time the theme changes —
 * which is exactly what the dark-mode figure defect was.
 *
 * Two defects were found by READING the regenerated output, and both are
 * pinned here because neither is visible in the generator:
 *
 * 1. `repLinks` joined its four representation links with `""`, rendering
 *    `jsonxmlttlhtml` as one run-on word. A separator is a rendering fact, so
 *    the assertion is on the RENDERED page rather than on the join call.
 * 2. The index linked each artefact as `./artifact/Name/`. This site's
 *    `cat-harness/docs/_config.yml` sets **no `permalink`**, so Jekyll's
 *    default emits `artifact/Name.html` and every one of the 19 links would
 *    have 404'd once built. Locally both spellings look identical — the file
 *    is `.md` either way — so the only test that could catch it is one that
 *    reads the href and resolves it back to a file.
 *
 * @module smart-trust/scripts/tests/pages-markdown.test
 */
import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";

const INSTANCE = resolve(import.meta.dir, "..", "..");
const DOCS = join(INSTANCE, "docs");
const ARTIFACTS = join(DOCS, "artifact");

const artifactFiles = existsSync(ARTIFACTS)
  ? readdirSync(ARTIFACTS)
      .filter((f) => f.endsWith(".md"))
      .sort()
  : [];

const indexSrc = existsSync(join(DOCS, "index.md"))
  ? readFileSync(join(DOCS, "index.md"), "utf-8")
  : "";

/** Every generated page, index first, as `[label, source]`. */
const pages: [string, string][] = [
  ["index.md", indexSrc],
  ...artifactFiles.map(
    (f) => [`artifact/${f}`, readFileSync(join(ARTIFACTS, f), "utf-8")] as [string, string],
  ),
];

/**
 * The body — front matter and the one `<style>` block removed.
 *
 * The style block is the page's ONE licensed piece of CSS (four classes that
 * exist nowhere in the theme), and matching against it would let a test pass
 * on a `##` that is really a colour comment. Strip it and assert on prose.
 */
function body(src: string): string {
  return src
    .replace(/^---\n[\s\S]*?\n---\n/, "")
    .replace(/<style>[\s\S]*?<\/style>/g, "");
}

describe("smart-trust pages are generated at all", () => {
  /**
   * The vacuity guard. Every assertion below is `for (const ... of pages)`, so
   * an empty `docs/` would make the whole file green while publishing nothing
   * — the `dh4f` shape: a sweep over an empty corpus reporting a clean run.
   */
  it("has an index and one page per DAK-sidecar artefact", () => {
    expect(indexSrc.length).toBeGreaterThan(0);
    expect(artifactFiles.length).toBe(19);
  });
});

describe("the pages carry no theme CSS of their own", () => {
  /**
   * `body`, a colour scheme and `prefers-color-scheme` are the THEME's to
   * declare. A page that restates them is a page that silently stops matching
   * — and it is what made these pages render light plates in dark mode.
   */
  for (const [label, src] of pages) {
    it(`${label} does not redeclare the theme`, () => {
      const css = /<style>([\s\S]*?)<\/style>/.exec(src)?.[1] ?? "";
      expect(css).not.toContain("body{");
      expect(css).not.toContain("body {");
      expect(css).not.toContain("prefers-color-scheme");
      expect(css).not.toContain("background:#0d1117");
    });
  }

  it("the style block is small enough to read in one screen", () => {
    const css = /<style>([\s\S]*?)<\/style>/.exec(indexSrc)?.[1] ?? "";
    expect(css.trim().split("\n").length).toBeLessThanOrEqual(12);
  });
});

describe("the pages are markdown, not HTML wearing front matter", () => {
  for (const [label, src] of pages) {
    const b = body(src);

    it(`${label} uses markdown headings`, () => {
      expect(b).toMatch(/^## /m);
      expect(b).not.toMatch(/<h[12]\b/);
    });

    it(`${label} uses markdown tables`, () => {
      expect(b).toMatch(/^\|---/m);
      expect(b).not.toMatch(/<table\b/);
      expect(b).not.toMatch(/<tr\b/);
      expect(b).not.toMatch(/<td\b/);
    });
  }
});

describe("representation links are separated", () => {
  /**
   * Defect 1. `json xml ttl html` joined with `""` reads as one word, and the
   * four anchors are adjacent in the source either way — so the only
   * distinguishing byte is what sits between `</a>` and the next `<a`.
   */
  for (const [label, src] of pages) {
    const b = body(src);
    if (!b.includes("</a>")) continue;

    it(`${label} puts a separator between adjacent links`, () => {
      expect(b).not.toContain("</a><a ");
      expect(b).toContain("</a> · <a ");
    });
  }
});

describe("every artefact link resolves to a page that exists", () => {
  /**
   * Defect 2. The href is read out of the rendered index and resolved back to
   * a source file, which is the only form of this assertion that fails on the
   * trailing-slash spelling: `./artifact/Name/` and `./artifact/Name.html`
   * both "look linked" and only one of them will be served.
   */
  const hrefs = [...indexSrc.matchAll(/\]\((\.\/artifact\/[^)]+)\)/g)].map((m) => m[1]);

  it("the index links every artefact page", () => {
    expect(hrefs.length).toBe(artifactFiles.length);
  });

  for (const href of hrefs) {
    it(`${href} is a built URL with a source file behind it`, () => {
      expect(href.endsWith(".html")).toBe(true);
      const name = href.replace(/^\.\/artifact\//, "").replace(/\.html$/, "");
      expect(existsSync(join(ARTIFACTS, `${name}.md`))).toBe(true);
    });
  }
});

describe("materialization state is stated, never implied by styling", () => {
  /**
   * Following `gen-iris-pages.ts`: a greyed-out row reads as "broken", while a
   * row saying **referenced** reads as "upstream, not here" — which is the
   * actual state and the entire point of cataloguing by reference. The two
   * classes carry a colour and nothing else; the WORD is what is read.
   */
  it("both state tags are defined and both are used with their word", () => {
    const css = /<style>([\s\S]*?)<\/style>/.exec(indexSrc)?.[1] ?? "";
    expect(css).toContain(".st-held");
    expect(css).toContain(".st-ref");
    expect(indexSrc).toMatch(/class="st-tag st-held">materialized</);
  });

  for (const [label, src] of pages) {
    it(`${label} never hides a referenced row`, () => {
      expect(body(src)).not.toContain("opacity:.4");
      expect(body(src)).not.toMatch(/\bdisabled\b/);
    });
  }
});
