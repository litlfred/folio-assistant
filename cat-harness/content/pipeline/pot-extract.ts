/**
 * Markdown translation string extractor — POT generation.
 *
 * Extracts translatable strings from folio content `.md` files into
 * GNU gettext `.pot` (Portable Object Template) format.
 *
 * ## Origin: smart-base `extract_translations.py`
 *
 * This module is a TypeScript port of the markdown extraction logic in
 * `WorldHealthOrganization/smart-base/input/scripts/extract_translations.py`
 * (lines 530–920, function `extract_markdown` and helpers). The Python
 * original handles FHIR IG narrative pages under `input/pagecontent/`;
 * this handles folio content blocks. The extraction logic is generic
 * markdown processing, not WHO-specific, so it lives in folio-assistant
 * rather than being loaded from smart-base. The smart-base copy remains.
 *
 * ## What it extracts
 *
 * - Prose paragraphs (accumulated across continuation lines → one `msgid`)
 * - Headings (each heading → one `msgid`)
 * - List items (each item → one `msgid`, bullet/number stripped)
 * - Blockquote lines (each `>` line → one `msgid`, prefix stripped)
 * - Table cells (each cell → one `msgid`)
 * - Image alt text
 *
 * ## What it skips (non-translatable)
 *
 * - YAML front matter (`---` delimited)
 * - Fenced code blocks (``` or ~~~, any fence length)
 * - HTML `<style>`, `<script>`, `<pre>` blocks
 * - Kramdown/Jekyll attribute lists (`{: .class}`, `{:toc}`)
 * - Horizontal rules (`---`, `***`, `___`)
 * - Table separator rows (`|---|---|`)
 * - Strings shorter than 3 characters after cleaning
 *
 * ## Text cleaning (mirrors smart-base `_clean_markdown_text`)
 *
 * Before emitting a `msgid`, inline formatting is stripped:
 * - HTML comments removed
 * - Images → alt text only
 * - Links → link text only
 * - Angle-bracket autolinks removed
 * - Inline code spans removed
 * - Bold/italic markers stripped (content preserved)
 * - HTML tags removed
 * - Liquid `{% %}` control tags removed (smart-base compat)
 * - Liquid `{{ expr }}` → `{lqd_expr}` gettext brace vars (smart-base compat)
 *
 * @module content/pipeline/pot-extract
 */

// ── Text cleaning patterns (mirrors smart-base _clean_markdown_text) ────

const MD_HTML_COMMENT_RE = /<!--.*?-->/gs;
const MD_IMAGE_RE = /!\[([^\]]*)\]\([^)]*\)/g;
const MD_LINK_RE = /\[([^\]]+)\]\([^)]*\)/g;
const MD_ANGLE_LINK_RE = /<https?:\/\/[^>]+>/g;
const MD_INLINE_CODE_RE = /`[^`]+`/g;
const MD_BOLD_RE = /\*{2,3}([^*]+)\*{2,3}/g;
const MD_ITALIC_STAR_RE = /(?<!\*)\*([^*]+)\*(?!\*)/g;
const MD_ITALIC_UNDER_RE = /(?<!_)_([^_]+)_(?!_)/g;
const MD_HTML_TAG_RE = /<[^>]+>/g;
const MD_LIQUID_TAG_RE = /\{%.*?%\}/gs;
const MD_LIQUID_OUTPUT_RE = /\{\{\s*(.*?)\s*\}\}/gs;

// ── Structural patterns ─────────────────────────────────────────

const MD_FRONT_MATTER_DELIM = /^---\s*$/;
const MD_HEADING_RE = /^(#{1,6}\s+)(.+)$/;
const MD_CODE_FENCE_RE = /^(`{3,}|~{3,})/;
const MD_HTML_SKIP_OPEN_RE = /<(style|script|pre)\b/i;
const MD_HTML_CLOSE_TAG_RE = /<\/(\w+)\s*>/i;
const MD_HLINE_RE = /^[-*_]{3,}\s*$/;
const MD_TABLE_SEP_RE = /^\|[-| :]+\|?\s*$/;
const MD_LIST_ITEM_RE = /^(\s*(?:[-*+]|\d+\.)\s+)(.*)/;
const MD_BLOCKQUOTE_RE = /^(>+\s?)(.*)/;
const MD_KRAMDOWN_ATTR_RE = /^\{[:%][^}]*\}\s*$/;
/**
 * The kramdown directive that CONSUMES the block it attaches to.
 *
 * `{:toc}` replaces the preceding list with a generated table of contents, so
 * that list's text **never reaches a reader in any language**. Every other
 * directive here attaches attributes and leaves the block rendering — a
 * measured distinction rather than a guessed one: across this instance's docs
 * the directive vocabulary is `{: .note }` (232), `{: .fa-edit-source }` (276),
 * `{: .no_toc }` (38), `{: .fa-hx-dim }` (22) and others, and **only `{:toc}`
 * consumes.** Widening this regex to all of them would delete real prose from
 * the catalogue, which is strictly worse than the bug it fixes.
 *
 * `{: .no_toc }` is the near miss worth naming: it is about the table of
 * contents, it sits beside a heading a reader DOES see, and matching on "toc"
 * rather than on the exact directive would drop that heading.
 */
