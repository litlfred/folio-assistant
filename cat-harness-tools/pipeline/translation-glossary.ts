/**
 * Glossary consistency of an instance's translations, against a term base
 * merged from the glossaries of the layers it mounts.
 *
 * Owner, 2026-11-06, for the translation watcher: the layered glossaries
 * provide precedence for fixed translation terms. The rules are ported from
 * the instance-side `tools/translation/glossary_qa.py` (smart-trust-demo #54,
 * by the EN translation team) and made generic: every path comes from a
 * declaration, and no instance is named here.
 *
 * ## The term base, and which layer wins
 *
 * A term's translation in a locale is FIXED by the first glossary that
 * translates it, in this order:
 *
 * 1. reference glossaries named with `--layer <name>=<pattern>` (normative
 *    content, such as a WHO glossary, outranks the platform);
 * 2. the layers of the instance's `needs` chain, deepest (most authoritative)
 *    first — `declarationChain`, the order every layered reader here uses;
 * 3. the instance's own glossaries, last: they may ADD terms, never change one.
 *
 * In each layer the glossaries are its declared `translation-sources`
 * directory's `<locale>/glossary/<owner>--<scheme>.po` (the per-scheme
 * catalogues `glossary:pot` writes) and `<locale>/glossary.po` (the
 * hand-authored terminology file). A scheme catalogue is ranked by the layer
 * that OWNS the scheme (its `<owner>--` prefix), not by the layer that hosts
 * the file: cat-harness hosts bootstrap's terms, and bootstrap is the lower
 * layer.
 *
 * What fixes a term: a label (a scheme entry whose `#.` comment says "Glossary
 * term label" or "alternative label"; in `glossary.po`, any short entry that is
 * not a sentence) under 60 characters, with a non-empty msgstr, not marked
 * `#, localised` (which says the term is localised, not how) and not fuzzy.
 *
 * ## Scope: a fixed term binds only within its subject area
 *
 * The platform's terms (bootstrap's Reference, Actor, Skill; cat-harness's
 * policy) carry no sense of their own, so applying them as fixed translations
 * to health content gives wrong answers — FHIR `Reference(...)`, IHE "actors",
 * health "policy" (政策, not the harness's 策略). The owner chose "scoped fixed
 * terms" (`folio-glossary/v1`, 2026-11-07): a scheme, or a
 * term, declares the subject area its translations bind in (`subject`,
 * `dcterms:subject`); a term's own overrides its scheme's; with neither, the
 * term binds only in its own scheme (`<instance>--<scheme id>`). Only
 * `authored` terms fix anything. `scopeNote` is prose and is never compared.
 * The glossary is read as data from the file each scheme catalogue's `#:`
 * names, since its schema belongs to a layer above this one.
 *
 * Precedence applies within one subject area. A term binds the instance's
 * catalogues when its area is one of the instance's own (its glossaries'
 * subjects and schemes, its terminology file), or it came from a `--layer`
 * reference glossary, whose area is every area. A label that matches a term of
 * another area is a SENSE CHECK note for a person: printed, counted in the
 * summary, never a violation.
 *
 * ## What is flagged, per locale
 *
 * - `not-fixed-rendering`: a msgid uses an in-scope fixed term (prefLabel or
 *   altLabel; whole word; case-insensitive, except a short all-caps acronym)
 *   and its msgstr does not use the term's fixed translation. Matching is by
 *   word stem (ru, ar, fr, es) or substring (zh, ar), as the prior art did.
 * - `inconsistent`: a term that two or more of the instance's entries — whose
 *   whole msgid is the term — render differently in one locale.
 * - `override`: a second, different translation of a fixed term in the SAME
 *   subject area (or of a reference glossary's term). The instance translating
 *   another area's label otherwise is a sense check.
 *
 * Exit: 0 clean, 1 on findings, 2 when it cannot determine (no declared
 * `translation-sources`, an unknown locale). Without `--check` the result is
 * also written as `glossary-consistency.qa-results.json` (`qa-results/v1`, one
 * family per locale) in the instance's QA directory, where `kg-qa-report`
 * reads it into its "Glossary consistency" section.
 *
 * Usage:
 *   bun run cat translation:glossary:check --instance <dir> --locale fr [--layer who=<dir>/{locale}/*.po]
 *   bun run cat translation:glossary --instance <dir>        # every locale; writes the record
 *
 * @module pipeline/translation-glossary
 * @covers translation-sources, qa
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

import { directoryForGraph, readDeclaration } from "../schemas/kg/cat-harness.ts";
import { declarationChain } from "../schemas/kg/harness-config.ts";
import { explicitInstanceRoot, HARNESS_ROOT, TOOLS_ROOT } from "../scripts/lib/roots.ts";
import { buildQaResult, writeQaResult } from "../scripts/qa-results.ts";
import { GLOSSARY_SUBJECT_KIND } from "../scripts/kg-qa-report.ts";
import { parsePoEntries, type PoEntry } from "./po-inject.ts";

/** This module, as a QA producer names it. */
export const GLOSSARY_CHECK_SCRIPT = "pipeline/translation-glossary.ts";

