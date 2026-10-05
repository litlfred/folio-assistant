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
 *   - FOLDERS -- a top-level section since the owner's ruling on #2150
 *     (2026-10-05, option (a): no "Graphs" wrapper on this surface) -- and
 *     the harness group beside it are both
 *     folded on arrival, and both headings are on screen -- ▦ Harnesses
 *     stays its own disclosure, as on the viewer rail, so the strip still
 *     shows it at rest (ob3m finding 1, #1805; `rail-tips.e2e.ts`);
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
// The row's own stylesheet FIRST, as `head_custom.html` links it (beans `lhvt`, `9rq1`).
const CSS = readFileSync(join(ROOT, SITE, "assets/css/navbar-row.css"), "utf8") + "\n" + readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
// `navbar-row.js` FIRST — it draws the row, and `docs-ui.js` calls it — as `head_custom.html` loads them.
const JS = readFileSync(join(ROOT, SITE, "assets/js/navbar-row.js"), "utf8") + "\n" + readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");
const QR = readFileSync(join(ROOT, SITE, "assets/js/vendor/qrcode.js"), "utf8");
const BASEURL = "/folio-assistant";

type Folder = { kind: string; label?: string; path?: string; note?: string; stagingOnly?: true };
const HARNESS = JSON.parse(readFileSync(join(ROOT, SITE, "_data/harness.json"), "utf8")) as {
  navbar: { folders?: Folder[] } | null;
  railScopes?: { name: string; title: string; href: string; folders: Folder[] }[];
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

/**
 * THE SCOPE UNDER TEST (#1902), taken from the generated data rather than
 * named: the first instance `railScopes` lists. The fixture page sits at that
 * instance's root, and its page list holds the instance's root row with a
 * table of contents under it, among the site's 60 other pages.
 */
const SCOPE = (HARNESS.railScopes ?? [])[0];
const TOC = ["Home", "Business Requirements", "Deployment"];
function scopedNavItem(): string {
  if (!SCOPE) return "";
  const kids = TOC.map(
    (t, i) => '<li class="nav-list-item"><a class="nav-list-link" href="' + BASEURL + SCOPE.href + "toc-" + i + '.html">' + t + "</a></li>",
  ).join("");
  return '<li class="nav-list-item"><button class="nav-list-expander" aria-expanded="false"></button>' +
    '<a class="nav-list-link" href="' + BASEURL + SCOPE.href + '">' + SCOPE.title + '</a><ul class="nav-list">' + kids + "</ul></li>";
}

function page(scoped = false): string {
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
  /* The theme sizes the avatar link to its 3.75rem header; it is a link now (the open control). */
  .site-title { flex: 1; display: flex; align-items: center; min-height: 3.75rem; }
  .site-nav { width: 100%; overflow-y: auto; }
  .nav-list { margin: 0; padding: 0; list-style: none; }
  .site-nav a { display: block; padding: 4px 32px; font-size: 14px; line-height: 24px; color: #9ec5fe; }
  .d-none { display: none !important; }
  @media (min-width: 50rem) { .d-md-block { display: block !important; } .d-md-none { display: none !important; } }
  .main { margin-left: 16.5rem; }
  /* The theme folds a row's children until it is active; the fixture keeps that rule. */
  .nav-list .nav-list-item > .nav-list { display: none; }
  .nav-list .nav-list-item.active > .nav-list { display: block; }
  ${CSS}
</style></head><body>
  <script type="application/json" id="fa-navbar-row">${JSON.stringify(HARNESS.navbar)}<\/script>
  ${scoped && SCOPE ? '<script type="application/json" id="fa-rail-scope">' + JSON.stringify(SCOPE) + "<\/script>" : ""}
  <div class="side-bar">
    <div class="site-header"><a class="site-title" href="/folio-assistant/"><span class="fa-site-mark"></span><span class="fa-site-title">folio-assistant</span></a></div>
    <nav aria-label="Main" id="site-nav" class="site-nav"><ul class="nav-list">${NAV_ITEMS}${scoped ? scopedNavItem() : ""}</ul></nav>
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

const fixturePage = (): string => page();

async function load(p: Page, scoped = false): Promise<string[]> {
  const errors: string[] = [];
  p.on("pageerror", (e) => errors.push(String(e)));
  // Served from an origin rather than set as content, so localStorage works.
  await p.route("http://sidebar.fixture/**", (r) => r.fulfill({ contentType: "text/html", body: page(scoped) }));
  await p.setViewportSize({ width: 1280, height: 800 });
  await p.goto("http://sidebar.fixture" + (scoped && SCOPE ? BASEURL + SCOPE.href : "/page"), { waitUntil: "load" });
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
    // The same question of every region INSIDE the one scroller: a flex
    // child allowed to shrink is clipped rather than scrolled, which is how an
    // open "On this page" was once squeezed to a sliver.
    const mid = bar.querySelector(".fa-nav-middle");
    const inner = mid
      ? Array.from(mid.children as HTMLCollectionOf<HTMLElement>).reduce(
          (n, e) => n + Math.max(0, e.scrollHeight - e.clientHeight - 1),
          0,
        )
      : 0;
    return { scrollers, clipped: Math.max(0, bar.scrollHeight - bar.clientHeight - 1) + inner };
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

  test("the order is the rail's: On this page, the page list, then Folders", async ({ page }) => {
    await load(page);
    const order = await page
      .locator(".side-bar > .fa-nav-middle > *")
      .evaluateAll((ns) => ns.map((n) => n.className.split(" ")[0]));
    expect(order).toEqual(["fa-doc-index", "fa-nav-pages", "site-nav", "fa-nav-folders", "fa-nav-group"]);
  });

  test("FOLDERS is a top-level section with NO Graphs wrapper, and ▦ Harnesses sits beside it, both folded (#2150)", async ({ page }) => {
    // Owner's ruling on #2150, 2026-10-05, option (a): "Folders becomes its
    // own top-level section on the Jekyll sidebar, next to On this page and
    // Pages. Drop the Jekyll Graphs wrapper." Before it, a folded "Graphs"
    // hid FOLDERS and the owner read it as gone.
    await load(page);
    const group = page.locator(".side-bar > .fa-nav-middle > details.fa-nav-folders");
    await expect(group).toHaveCount(1);
    await expect(group).not.toHaveAttribute("open", "");
    await expect(page.locator(".side-bar .fa-nav-graphs-group")).toHaveCount(0);
    expect(await page.locator(".side-bar summary").allTextContents()).not.toContain("Graphs");
    // It lists the active harness's declared directories, every one.
    await expect(group.locator(":scope > .fa-nav-folders__list .fa-nav-folders__item"))
      .toHaveCount(HARNESS.navbar!.folders!.length);
    // BESIDE Folders, not inside it: the viewer rail's order, and what keeps
    // ▦ a mark in the strip at rest (ob3m finding 1, #1805).
    const harnesses = page.locator(".side-bar > .fa-nav-middle > details.fa-nav-harness-group");
    await expect(harnesses).toHaveCount(1);
    await expect(harnesses).not.toHaveAttribute("open", "");
    await expect(harnesses.locator(":scope > summary")).toBeInViewport();
    // Both headings are pinned to the bottom edge; Folders stands ON TOP of ▦.
    const g = await group.locator(":scope > summary").boundingBox();
    const h = await harnesses.locator(":scope > summary").boundingBox();
    expect(g!.y + g!.height).toBeLessThanOrEqual(h!.y + 1);
    // Nothing of either is left behind in the footer.
    await expect(page.locator(".side-bar .site-footer details")).toHaveCount(0);
    // Home stays pinned in the footer, below everything.
    await expect(page.locator(".side-bar .site-footer .fa-nav-bottom > a")).toHaveCount(1);
    // The folded heading is on screen and opens the group in one click.
    const heading = group.locator(":scope > summary");
    await expect(heading).toBeInViewport();
    await heading.click();
    await expect(group).toHaveAttribute("open", "");
    await expect(group.locator(":scope > .fa-nav-folders__list")).toBeVisible();
  });

  test("FOLDERS opens from the keyboard and states aria-expanded (#2150)", async ({ page }) => {
    await load(page);
    const heading = page.locator(".side-bar > .fa-nav-middle > .fa-nav-folders > summary");
    await expect(heading).toHaveAttribute("aria-expanded", "false");
    await heading.focus();
    await page.keyboard.press("Enter");
    await expect(heading).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".side-bar .fa-nav-folders")).toHaveAttribute("open", "");
  });

  test("FOLDERS opens on arrival when the page being read is one of its rows (#2150)", async ({ page }) => {
    // A folded default must not hide where the reader is.
    const at = (HARNESS.navbar!.folders ?? []).find((f) => f.path && !f.stagingOnly);
    test.skip(!at, "no published folder in this instance's row");
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.route("http://sidebar.fixture/**", (r) => r.fulfill({ contentType: "text/html", body: fixturePage() }));
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("http://sidebar.fixture" + BASEURL + at!.path, { waitUntil: "load" });
    expect(errors).toEqual([]);
    await expect(page.locator(".side-bar .fa-nav-folders")).toHaveAttribute("open", "");
    await expect(page.locator(".side-bar .fa-nav-folders > summary")).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator('.side-bar .fa-nav-folders a[aria-current="page"]')).toHaveCount(1);
  });

  test("the tooltips (#1805) still name the rows AFTER the move", async ({ page }) => {
    // MOVED, never re-rendered: the harness rows keep the `data-fa-tip` the
    // generator wrote, and `.side-bar [data-fa-tip]::after` still reaches
    // them inside the one scroller -- `position: fixed`, so its overflow does
    // not clip the tooltip.
    await load(page);
    const group = page.locator(".side-bar > .fa-nav-middle > details.fa-nav-harness-group");
    await group.locator(":scope > summary").click();
    await expect(group).toHaveAttribute("open", "");
    const gear = group.locator("[data-fa-tip]").first();
    await expect(gear).toBeInViewport();
    await gear.hover();
    await page.waitForTimeout(250);
    const tip = await gear.evaluate((e) => {
      const s = getComputedStyle(e, "::after");
      return { content: s.content, opacity: +s.opacity, position: s.position, label: e.getAttribute("aria-label") };
    });
    expect(tip.label).toBeTruthy();
    expect(tip.content).toContain(tip.label!);
    expect(tip.position).toBe("fixed");
    expect(tip.opacity).toBeGreaterThan(0.9);
    // The icon row's own tooltips are untouched by the rail.
    const untipped = await page.locator(".side-bar .fa-nav-icons .fa-nav-icon:not([data-fa-tip])").count();
    expect(untipped).toBe(0);
    expect(await page.locator(".side-bar .fa-nav-icons [data-fa-tip]").count()).toBeGreaterThan(0);
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

  for (const [w, h] of [[1280, 800], [390, 844]] as const) {
    test("no ☰ and no × of the sidebar's own at " + w + "x" + h + " (ob3m finding 8)", async ({ page }) => {
      // Owner, 2026-10-01, option 1 of 4: the theme's avatar opens and closes
      // the sidebar, so its own ☰ and [x] go, as #1762 removed them from the
      // rail. Their rules all sat inside the 50rem block, so below 800px a
      // copy rendered as loose unstyled text. Asserted by class AND by glyph:
      // a control that came back under a new class name is the same defect.
      const errors = await load(page);
      expect(errors).toEqual([]);
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(200);
      await expect(page.locator(".fa-nav-close, .fa-nav-toggle, .fa-nav-head")).toHaveCount(0);
      const glyphs = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>(".side-bar *, .site-footer *"))
          .filter((e) => e.getClientRects().length > 0)
          .filter((e) => Array.from(e.childNodes).some((n) => n.nodeType === 3 && /[\u2630\u00d7]/.test(n.textContent ?? "")))
          .map((e) => e.tagName.toLowerCase() + "." + Array.from(e.classList).join(".")),
      );
      expect(glyphs).toEqual([]);
    });
  }

  test("the avatar is the one control: it opens and closes, by pointer and by keyboard", async ({ page }) => {
    await load(page);
    const avatar = page.locator(".side-bar .site-title");
    // load() pinned it open by a click; a second click closes it.
    await avatar.click();
    await expect(page.locator("#fa-nav-open")).not.toBeChecked();
    await avatar.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#fa-nav-open")).toBeChecked();
    await expect(avatar).toHaveAttribute("aria-expanded", "true");
  });
});

