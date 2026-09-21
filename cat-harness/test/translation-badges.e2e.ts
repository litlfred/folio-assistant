import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { siteDirFor } from "../schemas/cat-harness.ts";
import { UN_LOCALES } from "../schemas/translation.ts";

/**
 * What the reader is told about translation, at the top of every page.
 *
 * Two defects this spec exists to keep fixed, both from issue #687.
 *
 * **The source language is a language.** The coverage badge read `0/5` on a
 * page authored in English on a six-UN-language site, because both halves of
 * that fraction excluded the source locale — the denominator was hardcoded to
 * `supported.length - 1`, and the numerator came from `available_locales`,
 * which the generator derives by resolving `translations/<locale>/<stem>.po`, a
 * lookup the source language can never satisfy. The same key had also drifted
 * into two meanings between the generated and the hand-authored halves of the
 * corpus, and `docs/fr/index.md` rendered `6/5 languages` — a numerator larger
 * than its denominator, which is what such a disagreement looks like once it
 * reaches a reader. Both front-matter conventions are exercised below, and both
 * must now produce the same answer.
 *
 * **A page carries ONE badge row.** The page-level `TR` badge is
 * server-rendered by `gen-docs-pages.ts` — whether a page's blocks carry any
 * translation verdict is structure, not a verdict — and `docs-ui.js` lifts it
 * into the coverage/sweep row it builds in the same place. If that lift
 * regressed the page would grow a second row under the title, so the hoist is
 * asserted rather than left to look right.
 *
 * The fixtures are written here, never read off the corpus: a spec whose
 * expected value is a live measurement goes red when the corpus gets better,
 * which `test/support/qa-fixture.ts` records `main` doing once already.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = siteDirFor(ROOT);
const CSS = readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");

const PAGE_URL = "http://tr.test/page.html";
const QA_INDEX_URL = "/assets/qa/harness/qa-index.json";
const QA_SRC_URL = "/assets/qa/harness/page.translation.json";

interface Meta {
  lang: string;
  availableLocales?: string[];
  supportedLocales?: string[];
  sweep?: Record<string, unknown>;
}

/**
 * The page-level badge exactly as `gen-docs-pages.ts` emits it.
 *
 * Kept in this spec rather than lifted off a generated page: the corpus has one
 * such badge today and it would disappear the moment its single French sidecar
 * did, taking the coverage with it.
 */
const PAGE_BADGE =
  `<p><span class="fa-qa-badges fa-page-qa-badges">` +
  `<button type="button" class="fa-qa-badge fa-qa-pending fa-qa-fam-translation" ` +
  `data-qa-family="translation" data-qa-key="page.translation" ` +
  `data-qa-label="Translation QA" data-qa-noun="page" ` +
  `data-qa-src="${QA_SRC_URL}" data-qa-index="${QA_INDEX_URL}" ` +
  `aria-expanded="false" aria-busy="true" title="Translation QA: loading the verdict…" ` +
  `aria-label="Translation QA: loading the verdict…">` +
  `<span class="fa-qa-tag">TR</span>` +
  `<span class="fa-qa-glyph" aria-hidden="true">…</span></button></span></p>`;

function harness(meta: Meta, body = ""): string {
  return (
    `<!doctype html><html lang="${meta.lang}"><head><meta charset="utf-8">` +
    `<style>${CSS}</style>` +
    `<script type="application/json" id="fa-translation-meta">${JSON.stringify(meta)}<\/script>` +
    `</head><body>` +
    `<div class="main-content" id="main-content"><h1>Harness</h1>${body}</div>` +
    `<script>${JS}<\/script></body></html>`
  );
}

