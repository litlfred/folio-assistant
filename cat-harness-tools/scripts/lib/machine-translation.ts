/**
 * The checks every candidate translation passes, whatever produced it.
 *
 * @module scripts/lib/machine-translation
 * @covers translation-sources
 *
 * The owner, 2026-11-14: an open machine-translation step with no freemium
 * API quota, whose output is a set of CANDIDATES per string that a reviewer
 * chooses among (`translation-candidates/v1`, defined in
 * `translation-adjudication.ts`). The engines are adapters in
 * `translation-sources/`, and the shared writer is `translation-candidates.ts`.
 * This module holds what is common to all of them:
 *
 *   - **Placeholders and markup must round-trip** ({@link placeholderProblem}).
 *     `{name}`, `{{x}}`, `%s`, `%(x)s`, `%1$s`, tags (`<a0>…</a0>`, `<slug>`),
 *     code spans, link targets, URLs and entities are compared as multisets,
 *     along with the number of line breaks. A candidate that fails is not
 *     recorded, and the failure is reported.
 *   - **Masking** ({@link maskPlaceholders}): before translation each
 *     placeholder becomes `[0]`, `[1]`, …, so an engine has no reason to
 *     translate it. The check still runs on the restored text.
 *   - **Surrounding whitespace** is cut off before translation and put back
 *     after ({@link splitWhitespace}).
 *   - **Which entries are translated** ({@link entriesToTranslate}): an empty
 *     or fuzzy `msgstr`, never a plural entry.
 *   - **Starting a catalogue** from its template ({@link poFromPot}), and the
 *     author's `DO NOT MACHINE-FILL` opt-out ({@link forbidsMachineFill}).
 */
import { poEntries } from "./translation-adjudication.ts";

// ── Placeholders and markup ──────────────────────────────────────────────

/**
 * Every token that must come back from the engine unchanged. Alternation order
 * matters only when two alternatives start at the same position: a code span
 * is taken whole before anything inside it, `{{x}}` before `{x}`.
 */
const TOKEN = new RegExp(
  [
    "`[^`\\n]+`", // inline code span
    "\\{\\{[^{}]*\\}\\}", // {{ jinja / liquid }}
    "\\{[^{}\\s]*\\}", // {name}, {0}, {}
    "%%", // a literal percent sign in a printf string
    "%\\d+\\$[-+#0]*\\d*(?:\\.\\d+)?[diouxXeEfFgGcsa]", // %1$s
    "%\\([^)\\s]+\\)[-+#0]*\\d*(?:\\.\\d+)?[diouxXeEfFgGcrsa]", // %(name)s
    "%[-+#0]*\\d*(?:\\.\\d+)?[hlLqjzt]*[diouxXeEfFgGcsa@]", // %s, %d, %.2f, %@
    "</?[A-Za-z][\\w.:-]*(?:\\s[^<>]*)?/?>", // <a0>, </a0>, <br/>, <slug>
    "\\]\\([^)\\s]+\\)", // a Markdown link target](url)
    "https?://[^\\s<>()\\]]+", // a bare URL
    "&(?:[a-zA-Z]+|#\\d+|#x[0-9a-fA-F]+);", // HTML entities
  ].join("|"),
  "g",
);

/** The placeholders and markup tokens of a string, sorted (a multiset). */
export function placeholders(s: string): string[] {
  return (s.match(TOKEN) ?? []).sort();
}

/**
 * Why `translation` does not keep what `source` must keep, or `undefined` when
 * it does: the same placeholder multiset and the same number of line breaks.
 */
export function placeholderProblem(source: string, translation: string): string | undefined {
  if (translation.trim() === "") return "the engine returned nothing";
  const a = placeholders(source);
  const b = placeholders(translation);
  if (a.length !== b.length || a.some((t, i) => t !== b[i])) {
    const missing = a.filter((t) => !b.includes(t));
    const extra = b.filter((t) => !a.includes(t));
    const parts = [
      missing.length ? `lost ${missing.map((t) => JSON.stringify(t)).join(", ")}` : "",
      extra.length ? `added ${extra.map((t) => JSON.stringify(t)).join(", ")}` : "",
    ].filter(Boolean);
    return `placeholders do not round-trip${parts.length ? ` (${parts.join("; ")})` : " (counts differ)"}`;
  }
  const nl = (x: string) => (x.match(/\n/g) ?? []).length;
  if (nl(source) !== nl(translation)) return `line breaks do not round-trip (${nl(source)} → ${nl(translation)})`;
  return undefined;
}

/** A string cut into its leading whitespace, its core, and its trailing whitespace. */
export function splitWhitespace(s: string): { lead: string; core: string; trail: string } {
  const lead = /^\s*/.exec(s)![0];
  const rest = s.slice(lead.length);
  const trail = /\s*$/.exec(rest)![0];
  return { lead, core: rest.slice(0, rest.length - trail.length), trail };
}

// ── Masking ──────────────────────────────────────────────────────────────

