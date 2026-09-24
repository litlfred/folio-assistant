#!/usr/bin/env bun
/**
 * A dashboard per declared STATE graph, at the path this instance uses for it.
 *
 * @module scripts/state-visualizer
 * @covers none — it RENDERS every declared state graph rather than judging one; a stale
 *   dashboard is a currency finding about the render, not a verdict on the graph
 *
 * Owner, 2026-09-20, settling the route after two earlier attempts:
 *
 * > i think policy in `<base-url>/<cat-harness-path-to-kind>/dashboard`
 *
 * and, settling it:
 *
 * > beans/ todos/ fsh-guts/ etc are all directories installed by a harness
 * > kind. a requirement of them is to provide visualisers accessible at
 * > `<base-url>/beans` `<base-url>/todos/` etc.
 *
 * ## The route, and it is a POLICY rather than this generator's choice
 *
 * ```
 * <base>/<graph>/          the visualiser for one declared state graph
 * <base>/assets/<graph>/index.json   its data, published by gen-docs-pages.ts
 * ```
 *
 * **At the directory's own URL, with no `/dashboard` beneath it.** That is the
 * obligation `harness-requirements` states — *"a requirement of them is to
 * provide visualisers accessible at `<base-url>/beans`"*. An earlier draft put
 * the page one segment deeper, which left `<base>/beans` a 404: the obligation
 * names that URL, so a page beside it does not meet it.
 *
 * Bean `o7eq` carries the owner's three rulings on the published URL space,
 * and all three bind here:
 *
 * 1. **The segment is the instance's `name`, never its `stub`.** Two earlier
 *    drafts of this file published under `artefactStub(decl)` —
 *    `folio-assistant` — which is the name of the published GRAPH DOCUMENT,
 *    not of the instance. #477 recorded that split deliberately.
 * 2. **The declared graph IS a path segment**, not elided, because an instance
 *    may declare more than one renderable graph and they would otherwise
 *    collide on one URL.
 * 3. **The root instance elides its own name**, because its `docs/` is
 *    installed by cat-harness rather than its own (bean `n0nf`). This
 *    instance's site dir IS the published root, so `<site>/<graph>/` already
 *    is `<base>/<graph>/` — ruling 2 with ruling 3 applied.
 *
 * ## The segment is the declared entry's `id` — and that is a SECOND rule
 *
 * This generator takes the declared entry's `id`. `gen-schema-viz.ts` and
 * `gen-library-viz.ts` take `viewerPlacement(site, dirPath, kind)`, which is
 * the handled directory's **repo-relative path**. Two rules, deliberately,
 * and this comment said otherwise until 2026-09-20.
 *
 * **Where they agree and where they do not.** Measured on this instance's
 * declaration, over the seven declared state graphs:
 *
 * | id | declared path | here, `<base>/<id>/` | `viewerPlacement` |
 * |---|---|---|---|
 * | `beans`, `todos`, `interaction`, `issue-marks`, `workflows` | at the root | same | same |
 * | `qa` | `test/results/` | `<base>/qa/` | `<base>/test/results/` |
 * | `health` | `test/health/results/` | `<base>/health/` | `<base>/test/health/results/` |
 *
 * Five of seven agree, because a graph declared at the repository root has a
 * path equal to its id. The two that diverge are the nested ones, and they are
 * the reason this generator does not share the sibling's resolver: a public
 * dashboard addressed `<base>/test/results/` names a TEST directory, and `id`
 * is what `harness.json` declares and what an override matches on, so an
 * id-derived URL survives a directory moving.
 *
 * **What this comment claimed before, and why it was wrong.** It said
 * `gen-schema-viz.ts` takes `basename(declaredDirectory)`, and that both
 * generators therefore "agree by construction". The basename reading was true
 * when written and stopped being true at #598, which replaced it with
 * `viewerPlacement` — `gen-schema-viz.ts` now contains no `basename(…)` call
 * at all. The collision that argument rested on (`test/results/` and
 * `test/health/results/` both basenaming to `results`) cannot occur under the
 * rule that replaced it, since those are distinct paths.
 *
 * So the *conclusion* stands on its own reasons above, and the *premise* was
 * stale. Both are stated here rather than one, because a reader who checks the
 * premise and finds it false has no way to tell which half to keep.
 * All 32 declared ids are unique.
 *
 * Read from the declaration either way — never written down here. That is what
 * `check:declared-paths` exists to catch, and it caught the literal in an
 * earlier draft of this file.
 *
 * ## Committed, not written into `_site`
 *
 * The first two drafts generated into `_site` at build time and argued that a
 * `--check` was therefore impossible. Both the argument and the premise were
 * wrong: the house pattern for a visualiser here is a COMMITTED page under the
 * instance's site dir, gated on exact content — the pattern
 * `schema:viz:check` and `library:viz:check` established. Note those two are
 * no longer IN the gate set (#598 removed them: their projections derive from
 * the whole repository, so a red meant a sibling merged). `state:visualizer:check`
 * is, so of the three it is now the only one a gate run actually executes. A reviewer can then see the
 * page in the diff, and the gate fires when somebody changes the generator and
 * does not regenerate.
 *
 * ## It reuses the projection; it does not publish a second one
 *
 * `gen-docs-pages.ts` already writes `<site>/assets/beans/index.json` and
 * `<site>/assets/todos/index.json`. This reads those. Writing its own copy
 * would be two answers to "what does the work plan hold", free to disagree
 * while both look right.
 *
 * ## No CDN, no framework, no build step
 *
 * `kg-viewer.ts` states the rule: a view of this repository's own data must be
 * reviewable offline and must not add a third party to its own trust boundary.
 * The renderer and its stylesheet are INLINED from
 * `docs/assets/{js,css}/work-plan.*`, the same bytes the docs site serves, so
 * the two surfaces cannot drift.
 *
 * It does NOT open from `file://` — the code is inlined but the data is
 * fetched, and Chromium blocks that as cross-origin. Measured, not assumed.
 * Over any HTTP root, including a staging preview under `STAGING/<slug>/`, it
 * works with no configuration, because every path is relative to the page.
 *
 * Usage:
 *   bun run state:visualizer
 *   bun run state:visualizer -- --check    # fail if a page is stale or missing
 *
 * Exit: 0 written or up to date, 1 stale under `--check`.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";

import {
  graphKindsOfLayer,
  instanceRootFor,
  isStateGraph,
  readDeclaration,
  repoRootFor,
  siteDirFor,
  type CatHarnessDeclaration,
  visualisationsOf,
} from "../schemas/cat-harness.js";
import { QA_GRAPH_INDEX_SCHEMA } from "../content/pipeline/qa-graph-index.ts";
import { unportableSegment } from "../schemas/portable-path";
import { carriesMarker, orphanSubjectPages } from "./orphan-pages.ts";

const ROOT = instanceRootFor(import.meta.dir);
const SITE = join(ROOT, siteDirFor(ROOT));
/**
 * `coverage.*` is REPO-root relative, while a directory's `path` is relative
 * to the INSTANCE. Measured across both declarations 2026-09-20: of 27
 * coverage paths, 25 resolve only from the repo root, 2 from both (the root
 * declaration's own, where the two roots coincide) and **none** from the
 * instance root alone. Resolving these against `ROOT` would therefore mark
 * every one of them missing — which is the failure this whole change exists
 * to prevent, one level down.
 */
