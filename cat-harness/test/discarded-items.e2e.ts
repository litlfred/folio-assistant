import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { siteDirFor } from "../schemas/cat-harness.ts";

/**
 * The fsh-guts viewer — the dead-fish control under Settings.
 *
 * Bean `folio-assistant-7vhe`. Owner, 2026-09-19: *"only available under
 * settings at dead fish icon. opening it shows a list of all the nodes in
 * fsh-guts/ (has counter on icon) and use can open dialog to select and
 * display them."*
 *
 * ## What is asserted, and why each of it
 *
 * The three fetch states, because the middle one is the whole design: a
 * FAILED fetch must not look like an empty trashcan. The todo tile hides
 * itself at count 0, which is right for todos and would be wrong here — and
 * a spec that only exercised the happy path would never notice.
 *
 * The accessibility half is not decoration. This instance's interaction
 * profile is low-dexterity, `gjli` is a standing rule, and a dialog is the
 * control most often shipped without keyboard handling. So: the accessible
 * name carries the COUNT rather than leaving it to the badge, the name is
 * not "dead fish", and the whole path works from the keyboard.
 *
 * The document is stubbed through `page.route`, not read from `_kg/`: the
 * point is the viewer's behaviour on a given document, and a fixture that
 * changed whenever somebody discarded something would fail for reasons that
 * are not defects.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = siteDirFor(ROOT);
const CSS = readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");

const DOC_URL = "https://example.invalid/fsh-guts.json";

/** Two nodes: one with a body, one without, so both branches are exercised. */
const DOCUMENT = {
  "@id": DOC_URL,
  "@graph": [
    {
      "@id": DOC_URL + "#a",
      name: "Deployment topologies and operating modes",
      nodeKind: "proposal",
      sourcePath: "cat-harness/docs/proposals/deployment-topologies.md",
      movedFrom: "docs/folio-assistant/proposals/deployment-topologies.md",
      movedOn: "2026-09-19",
      issue: "363",
      description: "Ten topology axes by six operating modes.",
      body: "First paragraph of the discarded proposal.\n\nSecond paragraph.",
    },
    {
      "@id": DOC_URL + "#b",
      name: "A node with no text at all",
      nodeKind: "todo",
      sourcePath: "fsh-guts/notes/empty.md",
    },
  ],
};

/**
 * The page under test.
 *
 * NO BACKTICKS INSIDE THE TEMPLATE LITERAL — the whole page is one, so a
 * backtick anywhere ends the string and the file stops parsing. Its sibling
 * spec carries the same warning because it happened there.
 */
