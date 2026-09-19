/**
 * The accessibility gate.
 *
 * Bean `gjli`: "ALL UI MUST FOLLOW ACCESSIBILITY GUIDELINES." A rule with no
 * check is an assertion, and the bean's own finding was that nothing here was
 * checkable — no a11y gate existed in this repository.
 *
 * ## Why axe alone is not the standard
 *
 * axe-core is necessary and it is not sufficient, and this suite exists in two
 * halves because of a measured fact rather than a principle.
 *
 * Baselined against the knowledge-graph viewer on 2026-09-19, axe found two
 * defects — insufficient colour contrast and undersized targets — and **none
 * of the four found by reading the markup against the rule**. The worst of
 * those four was a one-hop neighbourhood diagram whose every node was a bare
 * `<circle>` with a click handler: unreachable by keyboard, while the same
 * edges in the table beside it were fine.
 *
 * axe could not flag it. A `<circle>` with an `onclick` is not *recognised* as
 * interactive, so there is no control there to find a fault with. An automated
 * pass over a control the checker cannot see is not evidence about that
 * control.
 *
 * The complement holds too, which is the honest other half: making those nodes
 * real buttons introduced an ARIA contradiction — `role="img"` on the SVG,
 * which is a leaf in the accessibility tree, wrapped around focusable children
 * — and **axe caught that immediately** where a human reading the diff had
 * not. Neither half of this file replaces the other.
 *
 * ## Why the thresholds are above the floor
 *
 * This instance's declared interaction profile is low-dexterity
 * (`.harness/interaction.json`). WCAG 2.2 SC 2.5.8 asks for 24x24 CSS pixels;
 * a target that is barely legal is a target that is hard to hit. The page aims
 * at 32px for list and facet rows and 28px for inline edge controls, and the
 * assertion below holds the 24px line so a regression is caught even if the
 * comfort margin is spent.
 *
 * @module tests/a11y.e2e
 */
import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The viewer lives one level DOWN from the graph — `_kg/<stub>/index.html`
// reading `../<stub>.jsonld` — mirroring the published layout, where
// `<base>/<stub>/` is the directory that makes the extensionless
// `<base>/<stub>` a page GitHub Pages can serve. Driving the real relative
// path is the point: a viewer that resolved its document correctly in a flat
// fixture and wrongly in the deployed tree is exactly the failure a stand-in
// hides.
for (const [file, script] of [
  ["_kg/folio-assistant.jsonld", "scripts/kg-export.ts"],
  ["_kg/folio-assistant/index.html", "scripts/kg-viewer.ts"],
] as const) {
  if (!existsSync(file)) execFileSync("bun", ["run", script], { stdio: "inherit" });
}

const PAGE = "/_kg/folio-assistant/index.html";

/** WCAG 2.0/2.1/2.2 A and AA. Level AAA is not the bar being claimed. */
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Put the page in its most-populated state: a node selected, panel drawn. */
async function selectANode(page: import("@playwright/test").Page): Promise<void> {
  await page.goto(PAGE);
  await page.locator("#q").fill("beans-cli");
  await page.locator("#list li button").first().click();
  await expect(page.locator(".detail h3")).toBeVisible();
}

test.describe("accessibility — automated", () => {
  // Both schemes and both widths, because a contrast pair that passes in one
  // scheme can fail in the other: the viewer shipped `color: #fff` on an
  // accent that is dark in light mode (5.97:1) and LIGHT in dark mode
  // (2.19:1). One value written once, never rechecked in the other scheme.
  for (const colorScheme of ["light", "dark"] as const) {
    for (const [name, viewport] of [
      ["desktop", { width: 1280, height: 860 }],
      ["phone", { width: 390, height: 780 }],
    ] as const) {
      test(`no WCAG A/AA violations — ${colorScheme}, ${name}`, async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme, viewport });
        const page = await ctx.newPage();
        await selectANode(page);
        const { violations } = await new AxeBuilder({ page }).withTags([...TAGS]).analyze();
        // Named in the failure, so a red run says WHAT rather than how many.
        expect(violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
        await ctx.close();
      });
    }
  }
});

/* ── The docs site's own UI ─────────────────────────────────────────────── */

