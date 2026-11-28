/**
 * `translation-quotation-verbatim`: a quotation the source text gives in its
 * own language stays byte-for-byte the same in every translation.
 *
 * A paper quoting Bourbaki in French or Pascal in 1657 French quotes a text,
 * not a meaning. A translator, human or agent, who "improves" the quotation or
 * renders it into the target language has changed what the author is reported
 * to have written, and no other translation criterion notices: coverage counts
 * the string as translated, the round trip finds the meaning intact.
 *
 * ## The record: `<translations>/quotations.json` (`folio-quotations/v1`)
 *
 * ```json
 * { "$schema": "folio-quotations/v1",
 *   "quotations": [{ "id": "q:pascal-1657", "block": "folio/…/authors-note.md",
 *     "lang": "fr", "original": "…", "sha256": "<hex of NFC UTF-8 original>",
 *     "citation": { "author": "…", "title": "…", "year": 1657, "locator": "…" },
 *     "gloss": { "en": "…" } }] }
 * ```
 *
 * In the block's `.md` the quotation is marked `:::quotation{#q:pascal-1657 lang=fr}`
 * … `:::`, and each locale's `.po` entry carrying it has the extracted comment
 * `#. verbatim quotation q:pascal-1657, do not translate`.
 *
 * ## What is checked, per (block, locale)
 *
 * | finding | result |
 * |---|---|
 * | the record's `sha256` is not the hash of its `original` | fail: the record itself drifted |
 * | the `original` is not inside the block's `.md` | fail |
 * | a locale entry whose msgid holds the original has a msgstr that does not | fail |
 * | the `.md` has no `:::quotation{#<id>` directive for it | warn |
 * | a locale entry holding it lacks the `#. verbatim quotation <id>` comment | warn |
 *
 * A locale with no translated entry for the quotation gets no verdict: absence
 * of a translation is not a quotation that drifted (the rule
 * `translation-block-qa.ts` follows for the same reason).
 *
 * Usage:
 *   bun run cat-harness-tools/pipeline/translation-quotation-verbatim.ts [--instance <dir>] [--locales ar,fr] [--write]
 *
 * Without `--write` it reports and exits 1 on any fail. With it, each verdict
 * is also recorded on the block's existing translation sidecar (the one
 * `translation-block-qa.ts` wrote), which keeps criteria it does not measure.
 *
 * @module pipeline/translation-quotation-verbatim
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import { parsePoEntries, type PoEntry } from "./po-inject.ts";

export const CRITERION = "translation-quotation-verbatim";
const SELF = "pipeline/translation-quotation-verbatim.ts";

export interface Quotation {
  id: string;
  block: string;
  lang: string;
  original: string;
  sha256: string;
  citation?: { author?: string; title?: string; year?: number | string; locator?: string };
  gloss?: Record<string, string>;
}

export interface QuotationFinding {
  id: string;
  block: string;
  /** `undefined` for findings about the record or the source block, which hold in every locale. */
  locale?: string;
  result: "fail" | "warn";
  note: string;
}

export interface Verdict {
  block: string;
  locale: string;
  result: "pass" | "warn" | "fail";
  notes: string[];
  quotations: string[];
}

/** The hash the record carries: SHA-256 of the NFC-normalised UTF-8 bytes. */
export function quotationHash(original: string): string {
  return createHash("sha256").update(original.normalize("NFC"), "utf8").digest("hex");
}

/** The id without its `q:` prefix, so `q:x` and `x` name one quotation. */
const bare = (id: string) => id.replace(/^q:/, "");

/** Whether `md` marks the quotation with a `:::quotation{#<id> …}` directive. */
export function hasDirective(md: string, id: string): boolean {
  const re = new RegExp(String.raw`:::\s*quotation\s*\{[^}]*#(?:q:)?${bare(id).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\s}])`);
  return re.test(md);
}

/** Findings that do not depend on a locale: the record and the source block. */
export function sourceFindings(q: Quotation, md: string | undefined): QuotationFinding[] {
  const out: QuotationFinding[] = [];
  const f = (result: "fail" | "warn", note: string) => out.push({ id: q.id, block: q.block, result, note });
  if (quotationHash(q.original) !== q.sha256) f("fail", `${q.id}: sha256 in quotations.json does not match its original — the record changed`);
  if (md === undefined) f("fail", `${q.id}: block ${q.block} does not exist`);
  else {
    if (!md.normalize("NFC").includes(q.original.normalize("NFC"))) f("fail", `${q.id}: the original is not in ${q.block}`);
    if (!hasDirective(md, q.id)) f("warn", `${q.id}: ${q.block} has no :::quotation{#${q.id}} directive`);
  }
  return out;
}

/**
 * Findings for one locale's catalogue entries. Returns `undefined` when no
 * translated entry carries the quotation, which is no verdict rather than a pass.
 */
export function localeFindings(q: Quotation, locale: string, entries: PoEntry[]): QuotationFinding[] | undefined {
  const tagged = (e: PoEntry) => e.comments.some((c) => new RegExp(String.raw`verbatim quotation (?:q:)?${bare(q.id)}\b`).test(c));
  const carrying = entries.filter((e) => e.msgstr !== "" && (e.msgid.includes(q.original) || tagged(e)));
  if (carrying.length === 0) return undefined;
  const out: QuotationFinding[] = [];
  for (const e of carrying) {
    const at = e.references[0] ?? "(no reference)";
    if (!e.msgstr.includes(q.original)) {
      out.push({ id: q.id, block: q.block, locale, result: "fail", note: `${q.id}: the ${locale} msgstr at ${at} does not hold the original byte-for-byte` });
    }
    if (!tagged(e)) {
      out.push({ id: q.id, block: q.block, locale, result: "warn", note: `${q.id}: the ${locale} entry at ${at} lacks "#. verbatim quotation ${q.id}"` });
    }
  }
  return out;
}

