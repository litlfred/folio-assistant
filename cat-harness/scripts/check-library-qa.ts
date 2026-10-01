#!/usr/bin/env bun
/**
 * Judge every library entry after ingestion — its title, its bibliographic
 * metadata, whether its blocks carry anything, and how much is unsummarised.
 *
 * @module scripts/check-library-qa
 * @covers library
 *
 * Issue #1794, bean `8iqc`. Owner, 2026-10-01, looking at the who-iris
 * library page: *"library entry is uninformative. no titles. and sometime
 * weird ones. review/QA checks on library assets after ingestion/KG build"*.
 *
 * ## Why this is a separate check from `check:l1-complete`
 *
 * `check:l1-complete` asks whether ingestion PRODUCED each artefact an entry
 * owes — sections, blocks, OCR, images. It answers "is it there". This asks
 * whether what is there is any GOOD: a manifest whose `title` is the slug, or
 * the first OCR line off a scanned cover, passes every completeness test there
 * is. `who-pub-tps-931` is complete by `l1-complete` and is called *Abies*.
 *
 * ## The families, and what each reads
 *
 * Every finding names the entry, its instance, and the FIELD it read, so a
 * reader can go to the file rather than trust the summary.
 *
 * - `title-missing` — `manifest.jsonld` `title` is absent, equal to the slug
 *   or `meta.doc_id`, or equal to the source's file name. (The JSON-LD
 *   generator writes `structure.metadata.title ?? docId`, so a front-matter
 *   parse that found nothing becomes the slug, silently.)
 * - `title-implausible` — a single short token; a doubled word; or the title
 *   DISAGREES with the source's own metadata: the IRIS Dublin Core record's
 *   `dc.title` (via the catalogue node's `metadataRef`), `referenced.json`
 *   `identity.title`, or the PDF Info `/Title` as extracted into
 *   `structure.json` `metadata.docinfo.Title`. The record outranks the PDF —
 *   `iris-dspace` R8, *never infer metadata from the PDF when a record exists*.
 * - `title-source-absent` — the source carries no title of its own, so the
 *   agreement test above was NOT made. Listed, not silent: "not checked" must
 *   not read as "agrees".
 * - `bibliographic-missing` — no author/publisher, or no year, among the
 *   fields the ENTRY declares (`manifest.meta`, `referenced.json` `identity`,
 *   `tabular.jsonld` `source`), unless `meta.bibliographic_not_in_source`
 *   gives a reason. Each finding lists where the missing value IS readable but
 *   not carried (the DC record, PDF Info), which is what a fix would read.
 * - `block-no-content` — prose blocks the library viewer renders as
 *   *"(no content carried)"* while the entry holds words. Says whether the
 *   entry is WITHHELD, because that is the usual cause and it is by design.
 * - `summary-backlog` — prose blocks with no current summary, per entry.
 *   A count, advisory: the drain is slow on purpose.
 * - `could-not-determine` — a file the judgement needs exists and cannot be
 *   read. Never a pass, and the one family `--check` FAILS on.
 *
 * ## Advisory, deliberately
 *
 * The findings are a backlog against a corpus nobody has curated yet; a gate
 * that refused every push until 57 entries had authors would be switched off
 * within a week (`audit-coverage` §"What --check fails on"). `--check` fails on
 * a STALE sidecar and on `could-not-determine`, and on nothing else.
 *
 * Usage:
 *   bun run check:library-qa          # judge, and write the sidecar
 *   bun run check:library-qa:check    # fail if stale or undeterminable; writes nothing
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";

import { directoriesForGraph, repoRootFor } from "../schemas/cat-harness.js";
import { readStructure, STRUCTURE_FILENAME } from "../schemas/document-structure.ts";
import { readEntryBlocks, readLibraryGraph, type LibraryEntry } from "./library-graph.ts";
import { tally } from "./summaries.ts";
import { buildQaResult, qaResultPath, qaResultState, writeQaResult, type QaResult } from "./qa-results.js";

const ROOT = resolve(import.meta.dir, "..");
const SCRIPT = "scripts/check-library-qa.ts";
/** The sidecar stem. Not `library-qa/`: that directory is `check:l1-complete`'s, per entry. */
export const STEM = "library-entry-qa";

