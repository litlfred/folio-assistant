/**
 * The ONE implementation of a Tool output's render hint — bean `q2wm`, R17.
 *
 * `schemas/tool.ts` declares what a renderer MAY do with an output
 * ({@link RENDER_AS}); this does exactly that and no more, so a renderer that
 * puts a tool's output into a page calls this rather than deciding for itself.
 * A hint nothing reads is not a restriction — this is what reads it.
 *
 * Every branch returns an HTML FRAGMENT that is safe to insert:
 *
 * - `text` (and absent) — escaped. No markup, no link, whatever the value holds.
 * - `url` — an `<a>` only when {@link safeHref} accepts the scheme; otherwise
 *   the value as escaped text. A refused URL is SHOWN, never silently dropped:
 *   a hostile value hidden reads as a missing one.
 * - `markdown` — remark with raw HTML OFF (`sanitize: true`, GitHub's schema),
 *   so `<script>` and event attributes never survive, and a link whose scheme
 *   the sanitiser refuses loses its `href`.
 * - `json` — escaped inside `<pre>`. Data is shown, never evaluated.
 *
 * @module schemas/render-output
 * @graphNode schema
 */
import { remark } from "remark";
import remarkHtml from "remark-html";

import { safeHref } from "./safe-url.js";
import type { ToolRender } from "./tool.js";

/** Escape for HTML text and attribute content alike. */
export function escapeForHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Render one Tool output value as its declared hint allows. Absent hint is `text`. */
export function renderToolOutput(value: string, hint?: Pick<ToolRender, "as">): string {
  switch (hint?.as ?? "text") {
    case "url": {
      const href = safeHref(value);
      return href === undefined
        ? escapeForHtml(value)
        : `<a href="${escapeForHtml(href)}" rel="noopener noreferrer">${escapeForHtml(value)}</a>`;
    }
    case "markdown":
      return String(remark().use(remarkHtml, { sanitize: true }).processSync(value)).trim();
    case "json":
      return `<pre>${escapeForHtml(value)}</pre>`;
    default:
      return escapeForHtml(value);
  }
}
