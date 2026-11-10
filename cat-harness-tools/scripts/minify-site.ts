#!/usr/bin/env bun
/**
 * Minify the BUILT site in place — drop the comments a reader never sees, and
 * the inter-tag whitespace a browser never renders.
 *
 * @module scripts/minify-site
 * @covers none — `.github/workflows/` is not a declared graph typology, and the
 *   subject here is the assembled `_site/`, which is not one either. Its
 *   logic is covered by `minify-site.test.ts` in `bun test`, which runs over
 *   pages built as strings; its WIRING by `check:invocation-parity` and
 *   `gates.test.ts`'s step classification.
 *
 * ## A post-build pass, run LAST
 *
 * HTML comments (mostly prose from `_includes/head_custom.html`, serialised
 * into every page) are a large share of the published bytes. The site is
 * built with `actions/jekyll-build-pages@v1`, whose plugin allow-list has no
 * minifier, so this post-processes the emitted tree like
 * `strip-preview-seo.ts`, `set-html-lang.ts`, `rail-standalone-pages.ts` and
 * `staging-banner.ts` do: no gem, no theme fork, no `_config.yml`.
 *
 * Every step that reads or rewrites the built HTML before a deploy —
 * `check:duplicate-ids`, `check:escaped-markup`, `check:maintained-artefacts`,
 * `site-links.ts`, `publish-verify.ts`, `set-html-lang.ts`,
 * `rail-standalone-pages.ts`, `staging-banner.ts` — runs before this pass, and
 * two of them (`staging-banner`, `folio-mount`) decide whether a marker is
 * live by asking whether it sits inside a COMMENT (`html-comments.ts`). So
 * none of them sees minified input. **Moving this step earlier would silently
 * change what those checks judge.**
 *
 * ## What is NOT touched, and the rule rather than the list
 *
 * Whitespace is semantic inside `<pre>`, `<code>`, `<textarea>`, `<script>`,
 * `<style>` and `<title>`, so their content is copied through byte for byte —
 * including any `<!--` inside a script string, which a regex over the whole
 * document would read as a comment and this does not.
 *
 * An UNCLOSED one of those falls through to being treated as an ordinary tag,
 * so a malformed page loses no content, but its interior whitespace is then
 * collapsed — the one case where this pass could change a rendering, accepted
 * because an unclosed `<script>` or `<pre>` cannot survive Jekyll's markdown
 * conversion.
 *
 * Outside those, the rule comes from CSS: in normal flow **any run of
 * whitespace renders as exactly one space**. So a whitespace-only run between
 * two tags collapses to one space, and is dropped entirely only where that
 * space could not be rendered — next to a block-level boundary, or anywhere
 * inside an `<svg>` away from its text elements. Inline neighbours (`</a>` …
 * `<a>`, `</code>` … `<code>`) keep the single space, because `a b` and `ab`
 * are different words: `>\s+<` → `><` would delete the space in
 * `<a>one</a> <a>two</a>`, which is why this is a tokenizer and not a regex.
 *
 * ## The three classes of comment that stay
 *
 * 1. **Conditional comments** (`<!--[if …]>`, `<![endif]-->`). Markup to a
 *    browser that honours them, not prose.
 * 2. **Licence and attribution notices**, e.g. `<!-- Feather. MIT License: … -->`
 *    and `<!-- Bootstrap Icons. MIT License: … -->`: MIT requires the notice
 *    to travel with the copy.
 * 3. **Region markers** — `<!-- x:begin -->` / `<!-- x:end -->`, the idiom
 *    `readme-sections.ts`, `agent-memory.ts` and `merge-conflict-patterns.ts`
 *    read (`fa-first-paint`, `kg:subgraph`, `kg:toc`, `kg:roles`,
 *    `kg:processes`, `kg:files`). A marker exists to be found by a tool, so
 *    it is kept even in the published copy.
 *
 * ## Idempotent
 *
 * A second run writes nothing — `minify-site.test.ts` asserts
 * `minifyHtml(minifyHtml(x)) === minifyHtml(x)` over every fixture — because
 * `restore-staging.ts` lays previously-published previews back into `_site`,
 * and a pass that drifted on re-entry would rewrite them on every deploy.
 *
 * ## Three states, never two
 *
 * Exit 0 the tree was walked and the result reported · 2 the site directory
 * could not be read, never reported as "0 bytes saved". Same rule as
 * `strip-preview-seo.ts`.
 *
 *   bun run cat-harness-tools/scripts/minify-site.ts --site ./_site [--check]
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join, relative } from "path";
import { isVendoredViewer } from "./pdf-viewer.ts";

/**
 * Elements whose CONTENT is copied through byte for byte.
 *
 * `script`, `style`, `textarea` and `title` are raw-text or escapable-raw-text
 * elements in the HTML spec — their content is not markup, so there are no
 * inter-tag boundaries in it to collapse. `pre` and `code` are here for the
 * other reason: their content IS markup, but its whitespace is displayed
 * (`pre`) or is a code sample a reader will copy (`code`). A `<code>` inside a
 * `<pre>` is covered twice over, which is free.
 */
