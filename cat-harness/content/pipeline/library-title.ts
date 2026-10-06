/**
 * Where a library entry's title comes from: ONE resolver, one order.
 *
 * @module content/pipeline/library-title
 * @covers library
 *
 * Issue #1794, bean `8iqc`. Owner's ruling of 2026-10-01 (option 2 of 4):
 *
 * > title authority order = catalogue record (IRIS Dublin Core) →
 * > `referenced.json` → PDF Info `/Title` → slug. NEVER use the page-1
 * > front-matter parse as a title.
 *
 * ## Why the page-1 parse is out, not just demoted
 *
 * `pdf-structure.py`'s `parse_front_matter` reads the first non-furniture lines
 * of page 1. It is a heuristic that guesses which lines are the title, and on
 * this corpus it guessed *"Abies"* for a 1993 scan whose catalogue record says
 * *"WHO editorial style manual"*. It also guessed *"LeanArchitect
 * LeanArchitect"*, *"Algorithmic Approaches to"*, and titles that ran on into
 * the authors or the W3C status block. A slug is honest about being a
 * placeholder, and `check:library-qa` flags it as `title-missing`. A plausible
 * wrong title passes every check that does not hold a second source. So the
 * parse may still feed other uses (the section files' `doc_title`, search),
 * but nothing here reads `metadata.title` from a PDF structure.
 *
 * ## The one slot the ruling did not name: `text-heading`
 *
 * The four sources assume a PDF. A `text-structure/v1` or
 * `notebook-structure/v1` entry, ingested from Markdown, a spec repository or
 * a notebook, has no Info dictionary. Its `metadata.title` is the format's
 * own declared title: a front-matter `title:` field, an explicit `--title`,
 * or the level-1 heading the author marked as the title. That is the same
 * kind of fact as `/Title` (the source's own metadata) and not a guess about
 * which lines on a page are the title. It takes the `pdf-info` rank. The two
 * are exclusive by variant, so no entry ever has both.
 *
 * ## The junk filter
 *
 * `/Title` is filled by whatever program wrote the PDF, and many write the
 * file they were saving. {@link pdfInfoTitleJunk} refuses those, and the
 * resolver then falls through to the slug. The same filter applies to a
 * `text-heading`, whose writer falls back to the file name or the slug when
 * the source declares nothing. A junk `/Title` therefore reads as
 * "no title" rather than as a wrong title.
 *
 * ## Two slots from bean `w6fu` (owner's ruling of 2026-10-02 on #1838)
 *
 * Ruling 3 of #1838 came a day after #1794's: *first improve the code that
 * extracts titles from PDFs, then fix whatever it still gets wrong as data,
 * one entry at a time.* It produced two things a `pdf-structure/v1` entry can
 * now carry, and each takes a slot here without reopening #1794:
 *
 * - `editorial` — `metadata.title_correction.title`, an editor's record made
 *   for one entry with its `basis`. It is the TOP of the order: it is data a
 *   person wrote after looking, which is what the catalogue record is too,
 *   only closer to the entry. Taken as written, like the other records.
 * - `corroborated` — `metadata.title` ONLY when `metadata.title_verified` is
 *   `true`, i.e. `_pdf_title.py` found an independent source agreeing with it.
 *   It ranks below `/Title` and `text-heading` and above the slug. An
 *   UNVERIFIED `metadata.title` is still the page-1 guess #1794 excludes, and
 *   is never read. The junk filter applies, as to every machine-read source.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";

import { directoriesForGraph } from "../../schemas/cat-harness.js";

/** Where a manifest's title came from. Recorded as `meta.title_source`. */
export const LIBRARY_TITLE_SOURCES = [
  "editorial",
  "dc-record",
  "referenced",
  "pdf-info",
  "text-heading",
  "corroborated",
  "slug",
] as const;
export type LibraryTitleSource = (typeof LIBRARY_TITLE_SOURCES)[number];

/**
 * The authority order. The first one present wins, and `slug` is the floor.
 * A test mutates this order and expects to go red.
 */
export const TITLE_AUTHORITY: readonly Exclude<LibraryTitleSource, "slug">[] = [
  "editorial",
  "dc-record",
  "referenced",
  "pdf-info",
  "text-heading",
  "corroborated",
];

/**
 * The sources a program read rather than a person transcribed. Each passes
 * {@link pdfInfoTitleJunk} before it can win; a record is taken as written.
 */
export const MACHINE_TITLE_SOURCES: readonly LibraryTitleSource[] = ["pdf-info", "text-heading", "corroborated"];