test.describe("the rail is scoped to the instance being viewed (#1902)", () => {
  test.skip(!SCOPE, "docs/_data/harness.json declares no railScopes -- run `bun run docs:harness`");

  test("PAGES lists the instance's own table of contents, not the whole site", async ({ page }) => {
    const errors = await load(page, true);
    expect(errors).toEqual([]);
    await expect(page.locator(".side-bar .site-nav")).toHaveAttribute("data-fa-scope", SCOPE!.name);
    // The instance's root row and its TOC -- and nothing of the site's other 60.
    await expect(page.locator(".fa-nav-pages__count")).toHaveText(String(1 + TOC.length));
    const shown = await page
      .locator(".side-bar .site-nav a.nav-list-link")
      .evaluateAll((as) => as.filter((a) => a.getClientRects().length > 0).map((a) => (a.textContent ?? "").trim()));
    expect(shown).toEqual([SCOPE!.title, ...TOC]);
  });

  test("FOLDERS lists the instance's own declared graphs", async ({ page }) => {
    await load(page, true);
    const folders = page.locator(".side-bar .fa-nav-folders");
    await expect(folders).toHaveAttribute("data-fa-scope", SCOPE!.name);
    await expect(page.locator(".fa-nav-folders__count")).toHaveText(String(SCOPE!.folders.length));
    const kinds = await folders
      .locator(":scope > .fa-nav-folders__list > .fa-nav-folders__item")
      .evaluateAll((ls) => ls.map((l) => (l.firstElementChild?.firstChild?.textContent ?? "").trim()));
    // The row prints the label `harness-tiles.ts` set, falling back to the kind
    // word (bean `ob3m` finding 6) -- the same rule as `docs-ui.js`.
    expect(kinds.sort()).toEqual(SCOPE!.folders.map((f) => f.label || f.kind).sort());
  });

  test("PAGES comes before FOLDERS", async ({ page }) => {
    await load(page, true);
    const order = await page
      .locator(".side-bar > .fa-nav-middle > *")
      .evaluateAll((ns) => ns.map((n) => n.className.split(" ")[0]));
    expect(order.indexOf("fa-nav-pages")).toBeGreaterThanOrEqual(0);
    expect(order.indexOf("fa-nav-pages")).toBeLessThan(order.indexOf("fa-nav-folders"));
  });

  test("outside every instance the whole site is listed, as before", async ({ page }) => {
    await load(page, false);
    await expect(page.locator(".side-bar .site-nav")).not.toHaveAttribute("data-fa-scope", /.*/);
    await expect(page.locator(".fa-nav-pages__count")).toHaveText("60");
    await expect(page.locator(".fa-nav-folders__count")).toHaveText(String(HARNESS.navbar?.folders?.length ?? 0));
  });
});

