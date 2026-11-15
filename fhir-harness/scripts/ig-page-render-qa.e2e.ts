/**
 * The browser half of `ig-page-render-qa.test.ts`: the page scan run in a real
 * Chromium. It is an `.e2e.ts` because `bun test` runs where no browser is
 * installed (folio-assistant's bun-test shards are browser-free by design,
 * owner 2026-10-14), and Playwright runs it where one is.
 */
import { expect, test } from "playwright/test";
import { scanSite } from "./ig-page-render-qa.ts";
import { pageScanSite } from "./ig-page-render-qa-fixture.ts";

test("ig-page-render-qa: scans the drawn pages in a browser", async () => {
  test.setTimeout(60_000);
  const q = await scanSite(pageScanSite(), { timeoutMs: 5000 });
  expect(q.unavailable).toBeUndefined();
  expect(q.scanned).toBe(2);
  expect(q.unfinished).toEqual([]);
  expect(q.findings).toEqual([
    { page: "artifact/ActorDefinition-a.html", markup: ["bold"], excerpt: "**Persona**: a phone" },
    { page: "artifact/ActorDefinition-a.html", markup: ["image"], excerpt: "and ![Bo]" },
  ]);
});
