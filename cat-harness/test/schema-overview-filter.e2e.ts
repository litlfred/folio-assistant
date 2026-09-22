/**
 * The schema viewer's overview panel follows the filters — all of them.
 *
 * Bean `whbf`, the live-filtering item. Before this, `render()` honoured
 * search, kind and module while `diaModel()` honoured module ALONE, so a
 * reader who typed into the search box watched the list narrow and the
 * picture sit still. The bean records that as deliberate — the overview shows
 * SCOPE, not filter — and as a design that is defensible. As an *experience*
 * it is not, because nothing on the page said so, and an undisclosed
 * deliberate choice is indistinguishable from a bug to the person looking at
 * it.
 *
 * ## Why these assertions are over a rendered page rather than the generator
 *
 * The panel's whole behaviour lives inside a template literal as browser
 * JavaScript, so a unit test over `viewerHtml()` can pin that the WIRING is
 * present and cannot pin that it WORKS. This repository has already paid for
 * that distinction: `qttr` found 12 of 67 modules rendering their 10px font
 * at under 5px — the worst at 1.60px — and every gate was green across it,
 * because the generator's output looked right. Only a rendered page showed
 * it. The sibling unit tests in `schemas/viz-generators.test.ts` cover the
 * cheap half; this file covers the half that catches the `qttr` shape.
 *
 * ## What must not regress
 *
 * `whbf`'s closing line: *"a reader can return to the static arrangement, and
 * the undrawn-edge count survives every mode."* The second clause described a
 * mechanism that had been DELETED — `ovModel`'s intra-module counter went
 * with the ring when the layered diagram replaced it in `3f629d42b`, and
 * nothing replaced the contract. Live filtering restores it for the one loss
 * the current layout actually has: a relationship between two faded context
 * boxes, where both boxes are on screen and the line between them is not.
 *
 * @module test/schema-overview-filter.e2e
 */
import { test, expect, type Page } from "@playwright/test";

/** Served from the repository root by `test-server.mjs`. */
const PAGE = "/cat-harness/docs/cat-harness/schemas/index.html";

/** The caption is the panel's own report; every count below is read from it. */
const CAP = "#ov-cap";

/**
 * Open the panel and wait for a drawn picture.
 *
 * `diagram()` runs on first open rather than at load, so a test that asserts
 * before opening asserts over an empty `<svg>` and passes for the wrong
 * reason.
 */
async function openPanel(page: Page): Promise<void> {
  await page.goto(PAGE);
  await expect(page.locator("#counts")).toContainText("declarations");
  await page.locator("#overview > summary").click();
  await expect(page.locator("#overview")).toHaveAttribute("open", "");
}

/** Declarations the caption says it drew, or `null` when it refused. */
async function drawnCount(page: Page): Promise<number | null> {
  const text = (await page.locator(CAP).textContent()) ?? "";
  if (text.includes("too many to draw")) return null;
  const m = /^(\d+)\s+declaration/.exec(text.trim());
  return m ? Number(m[1]) : null;
}

test.describe("overview panel — the picture follows every filter", () => {
  test("a SEARCH narrows the diagram, not only the list", async ({ page }) => {
    await openPanel(page);

    // The unfiltered page is over DIA_MAX and refuses, which is the state
    // that made the old behaviour invisible: nothing moved because nothing
    // was drawn.
    await page.locator("#q").fill("role");
    await expect(page.locator(CAP)).not.toContainText("too many to draw");

    const drawn = await drawnCount(page);
    expect(drawn).not.toBeNull();

    // The picture and the list are filtered through ONE predicate, so the
    // number the caption reports is the number the header reports. They
    // drifted precisely because there were two.
    const counts = (await page.locator("#counts").textContent()) ?? "";
    const listed = Number(/(\d+)\s+of\s+\d+\s+declarations/.exec(counts)?.[1]);
    expect(drawn).toBe(listed);
  });

  test("a search EARNS a picture the unfiltered page refuses to draw", async ({ page }) => {
    await openPanel(page);

    // Measured at 842 declarations against DIA_MAX = 40. Asserted as the
    // REFUSAL rather than as a number, so growing the corpus does not redden
    // this and shrinking it below the limit fails loudly instead of passing
    // vacuously.
    await expect(page.locator(CAP)).toContainText("too many to draw");

    await page.locator("#q").fill("workflow");
    await expect(page.locator(CAP)).not.toContainText("too many to draw");
    expect(await drawnCount(page)).toBeGreaterThan(0);

    // ...and clearing it returns the reader to where they were. `whbf`
    // requires a way back to the static arrangement; this is that, for the
    // filter axis.
    await page.locator("#q").fill("");
    await expect(page.locator(CAP)).toContainText("too many to draw");
  });

  test("the KIND select narrows the diagram too", async ({ page }) => {
    await openPanel(page);
    const kinds = await page.locator("#kind option").allTextContents();
    // `zod-enum` measured at 35 in scope — under the limit, so it draws.
    expect(kinds).toContain("zod-enum");

    await page.locator("#kind").selectOption("zod-enum");
    await expect(page.locator(CAP)).not.toContainText("too many to draw");
    expect(await drawnCount(page)).toBeGreaterThan(0);
  });

  test("an empty result names the FILTER, never the scope", async ({ page }) => {
    await openPanel(page);
    await page.locator("#q").fill("zzzznotathing");

    // The old wording was "Nothing in scope to draw", which was true while
    // only scope and the module select could empty the set. Once a search
    // can, the same words blame the subject for what a filter did.
    await expect(page.locator(CAP)).toContainText("No declaration matches the filters");
    await expect(page.locator(CAP)).not.toContainText("Nothing in scope");
    await expect(page.locator("#ov-svg")).toBeEmpty();
  });
});

