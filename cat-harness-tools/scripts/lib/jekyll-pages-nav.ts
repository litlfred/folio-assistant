/**
 * The rail's "Pages" section, built on the SERVER from a Jekyll site's source —
 * owner, 2026-10-15, "folio rail everywhere": ONE left-hand rail on every
 * site, including the just-the-docs ones, with a server-built Pages group.
 *
 * ## Why this exists
 *
 * On a just-the-docs site the page tree is the theme's `<nav id="site-nav">`,
 * built by Liquid from every page's front matter, and `docs-ui.js` folds it
 * under a "Pages" button in the browser (`mountNavPagesHeading`). The rail
 * (`nav.fa-nav`, `lib/navbar.ts`) had no such section, so a site could not
 * move to the rail without losing its pages. This reads the SAME front-matter
 * fields the theme reads and gives the rail the same tree as a
 * {@link NavItem} list, so the one rail can carry it.
 *
 * ## What it models, and what it refuses to guess
 *
 * just-the-docs' navigation rules, as far as a folio's site uses them:
 *
 * - a page is listed when it has a `title` and no `nav_exclude: true` (after
 *   applying `_config.yml`'s `defaults` for `pages`);
 * - pages whose URL sits under a harness's `docs` route (`/docs/<harness>/…`,
 *   `/<handler>/docs/<harness>/…`, `/<harness>/docs/…`) are grouped at the top
 *   level under that harness, derived from the URL and never from a hand-kept
 *   list (bean `xka5`);
 * - below a harness (or at the top level when no harness route is in the URL),
 *   a page with no `parent` is at that level's root; one with `parent: <title>`
 *   sits under the page of that title, and `grand_parent` disambiguates a
 *   parent title used twice;
 * - with `locale`, siblings within each level sort alphabetically in the
 *   reader's locale (`Intl.Collator`, keeping `/` first); without `locale`,
 *   siblings sort by `nav_order` then case-insensitive title;
 * - the address is Jekyll's (`jekyll-permalink.ts`): front-matter
 *   `permalink`, else the `_config.yml` default, else the source path.
 *
 * A page whose `parent` names no listed page is kept at the top level and
 * REPORTED (`orphans`), never dropped: a page that vanishes from the
 * navigation reads as a page that does not exist.
 *
 * @module scripts/lib/jekyll-pages-nav
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { parse as parseYaml } from "yaml";

import { pagePermalink, permalinkDefaultsIn, scopeApplies } from "./jekyll-permalink.ts";
import type { NavItem } from "./navbar.ts";

/** One page as the theme's navigation sees it. */
export interface JekyllNavPage {
  /** Site-relative source path, `/`-separated. */
  rel: string;
  title: string;
  /** Site-absolute URL, no `baseurl`: `/guides/`, `/about.html`. */
  url: string;
  parent?: string;
  grandParent?: string;
  navOrder?: number | string;
  lang?: string;
}

/** Directories Jekyll does not render as pages, or that are never navigation. */
const SKIP_DIR = /^(?:_|\.|assets$|vendor$|node_modules$)/;

function frontMatter(text: string): Record<string, unknown> | undefined {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return undefined;
  try {
    const v = parseYaml(m[1]!) as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return undefined;
  }
}

interface FrontMatterDefault {
  path: string;
  values: Record<string, unknown>;
}

/** Front-matter `defaults` for pages in `siteDir`'s `_config.yml`, in file order. */
function frontMatterDefaultsIn(siteDir: string): FrontMatterDefault[] {
  const cfg = join(siteDir, "_config.yml");
  if (!existsSync(cfg)) return [];
  let parsed: unknown;
  try {
    parsed = parseYaml(readFileSync(cfg, "utf-8"));
  } catch {
    return [];
  }
  const defaults = (parsed as { defaults?: unknown } | null)?.defaults;
  if (!Array.isArray(defaults)) return [];
  const out: FrontMatterDefault[] = [];
  for (const d of defaults as Array<{ scope?: { path?: unknown; type?: unknown }; values?: unknown }>) {
    const type = d?.scope?.type;
    if (type !== undefined && type !== "pages") continue;
    const values = d?.values;
    if (!values || typeof values !== "object" || Array.isArray(values)) continue;
    const path = typeof d?.scope?.path === "string" ? d.scope.path : "";
    out.push({ path, values: values as Record<string, unknown> });
  }
  return out;
}

