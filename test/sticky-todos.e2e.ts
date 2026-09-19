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

test("a sticky shows its knowledge-graph edges, each as axis + label", async ({ page }) => {
  // The point of a six-axis relationship model is that a reader can SEE the
  // edges. A card showing only status and priority spends the whole schema on
  // two enums — which is what this rendered before the owner pointed it out.
  await page.goto(PAGE_URL);
  await page.locator(".fa-qr-toggle").click();
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
  await page.locator(".fa-qr-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();

  const dangling = page.locator(".fa-sticky").first().locator(".fa-sticky-rel-dangling");
  await expect(dangling).toHaveText("folio-assistant-gone");
  await expect(dangling).toHaveAttribute("title", /No link/);
  // Read as text, never as a link that goes nowhere.
  expect(await page.locator(".fa-sticky").first().locator("a[href='']").count()).toBe(0);
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
  await page.locator(".fa-qr-toggle").click();
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
  await page.locator(".fa-qr-toggle").click();
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
  await page.locator(".fa-qr-toggle").click();
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
  await page.locator(".fa-qr-toggle").click();
  await page.locator('.fa-tiles-grid .fa-tile:has(.fa-tile-caption:text-is("Settings"))').click();
  await page.locator(".fa-discarded-open").click();
  const local = page.locator(".fa-discarded-local");
  await expect(local).toContainText("1 todo you discarded");
  // Stated in WORDS, not by colour or placement.
  await expect(local).toContainText("this browser only");
  await local.locator(".fa-discarded-restore").click();

  // Back on the board after a reload, which is what "restored" has to mean.
  await page.reload();
  await page.locator(".fa-qr-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  await expect(page.locator(".fa-sticky-slot")).toHaveCount(2);
});

test("a discard survives a reload, and the tile count follows it", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-qr-toggle").click();
  await page.locator(".fa-tile", { hasText: "Todos" }).click();
  await page.locator(".fa-sticky").first().locator(".fa-sticky-discard").click();

  await page.reload();
  await page.locator(".fa-qr-toggle").click();
  const tile = page.locator(".fa-tile", { hasText: "Todos" });
  // The count is what a reader sees before opening anything, so a discard
  // that did not move it would read as having done nothing.
  await expect(tile.locator(".fa-tile-count")).toHaveText("1");
  await expect(tile).toHaveAttribute("aria-label", "Todos — 1 outstanding");
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

  test("a badge appears beside each block that has them, carrying its count", async ({ page }) => {
    await page.goto(PAGE_URL);
    const badges = page.locator(".fa-sticky-badge");
    await expect(badges).toHaveCount(2);
    await expect(badges.nth(0).locator(".fa-sticky-badge-count")).toHaveText("2");
    await expect(badges.nth(1).locator(".fa-sticky-badge-count")).toHaveText("1");
    // The count is in the accessible name too, not only the glyph.
    await expect(badges.nth(0)).toHaveAttribute("aria-label", "2 todo(s) on this section");
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
    // But it keeps the edit affordance, which is the point of the pencil.
    await expect(first.locator("a.fa-node-edit")).toHaveCount(1);
  });

  test("a todo targeting a block this page lacks still reaches the board", async ({ page }) => {
    // The orphan must not vanish. It is on no block here, and the board is the
    // surface that shows everything regardless of where it is attached.
    await page.goto(PAGE_URL);
    await page.locator(".fa-qr-toggle").click();
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
    await page.locator(".fa-qr-toggle").click();
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
    await page.locator(".fa-qr-toggle").click();
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
    await page.locator(".fa-qr-toggle").click();
    await page.locator(".fa-tile", { hasText: "Todos" }).click();
    const mid = page.locator(".fa-sticky-slot", {
      has: page.locator(".fa-sticky[data-todo-id='mid']"),
    });
    await expect(mid).toHaveAttribute("data-fa-depth", "1");
  });

  test("an untagged todo carries no process label at all", async ({ page }) => {
    await page.goto(PAGE_URL);
    await page.locator(".fa-qr-toggle").click();
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
    await page.locator(".fa-qr-toggle").click();
    await page.locator(".fa-tile", { hasText: "Todos" }).click();
    await expect(page.locator(".fa-sticky-board .fa-sticky")).toHaveCount(1);
  });
});
