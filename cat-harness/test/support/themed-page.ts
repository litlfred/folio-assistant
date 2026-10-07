/**
 * A committed THEMED page, served in a minimal stand-in for the site layout.
 *
 * ## Why a stand-in
 *
 * A themed page (`layout: default` front matter, a Liquid-raw body) is not a
 * document until Jekyll wraps it, and the e2e server serves the repository as
 * committed. So a spec that opens one gets the front matter as text and no
 * head. The library viewer's pages became themed on 2026-10-07
 * (`gen-library-viz.ts` `libraryPageHtml`); before that every spec here opened
 * the committed standalone file directly.
 *
 * The stand-in carries what the layout contributes that a page relies on, and
 * nothing more: the page title, the `alternate` link `head_custom.html` writes
 * from `alternate_jsonld`, the theme's ground, body ink and link ink for the
 * scheme ({@link THEME} — a page's colours are written for that ground),
 * `data-fa-scheme` on `<html>`, and the
 * body inside `<main class="main-content">`. Whether the page IS on the layout
 * is asserted by the unit tests, from the front matter.
 *
 * `beans-page-search.e2e.ts` is the precedent this follows.
 *
 * @module test/support/themed-page
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";

import type { Page } from "@playwright/test";

/**
 * The theme's ground and body ink in each scheme — the ground as
 * head_custom.html's first-paint block paints it. The LINK ink follows
 * `table-filter.e2e.ts`: light is the theme's (#7253ed, about 5.0:1 on white);
 * dark is the stand-in's own choice, because the theme's dark link colour
 * (#2c84fa on #27262b) measures about 4.1:1 — a site-wide finding outside any
 * one page, which a page's own spec does not inherit.
 */
export const THEME = {
  dark: { ground: "#27262b", ink: "#e6e1e8", link: "#8ab4f8" },
  light: { ground: "#ffffff", ink: "#5c5962", link: "#7253ed" },
} as const;
export type Scheme = keyof typeof THEME;

/** A themed page, split into what Jekyll reads and what it renders. */
export interface ThemedPage {
  frontMatter: Record<string, string>;
  body: string;
}

/** Split a themed page; `undefined` when the text has no front matter. */
export function parseThemed(text: string): ThemedPage | undefined {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) return undefined;
  const frontMatter: Record<string, string> = {};
  for (const line of m[1]!.split("\n")) {
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!kv || kv[2] === "") continue;
    const v = kv[2]!.trim();
    frontMatter[kv[1]!] = v.startsWith('"') ? (JSON.parse(v) as string) : v;
  }
  const body = text
    .slice(m[0].length)
    .replace(/\{%-?\s*raw\s*-?%\}\n?/g, "")
    .replace(/\{%-?\s*endraw\s*-?%\}\n?/g, "");
  return { frontMatter, body };
}

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The stand-in document for one themed page. `head` and `tail` add what a spec needs of the layout. */
export function layoutStandIn(p: ThemedPage, o: { scheme?: Scheme; head?: string; tail?: string } = {}): string {
  const scheme = o.scheme ?? "dark";
  const fm = p.frontMatter;
  return `<!doctype html><html lang="en" data-fa-scheme="${scheme}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fm.title ?? "")}</title>
${fm.alternate_jsonld ? `<link rel="alternate" type="application/ld+json" href="${esc(fm.alternate_jsonld)}">\n` : ""}<style>html,body{margin:0;background:${THEME[scheme].ground};color:${THEME[scheme].ink};font:16px/1.5 system-ui,sans-serif}
.main-content{max-width:50rem;padding:1rem 2rem} .main-content a{color:${THEME[scheme].link}}</style>
${o.head ?? ""}</head><body>
<main class="main-content" id="main-content">
${p.body}
</main>
${o.tail ?? ""}</body></html>`;
}

/**
 * Serve every themed `.html` page under `urlPrefix` — the e2e server's view of
 * `fsRoot` — through {@link layoutStandIn}. Anything else, standalone pages
 * included, falls through to the server unchanged.
 */
export async function serveThemed(
  page: Page,
  o: { fsRoot: string; urlPrefix: string; scheme?: Scheme; head?: string; tail?: string },
): Promise<void> {
  const root = resolve(o.fsRoot);
  await page.route(`**${o.urlPrefix}**`, async (route) => {
    const path = decodeURIComponent(new URL(route.request().url()).pathname);
    let file = resolve(root, "." + path.slice(o.urlPrefix.length - 1));
    if (file !== root && !file.startsWith(root + sep)) return route.fallback();
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!file.endsWith(".html") || !existsSync(file)) return route.fallback();
    const themed = parseThemed(readFileSync(file, "utf8"));
    if (!themed) return route.fallback();
    return route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: layoutStandIn(themed, o) });
  });
}