test.describe("overview panel — a suppressed relationship is counted, never silent", () => {
  test("two faded boxes with a hidden edge between them are REPORTED", async ({ page }) => {
    await openPanel(page);

    // Context-to-context edges are dropped by design: the picture is about
    // the filter, not its surroundings. But both endpoints are DRAWN, so an
    // unreported drop tells the reader these two are unrelated — a false
    // statement the picture makes silently.
    //
    // Driven through the module select, because that is where the loss
    // actually occurs: 15 summed across 79 module filters, 0 across eight
    // sample searches. No fixed count is asserted — the corpus moves — only
    // that the loss happens somewhere and is reported where it does.
    const mods = await page.locator("#mod option").count();
    expect(mods).toBeGreaterThan(1);

    let sawSuppression = false;
    for (let i = 1; i < Math.min(mods, 40); i++) {
      const value = await page.locator("#mod option").nth(i).getAttribute("value");
      if (!value) continue;
      await page.locator("#mod").selectOption(value);
      const text = (await page.locator(CAP).textContent()) ?? "";
      if (text.includes("are not drawn, because")) {
        expect(text).toMatch(/\d+\s+relationship\(s\) BETWEEN two faded boxes/);
        // The point of the clause: it says a missing line is not a missing
        // relationship.
        expect(text).toContain("never mistaken for a missing relationship");
        sawSuppression = true;
        break;
      }
    }
    // ASSERTED TO OCCUR, and the first draft of this line did not: it read
    // `expect(typeof sawSuppression).toBe("boolean")`, which is true whether
    // the loop found anything or nothing. A check that passes over an empty
    // examination is the `dh4f` shape — a consumer that scans nothing and
    // reports a clean run — and writing one INTO the test for the
    // count-it-rather-than-drop-it contract would have been the same defect
    // one level up.
    //
    // The basis for asserting it rather than tolerating zero: measured at 15
    // summed across the 79 module filters over the committed projection of
    // 842 declarations and 525 edges. A margin wide enough that a drop to
    // zero means the
    // context mechanism changed, which is worth a red test and a look, not a
    // silent pass.
    expect(sawSuppression, "no module filter suppressed a context-to-context edge").toBe(true);
  });
});

test.describe("overview panel — drivable without a mouse", () => {
  // `gjli` is a standing rule here and it is load-bearing rather than
  // boilerplate: this instance's declared interaction profile is
  // low-dexterity, so a control that needs precise pointing is unusable by
  // the person the page is built for. A filter that only a mouse can reach
  // would have made the picture follow the list for everyone except them.
  test("the filters and the panel are reachable and operable by keyboard", async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator("#counts")).toContainText("declarations");

    // The panel opens from the keyboard: <summary> is focusable and Enter
    // toggles it. A <details> replaced by a div+click handler would fail
    // here, which is the `l4zi`/bare-<circle> shape one element up.
    await page.locator("#overview > summary").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#overview")).toHaveAttribute("open", "");

    // Typing into the search — no pointer — must move the picture.
    await page.locator("#q").focus();
    await expect(page.locator("#q")).toBeFocused();
    await page.keyboard.type("workflow");
    await expect(page.locator(CAP)).not.toContainText("too many to draw");

    // And the way back is reachable the same way.
    await page.keyboard.press("Control+A");
    await page.keyboard.press("Backspace");
    await expect(page.locator(CAP)).toContainText("too many to draw");
  });

  test("every filter control carries an accessible name", async ({ page }) => {
    await page.goto(PAGE);
    // The search field's name came from a placeholder once, which vanishes on
    // input — the `gjli` finding (3). These are asserted rather than trusted.
    for (const id of ["#q", "#kind", "#mod"]) {
      const el = page.locator(id);
      const label = await el.getAttribute("aria-label");
      expect(label, `${id} has no accessible name`).toBeTruthy();
      expect(label!.length).toBeGreaterThan(3);
    }
  });
});
