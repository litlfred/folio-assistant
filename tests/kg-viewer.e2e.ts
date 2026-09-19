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

  test("the interface is in English, because no catalogue is translated yet", async ({ page }) => {
    // The shipped state, asserted rather than assumed. Every
    // translations/<locale>/kg-viewer.po carries all 38 msgids with an empty msgstr,
    // so there is nothing to switch TO and no switcher is drawn: a control
    // with one option is furniture.
    await page.goto(PAGE);
    await expect(page.locator("#facets-h")).toHaveText("Kind");
    await expect(page.locator("#list-h")).toHaveText("Nodes");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("#langs")).toBeHidden();
    // No boundary note either: in English there is no boundary to draw.
    await expect(page.locator("#boundary")).toBeHidden();
  });

  test("asking for a language nobody has translated yet gets English, not a blank page", async ({ page }) => {
    // The failure this guards against is the one that ships today: with every
    // catalogue empty, EVERY string takes the fallback path. A lookup that
    // returned the empty msgstr instead of the msgid would render a page of
    // blank labels and no test would have been looking.
    await page.goto(`${PAGE}?lang=fr`);
    await expect(page.locator("#facets-h")).toHaveText("Kind");
    await expect(page.locator("#list-h")).toHaveText("Nodes");
    await expect(page.locator("#q")).toHaveAttribute("placeholder", "search name, id, title…");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("#meta")).toContainText(`${KG["@graph"].length} nodes`);
  });
});

/**
 * The half no shipped catalogue exercises.
 *
 * `scripts/tests/kg-viewer-fixture.ts` calls the REAL generator with a
 * catalogue of its own — a pseudolocalised, deliberately PARTIAL one under the
 * reserved tag `qaa`, so no real language is impersonated and the strings it
 * leaves out prove the English fallback. See that module for why the fixture
 * exists rather than a shipped translation.
 */
