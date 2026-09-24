import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { applyVerdicts, kgAuditorManifest, sidecar, sidecarWithVerdicts } from "./support/qa-fixture.js";
import { siteDirFor } from "../schemas/cat-harness.ts";

/**
 * The QA icon has to OPEN, and what it opens has to name its witnesses.
 *
 * Bean `g6yr` shipped the icon as a dead `<span>` with counts in a tooltip, and
 * closed with the honest note that how it looks was never verified. This spec
 * is the missing half: a real browser, the real `docs-ui.js`, and the real
 * `qa-witness/v1` files the generator wrote — not a hand-made fixture that can
 * agree with the code while the code disagrees with the corpus.
 *
 * Every assertion below is about a fact a reader would otherwise have to take
 * on trust:
 *
 *  - a criterion's verdict is reachable at all;
 *  - the witness behind it is named, with the hash of the checker that ran;
 *  - a verdict measured against a file that has since changed says STALE, and
 *    names the file that moved;
 *  - a field the sidecar does not record prints "not recorded" rather than
 *    blank — `kg-audit.ts` writes no timestamp, and a blank cell reads as a
 *    value the reader missed;
 *  - a fetch that fails says so, naming the file. A panel that opens empty is
 *    indistinguishable from a subject with nothing to report.
 *
 * The page is served through `page.route` rather than from a committed fixture:
 * the harness is the theme's structure plus one icon, and the JSON is read off
 * disk, so nothing here can drift from what the generator produces.
 */

// `import.meta.dir` is a Bun extension and undefined under Node, which is what
// Playwright runs this spec with.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = siteDirFor(ROOT);
const CSS = readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");

/** A block sidecar from the corpus, and two states derived from it. */
const CORPUS_PATH = join(
  ROOT,
  "test/results/witnesses/crdm-methodology/what-is-not-built-yet.block.json",
);

/**
 * The same document with one criterion made to FAIL.
 *
 * **This used to be served straight from the corpus, and that is why the suite
 * went red on `main` at 78a399ee5.** The block really did carry a failing
 * `voice-status-leak` — the assertions below were written against it — and
 * #302 ("Adjudicate the remaining 12 voice findings") legitimately FIXED that
 * finding. The sidecar is now 22 pass and 26 n/a with nothing failing, so
 * "worst criterion first" had no worst criterion to put first, and a test of
 * the PANEL failed because the CONTENT got better.
 *
 * The file already knew this shape of mistake: {@link STALE_JSON} exists
 * because that block's verdict was stale on the day it was written and stopped
 * being stale when the sweep re-ran. The same reasoning applies to a failing
 * row and was simply not applied to it. A test of how the panel RENDERS a
 * failure must not depend on the corpus containing one — otherwise every
 * content fix is a CI failure, which teaches exactly the wrong lesson.
 *
 * The row is the real one, copied from the sidecar as it stood at c8fbad385^,
 * so the hash and witness the assertions name are the generator's own output
 * rather than invented values.
 */
/** The criterion this spec drives, named once so both fixtures agree. */
const LOUD_ID = "voice-status-leak";

/**
 * The same document with that one criterion made to FAIL.
 *
 * **This used to be served straight from the corpus, and that is why the suite
 * went red on `main` at 78a399ee5.** The block really did carry a failing
 * `voice-status-leak` — the assertions below were written against it — and
 * #302 legitimately FIXED that finding. The sidecar became 22 pass and 26 n/a
 * with nothing failing, so "worst criterion first" had no worst criterion to
 * put first, and a test of the PANEL failed because the CONTENT got better.
 *
 * The file already knew this shape of mistake: {@link STALE_JSON} exists
 * because that block's verdict was stale on the day it was written and stopped
 * being stale when the sweep re-ran. The same reasoning applies to a failing
 * row and was simply not applied to it.
 *
 * **FLIPPED WHERE IT SITS — criterion 19 of 48 — rather than hoisted to 0.**
 * That is what makes "worst criterion first" an assertion about the panel. Put
 * the failure at index 0 and the row the spec reads is the first row in
 * DOCUMENT order, so a panel that sorted nothing at all would pass; that is
 * precisely how the original verbatim fixture managed to assert nothing here.
 *
 * The witness stays the corpus's own rather than being written out as a
 * literal: test 2 asserts the witness's own `scriptHash` (see {@link SCRIPT_HASH}),
 * and a frozen copy keeps passing after the voice checker changes — a fixture
 * drifting from the corpus is the exact defect this section exists to fix.
 *
 * Built through `test/support/qa-fixture.ts`, which throws by name if
 * `LOUD_ID` ever leaves the sidecar. Bean `iumj`.
 */
