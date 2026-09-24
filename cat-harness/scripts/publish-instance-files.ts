#!/usr/bin/env bun
/**
 * Publish an instance's own files at `<base>/<stub>/`, as they sit, with every
 * `.md` also rendered as `.html` and `README.md` also as `index.html`.
 *
 * @module scripts/publish-instance-files
 *
 * For an instance that renders nothing of its own: bootstrap. Its
 * `renderExemption.reachableAt` names one of its own files (`README.md`), and
 * the navbar tab links to where this script puts it. Until 2026-09-23 that
 * field named a page in the platform's docs instead, which made the floor of
 * the stack point at a layer above it (owner, bean iwtn: *"bootstrap is
 * bootstrap"*).
 *
 * The files are published AS THEY SIT, so every relative link in them still
 * resolves: a README that links `schemas/graph.schema.json#/$defs/Role` finds
 * that file beside it. The only change made is in the rendered `.html`, where
 * a link to a `.md` file is pointed at its `.html` rendering.
 *
 * Usage: bun run cat-harness/scripts/publish-instance-files.ts --instance ./bootstrap --out ./_site/bootstrap
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

/** Point relative links at `.md` files to their `.html` renderings, keeping any `#anchor`. */
export function rewriteMdLinks(html: string): string {
  return html.replace(/href="([^"#:]+)\.md(#[^"]*)?"/g, (_m, path: string, hash?: string) => `href="${path}.html${hash ?? ""}"`);
}

/** The first `# heading` of a markdown file, else the fallback. */
export function titleOf(markdown: string, fallback: string): string {
  return /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim() ?? fallback;
}

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title.replace(/[<>&]/g, "")}</title>
<style>
  :root { color-scheme: light dark; --fg: #1b1f23; --bg: #ffffff; --muted: #57606a; --line: #d0d7de; --link: #0b5cad; }
  @media (prefers-color-scheme: dark) { :root { --fg: #e6edf3; --bg: #0d1117; --muted: #8d96a0; --line: #30363d; --link: #58a6ff; } }
  body { font: 16px/1.6 system-ui, sans-serif; color: var(--fg); background: var(--bg); max-width: 50rem; margin: 0 auto; padding: 1.5rem 1rem 4rem; }
  a { color: var(--link); }
  code, pre { font-family: ui-monospace, monospace; font-size: 0.92em; }
  pre { overflow-x: auto; padding: 0.75rem; border: 1px solid var(--line); border-radius: 6px; }
  table { border-collapse: collapse; display: block; overflow-x: auto; }
  th, td { border: 1px solid var(--line); padding: 0.35rem 0.6rem; text-align: left; vertical-align: top; }
  blockquote { margin-left: 0; padding-left: 1rem; border-left: 3px solid var(--line); color: var(--muted); }
  hr { border: 0; border-top: 1px solid var(--line); }
</style>
</head>
<body>
${body}
</body>
</html>
`;
}

function filesIn(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith(".") || name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...filesIn(p));
    else out.push(p);
  }
  return out;
}

/**
 * Copy every file of `instanceDir` into `outDir`, and render each `.md`.
 *
 * NEVER OVERWRITES. The site build writes other files at the same address
 * first: `<base>/bootstrap/bootstrap.json` is the `.json` copy of bootstrap's
 * published Knowledge Graph (`bootstrap-graph-publication`), and it has the
 * same name as bootstrap's declaration. The file already there wins, and the
 * one not published is reported in `skipped` rather than dropped silently.
 */
export async function publishInstanceFiles(
  instanceDir: string,
  outDir: string,
): Promise<{ written: string[]; skipped: string[] }> {
  const written: string[] = [];
  const skipped: string[] = [];
  const write = (rel: string, text?: string, from?: string) => {
    const dest = join(outDir, rel);
    if (existsSync(dest)) {
      skipped.push(rel);
      return;
    }
    mkdirSync(dirname(dest), { recursive: true });
    if (from !== undefined) copyFileSync(from, dest);
    else writeFileSync(dest, text!);
    written.push(rel);
  };
  for (const file of filesIn(instanceDir)) {
    const rel = relative(instanceDir, file);
    write(rel, undefined, file);
    if (!rel.endsWith(".md")) continue;
    const markdown = readFileSync(file, "utf-8").replace(/^---\n[\s\S]*?\n---\n/, "");
    const body = rewriteMdLinks(String(await remark().use(remarkGfm).use(remarkHtml, { sanitize: false }).process(markdown)));
    const html = page(titleOf(markdown, rel), body);
    write(rel.replace(/\.md$/, ".html"), html);
    if (rel === "README.md") write("index.html", html);
  }
  return { written, skipped };
}

if (import.meta.main) {
  const arg = (name: string) => {
    const i = process.argv.indexOf(`--${name}`);
    return i > 0 ? process.argv[i + 1] : undefined;
  };
  const instance = arg("instance");
  const out = arg("out");
  if (!instance || !out) {
    console.error("usage: publish-instance-files.ts --instance <dir> --out <dir>");
    process.exit(2);
  }
  const { written, skipped } = await publishInstanceFiles(instance, out);
  console.log(`Published ${written.length} file(s) from ${instance} to ${out}.`);
  for (const rel of skipped) console.log(`  not published, already there: ${rel}`);
}