const VERBATIM = ["script", "style", "textarea", "title", "pre", "code"] as const;

/**
 * Elements beside which a single space cannot be rendered.
 *
 * Not a style guess: each generates a block-level box (or no box at all), so
 * whitespace at its boundary is stripped by the inline-formatting rules rather
 * than shown. Everything NOT here is treated as inline, which is the safe
 * default — an unknown element (a web component, an `<mi>`) keeps its space.
 */
const BLOCK = new Set([
  "html", "head", "body", "meta", "link", "base", "noscript", "template", "script", "style", "title",
  "div", "p", "ul", "ol", "li", "dl", "dt", "dd", "menu", "address", "hr", "br",
  "table", "caption", "colgroup", "col", "thead", "tbody", "tfoot", "tr", "td", "th",
  "section", "article", "aside", "nav", "header", "footer", "main", "hgroup",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "form", "fieldset", "legend", "optgroup", "option", "datalist",
  "blockquote", "figure", "figcaption", "details", "summary", "dialog", "pre",
]);

/**
 * Inside an `<svg>`, whitespace between elements is not text at all — except
 * around these, where it is part of a rendered string.
 */
const SVG_TEXT = new Set(["text", "tspan", "textpath"]);

/** A comment that is kept, and which of the three classes kept it. */
export type KeptComment = "conditional" | "licence" | "marker";

