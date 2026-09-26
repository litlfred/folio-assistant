import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { siteDirFor } from "../schemas/cat-harness.ts";

/**
 * The left-hand navbar shows the SELECTED locale, and nothing else.
 *
 * Reported by the owner, 2026-09-19:
 *
 *   "i have english selected, but i see the translated pages in LHS navbar.
 *    the fr/ ru/ etc. sub-dirs need to be explicitly labeled as translated
 *    content in the graph and not shown in navbar unless that locale is
 *    selected. (if not present, fall back to source language)"
 *
 * ## Why this is a harness page rather than the built site
 *
 * `_config.yml` uses `remote_theme: just-the-docs/just-the-docs`, UNPINNED and
 * fetched at build time, and the site cannot be built here. The same
 * limitation `docs-ui.js`'s own header states applies: these tests cover the
 * behaviour against the markup just-the-docs emits, reproduced here, and NOT
 * the integration with whatever that theme emits next month.
 *
 * What is NOT reproduced is the half of the fix that is not JavaScript:
 * `nav_exclude: true` keeps the translated pages out of the static nav in the
 * first place. That is Jekyll's to honour and is checked in the unit tests
 * instead (`content/pipeline/translation-index.test.ts`), which walk for pages
 * declaring a non-source `lang` and fail if any has stopped carrying it. A
 * harness that hand-writes the nav, as this one does, could "verify" that rule
 * by simply not putting the French item in — so it does not try.
 *
 * ## Geometry, not textContent
 *
 * `textContent` is DOM order and says nothing about what is on screen: an
 * element hidden by CSS still reports its text. Every visibility assertion
 * below is `toBeVisible()` or a `boundingBox()`, and every absence assertion
 * names the item it expects gone rather than counting what is left.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = siteDirFor(ROOT);
const CSS = readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");
const QR = readFileSync(join(ROOT, SITE, "assets/js/vendor/qrcode.js"), "utf8");

/**
 * The fixture is DERIVED FROM THE CORPUS, not copied out of it.
 *
 * `docs/_data/translations.json` is a live verdict about the tree: it changes
 * the moment somebody adds a locale or a translated page. Pinning today's
 * contents here would make this a test of what the corpus said on the day it
 * was written — the trap AGENTS.md calls out — so the two source pages the
 * assertions name are looked up in the real index at test time, and the test
 * says so out loud if either has gone.
 */
const INDEX = JSON.parse(
  readFileSync(join(ROOT, SITE, "_data/translations.json"), "utf8"),
) as {
  sourceLocale: string;
  locales: string[];
  pages: Record<
    string,
    {
      sourceUrl: string;
      sourceTitle: string;
      translations: Record<string, { url: string; title: string; dir: string; status: string }>;
    }
  >;
};

/** The home page's entry, by the key the generator computes for `/`. */
const HOME = INDEX.pages[""];
/** A page nested under a parent, so the swap is exercised below a `has_children`. */
const GUIDE = INDEX.pages["guides/agent-onboarding"];

/**
 * A nav item with no translation in ANY locale — the fallback case.
 *
 * Named, not counted, and the naming is the author's design: if the page is
 * ever translated this test fails loudly rather than silently verifying
 * nothing, which is the correct direction to fail in.
 *
 * **It was `getting-started`, and it fired exactly as designed.** Bean `t8g3`
 * (issue #206) is translating the docs site page by page and reached it in
 * `#1371`. The failure surfaced here on 2026-09-26 only because
 * `docs/_data/translations.json` was regenerated: main's committed index listed
 * **2** pages against the tree's **7**, so this test had been passing on a
 * stale index — the "silently verifying nothing" state the paragraph above
 * exists to prevent. The signal was correct and the index was late.
 *
 * `detangle` verified before being named: a real page at `docs/detangle.md`,
 * absent from the regenerated index's keys, and no `docs/<locale>/detangle.md`.
 * It is an internal page rather than a user-facing one, so it should be among
 * the last the campaign reaches — a guess about their ordering, said as one.
 *
 * **The fixture's design does not survive this campaign, and that is the real
 * finding.** "Name a real untranslated page, fail loudly if it changes" is
 * right for a slow corpus and wrong while every page is being translated: it
 * fails on each batch and the failure says nothing about the code under test.
 * Deriving the subject from the index at run time would keep the author's
 * intent — never silently verify nothing — while failing loudly only at the
 * state that actually matters, which is NO untranslated page left. That is a
 * change to this test's design and belongs to its author, so it is raised
 * rather than made.
 *
 * **If `detangle` is ever translated, do not just move this a third time.**
 * Same page and same reasoning as `#1370`, deliberately, so the two branches
 * agree rather than collide.
 */
const UNTRANSLATED = { key: "detangle", url: "/detangle.html", title: "Detangle" };

