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
  { id: "beans", coverage: { visualiser: "cat-harness/docs/beans/index.html" } },
  {
    id: "library",
    coverage: {
      visualiser: [
        { ref: "cat-harness/docs/library/shelf.html", title: "Shelf" },
        { ref: "cat-harness/docs/library/map.html", title: "Map", surfaces: ["board"] },
      ],
    },
  },
  { id: "navbar-only", coverage: { visualiser: [{ ref: "cat-harness/docs/n.html", surfaces: ["navbar"] }] } },
  { id: "starts-hidden", coverage: { visualiser: [{ ref: "cat-harness/docs/h.html", hidden: true }] } },
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
