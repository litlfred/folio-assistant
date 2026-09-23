/**
 * A STICKY'S HOME — bean `pv6g`.
 *
 * Owner, 2026-09-21: *"stickies can detach from the panel and placed on the
 * 'display window/glass' and dont scroll when the folio/document/page
 * scrolls. when closed tehy returned to their home display panel."*
 *
 * Owner, 2026-09-23, choosing what "home" means: **"Panel it came from"** —
 * *"each sticky records which panel and slot it came from, and closing
 * returns it there. If that panel isn't on this page, it waits in your folio.
 * Landing stickies get a Pin button too."*
 *
 * Three pages, because the rule is about moving BETWEEN them:
 * - LANDING: a landing board whose cells are slots — the home of two stickies
 * - BOARD:   a just-the-docs page with a todo index — the todo board's home
 * - AWAY:    a replica page with neither — where a pin must say where home is
 */
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { siteDirFor } from "../schemas/cat-harness.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = siteDirFor(ROOT);
const CSS = readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");

const cell = (id: string, title: string, body: string) => `
  <div class="fa-sticky-cell" data-fa-home-slot="${id}">
    <article class="fa-sticky fa-landing-sticky" aria-labelledby="fa-sticky-${id}-summary">
      <h2 id="fa-sticky-${id}-summary" class="fa-sr-only">${title}</h2>
      <div class="fa-landing-sticky__text"><div class="fa-landing-sticky__body"><p>${body}</p></div></div>
    </article>
  </div>`;

/** The landing page: a slide-away panel holding the landing board, as `landing.html` renders it. */
const LANDING = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Home page</title>
<style>${CSS}</style></head><body>
<details class="fa-sticky-panel" open><summary>Stickies</summary><div class="fa-sticky-panel__body">
<div class="fa-sticky-board fa-landing-board" data-fa-home-panel="landing">
${cell("alpha", "Alpha note", "The alpha body text.")}
${cell("beta", "Beta note", "The beta body text.")}
</div></div></details>
<script>${JS}</script></body></html>`;

/** The landing page WITH a todo index, so the todo board mounts INSIDE the landing board. */
const LANDING_TODOS = LANDING.replace(
  "<title>Home page</title>",
  '<title>Home page</title><meta name="fa-todo-src" content="/assets/todos/index.json">',
);

/** A page with no home panel at all — a library replica. */
const AWAY = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Away</title>
<style>${CSS}</style></head><body><h1>A library page</h1>
<script>${JS}</script></body></html>`;

const ITEMS = [
  { id: "t-one", summary: "First todo", comment: "Why it matters.", status: "open", priority: "high",
    origin: "agent", createdAt: "2026-09-23",
    tags: { roles: [], processes: [], tasks: [], identities: [], references: [], artefacts: [] } },
];

/** A just-the-docs page, so the todo board mounts. */
const BOARD = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Board page</title>
<meta name="fa-todo-src" content="/assets/todos/index.json">
<style>${CSS}</style></head><body>
<div class="side-bar"><div class="site-header"><a class="site-title">Site</a></div><nav class="site-nav"></nav></div>
<div class="main-content-wrap"><div class="main-content" id="main-content"><h1>Harness</h1></div></div>
<script>${JS}</script></body></html>`;

test.beforeEach(async ({ page }) => {
  await page.route("http://home.test/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/landing.html") return route.fulfill({ contentType: "text/html", body: LANDING });
    if (path === "/landing-todos.html") return route.fulfill({ contentType: "text/html", body: LANDING_TODOS });
    if (path === "/away.html") return route.fulfill({ contentType: "text/html", body: AWAY });
    if (path === "/board.html") return route.fulfill({ contentType: "text/html", body: BOARD });
    if (path === "/assets/todos/index.json") {
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ items: ITEMS }) });
    }
    return route.fulfill({ status: 404, body: "not found" });
  });
});

const go = async (page: Page, name: string) => {
  await page.goto(`http://home.test/${name}.html`);
  await page.waitForSelector(".fa-glass-handle", { state: "attached" });
};
const layer = ".fa-sticky-layer";
const alphaCell = '[data-fa-home-slot="alpha"]';
const pinned = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("fa-pinned-stickies") || "{}"));

