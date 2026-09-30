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
 * | `input/images/*` | the site root | the Publisher publishes them there, so pages say `<img src="x.png">` |
 * | `input/images-source/*.plantuml` | `_includes/<name>.svg` | the Publisher RENDERS these; rendered here with `--plantuml-jar`, otherwise a visible "not rendered" marker, reported |
 * | `ig-site-data` over the source | `_data/fhir.json` | `site.data.fhir.*`, only what is sourced |
 * | — | `_config.yml` | just-the-docs, one site |
 *
 * Nothing is inferred that the source does not say: a page with no `pages:`
 * entry keeps its file name as title and is reported, and every field
 * `ig-site-data` cannot source is reported undetermined, never written empty.
 *
 * Usage:
 *   bun run fhir-harness/scripts/build-ig-site.ts --ig-src <IG repo> --out <jekyll source> \
 *     [--baseurl /<site>/<ig>] [--plantuml-jar <plantuml.jar>] [--menu <menu.json>] [--remote-theme <owner/repo@ref>]
 *
 * @module fhir-harness/scripts/build-ig-site
 */

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { describeSiteData, igSiteData, type IgSiteDataResult } from "./ig-site-data";

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
}

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
  for (const f of files(pagecontent).filter((f) => f.endsWith(".md"))) {
    const name = basename(f, ".md");
    let n = nav.get(name);
    if (!n) {
      unlisted.push(f);
      // After every listed page, in file order: the source does not place it.
      // Under a menu it stays reachable but out of the nav, as on the IG.
      n = { title: name, navOrder: 1000 + unlisted.length, ...(fromMenu ? { navExclude: true } : {}) };
    }
    const body = readFileSync(join(pagecontent, f), "utf-8");
    // A page that already carries front matter keeps it.
    writeFileSync(join(out, f), body.startsWith("---\n") ? body : frontMatter(n) + body);
    pages.push(f);
  }

  // One section page per menu group, and the items that have no page here.
  const menuMissing: string[] = [];
  const held = new Set(pages.map((f) => basename(f, ".md")));
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
  for (const f of files(imagesDir)) {
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
  writeFileSync(join(out, "_data", "fhir.json"), JSON.stringify(siteData.data, null, 2) + "\n");
  const title = typeof sushi.title === "string" ? sushi.title : String(sushi.id ?? "IG");
  writeFileSync(
    join(out, "_config.yml"),
    [
      "# GENERATED by fhir-harness/scripts/build-ig-site.ts: one IG, one site (bean bamf).",
      `title: ${yamlString(title)}`,
      `baseurl: ${yamlString(baseurl)}`,
      ...(opts.remoteTheme ? [`remote_theme: ${opts.remoteTheme}`, "plugins:", "  - jekyll-remote-theme"] : ["theme: just-the-docs"]),
      "defaults:",
      "  - scope: { path: \"\" }",
      "    values: { layout: default }",
      "",
    ].join("\n"),
  );
  return { pages: pages.sort(), unlisted: unlisted.sort(), menuMissing, includes, images, rendered, notRendered, siteData };
}

export function describeStage(r: StageResult): string {
  return [
    `pages: ${r.pages.length}; includes: ${r.includes}; images: ${r.images}; diagrams rendered: ${r.rendered.length}`,
    ...(r.notRendered.length ? [`NOT RENDERED (a visible marker stands in): ${r.notRendered.join(", ")}`] : []),
    ...(r.unlisted.length ? [`not in the navigation source (titled by file name): ${r.unlisted.join(", ")}`] : []),
    ...(r.menuMissing.length ? [`menu items with no page in this source (Publisher-generated): ${r.menuMissing.join(", ")}`] : []),
    describeSiteData(r.siteData),
  ].join("\n");
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
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
