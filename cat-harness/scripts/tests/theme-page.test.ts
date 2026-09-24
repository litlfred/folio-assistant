/**
 * The themes page — what a reader browsing `themes/` actually gets.
 *
 * Owner, 2026-09-24: *"have the themes harness make themes/ page to browse"*.
 * `theme:page:check` proves the committed page is CURRENT; this file proves it
 * is USABLE, which is the distinction `check:artefact-verification` exists to
 * keep (PR #805: a page can be byte-current and still broken).
 *
 * ## What is asserted
 *
 * - **Every theme in the registry has a row, and nothing else does.** A row
 *   per theme is the page's whole claim; a theme missing from it is a theme
 *   nobody can look at.
 * - **Every image link resolves to a file the site publishes.** Over the real
 *   declaration, not a fixture — a link to art that is not under the site
 *   directory 404s for every reader.
 * - **The raw HTML survives kramdown.** No blank line and no four-space indent
 *   inside the block, because either ends the HTML block and prints the rest
 *   of the table as text. Measured on this site before: `check-escaped-markup`
 *   exists because a generator's output looked right and rendered escaped.
 * - **"Worn by" agrees with the landing board**, which is read from the same
 *   declared contributions the board is built from.
 *
 * **Not the prose**, for the reason `methodologies-viz.test.ts` gives: a test
 * pinning sentences fails every time one is improved.
 *
 * @module scripts/tests/theme-page.test
 */
import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { instanceRootFor, siteDirFor } from "../../schemas/cat-harness.js";
import { THEMES } from "../../schemas/themes.js";
import { declaredContributions } from "../ensure-landing-sticky.js";
import { buildPage, sheetBody, wornBy } from "../render-theme-sheet.js";

const ROOT = instanceRootFor(join(import.meta.dir, ".."));
const SITE = resolve(ROOT, siteDirFor(ROOT));
const { md } = buildPage(ROOT);

/** The raw HTML block: from the sheet's opening div to its close. */
function htmlBlock(page: string): string {
  const start = page.indexOf(`<div class="fa-theme-sheet">`);
  const end = page.lastIndexOf("</div>");
  expect(start).toBeGreaterThan(-1);
  return page.slice(start, end + "</div>".length);
}

describe("the themes page", () => {
  it("has exactly one row per registered theme", () => {
    const ids = [...md.matchAll(/<tr id="theme-([^"]+)">/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).toEqual(THEMES.map((t) => t.id));
  });

  it("links every image to a file the site publishes", () => {
    const links = [...md.matchAll(/\{\{ '\/([^']+)' \| relative_url \}\}/g)]
      .map((m) => m[1]!)
      .filter((p) => p.startsWith("assets/"));
    // Vacuity guard: a page with no art links would pass the loop below.
    expect(links.length).toBeGreaterThanOrEqual(3);
    for (const rel of links) expect({ rel, exists: existsSync(join(SITE, rel)) }).toEqual({ rel, exists: true });
  });

  it("shows each themed sample sticky with that theme's SQUARE crop behind it", () => {
    // Owner, 2026-09-24: "themes/ pages should show sticky as square", with the
    // square crop as the default art. Checked per theme with a backdrop, so a
    // sample that fell back to another crop — or to none — fails by name.
    const themed = THEMES.filter((t) => t.backdrop !== undefined);
    expect(themed.length).toBeGreaterThan(0);
    for (const t of themed) {
      const row = md.slice(md.indexOf(`<tr id="theme-${t.id}">`));
      const demo = row.slice(row.indexOf(`<div class="demo"`), row.indexOf("</tr>"));
      const art = /<img class="demo-art" src="([^"]+)"/.exec(demo)?.[1] ?? "";
      expect({ id: t.id, square: /-card\.webp' \| relative_url/.test(art) }).toEqual({ id: t.id, square: true });
    }
  });

  it("reports an unreadable image as unreadable, never as a link", () => {
    const { html } = sheetBody(ROOT, () => undefined);
    expect(html).toContain("could not read");
    expect(html).not.toContain("<img");
  });

  it("emits an HTML block kramdown will not break", () => {
    const block = htmlBlock(md);
    const lines = block.split("\n");
    expect(lines.filter((l) => l.trim() === "")).toEqual([]);
    expect(lines.filter((l) => /^ {4}/.test(l))).toEqual([]);
  });

  it("lists as wearers exactly the landing-board cards that chose each theme", () => {
    const worn = wornBy(ROOT);
    const cards = declaredContributions(ROOT);
    expect(cards.length).toBeGreaterThan(0);
    for (const c of cards) expect(worn.get(c.contribution.theme)).toContain(c.contribution.id);
    const total = [...worn.values()].reduce((n, v) => n + v.length, 0);
    expect(total).toBe(cards.length);
  });
});
