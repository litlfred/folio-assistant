#!/usr/bin/env bun
/**
 * No page in the published tree carries a block-level HTML tag as escaped TEXT.
 *
 * @module scripts/check-escaped-markup
 * @covers skills, docs — the SOURCE mode judges published markdown bodies in
 *   those two declared graphs. The built-tree mode judges a rendered site,
 *   which is not a declared graph and is covered by `docs-site.yml` instead.
 *
 * ## The failure this exists for, measured rather than imagined
 *
 * `docs/_includes/landing.html` builds its `<article>` opening tag across many
 * lines, and one Liquid `{% endif -%}` right-stripped the newline before the next
 * attribute. The emitted tag was `…--fa-text-scale:0.74;"aria-labelledby=…` — no
 * whitespace between two attributes, which is unparseable. `index.md` is
 * MARKDOWN, so Kramdown stopped recognising the block as HTML and escaped the
 * whole of it: the published landing page carried
 *
 *     <div class="fa-sticky-board fa-landing-board">&lt;article class="fa-sticky …"
 *
 * as visible text, with `&lt;/article&gt;` to match. **3 escaped, 0 real.** Every
 * `.fa-landing-sticky--fixed` rule was dead — the fixed aspect, the text box
 * positioned in the cloud, all of it — and the raw tag printed on screen.
 *
 * ## Why no existing check saw it
 *
 * Every one of them looks at a *source* artefact, and the source was **correct
 * HTML**. The template is valid; what Kramdown then did to it is only visible
 * after the build. `bun test` never builds the site, the e2e suite serves the
 * repository root and no spec asserts the board, and `landing:sticky:check`
 * validates the DECLARATION. So the whole gate wall passed — TypeScript, e2e,
 * accessibility, 12 gates green — over a page whose stickies did not exist as
 * elements. A template that is correct and a page that is correct are different
 * claims, and only the second one is what a reader loads.
 *
 * ## Why it is general rather than a test for one tag
 *
 * The mechanism is not specific to `<article>` or to that one `-%}`. ANY
 * malformed opening tag in ANY include, emitted into ANY markdown page, escapes
 * the same way and fails silently in the same place. So this asks the general
 * question — does the built tree contain an escaped block-level tag — and it
 * would have caught this instance without having been written for it.
 *
 * Inline elements are deliberately NOT scanned: `&lt;picture&gt;` inside a code
 * span or a prose mention of `&lt;source&gt;` is legitimate documentation, and
 * this repository's pages are full of both. A BLOCK-level tag rendered as text
 * is never intentional prose formatting — nothing here documents HTML by pasting
 * an unfenced `&lt;article class="…"&gt;` into a paragraph.
 *
 * ## `<code>` and `<pre>` are excluded, and that is not a loophole
 *
 * The first run of this check found the landing defect **and** two pages that are
 * simply correct: `translation-support.html` documents the path template
 * `&lt;section&gt;/&lt;block&gt;/translations/&lt;locale&gt;/block.po`, and
 * `md-authoring.html` quotes `&lt;table class="md-table"&gt;`. Both sit inside a
 * `<code>` element, which is exactly how a document shows markup to a reader.
 *
 * Firing on those would have made this a check somebody switches off, and this
 * repository has already written down why: *a check that fires on every one of
 * its subjects is a check that is wrong, not a repository that is.* So code and
 * pre regions are blanked before scanning — escaped markup inside them is
 * DISPLAYED markup, and escaped markup outside them is LEAKED markup. That line
 * is the whole discrimination, and it is also what makes the check falsifiable:
 * it must fail on the built page that shipped and pass on the fixed one.
 *
 * ## Three states, and the third is the point
 *
 * - **clean** — no page carries an escaped block tag.
 * - **found** — at least one does. A reader sees markup as words.
 * - **could not determine** — there is no tree to look in. **Not a pass.**
 *
 * Exit 2 on could-not-determine, distinct from exit 1 on a real finding, for the
 * reason `check-maintained-artefacts` gives: a check that quietly passes where
 * nobody built the site is green exactly where it is blind.
 *
 * Usage:
 *   bun run cat-harness/scripts/check-escaped-markup.ts ./_site
 *   bun run check:escaped-markup -- ./_site
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

/**
 * Block-level tags whose appearance as escaped text is always a defect.
 *
 * Kept to elements that carry page STRUCTURE. `<picture>`, `<source>`, `<img>`
 * and friends are left out on purpose — they are written about in prose here,
 * and a check that fires on documentation is a check that gets switched off.
 */
export const BLOCK_TAGS = [
  "article",
  "section",
  "aside",
  "nav",
  "main",
  "header",
  "footer",
  "figure",
  "ul",
  "ol",
  "table",
] as const;

