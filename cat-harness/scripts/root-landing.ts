#!/usr/bin/env bun
/**
 * Write the SITE root's `index.html` — a minimal landing that links to each
 * instance's documentation.
 *
 * @module scripts/root-landing
 *
 * ## Why there is one
 *
 * Until 2026-10-05 the root `index.html` WAS cat-harness's documentation home,
 * because Jekyll built cat-harness's docs at the site root. The owner's ruling
 * of that day (issue #2188, bean `kc7k`) moved them to `/docs/cat-harness/`,
 * so without this the site's own address would serve nothing.
 *
 * ## Why it is not a redirect
 *
 * *"we dont need redirects for old way. clean break/migration"*. This page
 * replaces no old page: it is the root's own content, a list of where each
 * instance's documentation now lives. No `<meta http-equiv="refresh">`, no
 * script that navigates — a reader arriving here chooses.
 *
 * ## Derived, not listed
 *
 * The documentation entries are every `docs/<instance>/` the BUILT site
 * actually holds with an `index.html` — Jekyll's tree and the mounts
 * `mount-instance-docs.ts` wrote — so it runs after both, and an instance
 * whose docs were not built is absent rather than linked to a 404. The built
 * instance is listed first, because it is the one the site is about.
 *
 * Usage:
 *   bun run cat-harness/scripts/root-landing.ts --site ./_site --built cat-harness
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { siteDirFor } from "../schemas/cat-harness.js";
import { builtDocsRoute, DOCS_KIND } from "./docs-route.ts";

const REPO = resolve(import.meta.dir, "..", "..");

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Every `docs/<name>/` in the built site that has a front door, the built route first. */
export function documentationRoutes(site: string, builtRoute: string): string[] {
  const docs = join(site, DOCS_KIND);
  if (!existsSync(docs)) return [];
  const found = readdirSync(docs)
    .filter((n) => statSync(join(docs, n)).isDirectory() && existsSync(join(docs, n, "index.html")))
    .map((n) => `${DOCS_KIND}/${n}`)
    .sort();
  return [...found.filter((r) => r === builtRoute), ...found.filter((r) => r !== builtRoute)];
}

/** The page. `title` is the site's; every href is relative, so it is right under any base. */
export function landingHtml(title: string, routes: readonly string[], hasIndex: boolean): string {
  const items = routes.map((r) => `    <li><a href="${esc(r)}/">${esc(r.slice(DOCS_KIND.length + 1))}</a></li>`).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>body{font:1rem/1.5 system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem}</style>
</head>
<body>
<main>
  <h1>${esc(title)}</h1>
  <h2 id="documentation">Documentation</h2>
  <ul aria-labelledby="documentation">
${items}
  </ul>
${hasIndex ? `  <p>Every published knowledge graph, as data: <a href="index.jsonld">index.jsonld</a>.</p>\n` : ""}</main>
</body>
</html>
`;
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const at = (f: string) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : undefined);
  const site = at("--site");
  const built = at("--built");
  if (!site || !built) {
    console.error("usage: root-landing.ts --site <built site> --built <instance directory>");
    process.exit(2);
  }
  const route = builtDocsRoute(built);
  const out = join(site, "index.html");
  if (existsSync(out)) {
    // Something else already claimed the site root. Refuse, never overwrite —
    // the same rule every other publisher into `_site` keeps.
    console.error(`root-landing: ${out} already exists; refusing to overwrite it`);
    process.exit(1);
  }
  const routes = documentationRoutes(site, route);
  if (!routes.includes(route)) {
    console.error(`root-landing: ${route}/index.html is not in ${site} — the built documentation is missing`);
    process.exit(1);
  }
  // The site's title is the one the docs declare — read from the source config,
  // not written down a second time here.
  const cfg = join(REPO, built, siteDirFor(join(REPO, built)), "_config.yml");
  let title = "folio-assistant";
  const src = existsSync(cfg) ? readFileSync(cfg, "utf-8") : "";
  const m = /^title:\s*(.+)$/m.exec(src);
  if (m) title = m[1]!.trim().replace(/^["']|["']$/g, "");
  writeFileSync(out, landingHtml(title, routes, existsSync(join(site, "index.jsonld"))));
  console.log(`root-landing: wrote ${out} — ${routes.length} documentation route(s): ${routes.join(", ")}`);
}
