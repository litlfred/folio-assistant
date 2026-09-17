/**
 * Emit `docs/<slug>.md` from a `content/docs/<slug>/<slug>.ts` webpage manifest.
 *
 * This is the missing code path. Every existing renderer targets LaTeX
 * (`render-latex.ts`), one assembled Markdown file (`render-markdown.ts`), or
 * the viewer — nothing has ever emitted into the Jekyll site from content. The
 * shape here is deliberately copied from `gen-skill-docs.ts`, which has been
 * emitting 107 pages into `docs/reference/skill-instructions/` for months:
 * derive the front matter, wrap the body, write, and gate on `--check` so the
 * generated copy cannot drift from its source.
 *
 * WHAT THIS BUYS OVER A HAND-WRITTEN PAGE, concretely:
 *
 *   1. Anchors stop depending on heading text. `heading_anchors: true` derives
 *      `#extract-structure` from the words in the heading, so a retitle
 *      silently breaks every inbound link — including the
 *      `<folio:link href="document-ingestion.html#extract-structure">` hrefs
 *      authored into the BPMN sources, which is a live round trip today. Each
 *      node's `id` is pinned with kramdown's `{: #id }` instead.
 *   2. Every node gets an edit link to ITS OWN source. Jekyll knows only
 *      `page.path`, so a per-node link is impossible from the theme: the
 *      node -> file mapping exists only here, in the thing that assembles the
 *      page. That is the whole argument for generating the page at all.
 *   3. An asset's edit link points at the `.bpmn`, never at the generated
 *      `.svg`. `render-bpmn.ts` is explicit that the SVGs are never
 *      hand-edited; a link inviting someone to do so would be worse than none.
 *
 * Usage:
 *   bun run scripts/gen-docs-pages.ts            # write
 *   bun run scripts/gen-docs-pages.ts --check    # fail if any page is stale
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { WebPage, WebPageNode } from "../schemas/webpage.ts";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// Platform documentation lives under `content/docs/`. It is NOT folio content
// (papers, chapters, block triples) — it is the platform's own structured docs,
// authored as `WebPage` manifests with `.ts` + `.md` blocks.
//
// An earlier cut placed these outside `content/` entirely (in `site-content/`)
// because `qa-section-title-audit.ts` walked every `content/<dir>/` looking for
// chapter manifests and treated webpage manifests as folio chapters ("7 titles
// across 7 chapters"). The fix was in the wrong place: the audit now skips
// `content/docs/` explicitly (alongside `content/pipeline/` and
// `content/schema/`), so documentation can live where content belongs — under
// `content/` — without tripping the folio-emptiness gate.
const SRC_DIR = join(REPO_ROOT, "content", "docs");
const OUT_DIR = join(REPO_ROOT, "docs");
const REPO_WEB = "https://github.com/litlfred/folio-assistant";
const EDIT_BASE = `${REPO_WEB}/edit/main`;
/** Matches gen-skill-docs.ts / gen-schema-docs.ts — one glyph, no inline SVG. */
const EDIT_GLYPH = "✎";

const check = process.argv.includes("--check");
let stale = 0;
let written = 0;

/**
 * Repo-root-relative path of the file a node is edited through.
 *
 * An asset node resolves to the asset's SOURCE, not to the narrative and not to
 * the rendered artefact. A narrative node resolves to its `.md`. A node with
 * neither is a bare heading and has nothing to edit.
 */
function editTarget(page: WebPage, node: WebPageNode): string | null {
  if (node.asset) return node.asset.source;
  const narrative = node.block ?? node.lead;
  if (narrative) return `content/docs/${page.slug.replace(/\//g, "-")}/${narrative}.md`;
  return null;
}