/**
 * Effective front matter for `rel`: `_config.yml` `defaults` whose `scope.path`
 * covers `rel` (shortest path first so longer scopes and later entries win, as
 * in Jekyll's `FrontmatterDefaults#all`), overlaid by `own`. A page setting
 * `parent: ""` overrides a folder default's `parent` (bean `xka5`).
 */
function effectiveFrontMatter(
  rel: string,
  own: Record<string, unknown>,
  defaults: readonly FrontMatterDefault[],
): Record<string, unknown> {
  const matching = defaults
    .map((d, idx) => ({ d, idx }))
    .filter(({ d }) => scopeApplies(d.path, rel))
    .sort((a, b) => a.d.path.length - b.d.path.length || a.idx - b.idx);
  const merged: Record<string, unknown> = {};
  for (const { d } of matching) {
    for (const [k, v] of Object.entries(d.values)) merged[k] = v;
  }
  for (const [k, v] of Object.entries(own)) {
    if (v !== undefined) merged[k] = v;
  }
  return merged;
}

/** The pages a just-the-docs site's navigation lists, read from its SOURCE directory. */
export function jekyllNavPages(siteDir: string): JekyllNavPage[] {
  const defaults = permalinkDefaultsIn(siteDir);
  const fmDefaults = frontMatterDefaultsIn(siteDir);
  const out: JekyllNavPage[] = [];
  const walk = (dir: string, prefix: string): void => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (!SKIP_DIR.test(e.name)) walk(join(dir, e.name), `${prefix}${e.name}/`);
        continue;
      }
      if (!/\.(md|markdown|html)$/i.test(e.name)) continue;
      const rel = `${prefix}${e.name}`;
      const rawFm = frontMatter(readFileSync(join(dir, e.name), "utf-8"));
      if (!rawFm) continue; // no front matter: Jekyll copies it through, it is not a page
      const fm = effectiveFrontMatter(rel, rawFm, fmDefaults);
      const title = typeof fm.title === "string" ? fm.title.trim() : "";
      if (!title || fm.nav_exclude === true) continue;
      const url = pagePermalink(rel, rawFm, defaults).replace(/(^|\/)index\.html$/, "$1");
      out.push({
        rel,
        title,
        url: url === "" ? "/" : url,
        ...(typeof fm.parent === "string" && fm.parent.trim() ? { parent: fm.parent.trim() } : {}),
        ...(typeof fm.grand_parent === "string" && fm.grand_parent.trim() ? { grandParent: fm.grand_parent.trim() } : {}),
        ...(typeof fm.nav_order === "number" || typeof fm.nav_order === "string" ? { navOrder: fm.nav_order } : {}),
        ...(typeof fm.lang === "string" && fm.lang.trim() ? { lang: fm.lang.trim() } : {}),
      });
    }
  };
  walk(siteDir, "");
  return out;
}

/**
 * The harness a page's URL places it under, derived from its `docs` route —
 * `/docs/<harness>/…`, `/<handler>/docs/<harness>/…`, or `/<harness>/docs/…`
 * — and `undefined` when the URL names no harness docs route. Bean `xka5`.
 */