function harness(src: string | null): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
  ${src === null ? "" : `<meta name="fa-fsh-guts-src" content="${src}">`}
  <style>
  body { margin: 0; }
  .side-bar { position: fixed; top: 0; left: 0; width: 16.5rem; height: 100%;
              display: flex; flex-flow: column nowrap; align-items: flex-end;
              background: #27262b; color: #fff; }
  .site-header { width: 100%; max-height: 3.75rem; overflow: hidden; display: flex; align-items: center; }
  .site-title { flex: 1; }
  .site-nav { width: 100%; overflow-y: auto; }
  ${CSS}
</style></head><body>
  <div class="side-bar">
    <div class="site-header"><a class="site-title">folio-assistant</a></div>
    <nav class="site-nav"><a href="#">Home</a></nav>
  </div>
  <div class="main"><div class="main-header"></div><div class="main-content"><h1>x</h1></div></div>
  <script>window.jtd = { theme: "dark",
    getTheme: function () { return this.theme; },
    setTheme: function (t) { this.theme = t; } };<\/script>
  <script>${JS}<\/script>
</body></html>`;
}

type Page = import("@playwright/test").Page;

/** Serve `body` for the document, or fail the request when null. */
async function stub(page: Page, body: unknown | null): Promise<void> {
  await page.route(DOC_URL, async (route) => {
    if (body === null) return route.fulfill({ status: 500, body: "nope" });
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
  });
}

/** Open the launcher, then Settings — where the owner put this control. */
async function openSettings(page: Page): Promise<void> {
  await page.locator(".fa-tiles-toggle").click();
  await page.locator('.fa-tiles-grid .fa-tile:has(.fa-tile-caption:text-is("Settings"))').click();
}

test.describe("the discarded-items control lives under Settings", () => {
  test("it is NOT in the top-level grid", async ({ page }) => {
    // The owner said "under settings", and the launcher grid is capped
    // real estate — the same argument that put the theme toggle there.
    await stub(page, DOCUMENT);
    await page.setContent(harness(DOC_URL));
    await page.locator(".fa-tiles-toggle").click();
    const captions = await page.locator(".fa-tiles-grid .fa-tile-caption").allTextContents();
    expect(captions).not.toContain("Discarded");
  });

  test("it appears inside Settings, with the count in its accessible name", async ({ page }) => {
    await stub(page, DOCUMENT);
    await page.setContent(harness(DOC_URL));
    await openSettings(page);
    const btn = page.locator(".fa-discarded-open");
    await expect(btn).toBeVisible();
    // The COUNT is in the name, not only in the badge: a badge is a visual
    // affordance and a screen reader should not have to infer from it.
    await expect(btn).toHaveAttribute("aria-label", "Discarded items — 2 items");
    await expect(btn.locator(".fa-tile-count")).toHaveText("2");
    // "Dead fish" is the ICON. The name says what the control does.
    const name = (await btn.getAttribute("aria-label")) ?? "";
    expect(name.toLowerCase()).not.toContain("fish");
  });

  test("one item reads as \"1 item\", not \"1 items\"", async ({ page }) => {
    await stub(page, { "@graph": [DOCUMENT["@graph"][0]] });
    await page.setContent(harness(DOC_URL));
    await openSettings(page);
    await expect(page.locator(".fa-discarded-open")).toHaveAttribute(
      "aria-label", "Discarded items — 1 item");
  });
});

test.describe("three states, and the middle one is why this is a spec", () => {
  test("a FAILED fetch says so — it does not look like an empty trashcan", async ({ page }) => {
    // The case the todo tile's "count === 0 is not a tile" rule would have
    // got wrong. "Could not read the document" and "nothing discarded" are
    // opposite facts, and hiding the control renders the first as the second.
    await stub(page, null);
    await page.setContent(harness(DOC_URL));
    await openSettings(page);
    const err = page.locator(".fa-discarded-error");
    await expect(err).toBeVisible();
    await expect(err).toContainText("could not be read");
    await expect(page.locator(".fa-discarded-open")).toHaveCount(0);
  });

  test("an EMPTY trashcan says that instead, in different words", async ({ page }) => {
    await stub(page, { "@graph": [] });
    await page.setContent(harness(DOC_URL));
    await openSettings(page);
    await page.locator(".fa-discarded-open").click();
    const none = page.locator(".fa-discarded-none");
    await expect(none).toBeVisible();
    await expect(none).toContainText("Nothing has been discarded");
    // Not colour-only, and not the same sentence as the failure.
    await expect(page.locator(".fa-discarded-error")).toHaveCount(0);
  });

  test("a build that published NO document offers no control at all", async ({ page }) => {
    // A third distinct answer: not an error, not an empty trashcan. There is
    // nothing to report a count about, so nothing is offered.
    await page.setContent(harness(null));
    await openSettings(page);
    await expect(page.locator(".fa-discarded-open")).toHaveCount(0);
    await expect(page.locator(".fa-discarded-error")).toHaveCount(0);
    await expect(page.locator(".fa-discarded-slot")).toHaveCount(0);
  });
});

test.describe("selecting an item displays it", () => {
  test("the list names every node, and opening one shows its text", async ({ page }) => {
    await stub(page, DOCUMENT);
    await page.setContent(harness(DOC_URL));
    await openSettings(page);
    await page.locator(".fa-discarded-open").click();

    const items = page.locator(".fa-discarded-item-name");
    await expect(items).toHaveCount(2);
    await items.first().click();

    await expect(page.locator(".fa-discarded-title")).toHaveText(
      "Deployment topologies and operating modes");
    await expect(page.locator(".fa-discarded-detail")).toContainText(
      "First paragraph of the discarded proposal.");
    // `movedFrom` is the field that stops a node being an orphan, so it is
    // the one the detail must show.
    await expect(page.locator(".fa-discarded-meta")).toContainText(
      "docs/folio-assistant/proposals/deployment-topologies.md");
  });

  test("NEVER A BLANK PANE — an item with no text says so", async ({ page }) => {
    await stub(page, DOCUMENT);
    await page.setContent(harness(DOC_URL));
    await openSettings(page);
    await page.locator(".fa-discarded-open").click();
    await page.locator(".fa-discarded-item").nth(1).click();
    await expect(page.locator(".fa-discarded-detail")).toContainText("carries no text");
  });

  test("the body is rendered as TEXT, never as markup", async ({ page }) => {
    // `fsh-guts/` is a dumping ground anyone may drop a file into. The safe
    // thing to do with content like that is not to interpret it — so there
    // is no markdown renderer and no sanitiser to get wrong.
    //
    // The DEPLOY TARGET is the second half of that reasoning: this ships to
    // gh-pages, a STATIC host with no request-time sanitiser and no server to
    // reject a payload before it reaches a browser. "No sanitiser to get
    // wrong" is a virtue here precisely because there could not have been one
    // anyway — the topology forbids it (bean `81vy`, epic `5a3l`).
    await stub(page, {
      "@graph": [{ name: "Hostile", nodeKind: "note",
                   body: "<img src=x onerror=alert(1)> and <b>bold</b>" }],
    });
    await page.setContent(harness(DOC_URL));
    await openSettings(page);
    await page.locator(".fa-discarded-open").click();
    await page.locator(".fa-discarded-item").first().click();
    const detail = page.locator(".fa-discarded-detail");
    await expect(detail).toContainText("<img src=x onerror=alert(1)>");
    await expect(detail.locator("img")).toHaveCount(0);
    await expect(detail.locator("b")).toHaveCount(0);
  });
});

test.describe("operable without a mouse", () => {
  test("focus lands on the item that opened, and back returns to the list", async ({ page }) => {
    // Programmatic focus is the half that gets skipped: the pane is rewritten
    // in place, so a reader whose cursor did not move is told nothing at all
    // about what just happened.
    await stub(page, DOCUMENT);
    await page.setContent(harness(DOC_URL));
    await openSettings(page);
    await page.locator(".fa-discarded-open").click();
    await page.locator(".fa-discarded-item").first().click();
    await expect(page.locator(".fa-discarded-title")).toBeFocused();

    await page.locator(".fa-discarded-back").click();
    await expect(page.locator(".fa-discarded-list")).toBeVisible();
    await expect(page.locator(".fa-discarded-item").first()).toBeFocused();
  });

  test("every control is a real button, reachable by keyboard", async ({ page }) => {
    await stub(page, DOCUMENT);
    await page.setContent(harness(DOC_URL));
    await openSettings(page);
    // Enter on the focused control, not a click: a div with a click handler
    // passes a click test and fails a keyboard user.
    await page.locator(".fa-discarded-open").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".fa-discarded-list")).toBeVisible();

    await page.locator(".fa-discarded-item").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".fa-discarded-title")).toBeVisible();
  });
});