/** One field read from one file, so a finding can say where it looked. */
export interface FieldRead {
  /** Entry-relative (or instance-relative, for the catalogue) file. */
  file: string;
  /** The field within it, e.g. `metadata.docinfo.Title`. */
  field: string;
  value: string;
}

/** Everything a judgement needs, read once from an entry's files. */
export interface EntryFacts {
  id: string;
  instance: string;
  /** `manifest.jsonld` `title`, or `null` when absent. */
  title: string | null;
  docId: string;
  /** Every file name the entry says its source had. */
  sourceFiles: FieldRead[];
  /** The source's own titles, authority first. */
  sourceTitles: FieldRead[];
  /** Author / publisher / year as the ENTRY declares them. */
  declared: { agent: FieldRead[]; year: FieldRead[] };
  /** Author / publisher / year readable in a source file but not declared. */
  readable: { agent: FieldRead[]; year: FieldRead[] };
  /** `meta.bibliographic_not_in_source`, when the entry records one. */
  bibliographicReason: string | null;
  /** Why the source title could not be looked for, when it could not — `null` if it was. */
  noSourceTitleBecause: string | null;
  /** Files that exist and would not parse. Non-empty means could-not-determine. */
  unreadable: { file: string; why: string }[];
}

// ── Reading ─────────────────────────────────────────────────────────────────

type Json = Record<string, unknown>;

