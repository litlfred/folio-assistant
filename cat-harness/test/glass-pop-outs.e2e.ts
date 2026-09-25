import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { siteDirFor } from "../schemas/cat-harness.ts";

/**
 * THREE THINGS ABOUT WHAT SITS ON THE FOLIO GLASS — owner, 2026-09-24.
 *
 * Verbatim, one `describe` per sentence and in the owner's order:
 *
 * > HIDE/show tiles should be inside of tiles panel.
 *
 * > dragging folio should also drag todos/other tile popouts
 *
 * > i expected to see themed square sticky avatar faded with markdown
 * > overlayed when stikcy poopped out
 *
 * Each was written first and seen to FAIL against the code it describes
 * before that code changed. Every gesture keeps its pressing path, and the
 * pressing path is asserted too: the declared interaction profile is
 * low-dexterity.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = siteDirFor(ROOT);
const CSS = readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
// The sticky themes' tokens — the scrim and the ink a themed card reads.
// Loaded because the real page loads it (`head_custom.html`), and a themed
// card measured without it would be measured against fallbacks it never uses.
const THEMES = readFileSync(join(ROOT, SITE, "assets/css/themes.css"), "utf8");
const JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");

const COVER = "/library/who-iris/book-cover.png";
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
/** The REAL backdrop art of the `library` theme, served at its published path. */
const ART_PATH = "/assets/img/harness/landing-library-card.webp";
const ART = readFileSync(join(ROOT, SITE, ART_PATH.slice(1)));

const REPLICA = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Glass</title>
<style>${CSS}</style><style>${THEMES}</style></head><body><main>
<table><tbody>
<tr data-fa-library-item="who-iris/book" data-fa-library-title="A handbook"
    data-fa-library-href="/lib.html#book" data-fa-library-avatar="${COVER}">
  <td data-fa-pullout-host>book</td><td>A handbook</td></tr>
