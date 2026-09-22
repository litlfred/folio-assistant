/**
 * Every declared visualisation gets a tile, on two surfaces, and each opens
 * the EXISTING visualisation.
 *
 * Bean `folio-assistant-zsah`, R12 + R16 of issue #602. Owner, 2026-09-20:
 *
 * > its not a function of nodes, its a function of a harness watching a
 * > directort … if harness declares visaluzers, those should have tile
 *
 * and *"those should open their exisiting visualzaiton"*.
 *
 * ## "Asserted by reuse, not by screenshot" — what that means here
 *
 * The bean asks for reuse to be *asserted*, and a screenshot would assert
 * nothing: a tile that opened a brand-new page would look identical. So the
 * assertion is that the tile's href is the DECLARED ref, resolved to its
 * published route and nothing else — checked against `graph-tiles.ts`'s own
 * answer from the same declaration. A tile that composed its own path could
 * reach a different page, and this is what would catch it.
 *
 * ## And the two lists that must stay one
 *
 * Q11: a tile is declared once and says where it shows. So the navbar and the
 * board are asserted to carry the SAME tile — same id, same title, same href —
 * rather than each being checked against the fixture separately, which is what
 * two registries would also pass.
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { siteDirFor } from "../schemas/cat-harness.ts";
import { graphTiles, publishedHref, type TiledDirectory } from "../scripts/graph-tiles.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = siteDirFor(ROOT);
const CSS = readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");

/** Declarations, and the tiles they must yield — one source for both. */
const DIRS: TiledDirectory[] = [
  // Icons are declared on EXISTING entries rather than new ones: the id set is
  // asserted exactly a few tests down, and a fixture that grows to cover a new
  // field would quietly rewrite what "exactly the declarations that say
  // navbar" means.
  { id: "beans", coverage: { visualiser: [{ ref: "cat-harness/docs/beans/index.html", icon: "beans" }] } },
  {
    id: "library",
    coverage: {
      visualiser: [
        // An icon the client's registry has not got: the fallback case, which
        // is a folio declaring against a newer platform than the one rendering.
        { ref: "cat-harness/docs/library/shelf.html", title: "Shelf", icon: "no-such-glyph" },
        { ref: "cat-harness/docs/library/map.html", title: "Map", surfaces: ["board"] },
      ],
    },
  },
  // An INHERITED property of every object literal. A registry read as
  // `TILE_GLYPHS[name]` would return `Object`'s constructor here and hand a
  // function to `innerHTML`; this pins the `hasOwnProperty` guard.
  { id: "navbar-only", coverage: { visualiser: [{ ref: "cat-harness/docs/n.html", surfaces: ["navbar"], icon: "constructor" }] } },
  { id: "starts-hidden", coverage: { visualiser: [{ ref: "cat-harness/docs/h.html", hidden: true }] } },
  // A page withheld from the canonical deploy. Its tile must vanish with it:
  // a tile pointing at a page that was not deployed is a link to a 404, and
  // it advertises content the declaration deliberately does not publish.
  {
    id: "staging-only",
    coverage: { visualiser: [{ ref: "cat-harness/docs/s.html", publish: "staging-only" }] },
  },
  // Declares nothing: it must get no tile, however much a viewer exists.
  { id: "undeclared" },
  // Declared OUTSIDE the published site: a tile, but not a link (`pb04`).
  { id: "elsewhere", coverage: { visualiser: "somewhere-else/v.html" } },
];

const TILES = graphTiles(DIRS, "cat-harness/docs");

/**
 * The base this fixture is served under — NON-EMPTY on purpose.
 *
 * It was absent until issue #801, and the absence is what let the defect ship:
 * a tile's declared href is site-root-relative (`/beans/`), the code emitted it
 * raw, and under a fixture served at the origin root "composed against the
 * base" and "not composed at all" are the same string. The assertion below
 * restated `publishedHref` and passed BECAUSE nothing happened — the shape
 * PR #776 paid for in `toRootFor`, where a test that restates the expression
 * guards nothing at the call site.
 *
 * So the fixture now carries what the real deploy carries. `/folio-assistant`
 * rather than a placeholder, because that is this site's own base and a reader
 * comparing the test with the 404 in the issue should see the same string.
 */
