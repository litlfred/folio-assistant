import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { siteDirFor } from "../schemas/cat-harness.ts";

/**
 * Every harness row in "▦ Harnesses" sits at ONE indent, whatever its mark is
 * drawn with. Issue #2151, owner 2026-10-05: *"alignment of harnesses is off"*.
 *
 * Measured before the fix on the committed `beans/index.html`: the
 * avatar-marked rows (Folio Assistant, WHO IRIS, C@T Harness, Bootstrap) had
 * their mark at one x and the glyph-marked rows (smart-trust, SMART Base,
 * given glyphs by #2122) sat flush left at another. `itemHtml` used to infer
 * `fa-nav-kind`, the graph-kind row class that `navbarCss()` pulls back into
 * the strip column, from "has an SVG glyph". Since #2122 a harness can have
 * one too. The class is now declared (`NavItem.kind`), set only by
 * `graphKindRowDecor`.
 *
 * WHAT IS SERVED, not a restatement: a GENERATED viewer page exactly as
 * committed (its own inline `navbarCss()`), and the Jekyll sidebar built the
 * way `rail-tips.e2e.ts` builds it from the generated footer include.
 *
 * NO BACKTICKS INSIDE THE PAGE TEMPLATE LITERAL (`bmr0`).
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = join(ROOT, siteDirFor(ROOT));
const CSS = readFileSync(join(SITE, "assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(SITE, "assets/js/docs-ui.js"), "utf8");
const QR = readFileSync(join(SITE, "assets/js/vendor/qrcode.js"), "utf8");
const BASEURL = "/folio-assistant";
const DATA = JSON.parse(readFileSync(join(SITE, "_data/harness.json"), "utf8")) as {
  navbar: unknown;
  harnesses: { name: string; instantiated?: boolean; mark?: { src?: string; glyph?: string } | null }[];
};
const VIEWER = readFileSync(join(SITE, "beans/index.html"), "utf8");
const FOOTER = (() => {
  const src = readFileSync(join(SITE, "_includes/generated/navbar-footer.html"), "utf8");
  const line = src.split("\n").find((l) => l.startsWith('<div class="fa-nav-in">'));
  if (!line) throw new Error("navbar-footer.html carries no regions line — run `bun run navbar:include`.");
  return line.replace(/\{\{\s*'([^']*)'\s*\|\s*relative_url\s*\}\}/g, (_m, p: string) => BASEURL + p);
})();

function landing(): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <meta name="fa-baseurl" content="${BASEURL}">
  <style>
  body { margin: 0; font-family: sans-serif; }
  .side-bar { position: fixed; top: 0; left: 0; width: 16.5rem; height: 100%;
              display: flex; flex-flow: column nowrap; align-items: flex-end;
              background: #f5f6fa; color: #27262b; }
  .site-header { width: 100%; max-height: 3.75rem; overflow: hidden; display: flex; align-items: center; }
  .site-title { flex: 1; }
  .site-nav { width: 100%; overflow-y: auto; }
  ${CSS}
</style></head><body>
  <script type="application/json" id="fa-navbar-row">${JSON.stringify(DATA.navbar)}<\/script>
  <div class="side-bar">
    <div class="site-header"><a class="site-title" href="#"><span class="fa-site-mark"></span><span class="fa-site-title">C@T Harness</span></a></div>
    <nav class="site-nav"><a href="#">Navigation link</a></nav>
    <footer class="site-footer"><input type="checkbox" class="fa-nav-open" id="fa-nav-open">${FOOTER}</footer>
  </div>
  <div class="main"><div class="main-content"><h1 id="t">Landing</h1></div></div>
  <script>window.jtd = { theme: "light",
    getTheme: function () { return this.theme; },
    setTheme: function (t) { this.theme = t; } };<\/script>
  <script>${QR}<\/script>
  <script>${JS}<\/script>
</body></html>`;
}

/** The instantiated harnesses, and which of them are drawn with a glyph rather than an image. */
const SHOWN = DATA.harnesses.filter((h) => h.instantiated === true);
const GLYPHED = SHOWN.filter((h) => h.mark?.glyph && !h.mark?.src);

async function open(p: Page, which: "landing" | "viewer"): Promise<string[]> {
  const errors: string[] = [];
  p.on("pageerror", (e) => errors.push(String(e)));
  await p.route("http://align.fixture/**", (r) =>
    r.fulfill({ contentType: "text/html", body: which === "landing" ? landing() : VIEWER }),
  );
  await p.goto("http://align.fixture/" + which + "/", { waitUntil: "load" });
  // Pinned open, with ▦ unfolded: the state the owner's screenshot shows.
  await p.evaluate(() => {
    const box = document.getElementById("fa-nav-open") as HTMLInputElement | null;
    if (box) box.checked = true;
    for (const s of document.querySelectorAll("summary")) {
      if (s.textContent?.includes("Harnesses")) (s.parentElement as HTMLDetailsElement).open = true;
    }
  });
  await p.mouse.move(1200, 700);
  await p.waitForTimeout(300);
  return errors;
}

/** Each harness row's mark: its row's label, its left edge, and whether it is an image or a drawn glyph. */
async function harnessMarks(p: Page) {
  return p.evaluate(() => {
    const group = [...document.querySelectorAll("details")].find(
      (d) => d.querySelector(":scope > summary")?.textContent?.includes("Harnesses"),
    );
    if (!group) return [];
    const sub = group.querySelector(":scope > .fa-nav-sub")!;
    // A harness row is a direct link of the group, or the link of a
    // `.fa-nav-row` (a row with a ⚙ or children). Never a nested graph row.
    const rows = [...sub.querySelectorAll(":scope > a, :scope > .fa-nav-row > a")];
    return rows.map((a) => {
      const g = a.querySelector(":scope > .fa-nav-glyph")!;
      return {
        label: a.querySelector(".fa-nav-label")?.textContent?.trim() ?? "",
        x: Math.round(g.getBoundingClientRect().left),
        drawn: g.querySelector("svg") !== null ? "glyph" : g.querySelector("img") !== null ? "image" : "letter",
        kindClass: a.classList.contains("fa-nav-kind"),
      };
    });
  });
}

for (const which of ["viewer", "landing"] as const) {
  test(`${which}: every harness row's mark has the same left edge, glyph or image (#2151)`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    expect(await open(page, which)).toEqual([]);
    const marks = await harnessMarks(page);
    expect(marks.length).toBe(SHOWN.length);
    // Not vacuous: the case the bug needs, both kinds of mark, is present.
    expect(GLYPHED.length).toBeGreaterThan(0);
    expect(marks.some((m) => m.drawn === "glyph")).toBe(true);
    expect(marks.some((m) => m.drawn === "image")).toBe(true);
    // A harness row is not a graph-kind row, whatever its mark is drawn with.
    expect(marks.filter((m) => m.kindClass).map((m) => m.label)).toEqual([]);
    const xs = new Set(marks.map((m) => m.x));
    expect([...xs], JSON.stringify(marks)).toHaveLength(1);
  });
}
