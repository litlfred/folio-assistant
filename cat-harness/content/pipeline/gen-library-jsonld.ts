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
  for (const f of listFiles(join(dir, "sections"))) {
    if (!f.endsWith(".jsonld")) continue;
    const body = readText(join(dir, "sections", f));
    if (body === undefined) continue;
    try {
      for (const c of (JSON.parse(body).contains ?? []) as string[]) {
        referenced.add(c.split("/").pop() ?? c);
      }
    } catch {
      // An unreadable section means we cannot know what it references, and an
      // unknown reference set would make every block look orphaned. Refuse to
      // judge this directory rather than report a deletable list from it.
      return [];
    }
  }
  return listFiles(join(dir, "blocks"))
    .filter((f) => f.endsWith(".jsonld"))
    .map((f) => f.replace(/\.jsonld$/, ""))
    .filter((id) => !referenced.has(id))
    .sort();
}

async function run(): Promise<number> {
  const argv = process.argv.slice(2);
  const check = argv.includes("--check");
  const only = argv.includes("--doc") ? argv[argv.indexOf("--doc") + 1] : undefined;

  const root = findContentRepoRoot();
  // EVERY declared library, not the first — this GENERATES the JSON-LD the
  // whole corpus is read through, so a library it skips is a set of documents
  // that exist on disk and nowhere in the graph, with a clean exit code over
  // them. `directoriesForGraph(...)[0]` until bean `a02m`.
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

  // A document is now (id, WHICH library it is in), because there may be
  // several and an id alone no longer locates one.
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
      // A slug in two libraries is REPORTED, never merged and never silently
      // last-wins. The node ids are composed from the slug, so two documents
      // sharing one would write over each other's blocks and the second run
      // would look idempotent. Refusing here is the only place that can tell
      // them apart.
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

  for (const { docId, dir } of docs) {
    const structure = readJson<Structure>(join(dir, "structure.json"));
    if (!structure) {
      // Not a parse failure to hide: a document with no Stage A output simply
      // has not been processed, and saying so is the point.
      skipped.push(docId);
      continue;
    }
    const candidates = readJson<Candidates>(join(dir, "candidates.json"));
    const images = readJson<ImagesSidecar>(join(dir, "images.json"));
    const files = buildDocumentNodes(
      docId,
      structure,
      candidates,
      (sid) => existsSync(join(dir, "sections", `${sid}.md`)),
      images,
    );

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

  if (skipped.length) {
    console.warn(
      `${skipped.length} document(s) have no structure.json — not ingested, ` +
        `not silently counted as empty: ${skipped.slice(0, 5).join(", ")}` +
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
  return 0;
}

if (import.meta.main) {
  run()
    .then((c) => process.exit(c))
    .catch((e) => {
      console.error(e);
      process.exit(2);
    });
}