/** What an entry offers, one value per source, each already read off disk. */
export interface TitleCandidates {
  slug: string;
  /** `structure.json` `metadata.title_correction.title`: an editor's record (bean `w6fu`). */
  editorial?: string | null;
  /** The catalogue's Dublin Core `dc.title`, via the node whose `libraryId` is the slug. */
  "dc-record"?: string | null;
  /** `referenced.json` `identity.title`. */
  referenced?: string | null;
  /** `structure.json` `metadata.docinfo.Title`, on a `pdf-structure/v1` entry. */
  "pdf-info"?: string | null;
  /** `structure.json` `metadata.title`, on a text or notebook entry ONLY. */
  "text-heading"?: string | null;
  /** `structure.json` `metadata.title` on a `pdf-structure/v1` entry, ONLY when `metadata.title_verified` is true. */
  corroborated?: string | null;
  /** The source file name(s), so a `/Title` that merely repeats one is refused. */
  sourceFiles?: readonly string[];
}

/** Where each source is read from. Written to `meta.title_from` beside the source. */
export interface ResolvedTitle {
  title: string;
  source: LibraryTitleSource;
}

/**
 * Why a PDF Info `/Title` says nothing about the document, or `null` when it
 * is usable.
 *
 * Every rule here is something this corpus's `/Title` fields carry:
 * `Microsoft Word - gurel_emet.doc`, `(Microsoft Word - dp1.LSA_Intr…)`,
 * `How AI-Mediated RACI Matrix.pdf`, and the arXiv margin stamp
 * `arXiv:0909.4061v2 [math.NA] 14 Dec 2010`, which is an identifier and not a
 * name.
 */
export function pdfInfoTitleJunk(raw: string, sourceFiles: readonly string[] = [], slug?: string): string | null {
  // Some writers wrap the string in its own literal parentheses or quotes.
  const t = raw.trim().replace(/^\((.*)\)$/s, "$1").trim();
  if (t.length < 3) return "empty or shorter than 3 characters";
  if (!/\p{L}/u.test(t)) return "carries no letters";
  if (/^(untitled|title|document\s*\d*|untitled document|powerpoint presentation|slide \d+)$/i.test(t)) {
    return "a placeholder the authoring tool writes";
  }
  if (/^microsoft (word|powerpoint|excel)\s*-/i.test(t)) return "the authoring tool's name for the file it saved";
  if (/^arxiv:\S+/i.test(t)) return "the arXiv identifier stamp, not a title";
  if (/\.(docx?|pptx?|xlsx?|pdf|tex|indd|odt|rtf|txt)$/i.test(t)) return "ends in a file extension";
  const lower = t.toLowerCase();
  for (const f of sourceFiles) {
    const b = basename(f.trim()).toLowerCase();
    if (lower === b || lower === b.slice(0, b.length - extname(b).length)) return "equals the source file name";
  }
  if (slug && lower === slug.toLowerCase()) return "equals the slug";
  return null;
}

const clean = (v: string | null | undefined): string => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");

/**
 * Pick the title by {@link TITLE_AUTHORITY}. Pure.
 *
 * `order` is a parameter only so a test can show that the order is what
 * decides. Callers never pass it.
 */
export function resolveLibraryTitle(
  c: TitleCandidates,
  order: readonly Exclude<LibraryTitleSource, "slug">[] = TITLE_AUTHORITY,
): ResolvedTitle {
  for (const source of order) {
    const v = clean(c[source]);
    if (!v) continue;
    // The source's OWN declared title, either variant, may be junk. A record
    // someone transcribed (DC, referenced.json) is taken as written.
    if (MACHINE_TITLE_SOURCES.includes(source) && pdfInfoTitleJunk(v, c.sourceFiles ?? [], c.slug)) continue;
    return { title: v, source };
  }
  return { title: c.slug, source: "slug" };
}

// ── Reading the candidates off disk ─────────────────────────────────────────

type Json = Record<string, unknown>;

/** `undefined` for absent, `null` for present and unparseable. */
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

/** One Dublin Core field's first value, `element.qualifier` or bare `element`. */
export function dcValue(rec: Json, element: string, qualifier?: string): string {
  const fields = Array.isArray(rec.fields) ? (rec.fields as Json[]) : [];
  const f = fields.find((x) => x.element === element && (qualifier ? x.qualifier === qualifier : !x.qualifier));
  const vals = Array.isArray(f?.values) ? (f!.values as Json[]) : [];
  return str(vals[0]?.value);
}

/**
 * The catalogue node naming this entry (`libraryId`), in its instance's
 * declared `catalogue` graph, and the Dublin Core record it points at.
 *
 * A node that names a record which is absent or will not parse goes into
 * `unreadable`. It is not reported as "no record": the record exists, and an
 * entry titled from the PDF over it would be exactly the R8 defect.
 */
