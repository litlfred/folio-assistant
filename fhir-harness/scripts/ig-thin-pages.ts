/**
 * The THIN artefact page: one IG artefact's rendering, a few KB of identity
 * and a pointer, drawn in the browser from the artefact's JSON-LD node.
 *
 * @module fhir-harness/scripts/ig-thin-pages
 * @covers ig-pages, ig-artifact-jsonld
 *
 * ## Why
 *
 * The owner's ruling of 2026-10-11, option A (paraphrased): FHIR IG output
 * should look like the SMART IG sites' — tiny HTML that loads its content
 * dynamically from the JSON(-LD) knowledge graph. A full artefact page (`gen-ig-pages.ts` without
 * `--thin`) is a just-the-docs page of about 170-230 KB, of which 5-8 KB is
 * the artefact; the rest is the theme's chrome, written into every page
 * (`folio-assistant-gp2f`, #1885). This page carries none of it: the rail is
 * LINKED (`NAVBAR_LINKED`, which the build's rail pass honours), and the
 * content is the node's.
 *
 * ## The helper is reused, not copied
 *
 * {@link thinPageHtml} is cat-harness-tools' (`scripts/thin-page.ts`), the one
 * the OpenAPI operation pages and the library entries follow. fhir-harness may
 * import it: this layer `needs` folio-assistant-core, which sits above
 * cat-harness-tools, so the import runs down the layer order
 * (`check:import-direction`), as `gen-ig-pages.ts`' imports of
 * `route-authority.ts` and `viewer-declarations.ts` already do.
 *
 * ## The address stays the Publisher's
 *
 * `artifact/<Type>-<id>.html`, the file the full page was: the IG's artifacts
 * page, its narrative's links (`ast-pages.json`) and the footer's reading
 * order all name it. So the page passes its file name as `canonical` rather
 * than the helper's `./`.
 *
 * Nothing here may know about WHO (fhir-harness/AGENTS.md).
 */
import { escHtml, thinPageHtml } from "../../cat-harness-tools/scripts/thin-page.ts";
import { PAGE_BAR_CLASS, PAGE_FOOT_CLASS, PAGE_MAIN_CLASS } from "../../cat-harness-tools/scripts/page-layout.ts";
import type { FhirArtifact, FhirArtifactIndex } from "../schemas/fhir-artifact-index.js";
import { ARTIFACT_DIR, artifactPageName, localResourceHref } from "./ig-artifact-jsonld.ts";
import { igSearchBox, igSearchScript, type IgSearchRef } from "./ig-search.ts";

/** The config block's id — how a run, or a check, recognises a thin artefact page. */
export const THIN_PAGE_CONFIG_ID = "ig-artifact-page";
/** The shared renderer and its stylesheet, under the docs root. */
export const THIN_PAGE_SCRIPT = "assets/ig-artifact.js";
export const THIN_PAGE_STYLE = "assets/ig-artifact.css";

export interface ThinArtifactOptions {
  /** The IG's display name. */
  label: string;
  /** The IG's home, relative to an artefact page. */
  home: string;
  /** The artefact index page, relative to an artefact page. */
  all: string;
  /** The table of contents, relative to an artefact page, when the site has one. */
  toc?: string;
  /** The reading order's neighbours, relative to the page. */
  prev?: string;
  next?: string;
  /** `gen-ig-pages --compiled-data`. */
  compiledData?: string;
  /**
   * The resource's JSON as this site serves it, relative to the page, when
   * there is no compiled copy: the Publisher's own `<Type>-<id>.json`, which
   * an IG repository's site carries as data (`gen-ig-pages --publisher-data`).
   * The page's views draw from it. Absent: the node's own local copy, or none.
   */
  resource?: string;
  /** The artefact's views, its own page first ({@link artifactTabs}). Absent or one: no tab bar. */
  tabs?: readonly ArtifactTab[];
  /** The index node, relative to the page: the examples view finds what claims a profile there. */
  index?: string;
  /** The IG's search (`ig-search.ts`), relative to the page, when the site serves it: the header carries its box. */
  search?: IgSearchRef;
}

