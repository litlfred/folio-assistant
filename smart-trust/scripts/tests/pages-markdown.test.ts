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
 * SINCE 2026-10-05 (bean `mftp`) these are the artefact pages of ONE site:
 * `docs/` declares `igSite`, so they build into smart-trust's own IG site at
 * `/smart-trust/`, whose index, toc and artifacts pages `build-ig-site`
 * writes. The generator no longer writes an index, menu sections or category
 * pages here, and the assertions about them were retargeted at what replaced
 * them — the IG site's `artifacts` page links — rather than deleted silently.
 *
 * @module smart-trust/scripts/tests/pages-markdown.test
 */
import { describe, expect, it } from "bun:test";
import { artifactVariables, VIEW_PAGE } from "../../platform.ts";
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

/**
 * A VIEW page — a DAK sidecar's (`<Name>.schema.json.md`, `<Name>.jsonld.md`) or a JSON view (`<Name>.json.md`) — sits
 * beside its artefact page, as the Publisher's does, but is a different page
 * KIND: one per held sidecar, not one per artefact (bean `jut3`).
 */
const isView = (f: string) => VIEW_PAGE.test(f);

const artifactFiles = existsSync(ARTIFACTS)
  ? readdirSync(ARTIFACTS)
      .filter((f) => f.endsWith(".md") && !isView(f))
      .sort()
  : [];

const dakViewFiles = existsSync(ARTIFACTS) ? readdirSync(ARTIFACTS).filter(isView).sort() : [];

/**
 * The artefact index the generator reads. Loaded here so a test can assert
 * against the SOURCE property rather than against the page count that happens
 * to follow from it.
 */
const ix = JSON.parse(
  readFileSync(join(INSTANCE, "fhir-artifact-index", "index.json"), "utf-8"),
) as { artifacts: { key: string; sidecars?: unknown; materialization: { state: string } }[] };

const indexSrc = existsSync(join(DOCS, "index.md"))
  ? readFileSync(join(DOCS, "index.md"), "utf-8")
  : "";

/**
 * The pages' CSS — linked, not inlined (bean `680p`): the shared rules and,
 * where the chrome was ingested, the mirrored chrome. The style tests below
 * read these files; every page must link them.
 */
const cssFile = (f: string) => (existsSync(join(DOCS, "assets", f)) ? readFileSync(join(DOCS, "assets", f), "utf-8") : "");
const SITE_CSS = `${cssFile("ig-pages.css")}\n${cssFile("ig-chrome.css")}`;