const BASE = "/folio-assistant";

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="fa-todo-src" content="/assets/todos/index.json">
<meta name="fa-baseurl" content="${BASE}">
<!-- No fa-staging meta: this fixture is the CANONICAL deploy, which is the
     default and the case a staging-only tile must not appear in. -->
<meta name="fa-tiles" content='${JSON.stringify(TILES).replace(/'/g, "&#39;")}'>
<style>${CSS}</style></head><body>
<div class="side-bar"><div class="site-header"><a class="site-title">Site</a></div><nav class="site-nav"></nav></div>
<div class="main-content-wrap"><div class="main-content" id="main-content">
  <div class="fa-landing-board"></div>
</div></div>
<script>${JS}</script></body></html>`;

const URL_PAGE = "http://tiles.test/page.html";

const ITEMS = [
  {
    id: "one",
    summary: "A todo",
    comment: "Body.",
    status: "open",
    priority: "high",
    origin: "agent",
    createdAt: "2026-09-19",
    tags: { roles: [], processes: [], tasks: [], identities: [], references: [], artefacts: [] },
    relations: [],
  },
];

test.beforeEach(async ({ page }) => {
  await page.route("http://tiles.test/**", (route) => {
    const url = route.request().url();
    if (url.endsWith("/page.html")) {
      return route.fulfill({ contentType: "text/html", body: PAGE });
    }
    if (url.endsWith("/assets/todos/index.json")) {
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ $schema: "folio-todo-index/v1", items: ITEMS }),
      });
    }
    return route.fulfill({ status: 404, body: "not found" });
  });
});

/** Every graph tile on a surface: id, visible text, and href. */
async function tilesOnPage(page: import("@playwright/test").Page, surface: string) {
  return page.locator(`[data-fa-tile][data-fa-surface="${surface}"]`).evaluateAll((els) =>
    els.map((e) => ({
      id: (e as HTMLElement).dataset.faTile,
      title: e.querySelector(".fa-tile-caption")?.textContent,
      href: e.getAttribute("href"),
      glyph: e.querySelector("svg")?.outerHTML,
    })),
  );
}

/**
 * Wait for the tiles to be BUILT, which is not the same as visible.
 *
 * The launcher's tiles are built on load and shown only when it is opened —
 * `sticky-todos.e2e.ts` records the same distinction: *"asserting visibility
 * without opening it tests the launcher, not the tile."* Every assertion here
 * is about what was derived, so attachment is the right wait and opening the
 * launcher would be testing `1le7`'s control rather than this bean's.
 */
async function ready(page: import("@playwright/test").Page) {
  await page.waitForSelector("[data-fa-tile]", { state: "attached" });
  await page.waitForFunction(() =>
    Boolean((window as never as { __faTodoBoard?: unknown }).__faTodoBoard),
  );
}

test.describe("a tile per declared visualisation, derived and not listed", () => {
  test("the navbar carries exactly the declarations that say navbar", async ({ page }) => {
    await page.goto(URL_PAGE);
    await ready(page);
    const ids = (await tilesOnPage(page, "navbar")).map((t) => t.id).sort();
    // `library/2` says board only; `starts-hidden` starts out of frame;
    // `undeclared` declares nothing; `elsewhere` has no published href.
    expect(ids).toEqual(["beans", "library/1", "navbar-only"]);
  });

  test("a directory that declares NOTHING gets no tile", async ({ page }) => {
    // However much a viewer exists. A tile appearing without a declaration
    // would make the audit that reports the gap look wrong.
    await page.goto(URL_PAGE);
    await ready(page);
    const all = [...(await tilesOnPage(page, "navbar")), ...(await tilesOnPage(page, "board"))];
    expect(all.map((t) => t.id)).not.toContain("undeclared");
  });

  test("a declaration outside the published site is not rendered as a link to nowhere", async ({ page }) => {
    // `pb04`. The tile's absence here is the honest answer: the page cannot
    // serve it, and a link that 404s reads as a broken site.
    await page.goto(URL_PAGE);
    await ready(page);
    const all = [...(await tilesOnPage(page, "navbar")), ...(await tilesOnPage(page, "board"))];
    expect(all.map((t) => t.id)).not.toContain("elsewhere");
  });
});

test.describe("each tile opens the EXISTING visualisation — asserted by reuse", () => {
  test("every href is the declared ref, resolved, and nothing else", async ({ page }) => {
    // A tile that composed its own path could reach a different page. This is
    // what catches that, and a screenshot would not.
    await page.goto(URL_PAGE);
    await ready(page);
    for (const t of await tilesOnPage(page, "navbar")) {
      const declared = TILES.find((x) => x.id === t.id)!;
      // Two facts, and keeping them apart is the point. The DATA is the
      // published route of the declared ref and carries no base -- that is
      // what `graph-tiles.ts` stores and what an override resolves against.
      // The HREF is that path composed against this deploy, which is what a
      // browser follows. Asserting the second equals the first is the bug.
      expect(declared.href).toBe(publishedHref("cat-harness/docs", declared.ref));
      expect(t.href, `${t.id} opens its declared visualisation`).toBe(BASE + declared.href);
    }
  });

  test("an href is composed against the base, not left at the origin", async ({ page }) => {
    // #801 stated as the thing the reader experienced: the beans tile pointed
    // at `litlfred.github.io/beans/`, which is a different site. Asserted by
    // RESOLVING it the way a browser does rather than by matching the string,
    // so a half-fix that produced `/folio-assistant//beans/` still fails.
    await page.goto(URL_PAGE);
    await ready(page);
    const beans = (await tilesOnPage(page, "navbar")).find((t) => t.id === "beans")!;
    expect(beans.href).toBe("/folio-assistant/beans/");
    expect(new URL(beans.href!, URL_PAGE).pathname).toBe("/folio-assistant/beans/");
  });

  test("with no base declared the path is unchanged", async ({ page }) => {
    // The documented fallback, and the common case: the e2e fixtures and a
    // local `jekyll serve` have no base. A site that declares an empty one and
    // a site that declares none render identically through Liquid, so there is
    // nothing here to tell apart and nothing to report.
    await page.route("http://nobase.test/**", (route) => {
      const url = route.request().url();
      if (url.endsWith("/page.html")) {
        return route.fulfill({
          contentType: "text/html",
          body: PAGE.replace(`<meta name="fa-baseurl" content="${BASE}">`, ""),
        });
      }
      if (url.endsWith("/assets/todos/index.json")) {
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ $schema: "folio-todo-index/v1", items: ITEMS }),
        });
      }
      return route.fulfill({ status: 404, body: "not found" });
    });
    await page.goto("http://nobase.test/page.html");
    await ready(page);
    const beans = (await tilesOnPage(page, "navbar")).find((t) => t.id === "beans")!;
    expect(beans.href).toBe("/beans/");
  });

  test("the title is the declared one, and falls back to the directory's id", async ({ page }) => {
    await page.goto(URL_PAGE);
    await ready(page);
    const byId = Object.fromEntries((await tilesOnPage(page, "navbar")).map((t) => [t.id, t.title]));
    expect(byId["library/1"]).toBe("Shelf");
    expect(byId["beans"]).toBe("beans");
    expect(byId["navbar-only"]).toBe("navbar-only");
  });
});

