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
 * The link block `head_custom.html` fills from `docs/_data/harness.json`.
 *
 * **Read from the generated file, not retyped here.** The previous fixture
 * carried `kg: "/folio-assistant/kg/"` — the very 404 bean `udx8` is about —
 * and asserted the tile matched it, so the spec agreed with the defect and
 * passed. A fixture that restates the value under test cannot catch a wrong
 * one; this one takes whatever `sync-docs-harness.ts` resolved.
 *
 * Liquid applies `relative_url` to each `path`, which under this site's
 * `/folio-assistant/` baseurl is what the template does; `url` entries are
 * off-site and printed as-is.
 */
const HARNESS_DATA = JSON.parse(readFileSync(join(ROOT, "docs/_data/harness.json"), "utf8")) as {
  links: { id: string; path?: string; url?: string }[];
};
const BASEURL = "/folio-assistant";
const LINK_MAP: Record<string, string> = {};
for (const l of HARNESS_DATA.links) LINK_MAP[l.id] = l.path ? BASEURL + l.path : (l.url ?? "");
const LINKS = JSON.stringify(LINK_MAP);

/**
 * just-the-docs' search, as the theme renders it into `.main-header`.
 *
 * The ids and class names are the theme's, because `docs-ui.js` MOVES this
 * container rather than rebuilding it — a stub with different names would
 * exercise a code path the site does not have.
 */