/** just-the-docs' nav markup, reduced to what the filter touches. */
function harness(indexIsland: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
  body { margin: 0; }
  .side-bar { position: fixed; top: 0; left: 0; width: 16.5rem; height: 100%;
              display: flex; flex-flow: column nowrap; align-items: flex-end;
              background: #27262b; color: #fff; }
  .site-header { width: 100%; max-height: 3.75rem; overflow: hidden; display: flex; align-items: center; }
  .site-title { flex: 1; }
  .site-nav { width: 100%; overflow-y: auto; }
  .nav-list { list-style: none; margin: 0; padding: 0; }
  .nav-list-link { display: block; padding: 4px 8px; color: #fff; }
  ${CSS}
</style>
<script type="application/json" id="fa-translation-meta">{"lang":"en","supportedLocales":["ar","zh","en","fr","ru","es"],"availableLocales":[]}</script>
${indexIsland}
</head><body>
  <div class="side-bar">
    <div class="site-header"><a class="site-title">folio-assistant</a></div>
    <nav class="site-nav" aria-label="Main">
      <ul class="nav-list">
        <li class="nav-list-item"><a href="${HOME.sourceUrl}" class="nav-list-link">${HOME.sourceTitle}</a></li>
        <li class="nav-list-item"><a href="${UNTRANSLATED.url}" class="nav-list-link">${UNTRANSLATED.title}</a></li>
        <li class="nav-list-item">
          <a href="/guides/" class="nav-list-link">Authoring guides</a>
          <ul class="nav-list">
            <li class="nav-list-item"><a href="${GUIDE.sourceUrl}" class="nav-list-link">${GUIDE.sourceTitle}</a></li>
          </ul>
        </li>
      </ul>
    </nav>
  </div>
  <div class="main"><div class="main-content"><h1>x</h1></div></div>
  <script>${QR}<\/script>
  <script>${JS}<\/script>
</body></html>`;
}

const ISLAND = `<script type="application/json" id="fa-translation-index">${JSON.stringify({
  baseurl: "",
  index: INDEX,
})}</script>`;

/** Load the harness with a locale already remembered, as the sidebar bar stores it. */
async function open(page: Page, island: string, locale: string | null): Promise<void> {
  await page.addInitScript((loc) => {
    try {
      if (loc === null) localStorage.removeItem("fa-locale");
      else localStorage.setItem("fa-locale", loc as string);
    } catch { /* a browser with storage blocked still gets the source language */ }
  }, locale);
  // A REAL origin first, then the harness markup into it.
  //
  // `setContent` alone leaves the page at `about:blank`, where `localStorage`
  // throws and `new URL("/", location.href)` has no base to resolve against —
  // so every href would be skipped and all of these tests would pass by doing
  // nothing at all. `test-server.mjs` (playwright.config.ts) is already
  // serving the repo root; any real origin will do.
  await page.goto("/");
  await page.setContent(harness(island));
}

const nav = ".site-nav";

test.describe("the navbar shows the selected locale", () => {
  test.beforeAll(() => {
    // The fixture is derived, so say plainly when the derivation came up empty
    // rather than asserting against `undefined` three tests later.
    expect(HOME, "docs/_data/translations.json has no entry for the home page").toBeTruthy();
    expect(GUIDE, "no entry for guides/agent-onboarding").toBeTruthy();
    expect(Object.keys(HOME.translations), "the home page has no translations at all").toContain("fr");
  });

  test("English selected: no translated page is in the navbar", async ({ page }) => {
    await open(page, ISLAND, "en");
    await expect(page.locator(nav)).toHaveAttribute("data-fa-nav-locale", "en");

    // The reported bug, asserted by NAME in both directions: the English item
    // is on screen, and every locale's title for the same page is nowhere.
    const home = page.locator(`${nav} a`, { hasText: HOME.sourceTitle }).first();
    await expect(home).toBeVisible();
    expect((await home.boundingBox())!.height).toBeGreaterThan(0);
    await expect(home).toHaveAttribute("href", HOME.sourceUrl);

    for (const [loc, t] of Object.entries(HOME.translations)) {
      await expect(
        page.locator(`${nav} a[href="${t.url}"]`),
        `${loc} home page is in the navbar with English selected`,
      ).toHaveCount(0);
    }
    for (const [loc, t] of Object.entries(GUIDE.translations)) {
      await expect(
        page.locator(`${nav} a[href="${t.url}"]`),
        `${loc} guide is in the navbar with English selected`,
      ).toHaveCount(0);
    }
  });

  test("French selected: the French page replaces the English one, in place", async ({ page }) => {
    const fr = HOME.translations.fr;
    await open(page, ISLAND, "fr");
    await expect(page.locator(nav)).toHaveAttribute("data-fa-nav-locale", "fr");

    const link = page.locator(`${nav} a[href="${fr.url}"]`);
    await expect(link).toBeVisible();
    await expect(link).toHaveText(fr.title);
    await expect(link).toHaveAttribute("lang", "fr");

    // IN PLACE OF, not in addition to. The English target is gone, and the
    // item is still the FIRST nav link — same position, not appended.
    await expect(
      page.locator(`${nav} a[href="${HOME.sourceUrl}"]`),
      "the English home item survived alongside the French one",
    ).toHaveCount(0);
    await expect(page.locator(`${nav} a`).first()).toHaveAttribute("href", fr.url);
  });

  test("French selected: a nested item under a parent is swapped too", async ({ page }) => {
    const fr = GUIDE.translations.fr;
    await open(page, ISLAND, "fr");
    const link = page.locator(`${nav} .nav-list .nav-list a[href="${fr.url}"]`);
    await expect(link).toBeVisible();
    await expect(link).toHaveText(fr.title);
    // Still nested under its parent rather than promoted to the top level.
    await expect(page.locator(`${nav} a`, { hasText: "Authoring guides" })).toBeVisible();
  });

  test("Arabic selected: the item carries its own dir, not the page's", async ({ page }) => {
    const ar = HOME.translations.ar;
    test.skip(!ar, "no Arabic translation of the home page in the corpus");
    await open(page, ISLAND, "ar");
    const link = page.locator(`${nav} a[href="${ar.url}"]`);
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("dir", "rtl");
    // Visible means laid out, not merely present: an RTL item inside an LTR
    // column is exactly where a text-only assertion would pass on a box that
    // had collapsed to nothing.
    const box = (await link.boundingBox())!;
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  test("a page with no translation falls back to the source language", async ({ page }) => {
    await open(page, ISLAND, "fr");
    const link = page.locator(`${nav} a[href="${UNTRANSLATED.url}"]`);
    await expect(link).toBeVisible();
    await expect(link).toHaveText(UNTRANSLATED.title);
    // Recorded as a deliberate fallback rather than as something overlooked.
    await expect(link).toHaveAttribute("data-fa-translated", "source");
    // And the fallback is per ITEM: the translated items beside it still are.
    await expect(page.locator(`${nav} a[href="${HOME.translations.fr.url}"]`)).toHaveAttribute(
      "data-fa-translated",
      "fr",
    );
  });

  test("no index published: the navbar is left exactly as built", async ({ page }) => {
    // The third state. "Could not determine the translation set" must NEVER
    // render as "this folio has no translations" -- and must not silently
    // rewrite anything either.
    await open(page, "", "fr");
    await expect(page.locator(nav)).toHaveAttribute("data-fa-nav-index", "unknown");
    await expect(page.locator(nav)).not.toHaveAttribute("data-fa-nav-locale", /.*/);
    const home = page.locator(`${nav} a[href="${HOME.sourceUrl}"]`);
    await expect(home).toBeVisible();
    await expect(home).toHaveText(HOME.sourceTitle);
  });

  test("index published but null: also unknown, not empty", async ({ page }) => {
    // What `{{ site.data.translations | jsonify }}` emits when the data file
    // was absent at build time. Distinct from an index with no pages.
    const island =
      '<script type="application/json" id="fa-translation-index">{"baseurl":"","index":null}</script>';
    await open(page, island, "fr");
    await expect(page.locator(nav)).toHaveAttribute("data-fa-nav-index", "unknown");
    await expect(page.locator(`${nav} a[href="${HOME.sourceUrl}"]`)).toBeVisible();
  });

  test("an index with no pages is DETERMINED empty, not unknown", async ({ page }) => {
    const island =
      '<script type="application/json" id="fa-translation-index">' +
      JSON.stringify({ baseurl: "", index: { sourceLocale: "en", locales: [], pages: {} } }) +
      "</script>";
    await open(page, island, "fr");
    // Same navbar as the unknown case, deliberately a different answer: this
    // build looked and found nothing, the other could not look.
    await expect(page.locator(nav)).toHaveAttribute("data-fa-nav-index", "empty");
    await expect(page.locator(`${nav} a[href="${HOME.sourceUrl}"]`)).toBeVisible();
  });

  test("a remembered locale the index has never heard of is not honoured", async ({ page }) => {
    await open(page, ISLAND, "tlh");
    // Labelling the nav `tlh` while every item is in English would be a claim
    // the page cannot support.
    await expect(page.locator(nav)).toHaveAttribute("data-fa-nav-locale", INDEX.sourceLocale);
    await expect(page.locator(`${nav} a[href="${HOME.sourceUrl}"]`)).toBeVisible();
  });

  test("nothing remembered: the source language", async ({ page }) => {
    await open(page, ISLAND, null);
    await expect(page.locator(nav)).toHaveAttribute("data-fa-nav-locale", INDEX.sourceLocale);
    await expect(page.locator(`${nav} a[href="${HOME.sourceUrl}"]`)).toBeVisible();
  });
});
