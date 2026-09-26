/**
 * PO injection — produces translated Markdown from a PO file.
 *
 * ## Origin: smart-base `inject_translations.py`
 *
 * This module is a TypeScript port of the markdown injection logic in
 * `WorldHealthOrganization/smart-base/input/scripts/inject_translations.py`
 * (lines 608–818, function `inject_markdown` and helpers). The Python
 * original injects translations into `input/pagecontent/*.md` files;
 * this injects into folio content blocks.
 *
 * ## How injection works
 *
 * The injector uses the **same state machine** as `pot-extract.ts`
 * (which mirrors `extract_translations.extract_markdown`) to identify
 * every translatable text span in the source markdown. For each span,
 * it looks up the `msgid` (after cleaning) in the PO translations
 * dictionary and substitutes the `msgstr`.
 *
 * Key design choices (from smart-base):
 *
 * - **Paragraph re-wrapping:** When a multi-line paragraph is translated,
 *   the first line is replaced with the full translated text and
 *   continuation lines are blanked. Markdown renderers treat consecutive
 *   non-blank lines as one paragraph, so this is functionally equivalent.
 *
 * - **Liquid variable restoration:** `{lqd_expr}` in the translated text
 *   is restored to `{{ expr }}` Liquid syntax (smart-base compat).
 *
 * - **Fuzzy entries skipped:** Entries flagged `#, fuzzy` in the PO file
 *   are not injected, matching smart-base's conservative approach.
 *
 * @module content/pipeline/po-inject
 */

import { cleanMarkdownText } from "./pot-extract";

// ── Liquid restoration ──────────────────────────────────────────

/** Prefix used by pot-extract for Liquid output variables. */
const LQD_PREFIX = "lqd_";
// Built from LQD_PREFIX so the prefix is written once. It was previously
// repeated as a literal here, leaving the constant read by nothing and free
// to drift from the pattern that actually matches.
const LQD_VAR_RE = new RegExp("\\{" + LQD_PREFIX + "([^{}\n]+)\\}", "g");

/**
 * Restore `{lqd_expr}` gettext variables back to `{{ expr }}` Liquid
 * syntax. Mirrors smart-base `_gettext_to_liquid()`.
 */
function gettextToLiquid(text: string): string {
  return text.replace(LQD_VAR_RE, (_match, expr: string) => `{{ ${expr} }}`);
}

// ── PO parsing ──────────────────────────────────────────────────

/** A single PO entry (msgid → msgstr pair). */
export interface PoEntry {
  /** Source references (#: comments). */
  references: string[];
  /** Translator comments (#. comments). */
  comments: string[];
  /** Flags (#, comments, e.g., "fuzzy"). */
  flags: string[];
  /** Context (msgctxt). */
  context?: string;
  /** Source string. */
  msgid: string;
  /** Translated string (empty = untranslated). */
  msgstr: string;
}

/**
 * Parse a PO file into a msgid → msgstr dictionary.
 *
 * Mirrors smart-base `parse_po_file()`: only entries with a non-empty
 * msgstr are included. **Fuzzy entries are skipped** to avoid injecting
 * uncertain translations.
 */
export function parsePo(poContent: string): Map<string, string> {
  const translations = new Map<string, string>();

  // Split into blocks separated by blank lines
  const blocks = poContent.trim().split(/\n{2,}/);

  for (const block of blocks) {
    const lines = block.split("\n");

    // Skip header block (first msgid is empty)
    if (lines.some((l) => l.trim() === 'msgid ""') &&
        !lines.some((l) => l.trim() === 'msgstr ""' && lines.indexOf(l) === lines.length - 1)) {
      // More nuanced: skip if msgid is empty but msgstr is not
      const msgid = extractPoValue(lines, "msgid");
      if (msgid === "") continue;
    }

    // Skip fuzzy entries
    if (lines.some((l) => l.trim().startsWith("#,") && l.includes("fuzzy"))) {
      continue;
    }

    const msgid = extractPoValue(lines, "msgid");
    const msgstr = extractPoValue(lines, "msgstr");

    if (msgid && msgstr) {
      translations.set(unescapePo(msgid), unescapePo(msgstr));
    }
  }

  return translations;
}