/** `undefined` for absent, `null` for present-but-unparseable. Three states. */
function readJsonFile(path: string): Json | null | undefined {
  if (!existsSync(path)) return undefined;
  try {
    const v = JSON.parse(readFileSync(path, "utf-8")) as unknown;
    return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null;
  } catch {
    return null;
  }
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const obj = (v: unknown): Json => (v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {});

/** A four-digit year anywhere in a date-ish string, or `""`. */
export function yearOf(v: string): string {
  return /\b(1[5-9]\d\d|20\d\d)\b/.exec(v)?.[1] ?? "";
}

/** One Dublin Core field's first value, `element.qualifier` or bare `element`. */
function dcValue(rec: Json, element: string, qualifier?: string): string {
  const fields = Array.isArray(rec.fields) ? (rec.fields as Json[]) : [];
  const f = fields.find((x) => x.element === element && (qualifier ? x.qualifier === qualifier : !x.qualifier));
  const vals = Array.isArray(f?.values) ? (f!.values as Json[]) : [];
  return str(vals[0]?.value);
}

/**
 * The catalogue node naming this entry (`libraryId`), in its instance's
 * declared `catalogue` graph, and the Dublin Core record that node points at.
 */
function catalogueRecord(
  instanceRoot: string,
  slug: string,
  unreadable: EntryFacts["unreadable"],
): { file: string; rec: Json } | undefined {
  for (const cat of directoriesForGraph(instanceRoot, "catalogue")) {
    const nodes = join(cat, "nodes");
    if (!existsSync(nodes)) continue;
    for (const f of readdirSync(nodes).filter((n) => n.endsWith(".json")).sort()) {
      const node = readJsonFile(join(nodes, f));
      if (!node || node.libraryId !== slug) continue;
      const ref = str(node.metadataRef);
      if (!ref) return undefined;
      const rec = readJsonFile(join(instanceRoot, ref));
      if (!rec) {
        unreadable.push({ file: ref, why: rec === undefined ? "named by the catalogue node and absent" : "will not parse" });
        return undefined;
      }
      return { file: ref, rec };
    }
  }
  return undefined;
}

/** Read every fact a judgement needs from one entry directory. */
export function readEntryFacts(dir: string, id: string, instance: string): EntryFacts {
  const unreadable: EntryFacts["unreadable"] = [];
  const read = (rel: string): Json | undefined => {
    const v = readJsonFile(join(dir, rel));
    if (v === null) unreadable.push({ file: rel, why: "will not parse" });
    return v ?? undefined;
  };

  const manifest = read("manifest.jsonld");
  if (manifest === undefined && !unreadable.length) unreadable.push({ file: "manifest.jsonld", why: "absent" });
  const meta = obj(manifest?.meta);
  // Through the accessor (bean `rkqp`): a variant nobody declared is a
  // reason, which lands in could-not-determine rather than reading as "no title".
  const hasStructure = existsSync(join(dir, STRUCTURE_FILENAME));
  const sread = hasStructure ? readStructure(dir) : undefined;
  if (sread && "reason" in sread) unreadable.push({ file: STRUCTURE_FILENAME, why: sread.reason.replace(dir, "<entry>") });
  const structure: Json | undefined = sread && !("reason" in sread) ? obj(sread.raw) : undefined;
  const referenced = read("referenced.json");
  const tabular = read("tabular.jsonld");
  const smeta = obj(structure?.metadata);
  const docinfo = obj(smeta.docinfo);
  const identity = obj(referenced?.identity);
  const tsource = obj(tabular?.source);

  const fr = (file: string, field: string, value: unknown): FieldRead[] =>
    str(value) ? [{ file, field, value: str(value) }] : [];

  const sourceFiles = [
    ...fr("manifest.jsonld", "meta.source_file", meta.source_file),
    ...fr(STRUCTURE_FILENAME, "source.file", obj(structure?.source).file),
    ...fr("referenced.json", "source.file", obj(referenced?.source).file),
    ...fr("tabular.jsonld", "source.file", tsource.file),
  ];

  // The catalogue lives at the INSTANCE root, two levels up from `library/<slug>`.
  const instanceRoot = dirname(dirname(dir));
  const cat = catalogueRecord(instanceRoot, id, unreadable);
  const dc = cat?.rec;

  const sourceTitles = [
    ...(dc ? fr(cat!.file, "dc.title", dcValue(dc, "title")) : []),
    ...fr("referenced.json", "identity.title", identity.title),
    ...fr(STRUCTURE_FILENAME, "metadata.docinfo.Title", docinfo.Title).filter((t) => usableSourceTitle(t.value, sourceFiles)),
  ];

  // Why no source title was looked for. A source that is not a PDF has no
  // Info dictionary to read; a PDF with no extraction cannot be asked.
  let noSourceTitleBecause: string | null = null;
  if (sourceTitles.length === 0) {
    const isPdf = sourceFiles.some((s) => extname(s.value).toLowerCase() === ".pdf");
    if (isPdf && !hasStructure && referenced === undefined) {
      unreadable.push({ file: STRUCTURE_FILENAME, why: "the source is a PDF and no extraction of its Info dictionary is on disk" });
    } else if (isPdf) {
      noSourceTitleBecause = "the PDF Info dictionary carries no usable /Title and no catalogue record names this entry";
    } else {
      noSourceTitleBecause = `the source (${sourceFiles[0]?.value || "none named"}) is not a PDF and no catalogue record names this entry`;
    }
  }

  const declared = {
    agent: [
      ...["author", "authors", "creator", "publisher"].flatMap((k) => fr("manifest.jsonld", `meta.${k}`, flat(meta[k]))),
      ...["author", "authors", "publisher"].flatMap((k) => fr("referenced.json", `identity.${k}`, flat(identity[k]))),
      ...fr("tabular.jsonld", "source.publisher", tsource.publisher),
    ],
    year: [
      ...["year", "date", "issued"].flatMap((k) => fr("manifest.jsonld", `meta.${k}`, yearOf(String(meta[k] ?? "")))),
      ...["year", "date"].flatMap((k) => fr("referenced.json", `identity.${k}`, yearOf(String(identity[k] ?? "")))),
    ],
  };
  const readable = {
    agent: [
      ...(dc ? fr(cat!.file, "dc.contributor.author", dcValue(dc, "contributor", "author")) : []),
      ...(dc ? fr(cat!.file, "dc.publisher", dcValue(dc, "publisher")) : []),
      ...fr(STRUCTURE_FILENAME, "metadata.docinfo.Author", docinfo.Author),
    ],
    year: [
      ...(dc ? fr(cat!.file, "dc.date.issued", yearOf(dcValue(dc, "date", "issued"))) : []),
      ...fr(STRUCTURE_FILENAME, "metadata.docinfo.CreationDate", yearOf(str(docinfo.CreationDate))),
    ],
  };

  return {
    id,
    instance,
    title: typeof manifest?.title === "string" ? manifest.title : null,
    docId: str(meta.doc_id),
    sourceFiles,
    sourceTitles,
    declared,
    readable,
    bibliographicReason: str(meta.bibliographic_not_in_source) || null,
    noSourceTitleBecause,
    unreadable,
  };
}

/** A list of names flattened to one string, so `["A", "B"]` and `"A; B"` read alike. */
function flat(v: unknown): string {
  if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x : str(obj(x).name))).filter(Boolean).join("; ");
  return str(v);
}