/** The `qa-results/v1` stem, and the subject kind `kg-qa-report` renders as "Glossary consistency". */
export const GLOSSARY_RESULT_STEM = "glossary-consistency";
export { GLOSSARY_SUBJECT_KIND };

/** Labels this long or longer are prose, not terms (the prior art's rule). */
const MAX_TERM = 60;

/** One glossary file in precedence order. */
export interface GlossarySource {
  /** The layer the entry is ranked by: the scheme's owner, or the hosting layer. */
  layer: string;
  file: string;
  /** From `--layer`: normative, binds every catalogue of the instance. */
  reference: boolean;
  /** The scheme's subject area (`dcterms:subject`), when its glossary declares one. */
  scope?: string;
  /** Per lower-cased label: the term's own subject, where it overrides the scheme's; `null` for a term that is not `authored`. */
  termScopes?: Map<string, string | null>;
}

/**
 * The subject area an entry of `s` binds in — `subjectOf(scheme, term)` of
 * `folio-glossary/v1` (owner's choice, "scoped fixed terms"): the
 * term's `subject`, else its scheme's, else the scheme itself
 * (`<instance>--<scheme id>`, the catalogue's own name). A reference glossary
 * is its own area and binds everything; a terminology `glossary.po` is its
 * layer's.
 */
export function scopeOf(s: GlossarySource, label: string): string {
  if (s.reference) return `reference:${s.layer}`;
  const own = s.termScopes?.get(label.toLowerCase());
  if (typeof own === "string") return own;
  if (s.scope !== undefined) return s.scope;
  return basename(s.file) === "glossary.po" ? `${s.layer}--terminology` : basename(s.file).replace(/\.po$/, "");
}

/** A fixed term: the first in-precedence translation of a label in one subject area. */
export interface FixedTerm {
  term: string;
  fixed: string;
  layer: string;
  file: string;
  /** The subject area it is fixed in. */
  scope: string;
  /** Whether it binds the checked instance's catalogues: a reference, or one of the instance's own areas. */
  inScope: boolean;
}

export interface Override {
  term: string;
  fixed: FixedTerm;
  /** The later layer's translation, and where. */
  rendering: string;
  layer: string;
  file: string;
}

export interface TermBase {
  /** Keyed by subject area and lower-cased label. */
  terms: Map<string, FixedTerm>;
  /** A different translation of a fixed term IN ITS SUBJECT AREA: a violation. */
  overrides: Override[];
  /** The same label translated otherwise in ANOTHER area, by the instance: a sense check. */
  senseOverrides: Override[];
}

/** One `folio-glossary/v1` file, as far as scope goes. */
interface SchemeScope {
  subject?: string;
  terms: Map<string, string | null>;
}

