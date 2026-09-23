import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { siteDirFor } from "../schemas/cat-harness.ts";

/**
 * The three JS-mounted navbar regions, as a browser actually builds them.
 *
 * Owner, 2026-09-22, giving the whole layout in one message: *"[x] should be
 * on the navbar w/ other icons, can make two lines avatar+name of
 * harness/catalogue/sub-grrraph as approrirate, the second line are the icons.
 * max is 6 and one for todos one for beans one for processes viewer/ (the
 * factory flow) one for KG viewer. next on navbar then is is library docs/ and
 * other controlled folders next would the navigation for the current harness
 * (per its rules)."*
 *
 * ## Why this file exists
 *
 * `scripts/tests/navbar.test.ts` covers the RAIL — `lib/navbar.ts` renders
 * markup for a mounted page and its output is a string a unit test can read.
 * The Jekyll sidebar is a different construction: `mountNavIconRow`,
 * `mountDocumentIndex` and `mountInstanceGraphs` build the same three regions
 * in the DOM at load, from `#fa-navbar-row`. None of that was covered at any
 * layer when it shipped in #959 — a gap measured after the fact, by grepping
 * the test tree for every class the round introduced and finding zero files.
 *
 * ## The regression it is most for
 *
 * `mountInstanceGraphs` MOVES `.site-nav` into a wrapper and `mountDocumentIndex`
 * inserts before `.site-nav`. Run in the wrong order, `insertBefore` gets a
 * reference node that is no longer a child of `.side-bar`, throws
 * `NotFoundError`, and takes the REST of `init()` with it — the QA panels and
 * the figures vanished from one DOM move, and every one of them looked like a
 * separate bug. So a `pageerror` listener is attached in every test here, not
 * just the one about ordering: a thrown exception in `init()` is silent in a
 * browser and turns the next assertion into a mystery.
 *
 * ## Three states, again
 *
 * `#fa-navbar-row` is `null` when the instance declares no `navbarIcons` and
 * inherits none, ABSENT when the template did not run, and an object when it
 * decided. The page must not draw an empty row for either of the first two:
 * that reports an un-migrated instance as a deliberate one, which is the same
 * collapse `schemas/navbar-icons.test.ts` guards one layer down.
 *
 * NO BACKTICKS INSIDE THE TEMPLATE LITERAL that builds the page — the whole
 * document is one, so a backtick anywhere in it, comments included, ends the
 * string and the file stops parsing as "No tests found" rather than as a
 * syntax error (bean `bmr0`).
 */

// `import.meta.dir` is a Bun extension and is undefined under Node, which is
// what Playwright runs the spec with.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = siteDirFor(ROOT);
const CSS = readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");
const QR = readFileSync(join(ROOT, SITE, "assets/js/vendor/qrcode.js"), "utf8");

const BASEURL = "/folio-assistant";

/**
 * The row this instance actually resolved — READ from the generated file.
 *
 * Not retyped. `action-tiles.e2e.ts` carries the argument in full: a fixture
 * that restates the value under test agrees with a wrong one and passes. This
 * spec asserts the row the site ships, so a declaration change that breaks the
 * page breaks the test.
 */
type NavbarRow = {
  icons: string[];
  hrefs: Record<string, string>;
  folders: { kind: string; path?: string }[];
};
const HARNESS = JSON.parse(readFileSync(join(ROOT, SITE, "_data/harness.json"), "utf8")) as {
  navbar: NavbarRow | null;
};
const LIVE = HARNESS.navbar;
if (LIVE === null) {
  // Not a skip. This instance IS the floor that declares the default, so a
  // null here means `cat-harness.json` lost its `navbarIcons` — the spec would
  // otherwise quietly stop testing the thing it is named for.
  throw new Error(
    "docs/_data/harness.json has navbar:null — cat-harness is the declared floor " +
      "and must resolve a row. Run `bun run docs:harness`.",
  );
}

/** A small hand-built row, for the cases the live one does not happen to hold. */
const CUSTOM: NavbarRow = {
  icons: ["close", "todos", "beans", "kg", "launcher"],
  // `beans` and `kg` deliberately have NO href: declared, not published.
  hrefs: { todos: "/todos/" },
  folders: [{ kind: "library", path: "/library/" }, { kind: "memory" }],
};