</tbody></table></main>
<script>${JS}</script></body></html>`;

/** The owner's own sticky, with its theme and its markdown, as the index publishes it. */
const SUMMARY = "The human-todos page still says 'Not built yet' — the store now exists";
const TODOS = {
  items: [
    {
      id: "t-one",
      summary: SUMMARY,
      comment: "The page opens **\"Not built yet\"**, and that is no longer *true*.\n\n" +
        "## What it still gets right\n\n- Do not repurpose beans.\n- When a todo is shown.",
      status: "open",
      priority: "medium",
      theme: "library",
      relations: [],
    },
    { id: "t-two", summary: "Second thing", comment: "", status: "open", priority: "low", relations: [] },
  ],
  themeArt: { library: { card: ART_PATH } },
};
const ZOOM = { belowPx: 220, byKind: { todo: { belowPx: 300, because: "a todo needs more room" } } };

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.route("http://replica.test/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/page.html") return route.fulfill({ contentType: "text/html", body: REPLICA });
    if (url.pathname === "/assets/todos/index.json") {
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(TODOS) });
    }
    if (url.pathname === "/assets/semantic-zoom.json") {
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(ZOOM) });
    }
    if (url.pathname === COVER) return route.fulfill({ contentType: "image/png", body: PNG });
    if (url.pathname === ART_PATH) return route.fulfill({ contentType: "image/webp", body: ART });
    return route.fulfill({ status: 404, body: "not found" });
  });
  await page.goto("http://replica.test/page.html");
  await page.waitForSelector(".fa-glass-handle", { state: "attached" });
});

const layer = ".fa-sticky-layer";
const dock = ".fa-glass-dock";
const tab = ".fa-glass-strip-toggle";
const tiles = ".fa-glass-tiles";
const panel = ".fa-glass-panel";
const sticky = '.fa-glass-asset[data-fa-asset="todo/t-one"]';

const open = async (page: Page) => {
  await page.click(".fa-glass-handle");
  await expect(page.locator(layer)).toHaveAttribute("data-fa-glass", "open");
};
const box = async (page: Page, sel: string) => (await page.locator(sel).boundingBox())!;
const inside = (inner: { x: number; y: number; width: number; height: number },
                outer: { x: number; y: number; width: number; height: number }) =>
  inner.x >= outer.x - 0.5 && inner.y >= outer.y - 0.5 &&
  inner.x + inner.width <= outer.x + outer.width + 0.5 &&
  inner.y + inner.height <= outer.y + outer.height + 0.5;

/**
 * THE TILES PANEL, found the way a reader finds it: the nearest box around a
 * tile that actually PAINTS something. Asked of the rendered page rather than
 * of a class name, so the test cannot be satisfied by renaming a wrapper that
 * draws nothing — which is exactly where the toggle sat before, in a dock
 * that painted no panel and so was no panel to the eye.
 */
const panelOfTiles = (page: Page) =>
  page.locator(`${tiles} [data-fa-glass-chrome="glass-todos"]`).evaluate((tile) => {
    let n: HTMLElement | null = tile.parentElement;
    while (n && n !== document.body) {
      const cs = getComputedStyle(n);
      const painted = cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent";
      if (painted) {
        const r = n.getBoundingClientRect();
        const t = document.querySelector(".fa-glass-strip-toggle")!;
        return {
          cls: n.className,
          containsToggle: n.contains(t),
          box: { x: r.x, y: r.y, width: r.width, height: r.height },
        };
      }
      n = n.parentElement;
    }
    return null;
  });

/* ── A. "HIDE/show tiles should be inside of tiles panel." ──────────────── */
test.describe("the Hide/Show tiles control is INSIDE the tiles panel — \"HIDE/show tiles should be inside of tiles panel\"", () => {
  test("shown: the control sits within the panel the tiles are drawn on", async ({ page }) => {
    await open(page);
    const p = await panelOfTiles(page);
    expect(p, "the tiles are drawn on a painted panel").not.toBeNull();
    expect(p!.containsToggle, `the panel (${p!.cls}) holds the Hide tiles control`).toBe(true);
    expect(inside(await box(page, tab), p!.box)).toBe(true);
    await expect(page.locator(tab)).toContainText("Hide tiles");
  });

  test("hidden: the way back is still on screen, and still inside the panel's visible edge — l4zi", async ({ page }) => {
    await open(page);
    await page.click(tab);
    await expect(page.locator(dock)).toHaveAttribute("data-fa-strip", "hidden");
    await expect(page.locator(tab)).toContainText("Show tiles");
    await expect(page.locator(tiles)).toHaveAttribute("inert", "");
    await expect.poll(async () => {
      const t = await box(page, tab);
      return t.y >= 0 && t.y + t.height <= 800;
    }).toBe(true);
    const dockBox = await box(page, dock);
    expect(inside(await box(page, tab), dockBox)).toBe(true);
    // The part of the panel still on screen is the part that holds the control.
    expect(dockBox.y).toBeLessThanOrEqual((await box(page, tab)).y);
  });

  test("both directions from the keyboard alone", async ({ page }) => {
    await open(page);
    await page.locator(tab).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(dock)).toHaveAttribute("data-fa-strip", "hidden");
    await expect(page.locator(tab)).toBeFocused();
    await page.keyboard.press("Space");
    await expect(page.locator(dock)).toHaveAttribute("data-fa-strip", "shown");
    await expect(page.locator(tiles)).not.toHaveAttribute("inert", "");
  });
});

/* ── B. "dragging folio should also drag todos/other tile popouts" ──────── */
const panBy = async (page: Page, from: { x: number; y: number }, dx: number, dy: number) => {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + dx, from.y + dy, { steps: 6 });
  await page.mouse.up();
};
/** A point on EMPTY glass — the surface, not a card, not a panel. */
const emptyGlass = async (page: Page) => {
  const at = { x: 1150, y: 160 };
  const cls = await page.evaluate(([x, y]) => (document.elementFromPoint(x, y) as HTMLElement).className, [at.x, at.y]);
  expect(["fa-glass-shelf", "fa-glass-sheet"]).toContain(cls);
  return at;
};

test.describe("a pop-out rides on the folio — \"dragging folio should also drag todos/other tile popouts\"", () => {
  test("the Todos pop-out moves with the folio when the folio is dragged", async ({ page }) => {
    await open(page);
    await page.click('[data-fa-glass-chrome="glass-todos"]');
    await expect(page.locator(panel)).toHaveAttribute("data-fa-panel", "glass-todos");
    await expect(page.locator('[data-fa-library-item="todo/t-one"]')).toBeVisible();
    const before = await box(page, panel);
    await panBy(page, await emptyGlass(page), -100, 50);
    const after = await box(page, panel);
    expect(Math.round(after.x - before.x)).toBe(-100);
    expect(Math.round(after.y - before.y)).toBe(50);
    // Still a working pop-out where it now sits: a todo still comes out of it.
    await page.locator('[data-fa-library-item="todo/t-one"] .fa-pullout').click();
    await expect(page.locator(sticky)).toBeAttached();
  });

  test("so does every other tile's pop-out — Settings", async ({ page }) => {
    await open(page);
    await page.click('[data-fa-glass-chrome="glass-settings"]');
    await expect(page.locator(panel)).toHaveAttribute("data-fa-panel", "glass-settings");
    const before = await box(page, panel);
    await panBy(page, await emptyGlass(page), -60, 40);
    const after = await box(page, panel);
    expect(Math.round(after.x - before.x)).toBe(-60);
    expect(Math.round(after.y - before.y)).toBe(40);
  });

  test("a pop-out opened on an already-dragged folio opens where the folio is", async ({ page }) => {
    // Measured against a CARD, not the viewport: opening a pop-out focuses its
    // title, which may scroll the glass, and a card on the folio scrolls with
    // it. What must hold is that the pop-out and the folio agree.
    const book = '.fa-glass-asset[data-fa-asset="who-iris/book"]';
    await page.click('[data-fa-library-item="who-iris/book"] .fa-pullout');
    await open(page);
    const rel = async () => {
      const p = await box(page, panel), c = await box(page, book);
      return { x: Math.round(p.x - c.x), y: Math.round(p.y - c.y) };
    };
    await page.click('[data-fa-glass-chrome="glass-todos"]');
    const home = await rel();
    await page.click('[data-fa-glass-chrome="glass-todos"]');
    await panBy(page, await emptyGlass(page), -80, 30);
    await page.click('[data-fa-glass-chrome="glass-todos"]');
    expect(await rel()).toEqual(home);
  });

  test("Home — one press, from the keyboard — brings the pop-out back with the folio", async ({ page }) => {
    await open(page);
    await page.click('[data-fa-glass-chrome="glass-todos"]');
    const before = await box(page, panel);
    await panBy(page, await emptyGlass(page), -100, 50);
    await page.locator('[data-fa-zoom-control="home"]').focus();
    await page.keyboard.press("Enter");
    const back = await box(page, panel);
    expect(Math.round(back.x)).toBe(Math.round(before.x));
    expect(Math.round(back.y)).toBe(Math.round(before.y));
  });

  test("on a phone the column stands — no transform on the pop-out either", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    await page.click('[data-fa-glass-chrome="glass-todos"]');
    const t = await page.locator(panel).evaluate((n) => getComputedStyle(n).transform);
    expect(t).toBe("none");
  });
});

/* ── C. "themed square sticky avatar faded with markdown overlayed" ─────── */
const popOutSticky = async (page: Page) => {
  await open(page);
  await page.click('[data-fa-glass-chrome="glass-todos"]');
  await page.locator('[data-fa-library-item="todo/t-one"] .fa-pullout').click();
  await page.click('[data-fa-glass-chrome="glass-todos"]');
  await expect(page.locator(sticky)).toBeVisible();
};

test.describe("a popped-out sticky is the sticky — \"themed square sticky avatar faded with markdown overlayed\"", () => {
  test("it is SQUARE", async ({ page }) => {
    await popOutSticky(page);
    const b = await box(page, sticky);
    expect(Math.abs(b.width - b.height)).toBeLessThanOrEqual(1);
  });

  test("it wears its THEME and its backdrop art, through the one themed-sticky rendering", async ({ page }) => {
    await popOutSticky(page);
    const card = page.locator(sticky);
    // The SAME attribute and class the board and the landing stickies use, so
    // `themes.css` and the backdrop rules apply unchanged — not a second look.
    await expect(card).toHaveAttribute("data-fa-sticky-theme", "library");
    await expect(card).toHaveClass(/\bfa-sticky--backdrop\b/);
    const art = card.locator("picture > img.fa-sticky-art");
    await expect(art).toHaveAttribute("src", ART_PATH);
    await expect.poll(() => art.evaluate((i) => (i as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    // The generic yellow note is gone: the theme's art IS the avatar now.
    await expect(card.locator(".fa-sticky-note-avatar")).toHaveCount(0);
  });

  test("the art is FADED — the theme's scrim lies between it and the words", async ({ page }) => {
    await popOutSticky(page);
    const alpha = await page.locator(sticky).evaluate((n) => {
      const bg = getComputedStyle(n, "::before").backgroundColor;
      const m = bg.match(/rgba?\(([^)]+)\)/);
      if (!m) return 0;
      const parts = m[1].split(",").map((s) => parseFloat(s));
      return parts.length === 4 ? parts[3] : 1;
    });
    expect(alpha).toBeGreaterThanOrEqual(0.5);
  });

  test("its MARKDOWN is rendered on top, and readable", async ({ page }) => {
    await popOutSticky(page);
    const body = page.locator(`${sticky} .fa-sticky-body`);
    await expect(body).toBeVisible();
    await expect(body.locator("strong")).toHaveText("\"Not built yet\"");
    await expect(body.locator("em")).toHaveText("true");
    await expect(body.locator("li")).toHaveCount(2);
    await expect(body.locator(".fa-md-heading")).toHaveText("What it still gets right");
    // No markdown syntax left showing.
    expect(await body.innerText()).not.toMatch(/\*\*|^##|^- /m);
    // ON TOP: what is under the first words is the words, not the art.
    const s = (await body.locator("strong").boundingBox())!;
    const hit = await page.evaluate(([x, y]) => {
      const e = document.elementFromPoint(x, y) as HTMLElement;
      return e.closest(".fa-sticky-body") ? "body" : e.tagName + "." + e.className;
    }, [s.x + s.width / 2, s.y + s.height / 2]);
    expect(hit).toBe("body");
    // Readable: the theme's ink, at AA against the theme's scrim.
    const ratio = await page.locator(sticky).evaluate((n) => {
      const lum = (c: string) => {
        const v = c.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((x) => x / 255)
          .map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)));
        return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
      };
      const fg = getComputedStyle(n.querySelector(".fa-sticky-body")!).color;
      const bg = getComputedStyle(n, "::before").backgroundColor;
      const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
      return (a + 0.05) / (b + 0.05);
    });
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test("its title and its controls stay, and still answer the keyboard", async ({ page }) => {
    await popOutSticky(page);
    await expect(page.locator(`${sticky} a.fa-glass-asset-name`)).toHaveText(SUMMARY);
    const larger = page.locator(`${sticky} .fa-glass-asset-tool`, { hasText: "+" });
    await larger.focus();
    await page.keyboard.press("Enter");
    const b = await box(page, sticky);
    // Still square after a resize: the ratio is kept.
    expect(Math.abs(b.width - b.height)).toBeLessThanOrEqual(1);
    await page.locator(`${sticky} [data-fa-control="move"]`).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(sticky)).toHaveAttribute("data-fa-moving", "true");
  });

  test("a todo with no theme keeps the plain note — absent is a real state", async ({ page }) => {
    await open(page);
    await page.click('[data-fa-glass-chrome="glass-todos"]');
    await page.locator('[data-fa-library-item="todo/t-two"] .fa-pullout').click();
    await page.click('[data-fa-glass-chrome="glass-todos"]');
    const plain = page.locator('.fa-glass-asset[data-fa-asset="todo/t-two"]');
    await expect(plain).toBeVisible();
    await expect(plain).not.toHaveAttribute("data-fa-sticky-theme", /./);
  });
});