const LANG_SOURCE = (t: unknown): string | undefined =>
  typeof t === "string" ? t : t && typeof t === "object" ? ((t as Record<string, string>).en ?? Object.values(t as Record<string, string>)[0]) : undefined;

/**
 * Read a glossary file's subject areas: the scheme's `subject` and each term's
 * own (by prefLabel and altLabel), and which terms are not `authored` (they fix
 * nothing). Read as DATA — the schema belongs to a layer above this one.
 */
export function readSchemeScope(file: string): SchemeScope | undefined {
  let g: { $schema?: string; subject?: unknown; terms?: Array<Record<string, unknown>> };
  try {
    g = JSON.parse(readFileSync(file, "utf-8"));
  } catch {
    return undefined;
  }
  if (g?.$schema !== "folio-glossary/v1") return undefined;
  const terms = new Map<string, string | null>();
  for (const t of g.terms ?? []) {
    const value = t.status !== "authored" ? null : typeof t.subject === "string" ? t.subject : undefined;
    for (const l of [LANG_SOURCE(t.prefLabel), ...((t.altLabel as string[] | undefined) ?? [])]) {
      if (l && value !== undefined) terms.set(l.toLowerCase(), value);
    }
  }
  return { ...(typeof g.subject === "string" ? { subject: g.subject } : {}), terms };
}

/** The glossary file a scheme catalogue was extracted from: its first `#:` reference, under one of `roots`. */
function schemeFileOf(po: string, roots: readonly string[]): string | undefined {
  const ref = parsePoEntries(readFileSync(po, "utf-8")).flatMap((e) => e.references)[0];
  if (ref === undefined) return undefined;
  const path = ref.split(/\s+/)[0]!.replace(/:\d+$/, "");
  return roots.map((r) => join(r, path)).find((p) => existsSync(p));
}

/**
 * Every subject area the instance's OWN content belongs to: its glossaries'
 * scheme and term subjects (the scheme itself where none is declared), and its
 * terminology file's.
 */
export function instanceScopes(instanceRoot: string, sources: readonly GlossarySource[] = []): Set<string> {
  const self = readDeclaration(instanceRoot)?.name ?? basename(instanceRoot);
  const out = new Set<string>([`${self}--terminology`]);
  let dirs: string[] = [];
  try {
    const d = directoryForGraph(instanceRoot, "glossary");
    if (d !== undefined) dirs = [d];
  } catch {
    // Two declared glossary directories: the catalogues below still say.
  }
  for (const d of dirs) {
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d).filter((x) => x.endsWith(".glossary.json"))) {
      const sc = readSchemeScope(join(d, f));
      if (sc === undefined) continue;
      let id: string | undefined;
      try {
        id = (JSON.parse(readFileSync(join(d, f), "utf-8")) as { id?: string }).id;
      } catch {
        id = undefined;
      }
      out.add(sc.subject ?? `${self}--${id}`);
      for (const v of sc.terms.values()) if (v) out.add(v);
    }
  }
  for (const s of sources) {
    if (s.layer !== self || s.reference) continue;
    out.add(s.scope ?? scopeOf(s, ""));
    for (const v of s.termScopes?.values() ?? []) if (v) out.add(v);
  }
  return out;
}

// ── reading ─────────────────────────────────────────────────────

function isLabel(e: PoEntry, terminology: boolean): boolean {
  if (e.msgid.length >= MAX_TERM) return false;
  if (terminology) return !/[.;:]\s|\.$/.test(e.msgid) && !e.msgid.startsWith("<");
  return e.comments.some((c) => /^Glossary term (label|alternative label)\b/.test(c));
}

/** The declared `translation-sources` of `root`, or undefined (a layer that declares two is skipped, not guessed). */
function translationsOf(root: string): string | undefined {
  try {
    return directoryForGraph(root, "translation-sources");
  } catch {
    return undefined;
  }
}

