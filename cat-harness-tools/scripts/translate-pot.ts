#!/usr/bin/env bun
/**
 * Machine-translate the EMPTY entries of a layer's gettext catalogues with a
 * self-hosted, open engine — no hosted freemium API, no quota.
 *
 * @module scripts/translate-pot
 * @covers translation-sources
 *
 * ## Engines (preference order)
 *
 *   1. `opus-mt` — Helsinki-NLP OPUS-MT Marian models (CC-BY 4.0), run locally
 *      by `scripts/translation/opus_mt_runner.py` under `python -I`. The model
 *      weights come from wherever the local `transformers` cache points; this
 *      script never calls a hosted inference API.
 *   2. `libretranslate` — a SELF-HOSTED LibreTranslate (AGPL, Argos models) at
 *      `--url` (or `LIBRETRANSLATE_URL`). The public libretranslate.com
 *      instance is refused: it is the freemium API this step exists to avoid.
 *
 * ## The rules
 *
 *   - Only an entry whose msgstr (every `msgstr[n]`, for a plural) is EMPTY is
 *     filled. A non-empty msgstr is never touched, fuzzy or not.
 *   - Every machine string is flagged `#, fuzzy`, so `gen-translation-status`
 *     counts it as "present, needs review" and never as translated.
 *   - The file is edited in place, line by line: only the msgstr lines and the
 *     flag line of a filled entry change. msgctxt, comments, references,
 *     ordering, the header and obsolete `#~` entries stay byte-identical.
 *   - Placeholders (`{name}`, `%s`, `%(x)s`, `%1$d`, `{{ liquid }}`), HTML
 *     tags and entities, inline code, Markdown emphasis and link targets, and
 *     TeX math are masked before translation and restored after. A string
 *     whose protected tokens do not come back as the same multiset is REFUSED:
 *     left empty and reported.
 *   - Leading/trailing whitespace of the string, and of each of its lines, is
 *     cut off before translation and put back verbatim.
 *   - A catalogue signed off by a person (`X-Folio-Official: yes`, or a node
 *     whose `status.official` is true) is skipped, and `official` is never set.
 *   - The catalogue's `.json` translation-node/v1 record gets
 *     `status.generatedBy: "machine"`, `status.generator: "<engine> <model>"`
 *     and `status.generatedAt`, and is created when absent.
 *
 * Usage:
 *   bun run cat translate-pot --engine opus-mt [--locale fr]... [--instance <dir>]
 *   bun run cat translate-pot --engine libretranslate --url http://localhost:5000
 *   … --dry-run      report what would be filled, write nothing
 *   … --dir <path>   the translations directory (default: the layer's declared
 *                    `translation-sources` directory, via `translationsHomeFor`)
 *   … --no-create    do not create a .po from a .pot that has none
 *
 * Exit codes: 0 done (refusals are reported, not failures), 1 engine or I/O
 * failure, 2 nothing to do (no catalogue found).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ── PO string escaping ───────────────────────────────────────────

/** Decode the inside of one PO quoted string. */
export function unescapePo(s: string): string {
  return s.replace(/\\(.)/g, (_m, c: string) =>
    c === "n" ? "\n" : c === "t" ? "\t" : c === "r" ? "\r" : c === "a" ? "\x07" : c === "b" ? "\b" : c === "f" ? "\f" : c === "v" ? "\v" : c);
}

/** Encode a value for the inside of one PO quoted string. */
export function escapePo(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")
    .replace(/\r/g, "\\r");
}

/** The PO lines for `keyword value`; a value with inner newlines is split after each `\n`. */
export function formatField(keyword: string, value: string): string[] {
  const pieces = value.split(/(?<=\n)/).filter((p) => p !== "");
  if (pieces.length <= 1) return [`${keyword} "${escapePo(value)}"`];
  return [`${keyword} ""`, ...pieces.map((p) => `"${escapePo(p)}"`)];
}

// ── Lossless catalogue model ─────────────────────────────────────

/** One keyword field of an entry and the line span it occupies. */
interface Field {
  keyword: string; // msgctxt | msgid | msgid_plural | msgstr | msgstr[n]
  value: string;
  start: number;
  end: number; // exclusive
}

/** One entry: its raw lines and the fields parsed from them. */
export interface Entry {
  lines: string[];
  fields: Field[];
  obsolete: boolean;
}