/**
 * THE TAB VIEWS (owner, 2026-10-14, answering whether the IG Publisher's
 * per-artefact tab views are rendered: *"3. Render them too"*; and *"I DO NOT
 * WANT THE IG PUBLISHER HTML"*). Each is a thin page beside the artefact's
 * own, at the file name the Publisher gives its tab, so a link written for
 * the Publisher's layout lands once it is pointed at `artifact/`. The view is
 * drawn by the one shared renderer from the resource's JSON; nothing of the
 * Publisher's HTML is read.
 *
 * - `definitions`: the element table, from the StructureDefinition's snapshot
 *   (its differential where it has no snapshot);
 * - `mappings`: the StructureDefinition's `mapping` declarations, each with
 *   the elements that map to it;
 * - `json`: the resource's JSON, by the shared AST loader (`ast-resource.js`).
 *   The Publisher names a profile's `<…>.profile.json.html` and any other
 *   resource's `<…>.json.html`;
 * - `examples`: the IG's artefacts that claim the profile (`meta.profile`),
 *   read off the index node. Written for EVERY StructureDefinition, as the
 *   Publisher writes it; where nothing claims the profile the page says there
 *   are no examples (owner, 2026-10-14: "1a").
 *
 * Not rendered: the change history, testing and XML/Turtle views, and the
 * Publisher's `comparison-v*` directories.
 */
export type ArtifactView = "content" | "definitions" | "mappings" | "json" | "examples";

export interface ArtifactTab {
  view: ArtifactView;
  label: string;
  /** The page's file name, in the artefact pages' directory. */
  file: string;
}

const TAB_LABEL: Record<ArtifactView, string> = { content: "Content", definitions: "Detailed Descriptions", mappings: "Mappings", json: "JSON", examples: "Examples" };

/** The file name the Publisher gives an artefact's view, which the thin page keeps. */
export function artifactTabFile(a: Pick<FhirArtifact, "resourceType" | "id">, view: ArtifactView): string {
  const stem = artifactPageName(a);
  switch (view) {
    case "content":
      return `${stem}.html`;
    case "json":
      return a.resourceType === "StructureDefinition" ? `${stem}.profile.json.html` : `${stem}.json.html`;
    default:
      return `${stem}-${view}.html`;
  }
}

/**
 * The views an artefact gets, its own page first. None without a resource
 * this site serves: every view is drawn from it. Deterministic.
 */
export function artifactTabs(a: Pick<FhirArtifact, "resourceType" | "id">, o: { resource: boolean }): ArtifactTab[] {
  if (!o.resource) return [];
  const sd = a.resourceType === "StructureDefinition";
  const views: ArtifactView[] = ["content", ...(sd ? (["definitions", "mappings"] as const) : []), "json", ...(sd ? (["examples"] as const) : [])];
  return views.map((view) => ({ view, label: TAB_LABEL[view], file: artifactTabFile(a, view) }));
}

/** The tab bar, as static HTML: every view's page is a plain link, the current one marked. */
function tabBar(tabs: readonly ArtifactTab[] | undefined, current: ArtifactView): string {
  if (!tabs || tabs.length < 2) return "";
  const links = tabs.map((t) => `<a href="${escHtml(t.file)}"${t.view === current ? ' aria-current="page"' : ""}>${escHtml(t.label)}</a>`);
  return `<nav class="iga-tabs" aria-label="Views of this artefact">${links.join("")}</nav>`;
}

/** The thin page for one artefact, as `artifact/<Type>-<id>.html`. Deterministic. */
export function thinArtifactPage(ix: FhirArtifactIndex, a: FhirArtifact, o: ThinArtifactOptions): string {
  return thinArtifactView(ix, a, "content", o);
}

/**
 * The thin page of one of an artefact's views ({@link ArtifactView}): the
 * artefact's own page for `content`, else a tab page at the Publisher's file
 * name for that tab ({@link artifactTabFile}). The same shell, config block
 * and renderer as the artefact's page; the config's `view` says what to draw.
 * Deterministic.
 */
