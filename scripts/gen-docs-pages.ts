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
  sidecarPaths,
  type QaFamily,
  type QaWitnessDoc,
} from "../content/pipeline/qa-witness.ts";
import { readTodoFiles } from "./todos.js";

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

/*
 * The state mark (`✓ ! ✕`, and nothing at all for `unswept`) and the counts
 * line that used to be composed here now live in `docs/assets/js/docs-ui.js`,
 * beside the fetch that decides which of them applies. The reasoning behind
 * each glyph moved with them — see `QA_GLYPH` there.
 */

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
/** Verdict projections whose CONTENT moved. Reported under `--check`, never gated. */
let refreshed = 0;

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
//
// **Committed under `test/results/`, published at `/assets/qa/`.** Those are
// two different questions and the answers differ.
//
// WHERE IT LIVES follows provenance — the owner's rule, 2026-09-19: an
// artefact generated primarily as a QA reviewer belongs under `test/results/`
// as part of a QA process. A witness is exactly that: `qa-witness.ts`'s
// projection of what a checker found. It is not authored, and it was sitting
// in `docs/` only because that is where Jekyll could reach it.
//
// WHERE IT IS SERVED FROM is unchanged, deliberately. The `data-qa-src`
// emitted below still says `/assets/qa/…`, and the publishing workflows copy
// this directory into `_site/assets/qa/` after Jekyll runs. Moving the URL as
// well would have changed every badge in every generated page and the
// browser code that fetches them, for no gain — the reader's path to the
// evidence is not what was in the wrong place.
const QA_ASSET_DIR = join(REPO_ROOT, "test", "results", "witnesses");

/**
 * The todo board's data, published as ONE file rather than one per node.
 *
 * QA verdicts are per-node and there are 134 of them, so a reader opening one
 * icon should fetch one file. Todos are the opposite: the navbar badge needs a
 * COUNT over all of them before anybody opens anything, and the board shows
 * the whole set lined up. Per-todo files would mean N requests to render a
 * number.
 */
const TODO_ASSET = join(OUT_DIR, "assets", "todos", "index.json");
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
 * The per-page verdict index being accumulated, keyed `<nodeId>.<family>`.
 *
 * Reset by the page loop before each page. Module-level rather than threaded
 * through `renderPage` because `qaIcons` is four frames down and the only
 * thing it would be threading is an accumulator.
 */
let qaIndex: Record<string, { state: QaState; counts: QaWitnessDoc["counts"] }> = {};

/** Where a page's verdict index lands, and the URL the badges fetch it from. */
const QA_INDEX_FILE = "_qa-index.json";

/**
 * Icons for every family applicable to this node's subjects.
 *
 * **The markup carries NO verdict.** That is the whole point of this function
 * as it now stands, and it is worth stating plainly because the previous
 * version's output looked more informative: it wrote `fa-qa-pass`, the `✓`
 * glyph and `"0 fail, 0 warn, 10 pass, 0 n/a"` straight into `docs/*.md`.
 *
 * A generated page carrying a live verdict is stale the moment the verdict
 * moves, and a verdict moving is the QA system WORKING. Bean `d2kp` measured
 * the consequence twice over: twelve pages stale on `main` — one of them
 * because the actor-kind fixes in #353 turned a failing criterion green — and,
 * because nobody had regenerated, a published page telling readers that a
 * knowledge-graph check FAILED on `publication-workflow.md` when it passed.
 * That is the failure mode of embedding a measurement in a document: the
 * document does not go stale loudly, it goes stale by lying.
 *
 * So the page now emits only what the CORPUS STRUCTURE says, and every one of
 * these facts changes for a reason a human would recognise as an omission:
 *
 *   - which nodes exist, and which QA families apply to each (`familiesFor`);
 *   - whether a sidecar exists at all for that (subject, family) pair — file
 *     existence, via `sidecarPaths`, not anything inside the file;
 *   - the URLs of the published projection and of this page's verdict index.
 *
 * The verdict itself is fetched at load by `paintQaBadges` in `docs-ui.js`,
 * from the per-page index written beside the projections. The same mechanism
 * the panel has always used for its contents, one level up.
 *
 * **Why an index rather than each badge fetching its own projection**, which
 * is what bean `d2kp` proposed: `publication-workflow` carries 21 projections
 * totalling 376 KB, and fetching all of them to paint 39 glyphs would
 * reintroduce at page load exactly the weight this file's own comment gives
 * for not publishing the sidecars ("14 of them are 392 KB … a reader opens one
 * criterion, not forty-eight"). The index is a few KB and one request; the
 * projection is still fetched per badge, on click, as before.
 *
 * A family with a sidecar is a `<button>` carrying the URL of its published
 * projection; the panel is built in the browser from that JSON. A family
 * without one is a `<span>`: there is nothing to open, and a control that does
 * nothing when pressed is worse than a plain mark — the same argument the
 * single-state icon shipped with, now that the others DO open.
 *
 * **"Not swept" stays server-rendered, and it is not a verdict.** Whether a
 * sidecar exists is structure: it appears when somebody runs a sweep and
 * disappears when a subject does, and in both cases regenerating is exactly
 * the omission `--check` should catch. Deferring it to the browser would also
 * have collapsed it into "the fetch found nothing", which is a different fact
 * — `could not determine` — and this repository has paid for that collapse
 * before (an absent simulators directory rendered as "this folio has no
 * simulators", replacing a correct nine-row table).
 */