/** Serve one page, and optionally the QA index and projection behind it. */
async function serve(
  page: Page,
  meta: Meta,
  opts: { body?: string; index?: unknown; projection?: unknown } = {},
): Promise<void> {
  await page.route("http://tr.test/**", (route) => {
    const url = route.request().url();
    if (url.endsWith("/page.html")) {
      return route.fulfill({ contentType: "text/html", body: harness(meta, opts.body) });
    }
    if (url.endsWith(QA_INDEX_URL) && opts.index !== undefined) {
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(opts.index) });
    }
    if (url.endsWith(QA_SRC_URL) && opts.projection !== undefined) {
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(opts.projection),
      });
    }
    return route.fulfill({ status: 404, body: "not found" });
  });
  await page.goto(PAGE_URL);
}

const coverage = ".fa-lang-coverage-badge";

test.describe("the coverage badge counts the language the page is written in", () => {
  test("an untranslated English page is 1/6, not 0/5", async ({ page }) => {
    await serve(page, { lang: "en", availableLocales: [] });
    await expect(page.locator(coverage)).toContainText(`1/${UN_LOCALES.length} languages`);
  });

  test("the fraction's denominator is every supported locale, not one fewer", async ({ page }) => {
    // Read off the schema rather than written as `6`: the assertion is that the
    // denominator IS the supported set, and a literal would keep passing if the
    // set changed underneath it.
    await serve(page, { lang: "en", availableLocales: [] });
    const text = await page.locator(coverage).innerText();
    expect(text).not.toContain(`/${UN_LOCALES.length - 1}`);
  });

  test("a page with one translation is 2/6 — the source language and the translation", async ({
    page,
  }) => {
    await serve(page, { lang: "en", availableLocales: ["en", "fr"] });
    await expect(page.locator(coverage)).toContainText("2/6 languages");
  });

  test("the PO-derived list, which omits the source locale, still counts it", async ({ page }) => {
    // The shape `gen-docs-pages.ts` used to stamp, and that a downstream folio
    // on an older generator still carries. The page's own `lang` supplies what
    // the list cannot, so the two conventions converge at the point of use.
    await serve(page, { lang: "en", availableLocales: ["fr"] });
    await expect(page.locator(coverage)).toContainText("2/6 languages");
  });

  test("a translated page stamped with all six reads 6/6, never 6/5", async ({ page }) => {
    // `docs/fr/index.md`, which rendered a numerator larger than its
    // denominator until the `- 1` came out.
    await serve(page, {
      lang: "fr",
      availableLocales: ["ar", "zh", "en", "fr", "ru", "es"],
    });
    const text = await page.locator(coverage).innerText();
    expect(text).toContain("6/6 languages");
    expect(text).not.toContain("6/5");
  });

  test("a locale outside the supported set cannot inflate the count", async ({ page }) => {
    await serve(page, {
      lang: "en",
      availableLocales: ["fr", "tlh"],
      supportedLocales: ["en", "fr"],
    });
    await expect(page.locator(coverage)).toContainText("2/2 languages");
  });

  test("source-language-only says so, rather than 'no translations available'", async ({
    page,
  }) => {
    await serve(page, { lang: "en", availableLocales: [] });
    const title = await page.locator(coverage).getAttribute("title");
    expect(title).toContain("not yet translated");
    // The old wording claimed the page was available in nothing at all.
    expect(title).not.toContain("No translations available");
  });
});

test.describe("the language bar knows which language the page is in", () => {
  test("a French page offers French as current, not as untranslated", async ({ page }) => {
    await serve(page, {
      lang: "fr",
      availableLocales: ["ar", "zh", "en", "fr", "ru", "es"],
    });
    const fr = page.locator(".fa-page-lang-tab", { hasText: "FR" }).first();
    await expect(fr).toHaveClass(/is-current/);
    await expect(fr).not.toHaveClass(/is-unavailable/);
  });

  test("English is NOT clickable on a folio that has no English", async ({ page }) => {
    // The bar hardcoded `loc === "en"` as "always available". On an instance
    // authored in French with no English translation that offered a link to a
    // page which does not exist.
    await serve(page, {
      lang: "fr",
      availableLocales: ["fr", "es"],
      supportedLocales: ["en", "fr", "es"],
    });
    const en = page.locator(".fa-page-lang-tab", { hasText: "EN" }).first();
    await expect(en).toHaveClass(/is-unavailable/);
  });
});