test.describe("kg viewer — with a catalogue", () => {
  execFileSync("bun", ["run", "scripts/tests/kg-viewer-fixture.ts"], { stdio: "inherit" });
  const FIXTURE = "/_kg/folio-assistant-i18n-fixture/index.html";

  test("the switcher appears once there is something to switch to", async ({ page }) => {
    await page.goto(FIXTURE);
    await expect(page.locator("#langs")).toBeVisible();
    // English first, and always offered: it is the msgid, so it is never
    // missing and it is the way back.
    await expect(page.locator(".lang").first()).toHaveText("English");
    await expect(page.locator('.lang[lang="qaa"]')).toHaveText("Qaa (fixture)");
    await expect(page.locator('.lang[lang="en"]')).toHaveAttribute("aria-pressed", "true");
  });

  test("choosing a language translates the chrome and turns the page", async ({ page }) => {
    await page.goto(FIXTURE);
    await page.locator('.lang[lang="qaa"]').click();
    await expect(page.locator("#list-h")).toHaveText("«Nodes»");
    await expect(page.locator("#facets-h")).toHaveText("«Kind»");
    await expect(page.locator("html")).toHaveAttribute("lang", "qaa");
    // Right to left, because a frame that does not turn with the language is
    // a translation of the words only.
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator('.lang[lang="qaa"]')).toHaveAttribute("aria-pressed", "true");
  });

  test("a string the catalogue does not carry falls back to English, not to blank", async ({ page }) => {
    await page.goto(`${FIXTURE}?lang=qaa`);
    // Translated:
    await expect(page.locator("#list-h")).toHaveText("«Nodes»");
    // Not translated, and therefore English — per string, not per page.
    await expect(page.locator("a.skip")).toHaveText("Skip to results");
    await expect(page.locator(".facet").first()).toContainText("All");
    await expect(page.locator("#meta")).toContainText(`${KG["@graph"].length} nodes`);
  });

  test("the page says where the translation stops, in the language chosen", async ({ page }) => {
    // The chrome is translated; node names, descriptions and property names
    // come from the corpus and cannot be reached from here. A screen that is
    // two-thirds translated and silent about it is worse than one that states
    // its edge — and the statement is itself translatable, because the person
    // who needs it is reading the translated page.
    await page.goto(`${FIXTURE}?lang=qaa`);
    const note = page.locator("#boundary");
    await expect(note).toBeVisible();
    await expect(note).toContainText("«The interface is shown in Qaa (fixture); the graph is not.»");
    // Unofficial, and it says so rather than letting a reader assume somebody
    // adjudicated it. That sentence is untranslated here, so it arrives in
    // English — which is the fallback doing its job inside a live sentence.
    await expect(note).toContainText("has not been reviewed by a person");
  });

  test("the provenance line's parts are isolated, so a count stays beside its noun", async ({ page }) => {
    // Found by LOOKING at the right-to-left render, not by a checker. The line
    // was "source commit · JSON-LD · nodes · commit dac179a6 · … 1148": the
    // digits are a weak run, the middots between parts are neutral, and the
    // bidi algorithm merged them and moved the number to the far end of the
    // line, away from the word it counted.
    //
    // Every assertion still passed while it was wrong, because textContent is
    // in DOM order whatever the display does — which is why this one measures
    // geometry.
    await page.goto(`${FIXTURE}?lang=qaa`);
    const parts = page.locator("#meta bdi");
    expect(await parts.count()).toBeGreaterThan(1);
    await expect(parts.first()).toHaveText(/^\d+ nodes$/);

    // In RTL the first part sits at the RIGHT, and the last to its left.
    const first = await parts.first().boundingBox();
    const last = await parts.last().boundingBox();
    expect(first!.x).toBeGreaterThan(last!.x);
  });

  test("the graph's own words stay in the graph's language", async ({ page }) => {
    // The other half of the boundary, asserted rather than described. If this
    // ever fails, the note above has become a lie.
    await page.goto(`${FIXTURE}?lang=qaa`);
    await page.locator("#q").fill("beans-cli");
    await page.locator("#list li button").first().click();
    await expect(page.locator(".detail h3")).toContainText("beans CLI");
    await expect(page.locator(".detail th", { hasText: /^satisfies$/ })).toHaveCount(1);
  });

  test("switching language redraws the panel that is open, not just the frame", async ({ page }) => {
    // The detail panel is built once per selection. A switcher that only
    // relabelled the chrome would leave the node the reader is looking at in
    // the language they just left.
    await page.goto(FIXTURE);
    await page.locator("#q").fill("beans-cli");
    await page.locator("#list li button").first().click();
    await expect(page.locator("#detail")).toHaveAttribute("aria-label", "Selected node");
    await page.locator('.lang[lang="qaa"]').click();
    await expect(page.locator("#detail")).toHaveAttribute("aria-label", "«Selected node»");
    await expect(page.locator(".detail h3")).toContainText("beans CLI");
  });

  test("the choice is remembered under the same key the docs site writes", async ({ page }) => {
    // fa-locale, not a second key: a reader who chose a language on the docs
    // site arrives here in it, and a reader who chooses here keeps it there.
    await page.goto(FIXTURE);
    await page.locator('.lang[lang="qaa"]').click();
    expect(await page.evaluate(() => localStorage.getItem("fa-locale"))).toBe("qaa");
    // ...and the address is shareable to somebody whose browser asks for
    // something else.
    expect(new URL(page.url()).searchParams.get("lang")).toBe("qaa");
    await page.goto(FIXTURE);
    await expect(page.locator("#list-h")).toHaveText("«Nodes»");
  });

  test("a language with no catalogue is not offered and not selected", async ({ page }) => {
    // A stale link or a browser set to Swedish is the ordinary case, and the
    // answer is the source language rather than an empty page.
    await page.goto(`${FIXTURE}?lang=sv`);
    await expect(page.locator("#list-h")).toHaveText("Nodes");
    await expect(page.locator('.lang[lang="sv"]')).toHaveCount(0);
  });

  test("an unreadable document says so in the reader's language, and is still not drawn as empty", async ({ page }) => {
    await page.route("**/folio-assistant.jsonld", (r) => r.fulfill({ status: 404, body: "" }));
    await page.goto(`${FIXTURE}?lang=qaa`);
    await expect(page.locator("#meta")).toContainText("could not load");
    await expect(page.locator(".detail")).toContainText("not an empty graph");
    // Three states, in every language: no facets and no list, because an
    // empty index and an unreadable document mean opposite things.
    await expect(page.locator(".facet")).toHaveCount(0);
    await expect(page.locator("#list li")).toHaveCount(0);
  });
});

test.describe("kg viewer — the failed fetch", () => {
  test("a document that cannot be fetched says so, and is never drawn as empty", async ({ page }) => {
    // Three states, not two. An empty index and a failed fetch look identical
    // on screen and mean opposite things.
    await page.route("**/folio-assistant.jsonld", (r) => r.fulfill({ status: 404, body: "" }));
    await page.goto(PAGE);
    await expect(page.locator("#meta")).toContainText("could not load");
    await expect(page.locator(".detail")).toContainText("not an empty graph");
  });
});
