/**
 * Which viewer page renders a declared directory — read from the PAGES.
 *
 * #1168 B7a-2, owner 2026-09-24 (*"page derived"*). Until then each directory
 * named its viewer page (`coverage.visualiser`): the directory pointing at
 * what depends on it. Now the generator that draws a page writes into it the
 * directories it drew, the same move B7c made for documentation pages
 * (`docs-declarations.ts`):
 *
 * | page | where it says so |
 * |---|---|
 * | generated HTML | `<meta name="renders" content="…">` |
 * | generated markdown | a `renders:` front-matter list |
 *
 * Each entry is a directory's REPOSITORY-relative path, without a trailing
 * slash. A path and not a `<instance>/<id>`, because a page renders a
 * directory, and two instances may declare the same directory under two ids
 * (`cat-harness/who-iris-library` and `who-iris/library` are one directory).
 *
 * The generator writes it because the generator is the one party that KNOWS
 * which directories fed a page. Inferring it from the page's path would be a
 * second answer, free to disagree.
 *
 * @module scripts/viewer-declarations
 */
import { readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { directoriesForGraph } from "../schemas/cat-harness.js";
import { frontMatterList } from "./skill-governance.js";

/** One viewer page and the directories it declares it renders. */
export interface ViewerPage {
  /** Repository-relative path of the page. */
  page: string;
  /** Repository-relative directory paths, no trailing slash. */
  renders: string[];
}

const META = /<meta\s+name="renders"\s+content="([^"]*)"\s*\/?>/;

/** A directory as a page names it: repository-relative, `/`-separated, no trailing slash. */
export function renderedPath(repoRoot: string, absDir: string): string {
  return relative(repoRoot, absDir).split(sep).join("/").replace(/\/+$/, "");
}

/** The `<meta name="renders">` element for these directories. */
export function rendersMeta(paths: readonly string[]): string {
  return `<meta name="renders" content="${[...new Set(paths)].sort().join(" ")}">`;
}

/** The `content` of `<meta name="renders">`, split on whitespace. */
export function metaRenders(html: string): string[] {
  const m = META.exec(html);
  return m ? m[1]!.split(/\s+/).filter(Boolean) : [];
}

/**
 * Put the declaration into a page's `<head>`, replacing any earlier one.
 *
 * Placed straight after `<head>` so it does not depend on what else the page
 * carries. A page with no `<head>` is returned unchanged: it is not a
 * standalone document, and the audit that reads declarations will say so.
 */
export function withRenders(html: string, paths: readonly string[]): string {
  const stripped = html.replace(new RegExp(`\\s*${META.source}`), "");
  if (paths.length === 0) return stripped;
  return stripped.replace(/<head([^>]*)>/i, (h) => `${h}\n${rendersMeta(paths)}`);
}

/** The front-matter lines declaring these directories, for a generated markdown page. */
export function rendersFrontMatter(paths: readonly string[]): string[] {
  return ["renders:", ...[...new Set(paths)].sort().map((p) => `  - ${p}`)];
}

/** Every page, from the tracked `.md` and `.html` files, that declares `renders`. */
export function viewerPages(repoRoot: string, files: readonly string[]): ViewerPage[] {
  const out: ViewerPage[] = [];
  for (const f of files) {
    const md = f.endsWith(".md");
    if (!md && !f.endsWith(".html")) continue;
    let text: string;
    try {
      text = readFileSync(join(repoRoot, f), "utf-8");
    } catch {
      continue;
    }
    const renders = md ? frontMatterList(text, "renders") : metaRenders(text);
    if (renders.length > 0) out.push({ page: f, renders });
  }
  return out;
}

/** The pages rendering one directory, given its repository-relative path. */
export function pagesRendering(dirPath: string, pages: readonly ViewerPage[]): string[] {
  const want = dirPath.replace(/\/+$/, "");
  return pages.filter((p) => p.renders.includes(want)).map((p) => p.page).sort();
}

/**
 * Put the declaration into a generated markdown page's front matter, replacing
 * any earlier one. A page with no front matter is returned unchanged.
 */
export function withRendersFrontMatter(md: string, paths: readonly string[]): string {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(md);
  if (!m) return md;
  const kept = m[1]!.replace(/^renders:\n(?:\s+-\s.*\n?)*/m, "").replace(/\n+$/, "");
  const lines = paths.length === 0 ? [] : rendersFrontMatter(paths);
  return `---\n${[kept, ...lines].join("\n")}\n---\n${md.slice(m[0].length)}`;
}

/**
 * The directories of a kind the handler instance declares, as a page names
 * them. For a generator drawing ONE page per kind: it renders what its
 * instance handles, which is what its declaration says.
 */
export function handledDirectories(repoRoot: string, handlerRoot: string, kind: string): string[] {
  return directoriesForGraph(handlerRoot, kind).map((d) => renderedPath(repoRoot, d));
}