/**
 * Parse a PO file into structured entries (for detailed analysis).
 */
export function parsePoEntries(poContent: string): PoEntry[] {
  const entries: PoEntry[] = [];
  const blocks = poContent.trim().split(/\n{2,}/);

  for (const block of blocks) {
    const lines = block.split("\n");

    const references: string[] = [];
    const comments: string[] = [];
    const flags: string[] = [];
    let context: string | undefined;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#: ")) references.push(trimmed.slice(3));
      else if (trimmed.startsWith("#. ")) comments.push(trimmed.slice(3));
      else if (trimmed.startsWith("#, ")) {
        flags.push(...trimmed.slice(3).split(",").map((f) => f.trim()));
      }
    }

    const msgctxtLine = lines.find((l) => l.trim().startsWith("msgctxt "));
    if (msgctxtLine) {
      context = unescapePo(extractPoValue(lines, "msgctxt"));
    }

    const msgid = extractPoValue(lines, "msgid");
    const msgstr = extractPoValue(lines, "msgstr");

    if (msgid !== undefined) {
      entries.push({
        references,
        comments,
        flags,
        context,
        msgid: unescapePo(msgid),
        msgstr: unescapePo(msgstr),
      });
    }
  }

  // Filter out header entry
  return entries.filter((e) => e.msgid !== "");
}

