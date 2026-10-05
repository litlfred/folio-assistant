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
// The row's own stylesheet FIRST, as `head_custom.html` links it (beans `lhvt`, `9rq1`).
const CSS = readFileSync(join(ROOT, SITE, "assets/css/navbar-row.css"), "utf8") + "\n" + readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
// `navbar-row.js` FIRST — it draws the row, and `docs-ui.js` calls it — as `head_custom.html` loads them.
const JS = readFileSync(join(ROOT, SITE, "assets/js/navbar-row.js"), "utf8") + "\n" + readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");
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

const ROW_JS = readFileSync(join(ROOT, SITE, "assets/js/navbar-row.js"), "utf8");
const ROW_CSS = readFileSync(join(ROOT, SITE, "assets/css/navbar-row.css"), "utf8");
const DOCS_UI_JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");

/**
 * Serve `html` at a who-iris replica's address, and the site's real assets at
 * the addresses `injectRail` links them from (`../assets/...` from there).
 */
async function serve(page: import("@playwright/test").Page, html: string, assets: Record<string, string> = {}) {
  const files: Record<string, [string, string]> = {
    "/folio-assistant/assets/js/navbar-row.js": ["text/javascript", ROW_JS],
    "/folio-assistant/assets/css/navbar-row.css": ["text/css", ROW_CSS],
    "/folio-assistant/assets/js/docs-ui.js": ["text/javascript", DOCS_UI_JS],
    ...Object.fromEntries(Object.entries(assets).map(([k, v]) => [k, ["text/javascript", v] as [string, string]])),
  };
  await page.route("**/*", (r) => {
    const path = new URL(r.request().url()).pathname;
    const hit = files[path];
    if (hit) return r.fulfill({ status: 200, contentType: hit[0], body: hit[1] });
    if (path.endsWith(".html")) return r.fulfill({ status: 200, contentType: "text/html", body: html });
    return r.fulfill({ status: 404, body: "" });
  });
  await page.goto("http://127.0.0.1:8080/folio-assistant/who-iris/x.html");
  await page.waitForLoadState("load");
}

/** A railed page as the 2,709 were: the real rail, no `docs-ui.js`, no `docs-ui.css`. */
const BARE =
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>bare</title></head>` +
  `<body><h1 id="t">An API page</h1><h2 id="a">One</h2></body></html>`;
function railedBare(row: unknown): string {
  const html = injectRail(BARE, {
    instance: "C@T Harness",
    toRoot: "..",
    links: [{ label: "Catalogue", href: "../cat-harness/catalogue/who-iris/" }],
    navbarRow: row,
  });
  if (!html) throw new Error("injectRail declined the bare fixture");
  return html;
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

/* THE 2,709 — bean `lhvt`. Measured on the built site after #2149: railed
 * pages that never load `docs-ui.js` carried the row's data and drew nothing.
 * These run the page exactly as `injectRail` writes it, with the real
 * `navbar-row.js` and `navbar-row.css` fetched from where it links them. */

test("a railed page WITHOUT docs-ui.js draws the row — the link slots, at full size", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await serve(page, railedBare(LIVE));
  const row = page.locator("nav.fa-nav .fa-nav-in > .fa-nav-icons");
  await expect(row).toHaveCount(1);
  await expect(row).toHaveAttribute("data-fa-row", "lite");
  expect(await row.evaluate((r) => r.previousElementSibling?.className)).toBe("fa-nav-top");
  // Links, prefixed with the site base the SCRIPT was served under: this page
  // carries no `fa-baseurl` meta, which is the case the derivation is for.
  const hrefs = await row.locator("a.fa-nav-icon").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  // Every declared slot except the ones that need `docs-ui.js` (the launcher
  // and the globe, both LEFT OUT here) and the retired close. Derived, not a
  // number: the row's membership is the owner's to change (bean `82qs`).
  const linked = LIVE.icons.filter((i: string) => !["close", "launcher", "language"].includes(i));
  expect(hrefs.length).toBe(linked.length);
  await expect(row.locator(".fa-nav-lang")).toHaveCount(0);
  for (const h of hrefs) expect(h).toMatch(/^\/folio-assistant\//);
  const widths = await row.locator("svg").evaluateAll((s) => s.map((e) => Math.round(e.getBoundingClientRect().width)));
  expect(new Set(widths)).toEqual(new Set([18]));
  expect(errors).toEqual([]);
});

test("without docs-ui.js the launcher is LEFT OUT and fsh-guts is a link — owner, 2026-10-05", async ({ page }) => {
  await serve(page, railedBare(LIVE));
  const row = page.locator("nav.fa-nav .fa-nav-icons");
  await expect(row).toHaveCount(1);
  await expect(row.locator('[aria-label="More actions"]')).toHaveCount(0);
  await expect(row.locator(".fa-nav-scheme")).toHaveCount(0);
  if (LIVE.icons.includes("fsh-guts")) {
    await expect(row.locator("button[data-fa-fsh-guts-open]")).toHaveCount(0);
    await expect(row.locator('a[aria-label^="fsh-guts"], span[aria-label^="fsh-guts"]')).toHaveCount(1);
  }
});

test("at rest the lite row is one icon wide, with no docs-ui.css to size it", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await serve(page, railedBare(LIVE));
  await page.mouse.move(900, 600);
  const width = () => page.locator("nav.fa-nav .fa-nav-icons").evaluate((r) => Math.round(r.getBoundingClientRect().width));
  await expect.poll(width).toBe(56);
});

test("docs-ui.js arriving AFTER the row upgrades it to the full row", async ({ page }) => {
  // A `folio-mount.ts` page appends docs-ui.js from an inline script; here it
  // is appended once the lite row is drawn, the later of the two orders.
  await serve(page, railedBare(LIVE));
  await expect(page.locator("nav.fa-nav .fa-nav-icons")).toHaveAttribute("data-fa-row", "lite");
  await page.evaluate(() => {
    const s = document.createElement("script");
    s.src = "/folio-assistant/assets/js/docs-ui.js";
    document.head.appendChild(s);
  });
  const row = page.locator("nav.fa-nav .fa-nav-icons");
  await expect(row).toHaveAttribute("data-fa-row", "full");
  await expect(row).toHaveCount(1);
  await expect(row.locator(".fa-nav-scheme")).toHaveCount(1);
});

test("docs-ui.js running BEFORE the row script still ends with the full row", async ({ page }) => {
  // The other order: docs-ui.js first, leaving its hooks; navbar-row.js then
  // finds them. Only the row's own tag is removed from the page for this.
  const html = railedBare(LIVE)
    .replace(/<script src="[^"]*navbar-row\.js" defer><\/script>/, "")
    .replace("</head>", '<script src="/folio-assistant/assets/js/docs-ui.js"></script></head>');
  await serve(page, html);
  const row = page.locator("nav.fa-nav .fa-nav-icons");
  await expect(row).toHaveAttribute("data-fa-row", "full");
  await expect(row).toHaveCount(1);
});
