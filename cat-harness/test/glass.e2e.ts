/**
 * THE GLASS — R25's pull-down folio, on a page that is not folio-assistant's.
 *
 * Owner: *"the user in visualization should be able to pull down their
 * folio"*, and *"pulling down folio panel = glass/window on which stikcy
 * notes/avatrs of materialized assets … are visualized."*
 *
 * ## The fixture is a REPLICA page, and that is the whole test
 *
 * `jpjt` measured the gap on `who-iris`: `docs-ui.js` 0, boards 0, tiles 0.
 * The cause was not that anything was broken but that the glass was created
 * INSIDE `mountTodoBoard`, behind two guards that belong to a board —
 * `fetchTodoIndex`'s `items === null` and `mountTodoBoard`'s `!main`. So the
 * folio existed only where a just-the-docs page had already put a `<main>`
 * and an index, and a reader browsing a library carried nothing.
 *
 * The page below therefore has **no `<main>`, no `.main-content`, no sidebar
 * header, and its todo index 404s** — every condition a `who-iris` replica
 * page meets. A fixture that kept any of them would be testing the board's
 * host, not the glass, and would pass just as happily with the defect in
 * place. That is the `check-invocation-parity` lesson: *a matcher proven only
 * against fixtures is proven against its author's idea of the file.*
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { siteDirFor } from "../schemas/cat-harness.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = siteDirFor(ROOT);
const CSS = readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");

/** A standalone replica page: its own shell, none of the harness's furniture. */
const REPLICA = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="fa-todo-src" content="/assets/todos/index.json">
<style>${CSS}</style></head><body>
<div class="wrap"><h1>An ingested copy</h1><p>Not WHO, and not live.</p></div>
<script>${JS}</script></body></html>`;

const URL_PAGE = "http://replica.test/page.html";

test.beforeEach(async ({ page }) => {
  await page.route("http://replica.test/**", (route) => {
    const url = route.request().url();
    if (url.endsWith("/page.html")) {
      return route.fulfill({ contentType: "text/html", body: REPLICA });
    }
    // The index 404s ON PURPOSE — a library page has no todo index, and the
    // glass must not depend on one.
    return route.fulfill({ status: 404, body: "not found" });
  });
  await page.goto(URL_PAGE);
  await page.waitForSelector(".fa-glass-handle", { state: "attached" });
});

const layer = ".fa-sticky-layer";
const handle = ".fa-glass-handle";

test.describe("the glass exists on a page that is not the harness's", () => {
  test("THE WITNESS — no <main>, no sidebar, no todo index, and still a folio", async ({ page }) => {
    // Each absence asserted, so the fixture cannot drift into being a
    // just-the-docs page and take the test's meaning with it.
    expect(await page.locator("main, #main-content, .main-content").count()).toBe(0);
    expect(await page.locator(".site-header, .side-bar").count()).toBe(0);
    await expect(page.locator(layer)).toBeAttached();
    await expect(page.locator(handle)).toBeVisible();
  });

  test("the board did NOT mount — the glass is not a board in disguise", async ({ page }) => {
    // The control: if a board had somehow mounted, every assertion above
    // would pass for the old reason and the change would be untested.
    expect(await page.locator(".fa-sticky-board").count()).toBe(0);
  });

  // Bean `015u`. A harness VIEWER has no theme header, so the handle landed
  // on its h1. A viewer carries the fixture's own mark, and with it the page
  // reserves the handle's band. The REPLICA above carries no mark and must
  // stay unchanged (`folio-mount.e2e`, bean `jpjt`).
  for (const width of [1280, 390]) {
    test(`on a VIEWER the handle covers none of the first content at ${width} px`, async ({ page }) => {
      await page.route("http://replica.test/viewer.html", (route) =>
        route.fulfill({
          contentType: "text/html",
          body: REPLICA.replace("<style>", "<style data-folio-narrow-viewport></style><style>"),
        }),
      );
      await page.setViewportSize({ width, height: 800 });
      await page.goto("http://replica.test/viewer.html");
      await page.waitForSelector(handle, { state: "attached" });
      const hb = await page.locator(handle).boundingBox();
      const h1 = await page.locator("h1").boundingBox();
      expect(hb).not.toBeNull();
      expect(h1).not.toBeNull();
      expect(h1!.y).toBeGreaterThanOrEqual(hb!.y + hb!.height);
    });
  }

  // Owner, 2026-09-24: "folio handle on LHS on navbar". With a navbar on the
  // page, the handle is an item IN it, so it overhangs nothing: not a
  // viewer's h1 (`015u`), not a replica's banner (`269z`).
  const NAVBARS: [string, string, string][] = [
    ["the harness rail", `<nav class="fa-nav"><div class="fa-nav-in"><div class="fa-nav-top"><label class="fa-nav-head">☰</label></div></div></nav>`, ".fa-nav-top"],
    ["the theme's sidebar", `<header class="side-bar"><div class="site-header"><a class="site-title">Site</a></div></header>`, ".side-bar"],
  ];
  for (const [name, nav, parent] of NAVBARS) {
    for (const width of [1280, 390]) {
      test(`with ${name}, the handle sits IN it and covers no content, at ${width} px`, async ({ page }) => {
        await page.route("http://replica.test/nav.html", (route) =>
          route.fulfill({ contentType: "text/html", body: REPLICA.replace("<body>", `<body>${nav}`) }),
        );
        await page.setViewportSize({ width, height: 800 });
        await page.goto("http://replica.test/nav.html");
        await page.waitForSelector(handle, { state: "attached" });
        expect(await page.locator(`${parent} ${handle}`).count()).toBe(1);
        await expect(page.locator(handle)).toHaveClass(/fa-glass-handle--in-nav/);
        // Not over the page's content.
        const hb = (await page.locator(handle).boundingBox())!;
        const h1 = (await page.locator("h1").boundingBox())!;
        const overlaps = hb.x < h1.x + h1.width && h1.x < hb.x + hb.width && hb.y < h1.y + h1.height && h1.y < hb.y + hb.height;
        expect(overlaps).toBe(false);
        // And it still opens and closes the glass from there.
        await page.locator(handle).click();
        await expect(page.locator(handle)).toHaveAttribute("aria-expanded", "true");
        await page.locator(handle).click();
        await expect(page.locator(handle)).toHaveAttribute("aria-expanded", "false");
      });
    }
  }
});

test.describe("pulled down, and put away", () => {
  test("it starts closed and passes pointers through", async ({ page }) => {
    // CLOSED IS NOT MERELY INVISIBLE. A full-viewport div that captured
    // clicks would make every page unusable, and would do it invisibly —
    // which is why this asserts the computed value rather than a class.
    await expect(page.locator(layer)).toHaveAttribute("data-fa-glass", "closed");
    const pe = await page.locator(layer).evaluate((el) => getComputedStyle(el).pointerEvents);
    expect(pe).toBe("none");
  });

  test("it opens and closes from the keyboard alone", async ({ page }) => {
    // No `page.mouse`. The declared interaction profile is low-dexterity, and
    // a folio whose only way in is a pointer excludes the person who asked
    // for it.
    const h = page.locator(handle);
    await h.focus();
    await h.press("Enter");
    await expect(page.locator(layer)).toHaveAttribute("data-fa-glass", "open");
    await expect(h).toHaveAttribute("aria-expanded", "true");

    // `l4zi`: the inverse is reachable, and by the SAME control.
    await h.press("Enter");
    await expect(page.locator(layer)).toHaveAttribute("data-fa-glass", "closed");
    await expect(h).toHaveAttribute("aria-expanded", "false");
  });

  test("Escape puts it away and returns focus to the handle", async ({ page }) => {
    // Left alone, focus lands on <body> and the keyboard position is gone —
    // the same defect `l4zi` records for the inline board's close.
    const h = page.locator(handle);
    await h.focus();
    await h.press("Enter");
    await page.keyboard.press("Escape");
    await expect(page.locator(layer)).toHaveAttribute("data-fa-glass", "closed");
    expect(await page.evaluate(() => document.activeElement?.className)).toContain("fa-glass-handle");
  });

  test("the handle stays reachable while the glass is open", async ({ page }) => {
    // A glass you can only leave by guessing at Escape is not a toggle. The
    // handle's z-index has to clear the layer's, and this measures the boxes
    // rather than reading the declarations.
    const h = page.locator(handle);
    await h.focus();
    await h.press("Enter");
    await expect(h).toBeVisible();
    const [hz, lz] = await Promise.all([
      h.evaluate((el) => Number(getComputedStyle(el).zIndex)),
      page.locator(layer).evaluate((el) => Number(getComputedStyle(el).zIndex)),
    ]);
    expect(hz).toBeGreaterThan(lz);
  });

  test("an EMPTY glass still comes down, and says so", async ({ page }) => {
    // `.fa-sticky-layer:empty { display: none }` is right for a float layer
    // and wrong for a glass: "nothing on your folio" and "the glass is
    // broken" are opposite facts, and the first is a state a reader reaches
    // by tidying.
    const h = page.locator(handle);
    await h.focus();
    await h.press("Enter");
    await expect(page.locator(".fa-glass-sheet")).toBeVisible();
    await expect(page.locator(".fa-glass-empty")).toBeVisible();
    await expect(page.locator(".fa-glass-empty")).toContainText("Nothing on your folio glass");
  });

  test("the page underneath is still there — a glass overlays, it does not replace", async ({ page }) => {
    const h = page.locator(handle);
    await h.focus();
    await h.press("Enter");
    await expect(page.locator(".wrap h1")).toHaveText("An ingested copy");
  });
});
