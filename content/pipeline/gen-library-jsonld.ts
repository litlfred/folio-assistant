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

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import { CONTENT_CONTEXT_URL, typesForKind } from "../../schemas/jsonld";
import { LABEL_PREFIXES } from "../../schemas/constraints";
import { findContentRepoRoot } from "./repo-root";

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

async function run(): Promise<number> {
  const argv = process.argv.slice(2);
  const check = argv.includes("--check");
  const only = argv.includes("--doc") ? argv[argv.indexOf("--doc") + 1] : undefined;

  const root = findContentRepoRoot();
  const libraryDir = join(root, "library");
  if (!existsSync(libraryDir)) {
    console.log(`gen-library-jsonld: no library/ under ${root} — nothing to ingest.`);
    return 0;
  }

  const docs = readdirSync(libraryDir)
    .filter((d) => !d.startsWith("."))
    .filter((d) => (only ? d === only : true))
    .filter((d) => {
      try {
        return statSync(join(libraryDir, d)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();

  let written = 0;
  let unchanged = 0;
  let docsDone = 0;
  let blocks = 0;
  const stale: string[] = [];
  const skipped: string[] = [];

  for (const docId of docs) {
    const dir = join(libraryDir, docId);
    const structure = readJson<Structure>(join(dir, "structure.json"));
    if (!structure) {
      // Not a parse failure to hide: a document with no Stage A output simply
      // has not been processed, and saying so is the point.
      skipped.push(docId);
      continue;
    }
    const candidates = readJson<Candidates>(join(dir, "candidates.json"));
    const files = buildDocumentNodes(docId, structure, candidates, (sid) =>
      existsSync(join(dir, "sections", `${sid}.md`)),
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
      `${written} file(s) written, ${unchanged} unchanged`,
  );
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
