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
const CATEGORIES = join(DOCS, "category");

/** Category pages — one per category over `INLINE_LIMIT`; today that is `Other`. */
const categoryFiles = existsSync(CATEGORIES)
  ? readdirSync(CATEGORIES)
      .filter((f) => f.endsWith(".md"))
      .sort()
  : [];

const artifactFiles = existsSync(ARTIFACTS)
  ? readdirSync(ARTIFACTS)
      .filter((f) => f.endsWith(".md"))
      .sort()
  : [];

/**
 * The artefact index the generator reads. Loaded here so a test can assert
 * against the SOURCE property rather than against the page count that happens
 * to follow from it.
 */
const ix = JSON.parse(
  readFileSync(join(INSTANCE, "fhir-artifact-index", "index.json"), "utf-8"),
) as { artifacts: { key: string; dak?: unknown; materialization: { state: string } }[] };

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
  it("has an index and one page per artefact", () => {
    expect(indexSrc.length).toBeGreaterThan(0);
    // ONE PER ARTEFACT, counted from the index rather than hardcoded. This
    // read `toBe(19)` while only sidecar-bearing artefacts were rendered; the
    // owner chose full parity 2026-09-22, and a literal would have had to be
    // edited in lockstep with the corpus forever.
    expect(artifactFiles.length).toBe(ix.artifacts.length);
  });

  /**
   * TWO ORACLES, ONE ANSWER, BY COINCIDENCE — pinned so it cannot go quiet.
   *
   * The generator gates on `if (!a.dak) continue`: a page exists for an
   * artefact carrying a **DAK sidecar**. The index reports a different
   * property, `materialization.state === "materialized"`. Today both sets are
   * the same 19 keys, so the count above is green whichever property the
   * generator reads — and would stay green if the gate were changed to the
   * other one.
   *
   * They are not the same question. A sidecar is *a schema was published for
   * this artefact*; materialized is *the bytes are in this repository*. The
   * corpus is free to separate them — an artefact fetched with no schema, or
   * a schema for something not held — and on the day it does, one of the two
   * readings silently becomes wrong and nothing says which.
   *
   * So the RELATION is asserted rather than the count, and the coincidence is
   * asserted as a coincidence. Same shape as the two `folio:policy` oracles
   * (bean `osyc`, 2026-09-22), where a count confirmed twice over was still
   * measuring two different things.
   */
  it("the DAK-sidecar set and the materialized set coincide — for now", () => {
    const dak = ix.artifacts.filter((a: { dak?: unknown }) => a.dak !== undefined);
    const materialized = ix.artifacts.filter(
      (a: { materialization: { state: string } }) => a.materialization.state === "materialized",
    );

    const keys = (xs: { key: string }[]) => xs.map((x) => x.key).sort();
    expect(keys(dak)).toEqual(keys(materialized));

    // Still asserted although NEITHER now gates page generation, because the
    // two properties still drive what a page SAYS — the DAK section, and the
    // materialization tag. The day they diverge, a page claims a sidecar for
    // something whose bytes are elsewhere, and this is what says so.
    expect(dak.length).toBeGreaterThan(0);
    expect(dak.length).toBeLessThan(ix.artifacts.length);
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

  /** Every `../artifact/…` href on every category page, with its source page. */
  const categoryHrefs = categoryFiles.flatMap((f) => {
    const src = readFileSync(join(CATEGORIES, f), "utf-8");
    return [...src.matchAll(/\]\((\.\.\/artifact\/[^)]+)\)/g)].map((m) => ({ file: f, href: m[1] }));
  });

  /**
   * EVERY ARTEFACT PAGE IS REACHABLE — from the index, or from a category page.
   *
   * This assertion read `hrefs.length === artifactFiles.length` while the index
   * listed every artefact. It cannot any more: a category over `INLINE_LIMIT`
   * moves to its own page, so the index links 70 of 674 and the `Other` page
   * links the rest. Asserting the index alone would now be asserting that the
   * split did not happen.
   *
   * So the union is what is asserted, and in BOTH directions — an artefact
   * page nothing links is as much a defect as a link to a page that is not
   * there, and only the second kind 404s loudly. The first just never gets
   * visited.
   */
  it("every artefact page is linked from exactly one index or category page", () => {
    const linked = [
      ...hrefs.map((h) => h.replace(/^\.\/artifact\//, "")),
      ...categoryHrefs.map((c) => c.href.replace(/^\.\.\/artifact\//, "")),
    ].map((n) => n.replace(/\.html$/, ""));

    expect(linked.length).toBe(ix.artifacts.length);
    expect(new Set(linked).size).toBe(ix.artifacts.length);
    expect([...linked].sort()).toEqual(artifactFiles.map((f) => f.replace(/\.md$/, "")).sort());
  });

  it("the split actually happened — the index does not carry all 674", () => {
    // A vacuity guard on the assertion above: if every artefact were still
    // inlined, the union test would pass with an empty category set and the
    // `INLINE_LIMIT` behaviour would be untested.
    expect(hrefs.length).toBeLessThan(ix.artifacts.length);
    expect(categoryHrefs.length).toBeGreaterThan(0);
  });

  for (const href of hrefs) {
    it(`${href} is a built URL with a source file behind it`, () => {
      expect(href.endsWith(".html")).toBe(true);
      const name = href.replace(/^\.\/artifact\//, "").replace(/\.html$/, "");
      expect(existsSync(join(ARTIFACTS, `${name}.md`))).toBe(true);
    });
  }

  // THE SAME ASSERTION AT THE NEW DEPTH. A category page sits one level down,
  // so its links are `../artifact/…`; getting the `..` wrong produces exactly
  // the #824 defect — a link that looks right on disk and 404s once built —
  // at a depth no existing test covered.
  for (const { file, href } of categoryHrefs) {
    it(`${file} → ${href} is a built URL with a source file behind it`, () => {
      expect(href.startsWith("../artifact/")).toBe(true);
      expect(href.endsWith(".html")).toBe(true);
      const name = href.replace(/^\.\.\/artifact\//, "").replace(/\.html$/, "");
      expect(existsSync(join(ARTIFACTS, `${name}.md`))).toBe(true);
    });
  }

  // And the index's pointer AT the category page, which is the one link whose
  // breakage hides 604 pages behind a 404 rather than one.
  for (const m of indexSrc.matchAll(/\]\((\.\/category\/[^)]+)\)/g)) {
    it(`${m[1]} is a built URL with a source file behind it`, () => {
      expect(m[1].endsWith(".html")).toBe(true);
      const name = m[1].replace(/^\.\/category\//, "").replace(/\.html$/, "");
      expect(existsSync(join(CATEGORIES, `${name}.md`))).toBe(true);
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

/**
 * The LEFT-HAND NAV, and the conflation that emptied it.
 *
 * `shell` took `depth = 0 | 1`, and one number carried two different facts: a
 * CATEGORY page and an ARTEFACT page both passed `1`, so the `nav_exclude`
 * written for the 674 leaves swept out the category pages with them. The
 * sidebar showed exactly ONE smart-trust row — the index — and the structure
 * the index is grouped by was invisible in the one place a reader navigates
 * from.
 *
 * Asserted on the RENDERED front matter rather than on the `NavRole` values,
 * for the reason the two defects above are: just-the-docs reads the page, not
 * the generator, and `parent` matches `title` BY STRING. A test on the type
 * would pass while the sidebar flattened.
 */
describe("left-hand nav — three roles, one per page kind", () => {
  const fm = (page: string): string => page.slice(0, page.indexOf("\n---", 4) + 4);
  const readDoc = (rel: string): string => readFileSync(join(DOCS, rel), "utf-8");

  it("the index CARRIES children", () => {
    const f = fm(indexSrc);
    expect(f).toContain("has_children: true");
    expect(f).not.toContain("nav_exclude");
    expect(f).not.toContain("parent:");
  });

  it("a category page is a LISTED child, named against the index's exact title", () => {
    const name = categoryFiles[0];
    expect(name).toBeDefined();
    const f = fm(readDoc(join("category", name!)));
    // The parent string must be the index's own `title`, byte for byte —
    // just-the-docs matches a child to its parent by that string, so a
    // re-titled index orphans every section and the sidebar quietly flattens.
    const indexTitle = /title: (.+)/.exec(fm(indexSrc))![1]!;
    expect(f).toContain(`parent: ${indexTitle}`);
    expect(f).toMatch(/nav_order: \d+/);
    // The whole point: a section is NOT excluded.
    expect(f).not.toContain("nav_exclude");
  });

  it("an artefact page stays EXCLUDED — 674 leaves would bury the sidebar", () => {
    const f = fm(readFileSync(join(ARTIFACTS, "CodeSystem-Actors.md"), "utf-8"));
    expect(f).toContain("nav_exclude: true");
    expect(f).not.toContain("has_children");
    expect(f).not.toContain("parent:");
  });

  /**
   * Falsifies the fix in the other direction: if `nav_exclude` ever returns to
   * the category pages, this fails rather than the sidebar silently emptying —
   * which is how the original defect survived, since an empty sidebar section
   * looks exactly like a folio that has none.
   */
  it("no category page is nav-excluded, and every artefact page is", () => {
    expect(categoryFiles.length).toBeGreaterThan(0);
    for (const c of categoryFiles) {
      expect(fm(readFileSync(join(CATEGORIES, c), "utf-8"))).not.toContain("nav_exclude");
    }
    const leaves = artifactFiles.slice(0, 25);
    expect(leaves.length).toBeGreaterThan(0);
    for (const a of leaves) {
      expect(fm(readFileSync(join(ARTIFACTS, a), "utf-8"))).toContain("nav_exclude: true");
    }
  });
});
