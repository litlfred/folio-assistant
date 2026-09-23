#!/usr/bin/env bun
/**
 * build-document-site — a DOCUMENT folio rendered as a browsable site, for
 * staging previews and the review page. Bean `fyu2`, epic `q4jm`.
 *
 * ## Why this exists
 *
 * `folio-staging.yml` (bean `ojcx`) publishes whatever a folio's
 * `build_command` writes, and the platform had no command a document folio
 * could name. `publish.yml` builds a PAPER, through LaTeX. The document
 * adapter's `document_render_html` MCP tool renders one document to HTML, but
 * only as a tool call, through pandoc, into a build directory. A CI job wants a
 * command, a site directory, and no system install.
 *
 * So this reuses the adapter's own assembly, `buildDocumentMarkdown`, which
 * already emits `<a id="<label>">` before every labelled block, section and
 * chapter. Those anchors are what the review page and the ChangeSet link to.
 * It renders with `remark-html`, already a dependency, so no pandoc is
 * needed.
 *
 * ## Output
 *
 *   <out>/index.html          every document in the folio, linked
 *   <out>/<slug>/index.html   one page per document, block anchors intact
 *
 * ## Failure is loud
 *
 * A folio with no document, or a document whose assembly reports an error,
 * exits non-zero. A site that silently omitted a document would be a preview
 * that reads "that document was deleted" to a reviewer.
 *
 * Raw HTML in the assembled Markdown is kept (`sanitize: false`), because the
 * block anchors ARE raw HTML. The content is the folio's own, published by
 * the folio's own workflow, which is the same trust the build command already
 * has.
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { remark } from "remark";
import remarkHtml from "remark-html";

import { folioDir } from "../schemas/cat-harness.js";
import { buildDocumentMarkdown } from "../content/pipeline/render-markdown.js";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** A readable page shell. Light and dark follow the reader's system setting. */
function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
  :root { color-scheme: light dark; --fg: #1b1b1b; --bg: #fdfdfb; --muted: #5b5b5b; --link: #0b5cad; }
  @media (prefers-color-scheme: dark) { :root { --fg: #e8e8e6; --bg: #161616; --muted: #a8a8a4; --link: #7db4ff; } }
  body { margin: 0 auto; max-width: 46rem; padding: 2rem 1rem 4rem; font: 1.05rem/1.6 system-ui, sans-serif; color: var(--fg); background: var(--bg); }
  a { color: var(--link); }
  a:focus-visible { outline: 3px solid var(--link); outline-offset: 2px; }
  h1, h2, h3 { line-height: 1.25; }
  table { border-collapse: collapse; } th, td { border: 1px solid var(--muted); padding: .3rem .5rem; }
  :target { scroll-margin-top: 1rem; }
</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>
`;
}

/** Every document in the folio: `folio/<slug>/<slug>.ts`, as the adapter resolves them. */
export function documentManifests(repoRoot: string): { slug: string; path: string }[] {
  const root = folioDir(repoRoot);
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({ slug: d.name, path: join(root, d.name, `${d.name}.ts`) }))
    .filter((d) => existsSync(d.path))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export interface SiteBuildResult {
  documents: { slug: string; blocks: number; page: string }[];
  errors: string[];
}

export async function buildDocumentSite(repoRoot: string, outDir: string): Promise<SiteBuildResult> {
  const docs = documentManifests(repoRoot);
  const result: SiteBuildResult = { documents: [], errors: [] };
  if (docs.length === 0) {
    result.errors.push(`no document manifest under ${folioDir(repoRoot)} (expected folio/<slug>/<slug>.ts)`);
    return result;
  }
  mkdirSync(outDir, { recursive: true });
  for (const d of docs) {
    const built = await buildDocumentMarkdown(d.path);
    for (const i of built.issues) if (i.level === "error") result.errors.push(`${d.slug}: ${i.message}`);
    const html = String(await remark().use(remarkHtml, { sanitize: false }).process(built.markdown));
    const dir = join(outDir, d.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), page(d.slug, html));
    result.documents.push({ slug: d.slug, blocks: built.blockCount, page: `${d.slug}/index.html` });
  }
  const list = result.documents
    .map((d) => `<li><a href="${esc(d.page)}">${esc(d.slug)}</a> (${d.blocks} blocks)</li>`)
    .join("\n");
  writeFileSync(join(outDir, "index.html"), page("Documents", `<h1>Documents</h1>\n<ul>\n${list}\n</ul>`));
  return result;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (n: string) => {
    const i = args.indexOf(`--${n}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  if (args.includes("--help")) {
    console.log("usage: bun run build-document-site.ts [--repo <folio repo root>] [--out _site]");
    process.exit(0);
  }
  const repo = resolve(opt("repo") ?? process.cwd());
  const out = resolve(repo, opt("out") ?? "_site");
  const r = await buildDocumentSite(repo, out);
  for (const d of r.documents) console.error(`  ${d.page}  ${d.blocks} block(s)`);
  if (r.errors.length > 0) {
    for (const e of r.errors) console.error(`✗ ${e}`);
    process.exit(1);
  }
  console.error(`✓ ${r.documents.length} document(s) → ${relative(repo, out) || "."}`);
}