/** A catalogue as alternating entry blocks and the exact separators between them. */
export interface Catalogue {
  entries: Entry[];
  separators: string[];
}

const FIELD_RE = /^(msgctxt|msgid_plural|msgid|msgstr(?:\[\d+\])?)\s+"((?:[^"\\]|\\.)*)"\s*$/;
const CONT_RE = /^\s*"((?:[^"\\]|\\.)*)"\s*$/;

function parseEntry(text: string): Entry {
  const lines = text.split("\n");
  const fields: Field[] = [];
  let obsolete = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.startsWith("#~")) obsolete = true;
    const m = FIELD_RE.exec(line);
    if (m) {
      fields.push({ keyword: m[1]!, value: unescapePo(m[2]!), start: i, end: i + 1 });
      continue;
    }
    const c = CONT_RE.exec(line);
    const last = fields[fields.length - 1];
    if (c && last && last.end === i) {
      last.value += unescapePo(c[1]!);
      last.end = i + 1;
    }
  }
  return { lines, fields, obsolete };
}

/** Split a catalogue into entries, keeping every separator so `serialize` is the identity. */
export function parseCatalogue(text: string): Catalogue {
  const parts = text.split(/(\n[ \t]*\n(?:[ \t]*\n)*)/);
  const entries: Entry[] = [];
  const separators: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) entries.push(parseEntry(parts[i]!));
    else separators.push(parts[i]!);
  }
  return { entries, separators };
}

export function serialize(cat: Catalogue): string {
  let out = "";
  cat.entries.forEach((e, i) => {
    out += e.lines.join("\n");
    if (i < cat.separators.length) out += cat.separators[i];
  });
  return out;
}

const field = (e: Entry, k: string) => e.fields.find((f) => f.keyword === k);
const msgstrs = (e: Entry) => e.fields.filter((f) => f.keyword.startsWith("msgstr"));

/** The header entry: `msgid ""` with no msgctxt. */
export function isHeader(e: Entry): boolean {
  return field(e, "msgid")?.value === "" && field(e, "msgctxt") === undefined;
}

/** An entry that can be filled: a real msgid whose every msgstr is empty. */
export function isEmptyEntry(e: Entry): boolean {
  if (e.obsolete || isHeader(e) || field(e, "msgid") === undefined) return false;
  const strs = msgstrs(e);
  return strs.length > 0 && strs.every((f) => f.value === "");
}

function headerValue(cat: Catalogue, name: string): string | undefined {
  const h = cat.entries.find(isHeader);
  const v = h ? field(h, "msgstr")?.value : undefined;
  const m = v ? new RegExp(`^${name}:\\s*(.*)$`, "mi").exec(v) : null;
  return m ? m[1]!.trim() : undefined;
}

/** gettext's conventional plural counts, used only when the header has no `Plural-Forms`. */
const DEFAULT_NPLURALS: Record<string, number> = { ar: 6, ru: 3, zh: 1, fr: 2, es: 2, en: 2 };

export function nplurals(cat: Catalogue, locale: string): number {
  const pf = headerValue(cat, "Plural-Forms");
  const m = pf ? /nplurals\s*=\s*(\d+)/.exec(pf) : null;
  return m ? Number(m[1]) : DEFAULT_NPLURALS[locale.split(/[-_]/)[0]!] ?? 2;
}

