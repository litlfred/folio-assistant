#!/usr/bin/env bun
/**
 * The ingest writer — Stage A/B artefacts become graph nodes.
 *
 * `pdf-structure.py` produces `structure.json` + `sections/*.md`, and
 * `extract-candidates.py` produces `candidates.json`. Both are flat. This
 * turns them into the same kind of graph the authored side emits, so one
 * loader, one `@context` and one QA sweep serve both populations.
 *
 * ```
 * library/<doc-id>/
 *   structure.json          Stage A  (input)
 *   sections/<sid>.md       Stage A  (input, and the prose block's text)
 *   candidates.json         Stage B  (input)
 *   manifest.jsonld         ← document node, ordered contains → sections
 *   sections/<sid>.jsonld   ← grouping node, ordered contains → blocks
 *   blocks/<bid>.jsonld     ← content blocks
 *   blocks/<bid>.md         ← an extracted claim's text
 * ```
 *
 * ## A tabular entry is a second rung, not the same one with holes
 *
 * `tabular-records.py` writes `tabular.jsonld` and no Stage A output at all.
 * It gets its own branch (`content/pipeline/tabular-nodes.ts`, bean `p67i`)
 * rather than a parameterised `buildDocumentNodes`, because the shapes differ
 * where it matters: a workbook's grouping node is a *sheet*, and a CSV has no
 * grouping node whatsoever — its tables hang off the manifest, because the
 * source genuinely has no sheets (`jg8s`).
 *
 * ```
 * library/<doc-id>/
 *   tabular.jsonld          (input — or tabular.csvw.json, once eief lands)
 *   manifest.jsonld         ← contains → sheets, OR → blocks for a CSV
 *   sheets/<key>.jsonld     ← grouping node, workbook only
 *   blocks/table-NNN.jsonld ← one per sheet, carrying the header vocabulary
 * ```
 *
 * ## Blocks own the files; a section is a manifest
 *
 * A section node carries no text. Its `contains` is an **ordered** list of
 * block ids, exactly as a chapter holds sections and a section holds
 * `blocks[]` on the authored side. The section's prose becomes one `prose`
 * block whose `text` points at the *existing* `sections/<sid>.md` — no copy,
 * so the 24.7 M extracted characters stay exactly where the corpus-grep
 * checklist already looks for them.
 *
 * Extraction is therefore incremental rather than all-or-nothing: whatever
 * Stage B recognises becomes a typed block, and the rest stays in the prose
 * block. As extractors improve, prose shrinks and typed blocks multiply,
 * without the section's identity or its `@id` changing.
 *
 * ## These nodes are NOT folio content
 *
 * `candidates.json` says so itself — *"proposals only … nothing here is folio
 * content and nothing here creates Lean"* — and the graph must not blur it.
 * Every node here carries `provenance: "ingested"` and is attributed to its
 * source document, so a query can always separate *what this paper claims*
 * from *what the folio claims*. Promotion into `content/` stays the separate,
 * deliberate act that `document-intake` Stage 4 describes.
 *
 * Usage:
 *   bun run cat-harness/content/pipeline/gen-library-jsonld.ts
 *   bun run cat-harness/content/pipeline/gen-library-jsonld.ts --check
 *   bun run cat-harness/content/pipeline/gen-library-jsonld.ts --doc <doc-id>
 *
 * @module content/pipeline/gen-library-jsonld
 * @covers library, uploads
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "fs";
import { basename, dirname, join } from "path";
import { typesForKind } from "../../schemas/jsonld";
import { documentContext } from "../../schemas/content-context.ts";
import { termCurie } from "../../schemas/namespaces.ts";
import { LABEL_PREFIXES } from "../../schemas/constraints";
import { findContentRepoRoot } from "./repo-root";
import type { DocumentImage, ImagesSidecar } from "../../schemas/document-image.ts";
import { buildTabularNodes, tabularShapeOf } from "./tabular-nodes.ts";
import { TABULAR_CSVW_FILENAME } from "../../schemas/tabular-csvw.ts";
import { readStructure, STRUCTURE_FILENAME } from "../../schemas/document-structure.ts";
import type { INGEST_RUNGS } from "../../schemas/site-indexes.ts";
import { corpusDirectoriesForGraph } from "../../schemas/harness-config.js";
import { applyVocabMapping, vocabMapping, type VocabMapping } from "../../schemas/vocab-mapping.ts";
import type { SourceLicence } from "../../schemas/source-licence.ts";
import { libraryAssetIri } from "../../schemas/library-iri.ts";
import { readDeclaration } from "../../schemas/cat-harness.ts";
import {
  readTitleCandidates,
  resolveLibraryTitle,
  structureTitleCandidates,
  type LibraryTitleSource,
} from "./library-title.ts";

/** A resolved manifest title and where it came from (issue #1794). */
export interface ManifestTitle {
  title: string;
  source: LibraryTitleSource;
  /** `<file> <field>` it was read from; absent for `slug`. */
  from?: string;
}