/**
 * Whether a PDF Info `/Title` says anything about the document.
 *
 * Authoring tools fill it with the file they were saving — "Microsoft Word -
 * draft3.docx", "untitled" — and comparing a real title against that would
 * accuse the entry of disagreeing with nothing.
 */
export function usableSourceTitle(t: string, sourceFiles: readonly FieldRead[] = []): boolean {
  const s = t.trim();
  if (s.length < 3) return false;
  if (/^(untitled|title|document\d*|microsoft (word|powerpoint) -.*)$/i.test(s)) return false;
  if (/\.(docx?|pptx?|pdf|tex|indd|odt|rtf)$/i.test(s)) return false;
  return !sourceFiles.some((f) => sameName(s, f.value));
}

// ── Judging (pure) ──────────────────────────────────────────────────────────

/** Lower-case letters and digits only — hyphenation, case and punctuation dropped. */
export function compact(s: string): string {
  return s.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function sameName(title: string, file: string): boolean {
  const t = title.trim().toLowerCase();
  const f = basename(file.trim()).toLowerCase();
  return t === f || t === f.slice(0, f.length - extname(f).length);
}

/** Levenshtein similarity in [0, 1] over the compacted strings. */
export function similarity(a: string, b: string): number {
  const x = compact(a);
  const y = compact(b);
  if (!x.length && !y.length) return 1;
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const cur = [i];
    for (let j = 1; j <= y.length; j++) {
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (x[i - 1] === y[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return 1 - prev[y.length]! / Math.max(x.length, y.length);
}

/**
 * Two titles agree when their compacted forms are at least this similar.
 *
 * 0.9 is set by the corpus, both ways. It accepts what is the same title
 * damaged by extraction — `MERLEAN: … AUTOFOR- MALIZATION` against the PDF's
 * `MerLean: … Autoformalization` compacts to identical, and `A Skill-Based
 * Agentic Pipeline` against `A Skill-Based AI Agentic Pipeline` is 0.97. It
 * refuses a truncation (`Algorithmic Approaches to`, 0.31) and an overrun
 * that swallowed the front matter (`JSON-LD 1.1 This version: Latest
 * published version: …`).
 */
export const AGREE_AT = 0.9;

/** Why a title is no title at all, or `null`. */
export function titleMissing(f: Pick<EntryFacts, "title" | "id" | "docId" | "sourceFiles">): FieldRead & { why: string } | null {
  const t = (f.title ?? "").trim();
  const at = { file: "manifest.jsonld", field: "title", value: f.title ?? "" };
  if (!t) return { ...at, why: "absent" };
  if (t === f.id || (f.docId && t === f.docId)) return { ...at, why: "equals the slug" };
  const file = f.sourceFiles.find((s) => sameName(t, s.value));
  if (file) return { ...at, why: `equals the source file name (${file.file} ${file.field})` };
  return null;
}

/** A single token shorter than this is not a title — *Abies*, *beans*. */
export const SHORT_TOKEN = 16;

/** Every way a present title is implausible. Empty means none found. */
export function titleImplausible(
  f: Pick<EntryFacts, "title" | "sourceTitles">,
): { why: string; source?: FieldRead; similarity?: number }[] {
  const t = (f.title ?? "").trim();
  const out: { why: string; source?: FieldRead; similarity?: number }[] = [];
  if (!/\s/.test(t) && t.length < SHORT_TOKEN) out.push({ why: "a single short token" });
  const words = t.toLowerCase().split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}]/gu, "")).filter(Boolean);
  const doubled = words.find((w, i) => i > 0 && w === words[i - 1] && w.length > 1);
  if (doubled) out.push({ why: `a doubled word ("${doubled}")` });
  // The FIRST source title is the authority — the record before the PDF.
  const src = f.sourceTitles[0];
  if (src) {
    const s = similarity(t, src.value);
    if (s < AGREE_AT) out.push({ why: "disagrees with the source's own metadata", source: src, similarity: Math.round(s * 100) / 100 });
  }
  return out;
}

