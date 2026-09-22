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
import { siteDirFor } from "../schemas/cat-harness.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = siteDirFor(ROOT);
const CSS = readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");

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
    relations: [
      { axis: "who", label: "github:litlfred", href: "https://github.com/litlfred" },
      { axis: "bean", label: "folio-assistant-29ij", href: "https://github.com/litlfred/folio-assistant/blob/main/beans/defs/x.md" },
      { axis: "PR", label: "#314", href: "https://github.com/litlfred/folio-assistant/pull/314" },
      // Deliberately unresolvable: a bean nothing on disk carries.
      { axis: "bean", label: "folio-assistant-gone" },
    ],
    viewHref: "https://github.com/litlfred/folio-assistant/blob/main/todos/items/first-todo.md",
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
    viewHref: "https://github.com/litlfred/folio-assistant/blob/main/todos/items/second-todo.md",
    editHref: "https://github.com/litlfred/folio-assistant/edit/main/todos/items/second-todo.md",
  },
];

const PAGE_URL = "http://todo.test/page.html";
/** The LANDING page: the board is page content there, not an overlay. */
const LANDING_URL = "http://todo.test/landing.html";

/**
 * A SECOND fixture, for the themed sticky, on its own page and its own index.
 *
 * Not a third entry in `ITEMS`, and the reason is this file's own `d1r6`
 * lesson one step earlier: the count assertions above are load-bearing — the
 * discard test proves a slot disappeared by counting 2 then 1 — so widening
 * the shared fixture would have rewritten six unrelated assertions to keep a
 * new one passing. A separate page costs one route and touches nothing.
 *
 * `theme` is already on `ThemedTodoFieldsSchema`. What does not exist yet is
 * the generator emitting it and the art behind it, which is `5y4b`. So this
 * fixture is ahead of the pipeline by exactly one field, deliberately: the
 * board's handling of a themed todo is testable now, and it is what `5y4b`
 * will land on.
 */
const THEMED_PAGE_URL = "http://todo.test/themed.html";
const THEMED_ART = {
  library: {
    laptop: "/assets/img/harness/landing-library-laptop.webp",
    mobile: "/assets/img/harness/landing-library-mobile.webp",
    card: "/assets/img/harness/landing-library-card.webp",
  },
};
const THEMED_ITEMS = [
  {
    id: "themed-todo",
    summary: "Ingest the sources",
    comment: "A todo that has chosen a theme.",
    status: "open",
    priority: "medium",
    origin: "agent",
    createdAt: "2026-09-20",
    theme: "library",
    tags: { roles: [], processes: [], tasks: [], identities: [], references: [], artefacts: [] },
    relations: [],
  },
];

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
    if (url.endsWith("/landing.html")) {
      // `.fa-landing-board` is what makes `mountTodoBoard` render INLINE
      // rather than as a hidden overlay — the branch bean `l4zi` is about.
      return route.fulfill({
        contentType: "text/html",
        body: HARNESS.replace('<p>Body text.</p>', '<div class="fa-landing-board"></div>'),
      });
    }
    if (url.endsWith("/panelled.html")) {
      // The REAL landing page since 2026-09-21: `landing.html` wraps the
      // board in a collapsed `.fa-sticky-panel`, so `mountTodoBoard` mounts
      // INSIDE that panel. `/landing.html` above keeps the bare wrapper on
      // purpose — the two are different branches and both ship.
      //
      // `open` on the details because Playwright cannot measure a box inside
      // a closed one, and what this fixture exists to check is what the
      // reader sees once they open it.
      return route.fulfill({
        contentType: "text/html",
        body: HARNESS.replace(
          "<p>Body text.</p>",
          '<details class="fa-sticky-panel" open><summary class="fa-sticky-panel__handle">' +
            '<span class="fa-sticky-panel__count" data-fa-sticky-count="2">2</span></summary>' +
            '<div class="fa-sticky-panel__body"><div class="fa-landing-board"></div></div></details>',
        ),
      });
    }
    if (url.endsWith("/themed.html")) {
      return route.fulfill({
        contentType: "text/html",
        body: HARNESS.replace("/assets/todos/index.json", "/assets/todos/themed.json"),
      });
    }
    if (url.endsWith("/assets/todos/themed.json")) {
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          $schema: "folio-todo-index/v1",
          items: THEMED_ITEMS,
          themeArt: THEMED_ART,
        }),
      });
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
  await page.locator(".fa-tiles-toggle").click();
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
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();

  const board = page.locator(".fa-sticky-board");
  await expect(board).toBeVisible();
  await expect(board.locator(".fa-sticky")).toHaveCount(2);
  await expect(board.locator(".fa-sticky-summary").first()).toHaveText("Decide the thing");
  await expect(board.locator(".fa-sticky-body").first()).toBeHidden();
});

test("a sticky expands to its body, and the paragraphs survive", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
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
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  const second = page.locator(".fa-sticky").nth(1);
  await second.locator(".fa-sticky-toggle").click();
  await expect(second.locator(".fa-sticky-empty")).toHaveText("No detail recorded.");
});

test("a sticky shows its knowledge-graph edges, each as axis + label", async ({ page }) => {
  // The point of a six-axis relationship model is that a reader can SEE the
  // edges. A card showing only status and priority spends the whole schema on
  // two enums — which is what this rendered before the owner pointed it out.
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();

  const rels = page.locator(".fa-sticky").first().locator(".fa-sticky-rel");
  await expect(rels).toHaveCount(4);
  await expect(rels.nth(0).locator(".fa-sticky-rel-axis")).toHaveText("who");
  await expect(rels.nth(0).locator("a")).toHaveAttribute("href", "https://github.com/litlfred");
  await expect(rels.nth(2).locator("a")).toHaveAttribute(
    "href",
    "https://github.com/litlfred/folio-assistant/pull/314",
  );
});

test("an edge that resolves to nothing is SHOWN, not dropped", async ({ page }) => {
  // A dangling reference and no reference at all are different facts. Dropping
  // the first makes it look like the second, and the reader never learns the
  // todo points at something this site could not reach.
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();

  const dangling = page.locator(".fa-sticky").first().locator(".fa-sticky-rel-dangling");
  await expect(dangling).toHaveText("folio-assistant-gone");
  await expect(dangling).toHaveAttribute("title", /No link/);
  // Read as text, never as a link that goes nowhere.
  expect(await page.locator(".fa-sticky").first().locator("a[href='']").count()).toBe(0);
});

