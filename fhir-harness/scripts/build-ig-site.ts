/**
 * One IG → one Jekyll source for the just-the-docs pipeline, with the IG
 * Publisher's `site.data.fhir` populated (bean `bamf`).
 *
 * ## Why one site per IG (owner, 2026-09-30)
 *
 * An IG's pages say `{{ site.data.fhir.packageId }}`, not `site.data.fhir.<ig>`:
 * the Publisher builds one IG per Jekyll site, so `_data/fhir.json` names ONE
 * IG. The owner chose to keep that shape rather than rewrite the pages: each IG
 * gets its own Jekyll source and its own `_data/fhir.json`, so the pages render
 * unchanged under the Publisher and under just-the-docs alike.
 *
 * ## What it stages, from an IG source repository
 *
 * | from | to | why |
 * |---|---|---|
 * | `input/pagecontent/*.md` | `<page>.md` with front matter | the pages; title, parent and order from `sushi-config.yaml` `pages:` |
 * | `input/includes/*`, `input/pagecontent/*`, `input/images/*.svg` | `_includes/` | the Publisher resolves `{% include %}` against all three, so pages include each other and inline SVGs |
 * | `input/images/*` | the site root | the Publisher publishes them there, so pages say `<img src="x.png">` — except a `.json`/`.jsonld` that does not parse, which is left out and reported: publishing a broken data file under our site blocks the deploy, and whose file it is cannot be told from a file no parser can read |
 * | `input/images-source/*.plantuml` | `_includes/<name>.svg` | the Publisher RENDERS these; rendered here with `--plantuml-jar`, otherwise a visible "not rendered" marker, reported |
 * | `ig-site-data` over the source | `_data/fhir.json` | `site.data.fhir.*`, only what is sourced |
 * | — | `_config.yml` | just-the-docs, one site |
 * | the instance's declared `webpage` theme | `_sass/color_schemes/ig.scss` | just-the-docs' own colour-scheme mechanism, so the IG wears its palette with the machinery unchanged (bean `u3cd`) |
 *
 * Nothing is inferred that the source does not say: a page with no `pages:`
 * entry keeps its file name as title and is reported, and every field
 * `ig-site-data` cannot source is reported undetermined, never written empty.
 *
 * Usage:
 *   bun run fhir-harness/scripts/build-ig-site.ts --ig-src <IG repo> --out <jekyll source> \
 *     [--baseurl /<site>/<ig>] [--plantuml-jar <plantuml.jar>] [--menu <menu.json>] [--remote-theme <owner/repo@ref>]
 *   bun run fhir-harness/scripts/build-ig-site.ts --dedupe-ids <built site>   # after jekyll build
 *
 * @module fhir-harness/scripts/build-ig-site
 */

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { describeSiteData, igSiteData, type IgSiteDataResult } from "./ig-site-data";
import { artifactPageName } from "../schemas/fhir-artifact-index.js";
import { wrapRaw } from "../../cat-harness/scripts/lib/liquid-raw.ts";
import type { IgReleases } from "../schemas/ig-releases.ts";

/** One page's navigation, from `sushi-config.yaml` `pages:`. */
export interface PageNav {
  title: string;
  parent?: string;
  navOrder: number;
  /** In the site, reachable by link, but not in the navigation. */
  navExclude?: boolean;
  hasChildren?: boolean;
}

/** An IG's published navigation, as `folio-ig-menu/v1` records it. */
export interface IgMenu {
  groups: Array<{ label: string; items?: Array<{ label: string; href: string }> }>;
}

