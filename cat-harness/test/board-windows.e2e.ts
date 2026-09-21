/**
 * Semantic zoom and windows, in the real `docs-ui.js`.
 *
 * Bean `folio-assistant-51wf`. Owner, 2026-09-20: *"start everyrting in
 * avatar"*, `[x]` closes to the avatar, and on which mechanism wins —
 *
 * > open is like window, avatar/tiles project open panels onto window. sum
 * > functionality, need to handle z-order.. selecting any part raises
 *
 * ## Why this file mirrors `schemas/window-stack.test.ts` case for case
 *
 * The stack's rules are specified and unit-tested in `schemas/window-stack.ts`;
 * `docs-ui.js` is a browser script and cannot import it, so there are two
 * implementations of one rule and they can drift. That cost is named rather
 * than hoped away: every rule the unit test pins has a case here against the
 * real file, so a drift fails one of the two.
 *
 * ## The trap this file is built to avoid
 *
 * The bean's own words: *"zoom falsified in BOTH directions — a test that only
 * checks the shrunk case passes for a board that is always avatars."* So every
 * zoom assertion has a partner on the other side of the threshold.
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

const ITEMS = ["alpha", "beta", "gamma"].map((id, i) => ({
  id,
  summary: `Card ${id}`,
  comment: `Body of ${id}.`,
  status: "open",
  priority: "high",
  origin: "agent",
  createdAt: `2026-09-1${i}`,
  tags: { roles: [], processes: [], tasks: [], identities: [], references: [], artefacts: [] },
  relations: [],
}));

/** A declared threshold with one kind override, so provenance is exercised. */
const ZOOM = {
  $schema: "folio-semantic-zoom/v1",
  belowPx: 200,
  byKind: { todo: { belowPx: 320, because: "a todo carries a summary sentence" } },
};

const URL_BOARD = "http://board.test/page.html";

/** `.fa-landing-board` is what makes the board render INLINE rather than hidden. */
function page(withZoom: boolean, widthPx: number): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="fa-todo-src" content="/assets/todos/index.json">
${withZoom ? '<meta name="fa-zoom-src" content="/assets/semantic-zoom.json">' : ""}
<style>${CSS}
/* The grid's track width is what the threshold is measured against, so the
   test sets it explicitly rather than inferring it from the viewport. */
.fa-sticky-grid { display: grid; grid-template-columns: ${widthPx}px; }
.fa-sticky-board { width: ${widthPx + 40}px; }
</style></head><body>
<div class="main-content-wrap"><div class="main-content" id="main-content">
  <div class="fa-landing-board"></div>