/**
 * Every glossary for `locale`, in precedence order: references, then the
 * `needs` chain deepest first, then the instance itself.
 */
export function glossarySources(
  instanceRoot: string,
  locale: string,
  references: ReadonlyArray<{ name: string; pattern: string }> = [],
): GlossarySource[] {
  const out: GlossarySource[] = [];
  for (const r of references) {
    for (const file of expand(r.pattern.replaceAll("{locale}", locale))) out.push({ layer: r.name, file, reference: true });
  }
  const self = readDeclaration(instanceRoot)?.name ?? basename(instanceRoot);
  const chain = declarationChain(instanceRoot).map((c) => ({ name: c.own ? self : c.name, root: c.root }));
  const rank = new Map(chain.map((c, i) => [c.name, i]));
  // A `#:` reference names its glossary from the checkout, or from its layer.
  const roots = [...new Set([...chain.map((c) => c.root), ...chain.map((c) => dirname(c.root))])];
  const ranked: Array<GlossarySource & { at: number; seq: number }> = [];
  let seq = 0;
  chain.forEach((c, at) => {
    const dir = translationsOf(c.root);
    if (dir === undefined) return;
    const schemes = join(dir, locale, "glossary");
    if (existsSync(schemes)) {
      for (const f of readdirSync(schemes).filter((x) => x.endsWith(".po")).sort()) {
        const owner = /^(.+?)--/.exec(f)?.[1];
        const layer = owner !== undefined && rank.has(owner) ? owner : c.name;
        const file = join(schemes, f);
        const json = schemeFileOf(file, roots);
        const sc = json === undefined ? undefined : readSchemeScope(json);
        ranked.push({
          layer,
          file,
          reference: false,
          ...(sc?.subject !== undefined ? { scope: sc.subject } : {}),
          ...(sc !== undefined ? { termScopes: sc.terms } : {}),
          at: rank.get(layer) ?? at,
          seq: seq++,
        });
      }
    }
    const terminology = join(dir, locale, "glossary.po");
    if (existsSync(terminology)) ranked.push({ layer: c.name, file: terminology, reference: false, at, seq: seq++ });
  });
  ranked.sort((a, b) => a.at - b.at || a.seq - b.seq);
  for (const { at: _at, seq: _seq, ...src } of ranked) out.push(src);
  return out;
}

/** A path, or a `*` pattern in its last segment. */
function expand(pattern: string): string[] {
  if (!pattern.includes("*")) return existsSync(pattern) ? [pattern] : [];
  const dir = dirname(pattern);
  if (!existsSync(dir)) return [];
  const re = new RegExp(`^${basename(pattern).split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`);
  return readdirSync(dir).filter((f) => re.test(f)).sort().map((f) => join(dir, f));
}

/**
 * Merge the glossaries into one term base, ONE SUBJECT AREA AT A TIME: in an
 * area the first translation of a label wins and a later, different one is an
 * override (a violation). The same label in another area is a different term;
 * where the instance translates it otherwise, that is a sense-check note.
 */
