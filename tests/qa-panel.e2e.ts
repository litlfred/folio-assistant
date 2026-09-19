import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
const CSS = readFileSync(join(ROOT, "docs/assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, "docs/assets/js/docs-ui.js"), "utf8");

/** The real generator output this suite's fixtures are derived from. */
const CORPUS_JSON = readFileSync(
  join(ROOT, "docs/assets/qa/crdm-methodology/what-is-not-built-yet.block.json"),
  "utf8",
);

/**
 * The same document with its one `voice-status-leak` finding put back.
 *
 * This was served straight from the corpus, where that criterion WAS failing.
 * PR #302 adjudicated all 26 `voice-*` findings to zero — correctly; this block
 * is titled "What is not built yet" and `**Not yet implemented:**` is the
 * heading over its inventory of gaps, not a work-tracker marker that escaped
 * into prose. So the sweep now records 48 criteria and no failure, and these
 * two specs failed for exactly the reason the sibling `STALE_JSON` below was
 * already synthesised: **whether the panel renders a failing row must not
 * depend on the corpus happening to hold a failure on the day the suite runs.**
 * A clean sweep is the system working.
 *
 * The shape still comes off disk, so the panel is still exercised against what
 * the generator really writes; only the verdict is put back. The adjudicating
 * agent witness is dropped from that one criterion, restoring the pre-#302
 * state in which the script that found it is the first witness — which is what
 * the witness assertions below are about.
 */
const BLOCK_JSON = (() => {
  const doc = JSON.parse(CORPUS_JSON) as {
    counts: Record<string, number>;
    criteria: Array<{
      id: string;
      result: string;
      severity?: string;
      evidence?: string[];
      witnesses: Array<{ kind: string }>;
    }>;
  };
  const c = doc.criteria.find((x) => x.id === "voice-status-leak");
  if (!c) {
    // Never silently pass: a fixture that lost its subject would leave every
    // assertion below testing the first alphabetical row instead.
    throw new Error("fixture: `voice-status-leak` is no longer in the sidecar");
  }
  c.result = "fail";
  c.severity = "critical";
  c.witnesses = c.witnesses.filter((w) => w.kind === "script");
  // `file:line: <quote>`, the form `qa-checkers-voice.ts` documents at its
  // head. The line is the one the adjudicating witness itself cites, and it is
  // still line 36 of the block — checked, not assumed.
  c.evidence = [
    "content/docs/crdm-methodology/what-is-not-built-yet.md:36: **Not yet implemented:**",
  ];
  doc.counts.fail = 1;
  doc.counts.pass -= 1;
  return JSON.stringify(doc);
})();
/**
 * The same document with its witness marked stale.
 *
 * This was served straight from the corpus, where that block's verdict WAS
 * stale — measured at 17:33 against an `.md` edited at 19:06 the same day.
 * Re-running the sweep cleared it, which is the system behaving correctly and
 * this test then failing for the right reason. Whether a hash comparison yields
 * `stale` is settled in `qa-witness.test.ts` against files it controls; what
 * belongs HERE is whether the panel renders that state — which must not depend
 * on the corpus happening to hold an out-of-date verdict on the day the suite
 * runs.
 */
const STALE_JSON = (() => {
  const doc = JSON.parse(CORPUS_JSON) as {
    criteria: Array<{ witnesses: Array<{ freshness: string; changed?: string[] }> }>;
  };
  const w = doc.criteria[0]!.witnesses[0]!;
  w.freshness = "stale";
  w.changed = ["md"];
  return JSON.stringify(doc);
})();

/** A KG sidecar: one auditor, no timestamp, a `sha256:`-prefixed hash. */
const KG_JSON = readFileSync(
  join(ROOT, "docs/assets/qa/publication-workflow/editing-and-the-hci-validation-gate.kg.json"),
  "utf8",
);

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
     <span class="fa-qa-badges">${badge("block", "fail", "/assets/qa/block.json", "Content QA: 1 fail, 0 warn, 22 pass, 25 n/a — open for witnesses")}</span></p>
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

test.beforeEach(async ({ page }) => {
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
  await expect(panel.locator(".fa-qa-more")).toContainText("47");
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
    "content/pipeline/qa-checkers-voice.ts",
  );
  // The hash of the checker's own source at audit time — the thing that says
  // whether the verdict came from the logic now in the tree.
  await expect(witness).toContainText("checker source hash");
  await expect(witness).toContainText("5af6856733f3");
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
