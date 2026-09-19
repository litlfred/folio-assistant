/**
 * The todo board opens, pins, docks, and can be driven from a keyboard.
 *
 * Against the real `docs-ui.js` and the real published index shape, not a
 * hand-made fixture that can agree with the code while the code disagrees with
 * what the generator writes — the lesson `qa-panel.e2e.ts` paid for twice.
 *
 * The VERDICT-vs-SHAPE rule from bean `iumj` applies here too, in the other
 * direction: a todo's content is a person's outstanding work and changes
 * whenever they resolve one, so this spec supplies its own items rather than
 * reading `docs/assets/todos/index.json`. What it takes from the real pipeline
 * is the SHAPE — the fields `gen-docs-pages.ts` emits — and there is a unit
 * test pinning that the two agree.
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSS = readFileSync(join(ROOT, "docs/assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, "docs/assets/js/docs-ui.js"), "utf8");

const ITEMS = [
  {
    id: "first-todo",
    summary: "Decide the thing",
    comment: "Context paragraph one.\n\nContext paragraph two.",
    status: "open",
    priority: "high",
    origin: "agent",
    createdAt: "2026-09-19",
    tags: { roles: [], processes: [], tasks: [], identities: [], references: [], artefacts: [] },
    editHref: "https://github.com/litlfred/folio-assistant/edit/main/todos/items/first-todo.md",
  },
  {
    id: "second-todo",
    summary: "Decide the other thing",
    comment: "",
    status: "blocked",
    priority: "low",
    origin: "human",
    createdAt: "2026-09-19",
    tags: { roles: [], processes: [], tasks: [], identities: [], references: [], artefacts: [] },
    editHref: "https://github.com/litlfred/folio-assistant/edit/main/todos/items/second-todo.md",
  },
];

const PAGE_URL = "http://todo.test/page.html";

const HARNESS = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="fa-todo-src" content="/assets/todos/index.json">
<style>${CSS}</style></head><body>
<div class="side-bar"><div class="site-header"><a class="site-title">Site</a></div><nav class="site-nav"></nav></div>
<div class="main-content-wrap"><div class="main-content" id="main-content">
  <h1>Harness</h1>
  <p>Body text.</p>
</div></div>
<script>${JS}</script></body></html>`;

test.beforeEach(async ({ page }) => {
  await page.route("http://todo.test/**", (route) => {
    const url = route.request().url();
    if (url.endsWith("/page.html")) {
      return route.fulfill({ contentType: "text/html", body: HARNESS });
    }
    if (url.endsWith("/assets/todos/index.json")) {
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ $schema: "folio-todo-index/v1", items: ITEMS }),
      });
    }
    return route.fulfill({ status: 404, body: "not found" });
  });
});

test("the launcher grows a Todos tile carrying the count", async ({ page }) => {
  await page.goto(PAGE_URL);
  const tile = page.locator(".fa-tile", { hasText: "Todos" });
  // The tile is BUILT on load and only shown once the launcher is opened —
  // asserting visibility without opening it tests the launcher, not the tile.
  await expect(tile).toHaveCount(1);
  await page.locator(".fa-qr-toggle").click();
  await expect(tile).toBeVisible();
  await expect(tile.locator(".fa-tile-count")).toHaveText("2");
  // The count is in the ACCESSIBLE NAME too. A badge that only renders
  // visually tells a screen-reader user there are todos and not how many.
  await expect(tile).toHaveAttribute("aria-label", "Todos — 2 outstanding");
});

test("the board lands in the main display, not the sidebar", async ({ page }) => {
  await page.goto(PAGE_URL);
  const board = page.locator(".fa-sticky-board");
  // Present but hidden until asked for — the reader did not open it.
  await expect(board).toBeHidden();
  const parentClass = await board.evaluate((n) => n.parentElement?.className);
  expect(parentClass).toContain("main-content");
});

test("opening shows every sticky, summary first and body folded", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-qr-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();

  const board = page.locator(".fa-sticky-board");
  await expect(board).toBeVisible();
  await expect(board.locator(".fa-sticky")).toHaveCount(2);
  await expect(board.locator(".fa-sticky-summary").first()).toHaveText("Decide the thing");
  await expect(board.locator(".fa-sticky-body").first()).toBeHidden();
});

test("a sticky expands to its body, and the paragraphs survive", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-qr-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();

  const first = page.locator(".fa-sticky").first();
  const toggle = first.locator(".fa-sticky-toggle");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(first.locator(".fa-sticky-body p")).toHaveCount(2);
});

test("a todo with no body says so rather than opening blank", async ({ page }) => {
  // Third state. An empty card is indistinguishable from one that failed to
  // render, and the reader cannot tell which.
  await page.goto(PAGE_URL);
  await page.locator(".fa-qr-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  const second = page.locator(".fa-sticky").nth(1);
  await second.locator(".fa-sticky-toggle").click();
  await expect(second.locator(".fa-sticky-empty")).toHaveText("No detail recorded.");
});

test("the pencil is `.fa-node-edit` pointing at the todo's own file", async ({ page }) => {
  // The owner's rule: the edit affordance is the class-level pattern every
  // content object on this site already has, not a bespoke editor.
  await page.goto(PAGE_URL);
  await page.locator(".fa-qr-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  const edit = page.locator(".fa-sticky").first().locator("a.fa-node-edit");
  await expect(edit).toHaveAttribute(
    "href",
    "https://github.com/litlfred/folio-assistant/edit/main/todos/items/first-todo.md",
  );
});

test("pin lifts a sticky onto the page and greys its board slot", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-qr-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();

  await page.locator(".fa-sticky").first().locator(".fa-sticky-pin").click();
  await expect(page.locator(".fa-sticky-layer .fa-sticky")).toHaveCount(1);

  const slot = page.locator(".fa-sticky-slot").first();
  await expect(slot).toHaveClass(/fa-sticky-slot-floating/);
  // The greyed entry is a REAL button, not a disabled one: `disabled` removes
  // it from the tab order, and it is the control that brings the sticky back.
  const recall = slot.locator(".fa-sticky-recall");
  await expect(recall).toBeVisible();
  await expect(recall).not.toBeDisabled();
});

test("closing a pinned sticky returns it to the board", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-qr-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  await page.locator(".fa-sticky").first().locator(".fa-sticky-pin").click();

  await page.locator(".fa-sticky-layer .fa-sticky-close").click();
  await expect(page.locator(".fa-sticky-layer .fa-sticky")).toHaveCount(0);
  await expect(page.locator(".fa-sticky-slot").first()).not.toHaveClass(/fa-sticky-slot-floating/);
});

test("clicking the greyed slot also returns it", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-qr-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  await page.locator(".fa-sticky").first().locator(".fa-sticky-pin").click();

  await page.locator(".fa-sticky-slot").first().locator(".fa-sticky-recall").click();
  await expect(page.locator(".fa-sticky-layer .fa-sticky")).toHaveCount(0);
});

test("pin and recall are reachable and operable from the keyboard alone", async ({ page }) => {
  // The reason "pick up and move" is a BUTTON rather than a drag. This
  // instance's declared interaction profile is low-dexterity, and a pointer
  // drag cannot be operated without reimplementing the whole gesture.
  await page.goto(PAGE_URL);
  await page.locator(".fa-qr-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();

  const pin = page.locator(".fa-sticky").first().locator(".fa-sticky-pin");
  await pin.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".fa-sticky-layer .fa-sticky")).toHaveCount(1);

  const recall = page.locator(".fa-sticky-slot").first().locator(".fa-sticky-recall");
  await recall.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".fa-sticky-layer .fa-sticky")).toHaveCount(0);
});

test("Escape closes the board", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-qr-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  await expect(page.locator(".fa-sticky-board")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".fa-sticky-board")).toBeHidden();
});

test("content reaches the DOM as TEXT, never as markup", async ({ page }) => {
  // A todo is authored — by a person, or by an agent on their behalf — and
  // travels through JSON to this page. The string that closes a tag is exactly
  // the string somebody eventually writes.
  await page.route("http://todo.test/assets/todos/index.json", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        items: [{ ...ITEMS[0], summary: "<img src=x onerror=alert(1)>", comment: "<script>x</script>" }],
      }),
    }),
  );
  await page.goto(PAGE_URL);
  await page.locator(".fa-qr-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  const first = page.locator(".fa-sticky").first();
  await expect(first.locator(".fa-sticky-summary")).toHaveText("<img src=x onerror=alert(1)>");
  expect(await first.locator("img").count()).toBe(0);
  await first.locator(".fa-sticky-toggle").click();
  expect(await first.locator(".fa-sticky-body script").count()).toBe(0);
});

test("a missing index mounts nothing rather than an empty board", async ({ page }) => {
  // Third state again: "could not read it" is not "there is nothing".
  await page.route("http://todo.test/assets/todos/index.json", (route) =>
    route.fulfill({ status: 404, body: "gone" }),
  );
  await page.goto(PAGE_URL);
  await page.locator(".fa-qr-toggle").click();
  await expect(page.locator(".fa-tile", { hasText: "Todos" })).toHaveCount(0);
  await expect(page.locator(".fa-sticky-board")).toHaveCount(0);
});