const MD_KRAMDOWN_CONSUMING_RE = /^\{:\s*toc\s*\}$/;

/**
 * Is there anything here a translator can act on?
 *
 * **A count of LETTERS, not of characters, and the difference is not cosmetic.**
 * This was `text.length >= 3` until 2026-09-26, which made translatability a
 * property of the locale's script rather than of the content. Bean `6b8u`.
 *
 * The mechanism, on a real cell of `docs/installation.md` — after
 * {@link cleanMarkdownText} strips the code spans:
 *
 * | | cell | residue | extracted at `length >= 3`? |
 * |---|---|---|---|
 * | source | `` `pandoc`, `ripgrep` `` | `", "` (2 chars) | no |
 * | `ar` | `` `pandoc`، و`ripgrep` `` | `"، و"` (3 chars) | **yes** |
 *
 * The Arabic comma and the conjunction are a correct localisation, and they
 * pushed a code-only cell over a threshold English sat under — so an identical
 * 4x7 table yielded 66 constructs in `ar` against 65 in English. It ran the
 * other way for dense scripts: `否` is one character and was dropped where
 * `non` and `нет` were kept, which is why `zh` measured short on all five of
 * the pages `derive-po.ts` tried to align.
 *
 * ## Why two letters, measured rather than chosen
 *
 * Four candidates, scored over `cat-harness/docs/` (618 files) on two things:
 * how many of the 25 (page, locale) pairs align by count AND kind, and how many
 * msgids contain **no letter at all** — a string offered to a translator with
 * nothing in it to translate.
 *
 * | predicate | aligned | msgids | letterless |
 * |---|---|---|---|
 * | `length >= 3` (what this replaces) | 7/25 | 45320 | **432** |
 * | `>= 1` letter | 9/25 | 45458 | 0 |
 * | **`>= 2` letters** | **10/25** | 45288 | **0** |
 * | `>= 1` letter and `>= 2` non-space | 9/25 | 45419 | 0 |
 *
 * Two letters wins on both measures at once, and the letterless column is the
 * one that settles it: the old rule put **432** msgids with no letter in them
 * into this corpus's catalogues, and every candidate here removes all of them.
 *
 * **It is not primarily an alignment fix, and the first account of it said
 * otherwise.** That account inferred "9 of the 18 refusals are extractor
 * artefacts" by stitching together a count measurement and a kind measurement
 * taken separately. Measured directly on the thing that matters — count and
 * kind together — this predicate plus the fence fix takes alignment from 7/25
 * to **10/25**. Three more, not nine. The remaining 15 are `7x8o`.
 *
 * `\p{L}` rather than `[A-Za-z]` for the obvious reason, and `u` because
 * without it the property escape is a syntax error rather than a silent
 * mismatch.
 */