test.describe("ONE declaration, two surfaces", () => {
  test("a tile on both carries the same id, title and href on each", async ({ page }) => {
    // Q11, asserted as an equality rather than by checking each surface
    // against the fixture — which two registries would also pass.
    await page.goto(URL_PAGE);
    await ready(page);
    const nav = await tilesOnPage(page, "navbar");
    const board = await tilesOnPage(page, "board");
    const onBoth = nav.filter((n) => board.some((b) => b.id === n.id));
    expect(onBoth.length).toBeGreaterThan(0);
    for (const n of onBoth) {
      expect(board.find((b) => b.id === n.id)).toEqual(n);
    }
  });

  test("a board-only declaration appears there and NOT in the navbar", async ({ page }) => {
    await page.goto(URL_PAGE);
    await ready(page);
    expect((await tilesOnPage(page, "board")).map((t) => t.id)).toContain("library/2");
    expect((await tilesOnPage(page, "navbar")).map((t) => t.id)).not.toContain("library/2");
  });

  test("a navbar-only declaration appears there and NOT on the board", async ({ page }) => {
    await page.goto(URL_PAGE);
    await ready(page);
    expect((await tilesOnPage(page, "navbar")).map((t) => t.id)).toContain("navbar-only");
    expect((await tilesOnPage(page, "board")).map((t) => t.id)).not.toContain("navbar-only");
  });
});

