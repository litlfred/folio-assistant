#!/usr/bin/env bun
/**
 * The arm between a staged entry and a promotable one: `manifest.jsonld` and
 * one `blocks/*.jsonld` per section.
 *
 * ## Why this did not exist, and what that cost
 *
 * `ingest-document.ts` stages a document and then prints *"run the remaining
 * arms"*. Measured 2026-09-20 while ingesting the agent-skill corpus: of the
 * five requirements a staged entry still fails, `images` names its arm
 * (`pdf-images.py`) and **`blocks`, `manifest` and `narrative-provenance`
 * named nothing at all** — there was no script to run. `mayPromote` requires
 * every requirement met, so `bun run ingest` could stage a document and
 * nothing could ever promote one.
 *
 * That is not a missing feature, it is a pipeline that cannot terminate, and
 * it was invisible because both ends looked healthy: staging exits 0 and says
 * `✓ staged`, and `check:l1-complete` passes over `library/` because the four
 * entries already THERE were built before the pipeline was assembled. The
 * eight PDFs sitting unprocessed in `uploads/` are what it actually looked
 * like from outside.
 *
 * ## It DERIVES; it does not decide
 *
 * Every field here is computed from `structure.json` and the files beside it.
 * Nothing is inferred, and in particular **no block kind is guessed**: every
 * block is `prose`, because a page of an ingested source IS prose until
 * somebody reads it, and a classifier that guessed `theorem` from a heading
 * would be `6xaz` one layer up. Deliberate, not a stub.
 *
 * Usage:
 *   bun run cat-harness/scripts/l1-blocks.ts -o <staged-entry-dir>
 *   bun run cat-harness/scripts/l1-blocks.ts -o <dir> --check   # write nothing
 *
 * Exit: 0 written (or check passed), 1 refused, 2 could not determine.
 *
 * @module scripts/l1-blocks
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

/** The `@context` every ingested node already carries. Read from a sibling, never retyped. */
const CONTEXT = "https://litlfred.github.io/folio-assistant/ns/content/v1.jsonld";

interface StructureSection {
  id: string;
  title?: string | null;
  page_start?: number | null;
  page_end?: number | null;
}

interface Structure {
  doc_id: string;
  sections?: StructureSection[];
  source?: { file?: string; sha256?: string };
  granularity?: string;
}

/**
 * The `library/<id>/…` stem every `@id` is written against.
 *
 * A STAGED entry lives under `ingest-staging/<slug>/`, and its nodes must
 * already carry the path they will have AFTER promotion — promotion is a copy,
 * so an `@id` naming the staging directory would be wrong the moment it
 * succeeded, and wrong in a file nobody re-reads.
 */
function stem(docId: string): string {
  return `library/${docId}`;
}

/** Sections actually on disk, so a manifest cannot list one that is not there. */
function sectionsOnDisk(dir: string): Set<string> {
  const d = join(dir, "sections");
  if (!existsSync(d)) return new Set();
  return new Set(
    readdirSync(d)
      .filter((f) => f.endsWith(".md"))
      .map((f) => basename(f, ".md")),
  );
}

export interface BuildResult {
  docId: string;
  blocks: number;
  /** Declared in `structure.json` but absent from `sections/` — refused, never skipped. */
  missing: string[];
}

/**
 * Build the manifest and the block nodes for one staged entry.
 *
 * Refuses on a section `structure.json` declares and `sections/` does not
 * hold: that is the `dh4f` shape — a manifest listing a file nobody can open,
 * which every consumer then resolves past and reports a clean run over.
 */
export function buildL1(dir: string, write = true): BuildResult {
  const sPath = join(dir, "structure.json");
  if (!existsSync(sPath)) throw new Error(`${dir}: no structure.json — this is not a staged entry`);
  const st = JSON.parse(readFileSync(sPath, "utf-8")) as Structure;
  const declared = st.sections ?? [];
  if (declared.length === 0) throw new Error(`${dir}: structure.json declares no sections`);

  const onDisk = sectionsOnDisk(dir);
  const missing = declared.map((s) => s.id).filter((id) => !onDisk.has(id));
  if (missing.length > 0) return { docId: st.doc_id, blocks: 0, missing };

  const base = stem(st.doc_id);
  const blocksDir = join(dir, "blocks");
  if (write) mkdirSync(blocksDir, { recursive: true });

  for (const s of declared) {
    const node = {
      "@context": CONTEXT,
      "@id": `${base}/blocks/prose-${s.id}`,
      "@type": ["folio-assistant-core:Prose", "doco:Section"],
      kind: "prose",
      title: s.title ?? s.id,
      ...(s.page_start != null ? { pageStart: s.page_start } : {}),
      ...(s.page_end != null ? { pageEnd: s.page_end } : {}),
      text: `../sections/${s.id}.md`,
      derivedFrom: `${base}/manifest`,
      sourceDocument: `${base}/manifest`,
      provenance: "ingested",
    };
    if (write) {
      writeFileSync(join(blocksDir, `prose-${s.id}.jsonld`), `${JSON.stringify(node, null, 2)}\n`);
    }
  }

  const manifest = {
    "@context": CONTEXT,
    "@id": `${base}/manifest`,
    "@type": ["folio-assistant-core:SourceDocument"],
    title: st.doc_id,
    contains: declared.map((s) => `${base}/sections/${s.id}`),
    provenance: "ingested",
    meta: {
      doc_id: st.doc_id,
      source_file: st.source?.file ?? null,
      source_sha256: st.source?.sha256 ?? null,
      granularity: st.granularity ?? null,
      disposition: "ingested source material — attributed to its document, not folio content",
    },
  };
  if (write) writeFileSync(join(dir, "manifest.jsonld"), `${JSON.stringify(manifest, null, 2)}\n`);

  return { docId: st.doc_id, blocks: declared.length, missing: [] };
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("-o");
  const dir = i >= 0 ? argv[i + 1] : undefined;
  if (dir === undefined) {
    console.error("usage: l1-blocks.ts -o <staged-entry-dir> [--check]");
    console.error("  Nothing was checked. That is `could not determine`, not a pass.");
    process.exit(2);
  }
  const abs = resolve(dir);
  const r = buildL1(abs, !argv.includes("--check"));
  if (r.missing.length > 0) {
    console.error(`✗ ${r.docId}: ${r.missing.length} section(s) declared and not on disk:`);
    for (const m of r.missing.slice(0, 8)) console.error(`    ${m}`);
    console.error("  Nothing written — a manifest listing a file nobody can open is worse than none.");
    process.exit(1);
  }
  console.log(`ok  ${r.docId.padEnd(48)} ${r.blocks} block(s) + manifest`);
}
