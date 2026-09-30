import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { siteDirFor } from "../schemas/cat-harness.ts";

/**
 * The site-wide table filter, as a browser builds it (bean 0fua).
 *
 * The glossary, processes, skills index and tools pages were each one flat
 * table of 48 to 270 rows with no way in but scrolling. The owner chose one
 * filter in the shared script over one per visualiser (2026-09-30), so the
 * thing under test is `mountTableFilters` in the shipped docs-ui.js, loaded
 * from the file rather than retyped.
 *
 * NO BACKTICKS INSIDE THE TEMPLATE LITERAL that builds the page (bean bmr0).
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = siteDirFor(ROOT);
const CSS = readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");

function table(n: number, attrs = "", wrap = false): string {
  const rows = Array.from({ length: n }, (_, i) =>
    "<tr><td>item-" + i + "</td><td>" + (i % 2 ? "lean proof" : "prose note") + "</td></tr>").join("");
  const t = "<table" + attrs + "><thead><tr><th>id</th><th>kind</th></tr></thead><tbody>" + rows + "</tbody></table>";
  return wrap ? '<div class="table-wrapper">' + t + "</div>" : t;
}

function page(main: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <meta name="fa-baseurl" content="/folio-assistant">
  <style>${CSS}</style></head>
  <body><div class="main"><div class="main-content">${main}</div></div>
  <script>${JS}<\/script></body></html>`;
}

async function open(p: Page, main: string): Promise<string[]> {
  const errors: string[] = [];
  p.on("pageerror", (e) => errors.push(String(e)));
  await p.route("http://filter.fixture/**", (r) => r.fulfill({ contentType: "text/html", body: page(main) }));
  await p.goto("http://filter.fixture/t", { waitUntil: "load" });
  return errors;
}

test.describe("table filter", () => {
  test("a long table gets a labelled filter with a live count; a short one does not", async ({ page: p }) => {
    const errors = await open(p, table(40, "", true) + table(10));
    expect(errors).toEqual([]);
    const boxes = p.locator(".fa-table-filter");
    await expect(boxes).toHaveCount(1);
    const input = p.getByLabel("Filter this table");
    await expect(input).toBeVisible();
    const count = p.locator(".fa-table-filter-count");
    await expect(count).toHaveAttribute("aria-live", "polite");
    await expect(count).toHaveText("40 of 40 rows");
    // Before the theme's scroll wrapper, so it does not scroll with the table.
    expect(await p.locator(".table-wrapper").evaluate((w) => w.previousElementSibling?.className)).toBe(
      "fa-table-filter",
    );
    const h = await input.evaluate((e) => e.getBoundingClientRect().height);
    expect(h).toBeGreaterThanOrEqual(44);
  });

  test("every word must match, and clearing restores every row", async ({ page: p }) => {
    await open(p, table(40));
    const input = p.getByLabel("Filter this table");
    const visible = p.locator("tbody tr:not([hidden])");
    await input.fill("LEAN");
    await expect(visible).toHaveCount(20);
    await expect(p.locator(".fa-table-filter-count")).toHaveText("20 of 40 rows");
    await input.fill("lean item-3");
    // item-3, item-31..39 odd ones: 3, 31, 33, 35, 37, 39
    await expect(visible).toHaveCount(6);
    await input.fill("");
    await expect(visible).toHaveCount(40);
  });

  test("data-fa-no-filter opts a table out", async ({ page: p }) => {
    await open(p, '<div data-fa-no-filter="">' + table(40) + "</div>" + table(30, ' data-fa-no-filter=""'));
    await expect(p.locator(".fa-table-filter")).toHaveCount(0);
  });
});