/** Extract the value of a PO field (msgid, msgstr, msgctxt) from a block. */
function extractPoValue(lines: string[], field: string): string {
  let value = "";
  let inField = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith(`${field} `)) {
      inField = true;
      value = trimmed.slice(field.length + 1);
      continue;
    }

    // Another field starts
    if (trimmed.startsWith("msg") && !trimmed.startsWith('"')) {
      if (inField) break;
      continue;
    }

    // Continuation line
    if (inField && trimmed.startsWith('"')) {
      value += trimmed;
    }
  }

  // Strip surrounding quotes and concatenate
  return value
    .replace(/^"/, "")
    .replace(/"$/, "")
    .replace(/"\s*"/g, "");
}

/** Unescape a PO string value. */
function unescapePo(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

// ── Structural patterns (mirrors pot-extract.ts / smart-base) ───

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

const MD_INJ_MIN_LEN = 3;

// ── Injection ───────────────────────────────────────────────────

/** Result of injecting translations into markdown. */
export interface InjectionResult {
  /** The translated markdown content. */
  translated: string;
  /** Whether any substitutions were made. */
  changed: boolean;
  /** Statistics. */
  stats: {
    totalSpans: number;
    translatedSpans: number;
    untranslatedSpans: number;
  };
}

/**
 * Inject translations into a Markdown file.
 *
 * Uses the same state machine as `extractMarkdown()` to identify
 * every translatable text span, looks up the translation via the
 * cleaned msgid, restores Liquid `{{ }}` syntax in the translated
 * string, and writes it back into the source lines.
 *
 * Mirrors smart-base `inject_markdown()` in `inject_translations.py`
 * lines 608–818.
 */
export function injectMarkdown(
  sourceMd: string,
  translations: Map<string, string>,
): InjectionResult {
  const lines = sourceMd.split("\n");
  const outLines = [...lines];
  let changed = false;
  let totalSpans = 0;
  let translatedSpans = 0;
  let untranslatedSpans = 0;

  let inFrontMatter = false;
  let inCodeBlock = false;
  let codeFence: string | null = null;
  let inHtmlBlock = false;
  let htmlCloseTag = "";
  const paragraphBuf: Array<{ idx: number; text: string }> = [];

  /** Look up translation for raw text, return Liquid-restored result or null. */
  const translate = (rawText: string): string | null => {
    const msgid = cleanMarkdownText(rawText);
    if (msgid.length < MD_INJ_MIN_LEN) return null;
    totalSpans++;
    const msgstr = translations.get(msgid);
    if (msgstr && msgstr !== msgid) {
      translatedSpans++;
      return gettextToLiquid(msgstr);
    }
    untranslatedSpans++;
    return null;
  };

  const flushParagraph = () => {
    if (paragraphBuf.length === 0) return;
    const raw = paragraphBuf.map((p) => p.text).join(" ");
    const translated = translate(raw);
    if (translated) {
      // Replace first line with full translated text, blank continuation lines
      outLines[paragraphBuf[0].idx] = translated;
      for (let i = 1; i < paragraphBuf.length; i++) {
        outLines[paragraphBuf[i].idx] = "";
      }
      changed = true;
    }
    paragraphBuf.length = 0;
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const lineno = idx + 1;
    const stripped = line.trim();

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
    const fenceMatch = line.match(MD_CODE_FENCE_RE);
    if (fenceMatch) {
      if (!inCodeBlock) {
        flushParagraph();
        inCodeBlock = true;
        codeFence = fenceMatch[1];
      } else if (codeFence && line.startsWith(codeFence[0].repeat(codeFence.length))) {
        inCodeBlock = false;
        codeFence = null;
      }
      continue;
    }
    if (inCodeBlock) continue;

    // --- HTML blocks ---
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
      if (closeMatch && closeMatch[1].toLowerCase() === tagName) continue;
      inHtmlBlock = true;
      htmlCloseTag = tagName;
      continue;
    }

    // --- Blank line ---
    if (!stripped) {
      flushParagraph();
      continue;
    }

    // --- Headings ---
    const headingMatch = line.match(MD_HEADING_RE);
    if (headingMatch) {
      flushParagraph();
      const [, prefix, text] = headingMatch;
      const translated = translate(text);
      if (translated) {
        outLines[idx] = prefix + translated;
        changed = true;
      }
      continue;
    }

    // --- Horizontal rules / table separators ---
    if (MD_HLINE_RE.test(stripped) || MD_TABLE_SEP_RE.test(stripped)) {
      flushParagraph();
      continue;
    }

    // --- List items ---
    const listMatch = line.match(MD_LIST_ITEM_RE);
    if (listMatch) {
      flushParagraph();
      const [, prefix, text] = listMatch;
      const translated = translate(text.trim());
      if (translated) {
        outLines[idx] = prefix + translated;
        changed = true;
      }
      continue;
    }

    // --- Blockquote lines ---
    const bqMatch = line.match(MD_BLOCKQUOTE_RE);
    if (bqMatch) {
      flushParagraph();
      const [, prefix, text] = bqMatch;
      const translated = translate(text);
      if (translated) {
        outLines[idx] = prefix + translated;
        changed = true;
      }
      continue;
    }

    // --- Table rows ---
    if (stripped.startsWith("|") && stripped.endsWith("|")) {
      flushParagraph();
      const cells = stripped.slice(1, -1).split("|");
      const newCells: string[] = [];
      let rowChanged = false;
      for (const cell of cells) {
        const translated = translate(cell.trim());
        if (translated) {
          // Preserve original cell whitespace for alignment
          const leading = cell.slice(0, cell.length - cell.trimStart().length) || " ";
          const trailing = cell.slice(cell.trimEnd().length) || " ";
          newCells.push(leading + translated + trailing);
          rowChanged = true;
        } else {
          newCells.push(cell);
        }
      }
      if (rowChanged) {
        outLines[idx] = "|" + newCells.join("|") + "|";
        changed = true;
      }
      continue;
    }

    // --- Kramdown attribute lists ---
    if (MD_KRAMDOWN_ATTR_RE.test(stripped)) {
      flushParagraph();
      continue;
    }

    // --- Paragraph continuation ---
    paragraphBuf.push({ idx, text: stripped });
  }

  flushParagraph();

  // Remove blank lines introduced by paragraph collapse
  const result = outLines.filter((line) => line !== "").join("\n");

  return {
    translated: result || sourceMd,
    changed,
    stats: {
      totalSpans,
      translatedSpans,
      untranslatedSpans,
    },
  };
}