/** `<!--[if lt IE 9]>`, and the `<![endif]-->` that closes a revealed one. */
const CONDITIONAL = /^<!--\s*\[\s*if\b|^<!--\s*<!\[endif\]|\[endif\]\s*-->$/i;

/** MIT and friends: the notice a licence requires to travel with the copy. */
const LICENCE = /licen[cs]e|copyright|\(c\)\s*(19|20)\d{2}|SPDX-License-Identifier|@license|@preserve/i;

/** The `<!-- x:begin -->` / `<!-- x:end -->` idiom, and `<!-- detail -->`. */
const MARKER = /^<!--\s*(?:[a-z0-9][a-z0-9:_-]*:(?:begin|end)|detail|puml-sha256:[0-9a-f]+)\s*-->$/i;

/** Why this comment stays, or `null` when it does not. */
export function keepComment(comment: string): KeptComment | null {
  if (CONDITIONAL.test(comment)) return "conditional";
  if (MARKER.test(comment)) return "marker";
  if (LICENCE.test(comment)) return "licence";
  return null;
}

/** What one document's pass changed. */
export interface MinifyCounts {
  /** Comments removed. */
  comments: number;
  /** Comments kept, by the class that kept them. */
  kept: Record<KeptComment, number>;
  /** Whitespace-only inter-tag runs dropped entirely. */
  dropped: number;
  /** Whitespace-only inter-tag runs reduced to one space. */
  squeezed: number;
}

export const NO_COUNTS = (): MinifyCounts => ({
  comments: 0,
  kept: { conditional: 0, licence: 0, marker: 0 },
  dropped: 0,
  squeezed: 0,
});

export function addCounts(a: MinifyCounts, b: MinifyCounts): MinifyCounts {
  return {
    comments: a.comments + b.comments,
    kept: {
      conditional: a.kept.conditional + b.kept.conditional,
      licence: a.kept.licence + b.kept.licence,
      marker: a.kept.marker + b.kept.marker,
    },
    dropped: a.dropped + b.dropped,
    squeezed: a.squeezed + b.squeezed,
  };
}

type Token =
  /** A tag, with its lower-cased element name; `close` for `</x>`. */
  | { kind: "tag"; text: string; name: string; close: boolean }
  /** A verbatim region: its open tag, content and close tag, as one string. */
  | { kind: "verbatim"; text: string; name: string }
  | { kind: "comment"; text: string }
  | { kind: "text"; text: string };

/**
 * Find the end of a tag that starts at `from`, respecting quoted attributes.
 *
 * `<meta content="a > b">` is one tag, and `indexOf(">")` says it is not. This
 * corpus has attributes holding JSON and prose, so that is not hypothetical.
 * Returns the index just past the `>`, or `html.length` for an unterminated tag.
 */
function tagEnd(html: string, from: number): number {
  let quote = "";
  for (let i = from + 1; i < html.length; i++) {
    const c = html[i];
    if (quote) {
      if (c === quote) quote = "";
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === ">") {
      return i + 1;
    }
  }
  return html.length;
}

/** `<div class=…>` → `div`; `</div>` → `div`; `<!doctype html>` → `!doctype`. */
function tagName(tag: string): string {
  const m = /^<\/?\s*([a-zA-Z0-9!:_-]+)/.exec(tag);
  return m ? m[1].toLowerCase() : "";
}

/** Split a document into tags, comments, verbatim regions and text. */
export function tokenize(html: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt < 0) {
      out.push({ kind: "text", text: html.slice(i) });
      break;
    }
    if (lt > i) out.push({ kind: "text", text: html.slice(i, lt) });

    if (html.startsWith("<!--", lt)) {
      const close = html.indexOf("-->", lt + 4);
      const end = close < 0 ? html.length : close + 3;
      out.push({ kind: "comment", text: html.slice(lt, end) });
      i = end;
      continue;
    }

    const end = tagEnd(html, lt);
    const tag = html.slice(lt, end);
    const name = tagName(tag);

    // A verbatim element swallows everything up to its own close tag. An
    // unclosed one (or a self-closed `<pre/>`) falls through to a plain tag,
    // so a malformed page loses no content.
    if ((VERBATIM as readonly string[]).includes(name) && !tag.startsWith("</") && !/\/>$/.test(tag)) {
      const closeRe = new RegExp(`</\\s*${name}\\s*>`, "i");
      const rest = html.slice(end);
      const m = closeRe.exec(rest);
      if (m) {
        out.push({ kind: "verbatim", text: tag + rest.slice(0, m.index + m[0].length), name });
        i = end + m.index + m[0].length;
        continue;
      }
    }
    out.push({ kind: "tag", text: tag, name, close: tag.startsWith("</") });
    i = end;
  }
  return out;
}

/** Whether a whitespace run beside this token's element can render as a space. */
function blockish(tok: Token | undefined, insideSvg: boolean): boolean {
  if (!tok) return true; // Start or end of document: nothing to separate.
  if (tok.kind === "comment" || tok.kind === "text") return false;
  const { name } = tok;
  if (name.startsWith("!")) return true; // `<!doctype html>`
  if (insideSvg) return !SVG_TEXT.has(name);
  return BLOCK.has(name);
}

/**
 * Minify one page.
 *
 * Returns the new text and what changed, rather than writing — so `--check`
 * reports without touching the tree and the counts are testable with no
 * filesystem, the same split `strip-preview-seo.ts` uses.
 */
