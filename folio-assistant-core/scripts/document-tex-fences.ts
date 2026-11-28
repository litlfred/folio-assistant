/**
 * document-tex-fences — a block's fenced ```tex code on the DOCUMENT site
 * (build-document-site.ts), made readable rather than shown as a code listing.
 *
 * A paper folio writes commutative diagrams, tables and numbered equations as
 * ```tex fences (`\begin{equation}\label{…}\begin{tikzcd}…`). remark-html makes
 * each a `<pre><code class="language-tex">`, so the reader saw raw LaTeX, and
 * folio-site-qa.ts did not see it either: it drops `<pre>` before it looks for
 * raw TeX. build-folio-site.ts's `texFences` already handled this for the
 * folio site; the document site, which qou publishes, never had it.
 *
 * Per fence, the first that applies:
 *
 * 1. A PRE-RENDERED SVG whose hash is this fence's — sha256 of the trimmed
 *    source, first 12 hex, exactly as cat-harness-tools'
 *    `render-tex-blocks.ts` computes it and writes beside the SVG as
 *    `rendered/<file>.svg.hash`. Matched by HASH, never by position, so an SVG
 *    left over from an edited fence is never shown.
 * 2. Display MATH, with math on and no environment KaTeX lacks (`tikzcd`,
 *    `tikzpicture`, `tabular`, `table`, `adjustbox`, `center`): `equation` is
 *    unwrapped and `\label` dropped; `align`, `gather` and the rest KaTeX reads
 *    in display mode as they are.
 * 3. Otherwise a labelled placeholder with the source behind a disclosure.
 *
 * Every `\label{x}` in the fence becomes an anchor `id="x"` before it, so a
 * `\eqref{x}` (a link to `#x`, texInMarkdown) lands on the equation.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/** The fence's hash, as render-tex-blocks.ts computes it. */
export function texFenceHash(source: string): string {
  return createHash("sha256").update(source.trim()).digest("hex").slice(0, 12);
}

/**
 * Every pre-rendered fence SVG under a document folder: hash -> the SVG's path
 * relative to that folder (`<chapter>/rendered/<block>-<i>.svg`). Read from the
 * `.svg.hash` files render-tex-blocks.ts writes; an SVG without one is skipped.
 */
export function texSvgIndex(documentDir: string): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (name === "node_modules" || name.startsWith(".")) continue;
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith(".svg.hash") && dir.endsWith("/rendered")) {
        const svg = p.slice(0, -".hash".length);
        if (existsSync(svg)) out.set(readFileSync(p, "utf-8").trim(), relative(documentDir, svg).split("\\").join("/"));
      }
    }
  };
  if (existsSync(documentDir)) walk(documentDir);
  return out;
}

const NOT_KATEX = /\\begin\{(tikzcd|tikzpicture|tabular|table|adjustbox|center)\*?\}/;
const escHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** A document's Markdown with each ```tex fence rewritten (see the module note). `used` collects the SVGs shown. */
export function documentTexFences(md: string, opts: { math: boolean; svgs: Map<string, string>; used?: Set<string> }): string {
  return md.replace(/^([ \t]*)```tex[^\n]*\n([\s\S]*?)^[ \t]*```[ \t]*$/gm, (_m, indent: string, body: string) => {
    const source = body.trim();
    const anchors = [...source.matchAll(/\\label\{([^}]+)\}/g)].map((m) => `<a id="${escHtml(m[1]!)}"></a>`).join("");
    const svg = opts.svgs.get(texFenceHash(source));
    const html = (h: string) => `${indent}<div class="fa-tex">${anchors}${h}</div>`;
    if (svg) {
      opts.used?.add(svg);
      return html(`<img class="fa-tex-svg" src="${escHtml(svg)}" alt="${escHtml(source)}" loading="lazy">`);
    }
    const diagram = NOT_KATEX.exec(source);
    if (opts.math && !diagram) {
      const inner = source
        .replace(/\\label\{[^}]*\}/g, "")
        .replace(/\\begin\{equation\*?\}|\\end\{equation\*?\}/g, "")
        .replace(/^\\\[|\\\]$/g, "")
        .replace(/\n\s*\n/g, "\n")
        .trim();
      // The anchors stand on their own line: an HTML line right before `$$` would swallow it.
      return `${anchors ? `${indent}${anchors}\n\n` : ""}${indent}$$\n${inner.replace(/^/gm, indent)}\n${indent}$$`;
    }
    const label = diagram && /tabular|table/.test(diagram[1]!) ? "Table" : "Diagram";
    return html(`<div class="tex-ph"><strong>[${label}: not yet rendered]</strong><details><summary>LaTeX source</summary><pre>${escHtml(source)}</pre></details></div>`);
  });
}
