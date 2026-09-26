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
  notes?: Record<string, string>;
  folders: { kind: string; within?: string; path?: string; note?: string; stagingOnly?: true }[];
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
  // ...and each carries WHY, in the wording `harness-tiles.ts` computes. Two
  // DIFFERENT reasons on purpose: the whole point of the ruling on #1036 is
  // that the four inert states stay told apart at the last step, so a fixture
  // with one reason twice could not catch them being collapsed.
  notes: { beans: "no viewer yet", kg: "staging only" },
  folders: [
    { kind: "library", path: "/library/" },
    { kind: "memory", note: "no viewer by design" },
    // A PATH THAT RESOLVES AND A PAGE THAT IS NOT THERE — the staging-only
    // case, which had no fixture and no live case until `fsh-guts` was swept
    // out of a canonical build.
    { kind: "fsh-guts", path: "/fsh-guts/", stagingOnly: true },
    // NO NOTE AT ALL — data older than the note being carried. Not a fourth
    // state, and the page must not invent one for it.
    { kind: "scenarios" },
  ],
};

const HEADINGS =
  '<h1 id="t">Title</h1>' +
  '<h2 id="one">One</h2>' +
  '<h3 id="one-a">One A</h3>' +
  '<h2 id="two">Two</h2>' +
  "<h2>Unlinkable</h2>" +
  '<h4 id="deep">Too deep</h4>';

