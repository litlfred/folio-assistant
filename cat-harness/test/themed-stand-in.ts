/**
 * A minimal stand-in for the site's `default` layout, for e2e specs over a
 * THEMED generated page (one written through `lib/themed-page.ts`).
 *
 * Jekyll does not run here. What the layout contributes that such a page
 * leans on is reproduced and nothing else: the page body inside
 * `<main class="main-content">`, the theme's ground and ink for the scheme
 * (`#27262b` dark, which is the site's default, and white light), the theme's
 * link colour, and `data-fa-scheme` on `<html>`, which `head_custom.html`
 * always sets and the pages' palettes are keyed on. The band itself is
 * `docs-ui.js`'s and is covered by its own specs.
 *
 * The page is served at its REAL path, so its relative data hrefs resolve
 * against `test-server.mjs` exactly as they do on the site.
 *
 * @module test/themed-stand-in
 */
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { themedBody } from "../scripts/lib/themed-page.ts";

export type Scheme = "dark" | "light";

/**
 * just-the-docs 0.12's own ground, ink and link colour for each scheme — the
 * site overrides none of them. Note the dark link colour: #2c84fa on #27262b
 * measures 4.13:1, under AA for body text. That is the THEME's, on every page
 * of the site, so {@link THEME_LINK} lets a spec tell it from a page's own.
 */
const GROUND: Record<Scheme, string> = {
  dark: "html,body{background:#27262b;color:#e6e1e8}a{color:#2c84fa}",
  light: "html,body{background:#ffffff;color:#5c5962}a{color:#7253ed}",
};

/** The theme's link colour in each scheme, as axe reports a foreground. */
export const THEME_LINK: Record<Scheme, string> = { dark: "#2c84fa", light: "#7253ed" };

/** The stand-in document around a themed page's body. */
export function themedShell(page: string, scheme: Scheme = "dark", title = "Themed page"): string {
  return `<!doctype html><html lang="en" data-fa-scheme="${scheme}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<style>${GROUND[scheme]}body{margin:0;font:16px/1.5 system-ui,sans-serif}
.main-content{max-width:50rem;margin:0 auto;padding:1rem}</style></head><body>
<main class="main-content" id="main-content">
${themedBody(page)}
</main></body></html>`;
}

/**
 * Serve the committed page at `urlPath` (repository-relative, as
 * `test-server.mjs` serves it) in the stand-in, and leave every other request
 * to the server. Call before `page.goto(urlPath)`.
 */
export async function serveThemed(p: Page, repoRoot: string, urlPath: string, scheme: Scheme = "dark"): Promise<void> {
  const file = join(repoRoot, urlPath.replace(/^\//, "").replace(/\/$/, "/index.html"));
  const body = themedShell(readFileSync(file, "utf8"), scheme);
  await p.route((url) => url.pathname === urlPath, (route) => route.fulfill({ contentType: "text/html", body }));
}