function qaIcons(page: WebPage, node: WebPageNode): string {
  const subjects: string[] = [];
  if (node.block) subjects.push(join(pageDir(page), `${node.block}.md`));
  if (node.asset) subjects.push(join(REPO_ROOT, node.asset.source));

  const slug = page.slug.replace(/\//g, "-");
  const out: string[] = [];
  for (const subject of subjects) {
    for (const family of familiesFor(subject)) {
      const { tag, label } = QA_FAMILY_LABEL[family];
      const noun = subjectNoun(subject);
      // EXISTENCE, not contents. `sidecarPaths` stats the disk and returns
      // only files that are there, so this is the structural question —
      // "has anything ever ruled on this?" — and not a peek at the ruling.
      const swept = sidecarPaths(family, subject, REPO_ROOT).length > 0;
      if (!swept) {
        const title = `${label}: not swept — no sidecar for this ${noun}`;
        out.push(
          ` <span class="fa-qa-badge fa-qa-unswept fa-qa-fam-${family}" ` +
            `title="${title}" aria-label="${title}">` +
            `<span class="fa-qa-tag">${tag}</span></span>`,
        );
        continue;
      }

      const key = `${node.id}.${family}`;
      const rel = join(slug, `${key}.json`);
      const doc = readWitnessDoc(family, subject, REPO_ROOT);
      if (doc) {
        const abs = join(QA_ASSET_DIR, rel);
        mkdirSync(dirname(abs), { recursive: true });
        // Minified: these are fetched by the browser, never read as a diff, and
        // the corpus sweep took the set from 35 files to 134. Indentation was 32%
        // of 2.9 MB — a third of what every reader of the site would download for
        // whitespace nobody looks at.
        emit(abs, JSON.stringify(doc) + "\n", "verdict");
        emittedQa.add(abs);
        qaIndex[key] = { state: doc.state, counts: doc.counts };
      }
      // A sidecar that exists but will not project — malformed JSON, or a
      // translation family whose locales hold no criteria — writes no file and
      // no index entry, so the badge resolves to `could not determine` in the
      // browser. Deliberate: the subject HAS been swept, and rendering that as
      // "not swept" would be the false pass one line up.

      // `relative_url` so the path survives the site's baseurl — `/folio-assistant`
      // here, something else on a staging deploy. A hardcoded absolute path
      // 404s on every deploy but one.
      const title = `${label}: loading the verdict…`;
      out.push(
        ` <button type="button" class="fa-qa-badge fa-qa-pending fa-qa-fam-${family}" ` +
          `data-qa-family="${family}" data-qa-key="${key}" data-qa-label="${label}" ` +
          `data-qa-noun="${noun}" ` +
          `data-qa-src="{{ '/assets/qa/${rel}' | relative_url }}" ` +
          `data-qa-index="{{ '/assets/qa/${slug}/${QA_INDEX_FILE}' | relative_url }}" ` +
          `aria-expanded="false" aria-busy="true" title="${title}" aria-label="${title}">` +
          `<span class="fa-qa-tag">${tag}</span>` +
          `<span class="fa-qa-glyph" aria-hidden="true">…</span></button>`,
      );
    }
  }
  if (out.length === 0) return "";
  // One floated CONTAINER, not several floated chips. Floating each icon
  // separately reverses their visual order (the first float lands rightmost),
  // so the families would read right-to-left against the order this emits them.
  return ` <span class="fa-qa-badges">${out.join("").trim()}</span>`;
}

/**
 * The block's label, read from its own module rather than composed.
 *
 * `sec:<page-slug>-<node-id>` is the convention every block follows, and
 * composing it here would work until one block did not. The label is the
 * block's own declaration; this reads it and returns `undefined` when the
 * block has none, so a node with no label emits no attribute rather than a
 * guessed one.
 */
function blockLabel(page: WebPage, node: WebPageNode): string | undefined {
  const slug = page.slug.replace(/\//g, "-");
  const file = join(REPO_ROOT, "content", "docs", slug, `${node.id}.ts`);
  if (!existsSync(file)) return undefined;
  const m = /^\s*label:\s*"([^"]+)"/m.exec(readFileSync(file, "utf-8"));
  return m ? m[1] : undefined;
}

