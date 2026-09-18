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

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { WebPage, WebPageNode } from "../schemas/webpage.ts";
import { availableLocales } from "../content/pipeline/po-resolve.ts";
import {
  QA_FAMILY_LABEL,
  readWitnessDoc,
  type QaFamily,
  type QaWitnessDoc,
} from "../content/pipeline/qa-witness.ts";

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

/**
 * The QA state of one block, for the icon beside its heading.
 *
 * Deliberately three states and not two. A block with no sidecar has not been
 * swept; a block whose sidecar holds only `n/a` verdicts was swept and found
 * nothing applicable. Rendering either as "clean" would be the false pass this
 * repository keeps paying for — a sweep that reports a healthy corpus it never
 * checked is indistinguishable downstream from one that found nothing wrong.
 */
export type QaState = "fail" | "warn" | "pass" | "unswept";

export interface QaSummary {
  state: QaState;
  /** Counts, for the tooltip. `na` is reported, not hidden. */
  fail: number;
  warn: number;
  pass: number;
  na: number;
}

const QA_GLYPH: Record<QaState, string> = {
  fail: "●",
  warn: "◐",
  pass: "○",
  unswept: "·",
};

/**
 * Read a block's `<stem>.qa.json`, beside its `<stem>.md`.
 *
 * Returns `undefined` when there is no sidecar — the caller renders that as
 * `unswept` rather than omitting the icon, because a missing icon and a clean
 * one look identical to a reader and only one of them is true.
 *
 * A sidecar that will not parse is `unswept` too, not a crash: one malformed
 * file must not take down the whole docs build, and "could not read this" is
 * honestly the same answer to the reader as "nobody has checked".
 */
export function readQaSummary(blockDir: string, block: string): QaSummary | undefined {
  // Delegates to the family-generic reader so the badge and the panel it opens
  // cannot disagree about a verdict. The badge predates the panel and keeps its
  // four states: the panel's fifth outcome — a criterion the sidecar holds with
  // no verdict recorded against it — counts here as `na`, which leaves every
  // state this function has ever returned unchanged (a sidecar of nothing but
  // `n/a` and `unknown` was `unswept` before and still is).
  const doc = readWitnessDoc("block", join(blockDir, `${block}.md`), REPO_ROOT);
  if (!doc) return undefined;
  return {
    state: doc.state,
    fail: doc.counts.fail,
    warn: doc.counts.warn,
    pass: doc.counts.pass,
    na: doc.counts.na + doc.counts.unknown,
  };
}

const check = process.argv.includes("--check");
let stale = 0;
let written = 0;
let qaWritten = 0;

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

/**
 * Where a subject's published witness JSON lands, and the set actually written.
 *
 * The sidecars themselves are not published: 14 of them are 392 KB, most of it
 * evidence and hashes a reader never opens. What ships is the projection in
 * `qa-witness.ts`, one file per (subject, family), fetched only when somebody
 * clicks the icon.
 */
const QA_ASSET_DIR = join(OUT_DIR, "assets", "qa");
const emittedQa = new Set<string>();

/** Every published witness JSON currently on disk, for orphan detection. */
function listQaAssets(dir: string = QA_ASSET_DIR): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...listQaAssets(p));
    else if (e.name.endsWith(".json")) out.push(p);
  }
  return out.sort();
}

/**
 * Which QA families can apply to a subject, decided by what the subject IS.
 *
 * This is applicability, not availability — a `.bpmn` with no `kg-qa/` sidecar
 * still gets a `KG ·` icon saying nobody has audited it, while a node holding
 * only a rendered SVG gets no KG icon at all because a KG audit was never
 * possible there. Collapsing those two into "no icon" is the false pass bean
 * `g6yr` argued about, one level up: silence about a missing audit reads as
 * "nothing to audit".
 */
function familiesFor(subjectPath: string): QaFamily[] {
  if (subjectPath.endsWith(".md")) return ["block", "translation"];
  if (/\.(bpmn|dmn)$/.test(subjectPath)) return ["kg"];
  if (/\.(ts|py|rs)$/.test(subjectPath)) return ["script"];
  return [];
}

/** What a subject is called in a "nobody has swept this" message. */
function subjectNoun(subjectPath: string): string {
  if (subjectPath.endsWith(".md")) return "block";
  if (/\.(bpmn|dmn)$/.test(subjectPath)) return "diagram";
  return "script";
}

