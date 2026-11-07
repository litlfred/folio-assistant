#!/usr/bin/env bun
/**
 * extract-references.ts — split the reference lists of this instance's
 * library papers into `folio-reference/v1` nodes, one per entry (bean
 * folio-assistant-63q4, the `extracted` provenance).
 *
 * ## What it reads
 *
 * Every document in the declared `library` directory that has
 * `sections/*.md`. A document's reference list is either
 *
 * - a section whose front-matter `section_title` names one (References,
 *   Bibliography, Bibliographie, Literature, Literatur, Works cited), whole; or
 * - the lines after a heading line that names one, inside another section:
 *   the PDF outline often has no entry for the references, so the extractor
 *   left them at the end of the conclusion or of the last page.
 *
 * ## How it splits
 *
 * The text is extracted from PDFs, a line per PDF line. Three list shapes:
 * `[n]` and `n.` lists (an entry starts at the NEXT number in sequence, so a
 * stray number inside an entry starts nothing), and author-year paragraphs
 * with no marker (an entry starts at a line that opens like an author list,
 * after a line that closed a sentence). Page furniture is dropped first: page
 * numbers, running heads (short lines the document repeats), footnote URLs and
 * the appendix letter that follows the list.
 *
 * ## What a node holds
 *
 * `note` is the entry's own text, whitespace-normalised, always. The parsed
 * fields (`title`, `author`, `issued`, `DOI`, `URL`) are set ONLY when the
 * entry's shape makes them unambiguous, and are otherwise left out: a field
 * that is not there is better than one that is wrong, and the raw text stays
 * in `note` for whoever reads it next. Some of the rules that keep it so:
 *
 * - a word hyphenated across a line break is rejoined only when the paper's
 *   own text says which form is the word; a title with an undecidable one is
 *   dropped;
 * - a URL broken across lines is rejoined only at a break the URL itself
 *   makes (after `/`, `.`, `:`…); a URL cut mid-word is dropped;
 * - a year is set when the entry has exactly one (outside URLs, DOIs and
 *   arXiv ids), or the style puts it in a fixed place;
 * - an author list is set only when every name in it parses; a single name
 *   that is not initials-first stays whole, as `literal`.
 *
 * ## Where it writes
 *
 * One `<doc-id>.r<n>.json` per entry in the declared `references` directory
 * of this instance (`extracted-references/`). For a numbered list `<n>` is the
 * printed number, so `[12]` in the paper's text is `.r12`; for an author-year
 * list it is the entry's position. Files the run would not write are removed.
 *
 *   bun run folio-assistant-sci/scripts/extract-references.ts          # write
 *   bun run folio-assistant-sci/scripts/extract-references.ts --check  # compare
 *
 * Exit: 0 written or in step, 1 `--check` found a difference, 2 a declared
 * directory is missing.
 *
 * @module folio-assistant-sci/scripts/extract-references
 * @covers references
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

import { instanceDirectoryForGraph } from "@litlfred/cat-harness-tools/schemas/kg/cat-harness.ts";

export const REFERENCE_SCHEMA_TAG = "folio-reference/v1";
export const INSTANCE_ROOT = resolve(import.meta.dir, "..");

// ── Finding the reference list ──────────────────────────────────────────────

/** A heading that names a reference list, in the languages the library holds. */
const LIST_TITLE = /^(?:references?|bibliography|bibliographie|literatur|literature(?: cited)?|works cited|cited literature)$/i;

export interface ReferenceList {
  /** The library document's id, its directory name. */
  docId: string;
  /** The section file the list was read from, absolute. */
  file: string;
  /** The list's lines, from after its heading to the end of the section. */
  lines: string[];
  /** Every line of every section of the document: the vocabulary and the running heads are read from it. */
  docLines: string[];
}

