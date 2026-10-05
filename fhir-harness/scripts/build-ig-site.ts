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
 *     [--baseurl /<site>/<ig>] [--plantuml-jar <plantuml.jar>] [--menu <menu.json>] [--remote-theme <owner/repo@ref>] \
 *     [--artifacts <dir>] [--artifacts-href <path>]
 *   bun run fhir-harness/scripts/build-ig-site.ts --dedupe-ids <built site>   # after jekyll build
 *
 * @module fhir-harness/scripts/build-ig-site
 */

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
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
  /** Links the IG's source writes to an artefact's flat Publisher page (`ValueSet-X.html`), pointed at this site's artefact page instead. */
  relinked: number;
  /** The colour scheme written from the instance's palette; undefined when none was declared. */
  scheme: ColourScheme | undefined;
  siteData: IgSiteDataResult;
}

/**
 * Point the IG source's links to an artefact page at THIS site's copy.
 *
 * The Publisher writes every artefact page flat beside the narrative pages,
 * so the IG's own prose links `ValueSet-Domains.html`. This site keeps them
 * under `pagesHref` (`artifact/`), so those links 404 unless rewritten.
 * Only a bare relative link whose page name IS an artefact page is touched —
 * in a markdown link target or an `href` — so a narrative page that happens
 * to share a name is never redirected. Measured on smart-trust at `25771f6`
 * (bean `mftp`): 34 such links over 4 artefacts.
 */
