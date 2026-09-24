import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { repoRootFor } from "../schemas/cat-harness.ts";

/**
 * The Pagefind prototype page, in a browser, over the committed fixture.
 * Bean `folio-assistant-4pm8`.
 *
 * `large-datasets/schemas/pagefind.test.ts` proves the fixture is what the
 * seeded generator makes and that its index builds. This proves the part only
 * a browser can: that the page loads the bundle as built, that every fixture
 * title finds its own node in the top 10, and that the page loads NOTHING
 * from outside `large-datasets/` -- Pagefind is admitted in that subgraph
 * only, and a page that reached for a script elsewhere would be the first
 * step of it leaking into the plain docs.
 *
 * The index is built here, into the git-ignored `build/`, because Pagefind
 * output is never committed.
 */
const REPO = repoRootFor(join(import.meta.dirname, ".."));
const PAGE = "/large-datasets/pagefind/index.html";
const fixture = JSON.parse(readFileSync(join(REPO, "large-datasets", "pagefind", "fixture.json"), "utf8")) as Array<{ id: string; title: string; url: string }>;

type Hit = { url: string; title: string };
type W = { __titleSearch(v: string): Promise<Hit[]>; __titleSearchReady?: boolean };

test.beforeAll(() => {
  execFileSync("bun", ["run", "large-datasets/scripts/bench-pagefind.ts", "--fixture"], { cwd: REPO, stdio: "inherit" });
});

test("the fixture is not trivially small", () => {
  expect(fixture.length).toBeGreaterThanOrEqual(50);
});

/**
 * Pagefind keys a record by its URL, and the LATER of two records with one
 * URL silently replaces the earlier: measured, no error is raised. Two real
 * collections share the URL of their community, so they are not searchable
 * by their own titles. The ids differ; Pagefind never sees them.
 */
const lastWithUrl = new Map(fixture.map((e) => [e.url, e.id]));
const replaced = fixture.filter((e) => lastWithUrl.get(e.url) !== e.id);

test("two fixture nodes share a URL with a later one, and only those", () => {
  expect(replaced.map((e) => e.id).sort()).toEqual(["collection/hq-publications", "collection/wpro-information-products"]);
});

test("every fixture title finds its own node in the top 10, and the page loads nothing outside large-datasets/", async ({ page }) => {
  const outside: string[] = [];
  let origin = "";
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.protocol === "data:") return;
    if (u.origin !== origin || !u.pathname.startsWith("/large-datasets/")) outside.push(r.url());
  });
  origin = new URL(PAGE, test.info().project.use.baseURL).origin;
  await page.goto(PAGE);
  await page.waitForFunction(() => typeof (window as unknown as W).__titleSearch === "function");
  expect(await page.evaluate(() => (window as unknown as W).__titleSearchReady)).toBe(true);
  for (const n of fixture) {
    const top = await page.evaluate((q) => (window as unknown as W).__titleSearch(q), n.title);
    const own = top.some((h) => h.url === n.url && h.title === n.title);
    // A node replaced by a later one with its URL is not found by its own title; every other node is.
    expect(own, n.id).toBe(!replaced.includes(n));
  }
  expect(outside).toEqual([]);
});

test("the form lists matches as links to where each node is held, and says when there are none", async ({ page }) => {
  const n = fixture.find((e) => e.id.startsWith("community/"))!;
  await page.goto(`${PAGE}?q=${encodeURIComponent(n.title)}`);
  await expect(page.locator("#out a").first()).toHaveAttribute("href", n.url);
  await page.fill("#q", "zzqxjv");
  await page.press("#q", "Enter");
  await expect(page.locator("#out")).toHaveText("No title matches.");
});
