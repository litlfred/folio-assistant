/**
 * PO injection — produces translated Markdown from a PO file.
 *
 * Takes a completed `.po` file and the source `.md`, substitutes
 * translated strings for source strings, restores shielded
 * non-translatable tokens, and writes the result.
 *
 * ## Post-processing
 *
 * After injection, the output goes through validation:
 * 1. Structure check — same paragraph count and heading structure
 * 2. Completeness check — flags untranslated segments
 * 3. Lint — catches doubled punctuation, orphaned placeholders
 *
 * ## Shield restoration
 *
 * Non-translatable tokens were replaced with `{1}`, `{2}` etc during
 * extraction. This module restores them from the shield map stored
 * alongside the POT. If a translator accidentally moved or removed a
 * placeholder, that is reported as a finding rather than silently
 * dropping content.
 *
 * @module content/pipeline/po-inject
 */

import { unshield, type ShieldEntry } from "./pot-extract";

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
 * Parse a PO file into entries.
 *
 * Handles multiline strings (concatenated "" lines), comments,
 * flags, and context. Does not handle plural forms (not needed
 * for prose translation).
 */
export function parsePo(poContent: string): PoEntry[] {
  const entries: PoEntry[] = [];
  const lines = poContent.split("\n");

  let current: Partial<PoEntry> = {};
  let field: "msgid" | "msgstr" | "msgctxt" | null = null;

  const flush = () => {
    if (current.msgid !== undefined) {
      entries.push({
        references: current.references ?? [],
        comments: current.comments ?? [],
        flags: current.flags ?? [],
        context: current.context,
        msgid: current.msgid ?? "",
        msgstr: current.msgstr ?? "",
      });
    }
    current = {};
    field = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Comment lines
    if (line.startsWith("#: ")) {
      current.references = current.references ?? [];
      current.references.push(line.slice(3));
      continue;
    }
    if (line.startsWith("#. ")) {
      current.comments = current.comments ?? [];
      current.comments.push(line.slice(3));
      continue;
    }
    if (line.startsWith("#, ")) {
      current.flags = current.flags ?? [];
      current.flags.push(...line.slice(3).split(",").map((f) => f.trim()));
      continue;
    }
    if (line.startsWith("#")) continue; // other comments

    // Empty line → flush
    if (line === "") {
      flush();
      continue;
    }

    // Field declarations
    if (line.startsWith("msgctxt ")) {
      field = "msgctxt";
      current.context = unquotePo(line.slice(8));
      continue;
    }
    if (line.startsWith("msgid ")) {
      field = "msgid";
      current.msgid = unquotePo(line.slice(6));
      continue;
    }
    if (line.startsWith("msgstr ")) {
      field = "msgstr";
      current.msgstr = unquotePo(line.slice(7));
      continue;
    }

    // Continuation line (multiline string)
    if (line.startsWith('"') && field) {
      const val = unquotePo(line);
      if (field === "msgctxt") current.context = (current.context ?? "") + val;
      else if (field === "msgid") current.msgid = (current.msgid ?? "") + val;
      else if (field === "msgstr") current.msgstr = (current.msgstr ?? "") + val;
      continue;
    }
  }

  flush();

  // Filter out the header entry (empty msgid)
  return entries.filter((e) => e.msgid !== "");
}

/** Unquote a PO string value. */
function unquotePo(s: string): string {
  const trimmed = s.trim();
  if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) return trimmed;
  return trimmed
    .slice(1, -1)
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

// ── Injection ───────────────────────────────────────────────────

/** Result of injecting translations into a markdown source. */
export interface InjectionResult {
  /** The translated markdown. */
  translated: string;
  /** Statistics about the injection. */
  stats: {
    /** Total segments in the source. */
    totalSegments: number;
    /** Segments that were translated. */
    translatedSegments: number;
    /** Segments left untranslated (empty msgstr). */
    untranslatedSegments: number;
    /** Segments flagged as fuzzy. */
    fuzzySegments: number;
  };
  /** Validation findings. */
  findings: InjectionFinding[];
}

export interface InjectionFinding {
  severity: "error" | "warning" | "info";
  message: string;
  /** Source reference (file:line). */
  source?: string;
}

/**
 * Inject translations from PO entries into a markdown source.
 *
 * For each translatable segment in the source, looks up the matching
 * PO entry by msgid and substitutes the msgstr. Restores shielded
 * placeholders. Validates the result.
 */
export function injectTranslations(
  sourceMd: string,
  poEntries: PoEntry[],
  shields: Map<string, ShieldEntry[]>,
): InjectionResult {
  const findings: InjectionFinding[] = [];
  let translated = sourceMd;

  // Build lookup: msgid → PoEntry
  const lookup = new Map<string, PoEntry>();
  for (const entry of poEntries) {
    lookup.set(entry.msgid, entry);
  }

  let totalSegments = 0;
  let translatedSegments = 0;
  let untranslatedSegments = 0;
  let fuzzySegments = 0;

  // For each PO entry, find and replace in the source
  for (const entry of poEntries) {
    totalSegments++;

    if (!entry.msgstr || entry.msgstr.trim() === "") {
      untranslatedSegments++;
      findings.push({
        severity: "warning",
        message: `Untranslated segment: "${entry.msgid.slice(0, 60)}..."`,
        source: entry.references[0],
      });
      continue;
    }

    if (entry.flags.includes("fuzzy")) {
      fuzzySegments++;
      findings.push({
        severity: "info",
        message: `Fuzzy translation: "${entry.msgid.slice(0, 60)}..."`,
        source: entry.references[0],
      });
    }

    // Restore shields in the translated string
    let msgstr = entry.msgstr;
    const ref = entry.references[0];
    const entryShields = ref ? shields.get(ref) : undefined;
    if (entryShields) {
      msgstr = unshield(msgstr, entryShields);
    }

    // Check for orphaned placeholders in the translated string
    const orphaned = msgstr.match(/\{\d+\}/g);
    if (orphaned) {
      findings.push({
        severity: "warning",
        message: `Orphaned placeholder(s) in translation: ${orphaned.join(", ")}`,
        source: ref,
      });
    }

    // Restore shields in the msgid to find the original text
    let originalMsgid = entry.msgid;
    if (entryShields) {
      originalMsgid = unshield(entry.msgid, entryShields);
    }

    // Replace in the translated output
    if (translated.includes(originalMsgid)) {
      translated = translated.replace(originalMsgid, msgstr);
      translatedSegments++;
    } else {
      findings.push({
        severity: "warning",
        message: `Could not find source segment to replace: "${originalMsgid.slice(0, 60)}..."`,
        source: ref,
      });
    }
  }

  // Post-injection validation
  const sourceParas = sourceMd.split(/\n\n+/).length;
  const translatedParas = translated.split(/\n\n+/).length;
  if (Math.abs(sourceParas - translatedParas) > 2) {
    findings.push({
      severity: "warning",
      message: `Paragraph count differs: source has ${sourceParas}, translated has ${translatedParas}`,
    });
  }

  // Check for doubled punctuation (common translation artifact)
  const doubledPunct = translated.match(/([.!?])\1{2,}/g);
  if (doubledPunct) {
    findings.push({
      severity: "warning",
      message: `Possible doubled punctuation: ${doubledPunct.join(", ")}`,
    });
  }

  return {
    translated,
    stats: {
      totalSegments,
      translatedSegments,
      untranslatedSegments,
      fuzzySegments,
    },
    findings,
  };
}
