/**
 * The THIN PAGE — one asset's own rendering, materialised as a real file that
 * loads the asset's published JSON-LD at runtime.
 *
 * @module scripts/thin-page
 *
 * ## Where the rule comes from
 *
 * #1881 / #1899 (library), owner, 2026-10-02: *"each link/page needs to be
 * materialized on the CDN (gh-pagees), just load the content from the KG
 * json(ld) assets already published"* — and *"each asset should have one IRI,
 * but the view page is a rendering of that asset, a different page"*. So:
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
 * ## Why a module of its own
 *
 * The library's per-entry pages (#1899) were the first instance of this, and
 * the todo pages (#1908) the second, so the generic part lives HERE rather
 * than in either generator. Both families render through
 * {@link thinPageHtml}: `entryPageHtml` in `gen-library-viz.ts` and
 * `todoPageHtml` in `todo-page.ts` supply only their skeleton, their config
 * and — where a page loads more than its asset — their own `<noscript>`.
 *
 * ## The rail is declined, and that is a declaration
 *
 * {@link NAVBAR_OPT_OUT} is written by default, for the reason the library
 * shell gives: the viewer rail is ~14 KB of inlined markup and style, which
 * would make every per-asset page as heavy as the page it stands for.
 * `check-viewer-nav.ts` reads the meta as a decision, not as a missing rail.
 */
import { NAVBAR_OPT_OUT } from "./viewer-page.ts";

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
<link rel="canonical" href="./">
<link rel="icon" href="${escHtml(p.icon ?? DEFAULT_ICON)}">
${p.navbar ? "" : `${NAVBAR_OPT_OUT}\n`}${p.jsonld !== undefined ? `<link rel="alternate" type="application/ld+json" href="${escHtml(p.jsonld)}">\n` : ""}${p.stylesheet ? `<link rel="stylesheet" href="${escHtml(p.stylesheet)}">\n` : ""}</head>
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