function isTranslatable(text: string): boolean {
  let letters = 0;
  for (const ch of text) {
    if (/\p{L}/u.test(ch) && ++letters >= MD_MIN_TEXT_LETTERS) return true;
  }
  return false;
}

/**
 * How many letters make a string worth a translator's attention.
 *
 * Named and separate so the measurement above has something to refer to, and so
 * a later change has to argue with the table rather than edit a bare `2`.
 */
const MD_MIN_TEXT_LETTERS = 2;

/** Prefix for Liquid output variables in gettext brace format. */
const LQD_PREFIX = "lqd_";

// ── Text cleaning ───────────────────────────────────────────────

/**
 * Strip markdown formatting from a text fragment to obtain plain text
 * suitable for a `msgid` value.
 *
 * Mirrors smart-base `_clean_markdown_text()` in
 * `extract_translations.py` lines 633–697. The Liquid expression
 * handling preserves smart-base's `{lqd_expr}` convention for IG
 * Publisher compatibility.
 */
export function cleanMarkdownText(text: string): string {
  // Remove Liquid control tags first
  let result = text.replace(MD_LIQUID_TAG_RE, "");

  // Tokenise Liquid output expressions to protect underscores from italic regex
  const lqdTokens: string[] = [];
  result = result.replace(MD_LIQUID_OUTPUT_RE, (_match, expr: string) => {
    lqdTokens.push(expr.trim());
    return `\x00LQD${lqdTokens.length - 1}\x00`;
  });

  // Remove HTML comments
  result = result.replace(MD_HTML_COMMENT_RE, "");
  // Replace images with alt text
  result = result.replace(MD_IMAGE_RE, "$1");
  // Replace links with link text
  result = result.replace(MD_LINK_RE, "$1");
  // Remove angle-bracket autolinks
  result = result.replace(MD_ANGLE_LINK_RE, "");
  // Remove inline code spans
  result = result.replace(MD_INLINE_CODE_RE, "");
  // Strip bold/italic markers (keep content)
  result = result.replace(MD_BOLD_RE, "$1");
  result = result.replace(MD_ITALIC_STAR_RE, "$1");
  result = result.replace(MD_ITALIC_UNDER_RE, "$1");
  // Remove remaining HTML tags
  result = result.replace(MD_HTML_TAG_RE, "");

  // Restore Liquid tokens as {lqd_expr} gettext variables
  for (let i = 0; i < lqdTokens.length; i++) {
    result = result.replace(`\x00LQD${i}\x00`, `{${LQD_PREFIX}${lqdTokens[i]}}`);
  }

  return result.trim();
}

// ── POT entry ───────────────────────────────────────────────────

/**
 * What KIND of markdown construct an entry came from.
 *
 * Added for `derive-po.ts` (issue #206), which aligns an already-translated
 * page against its source to recover a `.po` catalogue. Alignment is positional,
 * so it needs a way to be REFUSED when the two sides are not the same shape —
 * and a count match is not that. Measured 2026-09-26: of the 25 uncatalogued
 * (page, locale) pairs, 9 matched by count, and a count match does not rule out
 * two adjacent constructs having swapped. The kind sequence does.
 *
 * Not emitted into the `.pot` — `formatPot` ignores it, so the on-disk format is
 * unchanged and every existing catalogue still parses.
 */
export type PotEntryKind =
  // From markdown prose — the five constructs `extractMarkdown` recognises.
  | "heading"
  | "paragraph"
  | "list-item"
  | "blockquote"
  | "table-cell"
  // Not markdown at all. Named rather than made optional, so a new producer has
  // to DECIDE — the rule this repository applies to graph kinds, where "a kind
  // that has not decided does not compile". An optional field would let a
  // producer stay silent, and `derive-po.ts` would then align against entries
  // whose shape it cannot check.
  | "bpmn-label"
  | "manifest-title"
  | "ui-string";