/** Rewrite an entry's msgstr lines and add `fuzzy` to its flag line. */
function writeEntry(e: Entry, values: string[]): void {
  const strs = msgstrs(e);
  const plural = field(e, "msgid_plural") !== undefined;
  const start = strs[0]!.start;
  const end = strs[strs.length - 1]!.end;
  const fresh = plural
    ? values.flatMap((v, n) => formatField(`msgstr[${n}]`, v))
    : formatField("msgstr", values[0]!);
  const lines = [...e.lines.slice(0, start), ...fresh, ...e.lines.slice(end)];

  const flagAt = lines.findIndex((l) => l.startsWith("#,"));
  if (flagAt >= 0) {
    const flags = lines[flagAt]!.slice(2).split(",").map((f) => f.trim()).filter(Boolean);
    if (!flags.includes("fuzzy")) lines[flagAt] = `#, ${["fuzzy", ...flags].join(", ")}`;
  } else {
    // Flags follow translator, extracted and reference comments, and precede `#|`.
    let at = 0;
    while (at < lines.length && /^#(?:[ .:]|$)/.test(lines[at]!)) at++;
    lines.splice(at, 0, "#, fuzzy");
  }
  Object.assign(e, parseEntry(lines.join("\n")));
}

// ── Protected tokens: the placeholder guard ──────────────────────

/**
 * Everything a translation must carry over unchanged, in one alternation.
 * Order matters: longer constructs first, so `$$…$$` is not two `$…$`.
 */
const PROTECTED_RE = new RegExp(
  [
    String.raw`\$\$[\s\S]+?\$\$`, // display math
    String.raw`(?<![\\\w])\$(?!\s)[^$\n]+?(?<!\s)\$`, // inline math
    String.raw`\\\([\s\S]+?\\\)`, // \( … \)
    String.raw`\\\[[\s\S]+?\\\]`, // \[ … \]
    "`[^`\\n]+`", // inline code
    String.raw`\{\{[\s\S]*?\}\}`, // {{ liquid }}
    String.raw`\{%[\s\S]*?%\}`, // {% liquid %}
    String.raw`%\(\w+\)[#0+\-]*\d*(?:\.\d+)?[diouxXeEfFgGcrsa]`, // %(name)s
    String.raw`%(?:\d+\$)?[#0+\-']*\d*(?:\.\d+)?(?:hh|h|ll|l|L|q|j|z|t)?[diouxXeEfFgGcspn%]`, // printf
    String.raw`\{[A-Za-z0-9_.:\-\[\]]*\}`, // {name}, {0}, {}
    String.raw`</?[A-Za-z][\w:-]*(?:\s[^<>]*)?/?>`, // HTML tags
    String.raw`&(?:#\d+|#x[0-9a-fA-F]+|[A-Za-z][A-Za-z0-9]*);`, // entities
    String.raw`\]\([^)\s]*(?:\s+"[^"]*")?\)`, // Markdown link target
    String.raw`\[(?=[^\]\n]*\]\()`, // the [ that opens a Markdown link
    String.raw`\*\*|__|~~`, // emphasis pairs
    String.raw`(?<![\w*])\*(?![\s*])|(?<![\s*])\*(?![\w*])`, // single-* emphasis
  ].join("|"),
  "g",
);

/** The protected tokens of a string, in order. */
export function protectedTokens(s: string): string[] {
  return s.match(PROTECTED_RE) ?? [];
}

const sorted = (xs: string[]) => [...xs].sort();

/** Whether `out` carries exactly the protected tokens of `src` (as a multiset). */
export function placeholdersRoundTrip(src: string, out: string): boolean {
  const a = sorted(protectedTokens(src));
  const b = sorted(protectedTokens(out));
  return a.length === b.length && a.every((t, i) => t === b[i]);
}

/** Replace each protected token with a numbered sentinel the engine passes through. */
export function mask(s: string): { text: string; tokens: string[] } {
  const tokens: string[] = [];
  const text = s.replace(PROTECTED_RE, (t) => `__PH${tokens.push(t) - 1}__`);
  return { text, tokens };
}

/** Put the tokens back, tolerating the spaces an engine may insert inside a sentinel. */
export function unmask(s: string, tokens: string[]): string {
  return s.replace(/_\s?_\s?PH\s?(\d+)\s?_\s?_/gi, (m, n: string) => tokens[Number(n)] ?? m);
}

// ── Engines ──────────────────────────────────────────────────────

/** A batch translator. It sees only masked, whitespace-trimmed text. */
export interface Engine {
  /** `<engine> <model id>`, as written to `status.generator`. */
  generator(target: string): string;
  translate(texts: string[], source: string, target: string): Promise<string[]>;
}

/** OPUS-MT models; `>>id<<` is the target token the multi-target models require. */
export const OPUS_MT_MODELS: Record<string, { model: string; prefix?: string }> = {
  ar: { model: "Helsinki-NLP/opus-mt-en-ar", prefix: ">>ara<< " },
  es: { model: "Helsinki-NLP/opus-mt-en-es" },
  fr: { model: "Helsinki-NLP/opus-mt-en-fr" },
  ru: { model: "Helsinki-NLP/opus-mt-en-ru" },
  zh: { model: "Helsinki-NLP/opus-mt-en-zh", prefix: ">>cmn_Hans<< " },
};

const RUNNER = join(dirname(fileURLToPath(import.meta.url)), "translation", "opus_mt_runner.py");

export function opusMtEngine(opts: { python?: string; model?: string } = {}): Engine {
  const pick = (source: string, target: string) => {
    if (opts.model) return { model: opts.model };
    const known = source === "en" ? OPUS_MT_MODELS[target] : undefined;
    return known ?? { model: `Helsinki-NLP/opus-mt-${source}-${target}` };
  };
  return {
    generator: (target) => `opus-mt ${pick("en", target).model}`,
    async translate(texts, source, target) {
      const { model, prefix = "" } = pick(source, target);
      const r = spawnSync(opts.python ?? process.env.PYTHON ?? "python3", ["-I", RUNNER], {
        input: JSON.stringify({ model, texts: texts.map((t) => prefix + t) }),
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
      });
      if (r.status !== 0) throw new Error(`opus-mt runner failed (${r.status}): ${r.stderr || r.error}`);
      const out = JSON.parse(r.stdout) as { translations: string[] };
      if (out.translations.length !== texts.length) throw new Error("opus-mt runner returned a different count");
      return out.translations;
    },
  };
}

export function libreTranslateEngine(opts: { url: string; apiKey?: string; model?: string }): Engine {
  const base = opts.url.replace(/\/+$/, "");
  if (/(^|\.)libretranslate\.com$/i.test(new URL(base).hostname)) {
    throw new Error("libretranslate.com is the hosted API; point --url at a self-hosted instance");
  }
  return {
    generator: (target) => `libretranslate ${opts.model ?? `argos en-${target}`}`,
    async translate(texts, source, target) {
      const res = await fetch(`${base}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: texts, source, target, format: "text", ...(opts.apiKey ? { api_key: opts.apiKey } : {}) }),
      });
      if (!res.ok) throw new Error(`LibreTranslate ${res.status}: ${await res.text()}`);
      const body = (await res.json()) as { translatedText: string | string[] };
      const out = Array.isArray(body.translatedText) ? body.translatedText : [body.translatedText];
      if (out.length !== texts.length) throw new Error("LibreTranslate returned a different count");
      return out;
    },
  };
}

// ── Filling one catalogue ────────────────────────────────────────

const HAS_LETTER = /\p{L}/u;

/** A string cut into lines, each line into (leading ws, core, trailing ws). */
function segments(s: string) {
  return s.split("\n").map((line) => {
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(line)!;
    return { lead: m[1]!, core: m[2]!, trail: m[3]! };
  });
}

/** The work one source string needs: the masked cores to send. */
function plan(src: string) {
  return segments(src).map((seg) => {
    const { text, tokens } = mask(seg.core);
    return { ...seg, masked: text, tokens, send: HAS_LETTER.test(text.replace(/__PH\d+__/g, "")) };
  });
}

export interface Refusal {
  msgctxt?: string;
  msgid: string;
  reason: string;
}

export interface FillResult {
  text: string;
  filled: number;
  refused: Refusal[];
}

/**
 * Fill every empty entry of a `.po` text. Pure apart from the engine call:
 * returns the new text and what was filled or refused.
 */
export async function fillCatalogue(
  poText: string,
  engine: Engine,
  opts: { source?: string; target: string },
): Promise<FillResult> {
  const source = opts.source ?? "en";
  const cat = parseCatalogue(poText);
  const n = nplurals(cat, opts.target);

  // Every entry's source strings, one per msgstr form.
  const work = cat.entries.filter(isEmptyEntry).map((e) => {
    const id = field(e, "msgid")!.value;
    const plural = field(e, "msgid_plural")?.value;
    const forms = plural === undefined ? [id] : Array.from({ length: n }, (_, k) => (k === 0 && n > 1 ? id : plural));
    return { e, id, ctx: field(e, "msgctxt")?.value, plans: forms.map(plan) };
  });

  // One engine call for the whole catalogue, deduplicated.
  const unique = [...new Set(work.flatMap((w) => w.plans.flat().filter((p) => p.send).map((p) => p.masked)))];
  const translated = new Map<string, string>();
  if (unique.length > 0) {
    const out = await engine.translate(unique, source, opts.target);
    unique.forEach((u, i) => translated.set(u, out[i] ?? ""));
  }

  let filled = 0;
  const refused: Refusal[] = [];
  for (const w of work) {
    const refuse = (reason: string) => refused.push({ ...(w.ctx !== undefined ? { msgctxt: w.ctx } : {}), msgid: w.id, reason });
    if (!w.plans.some((segs) => segs.some((p) => p.send))) {
      refuse("nothing translatable (no letters outside protected tokens)");
      continue;
    }
    const values: string[] = [];
    let bad: string | undefined;
    for (const segs of w.plans) {
      const lines = segs.map((p) => {
        if (!p.send) return p.lead + p.core + p.trail;
        const raw = translated.get(p.masked)?.trim() ?? "";
        if (raw === "") bad ??= "engine returned an empty string";
        if (raw.includes("\n")) bad ??= "engine introduced a line break";
        const core = unmask(raw, p.tokens);
        if (/PH\s?\d+/i.test(core.replace(PROTECTED_RE, ""))) bad ??= "a placeholder sentinel survived unmasking";
        return p.lead + core + p.trail;
      });
      const value = lines.join("\n");
      const src = segs.map((p) => p.lead + p.core + p.trail).join("\n");
      if (!placeholdersRoundTrip(src, value)) bad ??= `placeholders or markup did not round-trip: ${JSON.stringify(sorted(protectedTokens(src)))} → ${JSON.stringify(sorted(protectedTokens(value)))}`;
      values.push(value);
    }
    if (bad) {
      refuse(bad);
      continue;
    }
    writeEntry(w.e, values);
    filled++;
  }
  return { text: serialize(cat), filled, refused };
}

/** A new `.po` from a `.pot`: the template with its `Language:` header set. */
export function poFromPot(potText: string, locale: string): string {
  const cat = parseCatalogue(potText);
  const h = cat.entries.find(isHeader);
  if (h) {
    const f = field(h, "msgstr")!;
    let v = /^Language:.*$/m.test(f.value) ? f.value.replace(/^Language:.*$/m, `Language: ${locale}`) : `${f.value}Language: ${locale}\n`;
    v = v.replace(/^"?Language-Team:\s*$/m, "Language-Team: ");
    h.lines = [...h.lines.slice(0, f.start), ...formatField("msgstr", v), ...h.lines.slice(f.end)];
  }
  return serialize(cat);
}

/** The keys (`ctx\x04id`) of a catalogue's real entries. */
export function entryKeys(text: string): Set<string> {
  return new Set(
    parseCatalogue(text)
      .entries.filter((e) => !e.obsolete && !isHeader(e) && field(e, "msgid") !== undefined)
      .map((e) => `${field(e, "msgctxt")?.value ?? ""}\x04${field(e, "msgid")!.value}`),
  );
}

// ── The translation node ─────────────────────────────────────────

export interface NodePaths {
  /** Relative to the instance root, `/`-separated. */
  po: string;
  pot: string;
  locale: string;
  /** `<area>/<name>` under the locale directory. */
  stem: string;
}

/**
 * The node after a machine fill. Existing fields are kept; only
 * `generatedBy`, `generator` and `generatedAt` are written, and `official`
 * is never set (a new node records `false`, which the schema requires).
 */
export function updatedNode(existing: Record<string, unknown> | undefined, p: NodePaths, generator: string, at: string): Record<string, unknown> {
  const node = existing ?? {
    $schema: "translation-node/v1",
    label: `trans:${p.locale}/${p.stem}`,
    locale: p.locale,
    sourceFile: p.pot,
    potFile: p.pot,
    poFile: p.po,
  };
  const status = { locale: p.locale, official: false, ...((node.status as Record<string, unknown> | undefined) ?? {}) };
  return { ...node, status: { ...status, generatedBy: "machine", generator, generatedAt: at } };
}

/** Whether a person signed this catalogue off, by either record. */
export function isOfficial(poText: string | undefined, node: Record<string, unknown> | undefined): boolean {
  if ((node?.status as { official?: unknown } | undefined)?.official === true) return true;
  return poText !== undefined && headerValue(parseCatalogue(poText), "X-Folio-Official")?.toLowerCase() === "yes";
}

// ── CLI ──────────────────────────────────────────────────────────

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

interface Args {
  engine?: string;
  url?: string;
  model?: string;
  python?: string;
  source: string;
  locales: string[];
  instance: string;
  dir?: string;
  dryRun: boolean;
  create: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { source: "en", locales: [], instance: process.cwd(), dryRun: false, create: true };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i]!;
    const v = () => {
      const x = argv[++i];
      if (x === undefined) throw new Error(`${k} needs a value`);
      return x;
    };
    if (k === "--engine") a.engine = v();
    else if (k === "--url") a.url = v();
    else if (k === "--model") a.model = v();
    else if (k === "--python") a.python = v();
    else if (k === "--source") a.source = v();
    else if (k === "--locale") a.locales.push(v());
    else if (k === "--instance") a.instance = resolve(v());
    else if (k === "--dir") a.dir = resolve(v());
    else if (k === "--dry-run") a.dryRun = true;
    else if (k === "--no-create") a.create = false;
    else throw new Error(`unknown argument ${k}`);
  }
  return a;
}

function engineFor(a: Args): Engine {
  if (a.engine === "opus-mt") return opusMtEngine({ python: a.python, model: a.model });
  if (a.engine === "libretranslate") {
    const url = a.url ?? process.env.LIBRETRANSLATE_URL;
    if (!url) throw new Error("--engine libretranslate needs --url (or LIBRETRANSLATE_URL) of a self-hosted instance");
    return libreTranslateEngine({ url, apiKey: process.env.LIBRETRANSLATE_API_KEY, model: a.model });
  }
  throw new Error("--engine must be opus-mt or libretranslate");
}

/**
 * The layer's translations directory, from its own `translation-sources`
 * declaration (or its host's), never a path written here. Imported lazily so
 * the pure functions above load without the declaration reader.
 */
async function declaredHome(instance: string): Promise<{ root: string; scope: readonly string[] }> {
  const { translationsHomeFor } = await import("../schemas/kg/cat-harness.js");
  const { HARNESS_ROOT } = await import("./lib/roots.ts");
  return translationsHomeFor(instance, HARNESS_ROOT);
}

export async function main(argv: string[], engineOverride?: Engine): Promise<number> {
  const a = parseArgs(argv);
  const engine = engineOverride ?? engineFor(a);
  const home = a.dir !== undefined ? { root: a.dir, scope: [] as readonly string[] } : await declaredHome(a.instance);
  const tdir = home.root;
  if (!existsSync(tdir)) {
    console.error(`no translations directory at ${tdir}`);
    return 2;
  }
  const locales = a.locales.length > 0 ? a.locales : readdirSync(tdir).filter((n) => statSync(join(tdir, n)).isDirectory());
  const rel = (p: string) => relative(a.instance, p).split("\\").join("/");
  const at = new Date().toISOString();
  let catalogues = 0;

  for (const locale of locales) {
    const ldir = join(tdir, locale, ...home.scope);
    if (!existsSync(ldir)) continue;
    for (const pot of walk(ldir).filter((p) => p.endsWith(".pot")).sort()) {
      catalogues++;
      const po = pot.slice(0, -1);
      const nodePath = pot.slice(0, -4) + ".json";
      const node = existsSync(nodePath) ? (JSON.parse(readFileSync(nodePath, "utf8")) as Record<string, unknown>) : undefined;
      const potText = readFileSync(pot, "utf8");
      const poText = existsSync(po) ? readFileSync(po, "utf8") : undefined;
      const label = rel(po);
      if (isOfficial(poText, node)) {
        console.log(`${label}: skipped — signed off as official`);
        continue;
      }
      if (poText === undefined && !a.create) {
        console.log(`${label}: skipped — no .po (--no-create)`);
        continue;
      }
      const base = poText ?? poFromPot(potText, locale);
      const have = entryKeys(base);
      const missing = [...entryKeys(potText)].filter((k) => !have.has(k)).length;

      const r = await fillCatalogue(base, engine, { source: a.source, target: locale });
      console.log(`${label}: filled ${r.filled} as fuzzy, refused ${r.refused.length}${missing ? `, ${missing} template entries absent from the .po (run msgmerge)` : ""}`);
      for (const f of r.refused) console.log(`  refused ${f.msgctxt ? `[${f.msgctxt}] ` : ""}${JSON.stringify(f.msgid)}: ${f.reason}`);
      if (a.dryRun || (r.filled === 0 && poText !== undefined)) continue;

      writeFileSync(po, r.text);
      if (r.filled > 0) {
        const stem = relative(ldir, pot).split("\\").join("/").slice(0, -4);
        const next = updatedNode(node, { po: rel(po), pot: rel(pot), locale, stem }, engine.generator(locale), at);
        writeFileSync(nodePath, JSON.stringify(next, null, 2) + "\n");
      }
    }
  }
  if (catalogues === 0) {
    console.error(`no .pot catalogues under ${tdir}`);
    return 2;
  }
  return 0;
}

if (import.meta.main) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err: unknown) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    },
  );
}