const REPO_ROOT = repoRootFor(ROOT);

const check = process.argv.slice(2).includes("--check");

/** The renderer and its styles, read from the files the docs site also serves. */
const WORK_PLAN_JS = readFileSync(join(SITE, "assets", "js", "work-plan.js"), "utf-8");
const WORK_PLAN_CSS = readFileSync(join(SITE, "assets", "css", "work-plan.css"), "utf-8");

/**
 * The projection tags this generator knows how to render.
 *
 * Named constants rather than literals at the branch, because the branch is a
 * DISPATCH and a dispatch on an inline literal is one typo from silently
 * falling through to a default — which is precisely the defect these replaced:
 * every projection that was not beans got the todo renderer, by default rather
 * than by decision.
 */
const BEAN_INDEX_SCHEMA = "folio-bean-index/v1";
const TODO_INDEX_SCHEMA = "folio-todo-index/v1";

/** Every graph kind whose `holds` is `state`, asked of the registry. */
const STATE_KINDS = new Set(graphKindsOfLayer("state"));

/**
 * Declared ids this generator will not publish under.
 *
 * `assets` is where every projection and stylesheet lives, and a leading
 * underscore is Jekyll's own namespace (`_data`, `_includes`, `_layouts`).
 * Writing a dashboard into either would put a page inside machinery that is
 * not expecting one. Refused loudly: a route collision is a DECLARATION
 * problem, and guessing which of the two the reader meant is not this
 * generator's call.
 */
const RESERVED_IDS = new Set(["assets"]);

/**
 * What a graph's dashboard can show.
 *
 * Four states, because there are four facts and the first version of this
 * file collapsed two of them.
 *
 * | state | projection here | declaration names a visualiser |
 * |---|---|---|
 * | `live` | yes | — |
 * | `elsewhere` | no | yes, and it is there |
 * | `declared` | no | no |
 * | `unresolved` | no | yes, and it is NOT there |
 *
 * `elsewhere` is the one that was missing. `projectionFor` asks *"is there a
 * projection at MY path?"*, and the answer `no` was rendered as *"nothing
 * renders this graph"*. Those are different questions, and `uploads` is where
 * they diverge: its queue block is published inside `assets/library/index.json`
 * — one dataset with `library/`, since two projections over it would be two
 * answers to "how many are queued" — so this generator found nothing and said
 * so about a graph that has a working badge. Bean `flh4`, issue #618.
 *
 * `unresolved` exists so that fixing the above cannot introduce its own
 * defect: a declaration naming a page somebody has since deleted would
 * otherwise read as `elsewhere` and link to a 404. No entry is in this state
 * today — 27 of 27 coverage paths resolve — so it is falsified in the tests
 * synthetically rather than against the corpus.
 *
 * The value a reader might expect fifth — "not declared" — is absent on
 * purpose: an undeclared graph does not reach this generator, and inventing a
 * row for it would be this page asserting something the declaration does not
 * say.
 */