/**
 * The manifest fields that carry the title's provenance. `meta.title_source`
 * is one of `LIBRARY_TITLE_SOURCES`, and `check:library-qa` judges against it.
 */
function titleMeta(t: ManifestTitle, md?: Structure["metadata"]): Record<string, unknown> {
  return {
    title_source: t.source,
    title_from: t.from,
    // Bean `w6fu`: an editor's title and a corroborated one are each a CHECKED
    // title, and a corrected one keeps what extraction said beside it, so a
    // correction never passes for an extraction.
    title_verified: t.source === "editorial" || t.source === "corroborated" ? true : undefined,
    title_correction:
      t.source === "editorial" && md?.title_correction ? { ...md.title_correction, extracted: md.title ?? null } : undefined,
  };
}

interface StructureSection {
  id: string;
  number: string | null;
  title: string;
  level: number;
  page_start: number | null;
  page_end: number | null;
  n_chars: number;
  n_words: number;
}

interface Structure {
  _schema?: string;
  doc_id: string;
  source?: { file?: string; sha256?: string; pages?: number };
  metadata?: {
    title?: string | null;
    authors_raw?: string | null;
    arxiv?: string | null;
    doi?: string | null;
    title_source?: string;
    title_verified?: boolean;
    title_correction?: { title: string; basis: string; corrected_on: string; bean?: string };
  };
  sections?: StructureSection[];
}

interface Candidate {
  kind: string;
  statement?: string;
  name?: string | null;
  number?: string | null;
  section_file?: string;
  section_title?: string;
  pages?: string;
  formalization_candidate?: boolean;
  route_to?: string | null;
}

interface Candidates {
  document_class?: string;
  validated?: boolean;
  disposition?: string;
  candidates?: Candidate[];
}

/**
 * The AUTHORED licence record beside an entry, carried into `manifest.jsonld`
 * by {@link licenceProperties}: the licence as `dcterms:license`, the record
 * verbatim as `licenceRecord` — the field `check-source-licence` reads.
 *
 * A sidecar because the manifest is generated: a record written into it by hand
 * was erased by the next run, so until 2026-09-30 no licence, `stated` or
 * `unknown`, could survive a regeneration (folio-assistant#1492). Its shape is
 * the checker's (`licenceProblem`), which judges it; this only carries it.
 */
export const LICENCE_FILENAME = "licence.json";

/**
 * The entry's licence record, or `undefined` when there is no sidecar. A
 * sidecar that does not parse is NOT absent: it comes through with a status the
 * checker rejects, so it reports as malformed rather than as "not recorded".
 */
export function readLicence(dir: string): unknown {
  const path = join(dir, LICENCE_FILENAME);
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch (e) {
    return { status: "unparseable", note: `${LICENCE_FILENAME}: ${(e as Error).message}` };
  }
}

/** The instance this generator belongs to, whose `vocab-mappings/` it reads. */
const INSTANCE_ROOT = join(import.meta.dir, "..", "..");

let licenceNaming: VocabMapping | undefined;

/**
 * A manifest's licence properties, from the `licence-naming` table — the
 * SAME row a glossary's `dcterms:license` comes from (finding D4 of
 * `docs/proposals/vocabulary-mappings-2026-10-02.md`, bean `gzkt`, owner
 * ruling 2026-10-03: "move it").
 *
 * Until then the licence was `meta.licence`, inside the `@json` literal, so an
 * RDF reader saw a glossary's licence and never a library item's. Now:
 *
 * | record            | `license` (`dcterms:license`) | `licenceRecord` (`@json`) |
 * |-------------------|-------------------------------|---------------------------|
 * | absent            | —                             | —                         |
 * | `stated`, an `id` | the `id`, as written          | the record, verbatim      |
 * | `unknown`, or any other | — never invented        | the record, verbatim      |
 *
 * The record stays whole because the three-state rule lives in it (`unknown`
 * with where somebody searched is not absent), and only `@json` keeps it.
 */
export function licenceProperties(record: unknown): Record<string, unknown> {
  if (record === undefined) return {};
  const r = record as SourceLicence;
  const license = r?.status === "stated" && typeof r.id === "string" && r.id.trim() !== "" ? r.id : undefined;
  licenceNaming ??= vocabMapping(INSTANCE_ROOT, "licence-naming");
  return applyVocabMapping(licenceNaming, { license, licenceRecord: record });
}

/** `sec-000-1-introduction` → `sec-000`, the stable part of a section id. */
export function sectionKey(sectionId: string): string {
  const m = sectionId.match(/^(sec-\d+)/);
  return m ? m[1]! : sectionId;
}

/** Label prefix for a kind, without the colon. `prose` has none registered. */
function prefixFor(kind: string): string {
  const p = LABEL_PREFIXES[kind];
  return p ? p.replace(/:$/, "") : kind;
}

/**
 * Deterministic block id.
 *
 * Ordinal is the candidate's position *within its section*, so adding a
 * candidate to section 7 does not renumber section 3 — an `@id` is a public
 * contract once anything annotates it.
 */