/** A single translatable entry extracted from a source file. */
export interface PotEntry {
  /** Source file path (relative to content root). */
  source: string;
  /** Line number in source file (1-based). */
  line: number;
  /** The msgid — the cleaned source string to translate. */
  msgid: string;
  /** Which construct it came from — see {@link PotEntryKind}. */
  kind: PotEntryKind;
  /** Published/context URL for Weblate (optional). */
  contextUrl?: string;
  /** Optional translator comment. */
  comment?: string;
}

// ── Markdown extraction (mirrors smart-base extract_markdown) ───

/**
 * Extract translatable strings from a Markdown file.
 *
 * Uses the same state machine as smart-base's `extract_markdown()`:
 * YAML front matter → fenced code blocks → HTML skip blocks →
 * blank lines → headings → horizontal rules → list items →
 * blockquotes → table rows → kramdown attributes → paragraph
 * continuation. Each translatable span becomes one `PotEntry`.
 *
 * @param md       The markdown content.
 * @param source   Source file path (for POT `#:` references).
 * @returns        Array of extracted POT entries.
 */
export function extractMarkdown(md: string, source: string): PotEntry[] {
  const entries: PotEntry[] = [];
  const lines = md.split("\n");

  let inFrontMatter = false;
  let inCodeBlock = false;
  let codeFence: string | null = null;
  let inHtmlBlock = false;
  let htmlCloseTag = "";
  const paragraphLines: Array<{ lineno: number; text: string }> = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    const raw = paragraphLines.map((p) => p.text).join(" ");
    const text = cleanMarkdownText(raw);
    if (isTranslatable(text)) {
      entries.push({
        source,
        line: paragraphLines[0].lineno,
        msgid: text,
        kind: "paragraph",
      });
    }
    paragraphLines.length = 0;
  };

  /**
   * Where the current run of consecutive list items began in `entries`.
   *
   * `null` when the last significant line was not a list item. A kramdown
   * directive that CONSUMES its block arrives AFTER the list it replaces, so
   * the items are already in `entries` by then — this is what lets them be
   * taken back out. Bean `lrbx`.
   *
   * A run, not a single item, because `{:toc}` attaches to the whole list. The
   * placeholder is conventionally one item (`1. TOC`), but a two-item
   * placeholder would otherwise leak its second line, and the directive's
   * semantics do not care how many there are.
   */
  let listRunStart: number | null = null;
  /** Blank lines do not end a list run — a loose list has them between items. */
  const endListRun = (): void => {
    listRunStart = null;
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const lineno = idx + 1;
    const stripped = line.trim();

    // A run of list items ends at the first line that is neither another item,
    // a blank (loose lists have blanks between items), nor the attribute list
    // that may terminate it. Ending the run CONSERVATIVELY is the safe
    // direction: it means the items stay in the catalogue, which is today's
    // behaviour, whereas failing to end one would let a `{:toc}` further down
    // the page delete a list nobody asked it to touch.
    if (stripped !== "" && !MD_LIST_ITEM_RE.test(line) && !MD_KRAMDOWN_ATTR_RE.test(stripped)) {
      endListRun();
    }

    // --- YAML front matter ---
    if (lineno === 1 && MD_FRONT_MATTER_DELIM.test(line)) {
      inFrontMatter = true;
      continue;
    }
    if (inFrontMatter) {
      if (MD_FRONT_MATTER_DELIM.test(line) && lineno > 1) {
        inFrontMatter = false;
      }
      continue;
    }

    // --- Fenced code blocks ---
    // `stripped`, not `line`: an INDENTED fence is the ordinary way to put a code
    // block inside a list item, and anchoring at column 0 meant those were never
    // recognised — their bodies were extracted as prose. Bean `ig4a`. Measured
    // over 618 files: 74 msgids removed (code offered as prose, 48 of them a bare
    // fence run) and 16 ADDED — real sentences that had been swallowed, because
    // a column-0 opening fence whose closing fence was indented kept the parser
    // `inCodeBlock` until the next column-0 fence.
    const fenceMatch = stripped.match(MD_CODE_FENCE_RE);
    if (fenceMatch) {
      if (!inCodeBlock) {
        flushParagraph();
        inCodeBlock = true;
        codeFence = fenceMatch[1];
      } else if (codeFence && stripped.startsWith(codeFence[0].repeat(codeFence.length))) {
        inCodeBlock = false;
        codeFence = null;
      }
      continue;
    }
    if (inCodeBlock) continue;

    // --- HTML blocks (style/script/pre — skip content) ---
    if (inHtmlBlock) {
      const closeMatch = stripped.match(MD_HTML_CLOSE_TAG_RE);
      if (closeMatch && closeMatch[1].toLowerCase() === htmlCloseTag) {
        inHtmlBlock = false;
        htmlCloseTag = "";
      }
      continue;
    }
    const openMatch = stripped.match(MD_HTML_SKIP_OPEN_RE);
    if (openMatch) {
      const tagName = openMatch[1].toLowerCase();
      flushParagraph();
      const closeMatch = stripped.match(MD_HTML_CLOSE_TAG_RE);
      if (closeMatch && closeMatch[1].toLowerCase() === tagName) {
        continue;
      }
      inHtmlBlock = true;
      htmlCloseTag = tagName;
      continue;
    }

    // --- Blank line: end of paragraph ---
    if (!stripped) {
      flushParagraph();
      continue;
    }

    // --- Headings ---
    const headingMatch = line.match(MD_HEADING_RE);
    if (headingMatch) {
      flushParagraph();
      const text = cleanMarkdownText(headingMatch[2]);
      if (isTranslatable(text)) {
        entries.push({ source, line: lineno, msgid: text, kind: "heading" });
      }
      continue;
    }

    // --- Horizontal rules / table separators (skip) ---
    if (MD_HLINE_RE.test(stripped) || MD_TABLE_SEP_RE.test(stripped)) {
      flushParagraph();
      continue;
    }

    // --- List items ---
    const listMatch = line.match(MD_LIST_ITEM_RE);
    if (listMatch) {
      flushParagraph();
      if (listRunStart === null) listRunStart = entries.length;
      const text = cleanMarkdownText(listMatch[2].trim());
      if (isTranslatable(text)) {
        entries.push({ source, line: lineno, msgid: text, kind: "list-item" });
      }
      continue;
    }

    // --- Blockquote lines ---
    const bqMatch = line.match(MD_BLOCKQUOTE_RE);
    if (bqMatch) {
      flushParagraph();
      const text = cleanMarkdownText(bqMatch[2]);
      if (isTranslatable(text)) {
        entries.push({ source, line: lineno, msgid: text, kind: "blockquote" });
      }
      continue;
    }

    // --- Table rows: extract cell content ---
    if (stripped.startsWith("|") && stripped.endsWith("|")) {
      flushParagraph();
      const cells = stripped.slice(1, -1).split("|");
      for (const cell of cells) {
        const text = cleanMarkdownText(cell.trim());
        if (isTranslatable(text)) {
          entries.push({ source, line: lineno, msgid: text, kind: "table-cell" });
        }
      }
      continue;
    }

    // --- Kramdown / Jekyll attribute lists (skip) ---
    if (MD_KRAMDOWN_ATTR_RE.test(stripped)) {
      flushParagraph();
      // A CONSUMING directive takes its block with it. `{:toc}` replaces the
      // list above with a generated table of contents, so that list's text is
      // a placeholder no reader ever sees — and offering it to a translator
      // costs real attention: the Arabic and Russian translators rendered
      // `1. TOC` as a heading, which is the correct reading of a string that
      // should never have been shown to them. Bean `lrbx`.
      if (MD_KRAMDOWN_CONSUMING_RE.test(stripped) && listRunStart !== null) {
        entries.length = listRunStart;
      }
      endListRun();
      continue;
    }

    // --- Paragraph continuation ---
    paragraphLines.push({ lineno, text: stripped });
  }

  // Flush any remaining paragraph
  flushParagraph();

  return entries;
}

