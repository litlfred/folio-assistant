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
import { basename, join, relative, sep } from "node:path";

import {
  directoriesForGraph,
  instanceDirectoryForGraph,
  repoRootFor,
  visualisationsOf,
  type Tile,
  type Visualisation,
} from "../schemas/cat-harness.js";
import { tools } from "../tools/discover.js";
import { frontMatterList } from "./skill-governance.js";

/** One viewer page and the directories it declares it renders. */
export interface ViewerPage {
  /** Repository-relative path of the page. */
  page: string;
  /** Repository-relative directory paths, no trailing slash. */
  renders: string[];
  /**
   * The Tool that drew it, when the page says. Which page a directory's tile
   * opens is chosen among pages drawn by a Tool that renders the directory's
   * KIND — a generated index that merely lists the directory is not its viewer.
   */
  renderedBy?: string;
}

const META = /<meta\s+name="renders"\s+content="([^"]*)"\s*\/?>/;
const BY_META = /<meta\s+name="rendered-by"\s+content="([^"]*)"\s*\/?>/;

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
export function withRenders(html: string, paths: readonly string[], tool: string): string {
  const stripped = html.replace(new RegExp(`\\s*${META.source}`), "").replace(new RegExp(`\\s*${BY_META.source}`), "");
  if (paths.length === 0) return stripped;
  return stripped.replace(
    /<head([^>]*)>/i,
    (h) => `${h}\n${rendersMeta(paths)}\n<meta name="rendered-by" content="${tool}">`,
  );
}

/** The `content` of `<meta name="rendered-by">`, when present. */
export function metaRenderedBy(html: string): string | undefined {
  return BY_META.exec(html)?.[1] || undefined;
}

/** The front-matter lines declaring these directories, for a generated markdown page. */
export function rendersFrontMatter(paths: readonly string[]): string[] {
  return ["renders:", ...[...new Set(paths)].sort().map((p) => `  - ${p}`)];
}