export function harnessOfUrl(url: string): string | undefined {
  const clean = url.replace(/[?#].*$/, "");
  const segs = clean.split("/").filter(Boolean);
  if (segs[0] === "docs" && segs.length >= 2 && !segs[1]!.endsWith(".html")) return segs[1];
  if (segs[1] === "docs") {
    if (segs.length >= 3 && !segs[2]!.endsWith(".html")) return segs[2];
    if (!segs[0]!.endsWith(".html")) return segs[0];
  }
  return undefined;
}

function isHarnessDocsRoot(url: string, harness: string): boolean {
  const clean = url.replace(/[?#].*$/, "");
  return (
    clean === `/docs/${harness}/` ||
    clean === `/${harness}/docs/` ||
    (/^\/[^/]+\/docs\/[^/]+\/$/.test(clean) && clean.endsWith(`/docs/${harness}/`))
  );
}

function isHomeUrl(url: string): boolean {
  return url === "/" || /^\/[a-z]{2,3}(?:-[a-z0-9]+)*\/$/i.test(url);
}

function makeCollator(locale?: string): Intl.Collator {
  try {
    return new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  } catch {
    return new Intl.Collator(undefined, { sensitivity: "base", numeric: true });
  }
}

/** The theme's sibling order: numeric `nav_order` first, then string ones, then none; ties by title. */
function byNavOrder(collator: Intl.Collator): (a: JekyllNavPage, b: JekyllNavPage) => number {
  const rank = (p: JekyllNavPage) => (typeof p.navOrder === "number" ? 0 : typeof p.navOrder === "string" ? 1 : 2);
  return (a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (ra === 0 && a.navOrder !== b.navOrder) return (a.navOrder as number) - (b.navOrder as number);
    if (ra === 1 && a.navOrder !== b.navOrder) return collator.compare(String(a.navOrder), String(b.navOrder));
    return collator.compare(a.title, b.title);
  };
}

/**
 * Alphabetical order within a level in the reader's locale (`Intl.Collator`),
 * keeping the site or locale root (`/`, `/fr/`) first — bean `xka5`.
 */
function byLocaleTitle(collator: Intl.Collator): (a: JekyllNavPage, b: JekyllNavPage) => number {
  return (a, b) => {
    const ha = isHomeUrl(a.url);
    const hb = isHomeUrl(b.url);
    if (ha !== hb) return ha ? -1 : 1;
    return collator.compare(a.title, b.title);
  };
}

function shiftDepth(item: NavItem, delta: number): NavItem {
  const nextDepth = (item.depth ?? 0) + delta;
  return {
    ...item,
    ...(nextDepth > 0 ? { depth: nextDepth } : {}),
    ...(item.children ? { children: item.children.map((c) => shiftDepth(c, delta)) } : {}),
  };
}

/** The summary of a folded set of child pages — one wording. */
export function childPages(n: number): string {
  return n === 1 ? "1 page" : `${n} pages`;
}

/**
 * The page tree as rail rows. `prefix` is put before every site-absolute URL
 * (`..` for a page one level down; `""` for Liquid, whose `relative_url` adds
 * the base). `here` — the current page's URL — is drawn as "you are here".
 * `locale` orders each level alphabetically in the reader's locale (bean `xka5`).
 */
export function pagesNav(
  pages: readonly JekyllNavPage[],
  o: { prefix?: string; here?: string; locale?: string } = {},
): { items: NavItem[]; orphans: string[] } {
  const prefix = o.prefix ?? "";
  const collator = makeCollator(o.locale);
  const cmp = o.locale !== undefined ? byLocaleTitle(collator) : byNavOrder(collator);
  const listed = new Set(pages.map((p) => p.title));
  const orphans = pages.filter((p) => p.parent !== undefined && !listed.has(p.parent)).map((p) => p.rel);
  const kidsOf = (parent: JekyllNavPage | undefined, grand: JekyllNavPage | undefined): JekyllNavPage[] =>
    pages
      .filter((p) =>
        parent === undefined
          ? p.parent === undefined || !listed.has(p.parent)
          : p.parent === parent.title && (p.grandParent === undefined || p.grandParent === grand?.title) && p !== parent,
      )
      .sort(cmp);
  const row = (p: JekyllNavPage, grand: JekyllNavPage | undefined, depth: number): NavItem => {
    // just-the-docs nests three levels; deeper is not navigation.
    const kids = depth < 2 ? kidsOf(p, grand).map((k) => row(k, p, depth + 1)) : [];
    const here = o.here !== undefined && o.here === p.url;
    return {
      label: p.title,
      // Indented one step per level, as the theme's nested lists are.
      ...(depth > 0 ? { depth } : {}),
      ...(here ? { current: true } : { href: `${prefix}${p.url}` }),
      ...(kids.length ? { children: kids, fold: childPages(kids.length) } : {}),
    };
  };
  const topPages = kidsOf(undefined, undefined);
  const byHarness = new Map<string, { root?: JekyllNavPage; children: NavItem[] }>();
  const topItems: Array<{ item: NavItem; isHome: boolean; orderPage?: JekyllNavPage }> = [];
  for (const p of topPages) {
    const h = harnessOfUrl(p.url);
    if (h === undefined) {
      topItems.push({ item: row(p, undefined, 0), isHome: isHomeUrl(p.url), orderPage: p });
      continue;
    }
    let group = byHarness.get(h);
    if (!group) {
      group = { children: [] };
      byHarness.set(h, group);
    }
    const built = row(p, undefined, 0);
    if (isHarnessDocsRoot(p.url, h) && group.root === undefined) {
      group.root = p;
      if (built.children) group.children.push(...built.children);
    } else {
      group.children.push(shiftDepth(built, 1));
    }
  }
  const harnessEntries = [...byHarness.entries()].sort(([a, ga], [b, gb]) =>
    collator.compare(ga.root?.title ?? a, gb.root?.title ?? b),
  );
  for (const [h, group] of harnessEntries) {
    const label = group.root?.title ?? h;
    const here = group.root !== undefined && o.here !== undefined && o.here === group.root.url;
    const href = group.root !== undefined && !here ? `${prefix}${group.root.url}` : undefined;
    const children = [...group.children].sort((a, b) => collator.compare(a.label, b.label));
    topItems.push({
      item: {
        label,
        ...(here ? { current: true } : href !== undefined ? { href } : {}),
        ...(children.length ? { children, fold: childPages(children.length) } : {}),
      },
      isHome: false,
    });
  }
  if (o.locale !== undefined || byHarness.size > 0) {
    topItems.sort((a, b) => {
      if (a.isHome !== b.isHome) return a.isHome ? -1 : 1;
      if (o.locale === undefined && a.orderPage && b.orderPage) return cmp(a.orderPage, b.orderPage);
      return collator.compare(a.item.label, b.item.label);
    });
  }
  return { items: foldTitlePrefixes(topItems.map((x) => x.item)), orphans };
}

/**
 * `Bibliography: library/w3c`, `Tools — cat-harness`: the head and the rest of
 * a title that names its family first, or `undefined` for any other title.
 */
export function titlePrefix(label: string): { head: string; rest: string } | undefined {
  const m = /^(.+?)(?::\s+|\s+\u2014\s+)(.+)$/.exec(label);
  if (!m) return undefined;
  const head = m[1]!.trim();
  const rest = m[2]!.trim();
  return head && rest ? { head, rest } : undefined;
}

/**
 * Sibling rows whose titles share a family head — `Bibliography: …` or
 * `Tools — …` — fold under ONE `<head>` row, at every level (owner,
 * 2026-11-01: "Tools and biblio in LHS should be collapsible";
 * cat-harness-tools#1261). A sibling titled `<head>` itself (the `Tools`
 * page) becomes the parent and keeps its link; otherwise the parent is a
 * label-only row. A family of one is left as it is. The fold opens by itself
 * when the current page is inside it (`navbar.ts`).
 */
export function foldTitlePrefixes(items: readonly NavItem[]): NavItem[] {
  const recur = (item: NavItem): NavItem =>
    item.children ? { ...item, children: foldTitlePrefixes(item.children) } : item;
  const families = new Map<string, number>();
  for (const item of items) {
    const p = titlePrefix(item.label);
    if (p) families.set(p.head, (families.get(p.head) ?? 0) + 1);
  }
  const folded = new Set([...families].filter(([, n]) => n >= 2).map(([head]) => head));
  if (folded.size === 0) return items.map(recur);
  const out: NavItem[] = [];
  const groups = new Map<string, { at: number; own?: NavItem; kids: NavItem[] }>();
  const groupOf = (head: string, depth: number | undefined) => {
    let g = groups.get(head);
    if (!g) {
      g = { at: out.length, kids: [] };
      out.push({ label: head, ...(depth ? { depth } : {}) });
      groups.set(head, g);
    }
    return g;
  };
  for (const item of items) {
    const p = titlePrefix(item.label);
    if (folded.has(item.label)) groupOf(item.label, item.depth).own = recur(item);
    else if (p && folded.has(p.head)) groupOf(p.head, item.depth).kids.push(shiftDepth({ ...recur(item), label: p.rest }, 1));
    else out.push(recur(item));
  }
  for (const g of groups.values()) {
    const parent = g.own ?? out[g.at]!;
    const kids = [...(parent.children ?? []), ...g.kids];
    out[g.at] = { ...parent, children: kids, fold: childPages(kids.length) };
  }
  return out;
}