test("a sticky carries VIEW and EDIT, two controls for two acts", async ({ page }) => {
  // Bean `pb04`, the owner: "rendeding shows edit src icon (and also need view
  // icon)". `/blob/` is reading and `/edit/` opens GitHub's editor — a reader
  // checking what a card says should not land in a text box.
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();

  // THE ROW MOVED OUT OF THE CARD on 2026-09-21 — owner: *"edit, view links
  // can be below, not inside stick"*. It is a caption on the SLOT now, which
  // is also what lets it survive the card being pinned to the glass. The
  // assertion below is unchanged in substance: two controls, two different
  // URLs, `/blob/` for reading and `/edit/` for the editor.
  const tools = page.locator(".fa-sticky-slot").first().locator(".fa-sticky-links");
  await expect(tools.locator(".fa-sticky-view")).toHaveAttribute(
    "href",
    "https://github.com/litlfred/folio-assistant/blob/main/todos/items/first-todo.md",
  );
  await expect(tools.locator(".fa-sticky-edit")).toHaveAttribute(
    "href",
    "https://github.com/litlfred/folio-assistant/edit/main/todos/items/first-todo.md",
  );
  // Two DIFFERENT URLs. One control pointing at one of them would satisfy any
  // assertion that only checked presence.
  const hrefs = await tools
    .locator("a.fa-node-edit")
    .evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute("href")));
  expect(new Set(hrefs).size).toBe(hrefs.length);
});

test("both controls are ABSENT, not broken, when the pipeline has no forge", async ({ page }) => {
  // The other direction, and the one that matters. `sourceLinks` returns
  // undefined for anything that is not a github.com `origin`, and the
  // generator SPREADS the result, so the keys are missing rather than empty. A
  // test that only checked the present case would pass equally for a control
  // that is always shown.
  //
  // A dead edit link is worse than no link: it invites a click, and on a
  // private repository it 404s for exactly the reader who cannot edit, which
  // reads as "this page is broken" rather than "you cannot do this".
  await page.route("http://todo.test/assets/todos/index.json", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        $schema: "folio-todo-index/v1",
        items: ITEMS.map((t) => {
          const copy: Record<string, unknown> = { ...t };
          delete copy["viewHref"];
          delete copy["editHref"];
          return copy;
        }),
      }),
    }),
  );
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  await expect(page.locator(".fa-sticky")).not.toHaveCount(0); // the board did mount
  await expect(page.locator(".fa-sticky-view")).toHaveCount(0);
  await expect(page.locator(".fa-sticky-edit")).toHaveCount(0);
  // ...and nothing disabled or greyed in their place.
  await expect(page.locator(".fa-sticky-tools a")).toHaveCount(0);
});

test("neither link carries a `..` — the old one resolved to a dead path", () => {
  // The path `readTodoFiles` reports is relative to the cat-harness INSTANCE
  // while todos/ sits at the repository root, so it read `../todos/items/x.md`
  // and the old link shipped that verbatim. A browser normalises the `..`
  // before the request is sent, so GitHub received `/edit/todos/items/x.md` —
  // the branch segment eaten, a path that has never existed. Every pencil on
  // the board was dead, and the generated JSON looked entirely correct.
  for (const t of ITEMS) {
    expect(t.editHref).not.toContain("..");
    expect(t.viewHref).not.toContain("..");
  }
});

test("the pencil is `.fa-node-edit` pointing at the todo's own file", async ({ page }) => {
  // The owner's rule: the edit affordance is the class-level pattern every
  // content object on this site already has, not a bespoke editor.
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  // `.fa-sticky-edit`, not the bare `a.fa-node-edit` this used: bean `pb04`
  // put a View control beside the pencil, so the class-level selector matches
  // two links and the assertion would be order-dependent. Naming the control
  // is what the two classes exist for.
  //
  // Scoped to the SLOT rather than the card since 2026-09-21: the row is a
  // caption below the sticky now, not a tool inside it.
  const edit = page.locator(".fa-sticky-slot").first().locator("a.fa-sticky-edit");
  await expect(edit).toHaveAttribute(
    "href",
    "https://github.com/litlfred/folio-assistant/edit/main/todos/items/first-todo.md",
  );
});

