import { test, expect } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { siteDirFor, repoRootFor } from "../schemas/cat-harness.ts";
import { MARKER } from "../scripts/folio-mount.ts";

/**
 * THE FOLIO MOUNT on a REAL generated who-iris page. Bean `jpjt`, F8/F9.
 *
 * Owner: *"who-iris, smart-* etc are content libraries a user is browsing and
 * their 'folio' from the cat-harness is consistent across them."*
 *
 * ## Why this reads the generated file instead of building a fixture
 *
 * `glass.e2e.ts` already proves the glass mounts on a page with no
 * just-the-docs furniture — but it proves it against a REPLICA the test
 * itself writes, which is the test author's idea of what a who-iris page
 * looks like. `check-invocation-parity` is the standing lesson here: *a
 * matcher proven only against fixtures is proven against its author's idea of
 * the file.*
 *
 * So the bytes below come off disk: the page `gen-iris-pages.ts` actually
 * wrote, the `docs-ui.css` and `docs-ui.js` actually published. If the
 * generator stops emitting the mount, or the mount's derived root stops
 * finding the assets, these fail.
 *
 * ## The fidelity assertion is the point, not a nicety
 *
 * who-iris exists to be a faithful replica — *"ingested copy — not WHO, not
 * live"* is its requirement 1, and the page is built from the captured IRIS
 * theme *"verbatim"*. A folio that restyled it would have failed F8/F9 rather
 * than met it, and it would fail invisibly: the folio would work.
 *
 * `docs-ui.css` is 587 distinct selectors. Swept before writing this, exactly
 * **one** is globally scoped in a way a replica can feel — `:focus-visible`,
 * which paints a 3px `currentColor` outline. Everything else is `.fa-*`,
 * `:root` custom properties (inert unless referenced), just-the-docs class
 * names absent here, or `*` inside `prefers-reduced-motion`. That sweep is a
 * claim about a file; the test below is the measurement, over every element
 * the replica renders.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const REPO = repoRootFor(ROOT);
const SITE = siteDirFor(ROOT);

const CSS = readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");

/**
 * A page the generator wrote. `community-list.html` is the library landing —
 * the page a reader arrives on, so the one whose folio matters most.
 */
const PAGE_FILE = join(REPO, "who-iris", "library", "community-list.html");
const PAGE = existsSync(PAGE_FILE) ? readFileSync(PAGE_FILE, "utf8") : "";

/**
 * The same page with the mount REMOVED — the control for the fidelity
 * comparison below.
 *
 * It strips the whole `<script>` ELEMENT, and the first version of this
 * renamed the marker attribute instead. That control was worthless and said
 * so only under falsification: the attribute is a marker for the gate, not
 * what makes the script run, so the inline script still executed, still
 * appended `docs-ui.css`, and "with" and "without" were the same page. The
 * fidelity test passed a deliberately injected `body { font-size: 22px }`.
 *
 * Kept as a comment rather than quietly fixed because the shape recurs: a
 * control that does not remove the thing under test makes every comparison
 * against it vacuous, and it fails silently in the passing direction.
 */
function withoutMount(html: string): string {
  const i = html.indexOf(`<script ${MARKER}>`);
  if (i < 0) return html;
  const j = html.indexOf("</script>", i) + "</script>".length;
  return html.slice(0, i) + html.slice(j);
}

/**
 * Serve the real page at `path`, with the platform assets at the site root
 * the mount derives. `page.route` rather than a server, as
 * `staging-banner.e2e.ts` does, because the 404 on the todo index has to be
 * produced exactly rather than arranged — a replica page has no todo index
 * and the glass must come down anyway.
 */
async function serve(
  page: import("@playwright/test").Page,
  path: string,
  opts: { withMount?: boolean } = {},
): Promise<string[]> {
  const asked: string[] = [];
  const body = opts.withMount === false ? withoutMount(PAGE) : PAGE;

  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    asked.push(url.pathname);
    if (url.pathname.endsWith("assets/css/docs-ui.css")) {
      return route.fulfill({ status: 200, contentType: "text/css", body: CSS });
    }
    if (url.pathname.endsWith("assets/js/docs-ui.js")) {
      return route.fulfill({ status: 200, contentType: "text/javascript", body: JS });
    }
    if (url.pathname.endsWith(".json")) {
      return route.fulfill({ status: 404, body: "not found" });
    }
    if (/\.(png|svg|jpe?g|woff2?|ico)$/.test(url.pathname)) {
      return route.fulfill({ status: 404, body: "" });
    }
    return route.fulfill({ status: 200, contentType: "text/html", body });
  });

  await page.goto(`http://127.0.0.1:8080${path}`);
  await page.waitForLoadState("networkidle");
  return asked;
}