/** Fold the findings into one verdict per (block, locale). */
export function verdicts(
  quotations: Quotation[],
  readMd: (block: string) => string | undefined,
  catalogues: Map<string, PoEntry[]>,
): Verdict[] {
  const by = new Map<string, Verdict>();
  for (const q of quotations) {
    const src = sourceFindings(q, readMd(q.block));
    for (const [locale, entries] of catalogues) {
      const loc = localeFindings(q, locale, entries);
      if (loc === undefined) continue;
      const key = `${q.block}\0${locale}`;
      const v = by.get(key) ?? { block: q.block, locale, result: "pass" as Verdict["result"], notes: [], quotations: [] };
      v.quotations.push(q.id);
      for (const f of [...src, ...loc]) {
        v.notes.push(f.note);
        if (f.result === "fail") v.result = "fail";
        else if (v.result === "pass") v.result = "warn";
      }
      by.set(key, v);
    }
  }
  return [...by.values()];
}

function readQuotations(path: string): Quotation[] {
  const doc = JSON.parse(readFileSync(path, "utf-8"));
  if (doc.$schema !== "folio-quotations/v1") throw new Error(`${path}: $schema is ${doc.$schema}, expected folio-quotations/v1`);
  return doc.quotations ?? [];
}

/** Every `.po` under `<dir>/<locale>/`, its entries concatenated per locale. */
function readCatalogues(dir: string, locales: string[] | undefined): Map<string, PoEntry[]> {
  const out = new Map<string, PoEntry[]>();
  for (const locale of readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
    if (locales && !locales.includes(locale)) continue;
    const walk = (abs: string): string[] =>
      readdirSync(abs, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(abs, e.name)) : e.name.endsWith(".po") ? [join(abs, e.name)] : [],
      );
    out.set(locale, walk(join(dir, locale)).flatMap((p) => parsePoEntries(readFileSync(p, "utf-8"))));
  }
  return out;
}

function hash12(path: string): string | undefined {
  return existsSync(path) ? createHash("sha256").update(readFileSync(path)).digest("hex").slice(0, 12) : undefined;
}

/** Record a verdict on the block's existing translation sidecar, replacing this script's prior entry. */
function record(root: string, v: Verdict): string | undefined {
  const stem = v.block.replace(/\.md$/, "");
  const sidecar = join(root, "test/results/translation-qa", `${stem}.${v.locale}.translation-qa.json`);
  if (!existsSync(sidecar)) return undefined;
  const doc = JSON.parse(readFileSync(sidecar, "utf-8"));
  const entry = {
    field_hash: { md: hash12(join(root, v.block)), ts: hash12(join(root, `${stem}.ts`)), quotations: hash12(join(root, "translations/quotations.json")) },
    result: v.result,
    ...(v.result === "pass" ? {} : { severity: v.result === "fail" ? "major" : "minor" }),
    reviewer: { kind: "script", id: SELF, actor: "local-sweep", version: "v1" },
    metrics: { quotations: v.quotations.length },
    notes: v.notes.length ? v.notes.join("; ") : `${v.quotations.join(", ")} kept verbatim`,
  };
  const prior = (doc.criteria?.[CRITERION] ?? []).filter((e: { reviewer?: { id?: string } }) => e.reviewer?.id !== SELF);
  doc.criteria = { ...doc.criteria, [CRITERION]: [entry, ...prior] };
  writeFileSync(sidecar, JSON.stringify(doc, null, 2) + "\n");
  return relative(root, sidecar);
}

if (import.meta.main) {
  const arg = (name: string) => {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : undefined;
  };
  const root = arg("instance") ?? process.cwd();
  const tdir = join(root, arg("translations") ?? "translations");
  const qpath = join(tdir, "quotations.json");
  if (!existsSync(qpath)) {
    console.log(`translation-quotation-verbatim: no ${relative(root, qpath)}, so no quotation to keep (n/a)`);
    process.exit(0);
  }
  const locales = arg("locales")?.split(",").map((s) => s.trim()).filter(Boolean);
  const quotations = readQuotations(qpath);
  const read = (b: string) => (existsSync(join(root, b)) ? readFileSync(join(root, b), "utf-8") : undefined);
  const vs = verdicts(quotations, read, readCatalogues(tdir, locales));
  // Record and source findings also stand alone, so a record with no translation yet still reports drift.
  const standalone = quotations.flatMap((q) => sourceFindings(q, read(q.block))).filter((f) => f.result === "fail");
  for (const v of vs) {
    const mark = v.result === "pass" ? "✓" : v.result === "warn" ? "⚠" : "✗";
    const at = process.argv.includes("--write") ? record(root, v) : undefined;
    console.log(`  ${mark} ${v.block} (${v.locale}) ${v.quotations.join(", ")}${at ? ` → ${at}` : ""}`);
    for (const n of v.notes) console.log(`      ${n}`);
  }
  for (const f of standalone) if (!vs.some((v) => v.block === f.block)) console.log(`  ✗ ${f.note}`);
  const failed = vs.some((v) => v.result === "fail") || standalone.length > 0;
  console.log(`\n${quotations.length} quotation(s), ${vs.length} (block, locale) verdict(s)${failed ? ", FAIL" : ""}`);
  process.exit(failed ? 1 : 0);
}