type GraphState = "live" | "elsewhere" | "declared" | "unresolved";

interface StateGraph {
  /** The declared entry's id — the URL segment. See the module note. */
  id: string;
  /** Its path, relative to the instance root, as declared. */
  path: string;
  /** The graph kinds in it that are `state`. */
  kinds: string[];
  state: GraphState;
  description: string;
  /**
   * `coverage.visualiser` exactly as declared, repo-root relative. Carried on
   * `elsewhere` and `unresolved` so each page can NAME what it is pointing at
   * (or failing to), rather than reporting a state with no subject.
   */
  declaredVisualiser?: string;
  /**
   * A link from this graph's own page to that visualiser — set only when the
   * target is a published page under this site. A declared visualiser that
   * exists OUTSIDE the site is real but has no URL, so it is named without
   * being linked; fabricating an href for it would publish a dead control.
   */
  href?: string;
}

/**
 * A declared description, as HTML: escaped, with its backticked spans as code.
 *
 * ORDER IS THE WHOLE FIX. Escape first, so a `<` already in the description
 * becomes an entity, and only THEN turn the surviving backtick pairs into
 * `<code>`. The angle brackets this function emits are the only raw ones, so
 * a description cannot inject markup through either path. Reversed, the
 * corpus would do it to us unaided: `library` is declared as
 * "one `<bib-slug>/` per ingested document".
 *
 * Not a markdown parser, deliberately — only the one span type that appears
 * in this field. Measured 2026-09-20: 12 of 34 declared descriptions carry a
 * backtick in the first sentence, which is the part the registry shows, so a
 * third of the rows on every state dashboard were rendering them literally.
 * An UNPAIRED backtick is left as a backtick rather than swallowing the rest
 * of the line, which is what a greedy match would do.
 */
