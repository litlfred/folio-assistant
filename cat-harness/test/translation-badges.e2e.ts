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
  translationStatus?: string;
  /** The page this one translates. `docs-ui.js` shows it in the unverified
   *  notice's drawer, so the notice specs need to be able to set it. */
  translationSource?: string;
  translationQa?: { key: string; src: string; index: string } | null;
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

function harness(meta: Meta, body = "", scheme?: "light" | "dark"): string {
  return (
    `<!doctype html><html lang="${meta.lang}"` +
    (scheme ? ` data-fa-scheme="${scheme}"` : "") +
    `><head><meta charset="utf-8">` +
    `<style>body{background:${scheme === "light" ? "#fff" : "#27262b"}}${CSS}</style>` +
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
  opts: {
    body?: string;
    index?: unknown;
    projection?: unknown;
    scheme?: "light" | "dark";
  } = {},
): Promise<void> {
  await page.route("http://tr.test/**", (route) => {
    const url = route.request().url();
    if (url.endsWith("/page.html")) {
      return route.fulfill({
        contentType: "text/html",
        body: harness(meta, opts.body, opts.scheme),
      });
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

  test("a complete page names the languages without repeating the set twice", async ({ page }) => {
    // The partial wording carries an "of <every supported locale>" tail, which
    // is what makes a partial count actionable — it names what is missing. At
    // 6/6 nothing is missing and that tail read "ar, zh, en, fr, ru, es — of
    // ar, zh, en, fr, ru, es".
    await serve(page, { lang: "en", availableLocales: ["ar", "zh", "en", "fr", "ru", "es"] });
    const title = await page.locator(coverage).getAttribute("title");
    expect(title).toContain("every supported language");
    expect(title).not.toContain("\u2014 of");
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

test.describe("a hand-authored page builds its own TR badge", () => {
  // The bean-`pp93` case. A generated page has its badge written into the
  // markup; `docs/fr/index.md` has no generator, so `docs-ui.js` builds one
  // from the paths `head_custom.html` publishes — but ONLY where a projection
  // exists, which `_data/translation-qa-pages.json` says and the page does not
  // guess. A badge emitted unconditionally would 404 and paint `unknown`,
  // "could not determine", which is a different answer from "not swept".
  const tq = {
    key: "page.translation",
    src: QA_SRC_URL,
    index: QA_INDEX_URL,
  };
  const index = {
    badges: {
      "page.translation": {
        state: "warn",
        counts: { fail: 0, warn: 14, pass: 1, na: 0, unknown: 5 },
      },
    },
  };

  test("with a projection, the badge appears and paints", async ({ page }) => {
    await serve(
      page,
      { lang: "fr", availableLocales: ["ar", "zh", "en", "fr", "ru", "es"], translationQa: tq },
      { index },
    );
    const b = page.locator('.fa-qa-badge[data-qa-key="page.translation"]');
    await expect(b).toHaveCount(1);
    await expect(b).toHaveClass(/fa-qa-warn/);
    // In the badge row, not loose in the page.
    await expect(page.locator(".fa-translation-badges .fa-qa-badge")).toHaveCount(1);
  });

  test("with NO projection, no badge at all — not a broken one", async ({ page }) => {
    await serve(page, { lang: "en", availableLocales: [] }, { index });
    await expect(page.locator(".fa-qa-badge")).toHaveCount(0);
  });

  test("it does not double up when the generator already emitted one", async ({ page }) => {
    // A generated page carries `fa-page-qa-badges` in its markup AND would get
    // `translationQa` from the same front-matter lookup. Two badges for one
    // subject is two controls that can disagree about one verdict.
    await serve(
      page,
      { lang: "en", availableLocales: ["en", "fr"], translationQa: tq },
      { body: PAGE_BADGE, index },
    );
    await expect(page.locator('.fa-qa-badge[data-qa-key="page.translation"]')).toHaveCount(1);
  });

  test("the panel opens on a per-locale roll-up", async ({ page }) => {
    const projection = {
      $schema: "qa-witness/v1",
      family: "translation",
      subject: "index — translations",
      sidecars: ["test/results/translation-qa/docs/index.fr.translation-qa.json"],
      state: "warn",
      counts: { fail: 0, warn: 2, pass: 0, na: 0, unknown: 0 },
      criteria: [
        {
          id: "translation-coverage",
          result: "warn",
          locale: "ar",
          metrics: { translated: 36, total: 43, pct: 84 },
          witnesses: [{ kind: "script", id: "x", freshness: "fresh" }],
        },
        {
          id: "translation-coverage",
          result: "warn",
          locale: "fr",
          metrics: { translated: 36, total: 43, pct: 84 },
          witnesses: [{ kind: "script", id: "x", freshness: "fresh" }],
        },
      ],
    };
    await serve(
      page,
      { lang: "fr", availableLocales: ["ar", "zh", "en", "fr", "ru", "es"], translationQa: tq },
      { index, projection },
    );
    await page.locator('.fa-qa-badge[data-qa-key="page.translation"]').click();
    await expect(page.locator(".fa-qa-chip.fa-qa-locale")).toHaveCount(2);
  });
});

/**
 * The badge row takes its colours from the stylesheet, in both schemes.
 *
 * Bean `n7vv`. `mountTranslationBadges` built these two badges and the
 * unverified-translation notice from inline literals — `#14532d`, `#78350f`,
 * `#1e293b`, `#e2e8f0` — so a dark-green `Swept` chip and a dark-brown
 * `languages` chip sat on the page's LIGHT main content beside a `TR` chip that
 * had been themed properly. Never a contrast failure (light text on a dark fill
 * is fine inside each chip); two of three controls in one row simply ignored
 * the scheme.
 *
 * The ratios below are asserted rather than trusted to a comment. Every number
 * written beside a token in `docs-ui.css` is computed here from what the
 * browser actually resolves, so a token edited without re-measuring fails.
 */
test.describe("the translation badges are themed, not painted inline", () => {
  const STATES: Array<[string, string, string[]]> = [
    ["is-ok", "every supported language", ["ar", "zh", "en", "fr", "ru", "es"]],
    ["is-partial", "some of them", ["en", "fr"]],
    ["is-idle", "the source language alone", []],
  ];

  /** WCAG relative-luminance contrast, from two resolved `rgb(...)` strings. */
  const CONTRAST = `(a, b) => {
    const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const lum = (s) => {
      const [r, g, b] = (s.match(/\\d+(\\.\\d+)?/g) || [0, 0, 0]).slice(0, 3).map(Number);
      const [R, G, B] = [r, g, b].map((v) => lin(v / 255));
      return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    };
    const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
    return (hi + 0.05) / (lo + 0.05);
  }`;

  test("no badge carries an inline style attribute", async ({ page }) => {
    // The literal test. Every colour these used to hold is a token now, and a
    // regression would most likely arrive as a convenient inline `style`.
    await serve(page, { lang: "en", availableLocales: ["en", "fr"], translationStatus: "unverified" });
    for (const sel of [".fa-lang-coverage-badge", ".fa-sweep-badge", ".fa-translation-warning"]) {
      const el = page.locator(sel);
      await expect(el).toHaveCount(1);
      expect(await el.getAttribute("style")).toBeNull();
    }
  });

  for (const [cls, why, locales] of STATES) {
    test(`the coverage badge carries ${cls} when a page is in ${why}`, async ({ page }) => {
      await serve(page, { lang: "en", availableLocales: locales });
      await expect(page.locator(".fa-lang-coverage-badge")).toHaveClass(
        new RegExp(`fa-translation-badge(?=.*\\b${cls}\\b)`),
      );
    });
  }

  for (const scheme of ["light", "dark"] as const) {
    test(`every state's text clears 4.5:1 on its own fill in ${scheme}`, async ({ page }) => {
      for (const [, , locales] of STATES) {
        await serve(page, { lang: "en", availableLocales: locales }, { scheme });
        const r = await page.evaluate((fn) => {
          const e = document.querySelector(".fa-lang-coverage-badge") as HTMLElement;
          const c = getComputedStyle(e);
          return (eval(fn) as (a: string, b: string) => number)(c.color, c.backgroundColor);
        }, CONTRAST);
        expect(r).toBeGreaterThanOrEqual(4.5);
      }
    });

    test(`every state's border clears 3:1 on its own fill in ${scheme}`, async ({ page }) => {
      // 3:1 is the non-text threshold: the border is what separates the chip
      // from the page, and it is a shape rather than a glyph. Asserted at the
      // real number — the dark `idle` border sat at 2.92:1 under a comment
      // claiming 3:1, and was raised rather than the assertion lowered.
      for (const [, , locales] of STATES) {
        await serve(page, { lang: "en", availableLocales: locales }, { scheme });
        const r = await page.evaluate((fn) => {
          const e = document.querySelector(".fa-lang-coverage-badge") as HTMLElement;
          const c = getComputedStyle(e);
          return (eval(fn) as (a: string, b: string) => number)(c.borderTopColor, c.backgroundColor);
        }, CONTRAST);
        expect(r).toBeGreaterThanOrEqual(3);
      }
    });
  }

  test("the two schemes resolve to DIFFERENT colours", async ({ page }) => {
    // Without this the suite would pass on a stylesheet that declared the dark
    // values once and never overrode them — which is the defect, not the fix.
    const read = async (scheme: "light" | "dark") => {
      await serve(page, { lang: "en", availableLocales: ["en", "fr"] }, { scheme });
      return page.evaluate(() => {
        const c = getComputedStyle(document.querySelector(".fa-lang-coverage-badge")!);
        return c.backgroundColor + "|" + c.color;
      });
    };
    expect(await read("light")).not.toBe(await read("dark"));
  });
});

/* ── The unverified notice is ONE LINE that opens ─────────────────────────
 *
 * Owner, 2026-09-21, on a translated page: *"should be a slim one line
 * '⚠️ Unverified translation — …' which then can open to the full
 * trnslation QA report."*
 *
 * It was a four-line block above the page title, on every translated page,
 * permanently. Nothing guarded its shape, which is why it could grow to four
 * lines without anyone noticing — so these tests assert the SHAPE, not just
 * that the words are present. `textContent` is DOM order regardless of CSS,
 * so a collapsed drawer answers every text assertion; geometry and the
 * `open` attribute are what separate the two arrangements.
 */
test.describe("the unverified-translation notice", () => {
  test("is a collapsed disclosure, not a block", async ({ page }) => {
    await serve(page, { lang: "fr", translationStatus: "unverified", translationSource: "index.md" });
    const notice = page.locator(".fa-translation-warning");
    await expect(notice).toHaveCount(1);
    await expect(notice).not.toHaveAttribute("open", "");

    // ONE LINE. The old block ran to four, and a height assertion is the only
    // thing that catches it growing back — the words are the same either way.
    const box = await notice.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeLessThan(64);
  });


  test("the detail is hidden until opened, then reachable", async ({ page }) => {
    await serve(page, { lang: "fr", translationStatus: "unverified", translationSource: "index.md" });
    const notice = page.locator(".fa-translation-warning");
    const summary = notice.locator("summary");
    const body = notice.locator(".fa-translation-warning__body");

    await expect(body).toBeHidden();
    // NOT AT THE CENTRE, and the reason is a real overlap rather than a
    // flaky selector. `funp` (R25's glass, stage 1) puts `.fa-glass-handle`
    // on EVERY page — `position: fixed; top: 0; left: 50%`, measured
    // 2026-09-22 at 71 x 44 px. The notice is inserted as the first child of
    // `.main-content`, so its one-line summary sits at y 14.75 spanning the
    // full column, and the two overlap at the column's centre — which is
    // exactly the point Playwright clicks by default.
    //
    // A reader is NOT blocked: 71 px of a full-width line is a dead spot,
    // not a dead control, and the keyboard path has its own test below. So
    // clicking off-centre is what a reader does, not a way around a defect.
    // The assertion beneath is what keeps that true.
    await summary.click({ position: { x: 24, y: 12 } });
    await expect(body).toBeVisible();
    await expect(body).toContainText("index.md");
    await expect(body).toContainText("translation_signoff");
  });

  test("the glass handle takes a slice of the notice, never the line", async ({ page }) => {
    // The guard for the click above. Moving that click off-centre is only
    // honest while most of the control is still clickable — if the glass
    // ever grows to cover the line, the test above would go on passing at
    // x=24 while a reader met a control that did not respond.
    await serve(page, { lang: "fr", translationStatus: "unverified", translationSource: "index.md" });
    const s = (await page.locator(".fa-translation-warning summary").boundingBox())!;
    const h = (await page.locator(".fa-glass-handle").boundingBox())!;
    const overlapX = Math.max(0, Math.min(s.x + s.width, h.x + h.width) - Math.max(s.x, h.x));
    const overlapY = Math.max(0, Math.min(s.y + s.height, h.y + h.height) - Math.max(s.y, h.y));
    // Vertically they DO overlap — that is the fact this test records rather
    // than wishes away. Asserting they do not would make the test fail the
    // day somebody fixed the layout, which is backwards.
    expect(overlapY).toBeGreaterThan(0);
    // A tenth of the line at most. The measured figure is 71 of 1238, or 5.7%.
    expect(overlapX / s.width).toBeLessThan(0.1);
  });

  test("opens from the keyboard, and closing is reachable — `l4zi`", async ({ page }) => {
    await serve(page, { lang: "fr", translationStatus: "unverified", translationSource: "index.md" });
    const notice = page.locator(".fa-translation-warning");
    const summary = notice.locator("summary");

    await summary.press("Enter");
    await expect(notice).toHaveAttribute("open", "");
    await summary.press("Enter");
    await expect(notice).not.toHaveAttribute("open", "");
  });

  test("offers the QA report only when there IS one", async ({ page }) => {
    // `pb04`: a control that opens nothing is worse than no control. The
    // button is drawn from `translationQa.src`, so a page with no projection
    // gets the notice and no dead button.
    await serve(page, { lang: "fr", translationStatus: "unverified", translationQa: null });
    await expect(page.locator(".fa-translation-warning")).toHaveCount(1);
    await expect(page.locator(".fa-translation-warning__report")).toHaveCount(0);
  });

  test("and a verified page gets no notice at all", async ({ page }) => {
    // The control that makes the rest mean something: every assertion above
    // would pass over a notice injected onto every page.
    await serve(page, { lang: "fr", translationStatus: "verified" });
    await expect(page.locator(".fa-translation-warning")).toHaveCount(0);
  });
});