function page(row: NavbarRow | null | "absent" | "broken", main: string = HEADINGS, staging = ""): string {
  const script =
    row === "absent"
      ? ""
      : '<script type="application/json" id="fa-navbar-row">' +
        (row === "broken" ? "{not json" : JSON.stringify(row)) +
        "<\/script>";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <meta name="fa-baseurl" content="${BASEURL}">
  <meta name="fa-staging" content="${staging}">
  <style>
  body { margin: 0; }
  .side-bar { position: fixed; top: 0; left: 0; width: 16.5rem; height: 100%;
              display: flex; flex-flow: column nowrap; align-items: flex-end;
              background: #27262b; color: #fff; }
  .site-header { width: 100%; max-height: 3.75rem; overflow: hidden; display: flex; align-items: center; }
  .site-title { flex: 1; }
  .site-nav { width: 100%; overflow-y: auto; }
  /* THE THEME'S OWN NAV LINK, copied from a real build rather than written
     from memory: padding 4px 32px, line-height 24px, so 32px tall. The theme
     sizes this element, not us, and a fixture that left it as a bare anchor
     measured 17px and reported the THEME as failing the target floor. Same
     rule action-tiles.e2e.ts states for its search markup.
     NO BACKTICKS HERE -- this comment is inside the page template literal, and
     one ends the string. It did, and the suite reported "No tests found"
     rather than a syntax error (bean bmr0). */
  .site-nav a { display: block; padding: 4px 32px; font-size: 14px; line-height: 24px; }
  ${CSS}
</style></head><body>
  ${script}
  <div class="side-bar">
    <div class="site-header"><a class="site-title"><span class="fa-site-mark"></span><span class="fa-site-title">folio-assistant</span></a></div>
    <nav class="site-nav"><a href="#">Navigation link</a></nav>
    <input type="checkbox" class="fa-nav-open" id="fa-nav-open">
    <label class="fa-nav-toggle" for="fa-nav-open" title="Keep navigation open"><span class="fa-nav-glyph" aria-hidden="true">&#9776;</span></label>
    <label class="fa-nav-close" for="fa-nav-open" title="Close navigation"><span aria-hidden="true">&times;</span></label>
    <footer class="site-footer">
      <div class="fa-nav-bottom__stack">
        <details class="fa-harness-tabs">
          <summary class="fa-harness-tabs__heading">Harnesses <span class="fa-harness-tabs__count">1</span></summary>
          <ul class="fa-harness-tabs__list">
            <li class="fa-harness-tab">
              <a class="fa-harness-tab__body" href="#x">
                <span class="fa-harness-tab__mark fa-harness-tab__mark--initial">W</span>
                <span class="fa-harness-tab__label">who-iris</span>
              </a>
              <ul class="fa-harness-tab__graphs"><li class="fa-harness-graph"><a class="fa-harness-graph__link" href="#g">docs</a></li></ul>
            </li>
          </ul>
        </details>
      </div>
      <a class="fa-nav-home" href="#home"><span class="fa-nav-home__mark">&#8962;</span><span class="fa-nav-home__label">Home</span></a>
    </footer>
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
 * Wait until the sidebar has stopped MOVING, however long its stylesheet says
 * that takes.
 *
 * ## Why a wait is needed at all
 *
 * The strip animates, and these tests read the DOM the instant the call before
 * them returns. Measured on this fixture: `.side-bar` itself carries 0.4s
 * transitions, and `fa-site-title`, `fa-glass-handle__label`, `fa-doc-index`,
 * `fa-nav-folders` and `site-nav` carry 0.12s. A read taken immediately samples
 * values mid-flight, and WHICH elements it catches depends on how the run was
 * scheduled.
 *
 * That is what the evidence showed rather than a guess about slow runners: the
 * same assertion failed in two CI runs naming DIFFERENT elements — first
 * `SPAN: x`, `fa-harness-tab__label`, `fa-harness-graph__link`; then
 * `fa-nav-folders__link`, `fa-nav-folders__note`, `A`. A deterministic
 * difference between browsers would name the same ones both times; a varying
 * set is a race.
 *
 * ## Two halves, and the second was found by fixing the first
 *
 * Waiting at rest made the at-rest assertions honest and broke
 * "every one of them comes back on hover", which had waited a flat 250ms after
 * `page.hover`. Measured on the reopen: `.fa-harness-tab__label` reports
 * `opacity: 0` with `--fa-nav-text: 1` at +250ms, gets its box at +300ms and
 * only reaches 0.94 at +350ms. So 250ms was never the hover animation's
 * length — it was enough only because the strip had never fully CLOSED, and
 * reopening from closed is the slower path. The same helper therefore serves
 * both directions, which is also why it is one function and not two constants.
 *
 * ## How it decides
 *
 * The floor is DERIVED FROM THE CSS, so it follows the stylesheet instead of
 * going stale beside it, and it costs nothing on a fixture with no transitions.
 * Then `getAnimations({ subtree: true })` — the browser's own list of running
 * transitions — is polled to empty, which is what gives a slow machine more
 * time without anyone tuning a number for it. The CSS floor comes FIRST for a
 * reason: the label above starts its transition ~50ms late, and an empty
 * animation list cannot tell "finished" from "not started yet".
 */
async function settleNav(p: import("@playwright/test").Page): Promise<void> {
  const settleMs = await p.evaluate(() => {
    const bar = document.querySelector(".side-bar");
    if (!bar) return 0;
    const longest = (v: string) =>
      Math.max(0, ...v.split(",").map((x) => (parseFloat(x) || 0) * 1000));
    let ms = 0;
    for (const n of [bar, ...Array.from(bar.querySelectorAll("*"))]) {
      const cs = getComputedStyle(n);
      ms = Math.max(ms, longest(cs.transitionDuration) + longest(cs.transitionDelay));
    }
    return Math.ceil(ms);
  });
  if (settleMs > 0) await p.waitForTimeout(settleMs + 50);
  await p.waitForFunction(
    () => {
      const bar = document.querySelector(".side-bar");
      if (!bar) return true;
      return bar.getAnimations({ subtree: true }).length === 0;
    },
    undefined,
    { timeout: 5000 },
  );
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
  staging = "",
): Promise<{ errors: string[]; console: string[] }> {
  const errors: string[] = [];
  const logs: string[] = [];
  p.on("pageerror", (e) => errors.push(String(e)));
  p.on("console", (m) => logs.push(m.type() + ": " + m.text()));
  // SERVED FROM AN ORIGIN, not `setContent`. A document set that way has an
  // opaque origin and `localStorage` THROWS a SecurityError on it — which
  // quietly made the whole fixture the private-window case, so the stay-closed
  // preference's persistence would have gone untested while a test named for
  // it passed. `route` + `goto` gives a real `http://` origin and costs one
  // handler.
  await p.route("http://navbar.fixture/**", (r) =>
    r.fulfill({ contentType: "text/html", body: page(row, main, staging) }),
  );
  await p.goto("http://navbar.fixture/nav", { waitUntil: "load" });
  // PARK THE POINTER, because "at rest" is a precondition this file asserts
  // ~and never stated~. The sidebar is a 3.5rem strip against the left edge, so
  // it CONTAINS the origin, and the strip opens on `:hover` — a pure-CSS
  // mechanism with no script to wait for. A browser that starts its pointer at
  // (0, 0) therefore renders the bar OPEN at load, and three tests here read
  // that as the app being wrong.
  //
  // Found on 2026-09-26 by bumping `@playwright/test` 1.61.1 -> 1.63.0, whose
  // `playwright install` fetches a newer Chromium: CI failed
  // "NO text region is visible until the bar is opened" (3 labels, expected
  // none), "the icon row STACKS at rest" (1 distinct top, expected 4) and
  // "[x] is offered whenever the bar is OPEN" (visible, expected hidden) —
  // while all 700 passed locally on the older pinned Chromium. One cause, three
  // symptoms, and the app unchanged.
  //
  // Reproduced on the OLD browser by moving the pointer to (0, 0) before the
  // assertion, which fails identically — so this is the mechanism rather than a
  // guess about browser versions, and the fix is verified where the bug could
  // not otherwise be seen.
  //
  // (600, 400) is outside the strip at every width this file uses (the viewport
  // is asserted wider than 800). Tests that WANT the bar open call
  // `page.hover(".side-bar")` themselves and are unaffected.
  await p.mouse.move(600, 400);
  await settleNav(p);
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
    // WITH THE BASEURL. `#fa-navbar-row` is `jsonify`d raw, unlike
    // `#fa-site-links`, which Liquid has already run `relative_url` over — so
    // a site-root path arriving here is unprefixed and composing it without
    // the base resolves against the ORIGIN. This is the THIRD family to hit
    // that (issue #801 was the graph tiles, and the action tiles carry the
    // rule in their own comment); the owner found it live, 2026-09-23:
    // *"beans and todos links wrong ... https://litlfred.github.io/beans/"*.
    //
    // The first version of this assertion expected the UNPREFIXED value, so
    // it agreed with the defect and passed. That is the failure
    // `action-tiles.e2e.ts` names in full — a fixture that restates the value
    // under test cannot catch a wrong one — arrived at from the other side:
    // the expectation was not read from anything, it was copied off the code.
    await expect(todos).toHaveAttribute("href", BASEURL + "/todos/");
    // THE REASON IS IN THE ACCESSIBLE NAME. This row is glyphs with no words,
    // so `aria-label` is the only channel a screen reader has — and it said
    // just "Beans" for a slot that goes nowhere, describing a working control
    // to somebody who cannot see that it is grey (`gjli`).
    for (const [gap, why] of [["Beans", "no viewer yet"], ["Knowledge graph", "staging only"]]) {
      const slot = page.locator('.fa-nav-icons [aria-label^="' + gap + '"]');
      await expect(slot).toHaveCount(1);
      await expect(slot).toHaveClass(/fa-nav-icon--dead/);
      expect(await slot.evaluate((n) => n.tagName)).toBe("SPAN");
      await expect(slot).toHaveAttribute("aria-label", gap + " — " + why);
      await expect(slot).toHaveAttribute("title", gap + " — " + why);
    }
    // ...and the two reasons are DIFFERENT. A fixture that asserted one
    // wording twice would pass with the four states collapsed into one, which
    // is the defect the ruling on #1036 is about.
    const labels = await page
      .locator(".fa-nav-icons .fa-nav-icon--dead")
      .evaluateAll((ns) => ns.map((n) => n.getAttribute("aria-label")));
    expect(new Set(labels).size).toBe(labels.length);
  });

  test("EVERY composed href carries the baseurl — the class, not the instance", async ({ page }) => {
    // Named as a class on purpose. Three separate tile/link families have now
    // shipped a site-root path unprefixed, each fixed on its own, and a test
    // per instance is what let the next one through. This asserts the property
    // over both regions that compose from `#fa-navbar-row`, so a FOURTH
    // consumer added to either of them cannot repeat it quietly.
    await load(page, LIVE);
    const hrefs = await page
      .locator(".fa-nav-icons a[href], .fa-nav-folders a[href]")
      .evaluateAll((ns) => ns.map((n) => n.getAttribute("href") ?? ""));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const h of hrefs) {
      expect(h.startsWith(BASEURL + "/")).toBe(true);
      // ...and prefixed ONCE. Running the base over an already-composed value
      // is the failure in the other direction, which is why the action tiles
      // do NOT prefix inside the shared `tileLink`.
      expect(h.indexOf(BASEURL, 1)).toBe(-1);
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
    // THREE: `memory` has no viewer, `scenarios` has no recorded reason, and
    // `fsh-guts` has a page that is withheld from this deploy. Three different
    // facts, all inert — which is the point of the note beside each.
    await expect(dead).toHaveCount(3);
    expect(await dead.first().evaluate((n) => n.tagName)).toBe("SPAN");
  });

  test("an inert row SAYS WHICH CASE, in text a reader can actually get", async ({ page }) => {
    // Owner ruling on #1036: shown, inert and LABELLED, with the label saying
    // which of the four states it is. This row carried it as `opacity: 0.45`,
    // a strikethrough and a `title` tooltip — a channel a keyboard user never
    // reaches and a touch user cannot produce.
    //
    // The wording is CARRIED from `harness-tiles.ts`, never composed here:
    // `inertNote` words four states and the single string this replaced was
    // wrong for two of them.
    await load(page, CUSTOM);
    await page.hover(".side-bar");
    const row = (kind: string) =>
      page.locator(".fa-nav-folders__item", { hasText: kind }).locator(".fa-nav-folders__note");
    await expect(row("memory")).toHaveText("no viewer by design");
    // ABSENT is not a fourth state — it is data older than the note, and
    // inventing "no viewer yet" for it is the guess the rule is against.
    await expect(row("scenarios")).toHaveText("reason not recorded");
    await expect(row("memory")).not.toHaveText(await row("scenarios").innerText());
  });

  test("an inert row is not a CONTROL — `gjli`", async ({ page }) => {
    // A greyed thing that takes a tab and then does nothing costs a keyboard
    // user an interaction to discover it is dead. Not an anchor, not a button,
    // and nothing focusable anywhere inside it.
    await load(page, CUSTOM);
    const inert = page.locator(".fa-nav-folders__link--dead");
    for (const tag of await inert.evaluateAll((ns) => ns.map((n) => n.tagName))) {
      expect(tag).toBe("SPAN");
    }
    expect(
      await inert.evaluateAll((ns) =>
        ns.flatMap((n) => [n, ...Array.from(n.querySelectorAll("*"))]).filter(
          (x) => x.hasAttribute("href") || x.hasAttribute("tabindex") || x.tagName === "BUTTON",
        ).length,
      ),
    ).toBe(0);
  });

  test("the state is NOT carried by colour alone", async ({ page }) => {
    // The other half of `gjli`. Strip the styling that makes a dead row LOOK
    // dead and the row must still say so — which is what a screen reader, a
    // high-contrast mode and a printed page all get.
    await load(page, CUSTOM);
    await page.hover(".side-bar");
    const text = await page
      .locator(".fa-nav-folders__item", { hasText: "memory" })
      .evaluate((n) => (n.textContent ?? "").replace(/\s+/g, " ").trim());
    expect(text).toContain("memory");
    expect(text).toContain("no viewer by design");
  });

  test("it arrives CLOSED and opens in one click", async ({ page }) => {
    // Owner, 2026-09-23: *"any indices/toc should be closed."* It arrived open
    // until then. The count stays on the summary, so a folded block still says
    // how many there are — folded is not hidden.
    await load(page, CUSTOM);
    await expect(page.locator(".fa-nav-folders")).not.toHaveAttribute("open", "");
    // The count is read with the bar OPEN. At rest the whole block is a text
    // region and is held invisible with the rest — see the collapsed-strip
    // tests below — so asserting it visible here would be asserting that the
    // strip still shows words.
    await page.hover(".side-bar");
    await expect(page.locator(".fa-nav-folders__count")).toBeVisible();
    await page.locator(".fa-nav-folders__heading").click();
    await expect(page.locator(".fa-nav-folders")).toHaveAttribute("open", "");
  });

  test("the document index arrives closed too — both, from one instruction", async ({ page }) => {
    await load(page, CUSTOM);
    await expect(page.locator(".fa-doc-index")).not.toHaveAttribute("open", "");
    await page.hover(".side-bar");
    await expect(page.locator(".fa-doc-index__count")).toBeVisible();
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
    // THE CONTROLS ARE FILTERED TOO, for the same reason the panels are: the
    // checkbox is off-screen and both labels are `position: absolute`, so
    // none of them is a region in the column's flow. Where a label is PAINTED
    // is free of where it sits in the markup — the argument `.fa-nav-toggle`
    // already makes in the stylesheet.
    const order = await page
      .locator(".side-bar > *:not(.fa-panel-in-sidebar):not(.fa-nav-open):not(.fa-nav-toggle):not(.fa-nav-close)")
      .evaluateAll((ns) => ns.map((n) => n.className || n.tagName.toLowerCase()));
    expect(order).toEqual([
      expect.stringContaining("site-header"),
      expect.stringContaining("fa-nav-icons"),
      // The folio handle, IN the navbar under the icon row: owner,
      // 2026-09-24, "folio handle on LHS on navbar".
      expect.stringContaining("fa-glass-handle"),
      expect.stringContaining("fa-doc-index"),
      expect.stringContaining("fa-nav-middle"),
      expect.stringContaining("site-footer"),
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

/**
 * THE COLLAPSED STRIP — marks only, and asserted as a CLASS.
 *
 * Owner, 2026-09-23, with a screenshot: *"looks horrible when collapsed.
 * should only be icons/avatars so compat."* What they were looking at was
 * `On this page` clipped to "ON" over six folder names bleeding out of a
 * 3.5rem column.
 *
 * ## Why the regression happened, and what that means for this test
 *
 * The stylesheet hid three named regions. The round that added the document
 * index and the folder block added two more and did not extend that list, so
 * they were never hidden — the defect was in the ENUMERATION. A test that
 * named the two missing regions would be the same mistake one layer up: it
 * would pass, and the next region added would go uncovered in exactly the same
 * way.
 *
 * So the assertion is a property over the whole sidebar: AT REST, NO TEXT IN
 * IT IS VISIBLE. Effective opacity is computed by walking the ancestor chain,
 * because `opacity` does not inherit as a computed value — an element inside
 * an `opacity: 0` parent still reports `1` for itself, which is how an earlier
 * probe of this page reported eight visible rows that a screenshot showed were
 * not there.
 */
test.describe("at rest the strip carries marks and nothing else", () => {
  /** Every element in the sidebar whose own text is actually rendered. */
  const visibleText = () => {
    const bar = document.querySelector(".side-bar")!;
    const out: string[] = [];
    for (const n of Array.from(bar.querySelectorAll("*"))) {
      const own = Array.from(n.childNodes)
        .filter((x) => x.nodeType === 3)
        .map((x) => (x.textContent ?? "").trim())
        .join(" ")
        .trim();
      if (!own) continue;
      const r = n.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      // A MARK MAY BE TEXT and is not a label: `fa-harness-tab__mark--initial`
      // renders one letter for a harness with no avatar, and `fa-nav-home__mark`
      // is the `⌂` glyph. Both are exactly what the owner asked the strip to
      // keep, so they are excluded by ROLE rather than by name — anything the
      // markup calls a mark, a glyph or an icon is a picture here, whatever
      // characters it happens to be drawn with.
      const role = (n.className || "").toString();
      if (/mark|glyph|icon|count/.test(role) && !/__label|__heading/.test(role)) continue;
      // Effective opacity: the product up the chain. `opacity` is not an
      // inherited property, so the element's own value says nothing about
      // whether a reader can see it.
      let op = 1;
      for (let a: Element | null = n; a && a !== bar.parentElement; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (cs.visibility === "hidden" || cs.display === "none") { op = 0; break; }
        op *= Number(cs.opacity);
      }
      if (op > 0.01) out.push((n.className || n.tagName).toString().split(" ")[0] + ": " + own.slice(0, 24));
    }
    return out;
  };

  test("the folio handle sits under the icon row, so it never takes the ☰'s clicks", async ({ page }) => {
    // Owner, 2026-09-24: "folio handle on LHS on navbar". Placed right under
    // the header, the handle's position depended on the header's height while
    // the ☰ is painted at a fixed offset, and in this fixture it took the ☰'s
    // clicks. Under the icon row, the element built to clear the ☰, it cannot.
    await load(page, CUSTOM);
    await expect(page.locator(".side-bar > .fa-nav-icons + .fa-glass-handle")).toHaveCount(1);
    await page.hover(".side-bar");
    await page.locator(".fa-nav-close").click();
    await page.waitForTimeout(200);
    await page.locator(".fa-nav-toggle").click({ timeout: 5000 });
  });

  test("NO text region is visible until the bar is opened", async ({ page }) => {
    const { errors } = await load(page, CUSTOM);
    expect(errors).toEqual([]);
    // The viewport is wider than the 50rem breakpoint, so the strip rules are
    // the ones in force. Stated rather than assumed: below it the theme owns
    // the sidebar and hides nothing, which would make this pass for the wrong
    // reason.
    expect(page.viewportSize()!.width).toBeGreaterThan(800);
    expect(await page.evaluate(visibleText)).toEqual([]);
  });

  test("...and every one of them comes back on hover", async ({ page }) => {
    // The other half, and it is not decoration: a rule that hides at rest and
    // forgets to restore is the same defect wearing the opposite sign, and it
    // would look correct in the screenshot that prompted this.
    await load(page, CUSTOM);
    await page.hover(".side-bar");
    await settleNav(page);
    const shown = (await page.evaluate(visibleText)).join(" | ");
    for (const region of ["fa-site-title", "fa-doc-index__heading", "fa-nav-folders__heading",
                          "fa-harness-tabs__heading", "fa-harness-tab__label", "fa-nav-home__label"]) {
      expect(shown).toContain(region);
    }
  });

  test("the marks stay — they are what the strip is FOR", async ({ page }) => {
    await load(page, CUSTOM);
    // Icons and marks, at rest, with no hover.
    await expect(page.locator(".fa-nav-icons .fa-nav-icon").first()).toBeVisible();
    await expect(page.locator(".fa-nav-home__mark")).toBeVisible();
  });

  test("the harness avatars follow their group, and that is a TRADE the owner made", async ({ page }) => {
    // Two instructions, one day apart, that pull opposite ways:
    //
    //   *"should only be icons/avatars so compat"*  — 2026-09-23, morning
    //   *"harnesses start closed"*                  — 2026-09-23, later
    //
    // The harness avatars live inside that group, so a closed group takes them
    // out of the strip. The second instruction is the later one and is
    // implemented literally; this test states the consequence rather than
    // hiding it, so that reversing it is one `open` in `nav_footer_custom.html`
    // and one expectation here.
    //
    // NOT worked around in CSS. A stylesheet that revealed a closed
    // disclosure's contents would make `[open]` stop meaning what it says,
    // which is worse than either answer.
    await load(page, CUSTOM);
    await expect(page.locator(".fa-harness-tabs")).not.toHaveAttribute("open", "");
    await expect(page.locator(".fa-harness-tab__mark")).not.toBeVisible();

    await page.hover(".side-bar");
    await page.locator(".fa-harness-tabs__heading").click();
    await expect(page.locator(".fa-harness-tab__mark")).toBeVisible();
  });

  test("the icon row STACKS at rest and lies flat when open", async ({ page }) => {
    // Six 36px icons are 232px wide; in a 3.5rem strip five of them are off
    // the edge. Measured as tops rather than as a CSS property, because
    // `flex-wrap` is the mechanism and the requirement is the layout.
    await load(page, CUSTOM);
    const tops = () => page.locator(".fa-nav-icons .fa-nav-icon").evaluateAll(
      (ns) => ns.map((n) => Math.round(n.getBoundingClientRect().top)));
    const rest = await tops();
    expect(new Set(rest).size).toBe(rest.length);
    await page.hover(".side-bar");
    await settleNav(page);
    const open = await tops();
    expect(new Set(open).size).toBe(1);
  });


  test("a CLOSED document index never yields its one row — the `flex-shrink` fix", async ({ page }) => {
    // Owner, 2026-09-23, with a screenshot: *"on this page is cut off"*.
    // Measured at a 500px viewport: the region was 22px around a 25px summary,
    // so the row read as `ON THIS PAG` with its descenders sliced off. The
    // region is `flex: 0 1 auto` and its own rule says why that is safe —
    // *"it scrolls inside its cap"* — which is true while it is OPEN. Closed,
    // there is nothing to scroll, so every pixel the layout takes is a pixel
    // of the only row it has and the reader cannot recover it.
    await page.setViewportSize({ width: 1200, height: 500 });
    await load(page, CUSTOM);
    await page.hover(".side-bar");
    await settleNav(page);
    const fits = await page.evaluate(() => {
      const box = document.querySelector(".fa-doc-index");
      const sum = document.querySelector(".fa-doc-index__heading");
      if (!box || !sum) return null;
      return Math.round(sum.getBoundingClientRect().bottom - box.getBoundingClientRect().bottom);
    });
    // Zero or negative: the summary's bottom is at or above the region's.
    expect(fits).not.toBeNull();
    expect(fits!).toBeLessThanOrEqual(0);
  });

  test("the fixed bottom stays ANCHORED to the bottom in both states", async ({ page }) => {
    // The measurement that decided `flex-basis: 0`: with `flex: 1 1 auto` the
    // middle started from its own 1008px of links, the column overflowed, and
    // every region shrank proportionally — the fixed bottom to 104px, showing
    // ONE of five harness avatars. Collapsing the middle to nothing instead
    // floated the bottom up to meet the icons, which is the opposite failure.
    await load(page, CUSTOM);
    const homeBottom = async () =>
      await page.locator(".fa-nav-home").evaluate((n) => Math.round(n.getBoundingClientRect().bottom));
    const barBottom = await page.locator(".side-bar").evaluate((n) => Math.round(n.getBoundingClientRect().bottom));
    expect(barBottom - (await homeBottom())).toBeLessThan(24);
    await page.hover(".side-bar");
    await settleNav(page);
    expect(barBottom - (await homeBottom())).toBeLessThan(24);
  });
});

/**
 * THE TARGET FLOOR, over the whole navbar.
 *
 * `ui-accessibility`: *"Targets are at least 24x24 CSS px (SC 2.5.8), and aim
 * higher: 32px for rows in a list … Density is cheaper than a missed target."*
 * This instance's declared interaction profile is low-dexterity, so it is a
 * binding constraint rather than a nicety.
 *
 * ## Why this test did not exist, and what its absence cost
 *
 * The repository already holds this floor in two places — the KG viewer's
 * `a11y.e2e.ts` and the language bar — and the NAVBAR was in neither. Three
 * rows had drifted under it unnoticed, measured at 1400x900 on a built site:
 * `.fa-doc-index__link` and `.fa-nav-folders__link` at **23px** (one pixel
 * short, from a padding rule copied between them) and `.fa-harness-graph__link`
 * at **26x13** — an inline `<a>`, so its box was exactly its text.
 *
 * So the assertion is a SWEEP rather than three named selectors. Naming them
 * would pass the day a fourth row is added, which is exactly how these three
 * got here.
 */
test.describe("every row in the navbar is a target", () => {
  test("nothing interactive in the sidebar is under 24px", async ({ page }) => {
    await load(page, CUSTOM);
    // Opened and every disclosure expanded: a row inside a closed `<details>`
    // has no box to measure, and a sweep that skipped them would report clean
    // over the rows most likely to be wrong.
    await page.hover(".side-bar");
    for (const heading of [".fa-doc-index__heading", ".fa-nav-folders__heading", ".fa-harness-tabs__heading"]) {
      const h = page.locator(".side-bar " + heading);
      if (await h.count()) await h.click();
    }
    await page.waitForTimeout(300);

    const small = await page.evaluate(() => {
      const out: string[] = [];
      for (const e of Array.from(
        document.querySelectorAll('.side-bar a[href], .side-bar button, .side-bar summary, .side-bar [role="button"]'),
      )) {
        const r = e.getBoundingClientRect();
        // A zero box is hidden, not small — the theme's skip link is 1x1 until
        // it takes focus, and reporting it would be reporting a control that
        // is correct.
        if (r.width === 0 || r.height === 0) continue;
        if (r.height < 24 || r.width < 24) {
          out.push(`${(e.className || e.tagName).toString().split(" ")[0]} ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      }
      return out;
    });
    expect(small).toEqual([]);
  });

  test("...and the sweep actually found something to measure", async ({ page }) => {
    // `dh4f` in a test: a selector that matched nothing would make the
    // assertion above pass over an empty set, which is indistinguishable from
    // a navbar with no defects.
    await load(page, CUSTOM);
    await page.hover(".side-bar");
    const n = await page
      .locator('.side-bar a[href], .side-bar button, .side-bar summary')
      .evaluateAll((ns) => ns.filter((e) => e.getBoundingClientRect().height > 0).length);
    expect(n).toBeGreaterThan(5);
  });
});

/**
 * A GLYPH PAINTS WITH `currentColor`, OR IT PAINTS BLACK.
 *
 * Owner, 2026-09-23, with a screenshot of the dark-mode navbar: *"exploding
 * icon hard to see in dark mode"*. It was not hard to see — it was black. An
 * SVG shape with no `fill` takes the initial value, which is black, and the
 * element's `color` never reaches it.
 *
 * ## Why no contrast check would have caught it
 *
 * The icon's own computed `color` is a perfectly good `rgb(230,225,232)` and
 * its effective opacity is 0.8, so a contrast check that reads the ELEMENT
 * reports **7.99:1** — on an icon rendering at about **1.4:1**. The only way
 * it shows is to walk the painted shapes, which is what this does.
 *
 * Two of the five glyphs were wrong and the other three were fine for a reason
 * worth keeping: the three are strokes, wrapped in `fill="none"
 * stroke="currentColor"`, and only the two FILLED ones had nothing saying what
 * colour to fill with. So this is a sweep rather than two named glyphs — the
 * next filled glyph added is the next one to get this wrong.
 */
test.describe("every glyph in the navbar paints with the text colour", () => {
  test("no shape falls back to the initial black", async ({ page }) => {
    await load(page, LIVE);
    const black = await page.evaluate(() => {
      const out: string[] = [];
      const shapes = ".fa-nav-icons svg rect, .fa-nav-icons svg circle, .fa-nav-icons svg ellipse, " +
        ".fa-nav-icons svg path, .fa-nav-icons svg polygon, .fa-nav-icons svg polyline, .fa-nav-icons svg line";
      for (const sh of Array.from(document.querySelectorAll(shapes))) {
        const cs = getComputedStyle(sh);
        // Black fill AND no stroke: nothing else is carrying the colour, so
        // this shape is painted with the initial value on whatever is behind
        // it. A black fill WITH a stroke is a filled-and-outlined shape and is
        // a judgement, not a fallback.
        if (cs.fill === "rgb(0, 0, 0)" && (cs.stroke === "none" || cs.stroke === "")) {
          out.push((sh.closest("[aria-label]")?.getAttribute("aria-label") ?? "?") + " <" + sh.tagName + ">");
        }
      }
      return out;
    });
    expect(black).toEqual([]);
  });

  test("...and the sweep found shapes to look at", async ({ page }) => {
    // `dh4f`: a selector that matched nothing would pass the assertion above
    // over an empty set, which is what a navbar with no icons also looks like.
    await load(page, LIVE);
    const n = await page.locator(".fa-nav-icons svg *").count();
    expect(n).toBeGreaterThan(5);
  });
});

/**
 * STAY CLOSED, REMEMBERED — the owner's choice of three.
 *
 * Owner, 2026-09-23: *"need mechansim for closing harness navabar (e.g. w/ all
 * pages)"*, with a screenshot of the bar open and nothing to press. The bar
 * had ONE state bit — pinned or not — and also opened on hover, with `[x]`
 * shown only while pinned. So a bar opened by a pointer had no control, and a
 * touch reader, with no pointer to move away, had no way at all.
 *
 * Asked rather than guessed, because the three answers build differently. The
 * owner chose the three-state one: `[x]` whenever the bar is open, and
 * pressing it remembers a stay-closed preference across pages.
 */
test.describe("the navbar can be closed, and it stays closed", () => {
  test("[x] is offered whenever the bar is OPEN, not only while pinned", async ({ page }) => {
    await load(page, CUSTOM);
    // At rest it is not offered: an [x] alone in a 3.5rem strip reads as a
    // close button for the page.
    await expect(page.locator(".fa-nav-close")).toBeHidden();
    await page.hover(".side-bar");
    await expect(page.locator(".fa-nav-close")).toBeVisible();
  });

  test("pressing it does NOT pin the bar open — the label would have", async ({ page }) => {
    // The defect this intercepts. `[x]` is a `<label for="fa-nav-open">` and a
    // label TOGGLES; with the bar open by hover the checkbox is already clear,
    // so the same click would CHECK it and pin the bar open — the opposite of
    // what the control says.
    await load(page, CUSTOM);
    await page.hover(".side-bar");
    await page.locator(".fa-nav-close").click();
    expect(await page.locator("#fa-nav-open").isChecked()).toBe(false);
  });

  test("...and the preference is REMEMBERED for the next page", async ({ page }) => {
    await load(page, CUSTOM);
    await page.hover(".side-bar");
    await page.locator(".fa-nav-close").click();
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-fa-nav"))).toBe("closed");
    expect(await page.evaluate(() => window.localStorage.getItem("fa-nav"))).toBe("closed");
  });

  test("closed means the POINTER stops opening it — and only the pointer", async ({ page }) => {
    await load(page, CUSTOM);
    await page.hover(".side-bar");
    await page.locator(".fa-nav-close").click();
    await page.waitForTimeout(250);
    const strip = await page.locator(".side-bar").evaluate((n) => Math.round(n.getBoundingClientRect().width));
    expect(strip).toBeLessThan(100);

    // A KEYBOARD READER IS NOT TRAPPED. Focus still opens it — suppressing
    // that would leave them tabbing through links they cannot see, which is a
    // worse defect than the one being fixed.
    await page.locator(".side-bar .site-nav a").first().focus();
    await page.waitForTimeout(250);
    const focused = await page.locator(".side-bar").evaluate((n) => Math.round(n.getBoundingClientRect().width));
    expect(focused).toBeGreaterThan(200);
  });

  test("the hamburger LIFTS it — an action whose inverse is unreachable is not a toggle", async ({ page }) => {
    // `l4zi`. Without this the bar could be closed once and never peek again.
    await load(page, CUSTOM);
    await page.hover(".side-bar");
    await page.locator(".fa-nav-close").click();
    await page.waitForTimeout(200);
    await page.locator(".fa-nav-toggle").click();
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-fa-nav"))).toBeNull();
    expect(await page.evaluate(() => window.localStorage.getItem("fa-nav"))).toBeNull();
  });

  test("a browser that refuses localStorage still gets the close", async ({ page }) => {
    // The preference is a convenience, not state anything else needs, so a
    // throwing `localStorage` degrades to "closed for this page" rather than
    // to a broken navbar.
    // Now that the fixture has a real origin, this has to CREATE the condition
    // rather than inherit it — which is the point: before, every test here ran
    // with storage denied and this one passed for the wrong reason.
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() { throw new Error("denied"); },
      });
    });
    const { errors } = await load(page, CUSTOM);
    expect(errors).toEqual([]);
    await page.hover(".side-bar");
    await page.locator(".fa-nav-close").click();
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-fa-nav"))).toBe("closed");
  });
});

/**
 * A PATH THAT RESOLVES AND A PAGE THAT IS NOT THERE.
 *
 * `compose-docs.ts` lays a `publish: "staging-only"` page into the site only
 * under `--staging`, and `harness-tiles.ts` resolves `path` against the SOURCE
 * tree — so on the canonical deploy the path is present, correct and dead.
 *
 * Measured 2026-09-23 by sweeping a canonical-shaped local build: `fsh-guts`,
 * reached from two places in this sidebar. The graph TILE has skipped such a
 * page since it was written — *"Conflating them would let 'show hidden'
 * resurrect a link to a 404"* — and neither navbar surface did, because
 * `stagingOnly` did not reach them.
 *
 * SHOWN, not skipped, unlike the tile: the owner's ruling on #1036 is that a
 * graph a reader cannot open is rendered inert and labelled, and this list is
 * the one surface that enumerates every declared kind.
 */
test.describe("a page withheld from this deploy is not linked", () => {
  test("on the canonical deploy it is INERT and says why", async ({ page }) => {
    await load(page, CUSTOM);
    await page.hover(".side-bar");
    const row = page.locator(".fa-nav-folders__item", { hasText: "fsh-guts" });
    await expect(row.locator("a[href]")).toHaveCount(0);
    await expect(row.locator(".fa-nav-folders__note")).toHaveText("staging only");
  });

  test("...and NOT confused with a kind that has no viewer at all", async ({ page }) => {
    // `flh4` again: withheld-on-purpose and never-built are different facts
    // with different remedies, and `inertNote` words them differently. Until
    // now the `staging-only` bucket had no live case, so this is the first
    // time the two can be seen apart on a page.
    await load(page, CUSTOM);
    await page.hover(".side-bar");
    // OPENED FIRST. `innerText` is "" for an element inside a collapsed
    // `<details>`, so comparing two of them there compares "" with "" and
    // passes whatever the notes say — which is how the first version of this
    // test passed while asserting nothing.
    await page.locator(".fa-nav-folders__heading").click();
    await page.waitForTimeout(200);
    const note = (kind: string) =>
      page.locator(".fa-nav-folders__item", { hasText: kind }).locator(".fa-nav-folders__note");
    const withheld = await note("fsh-guts").innerText();
    const never = await note("memory").innerText();
    expect(withheld).not.toBe("");
    expect(withheld).not.toBe(never);
  });

  test("ON A STAGING PREVIEW the same row IS a link", async ({ page }) => {
    // The other half, and the one that proves the guard is about the DEPLOY
    // rather than about the row: staging is where that page is published, and
    // withholding the link there would hide a working viewer.
    await load(page, CUSTOM, undefined, "claude-some-branch");
    await page.hover(".side-bar");
    const row = page.locator(".fa-nav-folders__item", { hasText: "fsh-guts" });
    await expect(row.locator("a[href]")).toHaveAttribute("href", BASEURL + "/fsh-guts/");
  });
});

test.describe("a sub-graph is drawn INSIDE its parent's row, folded — issue #1164", () => {
  /* Owner, 2026-09-23: proposals live in *"a docs/proposals/ sub-graph
   * declared sub-sub-graph (which starts closed in navbar, general
   * behavior)"*. GENERAL: whatever carries `within`, not a case for docs. */
  const NESTED: NavbarRow = {
    icons: ["close"],
    hrefs: {},
    folders: [
      // The children come FIRST in the data on purpose: the page must still
      // find their parent's row.
      { kind: "proposals", within: "docs", path: "/proposals/" },
      { kind: "docs", path: "/docs/" },
      { kind: "requirements", within: "docs", path: "/requirements/" },
      { kind: "library", path: "/library/" },
      // A parent that is not listed: the child stands on its own rather than
      // vanishing.
      { kind: "orphan", within: "nowhere", path: "/orphan/" },
    ],
  };

  test("the children sit under their parent, in a disclosure that starts CLOSED", async ({ page }) => {
    await load(page, NESTED);
    await page.hover(".side-bar");
    await page.locator(".fa-nav-folders__heading").click();
    const docs = page.locator(".fa-nav-folders__list > .fa-nav-folders__item", { hasText: /^docs/ });
    const sub = docs.locator(":scope > .fa-nav-folders__sub");
    await expect(sub).toHaveCount(1);
    await expect(sub).not.toHaveAttribute("open", "");
    await expect(sub.locator(".fa-nav-folders__item")).toHaveCount(2);
    // Not also at the top level.
    await expect(page.locator(".fa-nav-folders__list:not(.fa-nav-folders__list--sub) > .fa-nav-folders__item"))
      .toHaveCount(3);
    await sub.locator("summary").click();
    await expect(sub).toHaveAttribute("open", "");
    await expect(sub.locator('a[href]').first()).toHaveAttribute("href", BASEURL + "/proposals/");
  });

  test("a child whose parent is not listed stands on its own", async ({ page }) => {
    await load(page, NESTED);
    await page.hover(".side-bar");
    await page.locator(".fa-nav-folders__heading").click();
    await expect(page.locator(".fa-nav-folders__list:not(.fa-nav-folders__list--sub) > .fa-nav-folders__item",
      { hasText: "orphan" })).toHaveCount(1);
  });

  test("the LIVE data nests proposals and requirements under docs", () => {
    const f = (LIVE?.folders ?? []);
    expect(f.find((x) => x.kind === "proposals")?.within).toBe("docs");
    expect(f.find((x) => x.kind === "requirements")?.within).toBe("docs");
  });
});
