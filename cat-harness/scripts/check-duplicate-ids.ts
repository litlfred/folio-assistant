#!/usr/bin/env bun
/**
 * No built page may carry the same `id` twice — bean `uknu`.
 *
 * Usage:
 *   bun run check:duplicate-ids <site-dir>     # a built site (e.g. preview:site's output)
 *
 * ## Why it runs on a BUILT site
 *
 * The defect it exists for is invisible in source. `nav_footer_custom.html`
 * declared `id="fa-nav-open"` once, correctly, and just-the-docs renders that
 * include twice per page, so 429 of 1,283 built pages carried it twice. Every
 * `<label for>` then resolved to the first copy, which is hidden at phone
 * width. `gates` was green across it. Same shape as `gjli`: only a build
 * shows it.
 *
 * ## Why a tag-scoped scan and not a text search
 *
 * A text search for `id="` also matches the id inside a code sample, which
 * kramdown renders as `&lt;a id="…"&gt;` with the quotes unescaped. Measured on
 * the first run: 2 such false hits (`visual-diff`, `translation-manager`). An
 * `id=` counts here only inside a real start tag, one that opens with a
 * literal `<`, and `<script>`/`<style>` bodies are skipped. No parser
 * dependency is needed for that, and adding one would be the owner's call.
 *
 * @module scripts/check-duplicate-ids
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/** The ids that occur more than once in one HTML document, with their counts. */
export function duplicateIds(html: string): Map<string, number> {
  const body = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, (m) => m.replace(/>[\s\S]*<\//, "></"));
  const counts = new Map<string, number>();
  for (const tag of body.matchAll(/<[a-zA-Z][a-zA-Z0-9-]*\b[^<>]*>/g)) {
    const id = /\sid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/.exec(tag[0]);
    const v = id?.[1] ?? id?.[2] ?? id?.[3];
    if (v === undefined || v === "") continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return new Map([...counts].filter(([, n]) => n > 1));
}

function htmlFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) htmlFiles(p, out);
    else if (e.endsWith(".html")) out.push(p);
  }
  return out;
}

if (import.meta.main) {
  const site = process.argv[2];
  if (!site) {
    console.error("usage: bun run check:duplicate-ids <built-site-dir>   (bun run preview:site prints one)");
    process.exit(2);
  }
  const files = htmlFiles(site);
  if (files.length === 0) {
    console.error(`check:duplicate-ids — no .html under ${site}. That is not a clean result.`);
    process.exit(2);
  }
  let bad = 0;
  for (const f of files) {
    const d = duplicateIds(readFileSync(f, "utf8"));
    if (d.size === 0) continue;
    bad += 1;
    if (bad <= 20) console.error(`  ✗ ${relative(site, f)}: ${[...d].map(([id, n]) => `${id} ×${n}`).join(", ")}`);
  }
  if (bad) {
    console.error(`\ncheck:duplicate-ids — ${bad} of ${files.length} page(s) carry a duplicate id.`);
    process.exit(1);
  }
  console.log(`check:duplicate-ids — ${files.length} page(s), no duplicate id.`);
}