export interface MenuNav {
  nav: Map<string, PageNav>;
  /** One section page per menu group: file stem → its items. */
  groups: Array<{ stem: string; label: string; items: Array<{ label: string; href: string }> }>;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * The IG's OWN menu as the site's navigation: each group a section page, each
 * item a child in the menu's order. A group has no page of its own in the IG
 * (it is a dropdown), and just-the-docs needs a parent page, so one is made
 * that lists the group's items.
 */
export function menuNav(menu: IgMenu): MenuNav {
  const nav = new Map<string, PageNav>();
  const groups: MenuNav["groups"] = [];
  menu.groups.forEach((g, gi) => {
    const stem = `menu-${slug(g.label)}`;
    nav.set(stem, { title: g.label, navOrder: gi + 1, hasChildren: true });
    groups.push({ stem, label: g.label, items: g.items ?? [] });
    (g.items ?? []).forEach((it, ii) => {
      const page = basename(it.href, extname(it.href));
      if (!nav.has(page)) nav.set(page, { title: it.label, parent: g.label, navOrder: ii + 1 });
    });
  });
  return { nav, groups };
}

/**
 * Flatten sushi's nested `pages:` into title, parent title and order. Keys are
 * the generated file names (`index.md`, `overview.md`); a nested map's keys are
 * children of the page that holds them.
 */
export function pageNav(pages: unknown): Map<string, PageNav> {
  const out = new Map<string, PageNav>();
  let order = 0;
  const walk = (node: unknown, parent?: string) => {
    if (!node || typeof node !== "object") return;
    for (const [file, spec] of Object.entries(node as Record<string, unknown>)) {
      if (file === "title" || file === "generation") continue;
      const s = (spec ?? {}) as Record<string, unknown>;
      const title = typeof s.title === "string" ? s.title : basename(file, extname(file));
      out.set(basename(file, extname(file)), { title, ...(parent ? { parent } : {}), navOrder: ++order });
      walk(s, title);
    }
  };
  walk(pages);
  return out;
}

const yamlString = (s: string) => JSON.stringify(s);

/** Front matter for a page: title, parent and order, as just-the-docs reads them. */
export function frontMatter(nav: PageNav): string {
  return [
    "---",
    `title: ${yamlString(nav.title)}`,
    ...(nav.parent ? [`parent: ${yamlString(nav.parent)}`] : []),
    `nav_order: ${nav.navOrder}`,
    ...(nav.hasChildren ? ["has_children: true"] : []),
    ...(nav.navExclude ? ["nav_exclude: true"] : []),
    "---",
    "",
  ].join("\n");
}

export interface StageResult {
  pages: string[];
  /** Pages the Publisher generates, written here from data this build holds (`toc`, `artifacts`). */
  generated: string[];
  /** Pages a fill was written into, and each fill whose marker no page holds — reported, never dropped. */
  fills?: { filled: string[]; unused: string[] };
  /** The lifted per-artefact variables: how many artefacts, and which `elements__*` keys no source holds. */
  variables?: { artifacts: number; notSourced: string[] };
  /** Pages the navigation source does not list: titled by file name (and, with a menu, kept out of the nav). */
  unlisted: string[];
  /** Menu items pointing at a page this source does not hold (the Publisher generates it). */
  menuMissing: string[];
  includes: number;
  images: number;
  /** Diagrams rendered from `input/images-source/*.plantuml`. */
  rendered: string[];
  /** Included files the source does not hold and nothing rendered: a marker stands in. */
  notRendered: string[];
  /** `input/images` data files (`.json`, `.jsonld`) that do not parse: not published, with the parser's reason. */
  unparseable: string[];
  /** The colour scheme written from the instance's palette; undefined when none was declared. */
  scheme: ColourScheme | undefined;
  siteData: IgSiteDataResult;
}

const files = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => statSync(join(dir, f)).isFile()) : []);

/**
 * `{% include x %}` targets the pages name, so a missing one is found before
 * Jekyll aborts on it.
 */
