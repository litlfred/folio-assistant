/**
 * A repository-relative path, written so a Markdown link can carry it.
 *
 * @module bootstrap-tools/scripts/link-target
 *
 * A link target ends at the first space or unbalanced `)`, so a file named
 * `PIIS2589750021000388 (2).pdf` — an upload, named by whoever uploaded it —
 * wrote `[…](PIIS2589750021000388 (2).pdf)`, which GitHub renders as a link to
 * `PIIS2589750021000388` and a stray `(2).pdf)`. Each segment is
 * percent-encoded as a URL path segment, with `(` and `)` encoded too, which
 * `encodeURIComponent` leaves alone. `/` separates segments and stays; an
 * ordinary name comes out unchanged, so no existing link moves.
 */
export function linkTarget(path: string): string {
  return path
    .split("/")
    // `@` is legal in a URL path segment and common in a scoped package name,
    // so it stays readable; `(` and `)` are encoded because they close a link.
    .map((seg) => encodeURIComponent(seg).replace(/%40/g, "@").replace(/\(/g, "%28").replace(/\)/g, "%29"))
    .join("/");
}