const HEADINGS =
  '<h1 id="t">Title</h1>' +
  '<h2 id="one">One</h2>' +
  '<h3 id="one-a">One A</h3>' +
  '<h2 id="two">Two</h2>' +
  "<h2>Unlinkable</h2>" +
  '<h4 id="deep">Too deep</h4>';

function page(row: NavbarRow | null | "absent" | "broken", main: string = HEADINGS): string {
  const script =
    row === "absent"
      ? ""
      : '<script type="application/json" id="fa-navbar-row">' +
        (row === "broken" ? "{not json" : JSON.stringify(row)) +
        "<\/script>";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <meta name="fa-baseurl" content="${BASEURL}">
  <style>
  body { margin: 0; }
  .side-bar { position: fixed; top: 0; left: 0; width: 16.5rem; height: 100%;
              display: flex; flex-flow: column nowrap; align-items: flex-end;
              background: #27262b; color: #fff; }
  .site-header { width: 100%; max-height: 3.75rem; overflow: hidden; display: flex; align-items: center; }
  .site-title { flex: 1; }
  .site-nav { width: 100%; overflow-y: auto; }
  ${CSS}
</style></head><body>
  ${script}
  <div class="side-bar">
    <div class="site-header"><a class="site-title">folio-assistant</a></div>
    <nav class="site-nav"><a href="#">Home</a></nav>
  </div>
  <div class="main"><div class="main-header"></div><div class="main-content">${main}</div></div>
  <script>window.jtd = { theme: "dark",
    getTheme: function () { return this.theme; },
    setTheme: function (t) { this.theme = t; } };<\/script>
  <script>${QR}<\/script>
  <script>${JS}<\/script>
</body></html>`;
}

/**
 * Load a fixture and hand back everything the page said on the way up.
 *
 * `pageerror` is the one that matters: an exception in `init()` produces a
 * half-built navbar and no other signal, so every test here asserts it is
 * empty rather than only the test that is about ordering.
 */
async function load(
  p: import("@playwright/test").Page,
  row: NavbarRow | null | "absent" | "broken",
  main?: string,
): Promise<{ errors: string[]; console: string[] }> {
  const errors: string[] = [];
  const logs: string[] = [];
  p.on("pageerror", (e) => errors.push(String(e)));
  p.on("console", (m) => logs.push(m.type() + ": " + m.text()));
  await p.setContent(page(row, main));
  return { errors, console: logs };
}

test.describe("the icon row — line 2 of the fixed top", () => {
  test("draws one slot per declared icon, in order, minus the CSS-placed [x]", async ({ page }) => {
    // `close` is a <label> for the pure-CSS open/close checkbox and must keep
    // working with no script at all, so the stylesheet places it into this
    // row's last slot while pinned. It stays in the declaration — the instance
    // still says six — and is SKIPPED here rather than dropped.
    const { errors } = await load(page, LIVE);
    expect(errors).toEqual([]);
    const drawn = LIVE.icons.filter((i) => i !== "close");
    await expect(page.locator(".fa-nav-icons .fa-nav-icon")).toHaveCount(drawn.length);
    expect(drawn).not.toContain("close");
    const labels = await page.locator(".fa-nav-icons .fa-nav-icon").evaluateAll((ns) =>
      ns.map((n) => n.getAttribute("aria-label")),
    );
    expect(labels).toEqual(["Todos", "Beans", "Processes", "Knowledge graph", "More actions"]);
  });

  test("FIVE DISTINCT drawings — a row where slots look alike says nothing", async ({ page }) => {
    // `glyphFor` falls back to one net glyph, which would have given four of
    // these five the same picture. The count of distinct markup is the check;
    // which drawing is which is a design decision this does not pin.
    await load(page, LIVE);
    const glyphs = await page
      .locator(".fa-nav-icons .fa-nav-icon")
      .evaluateAll((ns) => ns.map((n) => n.innerHTML));
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });

  test("a published destination is a link; a declared one that is not is NOT", async ({ page }) => {
    // `pb04`: a dead link invites a click and then reads as a broken site,
    // while a silent omission answers "where is beans" with nothing. So the
    // slot is rendered, and it is not an anchor.
    const { errors } = await load(page, CUSTOM);
    expect(errors).toEqual([]);
    const todos = page.locator('.fa-nav-icons [aria-label="Todos"]');
    await expect(todos).toHaveAttribute("href", "/todos/");
    for (const gap of ["Beans", "Knowledge graph"]) {
      const slot = page.locator('.fa-nav-icons [aria-label="' + gap + '"]');
      await expect(slot).toHaveCount(1);
      await expect(slot).toHaveClass(/fa-nav-icon--dead/);
      expect(await slot.evaluate((n) => n.tagName)).toBe("SPAN");
      await expect(slot).toHaveAttribute("title", /declared, with no published viewer/);
    }
  });

  test("the launcher drives the EXISTING panel — one toggle over one state", async ({ page }) => {
    // `mountActionTiles` owns the panel and its open/close state. A second
    // button with its own idea of whether the panel is open is the `l4zi`
    // defect from the other direction, so this one clicks that one.
    const { errors } = await load(page, LIVE);
    expect(errors).toEqual([]);
    await expect(page.locator(".fa-tiles-toggle")).toHaveCount(1);
    await expect(page.locator(".fa-tiles-toggle")).toHaveAttribute("aria-expanded", "false");
    await page.locator('.fa-nav-icons [aria-label="More actions"]').click();
    await expect(page.locator(".fa-tiles-toggle")).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".fa-tiles")).toBeVisible();
  });

  test("DECLARED NONE draws no row at all, and says so once", async ({ page }) => {
    // The third state. An empty row would report an un-migrated instance as a
    // deliberate one, so there is no row and the console carries the reason at
    // INFO — a declaration gap is an author's to fix, not a reader's.
    const { errors, console: logs } = await load(page, null);
    expect(errors).toEqual([]);
    await expect(page.locator(".fa-nav-icons")).toHaveCount(0);
    expect(logs.join("\n")).toContain("declares no navbarIcons");
  });

  test("an absent element is not a decision either — no row, and no noise", async ({ page }) => {
    const { errors, console: logs } = await load(page, "absent");
    expect(errors).toEqual([]);
    await expect(page.locator(".fa-nav-icons")).toHaveCount(0);
    // Nothing to report: the template did not run, which a reader cannot act
    // on and an author sees in the build.
    expect(logs.join("\n")).not.toContain("declares no navbarIcons");
  });

  test("malformed JSON warns and mounts nothing — and init() CARRIES ON", async ({ page }) => {
    const { errors, console: logs } = await load(page, "broken");
    expect(errors).toEqual([]);
    await expect(page.locator(".fa-nav-icons")).toHaveCount(0);
    expect(logs.join("\n")).toContain("not valid JSON");
    // The point of the assertion below: a parse failure in one region must not
    // be a blank navbar. The document index is built from the page, not from
    // this element, and it is still there.
    await expect(page.locator(".fa-doc-index")).toHaveCount(1);
  });
});

test.describe("the middle — controlled folders, then the harness navigation, ONE scroll", () => {
  test("the theme's nav is MOVED into the wrapper, under the folders", async ({ page }) => {
    // The owner's three-region layout is explicit that the middle is *"a
    // scrollable stacks between fixed top an bottom parts"* — singular.
    // Leaving the folders outside it would make a fourth fixed region.
    const { errors } = await load(page, CUSTOM);
    expect(errors).toEqual([]);
    await expect(page.locator(".side-bar > .fa-nav-middle > .site-nav")).toHaveCount(1);
    await expect(page.locator(".side-bar > .site-nav")).toHaveCount(0);
    const order = await page
      .locator(".fa-nav-middle > *")
      .evaluateAll((ns) => ns.map((n) => n.className));
    expect(order[0]).toContain("fa-nav-folders");
    expect(order[1]).toContain("site-nav");
  });

  test("every declared kind is listed; one with no viewer is a non-link", async ({ page }) => {
    await load(page, CUSTOM);
    await expect(page.locator(".fa-nav-folders__count")).toHaveText(String(CUSTOM.folders.length));
    await expect(page.locator(".fa-nav-folders__item")).toHaveCount(CUSTOM.folders.length);
    // The baseurl is applied BEFORE the safety check, so what is asserted is
    // the href that is actually written.
    await expect(page.locator('.fa-nav-folders__link[href]')).toHaveAttribute(
      "href",
      BASEURL + "/library/",
    );
    const dead = page.locator(".fa-nav-folders__link--dead");
    await expect(dead).toHaveText("memory");
    expect(await dead.evaluate((n) => n.tagName)).toBe("SPAN");
  });

  test("it arrives OPEN and folds in one click", async ({ page }) => {
    await load(page, CUSTOM);
    await expect(page.locator(".fa-nav-folders")).toHaveAttribute("open", "");
    await page.locator(".fa-nav-folders__heading").click();
    await expect(page.locator(".fa-nav-folders")).not.toHaveAttribute("open", "");
  });

  test("it DEGRADES — with no row the nav keeps its old place rather than breaking", async ({ page }) => {
    // Neither "could not read" nor "declared none" is a reason to draw an
    // empty folder list. The middle stays the navigation alone, which is what
    // it was before this round, and the stylesheet carries both selectors.
    const { errors } = await load(page, null);
    expect(errors).toEqual([]);
    await expect(page.locator(".fa-nav-middle")).toHaveCount(0);
    await expect(page.locator(".side-bar > .site-nav")).toHaveCount(1);
  });
});

test.describe("the document index — the fixed top, about the page rather than the graph", () => {
  test("lists h2 and h3 that carry an id, nesting the h3s", async ({ page }) => {
    const { errors } = await load(page, CUSTOM);
    expect(errors).toEqual([]);
    const rows = await page
      .locator(".fa-doc-index__link")
      .evaluateAll((ns) => ns.map((n) => n.textContent + " -> " + n.getAttribute("href")));
    expect(rows).toEqual(["One -> #one", "One A -> #one-a", "Two -> #two"]);
    await expect(page.locator(".fa-doc-index__count")).toHaveText("3");
    // `h1` is the title and `h4` is past where an index helps; a heading with
    // no id is not a destination (`pb04`) and is skipped rather than linked to
    // nothing.
    expect(rows.join(" ")).not.toContain("Title");
    expect(rows.join(" ")).not.toContain("Unlinkable");
    expect(rows.join(" ")).not.toContain("Too deep");
    await expect(page.locator(".fa-doc-index__item--sub")).toHaveCount(1);
  });

  test("is ABSENT below two rows, not an empty or one-row menu", async ({ page }) => {
    // A "Contents" holding the one section the reader is looking at is a row
    // that buys nothing in a region that does not scroll.
    const { errors } = await load(page, CUSTOM, '<h1 id="t">T</h1><h2 id="only">Only</h2>');
    expect(errors).toEqual([]);
    await expect(page.locator(".fa-doc-index")).toHaveCount(0);
  });

  test("sits in the FIXED TOP — after the icon row, before the scrolling middle", async ({ page }) => {
    // THE POP-OUT PANELS ARE FILTERED, and they are siblings rather than
    // children of anything: `.fa-panel-in-sidebar` is `position: static`, so a
    // naive child list has `.fa-tiles` sitting between the icon row and this
    // index — measured, not assumed, when the first version of this assertion
    // failed on it. Where a panel is placed is `sidebar-panels.e2e.ts`'s
    // property (it must not be clipped by the height-capped header) and is
    // deliberately not restated here: two specs asserting one placement are
    // two answers free to disagree.
    await load(page, CUSTOM);
    const order = await page
      .locator(".side-bar > *:not(.fa-panel-in-sidebar)")
      .evaluateAll((ns) => ns.map((n) => n.className || n.tagName.toLowerCase()));
    expect(order).toEqual([
      expect.stringContaining("site-header"),
      expect.stringContaining("fa-nav-icons"),
      expect.stringContaining("fa-doc-index"),
      expect.stringContaining("fa-nav-middle"),
    ]);
  });

  test("survives the DOM move that once took the rest of init() with it", async ({ page }) => {
    // The measured regression: `mountInstanceGraphs` reparents `.site-nav`,
    // and an `insertBefore` assuming the old shape throws `NotFoundError`.
    // Both regions here, and no exception, is the whole assertion.
    const { errors } = await load(page, CUSTOM);
    expect(errors).toEqual([]);
    await expect(page.locator(".fa-doc-index")).toHaveCount(1);
    await expect(page.locator(".fa-nav-middle > .site-nav")).toHaveCount(1);
  });
});
