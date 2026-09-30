/**
 * Backtick spans in authored prose, rendered as `<code>` — bean `mylx`.
 *
 * @module schemas/inline-code
 * @graphNode schema
 *
 * Bean titles, glossary definitions and skill descriptions are written in
 * Markdown, and they reach HTML through generators that escape text and emit
 * it verbatim. So a reader saw the backticks themselves: measured 2026-09-24
 * over a local build, 10,071 literal backtick spans on 265 pages, most of
 * them from two shared paths (the todo listing on every themed page and the
 * glossary).
 *
 * ## The caller's escaper, not ours
 *
 * Every generator already escapes, and not identically: the glossary also
 * escapes `{` because its output passes through Liquid. A helper with its own
 * escaper would be a second answer to "what is safe here", free to disagree
 * with the page's. So the caller passes theirs, and it is applied to EVERY
 * piece, the code spans included. The only thing this adds is the `<code>`
 * wrapper around text the author marked.
 *
 * ## What counts as a span
 *
 * A pair of single backticks on one line with at least one character between
 * them. An unpaired backtick is left as written: guessing where it closes
 * would put `<code>` around prose the author never marked.
 */
const SPAN = /`([^`\n]+)`/g;

/** Escape `text` with the caller's `escape`, wrapping each backtick span in `<code>`. */
export function withInlineCode(text: string, escape: (s: string) => string): string {
  let out = "";
  let last = 0;
  for (const m of text.matchAll(SPAN)) {
    const at = m.index!;
    out += escape(text.slice(last, at)) + `<code>${escape(m[1]!)}</code>`;
    last = at + m[0].length;
  }
  return out + escape(text.slice(last));
}

/**
 * The same text with the backtick MARKERS removed, for a surface that cannot
 * hold markup: a page `title:` the theme prints as plain text in the sidebar
 * and the browser tab.
 */
export function stripInlineCode(text: string): string {
  return text.replace(SPAN, "$1");
}
