/**
 * One answer to *"is this position inside an HTML comment?"*, because two
 * answers is how `ur84` comes back.
 *
 * ## What `ur84` was
 *
 * `staging-banner` found its insertion point with `html.search(/<body/i)` and
 * put the banner **inside a comment on 323 of 670 staged pages** — 48 % of a
 * preview, measured on the deployed tree, 2026-09-21. The prose comment in
 * `docs/_includes/head_custom.html` that explains why a `<meta>` is used
 * rather than a `<div>` contains the words `<body>` as an EXAMPLE, and
 * `head_custom.html` is in the `<head>` of every just-the-docs page. The
 * non-global `replace` spent its one substitution on the sentence; the real
 * tag, hundreds of lines later, got nothing.
 *
 * **A comment about the banner broke the banner**, and nothing said so: the
 * page still contained `data-fa-staging-banner`, so every check that asked
 * *"did the string land"* answered yes.
 *
 * ## Why this is its own module
 *
 * `folio-mount` has to ask the same question — a marker inside a comment is
 * not a mount — and a second copy of the scan is a second thing to get right.
 * `bodyInsertionPoint` and `hasMount` now differ only in what they look for,
 * which is the only thing they should differ in.
 *
 * ## What it does NOT do
 *
 * It does not parse HTML. A `<!--` inside a `<script>` string literal or an
 * attribute value would be counted as a comment here and is not one. That is
 * accepted rather than overlooked: the failure it guards against is prose in
 * a template, and the direction of the error is the safe one — a marker
 * wrongly judged commented-out fails a gate loudly, where a marker wrongly
 * judged live is exactly the silent `ur84` shape.
 *
 * @module scripts/html-comments
 */

/** Half-open `[start, end)` ranges of every HTML comment in `html`. */
export function commentRanges(html: string): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const m of html.matchAll(/<!--[\s\S]*?-->/g)) {
    out.push([m.index!, m.index! + m[0].length]);
  }
  return out;
}

/**
 * A predicate over one document's comments, built once.
 *
 * Returned as a closure rather than as `isInComment(html, i)` because every
 * caller asks about many positions in one document, and re-scanning per
 * position is how an O(n) check becomes O(n²) on a 670-page tree.
 */
export function commentGuard(html: string): (index: number) => boolean {
  const ranges = commentRanges(html);
  return (index: number) => ranges.some(([a, b]) => index >= a && index < b);
}