export function describe(text: string): string {
  return esc(text).replace(/`([^`]+)`/g, "<code>$1</code>");
}

/** HTML-escape. Every interpolation below goes through it. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Whether a graph's projection is actually published.
 *
 * ASKED OF THE DISK rather than listed here. `gen-docs-pages.ts` publishes
 * `beans` and `todos` today; naming those two as a literal would mean a third
 * projection appearing and this generator still calling its graph unrendered —
 * the stale-gap-notice failure `AGENTS.md` describes, where an agent that
 * believes the notice either avoids the feature or rebuilds it.
 */
function projectionFor(id: string): string | null {
  const p = join(SITE, "assets", id, "index.json");
  return existsSync(p) ? p : null;
}

/**
 * What the DECLARATION says renders this graph, resolved against the disk.
 *
 * The declaration is the authority on this, not a scan: a page that renders a
 * graph is not detectable by looking at it, and asking the filesystem "does
 * anything read `uploads`?" has no answer. So the question asked here is the
 * narrow one the declaration can actually answer — `coverage.visualiser` —
 * and the three outcomes are kept apart rather than reduced to a boolean.
 *
 * Takes its roots as an argument so the four outcomes can be exercised
 * against fixtures. `unresolved` fires on nothing in this corpus, so without
 * that it would be a branch no test could reach — and a branch no test can
 * reach is a branch that is wrong the first time it matters.
 *
 * @param id     the declared entry's id, which is also its page's URL segment
 * @param cov    `coverage.visualiser` as declared, or undefined
 * @param roots  the published site and the repo root; defaults to this
 *               instance's, which is what the generator itself passes
 * @returns the state this graph is in once `projectionFor` has said `null`,
 *          with the declared path and an href where one is publishable
 */
export function declaredVisualiserFor(
  id: string,
  cov: string | undefined,
  roots: { site: string; repoRoot: string } = { site: SITE, repoRoot: REPO_ROOT },
): Pick<StateGraph, "state" | "declaredVisualiser" | "href"> {
  const { site: SITE, repoRoot: REPO_ROOT } = roots;
  if (!cov) return { state: "declared" };
  // REPO-root relative — see `REPO_ROOT`. This is the line that would silently
  // report all 27 as missing if it used `ROOT`.
  const target = join(REPO_ROOT, cov);
  if (!existsSync(target)) return { state: "unresolved", declaredVisualiser: cov };
  // Linkable only if the target is published BY THIS SITE. Asked of the site
  // directly rather than by inspecting the relative path for leading `..`,
  // which answers the same question by a proxy that a sibling directory named
  // `docs-old` would break.
  const inSite = !relative(SITE, target).startsWith("..");
  return {
    state: "elsewhere",
    declaredVisualiser: cov,
    ...(inSite ? { href: relative(join(SITE, id), target) } : {}),
  };
}

/**
 * The state graphs this instance declares.
 *
 * Its OWN declaration, not a dependency's: a dependency's directory must not
 * name the URL this instance publishes at, which is the same trap
 * `gen-schema-viz.ts` documents on `schemaRoots`.
 */
function stateGraphsOf(decl: CatHarnessDeclaration): StateGraph[] {
  const out: StateGraph[] = [];
  for (const d of decl.directories ?? []) {
    const kinds = (d.graphKinds ?? []).filter((g) => STATE_KINDS.has(g) && isStateGraph(g));
    if (kinds.length === 0) continue;
    out.push({
      id: d.id,
      path: d.path,
      kinds,
      ...(projectionFor(d.id) === null
        ? // THE FIRST declared visualisation, and the choice is deliberate: this
          // page reports ONE state per directory, so it answers about the
          // primary one. A directory declaring several is not misreported by
          // that — `harness-tiles.ts` checks every ref and is where a broken
          // second viewer surfaces. Passing the whole list here would need a
          // state per visualisation, which is a different page.
          declaredVisualiserFor(d.id, visualisationsOf(d.coverage, d.id)[0]?.ref)
        : { state: "live" as const }),
      // The declaration's own words, clipped to its first sentence. Restating
      // what a directory is for, here, would be a second description free to
      // contradict the first.
      description: (d.description ?? "").split(/(?<=\.)\s/)[0]?.slice(0, 260) ?? "",
    });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

let stale = 0;
let wrote = 0;

/**
 * The sentence every page this generator writes carries, and the ONLY thing
 * that makes one of them identifiable as ours.
 *
 * It has one home because `prunableDashboards` matches on it. Two copies
 * would let a page drift out of the set that owns it while still looking
 * generated, and the pruner would then walk past an orphan it minted.
 */
export const GENERATED_BY =
  "Generated by scripts/state-visualizer.ts. Do not hand-edit";

/**
 * Dashboard pages under this site that no declared state graph asks for.
 *
 * **Narrow on purpose, and the narrowness is the whole safety argument.**
 * `SITE` is the documentation site: it holds `guides/`, `reference/`,
 * `assets/`, `api/`, the translated trees and more, none of which this
 * generator wrote. A directory is a candidate only when it holds an
 * `index.html` carrying {@link GENERATED_BY} — the sentence this tool itself
 * writes. Anything else is left alone, whatever its name.
 *
 * That is `deletion-requires-confirmation` applied rather than bypassed: an
 * agent never removes a durable artefact it did not create, so ownership has
 * to be CHECKABLE — read out of the file — and never inferred from which
 * directory something sits in. The precedent is `prunableStickies` in
 * `ensure-landing-sticky.ts`, and this reuses its shape rather than minting
 * a third.
 *
 * Why it is needed at all: a generator that writes and never deletes leaves a
 * page serving a subject the declaration no longer describes, at a URL nothing
 * links to. `--check` cannot see it, because it inspects only the files it is
 * about to write — so it can find a page that is WRONG but never one that
 * SHOULD NOT EXIST. Bean `ankg`, found live when #604's rename left
 * `folio-assist-sci/index.html` behind.
 *
 * @param site      the published site directory
 * @param wantedIds the graph ids this run is about to write
 * @returns the orphans' paths relative to `site`, sorted
 */
export function prunableDashboards(site: string, wantedIds: readonly string[]): string[] {
  // A CALL SITE NOW, not a fourth implementation (bean `s8nu`). The unit is
  // the same one `orphanSubjectPages` walks -- a directory holding an
  // `index.html` -- and only the ownership TEST differs, which is why that is
  // what the shared selector takes.
  //
  // The marker is the right test HERE and the weaker of the two: dashboards
  // publish at the site root among directories nothing here owns, and their
  // identity is the graph id rather than the path, so there is no self-naming
  // for a page to do. `declaresItsOwnDirectory` would claim none of them.
  //
  // `foreign` is deliberately not returned. This function's contract is the
  // prunable set, and its callers act on that; the directories declined are
  // reported by the caller that wants them. Keeping the signature means the
  // three tests below still falsify the same things.
  const { owned } = orphanSubjectPages(site, wantedIds, carriesMarker(GENERATED_BY));
  return owned.map((dir) => join(dir, "index.html")).sort();
}

/** One generated file, with the `--check` contract every generator here uses. */
function emit(path: string, content: string): void {
  const rel = relative(ROOT, path);
  if (check) {
    if (!existsSync(path)) {
      console.error(`  ✗ ${rel} is missing`);
      stale++;
    } else if (readFileSync(path, "utf-8") !== content) {
      console.error(`  ✗ ${rel} is stale`);
      stale++;
    }
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  wrote++;
  console.log(`  ✓ ${rel}`);
}

/**
 * The page shell.
 *
 * It takes no base URL and composes none. The data path is written by the
 * caller, relative to where that page sits, so the depth is expressed once at
 * the only place that knows it.
 */
function page(opts: { title: string; metas: string[]; body: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(opts.title)}</title>
<!--
  ${GENERATED_BY}: the next run
  overwrites it, \`state:visualizer:check\` fails on the difference, and a
  hand-edit here is a change nothing else in the tree knows about.
-->
${opts.metas.join("\n")}
<style>
/* The page ground. The dashboard paints its own panel surface — see
   work-plan.css — so these two are the only colours this shell decides. */
:root { --sv-bg: #0d0d0d; --sv-ink: #ffffff; --sv-ink-2: #c3c2b7; }
:root[data-fa-scheme="light"] { --sv-bg: #f9f9f7; --sv-ink: #0b0b0b; --sv-ink-2: #52514e; }
body {
  margin: 0; padding: 1.5rem clamp(1rem, 4vw, 3rem) 4rem;
  background: var(--sv-bg); color: var(--sv-ink);
  font: 16px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif;
}
main { max-width: 68rem; margin: 0 auto; }
h1 { font-size: 1.5rem; margin: 0 0 0.25rem; }
.sv-sub { color: var(--sv-ink-2); margin: 0 0 1.5rem; font-size: 0.9rem; }
/* Links carry their identity by UNDERLINE and keep text ink. A coloured link
   on this ground would be a fifth hue to validate for no gain, and underline
   survives forced-colors and greyscale print, which a hue does not. */
a { color: inherit; text-decoration: underline; text-underline-offset: 0.15em; }
a:hover { text-decoration-thickness: 2px; }
.sv-h2 { font-size: 0.8rem; font-weight: 600; letter-spacing: 0.02em;
  text-transform: uppercase; color: var(--sv-ink-2); margin: 2rem 0 0.7rem; }
.sv-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.6rem; }
.sv-item {
  border: 1px solid rgba(255,255,255,0.10); border-radius: 8px;
  padding: 0.8rem 1rem;
}
:root[data-fa-scheme="light"] .sv-item { border-color: rgba(11,11,11,0.10); }
.sv-item.is-here { border-color: currentColor; }
.sv-item h2 { font-size: 1rem; margin: 0 0 0.2rem; }
.sv-item p { margin: 0; color: var(--sv-ink-2); font-size: 0.85rem; }
/* The page you are already on is not a link. A link to here is a control that
   does nothing, and a reader who clicks it learns only that it did nothing. */
.sv-here { font-weight: 600; }
.sv-tag {
  font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.03em;
  font-weight: 600; margin-left: 0.5rem;
}
/* A state, not a warning: "declared, nothing renders it yet" is an honest
   answer about the graph, and painting it amber would rank it as a fault. */
.sv-tag.is-declared { color: #898781; }
.sv-tag.is-live { color: #0ca30c; }
/* Rendered, just not by this generator — so it ranks with live rather than
   with the greyed-out declared, and is distinguished from it by hue only
   alongside the word itself, never by hue alone. NO BACKTICKS: this block is
   inside a template literal, and one here ends the string. */
.sv-tag.is-elsewhere { color: #3987e5; }
/* The one state that IS a fault: a declaration pointing at a page that is not
   there. The dataviz palette's serious, not its critical — nothing is broken
   for a reader, a claim is unbacked. */
.sv-tag.is-unresolved { color: #ec835a; }
/* A family's bucket counts — a KPI ROW of stat tiles, which is what a handful
   of headline numbers is. They were a stack of full-width cards nested inside
   the family panel, so a label and an integer carried the same visual weight
   as the panel containing them and nine of them filled half the page. Seen by
   screenshotting the page rather than by reading the markup, which is the only
   way this class of defect shows up.

   DELIBERATELY NO COLOUR on a bucket. fail/pass/warn are status words and the
   status palette is right for them in general — but painting fail red here
   would invite exactly the cross-family comparison this page exists to refuse:
   one family has warn and the other has no concept of it, and a shared colour
   language asserts a shared scale. The numbers wear text ink; the family panel
   around them carries the identity.

   Proportional figures, not tabular: these wrap in a row rather than aligning
   in a column, and tabular-nums gives every digit the width of a zero, which
   reads loose at tile size. */
.sv-counts {
  display: flex; flex-wrap: wrap; gap: 0.5rem;
  margin: 0.6rem 0 0; padding: 0; list-style: none;
}
.sv-count {
  border: 1px solid rgba(255,255,255,0.10); border-radius: 6px;
  padding: 0.4rem 0.7rem; min-width: 4.5rem;
}
:root[data-fa-scheme="light"] .sv-count { border-color: rgba(11,11,11,0.10); }
.sv-count-v { display: block; font-size: 1.1rem; font-weight: 600; line-height: 1.25; }
.sv-count-k {
  display: block; font-size: 0.7rem; color: var(--sv-ink-2);
  text-transform: uppercase; letter-spacing: 0.03em;
}
${WORK_PLAN_CSS}
</style>
</head>
<body>
<main>
${opts.body}
</main>
<script>
${WORK_PLAN_JS}
</script>
</body>
</html>
`;
}