export function relinkArtifacts(text: string, pageNames: ReadonlySet<string>, pagesHref: string): { text: string; count: number } {
  let count = 0;
  const out = text.replace(/(\]\(|href=["'])([A-Za-z0-9][A-Za-z0-9._-]*)\.html(?=[#)"'?])/g, (whole, pre: string, name: string) => {
    if (!pageNames.has(name)) return whole;
    count++;
    return `${pre}${pagesHref}${name}.html`;
  });
  return { text: out, count };
}

/**
 * Point a page's links to the IG Publisher's DOWNLOADS at the IG's published
 * site. `downloads.md` links `package.tgz` and `definitions.json.zip` beside
 * itself because the Publisher writes them there; this build renders pages,
 * not packages, so those links resolved to nothing (7 per IG, measured on
 * litlfred/smart-immunizations' site, 2026-10-05). The published IG at the
 * sushi `canonical` serves the same files. Only a bare relative `.zip`/`.tgz`
 * name is touched: an archive is a Publisher output by construction here,
 * and a path, a query or an absolute URL is the author's and is left alone.
 */
export function relinkPublisherOutputs(text: string, publishedBase: string): { text: string; count: number } {
  let count = 0;
  const base = publishedBase.replace(/\/$/, "");
  const out = text.replace(/(\]\(|href=["'])([A-Za-z0-9][A-Za-z0-9._-]*\.(?:zip|tgz))(?=[)"'])/g, (_w, pre: string, file: string) => {
    count++;
    return `${pre}${base}/${file}`;
  });
  return { text: out, count };
}

/** A menu href made site-absolute under `baseurl`; an absolute or external one is kept. */
const siteHref = (baseurl: string, href: string): string =>
  /^([a-z][a-z0-9+.-]*:|\/|#)/i.test(href) ? href : `${baseurl.replace(/\/$/, "")}/${href}`;

const escHtml = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * The IG's TOC as a DECLARED navbar section (`visualiserNavOf` in
 * `cat-harness/scripts/lib/navbar.ts`): one row per menu group, its items one
 * level below — the depth the navbar allows, and the shape of the IG's own
 * menu. The rail lifts it into the folio-assistant LHS navbar.
 */
export function igTocNav(menu: IgMenu, baseurl: string, extra: ReadonlyArray<{ label: string; href: string }> = []): string {
  const rows = [
    ...menu.groups.map((g) => ({
      label: g.label,
      ...(g.items?.length ? { items: g.items.map((it) => ({ label: it.label, href: siteHref(baseurl, it.href) })) } : {}),
    })),
    ...extra.map((e) => ({ label: e.label, href: siteHref(baseurl, e.href) })),
  ];
  return `<script type="application/json" data-fa-visualiser-nav>${JSON.stringify(rows).replace(/</g, "\\u003c")}</script>`;
}

/**
 * The IG's own top bar, preserved: the Publisher's menu as a row of
 * dropdowns, one per group. `<details>`, so it needs no script; and not a
 * `<nav class="fa-nav">`, which the rail pass would read as "already
 * navigated" and skip.
 */
export function igTopBar(menu: IgMenu, baseurl: string, title: string): string {
  const groups = menu.groups
    .map((g) =>
      g.items?.length
        ? `<details class="ig-topbar-group"><summary>${escHtml(g.label)}</summary><ul>${g.items
            .map((it) => `<li><a href="${escHtml(siteHref(baseurl, it.href))}">${escHtml(it.label)}</a></li>`)
            .join("")}</ul></details>`
        : `<span class="ig-topbar-group">${escHtml(g.label)}</span>`,
    )
    .join("");
  return `<div class="ig-topbar" role="navigation" aria-label="${escHtml(title)} menu"><a class="ig-topbar-home" href="${escHtml(siteHref(baseurl, "index.html"))}">${escHtml(title)}</a>${groups}</div>`;
}

/** The top bar's style: a horizontal row, dropdowns that overlay the page. */
const IG_TOPBAR_CSS = `
.ig-topbar{display:flex;flex-wrap:wrap;align-items:center;gap:.25rem 1rem;padding:.5rem 1rem;background:var(--ig-topbar-bg,#1c4b7c);color:#fff;font-size:.95rem}
.ig-topbar a{color:#fff;text-decoration:none}
.ig-topbar-home{font-weight:600;margin-right:.5rem}
.ig-topbar-group{position:relative}
.ig-topbar-group summary{cursor:pointer;list-style:none}
.ig-topbar-group summary::after{content:" \\25BE"}
.ig-topbar-group ul{position:absolute;z-index:20;margin:.25rem 0 0;padding:.25rem 0;min-width:16rem;list-style:none;background:#fff;border:1px solid #ccc;box-shadow:0 2px 6px rgba(0,0,0,.15)}
.ig-topbar-group li a{display:block;padding:.25rem .75rem;color:#1c4b7c}
.ig-topbar-group li a:hover{background:#eef3f8}
.ig-main{max-width:60rem;padding:1rem 1.5rem 3rem}
.ig-edit{margin-top:2rem;font-size:.85rem}
.ig-src{font-size:.7em;text-decoration:none;opacity:.45;margin-left:.25em}
.ig-src:hover{opacity:1}
.ig-feedback{font-size:.7em;text-decoration:none;opacity:.55;margin-left:.15em}
.ig-feedback:hover{opacity:1}
`;

/**
 * The plain layout for `chrome: "harness"`: just-the-docs' stylesheet for the
 * prose (and the IG's colour scheme), the IG's top bar and TOC declaration,
 * the page — and no sidebar, so the rail pass supplies the navbar.
 */
export function harnessLayout(topBar: string, tocNav: string, sectionLabel?: string): string {
  return [
    "<!DOCTYPE html>",
    '<html lang="{{ page.lang | default: site.lang | default: \'en\' }}">',
    "<head>",
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "<title>{% if page.title %}{{ page.title }} | {% endif %}{{ site.title }}</title>",
    "<link rel=\"stylesheet\" href=\"{{ '/assets/css/just-the-docs-default.css' | relative_url }}\">",
    `<style>${IG_TOPBAR_CSS.trim()}</style>`,
    // The navbar section is named after the IG (owner, 2026-10-05).
    ...(sectionLabel ? [`<meta name="fa-visualiser-label" content="${escHtml(sectionLabel)}">`] : []),
    "</head>",
    "<body>",
    tocNav,
    topBar,
    '<main class="ig-main main-content" id="main-content">',
    "{{ content }}",
    '{% if page.ig_edit_url %}<p class="ig-edit"><a href="{{ page.ig_edit_url }}">Edit this page on GitHub</a></p>{% endif %}',
    '{% if page.ig_source_lines %}<script type="application/json" id="ig-source-lines">{"blob": {{ page.ig_source_blob | jsonify }}, "lines": {{ page.ig_source_lines | jsonify }}}</script>',
    `<script>${SOURCE_LINKS_JS}</script>{% endif %}`,
    "</main>",
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

/**
 * Every ATX heading of a markdown source with its 1-based line, outside code
 * fences: `{ t, l }`, `t` the heading's text with markdown, links and a
 * trailing `{#id}` removed — what a reader sees, which is what the layout
 * matches it against. Setext headings are not read; a heading the reader
 * sees and this does not simply gets no source link.
 */
export function sourceHeadings(md: string): Array<{ t: string; l: number }> {
  const out: Array<{ t: string; l: number }> = [];
  let fence: string | undefined;
  md.split(/\r?\n/).forEach((line, i) => {
    const f = /^\s{0,3}(```|~~~)/.exec(line);
    if (f) {
      fence = fence === undefined ? f[1] : fence === f[1] ? undefined : fence;
      return;
    }
    if (fence !== undefined) return;
    const h = /^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/.exec(line);
    if (!h) return;
    const t = h[1]!
      .replace(/\{[#:][^}]*\}\s*$/, "")
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/<[^>]+>/g, "")
      .replace(/[*_`]/g, "")
      .trim();
    if (t) out.push({ t, l: i + 1 });
  });
  return out;
}

/**
 * The layout's per-section links: each heading in the page body that matches
 * a source heading (by its visible text, in order) gets a small link to that
 * line on GitHub, and EVERY heading gets a feedback link — a new issue on the
 * IG's repository, pre-filled with the page, the section and its source line
 * (owner, 2026-10-05: "add [shoutout] Feedback icon that opens a github issue
 * next to the section as well w/ preopopulted github issue content"). Script, because Jekyll has rendered the headings by
 * the time a template could see them; matched by text, because an include can
 * add headings the page's own source does not hold.
 */
const SOURCE_LINKS_JS = `(function(){var d=document.getElementById("ig-source-lines");if(!d)return;var m;try{m=JSON.parse(d.textContent)}catch(e){return}
var repo=(m.blob.match(/^https:\\/\\/github\\.com\\/[^/]+\\/[^/]+/)||[])[0];
var n=function(s){return s.toLowerCase().replace(/[^a-z0-9]+/g," ").trim()};var used={};
var link=function(h,cls,href,title,glyph){var a=document.createElement("a");a.className=cls;a.href=href;a.title=title;a.textContent=glyph;a.rel="noopener";a.target="_blank";h.appendChild(document.createTextNode(" "));h.appendChild(a)};
document.querySelectorAll("#main-content h1,#main-content h2,#main-content h3,#main-content h4,#main-content h5,#main-content h6").forEach(function(h){
var text=h.textContent.trim(),k=n(text),line;for(var i=0;i<m.lines.length;i++){if(!used[i]&&n(m.lines[i].t)===k){used[i]=1;line=m.lines[i].l;break}}
var src=line?m.blob+"#L"+line:m.blob;
if(line)link(h,"ig-src",src,"This section's source, line "+line+", on GitHub","\\u270E");
if(repo){var here=location.href.split("#")[0]+(h.id?"#"+h.id:"");
var body="**Page:** "+here+"\\n**Section:** "+text+"\\n**Source:** "+src+"\\n\\n**Feedback:**\\n\\n";
link(h,"ig-feedback",repo+"/issues/new?title="+encodeURIComponent("Feedback: "+document.title.split(" | ")[0]+" \\u2014 "+text)+"&body="+encodeURIComponent(body),"Give feedback on this section (opens a GitHub issue)","\\uD83D\\uDCE3")}})})();`;

/**
 * The IG's chrome that goes INTO a page when the IG is built inside a host
 * site (`composeIgSite`): the IG's own top bar at the top, and at the bottom
 * the edit link and the per-section source and feedback links. The host's
 * layout supplies everything else — sidebar, search, language selector — so
 * an IG page wears the same chrome as every other page of the site (owner,
 * 2026-10-05, bean `mftp`: *"the chrome is not the standrad harness chrome.
 * missing search bar/locale selctor"*).
 */
export function igChromeIncludes(topBar: string): { top: string; bottom: string } {
  return {
    top: `<style>${IG_TOPBAR_CSS.trim()}</style>\n${topBar}\n`,
    bottom: [
      '{% if page.ig_edit_url %}<p class="ig-edit"><a href="{{ page.ig_edit_url }}">Edit this page on GitHub</a></p>{% endif %}',
      '{% if page.ig_source_lines %}<script type="application/json" id="ig-source-lines">{"blob": {{ page.ig_source_blob | jsonify }}, "lines": {{ page.ig_source_lines | jsonify }}}</script>',
      `<script>${SOURCE_LINKS_JS}</script>{% endif %}`,
      "",
    ].join("\n"),
  };
}

/**
 * Move a staged IG site INTO a host Jekyll source at `<docsRoot>/<instance>/`,
 * so the host's own build renders it with the host's chrome (bean `mftp`,
 * owner's choice: "Build in main site"). What made a separate site per IG
 * necessary (bean `bamf`) is namespaced instead of isolated:
 *
 * - the IG's `_includes/` go to `_includes/ig/<instance>/`, and every
 *   `{% include x %}` naming one of them is rewritten to that path;
 * - its `_data/*.json` go to `_data/ig/<instance>/`, and `site.data.fhir` /
 *   `site.data.ig_releases` become `site.data.ig["<instance>"].…`;
 * - its navigation nests under ONE entry: the IG's index becomes the IG's
 *   top-level page (titled after the IG), each menu group its child, each
 *   item a grandchild (`grand_parent`), so a group called "Home" cannot
 *   collide with another site's "Home";
 * - each page gets the IG's top bar above and the edit / source / feedback
 *   links below (`igChromeIncludes`);
 * - artefact pages stay out of search, which would otherwise index thousands
 *   of near-identical pages.
 *
 * The staged `_layouts/`, `_sass/` and `_config.yml` are the standalone
 * site's and are not carried. A file already at a destination path is
 * reported, never overwritten.
 */
export function composeIgSite(staged: string, docsRoot: string, instance: string): { pages: number; files: number; includes: number; collisions: string[] } {
  const title = /^title:\s*(.+)$/m.exec(readFileSync(join(staged, "_config.yml"), "utf-8"))?.[1]?.replace(/^"(.*)"$/, "$1") ?? instance;
  const q = JSON.stringify(title);
  const dest = join(docsRoot, instance);
  const incDest = join(docsRoot, "_includes", "ig", instance);
  const dataDest = join(docsRoot, "_data", "ig", instance);
  const collisions: string[] = [];
  const incNames = new Set(files(join(staged, "_includes")));
  const rewrite = (text: string): string =>
    text
      .replace(/(\{%-?\s*include\s+)([^\s%}]+)/g, (whole, pre: string, name: string) => (incNames.has(name) ? `${pre}ig/${instance}/${name}` : whole))
      .replace(/site\.data\.fhir\b/g, `site.data.ig[${JSON.stringify(instance)}].fhir`)
      .replace(/site\.data\.ig_releases\b/g, `site.data.ig[${JSON.stringify(instance)}].ig_releases`);
  const put = (to: string, body: string | Buffer): void => {
    if (existsSync(to)) {
      collisions.push(relative(docsRoot, to));
      return;
    }
    mkdirSync(dirname(to), { recursive: true });
    writeFileSync(to, body);
  };
  let includes = 0;
  for (const f of incNames) {
    put(join(incDest, f), rewrite(readFileSync(join(staged, "_includes", f), "utf-8")));
    includes++;
  }
  for (const f of files(join(staged, "_data"))) put(join(dataDest, f), readFileSync(join(staged, "_data", f)));
  const topBar = /<div class="ig-topbar"[\s\S]*?<\/div>(?=\n|$)/.exec(existsSync(join(staged, "_layouts", "default.html")) ? readFileSync(join(staged, "_layouts", "default.html"), "utf-8") : "")?.[0] ?? "";
  const chrome = igChromeIncludes(topBar);
  put(join(incDest, "_top.html"), chrome.top);
  const bottom = join(docsRoot, "_includes", "ig", "_bottom.html");
  if (!existsSync(bottom)) put(bottom, chrome.bottom);
  let pages = 0;
  let count = 0;
  const walk = (rel: string): void => {
    for (const name of readdirSync(join(staged, rel)).sort()) {
      const r = rel ? join(rel, name) : name;
      if (!rel && (name.startsWith("_") || name === "Gemfile")) continue;
      const abs = join(staged, r);
      if (statSync(abs).isDirectory()) {
        walk(r);
        continue;
      }
      count++;
      const isPage = /\.(md|html)$/.test(name) && readFileSync(abs, "utf-8").startsWith("---\n");
      if (!isPage) {
        put(join(dest, r), readFileSync(abs));
        continue;
      }
      const text = rewrite(readFileSync(abs, "utf-8"));
      const end = text.indexOf("\n---", 3);
      let fm = text.slice(4, end);
      const body = text.slice(end + 4).replace(/^\n/, "");
      if (r === "index.md") {
        fm = fm.replace(/^(parent|grand_parent|nav_exclude|has_children|nav_order|title):.*\n?/gm, "");
        fm = `title: ${q}\nhas_children: true\nnav_order: 900\n${fm}`;
      } else if (/^has_children:\s*true/m.test(fm)) {
        if (!/^parent:/m.test(fm)) fm += `\nparent: ${q}`;
      } else if (/^parent:/m.test(fm) && !/^grand_parent:/m.test(fm)) {
        fm += `\ngrand_parent: ${q}`;
      }
      if (r.startsWith(`artifact${"/"}`) && !/^search_exclude:/m.test(fm)) fm += "\nsearch_exclude: true";
      // Named, not inherited: GitHub Pages' default-layout plugin assigns one
      // and a plain Jekyll build does not, so the page says which it uses.
      if (!/^layout:/m.test(fm)) fm += "\nlayout: default";
      fm = fm.replace(/\n+$/, "");
      put(join(dest, r), `---\n${fm}\n---\n{% include ig/${instance}/_top.html %}\n\n${body.replace(/\s*$/, "")}\n\n{% include ig/_bottom.html %}\n`);
      pages++;
    }
  };
  walk("");
  return { pages, files: count, includes, collisions };
}

const files = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => statSync(join(dir, f)).isFile()) : []);

/**
 * `{% include x %}` and `{% lang-fragment x %}` target includes, so a missing
 * one is found before Jekyll aborts on it.
 */
export function includeTargets(md: string): string[] {
  return [...md.matchAll(/\{%-?\s*(?:include|lang-fragment)\s+([^\s%]+)/g)].map((m) => m[1]!);
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
  /**
   * Where the IG's source can be edited on GitHub, `https://github.com/<o>/<r>/edit/<branch>`.
   * Given, every page read from `input/pagecontent/` carries `ig_edit_url`
   * (`<editBase>/input/pagecontent/<file>`) and the layout links it, as the
   * just-the-docs layout's "Edit this page" link did (owner, 2026-10-05, bean
   * `mftp`: *"lost the links to edit the orignial source on github"*). A page
   * this build GENERATES has no source to edit, so it gets none.
   */
  editBase?: string;
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
  const artifactPages = new Set((opts.artifacts?.list ?? []).map((a) => artifactPageName(a)));
  let relinked = 0;
  const canonical = typeof sushi.canonical === "string" ? sushi.canonical : undefined;
  const relink = (text: string): string => {
    let t = text;
    if (canonical) {
      const p = relinkPublisherOutputs(t, canonical);
      relinked += p.count;
      t = p.text;
    }
    if (!opts.artifacts) return t;
    const r = relinkArtifacts(t, artifactPages, opts.artifacts.pagesHref);
    relinked += r.count;
    return r.text;
  };
  for (const f of files(pagecontent).filter((f) => f.endsWith(".md"))) {
    const name = basename(f, ".md");
    let n = nav.get(name);
    if (!n) {
      unlisted.push(f);
      // After every listed page, in file order: the source does not place it.
      // Under a menu it stays reachable but out of the nav, as on the IG.
      n = { title: name, navOrder: 1000 + unlisted.length, ...(fromMenu ? { navExclude: true } : {}) };
    }
    let body = relink(readFileSync(join(pagecontent, f), "utf-8"));
    // Standard HL7 IG Publisher macro for localized includes: {% lang-fragment <file> %}
    body = body.replace(/\{%-?\s*lang-fragment\s+([^\s%]+)\s*-?%\}/g, "{% include $1 %}");
    let data: Record<string, unknown> = opts.editBase
      ? {
          ig_edit_url: `${opts.editBase.replace(/\/$/, "")}/input/pagecontent/${f}`,
          // Per-section source links (owner, 2026-10-05: "feedback on (sub-*)sections
          // should link to line numbers if possible"): each heading's line in the
          // ORIGINAL file, read before anything here rewrites it.
          ig_source_blob: `${opts.editBase.replace(/\/$/, "").replace(/\/edit\//, "/blob/")}/input/pagecontent/${f}`,
          ig_source_lines: sourceHeadings(readFileSync(join(pagecontent, f), "utf-8")),
        }
      : {};
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
      // A transcluded page carries the same flat artefact links as a page does.
      if (dir === pagecontent && f.endsWith(".md")) writeFileSync(join(out, "_includes", f), relink(readFileSync(join(dir, f), "utf-8")));
      else copyFileSync(join(dir, f), join(out, "_includes", f));
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
    const tempInclude = join(src, "temp", "pages", "_includes", name);
    if (existsSync(tempInclude)) {
      copyFileSync(tempInclude, join(out, "_includes", name));
      rendered.push(name);
      continue;
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
  // EVERY IG site wears the folio-assistant navbar and keeps the IG's own top
  // bar — one layout, no per-site choice to drift (owner, 2026-10-05, bean
  // `mftp`: "use folio-assistnat LHS navbar, not custome one", "the orignal
  // topnvar bar should be preserved", "make sure no drift issues"). The
  // layout carries no sidebar, so the post-build rail pass supplies the
  // navbar, with the IG's TOC declared as its section. Needs the IG's menu;
  // without one the site keeps just-the-docs' layout and says so.
  if (opts.menu) {
    // The extra rows are the IG-level pages the Publisher links outside its
    // menu: its own table of contents, and the releases page when written.
    const extra = [{ label: "Table of Contents", href: "toc.html" }, ...(generated.includes("releases.md") ? [{ label: "Releases", href: "releases.html" }] : [])];
    mkdirSync(join(out, "_layouts"), { recursive: true });
    writeFileSync(join(out, "_layouts", "default.html"), harnessLayout(igTopBar(opts.menu, baseurl, title), igTocNav(opts.menu, baseurl, extra), title));
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
  return { pages: pages.sort(), generated, fills: fillsResult, variables: lifted ? { artifacts: Object.keys(lifted.vars.artifacts).length, notSourced: lifted.notSourced } : undefined, unlisted: unlisted.sort(), menuMissing, includes, images, rendered, notRendered, unparseable, relinked, scheme, siteData };
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
    ...(r.relinked ? [`artefact links pointed at this site's artefact pages: ${r.relinked}`] : []),
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
  const artifactsDir = opt("--artifacts");
  let artifactsOpt: StageOptions["artifacts"];
  if (artifactsDir) {
    const artResolved = resolve(artifactsDir);
    const ixPath = existsSync(join(artResolved, "fhir-artifact-index", "index.json"))
      ? join(artResolved, "fhir-artifact-index", "index.json")
      : existsSync(join(artResolved, "index.json"))
        ? join(artResolved, "index.json")
        : undefined;
    if (ixPath) {
      const ix = JSON.parse(readFileSync(ixPath, "utf-8")) as { artifacts: IndexedArtifact[] };
      const pagesHref = opt("--artifacts-href") ?? "artifact/";
      artifactsOpt = { list: ix.artifacts, pagesHref };
      // declared-path-literal: the external artifacts directory's own docs/artifact/ under artResolved, not folio-assistant's docs/
      const docArtifact = existsSync(join(artResolved, "docs", "artifact"))
        ? join(artResolved, "docs", "artifact")
        : existsSync(join(artResolved, "artifact"))
          ? join(artResolved, "artifact")
          : undefined;
      if (docArtifact) {
        mkdirSync(join(resolve(out), "artifact"), { recursive: true });
        for (const af of files(docArtifact)) {
          copyFileSync(join(docArtifact, af), join(resolve(out), "artifact", af));
        }
      }

      // declared-path-literal: the external artifacts directory's own docs/assets/ under artResolved, not folio-assistant's docs/
      const docAssets = existsSync(join(artResolved, "docs", "assets"))
        ? join(artResolved, "docs", "assets")
        : existsSync(join(artResolved, "assets"))
          ? join(artResolved, "assets")
          : undefined;
      if (docAssets) {
        mkdirSync(join(resolve(out), "assets"), { recursive: true });
        for (const asf of files(docAssets)) {
          copyFileSync(join(docAssets, asf), join(resolve(out), "assets", asf));
        }
      }
    }
  }
  const r = stageIgSite(igSrc, resolve(out), {
    baseurl: opt("--baseurl") ?? "",
    plantumlJar: opt("--plantuml-jar"),
    menu: menuPath ? (JSON.parse(readFileSync(menuPath, "utf-8")) as IgMenu) : undefined,
    remoteTheme: opt("--remote-theme"),
    artifacts: artifactsOpt,
  });
  console.log(describeStage(r));
  console.log(`staged ${out}`);
  if (r.siteData.refused.length) process.exit(1);
}