test.describe("declared visibility, and the reader's override commits nothing", () => {
  test("a tile declared hidden starts out of frame", async ({ page }) => {
    await page.goto(URL_PAGE);
    await ready(page);
    const all = [...(await tilesOnPage(page, "navbar")), ...(await tilesOnPage(page, "board"))];
    expect(all.map((t) => t.id)).not.toContain("starts-hidden");
  });

  test("nothing about tiles is persisted — the declared default is the only stored fact", async ({ page }) => {
    // The reader's half is theirs alone. If it reached any store it would be
    // one step from reaching the declaration, and then one reader's view of
    // the navbar would be everyone's navbar.
    await page.goto(URL_PAGE);
    await ready(page);
    const stored = await page.evaluate(() => JSON.stringify(localStorage));
    expect(stored).not.toContain("starts-hidden");
    expect(stored).not.toContain("fa-tile");
  });
});

test.describe("the tile template is `1le7`'s, not a second one", () => {
  test("a graph tile IS a `.fa-tile`, on both surfaces", async ({ page }) => {
    // Asserted structurally rather than by looking: two templates would be two
    // tiles that look alike until one of them is changed.
    await page.goto(URL_PAGE);
    await ready(page);
    for (const surface of ["navbar", "board"]) {
      const n = await page.locator(`.fa-tile[data-fa-surface="${surface}"]`).count();
      const all = await page.locator(`[data-fa-tile][data-fa-surface="${surface}"]`).count();
      expect(n, `${surface} tiles use the shared template`).toBe(all);
    }
  });

  test("every tile has an accessible name saying what it opens", async ({ page }) => {
    await page.goto(URL_PAGE);
    await ready(page);
    const labels = await page
      .locator("[data-fa-tile]")
      .evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
    expect(labels.length).toBeGreaterThan(0);
    for (const l of labels) expect(l).toContain("the declared visualisation of");
  });
});

/* ── `v0jv`, corrected by #796 — the tile strip along the folio's top ──
 *
 * `v0jv` opened on placement: *"folios have tiles do not go to the window.
 * they are stacked around (bottom?) of folio, slid away."* The parenthesis
 * was the owner's own uncertainty, and 2026-09-21 settled it the other way:
 * *"lets have the square tiles lined up on the top of the
 * folio-sicky-board-landingpanel whole slides up if user doesnt want."*
 *
 * TWO THINGS CHANGED AND BOTH ARE ASSERTED BELOW — the edge (top, not
 * bottom) and the DEFAULT STATE (open, not closed). The second is the one
 * that would ship silently: tiles a reader must open before they can see
 * what a folio offers read as absent, which is the complaint that opened
 * `v0jv` about the in-flow row in the first place. Sliding the strip up is
 * the reader's act; it is not the starting position.
 *
 * `.fa-board-tiles` was a `flex-wrap` row appended after the sticky grid, IN
 * FLOW — so on the landing board it landed below every full-bleed card. Only
 * the PLACEMENT was ever wrong: `harness-tiles` already fixes the
 * declaration side (*"declared once, per-surface visibility, never two
 * registries"*), and the first spec below is what keeps this change honest
 * about that.
 */