function pageDir(page: WebPage): string {
  return join(SRC_DIR, page.slug.replace(/\//g, "-"));
}

/**
 * The counts line shared by the icon's tooltip and its accessible name.
 *
 * `n/a` and `unknown` are reported, never folded into the others: a criterion
 * that did not apply and one the sidecar holds no verdict for are different
 * facts, and both are the reader's business.
 */
function qaTitle(label: string, doc: QaWitnessDoc | undefined, noun: string): string {
  if (!doc) return `${label}: not swept — no sidecar for this ${noun}`;
  const c = doc.counts;
  const parts = [`${c.fail} fail`, `${c.warn} warn`, `${c.pass} pass`, `${c.na} n/a`];
  if (c.unknown > 0) parts.push(`${c.unknown} no verdict`);
  return `${label}: ${parts.join(", ")} — open for witnesses`;
}

/**
 * Icons for every family applicable to this node's subjects.
 *
 * A family with a sidecar is a `<button>` carrying the URL of its published
 * projection; the panel is built in the browser from that JSON. A family
 * without one is a `<span>`: there is nothing to open, and a control that does
 * nothing when pressed is worse than a plain mark — the same argument the
 * single-state icon shipped with, now that the others DO open.
 */
function qaIcons(page: WebPage, node: WebPageNode): string {
  const subjects: string[] = [];
  if (node.block) subjects.push(join(pageDir(page), `${node.block}.md`));
  if (node.asset) subjects.push(join(REPO_ROOT, node.asset.source));

  const out: string[] = [];
  for (const subject of subjects) {
    for (const family of familiesFor(subject)) {
      const { tag, label } = QA_FAMILY_LABEL[family];
      const doc = readWitnessDoc(family, subject, REPO_ROOT);
      const state: QaState = doc?.state ?? "unswept";
      const title = qaTitle(label, doc, subjectNoun(subject));
      const glyph = QA_GLYPH[state];
      const mark =
        `<span class="fa-qa-tag">${tag}</span>` +
        `<span class="fa-qa-glyph" aria-hidden="true">${glyph}</span>`;
      if (!doc) {
        out.push(
          ` <span class="fa-qa-badge fa-qa-${state} fa-qa-fam-${family}" ` +
            `title="${title}" aria-label="${title}">${mark}</span>`,
        );
        continue;
      }
      const rel = join(page.slug.replace(/\//g, "-"), `${node.id}.${family}.json`);
      const abs = join(QA_ASSET_DIR, rel);
      mkdirSync(dirname(abs), { recursive: true });
      emit(abs, JSON.stringify(doc, null, 2) + "\n", "qa");
      emittedQa.add(abs);
      // `relative_url` so the path survives the site's baseurl — `/folio-assistant`
      // here, something else on a staging deploy. A hardcoded absolute path
      // 404s on every deploy but one.
      out.push(
        ` <button type="button" class="fa-qa-badge fa-qa-${state} fa-qa-fam-${family}" ` +
          `data-qa-family="${family}" data-qa-src="{{ '/assets/qa/${rel}' | relative_url }}" ` +
          `aria-expanded="false" title="${title}" aria-label="${title}">${mark}</button>`,
      );
    }
  }
  if (out.length === 0) return "";
  // One floated CONTAINER, not several floated chips. Floating each icon
  // separately reverses their visual order (the first float lands rightmost),
  // so the families would read right-to-left against the order this emits them.
  return ` <span class="fa-qa-badges">${out.join("").trim()}</span>`;
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
    // The QA icons ride the same line as Edit: both are per-node affordances
    // about THIS node, and a second row would separate them for no reason.
    const qa = qaIcons(page, node);
    out.push(
      `[${EDIT_GLYPH} Edit](${EDIT_BASE}/${target}){: .fa-node-edit title="Edit ${target}" }${qa}`,
    );
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
  // Auto-detect available translations for this page
  const stem = page.slug.replace(/\//g, "-");
  const locales = availableLocales(REPO_ROOT, stem);

  lines.push("---");
  lines.push("layout: default");
  lines.push(`title: ${page.title}`);
  if (page.parent) lines.push(`parent: ${page.parent}`);
  if (page.navOrder !== undefined) lines.push(`nav_order: ${page.navOrder}`);
  lines.push("lang: en");
  if (locales.length > 0) {
    lines.push(`available_locales: ${JSON.stringify(locales)}`);
  }
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

function emit(path: string, content: string, kind: "page" | "qa" = "page"): void {
  if (check) {
    const current = existsSync(path) ? readFileSync(path, "utf-8") : "";
    if (current !== content) {
      console.error(`  ✗ ${path} is stale`);
      stale++;
    }
    return;
  }
  writeFileSync(path, content);
  if (kind === "qa") qaWritten++;
  else written++;
}

if (!existsSync(SRC_DIR)) {
  console.log(`no ${SRC_DIR} — nothing to generate`);
  process.exit(0);
}

// Guarded so IMPORTING this module does not regenerate the site.
//
// `readQaSummary` is exported for its own test, and without this guard that
// import rewrote all 11 pages as a side effect of `bun test` — a test run that
// silently edits the working tree is a test run nobody can trust, and on a
// `--check` CI job it would compare freshly written output against itself.
if (import.meta.main) {
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

// A subject that loses its sidecar — or a page that loses a node — must lose its
// published projection too. Left behind, the file keeps serving verdicts for
// something that no longer exists, and nothing else would ever notice: the icon
// is gone, so nobody clicks it and nobody sees it is wrong.
for (const orphan of listQaAssets()) {
  if (emittedQa.has(orphan)) continue;
  if (check) {
    console.error(`  ✗ ${orphan} is orphaned`);
    stale++;
  } else {
    unlinkSync(orphan);
    console.log(`  - removed orphaned ${orphan}`);
  }
}

if (check && stale > 0) {
  console.error(`\n${stale} page(s) stale — run: bun run scripts/gen-docs-pages.ts`);
  process.exit(1);
}
console.log(
  check
    ? "\ngenerated pages are up to date"
    : `\nWrote ${written} page(s) to ${OUT_DIR} and ${qaWritten} QA witness file(s) to ${QA_ASSET_DIR}`,
);
}