export function termBase(
  instance: string,
  locale: string,
  sources: readonly GlossarySource[],
  scopes: ReadonlySet<string> = new Set(),
): TermBase {
  const terms = new Map<string, FixedTerm>();
  const overrides: Override[] = [];
  const senseOverrides: Override[] = [];
  const mine = new Set(scopes);
  for (const s of sources) if (s.layer === instance && !s.reference) mine.add(s.scope ?? scopeOf(s, ""));
  for (const s of sources) {
    const terminology = basename(s.file) === "glossary.po";
    for (const e of parsePoEntries(readFileSync(s.file, "utf-8"))) {
      if (!e.msgstr.trim() || e.flags.includes("localised") || e.flags.includes("fuzzy") || !isLabel(e, terminology)) continue;
      if (s.termScopes?.get(e.msgid.toLowerCase()) === null) continue; // not an authored term
      const scope = scopeOf(s, e.msgid);
      const k = `${scope}\u0000${e.msgid.toLowerCase()}`;
      const have = terms.get(k);
      if (have === undefined) {
        for (const other of terms.values()) {
          if (other.scope === scope || other.term.toLowerCase() !== e.msgid.toLowerCase()) continue;
          if (norm(other.fixed, locale) === norm(e.msgstr, locale)) continue;
          const o = { term: e.msgid, fixed: other, rendering: e.msgstr, layer: s.layer, file: s.file };
          // A reference glossary's area is every area: changing its term is an override.
          if (other.scope.startsWith("reference:")) overrides.push(o);
          else if (s.layer === instance) senseOverrides.push(o);
        }
        terms.set(k, { term: e.msgid, fixed: e.msgstr, layer: s.layer, file: s.file, scope, inScope: s.reference || mine.has(scope) });
        continue;
      }
      if (norm(have.fixed, locale) === norm(e.msgstr, locale)) continue;
      overrides.push({ term: e.msgid, fixed: have, rendering: e.msgstr, layer: s.layer, file: s.file });
    }
  }
  return { terms, overrides, senseOverrides };
}

// ── matching (ported from glossary_qa.py) ───────────────────────

const TASHKEEL = /[ً-ْـ]/g;

export function norm(s: string, locale: string): string {
  let t = s.normalize("NFC").toLowerCase();
  if (locale === "ar") t = t.replace(TASHKEEL, "").replace(/[أإآ]/g, "ا").replaceAll("ى", "ي").replaceAll("ة", "ه");
  return t.replaceAll("’", "'");
}

function stem(w: string, locale: string): string {
  if (locale === "ru" && w.length === 4) return w.slice(0, 3);
  if (w.length <= 4) return w;
  const cut = locale === "ru" && w.length > 6 ? 3 : 2;
  return w.slice(0, Math.max(4, w.length - cut));
}

/** Does `msgstr` use the fixed translation? By stem, or by substring in zh and ar. */
export function renders(fixed: string, msgstr: string, locale: string): boolean {
  const t = norm(msgstr, locale);
  let f = norm(fixed, locale);
  if (locale === "zh") return t.includes(f);
  if (locale === "ar") {
    f = f.replace(/(^|\s)ال/g, "$1");
    return f.split(/\s+/).filter(Boolean).every((w) => t.includes(w));
  }
  const toks = t.match(/[\p{L}\p{N}_]+/gu) ?? [];
  return (f.match(/[\p{L}\p{N}_]+/gu) ?? []).every((w) => toks.some((x) => x.startsWith(stem(w, locale))));
}

/** Is `term` a word of the prose in `msgid` — not inside an identifier, a path, code or a placeholder? */
export function uses(term: string, msgid: string): boolean {
  const clean = msgid.replace(/\{[^}]*\}|`[^`]*`|https?:\/\/\S+/g, " ");
  // An acronym is case-sensitive: DID is not "did".
  const flags = term === term.toUpperCase() && term.length <= 6 && /[A-Z]/.test(term) ? "u" : "iu";
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![A-Za-z0-9_\\-/.@])${esc}(?![A-Za-z0-9_\\-/@]|\\.\\w)`, flags).test(clean);
}

// ── the check ───────────────────────────────────────────────────

export type GlossaryRule = "not-fixed-rendering" | "inconsistent" | "override";

export interface GlossaryFinding {
  rule: GlossaryRule;
  term: string;
  fixed?: string;
  layer?: string;
  catalogue?: string;
  msgid?: string;
  rendering?: string | string[];
}

export interface SenseNote {
  term: string;
  fixed: string;
  layer: string;
  catalogue: string;
  msgid: string;
}

export interface LocaleResult {
  locale: string;
  fixedTerms: number;
  catalogues: number;
  findings: GlossaryFinding[];
  sense: SenseNote[];
}