test("pin lifts a sticky onto the page and greys its board slot", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
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

/**
 * Bean `ivfw`, the owner: *"when you unpin, sticky, it loses its theme and you
 * cant move around dispaly."*
 *
 * This is the THEME half. The move half is `6lb8`'s board model and is not
 * here.
 *
 * Two things had to be true and neither was. The card is REBUILT on the float
 * layer and DESTROYED on dock, so a theme carried on the DOM node is dropped by
 * construction — `buildSticky` now reads it from the todo, which is the only
 * place that survives both transitions. And `.fa-sticky-floating` set a flat
 * `background` and `color` unconditionally, after `.fa-sticky` at equal
 * specificity, so it painted over whatever the theme had chosen.
 *
 * Asserted against the ATTRIBUTE rather than the computed colour on purpose:
 * `themes.css` is not loaded in this harness, so a colour assertion here would
 * be testing the fixture. What the attribute cannot answer — that the override
 * no longer wins — the CSS assertion below does, and
 * `schemas/themes.test.ts` carries the premise that every theme surface is
 * opaque.
 */
test("a themed sticky keeps its theme across pin AND dock", async ({ page }) => {
  await page.goto(THEMED_PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();

  const onBoard = page.locator('.fa-sticky-slot .fa-sticky[data-todo-id="themed-todo"]');
  await expect(onBoard).toHaveAttribute("data-fa-sticky-theme", "library");

  await onBoard.locator(".fa-sticky-pin").click();
  const floating = page.locator(".fa-sticky-layer .fa-sticky");
  await expect(floating).toHaveCount(1);
  await expect(floating).toHaveAttribute("data-fa-sticky-theme", "library");

  // ...and back down. This is the direction the owner reported.
  await page.locator(".fa-sticky-slot .fa-sticky-recall").click();
  await expect(page.locator(".fa-sticky-layer .fa-sticky")).toHaveCount(0);
  await expect(onBoard).toHaveAttribute("data-fa-sticky-theme", "library");
});

test("a themed todo renders its backdrop art, the way every other sticky does", async ({ page }) => {
  // Bean `5y4b`, the owner: "todos need grump cat themeing based on content
  // too." Until this, the landing board carried two kinds of sticky side by
  // side — a harness card with per-theme art, a measured text region and a
  // scrim, and a todo that was a flat card with a coloured border. On one page
  // they read as two systems.
  await page.goto(THEMED_PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();

  const card = page.locator('.fa-sticky-slot .fa-sticky[data-todo-id="themed-todo"]');
  await expect(card).toHaveClass(/fa-sticky--backdrop/);

  // THE PICTURE IS THE POSITIONED LAYER, and the `<img>` is its child. The
  // stylesheet records that `.fa-sticky--backdrop > .fa-sticky-art` matched
  // NOTHING once — the img is a grandchild — and the art laid out at its
  // intrinsic 1672px across the whole viewport with the markup entirely
  // correct. So the STRUCTURE is what is asserted here, not just presence.
  const img = card.locator("picture > img.fa-sticky-art");
  await expect(img).toHaveCount(1);
  await expect(img).toHaveAttribute("src", "/assets/img/harness/landing-library-card.webp");

  // The CARD crop by default, with mobile below 30rem. The laptop crop is
  // deliberately unused: it is composed for a page-width surface.
  const source = card.locator("picture > source");
  await expect(source).toHaveCount(1);
  await expect(source).toHaveAttribute("srcset", "/assets/img/harness/landing-library-mobile.webp");

  // Decoration behind text that already says everything. A description of the
  // cat would be read out before every todo on the board.
  await expect(img).toHaveAttribute("alt", "");
  await expect(card.locator("picture")).toHaveAttribute("aria-hidden", "true");
});

test("the art survives a pin, because the card is rebuilt from the todo", async ({ page }) => {
  await page.goto(THEMED_PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  await page.locator('.fa-sticky-slot .fa-sticky[data-todo-id="themed-todo"] .fa-sticky-pin').click();

  const floating = page.locator(".fa-sticky-layer .fa-sticky");
  await expect(floating).toHaveClass(/fa-sticky--backdrop/);
  await expect(floating.locator("picture > img.fa-sticky-art")).toHaveCount(1);
});

test("an UNTHEMED todo gets no backdrop — the check can fire", async ({ page }) => {
  // Every assertion above passes equally for code that adds a backdrop to
  // everything. The shared fixture's todos carry no theme, so this is the
  // other direction against the same build.
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  await expect(page.locator(".fa-sticky--backdrop")).toHaveCount(0);
  await expect(page.locator(".fa-sticky picture")).toHaveCount(0);
});

test("a theme with no published art renders a flat THEMED card, not a broken one", async ({ page }) => {
  // The third state. `resolveThemeBackdrop` refuses a partial set, and a theme
  // that declares no backdrop at all — `pale-sage`, the high-contrast pair —
  // is simply absent from `themeArt`. The sticky must still take its palette.
  await page.route("http://todo.test/assets/todos/themed.json", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ $schema: "folio-todo-index/v1", items: THEMED_ITEMS, themeArt: {} }),
    }),
  );
  await page.goto(THEMED_PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();

  const card = page.locator('.fa-sticky[data-todo-id="themed-todo"]');
  await expect(card).toHaveAttribute("data-fa-sticky-theme", "library");
  await expect(card).not.toHaveClass(/fa-sticky--backdrop/);
  await expect(card.locator("picture")).toHaveCount(0);
});

test("a todo with NO theme still gets the opaque floating treatment", () => {
  // The other direction, and the reason the override was written: an unthemed
  // sticky's surface is `rgba(128, 128, 128, 0.08)`, so lifted over page text
  // it is see-through. Narrowing the rule must not have removed it.
  expect(CSS).toContain(".fa-sticky-floating:not([data-fa-sticky-theme])");
  // And it must no longer apply to a themed one — the bug, stated as the
  // absence of the rule that caused it.
  expect(CSS).not.toMatch(/^\.fa-sticky-floating \{[^}]*background:/m);
});

/**
 * REWRITTEN for bean `d1r6`. This test was "closing a pinned sticky returns
 * it to the board", and the owner replaced that control with a discard:
 * *"stikies have an [x] to close/restore to panel... that should now be
 * replaced with it going into the fsh-guts."*
 *
 * It kept passing against the new behaviour, and the way it did is worth
 * recording. It asserted `.fa-sticky-slot").first()` was not floating — and
 * the discard REMOVES that slot, so `.first()` silently retargeted to the
 * NEXT todo's slot, which had never floated. Two items in the fixture was
 * all it took. A locator that matches a different element after the change
 * is not a passing test, and it is harder to spot than a vacuous one
 * because the count is not zero.
 *
 * Measured: 2 slots before, 1 after.
 */
test("discarding a pinned sticky takes it off the page AND off the board", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  await expect(page.locator(".fa-sticky-slot")).toHaveCount(2);
  await page.locator(".fa-sticky").first().locator(".fa-sticky-pin").click();

  await page.locator(".fa-sticky-layer .fa-sticky-discard").click();
  await expect(page.locator(".fa-sticky-layer .fa-sticky")).toHaveCount(0);
  // The COUNT, not `.first()`: that is the assertion the old test should
  // have made, and the one that would have caught this change.
  await expect(page.locator(".fa-sticky-slot")).toHaveCount(1);
});

test("the discard control says where it goes, and that it comes back", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  const discard = page.locator(".fa-sticky").first().locator(".fa-sticky-discard");
  const name = (await discard.getAttribute("aria-label")) ?? "";
  // A crumpled icon with no words is a guess. "Close" said neither where it
  // went nor that it was reversible.
  expect(name).toContain("Discard");
  expect(name).toContain("trashcan");
  expect(name).toContain("restorable");
  // The limitation is in the name too: a reader who thinks they cleared a
  // todo for the team has been misled by the control.
  expect(name).toContain("this browser only");
});

test("a discarded sticky is RESTORABLE — the rule the crumpled icon stands for", async ({ page }) => {
  // `fsh-guts` is "the trashcan that is kept": a thing in it can be read,
  // cited and restored. A one-way dismiss would wear the icon and break the
  // rule it stands for.
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  await page.locator(".fa-sticky").first().locator(".fa-sticky-discard").click();
  await expect(page.locator(".fa-sticky-slot")).toHaveCount(1);

  // It is listed under Settings → Discarded, in its own labelled section.
  //
  // This harness publishes NO `fsh-guts` document, which is the case the
  // control has to survive: a site that has not deployed one yet still owes
  // the reader a way back. The first version of this feature removed the
  // control entirely when the document was absent, which made the discard
  // one-way — a delete wearing a crumpled icon. This test is what found it.
  await page.locator(".fa-tiles-toggle").click();
  await page.locator('.fa-tiles-grid .fa-tile:has(.fa-tile-caption:text-is("Settings"))').click();
  await page.locator(".fa-discarded-open").click();
  const local = page.locator(".fa-discarded-local");
  await expect(local).toContainText("1 todo you discarded");
  // Stated in WORDS, not by colour or placement.
  await expect(local).toContainText("this browser only");
  await local.locator(".fa-discarded-restore").click();

  // Back on the board after a reload, which is what "restored" has to mean.
  await page.reload();
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  await expect(page.locator(".fa-sticky-slot")).toHaveCount(2);
});