export function thinArtifactView(ix: FhirArtifactIndex, a: FhirArtifact, view: ArtifactView, o: ThinArtifactOptions): string {
  const name = a.title ?? a.name ?? a.id;
  const node = `${artifactPageName(a)}.jsonld`;
  const local = localResourceHref(a, o.compiledData) ?? o.resource;
  const html = a.published.html?.url;
  const tab = view === "content" ? undefined : TAB_LABEL[view];
  const config: Record<string, unknown> = {
    node,
    ...(view === "content" ? {} : { view }),
    home: o.home,
    ...(o.toc ? { toc: o.toc } : {}),
    footer: "../assets/ig-footer.json",
    // The reading order runs through the artefacts' own pages, not their tabs.
    ...(view === "content" && o.prev ? { prev: o.prev } : {}),
    ...(view === "content" && o.next ? { next: o.next } : {}),
    // The resource this site serves, when the node names no local copy of it.
    ...(o.resource && !localResourceHref(a, o.compiledData) ? { resource: o.resource } : {}),
    // The AST loader and the list of this site's own pages, which it uses to
    // keep a narrative link that names one of them.
    ...(local ? { astLoader: "../assets/ast-resource.js", pages: "../assets/ast-pages.json" } : {}),
    ...(view === "examples" && o.index ? { index: o.index } : {}),
    // A mapping row links its element on the definitions view.
    ...(view === "mappings" ? { definitions: artifactTabFile(a, "definitions") } : {}),
    // Where the narrative's other relative links go: the published IG, read
    // off this artefact's own published page. None: they lose their href.
    ...(html ? { published: html.slice(0, html.lastIndexOf("/") + 1) } : {}),
  };
  const noscript =
    `<p>This page draws ${tab ? `the ${escHtml(tab.toLowerCase())} of ` : ""}${escHtml(a.key)} from <a href="${escHtml(node)}">its JSON-LD node</a>` +
    (local ? ` and <a href="${escHtml(local)}">the resource's JSON</a>` : "") +
    `; it needs JavaScript to draw them. <a href="${escHtml(o.all)}">All ${ix.count} artefacts</a>.</p>`;
  return thinPageHtml({
    title: `${name}${tab ? ` — ${tab}` : ""} — ${o.label}`,
    jsonld: node,
    canonical: artifactTabFile(a, view),
    script: `../${THIN_PAGE_SCRIPT}`,
    // The shared page layout (width, bar, scrolling), then the IG's look.
    layout: "../",
    stylesheet: `../${THIN_PAGE_STYLE}`,
    configId: THIN_PAGE_CONFIG_ID,
    config,
    // Identity only — what a link preview, a search engine and a reader
    // without JavaScript need — and the tab bar, plain links between the
    // artefact's views. Everything else is the node's and the resource's.
    body:
      `<header class="iga-top ${PAGE_BAR_CLASS}"><a class="iga-home" href="${escHtml(o.home)}">${escHtml(o.label)}</a>` +
      `<a href="${escHtml(o.all)}">all ${ix.count} artefacts</a>${o.search ? igSearchBox(o.search, o.label) : ""}</header>\n` +
      `<main class="iga ${PAGE_MAIN_CLASS}"><h1>${escHtml(name)}${tab ? ` <span class="iga-view">— ${escHtml(tab)}</span>` : ""}</h1><p class="iga-key"><code>${escHtml(a.key)}</code></p>` +
      tabBar(o.tabs, view) +
      `<div class="iga-body" aria-live="polite"><p class="iga-state">Loading the artefact…</p></div></main>\n` +
      `<footer id="ig-footer" class="${PAGE_FOOT_CLASS}"></footer>`,
    noscript,
    ...(o.search ? { tail: igSearchScript(o.search) } : {}),
  });
}

/** The page's path under the docs root. */
export const thinArtifactPath = (a: FhirArtifact): string => `${ARTIFACT_DIR}/${artifactPageName(a)}.html`;

