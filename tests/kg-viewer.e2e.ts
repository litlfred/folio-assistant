/**
 * The knowledge-graph viewer, rendered.
 *
 * `AGENTS.md` is emphatic that a human cannot assess a rendered artefact from a
 * description of it. The same applies to the agent that built it: "the HTML
 * looks right" is not evidence that 1111 nodes load, that an edge is
 * clickable, or that a failed fetch says so rather than drawing an empty
 * graph. This drives the real page in the real browser.
 *
 * Served by `test-server.mjs` from the repo root, so the fixtures are the
 * actual generated artefacts under `_kg/` — not a hand-written stand-in that
 * could agree with the test while disagreeing with what ships.
 *
 * @module tests/kg-viewer.e2e
 */
import { test, expect } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

// `_kg/` is gitignored — it is build output, not a fixture to commit. Generate
// it if absent so the suite runs from a clean checkout with one command, and
// so the artefacts under test are the ones the deploy actually emits rather
// than a stand-in that could agree with the test and disagree with what ships.
//
// The viewer lives one level DOWN from the graph — `_kg/<stub>/index.html`
// reading `../<stub>.jsonld` — mirroring the published layout, where
// `<base>/<stub>/` is the directory that makes the extensionless
// `<base>/<stub>` a page Pages can serve. Driving the real relative path is
// the point: a viewer that resolved its document correctly in a flat fixture
// and wrongly in the deployed tree is exactly the failure a stand-in hides.
for (const [file, script] of [
  ["_kg/folio-assistant.jsonld", "scripts/kg-export.ts"],
  ["_kg/folio-assistant/index.html", "scripts/kg-viewer.ts"],
] as const) {
  if (!existsSync(file)) execFileSync("bun", ["run", script], { stdio: "inherit" });
}

/**
 * The page under test, named once.
 *
 * It was inlined at every `page.goto`. When the layout moved from
 * `_kg/index.html` to `_kg/<stub>/index.html`, two tests added on a branch kept
 * the old path and went green locally against a leftover `_kg/` — a constant
 * would have moved all of them together.
 */
const PAGE = "/_kg/folio-assistant/index.html";

const KG = JSON.parse(readFileSync("_kg/folio-assistant.jsonld", "utf-8")) as {
  "@graph": Array<Record<string, unknown>>;
  counts: Record<string, number>;
  undeclaredTerms: Array<{ term: string }>;
  sourceCommit?: string;
};