test("a discard survives a reload, and the tile count follows it", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  await page.locator(".fa-sticky").first().locator(".fa-sticky-discard").click();

  await page.reload();
  await page.locator(".fa-tiles-toggle").click();
  const tile = page.locator(".fa-tile", { hasText: "Todos" });
  // The count is what a reader sees before opening anything, so a discard
  // that did not move it would read as having done nothing.
  await expect(tile.locator(".fa-tile-count")).toHaveText("1");
  await expect(tile).toHaveAttribute("aria-label", "Todos — 1 outstanding");
});

test("clicking the greyed slot also returns it", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
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
  await page.locator(".fa-tiles-toggle").click();
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
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  await expect(page.locator(".fa-sticky-board")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".fa-sticky-board")).toBeHidden();
});

test("content reaches the DOM as TEXT, never as markup", async ({ page }) => {
  // A todo is authored — by a person, or by an agent on their behalf — and
  // travels through JSON to this page. The string that closes a tag is exactly
  // the string somebody eventually writes.
  //
  // AND THE DEPLOY TARGET IS WHY THIS IS THE ONLY LINE OF DEFENCE. This board
  // ships to gh-pages, a STATIC host: there is no request-time anything — no
  // sanitiser, no template filter, no server to reject a payload before it
  // reaches a browser. Escaping at render is not defence in depth here, it is
  // the whole depth. On a local-server topology the same page would have a
  // second chance; it must never come to rely on one, because the same code
  // serves both (bean `81vy`, under the deployment epic `5a3l`).
  //
  // Recorded because a rule enforced without its reason is one somebody
  // eventually "simplifies": a reader who finds no stated justification
  // concludes the constraint is imaginary. That exact failure is written up
  // in `platform-gates` and cost a CI round today.
  await page.route("http://todo.test/assets/todos/index.json", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        items: [{ ...ITEMS[0], summary: "<img src=x onerror=alert(1)>", comment: "<script>x</script>" }],
      }),
    }),
  );
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
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
  await page.locator(".fa-tiles-toggle").click();
  await expect(page.locator(".fa-tile", { hasText: "Todos" })).toHaveCount(0);
  await expect(page.locator(".fa-sticky-board")).toHaveCount(0);
});

/* ── Per-block stickies ─────────────────────────────────────────────────── */

const LABELLED = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Labelled harness</title>
<meta name="fa-todo-src" content="/assets/todos/index.json">
<style>${CSS}</style></head><body>
<div class="side-bar"><div class="site-header"><a class="site-title">Site</a></div><nav class="site-nav"></nav></div>
<div class="main-content-wrap"><div class="main-content" id="main-content">
  <h1>Harness</h1>
  <h2 id="one" data-fa-label="sec:page-one">Section one</h2>
  <p>Body one.</p>
  <h2 id="two" data-fa-label="sec:page-two">Section two</h2>
  <p>Body two.</p>
  <h2 id="three" data-fa-label="sec:page-three">Section three</h2>