/** One escaped block tag found in one built page. */
export interface EscapedTag {
  /** Path of the page, relative to the built tree. */
  page: string;
  /** The tag name, without brackets. */
  tag: string;
  /** Whether it was the opening or the closing tag. */
  kind: "open" | "close";
  /** A trimmed excerpt, for a report somebody can act on without grepping. */
  excerpt: string;
}

/**
 * A page is a candidate when it is HTML. Anything else in a built tree — assets,
 * JSON, the render log — may legitimately contain escaped markup as DATA.
 */
function isHtml(name: string): boolean {
  return name.endsWith(".html") || name.endsWith(".htm");
}

/** Every `.html` file beneath `dir`, depth-first. */
export function htmlPages(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string): void => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.isFile() && isHtml(entry.name)) out.push(p);
    }
  };
  walk(dir);
  return out;
}

/**
 * Blank every `<code>` and `<pre>` region, preserving byte offsets.
 *
 * Replacing rather than deleting keeps every later `index` meaningful, so an
 * excerpt still quotes the page a reader would open. Exported because the
 * exclusion is the check's one judgement call and therefore the thing a test
 * must be able to aim at directly.
 */
export function blankCodeRegions(html: string): string {
  return html.replace(/<(code|pre)\b[^>]*>[\s\S]*?<\/\1>/g, (m) => " ".repeat(m.length));
}

/**
 * Find escaped block tags in one page's text.
 *
 * Matches `&lt;article` and `&lt;/article&gt;` shapes. The opening form requires
 * the tag name to be followed by whitespace or `&gt;`, so `&lt;articles` in prose
 * about the word does not register.
 */
export function escapedTagsIn(page: string, html: string): EscapedTag[] {
  const found: EscapedTag[] = [];
  const scannable = blankCodeRegions(html);
  for (const tag of BLOCK_TAGS) {
    const open = new RegExp(`&lt;${tag}(?=[\\s]|&gt;)`, "g");
    const close = new RegExp(`&lt;/${tag}&gt;`, "g");
    for (const [re, kind] of [
      [open, "open"],
      [close, "close"],
    ] as const) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(scannable)) !== null) {
        found.push({
          page,
          tag,
          kind,
          // Excerpt from the ORIGINAL, so the report quotes what is on the page
          // rather than the blanked copy the scan ran over.
          excerpt: html.slice(m.index, m.index + 110).replace(/\s+/g, " ").trim(),
        });
      }
    }
  }
  return found;
}

/** One markdown table that reached the page as a paragraph of pipes. */
export interface LeakedTable {
  /** Path of the page, relative to the built tree. */
  page: string;
  /** The header row as it reads on the page, trimmed. */
  excerpt: string;
}

/**
 * A markdown table's DELIMITER row, as it reads once kramdown has given up on it.
 *
 * Kramdown's typographic pass turns `---` into an em dash, so on the page the
 * row is `|—|—|—|—|` rather than `|---|---|`. Both spellings are accepted,
 * plus the `&mdash;` entity and the `:---:` alignment colons, because which one
 * a build emits is the converter's choice and not a fact to rely on.
 */
const DELIMITER_CELL = String.raw`\s*:?(?:-{3,}|—|&mdash;|&#8212;):?\s*`;
const DELIMITER_ROW = new RegExp(String.raw`^[ \t]*\|(?:${DELIMITER_CELL}\|){2,}[ \t]*$`, "gm");

/**
 * Find markdown tables that were printed as text.
 *
 * ## The failure this exists for — bean `7w1a`
 *
 * The methodologies page shipped with its whole selection table as a paragraph
 * of pipes: a truncated cell cut a code span open, the stray backtick paired
 * with one in a later cell, and kramdown stopped reading the block as a table.
 * Every source-side test was green, because the SOURCE was a well-formed table
 * except for one backtick, and the column test counts pipes. Only the built
 * page shows it — the same lesson as the escaped `<article>`, one syntax over.
 *
 * A delimiter row is never prose. Inside `<code>`/`<pre>` it is a document
 * SHOWING a table's source, so those regions are blanked first, as above.
 */