export function catalogueRecordFor(
  instanceRoot: string,
  slug: string,
  unreadable: { file: string; why: string }[] = [],
): { file: string; rec: Json } | undefined {
  let cats: string[];
  try {
    cats = directoriesForGraph(instanceRoot, "catalogue");
  } catch {
    // A staged entry outside any instance has no catalogue to ask.
    return undefined;
  }
  for (const cat of cats) {
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

/**
 * What a parsed `structure.json` offers, read without touching the disk.
 *
 * On a `pdf-structure/v1` it reads `metadata.docinfo.Title`, and
 * `metadata.title` ONLY when `metadata.title_verified` is true
 * (`corroborated`). An unverified `metadata.title` there is the page-1 parse,
 * and the ruling is that it is never a title. On a text or notebook variant
 * `metadata.title` is the format's declared title (`text-heading`). On any
 * variant `metadata.title_correction.title` is an editor's record
 * (`editorial`).
 */
export function structureTitleCandidates(structure: Json): Pick<EntryTitleRead, "from"> & {
  candidates: Pick<TitleCandidates, StructureTitleSource | "sourceFiles">;
} {
  const meta = obj(structure.metadata);
  const file = str(obj(structure.source).file);
  const candidates: Pick<TitleCandidates, StructureTitleSource | "sourceFiles"> = { sourceFiles: file ? [file] : [] };
  const from: EntryTitleRead["from"] = {};
  const corrected = str(obj(meta.title_correction).title);
  if (corrected) {
    candidates.editorial = corrected;
    from.editorial = "structure.json metadata.title_correction.title";
  }
  if (structure._schema === "pdf-structure/v1") {
    const t = str(obj(meta.docinfo).Title);
    if (t) {
      candidates["pdf-info"] = t;
      from["pdf-info"] = "structure.json metadata.docinfo.Title";
    }
    const verified = meta.title_verified === true ? str(meta.title) : "";
    if (verified) {
      candidates.corroborated = verified;
      from.corroborated = "structure.json metadata.title";
    }
  } else {
    const t = str(meta.title);
    if (t) {
      candidates["text-heading"] = t;
      from["text-heading"] = "structure.json metadata.title";
    }
  }
  return { candidates, from };
}

/** The sources a parsed `structure.json` can offer. */
export const STRUCTURE_TITLE_SOURCES = ["editorial", "pdf-info", "text-heading", "corroborated"] as const;
type StructureTitleSource = (typeof STRUCTURE_TITLE_SOURCES)[number];

/** The candidates for one entry, and where each was read. */
export interface EntryTitleRead {
  candidates: TitleCandidates;
  /** `<file> <field>` for each source present, so the manifest can say where. */
  from: Partial<Record<LibraryTitleSource, string>>;
  /** Files that exist and would not parse. Non-empty means the title could not be determined. */
  unreadable: { file: string; why: string }[];
}

/**
 * Read every title candidate an entry directory offers.
 *
 * `structure` and `referenced` are passed in when the caller has already read
 * them, so the generator does not parse a file twice. The catalogue lives at
 * the INSTANCE root, two levels above `library/<slug>` — above `locatedAt`,
 * which differs from `dir` only for a staged entry being built for the
 * library it will be promoted into (bean `apui`).
 */
export function readTitleCandidates(
  dir: string,
  slug: string,
  pre: { structure?: Json; referenced?: Json; sourceFiles?: readonly string[] } = {},
  locatedAt: string = dir,
): EntryTitleRead {
  const unreadable: { file: string; why: string }[] = [];
  const from: EntryTitleRead["from"] = {};
  const candidates: TitleCandidates = { slug, sourceFiles: pre.sourceFiles ?? [] };

  const cat = catalogueRecordFor(dirname(dirname(locatedAt)), slug, unreadable);
  if (cat) {
    candidates["dc-record"] = dcValue(cat.rec, "title");
    if (candidates["dc-record"]) from["dc-record"] = `${cat.file} dc.title`;
  }

  const referenced = pre.referenced ?? readJsonFile(join(dir, "referenced.json")) ?? undefined;
  const refTitle = str(obj(referenced?.identity).title);
  if (refTitle) {
    candidates.referenced = refTitle;
    from.referenced = "referenced.json identity.title";
  }

  if (pre.structure) {
    const st = structureTitleCandidates(pre.structure);
    for (const k of STRUCTURE_TITLE_SOURCES) {
      if (st.candidates[k]) {
        candidates[k] = st.candidates[k];
        from[k] = st.from[k];
      }
    }
    candidates.sourceFiles = [...(candidates.sourceFiles ?? []), ...(st.candidates.sourceFiles ?? [])];
  }
  return { candidates, from, unreadable };
}