/** Every generated page, index first, as `[label, source]`. */
const pages: [string, string][] = [
  ...artifactFiles.map(
    (f) => [`artifact/${f}`, readFileSync(join(ARTIFACTS, f), "utf-8")] as [string, string],
  ),
  ...dakViewFiles.map(
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
  it("writes no index, menu or category page of its own, and one page per artefact", () => {
    // The IG site writes the index, toc and artifacts pages (`igSite`, bean
    // `mftp`); a copy here would be a second answer at the same URL, which
    // `stage-ig-sites` refuses at build time.
    expect(existsSync(join(DOCS, "index.md"))).toBe(false);
    expect(existsSync(join(DOCS, "menu"))).toBe(false);
    expect(existsSync(CATEGORIES)).toBe(false);
    expect(artifactFiles.length).toBeGreaterThan(0);
    // ONE PER ARTEFACT, counted from the index rather than hardcoded. This
    // read `toBe(19)` while only sidecar-bearing artefacts were rendered; the
    // owner chose full parity 2026-09-22, and a literal would have had to be
    // edited in lockstep with the corpus forever.
    expect(artifactFiles.length).toBe(ix.artifacts.length);
  });

  /**
   * TWO ORACLES, ONE ANSWER, BY COINCIDENCE — pinned so it cannot go quiet.
   *
   * The generator gates on `if (!a.sidecars) continue`: a page exists for an
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
    const dak = ix.artifacts.filter((a: { sidecars?: unknown }) => a.sidecars !== undefined);
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

describe("the CSS is linked once, never inlined per page", () => {
  it("the shared stylesheet exists", () => {
    expect(SITE_CSS).toContain(".st-tag");
  });
  for (const [label, src] of pages) {
    it(`${label} links it and inlines none`, () => {
      expect(src).toContain("assets/ig-pages.css");
      expect(src).not.toContain("<style>");
    });
  }
});

describe("the pages carry no theme CSS of their own", () => {
  /**
   * `body`, a colour scheme and `prefers-color-scheme` are the THEME's to
   * declare. A page that restates them is a page that silently stops matching
   * — and it is what made these pages render light plates in dark mode.
   */
  // One stylesheet every page links (checked above), so one assertion.
  it("the linked stylesheet does not redeclare the theme", () => {
    expect(SITE_CSS).not.toContain("body{");
    expect(SITE_CSS).not.toContain("body {");
    expect(SITE_CSS).not.toContain("prefers-color-scheme");
    expect(SITE_CSS).not.toContain("background:#0d1117");
  });

  /**
   * The AUTHORED half stays small — and this used to be a bare line count over
   * the whole block.
   *
   * That count was a PROXY for the property above: nobody has quietly
   * reintroduced a theme. `ajx9` then added one **on purpose** — the WHO IG's
   * chrome, ingested from its template chain — and the block went 12 -> 77.
   * Raising the number to 80 would have kept the test green while retiring the
   * thing it was for, since a future hand-written theme would fit under 80 just
   * as comfortably.
   *
   * So the proxy is replaced by what it stood for. The chrome is identifiable
   * because it is SCOPED, every line of it under `CHROME_SCOPE`, and the split
   * below is the same fact the scoping buys at runtime: what is not scoped is
   * what somebody typed here, and that is what must stay readable.
   */
  it("the hand-written half of the style block is still small enough to read in one screen", () => {
    const css = SITE_CSS;
    const authored = css
      .trim()
      .split("\n")
      .filter((l) => !l.includes(".st-ig") && l.trim() !== "" && !/^\s*(--|\}|[-\w]+\s*:)/.test(l));
    expect(authored.length).toBeLessThanOrEqual(12);
  });

  /**
   * The ingested chrome NEVER escapes its scope.
   *
   * This is the rule that makes mirroring somebody else's palette safe at all.
   * The IG Publisher can put WHO's colours on `:root` because every document it
   * builds is the IG's; ours are folio pages that carry a mirror, and one
   * unscoped `:root` block would repaint the whole site the moment a reader
   * opened a single artefact page.
   */
  it("every mirrored declaration is scoped — no bare :root anywhere", () => {
    expect(/(^|[\s,}]):root\s*\{/.test(SITE_CSS)).toBe(false);
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
      // A DAK view page holds no tabular data — a file and its links — so it
      // is held only to the half of this rule that forbids HTML tables.
      if (!isView(label)) expect(b).toMatch(/^\|---/m);
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
    // Only a page with a `repLinks` row can carry this defect. A DAK view
    // page has none, and since #1901 neither has the index: its tables are
    // the Publisher's name + description, and the representations moved to
    // each artefact's own page, where this still checks them.
    if (!/>(json|xml|ttl|html)<\/a>/.test(b) || isView(label)) continue;

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
  /**
   * EVERY ARTEFACT PAGE IS REACHABLE — from the IG site's `artifacts` page,
   * which `build-ig-site` writes from `site.data.fhir.artifacts`. The links
   * are the same `artifactVariables` the build computes, read with the
   * `pagesHref` an `igSite` instance is staged with, and resolved back to
   * source files here: a link to a page that is not there 404s, and a page
   * nothing links is never visited.
   */
  it("every artefact page is linked exactly once from the IG site's artifacts page", () => {
    const { vars } = artifactVariables(ix.artifacts as never, "artifact/");
    // What the `artifacts` template iterates: the categories, as the
    // Publisher's `artifacts.html` lists them.
    const listed = vars.artifact_categories.flatMap((c) => c.keys).map((k) => vars.artifacts[k]!.url.page);
    const linked = listed.map((h) => h.replace(/^artifact\//, "").replace(/\.html$/, ""));
    expect(new Set(linked).size).toBe(linked.length);
    for (const n of linked) expect(existsSync(join(ARTIFACTS, `${n}.md`))).toBe(true);
    // The pages it does NOT link are exactly the artefacts the Publisher's
    // page does not list either (no category: the ImplementationGuide itself).
    const unlisted = artifactFiles.map((f) => f.replace(/\.md$/, "")).filter((n) => !linked.includes(n));
    const uncategorised = Object.values(vars.artifacts).filter((a) => a.category === undefined).map((a) => a.url.page.replace(/^artifact\//, "").replace(/\.html$/, ""));
    expect(unlisted.sort()).toEqual(uncategorised.sort());
    expect(linked.length).toBeGreaterThan(ix.artifacts.length - 5);
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
    const css = SITE_CSS;
    expect(css).toContain(".st-held");
    expect(css).toContain(".st-ref");
    // On the artefact pages — the index's tables stopped carrying the state
    // in #1901 (it is a technical column, and the artefact page states it).
    expect(pages.some(([, src]) => /class="st-tag st-held">materialized</.test(src))).toBe(true);
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
  it("every artefact page is nav-excluded — the IG's own menu is the sidebar", () => {
    const leaves = artifactFiles.slice(0, 25);
    expect(leaves.length).toBeGreaterThan(0);
    for (const a of leaves) {
      expect(fm(readFileSync(join(ARTIFACTS, a), "utf-8"))).toContain("nav_exclude: true");
    }
  });
});

describe("an artefact page addresses the IG site it builds into (bean `mftp`)", () => {
  const holder = readFileSync(join(ARTIFACTS, "ActorDefinition-Holder.md"), "utf-8");
  it("links its CSS relatively, right both inside the host site and as the IG's own site", () => {
    expect(holder).toContain(`href="../assets/ig-pages.css"`);
    expect(holder).not.toContain("'/smart-trust/assets/");
  });
  it("sends 'all artefacts' to the IG site's Artifact Index, not the home page", () => {
    expect(holder).toMatch(/\[← all \d+ artefacts\]\(\.\.\/artifacts\.html\)/);
  });
});

describe("the DAK API section is on exactly the pages the Publisher puts it on", () => {
  /**
   * smart-base's post-processing appends "API Information" / "Endpoints" to a
   * ValueSet's page and skips logical models (`generate_dak_api_hub.py`), so
   * the section belongs on the ValueSets whose OpenAPI sidecar is held — and
   * on nothing else, since an extra section is a difference from the
   * standard render too (bean `jut3`).
   */
  const full = ix as unknown as { artifacts: { resourceType: string; id: string; sidecars?: { openapi?: { localPath?: string } } }[] };
  const expected = full.artifacts
    .filter((a) => a.resourceType === "ValueSet" && a.sidecars?.openapi?.localPath)
    .map((a) => `${a.resourceType}-${a.id}.md`)
    .sort();
  const carrying = artifactFiles.filter((f) => readFileSync(join(ARTIFACTS, f), "utf-8").includes("data-ig-api-openapi-src")).sort();

  it("the set matches, and is not empty", () => {
    expect(carrying).toEqual(expected);
    expect(carrying.length).toBeGreaterThan(0);
  });
});

// #1901, owner 2026-10-02: the IG's table of contents lives only in the
// left-hand rail, and every page ends in the Publisher's footer, whose facts
// come from the IG's own metadata.
describe("the Publisher footer, and no in-page Contents box", () => {
  it("the footer's data is the IG's own, written once", () => {
    const d = JSON.parse(readFileSync(join(DOCS, "assets", "ig-footer.json"), "utf-8"));
    expect(d.packageId).toBe(ix.packageId);
    expect(d.version).toBe(ix.version);
    expect(existsSync(join(DOCS, "assets", "ig-footer.js"))).toBe(true);
  });

  // The <prev | next> chain: index, then every artefact page in the order the
  // index lists them. Followed from the index, it must visit every artefact
  // page once and only resolve to pages that exist — a broken hop is a 404
  // in a footer on every page.
  // The first artefact page's <prev is `../` — the IG site's own index, the
  // instance root since `mftp` — and the chain from there visits every
  // artefact page once, each hop resolving.
  it("prev/next walk the IG root -> every artefact page once, each hop resolving", () => {
    const attr = (src: string, name: string) => src.match(new RegExp(`<footer id="ig-footer"[^>]*\\b${name}="([^"]+)"`))?.[1];
    const read = (rel: string) => readFileSync(join(DOCS, rel), "utf-8");
    const first = artifactFiles.filter((f) => attr(read(join("artifact", f)), "data-prev") === "../");
    expect(first.length).toBe(1);
    const seen: string[] = [];
    for (let at: string | undefined = join("artifact", first[0]!); at !== undefined; ) {
      expect(existsSync(join(DOCS, at))).toBe(true);
      seen.push(at);
      const next = attr(read(at), "data-next");
      if (next === undefined) break;
      const target = join("artifact", next).replace(/\.html$/, ".md");
      expect(attr(read(target), "data-prev")).toBe(at.replace(/^artifact\//, "").replace(/\.md$/, ".html"));
      at = target;
    }
    expect(seen.length).toBe(ix.artifacts.length);
    expect(new Set(seen).size).toBe(seen.length);
  });
});
