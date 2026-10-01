import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { siteDirFor } from "../schemas/cat-harness.ts";

/**
 * The theme sidebar wears the viewer rail's layout: ONE scroll region.
 *
 * Owner ruling on bean ob3m finding 7, 2026-10-01, option 1 of 4: *"Use the
 * viewer-rail layout on Jekyll pages."* The generated rail (`lib/navbar.ts`,
 * #1762) has one scroller, the page's own section first and a folded "Graphs"
 * group after it. On a theme page the same reader met, measured on the built
 * landing at 1280x800 with every group open: the middle at its 128px floor
 * with 0 of 430 page links visible because FOLDERS sat above them, a second
 * scroller in the footer's harness group, and `.side-bar` clipping 2108px of
 * content into 800.
 *
 * ## What is asserted, and why as properties
 *
 * Three properties the ruling names, each one a thing a reader can see:
 *
 *   - exactly ONE element in the sidebar scrolls, and the sidebar itself
 *     hides nothing it cannot scroll to -- on arrival AND with every
 *     disclosure open, because nested scrollers only appear once things open;
 *   - the Graphs group (FOLDERS and the harness group together) is folded on
 *     arrival, and its heading is on screen;
 *   - page-list links are visible in the open sidebar, hit-tested rather than
 *     read off a box, because a link under another region is in the DOM, has
 *     a size, and cannot be clicked.
 *
 * ## The footer is the REAL one
 *
 * The harness group is read from `_includes/generated/navbar-footer.html`, the
 * include the site ships, with its Liquid resolved the one way it is used here
 * (the canonical branch, `relative_url` as the baseurl). A hand-written footer
 * in an older shape is exactly how `navbar-row.e2e.ts` came to test a harness
 * block (`.fa-harness-tabs`) that the generator no longer emits.
 *
 * NO BACKTICKS INSIDE THE TEMPLATE LITERAL below -- the page is one, so a
 * backtick in it ends the string (bean `bmr0`).
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = siteDirFor(ROOT);
const CSS = readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");
const QR = readFileSync(join(ROOT, SITE, "assets/js/vendor/qrcode.js"), "utf8");
const BASEURL = "/folio-assistant";

const HARNESS = JSON.parse(readFileSync(join(ROOT, SITE, "_data/harness.json"), "utf8")) as {
  navbar: unknown;
};
if (HARNESS.navbar === null || HARNESS.navbar === undefined) {
  throw new Error("docs/_data/harness.json has no navbar row. Run `bun run docs:harness`.");
}

/** The generated footer include, canonical branch, Liquid resolved. */
function footer(): string {
  const src = readFileSync(join(ROOT, SITE, "_includes/generated/navbar-footer.html"), "utf8");
  const open = "{%- if _fa_staging == '' -%}";
  const at = src.indexOf(open);
  const end = src.indexOf("{%- else -%}", at);
  if (at < 0 || end < 0) throw new Error("navbar-footer.html: canonical branch not found");
  const branch = src.slice(at + open.length, end);
  const html = branch.replace(/\{\{ '([^']*)' \| relative_url \}\}/g, (_m, p: string) => BASEURL + p);
  if (/\{\{|\{%/.test(html)) throw new Error("navbar-footer.html: unresolved Liquid in the canonical branch");
  return '<input type="checkbox" class="fa-nav-open" id="fa-nav-open">' + html;
}

/** Enough sections for "On this page", and a page list longer than any window. */
const MAIN = Array.from({ length: 12 }, (_, i) => '<h2 id="s' + i + '">Section ' + i + "</h2><p>text</p>").join("");
const NAV_ITEMS = Array.from(
  { length: 60 },
  (_, i) => '<li class="nav-list-item"><a class="nav-list-link" href="#p' + i + '">Page ' + i + "</a></li>",
).join("");

function page(): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <meta name="fa-baseurl" content="${BASEURL}">
  <meta name="fa-staging" content="">
  <style>
  body { margin: 0; }
  /* The theme's structure, copied from a built page: a fixed full-height
     flex column with a height-capped header, the page list, and the footer
     that carries the generated include. */
  .side-bar { position: fixed; top: 0; left: 0; width: 16.5rem; height: 100%;
              display: flex; flex-flow: column nowrap; align-items: flex-end;
              background: #27262b; color: #fff; z-index: 0; }
  .site-header { width: 100%; max-height: 3.75rem; overflow: hidden; display: flex; align-items: center; }
  .site-title { flex: 1; }
  .site-nav { width: 100%; overflow-y: auto; }
  .nav-list { margin: 0; padding: 0; list-style: none; }
  .site-nav a { display: block; padding: 4px 32px; font-size: 14px; line-height: 24px; color: #9ec5fe; }
  .d-none { display: none !important; }
  @media (min-width: 50rem) { .d-md-block { display: block !important; } .d-md-none { display: none !important; } }
  .main { margin-left: 16.5rem; }
  ${CSS}
</style></head><body>
  <script type="application/json" id="fa-navbar-row">${JSON.stringify(HARNESS.navbar)}<\/script>
  <div class="side-bar">
    <div class="site-header"><a class="site-title"><span class="fa-site-mark"></span><span class="fa-site-title">folio-assistant</span></a></div>
    <nav aria-label="Main" id="site-nav" class="site-nav"><ul class="nav-list">${NAV_ITEMS}</ul></nav>
    <div class="d-md-block d-none site-footer">${footer()}</div>
  </div>
  <div class="main"><div class="main-header"></div><div class="main-content">${MAIN}</div></div>
  <script>window.jtd = { theme: "dark",
    getTheme: function () { return this.theme; },
    setTheme: function (t) { this.theme = t; } };<\/script>
  <script>${QR}<\/script>
  <script>${JS}<\/script>
</body></html>`;
}

async function load(p: Page): Promise<string[]> {
  const errors: string[] = [];
  p.on("pageerror", (e) => errors.push(String(e)));
  // Served from an origin rather than set as content, so localStorage works.
  await p.route("http://sidebar.fixture/**", (r) => r.fulfill({ contentType: "text/html", body: page() }));
  await p.setViewportSize({ width: 1280, height: 800 });
  await p.goto("http://sidebar.fixture/page", { waitUntil: "load" });
  // PINNED OPEN, the state the ruling is about, by the control a reader uses:
  // from 50rem up the avatar opens and closes the bar (#1757).
  await p.locator(".side-bar .site-title").click();
  await expect(p.locator("#fa-nav-open")).toBeChecked();
  await p.mouse.move(1270, 790);
  await p.waitForTimeout(300);
  return errors;
}

/** Every element in the sidebar that actually scrolls, and whether the bar clips. */
async function scrolling(p: Page): Promise<{ scrollers: string[]; clipped: number }> {
  return p.evaluate(() => {
    const bar = document.querySelector(".side-bar") as HTMLElement;
    const scrollers = [bar, ...Array.from(bar.querySelectorAll<HTMLElement>("*"))]
      .filter((e) => {
        const s = getComputedStyle(e);
        return /(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 1 && e.getClientRects().length > 0;
      })
      .map((e) => e.tagName.toLowerCase() + "." + Array.from(e.classList).join("."));
    // A bar with overflow hidden that is taller inside than out is hiding
    // content nobody can scroll to -- a scroller that does not admit to it.
    return { scrollers, clipped: Math.max(0, bar.scrollHeight - bar.clientHeight - 1) };
  });
}

/** Page-list links a pointer can actually land on, in the window. */
async function visiblePageLinks(p: Page): Promise<number> {
  return p.evaluate(() => {
    let n = 0;
    for (const a of Array.from(document.querySelectorAll<HTMLElement>(".side-bar .site-nav a"))) {
      const r = a.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const x = r.left + Math.min(20, r.width / 2);
      const y = r.top + r.height / 2;
      if (y < 0 || y > innerHeight) continue;
      const hit = document.elementFromPoint(x, y);
      if (hit && (hit === a || a.contains(hit))) n++;
    }
    return n;
  });
}

test.describe("the theme sidebar has the viewer rail's layout (ob3m finding 7)", () => {
  test("exactly ONE scroll region, on arrival and with every group open", async ({ page }) => {
    const errors = await load(page);
    expect(errors).toEqual([]);
    const arrival = await scrolling(page);
    expect(arrival.scrollers).toEqual(["div.fa-nav-middle"]);
    expect(arrival.clipped).toBe(0);

    await page.evaluate(() => {
      for (const d of Array.from(document.querySelectorAll<HTMLDetailsElement>(".side-bar details"))) d.open = true;
    });
    await page.waitForTimeout(200);
    const open = await scrolling(page);
    expect(open.scrollers).toEqual(["div.fa-nav-middle"]);
    expect(open.clipped).toBe(0);
  });

  test("the order is the rail's: On this page, the page list, then Graphs", async ({ page }) => {
    await load(page);
    const order = await page
      .locator(".side-bar > .fa-nav-middle > *")
      .evaluateAll((ns) => ns.map((n) => n.className.split(" ")[0]));
    expect(order).toEqual(["fa-doc-index", "fa-nav-pages", "site-nav", "fa-nav-graphs-group"]);
  });

  test("FOLDERS and the harness links are ONE Graphs group, folded on arrival", async ({ page }) => {
    await load(page);
    const group = page.locator(".side-bar .fa-nav-graphs-group");
    await expect(group).toHaveCount(1);
    await expect(group).not.toHaveAttribute("open", "");
    await expect(group.locator(":scope > .fa-nav-folders")).toHaveCount(1);
    await expect(group.locator(":scope > details.fa-nav-group")).toHaveCount(1);
    // Nothing of either is left behind in the footer.
    await expect(page.locator(".side-bar .site-footer details")).toHaveCount(0);
    // Home stays pinned in the footer, below everything.
    await expect(page.locator(".side-bar .site-footer .fa-nav-bottom > a")).toHaveCount(1);
    // The folded heading is on screen and opens the group in one click.
    const heading = group.locator(":scope > summary");
    await expect(heading).toBeInViewport();
    await heading.click();
    await expect(group).toHaveAttribute("open", "");
    await expect(group.locator(".fa-nav-folders__heading")).toBeInViewport();
  });

  test("page-list links are visible in the open sidebar at 1280x800", async ({ page }) => {
    await load(page);
    expect(await visiblePageLinks(page)).toBeGreaterThanOrEqual(8);
  });

  test("...and still visible with every group open, scrolled to the top", async ({ page }) => {
    // The state finding 7 measured: every disclosure open. The old layout put
    // FOLDERS above the page list inside a middle squeezed to its 128px floor,
    // so 0 page links were reachable without scrolling. Here the page list
    // follows "On this page" directly and the middle keeps the height.
    await load(page);
    await page.evaluate(() => {
      for (const d of Array.from(document.querySelectorAll<HTMLDetailsElement>(".side-bar details"))) d.open = true;
    });
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      for (const e of Array.from(document.querySelectorAll<HTMLElement>(".side-bar, .side-bar *"))) e.scrollTop = 0;
    });
    expect(await visiblePageLinks(page)).toBeGreaterThanOrEqual(1);
  });
});