export function includeTargets(md: string): string[] {
  return [...md.matchAll(/\{%-?\s*include\s+([^\s%]+)/g)].map((m) => m[1]!);
}

/** What stands in for a diagram nothing rendered: visible, never an empty include. */
export const notRenderedMarker = (name: string, from: string) =>
  `<p class="ig-not-rendered"><strong>⟦not rendered: ${name}⟧</strong> — the IG Publisher renders it from <code>${from}</code>; no renderer was given to this build.</p>\n`;

export interface StageOptions {
  baseurl?: string;
  plantumlJar?: string;
  /** Navigate by the IG's published menu instead of sushi-config `pages:`. */
  menu?: IgMenu;
  /** `owner/repo@ref` for Jekyll's remote-theme plugin, instead of the `just-the-docs` gem. */
  remoteTheme?: string;
  /** The palette of the theme the IG's instance declares for its web pages; none, no scheme. */
  palette?: SitePalette;
  /**
   * The instance's artefact index and where its artefact pages are, relative
   * to this site. Given, an `artifacts` page is written — the Publisher's
   * `artifacts.html` — linking each artefact to `<pagesHref><stem>.html`.
   * Absent, `artifacts.html` stays a menu item this build does not hold.
   */
  artifacts?: { list: ReadonlyArray<IndexedArtifact>; pagesHref: string };
  /**
   * Content a POST-PROCESSING step writes into a page after the Publisher has
   * run, at a marker the page's source holds. The source alone is then not
   * the page the Publisher published, so a fill puts `body` where `marker`
   * is and adds `data` to the page's front matter for `body`'s Liquid to read.
   *
   * Generic on purpose: this layer knows a marker and a template, never whose
   * post-processing wrote them. Which fills an IG gets is the caller's
   * business (`stage-ig-sites.ts`).
   */
  fills?: ReadonlyArray<{ marker: string; body: string; data: Record<string, unknown> }>;
  /**
   * The IG's GitHub releases as pointers to their binary assets
   * (`fhir-artifact-index/releases.json`, `ig-releases/v1`). Given, a
   * `releases` page lists them; the bytes stay on GitHub (bean `b8ip`).
   */
  releases?: IgReleases;
}

/** The fields of a `folio-fhir-artifact/v1` entry this build reads. */
export interface IndexedArtifact {
  resourceType: string;
  id: string;
  title?: string;
  category?: string;
  /** Position on the Publisher's `artifacts.html` (see `FhirArtifactSchema.listedAt`). */
  listedAt?: number;
  canonical?: string;
  name?: string;
  version?: string;
  description?: string;
  published?: Partial<Record<"json" | "xml" | "ttl" | "html", { url: string }>>;
}

/**
 * The element keys WHO's `generate_smart_liquid.py` exposes under
 * `elements__*`, in its order. Only the ones the artefact index holds are
 * written; the rest are REPORTED as not sourced, never written empty.
 */
export const ELEMENT_KEYS = ["name", "title", "description", "purpose", "status", "version", "date", "publisher", "copyright", "experimental", "kind", "type"] as const;

/** `<ResourceType>__<id with non-alphanumerics as _>`, the lifted script's own key rule. */
/** Text safe inside a markdown link label. */
const mdLabel = (s: string) => s.replace(/([\\[\]|])/g, "\\$1");

export const variableKey = (a: { resourceType: string; id: string }) => `${a.resourceType}__${a.id.replace(/[^A-Za-z0-9]/g, "_")}`;

export interface ArtifactVariables {
  /** `site.data.fhir.artifacts.<key>.{url,text,link,elements}` — one entry per artefact. */
  artifacts: Record<string, {
    url: { canonical?: string; page: string; json?: string; xml?: string; ttl?: string };
    /** `display` as WHO computes it; `label` is the same text escaped for a markdown link label. */
    text: { display: string; label: string };
    link: { html: string };
    elements: Partial<Record<(typeof ELEMENT_KEYS)[number], string>>;
    category?: string;
    reference: string;
  }>;
  /** Categories in index order, each naming its artefacts' keys — what a template iterates. Uncategorised artefacts (not on the Publisher's `artifacts.html`) are left out. */
  artifact_categories: Array<{ name: string; keys: string[] }>;
  /** How many artefacts `artifact_categories` lists — counted here, so no template counts. */
  artifacts_listed: number;
}

/**
 * The per-artefact Liquid variables WHO's `generate_smart_liquid.py` computes
 * (`smart__<Type>__<id>__url__page`, …), LIFTED rather than redesigned
 * (`ig-render-jekyll`, `ig-publisher-reduction` §P0; bean `4tts`):
 *
 * - the same families and keys, under `site.data.fhir.artifacts.<Type>__<id>`
 *   — so `smart__ValueSet__Actors__url__page` reads
 *   `site.data.fhir.artifacts.ValueSet__Actors.url.page`;
 * - **no `smart__` prefix**: it is WHO's, and this layer does not know WHO;
 * - **computed in the build that consumes it.** The script writes its include
 *   for the IG Publisher's NEXT build, so its surface takes two builds to
 *   converge; `_data/` is read by the same Jekyll run.
 *
 * Source: the instance's artefact index — the Publisher's post-processed
 * output. `url.page` is this site's page; `url.json/xml/ttl` are where the
 * Publisher published them (under P2 only JSON is rendered here; XML and
 * Turtle remain links to the Publisher's copy).
 */
export function artifactVariables(list: ReadonlyArray<IndexedArtifact>, pagesHref: string): { vars: ArtifactVariables; notSourced: string[] } {
  const artifacts: ArtifactVariables["artifacts"] = {};
  const order: ArtifactVariables["artifact_categories"] = [];
  const held = new Set<string>();
  // The Publisher's page order: by `listedAt`, which orders the categories
  // (first appearance) and the artefacts within each. Unlisted ones last.
  const ordered = [...list].sort((x, y) => (x.listedAt ?? Infinity) - (y.listedAt ?? Infinity));
  for (const a of ordered) {
    const key = variableKey(a);
    const page = `${pagesHref}${artifactPageName(a)}.html`;
    const display = a.title ?? a.name ?? a.id;
    const elements: ArtifactVariables["artifacts"][string]["elements"] = {};
    for (const k of ["name", "title", "description", "version"] as const) {
      const v = a[k];
      if (v !== undefined) {
        elements[k] = v;
        held.add(k);
      }
    }
    artifacts[key] = {
      url: { canonical: a.canonical, page, json: a.published?.json?.url, xml: a.published?.xml?.url, ttl: a.published?.ttl?.url },
      text: { display, label: mdLabel(display) },
      link: { html: `<a href="${page}">${display.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</a>` },
      elements,
      category: a.category,
      reference: `${a.resourceType}/${a.id}`,
    };
    // An artefact's category comes FROM the Publisher's `artifacts.html`, so
    // one with none is one that page does not list (smart-trust: the
    // ImplementationGuide itself). Its variables are written; it is not
    // grouped, so the template lists exactly what the Publisher's page does.
    if (a.category === undefined) continue;
    let g = order.find((c) => c.name === a.category);
    if (!g) order.push((g = { name: a.category, keys: [] }));
    g.keys.push(key);
  }
  return { vars: { artifacts, artifact_categories: order, artifacts_listed: order.reduce((n, c) => n + c.keys.length, 0) }, notSourced: ELEMENT_KEYS.filter((k) => !held.has(k)) };
}

/**
 * The Publisher's `toc.html`: every page in `sushi-config.yaml` `pages:`, nested
 * as declared. A page this build neither holds nor generates is listed as text,
 * not as a link — a link to a page that is not there is the defect this site
 * keeps paying for.
 */
export function tocPage(pages: unknown, has: (stem: string) => boolean): string {
  const lines: string[] = [];
  const walk = (node: unknown, depth: number) => {
    if (!node || typeof node !== "object") return;
    for (const [file, spec] of Object.entries(node as Record<string, unknown>)) {
      if (file === "title" || file === "generation") continue;
      const sp = (spec ?? {}) as Record<string, unknown>;
      const stem = basename(file, extname(file));
      const title = typeof sp.title === "string" ? sp.title : stem;
      lines.push(`${"  ".repeat(depth)}- ${has(stem) ? `[${mdLabel(title)}](${stem}.html)` : `${mdLabel(title)} (generated by the IG Publisher; not part of this build)`}`);
      walk(sp, depth + 1);
    }
  };
  walk(pages, 0);
  return ["# Table of Contents", "", ...wrapRaw(lines.join("\n")), ""].join("\n");
}

/**
 * The Publisher's `artifacts.html`, as a LIQUID TEMPLATE over
 * `site.data.fhir` — Jekyll renders it, from the variables this same build
 * wrote (owner, 2026-10-01: "make use of jekyll/liquid templates"). No
 * artefact data is baked into the page; change the data and the page follows.
 * The template is a file of this directory (`liquid-templates` §"Where a
 * template lives"), found relative to this one.
 */
export const ARTIFACTS_TEMPLATE_PATH = resolve(import.meta.dir, "templates/ig-site/artifacts.liquid");
export const RELEASES_TEMPLATE_PATH = resolve(import.meta.dir, "templates/ig-site/releases.liquid");

/** A byte count as the Publisher's download pages show one: one decimal, in KB or MB. */
export function sizeLabel(bytes: number): string {
  return bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}

/** `site.data.ig_releases`, which `releases.liquid` reads: every value computed here, none in Liquid. */
export function releaseVariables(r: IgReleases) {
  return {
    repository: r.repository,
    read_at: r.readAt,
    releases: r.releases.map((x) => ({
      tag: x.tag,
      name: x.name ?? x.tag,
      url: x.url,
      published: x.publishedAt.slice(0, 10),
      prerelease: x.prerelease,
      assets: x.assets.map((a) => ({ name: a.name, url: a.url, size: sizeLabel(a.bytes), digest: a.digest ?? null })),
    })),
  };
}

/**
 * The four roles a theme palette carries (`ThemePaletteSchema` in
 * `cat-harness/schemas/theme.ts`). Structural, so this layer takes a palette
 * without knowing whose it is: fhir-harness never names an IG's branding.
 */
export interface SitePalette {
  surface: string;
  ink: string;
  edge: string;
  accent: string;
}

/** WCAG 2 relative luminance of a `#rgb`/`#rrggbb` colour; undefined for anything else. */
export function luminance(colour: string): number | undefined {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(colour.trim());
  if (!m) return undefined;
  const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio between two colours; undefined when either is not hex. */
export function contrast(a: string, b: string): number | undefined {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === undefined || lb === undefined) return undefined;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export interface ColourScheme {
  scss: string;
  /** The role whose colour the sidebar's text takes, chosen by contrast against `accent`. */
  sidebarText: "ink" | "surface";
  /** That contrast; undefined when it could not be computed. */
  sidebarContrast: number | undefined;
  /** Each pairing below WCAG AA (4.5:1) or not computable — reported, never hidden. */
  findings: string[];
}

/** WCAG 2 AA for body text. */
const AA = 4.5;

/**
 * A palette as a just-the-docs colour scheme (bean `u3cd`).
 *
 * The sidebar takes `accent`, as the IG's own chrome does; its text then
 * needs a colour the palette has, so it is CHOSEN between `ink` and
 * `surface` by contrast against `accent` rather than written as a literal.
 * Pairings below AA are listed in `findings`, and so is a colour whose
 * contrast cannot be computed (a named colour, say): could-not-determine is
 * not a pass.
 */
export function colourScheme(p: SitePalette): ColourScheme {
  const onAccent = { ink: contrast(p.ink, p.accent), surface: contrast(p.surface, p.accent) };
  const sidebarText: "ink" | "surface" = (onAccent.surface ?? -1) > (onAccent.ink ?? -1) ? "surface" : "ink";
  const sidebarContrast = onAccent[sidebarText];
  const findings: string[] = [];
  const pairs: [string, string, string][] = [
    ["ink on surface (body text)", p.ink, p.surface],
    ["accent on surface (links)", p.accent, p.surface],
    [`${sidebarText} on accent (sidebar text)`, p[sidebarText], p.accent],
  ];
  for (const [what, fg, bg] of pairs) {
    const c = contrast(fg, bg);
    if (c === undefined) findings.push(`${what}: contrast not computable (${fg} on ${bg}) — not verified`);
    else if (c < AA) findings.push(`${what}: ${c.toFixed(2)}:1 is below WCAG AA ${AA}:1`);
  }
  const text = p[sidebarText];
  const scss = [
    "// GENERATED by fhir-harness/scripts/build-ig-site.ts from the IG instance's declared",
    "// webpage theme (bean u3cd). Edit the theme, not this file.",
    "// just-the-docs imports its light scheme BEFORE this file, so anything light",
    "// DERIVES is already fixed by then: the active item's highlight",
    "// ($feedback-color, darken($sidebar-color, 3%)) is re-derived below from",
    "// this palette, or it stays light grey under light text.",
    `$body-background-color: ${p.surface};`,
    `$body-text-color: ${p.ink};`,
    `$body-heading-color: ${p.ink};`,
    `$link-color: ${p.accent};`,
    `$btn-primary-color: ${p.accent};`,
    `$border-color: ${p.edge};`,
    `$sidebar-color: ${p.accent};`,
    `$nav-child-link-color: ${text};`,
    "$feedback-color: darken($sidebar-color, 3%);",
    "",
  ].join("\n");
  return { scss, sidebarText, sidebarContrast, findings };
}

/**
 * Rules the scheme's variables cannot reach: just-the-docs colours top-level
 * nav links and the site title with `$link-color`/`$body-heading-color`, which
 * on an `accent` sidebar would be accent on accent. Every colour here is a
 * palette role, via the scheme's own variables.
 */
export const SIDEBAR_SCSS = [
  "// GENERATED by fhir-harness/scripts/build-ig-site.ts (bean u3cd).",
  ".side-bar, .side-bar .site-title, .side-bar .nav-list .nav-list-item .nav-list-link,",
  ".side-bar .nav-list .nav-list-item .nav-list-expander, .side-bar .site-footer, .side-bar .site-footer a { color: $nav-child-link-color; }",
  ".side-bar .nav-list .nav-list-item .nav-list-link.active { font-weight: 700; }",
  "",
].join("\n");

export function stageIgSite(igSrc: string, out: string, opts: StageOptions = {}): StageResult {
  const { baseurl = "", plantumlJar } = opts;
  const src = resolve(igSrc);
  const sushi = parseYaml(readFileSync(join(src, "sushi-config.yaml"), "utf-8")) as Record<string, unknown>;
  const fromMenu = opts.menu ? menuNav(opts.menu) : undefined;
  const nav = fromMenu?.nav ?? pageNav(sushi.pages);
  mkdirSync(join(out, "_includes"), { recursive: true });
  mkdirSync(join(out, "_data"), { recursive: true });

  const pagecontent = join(src, "input", "pagecontent");
  const pages: string[] = [];
  const unlisted: string[] = [];
  const filled: string[] = [];
  const usedMarkers = new Set<string>();
  for (const f of files(pagecontent).filter((f) => f.endsWith(".md"))) {
    const name = basename(f, ".md");
    let n = nav.get(name);
    if (!n) {
      unlisted.push(f);
      // After every listed page, in file order: the source does not place it.
      // Under a menu it stays reachable but out of the nav, as on the IG.
      n = { title: name, navOrder: 1000 + unlisted.length, ...(fromMenu ? { navExclude: true } : {}) };
    }
    let body = readFileSync(join(pagecontent, f), "utf-8");
    let data: Record<string, unknown> = {};
    for (const fill of opts.fills ?? []) {
      if (!body.includes(fill.marker)) continue;
      body = body.split(fill.marker).join(fill.body);
      data = { ...data, ...fill.data };
      filled.push(`${f} (${fill.marker})`);
      usedMarkers.add(fill.marker);
    }
    // Page variables as JSON flow mappings — YAML is a superset of JSON.
    const dataLines = Object.entries(data).map(([k, v]) => `${k}: ${JSON.stringify(v)}\n`).join("");
    // A page that already carries front matter keeps it, with the fill's data added.
    writeFileSync(join(out, f), body.startsWith("---\n") ? `---\n${dataLines}${body.slice(4)}` : frontMatter(n).replace(/---\n$/, `${dataLines}---\n`) + body);
    pages.push(f);
  }

  // Pages the Publisher GENERATES rather than reads from pagecontent, written
  // here from data this build holds (bean `jut3`'s parity list). Reported apart
  // from `pages`, so a generated page is never mistaken for the IG's source.
  const generated: string[] = [];
  if (opts.artifacts && !pages.includes("artifacts.md")) {
    const n = nav.get("artifacts") ?? { title: "Artifacts Summary", navOrder: 999, navExclude: true };
    writeFileSync(join(out, "artifacts.md"), frontMatter(n) + readFileSync(ARTIFACTS_TEMPLATE_PATH, "utf-8"));
    generated.push("artifacts.md");
  }
  if (opts.releases && !pages.includes("releases.md")) {
    // Listed in the nav, last: the owner asked for the release binaries to be
    // findable from the IG's pages (bean `b8ip`).
    writeFileSync(join(out, "releases.md"), frontMatter(nav.get("releases") ?? { title: "Releases", navOrder: 998 }) + readFileSync(RELEASES_TEMPLATE_PATH, "utf-8"));
    writeFileSync(join(out, "_data", "ig_releases.json"), JSON.stringify(releaseVariables(opts.releases), null, 2) + "\n");
    generated.push("releases.md");
  }
  if (!pages.includes("toc.md")) {
    const has = (stem: string) => pages.includes(`${stem}.md`) || generated.includes(`${stem}.md`) || stem === "toc";
    writeFileSync(join(out, "toc.md"), frontMatter(nav.get("toc") ?? { title: "Table of Contents", navOrder: 1000, navExclude: true }) + tocPage(sushi.pages, has));
    generated.push("toc.md");
  }

  // One section page per menu group, and the items that have no page here.
  const menuMissing: string[] = [];
  const held = new Set([...pages, ...generated].map((f) => basename(f, ".md")));
  for (const g of fromMenu?.groups ?? []) {
    // just-the-docs lists a parent's children itself; the page adds only
    // what that list cannot show: items the Publisher generates.
    const missing = g.items.filter((it) => !held.has(basename(it.href, extname(it.href))));
    for (const it of missing) menuMissing.push(it.href);
    const note = missing.map((it) => `- ${it.label}: generated by the IG Publisher, not part of this build`).join("\n");
    writeFileSync(join(out, `${g.stem}.md`), frontMatter(nav.get(g.stem)!) + `# ${g.label}\n\n` + (note ? note + "\n" : ""));
  }

  let includes = 0;
  for (const dir of [join(src, "input", "includes"), pagecontent]) {
    for (const f of files(dir)) {
      copyFileSync(join(dir, f), join(out, "_includes", f));
      includes++;
    }
  }
  const imagesDir = join(src, "input", "images");
  let images = 0;
  const unparseable: string[] = [];
  for (const f of files(imagesDir)) {
    if (/\.(json|jsonld)$/.test(f)) {
      try {
        JSON.parse(readFileSync(join(imagesDir, f), "utf-8"));
      } catch (e) {
        unparseable.push(`${f} (${(e as Error).message})`);
        continue;
      }
    }
    copyFileSync(join(imagesDir, f), join(out, f));
    if (f.endsWith(".svg")) {
      copyFileSync(join(imagesDir, f), join(out, "_includes", f));
      includes++;
    }
    images++;
  }

  // Diagrams the Publisher renders from images-source, and anything else a page
  // includes that the source does not hold.
  const rendered: string[] = [];
  const notRendered: string[] = [];
  const imagesSource = join(src, "input", "images-source");
  const wanted = new Set(pages.flatMap((f) => includeTargets(readFileSync(join(out, f), "utf-8"))));
  for (const name of [...wanted].sort()) {
    if (existsSync(join(out, "_includes", name))) continue;
    const puml = join(imagesSource, basename(name, extname(name)) + ".plantuml");
    if (name.endsWith(".svg") && existsSync(puml) && plantumlJar) {
      execFileSync("java", ["-jar", plantumlJar, "-tsvg", "-o", join(out, "_includes"), puml], { stdio: "ignore" });
      if (existsSync(join(out, "_includes", name))) {
        rendered.push(name);
        continue;
      }
    }
    writeFileSync(join(out, "_includes", name), notRenderedMarker(name, existsSync(puml) ? `input/images-source/${basename(puml)}` : "a source this build does not hold"));
    notRendered.push(name);
  }

  const siteData = igSiteData(src);
  // The per-artefact variables ride in the same `site.data.fhir` the IG's
  // metadata does (bean `4tts`), written in THIS build, read by THIS build.
  const lifted = opts.artifacts ? artifactVariables(opts.artifacts.list, opts.artifacts.pagesHref) : undefined;
  writeFileSync(join(out, "_data", "fhir.json"), JSON.stringify({ ...siteData.data, ...(lifted?.vars ?? {}) }, null, 2) + "\n");
  const title = typeof sushi.title === "string" ? sushi.title : String(sushi.id ?? "IG");
  const scheme = opts.palette ? colourScheme(opts.palette) : undefined;
  if (scheme) {
    mkdirSync(join(out, "_sass", "color_schemes"), { recursive: true });
    writeFileSync(join(out, "_sass", "color_schemes", "ig.scss"), scheme.scss);
    mkdirSync(join(out, "_sass", "custom"), { recursive: true });
    writeFileSync(join(out, "_sass", "custom", "custom.scss"), SIDEBAR_SCSS);
  }
  writeFileSync(
    join(out, "_config.yml"),
    [
      "# GENERATED by fhir-harness/scripts/build-ig-site.ts: one IG, one site (bean bamf).",
      `title: ${yamlString(title)}`,
      `baseurl: ${yamlString(baseurl)}`,
      ...(opts.remoteTheme ? [`remote_theme: ${opts.remoteTheme}`, "plugins:", "  - jekyll-remote-theme"] : ["theme: just-the-docs"]),
      ...(scheme ? ["color_scheme: ig"] : []),
      "defaults:",
      "  - scope: { path: \"\" }",
      "    values: { layout: default }",
      "",
    ].join("\n"),
  );
  const fillsResult = opts.fills?.length ? { filled, unused: opts.fills.map((x) => x.marker).filter((m) => !usedMarkers.has(m)) } : undefined;
  return { pages: pages.sort(), generated, fills: fillsResult, variables: lifted ? { artifacts: Object.keys(lifted.vars.artifacts).length, notSourced: lifted.notSourced } : undefined, unlisted: unlisted.sort(), menuMissing, includes, images, rendered, notRendered, unparseable, scheme, siteData };
}

/**
 * Rename the second and later copies of each `id` on one built page to
 * `<id>--2`, `--3`, … and say which. An IG's source can repeat an anchor
 * (two headings `{#x}`, or a page included into another that already holds
 * it); the Publisher's output then repeats it too, and a duplicate id is an
 * accessibility defect (bean `gjli`). A link to `#x` already lands on the
 * FIRST copy in every browser, so keeping the first and renaming the rest
 * changes where no link goes.
 */
export function dedupeIds(html: string): { html: string; renamed: string[] } {
  const seen = new Map<string, number>();
  const renamed: string[] = [];
  const out = html.replace(/(\sid=)(["'])([^"']+)\2/g, (whole, pre: string, q: string, id: string) => {
    const n = (seen.get(id) ?? 0) + 1;
    seen.set(id, n);
    if (n === 1) return whole;
    renamed.push(`${id} -> ${id}--${n}`);
    return `${pre}${q}${id}--${n}${q}`;
  });
  return { html: out, renamed };
}

/** Every `.html` under a built site, deduplicated in place; returns page → renames. */
export function dedupeSiteIds(site: string): Map<string, string[]> {
  const report = new Map<string, string[]>();
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (f.endsWith(".html")) {
        const r = dedupeIds(readFileSync(p, "utf-8"));
        if (r.renamed.length) {
          writeFileSync(p, r.html);
          report.set(p.slice(site.length + 1), r.renamed);
        }
      }
    }
  };
  walk(site);
  return report;
}

export function describeStage(r: StageResult): string {
  return [
    `pages: ${r.pages.length}; includes: ${r.includes}; images: ${r.images}; diagrams rendered: ${r.rendered.length}`,
    ...(r.generated.length ? [`generated from data this build holds (the Publisher generates these): ${r.generated.join(", ")}`] : []),
    ...(r.fills?.filled.length ? [`post-processing filled: ${r.fills.filled.join(", ")}`] : []),
    ...(r.fills?.unused.length ? [`post-processing fill with no marker in any page (NOT applied): ${r.fills.unused.join(", ")}`] : []),
    ...(r.variables ? [`site.data.fhir.artifacts: ${r.variables.artifacts} artefact(s); elements not sourced (not written): ${r.variables.notSourced.join(", ") || "none"}`] : []),
    ...(r.notRendered.length ? [`NOT RENDERED (a visible marker stands in): ${r.notRendered.join(", ")}`] : []),
    ...(r.unparseable.length ? [`NOT PUBLISHED (not valid JSON in the IG source): ${r.unparseable.join("; ")}`] : []),
    r.scheme
      ? `colour scheme: from the instance's webpage theme; sidebar text is ${r.scheme.sidebarText}` +
        (r.scheme.sidebarContrast === undefined ? "" : ` (${r.scheme.sidebarContrast.toFixed(2)}:1 on accent)`)
      : "colour scheme: NONE — the instance declares no webpage theme, so just-the-docs' default light scheme",
    ...(r.scheme?.findings.length ? [`CONTRAST: ${r.scheme.findings.join("; ")}`] : []),
    ...(r.unlisted.length ? [`not in the navigation source (titled by file name): ${r.unlisted.join(", ")}`] : []),
    ...(r.menuMissing.length ? [`menu items with no page in this source (Publisher-generated): ${r.menuMissing.join(", ")}`] : []),
    describeSiteData(r.siteData),
  ].join("\n");
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  // Post-build: `--dedupe-ids <built site>` repairs repeated ids and reports each.
  const dedupe = opt("--dedupe-ids");
  if (dedupe) {
    const report = dedupeSiteIds(resolve(dedupe));
    for (const [page, renames] of report) console.log(`${page}: repeated id(s) in the IG source renamed: ${renames.join(", ")}`);
    console.log(`${report.size} page(s) carried a repeated id`);
    process.exit(0);
  }
  const igSrc = opt("--ig-src");
  const out = opt("--out");
  if (!igSrc || !out) {
    console.error("usage: build-ig-site.ts --ig-src <IG repo> --out <jekyll source> [--baseurl <path>] [--plantuml-jar <jar>] [--menu <menu.json>] [--remote-theme <owner/repo@ref>]");
    process.exit(2);
  }
  const menuPath = opt("--menu");
  const r = stageIgSite(igSrc, resolve(out), {
    baseurl: opt("--baseurl") ?? "",
    plantumlJar: opt("--plantuml-jar"),
    menu: menuPath ? (JSON.parse(readFileSync(menuPath, "utf-8")) as IgMenu) : undefined,
    remoteTheme: opt("--remote-theme"),
  });
  console.log(describeStage(r));
  console.log(`staged ${out}`);
  if (r.siteData.refused.length) process.exit(1);
}