const BLOCK_JSON = sidecarWithVerdicts(CORPUS_PATH, [
  {
    id: LOUD_ID,
    result: "fail",
    severity: "critical",
    evidence: [
      "content/docs/crdm-methodology/what-is-not-built-yet.md:36: **Not yet implemented:**",
    ],
    // The script verdict alone. The agent witness that overturned it IS the
    // adjudication, and a criterion shown as failing has not been adjudicated
    // yet — keeping both would render a panel no sweep ever produced.
    witnessKinds: ["script"],
  },
]);

/**
 * How many rows the panel folds away: everything but the one failure.
 *
 * Computed from the fixture for the same reason the fixture is computed at all
 * — the number belongs to this document, and a literal `47` here is one more
 * way for a content change to turn a panel test red.
 */
const FOLDED_COUNT = (JSON.parse(BLOCK_JSON) as { criteria: unknown[] }).criteria.length - 1;

/**
 * The checker hash the loud row's script witness recorded, READ from the
 * fixture rather than written out.
 *
 * It was the literal `"5af6856733f3"`. That is a value the corpus holds, not a
 * property of the panel: re-sweeping after any edit to the voice checker
 * rewrites it, and the panel test would go red on a correct content change —
 * bean `iumj`'s defect in the one string nobody had derived. What the test is
 * about is that the panel SHOWS the recorded hash, whatever it is.
 */
const SCRIPT_HASH = (() => {
  const doc = JSON.parse(BLOCK_JSON) as {
    criteria: Array<{ id: string; witnesses?: Array<{ kind: string; scriptHash?: string }> }>;
  };
  const h = doc.criteria
    .find((c) => c.id === LOUD_ID)
    ?.witnesses?.find((w) => w.kind === "script")?.scriptHash;
  if (!h) {
    throw new Error(
      `fixture: \`${LOUD_ID}\` has no script witness with a scriptHash in ${CORPUS_PATH} — ` +
        `the witness assertion would have nothing to compare against.`,
    );
  }
  return h;
})();

/**
 * The same document with that criterion's witness marked stale.
 *
 * Derived from {@link BLOCK_JSON}, not from the pristine corpus, so the row
 * marked stale and the row the spec clicks are the SAME criterion rather than
 * two that happen to coincide. **By id, like the fixture above** — marking
 * `criteria[0]` worked only while the failure was forced to sit there, and
 * index and render order coinciding is what let this test pass earlier while
 * asserting a stale badge on a row it had never marked.
 *
 * Whether a hash comparison yields `stale` is settled in `qa-witness.test.ts`
 * against files it controls; what belongs HERE is whether the panel RENDERS
 * that state — which must not depend on the corpus happening to hold an
 * out-of-date verdict on the day the suite runs.
 */
const STALE_JSON = applyVerdicts(BLOCK_JSON, [{ id: LOUD_ID, stale: { changed: ["md"] } }]);

/**
 * A KG sidecar: one auditor, no timestamp, a `sha256:`-prefixed hash.
 *
 * VERBATIM, through `sidecar()`, because every assertion on it is SHAPE —
 * "not recorded" for a field `kg-audit.ts` never writes, and the subject name.
 * No test below asserts a verdict off this document; if one ever needs to,
 * it goes through `sidecarWithVerdicts` like {@link BLOCK_JSON}.
 * `scripts/tests/e2e-corpus-coupling.test.ts` fails a raw `readFileSync` of a
 * corpus path in any e2e spec, so the helper is the declaration of intent.
 */