test.describe("the folio's tile strip", () => {
  test("the strip holds the BOARD surface's tiles — still one registry", async ({ page }) => {
    // THE ONE THAT MATTERS. A placement change must not become a registry
    // change, and that failure ships by looking fine. Every board-surface
    // tile must be inside the strip, and the strip must hold nothing else.
    await page.goto(URL_PAGE);
    await ready(page);
    const inStrip = await page
      .locator(".fa-board-tiles [data-fa-tile]")
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.faTile).sort());
    const onBoard = (await tilesOnPage(page, "board")).map((t) => t.id).sort();
    expect(onBoard.length).toBeGreaterThan(0);
    expect(inStrip).toEqual(onBoard);
  });

  test("it is the BOARD's edge, not the viewport's", async ({ page }) => {
    // `sticky`, never `fixed`. The strip belongs to the FOLIO: it travels
    // with the board and goes when the board goes. A viewport-fixed bar is
    // chrome for the page — a different object — and would follow a reader
    // onto content that has no tiles at all.
    await page.goto(URL_PAGE);
    await ready(page);
    const pos = await page
      .locator(".fa-board-strip")
      .evaluate((el) => getComputedStyle(el).position);
    expect(pos).toBe("sticky");
  });

  test("it is the TOP edge, and it precedes every card", async ({ page }) => {
    // Two facts, because either alone passes while the strip is in the wrong
    // place: `top: 0` on an element appended last still sticks to the top of
    // whatever is left below it, and DOM order alone says nothing about which
    // edge it clings to. Both, or the strip is only incidentally at the top.
    //
    // NOT "the board's first child", which is the assertion this nearly was
    // and which would have been wrong: the board's head (its title) and its
    // filter row precede the strip, and they should. *"On the top"* means
    // above the CARDS — the tiles announce what the folio offers before a
    // reader meets its contents. Putting them above the board's own title
    // would answer "what can I open" before "what is this".
    await page.goto(URL_PAGE);
    await ready(page);
    const strip = page.locator(".fa-board-strip").first();
    await expect(strip).toHaveCSS("top", "0px");
    const grid = page.locator(".fa-sticky-grid").first();
    const before = await strip.evaluate(
      (el, sel) => {
        const g = el.parentElement?.querySelector(sel as string);
        // `DOCUMENT_POSITION_FOLLOWING` — the grid comes after the strip.
        return !!g && (el.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      },
      ".fa-sticky-grid",
    );
    expect(before).toBe(true);
    const stripBox = await strip.boundingBox();
    const gridBox = await grid.boundingBox();
    expect(stripBox!.y).toBeLessThan(gridBox!.y);
  });

  test("it starts OPEN — a reader never has to ask what a folio offers", async ({ page }) => {
    // The correction to `v0jv`, asserted rather than left to the markup.
    // Closed-by-default is what made the old in-flow row read as absent, and
    // it is the state a refactor would silently restore.
    await page.goto(URL_PAGE);
    await ready(page);
    await expect(page.locator(".fa-board-strip").first()).toHaveAttribute("open", "");
  });

  test("it opens and closes from the keyboard alone", async ({ page }) => {
    // No `page.mouse` below. The declared interaction profile is
    // low-dexterity, and a slide-away whose only way in is a pointer excludes
    // the person who asked for it. `l4zi`: the inverse must be reachable too,
    // which is why this closes and then reopens rather than stopping at the
    // first transition.
    await page.goto(URL_PAGE);
    await ready(page);
    const strip = page.locator(".fa-board-strip").first();
    const summary = strip.locator("summary");
    await expect(summary).toHaveAttribute("aria-label", /Visualisations/);

    await summary.press("Enter");
    await expect(strip).not.toHaveAttribute("open", "");
    await summary.press("Enter");
    await expect(strip).toHaveAttribute("open", "");
  });

  test("the tiles are SQUARE", async ({ page }) => {
    // *"i meant to use same SQUARE TILES taht are in the expanding menu of
    // LHS navbar."* The template was already shared with the launcher; what
    // was not square was the tile itself, a flex item of flexible width in a
    // wrap row. Measured from the box, not from the declaration, because
    // `aspect-ratio` loses to a `min-height` that outgrows it — which is the
    // bug this would have shipped.
    await page.goto(URL_PAGE);
    await ready(page);
    const tile = page.locator(".fa-board-tiles .fa-tile").first();
    const box = await tile.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs(box!.width - box!.height)).toBeLessThanOrEqual(1);
  });

  test("an open window passes OVER the strip — chrome is not content", async ({ page }) => {
    // The bean states it outright: "the tiles must NOT be projected onto the
    // glass — they are folio chrome, where a window is content." So the float
    // layer stacks above the strip, and this holds that line.
    await page.goto(URL_PAGE);
    await ready(page);
    const stripZ = await page
      .locator(".fa-board-strip")
      .first()
      .evaluate((el) => Number(getComputedStyle(el).zIndex));
    const layerZ = await page
      .locator(".fa-sticky-layer")
      .evaluate((el) => Number(getComputedStyle(el).zIndex));
    expect(layerZ).toBeGreaterThan(stripZ);
  });
});