/** The config block's id of a thin IG-level list page (`artifacts`, `toc`). */
export const THIN_INDEX_CONFIG_ID = "ig-index-page";

/**
 * A thin IG-level page that LISTS the artefacts, drawn from the one index
 * node (`artifact/index.jsonld`, `ig-artifact-jsonld.ts`) rather than written
 * into the page: the IG's `artifacts.html` (`view: "artifacts"`, every
 * category OPEN — the owner could not find artefacts behind collapsed ones,
 * 2026-10-12) and its `toc.html` (`view: "toc"`: the IG's own pages, which
 * are the page's structure and stay in its HTML as `outline`, then every
 * artefact under its category). Written by `build-ig-site.ts`, which owns
 * both pages, at the addresses the full pages had. Every href is relative
 * to the page.
 */
export interface ThinIndexOptions {
  view: "artifacts" | "toc";
  /** The page's own heading, plain text. */
  heading: string;
  /** The IG's display name. */
  label: string;
  /** The page's file name, for `rel="canonical"`. */
  canonical: string;
  /** The index node. */
  index: string;
  /** The directory of the artefact pages, ending in `/`. */
  pagesHref: string;
  /** The docs root holding `assets/`, `""` or ending in `/`. */
  assets: string;
  /** The IG's home, its artifacts page and its table of contents. */
  home: string;
  artifacts: string;
  toc: string;
  /** The reading order's neighbours. */
  prev?: string;
  next?: string;
  /** HTML the caller built and escaped: the IG's own pages, for the toc. */
  outline?: string;
  /** The IG's search (`ig-search.ts`), relative to the page, when the site serves it: the header carries its box. */
  search?: IgSearchRef;
}

/** The thin `artifacts` or `toc` page. Deterministic. */
export function thinIndexPage(o: ThinIndexOptions): string {
  const config: Record<string, unknown> = {
    view: o.view,
    index: o.index,
    // What a description's relative links are relative to: the IG's docs root.
    root: o.assets,
    pages: o.pagesHref,
    home: o.home,
    artifacts: o.artifacts,
    toc: o.toc,
    footer: `${o.assets}assets/ig-footer.json`,
    ...(o.prev ? { prev: o.prev } : {}),
    ...(o.next ? { next: o.next } : {}),
  };
  const lead = o.view === "artifacts" ? "This page lists the FHIR artifacts defined as part of this implementation guide." : "";
  return thinPageHtml({
    title: `${o.heading} — ${o.label}`,
    jsonld: o.index,
    canonical: o.canonical,
    script: `${o.assets}${THIN_PAGE_SCRIPT}`,
    layout: o.assets,
    stylesheet: `${o.assets}${THIN_PAGE_STYLE}`,
    configId: THIN_INDEX_CONFIG_ID,
    config,
    body:
      `<header class="iga-top ${PAGE_BAR_CLASS}"><a class="iga-home" href="${escHtml(o.home)}">${escHtml(o.label)}</a>` +
      `<a href="${escHtml(o.artifacts)}">Artifacts</a><a href="${escHtml(o.toc)}">Table of Contents</a>${o.search ? igSearchBox(o.search, o.label) : ""}</header>\n` +
      `<main class="iga igi ${PAGE_MAIN_CLASS}"><h1>${escHtml(o.heading)}</h1>${lead ? `<p>${lead}</p>` : ""}${o.outline ?? ""}` +
      `<div class="iga-body" aria-live="polite"><p class="iga-state">Loading the artefact index…</p></div></main>\n` +
      `<footer id="ig-footer" class="${PAGE_FOOT_CLASS}"></footer>`,
    noscript:
      `<p>The artefacts on this page are drawn from <a href="${escHtml(o.index)}">the IG's artefact index</a>; ` +
      `it needs JavaScript to draw them. Each artefact's page is <code>${escHtml(o.pagesHref)}&lt;Type&gt;-&lt;id&gt;.html</code>.</p>`,
    ...(o.search ? { tail: igSearchScript(o.search) } : {}),
  });
}