/**
 * Replace every placeholder with a numbered stand-in, `[0]`, `[1]`, …, so the
 * engine sees plain text it has no reason to translate. A number whose
 * stand-in already occurs in the text is skipped, so restoring never touches
 * the source's own brackets.
 *
 * Masking only raises how many strings get through; it proves nothing. The
 * restored text still goes through {@link placeholderProblem}, so an engine
 * that drops, duplicates or rewrites a stand-in leaves the string empty.
 */
export function maskPlaceholders(s: string): { masked: string; tokens: Map<string, string> } {
  const tokens = new Map<string, string>();
  let n = 0;
  const masked = s.replace(TOKEN, (t) => {
    while (s.includes(`[${n}]`)) n++;
    const key = `[${n++}]`;
    tokens.set(key, t);
    return key;
  });
  return { masked, tokens };
}

/** Put the placeholders back. Tolerates the spaces an engine may add inside a stand-in (`[ 0 ]`). */
export function unmaskPlaceholders(s: string, tokens: Map<string, string>): string {
  if (tokens.size === 0) return s;
  return s.replace(/\[\s*(\d+)\s*\]/g, (m, d: string) => tokens.get(`[${d}]`) ?? m);
}

// ── Starting a catalogue ─────────────────────────────────────────────────

/**
 * A new `.po` for `locale`, from its template: the POT's text with the header
 * naming the locale and declaring itself unofficial (`X-Folio-Official: no`,
 * read by `check-translation-officiality.ts`). Every `msgstr` stays as the
 * template has it, which is empty.
 */
export function poFromPot(pot: string, locale: string): string {
  const lines = pot.split("\n");
  const header = poHeaderRange(lines);
  if (!header) throw new Error("the template has no header entry (msgid \"\")");
  const [from, to] = header;
  const body = lines.slice(from, to).filter((l) => !/^"(Language|X-Folio-Official):/.test(l));
  const extra = [`"Language: ${locale}\\n"`, `"X-Folio-Official: no\\n"`];
  return [...lines.slice(0, from), ...body, ...extra, ...lines.slice(to)].join("\n");
}

/** Lines `[start, end)` of the header's `msgstr` continuation strings. */
function poHeaderRange(lines: string[]): [number, number] | undefined {
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i] === 'msgid ""' && /^msgstr ""\s*$/.test(lines[i + 1]!)) {
      let k = i + 2;
      while (k < lines.length && lines[k]!.startsWith('"')) k++;
      return [i + 2, k];
    }
    if (lines[i]!.startsWith("msgid ") && lines[i] !== 'msgid ""') return undefined;
  }
  return undefined;
}

// ── What to translate ────────────────────────────────────────────────────

/** One entry a candidate source is asked to translate. */
export interface Wanted {
  msgctxt?: string;
  msgid: string;
  /** The entry's `msgstr` is empty, so its first good candidate may fill it. */
  empty: boolean;
}

/** An entry or candidate left out, with the reason. */
export interface Skipped {
  msgctxt?: string;
  msgid: string;
  reason: string;
}

/**
 * The entries of a catalogue worth candidates: an EMPTY `msgstr` (which the
 * first good candidate fills) or a FUZZY one (which a reviewer may replace
 * with a candidate). A reviewed translation is not re-translated. Plural
 * entries are reported and skipped: one string cannot supply the three or
 * six forms some languages need.
 */
export function entriesToTranslate(po: string): { wanted: Wanted[]; skipped: Skipped[] } {
  const wanted: Wanted[] = [];
  const skipped: Skipped[] = [];
  const seen = new Set<string>();
  for (const e of poEntries(po)) {
    const empty = e.msgstr === "";
    if (!empty && !e.fuzzy) continue;
    const ctx = e.msgctxt !== undefined ? { msgctxt: e.msgctxt } : {};
    if (e.msgidPlural !== undefined) {
      if (empty) skipped.push({ ...ctx, msgid: e.msgid, reason: "plural entry: its forms are left for a person" });
      continue;
    }
    if (e.msgid.trim() === "") continue;
    const key = entryKey(e.msgctxt, e.msgid);
    if (seen.has(key)) continue;
    seen.add(key);
    wanted.push({ ...ctx, msgid: e.msgid, empty });
  }
  return { wanted, skipped };
}

/** The key gettext itself uses for an entry: context, EOT, msgid. */
export function entryKey(msgctxt: string | undefined, msgid: string): string {
  return `${msgctxt ?? ""}\u0004${msgid}`;
}

/** Whether the catalogue's own comments forbid machine filling. */
export function forbidsMachineFill(po: string): boolean {
  return /^#.*\bDO NOT MACHINE-FILL\b/im.test(po);
}

/**
 * Check one candidate for a source string: the engine's text is trimmed, the
 * placeholders must round-trip, and the source's surrounding whitespace is
 * put back. Returns the text to record, or why it is refused.
 */
export function checkedCandidate(msgid: string, text: string): { text: string } | { refused: string } {
  const { lead, core, trail } = splitWhitespace(msgid);
  const t = text.trim();
  const problem = placeholderProblem(core, t);
  if (problem) return { refused: problem };
  return { text: lead + t + trail };
}