/** Every `.po` under the instance's `<translations>/<locale>/`, the glossaries included. */
function catalogues(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((e) => (e.isDirectory() ? catalogues(join(dir, e.name)) : e.name.endsWith(".po") ? [join(dir, e.name)] : []));
}

/** Check one locale of the instance at `root`, whose catalogues are in `translations`. */
export function checkLocale(
  root: string,
  translations: string,
  locale: string,
  references: ReadonlyArray<{ name: string; pattern: string }> = [],
  /** The glossaries in precedence order; {@link glossarySources} when not given. */
  sources?: readonly GlossarySource[],
): LocaleResult {
  const instance = readDeclaration(root)?.name ?? basename(root);
  const srcs = sources ?? glossarySources(root, locale, references);
  const base = termBase(instance, locale, srcs, instanceScopes(root, srcs));
  const labels = new Set([...base.terms.values()].map((t) => t.term.toLowerCase()));
  const findings: GlossaryFinding[] = [];
  const sense: SenseNote[] = [];
  for (const o of base.overrides) {
    findings.push({ rule: "override", term: o.term, fixed: o.fixed.fixed, layer: o.fixed.layer, catalogue: relative(root, o.file), rendering: o.rendering });
  }
  for (const o of base.senseOverrides) {
    sense.push({ term: o.term, fixed: o.fixed.fixed, layer: o.fixed.layer, catalogue: relative(root, o.file), msgid: `${o.layer} renders it «${o.rendering}»` });
  }
  // Longest first, so "Health worker" is judged before "worker".
  const terms = [...base.terms.values()].sort((a, b) => b.term.length - a.term.length);
  // A label that binds here in one area is not also a sense check from another.
  const binding = new Set(terms.filter((t) => t.inScope).map((t) => t.term.toLowerCase()));
  const exact = new Map<string, Map<string, string[]>>();
  const files = catalogues(join(translations, locale));
  for (const po of files) {
    const rel = relative(root, po);
    for (const e of parsePoEntries(readFileSync(po, "utf-8"))) {
      if (!e.msgstr.trim() || e.flags.includes("fuzzy")) continue;
      const whole = e.msgid.trim().toLowerCase();
      if (whole.length < MAX_TERM && (labels.has(whole) || basename(po) === "glossary.po" || isLabel(e, false))) {
        const r = exact.get(whole) ?? new Map<string, string[]>();
        const n = norm(e.msgstr.trim(), locale);
        r.set(n, [...(r.get(n) ?? []), `${rel}: ${e.msgstr.trim()}`]);
        exact.set(whole, r);
      }
      for (const t of terms) {
        if (!uses(t.term, e.msgid) || renders(t.fixed, e.msgstr, locale)) continue;
        if (t.file === po) continue; // the glossary entry itself
        if (t.inScope) findings.push({ rule: "not-fixed-rendering", term: t.term, fixed: t.fixed, layer: t.layer, catalogue: rel, msgid: e.msgid, rendering: e.msgstr });
        else if (!binding.has(t.term.toLowerCase())) sense.push({ term: t.term, fixed: t.fixed, layer: t.layer, catalogue: rel, msgid: e.msgid });
      }
    }
  }
  for (const [term, renderings] of exact) {
    if (renderings.size < 2) continue;
    findings.push({ rule: "inconsistent", term: [...base.terms.values()].find((t) => t.term.toLowerCase() === term)?.term ?? term, rendering: [...renderings.values()].map((v) => v[0]!) });
  }
  return { locale, fixedTerms: base.terms.size, catalogues: files.length, findings, sense };
}