export function minifyHtml(html: string): { html: string; counts: MinifyCounts } {
  const counts = NO_COUNTS();
  const toks = tokenize(html);

  // Pass 1 — drop the comments that go, and fold the whitespace that was
  // separating them into one run, so `  <!-- a -->\n  <!-- b -->\n  <div>`
  // leaves ONE whitespace token before `<div>` rather than three.
  const kept: Token[] = [];
  for (const t of toks) {
    if (t.kind === "comment") {
      const why = keepComment(t.text);
      if (why) {
        counts.kept[why] += 1;
        kept.push(t);
      } else {
        counts.comments += 1;
      }
      continue;
    }
    const last = kept[kept.length - 1];
    if (t.kind === "text" && last?.kind === "text" && /^\s*$/.test(t.text) && /^\s*$/.test(last.text)) {
      kept[kept.length - 1] = { kind: "text", text: last.text + t.text };
      continue;
    }
    kept.push(t);
  }

  // Pass 2 — emit, deciding each whitespace-only run against its neighbours.
  // `svg` is tracked by depth rather than by a flag: a page carries 150 of
  // them and they do not nest, but a `<foreignObject>` subtree would.
  let svgDepth = 0;
  const out: string[] = [];
  for (let n = 0; n < kept.length; n++) {
    const t = kept[n];
    if (t.kind === "tag" && t.name === "svg") svgDepth += t.close ? -1 : /\/>$/.test(t.text) ? 0 : 1;
    if (svgDepth < 0) svgDepth = 0;

    if (t.kind !== "text" || !/^\s+$/.test(t.text)) {
      out.push(t.text);
      continue;
    }
    const prev = kept[n - 1];
    const next = kept[n + 1];
    // Only a run BETWEEN tags is ours. Whitespace touching text is part of
    // the text, and `Cats </em>and dogs` must keep its space.
    if ((prev && prev.kind === "text") || (next && next.kind === "text")) {
      out.push(t.text);
      continue;
    }
    const insideSvg = svgDepth > 0;
    if (blockish(prev, insideSvg) || blockish(next, insideSvg)) {
      counts.dropped += 1;
    } else if (t.text === " ") {
      out.push(t.text); // Already minimal: not a change, so not a count.
    } else {
      counts.squeezed += 1;
      out.push(" ");
    }
  }
  return { html: out.join(""), counts };
}

/** Every `.html` file under `dir`, depth-first. */
function htmlFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    let st;
    try {
      st = statSync(path);
    } catch {
      continue; // A broken symlink is not a page; skip rather than fail the build.
    }
    if (st.isDirectory()) found.push(...htmlFiles(path));
    else if (/\.html?$/i.test(entry)) found.push(path);
  }
  return found;
}

export interface RunOptions {
  /** The built site to walk — `_site` in both publishing workflows. */
  site: string;
  /** Report without writing. */
  check?: boolean;
}

export interface RunResult {
  exitCode: number;
  text: string;
  counts: MinifyCounts;
  bytesBefore: number;
  bytesAfter: number;
  filesChanged: number;
  filesSeen: number;
}

const mib = (b: number) => `${(b / 1048576).toFixed(1)} MiB`;

/** Walk a built site and minify every page. */
export function runMinifySite(opts: RunOptions): RunResult {
  let files: string[];
  try {
    // The pinned pdf.js viewer is Mozilla's page, not one of ours: rewriting
    // it would ship bytes no release of theirs contains (bean `folio-assistant-5ea6`).
    files = htmlFiles(opts.site).filter((f) => !isVendoredViewer(relative(opts.site, f)));
  } catch (e) {
    return {
      exitCode: 2,
      text: `could not read ${opts.site}: ${(e as Error).message}`,
      counts: NO_COUNTS(),
      bytesBefore: 0,
      bytesAfter: 0,
      filesChanged: 0,
      filesSeen: 0,
    };
  }

  let counts = NO_COUNTS();
  let before = 0;
  let after = 0;
  let changed = 0;
  for (const file of files) {
    const text = readFileSync(file, "utf-8");
    const { html, counts: c } = minifyHtml(text);
    before += Buffer.byteLength(text);
    after += Buffer.byteLength(html);
    if (html === text) continue;
    counts = addCounts(counts, c);
    changed += 1;
    if (!opts.check) writeFileSync(file, html);
  }

  const saved = before - after;
  const pct = before === 0 ? 0 : (100 * saved) / before;
  const verb = opts.check ? "would save" : "saved";
  return {
    exitCode: 0,
    text:
      `${files.length} page(s) seen, ${changed} changed — ${verb} ${mib(saved)} of ` +
      `${mib(before)} (${pct.toFixed(2)}%). Removed ${counts.comments} comment(s); ` +
      `kept ${counts.kept.licence} licence, ${counts.kept.conditional} conditional, ` +
      `${counts.kept.marker} marker. Whitespace runs: ${counts.dropped} dropped, ` +
      `${counts.squeezed} reduced to one space.`,
    counts,
    bytesBefore: before,
    bytesAfter: after,
    filesChanged: changed,
    filesSeen: files.length,
  };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const siteAt = args.indexOf("--site");
  const result = runMinifySite({
    site: siteAt >= 0 ? args[siteAt + 1] : "_site",
    check: args.includes("--check") || args.includes("--dry-run"),
  });
  console.log(result.text);
  process.exit(result.exitCode);
}