test.describe("the generated page carries the mount", () => {
  test("the file gen-iris-pages.ts wrote contains the marker", () => {
    // Guards the whole file: every assertion below is vacuous if the page was
    // never generated, and a suite that passes over a missing artefact is the
    // `dh4f` shape.
    expect(PAGE, `${PAGE_FILE} is missing — run \`bun run iris:pages\``).not.toBe("");
    expect(PAGE).toContain(MARKER);
  });
});

test.describe("the glass comes down on a library page", () => {
  test("the handle is there, on the route library/ is served at", async ({ page }) => {
    await serve(page, "/who-iris/community-list.html");
    await expect(page.locator(".fa-glass-handle")).toBeVisible();
  });

  test("and on the OTHER mount route, where a relative href would 404", async ({ page }) => {
    // `who-iris/library/` is served at `/who-iris/` and `who-iris/docs/` at
    // `/docs/who-iris/`. One generated file, two depths below the site root —
    // which is the whole reason the root is derived in the browser.
    await serve(page, "/docs/who-iris/index.html");
    await expect(page.locator(".fa-glass-handle")).toBeVisible();
  });

  test("and under a staging preview, where an absolute site URL would break", async ({ page }) => {
    await serve(page, "/folio-assistant/STAGING/claude-example/who-iris/community-list.html");
    await expect(page.locator(".fa-glass-handle")).toBeVisible();
  });

  test("it opens, and closing is reachable — `l4zi`", async ({ page }) => {
    await serve(page, "/who-iris/community-list.html");
    const handle = page.locator(".fa-glass-handle");
    await handle.click();
    await expect(page.locator('.fa-sticky-layer[data-fa-glass="open"]')).toBeVisible();
    await handle.click();
    await expect(page.locator('.fa-sticky-layer[data-fa-glass="open"]')).toHaveCount(0);
  });

  test("an empty glass says so rather than looking broken", async ({ page }) => {
    // The todo index 404s on a replica — there is no folio content here yet.
    // "Nothing on your glass" and "the glass is broken" are opposite facts.
    await serve(page, "/who-iris/community-list.html");
    await page.locator(".fa-glass-handle").click();
    await expect(page.locator(".fa-glass-empty")).toBeVisible();
  });
});

test.describe("a path the pattern does not match", () => {
  test("requests no platform assets rather than guessing a root", async ({ page }) => {
    // Returning `null` is a real state. A client that guessed would issue two
    // requests that 404 on every page of an instance that mis-declared its
    // route — noise that looks like a broken site rather than a wrong config.
    const asked = await serve(page, "/somewhere/else/page.html");
    expect(asked.filter((p) => p.includes("docs-ui"))).toHaveLength(0);
  });
});

test.describe("the replica is unchanged with the glass closed", () => {
  /**
   * Every element's computed box and colour, keyed by a stable path. Compared
   * between the page with the mount and the same page without it.
   */
  const snapshot = async (page: import("@playwright/test").Page) =>
    page.evaluate(() => {
      const out: Record<string, string> = {};
      const walk = (el: Element, path: string) => {
        // The folio's own chrome is not the replica and is excluded by name;
        // everything else the page renders is compared.
        if (el.className && String(el.className).indexOf("fa-") === 0) return;
        const c = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        out[path] =
          [c.color, c.backgroundColor, c.fontFamily, c.fontSize, c.fontWeight, c.lineHeight,
            c.margin, c.padding, c.border, c.display, c.textDecorationLine].join("|") +
          "#" + [r.x, r.y, r.width, r.height].map((n) => Math.round(n)).join(",");
        let i = 0;
        for (const kid of Array.from(el.children)) walk(kid, `${path}/${kid.tagName}[${i++}]`);
      };
      walk(document.body, "BODY");
      return out;
    });

  test("no element moves, resizes or changes colour", async ({ page }) => {
    await serve(page, "/who-iris/community-list.html", { withMount: false });
    const before = await snapshot(page);

    await serve(page, "/who-iris/community-list.html");
    await expect(page.locator(".fa-glass-handle")).toBeVisible(); // the mount really ran
    const after = await snapshot(page);

    const changed = Object.keys(before).filter((k) => before[k] !== after[k]);
    expect(
      changed.map((k) => `${k}\n  without: ${before[k]}\n  with:    ${after[k]}`).join("\n"),
    ).toBe("");
    // A snapshot of nothing would satisfy the line above, so the premise is
    // asserted: the same trap `site-mark-mask.test.ts` fell into.
    expect(Object.keys(before).length).toBeGreaterThan(20);
  });

  test("the ingested-copy banner — who-iris requirement 1 — still reads as itself", async ({ page }) => {
    await serve(page, "/who-iris/community-list.html");
    const banner = page.locator(".ingested").first();
    await expect(banner).toBeVisible();
    await expect(banner).toHaveCSS("background-color", "rgb(0, 102, 102)");
  });
});