function emitNode(page: WebPage, node: WebPageNode): string[] {
  const out: string[] = [];
  const level = node.level ?? 2;

  if (node.title) {
    out.push(`${"#".repeat(level)} ${node.title}`);
    // The id is PINNED here rather than left to `heading_anchors`, which would
    // derive it from the words above. See the header comment.
    //
    // `data-fa-label` carries the block's PAGE-QUALIFIED label alongside it,
    // which is what a todo's `targetLabel` addresses. The bare `id` cannot
    // serve: `what-is-not-built-yet` is a node on both `agentic-harness` and
    // `crdm-methodology`, so matching on it would attach a todo to whichever
    // page the reader happened to open. Same lesson as `TaskRef` carrying its
    // process — an id is unique only within its container.
    const label = blockLabel(page, node);
    out.push(label ? `{: #${node.id} data-fa-label="${label}" }` : `{: #${node.id} }`);
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

/**
 * What `--check` gates, and what it merely reports.
 *
 * Three kinds, because two would put a live measurement behind a red X:
 *
 *   - **`page`** — a `docs/*.md`. Gated on exact content. Everything it now
 *     carries is structure, so a difference is somebody who added a node,
 *     renamed a block, ran a first sweep, or moved a sidecar, and did not
 *     regenerate. That is a real omission and a reviewer reads the page in the
 *     diff, so it must not drift.
 *   - **`data`** — `assets/todos/index.json`, likewise a projection of files a
 *     human authored. Gated on exact content for the same reason.
 *   - **`verdict`** — a witness projection or a page's verdict index. Gated on
 *     EXISTENCE only. Its contents are a function of the QA sidecars AND of
 *     the working tree (`readWitnessDoc` recomputes `freshness` by hashing the
 *     live subject), so it moves whenever a sweep re-runs or a block is
 *     edited — neither of which anybody forgot to do. A missing file IS an
 *     omission: the badge would point at a 404 forever.
 *
 * **Not gating the contents costs the reader nothing, and that is checkable
 * rather than argued.** `docs-site.yml` and `feature-staging.yml` both run
 * this generator in full before copying `test/results/witnesses/` into
 * `_site/assets/qa/`, so the projections a reader actually fetches are
 * regenerated at publish. The committed copies are a cache for local work and
 * for review; gating them could only ever fire on a graph that changed, which
 * is precisely what bean `d2kp` exists to stop the gate doing.
 */
function emit(path: string, content: string, kind: "page" | "data" | "verdict" = "page"): void {
  if (check) {
    const present = existsSync(path);
    const current = present ? readFileSync(path, "utf-8") : "";
    if (current === content) return;
    if (kind === "verdict") {
      // Absent is a failure; different is news. Keeping them apart is the
      // whole of this change at the file level.
      if (!present) {
        console.error(`  ✗ ${path} is missing`);
        stale++;
      } else {
        refreshed++;
      }
      return;
    }
    console.error(`  ✗ ${path} is stale`);
    stale++;
    return;
  }
  writeFileSync(path, content);
  if (kind === "verdict") qaWritten++;
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
  // `renderPage` fills `qaIndex` as a side effect of emitting the badges, so
  // the reset has to happen before it and the write after it.
  qaIndex = {};
  const body = renderPage(page);
  emit(outPath, body);
  // The page's verdict index: what every badge on it needs to paint itself,
  // in ONE request. Written even when empty, because a page with badges and a
  // missing index is indistinguishable in the browser from a network failure,
  // and `{}` is a determined-empty answer rather than an unreadable one.
  if (/data-qa-index=/.test(body)) {
    const idxAbs = join(QA_ASSET_DIR, slug, QA_INDEX_FILE);
    mkdirSync(dirname(idxAbs), { recursive: true });
    emit(
      idxAbs,
      JSON.stringify({ $schema: "folio-qa-index/v1", page: page.slug, badges: qaIndex }) + "\n",
      "verdict",
    );
    emittedQa.add(idxAbs);
  }
  console.log(`  ${check ? "·" : "✓"} ${slug}.md (${page.nodes.length} nodes)`);
}

/**
 * Resolve a todo's knowledge-graph edges to things a reader can follow.
 *
 * Composed at BUILD time, like `editHref` and for the same reason: the client
 * would otherwise need the repo's web URL and the bean store's layout, and
 * both are this instance's business rather than shared client code's.
 *
 * **A reference that cannot be resolved is still rendered, without a link.**
 * `folio-assistant-29ij` names a bean whether or not a file for it is on disk,
 * and dropping it would make a dangling edge look like no edge at all — the
 * distinction `resolveTodoTags` already reports as `dangling` against
 * `not-checked`. A chip with no href says "this points somewhere I could not
 * reach", which is a third state and not a failure.
 */
function todoRelations(tags: {
  roles: string[];
  processes: string[];
  tasks: Array<{ process: string; task: string }>;
  identities: Array<{ provider: string; id: string; displayName?: string }>;
  references: Array<{ kind: string; id: string }>;
  artefacts: Array<{ kind: string; id: string; repo?: string; provider?: string }>;
}): Array<{ axis: string; label: string; href?: string }> {
  const out: Array<{ axis: string; label: string; href?: string }> = [];

  for (const r of tags.roles) out.push({ axis: "role", label: r });
  for (const p of tags.processes) out.push({ axis: "process", label: p });
  for (const t of tags.tasks) out.push({ axis: "task", label: `${t.process}▸${t.task}` });

  for (const i of tags.identities) {
    // Provider-qualified, because `litlfred` is not an identity and
    // `github:litlfred` is. Only GitHub resolves to a profile; another
    // provider's handle is shown as written rather than linked to a guess.
    const label = i.displayName ?? `${i.provider}:${i.id}`;
    out.push(
      i.provider === "github"
        ? { axis: "who", label, href: `https://github.com/${i.id}` }
        : { axis: "who", label },
    );
  }

  for (const r of tags.references) {
    if (r.kind === "bean") {
      const file = beanFile(r.id);
      out.push(file ? { axis: "bean", label: r.id, href: `${REPO_WEB}/blob/main/${file}` }
                    : { axis: "bean", label: r.id });
      continue;
    }
    out.push({ axis: r.kind, label: r.id });
  }

  for (const a of tags.artefacts) {
    // An absent `repo` means THIS repository -- the schema says so, because
    // requiring it would make every local reference verbose enough that people
    // go back to writing prose.
    const base = a.repo ? `https://github.com/${a.repo}` : REPO_WEB;
    if (a.kind === "pull-request") out.push({ axis: "PR", label: `#${a.id}`, href: `${base}/pull/${a.id}` });
    else if (a.kind === "issue") out.push({ axis: "issue", label: `#${a.id}`, href: `${base}/issues/${a.id}` });
    else if (a.kind === "commit") out.push({ axis: "commit", label: a.id.slice(0, 9), href: `${base}/commit/${a.id}` });
    else out.push({ axis: a.kind, label: a.id });
  }

  return out;
}

/** The bean's file, or `undefined` when nothing on disk carries that id. */
function beanFile(id: string): string | undefined {
  const dir = join(REPO_ROOT, "beans", "defs");
  if (!existsSync(dir)) return undefined;
  const hit = readdirSync(dir).find((f) => f.startsWith(`${id}--`) || f === `${id}.md`);
  return hit ? `beans/defs/${hit}` : undefined;
}

/**
 * The BPMN call hierarchy — which process calls which as a subprocess.
 *
 * Published so the board can STACK todos the way the owner asked: "stacking
 * should follow hierarchy of business subprocesses". A todo tagged
 * `Process_Publication` sits under `Process_Lifecycle`, because that is what
 * the diagrams say.
 *
 * Read by regex rather than through `loadProcessModel`, deliberately: that
 * loader is async and pulls in `bpmn-moddle` for a page generator that
 * otherwise touches no XML, and the two facts wanted here — a process's id and
 * its `calledElement` refs — are attributes, not structure. The risk of a
 * regex over XML is that it silently reads NOTHING and the hierarchy comes out
 * flat, so `scripts/tests/todos.test.ts` pins the real edges: a parse that
 * stops working fails the build rather than quietly flattening the board.
 */
function processHierarchy(): Record<string, string[]> {
  const dir = join(REPO_ROOT, "skills", "workflows");
  if (!existsSync(dir)) return {};
  const out: Record<string, string[]> = {};
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".bpmn")) continue;
    const xml = readFileSync(join(dir, f), "utf-8");
    const id = /<bpmn:process id="([^"]+)"/.exec(xml)?.[1];
    if (!id) continue;
    const calls = new Set<string>();
    for (const m of xml.matchAll(/calledElement="([^"]+)"/g)) calls.add(m[1]!);
    out[id] = [...calls].sort();
  }
  return out;
}

