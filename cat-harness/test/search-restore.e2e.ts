import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { siteDirFor } from "../schemas/cat-harness.ts";
import { FRAGMENT } from "../scripts/staging-banner.ts";

/**
 * HIDDEN SEARCH COMES BACK — owner, 2026-09-24, verbatim:
 *
 * > hiding search makes it go away compleletey, cant restore.
 *
 * ## What was actually wrong, measured on the real preview
 *
 * Hiding search is the slide control: it sends the field to the upper-right
 * corner, collapsed behind a magnifier, with a chevron beside it that docks it
 * back (`l4zi` — the inverse has to be reachable). On a bare replica both are
 * there and both answer, which is why `action-tiles.e2e.ts` is green.
 *
 * On the REAL page they were not reachable. Taken off `gh-pages` (the
 * `rendered-verification` method) and hit-tested at 1280px and 390px: the
 * point under the magnifier AND the point under the chevron were both the
 * STAGING BANNER — `position: sticky; top: 0; z-index: 9999`, 36px tall —
 * and the corner card sat at `top: 0.75rem`, entirely beneath it. Every
 * preview is where the owner reviews, so on every page they looked at, the
 * only two controls that could bring search back were drawn under a banner:
 * gone completely, cannot restore.
 *
 * So this spec mounts the banner the staging injector actually ships
 * (`FRAGMENT`, imported rather than retyped) and asserts the way back by
 * HIT TEST, not by visibility — a control under another element is
 * "visible" to every locator assertion and still cannot be pressed.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = siteDirFor(ROOT);
const CSS = readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");

const SEARCH =
  '<div class="search" role="search"><div class="search-input-wrap">' +
  '<input type="text" id="search-input" class="search-input" autocomplete="off">' +
  '<label for="search-input" class="search-label"><span class="sr-only">Search folio-assistant</span></label>' +
  '</div><div id="search-results" class="search-results"></div></div>';

/** A preview page: the banner first in the body, as the injector places it. */
const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>p</title>
<style>body { margin: 0; } ${CSS}</style></head><body>${FRAGMENT}
<div class="side-bar"><div class="site-header"><a class="site-title">folio-assistant</a></div><nav class="site-nav"></nav></div>
<div class="main"><div class="main-content-wrap"><div class="main-header">${SEARCH}</div>
<div class="main-content"><h1>Getting started</h1><p>Text.</p></div></div></div>
<script>${JS}<\/script></body></html>`;

const URL_ = "http://replica.test/folio-assistant/STAGING/some-branch/page.html";

async function load(page: Page) {
  await page.route("http://replica.test/**", (route) => {
    const u = new URL(route.request().url());
    if (u.pathname.endsWith("/page.html")) return route.fulfill({ contentType: "text/html", body: PAGE });
    return route.fulfill({ status: 404, body: "not found" });
  });
  await page.goto(URL_);
  await page.waitForSelector(".fa-search-home");
}

/** Is THIS element what a press at its centre lands on? */
const pressable = (page: Page, sel: string) =>
  page.locator(sel).evaluate((n) => {
    const r = n.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return "no box";
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    if (hit && (hit === n || n.contains(hit))) return "yes";
    return hit ? `covered by ${hit.tagName}${(hit as HTMLElement).hasAttribute("data-fa-staging-banner") ? " [staging banner]" : ""}` : "nothing";
  });

for (const width of [1280, 390]) {
  test.describe(`hidden search can always be restored — ${width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await load(page);
      await expect(page.locator("[data-fa-staging-banner]")).toBeVisible();
    });

    test("after hiding, a visible SHOW SEARCH control is on screen and takes the press", async ({ page }) => {
      await page.locator(".fa-search-slide").click();
      await expect(page.locator(".fa-search-home")).toHaveAttribute("data-place", "corner");
      await expect(page.locator("#search-input")).toBeHidden();
      const restore = page.locator(".fa-search-slide");
      // Reachable FIRST — the measured defect. Under the banner, nothing else
      // about the control matters.
      expect(await pressable(page, ".fa-search-slide")).toBe("yes");
      expect(await pressable(page, ".fa-search-peek")).toBe("yes");
      // Said in WORDS on screen, not only in a tooltip or an aria-label: a
      // glyph alone is what the owner could not find.
      await expect(restore).toContainText("Show search");
      const b = (await restore.boundingBox())!;
      expect(b.height).toBeGreaterThanOrEqual(24);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(width);
      await restore.click();
      await expect(page.locator(".fa-search-home")).toHaveAttribute("data-place", "navbar");
      await expect(page.locator("#search-input")).toBeVisible();
    });

    test("the hide control says so in words too, and both directions work from the keyboard", async ({ page }) => {
      const slide = page.locator(".fa-search-slide");
      await expect(slide).toContainText("Hide search");
      await slide.focus();
      await page.keyboard.press("Enter");
      await expect(page.locator(".fa-search-home")).toHaveAttribute("data-place", "corner");
      await page.locator(".fa-search-slide").focus();
      await page.keyboard.press("Enter");
      await expect(page.locator(".fa-search-home")).toHaveAttribute("data-place", "navbar");
      await expect(page.locator("#search-input")).toBeFocused();
    });

    test("the choice persists like the other preferences — and so does the way back", async ({ page }) => {
      await page.locator(".fa-search-slide").click();
      await page.reload();
      await page.waitForSelector(".fa-search-home");
      await expect(page.locator(".fa-search-home")).toHaveAttribute("data-place", "corner");
      await expect(page.locator(".fa-search-slide")).toContainText("Show search");
      expect(await pressable(page, ".fa-search-slide")).toBe("yes");
      await page.locator(".fa-search-slide").click();
      await page.reload();
      await page.waitForSelector(".fa-search-home");
      await expect(page.locator(".fa-search-home")).toHaveAttribute("data-place", "navbar");
      await expect(page.locator("#search-input")).toBeVisible();
    });
  });
}
