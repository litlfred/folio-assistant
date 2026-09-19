import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The header's four buttons became one launcher over a grid of action tiles.
 *
 * Bean `1le7`, from the owner: *"that navbar is getting crowded. will need to
 * make expandable set of icon tiles that build out to the size of the QR code.
 * use that as kind of the template size for action icons, settins opens into
 * that tile with poppouts from there if neede, same for languages, smae for
 * this KG graph veiwer and src. light dark mode icon is tile under settings."*
 *
 * The motivating fact is that **the knowledge-graph viewer had no entry point
 * at all**: it publishes at `<base>/kg/` and nothing on the site linked to it.
 * Adding it, plus the source link, to a header row that already held four
 * buttons and the site title would have made the stated problem worse.
 *
 * ## What is asserted here, and why each of it
 *
 * The placement property — a panel not clipped by the theme's height-capped
 * header — belongs to `sidebar-panels.e2e.ts` and stays there. This file is
 * about the launcher itself: that every action is REACHABLE, that the two new
 * ones point where the site config says rather than at a hardcoded URL, and
 * that the whole thing is operable by someone who cannot use a mouse.
 *
 * The accessibility half is not decoration. This instance's declared
 * interaction profile is low-dexterity (`.harness/interaction.json`), and the
 * standing rule is `skills/folio-core/ui-accessibility.md`. A tile that is
 * barely 24px is a tile that is hard to hit, so the floor is checked and the
 * page aims well above it.
 */

// `import.meta.dir` is a Bun extension and is undefined under Node, which is
// what Playwright runs the spec with.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSS = readFileSync(join(ROOT, "docs/assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, "docs/assets/js/docs-ui.js"), "utf8");
const QR = readFileSync(join(ROOT, "docs/assets/js/vendor/qrcode.js"), "utf8");

/**
 * The link block `head_custom.html` fills from `_config.yml`.
 *
 * Under a `baseurl` — this site serves from `/folio-assistant/` — an absolute
 * `/kg/` is a 404, which is why the value is computed by Liquid's
 * `relative_url` and read from here rather than written into `docs-ui.js`.
 */
const LINKS = JSON.stringify({
  kg: "/folio-assistant/kg/",
  source: "https://github.com/litlfred/folio-assistant",
});

/**
 * The page under test: the theme's sidebar shape, the assets, and a stub of
 * just-the-docs' own theme API.
 *
 * The stub is not padding. applyScheme refuses to act when jtd.setTheme is
 * absent and warns instead, which is right in production — the theme is an
 * UNPINNED remote theme, so a missing setTheme is version drift and silently
 * pretending to have switched would be worse than saying nothing happened. It
 * does mean a harness without the stub cannot exercise the scheme switch at
 * all: the first run of this spec reported a dead button that is not dead.
 *
 * NO BACKTICKS INSIDE THE TEMPLATE LITERAL BELOW. The whole page is one, so a
 * backtick anywhere in it — including inside an HTML comment — ends the string
 * and the file stops parsing. The note you are reading was in that comment
 * until it did exactly that.
 */