test.describe("every disclosure in the column wears the same caret and states (#1902)", () => {
  const HEADINGS = [
    ".fa-doc-index > summary",
    ".fa-nav-pages",
    ".fa-nav-folders > summary",
  ];

  test("one glyph, turned the same way when folded and when open", async ({ page }) => {
    await load(page);
    const caret = (sel: string) =>
      page.locator(".side-bar " + sel).evaluate((e) => {
        const s = getComputedStyle(e, "::before");
        return { content: s.content, transform: s.transform };
      });
    const pages = await caret(".fa-nav-pages");
    expect(pages.content).not.toBe("none");
    for (const sel of HEADINGS) {
      const c = await caret(sel);
      expect(c.content, sel).toBe(pages.content);
    }
    // Pages arrives open; fold it. Folded carets must all match each other.
    await page.locator(".side-bar .fa-nav-pages").click();
    await page.waitForTimeout(300); // the caret turns over 120ms
    const folded = await caret(".fa-nav-pages");
    expect((await caret(".fa-doc-index > summary")).transform).toBe(folded.transform);
    expect((await caret(".fa-nav-folders > summary")).transform).toBe(folded.transform);
    await page.locator(".side-bar .fa-nav-folders > summary").click();
    await page.waitForTimeout(300);
    const open = await caret(".fa-nav-folders > summary");
    expect(open.transform).not.toBe(folded.transform);
  });

  test("each heading states aria-expanded and toggles from the keyboard", async ({ page }) => {
    await load(page);
    for (const sel of HEADINGS) {
      const h = page.locator(".side-bar " + sel);
      const before = await h.getAttribute("aria-expanded");
      expect(before === "true" || before === "false", sel + " aria-expanded=" + before).toBe(true);
      await h.focus();
      await page.keyboard.press("Enter");
      await expect(h, sel).toHaveAttribute("aria-expanded", before === "true" ? "false" : "true");
      await page.keyboard.press("Space");
      await expect(h, sel).toHaveAttribute("aria-expanded", before!);
    }
  });
});