export function leakedTablesIn(page: string, html: string): LeakedTable[] {
  const found: LeakedTable[] = [];
  const scannable = blankCodeRegions(html);
  let m: RegExpExecArray | null;
  DELIMITER_ROW.lastIndex = 0;
  while ((m = DELIMITER_ROW.exec(scannable)) !== null) {
    // The header row is the line above the delimiter: that is what a reader
    // would recognise, and what names the table in a report.
    const before = html.slice(0, m.index).split("\n");
    const header = (before[before.length - 2] ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    found.push({ page, excerpt: header.slice(0, 110) });
  }
  return found;
}

/** Scan a built tree. */
export function checkEscapedMarkup(siteDir: string): {
  pages: number;
  found: EscapedTag[];
  leakedTables: LeakedTable[];
} {
  const pages = htmlPages(siteDir);
  const found: EscapedTag[] = [];
  const leakedTables: LeakedTable[] = [];
  for (const p of pages) {
    const html = readFileSync(p, "utf-8");
    found.push(...escapedTagsIn(relative(siteDir, p), html));
    leakedTables.push(...leakedTablesIn(relative(siteDir, p), html));
  }
  return { pages: pages.length, found, leakedTables };
}

/* ────────────────────────────────────────────────────────────────────────────
 * THE SOURCE SIDE — the CAUSE, where the built-tree scan above sees the EFFECT
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Markdown source lines that open a raw HTML block kramdown will never close.
 *
 * ## The mechanism, and why the built-tree scan cannot prevent it
 *
 * A markdown line whose FIRST character is `<` followed by a name makes
 * kramdown open a raw HTML block. With no matching close tag the rest of the
 * page stays raw, so every heading, list and table after it renders as literal
 * text. The usual cause is an inline code span **wrapped across a line break**,
 * leaving its continuation at column 0 — `page_start == page_end ==` then
 * `<slide>\`` on the next line.
 *
 * The scan above catches this, but only on a BUILT tree, and the build runs in
 * `docs-site.yml` AFTER merge. Measured on main 2026-10-01:
 * `check:escaped-markup` occurs **once** in all of `.github/workflows/` and
 * **zero** times in `code-quality-gates.yml`. So a pull request could not fail
 * on it, and five of these shipped green and reddened `main`:
 *
 * | fixed in | the line that opened the block |
 * |---|---|
 * | `7w1a` (four at once) | `<agentId>`, `<branch>`, `<file.json>`, `<name>.config.json` |
 * | #1726 / #1730 | `<slide>` — nine consecutive `Docs site` failures on `main` |
 *
 * Each was repaired by reflowing the one source that had it. Bean `7pp6`: a
 * fix repeated five times is a missing gate, not five accidents.
 *
 * ## Both axes are narrowed, and the sweep is why
 *
 * A sweep of 2314 markdown files returned 6 column-0 matches. **Four were not
 * this defect** — two autolinks `<https://…>`, one real `<caption>`, and the
 * generated copy of the fifth. Designing from the one example would have
 * produced a check that fires on valid markdown and on the
 * `<details markdown="1">` that `7w1a` DELIBERATELY introduced. `BLOCK_TAGS`
 * above states the stake: *a check that fires on documentation is a check that
 * gets switched off.*
 *
 * - **SCOPE** — the caller names the directories, and generated reference trees
 *   are excluded by {@link GENERATED_PREFIXES}: those must never be hand-edited,
 *   so flagging one points at the wrong file. The SOURCE carries the defect.
 * - **STATE** — column 0 only, outside fenced regions and front matter. A
 *   `` `<slug>` `` mid-line is the normal, safe way to write a placeholder; the
 *   defect is specifically a span wrapped so its continuation begins a line.
 *
 * **Deliberately not covered:** ingested `library/` content. One latent instance
 * is there — Lean anonymous-constructor syntax `<kunnethMap_injective C D n,`
 * in `folio-assistant-sci/library/arxiv-2602.16554v1/sections/sec-014-…md` —
 * and `library/` publishes **0 of 1460** built pages, so covering it would fail
 * a gate over a page nobody renders. Recorded on `7pp6` rather than swept in.
 *
 * **Why the directories are arguments rather than derived:** resolving them from
 * the instance declarations was tried first. `resolveDirectories` over the local
 * root alone returns 5 graph kinds, not the full declared set, and a sweep that
 * under-matches reads as a clean corpus — so the scope is explicit and the
 * zero-file guard in `main` is what stops a wrong path passing.
 */

/** Element names that are REAL html here, so a line may legitimately open with one. */
export const MARKDOWN_HTML_NAMES: ReadonlySet<string> = new Set([
  "a", "abbr", "article", "aside", "audio", "b", "blockquote", "br", "button",
  "caption", "code", "col", "colgroup", "dd", "details", "div", "dl", "dt", "em",
  "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6",
  "header", "hr", "i", "iframe", "img", "input", "kbd", "label", "li", "main",
  "nav", "noscript", "ol", "p", "picture", "pre", "s", "script", "section", "small", "source",
  "span", "strong", "style", "sub", "summary", "sup", "svg", "table", "tbody",
  "td", "tfoot", "th", "thead", "tr", "u", "ul", "video",
]);

/**
 * Generated trees, excluded on purpose.
 *
 * `AGENTS.md`: *"Never hand-edit either generated dir."* A finding there names a
 * file nobody may fix, while the source that produced it goes unreported — so
 * the check would be both useless and actively misleading. The built-tree scan
 * still covers whatever a generator emits that no source line explains.
 *
 * **A SEGMENT, not a prefix, and a test is why.** The first spelling was
 * `docs/reference/skill-instructions/` matched against the path relative to the
 * SCAN directory — so scanning `cat-harness/docs` produced
 * `reference/skill-instructions/…`, the prefix never matched, and the generated
 * tree was scanned after all. The exclusion silently did nothing; only an
 * assertion over the real walk found it.
 */
export const GENERATED_SEGMENTS = [
  "/reference/skill-instructions/",
  "/reference/skills/",
] as const;

/** One markdown line that opens a raw HTML block. */
export interface SourceLeak {
  /** Path as given to the scanner. */
  file: string;
  /** 1-based line number. */
  line: number;
  /** The name kramdown will read as a tag. */
  tag: string;
  /** The line, trimmed for the report. */
  excerpt: string;
}

/**
 * Column-0 pseudo-tags in one markdown source.
 *
 * Front matter is skipped because a `---` delimited header is YAML, not
 * markdown, and kramdown never sees it. Fenced regions are skipped because
 * their whole point is that the converter does not read them — and an INDENTED
 * code block cannot trip this check at all, since a line indented four spaces
 * does not begin with `<`. That is the column-0 rule paying for itself.
 */
export function leakingLinesIn(file: string, text: string): SourceLeak[] {
  const out: SourceLeak[] = [];
  const lines = text.split("\n");
  let fence: string | undefined;
  let i = 0;

  // YAML front matter: only when `---` is the very first line.
  if (lines[0]?.trim() === "---") {
    i = 1;
    while (i < lines.length && lines[i]?.trim() !== "---") i += 1;
    i += 1;
  }

  for (; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const opener = /^\s*(```+|~~~+)/.exec(line);
    if (opener !== undefined && opener !== null) {
      const marker = opener[1]!.slice(0, 3);
      if (fence === undefined) fence = marker;
      else if (marker === fence) fence = undefined;
      continue;
    }
    if (fence !== undefined) continue;

    // Column 0 only. An html comment is not a tag, and `<` not followed by a
    // letter cannot open one.
    if (!line.startsWith("<") || line.startsWith("<!")) continue;
    const m = /^<\/?([A-Za-z][A-Za-z0-9-]*)/.exec(line);
    if (m === null) continue;

    // An autolink — `<https://…>`, `<mailto:…>` — is valid markdown, and two of
    // them are in this corpus. The scheme is what distinguishes it from a tag.
    if (/^<\/?[A-Za-z][A-Za-z0-9+.-]*:/.test(line)) continue;

    const tag = m[1]!;
    // A dotted name is never an element: `<file.json>`, `<name>.config.json`.
    if (MARKDOWN_HTML_NAMES.has(tag.toLowerCase()) && !tag.includes(".")) continue;
    out.push({ file, line: i + 1, tag, excerpt: line.trim().slice(0, 90) });
  }
  return out;
}

/** Every `.md` beneath `dir`, depth-first, skipping the generated trees. */
export function markdownSources(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string): void => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const p = join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith(".md")) {
        // Matched on the ABSOLUTE path: a prefix relative to the scan dir
        // depends on where the caller started, which is how the first version
        // of this exclusion came to do nothing at all.
        const abs = `/${resolve(p).split(sep).join("/").replace(/^\/+/, "")}`;
        if (GENERATED_SEGMENTS.some((g) => abs.includes(g))) continue;
        out.push(p);
      }
    }
  };
  walk(dir);
  return out;
}