const KG_JSON = sidecar(
  join(ROOT, "test/results/witnesses/publication-workflow/editing-and-the-hci-validation-gate.kg.json"),
);

/**
 * The kg auditor, as the site serves it — bean `mcdj`.
 *
 * A kg witness no longer carries `scriptHash` in every criterion, so the panel
 * fetches this document once per page instead. Read verbatim and asserted by
 * VALUE rather than as a literal, for `iumj`'s reason: the hash is a thing the
 * corpus holds, and writing it out here would turn the next correct edit to
 * `kg-audit.ts` into a red panel test.
 */
const KG_MANIFEST = kgAuditorManifest(join(ROOT, "skills/kg-qa.manifest.json"));

const PAGE_URL = "http://qa.test/page.html";

function badge(family: string, state: string, src: string, label: string): string {
  return (
    `<button type="button" class="fa-qa-badge fa-qa-${state} fa-qa-fam-${family}" ` +
    `data-qa-family="${family}" data-qa-src="${src}" aria-expanded="false" ` +
    `title="${label}" aria-label="${label}">` +
    `<span class="fa-qa-tag">${family === "kg" ? "KG" : "QA"}</span>` +
    `<span class="fa-qa-glyph" aria-hidden="true">●</span></button>`
  );
}

/**
 * The generator's own output shape: an `h2`, then a paragraph holding the Edit
 * link and the icon row. The panel must land AFTER that paragraph — a `<div>`
 * inside a `<p>` is not valid HTML and the browser would reparent it.
 */
const HARNESS = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<style>${CSS}</style></head><body>
<div class="main-content" id="main-content">
  <h1>Harness</h1>
  <h2 id="node-a">A block node</h2>
  <p><a class="fa-node-edit" href="#">✎ Edit</a>
     <span class="fa-qa-badges">${badge("block", "fail", "/assets/qa/block.json", "Content QA: 1 fail, 0 warn, 21 pass, 26 n/a — open for witnesses")}</span></p>
  <p>Narrative of the block.</p>
  <h2 id="node-b">A diagram node</h2>
  <p><a class="fa-node-edit" href="#">✎ Edit</a>
     <span class="fa-qa-badges">${badge("kg", "fail", "/assets/qa/kg.json", "Knowledge-graph QA: 1 fail, 0 warn, 5 pass, 1 n/a — open for witnesses")}</span></p>
  <h2 id="node-stale">A node whose verdict has gone stale</h2>
  <p><a class="fa-node-edit" href="#">\u270E Edit</a>
     <span class="fa-qa-badges">${badge("block", "fail", "/assets/qa/stale.json", "Content QA: 1 fail \u2014 open for witnesses")}</span></p>
  <h2 id="node-c">A node whose projection is missing</h2>
  <p><a class="fa-node-edit" href="#">✎ Edit</a>
     <span class="fa-qa-badges">${badge("block", "pass", "/assets/qa/gone.json", "Content QA: open for witnesses")}</span></p>