test.describe("the glyph a tile wears is DECLARED, by name", () => {
  test("a declared icon renders a different glyph from the generic one", async ({ page }) => {
    // Asserted as a DIFFERENCE, not against the bean's path data. A test
    // carrying the artwork would fail on every redraw while proving only that
    // the string was copied twice; what has to hold is that the declaration
    // reached the renderer and changed what it drew.
    await page.goto(URL_PAGE);
    await ready(page);
    const byId = Object.fromEntries((await tilesOnPage(page, "navbar")).map((t) => [t.id, t.glyph]));
    expect(byId["beans"]).toBeTruthy();
    expect(byId["beans"]).not.toBe(byId["library/1"]);
  });

  test("an unknown icon name falls back to the glyph every tile had before", async ({ page }) => {
    // `library/1` declares `no-such-glyph`; `library/2` declares nothing. The
    // two must be identical, which is what "falls back" has to mean — a folio
    // naming a glyph its platform has not got still gets a working tile.
    await page.goto(URL_PAGE);
    await ready(page);
    const nav = Object.fromEntries((await tilesOnPage(page, "navbar")).map((t) => [t.id, t.glyph]));
    const board = Object.fromEntries((await tilesOnPage(page, "board")).map((t) => [t.id, t.glyph]));
    expect(nav["library/1"]).toBeTruthy();
    expect(nav["library/1"]).toBe(board["library/2"]);
  });

  test("an INHERITED property name is not a glyph", async ({ page }) => {
    // `navbar-only` declares `constructor`. A bare `TILE_GLYPHS[name]` lookup
    // returns `Object`'s constructor for it, and `innerHTML = <function>`
    // writes its SOURCE into the page. Asserted both ways: the tile renders
    // the fallback, and the word `function` appears nowhere in it.
    await page.goto(URL_PAGE);
    await ready(page);
    const nav = Object.fromEntries((await tilesOnPage(page, "navbar")).map((t) => [t.id, t.glyph]));
    expect(nav["navbar-only"]).toBe(nav["library/1"]);
    const html = await page.locator('[data-fa-tile="navbar-only"]').innerHTML();
    expect(html).not.toContain("function");
  });

  test("a tile's glyph is the same on both surfaces", async ({ page }) => {
    // One declaration, two surfaces — the same rule Q11 states for visibility.
    await page.goto(URL_PAGE);
    await ready(page);
    const nav = await tilesOnPage(page, "navbar");
    const board = await tilesOnPage(page, "board");
    const onBoth = nav.filter((n) => board.some((b) => b.id === n.id));
    expect(onBoth.length).toBeGreaterThan(0);
    for (const n of onBoth) {
      expect(board.find((b) => b.id === n.id)!.glyph).toBe(n.glyph);
    }
  });
});