export function blockId(kind: string, secKey: string, ordinal?: number): string {
  const base = `${prefixFor(kind)}-${secKey}`;
  return ordinal === undefined ? base : `${base}-${String(ordinal).padStart(2, "0")}`;
}

function docIri(docId: string, rest: string): string {
  return `library/${docId}/${rest}`;
}

/**
 * The entry's node IRIs. Every node keeps its relative `library/<id>/…` id
 * EXCEPT the manifest — the asset itself — which is named by the address its
 * JSON-LD is published at when the entry's instance is known (#1881,
 * `schemas/library-iri.ts`). A staged entry, outside any library, has no
 * instance yet and keeps the relative form until it is promoted and
 * regenerated; `--check` then reports it stale, so it cannot linger.
 */
function iriFor(docId: string, instance: string | undefined): (rest: string) => string {
  return (rest) => (rest === "manifest" && instance !== undefined ? libraryAssetIri(instance, docId) : docIri(docId, rest));
}

/**
 * The instance whose library holds `entryDir` — the folder holding the
 * library, when that folder declares an instance — else `undefined`. The same
 * answer `library-graph.ts` `instanceOf` gives, so the IRI minted here and
 * the page the viewer draws name one instance.
 */
export function libraryInstanceOf(entryDir: string): string | undefined {
  const instanceRoot = dirname(dirname(entryDir));
  return readDeclaration(instanceRoot) !== undefined ? basename(instanceRoot) : undefined;
}