/** One scalar front-matter value, when present. */
function frontMatterScalar(text: string, key: string): string | undefined {
  const fm = /^---\n([\s\S]*?)\n---/.exec(text)?.[1];
  const m = fm ? new RegExp(`^${key}:\\s*(.+)$`, "m").exec(fm) : null;
  return m ? m[1]!.trim() : undefined;
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
    const renderedBy = md ? frontMatterScalar(text, "rendered-by") : metaRenderedBy(text);
    if (renders.length > 0) out.push({ page: f, renders, ...(renderedBy ? { renderedBy } : {}) });
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
export function withRendersFrontMatter(md: string, paths: readonly string[], tool: string): string {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(md);
  if (!m) return md;
  const kept = m[1]!
    .replace(/^renders:\n(?:\s+-\s.*\n?)*/m, "")
    .replace(/^rendered-by:.*\n?/m, "")
    .replace(/\n+$/, "");
  const lines = paths.length === 0 ? [] : [...rendersFrontMatter(paths), `rendered-by: ${tool}`];
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

/**
 * The page a directory's tile opens, derived from the pages (#1168 B7a-2b).
 *
 * Only pages drawn by a Tool that renders one of the directory's KINDS count:
 * a generated index that lists the directory among others is not its viewer.
 * Among those, the most specific — the page naming the fewest directories,
 * then the deepest path — so a subject page wins over the page for every
 * subject. `undefined` when no such page exists.
 *
 * @param kindsByTool each viewer Tool's `renders` list, by Tool id
 */
export function viewerPageFor(
  dirPath: string,
  graphKinds: readonly string[],
  pages: readonly ViewerPage[],
  kindsByTool: ReadonlyMap<string, readonly string[]>,
): string | undefined {
  const want = dirPath.replace(/\/+$/, "");
  const depth = (p: string): number => p.split("/").length;
  return pages
    .filter((p) => p.renders.includes(want))
    .filter((p) => p.renderedBy !== undefined && (kindsByTool.get(p.renderedBy) ?? []).some((k) => graphKinds.includes(k)))
    .sort((a, b) => a.renders.length - b.renders.length || depth(b.page) - depth(a.page) || a.page.localeCompare(b.page))[0]?.page;
}

// ── Reading a directory's viewers ─────────────────────────────────────────

/** The part of a declared directory {@link viewersOf} reads. */
export interface ViewedDirectory {
  id: string;
  path: string;
  scope?: string;
  graphKinds?: readonly string[];
  coverage?: Parameters<typeof visualisationsOf>[0];
  tile?: Tile;
}

let cache: { repoRoot: string; pages: ViewerPage[]; kindsByTool: Map<string, readonly string[]> } | undefined;

/**
 * The viewer pages and each viewer Tool's kinds, read once per repository.
 *
 * Tracked pages only: an untracked page is not something a published site
 * carries, and counting one would make a result depend on a working tree.
 */
function index(repoRoot: string): NonNullable<typeof cache> {
  if (cache?.repoRoot === repoRoot) return cache;
  const files = Bun.spawnSync(["git", "ls-files", "*.md", "*.html"], { cwd: repoRoot })
    .stdout.toString().split("\n").filter(Boolean);
  const kindsByTool = new Map(
    tools().flatMap((t) => (t.renders && t.renders.length > 0 ? [[t.id, t.renders] as const] : [])),
  );
  cache = { repoRoot, pages: viewerPages(repoRoot, files), kindsByTool };
  return cache;
}

/**
 * Every visualisation of a declared directory, normalised.
 *
 * The page is DERIVED — {@link viewerPageFor} over the pages that say they draw
 * this directory — and dressed in the directory's own {@link Tile}. A directory
 * whose viewer no platform generator draws (fsh-guts, a folio's own
 * generator) still declares it in `coverage.visualiser`, and that is returned
 * as declared. `[]` when neither exists.
 *
 * @param instanceRoot the root of the instance whose declaration `d` is from
 */
export function viewersOf(
  d: ViewedDirectory,
  instanceRoot: string,
  repoRoot: string = repoRootFor(instanceRoot),
): Array<Visualisation & { title: string }> {
  const declared = visualisationsOf(d.coverage, d.id);
  if (declared.length > 0) return declared;
  const { pages, kindsByTool } = index(repoRoot);
  const dirPath = renderedPath(repoRoot, join(d.scope === "repository" ? repoRoot : instanceRoot, d.path));
  const page = viewerPageFor(dirPath, d.graphKinds ?? [], pages, kindsByTool);
  if (page === undefined) return [];
  return [{ ...d.tile, ref: page, title: d.tile?.title ?? d.id }];
}

/**
 * Declared directories with their viewers RESOLVED — `coverage.visualiser`
 * filled in from {@link viewersOf}, in memory.
 *
 * For the readers that were written against the declared field and stay pure
 * (`graph-tiles.ts`, `harness-tiles.ts`): the directory list is resolved where
 * it is read from disk, and everything downstream keeps asking
 * `visualisationsOf` exactly as before. The declaration on disk is untouched.
 */
export function withViewers<T extends ViewedDirectory>(
  dirs: readonly T[],
  instanceRoot: string,
  repoRoot: string = repoRootFor(instanceRoot),
): T[] {
  return dirs.map((d) => {
    const v = viewersOf(d, instanceRoot, repoRoot);
    if (v.length === 0) return d;
    return { ...d, coverage: { ...d.coverage, visualiser: v as [Visualisation, ...Visualisation[]] } };
  });
}

/**
 * Where a one-page viewer writes: `<the declared directory's own name>/index.md`
 * under the base docs layer.
 *
 * Until #1168 B7a-2b these generators read their output path from the
 * directory's `coverage.visualiser` — the directory naming its viewer. The
 * rule now is the one `gen-schema-viz.ts` already followed: the published
 * segment is the DECLARED directory's own name, read rather than written down,
 * so a rename moves the source and the URL together.
 *
 * `undefined` when the handler declares no directory of the kind.
 */
export function conventionalPage(handlerRoot: string, kind: string): string | undefined {
  // THE one at the handler's own root — `instanceDirectoryForGraph` refuses
  // rather than silently taking the first of several (bean `no-silent-first`).
  const dir = instanceDirectoryForGraph(handlerRoot, kind);
  return dir === undefined ? undefined : `${basename(dir)}/index.md`;
}