test.describe("a staging-only tile appears only on a preview", () => {
  /**
   * The companion to `compose-docs.ts` withholding the PAGE. Both halves have
   * to agree or the reader gets the worst outcome of the two: a tile in the
   * navbar linking to a page that deploy does not carry.
   *
   * Asserted on both sides of the switch, and the canonical case first —
   * that is the default, the one `docs-site.yml` produces, and the one where
   * being wrong publishes a dead link to everybody.
   */
  test("it is absent when the page carries no fa-staging", async ({ page }) => {
    await page.goto(URL_PAGE);
    await ready(page);
    const ids = (await tilesOnPage(page, "navbar")).map((t) => t.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).not.toContain("staging-only");
  });

  test("it appears when fa-staging names a slug", async ({ page }) => {
    await page.route("http://staging.test/**", (route) => {
      const url = route.request().url();
      if (url.endsWith("/page.html")) {
        return route.fulfill({
          contentType: "text/html",
          body: PAGE.replace(
            `<meta name="fa-baseurl" content="${BASE}">`,
            `<meta name="fa-baseurl" content="${BASE}">\n<meta name="fa-staging" content="my-branch">`,
          ),
        });
      }
      if (url.endsWith("/assets/todos/index.json")) {
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ $schema: "folio-todo-index/v1", items: ITEMS }),
        });
      }
      return route.fulfill({ status: 404, body: "not found" });
    });
    await page.goto("http://staging.test/page.html");
    await ready(page);
    expect((await tilesOnPage(page, "navbar")).map((t) => t.id)).toContain("staging-only");
  });

  test("an EMPTY fa-staging is canonical, not a preview", async ({ page }) => {
    // The value `{{ site.data.build.staging_slug }}` renders to when the key
    // is absent — which is every canonical build. Treating empty as "present"
    // would publish the tile on the real site while the page is withheld,
    // which is the exact failure this pair exists to prevent.
    await page.route("http://empty.test/**", (route) => {
      const url = route.request().url();
      if (url.endsWith("/page.html")) {
        return route.fulfill({
          contentType: "text/html",
          body: PAGE.replace(
            `<meta name="fa-baseurl" content="${BASE}">`,
            `<meta name="fa-baseurl" content="${BASE}">\n<meta name="fa-staging" content="">`,
          ),
        });
      }
      if (url.endsWith("/assets/todos/index.json")) {
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ $schema: "folio-todo-index/v1", items: ITEMS }),
        });
      }
      return route.fulfill({ status: 404, body: "not found" });
    });
    await page.goto("http://empty.test/page.html");
    await ready(page);
    expect((await tilesOnPage(page, "navbar")).map((t) => t.id)).not.toContain("staging-only");
  });

  test("showing hidden tiles does not resurrect it", async ({ page }) => {
    // `hidden` and `publish` are different axes: one is a reader's preference
    // about a page that exists, the other is whether the page is there at all.
    // Conflating them would let "show hidden" produce a link to a 404.
    await page.goto(URL_PAGE);
    await ready(page);
    const board = (await tilesOnPage(page, "board")).map((t) => t.id);
    expect(board).not.toContain("staging-only");
  });
});