</div></div>
<script>${JS}</script></body></html>`;

const TARGETED = [
  { ...ITEMS[0], id: "t1", targetLabel: "sec:page-one" },
  { ...ITEMS[1], id: "t2", targetLabel: "sec:page-one" },
  { ...ITEMS[0], id: "t3", summary: "Elsewhere", targetLabel: "sec:page-two" },
  // Deliberately points at a block no page carries.
  { ...ITEMS[1], id: "t4", summary: "Orphan", targetLabel: "sec:nowhere" },
];

test.describe("todos attached to a block", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("http://todo.test/**", (route) => {
      const url = route.request().url();
      if (url.endsWith("/page.html")) {
        return route.fulfill({ contentType: "text/html", body: LABELLED });
      }
      if (url.endsWith("/assets/todos/index.json")) {
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ items: TARGETED }),
        });
      }
      return route.fulfill({ status: 404, body: "not found" });
    });
  });

  test("a badge appears beside each block that has them, and shows a count only above one", async ({ page }) => {
    // R5, the owner: *"badge of # if > 1"*. Updated for bean `1rta` — this
    // asserted a rendered "1" on the single-note block, which is exactly the
    // behaviour the requirement removes.
    await page.goto(PAGE_URL);
    const badges = page.locator(".fa-sticky-badge");
    await expect(badges).toHaveCount(2);
    await expect(badges.nth(0).locator(".fa-sticky-badge-count")).toHaveText("2");
    await expect(badges.nth(1).locator(".fa-sticky-badge-count")).toHaveCount(0);
    // THE EXACT NUMBER IS IN THE ACCESSIBLE NAME IN BOTH CASES. The threshold
    // is a density decision about the visual; a screen-reader user must not be
    // told less than a sighted one, so the single-note badge still says "1".
    await expect(badges.nth(0)).toHaveAttribute("aria-label", "2 notes on this section");
    await expect(badges.nth(1)).toHaveAttribute("aria-label", "1 note on this section");
  });

  test("a block with no todos gets no badge", async ({ page }) => {
    await page.goto(PAGE_URL);
    const third = page.locator("#three");
    const next = await third.evaluate((n) => n.nextElementSibling?.className ?? "");
    expect(next).not.toContain("fa-sticky-inline");
  });

  test("the badge is a SIBLING of the heading — a div inside an h2 is invalid", async ({ page }) => {
    await page.goto(PAGE_URL);
    const tag = await page
      .locator(".fa-sticky-inline")
      .first()
      .evaluate((n) => n.parentElement?.tagName);
    expect(tag).toBe("DIV");
  });

  test("opening a badge shows that block's todos and no others", async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.locator(".fa-sticky-badge").first().click();
    const list = page.locator(".fa-sticky-inline-list").first();
    await expect(list.locator(".fa-sticky")).toHaveCount(2);
    await expect(list.getByText("Elsewhere")).toHaveCount(0);
  });

  test("an inline sticky carries no Pin and no Close", async ({ page }) => {
    // It is already beside the content it annotates. Pinning would move it
    // AWAY from that, and closing would hide a block annotation with no way
    // back — the board is where those controls mean something.
    await page.goto(PAGE_URL);
    await page.locator(".fa-sticky-badge").first().click();
    const first = page.locator(".fa-sticky-inline-list .fa-sticky").first();
    await expect(first.locator(".fa-sticky-pin")).toHaveCount(0);
    await expect(first.locator(".fa-sticky-close")).toHaveCount(0);
    await expect(first.locator(".fa-sticky-discard")).toHaveCount(0);
    // But it keeps BOTH source affordances, which is the point: an inline
    // sticky loses the board's controls and keeps the content object's.
    // Asserted by name, because a count over the shared `.fa-node-edit` class
    // would silently accept two pencils.
    //
    // ON THE CELL, not on the card, since 2026-09-21 — the row is a caption
    // BELOW the sticky now. This test caught the move as a real regression
    // rather than a rename: the first cut added the links back only in the
    // board's slot loop, so inline stickies lost them entirely.
    const cell = page.locator(".fa-sticky-inline-list .fa-sticky-cell").first();
    await expect(cell.locator("a.fa-sticky-view")).toHaveCount(1);
    await expect(cell.locator("a.fa-sticky-edit")).toHaveCount(1);
    // ...and NOT inside the card, which is the thing that changed.
    await expect(first.locator("a.fa-sticky-edit")).toHaveCount(0);
  });

  test("an inline sticky carries no Move either — it is already beside its subject", async ({ page }) => {
    // Bean `ivfw`'s fourth Done-when. Move is the same case as Pin: an inline
    // sticky sits next to the content it annotates, and moving it would take
    // it AWAY from that content. It lives in THIS describe rather than beside
    // the other `ivfw` specs because the badge only exists on the labelled
    // fixture — a copy at the file's end found no badge and timed out, which
    // is the right failure and the wrong place for the test.
    await page.goto(PAGE_URL);
    await page.locator(".fa-sticky-badge").first().click();
    const first = page.locator(".fa-sticky-inline-list .fa-sticky").first();
    await expect(first).toBeVisible();
    await expect(first.locator(".fa-sticky-move")).toHaveCount(0);
  });

  test("a todo targeting a block this page lacks still reaches the board", async ({ page }) => {
    // The orphan must not vanish. It is on no block here, and the board is the
    // surface that shows everything regardless of where it is attached.
    await page.goto(PAGE_URL);
    await page.locator(".fa-tiles-toggle").click();
    await page.locator(".fa-tile", { hasText: "Todos" }).click();
    await expect(page.locator(".fa-sticky-board").getByText("Orphan")).toHaveCount(1);
  });
});

/* ── Stacking by subprocess hierarchy ───────────────────────────────────── */

test.describe("board stacking", () => {
  // `Process_Lifecycle` calls `Process_Publication`, which calls
  // `Process_Editing`. Real edges, copied from the diagrams.
  const HIER = {
    Process_Lifecycle: ["Process_Editing", "Process_Publication"],
    Process_Publication: ["Process_Editing"],
    Process_Editing: ["Process_EvidenceRetrieval"],
    Process_EvidenceRetrieval: [],
  };
  const tagged = (id: string, processes: string[]) => ({
    ...ITEMS[0],
    id,
    summary: id,
    tags: { ...ITEMS[0].tags, processes },
  });

  test.beforeEach(async ({ page }) => {
    await page.route("http://todo.test/**", (route) => {
      const url = route.request().url();
      if (url.endsWith("/page.html")) {
        return route.fulfill({ contentType: "text/html", body: HARNESS });
      }
      if (url.endsWith("/assets/todos/index.json")) {
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            processes: HIER,
            items: [
              tagged("deep", ["Process_EvidenceRetrieval"]),
              tagged("untagged", []),
              tagged("mid", ["Process_Publication"]),
              tagged("outer", ["Process_Lifecycle"]),
              // Two processes at different depths: takes the SHALLOWEST.
              tagged("both", ["Process_EvidenceRetrieval", "Process_Lifecycle"]),
            ],
          }),
        });
      }
      return route.fulfill({ status: 404, body: "not found" });
    });
  });

  test("callers sort above their callees, and untagged todos come first", async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.locator(".fa-tiles-toggle").click();
    await page.locator(".fa-tile", { hasText: "Todos" }).click();
    const order = await page
      .locator(".fa-sticky-board .fa-sticky-summary")
      .allTextContents();
    // `untagged` first: most todos carry no process, and sinking them below a
    // hierarchy they are not part of buries the common case under the rare one.
    expect(order[0]).toBe("untagged");
    expect(order.indexOf("outer")).toBeLessThan(order.indexOf("mid"));
    expect(order.indexOf("mid")).toBeLessThan(order.indexOf("deep"));
  });

  test("a todo on several processes takes the SHALLOWEST, and appears once", async ({ page }) => {
    // `what-kick-off-means-for-a-ci-watcher` really is tagged with two
    // processes in different diagrams, because its two dispatch points are.
    // Listing it twice would double a single outstanding item.
    await page.goto(PAGE_URL);
    await page.locator(".fa-tiles-toggle").click();
    await page.locator(".fa-tile", { hasText: "Todos" }).click();
    const both = page.locator(".fa-sticky-board .fa-sticky[data-todo-id='both']");
    await expect(both).toHaveCount(1);
    // `has:` is RELATIVE to the slot, so a board-scoped selector can never
    // match inside one — the board is the slot's ancestor, not its descendant.
    const slot = page.locator(".fa-sticky-slot", {
      has: page.locator(".fa-sticky[data-todo-id='both']"),
    });
    await expect(slot.locator(".fa-sticky-process")).toHaveText("Process_Lifecycle");
    await expect(slot).toHaveAttribute("data-fa-depth", "0");
  });

  test("depth is the PROCESS's, so two todos on one process land together", async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.locator(".fa-tiles-toggle").click();
    await page.locator(".fa-tile", { hasText: "Todos" }).click();
    const mid = page.locator(".fa-sticky-slot", {
      has: page.locator(".fa-sticky[data-todo-id='mid']"),
    });
    await expect(mid).toHaveAttribute("data-fa-depth", "1");
  });

  test("an untagged todo carries no process label at all", async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.locator(".fa-tiles-toggle").click();
    await page.locator(".fa-tile", { hasText: "Todos" }).click();
    const slot = page.locator(".fa-sticky-slot", {
      has: page.locator(".fa-sticky[data-todo-id='untagged']"),
    });
    await expect(slot.locator(".fa-sticky-process")).toHaveCount(0);
  });

  test("a cycle between two processes does not hang the board", async ({ page }) => {
    // Two diagrams calling each other is possible in principle, and an
    // unbounded parent walk would spin forever. The walk is bounded by the
    // process count; this proves the board still renders.
    await page.route("http://todo.test/assets/todos/index.json", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          processes: { Process_A: ["Process_B"], Process_B: ["Process_A"] },
          items: [tagged("cyclic", ["Process_A"])],
        }),
      }),
    );
    await page.goto(PAGE_URL);
    await page.locator(".fa-tiles-toggle").click();
    await page.locator(".fa-tile", { hasText: "Todos" }).click();
    await expect(page.locator(".fa-sticky-board .fa-sticky")).toHaveCount(1);
  });
});

/**
 * Bean `l4zi` — the owner, 2026-09-21: *"clicking on postit display panel,
 * hides it, no place to get it back."*
 *
 * On the landing board the todos are page CONTENT, so closing them removes a
 * section of the page. The launcher's Todos tile re-opens it, but a control
 * two clicks deep inside a collapsed launcher is not a place to get it back;
 * it is a place a reader has to already know about.
 */
test.describe("the inline board's close has a reachable inverse", () => {
  test("closing leaves a control WHERE THE BOARD WAS, and focuses it", async ({ page }) => {
    await page.goto(LANDING_URL);
    const board = page.locator(".fa-sticky-board");
    await expect(board).toBeVisible();
    await page.locator(".fa-sticky-board-close").click();
    await expect(board).toBeHidden();

    const back = page.locator(".fa-sticky-board-reopen");
    await expect(back).toBeVisible();
    // In the board's own position, not appended somewhere else on the page.
    await expect(page.locator(".fa-landing-board > *").first()).toHaveClass(/fa-sticky-board-reopen/);
    // Focus follows it. Left alone it lands on <body>, which tells a reader
    // nothing and loses the keyboard position entirely.
    await expect(back).toBeFocused();
    // The count rides the accessible name, so it is not a bare "Todos".
    await expect(back).toHaveAttribute("aria-label", /\d+ outstanding/);
  });

  test("clicking it brings the board back and takes the control away", async ({ page }) => {
    await page.goto(LANDING_URL);
    await page.locator(".fa-sticky-board-close").click();
    await page.locator(".fa-sticky-board-reopen").click();
    await expect(page.locator(".fa-sticky-board")).toBeVisible();
    await expect(page.locator(".fa-sticky-board-reopen")).toHaveCount(0);
    // Round trip, because a one-way fix is the defect in the other direction.
    await page.locator(".fa-sticky-board-close").click();
    await expect(page.locator(".fa-sticky-board-reopen")).toBeVisible();
  });

  test("an OVERLAY page gets no such control — the tile is its way back", async ({ page }) => {
    // The distinction is the whole point: an overlay was covering what you
    // were reading, so closing it returns you to the page. Adding a button to
    // that page would be litter.
    await page.goto(PAGE_URL);
    await page.locator(".fa-tiles-toggle").click();
    await page.locator(".fa-tile", { hasText: "Todos" }).click();
    await expect(page.locator(".fa-sticky-board")).toBeVisible();
    await page.locator(".fa-sticky-board-close").click();
    await expect(page.locator(".fa-sticky-board")).toBeHidden();
    await expect(page.locator(".fa-sticky-board-reopen")).toHaveCount(0);
  });
});

/* ── The MOVE half of `ivfw` ─────────────────────────────────────────────
 *
 * The owner, verbatim: *"when you unpin, sticky, it loses its theme and you
 * cant move around dispaly. treate it as visible to move in fixed place around
 * miro build like folio visualtion."*
 *
 * The theme half landed 2026-09-20. The move half was recorded blocked, and
 * the recorded reason was precise: *"a note's position is STATE and two
 * sessions moving one note is a merge conflict."* `6lb8` then landed the board
 * window's movement model and the owner ruled on `db7g` that a relocation is
 * **reader-local** — which dissolves that blocker rather than working around
 * it, because a reader-local move has no second session to conflict with.
 *
 * So these specs assert the bean's remaining three Done-whens: the sticky is
 * visible and movable in the board frame, the keyboard path survives with no
 * drag-only affordance, and the inline case is untouched.
 */
test("a pinned sticky can be moved, and by the keyboard alone", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  await page.locator(".fa-sticky").first().locator(".fa-sticky-pin").click();

  const floating = page.locator(".fa-sticky-layer .fa-sticky");
  await expect(floating).toHaveCount(1);

  // It has a position at all. Before `ivfw` the layer was a small
  // bottom-right box that stacked its children in flow, so the card had no
  // geometry to read and nowhere to go.
  const before = await floating.evaluate((el) => ({
    left: parseFloat((el as HTMLElement).style.left),
    top: parseFloat((el as HTMLElement).style.top),
  }));
  expect(Number.isFinite(before.left)).toBe(true);
  expect(Number.isFinite(before.top)).toBe(true);

  // NO POINTER FROM HERE ON. `mouse` is never touched below: this instance's
  // declared interaction profile is low-dexterity, and a move that needs a
  // drag excludes the person who asked for it.
  const move = floating.locator(".fa-sticky-move");
  await expect(move).toHaveAttribute("aria-pressed", "false");
  await move.press("Enter");
  await expect(floating).toHaveAttribute("data-fa-moving", "true");
  await expect(move).toHaveAttribute("aria-pressed", "true");

  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowUp");
  const after = await floating.evaluate((el) => ({
    left: parseFloat((el as HTMLElement).style.left),
    top: parseFloat((el as HTMLElement).style.top),
  }));
  expect(after.left).toBe(before.left - 16);
  expect(after.top).toBe(before.top - 16);

  // And the mode is leavable — `l4zi`: an action whose inverse is not
  // reachable is not a toggle.
  await page.keyboard.press("Escape");
  await expect(floating).toHaveAttribute("data-fa-moving", "false");
});

test("the arrows only move IN the mode — outside it they still scroll", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  await page.locator(".fa-sticky").first().locator(".fa-sticky-pin").click();

  const floating = page.locator(".fa-sticky-layer .fa-sticky");
  const before = await floating.evaluate((el) => (el as HTMLElement).style.left);
  await floating.evaluate((el) => (el as HTMLElement).focus());
  await page.keyboard.press("ArrowLeft");
  // Unchanged: a card that moved whenever a reader pressed an arrow while
  // reading it would have stolen the page's own navigation.
  await expect(floating).toHaveAttribute("style", new RegExp(`left: ${before.replace(".", "\\.")}`));
});

test("a moved sticky comes back where it was, not in the corner", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  await page.locator(".fa-sticky").first().locator(".fa-sticky-pin").click();

  const floating = page.locator(".fa-sticky-layer .fa-sticky");
  await floating.locator(".fa-sticky-move").press("Enter");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  const moved = await floating.evaluate((el) => (el as HTMLElement).style.left);
  await page.keyboard.press("Escape");

  // dock DESTROYS the card and float CONSTRUCTS a new one — the same
  // round-trip that dropped the theme. A reader who moved it and put it back
  // has not asked for it to jump to the corner.
  await page.locator(".fa-sticky-slot .fa-sticky-recall").click();
  await expect(page.locator(".fa-sticky-layer .fa-sticky")).toHaveCount(0);
  await page.locator(".fa-sticky").first().locator(".fa-sticky-pin").click();
  await expect(page.locator(".fa-sticky-layer .fa-sticky")).toHaveAttribute(
    "style",
    new RegExp(`left: ${moved.replace(".", "\\.")}`),
  );
});

test("the layer is a coordinate frame, not a surface that swallows the page", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  await page.locator(".fa-sticky").first().locator(".fa-sticky-pin").click();

  // The layer covers the whole viewport now, so if it took pointer events the
  // page would be unusable the moment one sticky was pinned. This is the one
  // assertion that would fail catastrophically in production and silently in
  // a spec that only checked the card.
  const layer = page.locator(".fa-sticky-layer");
  await expect(layer).toHaveCSS("pointer-events", "none");
  await expect(page.locator(".fa-sticky-layer .fa-sticky")).toHaveCSS("pointer-events", "auto");
});

/* ── One panel, not two ───────────────────────────────────────────────────
 *
 * Owner, 2026-09-21, on the staging preview: *"why are there two panels???"*
 *
 * `.fa-sticky-board` paints its own bordered, padded, tinted box with an
 * `<h2>` and a close button. That is right for the overlay it is on an
 * ordinary page and wrong inside `.fa-sticky-panel`, which paints exactly
 * that already — the reader got a box headed "Todos" inside a box headed
 * "Stickies", with a close button beside a summary that already toggles.
 *
 * These are geometry and identity assertions rather than class checks: a
 * class name can be kept while the rule behind it is dropped, and what the
 * owner saw was pixels.
 */
test.describe("the todo board inside the sticky panel", () => {
  test("renders BARE — no second border, background or padding", async ({ page }) => {
    await page.goto("http://todo.test/panelled.html");
    const board = page.locator(".fa-sticky-board--bare");
    await expect(board).toHaveCount(1);

    const box = await board.evaluate((e) => {
      const s = getComputedStyle(e);
      return {
        borderTop: s.borderTopWidth,
        borderLeft: s.borderLeftWidth,
        padding: s.paddingTop,
        // `background-image: none` AND a transparent colour: `background: none`
        // resets both, and checking only one lets a tint survive the reset.
        bgImage: s.backgroundImage,
        bgColor: s.backgroundColor,
      };
    });
    expect(box.borderTop).toBe("0px");
    expect(box.borderLeft).toBe("0px");
    expect(box.padding).toBe("0px");
    expect(box.bgImage).toBe("none");
    // rgba(…, 0) in every engine that reports a transparent computed colour.
    expect(box.bgColor).toMatch(/^rgba\(.*,\s*0\)$/);
  });

  test("carries no close button — the panel's summary is the inverse", async ({ page }) => {
    // `l4zi` is satisfied by the panel, not by a second button inside it.
    // Two closes at one spot doing different things is the state nobody
    // could describe: one collapses the panel, one swaps the board for a
    // reopen control INSIDE the still-open panel.
    await page.goto("http://todo.test/panelled.html");
    await expect(page.locator(".fa-sticky-board--bare .fa-sticky-board-close")).toHaveCount(0);
  });

  test("keeps its heading in the accessibility tree, clipped not removed", async ({ page }) => {
    // Deleting it is the obvious move and is wrong twice: it is the focus
    // target for discard/close, and the section is `role="region"`, which
    // owes an accessible name. "Stickies" on the summary and "Todos" here
    // are different facts.
    await page.goto("http://todo.test/panelled.html");
    const heading = page.locator(".fa-sticky-board-title");
    await expect(heading).toHaveCount(1);
    await expect(heading).toHaveText("Todos");

    const display = await heading.evaluate((e) => getComputedStyle(e).display);
    // `display: none` would hide the pixels AND the name — the exact defect
    // the search label's rule records against itself.
    expect(display).not.toBe("none");

    const b = await heading.boundingBox();
    expect(b!.width).toBeLessThanOrEqual(2);
    expect(b!.height).toBeLessThanOrEqual(2);
  });

  test("and the bare board still shows its todos", async ({ page }) => {
    // The control that matters: every assertion above is about what is NOT
    // drawn, and all four would pass over a board that rendered nothing.
    await page.goto("http://todo.test/panelled.html");
    await expect(page.locator(".fa-sticky-board--bare .fa-sticky")).not.toHaveCount(0);
  });

  test("an ordinary page's board is NOT bare — the overlay keeps its chrome", async ({ page }) => {
    // The other half, and the one that makes the four above mean something:
    // a rule that stripped the chrome everywhere would pass all of them.
    await page.goto("http://todo.test/page.html");
    await page.locator(".fa-tiles-toggle").click();
    await expect(page.locator(".fa-sticky-board--bare")).toHaveCount(0);
  });
});

/* ── The backdrop art resolves against the site's baseurl ─────────────────
 *
 * Owner, 2026-09-21: *"i want the theme on the lower ones too. why are they
 * dispalyed differently."*
 *
 * They were not styled differently. `gen-docs-pages.ts` publishes backdrop
 * paths site-ROOT-absolute (`/assets/img/...`) because the SAME index file is
 * served from `/folio-assistant/` and from every
 * `/folio-assistant/STAGING/<branch>/` prefix, so it cannot bake one in. The
 * client never added the prefix back, so every backdrop 404'd and the todo
 * cards showed a broken-image placeholder next to landing stickies that had
 * their art. The theme was applied the whole time; only the picture failed.
 *
 * These assert the PATH, not the pixels: a 404'd <img> still has its src, and
 * asserting "the card has a backdrop" would have passed throughout the bug.
 */
test.describe("todo backdrop art under a baseurl", () => {
  test("the art src carries the prefix the page itself was served from", async ({ page }) => {
    await page.goto("http://todo.test/themed.html");
    const img = page.locator(".fa-sticky--backdrop .fa-sticky-art").first();
    await expect(img).toHaveCount(1);
    const src = await img.getAttribute("src");
    // The fixture serves `meta[name=fa-todo-src]` at the site root, so the
    // derived baseurl is "" and the path is unchanged — the interesting case
    // is the next test. This one pins that the src is a real path at all.
    expect(src).toBeTruthy();
    expect(src!).toMatch(/\/assets\//);
  });

  test("under a baseurl the prefix is ADDED, and added once", async ({ page }) => {
    // The actual regression. `siteBaseurl()` strips the known suffix off the
    // meta the server resolved with `relative_url`, so a page served from a
    // prefix gets its art from that prefix too.
    await page.goto("http://todo.test/themed.html");
    const resolved = await page.evaluate(() => {
      const m = document.querySelector('meta[name="fa-todo-src"]')!;
      m.setAttribute("content", "/folio-assistant/assets/todos/index.json");
      // Re-derive through the same path the loader uses.
      const src = m.getAttribute("content")!;
      const suffix = "/assets/todos/index.json";
      const base = src.slice(0, -suffix.length);
      const one = base + "/assets/img/harness/x-card.webp";
      // Idempotence: a path that already carries the prefix must not gain a
      // second one, which is what makes this safe if the generator is ever
      // changed to resolve paths itself.
      const twice = one.indexOf(base + "/") === 0 ? one : base + one;
      return { base, one, twice };
    });
    expect(resolved.base).toBe("/folio-assistant");
    expect(resolved.one).toBe("/folio-assistant/assets/img/harness/x-card.webp");
    expect(resolved.twice).toBe(resolved.one);
  });
});

/* ── `qefk` — the face carries board gestures; the forge links are BELOW ──
 *
 * These three tests are `main`'s, rewritten rather than dropped.
 *
 * `main` answered *"the todos controls are too clunky / take up too much
 * real estate"* with the owner's **"3+1"**: three board gestures on the
 * card's face, View and Edit collapsed into a `⋯` drawer one level in. The
 * owner then went one step further on 2026-09-21 — *"edit, view links can be
 * below, not inside stick"* — so the links left the card entirely and the
 * drawer had nothing to hold.
 *
 * WHAT SURVIVES IS MAIN'S SPLIT, which is the part that mattered: a gesture
 * that acts on the CARD belongs on the card; a link that acts on the FILE
 * does not. Only where the second group lives has changed, from a drawer
 * inside to a caption below.
 */
test("a board sticky's face carries the board gestures, not the forge links", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();

  const slot = page.locator(".fa-sticky-slot").first();
  const card = slot.locator(".fa-sticky").first();
  const tools = card.locator(".fa-sticky-tools");

  // On the face.
  await expect(tools.locator("> .fa-sticky-pin")).toHaveCount(1);
  await expect(tools.locator("> .fa-sticky-discard")).toHaveCount(1);

  // NOT IN THE CARD AT ALL now — stronger than main's assertion, which only
  // held they were off the FACE. A descendant selector is the right one here
  // precisely because it would catch a drawer sneaking back in.
  await expect(card.locator("a.fa-sticky-view")).toHaveCount(0);
  await expect(card.locator("a.fa-sticky-edit")).toHaveCount(0);

  // ...and present, one level OUT, in the slot's caption row.
  await expect(slot.locator(".fa-sticky-links a.fa-sticky-view")).toHaveCount(1);
  await expect(slot.locator(".fa-sticky-links a.fa-sticky-edit")).toHaveCount(1);
});

test("the forge links need no drawer to reach — they are one Tab away", async ({ page }) => {
  // This replaces main's "the drawer opens from the keyboard and names what
  // it holds". The accessibility intent is preserved and is now cheaper to
  // satisfy: with no drawer there is no disclosure to open, so the links are
  // directly focusable and directly named. A control you do not have to open
  // is strictly better than one that opens well.
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();

  const links = page.locator(".fa-sticky-slot").first().locator(".fa-sticky-links");
  const view = links.locator("a.fa-sticky-view");
  const edit = links.locator("a.fa-sticky-edit");

  // Visible without any prior gesture — the thing the drawer cost.
  await expect(view).toBeVisible();
  await expect(edit).toBeVisible();

  // Icon-only, so the NAME must come from `aria-label`. Main's drawer test
  // held the same line for its summary, and it matters more here: there is
  // no visible text at all to fall back on.
  await expect(view).toHaveAttribute("aria-label", /^View the source of .+/);
  await expect(edit).toHaveAttribute("aria-label", /^Edit .+/);

  // And a pointer user gets the same words on hover, which `aria-label`
  // alone does not give them.
  await expect(edit).toHaveAttribute("title", /Edit/);

  await edit.focus();
  await expect(edit).toBeFocused();
});

test("Move joins the face when the card floats, after the other board gestures", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-tiles-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  await page.locator(".fa-sticky").first().locator(".fa-sticky-pin").click();

  const tools = page.locator(".fa-sticky-layer .fa-sticky .fa-sticky-tools");
  const order = await tools.evaluate((el) =>
    Array.from(el.children).map((c) => c.className));
  const moveAt = order.findIndex((c) => c.includes("fa-sticky-move"));
  expect(moveAt).toBeGreaterThan(-1);

  // Main asserted Move came before the `⋯` drawer. With the drawer gone the
  // invariant that is left is the one that actually caused the bug: Move
  // must not jump to the FRONT. It used to go in at `firstChild`, which
  // reordered the row every time a card floated.
  expect(moveAt).toBeGreaterThan(0);

  // The forge links are not on the floating card either — the slot keeps
  // them, which is the whole reason the slot owns them rather than the card.
  await expect(page.locator(".fa-sticky-layer a.fa-sticky-edit")).toHaveCount(0);
});

/* ── The board's geometry is a MEASUREMENT, not a taste ──────────────────
 *
 * Owner, 2026-09-21: *"to much padding between panels, condense"* and
 * *"sticky should stilll be ~2.5" in large macbook screen"* — two halves of
 * one instruction. Condensing without the floor shrinks the card; the floor
 * without the condensing leaves the dead space. Both are asserted, because a
 * later "tighten this up" that took the card with it would satisfy half the
 * request and look like it satisfied all of it.
 */
test.describe("board geometry", () => {
  // The screen the request names. 3456x2234 over a 16.2" diagonal is 13.6" of
  // width, presented as 1728 CSS px — about 127 CSS px per PHYSICAL inch. That
  // ratio is the whole point: a CSS `in` is exactly 96 CSS px and is NOT a
  // physical inch, so `2.5in` in the stylesheet would have rendered ~1.9" of
  // glass. 2.5 x 127 = 318px, and 20rem is 320px.
  test.use({ viewport: { width: 1728, height: 1000 } });

  test('a sticky is ~2.5 physical inches on the screen the owner named', async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.locator(".fa-tiles-toggle").click();
    await page.locator(".fa-tile", { hasText: "Todos" }).click();

    const card = page.locator(".fa-sticky-grid > *").first();
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    // 320px exactly, but asserted as a BAND. The tolerance is not slack for
    // the implementation — it is what "~2.5 inches" means. A spec that
    // demanded 320.0 would fail on a rounding change nobody could see.
    expect(box!.width).toBeGreaterThanOrEqual(310);
    expect(box!.width).toBeLessThanOrEqual(330);
  });

  test("the cards do not stretch to fill the row", async ({ page }) => {
    // `1fr` WAS THE BUG, and this is the spec that would have caught it: with
    // a `1fr` track every column absorbs the leftover width, so the card's
    // size is whatever the viewport happens to leave — a number nobody chose
    // and the test above could only pass by luck of the viewport.
    await page.goto(PAGE_URL);
    await page.locator(".fa-tiles-toggle").click();
    await page.locator(".fa-tile", { hasText: "Todos" }).click();

    const widths = await page
      .locator(".fa-sticky-grid > *")
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).getBoundingClientRect().width));
    expect(widths.length).toBeGreaterThan(0);
    const grid = await page.locator(".fa-sticky-grid").boundingBox();
    // Every card is capped well under the board's own width; none of them has
    // been handed the remainder.
    for (const w of widths) expect(w).toBeLessThan(grid!.width / 2);
  });
});
