import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { siteDirFor } from "../schemas/cat-harness.ts";
import { injectRail } from "../scripts/lib/harness-rail.ts";

/**
 * The harness icon row on a RAILED page — bean `wckf` (#2147), under `9rq1`.
 *
 * Owner, 2026-10-05: *"still no LHS icons top navbar on who-iris page"*, then
 * *"this should be a common navbar functionality in harness"*. The row was
 * drawn only into the theme's `.side-bar` (`navbar-row.e2e.ts` covers that
 * surface). These pages carry `lib/navbar.ts`'s `nav.fa-nav` instead, so they
 * had the harness's navbar without the harness's row.
 *
 * The page is built by the REAL `injectRail` — not a hand-written copy of the
 * rail — so a change to the rail's markup or its own stylesheet is tested
 * here as it ships. That is how the first measurement below was found: the
 * rail's `.fa-nav a{padding:8px 12px}` drew the row's LINK glyphs 8px wide.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = siteDirFor(ROOT);
const CSS = readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");
const LIVE = (JSON.parse(readFileSync(join(ROOT, SITE, "_data/harness.json"), "utf8")) as { navbar: { icons: string[] } | null }).navbar;
if (!LIVE) throw new Error("docs/_data/harness.json has navbar:null — run `bun run docs:harness`.");

const SHELL =
  `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
  `<meta name="fa-baseurl" content="/folio-assistant"><style>${CSS}</style></head>` +
  `<body><h1 id="t">A replica page</h1><h2 id="a">One</h2><h2 id="b">Two</h2>` +
  `<script>${JS}<\/script></body></html>`;

function railed(row: unknown): string {
  const html = injectRail(SHELL, {
    instance: "WHO IRIS",
    toRoot: "..",
    links: [{ label: "Catalogue", href: "../cat-harness/catalogue/who-iris/" }],
    navbarRow: row,
  });
  if (!html) throw new Error("injectRail declined the fixture");
  return html;
}

async function serve(page: import("@playwright/test").Page, html: string) {
  await page.route("**/*", (r) => r.fulfill({ status: 200, contentType: "text/html", body: html }));
  await page.goto("http://127.0.0.1:8080/folio-assistant/who-iris/x.html");
  await page.waitForLoadState("domcontentloaded");
}

test("the rail carries the harness row, directly under its fixed top", async ({ page }) => {
  await serve(page, railed(LIVE));
  const row = page.locator("nav.fa-nav .fa-nav-in > .fa-nav-icons");
  await expect(row).toHaveCount(1);
  // Placement: the row's previous sibling is the rail's fixed top.
  expect(await row.evaluate((r) => r.previousElementSibling?.className)).toBe("fa-nav-top");
  // Every declared slot but `close` (CSS-placed, never drawn in the row).
  const declared = LIVE.icons.filter((i) => i !== "close").length;
  expect(await row.locator(".fa-nav-icon").count()).toBeGreaterThanOrEqual(declared);
});

test("every glyph in the rail's row is drawn at full size — links as well as buttons", async ({ page }) => {
  // Measured before the fix: links 8px, buttons 18px, on the who-iris replica.
  await serve(page, railed(LIVE));
  const widths = await page.$$eval("nav.fa-nav .fa-nav-icons svg", (s) => s.map((e) => Math.round(e.getBoundingClientRect().width)));
  expect(widths.length).toBeGreaterThan(0);
  expect(new Set(widths)).toEqual(new Set([18]));
});

test("at rest the row is one icon wide; open, it lies flat", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await serve(page, railed(LIVE));
  // AT REST means the pointer is not over the rail. Playwright's pointer can
  // start at (0, 0) — which IS the rail — so the strip measured open (248px)
  // in CI and at rest locally. Put it over the page body first.
  await page.mouse.move(900, 600);
  const box = () => page.locator("nav.fa-nav .fa-nav-icons").evaluate((r) => r.getBoundingClientRect());
  await expect.poll(async () => Math.round((await box()).width)).toBe(56);
  const rest = await box();
  expect(Math.round(rest.width)).toBe(56); // --fa-nav-collapsed, 3.5rem
  await page.hover("nav.fa-nav");
  await expect.poll(async () => Math.round((await box()).height)).toBeLessThan(Math.round(rest.height));
});

test("no row data, no row — and no invented one", async ({ page }) => {
  await serve(page, railed(undefined));
  expect(await page.locator("#fa-navbar-row").count()).toBe(0);
  await expect(page.locator("nav.fa-nav .fa-nav-icons")).toHaveCount(0);
});