function readBlock(page: WebPage, nodeId: string, block: string): string {
  const mdPath = join(SRC_DIR, page.slug.replace(/\//g, "-"), `${block}.md`);
  if (!existsSync(mdPath)) {
    throw new Error(
      `node "${nodeId}" of page "${page.slug}" names block "${block}", ` +
        `but ${mdPath} does not exist`,
    );
  }
  return readFileSync(mdPath, "utf-8").trim();
}

function emitNode(page: WebPage, node: WebPageNode): string[] {
  const out: string[] = [];
  const level = node.level ?? 2;

  if (node.title) {
    out.push(`${"#".repeat(level)} ${node.title}`);
    // The id is PINNED here rather than left to `heading_anchors`, which would
    // derive it from the words above. See the header comment.
    out.push(`{: #${node.id} }`);
    out.push("");
  }

  const target = editTarget(page, node);
  if (target) {
    out.push(`[${EDIT_GLYPH} Edit](${EDIT_BASE}/${target}){: .fa-node-edit title="Edit ${target}" }`);
    out.push("");
  }

  if (node.lead) {
    out.push(readBlock(page, node.id, node.lead));
    out.push("");
  }

  if (node.asset) {
    const a = node.asset;
    out.push(`<div class="bpmn-figure" id="figure-${node.id}">`);
    out.push(`  <img src="${a.rendered}"`);
    out.push(`       alt="${a.alt.replace(/"/g, "&quot;")}">`);
    out.push("</div>");
    out.push("");
    // The source links are kept as well as the edit link: they are different
    // acts. Reading the XML and changing it are not the same request, and the
    // existing pages have always offered the first.
    if (a.sourceLinks && a.sourceLinks.length > 0) {
      const rendered = a.sourceLinks.map((l) => `[${l.text}](${l.href})`);
      if (a.linkStyle === "caption") {
        // Paragraph-level attribute list on the line BELOW, which is what
        // kramdown needs when several links share one class.
        out.push(rendered.join(" · "));
        out.push("{: .bpmn-source }");
      } else {
        out.push(`${rendered.join(" · ")}{: .btn .btn-outline }`);
      }
      out.push("");
    }
  }

  if (node.block) {
    out.push(readBlock(page, node.id, node.block));
    out.push("");
  }

  return out;
}

function renderPage(page: WebPage): string {
  const lines: string[] = [];
  lines.push("---");
  lines.push("layout: default");
  lines.push(`title: ${page.title}`);
  if (page.parent) lines.push(`parent: ${page.parent}`);
  if (page.navOrder !== undefined) lines.push(`nav_order: ${page.navOrder}`);
  lines.push("---");
  lines.push("");
  lines.push(`# ${page.heading ?? page.title}`);
  lines.push("{: .no_toc }");
  lines.push("");
  lines.push("<details open markdown=\"block\">");
  lines.push("  <summary>On this page</summary>");
  lines.push("  {: .text-delta }");
  lines.push("1. TOC");
  lines.push("{:toc}");
  lines.push("</details>");
  lines.push("");
  lines.push(
    `_This page is generated from [\`content/docs/${page.slug.replace(/\//g, "-")}/\`](${REPO_WEB}/tree/main/content/docs/${page.slug.replace(/\//g, "-")}) — ` +
      `each section below links to its own source._`,
  );
  lines.push("");

  const seen = new Set<string>();
  for (const node of page.nodes) {
    if (seen.has(node.id)) {
      throw new Error(`page "${page.slug}" has two nodes with id "${node.id}"`);
    }
    seen.add(node.id);
    lines.push(...emitNode(page, node));
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

function emit(path: string, content: string): void {
  if (check) {
    const current = existsSync(path) ? readFileSync(path, "utf-8") : "";
    if (current !== content) {
      console.error(`  ✗ ${path} is stale`);
      stale++;
    }
    return;
  }
  writeFileSync(path, content);
  written++;
}

if (!existsSync(SRC_DIR)) {
  console.log(`no ${SRC_DIR} — nothing to generate`);
  process.exit(0);
}

const slugs = readdirSync(SRC_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

for (const slug of slugs) {
  const manifest = join(SRC_DIR, slug, `${slug}.ts`);
  if (!existsSync(manifest)) {
    console.error(`  ! ${slug}/ has no ${slug}.ts manifest — skipped`);
    continue;
  }
  const mod = (await import(manifest)) as { default: WebPage };
  const page = mod.default;
  // A slug may carry a path (`guides/writing-a-paper`) because the published
  // site has a `guides/` subdirectory. The content DIRECTORY flattens it, so
  // one level of `content/docs/` holds every page and there is no second
  // nesting rule to remember.
  if (page.slug.replace(/\//g, "-") !== slug) {
    throw new Error(`${manifest} declares slug "${page.slug}" but lives in ${slug}/`);
  }
  const outPath = join(OUT_DIR, `${page.slug}.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  emit(outPath, renderPage(page));
  console.log(`  ${check ? "·" : "✓"} ${slug}.md (${page.nodes.length} nodes)`);
}

if (check && stale > 0) {
  console.error(`\n${stale} page(s) stale — run: bun run scripts/gen-docs-pages.ts`);
  process.exit(1);
}
console.log(check ? "\ngenerated pages are up to date" : `\nWrote ${written} page(s) to ${OUT_DIR}`);
