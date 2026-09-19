import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { badgeRunFor, indexWithRows } from "./support/qa-badge-fixture.js";
import { siteDirFor } from "../schemas/cat-harness.ts";

/**
 * A badge has THREE outcomes it can reach by fetching, and none of them may be
 * mistaken for a pass.
 *
 * The generated page used to carry the verdict: `gen-docs-pages.ts` wrote the
 * state class, the glyph and `"0 fail, 0 warn, 10 pass, 0 n/a"` straight into
 * `docs/*.md`. Bean `d2kp` measured what that costs — twelve pages stale on
 * `main`, one of them because the graph got BETTER, and a published page
 * telling readers a knowledge-graph check FAILED on `publication-workflow.md`
 * when it passed. A document carrying a measurement does not go stale loudly;
 * it goes stale by lying.
 *
 * So the page now says only what the corpus STRUCTURE says, and `docs-ui.js`
 * paints the verdict from the page's `qa-index.json`. This spec is about the
 * painting, and specifically about the three states it must keep apart:
 *
 *   - **determined** — a row with a verdict: `fail` / `warn` / `pass`;
 *   - **determined-empty** — swept, and every criterion came back `n/a`;
 *   - **could-not-determine** — the index would not load, or holds no row for
 *     this badge. Rendered `unknown`, never as either of the above.
 *
 * A fourth state is server-rendered and never reaches the painter: a subject
 * with NO sidecar is an inert `<span class="fa-qa-unswept">`. "Nobody checked"
 * and "somebody checked and nothing applied" are different facts and this repo
 * has paid for collapsing that kind of pair before.
 *
 * **The markup is the generator's own, lifted out of `docs/publication-workflow.md`.**
 * The verdicts are NOT the corpus's: `qa-badge-fixture.ts` sets them, and
 * throws by name if a node the spec addresses has left the page. A test whose
 * fixture is a live corpus verdict is the very defect this PR is about, and
 * `test/support/qa-fixture.ts` already records `main` going red once because
 * a content fix was correct.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = siteDirFor(ROOT);
const CSS = readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");

const PAGE_MD = join(ROOT, SITE, "publication-workflow.md");
const INDEX_JSON = join(ROOT, "test/results/witnesses/publication-workflow/qa-index.json");

/**
 * The nodes this spec drives, named once. Each is asserted to still exist —
 * `badgeRunFor` and `indexWithRows` throw by name rather than letting the spec
 * silently re-aim at whichever badge sorts first.
 */
const LOUD = "overview.block";
const EMPTY = "who-is-who.block";
const NO_ROW = "see-also.block";
const KG = "editing-and-the-hci-validation-gate.kg";

const PAGE_URL = "http://qa.test/page.html";
const INDEX_URL = "/assets/qa/publication-workflow/qa-index.json";

/** The verdicts this spec asserts on, set here rather than read off disk. */
const INDEX_BODY = indexWithRows(INDEX_JSON, {
  [LOUD]: { state: "fail", counts: { fail: 2, warn: 1, pass: 21, na: 26, unknown: 0 } },
  // The projector says `unswept` for "nothing ruled on this", whatever the
  // reason. By the time a ROW exists the subject has demonstrably been swept,
  // so the painter must render this as `empty` and not as the server's
  // never-checked `unswept`.
  [EMPTY]: { state: "unswept", counts: { fail: 0, warn: 0, pass: 0, na: 26, unknown: 0 } },
  [NO_ROW]: null,
  [KG]: { state: "pass", counts: { fail: 0, warn: 0, pass: 10, na: 0, unknown: 0 } },
});

