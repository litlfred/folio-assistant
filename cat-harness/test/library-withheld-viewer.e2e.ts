import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { test, expect } from "@playwright/test";

/**
 * A WITHHELD library entry says so in the rendered viewer — issue #1794.
 *
 * Measured before (PR #1799): both of who-iris's withheld entries rendered
 * every row as "(no content carried)", the sentence a page-scan with no text
 * gets. The viewer is client-rendered, so no grep of the committed HTML can
 * see what a reader sees; this opens the page.
 *
 * The withheld entries are read from `who-iris/library/withheld.json` — the
 * DECLARATION — never from the viewer's own data, so emptying the data cannot
 * empty the assertions (the defect `library-viewer-scope.e2e.ts` records).
 */
const SITE = process.env.FA_SITE_URL ?? "http://127.0.0.1:8080";
const DOCS = "/cat-harness/docs";
const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const listed = (
  JSON.parse(readFileSync(join(REPO, "who-iris", "library", "withheld.json"), "utf-8")) as {
    paths: { path: string }[];
  }
).paths
  .map((p) => p.path)
  .filter((p) => p.endsWith("/"))
  .map((p) => p.slice(0, -1));

test("the withheld list names at least one entry — else the test below proves nothing", () => {
  expect(listed.length).toBeGreaterThan(0);
});

for (const slug of listed) {
  test(`${slug}: banner, withheld rows with a record link, never "(no content carried)"`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${SITE}${DOCS}/cat-harness/library/who-iris/#${encodeURIComponent(`who-iris/${slug}`)}`);
    const blocks = page.locator("#blocks");
    await expect(blocks.locator("table")).toBeVisible();

    const banner = blocks.locator(".wh-banner");
    await expect(banner).toHaveCount(1);
    await expect(banner).toContainText("not granted");
    await expect(banner).toContainText(/\d+ of \d+ sections? summarised/);
    await expect(banner.locator("a")).toHaveAttribute("href", /item-item-[0-9a-f-]+\.html$/);

    const rows = await blocks.locator("tbody tr").count();
    expect(rows).toBeGreaterThan(0);
    // Every row shows a summary (an account of the section, not its words),
    // OR the withheld line with a record link, OR a carried extract (a block
    // whose text the licence does permit, e.g. a figure's caption) — nothing
    // else.
    // Asserted as that partition rather than as "some rows are withheld":
    // once every section of who-pub-tps-931 had a drafted summary (issue
    // #2302, 2026-10-06), "> 0 withheld lines" failed on a page that was
    // exactly right.
    const lines = blocks.locator("tbody .wh-line");
    const summarised = blocks.locator("tbody tr", { hasText: "Summary — an account of this section" });
    const carried = blocks.locator("tbody tr:has(pre)");
    const nLines = await lines.count();
    expect(nLines + (await summarised.count()) + (await carried.count())).toBe(rows);
    if (nLines > 0) await expect(lines.first().locator("a")).toHaveAttribute("href", /item-item-[0-9a-f-]+\.html$/);
    await expect(blocks).not.toContainText("(no content carried)");
    expect(errors).toEqual([]);
  });
}

test("an entry that is not withheld gets no banner", async ({ page }) => {
  const g = (await (await page.request.get(`${SITE}${DOCS}/assets/library/index.json`)).json()) as {
    entries: { instance: string; id: string; withheld?: string }[];
  };
  const open = g.entries.find((e) => e.instance === "who-iris" && !e.withheld && !listed.includes(e.id));
  test.skip(open === undefined, "who-iris holds no entry that is not withheld");
  await page.goto(`${SITE}${DOCS}/cat-harness/library/who-iris/#${encodeURIComponent(`who-iris/${open!.id}`)}`);
  await expect(page.locator("#blocks h2")).toBeVisible();
  await expect(page.locator("#blocks .wh-banner")).toHaveCount(0);
  await expect(page.locator("#blocks .wh-line")).toHaveCount(0);
});