/**
 * The sibling dashboards, listed on every page.
 *
 * There is no cross-kind index, because the policy gives a path per kind and
 * none above them — `<base>/` is the documentation site's. So each dashboard
 * carries the way across instead, which is what makes them *registered*
 * sub-visualisations rather than six unrelated pages.
 */
function registry(graphs: StateGraph[], current: string): string {
  const rows = graphs.map((g) => {
    const here = g.id === current;
    const name = here
      ? `<span class="sv-here">${esc(g.id)}</span>`
      : `<a href="../${esc(g.id)}/">${esc(g.id)}</a>`;
    return `  <li class="sv-item${here ? " is-here" : ""}">
    <h2>${name}<span class="sv-tag is-${g.state}">${g.state}</span></h2>
    <p>${g.description ? describe(g.description) : esc(g.path)}</p>
  </li>`;
  }).join("\n");
  return `<h2 class="sv-h2">State graphs this harness declares</h2>
<ul class="sv-list">
${rows}
</ul>`;
}

/**
 * A page-relative href, as the site-absolute URL a reader sees.
 *
 * `../cat-harness/library/…` from `<base>/uploads/` is `/cat-harness/library/…`
 * — resolved rather than string-trimmed, so it stays correct if a dashboard
 * ever sits at a depth other than one.
 */