// The todo board's data. Published here rather than by a separate script
// because it is the same job `qaIcons` already does for verdicts: take
// something the repo holds as files and make it fetchable by a static page.
//
// `editHref` is composed HERE, at build time, for the reason `.fa-node-edit`
// is: the client would otherwise need the repo's web URL, and a literal in
// `docs-ui.js` is a folio's own address inside shared client code.
{
  const items = readTodoFiles().map(({ todo, path }) => ({
    id: todo.id,
    summary: todo.summary,
    comment: todo.comment,
    status: todo.status,
    priority: todo.priority,
    origin: todo.origin,
    createdAt: todo.createdAt,
    targetLabel: todo.targetLabel,
    tags: todo.tags,
    // The edges, already resolved. A sticky that showed only status and
    // priority would waste a six-axis relationship model on two enums.
    relations: todoRelations(todo.tags),
    // The SAME affordance every node already gets, pointed at this todo's own
    // file. A sticky is a content object; it does not need an editor of its own.
    editHref: `${EDIT_BASE}/${path}`,
  }));
  mkdirSync(dirname(TODO_ASSET), { recursive: true });
  const processes = processHierarchy();
  emit(
    TODO_ASSET,
    JSON.stringify({ $schema: "folio-todo-index/v1", items, processes }) + "\n",
    "data",
  );
  console.log(`  ${check ? "·" : "✓"} assets/todos/index.json (${items.length} todo(s))`);
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

if (check && refreshed > 0) {
  // Printed, never gated. See `emit`: a verdict projection moves when the
  // corpus is re-swept or a block is edited, and the published copy is
  // regenerated by the site build regardless of what is committed here.
  console.log(
    `\n${refreshed} verdict projection(s) would be refreshed — not a staleness failure.\n` +
      `  They carry QA counts and freshness measured against the working tree, and the\n` +
      `  site build regenerates them. Run the generator to refresh the committed copies.`,
  );
}
if (check && stale > 0) {
  console.error(`\n${stale} generated file(s) stale or missing — run: bun run scripts/gen-docs-pages.ts`);
  process.exit(1);
}
console.log(
  check
    ? "\ngenerated pages are up to date"
    : `\nWrote ${written} page(s) to ${OUT_DIR} and ${qaWritten} QA witness file(s) to ${QA_ASSET_DIR}`,
);
}