/** Everything one document contributes, as files to write. */
export function buildDocumentNodes(
  docId: string,
  structure: Structure,
  candidates: Candidates | undefined,
  hasSectionMd: (sid: string) => boolean,
  images?: ImagesSidecar,
  licence?: unknown,
  titled?: ManifestTitle,
  instance?: string,
): Array<{ path: string; content: string }> {
  // Without a resolved title (a test, a caller with no disk), resolve from the
  // structure alone: the Info dictionary or a text heading, never the page-1
  // parse, then the slug. The walk passes one that has asked the catalogue.
  const resolvedTitle: ManifestTitle =
    titled ??
    (() => {
      const st = structureTitleCandidates(structure as unknown as Record<string, unknown>);
      const r = resolveLibraryTitle({ slug: docId, ...st.candidates });
      return { ...r, from: r.source === "slug" ? undefined : st.from[r.source] };
    })();
  const out: Array<{ path: string; content: string }> = [];
  const iri = iriFor(docId, instance);
  const sections = structure.sections ?? [];

  // Group candidates by the section file they were extracted from.
  const bySection = new Map<string, Candidate[]>();
  for (const c of candidates?.candidates ?? []) {
    const sid = (c.section_file ?? "").replace(/^sections\//, "").replace(/\.md$/, "");
    if (!sid) continue;
    const list = bySection.get(sid) ?? [];
    list.push(c);
    bySection.set(sid, list);
  }

  // Figures, by the page they sit on. Only FIGURES: of 164 placed images in
  // this corpus 140 are page scans, and a scan is the page itself rather than
  // something on it — `schemas/document-image.ts` carries the measurement.
  // `images: null` means the extractor could not look, which is not the same
  // as "no figures" and must not become an empty map silently; it does become
  // one here, but the sidecar keeps the reason and `pdf-images.py` exits 2.
  const figuresByPage = new Map<number, DocumentImage[]>();
  for (const img of images?.images ?? []) {
    if (img.role !== "figure" || img.basis === undefined) continue;
    const list = figuresByPage.get(img.basis.page) ?? [];
    list.push(img);
    figuresByPage.set(img.basis.page, list);
  }

  const sectionIris: string[] = [];

  // A figure belongs to the FIRST section whose page range contains it.
  //
  // Section ranges OVERLAP -- a section's `page_end` is the start page of the
  // next one, inclusive -- so without this a figure is emitted once per
  // containing section, every emission writing the SAME path with a different
  // `derivedFrom`. Measured 2026-09-22 on `smart-base/library/9789240093362-eng/`
  // (bean `imen`): page 71 falls inside FOUR sections, page 68 inside three,
  // page 30 inside two. Last write won, and `--check` then reported the losers
  // stale forever, because re-running reproduced the same race.
  //
  // It needed both an embedded outline (so sections have real ranges rather
  // than one page each) and placed raster figures, and no entry had both until
  // the WHO digital-health corpus arrived. The comment below on `page_end`
  // shows the single-page case WAS considered; the overlapping one was not.
  //
  // FIRST rather than last, on the owner's ruling of 2026-09-22 (issue #877):
  // it matches reading order, so a figure introduced at the end of a section
  // stays with the section that introduced it. Last is what the race happened
  // to land on and is not a reason.
  const figureOwned = new Set<string>();

  for (const sec of sections) {
    const key = sectionKey(sec.id);
    const contained: string[] = [];

    // The section's own prose, pointing at the file Stage A already wrote.
    if (hasSectionMd(sec.id)) {
      const bid = blockId("prose", key);
      contained.push(iri(`blocks/${bid}`));
      out.push({
        path: `blocks/${bid}.jsonld`,
        content: node({
          "@id": iri(`blocks/${bid}`),
          "@type": typesForKind("prose"),
          kind: "prose",
          title: sec.title,
          pageStart: sec.page_start ?? undefined,
          pageEnd: sec.page_end ?? undefined,
          text: `../sections/${sec.id}.md`,
          derivedFrom: iri("manifest"),
          sourceDocument: iri("manifest"),
          provenance: "ingested",
        }),
      });
    }

    // Typed blocks for whatever Stage B recognised in this section.
    const cands = bySection.get(sec.id) ?? [];
    cands.forEach((c, i) => {
      const bid = blockId(c.kind, key, i + 1);
      const statement = (c.statement ?? "").trim();
      contained.push(iri(`blocks/${bid}`));
      out.push({
        path: `blocks/${bid}.jsonld`,
        content: node({
          "@id": iri(`blocks/${bid}`),
          "@type": typesForKind(c.kind),
          kind: c.kind,
          title: c.name ?? undefined,
          pageStart: sec.page_start ?? undefined,
          pageEnd: sec.page_end ?? undefined,
          text: statement ? `${bid}.md` : undefined,
          derivedFrom: iri(`sections/${key}`),
          sourceDocument: iri("manifest"),
          provenance: "ingested",
        }),
      });
      if (statement) out.push({ path: `blocks/${bid}.md`, content: `${statement}\n` });
    });

    // Figures whose page falls in this section. A section with no `page_end`
    // claims only its start page — the same rule `pdf-tables.py` applies, so
    // a figure and a table on one page are attributed to the same section.
    const from = sec.page_start ?? undefined;
    const to = sec.page_end ?? sec.page_start ?? undefined;
    if (from !== undefined && to !== undefined) {
      for (let pg = from; pg <= to; pg++) {
        for (const img of figuresByPage.get(pg) ?? []) {
          // An earlier section already claimed it; `sections` is in document
          // order, so "already claimed" IS "first containing section".
          if (figureOwned.has(img.id)) continue;
          figureOwned.add(img.id);
          const bid = `figure-${img.id}`;
          contained.push(iri(`blocks/${bid}`));
          out.push({
            path: `blocks/${bid}.jsonld`,
            content: node({
              "@id": iri(`blocks/${bid}`),
              "@type": typesForKind("figure"),
              kind: "figure",
              // Relative to the block, as `text` already is for prose.
              file: `../${img.file}`,
              pageStart: pg,
              pageEnd: pg,
              // Carried through so a reader can see the description's STATE,
              // not merely its absence: "nobody has written one" and "a human
              // rejected the draft" are different facts.
              narrative: img.narrative ?? undefined,
              derivedFrom: iri(`sections/${key}`),
              sourceDocument: iri("manifest"),
              provenance: "ingested",
            }),
          });
        }
      }
    }

    const sIri = iri(`sections/${key}`);
    sectionIris.push(sIri);
    out.push({
      path: `sections/${key}.jsonld`,
      content: node({
        "@id": sIri,
        "@type": ["doco:Section"],
        title: sec.title,
        pageStart: sec.page_start ?? undefined,
        pageEnd: sec.page_end ?? undefined,
        // Ordered: reading order is the document's, and losing it would make
        // the section a bag rather than a sequence.
        contains: contained,
        derivedFrom: iri("manifest"),
        sourceDocument: iri("manifest"),
        provenance: "ingested",
      }),
    });
  }

  out.push({
    path: "manifest.jsonld",
    content: node({
      "@id": iri("manifest"),
      "@type": [termCurie("SourceDocument")],
      // NEVER the unverified `structure.metadata.title` — the page-1 parse
      // (#1794, ruling of 2026-10-01). An editor's `title_correction` and a
      // corroborated extraction (bean `w6fu`, ruling of 2026-10-02 on #1838)
      // each have a slot. See `library-title.ts` for the order.
      title: resolvedTitle.title,
      contains: sectionIris,
      provenance: "ingested",
      ...licenceProperties(licence),
      meta: {
        doc_id: docId,
        ...titleMeta(resolvedTitle, structure.metadata),
        source_file: structure.source?.file,
        source_sha256: structure.source?.sha256,
        pages: structure.source?.pages,
        arxiv: structure.metadata?.arxiv ?? null,
        doi: structure.metadata?.doi ?? null,
        document_class: candidates?.document_class ?? null,
        extractor_validated: candidates?.validated ?? null,
        // Carried verbatim so a consumer cannot miss it.
        disposition:
          candidates?.disposition ??
          "ingested source material — attributed to its document, not folio content",
      },
    }),
  });

  return out;
}

/** Serialise, dropping undefined so output is byte-stable. */
function node(doc: Record<string, unknown>): string {
  const clean: Record<string, unknown> = { "@context": documentContext((doc["@type"] as string[] | undefined) ?? []) };
  for (const [k, v] of Object.entries(doc)) {
    if (v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    clean[k] = v;
  }
  return `${JSON.stringify(clean, null, 2)}\n`;
}

function readJson<T>(path: string): T | undefined {
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return undefined;
  }
}

/** Which ingest rung an entry is on — bean `p67i`. */
export type IngestRung = (typeof INGEST_RUNGS)[number];

/**
 * The input file that puts an entry on each rung, in precedence order.
 *
 * A table rather than a chain of `existsSync` in the walk: the decision is
 * then something a test can hold, and a rung added here cannot be one the
 * walk silently ignores. `check-l1-complete.ts` settled the same question the
 * same way with `KIND_SIDECAR`.
 */
export const RUNG_INPUT: ReadonlyArray<readonly [IngestRung, readonly string[]]> = [
  ["paged", [STRUCTURE_FILENAME]],
  ["tabular", ["tabular.jsonld", TABULAR_CSVW_FILENAME]],
  // A source RECORDED and not held (bean `scfh`): `referenced-source.py`
  // writes the record, and this writes the manifest, as for every other rung.
  ["referenced", ["referenced.json"]],
];

/**
 * `none` is a DETERMINED answer — the entry has no ingest input at all, which
 * is different from having one this could not read. The walk keeps those two
 * apart and reports them differently, because "never processed" and "present
 * but unreadable" point at different fixes.
 */
export function ingestRungOf(has: (file: string) => boolean): IngestRung {
  for (const [rung, inputs] of RUNG_INPUT) {
    if (inputs.some((f) => has(f))) return rung;
  }
  return "none";
}

/**
 * Directories that may sit between a manifest and a block.
 *
 * `sections/` for a paged document, `sheets/` for a workbook. A CSV uses
 * neither — its tables hang off the manifest, because the source has no
 * sheets to model (`jg8s`).
 */
export const GROUPING_DIRS: readonly string[] = ["sections", "sheets"];

/**
 * `library/<id>/blocks/<bid>` → `<bid>`; anything else → `undefined`.
 *
 * Narrow on purpose. A manifest's `contains` points at *sections* for a paged
 * document and at *blocks* for a CSV, so the same scan now sees both kinds of
 * reference — and taking the last path segment of either would enter
 * `page-001` into the block reference set, where it could mask an orphan of
 * that name. Only a reference that actually names a block counts as one.
 */
export function blockRefIn(ref: string): string | undefined {
  const parts = ref.split("/");
  const id = parts.pop();
  return id && parts.pop() === "blocks" ? id : undefined;
}

/**
 * Generated block files that nothing references any more — bean `d5f1`.
 *
 * This generator WRITES and never removed, so a block whose subject stopped
 * qualifying stayed on disk indefinitely. Measured 2026-09-20: reclassifying
 * 22 of 24 extracted images from `figure` to `logo` or `decorative` left 22
 * orphaned block files asserting, among other things, that the JSTOR
 * publisher mark is a figure of Milnor's paper. Nothing pointed at them, so
 * nothing failed — the directory simply carried false statements.
 *
 * It REPORTS and never deletes. Four of the five repository-health checks are
 * about artefacts accumulating and every one names a person as the actor; the
 * worked example in `deletion-requires-confirmation` is `plj1`, a workflow
 * whose shape deleted every open PR's preview without anybody deciding it.
 * Pruning here is a `--prune` a person passes.
 */
export function orphanedBlocks(
  dir: string,
  listFiles: (d: string) => string[],
  readText: (p: string) => string | undefined,
): string[] {
  const referenced = new Set<string>();
  // Everything that may point at a block. A paged document goes
  // manifest → section → block; a tabular one goes manifest → sheet → block,
  // or, for a CSV, manifest → block with NOTHING between, because a CSV has
  // no sheets. Scanning `sections/` alone made every table block of a tabular
  // entry look orphaned — and `--prune` deletes what this reports.
  const pointers: string[] = [join(dir, "manifest.jsonld")];
  for (const g of GROUPING_DIRS) {
    for (const f of listFiles(join(dir, g))) {
      if (f.endsWith(".jsonld")) pointers.push(join(dir, g, f));
    }
  }
  for (const p of pointers) {
    const body = readText(p);
    // ABSENT contributes nothing and is a determined empty: the manifest of an
    // entry that has not been generated names no blocks, and neither does a
    // grouping directory that is not there.
    if (body === undefined) continue;
    let contains: unknown;
    try {
      contains = (JSON.parse(body) as { contains?: unknown }).contains ?? [];
    } catch {
      // UNREADABLE is the other case: we cannot know what it references, and
      // an unknown reference set would make every block look orphaned. Refuse
      // to judge this directory rather than report a deletable list from it.
      return [];
    }
    if (!Array.isArray(contains)) return [];
    for (const c of contains as string[]) {
      if (typeof c !== "string") continue;
      const id = blockRefIn(c);
      if (id !== undefined) referenced.add(id);
    }
  }
  return listFiles(join(dir, "blocks"))
    .filter((f) => f.endsWith(".jsonld"))
    .map((f) => f.replace(/\.jsonld$/, ""))
    .filter((id) => !referenced.has(id))
    .sort();
}

/**
 * What one library entry becomes — three outcomes, and they are three facts.
 *
 * Extracted from the walk so the BRANCH is testable, not only the emitters it
 * calls (bean `p67i`). While this lived inline, the only way to exercise the
 * tabular rung was to put a dataset in `library/` — and a dataset in this
 * repository is content in the platform, so there was none, so the branch was
 * unreachable from CI. A tested function nothing calls and an untestable
 * caller are the same defect from two sides.
 */
export type EntryOutcome =
  | { state: "built"; rung: IngestRung; files: Array<{ path: string; content: string }> }
  /** No ingest input at all. A DETERMINED "not processed", and it passes. */
  | { state: "no-input" }
  /** An input is there and did not parse. Undetermined, and it fails. */
  | { state: "unreadable"; rung: IngestRung };

/** Resolve an entry's title by the authority order, or `undefined` if a record it names will not read. */
function entryTitle(
  dir: string,
  docId: string,
  pre: Parameters<typeof readTitleCandidates>[2],
  locatedAt: string = dir,
): ManifestTitle | undefined {
  const read = readTitleCandidates(dir, docId, pre, locatedAt);
  if (read.unreadable.length) return undefined;
  const r = resolveLibraryTitle(read.candidates);
  return { ...r, from: r.source === "slug" ? undefined : read.from[r.source] };
}

/**
 * `locatedAt` is where the entry WILL sit when it is not there yet. The
 * instance a manifest names is read off the entry's location, and a STAGED
 * entry sits in `ingest-staging/`, which belongs to whichever instance holds
 * the staging tree — not to the library it is being promoted into. Measured
 * 2026-10-06 (bean `apui`): a document staged and promoted into
 * a SIBLING instance's library carried a manifest `@id` naming
 * `cat-harness`, and `--check` called 37 of its nodes stale. So the files are
 * READ from `dir` and the identity is minted for `locatedAt`.
 */
export function buildEntryNodes(docId: string, dir: string, locatedAt: string = dir): EntryOutcome {
  const instance = libraryInstanceOf(locatedAt);
  const iri = iriFor(docId, instance);
  // Two ingest rungs reach this walk, and a tabular entry has no Stage A
  // output at all — no `structure.json`, no `sections/*.md` — so it is not a
  // `buildDocumentNodes` with different arguments. Its own branch, which is
  // `jg8s`'s rule one level up: model reality, do not force conformance.
  const rung = ingestRungOf((f) => existsSync(join(dir, f)));

  if (rung === "paged") {
    // Through the shared accessor (bean rkqp): a variant nobody declared is
    // `unreadable` here rather than half-rendered. The variant's own fields
    // (arXiv id, DOI, page count) are read off `raw`; a notebook has none of
    // them and they render as null, as a PDF without them always has.
    const read = readStructure(dir);
    if ("reason" in read) return { state: "unreadable", rung };
    const structure = read.raw as unknown as Structure;
    const candidates = readJson<Candidates>(join(dir, "candidates.json"));
    const images = readJson<ImagesSidecar>(join(dir, "images.json"));
    const licence = readLicence(dir);
    // A catalogue node names a record that will not read: the title cannot be
    // determined, and the slug over a record that exists is the R8 defect.
    const titled = entryTitle(dir, docId, { structure: read.raw as Record<string, unknown> }, locatedAt);
    if (!titled) return { state: "unreadable", rung };
    return {
      state: "built",
      rung,
      files: buildDocumentNodes(
        docId,
        structure,
        candidates,
        (sid) => existsSync(join(dir, "sections", `${sid}.md`)),
        images,
        licence,
        titled,
        instance,
      ),
    };
  }

  if (rung === "tabular") {
    const record =
      readJson<Record<string, unknown>>(join(dir, "tabular.jsonld")) ??
      readJson<Record<string, unknown>>(join(dir, TABULAR_CSVW_FILENAME));
    const shape = record ? tabularShapeOf(record) : undefined;
    // The record is there and we could not read it. Reporting an empty
    // document here would assert the dataset has no sheets, which is a claim
    // nobody made.
    if (!shape) return { state: "unreadable", rung };
    // A tabular record's `title` is its source FILE name (`tabularShapeOf`),
    // which is never a title. It goes in as a source file so nothing that
    // merely repeats it can be taken for one.
    const titled = entryTitle(dir, docId, { sourceFiles: shape.title ? [shape.title] : [] }, locatedAt);
    if (!titled) return { state: "unreadable", rung };
    return {
      state: "built",
      rung,
      files: buildTabularNodes(shape, {
        title: titled.title,
        iri,
        // Where the headers and shape came from. The manifest points at
        // sheets and blocks; without this nothing in the graph says which
        // record produced them.
        meta: { ...titleMeta(titled), tabular_record: record?.$schema },
        properties: licenceProperties(readLicence(dir)),
      }),
    };
  }

  if (rung === "referenced") {
    const record = readJson<{
      identity?: { title?: string };
      source?: { file?: string; sha256?: string; kind?: string; url?: string; canonical?: string; version?: string };
    }>(join(dir, "referenced.json"));
    // Two shapes of source (`schemas/referenced-source.ts`): one FILE, whose
    // bytes were hashed, or a PUBLICATION — a FHIR IG — identified by its
    // canonical and version, with nothing to hash. A record that is neither
    // is unreadable, and is reported so rather than guessed at.
    const src = record?.source;
    const published = src?.kind === "published" && !!src.canonical && !!src.version;
    if (!record || !src || (!published && !src.sha256)) return { state: "unreadable", rung };
    const titled = entryTitle(dir, docId, {
      referenced: record as Record<string, unknown>,
      sourceFiles: src.file ? [src.file] : [],
    }, locatedAt);
    if (!titled) return { state: "unreadable", rung };
    const manifest = {
      "@context": documentContext([termCurie("SourceDocument")]),
      "@id": iri("manifest"),
      "@type": [termCurie("SourceDocument")],
      title: titled.title,
      // EMPTY on purpose: the entry holds no content nodes. The manifest says
      // the source exists and that none of it is held here.
      contains: [],
      // The same value every manifest carries; `disposition` below says that
      // none of the source's text is held.
      provenance: "ingested",
      ...licenceProperties(readLicence(dir)),
      meta: published
        ? {
            // NO new keys here: `meta` is an opaque `@json` literal (finding
            // D4, #1873), so a field added to it is invisible to any graph
            // reader. The publication's canonical, version and URL stay in
            // `referenced.json`, where `ReferencedSourceSchema` types them.
            doc_id: docId,
            ...titleMeta(titled),
            disposition: "referenced source — an external publication, nothing copied",
          }
        : {
            doc_id: docId,
            ...titleMeta(titled),
            source_file: src.file,
            source_sha256: src.sha256,
            disposition: "referenced source — recorded, text withheld by licence",
          },
    };
    return {
      state: "built",
      rung,
      files: [{ path: "manifest.jsonld", content: JSON.stringify(manifest, null, 2) + "\n" }],
    };
  }

  // Not a parse failure to hide: an entry with no ingest input simply has not
  // been processed, and saying so is the point.
  return { state: "no-input" };
}

async function run(): Promise<number> {
  const argv = process.argv.slice(2);
  // ONE entry directory, wherever it is — a STAGED entry, before promotion.
  // `ingest-document.ts` runs this as the `referenced` rung's manifest arm
  // (bean `scfh`), so the manifest has one writer whether the entry is staged
  // or already in a library.
  if (argv.includes("--entry")) {
    const dir = argv[argv.indexOf("--entry") + 1]!;
    const outcome = buildEntryNodes(basename(dir), dir);
    if (outcome.state !== "built") {
      console.error(`gen-library-jsonld: ${dir}: ${outcome.state}`);
      return 1;
    }
    for (const f of outcome.files) {
      mkdirSync(dirname(join(dir, f.path)), { recursive: true });
      writeFileSync(join(dir, f.path), f.content);
    }
    console.log(`ok  ${basename(dir)}  ${outcome.files.length} file(s), rung ${outcome.rung}`);
    return 0;
  }
  const check = argv.includes("--check");
  const only = argv.includes("--doc") ? argv[argv.indexOf("--doc") + 1] : undefined;

  const root = findContentRepoRoot();
  // EVERY declared library, not the one. This GENERATES the JSON-LD the whole
  // corpus is read through, so a library it skips is a set of documents that
  // exist on disk and nowhere in the graph, with a clean exit code over them.
  //
  // `directoryForGraph` REFUSES here — `library` has three homes since bean
  // `frs5` — which is the accessor doing its job rather than picking one.
  //
  // declared-path-literal: the convention fallback, at the call site so the
  // choice is visible. An absent directory is handled below as "nothing to
  // ingest", which is the determined-empty third state.
  const declaredLibraries = corpusDirectoriesForGraph(root, "library");
  const libraryDirs = (declaredLibraries.length > 0 ? declaredLibraries : [join(root, "library")]).filter(
    (d) => existsSync(d),
  );
  if (libraryDirs.length === 0) {
    console.log(`gen-library-jsonld: no library/ under ${root} — nothing to ingest.`);
    return 0;
  }

  // A document is (id, WHICH library), because an id alone no longer locates
  // one. A slug in two libraries is REFUSED rather than merged: node ids are
  // composed from the slug, so ingesting both would overwrite one and the next
  // run would look idempotent.
  const docs: Array<{ docId: string; dir: string }> = [];
  const seen = new Map<string, string>();
  for (const libraryDir of libraryDirs) {
    for (const d of readdirSync(libraryDir).sort()) {
      if (d.startsWith(".")) continue;
      if (only && d !== only) continue;
      const dir = join(libraryDir, d);
      try {
        if (!statSync(dir).isDirectory()) continue;
      } catch {
        continue;
      }
      const prior = seen.get(d);
      if (prior !== undefined) {
        console.error(
          `gen-library-jsonld: slug "${d}" is declared in two libraries — ` +
            `${prior} and ${dir}. Node ids are composed from the slug, so ingesting ` +
            `both would silently overwrite one. Rename one, or declare only one library.`,
        );
        return 1;
      }
      seen.set(d, dir);
      docs.push({ docId: d, dir });
    }
  }

  const prune = argv.includes("--prune");
  const orphans: string[] = [];
  let pruned = 0;
  let written = 0;
  let unchanged = 0;
  let docsDone = 0;
  let blocks = 0;
  const stale: string[] = [];
  const skipped: string[] = [];
  // An input that is THERE and did not parse is NOT the same fact as an entry
  // with no input at all, and collapsing them would report an ingest failure
  // as "never ingested" — naming the wrong cause and the wrong fix.
  const unreadable: string[] = [];

  for (const { docId, dir } of docs) {
    const outcome = buildEntryNodes(docId, dir);
    if (outcome.state === "unreadable") {
      unreadable.push(docId);
      continue;
    }
    if (outcome.state === "no-input") {
      skipped.push(docId);
      continue;
    }
    const files = outcome.files;

    for (const f of files) {
      const abs = join(dir, f.path);
      const prev = existsSync(abs) ? readFileSync(abs, "utf-8") : undefined;
      if (prev === f.content) {
        unchanged++;
        continue;
      }
      if (check) {
        stale.push(`${docId}/${f.path}`);
        continue;
      }
      mkdirSync(join(abs, ".."), { recursive: true });
      writeFileSync(abs, f.content);
      written++;
    }
    docsDone++;
    blocks += files.filter((f) => f.path.startsWith("blocks/") && f.path.endsWith(".jsonld")).length;

    // After writing: what is on disk that no section points at any more?
    if (!check) {
      const found = orphanedBlocks(
        dir,
        (d) => (existsSync(d) ? readdirSync(d) : []),
        (f) => (existsSync(f) ? readFileSync(f, "utf-8") : undefined),
      );
      for (const id of found) {
        orphans.push(`${docId}/blocks/${id}.jsonld`);
        if (prune) {
          rmSync(join(dir, "blocks", `${id}.jsonld`), { force: true });
          // The `.md` sibling a typed block may carry goes with it, or it
          // becomes an orphan of an orphan.
          rmSync(join(dir, "blocks", `${id}.md`), { force: true });
          pruned++;
        }
      }
    }
  }

  if (unreadable.length) {
    // Not a warning. `skipped` is a DETERMINED "not ingested" and passes; this
    // is the undetermined one — a record is there and its shape is unknown —
    // and a run that could not determine something has not cleared it.
    console.error(
      `\n${unreadable.length} document(s) carry an ingest input this could ` +
        `not read — present, but not reduced: ${unreadable.join(", ")}\n` +
        `Neither "not ingested" nor "empty" is true of them.`,
    );
  }

  if (skipped.length) {
    console.warn(
      `${skipped.length} document(s) have neither structure.json nor a ` +
        `tabular record — not ingested, not silently counted as empty: ` +
        `${skipped.slice(0, 5).join(", ")}` +
        (skipped.length > 5 ? ` …` : ""),
    );
  }

  if (check) {
    if (stale.length) {
      console.error(
        `\n${stale.length} library node(s) stale or missing:\n` +
          stale.slice(0, 20).map((s) => `  ${s}`).join("\n") +
          (stale.length > 20 ? `\n  … and ${stale.length - 20} more` : "") +
          `\n\nRun: bun run cat-harness/content/pipeline/gen-library-jsonld.ts`,
      );
      return 1;
    }
    if (unreadable.length) return 1;
    console.log(`gen-library-jsonld --check: ${unchanged} node(s) up to date.`);
    return 0;
  }

  console.log(
    `gen-library-jsonld: ${docsDone} document(s), ${blocks} block(s), ` +
      `${written} file(s) written, ${unchanged} unchanged` +
      (pruned ? `, ${pruned} orphan(s) pruned` : ""),
  );
  if (orphans.length > 0 && !prune) {
    // A finding, not a failure: the nodes that matter are correct, and what
    // to do about the leftovers is a person's call.
    console.log();
    console.log(`  ${orphans.length} orphaned block file(s) — referenced by no section:`);
    for (const o of orphans.slice(0, 10)) console.log(`      ${o}`);
    if (orphans.length > 10) console.log(`      … and ${orphans.length - 10} more`);
    console.log(`  These are stale generator output. Remove with --prune, once you have looked.`);
  }
  return unreadable.length ? 1 : 0;
}

if (import.meta.main) {
  run()
    .then((c) => process.exit(c))
    .catch((e) => {
      console.error(e);
      process.exit(2);
    });
}