/** Which half of the bibliographic record is missing, or `[]`. */
export function bibliographicMissing(f: Pick<EntryFacts, "declared" | "bibliographicReason">): string[] {
  if (f.bibliographicReason) return [];
  return [
    ...(f.declared.agent.length ? [] : ["author/publisher"]),
    ...(f.declared.year.length ? [] : ["year"]),
  ];
}

// ── The corpus ──────────────────────────────────────────────────────────────

export interface Judgement {
  families: Record<string, { summary: string; entries: unknown[] }>;
  entries: number;
}

const SUMMARIES: Record<string, string> = {
  "title-missing":
    "The manifest's title is absent, the slug, or the source's file name — the entry has no title a reader can use. " +
    "Read from manifest.jsonld `title`.",
  "title-implausible":
    "A title that is present but not believable: a single short token, a doubled word, or one that disagrees with the " +
    "source's own metadata (Dublin Core dc.title, referenced.json identity.title, then PDF Info /Title — authority first). " +
    "Only titles that passed title-missing are judged here.",
  "title-source-absent":
    "The source carries no title of its own, so the agreement test in title-implausible was NOT made. Listed so that " +
    "'not checked' cannot read as 'agrees'. Only entries that passed title-missing are listed.",
  "bibliographic-missing":
    "No author/publisher, or no year, among the fields the entry itself declares (manifest meta, referenced.json identity, " +
    "tabular.jsonld source), and no `meta.bibliographic_not_in_source` reason. `readableIn` lists where the value IS on " +
    "disk but not carried — what a fix would read.",
  "block-no-content":
    "Prose blocks the library viewer renders as '(no content carried)' while the entry holds words. A heading-only " +
    "section (summary status `empty`) is not counted: its text is in its subsections. `withheld` says when " +
    "the publication gate suppressed the verbatim text by design — the remedy then is a summary, which a withheld entry " +
    "may publish.",
  "summary-backlog":
    "Prose blocks with no current agent summary, per entry. A count, advisory: the drain is slow on purpose.",
  "could-not-determine":
    "A file the judgement needs exists and would not parse, or a PDF source has no extraction to read. Never a pass — " +
    "the one family `--check` fails on.",
};