test.describe("a landing sticky has a home, and closing returns it there", () => {
  test("every landing sticky gets a Pin button", async ({ page }) => {
    await go(page, "landing");
    await expect(page.locator(".fa-home-pin")).toHaveCount(2);
  });

  test("pinning floats a COPY onto the glass and leaves a Return in its slot", async ({ page }) => {
    await go(page, "landing");
    await page.locator(`${alphaCell} .fa-home-pin`).click();
    const card = page.locator(`${layer} [data-fa-pin="landing/alpha"]`);
    await expect(card).toBeVisible();
    await expect(card).toContainText("The alpha body text.");
    await expect(page.locator(`${alphaCell} > .fa-sticky`)).toBeHidden();
    await expect(page.locator(`${alphaCell} .fa-sticky-recall`)).toBeVisible();
    // The HOME is recorded, not remembered.
    const store = await pinned(page);
    expect(store["landing/alpha"]).toMatchObject({ panel: "landing", slot: "alpha", title: "Alpha note" });
  });

  test("the copy carries no id of the original — one id, one element", async ({ page }) => {
    await go(page, "landing");
    await page.locator(`${alphaCell} .fa-home-pin`).click();
    expect(await page.locator("#fa-sticky-alpha-summary").count()).toBe(1);
    await expect(page.locator(`${layer} [data-fa-pin="landing/alpha"]`)).toHaveAttribute("aria-label", "Alpha note");
  });

  test("Return on the CARD sends it home and forgets the pin", async ({ page }) => {
    await go(page, "landing");
    await page.locator(`${alphaCell} .fa-home-pin`).click();
    await page.locator(`${layer} [data-fa-pin="landing/alpha"] .fa-sticky-sendhome`).click();
    await expect(page.locator(`${layer} [data-fa-pin="landing/alpha"]`)).toHaveCount(0);
    await expect(page.locator(`${alphaCell} > .fa-sticky`)).toBeVisible();
    await expect(page.locator(`${alphaCell} .fa-home-pin`)).toBeFocused();
    expect(await pinned(page)).toEqual({});
  });

  test("Return in the SLOT does the same — the grey space is a real control", async ({ page }) => {
    await go(page, "landing");
    await page.locator(`${alphaCell} .fa-home-pin`).click();
    await page.locator(`${alphaCell} .fa-sticky-recall`).click();
    await expect(page.locator(`${layer} [data-fa-pin="landing/alpha"]`)).toHaveCount(0);
    await expect(page.locator(`${alphaCell} > .fa-sticky`)).toBeVisible();
  });

  test("a pin, and where it was moved to, survive a reload", async ({ page }) => {
    await go(page, "landing");
    await page.locator(`${alphaCell} .fa-home-pin`).click();
    const card = page.locator(`${layer} [data-fa-pin="landing/alpha"]`);
    const left0 = await card.evaluate((n) => parseFloat((n as HTMLElement).style.left));
    await card.locator('[data-fa-control="move"]').click();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Escape");
    await go(page, "landing");
    const again = page.locator(`${layer} [data-fa-pin="landing/alpha"]`);
    await expect(again).toBeVisible();
    expect(await again.evaluate((n) => parseFloat((n as HTMLElement).style.left))).toBe(left0 - 16);
    // Restored quietly: the page did not move focus onto the card.
    await expect(again.locator('[data-fa-control="move"]')).not.toBeFocused();
  });
});