/**
 * The second surface under the rule, and it is a different KIND of surface:
 * the viewer above is a generated page this repo writes end to end, while
 * everything here is mounted by script into an unpinned remote theme's markup
 * — the action tiles and their views in the sidebar, and the per-page language
 * bar in `.main-content`. Contrast is the pair to watch: these sit on
 * backgrounds that differ per scheme, and a token checked in one scheme and
 * not the other is the trap this project has already paid for once.
 */
const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The harness page, as a function of THE SITE'S scheme rather than the OS's.
 *
 * The loop below has always said `light` and `dark`, and until 2026-09-19 it
 * only ever rendered the dark palette: `colorScheme` on the context sets
 * `prefers-color-scheme`, which this stylesheet consults twice and for
 * something else entirely. What the site's own colours key off is
 * `data-fa-scheme`, which `docs-ui.js` derives from `jtd.getTheme()` — and the
 * stub below was pinned to `"dark"`. A per-scheme token checked twice in the
 * same scheme is not checked in both.
 *
 * It is stamped on `<html>` as well as returned by the stub so the first paint
 * already has it. Otherwise the attribute lands after the bar has mounted, and
 * a `transition: background` means a reader of `getComputedStyle` — or an axe
 * run that is quick off the mark — can sample a colour that is on its way out.
 *
 * `fa-translation-meta` is here so the language bar renders all three of its
 * states: with no meta every locale but English is "not yet translated", and
 * the available-locale colour — one of the three text tokens — is never put on
 * screen for anything to measure.
 */
const tilesPage = (scheme: "light" | "dark") => `<!doctype html><html lang="en" data-fa-scheme="${scheme}"><head><meta charset="utf-8"><title>Action tiles harness</title><style>
  body { margin: 0; }
  .side-bar { position: fixed; top: 0; left: 0; width: 16.5rem; height: 100%;
              display: flex; flex-flow: column nowrap; align-items: flex-end;
              background: #27262b; color: #fff; }
  .site-header { width: 100%; max-height: 3.75rem; overflow: hidden; display: flex; align-items: center; }
  .site-title { flex: 1; }
  .site-nav { width: 100%; overflow-y: auto; }
  /* The theme colours its own nav links; a bare UA #0000ee on the dark
     sidebar is a harness artefact, and leaving it in would have this gate
     failing on markup the site does not ship. */
  .site-nav a { color: inherit; }
  ${readFileSync(join(REPO, "docs/assets/css/docs-ui.css"), "utf8")}
</style></head><body>
  <script type="application/json" id="fa-translation-meta">{"lang":"en","availableLocales":["fr","es"]}<\/script>
  <script type="application/json" id="fa-site-links">{"kg":"/kg/","source":"https://example.invalid/r"}<\/script>
  <div class="side-bar">
    <div class="site-header"><a class="site-title">folio-assistant</a></div>
    <nav class="site-nav"><a href="#">Home</a></nav>
  </div>
  <div class="main"><div class="main-content"><h1>Harness</h1></div></div>
  <script>window.jtd = { theme: "${scheme}", getTheme: function () { return this.theme; },
    setTheme: function (t) { this.theme = t; } };<\/script>
  <script>${readFileSync(join(REPO, "docs/assets/js/vendor/qrcode.js"), "utf8")}<\/script>
  <script>${readFileSync(join(REPO, "docs/assets/js/docs-ui.js"), "utf8")}<\/script>
</body></html>`;

test.describe("accessibility — the docs-site UI", () => {
  for (const colorScheme of ["light", "dark"] as const) {
    for (const [state, open] of [
      ["the grid", [] as string[]],
      ["a view", ["Settings"]],
    ] as const) {
      test(`no WCAG A/AA violations — ${state}, ${colorScheme}`, async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme });
        const page = await ctx.newPage();
        await page.setContent(tilesPage(colorScheme));
        await page.locator(".fa-tiles-toggle").click();
        for (const tile of open) await page.locator(".fa-tile", { hasText: tile }).click();
        // THE WHOLE PAGE, not just `.side-bar`.
        //
        // This run was scoped to the sidebar because a page-wide one failed on
        // the per-page language bar that `mountPageLanguageBar()` puts in
        // `.main-content` — #cbd1d9 on #f0f0f0 at 1.34:1 across five locale
        // tabs, and #ffffff on #3b82f6 at 3.67:1 on the current one, against a
        // 4.5:1 floor. Failing the tiles' gate for a defect that was not the
        // tiles' is how a gate gets weakened later, so it was recorded as bean
        // `rptk` and the scope stayed until the bar was fixed.
        //
        // It is fixed (per-scheme tokens in `docs-ui.css`, measured beside
        // each), so the scope comes off. What is checked here now is every
        // control `docs-ui.js` mounts into this page: the action tiles and
        // their views in `.side-bar`, AND the language bar in `.main-content`
        // — in both site schemes, since `tilesPage` drives `data-fa-scheme`.
        const { violations } = await new AxeBuilder({ page })
          .withTags([...TAGS])
          .analyze();
        // Named with the offending markup, because "color-contrast (7)" on its
        // own does not say WHICH pair, and a contrast failure is always a pair.
        expect(violations.map((v) => `${v.id}: ` +
          v.nodes.map((n) => n.failureSummary ?? n.html).join(" | "))).toEqual([]);
        await ctx.close();
      });
    }
  }
});

