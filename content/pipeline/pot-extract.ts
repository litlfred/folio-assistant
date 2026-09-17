/**
 * Markdown translation string extractor — POT generation.
 *
 * Extracts translatable strings from folio content `.md` files into
 * GNU gettext `.pot` (Portable Object Template) format.
 *
 * ## What it extracts
 *
 * - Prose paragraphs (each paragraph → one `msgid`)
 * - Block titles (from `.ts` manifests)
 * - Chapter and section titles
 * - Image alt text and captions
 * - Table cell content (each cell → one `msgid`)
 *
 * ## What it shields (non-translatable)
 *
 * Non-translatable tokens are replaced with numbered placeholders
 * (`{1}`, `{2}`, etc.) before extraction. The shield map is stored
 * alongside the POT so `po-inject.ts` can restore them.
 *
 * - Inline math: `$...$`
 * - Display math: `$$...$$` and `\begin{...}...\end{...}`
 * - Code spans: `` `...` ``
 * - Fenced code blocks: ``` ```...``` ```
 * - Block labels: `def:foo`, `thm:bar`
 * - URLs and file paths
 * - LaTeX commands in prose: `\cite{...}`, `\ref{...}`, etc.
 *
 * ## Origin
 *
 * Adapted from the smart-base translation subsystem's markdown extraction
 * pipeline (~5,500 lines Python). The smart-base version handles FHIR IG
 * narrative pages; this handles folio content. The extraction logic is
 * generic markdown processing, not WHO-specific, so it lives in
 * folio-assistant rather than being loaded from smart-base.
 *
 * @module content/pipeline/pot-extract
 */

// ── Shielding patterns ──────────────────────────────────────────

/** Patterns to shield from translation, ordered by specificity. */
const SHIELD_PATTERNS: Array<{ name: string; re: RegExp }> = [
  // Fenced code blocks (must come before inline patterns)
  { name: "fenced-code", re: /```[\s\S]*?```/g },
  // Display math ($$...$$)
  { name: "display-math", re: /\$\$[\s\S]*?\$\$/g },
  // LaTeX environments
  { name: "latex-env", re: /\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g },
  // Inline math ($...$) — but not currency like $100
  { name: "inline-math", re: /\$(?!\d)[^$\n]+?\$/g },
  // Code spans
  { name: "code-span", re: /`[^`\n]+`/g },
  // LaTeX citation/ref commands
  { name: "latex-cmd", re: /\\(?:cite|ref|eqref|label|defterm|refterm)\{[^}]*\}/g },
  // Block labels (e.g., def:quantum-universe, thm:main-result)
  { name: "block-label", re: /\b(?:def|thm|lem|prop|cor|rem|ex|conj|prf|sim|eq|fig|tbl|sec|chap|app|bib|hi|pers|scen|bp|de|dt|sched|ind|freq|nfreq|tscen|lm|prof|vs|quest|cql|sm|pd|meas|tc|actor):[a-z0-9][a-z0-9-]*/g },
  // URLs (http/https/ftp)
  { name: "url", re: /https?:\/\/[^\s)\]>]+/g },
  // File paths (starting with ./ or ../ or /)
  { name: "file-path", re: /(?:\.\.?\/|\/)[^\s)\]>]+/g },
];

/** A shielded token: placeholder index + original content. */
export interface ShieldEntry {
  index: number;
  name: string;
  original: string;
}

/**
 * Shield non-translatable tokens in a string, replacing them with
 * numbered placeholders like `{1}`, `{2}`.
 *
 * Returns the shielded string and the shield map needed to restore.
 */
export function shieldNonTranslatable(text: string): {
  shielded: string;
  shields: ShieldEntry[];
} {
  const shields: ShieldEntry[] = [];
  let counter = 0;
  let result = text;

  for (const pattern of SHIELD_PATTERNS) {
    result = result.replace(pattern.re, (match) => {
      counter++;
      shields.push({ index: counter, name: pattern.name, original: match });
      return `{${counter}}`;
    });
  }

  return { shielded: result, shields };
}

/**
 * Restore shielded placeholders back to original content.
 */
export function unshield(text: string, shields: ShieldEntry[]): string {
  let result = text;
  // Restore in reverse order to handle nested shields correctly
  for (const entry of [...shields].reverse()) {
    result = result.replace(`{${entry.index}}`, entry.original);
  }
  return result;
}

// ── Paragraph segmentation ──────────────────────────────────────

/**
 * Segment markdown into translatable paragraphs.
 *
 * Each paragraph becomes one `msgid` in the POT file. Paragraphs are
 * separated by blank lines. Headings, list items, and block-level
 * elements are treated as separate segments.
 */
export function segmentMarkdown(md: string): string[] {
  const lines = md.split("\n");
  const segments: string[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join("\n").trim();
      if (text) segments.push(text);
      currentParagraph = [];
    }
  };

  let inFencedCode = false;
  let inMathBlock = false;

  for (const line of lines) {
    // Track fenced code blocks
    if (line.trim().startsWith("```")) {
      inFencedCode = !inFencedCode;
      if (inFencedCode) flushParagraph();
      continue;
    }
    if (inFencedCode) continue;

    // Track display math blocks
    if (line.trim() === "$$") {
      inMathBlock = !inMathBlock;
      if (inMathBlock) flushParagraph();
      continue;
    }
    if (inMathBlock) continue;

    // Blank line → paragraph break
    if (line.trim() === "") {
      flushParagraph();
      continue;
    }

    // Headings are individual segments
    if (/^#{1,6}\s/.test(line)) {
      flushParagraph();
      segments.push(line.trim());
      continue;
    }

    // List items start new segments
    if (/^[-*+]\s|^\d+\.\s/.test(line.trim())) {
      flushParagraph();
      currentParagraph.push(line);
      continue;
    }

    // Regular prose line — accumulate into current paragraph
    currentParagraph.push(line);
  }

  flushParagraph();
  return segments;
}