function harness(links: string | null): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
  body { margin: 0; }
  .side-bar { position: fixed; top: 0; left: 0; width: 16.5rem; height: 100%;
              display: flex; flex-flow: column nowrap; align-items: flex-end;
              background: #27262b; color: #fff; }
  .site-header { width: 100%; max-height: 3.75rem; overflow: hidden; display: flex; align-items: center; }
  .site-title { flex: 1; }
  .site-nav { width: 100%; overflow-y: auto; }
  ${CSS}
</style></head><body>
  ${links === null ? "" : `<script type="application/json" id="fa-site-links">${links}<\/script>`}
  <div class="side-bar">
    <div class="site-header"><a class="site-title">folio-assistant</a></div>
    <nav class="site-nav"><a href="#">Home</a></nav>
  </div>
  <div class="main"><div class="main-content"><h1>x</h1></div></div>
  <script>window.jtd = { theme: "dark",
    getTheme: function () { return this.theme; },
    setTheme: function (t) { this.theme = t; } };<\/script>
  <script>${QR}<\/script>
  <script>${JS}<\/script>
</body></html>`;
}

const HARNESS = harness(LINKS);

async function openTiles(page: import("@playwright/test").Page): Promise<void> {
  await page.setContent(HARNESS);
  await page.locator(".fa-tiles-toggle").click();
}

test.describe("action tiles", () => {
  test("the header carries ONE control, not a row of them", async ({ page }) => {
    // The point of the change. Four toggles and a title in a 3.75rem row was
    // the complaint; six would have been the alternative.
    await page.setContent(HARNESS);
    await expect(page.locator(".site-header .fa-qr-toggle")).toHaveCount(1);
    await expect(page.locator(".fa-tiles-toggle")).toHaveAttribute("aria-expanded", "false");
    // Closed until asked. A panel that starts open is a panel in the way.
    await expect(page.locator(".fa-tiles")).toBeHidden();
  });

  test("every action is one press away", async ({ page }) => {
    await openTiles(page);
    await expect(page.locator(".fa-tiles-toggle")).toHaveAttribute("aria-expanded", "true");
    const captions = await page.locator(".fa-tiles-grid .fa-tile-caption").allTextContents();
    expect(captions).toEqual(["Settings", "Language", "QR code", "Knowledge graph", "Source"]);
  });

  test("the knowledge-graph tile points where the site config says", async ({ page }) => {
    // The whole reason the bean exists: `<base>/kg/` was published and
    // unreachable. And the href is read from `#fa-site-links`, not composed —
    // a literal `/kg/` would 404 under this site's `/folio-assistant/` baseurl.
    await openTiles(page);
    const tile = page.locator(".fa-tile", { hasText: "Knowledge graph" });
    await expect(tile).toHaveAttribute("href", "/folio-assistant/kg/");
    await expect(page.locator(".fa-tile", { hasText: "Source" }))
      .toHaveAttribute("href", "https://github.com/litlfred/folio-assistant");
  });

  test("with no link config, the link tiles are absent rather than broken", async ({ page }) => {
    // A tile that goes nowhere is worse than a missing one: the reader cannot
    // tell a broken link from a broken site. The other three still mount.
    await page.setContent(harness(null));
    await page.locator(".fa-tiles-toggle").click();
    await expect(page.locator(".fa-tile", { hasText: "Knowledge graph" })).toHaveCount(0);
    await expect(page.locator(".fa-tile", { hasText: "Source" })).toHaveCount(0);
    await expect(page.locator(".fa-tiles-grid .fa-tile")).toHaveCount(3);
  });

  test("light/dark is a tile under Settings, not in the grid", async ({ page }) => {
    // The owner placed it there. It is the one control here a reader sets once
    // and never touches, so it does not earn a row of prime space.
    await openTiles(page);
    await expect(page.locator(".fa-tiles-grid .fa-theme-toggle")).toHaveCount(0);
    await page.locator(".fa-tile", { hasText: "Settings" }).click();
    await expect(page.locator(".fa-tiles-view .fa-theme-toggle")).toBeVisible();
  });

  test("the theme tile still switches the scheme, and says which it is in", async ({ page }) => {
    await openTiles(page);
    await page.locator(".fa-tile", { hasText: "Settings" }).click();
    const theme = page.locator(".fa-theme-toggle");
    const before = await theme.getAttribute("aria-pressed");
    await theme.click();
    await expect(theme).not.toHaveAttribute("aria-pressed", String(before));
    // The caption and the accessible name must agree about the current state;
    // the icon alone is two similar bulbs at 20px.
    const label = await theme.getAttribute("aria-label");
    const caption = await theme.locator(".fa-tile-caption").textContent();
    expect(label).toContain(caption === "Light" ? "Light mode is on" : "Dark mode is on");
  });

  test("Back returns to the grid and to the tile that was pressed", async ({ page }) => {
    // Focus management, not decoration: the panel is rewritten in place, so a
    // reader who cannot easily point must not have to hunt for the keyboard.
    await openTiles(page);
    const tile = page.locator(".fa-tile", { hasText: "Language" });
    await tile.click();
    await expect(page.locator(".fa-tiles-grid")).toBeHidden();
    await page.locator(".fa-tiles-back").click();
    await expect(page.locator(".fa-tiles-grid")).toBeVisible();
    await expect(tile).toBeFocused();
  });

  test("opening a view moves focus to what the view became", async ({ page }) => {
    await openTiles(page);
    await page.locator(".fa-tile", { hasText: "QR code" }).click();
    await expect(page.locator(".fa-tiles-title")).toBeFocused();
    await expect(page.locator(".fa-tiles-title")).toHaveText("QR code");
  });

  test("Escape undoes one step, not three", async ({ page }) => {
    await openTiles(page);
    await page.locator(".fa-tile", { hasText: "Settings" }).click();
    await page.keyboard.press("Escape");
    // Back to the grid — the panel is still open.
    await expect(page.locator(".fa-tiles-grid")).toBeVisible();
    await expect(page.locator(".fa-tiles")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".fa-tiles")).toBeHidden();
    await expect(page.locator(".fa-tiles-toggle")).toBeFocused();
  });

  test("the QR view encodes the address the reader is at", async ({ page }) => {
    await openTiles(page);
    await page.locator(".fa-tile", { hasText: "QR code" }).click();
    await expect(page.locator(".fa-tiles-view .fa-qr-panel svg")).toBeVisible();
    await expect(page.locator(".fa-qr-caption")).not.toBeEmpty();
  });

  test("every tile clears the 24px target floor, with room to spare", async ({ page }) => {
    // WCAG 2.2 SC 2.5.8 is the floor. A low-dexterity reader needs the margin,
    // so the tiles are built at 4rem and this holds the legal minimum in case
    // that comfort is ever spent.
    await openTiles(page);
    const small = await page.evaluate(() => {
      const out: string[] = [];
      for (const e of document.querySelectorAll(".fa-tiles button, .fa-tiles a[href]")) {
        const r = e.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.height < 24 || r.width < 24) {
          out.push(`${e.textContent} ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      }
      return out;
    });
    expect(small).toEqual([]);
  });

  test("every tile has an accessible name that is not just its glyph", async ({ page }) => {
    await openTiles(page);
    const names = await page.locator(".fa-tiles-grid .fa-tile").evaluateAll((els) =>
      els.map((e) => e.getAttribute("aria-label") ?? ""),
    );
    expect(names.every((n) => n.length > 0)).toBe(true);
    // The two links say where they GO, because "Source" names a thing and not
    // a destination.
    expect(names.filter((n) => n.includes(" — "))).toHaveLength(2);
  });

  test("the grid is reachable and operable from the keyboard alone", async ({ page }) => {
    await page.setContent(HARNESS);
    await page.locator(".fa-tiles-toggle").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".fa-tiles")).toBeVisible();
    // Real <button>s and <a>s, so Tab reaches them and Enter acts, without the
    // page having to implement either. A <div> with an onclick would pass a
    // click test and fail this one.
    await page.locator(".fa-tile", { hasText: "Settings" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".fa-tiles-view .fa-theme-toggle")).toBeVisible();
  });
});