</div>
<script>${JS}</script></body></html>`;

/** Whether THIS test serves the auditor manifest. Reset before each. */
let serveManifest = false;

test.beforeEach(async ({ page }) => {
  serveManifest = false;
  await page.route("http://qa.test/**", (route) => {
    const url = route.request().url();
    if (url.endsWith("/page.html")) {
      return route.fulfill({ contentType: "text/html", body: HARNESS });
    }
    if (url.endsWith("/assets/qa/block.json")) {
      return route.fulfill({ contentType: "application/json", body: BLOCK_JSON });
    }
    if (url.endsWith("/assets/qa/stale.json")) {
      return route.fulfill({ contentType: "application/json", body: STALE_JSON });
    }
    if (url.endsWith("/assets/qa/kg.json")) {
      return route.fulfill({ contentType: "application/json", body: KG_JSON });
    }
    /* The manifest is served ONLY when a spec opts in, so the DEFAULT for
     * every kg test below is the manifest missing. That is deliberate: the
     * fallback path is the one that must never take the panel down, and a
     * fixture that always supplies the file would have covered only the happy
     * case while the 404 is what a stale deploy actually serves. */
    if (url.endsWith("/assets/qa/kg-qa.manifest.json")) {
      return serveManifest
        ? route.fulfill({ contentType: "application/json", body: KG_MANIFEST.json })
        : route.fulfill({ status: 404, body: "not found" });
    }
    // Everything else — including `gone.json` — is a 404, on purpose.
    return route.fulfill({ status: 404, body: "not found" });
  });
});

test("a block icon opens its sidecar, worst criterion first", async ({ page }) => {
  await page.goto(PAGE_URL);
  const icon = page.locator(".fa-qa-fam-block").first();
  await expect(icon).toHaveAttribute("aria-expanded", "false");
  await icon.click();

  const panel = page.locator(".fa-qa-panel").first();
  await expect(panel).toBeVisible();
  await expect(icon).toHaveAttribute("aria-expanded", "true");

  // The panel is a SIBLING of the paragraph, not a child of it.
  const parentTag = await panel.evaluate((n) => n.parentElement?.tagName);
  expect(parentTag).toBe("DIV");

  // Worst first: the failing criterion is the first row, and it is not folded
  // away with the 47 that pass or do not apply.
  const firstRow = panel.locator(".fa-qa-crit").first();
  await expect(firstRow.locator(".fa-qa-chip").first()).toHaveText("fail");
  await expect(firstRow.locator(".fa-qa-crit-id")).toHaveText("voice-status-leak");
  await expect(firstRow.locator(".fa-qa-chip", { hasText: "critical" })).toBeVisible();

  // The passing bulk is behind one labelled control that states its own count.
  //
  // DERIVED, not pinned. `47` was a literal here, which is a property of the
  // corpus — how many criteria this one block happens to carry — not of the
  // panel. Perturbing the sidecar showed the assertion still failing after the
  // failing row was made synthetic, so the corpus dependency this test was
  // fixed for survived in the one number nobody looked at.
  await expect(panel.locator(".fa-qa-more")).toContainText(String(FOLDED_COUNT));
  await expect(panel.locator(".fa-qa-crit-list").nth(1)).toBeHidden();
});

test("a criterion expands to the witness that ruled on it, with the checker's hash", async ({
  page,
}) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-qa-fam-block").first().click();
  const row = page.locator(".fa-qa-crit").first();
  await expect(row).toHaveAttribute("aria-expanded", "false");
  await row.click();
  await expect(row).toHaveAttribute("aria-expanded", "true");

  const witness = page.locator(".fa-qa-witness").first();
  await expect(witness).toBeVisible();
  await expect(witness).toHaveClass(/fa-qa-kind-script/);
  await expect(witness.locator(".fa-qa-chip-kind")).toHaveText("script");
  await expect(witness.locator(".fa-qa-witness-id")).toHaveText(
    // NOT prefixed. This is the id a WITNESS RECORDED, not a path to run: QA
    // sidecars name the checker relative to the instance that audited them, so
    // the recorded string does not move when the instance's directory does.
    // Prefixed by mistake on 2026-09-19 in the same pass that correctly
    // prefixed `bun run` invocations two lines away.
    "content/pipeline/qa-checkers-voice.ts",
  );
  // The hash of the checker's own source at audit time — the thing that says
  // whether the verdict came from the logic now in the tree.
  await expect(witness).toContainText("checker source hash");
  await expect(witness).toContainText(SCRIPT_HASH);
  // Evidence is quoted verbatim out of the content, and reaches the page
  // through textContent — if it were concatenated into markup it would be the
  // string that closes a tag.
  await expect(page.locator(".fa-qa-evidence pre").first()).toContainText(
    "**Not yet implemented:**",
  );
});

test("a verdict measured against a file that has since changed says STALE, and names the file", async ({
  page,
}) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-qa-fam-block").nth(1).click();
  await page.locator(".fa-qa-crit").first().click();

  const witness = page.locator(".fa-qa-witness").first();
  await expect(witness.locator(".fa-qa-fresh-stale")).toHaveText("STALE");
  // Which input moved, not just that something did.
  await expect(witness.locator(".fa-qa-changed")).toContainText("changed since review");
  await expect(witness.locator(".fa-qa-changed li").first()).toHaveText("md");
});

test("a field the sidecar does not record prints 'not recorded', never blank", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-qa-fam-kg").first().click();
  await page.locator(".fa-qa-panel .fa-qa-crit").first().click();

  const witness = page.locator(".fa-qa-witness").first();
  // `kg-audit.ts` records no timestamp and no repo SHA. Both are stated as
  // absent; a blank cell would read as a value the reader failed to notice.
  const when = witness.locator(".fa-qa-field", { hasText: "when" }).first();
  await expect(when.locator(".fa-qa-absent")).toHaveText("not recorded");
  await expect(witness).toContainText("not recorded");
});

test("a 404 projection says so and names the file", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-qa-fam-block").nth(2).click();
  const panel = page.locator(".fa-qa-panel-error");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Could not load the QA detail");
  await expect(panel.locator("code")).toContainText("gone.json");
});

test("the panel closes from its own button, from the icon, and from Escape", async ({ page }) => {
  await page.goto(PAGE_URL);
  const icon = page.locator(".fa-qa-fam-block").first();

  await icon.click();
  await page.locator(".fa-qa-close").first().click();
  await expect(page.locator(".fa-qa-panel")).toHaveCount(0);
  // Focus returns to the icon that opened it — a reader who cannot easily
  // point must not have to hunt for where the keyboard went.
  await expect(icon).toBeFocused();
  await expect(icon).toHaveAttribute("aria-expanded", "false");

  await icon.click();
  await icon.click();
  await expect(page.locator(".fa-qa-panel")).toHaveCount(0);

  await icon.click();
  await expect(page.locator(".fa-qa-panel")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.locator(".fa-qa-panel")).toHaveCount(0);
});

test("two icons on one page open independently", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.locator(".fa-qa-fam-block").first().click();
  await page.locator(".fa-qa-fam-kg").first().click();
  await expect(page.locator(".fa-qa-panel")).toHaveCount(2);
  // Each panel reports its own subject, so a reader with both open can tell
  // which verdict belongs to which node.
  await expect(page.locator(".fa-qa-subject").first()).toContainText("crdm-what_is_not_built_yet");
  await expect(page.locator(".fa-qa-subject").nth(1)).toContainText("Process_Editing");
});

/* ── The kg auditor comes from the manifest, not from the witness ──────────
 *
 * Bean `mcdj`, the owner's ruling 2026-09-24. Both directions, because the
 * interesting one is the failure: a provenance field that cannot be resolved
 * must not cost the reader the verdicts, which are the point of the panel.
 */

test("a kg criterion shows the auditor hash fetched from the manifest", async ({ page }) => {
  serveManifest = true;
  await page.goto(PAGE_URL);
  await page.locator(".fa-qa-fam-kg").first().click();
  const witness = page.locator(".fa-qa-witness").first();
  await expect(witness).toContainText("checker source hash");
  // By VALUE from the manifest, never as a literal — see `KG_MANIFEST`.
  await expect(witness).toContainText(KG_MANIFEST.scriptHash.replace(/^sha256:/, "").slice(0, 12));
});

test("a kg panel whose manifest 404s still renders, and says 'not recorded'", async ({ page }) => {
  // `serveManifest` stays false: the manifest is absent, which is what a stale
  // deploy serves. The verdicts are already in hand by then, so refusing to
  // render them over a missing provenance field would trade the finding for
  // the footnote.
  await page.goto(PAGE_URL);
  await page.locator(".fa-qa-fam-kg").first().click();
  const panel = page.locator(".fa-qa-panel").first();
  await expect(panel).toBeVisible();
  await expect(panel.locator(".fa-qa-crit").first()).toBeVisible();
  const witness = page.locator(".fa-qa-witness").first();
  await expect(witness).toContainText("checker source hash");
  await expect(witness).toContainText("not recorded");
});
