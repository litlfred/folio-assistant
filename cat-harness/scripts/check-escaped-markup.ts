#!/usr/bin/env bun
/**
 * No page in the published tree carries a block-level HTML tag as escaped TEXT.
 *
 * @module scripts/check-escaped-markup
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
import { join, relative, resolve } from "node:path";

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

function main(): void {
  const dir = process.argv[2];
  if (dir === undefined) {
    console.error("usage: check-escaped-markup <built-site-dir>");
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
