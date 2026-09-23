/**
 * The Harnesses config panel (issue #1146), the owner's "Hybrid": reached from
 * Settings and from a ⚙ on each sidebar divider, never from a fifth strip tile.
 * The data is the generated `assets/harness/config.json`, stubbed here in its
 * real shape (`scripts/harness-panel.ts`).
 */
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { siteDirFor } from "../schemas/cat-harness.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = siteDirFor(ROOT);
const CSS = readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<style>${CSS}</style></head><body>
<ul class="fa-harness-tabs__list"><li class="fa-harness-tab">
  <a class="fa-harness-tab__body" href="/cat/">C@T Harness</a>
  <button type="button" class="fa-harness-tab__config" data-fa-harness-config="cat-harness"
          aria-label="Configuration of C@T Harness">&#x2699;&#xFE0E;</button>
</li></ul>
<script>${JS}</script></body></html>`;

const CONFIG = {
  properties: [
    { key: "name", skills: [{ name: "instance-kinds", path: "/reference/skill-instructions/instance-kinds.html" }] },
    { key: "associatedHarnesses", skills: [{ name: "associate-harness", path: "/reference/skill-instructions/associate-harness.html" }] },
    { key: "topology", skills: [], gap: "no skill edits `topology` yet" },
  ],
  harnesses: [
    {
      name: "cat-harness", title: "C@T Harness", group: "instantiated", declaredIn: "cat-harness/cat-harness.json",
      viewHref: "https://github.com/x/y/blob/main/cat-harness/cat-harness.json",
      editHref: "https://github.com/x/y/edit/main/cat-harness/cat-harness.json",
      declared: [{ key: "name", summary: "cat-harness" }, { key: "associatedHarnesses", summary: "1: ihris" }],
    },
    { name: "smart-l1", title: "smart-l1", group: "checkout", declaredIn: "smart-l1/smart-l1.json", declared: [] },
  ],
  associated: [
    {
      name: "ihris", title: "iHRIS Knowledge Base", url: "https://litlfred.github.io/ihris/",
      repository: "https://github.com/litlfred/ihris", editHref: "https://github.com/litlfred/ihris",
      relation: "folio-of", declaredBy: ["cat-harness"],
    },
  ],
  findings: ["`topology`: no skill edits `topology` yet"],
};

test.beforeEach(async ({ page }) => {
  await page.route("http://replica.test/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/page.html") return route.fulfill({ contentType: "text/html", body: PAGE });
    if (url.pathname === "/assets/harness/config.json") {
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(CONFIG) });
    }
    return route.fulfill({ status: 404, body: "not found" });
  });
  await page.goto("http://replica.test/page.html");
  await page.waitForSelector(".fa-glass-handle", { state: "attached" });
});

const panel = (page: Page) => page.locator('[data-fa-panel="glass-harnesses"]');

test("the sidebar ⚙ opens the glass on that harness's properties and edit skills", async ({ page }) => {
  await page.click('[data-fa-harness-config="cat-harness"]');
  await expect(page.locator(".fa-sticky-layer")).toHaveAttribute("data-fa-glass", "open");
  const p = panel(page);
  await expect(p.locator(".fa-hc-title")).toContainText("C@T Harness");
  await expect(p.locator('.fa-hc-item[aria-current="true"]')).toContainText("C@T Harness");
  const row = p.locator(".fa-hc-table tbody tr", { hasText: "associatedHarnesses" }).first();
  await expect(row.locator("a")).toHaveAttribute("href", /associate-harness\.html$/);
  const edit = p.locator(".fa-hc-actions a").first();
  await expect(edit).toHaveAttribute("href", /\/edit\/main\/cat-harness\/cat-harness\.json$/);
  await expect(edit).toHaveAttribute("aria-label", /Edit C@T Harness's declaration/);
});

test("Settings reaches the panel; the three groups are there", async ({ page }) => {
  await page.click(".fa-glass-handle");
  await page.click('[data-fa-glass-chrome="glass-settings"]');
  await page.click(".fa-glass-harnesses");
  const p = panel(page);
  await expect(p.locator('[data-fa-hc-group="instantiated"] h3')).toContainText("(1)");
  await expect(p.locator('[data-fa-hc-group="checkout"] h3')).toContainText("(1)");
  await expect(p.locator('[data-fa-hc-group="associated"] h3')).toContainText("(1)");
  await expect(p.locator(".fa-hc-findings")).toContainText("1 findings");
});

test("an associated harness links to its own site and its own repository, never here", async ({ page }) => {
  await page.click('[data-fa-harness-config="cat-harness"]');
  const p = panel(page);
  await p.locator(".fa-hc-item", { hasText: "iHRIS Knowledge Base" }).click();
  await expect(p.locator(".fa-hc-actions a", { hasText: "Open" })).toHaveAttribute("href", "https://litlfred.github.io/ihris/");
  await expect(p.locator(".fa-hc-actions a", { hasText: "Its repository" })).toHaveAttribute("href", "https://github.com/litlfred/ihris");
  await expect(p).toContainText("referenced, never loaded");
});

test("every control in the panel is at least 44px tall", async ({ page }) => {
  await page.click('[data-fa-harness-config="cat-harness"]');
  const small = await panel(page).locator(".fa-hc-item, .fa-hc-actions a").evaluateAll((els) =>
    els.filter((e) => e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().height < 44).map((e) => e.textContent));
  expect(small).toEqual([]);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("it drills in: the chosen harness alone, with a way back to the list", async ({ page }) => {
    await page.click('[data-fa-harness-config="cat-harness"]');
    const p = panel(page);
    await expect(p.locator(".fa-hc-list")).toBeHidden();
    await p.locator(".fa-hc-back").click();
    await expect(p.locator(".fa-hc-list")).toBeVisible();
    await expect(p.locator(".fa-hc-detail")).toBeHidden();
  });
});
