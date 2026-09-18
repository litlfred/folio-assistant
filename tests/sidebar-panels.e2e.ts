import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The three sidebar disclosure panels — QR, reading preferences, language —
 * must open where nothing clips them.
 *
 * Reported broken by a reader on 2026-09-18: the language selector and the
 * reading-preferences panel were invisible or overlapping, while the QR panel
 * worked. Cause: just-the-docs hard-caps `.site-header` height at the desktop
 * breakpoint. QR mounted its panel into `.side-bar` and escaped; the other two
 * did not. The language bar additionally opened UPWARD to dodge the cap, which
 * only moved the clipping to the top of the column.
 *
 * This harness reproduces the theme's structure — the fixed sidebar, the
 * height-capped header, and a sticky banner like the staging one — because the
 * bug only appears when the cap is present. Testing against a page without it
 * would pass on the broken code.
 */

// `import.meta.dir` is a Bun extension and is undefined under Node, which is
// what Playwright runs the spec with.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSS = readFileSync(join(ROOT, "docs/assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, "docs/assets/js/docs-ui.js"), "utf8");
// The QR encoder must load FIRST: `mountQr` returns early without it, and
// mountQr is what mounts the theme toggle, reading preferences and language
// switcher too. Omitting it mounts nothing and every assertion below fails
// for the wrong reason.
const QR = readFileSync(join(ROOT, "docs/assets/js/vendor/qrcode.js"), "utf8");

const HARNESS = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
  body { margin: 0; }
  /* The staging banner: sticky, above everything. */
  .banner { position: sticky; top: 0; z-index: 9999; background: #4F6F52; color: #fff; padding: 8px; }
  /* just-the-docs' sidebar column and its CAPPED header — the cause. */
  /* The offset rule the staging workflow injects alongside the banner. */
  :root { --fa-staging-offset: 0px; }
  .side-bar { top: var(--fa-staging-offset, 0px) !important; }
  .side-bar { position: fixed; top: 0; left: 0; width: 16.5rem; height: 100%;
              display: flex; flex-flow: column nowrap; align-items: flex-end;
              background: #27262b; color: #fff; }
  .site-header { width: 100%; max-height: 3.75rem; overflow: hidden; display: flex; align-items: center; }
  .site-title { flex: 1; }
  .site-nav { width: 100%; overflow-y: auto; }
  ${CSS}
</style></head><body>
  <div class="banner" data-fa-staging-banner>FEATURE BRANCH</div>
  <script>(function(){function s(){var b=document.querySelector('[data-fa-staging-banner]');if(!b)return;document.documentElement.style.setProperty('--fa-staging-offset',b.getBoundingClientRect().height+'px');}if(document.readyState!=='loading')s();else document.addEventListener('DOMContentLoaded',s);window.addEventListener('resize',s);window.addEventListener('load',s);})();<\/script>
  <div class="side-bar">
    <div class="site-header"><a class="site-title">folio-assistant</a></div>
    <nav class="site-nav"><a href="#">Home</a></nav>
  </div>
  <div class="main"><div class="main-content"><h1>x</h1></div></div>
  <script>${QR}<\/script>
  <script>${JS}<\/script>
</body></html>`;

const PANELS = [
  { name: "language", toggle: ".fa-lang-toggle", panel: ".fa-lang-bar" },
  { name: "reading preferences", toggle: ".fa-a11y-toggle", panel: ".fa-a11y-panel" },
  { name: "QR", toggle: ".fa-qr-toggle:not(.fa-theme-toggle):not(.fa-lang-toggle):not(.fa-a11y-toggle)", panel: ".fa-qr-panel" },
];

test.describe("sidebar disclosure panels", () => {
  for (const p of PANELS) {
    test(`${p.name}: panel escapes the height-capped header`, async ({ page }) => {
      await page.setContent(HARNESS);
      const panel = page.locator(p.panel).first();
      await expect(panel).toHaveCount(1);
      // The whole bug in one assertion: a panel inside .site-header is clipped
      // by its max-height, whatever else is done to it.
      const inHeader = await panel.evaluate((el) => !!el.closest(".site-header"));
      expect(inHeader).toBe(false);
      const inSideBar = await panel.evaluate((el) => !!el.closest(".side-bar"));
      expect(inSideBar).toBe(true);
    });

    test(`${p.name}: opens fully visible, not under the banner`, async ({ page }) => {
      await page.setContent(HARNESS);
      await page.locator(p.toggle).first().click();
      const panel = page.locator(p.panel).first();
      await expect(panel).toBeVisible();

      const box = await panel.boundingBox();
      expect(box).not.toBeNull();
      // Non-zero area — a clipped panel collapses.
      expect(box!.height).toBeGreaterThan(0);
      expect(box!.width).toBeGreaterThan(0);
      // Below the banner's bottom edge. The upward-opening language bar failed
      // exactly here: it rendered above its toggle and under the banner.
      const bannerBottom = (await page.locator(".banner").boundingBox())!.y
        + (await page.locator(".banner").boundingBox())!.height;
      expect(box!.y).toBeGreaterThanOrEqual(bannerBottom - 1);
      // And on-screen at all.
      expect(box!.y).toBeGreaterThanOrEqual(0);
    });
  }

  test("the banner pushes the fixed sidebar down instead of covering it", async ({ page }) => {
    // The defect a reader hit: `.side-bar` is `position: fixed; top: 0` and a
    // sticky banner is in normal flow, so it moved nothing and sat on top of
    // the sidebar's title and toolbar. The workflow now measures the banner
    // and publishes its height as --fa-staging-offset.
    await page.setContent(HARNESS);
    const banner = (await page.locator(".banner").boundingBox())!;
    const sideBar = (await page.locator(".side-bar").boundingBox())!;
    expect(sideBar.y).toBeGreaterThanOrEqual(banner.y + banner.height - 1);

    // And the toolbar controls are therefore actually clickable rather than
    // sitting under the banner.
    for (const sel of [".fa-theme-toggle", ".fa-a11y-toggle", ".fa-lang-toggle"]) {
      const b = (await page.locator(sel).first().boundingBox())!;
      expect(b.y).toBeGreaterThanOrEqual(banner.y + banner.height - 1);
    }
  });

  test("an opened panel does not overlap the nav — it pushes it down", async ({ page }) => {
    await page.setContent(HARNESS);
    await page.locator(".fa-a11y-toggle").first().click();
    const panel = (await page.locator(".fa-a11y-panel").boundingBox())!;
    const nav = (await page.locator(".site-nav").boundingBox())!;
    // Normal flow, not an overlay: the nav starts at or below the panel's end.
    expect(nav.y).toBeGreaterThanOrEqual(panel.y + panel.height - 1);
  });
});
