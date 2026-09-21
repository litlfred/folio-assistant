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

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="fa-todo-src" content="/assets/todos/index.json">
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
      expect(t.href, `${t.id} opens its declared visualisation`).toBe(declared.href);
      expect(declared.href).toBe(publishedHref("cat-harness/docs", declared.ref));
    }
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

/* ── `v0jv` — the tiles dock at the folio's edge ──────────────────
 *
 * Owner: *"folios have tiles do not go to the window. they are stacked around
 * (bottom?) of folio, slid away, open to tiles to things like fsh-gts, todos,
 * docs, etc."*
 *
 * `.fa-board-tiles` was a `flex-wrap` row appended after the sticky grid, IN
 * FLOW — so on the landing board it landed below every full-bleed card and
 * read as absent. Only the PLACEMENT was wrong: `harness-tiles` already fixes
 * the declaration side (*"declared once, per-surface visibility, never two
 * registries"*), and the first spec below is what keeps this change honest
 * about that.
 */
test.describe("the folio's tile dock", () => {
  test("the dock holds the BOARD surface's tiles — still one registry", async ({ page }) => {
    // THE ONE THAT MATTERS. A placement change must not become a registry
    // change, and that failure ships by looking fine. Every board-surface
    // tile must be inside the dock, and the dock must hold nothing else.
    await page.goto(URL_PAGE);
    await ready(page);
    const inDock = await page
      .locator('.fa-board-tiles [data-fa-tile]')
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.faTile).sort());
    const onBoard = (await tilesOnPage(page, "board")).map((t) => t.id).sort();
    expect(onBoard.length).toBeGreaterThan(0);
    expect(inDock).toEqual(onBoard);
  });

  test("it is the BOARD's edge, not the viewport's", async ({ page }) => {
    // `sticky`, never `fixed`. The dock belongs to the FOLIO: it travels with
    // the board and goes when the board goes. A viewport-fixed bar is chrome
    // for the page — a different object — and would follow a reader onto
    // content that has no tiles at all.
    await page.goto(URL_PAGE);
    await ready(page);
    const pos = await page
      .locator(".fa-board-dock")
      .evaluate((el) => getComputedStyle(el).position);
    expect(pos).toBe("sticky");
  });

  test("it opens and closes from the keyboard alone", async ({ page }) => {
    // No `page.mouse` below. The declared interaction profile is
    // low-dexterity, and a slide-away whose only way in is a pointer excludes
    // the person who asked for it. `l4zi`: the inverse must be reachable too.
    await page.goto(URL_PAGE);
    await ready(page);
    const dock = page.locator(".fa-board-dock");
    const summary = dock.locator("summary");
    await expect(summary).toHaveAttribute("aria-label", /Visualisations/);

    await summary.press("Enter");
    await expect(dock).toHaveAttribute("open", "");
    await summary.press("Enter");
    await expect(dock).not.toHaveAttribute("open", "");
  });

  test("opening it does not move the board's own content", async ({ page }) => {
    // A dock that reflows the grid moves the card a reader was about to
    // click. Written because it is the failure mode a bottom dock invites,
    // and measured rather than assumed from `position: sticky`.
    await page.goto(URL_PAGE);
    await ready(page);
    const grid = page.locator(".fa-sticky-grid");
    const before = await grid.boundingBox();
    await page.locator(".fa-board-dock summary").press("Enter");
    const after = await grid.boundingBox();
    expect(after?.y).toBe(before?.y);
    expect(after?.height).toBe(before?.height);
  });

  test("an open window passes OVER the dock — chrome is not content", async ({ page }) => {
    // The bean states it outright: "the tiles must NOT be projected onto the
    // glass — they are folio chrome, where a window is content." So the float
    // layer stacks above the dock, and this holds that line.
    await page.goto(URL_PAGE);
    await ready(page);
    const dockZ = await page
      .locator(".fa-board-dock")
      .evaluate((el) => Number(getComputedStyle(el).zIndex));
    const layerZ = await page
      .locator(".fa-sticky-layer")
      .evaluate((el) => Number(getComputedStyle(el).zIndex));
    expect(layerZ).toBeGreaterThan(dockZ);
  });
});