function siteUrlOf(href: string, fromId: string): string {
  const abs = relative(SITE, join(SITE, fromId, href));
  return `/${abs.split(sep).join("/")}`;
}

/**
 * What a page says when this generator has no projection to draw.
 *
 * Three different sentences for three different facts. The `declared` one is
 * unchanged and still correct for `qa`, `health` and `issue-marks`, which
 * declare no visualiser; the other two exist because `uploads` does, and was
 * being told it did not.
 */
function notDrawnHere(g: StateGraph): string {
  if (g.state === "elsewhere") {
    // Linked as a DIRECTORY and labelled with the URL a reader would see in
    // the address bar — the same shape as the registry's own links. The
    // declared value is a repo path, which is the right thing to resolve
    // against the disk and the wrong thing to show somebody in a browser.
    const dir = (h: string) => h.replace(/(^|\/)index\.html$/, "$1");
    const where = g.href
      ? `<a href="${esc(dir(g.href))}">${esc(dir(siteUrlOf(g.href, g.id)))}</a>`
      : `<code>${esc(g.declaredVisualiser ?? "")}</code> (not published by this site)`;
    return (
      `<p class="sv-sub">This graph is <strong>rendered elsewhere</strong>. Nothing ` +
      `publishes a projection at this generator's own path, but the declaration names ` +
      `a visualiser for it: ${where}. The directory is <code>${esc(g.path)}</code>.</p>`
    );
  }
  if (g.state === "unresolved") {
    // NOT rendered as either neighbouring state. A declaration pointing at a
    // page that is not there is a defect in the declaration, and calling it
    // "rendered elsewhere" would publish a link to a 404 while calling it
    // "nothing renders it" would hide a claim somebody made.
    return (
      `<p class="sv-sub">This graph's declaration names a visualiser that is ` +
      `<strong>not there</strong>: <code>${esc(g.declaredVisualiser ?? "")}</code>. That is a ` +
      `defect in the declaration, not an answer about the graph — so this page reports it ` +
      `rather than claiming either that the graph is rendered or that nothing renders it. ` +
      `The directory is <code>${esc(g.path)}</code>.</p>`
    );
  }
  return (
    `<p class="sv-sub">This graph is <strong>declared</strong> and nothing publishes a ` +
    `projection for it yet, so there is nothing to draw. That is bean <code>2krx</code>: ` +
    `a declared subgraph with no visualiser is unreachable, and 19 of this instance's 22 ` +
    `were in that state when this was written. The directory is <code>${esc(g.path)}</code>.</p>`
  );
}