// ── Block manifest extraction ───────────────────────────────────

/**
 * Extract translatable strings from a block manifest (.ts).
 * Extracts the `title` field if present.
 */
export function extractFromManifest(
  manifest: { title?: string; label: string; kind?: string },
  sourcePath: string,
): PotEntry[] {
  const entries: PotEntry[] = [];
  if (manifest.title) {
    entries.push({
      source: sourcePath,
      line: 1,
      msgid: manifest.title,
      kind: "manifest-title",
      comment: manifest.kind
        ? `Title of ${manifest.kind} block "${manifest.label}"`
        : `Title of block "${manifest.label}"`,
    });
  }
  return entries;
}

// ── POT file formatting ─────────────────────────────────────────

/**
 * Format POT entries into a GNU gettext POT file string.
 *
 * Deduplicates entries with the same msgid (merging source references),
 * matching smart-base's `write_pot()` behaviour.
 */
export function formatPot(entries: PotEntry[], metadata?: {
  projectName?: string;
  locale?: string;
}): string {
  // Deduplicate by msgid
  const deduped = new Map<string, PotEntry[]>();
  for (const entry of entries) {
    const existing = deduped.get(entry.msgid);
    if (existing) {
      existing.push(entry);
    } else {
      deduped.set(entry.msgid, [entry]);
    }
  }

  const now = new Date().toISOString();
  const header = [
    `# Translation template for ${metadata?.projectName ?? "folio content"}`,
    `# Generated by folio-assistant pot-extract`,
    `# https://github.com/litlfred/folio-assistant/issues/206`,
    `#`,
    `msgid ""`,
    `msgstr ""`,
    `"Project-Id-Version: ${metadata?.projectName ?? "folio"}\\n"`,
    `"POT-Creation-Date: ${now}\\n"`,
    `"PO-Revision-Date: \\n"`,
    `"Last-Translator: \\n"`,
    `"Language: ${metadata?.locale ?? ""}\\n"`,
    `"Language-Team: \\n"`,
    `"MIME-Version: 1.0\\n"`,
    `"Content-Type: text/plain; charset=UTF-8\\n"`,
    `"Content-Transfer-Encoding: 8bit\\n"`,
    ``,
  ].join("\n");

  // Sort entries case-insensitively (matches smart-base)
  const sortedKeys = [...deduped.keys()].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  const body = sortedKeys
    .map((msgid) => {
      const locations = deduped.get(msgid)!;
      const parts: string[] = [];

      // Source references
      for (const loc of locations) {
        parts.push(`#: ${loc.source}:${loc.line}`);
      }

      // Translator comments
      for (const loc of locations) {
        if (loc.comment) parts.push(`#. ${loc.comment}`);
        if (loc.contextUrl) parts.push(`#. URL: ${loc.contextUrl}`);
      }

      // Check for python-brace-format flag (Liquid variables)
      const hasLqdVars = /\{lqd_[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*\}/.test(msgid);
      if (hasLqdVars) {
        parts.push("#, python-brace-format");
      }

      parts.push(`msgid ${potQuote(msgid)}`);
      parts.push(`msgstr ""`);

      return parts.join("\n");
    })
    .join("\n\n");

  return header + "\n" + body + "\n";
}

/**
 * A `.pot` with its creation timestamp blanked, for comparison only.
 *
 * Never written back: the header is real metadata a translator's tooling
 * reads. It is excluded from the COMPARISON because it is the one line that
 * changes on every run regardless of content. Shared by every template
 * checker (`translate-bpmn`, core's `glossary-pot`), so the two cannot
 * disagree about what "unchanged" means.
 */
export function potWithoutTimestamp(text: string): string {
  return text.replace(/^"POT-Creation-Date:.*$/m, '"POT-Creation-Date: <ignored>\\n"');
}

/**
 * Quote a string for POT format — handles multiline and escaping.
 */
function potQuote(s: string): string {
  const escaped = s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");

  if (s.includes("\n") && s.length > 72) {
    const lines = escaped.split("\\n");
    return '""' + "\n" + lines.map((l) => `"${l}\\n"`).join("\n");
  }

  return `"${escaped}"`;
}
