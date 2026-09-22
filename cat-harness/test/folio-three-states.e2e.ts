import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { siteDirFor } from "../schemas/cat-harness.ts";

/**
 * R30's THREE STATES, bean `j2if`. Owner, 2026-09-21:
 *
 * > they can also be closed and returned to their homes (e.g. "back in
 * > library", matieral asset still in folio/ but not displayed, need to go
 * > back to the library and pull it out to folio display window)
 *
 * ## What these specs are actually for
 *
 * Not "does the button work". `board-windows` names the defect this feature
 * exists to avoid, and it is a defect that LOOKS like a working feature:
 *
 * > A two-state model — in the folio, or not — makes *closing a sticky* and
 * > *un-materialising an asset* the same gesture. A reader tidying their
 * > glass would then silently discard work, and would have no way to tell
 * > that they had.
 *
 * A two-state implementation passes every happy-path test a three-state one
 * does. The specs that tell them apart are the two below under "the middle
 * state is real": close, then assert the asset is STILL the reader's, and
 * that the way back is on the library and NOT on the glass.
 *
 * `l4zi` one level out — *"the inverse of close must be reachable, and here
 * it is reachable from a DIFFERENT surface than the one that closed it."*
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SITE = siteDirFor(ROOT);
const CSS = readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");

/**
 * A library page: two rows that declare themselves, and nothing else.
 *
 * No `<main>`, no sidebar, no todo index — a generated library view is a
 * standalone document, so a fixture with just-the-docs furniture would be
 * testing a page this feature never runs on.
 */
const LIBRARY = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<style>${CSS}</style></head><body>
<h1>who-iris library</h1>
<table><tbody>
  <tr data-fa-library-item="who-iris/item-a"
      data-fa-library-title="Guideline A"
      data-fa-library-href="/who-iris/item-a.html"><td>Guideline A</td></tr>
  <tr data-fa-library-item="who-iris/item-b"
      data-fa-library-title="Guideline B"
      data-fa-library-href="/who-iris/item-b.html"><td>Guideline B</td></tr>
</tbody></table>
<script>${JS}</script></body></html>`;

/** A page that is NOT a library — no declaring rows anywhere. */
const PLAIN = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<style>${CSS}</style></head><body><h1>An ordinary page</h1>
<script>${JS}</script></body></html>`;

async function serve(page: import("@playwright/test").Page, body: string, path = "/library.html") {
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith(".json")) return route.fulfill({ status: 404, body: "not found" });
    return route.fulfill({ status: 200, contentType: "text/html", body });
  });
  await page.goto(`http://127.0.0.1:8080${path}`);
  await page.waitForLoadState("networkidle");
}

const rowA = '[data-fa-library-item="who-iris/item-a"]';
const rowB = '[data-fa-library-item="who-iris/item-b"]';

test.describe("state 1 — in the library", () => {
  test("a row the reader has never touched offers a pull-out and claims nothing", async ({ page }) => {
    await serve(page, LIBRARY);
    await expect(page.locator(rowA)).toHaveAttribute("data-fa-folio-state", "library");
    await expect(page.locator(`${rowA} .fa-pullout`)).toHaveText("Pull out to folio");
    await expect(page.locator(`${rowA} .fa-pullout-state`)).toHaveText("");
  });

  test("the glass says it is empty, rather than looking broken", async ({ page }) => {
    await serve(page, LIBRARY);
    await page.locator(".fa-glass-handle").click();
    await expect(page.locator(".fa-glass-empty")).toBeVisible();
  });

  test("a page with no library rows mounts no pull-outs at all", async ({ page }) => {
    // The guard every mount here uses. Without it, loading docs-ui.js on a
    // replica page would decorate whatever happened to match.
    await serve(page, PLAIN, "/plain.html");
    await expect(page.locator(".fa-pullout")).toHaveCount(0);
    await expect(page.locator(".fa-glass-handle")).toBeVisible(); // the glass still comes
  });
});

test.describe("state 3 — on the glass", () => {
  test("pulling out puts it on the glass and the row stops offering it", async ({ page }) => {
    await serve(page, LIBRARY);
    await page.locator(`${rowA} .fa-pullout`).click();
    await expect(page.locator(rowA)).toHaveAttribute("data-fa-folio-state", "glass");
    await expect(page.locator(`${rowA} .fa-pullout-state`)).toHaveText("On your folio glass");
    await page.locator(".fa-glass-handle").click();
    await expect(page.locator('.fa-glass-asset[data-fa-asset="who-iris/item-a"]')).toBeVisible();
    await expect(page.locator(".fa-glass-empty")).toBeHidden();
  });

  test("the row offers no close — closing belongs to the glass, and to one surface", async ({ page }) => {
    // Two surfaces offering the same close would answer "where does this go"
    // twice, and the two answers would be free to disagree.
    await serve(page, LIBRARY);
    await page.locator(`${rowA} .fa-pullout`).click();
    await expect(page.locator(`${rowA} .fa-pullout`)).toBeHidden();
  });

  test("it survives a reload — a folio that forgets is not a folio", async ({ page }) => {
    await serve(page, LIBRARY);
    await page.locator(`${rowA} .fa-pullout`).click();
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.locator(rowA)).toHaveAttribute("data-fa-folio-state", "glass");
  });

  test("and says in words that it is saved in this browser only", async ({ page }) => {
    // The discarded-todos rule, unchanged: a reader who thinks their folio
    // follows them to another machine has been misled by the control.
    await serve(page, LIBRARY);
    await page.locator(`${rowA} .fa-pullout`).click();
    await page.locator(".fa-glass-handle").click();
    await expect(page.locator(".fa-glass-local-note")).toContainText("this browser only");
  });
});