// ── POT format ──────────────────────────────────────────────────

/** A single translatable entry. */
export interface PotEntry {
  /** Source file path (relative to content root). */
  source: string;
  /** Line number in source file (1-based, approximate). */
  line: number;
  /** The msgid — the source string to translate. */
  msgid: string;
  /** Optional context for disambiguation. */
  context?: string;
  /** Optional comment for translators. */
  comment?: string;
}

/**
 * Format POT entries into a GNU gettext POT file string.
 */
export function formatPot(entries: PotEntry[], metadata?: {
  projectName?: string;
  locale?: string;
}): string {
  const header = [
    `# Translation template for ${metadata?.projectName ?? "folio content"}`,
    `# Generated by folio-assistant pot-extract`,
    `# https://github.com/litlfred/folio-assistant/issues/206`,
    `#`,
    `msgid ""`,
    `msgstr ""`,
    `"Project-Id-Version: ${metadata?.projectName ?? "folio"}\\n"`,
    `"POT-Creation-Date: ${new Date().toISOString()}\\n"`,
    `"PO-Revision-Date: \\n"`,
    `"Last-Translator: \\n"`,
    `"Language: ${metadata?.locale ?? ""}\\n"`,
    `"Language-Team: \\n"`,
    `"MIME-Version: 1.0\\n"`,
    `"Content-Type: text/plain; charset=UTF-8\\n"`,
    `"Content-Transfer-Encoding: 8bit\\n"`,
    ``,
  ].join("\n");

  const body = entries.map((entry) => {
    const parts: string[] = [];

    // Reference comment
    parts.push(`#: ${entry.source}:${entry.line}`);

    // Translator comment
    if (entry.comment) {
      parts.push(`#. ${entry.comment}`);
    }

    // Context (for disambiguation)
    if (entry.context) {
      parts.push(`msgctxt ${potQuote(entry.context)}`);
    }

    // The msgid
    parts.push(`msgid ${potQuote(entry.msgid)}`);

    // Empty msgstr (this is a template)
    parts.push(`msgstr ""`);

    return parts.join("\n");
  }).join("\n\n");

  return header + "\n" + body + "\n";
}

/**
 * Quote a string for POT format — handles multiline and escaping.
 */
function potQuote(s: string): string {
  const escaped = s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");

  // For multiline: split into lines for readability
  if (s.includes("\n") && s.length > 72) {
    const lines = escaped.split("\\n");
    return '""' + "\n" + lines.map((l) => `"${l}\\n"`).join("\n");
  }

  return `"${escaped}"`;
}

// ── Main extraction ─────────────────────────────────────────────

/**
 * Extract translatable strings from a markdown file.
 *
 * Returns POT entries with shielded content (non-translatable tokens
 * replaced with placeholders) and the shield map.
 */
export function extractFromMarkdown(
  md: string,
  sourcePath: string,
): { entries: PotEntry[]; shields: Map<string, ShieldEntry[]> } {
  const segments = segmentMarkdown(md);
  const entries: PotEntry[] = [];
  const shields = new Map<string, ShieldEntry[]>();

  let lineOffset = 1;

  for (const segment of segments) {
    // Find the approximate line number
    const idx = md.indexOf(segment);
    if (idx >= 0) {
      lineOffset = md.substring(0, idx).split("\n").length;
    }

    // Shield non-translatable content
    const { shielded, shields: segShields } = shieldNonTranslatable(segment);

    // Skip segments that are entirely placeholders or very short
    const stripped = shielded.replace(/\{[\d]+\}/g, "").trim();
    if (!stripped || stripped.length < 2) continue;

    const entryId = `${sourcePath}:${lineOffset}`;
    shields.set(entryId, segShields);

    entries.push({
      source: sourcePath,
      line: lineOffset,
      msgid: shielded,
    });
  }

  return { entries, shields };
}

/**
 * Extract translatable strings from a block manifest (.ts).
 *
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
      context: `block-title:${manifest.label}`,
      comment: manifest.kind
        ? `Title of ${manifest.kind} block "${manifest.label}"`
        : `Title of block "${manifest.label}"`,
    });
  }

  return entries;
}
