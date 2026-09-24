/**
 * Emit the docs site's own JSON-LD graph from `content/docs/`.
 *
 * STRAWPERSON — a first cut, deliberately. The shape here (page node ->
 * ordered `contains` -> one node per child) mirrors `gen-library-jsonld.ts`
 * because that is the model already proven across 576 ingested documents, but
 * every choice below is open to revision: which vocabulary a page node takes,
 * whether an asset's `@id` should be the asset or the section presenting it,
 * and whether the site graph belongs in the same index as the corpus at all.
 *
 * WHY THIS IS A SEPARATE GENERATOR, not a widening of `gen-block-jsonld.ts`.
 *
 * That generator walks `content/<paper>/` and REFUSES when it finds nothing:
 * "folio-assistant is the platform; papers live in the folio repo." That
 * refusal is load-bearing — `scripts/tests/audit-empty-corpus.test.ts`
 * enforces the same invariant from the audit side. The docs live under
 * `content/docs/`, which both `gen-block-jsonld.ts` and the section-title
 * audit skip when walking paper directories — keeping the two populations
 * (folio content vs platform documentation) apart without an out-of-tree
 * `site-content/` workaround.
 *
 * So the site gets its own emitter, its own IRI space (`site/<slug>`), and its
 * own gate. It shares the published `@context` and the `folio:` / `doco:`
 * vocabulary, which is what makes the two graphs joinable later if that turns
 * out to be wanted.
 *
 * WHAT IS NOT DONE YET, and should not be assumed:
 *   - nothing loads these into `graph-index.ts`, so `corpus_search` cannot see
 *     them. Emitting the nodes and indexing them are separate steps and only
 *     the first is here.
 *   - `uses` / `cites` edges are not extracted from the narrative. A page's
 *     cross-links are plain markdown today; turning them into typed edges is
 *     the obvious next increment and is where the graph starts earning its
 *     keep.
 *
 * Usage:
 *   bun run content/pipeline/gen-site-jsonld.ts            # write
 *   bun run content/pipeline/gen-site-jsonld.ts --check    # CI gate
 *
 * @covers docs
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CONTENT_CONTEXT_URL,
  SITE_PAGE_TYPES,
  SITE_NARRATIVE_TYPES,
  SITE_ASSET_TYPES,
  siteIri,
} from "../../schemas/jsonld.ts";
import type { WebPage, WebPageNode } from "../../schemas/webpage.ts";
import { portableSegment } from "../../schemas/portable-path";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SRC_DIR = join(REPO_ROOT, "content", "docs");

const check = process.argv.includes("--check");
let written = 0;
let unchanged = 0;
const stale: string[] = [];

function serialise(doc: Record<string, unknown>): string {
  return `${JSON.stringify(doc, null, 2)}\n`;
}

function emit(path: string, doc: Record<string, unknown>): void {
  const next = serialise(doc);
  const prev = existsSync(path) ? readFileSync(path, "utf-8") : undefined;
  if (prev === next) {
    unchanged++;
    return;
  }
  if (check) {
    stale.push(path.slice(REPO_ROOT.length + 1));
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, next);
  written++;
}

function nodeDoc(page: WebPage, node: WebPageNode, flat: string): Record<string, unknown> {
  const doc: Record<string, unknown> = {
    "@context": CONTENT_CONTEXT_URL,
    "@id": siteIri(page.slug, node.id),
    "@type": [...(node.asset ? SITE_ASSET_TYPES : SITE_NARRATIVE_TYPES)],
    label: node.id,
    provenance: "authored",
  };
  if (node.title) doc.title = node.title;

  // `text` points at the narrative file rather than copying it, the same way
  // an ingested section's prose block points at its `.md`. A node with an
  // asset and no trailing prose has no `text`, and that absence is
  // meaningful — the figure IS the content there.
  const narrative = node.block ?? node.lead;
  if (narrative) doc.text = `${narrative}.md`;

  if (node.asset) {
    // `sourceDocument` is the EDITABLE source (`.bpmn`), never the rendered
    // `.svg`. The renderer's own rule is that the SVG is never hand-edited, so
    // an edge naming it as the source would point a reader at a build product.
    doc.sourceDocument = node.asset.source;
    doc.meta = {
      assetKind: node.asset.kind,
      rendered: node.asset.rendered,
      alt: node.asset.alt,
    };
  }
  // Recorded so a consumer can find the file without re-deriving the
  // flattening rule from the slug.
  doc.meta = { ...((doc.meta as Record<string, unknown>) ?? {}), sourceDir: `content/docs/${flat}` };
  return doc;
}

if (!existsSync(SRC_DIR)) {
  console.log(`gen-site-jsonld: no ${SRC_DIR} — nothing to generate.`);
  process.exit(0);
}

const flats = readdirSync(SRC_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

if (flats.length === 0) {
  // Deliberately an ERROR, not a quiet success. The rule this corpus settled
  // on (bean `vald`, and the empty-corpus audit test) is that generating over
  // nothing is a failure: a clean run on an empty tree is indistinguishable
  // from a clean run on a healthy one, and that is exactly how a broken path
  // survives a gate.
  console.error("gen-site-jsonld: content/docs/ exists but holds no pages — refusing to report success.");
  process.exit(1);
}

let pages = 0;
let nodes = 0;

for (const flat of flats) {
  const manifest = join(SRC_DIR, flat, `${flat}.ts`);
  if (!existsSync(manifest)) {
    console.error(`  ! ${flat}/ has no ${flat}.ts manifest — skipped`);
    continue;
  }
  const page = ((await import(manifest)) as { default: WebPage }).default;

  emit(join(SRC_DIR, flat, `${flat}.jsonld`), {
    "@context": CONTENT_CONTEXT_URL,
    "@id": siteIri(page.slug),
    "@type": [...SITE_PAGE_TYPES],
    label: page.slug,
    title: page.title,
    // Ordered, and that order IS the page. `contains` maps to
    // `dcterms:hasPart` in the published context.
    contains: page.nodes.map((n) => siteIri(page.slug, n.id)),
    provenance: "authored",
    meta: {
      publishedAt: `${page.slug}.html`,
      sourceDir: `content/docs/${flat}`,
      ...(page.navOrder !== undefined ? { navOrder: page.navOrder } : {}),
      ...(page.parent ? { navParent: page.parent } : {}),
    },
  });
  pages++;

  for (const node of page.nodes) {
    // `portableSegment`: a node id is an identifier, not a filename. Every id
    // in the corpus today is a slug and encodes to itself, so no emitted path
    // moves — but the knowledge graph this reads also holds `req:*` ids, and
    // one reaching here would write a name NTFS cannot create.
    emit(join(SRC_DIR, flat, "nodes", `${portableSegment(node.id)}.jsonld`), nodeDoc(page, node, flat));
    nodes++;
  }
}

if (check) {
  if (stale.length) {
    console.error(
      `\n${stale.length} site .jsonld file(s) are stale or missing:\n` +
        stale.slice(0, 40).map((s) => `  ${s}`).join("\n") +
        (stale.length > 40 ? `\n  … and ${stale.length - 40} more` : "") +
        `\n\nRun: bun run content/pipeline/gen-site-jsonld.ts`,
    );
    process.exit(1);
  }
  console.log(`gen-site-jsonld --check: ${unchanged} file(s) up to date (${pages} pages, ${nodes} nodes).`);
} else {
  console.log(
    `gen-site-jsonld: ${written} written, ${unchanged} unchanged (${pages} pages, ${nodes} nodes).`,
  );
}