test.describe("away from home, a pinned sticky says where home is", () => {
  test("on a page with no home panel it shows from its stored TEXT, with a way home", async ({ page }) => {
    await go(page, "landing");
    await page.locator(`${alphaCell} .fa-home-pin`).click();
    await go(page, "away");
    const card = page.locator(`${layer} .fa-sticky-away[data-fa-pin="landing/alpha"]`);
    await expect(card).toBeVisible();
    await expect(card).toContainText("Alpha note");
    await expect(card).toContainText("The alpha body text.");
    await expect(card.locator(".fa-sticky-away-home")).toHaveAttribute("href", "/landing.html");
    await expect(card.locator(".fa-sticky-away-home")).toContainText("Home page");
  });

  test("Send home unpins it, and it is back in its slot at home", async ({ page }) => {
    await go(page, "landing");
    await page.locator(`${alphaCell} .fa-home-pin`).click();
    await go(page, "away");
    await page.locator(`${layer} .fa-sticky-away .fa-sticky-sendhome`).click();
    await expect(page.locator(`${layer} .fa-sticky-away`)).toHaveCount(0);
    await expect(page.locator(".fa-home-live")).toContainText("sent home");
    await go(page, "landing");
    await expect(page.locator(`${layer} [data-fa-pin="landing/alpha"]`)).toHaveCount(0);
    await expect(page.locator(`${alphaCell} > .fa-sticky`)).toBeVisible();
  });

  test("stored text is rendered as TEXT, never as markup", async ({ page }) => {
    await go(page, "away");
    await page.evaluate(() => localStorage.setItem("fa-pinned-stickies", JSON.stringify({
      "landing/x": { panel: "landing", slot: "x", title: "<img src=x onerror=alert(1)>",
                     text: "<b>bold</b>", href: "javascript:alert(1)", label: "Home" },
    })));
    await go(page, "away");
    const card = page.locator(`${layer} .fa-sticky-away`);
    await expect(card).toContainText("<img src=x onerror=alert(1)>");
    expect(await card.locator("img, b").count()).toBe(0);
    // A refused scheme is no link at all, never a link to it.
    expect(await card.locator("a").count()).toBe(0);
  });
});

test.describe("the todo board is a home too", () => {
  const openBoard = async (page: Page) => {
    await page.locator(".fa-tiles-toggle").click();
    await page.locator(".fa-tile", { hasText: "Todos" }).click();
  };

  test("a pinned todo is recorded with the board as its home", async ({ page }) => {
    await go(page, "board");
    await openBoard(page);
    await page.locator(".fa-sticky-slot .fa-sticky-pin").first().click();
    expect((await pinned(page))["todos/t-one"]).toMatchObject({ panel: "todos", slot: "t-one", title: "First todo" });
    await expect(page.locator('[data-fa-home-panel="todos"] [data-fa-home-slot="t-one"]')).toHaveCount(1);
  });

  test("it is still pinned on the next page with a board, and docking forgets it", async ({ page }) => {
    await go(page, "board");
    await openBoard(page);
    await page.locator(".fa-sticky-slot .fa-sticky-pin").first().click();
    await go(page, "board");
    await expect(page.locator(`${layer} .fa-sticky-floating`)).toHaveCount(1);
    await openBoard(page);
    await page.locator(".fa-sticky-recall").click();
    expect(await pinned(page)).toEqual({});
  });

  test("on a page with no board it is an away card pointing at the board's page", async ({ page }) => {
    await go(page, "board");
    await openBoard(page);
    await page.locator(".fa-sticky-slot .fa-sticky-pin").first().click();
    await go(page, "away");
    const card = page.locator(`${layer} .fa-sticky-away[data-fa-pin="todos/t-one"]`);
    await expect(card).toContainText("First todo");
    await expect(card.locator(".fa-sticky-away-home")).toHaveAttribute("href", "/board.html");
  });

  test("with the todo board nested inside the landing board, each panel keeps its own slots", async ({ page }) => {
    // Panels nest: the todo board mounts inside the landing board.
    //
    // WHAT THIS DOES NOT PROVE, measured: replacing `ownSlots`' nearest-panel
    // check with `return true` still passes, because the landing pins are
    // wired at init, BEFORE the board's fetch resolves, so no todo slot exists
    // yet to be misread. The guard is kept for the day that order changes; this
    // spec pins the nested structure and the count, not the guard.
    await go(page, "landing-todos");
    // The board really is nested — or this test proves nothing.
    await expect(page.locator('[data-fa-home-panel="landing"] [data-fa-home-panel="todos"]')).toHaveCount(1);
    await expect(page.locator('[data-fa-home-panel="todos"] [data-fa-home-slot="t-one"]')).toHaveCount(1);
    await expect(page.locator(".fa-home-pin")).toHaveCount(2);
    await expect(page.locator('[data-fa-home-slot="t-one"] .fa-home-pin')).toHaveCount(0);
  });
});