/** `<base>/<graph>/` — the visualiser for one declared state graph. */
function dashboardPage(g: StateGraph, graphs: StateGraph[]): string {
  const head =
    `<h1>${esc(g.id)}</h1>` +
    `<p class="sv-sub">${esc(g.path)} · ${esc(g.kinds.join(", "))}</p>`;

  if (g.state !== "live") {
    // No projection AT THIS PATH — which is not the same as nothing rendering
    // the graph, and saying so was this generator's defect (bean `flh4`).
    // Each of the three answers is written out separately; none renders zeros
    // for a store nobody read, because a dashboard opening at zero is
    // indistinguishable from a store with nothing in it.
    return page({
      title: `${g.id} — state`,
      metas: [],
      body: head + notDrawnHere(g) + registry(graphs, g.id),
    });
  }

  // `../../assets/<id>/index.json` — the projection `gen-docs-pages.ts`
  // already publishes, read relative to this page rather than composed.
  const src = `../assets/${esc(g.id)}/index.json`;

  // WHICH renderer, asked of the projection's own `$schema` rather than of the
  // graph's id.
  //
  // This was `g.id === "beans" ? beans-meta : todo-meta`, which is a default
  // rather than a choice: EVERY projection that was not beans got the todo
  // renderer. It survived because only two existed. The third — `qa`, bean
  // `py74` — would have mounted the work-plan renderer over a document with no
  // `items` array at all, and the page would have claimed `live` above a
  // container that rendered nothing. A dashboard that says live and shows
  // nothing is worse than one that honestly says `declared`, which is the
  // defect `flh4` already paid for one state over.
  //
  // So the file says what it is, the same contract `directory-conventions`
  // states for every other node here: extension is a coincidence, a
  // declaration inside the file is the contract.
  const tag = projectionSchema(g.id);

  if (tag === QA_GRAPH_INDEX_SCHEMA) {
    // Rendered SERVER-SIDE, not fetched. The data is known at generate time,
    // a family table has no interaction to speak of, and a static table needs
    // no JavaScript — which is the accessibility floor every page here is held
    // to rather than a nicety.
    return page({
      title: `${g.id} — state`,
      metas: [],
      body: head + qaPanels(g.id, src) + registry(graphs, g.id),
    });
  }

  if (tag !== BEAN_INDEX_SCHEMA && tag !== TODO_INDEX_SCHEMA) {
    // A projection this generator cannot render. NOT rendered as `declared` —
    // the file is there, which is a different fact from nobody having
    // published one — and not guessed at either.
    return page({
      title: `${g.id} — state`,
      metas: [],
      body:
        head +
        `<p>A projection is published at <a href="${src}">${esc(src)}</a>, and this ` +
        `generator has no renderer for <code>${esc(tag ?? "a document with no $schema")}</code>. ` +
        `That is a gap in this page, not a gap in the graph.</p>` +
        registry(graphs, g.id),
    });
  }

  // ONE graph per page, so one meta: the renderer tells an absent meta from a
  // failed fetch, and a second meta here would quietly make this the combined
  // view under a single graph's name.
  const metas = [
    tag === BEAN_INDEX_SCHEMA
      ? `<meta name="fa-beans-src" content="${src}">`
      : `<meta name="fa-todo-src" content="${src}">`,
  ];
  return page({
    title: `${g.id} — state`,
    metas,
    body: head + `<div class="fa-workplan" data-fa-workplan>
  <p class="fa-workplan-fallback">This view needs JavaScript. The data is
  <a href="${src}">a plain JSON file</a>.</p>
</div>` + registry(graphs, g.id),
  });
}

/** The `$schema` a graph's published projection declares, or null. */
export function projectionSchema(id: string): string | null {
  const p = projectionFor(id);
  if (p === null) return null;
  try {
    const doc: unknown = JSON.parse(readFileSync(p, "utf8"));
    if (doc === null || typeof doc !== "object") return null;
    const tag = (doc as Record<string, unknown>)["$schema"];
    return typeof tag === "string" && tag.length > 0 ? tag : null;
  } catch {
    return null;
  }
}

/**
 * The `qa` graph's panels — **one per family, and no total across them.**
 *
 * The owner's ruling of 2026-09-21 on bean `py74`. The absence of a headline
 * is the point rather than an omission, so the page SAYS it is absent and why;
 * a reader who finds no total and is told nothing will reasonably assume the
 * page is unfinished and go looking for one.
 *
 * Each family's buckets are printed in that family's OWN spelling — `n/a` in
 * one and `na` in another stay two columns, because merging them is exactly
 * the decision that was declined.
 */
