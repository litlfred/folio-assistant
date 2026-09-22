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
 *   tabular.jsonld          (input — or tabular.csvw.jsonld, once eief lands)
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
 *   bun run content/pipeline/gen-library-jsonld.ts
 *   bun run content/pipeline/gen-library-jsonld.ts --check
 *   bun run content/pipeline/gen-library-jsonld.ts --doc <doc-id>
 *
 * @module content/pipeline/gen-library-jsonld
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import { CONTENT_CONTEXT_URL, typesForKind } from "../../schemas/jsonld";
import { LABEL_PREFIXES } from "../../schemas/constraints";
import { findContentRepoRoot } from "./repo-root";
import { directoriesForGraph } from "../../schemas/cat-harness.js";
import type { DocumentImage, ImagesSidecar } from "../../schemas/document-image.ts";
import { buildTabularNodes, tabularShapeOf } from "./tabular-nodes.ts";
// The `folio` graph kind is registered by CORE on import
// (`schemas/folio-graph-kind.ts`), so the harness alone does not know it
// exists. This module resolves this instance's directories, and the instance
// DECLARES a folio graph — without this the read throws `unknown graph kind
// "folio"` on a perfectly valid declaration (issue #464).
import "../../schemas/folio-graph-kind.js";

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
  metadata?: { title?: string | null; authors_raw?: string | null; arxiv?: string | null; doi?: string | null };
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

/** Everything one document contributes, as files to write. */
export function buildDocumentNodes(
  docId: string,
  structure: Structure,
  candidates: Candidates | undefined,
  hasSectionMd: (sid: string) => boolean,
  images?: ImagesSidecar,
): Array<{ path: string; content: string }> {
  const out: Array<{ path: string; content: string }> = [];
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
      contained.push(docIri(docId, `blocks/${bid}`));
      out.push({
        path: `blocks/${bid}.jsonld`,
        content: node({
          "@id": docIri(docId, `blocks/${bid}`),
          "@type": typesForKind("prose"),
          kind: "prose",
          title: sec.title,
          pageStart: sec.page_start ?? undefined,
          pageEnd: sec.page_end ?? undefined,
          text: `../sections/${sec.id}.md`,
          derivedFrom: docIri(docId, "manifest"),
          sourceDocument: docIri(docId, "manifest"),
          provenance: "ingested",
        }),
      });
    }

    // Typed blocks for whatever Stage B recognised in this section.
    const cands = bySection.get(sec.id) ?? [];
    cands.forEach((c, i) => {
      const bid = blockId(c.kind, key, i + 1);
      const statement = (c.statement ?? "").trim();
      contained.push(docIri(docId, `blocks/${bid}`));
      out.push({
        path: `blocks/${bid}.jsonld`,
        content: node({
          "@id": docIri(docId, `blocks/${bid}`),
          "@type": typesForKind(c.kind),
          kind: c.kind,
          title: c.name ?? undefined,
          pageStart: sec.page_start ?? undefined,
          pageEnd: sec.page_end ?? undefined,
          text: statement ? `${bid}.md` : undefined,
          derivedFrom: docIri(docId, `sections/${key}`),
          sourceDocument: docIri(docId, "manifest"),
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
          contained.push(docIri(docId, `blocks/${bid}`));
          out.push({
            path: `blocks/${bid}.jsonld`,
            content: node({
              "@id": docIri(docId, `blocks/${bid}`),
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
              derivedFrom: docIri(docId, `sections/${key}`),
              sourceDocument: docIri(docId, "manifest"),
              provenance: "ingested",
            }),
          });
        }
      }
    }

    const sIri = docIri(docId, `sections/${key}`);
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
        derivedFrom: docIri(docId, "manifest"),
        sourceDocument: docIri(docId, "manifest"),
        provenance: "ingested",
      }),
    });
  }

  out.push({
    path: "manifest.jsonld",
    content: node({
      "@id": docIri(docId, "manifest"),
      "@type": ["folio:SourceDocument"],
      title: structure.metadata?.title ?? docId,
      contains: sectionIris,
      provenance: "ingested",
      meta: {
        doc_id: docId,
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
  const clean: Record<string, unknown> = { "@context": CONTENT_CONTEXT_URL };
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
export type IngestRung = "paged" | "tabular" | "none";

/**
 * The input file that puts an entry on each rung, in precedence order.
 *
 * A table rather than a chain of `existsSync` in the walk: the decision is
 * then something a test can hold, and a rung added here cannot be one the
 * walk silently ignores. `check-l1-complete.ts` settled the same question the
 * same way with `KIND_SIDECAR`.
 */
export const RUNG_INPUT: ReadonlyArray<readonly [IngestRung, readonly string[]]> = [
  ["paged", ["structure.json"]],
  ["tabular", ["tabular.jsonld", "tabular.csvw.jsonld"]],
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

export function buildEntryNodes(docId: string, dir: string): EntryOutcome {
  // Two ingest rungs reach this walk, and a tabular entry has no Stage A
  // output at all — no `structure.json`, no `sections/*.md` — so it is not a
  // `buildDocumentNodes` with different arguments. Its own branch, which is
  // `jg8s`'s rule one level up: model reality, do not force conformance.
  const rung = ingestRungOf((f) => existsSync(join(dir, f)));

  if (rung === "paged") {
    const structure = readJson<Structure>(join(dir, "structure.json"));
    if (!structure) return { state: "unreadable", rung };
    const candidates = readJson<Candidates>(join(dir, "candidates.json"));
    const images = readJson<ImagesSidecar>(join(dir, "images.json"));
    return {
      state: "built",
      rung,
      files: buildDocumentNodes(
        docId,
        structure,
        candidates,
        (sid) => existsSync(join(dir, "sections", `${sid}.md`)),
        images,
      ),
    };
  }

  if (rung === "tabular") {
    const record =
      readJson<Record<string, unknown>>(join(dir, "tabular.jsonld")) ??
      readJson<Record<string, unknown>>(join(dir, "tabular.csvw.jsonld"));
    const shape = record ? tabularShapeOf(record) : undefined;
    // The record is there and we could not read it. Reporting an empty
    // document here would assert the dataset has no sheets, which is a claim
    // nobody made.
    if (!shape) return { state: "unreadable", rung };
    return {
      state: "built",
      rung,
      files: buildTabularNodes(shape, {
        title: shape.title ?? docId,
        iri: (rest) => docIri(docId, rest),
        // Where the headers and shape came from. The manifest points at
        // sheets and blocks; without this nothing in the graph says which
        // record produced them.
        meta: { tabular_record: record?.$schema },
      }),
    };
  }

  // Not a parse failure to hide: an entry with no ingest input simply has not
  // been processed, and saying so is the point.
  return { state: "no-input" };
}

async function run(): Promise<number> {
  const argv = process.argv.slice(2);
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
  const declaredLibraries = directoriesForGraph(root, "library");
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
          `\n\nRun: bun run content/pipeline/gen-library-jsonld.ts`,
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