test.describe("the middle state is real — these are the specs a two-state build fails", () => {
  test("closing does NOT return it to the library", async ({ page }) => {
    // THE defect `board-windows` exists to forbid. A two-state build passes
    // every other spec in this file and fails here: it would read "library".
    await serve(page, LIBRARY);
    await page.locator(`${rowA} .fa-pullout`).click();
    await page.locator(".fa-glass-handle").click();
    await page.locator('.fa-glass-asset[data-fa-asset="who-iris/item-a"] .fa-glass-asset-close').click();

    await expect(page.locator(rowA)).toHaveAttribute("data-fa-folio-state", "folio");
    await expect(page.locator(`${rowA} .fa-pullout-state`)).toHaveText("In your folio, not displayed");
  });

  test("...and the way back is on the LIBRARY, not on the glass", async ({ page }) => {
    // `l4zi` one level out. The skill says where this is easy to get wrong:
    // "the thing to check is that the library offers the way back — not that
    // the glass does."
    await serve(page, LIBRARY);
    await page.locator(`${rowA} .fa-pullout`).click();
    await page.locator(".fa-glass-handle").click();
    await page.locator('.fa-glass-asset[data-fa-asset="who-iris/item-a"] .fa-glass-asset-close').click();

    // Gone from the glass...
    await expect(page.locator('.fa-glass-asset[data-fa-asset="who-iris/item-a"]')).toHaveCount(0);
    // ...and the glass does not offer it back.
    await expect(page.locator(".fa-glass-shelf .fa-pullout")).toHaveCount(0);
    // The library does, and says so.
    await expect(page.locator(`${rowA} .fa-pullout`)).toHaveText("Put back on glass");
  });

  test("the glass SAYS where the way back is — including that the folio is in the way", async ({ page }) => {
    // A reader who is not told reads a closed asset as one they lost. And
    // the FIRST draft of this note said only "open its library view", which
    // sends them to a control this very sheet is covering: the spec below
    // failed with the sheet named as intercepting the pointer. That is
    // `pb04` — the affordance exists, it is reachable, and not from where
    // the reader is standing.
    await serve(page, LIBRARY);
    await page.locator(`${rowA} .fa-pullout`).click();
    await page.locator(".fa-glass-handle").click();
    await page.locator('.fa-glass-asset[data-fa-asset="who-iris/item-a"] .fa-glass-asset-close').click();
    const note = page.locator(".fa-glass-shelved-note");
    await expect(note).toContainText("library view");
    await expect(note).toContainText("Put your folio away");
  });

  test("the open glass really does cover the library row — the note is not superstition", async ({ page }) => {
    // Pins the premise of the sentence above. If the sheet stopped
    // intercepting, the note would be telling readers to do a needless step
    // and nothing would say so.
    await serve(page, LIBRARY);
    await page.locator(`${rowA} .fa-pullout`).click();
    await page.locator(".fa-glass-handle").click();
    await page.locator('.fa-glass-asset[data-fa-asset="who-iris/item-a"] .fa-glass-asset-close').click();
    await expect(page.locator(`${rowA} .fa-pullout`)).toHaveText("Put back on glass");
    // Visible and named, but not clickable from here: the sheet is over it.
    await expect(page.locator(`${rowA} .fa-pullout`).click({ timeout: 1500 })).rejects.toThrow();
  });

  test("putting it back from the library returns it to the glass", async ({ page }) => {
    await serve(page, LIBRARY);
    await page.locator(`${rowA} .fa-pullout`).click();
    await page.locator(".fa-glass-handle").click();
    await page.locator('.fa-glass-asset[data-fa-asset="who-iris/item-a"] .fa-glass-asset-close').click();
    // Put the folio away first — which is what the note now tells the reader.
    await page.locator(".fa-glass-handle").click();
    await page.locator(`${rowA} .fa-pullout`).click();
    await expect(page.locator(rowA)).toHaveAttribute("data-fa-folio-state", "glass");
    await page.locator(".fa-glass-handle").click();
    await expect(page.locator('.fa-glass-asset[data-fa-asset="who-iris/item-a"]')).toBeVisible();
  });

  test("a shelved asset survives a reload as SHELVED, not as forgotten", async ({ page }) => {
    // The state that would be lost by an implementation storing only an
    // array of ids: "closed" and "never pulled out" become one absence.
    await serve(page, LIBRARY);
    await page.locator(`${rowA} .fa-pullout`).click();
    await page.locator(".fa-glass-handle").click();
    await page.locator('.fa-glass-asset[data-fa-asset="who-iris/item-a"] .fa-glass-asset-close').click();
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.locator(rowA)).toHaveAttribute("data-fa-folio-state", "folio");
  });
});

test.describe("one asset's state is its own", () => {
  test("pulling A out leaves B in the library", async ({ page }) => {
    await serve(page, LIBRARY);
    await page.locator(`${rowA} .fa-pullout`).click();
    await expect(page.locator(rowB)).toHaveAttribute("data-fa-folio-state", "library");
    await expect(page.locator(`${rowB} .fa-pullout`)).toHaveText("Pull out to folio");
  });
});