/** Judge the given entries. Pure over the filesystem it is pointed at. */
export function judge(entries: readonly LibraryEntry[], repoRoot: string): Judgement {
  const fam: Record<string, unknown[]> = Object.fromEntries(Object.keys(SUMMARIES).map((k) => [k, []]));
  for (const e of [...entries].sort((a, b) => a.instance.localeCompare(b.instance) || a.id.localeCompare(b.id))) {
    const dir = join(repoRoot, e.dir);
    const at = { entry: e.id, instance: e.instance };
    const f = readEntryFacts(dir, e.id, e.instance);

    for (const u of f.unreadable) fam["could-not-determine"]!.push({ ...at, file: u.file, why: u.why });

    const missing = titleMissing(f);
    if (missing) {
      fam["title-missing"]!.push({ ...at, title: f.title, field: `${missing.file} ${missing.field}`, why: missing.why });
    } else {
      for (const i of titleImplausible(f)) {
        fam["title-implausible"]!.push({
          ...at,
          title: f.title,
          field: "manifest.jsonld title",
          why: i.why,
          ...(i.source ? { source: `${i.source.file} ${i.source.field}`, sourceTitle: i.source.value, similarity: i.similarity } : {}),
        });
      }
      if (f.noSourceTitleBecause) fam["title-source-absent"]!.push({ ...at, title: f.title, why: f.noSourceTitleBecause });
    }

    const bib = bibliographicMissing(f);
    if (bib.length) {
      const readableIn = [
        ...(bib.includes("author/publisher") ? f.readable.agent : []),
        ...(bib.includes("year") ? f.readable.year : []),
      ].map((r) => ({ field: `${r.file} ${r.field}`, value: r.value.length > 80 ? r.value.slice(0, 77) + "..." : r.value }));
      fam["bibliographic-missing"]!.push({
        ...at,
        missing: bib,
        field: "manifest.jsonld meta; referenced.json identity; tabular.jsonld source",
        ...(readableIn.length ? { readableIn } : {}),
      });
    }

    // Blocks, read exactly as the viewer's projection reads them — a withheld
    // entry with `verbatim: false` — so "(no content carried)" here is the
    // same predicate as the viewer's `if (b.content) … else`.
    const blockFiles = existsSync(join(dir, "blocks"))
      ? readdirSync(join(dir, "blocks")).filter((n) => n.endsWith(".jsonld")).length
      : 0;
    const blocks = readEntryBlocks(dir, { verbatim: !e.withheld });
    if (blocks.length < blockFiles) {
      fam["could-not-determine"]!.push({ ...at, file: "blocks/", why: `${blockFiles - blocks.length} of ${blockFiles} block file(s) will not parse` });
    }
    // A section whose own body is empty — a parent heading whose text lives
    // in its subsections — is a determined fact about the source, and the
    // summary drain already names it `empty`. It is not the defect #1794 is
    // about (words on disk, none on the page), so it is left out here.
    const prose = blocks.filter((b) => b.kind === "prose");
    const empty = prose.filter((b) => !b.content && b.summary?.status !== "empty");
    if (empty.length && e.words > 0) {
      fam["block-no-content"]!.push({
        ...at,
        blocks: empty.length,
        of: prose.length,
        words: e.words,
        field: "blocks/*.jsonld text -> sections/*.md",
        ...(e.withheld ? { withheld: e.withheld } : {}),
        summarised: empty.filter((b) => b.summary?.text).length,
      });
    }

    const t = tally(blocks.flatMap((b) => (b.summary ? [b.summary] : [])));
    if (t.backlog > 0) fam["summary-backlog"]!.push({ ...at, backlog: t.backlog, prose: t.prose });
  }
  const families = Object.fromEntries(
    Object.entries(SUMMARIES).map(([k, summary]) => [k, { summary, entries: fam[k]! }]),
  );
  return { families, entries: entries.length };
}

/** The sidecar document for a judgement. */
export function resultOf(j: Judgement, root: string = ROOT): QaResult {
  return buildQaResult({
    script: SCRIPT,
    scriptAbsPath: join(root, SCRIPT),
    subject: { kind: "library", id: "library-entries" },
    families: j.families,
  });
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const repoRoot = repoRootFor(ROOT);
  const g = readLibraryGraph([ROOT, repoRoot], repoRoot);
  if (g === null) {
    console.log("  · no library directory is declared — nothing to judge");
    process.exit(0);
  }
  const j = judge(g.entries, repoRoot);
  const result = resultOf(j);

  console.log(`Library entry QA  (${j.entries} entries)`);
  for (const [name, f] of Object.entries(result.families)) {
    console.log(`  ${f.count === 0 ? "✓" : "·"} ${name}: ${f.count}`);
  }

  const undetermined = result.families["could-not-determine"]?.count ?? 0;
  if (check) {
    const state = qaResultState(qaResultPath(ROOT, STEM), result);
    if (state !== "current") {
      console.error(`\n  ✗ ${STEM}.qa-results.json is ${state} — run \`bun run check:library-qa\``);
      process.exit(1);
    }
  } else {
    writeQaResult(ROOT, STEM, result);
  }
  if (undetermined > 0) {
    console.error(`\n  ✗ ${undetermined} judgement(s) could not be made — see could-not-determine`);
    process.exit(1);
  }
}