/** One finding as one line of output. */
export function findingLine(locale: string, f: GlossaryFinding): string {
  switch (f.rule) {
    case "not-fixed-rendering":
      return `✗ ${locale} not-fixed-rendering «${f.term}» → «${f.fixed}» (${f.layer}) not used in ${f.catalogue}: ${JSON.stringify(f.msgid?.slice(0, 80))}`;
    case "inconsistent":
      return `✗ ${locale} inconsistent «${f.term}» rendered ${(f.rendering as string[]).length} ways: ${(f.rendering as string[]).join(" | ")}`;
    case "override":
      return `✗ ${locale} override «${f.term}»: ${f.layer} fixes «${f.fixed}», ${f.catalogue} has «${f.rendering}»`;
  }
}

/** The `qa-results/v1` record: one family per locale. */
export function glossaryResult(instance: string, results: readonly LocaleResult[]) {
  return buildQaResult({
    script: GLOSSARY_CHECK_SCRIPT,
    scriptAbsPath: join(TOOLS_ROOT, GLOSSARY_CHECK_SCRIPT),
    subject: { kind: GLOSSARY_SUBJECT_KIND, id: instance },
    families: Object.fromEntries(
      results.map((r) => [
        r.locale,
        {
          summary:
            `${r.fixedTerms} fixed term(s), ${r.catalogues} catalogue(s); ` +
            `${r.sense.length} sense-check note(s) (a term of another domain rendered otherwise), not counted as findings`,
          entries: r.findings,
        },
      ]),
    ),
  });
}

function args(argv: readonly string[], name: string): string[] {
  const out: string[] = [];
  argv.forEach((a, i) => {
    if (a === `--${name}` && argv[i + 1] !== undefined) out.push(argv[i + 1]!);
    else if (a.startsWith(`--${name}=`)) out.push(a.slice(name.length + 3));
  });
  return out;
}

function main(argv: readonly string[]): number {
  const root = explicitInstanceRoot(argv) ?? resolve(HARNESS_ROOT);
  const check = argv.includes("--check");
  const translations = translationsOf(root);
  if (translations === undefined || !existsSync(translations)) {
    console.error(`translation-glossary: ${root} declares no \`translation-sources\` directory — nothing can be determined (exit 2)`);
    return 2;
  }
  const have = readdirSync(translations, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  const asked = args(argv, "locale").flatMap((l) => l.split(",")).filter(Boolean);
  const unknown = asked.filter((l) => !have.includes(l));
  if (unknown.length > 0) {
    console.error(`translation-glossary: no ${unknown.join(", ")} under ${relative(root, translations)}/ — nothing can be determined (exit 2)`);
    return 2;
  }
  const references = args(argv, "layer").map((s) => {
    const i = s.indexOf("=");
    return { name: s.slice(0, i), pattern: resolve(s.slice(i + 1)) };
  });
  if (references.some((r) => !r.name)) {
    console.error("translation-glossary: --layer takes <name>=<path with {locale}> (exit 2)");
    return 2;
  }
  const instance = readDeclaration(root)?.name ?? basename(root);
  const results = (asked.length ? asked : have).map((l) => checkLocale(root, translations, l, references));
  let findings = 0;
  for (const r of results) {
    for (const f of r.findings) console.log(findingLine(r.locale, f));
    for (const n of r.sense) console.log(`· ${r.locale} sense-check «${n.term}» (${n.layer}: «${n.fixed}») in ${n.catalogue}: ${JSON.stringify(n.msgid.slice(0, 80))}`);
    console.log(`  ${r.locale}: ${r.fixedTerms} fixed term(s), ${r.catalogues} catalogue(s), ${r.findings.length} finding(s), ${r.sense.length} sense-check note(s)`);
    findings += r.findings.length;
  }
  if (!check) {
    // `qaResultPath`'s one composition: `<instance>/test/results/`, the `qa`
    // directory every instance in an index declares, where `kg-qa-report` reads it.
    const out = writeQaResult(root, GLOSSARY_RESULT_STEM, glossaryResult(instance, results));
    console.log(`  wrote ${relative(root, out)}`);
  }
  return findings > 0 ? 1 : 0;
}

if (import.meta.main) process.exit(main(process.argv));