test.describe("accessibility — what axe cannot check", () => {
  test("the neighbourhood diagram is operable by keyboard", async ({ page }) => {
    // The gap axe is structurally unable to see. Every node in this diagram
    // was a <circle> with a click handler: no role, no tabindex, no keyboard
    // path, and nothing for a checker to report.
    await selectANode(page);
    const node = page.locator(".detail svg g.node").first();
    await expect(node).toHaveAttribute("role", "button");
    await expect(node).toHaveAttribute("tabindex", "0");

    await node.focus();
    const active = await page.evaluate(() => document.activeElement?.getAttribute("role"));
    expect(active).toBe("button");
  });

  test("Enter and Space follow an edge, as a button must", async ({ page }) => {
    // A <button> gets these from the platform. An SVG group with role="button"
    // does not, and a control that only answers the mouse is not a control.
    for (const key of ["Enter", " "]) {
      await selectANode(page);
      const before = await page.locator(".detail h3").textContent();
      await page.locator(".detail svg g.node").first().focus();
      await page.keyboard.press(key);
      await expect(page.locator(".detail h3")).not.toHaveText(String(before));
    }
  });

  test("every neighbour announces where it goes and how", async ({ page }) => {
    // The visible label is aria-hidden and truncated to 26 characters; the
    // accessible name is the whole thing plus the edge it travels.
    await selectANode(page);
    const label = await page.locator(".detail svg g.node").first().getAttribute("aria-label");
    expect(label).toMatch(/^(Links to|Referenced by) .+ via \w+$/);
  });

  test("no interactive target is under 24px tall", async ({ page }) => {
    // WCAG 2.2 SC 2.5.8. The page aims higher — see the module note — and this
    // holds the floor so the comfort margin can be spent without silence.
    await selectANode(page);
    const small = await page.evaluate(() => {
      const out: string[] = [];
      for (const e of document.querySelectorAll('button, a[href], [role="button"]')) {
        const r = e.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.height < 24) out.push(`${e.className || e.tagName} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
      return out;
    });
    expect(small).toEqual([]);
  });

  test("a keyboard user can skip the facet column", async ({ page }) => {
    await page.goto(PAGE);
    await page.keyboard.press("Tab");
    const skip = page.locator("a.skip");
    await expect(skip).toBeFocused();
    // Visible only when focused — it must not be a permanent artefact, and it
    // must not be one of those skip links that is hidden from everyone.
    await expect(skip).toBeVisible();
  });

  test("the search field has a name that survives typing", async ({ page }) => {
    // A placeholder IS the accessible name until somebody types, and then the
    // field has none. axe passes a placeholder-only input; a user does not.
    await page.goto(PAGE);
    await page.locator("#q").fill("beans");
    const name = await page.locator("#q").evaluate((el) => {
      const id = el.getAttribute("id");
      const lab = id === null ? null : document.querySelector(`label[for="${id}"]`);
      return el.getAttribute("aria-label") ?? lab?.textContent ?? null;
    });
    expect(name).toBeTruthy();
    expect(name).not.toBe("");
  });

  test("selecting a node is announced, not just redrawn", async ({ page }) => {
    // The panel is rewritten in place. Without a live region a screen-reader
    // user activates an edge and is told nothing: the page changed and their
    // cursor did not move.
    await page.goto(PAGE);
    const detail = page.locator("#detail");
    await expect(detail).toHaveAttribute("aria-live", "polite");
    await expect(detail).toHaveAttribute("role", "region");
  });

  test("filtering announces how many nodes matched", async ({ page }) => {
    await page.goto(PAGE);
    await page.locator("#q").fill("beans-cli");
    await expect(page.locator("#count")).toHaveAttribute("aria-live", "polite");
    await expect(page.locator("#count")).toContainText(/node/);
  });

  test("focus is visible, and not left to the UA default", async ({ page }) => {
    // The page had no focus styling at all and was never checked against the
    // accent backgrounds a focused control sits on.
    await page.goto(PAGE);
    await page.locator("#q").focus();
    const outline = await page.locator("#q").evaluate((el) => {
      const cs = getComputedStyle(el);
      return { width: cs.outlineWidth, style: cs.outlineStyle };
    });
    expect(outline.style).not.toBe("none");
    expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
  });
});

/* ── The sticky todo board ──────────────────────────────────────────────── */

/**
 * The board, the pinned layer, and the greyed slot.
 *
 * Run in BOTH schemes and BOTH viewports, like the viewer above, because the
 * defect this catches is a colour that passes in one scheme and fails in the
 * other from a single declaration — measured at 5.97:1 light / 2.19:1 dark.
 * The sticky CSS is written as neutral overlays over `currentColor` precisely
 * so it cannot have that shape; this is what says so rather than assuming it.
 *
 * The board is checked OPEN and with a sticky PINNED, because a hidden region
 * has no contrast to measure and an empty float layer has no card in it. An
 * axe run over a surface that is not on screen is a green that means nothing.
 */
test.describe("the sticky todo board", () => {
  const STICKY_ITEMS = [
    {
      id: "a", summary: "Decide the thing", comment: "Some detail.",
      status: "open", priority: "high", origin: "agent", createdAt: "2026-09-19",
      tags: { roles: [], processes: [], tasks: [], identities: [], references: [], artefacts: [] },
      editHref: "https://example.invalid/edit/main/todos/items/a.md",
    },
    {
      id: "b", summary: "Decide the other thing", comment: "More detail.",
      status: "blocked", priority: "critical", origin: "human", createdAt: "2026-09-19",
      tags: { roles: [], processes: [], tasks: [], identities: [], references: [], artefacts: [] },
      editHref: "https://example.invalid/edit/main/todos/items/b.md",
    },
  ];

  const ROOT2 = join(dirname(fileURLToPath(import.meta.url)), "..");
  const HARNESS = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Sticky todo harness</title>
<meta name="fa-todo-src" content="/assets/todos/index.json">
<style>${readFileSync(join(ROOT2, "docs/assets/css/docs-ui.css"), "utf8")}</style></head><body>
<div class="side-bar"><div class="site-header"><a class="site-title">Site</a></div><nav class="site-nav"></nav></div>
<div class="main-content-wrap"><div class="main-content" id="main-content"><h1>Harness</h1><p>Body.</p></div></div>
<script>${readFileSync(join(ROOT2, "docs/assets/js/docs-ui.js"), "utf8")}</script></body></html>`;

  for (const colorScheme of ["light", "dark"] as const) {
    for (const [name, viewport] of [
      ["desktop", { width: 1280, height: 860 }],
      ["phone", { width: 390, height: 780 }],
    ] as const) {
      test(`no WCAG A/AA violations — ${colorScheme}, ${name}`, async ({ browser }) => {
        const ctx = await browser.newContext({ colorScheme, viewport });
        const page = await ctx.newPage();
        await page.route("http://todo.a11y/**", (route) => {
          const url = route.request().url();
          if (url.endsWith("/page.html")) {
            return route.fulfill({ contentType: "text/html", body: HARNESS });
          }
          if (url.endsWith("/assets/todos/index.json")) {
            return route.fulfill({
              contentType: "application/json",
              body: JSON.stringify({ items: STICKY_ITEMS }),
            });
          }
          return route.fulfill({ status: 404, body: "not found" });
        });
        await page.goto("http://todo.a11y/page.html");
        await page.locator(".fa-qr-toggle").click();
        await page.locator(".fa-tile", { hasText: "Todos" }).click();
        // Expand one body and pin one sticky, so every surface this PR adds is
        // actually on screen when axe looks at it.
        await page.locator(".fa-sticky").first().locator(".fa-sticky-toggle").click();
        await page.locator(".fa-sticky").first().locator(".fa-sticky-pin").click();

        const { violations } = await new AxeBuilder({ page }).withTags([...TAGS]).analyze();
        expect(violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
        await ctx.close();
      });
    }
  }
});