/** Scan markdown sources under each directory. */
export function checkSourceLeaks(dirs: readonly string[]): {
  files: number;
  found: SourceLeak[];
} {
  const found: SourceLeak[] = [];
  let files = 0;
  for (const dir of dirs) {
    for (const p of markdownSources(dir)) {
      files += 1;
      found.push(...leakingLinesIn(relative(process.cwd(), p), readFileSync(p, "utf-8")));
    }
  }
  return { files, found };
}

function sourceMain(args: readonly string[]): void {
  if (args.length === 0) {
    console.error("usage: check-escaped-markup --source <dir> [<dir>…]");
    console.error("  Nothing was checked. That is `could not determine`, not a pass.");
    process.exit(2);
  }
  const dirs: string[] = [];
  for (const a of args) {
    const d = resolve(a);
    if (!existsSync(d) || !statSync(d).isDirectory()) {
      console.error(`could not determine: ${a} is not a directory.`);
      process.exit(2);
    }
    dirs.push(d);
  }

  const { files, found } = checkSourceLeaks(dirs);
  if (files === 0) {
    // The same vacuity guard the built-tree mode carries, for the same reason:
    // a green run over zero files reads as coverage that is not there (`dh4f`).
    console.error(`could not determine: no .md under ${args.join(", ")}.`);
    console.error("  Either these are the wrong directories or the tree is empty.");
    process.exit(2);
  }

  if (found.length > 0) {
    console.error(`✗ ${found.length} line(s) open a raw HTML block, across ${files} markdown source(s):\n`);
    for (const f of found) console.error(`    · ${f.file}:${f.line}  <${f.tag}>  ${f.excerpt}`);
    console.error(
      "\nA markdown line whose FIRST character is `<` makes kramdown open a raw HTML block,\n" +
        "and with no closing tag the REST OF THE PAGE stays raw — headings, lists and tables\n" +
        "after it render as literal text. The usual cause is an inline code span wrapped across\n" +
        "a line break, leaving its continuation at column 0.\n\n" +
        "Reflow the line so nothing begins with `<`, or wrap the placeholder in a code span and\n" +
        "keep it on one line. This is bean `7pp6`; the same defect was repaired by hand five\n" +
        "times before this check existed (`7w1a` four, #1730 one), each time only after it had\n" +
        "already reddened `main`.",
    );
    process.exit(1);
  }
  console.log(`✓ no markdown source line opens a raw HTML block, across ${files} source(s)`);
}