/** Front matter and body of a section file. */
export function splitFrontMatter(text: string): { fm: Record<string, string>; body: string[] } {
  const lines = text.split(/\r?\n/);
  const fm: Record<string, string> = {};
  if (lines[0] !== "---") return { fm, body: lines };
  const end = lines.indexOf("---", 1);
  if (end < 0) return { fm, body: lines };
  for (const l of lines.slice(1, end)) {
    const m = /^([A-Za-z_]+):\s*(.*)$/.exec(l);
    if (m) fm[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
  return { fm, body: lines.slice(end + 1) };
}

/** The reference list of one library document, or undefined when it has none. */
export function findReferenceList(docDir: string): ReferenceList | undefined {
  const secDir = join(docDir, "sections");
  if (!existsSync(secDir)) return undefined;
  const files = readdirSync(secDir)
    .filter((f) => f.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  const sections = files.map((f) => ({ file: join(secDir, f), ...splitFrontMatter(readFileSync(join(secDir, f), "utf-8")) }));
  const docLines = sections.flatMap((s) => s.body);
  const docId = basename(docDir);
  for (const s of sections) {
    if (LIST_TITLE.test((s.fm.section_title ?? "").trim())) return { docId, file: s.file, lines: s.body, docLines };
  }
  for (const s of sections) {
    const i = s.body.findIndex((l) => LIST_TITLE.test(l.trim()));
    if (i >= 0) return { docId, file: s.file, lines: s.body.slice(i + 1), docLines };
  }
  return undefined;
}

// ── Page furniture ──────────────────────────────────────────────────────────

const PAGE_NUMBER = /^\d{1,4}$/;
/** A footnote that the page put below the list: `2DOI: 10.5281/…`, `1https://…`. */
const FOOTNOTE = /^\d{1,2}(?:https?:\/\/|DOI:\s)/;
const isMarker = (l: string) => /^\[\d+\]\s/.test(l) || /^\d{1,3}\.\s+\S/.test(l);

/**
 * The list's lines without page furniture: blank lines, page numbers, footnote
 * URLs, running heads, and the appendix letter after the list. A running head
 * is a short line, starting upper-case, that is not an entry's first line and
 * that the document repeats: three times anywhere, or twice when it sits next
 * to a page number.
 */
export function stripFurniture(lines: readonly string[], docLines: readonly string[]): string[] {
  const counts = new Map<string, number>();
  for (const l of docLines) {
    const t = l.trim();
    if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const ls = lines.map((l) => l.trim()).filter((l) => l !== "");
  while (ls.length && /^[A-Z]$/.test(ls[ls.length - 1])) ls.pop();
  const headShaped = (t: string) => t.length >= 8 && t.length <= 60 && /^\p{Lu}/u.test(t) && !/[,;]$/.test(t) && !isMarker(t);
  const out: string[] = [];
  for (let i = 0; i < ls.length; i++) {
    const t = ls[i];
    // `accessed: 2025-12-` / `01`: a number that finishes the line before is not a page number.
    if (PAGE_NUMBER.test(t) && !/[-–,:]$/.test(ls[i - 1] ?? "")) continue;
    if (FOOTNOTE.test(t)) continue;
    if (headShaped(t)) {
      const n = counts.get(t) ?? 0;
      const byPageNumber = PAGE_NUMBER.test(ls[i - 1] ?? "") || PAGE_NUMBER.test(ls[i + 1] ?? "");
      if (n >= 3 || (n >= 2 && byPageNumber)) continue;
    }
    out.push(t);
  }
  return out;
}

// ── Splitting into entries ──────────────────────────────────────────────────

export type ListStyle = "bracket" | "dotted" | "author-year";

export interface RawEntry {
  /** The printed number, or the position in an author-year list. */
  n: number;
  /** The entry's lines, marker removed. */
  lines: string[];
}

export function detectStyle(lines: readonly string[]): ListStyle {
  const first = lines[0] ?? "";
  if (/^\[\d+\]\s/.test(first)) return "bracket";
  if (/^\d+\.\s/.test(first)) return "dotted";
  return "author-year";
}

const NAME_TOKEN = String.raw`(?:\p{Lu}[\p{L}'’\-]*\.?|\p{Lu}\.(?:-?\p{Lu}\.)*|de|van|von|der|den|da|dos|del|di|du|la|le|ten|mc)`;
/**
 * A line that opens like an author list: a name, then `,`, ` and `, or the
 * `.` that ends a one-name author (an organisation: `Anthropic.`). At most
 * five tokens before it, so a title line (`A Promising Path Towards …`) does
 * not read as one.
 */
const AUTHOR_START = new RegExp(
  String.raw`^(?:${NAME_TOKEN})(?:\s+${NAME_TOKEN}){0,4}(?:,\s+\p{Lu}|\s+and\s+\p{Lu}|\s+\(eds?\.\)\.|\.\s+\S)`,
  "u",
);
/** Line openings that continue an entry, never start one. */
const NOT_A_START = /^(?:In|URL|doi|DOI|ISBN|Proceedings|pp\.|vol\.|Vol\.|Springer|IEEE|ACM|arXiv:)\b/;

/** Split the list's lines into entries. */
export function splitEntries(lines: readonly string[], style: ListStyle = detectStyle(lines)): RawEntry[] {
  const out: RawEntry[] = [];
  if (style === "bracket" || style === "dotted") {
    const re = style === "bracket" ? /^\[(\d+)\]\s*(.*)$/ : /^(\d+)\.\s+(.*)$/;
    for (const l of lines) {
      const m = re.exec(l);
      const expected = out.length ? out[out.length - 1].n + 1 : undefined;
      if (m && (expected === undefined || Number(m[1]) === expected)) {
        out.push({ n: Number(m[1]), lines: m[2] ? [m[2]] : [] });
      } else if (out.length) {
        out[out.length - 1].lines.push(l);
      }
    }
    return out;
  }
  for (const l of lines) {
    const prev = out.length ? out[out.length - 1].lines.at(-1) ?? "" : "";
    const prevTok = /\S*$/.exec(prev)?.[0] ?? "";
    const closed = /\.$/.test(prev) && !INITIAL.test(prevTok) && !/^\(?(?:al|eds?|vol|pp|no|Proc|Conf|Int|J|Inc|Ltd|Co)\.\)?\.?$/.test(prevTok);
    const starts = !out.length || (closed && !NOT_A_START.test(l) && AUTHOR_START.test(l));
    if (starts) out.push({ n: out.length + 1, lines: [l] });
    else out[out.length - 1].lines.push(l);
  }
  return out;
}

// ── Rejoining lines ─────────────────────────────────────────────────────────

/** The words of a document, lower-cased: the evidence a hyphen is rejoined on. */
export function vocabulary(docLines: readonly string[]): Set<string> {
  const v = new Set<string>();
  for (const l of docLines) for (const m of l.matchAll(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu)) v.add(m[0].toLowerCase());
  return v;
}

/** Marks an undecidable line-break hyphen; a field containing it is not set. */
export const UNSURE = "\u0000";

const URL_HEAD = /(?:https?:\/\/|https?:$|doi\.org\/|10\.\d{4,9}\/)\S*$/;
const URL_BREAK_AFTER = /[/.:_\-?=&#~]$/;
const URL_PIECE = /^[\w./?=&%#~:+-]*[./][\w./?=&%#~:+-]*/;

/**
 * The entry's lines joined into one text for PARSING (the note is joined
 * plainly). A URL broken after its own punctuation is rejoined; a URL cut
 * mid-word is marked {@link UNSURE}. A hyphen at a line end is kept or
 * dropped on the vocabulary's evidence, and is {@link UNSURE} without it.
 */
export function joinForParsing(lines: readonly string[], vocab: ReadonlySet<string>): string {
  let text = lines[0] ?? "";
  for (const next of lines.slice(1)) {
    const lastTok = /\S*$/.exec(text)?.[0] ?? "";
    const inUrl = URL_HEAD.test(lastTok) || /^\S*(?:https?:|doi\.org)/.test(lastTok);
    if (inUrl) {
      const firstTok = (/^\S*/.exec(next)?.[0] ?? "").replace(/[.,;]$/, "");
      const continuation =
        !/^(?:arXiv:|doi:)/i.test(next) &&
        (/^[\p{Ll}\d/]/u.test(next) || (/^[\w./?=&%#~:+-]+$/.test(firstTok) && /[\d/:=?&]/.test(firstTok)));
      if (URL_BREAK_AFTER.test(lastTok) && continuation) {
        text += next;
        continue;
      }
      if (/[/_\-:=?&#~]$/.test(lastTok) && /^\w[\w./?=&%#~:+-]*$/.test(firstTok)) {
        // Broken after its own punctuation, and the next line does not read as the rest: the URL's end is not knowable.
        text = text.slice(0, text.length - lastTok.length) + UNSURE + " " + next;
        continue;
      }
      if (/\w$/.test(lastTok) && continuation && URL_PIECE.test(next)) {
        // Cut mid-word (`github.c` / `om/…`): the break could be either side of a character.
        text = text.slice(0, text.length - lastTok.length) + UNSURE + " " + next;
        continue;
      }
      text += " " + next;
      continue;
    }
    const hy = /([\p{L}]+)-$/u.exec(text);
    const tail = /^([\p{L}]+)/u.exec(next);
    if (hy && tail) {
      const joined = (hy[1] + tail[1]).toLowerCase();
      const hyphened = `${hy[1]}-${tail[1]}`.toLowerCase();
      const hasJoined = vocab.has(joined);
      const hasHyphened = [...vocab].some((w) => w === hyphened || w.startsWith(`${hyphened}-`) || w.endsWith(`-${hyphened}`));
      if (hasJoined && !hasHyphened) text = text.slice(0, -1) + next;
      else if (hasHyphened && !hasJoined) text += next;
      else text = text.slice(0, -1) + UNSURE + next;
      continue;
    }
    text += " " + next;
  }
  return text;
}

// ── Parsing the fields ──────────────────────────────────────────────────────

export interface CslName {
  family?: string;
  given?: string;
  literal?: string;
}

export interface ReferenceNode {
  $schema: typeof REFERENCE_SCHEMA_TAG;
  id: string;
  type: string;
  title?: string;
  author?: CslName[];
  issued?: { "date-parts": number[][] };
  DOI?: string;
  URL?: string;
  note: string;
  provenance: "extracted";
  derivedFrom: string;
}

const trimUrl = (u: string) => u.replace(/[.,;)\]]+$/, "");

/** Every URL in the parse text that is whole (no {@link UNSURE} in it). */
export function urlsOf(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/https?:\/\/[^\s\u0000[\]()<>"]+(\u0000)?/g)) {
    if (m[1]) continue;
    out.push(trimUrl(m[0]));
  }
  return [...new Set(out)];
}

/** The DOI: from a doi.org URL first (it survives the PDF intact more often), else a `doi:` label. */
export function doiOf(text: string, urls: readonly string[]): string | undefined {
  const fromUrls = new Set(urls.map((u) => /^https?:\/\/(?:dx\.)?doi\.org\/(10\.\d{4,9}\/\S+)$/i.exec(u)?.[1]).filter((d): d is string => !!d));
  if (fromUrls.size === 1) return [...fromUrls][0];
  if (fromUrls.size > 1) return undefined;
  const labelled = new Set<string>();
  for (const m of text.matchAll(/\bdoi:\s*(10\.\d{4,9}\/[^\s\u0000]+)(\s+\d+\b)?/gi)) {
    // `10.1007/978-3-030-79876-5 37`: the PDF lost an underscore, and the DOI is not knowable.
    if (m[2] || m[0].includes(UNSURE)) return undefined;
    labelled.add(trimUrl(m[1]));
  }
  for (const m of text.matchAll(/(?:^|\s)DOI:\s*(10\.\d{4,9}\/[^\s\u0000]+)/g)) labelled.add(trimUrl(m[1]));
  return labelled.size === 1 ? [...labelled][0] : undefined;
}

/** The arXiv id, when the entry names exactly one. */
export function arxivOf(text: string, urls: readonly string[], doi: string | undefined): string | undefined {
  const ids = new Set<string>();
  const NEW = String.raw`(\d{4}\.\d{4,5})(?:v\d+)?`;
  for (const m of text.matchAll(new RegExp(String.raw`\barXiv:\s?${NEW}(?![\d.])`, "gi"))) ids.add(m[1]);
  for (const m of text.matchAll(new RegExp(String.raw`\b(?:CoRR|ArXiv),?\s+abs/${NEW}(?![\d.])`, "g"))) ids.add(m[1]);
  for (const u of urls) {
    const m = new RegExp(String.raw`arxiv\.org/(?:abs|pdf)/${NEW}$`, "i").exec(u.replace(/\.pdf$/, ""));
    if (m) ids.add(m[1]);
  }
  const d = doi && new RegExp(String.raw`^10\.48550/arXiv\.${NEW}$`, "i").exec(doi);
  if (d) ids.add(d[1]);
  return ids.size === 1 ? [...ids][0] : undefined;
}

const MONTH = String.raw`(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?`;
const YEAR = new RegExp(String.raw`(?:^|[\s(,])(?:${MONTH}\s+)?((?:19|20)\d\d)[a-z]?(?=[).,;:]|$|\s)`, "g");

/** The text with what is not prose removed: URLs, DOIs, arXiv ids, access dates, volume and page numbers. */
function proseOnly(text: string): string {
  return text
    .replace(/\S*https?:\/\/\S*/g, " ")
    .replace(/\b10\.\d{4,9}\/\S+/g, " ")
    .replace(/\barXiv:\s?\S+/gi, " ")
    .replace(/\babs\/\S+/g, " ")
    .replace(/accessed:?\s*\d{4}-\d{2}-\d{2}/gi, " ")
    .replace(/\b(?:vol|no|pp|p|Vol|Volume|volume)\.?\s+\d+/g, " ")
    .replace(/\d+\s*[–-]\s*\d+/g, " ");
}

/** The publication year, when the entry gives one unambiguously. */
export function yearOf(text: string, styleYear?: number): number | undefined {
  if (styleYear !== undefined) return styleYear;
  const years = new Set<number>();
  for (const m of proseOnly(text).matchAll(YEAR)) years.add(Number(m[1]));
  return years.size === 1 ? [...years][0] : undefined;
}

const PARTICLE = /^(?:de|van|von|der|den|da|dos|del|di|du|la|le|ten)$/;
const INITIAL = /^(?:\p{Lu}\.?(?:-?\p{Lu}\.?)*|\p{Lu}\.-\p{Lu}\.)$/u;
const WORD = /^\p{Lu}[\p{L}'’]*(?:-\p{Lu}?[\p{L}'’]+)*$/u;

/** One `Given Family` name, or undefined when it does not parse. */
export function parseGivenFamily(raw: string): CslName | undefined {
  const s = raw.replace(/\s+/g, " ").trim();
  if (!s || s.includes(UNSURE) || /[´¨`˜^¸]/.test(s)) return undefined;
  const toks = s.split(" ");
  if (toks.length < 2 || toks.length > 5) return undefined;
  if (!toks.every((t) => INITIAL.test(t) || WORD.test(t) || PARTICLE.test(t))) return undefined;
  const last = toks[toks.length - 1];
  if (!WORD.test(last) || INITIAL.test(last)) return undefined;
  // Family is the last word, with any particles before it; given is what precedes.
  let i = toks.length - 1;
  while (i > 0 && PARTICLE.test(toks[i - 1])) i--;
  const given = toks.slice(0, i);
  if (!given.length) return undefined;
  // `Given Middle Family` with no initial is a two-word family as often as not (Aspuru Mijares): not knowable.
  const words = given.filter((t) => !INITIAL.test(t));
  if (words.length > 1 && i === toks.length - 1) return { literal: s };
  return { family: toks.slice(i).join(" "), given: given.join(" ") };
}

/**
 * A `Given Family, Given Family, and Given Family` author list. Every name
 * must parse; a trailing `et al.` is dropped (the list is as long as the
 * paper printed it). One name that is not initials-first is kept whole as
 * `literal`: `Google DeepMind` and `Patrick Massot` read alike.
 */
export function parseGivenFamilyList(block: string): CslName[] | undefined {
  let s = block.replace(/\s+/g, " ").trim().replace(/,$/, "");
  if (!s || s.includes(UNSURE) || /\(eds?\.?\)|\beds?\.$/.test(s)) return undefined;
  s = s.replace(/,?\s+et al\.?$/, "");
  const parts = s.split(/,\s+and\s+|\s+and\s+|,\s+/).filter(Boolean);
  if (parts.length === 1) {
    const one = parts[0];
    if (/[´¨`˜^¸]/.test(one) || one.split(" ").length > 5 || !/^\p{Lu}|^[a-z]+\p{Lu}/u.test(one)) return undefined;
    if (INITIAL.test(one.split(" ")[0]) && one.split(" ").length > 1) {
      const n = parseGivenFamily(one);
      return n ? [n] : undefined;
    }
    return [{ literal: one }];
  }
  const names = parts.map(parseGivenFamily);
  return names.every((n): n is CslName => !!n) ? names : undefined;
}

/** A `Family, I.I., Family, I.` list (Springer LNCS). */
export function parseFamilyInitialsList(block: string): CslName[] | undefined {
  const s = block.replace(/\s+/g, " ").trim().replace(/,?\s+et al\.?$/, "");
  if (!s || s.includes(UNSURE) || /[´¨`˜^¸]/.test(s)) return undefined;
  const re = /\s*((?:\p{Lu}[\p{L}'’-]*\s)*\p{Lu}[\p{L}'’-]*),\s((?:\p{Lu}[\p{L}]?\.\s?-?)+)(?:,|$)/uy;
  const out: CslName[] = [];
  let at = 0;
  while (at < s.length) {
    re.lastIndex = at;
    const m = re.exec(s);
    if (!m) return undefined;
    out.push({ family: m[1], given: m[2].trim() });
    at = re.lastIndex;
  }
  return out.length ? out : undefined;
}

/** A title, when it is plainly one. */
function cleanTitle(t: string | undefined): string | undefined {
  if (!t) return undefined;
  const s = t.replace(/\s+/g, " ").trim().replace(/[,.]$/, "").trim();
  if (s.includes(UNSURE) || s.length < 4 || s.length > 300 || /https?:|\bdoi:/i.test(s)) return undefined;
  if (s.split(" ").length < 2 && !/:/.test(s)) return undefined;
  const opens = (s.match(/[([{]/g) ?? []).length;
  const closes = (s.match(/[)\]}]/g) ?? []).length;
  if (opens !== closes || /^(?:In|in)\s/.test(s) || /^arXiv preprint/i.test(s)) return undefined;
  // Series and pages are the venue's, not the title's: the boundary was missed.
  if (/\bvolume \d+\b|\bLecture Notes\b|\bpp\.\s|\bProceedings\b/i.test(s)) return undefined;
  return s;
}

/** Where the author block ends in `Authors. Title. Venue`: the first `.` that does not close an initial. */
function authorBlockEnd(text: string): number | undefined {
  for (const m of text.matchAll(/\.(?=\s|$)/g)) {
    const before = text.slice(0, m.index);
    const tok = /\S+$/.exec(before)?.[0] ?? "";
    if (INITIAL.test(tok) || /^\(?eds?$/.test(tok) || /^(?:Jr|Sr|Wm|Chas|Geo|Jas|Jos|Th|St)$/.test(tok)) continue;
    if (/\(eds?$/.test(tok)) continue;
    return m.index;
  }
  return undefined;
}

/** The next sentence end from `from`: `.`, `?` or `!` followed by a space and something, or the end. */
function sentenceEnd(text: string, from: number): number | undefined {
  const re = /[.?!](?=\s+\S|$)/g;
  re.lastIndex = from;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const tok = /\S+$/.exec(text.slice(from, m.index + 1))?.[0] ?? "";
    // A title's own abbreviations (`vs.`, `e.g.`, `Proc.`) are rare; initials and `et al.` are not titles.
    if (/^(?:vs|e\.g|i\.e|Vol|vol|No|no)\.$/.test(tok)) continue;
    return m.index;
  }
  return undefined;
}

export interface Parsed {
  title?: string;
  author?: CslName[];
  year?: number;
}

/** The style-specific fields of one entry: title, authors, and a year where the style fixes its place. */
/** `Authors. YEAR. Title.`: the ACM reference format's year, right after the author list. */
const ACM_SHAPE = /^(.+?)\.\s((?:19|20)\d\d)[a-z]?\.\s/u;

/** Whether an entry plainly has the ACM shape: its author list ends exactly where the year follows. */
export function isAcmShaped(text: string): boolean {
  const m = ACM_SHAPE.exec(text);
  return !!m && !/[“”]/.test(m[1]) && authorBlockEnd(text) === m[1].length;
}

/**
 * The style-specific fields of one entry: title, authors, and a year where
 * the style fixes its place. `acm` says the LIST is in the ACM format (most of
 * its entries plainly are), so an entry whose author list holds a non-initial
 * abbreviation (`Frank Wm. Tompa`) is still read as one, not cut at the `.`.
 */
export function parseShape(text: string, docStyle: ListStyle, acm = false): Parsed {
  // IEEE: `A. Author, B. Author, and C. Author, “Title,” in Venue, YEAR.`
  const quoted = [...text.matchAll(/“([^”]+)”/g)];
  if (quoted.length === 1) {
    const q = quoted[0];
    const block = text.slice(0, q.index).trim();
    return { title: cleanTitle(q[1]), author: parseGivenFamilyList(block) };
  }
  // Springer LNCS: `Author, A., Author, B.: Title. Venue (YEAR)`
  const lncs = /^((?:[^:.]+?,\s(?:\p{Lu}[\p{L}]?\.\s?-?)+,?\s?)+(?:et al\.)?):\s/u.exec(text);
  if (docStyle === "dotted" && lncs) {
    const rest = text.slice(lncs[0].length);
    const end = sentenceEnd(rest, 0);
    const paren = new Set([...proseOnly(rest).matchAll(/\((?:[^()]*\s)?((?:19|20)\d\d)\)/g)].map((m) => Number(m[1])));
    return {
      author: parseFamilyInitialsList(lncs[1]),
      title: cleanTitle(end === undefined ? undefined : rest.slice(0, end)),
      year: paren.size === 1 ? [...paren][0] : undefined,
    };
  }
  if (docStyle === "dotted") return {};
  // ACM: `Authors. YEAR. Title. Venue`
  const a = ACM_SHAPE.exec(text);
  if (a && (acm ? !/[“”]/.test(a[1]) : isAcmShaped(text))) {
    const rest = text.slice(a[0].length);
    const end = sentenceEnd(rest, 0);
    return {
      author: parseGivenFamilyList(a[1]),
      title: cleanTitle(end === undefined ? undefined : rest.slice(0, end)),
      year: Number(a[2]),
    };
  }
  if (acm) return {};
  // natbib / plainnat: `Authors. Title. Venue, YEAR.` or `Authors. Title, Month YEAR. URL …`
  const aEnd = authorBlockEnd(text);
  if (aEnd === undefined) return {};
  const block = text.slice(0, aEnd);
  const restStart = aEnd + 1 + (/^\s*/.exec(text.slice(aEnd + 1))?.[0].length ?? 0);
  const tEnd = sentenceEnd(text, restStart);
  let title = tEnd === undefined ? undefined : text.slice(restStart, tEnd);
  // A misc entry puts its date after the title: `Title, November 2025.`
  if (title) title = title.replace(new RegExp(String.raw`,\s+(?:${MONTH}\s+)?(?:19|20)\d\d[a-z]?$`), "");
  return { author: parseGivenFamilyList(block), title: cleanTitle(title) };
}

const JOURNAL_WORD = /\b(?:Journal|Transactions|Letters|Annals|Ann\.|Bull\.|Nature|Procedia|Studies|Magazine|Newsletter|Doklady|Computation)\b/;
const VOLUME_SHAPE = /\b\d+\s*\(\d+\)\s*[:,]|\b\d+,\s*\d+\s*\((?:\w+\s)?\d{4}\)|\s\d+\s\((?:\w+\s)?\d{4}\)|\bvol\.\s*\d+/i;
const NOT_JOURNAL = /\b(?:Proc\.|Proceedings|Conference|Conf\.|Workshop|Symposium|arXiv|CoRR|preprint|thesis|In:|Advances in Neural Information Processing|OpenReview)|(?:^|[,.”]\s*)in\s/i;

/** `article-journal` when the entry plainly names a journal issue, else `document`. */
export function typeOf(text: string): "article-journal" | "document" {
  if (NOT_JOURNAL.test(text)) return "document";
  return JOURNAL_WORD.test(text) || VOLUME_SHAPE.test(text) ? "article-journal" : "document";
}

// ── One document ────────────────────────────────────────────────────────────

/** The PDF's typographic ligatures (`ﬁ`, `ﬂ`…) as the letters they stand for: parsed fields only, never the note. */
export const unligature = (s: string): string => s.replace(/[\uFB00-\uFB06]/g, (c) => c.normalize("NFKC"));

/** The repo-relative path of a file in this instance: `folio-assistant-sci/library/…`. */
export function repoPath(file: string, instanceRoot: string = INSTANCE_ROOT): string {
  return [basename(instanceRoot), ...relative(instanceRoot, file).split(/[\\/]/)].join("/");
}

/** The nodes for one library document's reference list. */
export function extractList(list: ReferenceList, instanceRoot: string = INSTANCE_ROOT): ReferenceNode[] {
  const lines = stripFurniture(list.lines, list.docLines);
  const style = detectStyle(lines);
  const vocab = vocabulary(list.docLines.map(unligature));
  const derivedFrom = repoPath(list.file, instanceRoot);
  const entries = splitEntries(lines, style).map((e) => ({
    e,
    note: e.lines.join(" ").replace(/\s+/g, " ").trim(),
    text: joinForParsing(e.lines.map(unligature), vocab).replace(/[ \t]+/g, " ").trim(),
  }));
  const acm = entries.filter((x) => isAcmShaped(x.text)).length >= 0.6 * entries.length;
  return entries.map(({ e, note, text }) => {
    const shape = parseShape(text, style, acm);
    const urls = urlsOf(text);
    const DOI = doiOf(text, urls);
    const arxiv = arxivOf(text, urls, DOI);
    const URL = urls.length === 1 ? urls[0] : arxiv && urls.length === 0 ? `https://arxiv.org/abs/${arxiv}` : undefined;
    const year = yearOf(shape.title ? text.replace(shape.title, " ") : text, shape.year);
    const node: ReferenceNode = {
      $schema: REFERENCE_SCHEMA_TAG,
      id: `${list.docId}.r${e.n}`,
      type: typeOf(note),
      ...(shape.title ? { title: shape.title } : {}),
      ...(shape.author?.length ? { author: shape.author } : {}),
      ...(year !== undefined ? { issued: { "date-parts": [[year]] } } : {}),
      ...(DOI ? { DOI } : {}),
      ...(URL ? { URL } : {}),
      note,
      provenance: "extracted",
      derivedFrom,
    };
    return node;
  });
}

// ── The whole library ───────────────────────────────────────────────────────

export interface Plan {
  /** File name → content, for every node the run writes. */
  files: Map<string, string>;
  /** Per document: its id, the section read, and how many entries. */
  documents: { docId: string; file: string; entries: number }[];
}

export function plan(libraryDir: string, instanceRoot: string = INSTANCE_ROOT): Plan {
  const files = new Map<string, string>();
  const documents: Plan["documents"] = [];
  const docs = readdirSync(libraryDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  for (const doc of docs) {
    const list = findReferenceList(join(libraryDir, doc));
    if (!list) continue;
    const nodes = extractList(list, instanceRoot);
    if (!nodes.length) continue;
    documents.push({ docId: doc, file: repoPath(list.file, instanceRoot), entries: nodes.length });
    for (const n of nodes) {
      if (files.has(`${n.id}.json`)) throw new Error(`two entries with key ${n.id}`);
      files.set(`${n.id}.json`, `${JSON.stringify(n, null, 2)}\n`);
    }
  }
  return { files, documents };
}

/** Write the plan (or compare it, with `check`). Returns the paths that differ. */
export function apply(p: Plan, outDir: string, check: boolean): string[] {
  const differ: string[] = [];
  const present = existsSync(outDir) ? readdirSync(outDir).filter((f) => f.endsWith(".json")) : [];
  for (const [f, body] of p.files) {
    const at = join(outDir, f);
    const now = existsSync(at) ? readFileSync(at, "utf-8") : undefined;
    if (now === body) continue;
    differ.push(f);
    if (!check) {
      mkdirSync(outDir, { recursive: true });
      writeFileSync(at, body);
    }
  }
  for (const f of present) {
    if (p.files.has(f)) continue;
    differ.push(f);
    if (!check) rmSync(join(outDir, f));
  }
  return differ;
}

function main(): number {
  const check = process.argv.includes("--check");
  const library = instanceDirectoryForGraph(INSTANCE_ROOT, "library");
  const out = instanceDirectoryForGraph(INSTANCE_ROOT, "references");
  if (!library || !existsSync(library)) {
    console.error("extract-references: this instance declares no library directory, or it is absent");
    return 2;
  }
  if (!out) {
    console.error("extract-references: this instance declares no `references` directory to write to");
    return 2;
  }
  const p = plan(library);
  const differ = apply(p, out, check);
  const total = p.documents.reduce((a, d) => a + d.entries, 0);
  for (const d of p.documents) console.log(`  ${d.docId}: ${d.entries} entries from ${d.file}`);
  if (check) {
    if (differ.length) {
      console.error(`extract-references --check: ${differ.length} file(s) differ from what the library gives, e.g. ${differ.slice(0, 5).join(", ")}. Run without --check and commit.`);
      return 1;
    }
    console.log(`extract-references --check: ${total} entries from ${p.documents.length} papers, in step.`);
    return 0;
  }
  console.log(`extract-references: ${total} entries from ${p.documents.length} papers; ${differ.length} file(s) written or removed.`);
  return 0;
}

if (import.meta.main) process.exit(main());