export function qaPanels(id: string, src: string): string {
  const p = projectionFor(id);
  if (p === null) return "";
  let ix: {
    files?: number;
    families?: Array<{ schema: string; files: number; rollUpField: string | null; buckets?: Record<string, number> }>;
    unclassified?: number;
    unreadable?: number;
  };
  try {
    ix = JSON.parse(readFileSync(p, "utf8")) as typeof ix;
  } catch {
    return `<p>The projection at <a href="${src}">${esc(src)}</a> could not be read.</p>`;
  }
  const families = ix.families ?? [];
  const panels = families
    .map((f) => {
      const buckets = f.buckets ?? {};
      const keys = Object.keys(buckets).sort();
      const body =
        f.rollUpField === null
          ? `<p>Declares no roll-up field, so this family has no counts to show. ` +
            `That is a property of the schema, not a count of zero.</p>`
          : `<p>Rolled up from <code>${esc(f.rollUpField)}</code>.</p>` +
            `<ul class="sv-counts">` +
            keys
              .map(
                (k) =>
                  `<li class="sv-count">` +
                  `<span class="sv-count-v">${buckets[k]}</span>` +
                  `<span class="sv-count-k">${esc(k)}</span>` +
                  `</li>`,
              )
              .join("") +
            `</ul>`;
      return `<section class="sv-item">
    <h2><code>${esc(f.schema)}</code><span class="sv-tag">${f.files} file${f.files === 1 ? "" : "s"}</span></h2>
    ${body}
  </section>`;
    })
    .join("\n");

  // BOTH third states printed every run, including at zero. A count that
  // appears only when non-zero cannot be told from one nobody measured.
  const thirdStates =
    `<p class="sv-sub">${ix.unclassified ?? 0} document(s) carry no <code>$schema</code> ` +
    `(could not determine); ${ix.unreadable ?? 0} would not parse.</p>`;

  return (
    `<h2 class="sv-h2">Families — ${families.length}, over ${ix.files ?? 0} document(s)</h2>` +
    `<p class="sv-sub">There is deliberately <strong>no total across these families</strong>. ` +
    `The two largest that roll up disagree on the container (<code>totals</code> against ` +
    `<code>counts</code>), on the spelling of not-applicable (<code>n/a</code> against ` +
    `<code>na</code>) and on whether <code>warn</code> exists at all; the third declares no ` +
    `roll-up. A single number over them would be three silent decisions.</p>` +
    panels +
    thirdStates +
    `<p class="sv-sub">The data is <a href="${src}">a plain JSON file</a>.</p>`
  );
}

if (import.meta.main) main();

/**
 * Generate every dashboard, or check them.
 *
 * Behind `import.meta.main` — the house pattern here, and 97 of 135 scripts
 * already use it — so that a test can import the pure resolver above without
 * this writing into the real site directory as a side effect of the import.
 */
function main(): void {
const decl = readDeclaration(ROOT);
if (!decl) {
  // "Could not determine", and this generator does not get to decide it means
  // "no state". Exit 2 is never rendered as a pass, the same rule
  // `check-harness-dirs.ts` and `check-ci-health.ts` follow.
  console.error(`state-visualizer: no readable declaration at ${ROOT}`);
  console.error("This is NOT a pass. Treat it as unknown.");
  process.exit(2);
}

const all = stateGraphsOf(decl);
const taken = all.filter((g) => RESERVED_IDS.has(g.id) || g.id.startsWith("_"));
for (const g of taken) {
  console.error(
    `  ! declared directory \`${g.id}\` collides with a route this site already uses — ` +
      `not rendered. Rename the directory's id in the declaration.`,
  );
}
// REFUSED, not encoded — and the difference is the point.
//
// Everywhere else an id names a private artefact, `portableSegment` encodes it
// and the caller never sees the spelling. Here the id is also the site's URL
// ROUTE, so encoding it would quietly publish `/req%3Ax/` and the declaration
// would no longer say where the page is. A declaration that cannot be rendered
// on a filesystem the site is built on is a defect in the declaration, and the
// remedy is the one this generator already gives for a colliding id: rename it.
//
// Same shape as `portable-path.ts`'s device names — encoding does not rescue
// every id, and saying so beats mangling one.
const unportable = all.filter((g) => !taken.includes(g) && unportableSegment(g.id));
for (const g of unportable) {
  console.error(
    `  ! declared directory \`${g.id}\` cannot be a directory or a route on every platform ` +
      `(${unportableSegment(g.id)}) — not rendered. Rename the directory's id in the declaration.`,
  );
}
const graphs = all.filter((g) => !taken.includes(g) && !unportable.includes(g));

for (const g of graphs) {
  emit(join(SITE, g.id, "index.html"), dashboardPage(g, graphs));
}

// Orphans, AFTER the writes so the keep-set is what this run actually wanted.
// Reported by name rather than counted: a deletion nobody is told about is the
// shape `deletion-requires-confirmation` exists to stop, and a bare number
// would not let a reader check the tool picked the right files.
const orphans = prunableDashboards(SITE, graphs.map((g) => g.id));
for (const o of orphans) {
  console.error(`  ${check ? "!" : "-"} orphan dashboard ${check ? "" : "removed "}${o}`);
}

if (check) {
  // Orphans FAIL the check. That is the defect this whole pass fixes: the old
  // `--check` inspected only the files it was about to write, so it reported
  // "up to date" with a page sitting there that answers to no declaration.
  if (stale > 0 || taken.length > 0 || orphans.length > 0) {
    if (stale > 0) {
      console.error(`\n${stale} dashboard(s) stale or missing — run \`bun run state:visualizer\`.`);
    }
    if (orphans.length > 0) {
      console.error(
        `\n${orphans.length} orphan dashboard(s) answer to no declared graph — ` +
          "run `bun run state:visualizer` to remove them.",
      );
    }
    process.exit(1);
  }
  console.log(`state visualiser: ${graphs.length} dashboard(s) up to date, no orphans`);
} else {
  for (const o of orphans) unlinkSync(join(SITE, o));
  console.log(`\nWrote ${wrote} dashboard(s) under ${relative(ROOT, SITE)}/`);
  if (taken.length > 0) process.exit(1);
}
}