test.describe("kg viewer", () => {
  test("loads the sibling document and reports the real node count", async ({ page }) => {
    await page.goto(PAGE);
    // The count comes from the document, so this fails if the page silently
    // fetched nothing — which is the failure mode that matters most.
    await expect(page.locator("#meta")).toContainText(`${KG["@graph"].length} nodes`);
    await expect(page.locator("#meta")).not.toContainText("could not load");
  });

  test("every type in the export is offered as a facet, with its count", async ({ page }) => {
    await page.goto(PAGE);
    for (const [type, n] of Object.entries(KG.counts)) {
      // Name THEN count — the facet button's DOM order, which is also the
      // order a screen reader reads ("ProcessNode 374", not "374 ProcessNode").
      // These assertions matched count-then-name until the accessibility pass
      // reordered the markup, and they are how that reorder was caught.
      const facet = page.locator(".facet", { hasText: new RegExp(`^${type}${n}$`) });
      await expect(facet, `facet for ${type}`).toHaveCount(1);
    }
  });

  test("filtering by a facet narrows the list to that kind", async ({ page }) => {
    await page.goto(PAGE);
    await page.locator(".facet", { hasText: /^Tool\d+$/ }).click();
    const kinds = await page.locator("#list li button .kind").allTextContents();
    expect(kinds.length).toBeGreaterThan(0);
    expect(new Set(kinds)).toEqual(new Set(["Tool"]));
  });

  test("selecting a node shows its properties and its IRI", async ({ page }) => {
    await page.goto(PAGE);
    await page.locator("#q").fill("beans-cli");
    await page.locator("#list li button").first().click();
    await expect(page.locator(".detail h3")).toContainText("beans CLI");
    await expect(page.locator(".detail .iri")).toContainText("#tool/beans-cli");
    await expect(page.locator(".detail th", { hasText: /^satisfies$/ })).toHaveCount(1);
  });

  test("an edge is a link you can follow, and following it changes the panel", async ({ page }) => {
    await page.goto(PAGE);
    await page.locator("#q").fill("beans-cli");
    await page.locator("#list li button").first().click();
    const before = await page.locator(".detail h3").textContent();
    // `satisfies` is an @id-coerced term, so its values render as buttons.
    await page.locator(".detail td .link").first().click();
    await expect(page.locator(".detail h3")).not.toHaveText(String(before));
    await expect(page.locator(".detail .iri")).toContainText("#");
  });

  test("back-links are computed, so a node says what points AT it", async ({ page }) => {
    await page.goto(PAGE);
    await page.locator("#q").fill("todo-manager");
    await page.locator("#list li button").first().click();
    // Several Tools satisfy this skill; none of them is stored on the skill.
    await expect(page.locator(".detail th", { hasText: /referenced by/ })).toHaveCount(1);
  });

  test("properties missing from the @context are marked, not quietly shown", async ({ page }) => {
    // The viewer's job includes reporting what the graph is missing — 34
    // property names a JSON-LD processor drops. Displaying them unmarked would
    // hide exactly what the first real consumer is for.
    expect(KG.undeclaredTerms.length).toBeGreaterThan(0);
    await page.goto(PAGE);
    await page.locator(".facet", { hasText: /^ProcessNode\d+$/ }).click();
    await page.locator("#list li button").first().click();
    await expect(page.locator(".detail .note")).toContainText("not in the");
    await expect(page.locator(".detail th.undeclared").first()).toBeVisible();
  });

  test("a one-hop neighbourhood is drawn, and is not the whole graph", async ({ page }) => {
    await page.goto(PAGE);
    await page.locator("#q").fill("beans-cli");
    await page.locator("#list li button").first().click();
    const circles = page.locator(".detail svg circle");
    const n = await circles.count();
    expect(n).toBeGreaterThan(1);
    // Capped deliberately: a hairball answers no question. 14 neighbours + self.
    expect(n).toBeLessThanOrEqual(15);
    await expect(page.locator(".detail svg circle.self")).toHaveCount(1);
  });

  test("the page links back to the document it renders, relatively", async ({ page }) => {
    // RELATIVE, not composed. The page already fetched its sibling by this
    // path, so the link is right wherever the page is served from — canonical
    // or STAGING/<slug>/. Composing <base>/kg/<stub>.jsonld from the
    // declaration would be a second answer to a question already answered,
    // and the one that breaks on a preview.
    //
    // The path is `../folio-assistant.jsonld`, not a bare sibling name: the
    // viewer lives one level down at `_kg/<stub>/index.html` and the graph sits
    // in the parent. That layout changed under this branch, and these two tests
    // kept passing locally against a STALE `_kg/` while failing in CI — which
    // is the same class of defect as the one this PR fixes in `qa-panel`, so it
    // is worth saying out loud: `_kg/` is gitignored build output, and a suite
    // run against a leftover copy of it is not evidence about what ships.
    await page.goto(PAGE);
    const src = page.locator("#meta a").first();
    await expect(src).toHaveAttribute("href", "../folio-assistant.jsonld");
    // A name that says what it gets you: "JSON-LD" alone names a syntax.
    await expect(src).toHaveAttribute("aria-label", /Download this graph as JSON-LD/);
    // And it actually resolves — from the PAGE's own directory, the way a
    // browser would follow it, rather than from a path this test composes.
    const res = await page.request.get(new URL(
      String(await src.getAttribute("href")),
      new URL(PAGE, page.url()),
    ).toString());
    expect(res.status()).toBe(200);
  });

  test("the source commit is linked when the export knew it", async ({ page }) => {
    await page.goto(PAGE);
    const commit = KG.sourceCommit;
    if (commit === undefined) {
      // Third state: a tarball or export-stripped checkout produces a complete
      // graph that cannot say which commit it came from. Absent, not wrong.
      await expect(page.locator("#meta a")).toHaveCount(1);
      return;
    }
    await expect(page.locator("#meta a", { hasText: "source commit" })).toHaveAttribute("href", commit);
  });

  test("a document that cannot be fetched says so, and is never drawn as empty", async ({ page }) => {
    // Three states, not two. An empty index and a failed fetch look identical
    // on screen and mean opposite things.
    await page.route("**/folio-assistant.jsonld", (r) => r.fulfill({ status: 404, body: "" }));
    await page.goto(PAGE);
    await expect(page.locator("#meta")).toContainText("could not load");
    await expect(page.locator(".detail")).toContainText("not an empty graph");
  });
});