function main(): void {
  if (process.argv[2] === "--source") {
    sourceMain(process.argv.slice(3));
    return;
  }
  const dir = process.argv[2];
  if (dir === undefined) {
    console.error("usage: check-escaped-markup <built-site-dir>");
    console.error("         check-escaped-markup --source <dir> [<dir>…]");
    console.error("  Nothing was checked. That is `could not determine`, not a pass.");
    process.exit(2);
  }
  const siteDir = resolve(dir);
  if (!existsSync(siteDir) || !statSync(siteDir).isDirectory()) {
    console.error(`could not determine: ${dir} is not a directory.`);
    console.error("  Assemble the site first. An unbuilt tree clears nothing.");
    process.exit(2);
  }

  const { pages, found, leakedTables } = checkEscapedMarkup(siteDir);
  if (pages === 0) {
    // Vacuity guard: a green run over zero pages reads as coverage that is not
    // there, which is the whole failure mode this script was written after.
    console.error(`could not determine: no .html under ${dir}.`);
    console.error("  Either the build wrote nothing or this is reading the wrong tree.");
    process.exit(2);
  }

  if (leakedTables.length > 0) {
    console.error(`✗ ${leakedTables.length} markdown table(s) printed as text across ${pages} page(s):\n`);
    for (const t of leakedTables) console.error(`    · ${t.page}  ${t.excerpt}`);
    console.error(
      "\nThe converter did not read these as tables, so the reader sees rows of pipes. The usual\n" +
        "cause is one cell that leaves a code span open — an odd number of backticks on the row —\n" +
        "or a pipe inside a cell that is not escaped. Look at the source row, then the built page.\n",
    );
  }
  if (found.length > 0) {
    console.error(`✗ ${found.length} escaped block tag(s) across ${pages} page(s):\n`);
    const byPage = new Map<string, EscapedTag[]>();
    for (const f of found) byPage.set(f.page, [...(byPage.get(f.page) ?? []), f]);
    for (const [page, tags] of byPage) {
      console.error(`  ${page}`);
      for (const t of tags) console.error(`    · <${t.kind === "close" ? "/" : ""}${t.tag}>  ${t.excerpt}`);
    }
    console.error(
      "\nA block-level tag rendered as TEXT means the markdown converter refused it as HTML,\n" +
        "which almost always means the opening tag is malformed. The usual cause is a Liquid\n" +
        "whitespace strip (`-%}`) eating the separator between two attributes, so the tag\n" +
        "reads `…value=\"x\"next-attr=…`. Look at the built page, not the template: the\n" +
        "template is generally valid HTML and only the build shows what happened to it.",
    );
    process.exit(1);
  }
  if (leakedTables.length > 0) process.exit(1);
  console.log(`✓ no escaped block-level markup and no table printed as text across ${pages} page(s)`);
}

if (import.meta.main) main();
