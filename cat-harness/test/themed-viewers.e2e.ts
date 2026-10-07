/**
 * The viewer families moved onto the site's layout (2026-10-07) render, run
 * their scripts and stay WCAG A/AA clean on both of the theme's grounds.
 *
 * Each was a standalone document with its own palette; themed, it styles only
 * inside its wrapper and takes its ground and ink from the theme, so the
 * question is whether its own hues still read against the theme's dark ground
 * and its light one. Served in the layout stand-in (`themed-stand-in.ts`) at
 * the page's real path, so its projection is fetched from the server exactly
 * as on the site.
 *
 * @module test/themed-viewers.e2e
 */
import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { serveThemed, THEME_LINK, type Scheme } from "./themed-stand-in.ts";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DOCS = "/cat-harness/docs";

/** A page, the wrapper its CSS is scoped under, and what says its script ran. */
const PAGES: { name: string; path: string; wrapper: string; ready: string; readyText?: RegExp }[] = [
  { name: "voices", path: `${DOCS}/cat-harness/voices/index.html`, wrapper: ".vo-page", ready: "#foot", readyText: /voice\(s\)/ },
  { name: "uploads", path: `${DOCS}/cat-harness/uploads/index.html`, wrapper: ".up-page", ready: "#badges .badge" },
  { name: "document-kinds", path: `${DOCS}/cat-harness/document-kinds/index.html`, wrapper: ".dk-page", ready: "#dk-title" },
  { name: "translation-status", path: `${DOCS}/translation-status/index.html`, wrapper: ".ts-page", ready: "#ts-title" },
  // Last, and with room: a ~1.9 MB projection and ~1700 list rows, so its
  // load and its axe pass are the slow ones.
  { name: "schemas", path: `${DOCS}/cat-harness/schemas/index.html`, wrapper: ".sc-page", ready: "#counts", readyText: /declarations/ },
];

for (const pg of PAGES) {
  for (const scheme of ["dark", "light"] as Scheme[]) {
    test(`${pg.name} renders and is WCAG A/AA clean on the ${scheme} ground`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      await serveThemed(page, REPO, pg.path, scheme);
      await page.goto(pg.path);
      const ready = page.locator(pg.ready).first();
      await expect(ready).toBeVisible();
      if (pg.readyText) await expect(ready).toContainText(pg.readyText, { timeout: 30_000 });
      expect(errors).toEqual([]);
      // Nothing of the raw block leaked into the rendered page.
      await expect(page.locator("body")).not.toContainText("{% raw %}");
      const { violations } = await new AxeBuilder({ page })
        .include(pg.wrapper)
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      // The theme's own link colour, UNALTERED, is the theme's finding and not
      // this page's (`THEME_LINK`). Only that exact foreground is set aside: a
      // page that dims or recolours a link changes the foreground, and is
      // still reported.
      const own = violations
        .map((v) => ({
          ...v,
          nodes: v.id !== "color-contrast" ? v.nodes : v.nodes.filter((n) =>
            !(/(^|[\s>])a([[:.\s]|$)/.test(n.target.join(" ")) && (n.failureSummary ?? "").includes(`foreground color: ${THEME_LINK[scheme]},`))),
        }))
        .filter((v) => v.nodes.length > 0);
      expect(
        own.map((v) => `${v.id} [${v.impact}] ×${v.nodes.length} — ${v.help}: ` +
          v.nodes.slice(0, 4).map((n) => `${n.target.join(" ")} (${n.failureSummary ?? ""})`).join("; ")),
      ).toEqual([]);
    });
  }
}