const SEARCH_MARKUP =
  '<div class="search">' +
  '<div class="search-input-wrap">' +
  '<input type="text" id="search-input" class="search-input" tabindex="0" ' +
  'placeholder="Search folio-assistant" aria-label="Search folio-assistant" autocomplete="off">' +
  '<label for="search-input" class="search-label">' +
  '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="none" ' +
  'stroke="currentColor"/></svg></label>' +
  "</div>" +
  '<div id="search-results" class="search-results"></div>' +
  "</div>";

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
function harness(links: string | null, search: string = SEARCH_MARKUP): string {
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
  <div class="main"><div class="main-header">${search}</div><div class="main-content"><h1>x</h1></div></div>
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

  test("every action is one press away, and Search leads", async ({ page }) => {
    await openTiles(page);
    await expect(page.locator(".fa-tiles-toggle")).toHaveAttribute("aria-expanded", "true");
    const captions = await page.locator(".fa-tiles-grid .fa-tile-caption").allTextContents();
    // Named, not counted. `toHaveLength(n)` breaks on the next tile and says
    // nothing about which one is missing.
    for (const name of ["Search", "Settings", "Language", "QR code",
                        "Knowledge graph", "JSON-LD", "Source"]) {
      expect(captions).toContain(name);
    }
    // Search is the one action a reader reaches for repeatedly and the one
    // that was taken off the main panel, so it gets the first cell.
    expect(captions[0]).toBe("Search");
  });

  test("the knowledge-graph tile points at the VIEWER, not at /kg/", async ({ page }) => {
    // The whole reason bean `udx8` exists. `/folio-assistant/kg/` was what
    // the template composed and nothing has ever been published there: the
    // renderings sit at the base, named after the stub. The expected value is
    // read from the generated `harness.json`, so this cannot drift back into
    // agreeing with a wrong one.
    await openTiles(page);
    await expect(page.locator(".fa-tile", { hasText: "Knowledge graph" }))
      .toHaveAttribute("href", LINK_MAP.kg);
    expect(LINK_MAP.kg).not.toContain("/kg/");
    // The graph as DATA and the code that produced it are two artefacts, so
    // they are two tiles — the owner asked for "the jsonld and github".
    await expect(page.locator(".fa-tile", { hasText: "JSON-LD" }))
      .toHaveAttribute("href", LINK_MAP.jsonld);
    await expect(page.locator(".fa-tile", { hasText: "Source" }))
      .toHaveAttribute("href", LINK_MAP.source);
    // `blob`, never `raw.githubusercontent`: raw 404s on a private repo and a
    // session cookie does not authenticate it.
    expect(LINK_MAP.source).toContain("github.com/");
    expect(LINK_MAP.source).not.toContain("raw.githubusercontent");
  });

  test("with no link config, the link tiles are absent rather than broken", async ({ page }) => {
    // A tile that goes nowhere is worse than a missing one: the reader cannot
    // tell a broken link from a broken site. The rest still mount.
    await page.setContent(harness(null));
    await page.locator(".fa-tiles-toggle").click();
    for (const gone of ["Knowledge graph", "JSON-LD", "Source"]) {
      await expect(page.locator(".fa-tile", { hasText: gone })).toHaveCount(0);
    }
    const captions = await page.locator(".fa-tiles-grid .fa-tile-caption").allTextContents();
    expect(captions).toEqual(["Search", "Settings", "Language", "QR code"]);
  });

  /* ── The search, moved off the main panel ───────────────────────────── */

  test("the search leaves the main panel on load, before anything is opened", async ({ page }) => {
    // "keep main display panel uncluttered". If this only happened on first
    // open, every reader who never opens the launcher still sees the clutter.
    await page.setContent(HARNESS);
    await expect(page.locator(".main-header .search")).toHaveCount(0);
    await expect(page.locator(".fa-tiles .search")).toHaveCount(1);
  });

  test("the search input is MOVED, not rebuilt — same node, theme handlers intact", async ({ page }) => {
    // A reconstructed box looks identical and does nothing, because the
    // theme's script binds to the element it rendered. Identity is checked by
    // a property set on the original node before the script could have seen
    // it... which is not possible here, so the next best thing: the node
    // inside the panel carries the theme's own id and label.
    await page.setContent(HARNESS);
    const input = page.locator(".fa-tiles .search input#search-input");
    await expect(input).toHaveCount(1);
    await expect(input).toHaveAttribute("aria-label", "Search folio-assistant");
    // The results list travelled with it; a moved input with an orphaned
    // results container renders its hits into the main panel it just left.
    await expect(page.locator(".fa-tiles .search #search-results")).toHaveCount(1);
  });

  test("the search field is COLLAPSED until the tile is pressed, and then has size", async ({ page }) => {
    // Geometry, not text. `textContent` is DOM order regardless of CSS
    // display, so a collapsed field still answers every text assertion — the
    // input is in the document the whole time BY DESIGN, because the theme
    // looks it up by id and getElementById does not find a detached node.
    await page.setContent(HARNESS);
    const input = page.locator("#search-input");
    await expect(input).toBeHidden();
    expect(await input.boundingBox()).toBeNull();

    await page.locator(".fa-tiles-toggle").click();
    await page.locator(".fa-tile", { hasText: "Search" }).click();
    await expect(input).toBeVisible();
    const box = await input.boundingBox();
    expect(box).not.toBeNull();
    // 24px is the SC 2.5.8 floor; the field is built at 36 and this holds the
    // legal minimum in case that comfort is ever spent.
    expect(box!.height).toBeGreaterThanOrEqual(24);
    expect(box!.width).toBeGreaterThan(80);
  });

  test("pressing Search puts the cursor in the field, from the keyboard alone", async ({ page }) => {
    // A reader who pressed a magnifier is going to type. And the whole path
    // is keyboard-driven here: Tab/Enter to the launcher, Enter on the tile.
    await page.setContent(HARNESS);
    await page.locator(".fa-tiles-toggle").focus();
    await page.keyboard.press("Enter");
    await page.locator(".fa-tile", { hasText: "Search" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#search-input")).toBeFocused();
    await page.keyboard.type("bean");
    await expect(page.locator("#search-input")).toHaveValue("bean");
  });

  test("leaving and re-entering Search keeps the SAME input in the document", async ({ page }) => {
    // The failure this guards: `view.innerHTML = ""` detaches, and a detached
    // input is one getElementById away from a dead search. What the reader
    // typed must survive the round trip too.
    await page.setContent(HARNESS);
    await page.locator(".fa-tiles-toggle").click();
    await page.locator(".fa-tile", { hasText: "Search" }).click();
    await page.locator("#search-input").fill("workflow");

    await page.locator(".fa-tiles-back").click();
    // Parked, hidden, still IN the document — this is the load-bearing bit.
    await expect(page.locator("#search-input")).toHaveCount(1);
    await expect(page.locator("#search-input")).toBeHidden();

    await page.locator(".fa-tile", { hasText: "Search" }).click();
    await expect(page.locator("#search-input")).toBeVisible();
    await expect(page.locator("#search-input")).toHaveValue("workflow");
  });

  test("closing the whole panel does not destroy the search either", async ({ page }) => {
    await page.setContent(HARNESS);
    await page.locator(".fa-tiles-toggle").click();
    await page.locator(".fa-tile", { hasText: "Search" }).click();
    await page.keyboard.press("Escape"); // view -> grid
    await page.keyboard.press("Escape"); // grid -> closed
    await expect(page.locator(".fa-tiles")).toBeHidden();
    await expect(page.locator("#search-input")).toHaveCount(1);
  });

  test("a site with no search gets no Search tile, and keeps its other tiles", async ({ page }) => {
    // `search_enabled: false`, or a theme that renamed the container. A tile
    // opening onto an empty panel is worse than a missing one.
    await page.setContent(harness(LINKS, ""));
    await page.locator(".fa-tiles-toggle").click();
    await expect(page.locator(".fa-tile", { hasText: "Search" })).toHaveCount(0);
    const captions = await page.locator(".fa-tiles-grid .fa-tile-caption").allTextContents();
    expect(captions[0]).toBe("Settings");
    expect(captions).toContain("Knowledge graph");
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
    // Every link says where it GOES, because "Source" and "JSON-LD" name
    // things and not destinations. Named rather than counted: the previous
    // `toHaveLength(2)` said nothing about WHICH tile had lost its hint, and
    // broke the moment a third link was added.
    const hinted = names.filter((n) => n.includes(" — "));
    for (const label of ["Knowledge graph", "JSON-LD", "Source"]) {
      expect(hinted.some((n) => n.startsWith(label + " — "))).toBe(true);
    }
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
