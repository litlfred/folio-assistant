import { test, expect } from "@playwright/test";

/**
 * Every library entry has its own IRI, and the page there renders it.
 *
 * Owner, 2026-10-02 (#1881), having tried
 * `/cat-harness/library/smart-base/smart-trust` and found a 404: *"each
 * link/page needs to be materialized on the CDN (gh-pagees), just load the
 * content from the KG json(ld) assets already published"*, and *"no query
 * strings... each asset gets its own IRI"*.
 *
 * So the page at `<library>/<instance>/<id>/` is a real committed file — a thin
 * shell with no entry content in it — and this asserts, in a browser, that the
 * shell loads the entry from the published projection and selects it. A grep of
 * the committed HTML cannot: the shell holds the entry's id and nothing else,
 * whether it works or not (`library-viewer-scope.e2e.ts` carries that lesson).
 *
 * Served from the repository root by `test-server.mjs`, like every e2e here;
 * the shell's paths are relative, so they resolve under this prefix exactly as
 * they do on the published site.
 */
const SITE = process.env.FA_SITE_URL ?? "http://127.0.0.1:8080";
const LIB = "/cat-harness/docs/cat-harness/library";

function listen(page: import("@playwright/test").Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  return errors;
}

test("the smart-trust entry's own IRI renders it from the published data", async ({ page }) => {
  const errors = listen(page);
  const res = await page.goto(`${SITE}${LIB}/smart-base/smart-trust/`, { waitUntil: "networkidle" });
  expect(res?.status(), "the entry IRI must be a materialized page").toBe(200);

  const row = page.locator('[data-fa-library-item="smart-base/smart-trust"]');
  await expect(row).toHaveCount(1);
  await expect(row).toHaveAttribute("data-fa-anchored", "1");
  // Content the shell does NOT carry, so it came from the projection.
  await expect(row).toContainText("WHO SMART Trust");
  await expect(row.locator('a[href="http://smart.who.int/trust"]')).toHaveCount(1);
  await expect(row.locator('a[href$="/smart-trust/"]')).toHaveCount(1);
  // The row's own address is the path IRI — never a fragment or a query.
  const href = await row.getAttribute("data-fa-library-href");
  expect(href).toBe(`${LIB}/smart-base/smart-trust/`);
  await expect(page).toHaveTitle(/WHO SMART Trust/);
  // The JSON-LD it names as its alternate is published.
  const alt = await page.locator('link[rel="alternate"][type="application/ld+json"]').getAttribute("href");
  const ld = await page.request.get(new URL(alt!, page.url()).href);
  expect(ld.status()).toBe(200);
  expect(((await ld.json()) as { title?: string }).title).toBe("WHO SMART Trust");
  expect(errors).toEqual([]);
});

test("an old #key link is normalised ONCE to the path IRI", async ({ page }) => {
  const errors = listen(page);
  await page.goto(`${SITE}${LIB}/smart-base/#${encodeURIComponent("smart-base/smart-trust")}`, { waitUntil: "networkidle" });
  expect(new URL(page.url()).pathname).toBe(`${LIB}/smart-base/smart-trust/`);
  expect(new URL(page.url()).hash).toBe("");
  await expect(page.locator('[data-fa-library-item="smart-base/smart-trust"]')).toHaveAttribute("data-fa-anchored", "1");
  expect(errors).toEqual([]);
});

test("a shell whose entry the data does not hold says so, with a way back", async ({ page }) => {
  // The projection is served WITHOUT the entry: the shell is there and the
  // data is not, which is the case a reader would otherwise see as a blank
  // table that looks like it worked.
  await page.route("**/assets/library/index.json", async (route) => {
    const r = await route.fetch();
    const g = (await r.json()) as { entries: { instance: string; id: string }[] };
    g.entries = g.entries.filter((e) => !(e.instance === "smart-base" && e.id === "smart-trust"));
    await route.fulfill({ response: r, json: g });
  });
  await page.goto(`${SITE}${LIB}/smart-base/smart-trust/`, { waitUntil: "networkidle" });
  const status = page.locator('#status[data-fa-not-found="1"]');
  await expect(status).toContainText("No entry at this address");
  await expect(status.locator("a")).toHaveAttribute("href", `${LIB}/smart-base/`);
});
