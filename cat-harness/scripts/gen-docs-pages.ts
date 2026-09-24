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
 *      silently breaks every inbound link — including the subprocess links
 *      `render-bpmn.ts` derives from a node's `asset.source`
 *      (`process-presentations.ts`). Each node's `id` is pinned with
 *      kramdown's `{: #id }` instead.
 *   2. Every node gets an edit link to ITS OWN source. Jekyll knows only
 *      `page.path`, so a per-node link is impossible from the theme: the
 *      node -> file mapping exists only here, in the thing that assembles the
 *      page. That is the whole argument for generating the page at all.
 *   3. An asset's edit link points at the `.bpmn`, never at the generated
 *      `.svg`. `render-bpmn.ts` is explicit that the SVGs are never
 *      hand-edited; a link inviting someone to do so would be worse than none.
 *
 * Usage:
 *   bun run cat-harness/scripts/gen-docs-pages.ts            # write
 *   bun run cat-harness/scripts/gen-docs-pages.ts --check    # fail if any page is stale
 *
 * @covers docs
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, unlinkSync } from "node:fs";
import { workflowFiles } from "./known-skills.js";
import { join, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { WebPage, WebPageNode } from "../schemas/webpage.ts";
import { resolveTarget } from "../schemas/todo-index.js";
import { renderTodoListing } from "./todo-listing.js";
import { SEMANTIC_ZOOM_FILE, readSemanticZoom } from "../schemas/semantic-zoom.js";
import { availableLocales } from "../content/pipeline/po-resolve.ts";
import {
  localesAvailableFor,
  sourceLocale,
} from "../content/pipeline/translation-index.ts";
import {
  QA_FAMILY_LABEL,
  readWitnessDoc,
  rollUpWitnessDocs,
  sidecarPaths,
  type QaFamily,
  type QaWitnessDoc,
} from "../content/pipeline/qa-witness.ts";
import { readTodoFiles, todoDefaultTheme } from "./todos.js";
import { beanDefsDir, beanFindings, blockedBy, readBeans } from "./beans.js";
import { detectRepoUrl } from "../src/core/git-refs.js";
import { resolveThemeBackdrop } from "../schemas/theme.js";
import { THEMES, themeById } from "../schemas/themes.js";
import {
  directoryForGraph,
  publishedAssetPath,
  readDeclaration,
  siteDirFor,
  sourceLinks,
  repoRootFor,
} from "../schemas/cat-harness.ts";
import { readQaGraph } from "../content/pipeline/qa-graph-index.ts";
import { tileCounts } from "../schemas/tile-count.js";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The language these generated pages are authored in — the instance's answer,
 * not the `en` literal this file used to write into every page's front matter.
 */
const SOURCE_LOCALE = sourceLocale(REPO_ROOT);
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
const OUT_DIR = join(REPO_ROOT, siteDirFor(REPO_ROOT));
/**
 * The forge this checkout points at.
 *
 * DETECTED, not written down. This was the literal
 * `https://github.com/litlfred/folio-assistant` until 2026-09-20 — one
 * instance's address inside a generator every instance runs, which is exactly
 * the genericity failure `AGENTS.md` catalogues (a platform script carrying
 * `quantum-observable-universe`). Every edit link, every bean link and every
 * QA link this file emits was composed from it, so a fork's published docs
 * would have pointed at this repository.
 *
 * `gen-landing-data.ts` already resolved it this way; the two now agree.
 * The fallback keeps the links working where there is no `origin` to ask —
 * a sandbox, a tarball — rather than emitting hrefs that go nowhere.
 */
const REPO_WEB = detectRepoUrl(repoRootFor(REPO_ROOT)) ?? "https://github.com/litlfred/folio-assistant";
const EDIT_BASE = `${REPO_WEB}/edit/main`;

/**
 * The forge this checkout actually has, and the branch its links point at.
 *
 * RESOLVED from `origin`, never composed from a literal — bean `pb04`. The
 * `REPO_WEB` constant above still serves the page-node links that predate
 * this; the todo board's own controls go through `sourceLinks`, which returns
 * `undefined` for a non-github.com remote and so makes the control absent
 * rather than dead.
 *
 * `main` rather than the checked-out branch, for the reason
 * `gen-landing-data.ts` gives: this data is generated into a PUBLISHED site,
 * and a link to a feature branch dies when that branch does.
 */
/**
 * A path `readTodoFiles` reports, as the REPOSITORY sees it.
 *
 * `todos/` sits at the repository root while this generator's `REPO_ROOT` is
 * the cat-harness instance, so `readTodoFiles` returns `../todos/items/x.md`.
 *
 * **The old edit link shipped that verbatim**, as
 * `https://github.com/.../edit/main/../todos/items/x.md`. A browser normalises
 * the `..` away before the request is sent, so what GitHub received was
 * `/edit/todos/items/x.md` — the branch segment eaten, a path that has never
 * existed. Every todo sticky's pencil was dead, and it looked entirely correct
 * in the generated JSON. Bean `pb04`; found by resolving the link rather than
 * by reading it.
 */
function repoRelative(p: string): string {
  return relative(repoRootFor(REPO_ROOT), resolve(REPO_ROOT, p));
}

const REPO_URL = detectRepoUrl(repoRootFor(REPO_ROOT));
const SOURCE_BRANCH = "main";
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

/**
 * The LINEAR FLOOR — the same notes, as HTML the server already sent.
 *
 * A SECOND emission from the SAME `items` array three lines below the JSON
 * one, which is the only reason two artefacts about one fact are acceptable
 * here: they cannot drift, because neither is read to produce the other and a
 * single value produces both in one pass.
 *
 * Two outputs rather than one because they are read by different things at
 * different times. `assets/todos/index.json` is FETCHED by `docs-ui.js` after
 * the page loads; this fragment is INCLUDED by Jekyll before it is sent, and
 * a reader with JavaScript off never reaches the first. Jekyll will not read
 * `assets/` as data and a browser cannot fetch `_includes/`, so neither file
 * can serve the other's caller.
 *
 * Under `_includes/generated/` rather than beside the hand-written includes:
 * a directory that is entirely generated is unambiguous, and this repository's
 * standing rule is that a generated directory is never hand-edited.
 */
const TODO_LISTING_INCLUDE = join(OUT_DIR, "_includes", "generated", "todo-listing.html");

/**
 * The folio's semantic-zoom declaration, as the board reads it.
 *
 * Published rather than inlined because R2 is explicit — *"the threshold SHALL
 * be declared data, not a literal in the renderer"* — and a number compiled
 * into `docs-ui.js` would satisfy the letter of that and none of the point.
 *
 * **Emitted only when the folio declares one.** A folio with no
 * `semantic-zoom.json` publishes NO file, `docs-ui.js` gets a 404, and it says
 * it could not determine a threshold rather than choosing one. A default here
 * would put the literal one layer further from where anybody looks for it.
 */
const ZOOM_ASSET = join(OUT_DIR, "assets", SEMANTIC_ZOOM_FILE);

/**
 * The first line of every generated include.
 *
 * An HTML comment rather than a Liquid one, deliberately: a Liquid comment is
 * stripped before the page is sent, so the one reader who most needs the
 * warning — somebody viewing source on the published site and wondering where
 * this markup came from — would never see it.
 */
const GENERATED_INCLUDE_BANNER =
  "<!-- GENERATED by scripts/gen-docs-pages.ts. Do not hand-edit: " +
  "`bun run cat-harness/scripts/gen-docs-pages.ts` rewrites it, and " +
  "`--check` fails the build if it is stale. -->\n";

/**
 * The bean board's data — the AGENT work plan, published the same way.
 *
 * Same argument as `TODO_ASSET` one file rather than N: the badge needs a
 * COUNT before anybody opens anything. The difference is scale, and it is two
 * orders of magnitude — 239 beans against 3 todos on 2026-09-20 — which is
 * why the projection carries a TRIMMED body rather than the whole of one.
 * Every bean here runs to hundreds of lines of prose; shipping all of it would
 * put roughly a megabyte on the page to render a status column.
 */
const BEANS_ASSET = join(OUT_DIR, "assets", "beans", "index.json");

/**
 * How much of a bean's body the projection carries.
 *
 * Enough for a sticky's preview and no more. A reader who wants the argument
 * follows `editHref` to the file, which is the same affordance every other
 * node gets.
 *
 * **Measured at this length, 2026-09-20:** 239 beans project to 235 KB raw and
 * **62 KB gzipped** — 0.26 KB per bean against the todo index's 1.5 KB per
 * todo, so the per-item cost is already the lower of the two. The number is
 * recorded because the next person to change this constant should be changing
 * a measurement rather than a guess.
 */
const BEAN_BODY_PREVIEW = 400;
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

/**
 * Where a page's verdict index lands, and the URL the badges fetch it from.
 *
 * **No leading underscore, deliberately.** GitHub Pages strips `_`-prefixed
 * paths unless `.nojekyll` is present, and this file is published by a `cp`
 * into `_site` AFTER Jekyll has run — so a Pages-side strip would 404 every
 * index and paint every badge on the site `could not determine`. Honest, and
 * useless. `.nojekyll` is on `gh-pages` today; a filename that does not depend
 * on it is cheaper than a filename that does.
 *
 * It cannot collide with a projection: those are `<nodeId>.<family>.json`, and
 * `qa-index` is not a QA family.
 */
const QA_INDEX_FILE = "qa-index.json";

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
/**
 * The page-level `TR` badge — one panel for every translation verdict on the
 * page, rolled up from its blocks' sidecars.
 *
 * ## The gap it fills
 *
 * The per-node `TR` icon is honest and almost always empty: a block gets a
 * translation sidecar only when a PO actually carries its strings, and this
 * site is 3% translated, so 114 of 115 of those icons are "not swept" spans
 * with nothing under them. A reader of a translated page had no translation
 * evidence to open anywhere on it. The page-level round-trip badge that once
 * stood in that spot was deleted (bean `ktt2`) because it scored 36 strings
 * against a 6-entry back-translation map and published every unmeasured one as
 * drift — right to remove, and nothing replaced it. Issue #687, bean `r3ez`.
 *
 * ## It is the SAME control as every other badge, deliberately
 *
 * Same class, same `data-qa-*` contract, same `qa-index.json`, painted by the
 * same `paintQaBadges` and opened by the same `qaToggle`. Nothing here is a
 * second badge mechanism with its own states to drift — the only new fact is
 * the subject, which is a page rather than a node, and `rollUpWitnessDocs`
 * labels every criterion with the block it came from so the panel still says
 * which one a failure belongs to.
 *
 * ## Two different absences, as elsewhere in this file
 *
 * No roll-up at all is `unswept`, server-rendered as a plain `<span>`: nothing
 * to open, and a control that does nothing when pressed is worse than a mark.
 * A roll-up that exists but whose index row cannot be read paints `unknown` in
 * the browser. Only the second is "could not determine", and they are not the
 * same answer.
 *
 * The badge rides a `fa-page-qa-badges` paragraph under the `h1`;
 * `mountTranslationBadges` in `docs-ui.js` hoists it into the coverage/sweep
 * row so the page carries one badge row rather than two.
 */
function pageQaIcons(page: WebPage): string {
  const subjects = page.nodes
    .filter((n) => n.block)
    .map((n) => ({
      path: join(pageDir(page), `${n.block}.md`),
      label: blockLabel(page, n) ?? n.id,
    }));
  if (subjects.length === 0) return "";

  const family: QaFamily = "translation";
  const { tag, label } = QA_FAMILY_LABEL[family];
  const slug = page.slug.replace(/\//g, "-");
  const doc = rollUpWitnessDocs(family, subjects, REPO_ROOT, `${page.title} — translations`);

  if (!doc) {
    const title = `${label}: not swept — no block on this page carries a translation verdict`;
    return (
      `<span class="fa-qa-badges fa-page-qa-badges">` +
      `<span class="fa-qa-badge fa-qa-unswept fa-qa-fam-${family}" ` +
      `title="${title}" aria-label="${title}">` +
      `<span class="fa-qa-tag">${tag}</span></span></span>`
    );
  }

  const key = `page.${family}`;
  const rel = join(slug, `${key}.json`);
  const abs = join(QA_ASSET_DIR, rel);
  mkdirSync(dirname(abs), { recursive: true });
  emit(abs, JSON.stringify(doc) + "\n", "verdict");
  emittedQa.add(abs);
  qaIndex[key] = { state: doc.state, counts: doc.counts };

  const title = `${label}: loading the verdict…`;
  return (
    `<span class="fa-qa-badges fa-page-qa-badges">` +
    `<button type="button" class="fa-qa-badge fa-qa-pending fa-qa-fam-${family}" ` +
    `data-qa-family="${family}" data-qa-key="${key}" data-qa-label="${label}" ` +
    `data-qa-noun="page" ` +
    `data-qa-src="{{ '/assets/qa/${rel}' | relative_url }}" ` +
    `data-qa-index="{{ '/assets/qa/${slug}/${QA_INDEX_FILE}' | relative_url }}" ` +
    `aria-expanded="false" aria-busy="true" title="${title}" aria-label="${title}">` +
    `<span class="fa-qa-tag">${tag}</span>` +
    `<span class="fa-qa-glyph" aria-hidden="true">…</span></button></span>`
  );
}

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

/** Where a page's content is authored — the file to edit instead of the output. */
function manifestRef(page: WebPage): string {
  return `content/docs/${page.slug.replace(/\//g, "-")}/`;
}

function renderPage(page: WebPage): string {
  const lines: string[] = [];
  // Auto-detect available translations for this page.
  //
  // `localesAvailableFor` folds in the SOURCE language, which `availableLocales`
  // cannot: it resolves `translations/<locale>/<stem>.po`, and the source
  // language has no such directory by construction. Stamping the PO-derived
  // list alone is what made the coverage badge read `0/5` on a page that
  // plainly exists in English, and it disagreed with what the hand-authored
  // translated pages stamp — those carry the full set they are available in,
  // which is the meaning this now writes for both halves of the corpus.
  // Issue #687, bean `czct`.
  const stem = page.slug.replace(/\//g, "-");
  const locales = localesAvailableFor(REPO_ROOT, [
    SOURCE_LOCALE,
    ...availableLocales(REPO_ROOT, stem),
  ]);

  lines.push("---");
  lines.push("layout: default");
  lines.push(`title: ${page.title}`);
  if (page.parent) lines.push(`parent: ${page.parent}`);
  if (page.navOrder !== undefined) lines.push(`nav_order: ${page.navOrder}`);
  lines.push(`lang: ${SOURCE_LOCALE}`);
  if (locales.length > 0) {
    lines.push(`available_locales: ${JSON.stringify(locales)}`);
  }
  lines.push("---");
  lines.push("");
  // THE PAGE SAYS IT WAS GENERATED, IN ITS OWN BYTES.
  //
  // Until bean `06e3` §4(b) this generator marked nothing it wrote, so its
  // output was byte-indistinguishable from an authored page and nothing
  // downstream could tell them apart. `check:docs-populated` had to report
  // these as an ambiguity it could not resolve, and it was right to: crediting
  // them would let a harness pass on documentation nobody wrote, and dropping
  // them would fail a harness for pages it does have.
  //
  // An HTML comment, so it is invisible in the rendered page and present in
  // the source a reader opens on the forge. The phrase is the one every other
  // generator here uses, which is what makes ONE reader able to recognise all
  // of them rather than a list of spellings.
  lines.push(`<!-- Generated by scripts/gen-docs-pages.ts from ${manifestRef(page)}. Do not hand-edit: the next run overwrites it, and \`docs:pages:check\` fails on the difference. -->`);
  lines.push("");
  lines.push(`# ${page.heading ?? page.title}`);
  lines.push("{: .no_toc }");
  lines.push("");
  // The page-level QA row, under the title. `docs-ui.js` hoists it into the
  // coverage/sweep badge row it builds in the same place, so the reader sees
  // one row; it stands on its own if that script does not run.
  const pageQa = pageQaIcons(page);
  if (pageQa) {
    lines.push(pageQa);
    lines.push("");
  }
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

/**
 * Every block's declared label, resolved to the page and node it is on.
 *
 * THE REVERSE INDEX R3 NEEDS, and it is a JOIN rather than two fields lying
 * around. `readTodoFiles` hands the todo emitter `targetLabel` and nothing
 * else; the page and node live HERE, where `blockLabel` reads a block's own
 * declaration while this loop holds both. Building it costs nothing extra
 * because the walk happens anyway — but it is why `target` could not simply be
 * spread from the todo, which an earlier impact analysis assumed and which the
 * data-model phase corrected.
 *
 * Filled by the loop below and read by the todo index further down, so the
 * loop must run first — which it does: the index is emitted after every page.
 */
const blockByLabel = new Map<string, { page: string; node: string }>();

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
  // Collected BEFORE rendering, so a page that fails to render still cannot
  // leave a half-filled index behind it.
  //
  // A DUPLICATE LABEL THROWS, naming both sites. The label is page-qualified
  // precisely so it is unique — `what-is-not-built-yet` is a node on two pages
  // — so two blocks claiming one label means the qualification has failed, and
  // a map that silently kept the last writer would attach every note with that
  // label to whichever page happened to be walked second.
  for (const node of page.nodes) {
    const label = blockLabel(page, node);
    if (label === undefined) continue;
    const prev = blockByLabel.get(label);
    if (prev !== undefined) {
      throw new Error(
        `two blocks declare the label "${label}": ${prev.page}/${prev.node} and ` +
          `${page.slug}/${node.id}. A label is page-qualified so that it is unique; ` +
          `a note pointing at this one could not say which block it meant.`,
      );
    }
    blockByLabel.set(label, { page: page.slug, node: node.id });
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

/**
 * The bean's file, or `undefined` when nothing on disk carries that id.
 *
 * The directory is RESOLVED from `beans/beans.json` rather than composed. It
 * was `join(repoRootFor(REPO_ROOT), "beans", "defs")` until 2026-09-20 — a
 * second answer to a question the graph already answers, which would have gone
 * on resolving to nothing the moment the store moved, and reported every bean
 * reference as unlinkable while looking correct.
 */
function beanFile(id: string): string | undefined {
  const dir = beanDefsDir(repoRootFor(REPO_ROOT));
  if (dir === null || !existsSync(dir)) return undefined;
  // Sorted for the same reason `processHierarchy` sorts: raw directory order
  // is filesystem state, and `find` over it makes the FIRST match a property of
  // where the file landed on disk. Two beans sharing a prefix would resolve to
  // different files on two machines.
  const hit = readdirSync(dir).sort().find((f) => f.startsWith(`${id}--`) || f === `${id}.md`);
  return hit ? relative(repoRootFor(REPO_ROOT), join(dir, hit)) : undefined;
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
  const out: Record<string, string[]> = {};
  // SORTED, and it is load-bearing rather than tidy — `workflowFiles` sorts,
  // and that guarantee is why this reads it rather than a directory.
  // `readdirSync` under Bun returns RAW DIRECTORY ORDER: on ext4 that is a
  // hash of the filename against the directory's own seed, so two checkouts
  // of the same commit enumerate these 32 files differently. The ids below
  // become object keys and `JSON.stringify` preserves insertion order, so the
  // published index came out byte-different on every machine.
  //
  // Nobody noticed for the reason bean `d2kp` is about: the `--check` that
  // would have caught it was a folded YAML continuation line and had never
  // run. It failed on its FIRST run, on the PR that un-folded it, against a
  // committed file that reproduced perfectly on the machine that wrote it.
  // An artefact that is only reproducible where it was generated is not a
  // generated artefact; it is a snapshot.
  for (const f of workflowFiles(REPO_ROOT)) {
    if (!f.endsWith(".bpmn")) continue;
    const xml = readFileSync(f, "utf-8");
    // PREFIX-AGNOSTIC, and that is a live fix rather than defensiveness.
    // `translation-workflow.bpmn` binds the BPMN MODEL namespace as its
    // DEFAULT (`xmlns="…/MODEL"`) and writes `<process id="Process_Trans-
    // lation">`, which is valid BPMN. A `/<bpmn:process id="…"/` matched
    // nothing there, so that process was absent from the published hierarchy
    // altogether — a todo tagged `Process_Translation` would have read as
    // naming a process no diagram declares.
    //
    // `\bid=` rather than a fixed position, because attribute order is the
    // author's choice: this file writes `id` first and `isExecutable` last,
    // another may not.
    const id = /<(?:\w+:)?process\b[^>]*\bid="([^"]+)"/.exec(xml)?.[1];
    if (!id) continue;
    const calls = new Set<string>();
    // Scoped to `<bpmn:callActivity …>` OPENING TAGS, not to the whole file.
    // A bare `/calledElement="([^"]+)"/g` over the XML reads PROSE as
    // structure, and that was live: `upstream-version-adoption.bpmn` documents
    // itself with *"Callers invoke it with `calledElement="Process_Upstream-
    // Adoption"`"*, so the published hierarchy carried
    // `Process_UpstreamAdoption → itself` — an edge `loadProcessModel` REFUSES
    // outright ("A process cannot contain itself", process-model.ts), because
    // an interpreter entering A → A settles forever.
    //
    // The comment above worries about this regex matching NOTHING and the
    // board coming out flat. Matching TOO MUCH is the same class reversed and
    // is worse: a flat board is visibly empty, whereas a phantom edge renders
    // as a real one and stacks a process under itself. Documentation that
    // names an id is the normal way to describe a reusable subprocess, so this
    // was not a typo waiting to be found — the pattern invited it.
    //
    // Attribute order is not assumed: the tag is matched first, then the
    // attribute within it.
    for (const tag of xml.matchAll(/<(?:\w+:)?callActivity\b[^>]*>/g)) {
      const ref = /calledElement="([^"]+)"/.exec(tag[0]!)?.[1];
      if (ref) calls.add(ref);
    }
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
  // THE THEME, resolved HERE rather than in the client or at parse time.
  //
  // Bean `5y4b`, the owner: "todos need grump cat themeing based on content
  // too. used jugement". Three things follow, and this line is where the first
  // two meet:
  //
  //  - the theme is DATA on the todo, never a keyword match on the summary in
  //    `docs-ui.js` — a rule nobody can see, review or override, which changes
  //    silently when somebody rewords a todo;
  //  - the DEFAULT is the graph's (`todos.json`), so a folio chooses its own
  //    and a literal here is not this repository's answer imposed downstream;
  //  - the todo's OWN value is preserved unresolved upstream of this, so
  //    "the author chose grumpy-cat" and "nobody chose" stay distinguishable
  //    to a reviewer reading the file.
  /** `{ target }` when the label resolves, `{}` when it does not — see the spread below. */
  const targetOf = (label: string | undefined) => {
    const target = resolveTarget(blockByLabel, label);
    return target === undefined ? {} : { target };
  };
  const fallbackTheme = todoDefaultTheme();
  const items = readTodoFiles().map(({ todo, path }) => ({
    id: todo.id,
    summary: todo.summary,
    comment: todo.comment,
    status: todo.status,
    priority: todo.priority,
    origin: todo.origin,
    createdAt: todo.createdAt,
    targetLabel: todo.targetLabel,
    // THE SAME ATTACHMENT, IN PARTS — R3 of issue #602, bean `f76l`.
    //
    // `targetLabel` is page-qualified (`sec:<page>-<node>`), which is correct
    // and is also a burden: a consumer asking "which page is this on" has to
    // know the prefix, know the separator, and know that node ids themselves
    // contain `-` — so the split is not even unambiguous without the page
    // list. `targetLabel` STAYS, so nothing that matches on it breaks.
    //
    // Spread, so a label that resolves to NO block emits an absent key rather
    // than `null` or a guess. That is the third state and it is already how
    // this repository treats a dangling label: `mountPageStickies` reports it
    // instead of dropping the note.
    ...targetOf(todo.targetLabel),
    theme: todo.theme ?? fallbackTheme,
    tags: todo.tags,
    // The edges, already resolved. A sticky that showed only status and
    // priority would waste a six-axis relationship model on two enums.
    relations: todoRelations(todo.tags),
    // VIEW *AND* EDIT, both resolved through the same seam the landing
    // stickies use, and both ABSENT when there is no github.com `origin`.
    //
    // Bean `pb04`, the owner: *"rendeding shows edit src icon (and also need
    // view icon) if github tools avaialable in rendering pipeline"*. Three
    // things were wrong here and each is a different failure:
    //
    //  - only EDIT existed. `/blob/` is reading and `/edit/` opens the editor:
    //    a reader checking what a card says should not land in a text box, and
    //    one who wants to fix it should not have to find the button;
    //  - the address was a LITERAL (`EDIT_BASE`), so a fork or a rename
    //    published links to this repository — and the comment beside it
    //    already argued that a folio's own address does not belong in shared
    //    code, then wrote one down one layer up;
    //  - there was NO CAPABILITY GATE, so the icon appeared whether or not the
    //    pipeline had a forge behind it. A dead edit link is worse than no
    //    link: it invites a click, and on a private repository it 404s for
    //    exactly the reader who cannot edit, which reads as "this page is
    //    broken" rather than "you cannot do this".
    //
    // Spread, so an absent link is an ABSENT KEY rather than `null` — a
    // consumer testing truthiness and one testing presence should agree.
    ...(sourceLinks(REPO_URL, repoRelative(path), SOURCE_BRANCH) ?? {}),
  }));
  mkdirSync(dirname(TODO_ASSET), { recursive: true });
  const processes = processHierarchy();
  // INDENTED, and it is about merging rather than about reading.
  //
  // Minified, this file is ONE LINE of ~12 KB. Git merges text by line, so a
  // single line means any change on both sides of a merge is a whole-file
  // conflict — two branches adding two different todos cannot both win. That
  // is not hypothetical: it conflicted on three consecutive merges of one
  // branch on 2026-09-20, every time, while `repo-partition.ts`,
  // `package-manifest.json` and `AGENTS.md` all auto-merged cleanly despite
  // being edited on both sides.
  //
  // Indented, each todo occupies its own lines, so two branches whose new
  // todos land in DIFFERENT parts of the sorted list merge untouched.
  //
  // **It is a partial fix, and the limit is worth knowing**: two todos that
  // sort ADJACENT still conflict, because the inserted lines overlap. Measured
  // on a scratch repository rather than reasoned about — five base items, one
  // branch inserting at the front and one at the back:
  //
  //   minified   CONFLICT
  //   indented   clean, both todos present, 7 items
  //
  // and with both branches appending at the same position, BOTH formats
  // conflict. So this removes the guaranteed conflict, not every conflict.
  //
  // It works at all only because the order is already deterministic —
  // `readTodoFiles` sorts, `processHierarchy` reads the sorted
  // `workflowFiles` — which the comment above that function had to establish
  // for a different reason: an artefact reproducible only where it was
  // generated is a snapshot, not a generated file. A mergeable one needs the
  // same guarantee, or every regeneration reshuffles and conflicts anyway.
  //
  // The cost is 11,963 -> 14,144 bytes on a static asset gzip mostly removes.
  // `docs-ui.js` calls `JSON.parse`; it never sees the whitespace.
  // THE ART, per theme, published beside the items rather than on each of them.
  //
  // One entry per theme actually used, not per todo: fifty todos sharing a
  // theme would otherwise carry fifty copies of the same three paths. The
  // client joins on the theme id it already has.
  //
  // `resolveThemeBackdrop` is what decides, so this cannot ship a partial set:
  // it returns art or NOTHING, never some layouts, because a phone handed the
  // laptop crop shows the art's quiet area in the wrong place and nothing
  // reports it. A theme with no backdrop — `pale-sage`, the high-contrast pair
  // — is simply absent here, and the client renders a flat themed card, which
  // is correct rather than degraded.
  //
  // THE SCRIM IS NOT HERE, deliberately: `themes.css` already emits
  // `--fa-sticky-scrim` per theme, so a copy in this file would be a second
  // answer free to disagree with the stylesheet that actually paints it. The
  // contrast guarantee — AAA over pure black — is a property of that value and
  // travels with it.
  const declaration = readDeclaration(REPO_ROOT);
  const themeArt: Record<string, Record<string, string>> = {};
  for (const id of new Set(items.map((i) => i.theme).filter((t): t is string => t !== undefined))) {
    const theme = themeById(id);
    if (theme === undefined) {
      // A todo naming a theme nothing declares is a FINDING, not a silent flat
      // card: the author asked for something and got nothing, and the failure
      // is invisible on the page.
      throw new Error(
        `a todo declares theme "${id}", which no theme in schemas/themes.ts defines. ` +
          `Declared themes: ${THEMES.map((t) => t.id).join(", ")}`,
      );
    }
    const art = resolveThemeBackdrop(theme, declaration?.images);
    if (art.art.size === 0) continue;
    // PUBLISHED paths, not declared ones: the client fetches this file from the
    // site, where the site directory's contents sit at the root. A declared
    // `docs/assets/...` would 404 for every reader and look like missing art.
    themeArt[id] = Object.fromEntries(
      [...art.art].map(([layout, img]) => [layout, publishedAssetPath(REPO_ROOT, img.src)]),
    );
  }

  emit(
    TODO_ASSET,
    JSON.stringify(
      {
        $schema: "folio-todo-index/v1",
        // The tile's headline number, declared here because only this
        // generator knows WHICH of the projection's arrays is the one — see
        // `schemas/tile-count.ts`. `items`, not `processes`: a process is a
        // lane the board draws, not a todo somebody owes.
        ...tileCounts({ todos: [items.length, "todos"] }),
        repoWeb: REPO_WEB,
        items,
        processes,
        themeArt,
      },
      null,
      2,
    ) + "\n",
    "data",
  );

  // THE FLOOR, from the same `items`. `relative_url` is a Liquid filter and
  // is the one thing this fragment cannot compute for itself: `baseurl` is
  // Jekyll's, and a root-relative href would 404 for every reader of a site
  // published under a path. Everything else about the fragment — the field
  // set, the order, the escaping, the elements — is `renderTodoListing`'s, so
  // the e2e that serves it with JavaScript disabled measures the same markup
  // this writes.
  mkdirSync(dirname(TODO_LISTING_INCLUDE), { recursive: true });
  emit(
    TODO_LISTING_INCLUDE,
    GENERATED_INCLUDE_BANNER +
      renderTodoListing(items, {
        // SINGLE quotes inside the Liquid, because the result is interpolated
        // into a double-quoted `href` attribute. Double quotes here produced
        // `href="{{ "/x.html" | ... }}"`, which terminates the attribute at
        // the second character of the Liquid tag — valid Liquid, broken HTML,
        // and it renders as a link to the empty string.
        pageHref: (page, node) => `{{ '/${page}.html' | relative_url }}#${node}`,
      }),
    "data",
  );

  // THE THRESHOLDS, when this folio has declared any. `readSemanticZoom`
  // returns `undefined` for a folio that has not, and that absence is carried
  // through rather than filled in: nothing is written, and the board reports
  // it could not determine one.
  const zoom = readSemanticZoom(REPO_ROOT);
  if (zoom !== undefined) {
    mkdirSync(dirname(ZOOM_ASSET), { recursive: true });
    emit(ZOOM_ASSET, JSON.stringify(zoom, null, 2) + "\n", "data");
  }
  console.log(
    `  ${check ? "·" : "✓"} assets/${SEMANTIC_ZOOM_FILE} ` +
      (zoom === undefined
        ? "(not declared by this folio — nothing published, and the board says so)"
        : `(default ${zoom.belowPx}px, ${Object.keys(zoom.byKind).length} kind override(s))`),
  );
  const themed = items.filter((i) => i.theme !== undefined).length;
  console.log(
    `  ${check ? "·" : "✓"} assets/todos/index.json (${items.length} todo(s), ` +
      `${themed} themed, ${Object.keys(themeArt).length} theme(s) with art)` +
      `\n  ${check ? "·" : "✓"} _includes/generated/todo-listing.html ` +
      `(${items.length} todo(s), served without JavaScript)`,
  );
}

// The bean board's data. Sibling of the todo block above, and deliberately the
// same shape: one indented JSON file, emitted through the same `--check`
// contract, with `editHref` composed HERE for the same reason — the client
// would otherwise need the repository's web address, and a literal in
// `docs-ui.js` is one folio's own address inside shared client code.
{
  const beans = readBeans(repoRootFor(REPO_ROOT));
  // `null` is "no bean store", which is NOT the same as a store with nothing
  // in it, and rendering them alike is how a consumer reports a clean run over
  // a repository it never looked at. A folio with no work plan simply gets no
  // projection; the board reads the absent file as "no store" rather than as
  // an empty one.
  if (beans === null) {
    console.log(`  · assets/beans/index.json — no bean store`);
  } else {
    const blockers = blockedBy(beans);
    const items = beans.map((b) => ({
      id: b.id,
      title: b.title,
      status: b.status,
      type: b.type,
      priority: b.priority,
      parent: b.parent,
      // Both directions, resolved once. A client given only `blocking` would
      // have to invert the whole set to answer "what is holding THIS bean up",
      // which is the question a board is actually asked.
      blocking: b.blocking,
      blockedBy: blockers.get(b.id) ?? [],
      createdAt: b.createdAt,
      // Published as a FACT, with no age computed from it. See `beanFindings`.
      updatedAt: b.updatedAt,
      preview: b.body.trim().slice(0, BEAN_BODY_PREVIEW),
      // Repo-relative, and the renderer derives BOTH a view and an edit URL
      // from it. Shipping two absolute URLs per bean would put the forge's URL
      // shape in the data 283 times over, and they would then have to agree.
      file: b.file,
    }));
    mkdirSync(dirname(BEANS_ASSET), { recursive: true });
    // Indented for the merge reason the todo index documents at length: a
    // minified projection is one line, git merges by line, and two branches
    // each adding a bean would conflict on the whole file every time. At 239
    // beans that argument is stronger here than it was there.
    emit(
      BEANS_ASSET,
      JSON.stringify(
        {
        $schema: "folio-bean-index/v1",
        // `items`, not `items + findings`: a finding is a defect ABOUT the
        // work plan, not an item on it, and adding them would make the tile
        // disagree with the board it opens. See `schemas/tile-count.ts` for
        // why the number is declared here rather than inferred by the reader.
        ...tileCounts({ beans: [items.length, "beans"] }),
        // The forge, so `work-plan.js` composes its links from DATA rather
        // than carrying one instance's address in shared client code. Same
        // reason `editHref` is composed here, one level further on.
        repoWeb: REPO_WEB,
        items,
        findings: beanFindings(beans),
      },
        null,
        2,
      ) + "\n",
      // EXISTENCE-gated, not content-gated, and the asymmetry with the todo
      // index above is the whole point.
      //
      // `emit`'s own note says a `data` projection is gated on exact content
      // because it projects files a human authored, so a difference is
      // somebody who forgot to regenerate. That holds for three todos. It does
      // not hold for the bean store: EVERY agent session writes to `beans/`,
      // so the projection moves whenever anybody works — which nobody forgot
      // to do.
      //
      // Measured, 2026-09-20, and this is why the gating changed: this branch
      // carried 296 bean files while `main` carried 522, four hours apart.
      // CI tests the MERGE ref, so a content gate went red on a projection
      // that was fresh on the branch and fresh on main and stale only against
      // their union. Every open PR would have to regenerate on every merge, to
      // fix nothing a reader could see.
      //
      // That is exactly the shape bean `d2kp` exists to stop: "gating them
      // could only ever fire on a graph that changed". A missing file is still
      // an omission — the board would fetch a 404 forever — so existence is
      // gated and contents are not, and `docs-site.yml` regenerates before
      // publishing so what a reader fetches is current regardless.
      "verdict",
    );
    console.log(`  ${check ? "·" : "✓"} assets/beans/index.json (${items.length} bean(s))`);
  }
}

/**
 * The `qa` graph, projected as one panel per family — bean `py74`, issue #635.
 *
 * `<base>/qa/` said *"declared and nothing publishes a projection for it yet"*
 * over the largest generated graph here. `state-visualizer.ts` flips a graph
 * from `declared` to `live` the moment `assets/<id>/index.json` exists, so
 * this file is the whole of what was missing — no generator, schema or route
 * change.
 *
 * **The directory comes from the DECLARATION, not from a literal.** `qa` is
 * declared once, at `test/results/`, and `directoryForGraph` throws rather
 * than picking silently if that ever stops being true — the `wggr` failure,
 * where resolving `cat-harness` to the first of several matches wrote 37
 * sidecars against the wrong subjects on a run that exited 0. The neighbouring
 * `QA_ASSET_DIR` above still composes its path by hand; it is not changed here
 * because it names a SUBDIRECTORY of the graph (`witnesses/`) that no
 * declaration distinguishes, which is a different question and another bean's.
 *
 * Existence-gated, like the bean index and for the same reason: every QA
 * sweep rewrites this graph, so the projection moves whenever anybody runs
 * one. A content gate would go red on a projection that is fresh on the branch
 * and fresh on main and stale only against their union — bean `d2kp`.
 */
{
  const qaDir = directoryForGraph(REPO_ROOT, "qa");
  if (qaDir === undefined) {
    // Declared nowhere is a real answer and not this generator's to fix. Said
    // out loud rather than skipped silently, because a missing projection and
    // an undeclared graph look identical from the published site.
    console.log(`  · assets/qa/index.json — no directory declares the \`qa\` graph`);
  } else {
    const ix = readQaGraph(qaDir);
    const out = join(OUT_DIR, "assets", "qa", "index.json");
    mkdirSync(dirname(out), { recursive: true });
    emit(
      out,
      // `ix.files`, not `ix.families.length`: a family is a schema the sweep
      // groups by, and 7 on the tile where 636 documents were swept would be
      // a number the reader cannot reconcile with the page it opens. The two
      // third states this block already prints — `unclassified`, `unreadable`
      // — stay in the console; the tile carries one number and its unit.
      JSON.stringify({ ...tileCounts({ qa: [ix.files, "documents"] }), ...ix }, null, 2) + "\n",
      "verdict",
    );
    const fams = ix.families.map((f) => `${f.schema} ${f.files}`).join(", ");
    console.log(
      `  ${check ? "·" : "✓"} assets/qa/index.json (${ix.files} document(s), ` +
        `${ix.families.length} famil${ix.families.length === 1 ? "y" : "ies"}: ${fams}` +
        // Both third states are printed EVERY run, including at zero. A count
        // that appears only when non-zero cannot be told from one nobody
        // measured.
        `; ${ix.unclassified} unclassified, ${ix.unreadable} unreadable)`,
    );
  }
}

/**
 * Publish a translation projection for every HAND-AUTHORED docs page that has
 * one, plus the index its badge paints from.
 *
 * ## Why this loop exists beside the generated-page loop above
 *
 * A generated page's translation verdicts live on its BLOCKS, and `pageQaIcons`
 * rolls those up. A hand-authored page has no blocks; `translation-block-qa.ts`
 * measures the page itself, one sidecar per locale. Those are the pages this
 * site actually has translations of — `docs/index.md` in all five target
 * locales — and nothing published their verdicts. Bean `pp93`.
 *
 * ## It emits from HERE rather than from its own script, and that is forced
 *
 * The orphan sweep immediately below deletes everything under `QA_ASSET_DIR`
 * that this run did not emit. A second writer into that tree would have its
 * files removed by the next `gen-docs-pages` run — silently, since a projection
 * nobody links to is a projection nobody notices is gone. One writer, one
 * prune.
 *
 * ## The page slug is the page's PATH, not its basename
 *
 * `docs/index.md` and `docs/cat-harness/index.md` are different pages with the
 * same stem. `assets/qa/<slug>/` keyed on the basename would give them one
 * directory and one of the two would overwrite the other — the same collision
 * the PO resolution in `translation-block-qa.ts` just had to be taught to
 * refuse, one layer down.
 *
 * That pair went away on 2026-09-21 (bean `8h42`, and the generated page that
 * took the route is `published-graphs.md`, not a second `index.md`). The rule
 * stays: it is about stems, not about those two files, and the next pair to
 * share one will not announce itself.
 */
function publishAuthoredPageTranslationQa(): void {
  const siteDir = OUT_DIR;
  const withQa: string[] = [];
  const walk = (abs: string): void => {
    for (const e of readdirSync(abs, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const p = join(abs, e.name);
      if (e.isDirectory()) {
        if (e.name.startsWith("_") || e.name.startsWith(".")) continue;
        if (e.name === "assets" || e.name === "vendor") continue;
        walk(p);
        continue;
      }
      if (!e.isFile() || !e.name.endsWith(".md") || e.name.startsWith("_")) continue;
      const text = readFileSync(p, "utf-8");
      // Generated pages are already covered by their blocks' roll-up. Same
      // marker, same reason, as the sweep's own exclusion.
      if (text.includes("Generated by scripts/gen-docs-pages.ts")) continue;

      const doc = readWitnessDoc("translation", p, REPO_ROOT);
      if (!doc) continue;

      const slug = relative(siteDir, p).replace(/\.md$/, "").replace(/\//g, "-");
      const key = `page.translation`;
      const rel = join(slug, `${key}.json`);
      const abs2 = join(QA_ASSET_DIR, rel);
      mkdirSync(dirname(abs2), { recursive: true });
      emit(abs2, JSON.stringify(doc) + "\n", "verdict");
      emittedQa.add(abs2);

      const idxAbs = join(QA_ASSET_DIR, slug, QA_INDEX_FILE);
      emit(
        idxAbs,
        JSON.stringify({
          $schema: "folio-qa-index/v1",
          page: slug,
          badges: { [key]: { state: doc.state, counts: doc.counts } },
        }) + "\n",
        "verdict",
      );
      emittedQa.add(idxAbs);
      withQa.push(slug);
    }
  };
  walk(siteDir);

  // WHICH pages have a projection, as a Jekyll data file.
  //
  // Structure, not a verdict — the list says a projection EXISTS and never what
  // it found, so this file cannot go stale by lying the way bean `d2kp`
  // measured. `head_custom.html` reads it to decide whether to emit the badge
  // at all, and `paintQaBadges` fetches the state at load as it does for every
  // other badge.
  //
  // It has to be a published fact rather than a client guess: without it the
  // page would emit a badge unconditionally and a missing projection would
  // 404, which `paintQaBadges` renders as `unknown` — "could not determine".
  // That is a different answer from "not swept", and collapsing the two is the
  // false pass this repository keeps paying for.
  const listPath = join(OUT_DIR, "_data", "translation-qa-pages.json");
  mkdirSync(dirname(listPath), { recursive: true });
  emit(listPath, JSON.stringify(withQa.sort(), null, 2) + "\n", "data");
}

publishAuthoredPageTranslationQa();

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
  console.error(`\n${stale} generated file(s) stale or missing — run: bun run cat-harness/scripts/gen-docs-pages.ts`);
  process.exit(1);
}
console.log(
  check
    ? "\ngenerated pages are up to date"
    : `\nWrote ${written} page(s) to ${OUT_DIR} and ${qaWritten} QA witness file(s) to ${QA_ASSET_DIR}`,
);
}