test.describe("the page-level translation badge joins the badge row", () => {
  const index = {
    badges: {
      "page.translation": {
        state: "warn",
        counts: { fail: 0, warn: 1, pass: 2, na: 0, unknown: 1 },
      },
    },
  };

  test("it is lifted into the row under the title, leaving no second row", async ({ page }) => {
    await serve(page, { lang: "en", availableLocales: ["en", "fr"] }, { body: PAGE_BADGE, index });
    await expect(page.locator(".fa-translation-badges .fa-qa-badge")).toHaveCount(1);
    // The emptied wrapper and the paragraph kramdown put it in both go: left
    // behind, the paragraph keeps its margins and opens a gap under the title
    // that reads as a rendering fault.
    await expect(page.locator(".fa-page-qa-badges")).toHaveCount(0);
  });

  test("it still paints its verdict after being moved", async ({ page }) => {
    await serve(page, { lang: "en", availableLocales: ["en", "fr"] }, { body: PAGE_BADGE, index });
    const b = page.locator('.fa-qa-badge[data-qa-key="page.translation"]');
    await expect(b).toHaveClass(/fa-qa-warn/);
    await expect(b.locator(".fa-qa-glyph")).toHaveText("!");
  });

  test("it stands on its own when the badge row is not built", async ({ page }) => {
    // No `fa-translation-meta`, so `mountTranslationBadges` returns early. The
    // badge must remain where the generator put it rather than vanishing —
    // server-rendered markup that depends on a script to be visible is markup
    // that disappears whenever the script does not run.
    await page.route("http://tr.test/**", (route) => {
      const url = route.request().url();
      if (url.endsWith("/page.html")) {
        return route.fulfill({
          contentType: "text/html",
          body:
            `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
            `<style>${CSS}</style></head><body>` +
            `<div class="main-content" id="main-content"><h1>Harness</h1>${PAGE_BADGE}</div>` +
            `<script>${JS}<\/script></body></html>`,
        });
      }
      if (url.endsWith(QA_INDEX_URL)) {
        return route.fulfill({ contentType: "application/json", body: JSON.stringify(index) });
      }
      return route.fulfill({ status: 404, body: "not found" });
    });
    await page.goto(PAGE_URL);
    await expect(page.locator(".fa-page-qa-badges .fa-qa-badge")).toHaveCount(1);
  });

  test("a rolled-up criterion says WHICH block it ruled on", async ({ page }) => {
    // The whole reason a page-level panel is legible: one panel carries
    // verdicts about many blocks, and a `fail` with no subject is a page-wide
    // alarm nobody can act on.
    const projection = {
      $schema: "qa-witness/v1",
      family: "translation",
      subject: "Harness — translations",
      sidecars: ["content/docs/harness/overview.fr.translation-qa.json"],
      state: "warn",
      counts: { fail: 0, warn: 1, pass: 2, na: 0, unknown: 1 },
      criteria: [
        {
          id: "translation-not-echo",
          result: "warn",
          locale: "fr",
          block: "sec:harness-overview",
          metrics: { echoed: 3, translated: 12 },
          witnesses: [
            {
              kind: "script",
              id: "content/pipeline/translation-block-qa.ts",
              freshness: "fresh",
            },
          ],
        },
      ],
    };
    await serve(
      page,
      { lang: "en", availableLocales: ["en", "fr"] },
      { body: PAGE_BADGE, index, projection },
    );
    await page.locator('.fa-qa-badge[data-qa-key="page.translation"]').click();
    await expect(page.locator(".fa-qa-chip.fa-qa-block")).toHaveText("sec:harness-overview");
    await expect(page.locator(".fa-qa-chip.fa-qa-locale")).toHaveText("fr");
  });
});