</div></div>
<script>${JS}</script></body></html>`;
}

async function boot(page_: import("@playwright/test").Page): Promise<void> {
  await page_.waitForFunction(() =>
    Boolean((window as never as { __faTodoBoard?: unknown }).__faTodoBoard),
  );
}

function routes(withZoom: boolean, widthPx: number) {
  return async (page_: import("@playwright/test").Page) => {
    await page_.route("http://board.test/**", (route) => {
      const url = route.request().url();
      if (url.endsWith("/page.html")) {
        return route.fulfill({ contentType: "text/html", body: page(withZoom, widthPx) });
      }
      if (url.endsWith("/assets/todos/index.json")) {
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ $schema: "folio-todo-index/v1", items: ITEMS }),
        });
      }
      if (url.endsWith("/assets/semantic-zoom.json")) {
        return withZoom
          ? route.fulfill({ contentType: "application/json", body: JSON.stringify(ZOOM) })
          : route.fulfill({ status: 404, body: "not found" });
      }
      return route.fulfill({ status: 404, body: "not found" });
    });
  };
}

test.describe("every card starts as its avatar", () => {
  test("an avatar per card, and no window open, at a width well above the threshold", async ({ page: p }) => {
    // "start everyrting in avatar" is about the OPEN state, and it holds at
    // any width: nothing is open until somebody opens it.
    await routes(true, 600)(p);
    await p.goto(URL_BOARD);
    await boot(p);
    await expect(p.locator(".fa-sticky-avatar")).toHaveCount(3);
    await expect(p.locator(".fa-board-window")).toHaveCount(0);
  });

  test("a kind with no avatar rule still gets a mark — GENERIC, never blank", async ({ page: p }) => {
    // `avatars.css` keys the glyph off `data-fa-kind` and emits a generic
    // question mark last, so an unknown kind is marked rather than empty.
    await routes(true, 600)(p);
    await p.goto(URL_BOARD);
    await boot(p);
    const kinds = await p
      .locator(".fa-sticky-avatar")
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.faKind));
    expect(new Set(kinds)).toEqual(new Set(["todo"]));
    const box = await p.locator(".fa-sticky-avatar").first().boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(0);
    expect(box?.height ?? 0).toBeGreaterThan(0);
  });
});

test.describe("semantic zoom, falsified in BOTH directions", () => {
  test("above the declared threshold the cards keep their words", async ({ page: p }) => {
    await routes(true, 400)(p);
    await p.goto(URL_BOARD);
    await boot(p);
    await expect(p.locator('.fa-sticky-slot[data-fa-avatar="true"]')).toHaveCount(0);
    await expect(p.locator(".fa-sticky-slot .fa-sticky").first()).toBeVisible();
  });

  test("below it they become their avatars", async ({ page: p }) => {
    // 320 is the `todo` override, not the folio's 200 — so this also proves
    // the override is the number in force.
    await routes(true, 240)(p);
    await p.goto(URL_BOARD);
    await boot(p);
    await expect(p.locator('.fa-sticky-slot[data-fa-avatar="true"]')).toHaveCount(3);
    await expect(p.locator(".fa-sticky-slot .fa-sticky").first()).toBeHidden();
  });

  test("with NO declaration every card keeps its words — the threshold is never invented", async ({ page: p }) => {
    // R2: the threshold is declared data. A board that guessed one would put
    // the literal one layer further from where anybody looks for it, so the
    // absent case is words-everywhere rather than avatars-everywhere.
    await routes(false, 100)(p);
    await p.goto(URL_BOARD);
    await boot(p);
    await expect(p.locator('.fa-sticky-slot[data-fa-avatar="true"]')).toHaveCount(0);
  });
});

test.describe("opening projects a window", () => {
  test("clicking an avatar opens one; `[x]` closes it back to the avatar", async ({ page: p }) => {
    await routes(true, 600)(p);
    await p.goto(URL_BOARD);
    await boot(p);
    await p.locator(".fa-sticky-avatar").first().click();
    await expect(p.locator(".fa-board-window")).toHaveCount(1);
    await p.locator('[data-fa-control="close"]').click();
    await expect(p.locator(".fa-board-window")).toHaveCount(0);
    // The avatar is still there, and focus came back to it — the way back is
    // reachable, which is the whole of `l4zi`.
    await expect(p.locator(".fa-sticky-avatar").first()).toBeFocused();
  });

  test("opening an already-open card raises it rather than opening a second", async ({ page: p }) => {
    await routes(true, 600)(p);
    await p.goto(URL_BOARD);
    await boot(p);
    const first = p.locator(".fa-sticky-avatar").nth(0);
    await first.click();
    await p.locator(".fa-sticky-avatar").nth(1).click();
    // Driven from the KEYBOARD, because by now a window is painted over the
    // first avatar and moving one is `le8b`'s, not this unit's. Focus does not
    // care what is on top, which is exactly why the keyboard path has to work
    // — and it is the path this instance's low-dexterity profile relies on.
    await first.focus();
    await p.keyboard.press("Enter");
    await expect(p.locator(".fa-board-window")).toHaveCount(2);
    await expect(p.locator('.fa-board-window[data-fa-window="alpha"]')).toHaveAttribute(
      "data-fa-z",
      "2",
    );
  });

  test("the avatar is keyboard-operable — a board action is never mouse-only", async ({ page: p }) => {
    await routes(true, 600)(p);
    await p.goto(URL_BOARD);
    await boot(p);
    await p.locator(".fa-sticky-avatar").first().focus();
    await p.keyboard.press("Enter");
    await expect(p.locator(".fa-board-window")).toHaveCount(1);
  });
});

test.describe("an open window survives a zoom-out past the threshold", () => {
  test("the card becomes its avatar and the window stays", async ({ page: p }) => {
    // THE central claim of the skill, and the one a flag joining the two
    // mechanisms would have broken. Checked in both directions: the slot must
    // actually flip, or this passes for a board where nothing ever changes.
    await routes(true, 600)(p);
    await p.goto(URL_BOARD);
    await boot(p);
    await p.locator(".fa-sticky-avatar").first().click();
    await expect(p.locator(".fa-board-window")).toHaveCount(1);
    await expect(p.locator('.fa-sticky-slot[data-fa-avatar="true"]')).toHaveCount(0);

    await p.evaluate(() => {
      const grid = document.querySelector(".fa-sticky-grid") as HTMLElement;
      grid.style.gridTemplateColumns = "180px";
    });

    await expect(p.locator('.fa-sticky-slot[data-fa-avatar="true"]')).toHaveCount(3);
    await expect(p.locator(".fa-board-window")).toHaveCount(1);
    await expect(p.locator(".fa-board-window")).toBeVisible();
  });
});

test.describe("selecting any part raises it", () => {
  test("a click anywhere in a window puts it on top", async ({ page: p }) => {
    await routes(true, 600)(p);
    await p.goto(URL_BOARD);
    await boot(p);
    await p.locator(".fa-sticky-avatar").nth(0).click();
    await p.locator(".fa-sticky-avatar").nth(1).click();
    await expect(p.locator('.fa-board-window[data-fa-window="beta"]')).toHaveAttribute("data-fa-z", "2");

    // The lower window's TITLE BAR, which the cascade deliberately leaves
    // visible — "selecting any part raises". If this ever needs a force click
    // the cascade has become tight enough to bury the bar, which is the defect
    // the offsets exist to prevent.
    await p.locator('.fa-board-window[data-fa-window="alpha"] .fa-board-window-title').click();
    await expect(p.locator('.fa-board-window[data-fa-window="alpha"]')).toHaveAttribute("data-fa-z", "2");
    await expect(p.locator('.fa-board-window[data-fa-window="beta"]')).toHaveAttribute("data-fa-z", "1");
  });

  test("no two open windows share a stacking index", async ({ page: p }) => {
    await routes(true, 600)(p);
    await p.goto(URL_BOARD);
    await boot(p);
    for (const i of [0, 1, 2]) {
      await p.locator(".fa-sticky-avatar").nth(i).focus();
      await p.keyboard.press("Enter");
    }
    const zs = await p
      .locator(".fa-board-window")
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.faZ));
    expect(new Set(zs).size).toBe(zs.length);
    expect(zs.length).toBe(3);
  });

  test("closing the middle one leaves the rest contiguous", async ({ page: p }) => {
    await routes(true, 600)(p);
    await p.goto(URL_BOARD);
    await boot(p);
    for (const i of [0, 1, 2]) {
      await p.locator(".fa-sticky-avatar").nth(i).focus();
      await p.keyboard.press("Enter");
    }
    // Raise it first, the way a person would: a covered window's `[x]` is
    // reached by selecting the window, not by clicking through what is on top
    // of it.
    await p.locator('.fa-board-window[data-fa-window="beta"] .fa-board-window-title').click();
    await p.locator('.fa-board-window[data-fa-window="beta"] [data-fa-control="close"]').click();
    await expect(p.locator(".fa-board-window")).toHaveCount(2);
    const zs = await p
      .locator(".fa-board-window")
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.faZ).sort());
    expect(zs).toEqual(["1", "2"]);
  });
});
