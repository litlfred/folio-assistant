/**
 * The THIN PAGE — one asset's own rendering, materialised as a real file that
 * loads the asset's published JSON-LD at runtime.
 *
 * @module scripts/thin-page
 *
 * ## The rules
 *
 * - every asset has ONE IRI, the address of its published JSON-LD;
 * - its rendering is a SEPARATE resource at a path of its own (`<…>/<id>/`),
 *   with `rel="canonical"` naming itself and `rel="alternate"
 *   type="application/ld+json"` naming the asset;
 * - no `#` or `?` in the address, and no 404 routing — the page is a file;
 * - nothing of the asset's content is written into the page. The script
 *   reads it; the `<noscript>` names where it lives.
 * - the asset carries no link to its renderings. The page points at the
 *   asset, never the other way round.
 *
 * ## Who uses it
 *
 * The library and todo page families render through the theme's layout
 * (`gen-library-viz.ts` `libraryPageHtml`, `todo-page.ts` `todoPageHtml`), so
 * no generator calls {@link thinPageHtml} today; they keep the same rules and
 * still name themselves through {@link thinPageConfigOf}.
 *
 * ## The rail is LINKED, and that is a declaration
 *
 * {@link NAVBAR_LINKED} is written by default: `assets/css/navbar.css` and the
 * row's own files are LINKED, so the page carries only the rail's markup. The
 * build's rail passes honour the meta; `check-viewer-nav.ts` reads it as
 * `linked`, railed at build.
 */
import { NAVBAR_LINKED } from "./lib/harness-rail.ts";
import { pageLayoutTags } from "./page-layout.ts";

/** HTML-escape for text and attribute values, both quote characters included. */
export function escHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** One thin page. Every href is relative to the page itself. */
export interface ThinPage {
  /** The document title, plain text. */
  title: string;
  /**
   * The asset this page renders — its published JSON-LD, relative to the page.
   * Absent only when the asset has no published serialisation yet: then no
   * `alternate` is written, and the caller must say so in {@link noscript}.
   */
  jsonld?: string;
  /** The script that draws the page, relative to the page. */
  script: string;
  /** An optional stylesheet, relative to the page. */
  stylesheet?: string;
  /**
   * Link the shared page layout (`page-layout.ts`): the path from the page to
   * the site root that serves it, `""` at the root or `"../"` one level down.
   * The body then opts in by its classes (`fa-page-bar`, `fa-page-main`).
   * Absent, nothing is linked.
   */
  layout?: string;
  /**
   * The id of the `<script type="application/json">` config block. Each
   * family of pages names its own, which is what lets a generator recognise
   * its own output (and prune it) without touching anybody else's.
   */
  configId: string;
  /** The page's identity, read by the script. Never the asset's content. */
  config: Record<string, unknown>;
  /**
   * The skeleton the script fills, as HTML. The caller's — and the caller
   * escapes anything interpolated into it.
   */
  body: string;
  /** What a reader without JavaScript sees, as HTML, BEFORE the link to the asset. Defaults to "This page". */
  noscriptLead?: string;
  /**
   * The whole `<noscript>` content, as HTML, replacing the default sentence —
   * for a page that loads more than its own asset and must name what else.
   * The caller escapes anything interpolated into it.
   */
  noscript?: string;
  /** HTML written after the page's script, before `</body>` — e.g. a mount fragment. Its own line, even when empty. */
  tail?: string;
  /** `lang` of the document. */
  lang?: string;
  /** Keep the viewer rail. Off by default — see the module docs. */
  navbar?: boolean;
  /** The tab icon's href. Defaults to {@link DEFAULT_ICON}. */
  icon?: string;
  /**
   * The page's own address, relative to itself, for `rel="canonical"`.
   * Defaults to `./` — right for a page written as `<…>/<id>/index.html`.
   * A family whose pages are FILES at addresses readers already link
   * (an IG's `artifact/<Type>-<id>.html`, the IG Publisher's own names)
   * passes the file's name, so the canonical names the page and not its
   * directory.
   */
  canonical?: string;
}

/**
 * An inline icon, so a thin page makes no request the browser would otherwise
 * make for `/favicon.ico` — a 404 on every page view, which reads in the
 * console exactly like a broken asset.
 */
export const DEFAULT_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' rx='3' fill='%23276749'/%3E%3C/svg%3E";

/** The config block's JSON, safe to sit inside a `<script>` element. */
function configJson(config: Record<string, unknown>): string {
  return JSON.stringify(config).replace(/</g, "\\u003c");
}

/** Render a thin page. Deterministic: the same input gives the same bytes. */
export function thinPageHtml(p: ThinPage): string {
  const lead = p.noscriptLead ?? "This page";
  if (p.noscript === undefined && p.jsonld === undefined) {
    throw new Error(`thin page "${p.title}": no JSON-LD to name, so its <noscript> must be given`);
  }
  const noscript =
    p.noscript ??
    `<p>${lead} loads its content from <a href="${escHtml(p.jsonld!)}">its JSON-LD</a>; it needs JavaScript to draw it.</p>`;
  return `<!doctype html>
<html lang="${escHtml(p.lang ?? "en")}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(p.title)}</title>
<link rel="canonical" href="${escHtml(p.canonical ?? "./")}">
<link rel="icon" href="${escHtml(p.icon ?? DEFAULT_ICON)}">
${p.navbar ? "" : `${NAVBAR_LINKED}\n`}${p.jsonld !== undefined ? `<link rel="alternate" type="application/ld+json" href="${escHtml(p.jsonld)}">\n` : ""}${p.layout !== undefined ? `${pageLayoutTags(escHtml(p.layout))}\n` : ""}${p.stylesheet ? `<link rel="stylesheet" href="${escHtml(p.stylesheet)}">\n` : ""}</head>
<body>
${p.body.trimEnd()}
<noscript>${noscript}</noscript>
<script type="application/json" id="${escHtml(p.configId)}">${configJson(p.config)}</script>
<script src="${escHtml(p.script)}"></script>
${p.tail !== undefined ? `${p.tail}\n` : ""}</body>
</html>
`;
}

/**
 * A thin page's config, read back from its own markup — or `undefined` when
 * the page carries no block with that id, or the block does not parse.
 *
 * This is how a generator recognises its OWN output: by the declaration the
 * page makes about itself, not by its name or its directory.
 */
export function thinPageConfigOf(content: string, configId: string): Record<string, unknown> | undefined {
  const esc = configId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = new RegExp(`<script type="application/json" id="${esc}">([^<]*)</script>`).exec(content);
  if (!m) return undefined;
  try {
    const v: unknown = JSON.parse(m[1]!);
    return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}
