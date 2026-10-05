import { test, expect } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { siteDirFor, repoRootFor } from "../schemas/cat-harness.ts";
import { translationMetaBlock, withTranslationMeta } from "../scripts/lib/translation-meta.ts";

/**
 * A MOUNTED page wears the docs pages' locale globe — issue #2219.
 *
 * Owner, 2026-10-05: *"Why no translations on /who-iris/?"*, then *"declared
 * languages should still be there, just greyed out if not declared. USE THE
 * SAME CHROME AS FOLIO-ASSISTANT."*
 *
 * The page is the one `gen-iris-pages.ts` wrote, with the block
 * `mount-instance-docs.ts` adds at mount time, made by the same function. So
 * this exercises the real emitter and the real `docs-ui.js`, not a fixture's
 * idea of either. The control is the same page WITHOUT the block, which must
 * keep its layout: `folio-mount.e2e.ts` holds the replica's fidelity on that.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const REPO = repoRootFor(ROOT);
const SITE = siteDirFor(ROOT);

const CSS = readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");
const PAGE_FILE = join(REPO, "who-iris", "site", "index.html");
const PAGE = existsSync(PAGE_FILE) ? readFileSync(PAGE_FILE, "utf8") : "";
const MOUNTED = withTranslationMeta(PAGE, translationMetaBlock(join(REPO, "who-iris")));

async function serve(page: import("@playwright/test").Page, body: string): Promise<void> {
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("assets/css/docs-ui.css")) {
      return route.fulfill({ status: 200, contentType: "text/css", body: CSS });
    }
    if (url.pathname.endsWith("assets/js/docs-ui.js")) {
      return route.fulfill({ status: 200, contentType: "text/javascript", body: JS });
    }
    if (url.pathname !== "/who-iris/") return route.fulfill({ status: 404, body: "" });
    return route.fulfill({ status: 200, contentType: "text/html", body });
  });
  await page.goto("http://127.0.0.1:8080/who-iris/");
  await page.waitForLoadState("networkidle");
}

for (const width of [1280, 390]) {
  test.describe(`/who-iris/ at ${width} px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("the band carries the globe, every declared locale, only English live", async ({ page }) => {
      expect(PAGE, `${PAGE_FILE} is missing — run \`bun run iris:pages\``).not.toBe("");
      await serve(page, MOUNTED);
      const toggle = page.locator(".fa-glass-band .fa-page-lang-toggle");
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");

      const tabs = page.locator(".fa-page-lang-tab");
      await expect(tabs).toHaveText(["AR", "ZH", "EN", "FR", "RU", "ES"]);
      // Only the source is a link; the rest are the main site's greyed spans.
      await expect(page.locator("a.fa-page-lang-tab")).toHaveText(["EN"]);
      await expect(page.locator("span.fa-page-lang-tab.is-unavailable")).toHaveCount(5);
    });
  });
}

test("without the block, the replica keeps its layout", async ({ page }) => {
  await serve(page, PAGE);
  await expect(page.locator(".fa-glass-handle")).toBeVisible();
  await expect(page.locator(".fa-page-lang-toggle")).toHaveCount(0);
});