function harness(badgeKeys: string[]): string {
  const rows = badgeKeys
    .map(
      (k, i) =>
        `<h2 id="n${i}">${k}</h2>\n` +
        `<p><a class="fa-node-edit" href="#">✎ Edit</a> ${badgeRunFor(PAGE_MD, k)}</p>`,
    )
    .join("\n");
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<style>${CSS}</style></head><body>` +
    `<div class="main-content" id="main-content"><h1>Harness</h1>${rows}</div>` +
    `<script>${JS}</script></body></html>`
  );
}

const ALL = [LOUD, EMPTY, NO_ROW, KG];

/**
 * The name Chromium itself computes, read out of the CDP accessibility tree.
 *
 * `Accessibility.getFullAXTree` is what a screen reader sees. Matched on a
 * SUBSTRING of the expected name rather than on a node index, because index
 * agreeing with identity is a coincidence of the current page — the same
 * lesson `test/support/qa-fixture.ts` records about marking `criteria[0]`.
 *
 * Returns `undefined` when no node carries it, which the caller asserts
 * against a real string. A helper that returned `""` for "not found" would
 * make an absent name and an empty one indistinguishable, which is the exact
 * failure this check exists to catch.
 */
async function axNameFor(page: Page, contains: string): Promise<string | undefined> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Accessibility.enable");
  const { nodes } = (await cdp.send("Accessibility.getFullAXTree")) as {
    nodes: Array<{ name?: { value?: string }; ignored?: boolean }>;
  };
  await cdp.detach();
  return nodes
    .filter((n) => !n.ignored)
    .map((n) => n.name?.value)
    .find((v): v is string => typeof v === "string" && v.includes(contains));
}

/** The badge for a node key, addressed by the attribute the painter reads. */
const badge = (key: string) => `.fa-qa-badge[data-qa-key="${key}"]`;

test.describe("the index loads", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("http://qa.test/**", (route) => {
      const url = route.request().url();
      if (url.endsWith("/page.html")) {
        return route.fulfill({ contentType: "text/html", body: harness(ALL) });
      }
      if (url.endsWith(INDEX_URL)) {
        return route.fulfill({ contentType: "application/json", body: INDEX_BODY });
      }
      return route.fulfill({ status: 404, body: "not found" });
    });
  });

  test("a determined verdict paints its own state, glyph and counts", async ({ page }) => {
    await page.goto(PAGE_URL);
    const b = page.locator(badge(LOUD));

    // The class the SERVER wrote is gone, and exactly one state class is on.
    await expect(b).toHaveClass(/fa-qa-fail/);
    await expect(b).not.toHaveClass(/fa-qa-pending/);
    await expect(b).not.toHaveClass(/fa-qa-pass/);
    // `aria-busy` is what says "still loading" to a screen reader. Leaving it
    // on a painted badge would keep announcing a verdict that has arrived.
    await expect(b).not.toHaveAttribute("aria-busy", "true");

    // `toBeVisible`, not `textContent`: DOM order is not what a reader sees,
    // and a glyph hidden by CSS would satisfy a text assertion.
    const glyph = b.locator(".fa-qa-glyph");
    await expect(glyph).toBeVisible();
    await expect(glyph).toHaveText("✕");

    // The COMPUTED accessible name, not the attribute. axe's `label` rule
    // checks markup and has passed an empty computed name on this site; the
    // counts are the whole content of this control, so they have to be in the
    // name a screen reader actually announces.
    await expect(b).toHaveAccessibleName(
      "Content QA: 2 fail, 1 warn, 21 pass, 26 n/a — open for witnesses",
    );

    // And again from CHROMIUM'S OWN accessibility tree, over CDP, because the
    // assertion above is Playwright computing the name itself. The two agreeing
    // is the evidence; either alone is a library's opinion.
    //
    // This is not belt-and-braces. axe's `label` rule accepts a non-empty
    // `placeholder` ATTRIBUTE and checks the attribute rather than the computed
    // name — it passed a search field with an empty accessible name on this
    // very site. A markup assertion cannot tell you what a screen reader says.
    const ax = await axNameFor(page, "2 fail, 1 warn");
    expect(ax).toBe("Content QA: 2 fail, 1 warn, 21 pass, 26 n/a — open for witnesses");
  });

  test("swept-and-nothing-applied is its own state, and it still opens", async ({ page }) => {
    await page.goto(PAGE_URL);
    const b = page.locator(badge(EMPTY));

    await expect(b).toHaveClass(/fa-qa-empty/);
    // NOT the server's never-checked state. These are different facts: one
    // subject has been ruled on and one has not, and the reader can act on
    // only one of them.
    await expect(b).not.toHaveClass(/fa-qa-unswept/);
    await expect(b).not.toHaveClass(/fa-qa-pass/);

    // No mark at all. A glyph here is a claim about a check that returned no
    // verdict — the reasoning the `·` was removed for in #274.
    await expect(b.locator(".fa-qa-glyph")).toHaveCount(0);
    await expect(b).toHaveAccessibleName(
      "Content QA: swept, and no criterion applied to this block — open for witnesses",
    );

    // Still a control, and still one that does something: the projection
    // behind it lists what did not apply. An inert badge here would be the
    // `<span>` the never-swept case correctly gets.
    await expect(b).toHaveRole("button");
    await expect(b).toBeEnabled();
  });

  test("an index with no row for a badge says so, and does not guess", async ({ page }) => {
    await page.goto(PAGE_URL);
    const b = page.locator(badge(NO_ROW));

    await expect(b).toHaveClass(/fa-qa-unknown/);
    for (const wrong of ["fa-qa-pass", "fa-qa-fail", "fa-qa-warn", "fa-qa-empty", "fa-qa-pending"]) {
      await expect(b).not.toHaveClass(new RegExp(wrong));
    }
    const glyph = b.locator(".fa-qa-glyph");
    await expect(glyph).toBeVisible();
    await expect(glyph).toHaveText("?");
    await expect(b).toHaveAccessibleName(
      "Content QA: could not determine — this page's verdict index could not be read",
    );
  });

  test("the knowledge-graph family is painted from the same index", async ({ page }) => {
    // One index per page serves every family on it. A `KG` badge reading its
    // own row is what stops the block badges' verdict being shown beside a
    // diagram — the two subjects are different and share a node id.
    await page.goto(PAGE_URL);
    const b = page.locator(badge(KG));
    await expect(b).toHaveClass(/fa-qa-pass/);
    await expect(b.locator(".fa-qa-tag")).toHaveText("KG");
    await expect(b).toHaveAccessibleName(
      "Knowledge-graph QA: 0 fail, 0 warn, 10 pass, 0 n/a — open for witnesses",
    );
  });

  test("a never-swept subject is server-rendered and the painter leaves it alone", async ({
    page,
  }) => {
    // Structure, not a verdict: whether a sidecar EXISTS is a file-existence
    // question the generator can answer, and answering it in the browser would
    // have collapsed "nobody checked" into "the fetch found nothing".
    await page.goto(PAGE_URL);
    const tr = page.locator(".fa-qa-badge.fa-qa-fam-translation").first();
    await expect(tr).toHaveClass(/fa-qa-unswept/);
    // Inert: a `<span>`, not a control. Asserted on the element rather than on
    // a role — Chromium computes no role at all for a `<span>` carrying only an
    // `aria-label`, so `toHaveRole` has nothing to compare and the fact that
    // matters here is that pressing it does nothing.
    expect(await tr.evaluate((n) => n.tagName)).toBe("SPAN");
    await expect(tr).not.toHaveAttribute("data-qa-index", /./);
    await expect(tr.locator(".fa-qa-glyph")).toHaveCount(0);
    await expect(tr).toHaveAccessibleName(
      "Translation QA: not swept — no sidecar for this block",
    );
  });
});

test.describe("the index does not load", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("http://qa.test/**", (route) => {
      const url = route.request().url();
      if (url.endsWith("/page.html")) {
        return route.fulfill({ contentType: "text/html", body: harness(ALL) });
      }
      // Including the index: this is the could-not-determine case at the
      // PAGE level rather than the row level.
      return route.fulfill({ status: 503, body: "upstream is down" });
    });
  });

  test("every badge on the page says it could not determine, and none says pass", async ({
    page,
  }) => {
    await page.goto(PAGE_URL);
    for (const key of ALL) {
      const b = page.locator(badge(key));
      await expect(b).toHaveClass(/fa-qa-unknown/);
      await expect(b).not.toHaveClass(/fa-qa-pass/);
      await expect(b).not.toHaveClass(/fa-qa-pending/);
      await expect(b.locator(".fa-qa-glyph")).toHaveText("?");
    }
  });

  test("a badge that could not be painted still opens, and the panel names the file", async ({
    page,
  }) => {
    // The two fetches are independent: the index failing must not disable the
    // control. `qaToggle` fetches the projection itself and reports which file
    // it could not read — a panel that opened empty would be indistinguishable
    // from a subject with nothing to report.
    await page.goto(PAGE_URL);
    const b = page.locator(badge(LOUD));
    await expect(b).toHaveClass(/fa-qa-unknown/);
    await b.click();
    const panel = page.locator(".fa-qa-panel-error").first();
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Could not load the QA detail");
    await expect(panel).toContainText("overview.block.json");
  });
});
