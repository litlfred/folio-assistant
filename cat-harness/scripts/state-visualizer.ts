#!/usr/bin/env bun
/**
 * A dashboard per declared STATE graph, at the path this instance uses for it.
 *
 * @module scripts/state-visualizer
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
 * provide visualisers accessible at `<base-url>/beans`"* — and it is the same
 * address `gen-schema-viz.ts` publishes at, so the two agree by construction
 * rather than by coincidence. An earlier draft put the page one segment
 * deeper, which left `<base>/beans` a 404: the obligation names that URL, so
 * a page beside it does not meet it.
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
 *    is `<base>/<graph>/` — ruling 2 with ruling 3 applied, and the same
 *    address `gen-schema-viz.ts` publishes at.
 *
 * ## The segment is the declared entry's `id`, and NOT its basename
 *
 * `gen-schema-viz.ts` takes `basename(declaredDirectory)`, which is right for
 * `schemas/` and `library/` and would be wrong here. Measured on this
 * instance's declaration: `qa` is `test/results/` and `health` is
 * `test/health/results/`, so **both basename to `results`** and one dashboard
 * would silently overwrite the other. All 32 declared ids are unique, because
 * the id is the thing `harness.json` declares and the thing an override
 * matches on.
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
 * instance's site dir, gated on exact content, which is what
 * `schema:viz:check` and `library:viz:check` do. A reviewer can then see the
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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import {
  graphKindsOfLayer,
  instanceRootFor,
  isStateGraph,
  readDeclaration,
  siteDirFor,
  type CatHarnessDeclaration,
} from "../schemas/cat-harness.js";
// REQUIRED: `folio` is registered by core on import and this instance declares
// a folio graph, so `readDeclaration` throws on a valid declaration without it.
// The same line `print-stub.ts` carries, for the same reason.
import "../schemas/folio-graph-kind.js";

const ROOT = instanceRootFor(import.meta.dir);
const SITE = join(ROOT, siteDirFor(ROOT));

const check = process.argv.slice(2).includes("--check");

/** The renderer and its styles, read from the files the docs site also serves. */
const WORK_PLAN_JS = readFileSync(join(SITE, "assets", "js", "work-plan.js"), "utf-8");
const WORK_PLAN_CSS = readFileSync(join(SITE, "assets", "css", "work-plan.css"), "utf-8");

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
 * `live` graphs have a published projection; `declared` ones are in the
 * declaration with nothing able to read them yet. The value a reader might
 * expect third — "not declared" — is absent on purpose: an undeclared graph
 * does not reach this generator, and inventing a row for it would be this
 * page asserting something the declaration does not say.
 */
type GraphState = "live" | "declared";

interface StateGraph {
  /** The declared entry's id — the URL segment. See the module note. */
  id: string;
  /** Its path, relative to the instance root, as declared. */
  path: string;
  /** The graph kinds in it that are `state`. */
  kinds: string[];
  state: GraphState;
  description: string;
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
 * The state graphs this instance declares.
 *
 * Its OWN declaration, not a dependency's: a dependency's directory must not
 * name the URL this instance publishes at, which is the same trap
 * `gen-schema-viz.ts` documents on `schemaRoots`.
 */
function stateGraphsOf(decl: CatHarnessDeclaration): StateGraph[] {
  const out: StateGraph[] = [];
  for (const d of decl.directories ?? []) {
    const kinds = (d.graphs ?? []).filter((g) => STATE_KINDS.has(g) && isStateGraph(g));
    if (kinds.length === 0) continue;
    out.push({
      id: d.id,
      path: d.path,
      kinds,
      state: projectionFor(d.id) === null ? "declared" : "live",
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
  Generated by scripts/state-visualizer.ts. Do not hand-edit: the next run
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
    <p>${esc(g.description || g.path)}</p>
  </li>`;
  }).join("\n");
  return `<h2 class="sv-h2">State graphs this harness declares</h2>
<ul class="sv-list">
${rows}
</ul>`;
}

/** `<base>/<graph>/` — the visualiser for one declared state graph. */
function dashboardPage(g: StateGraph, graphs: StateGraph[]): string {
  const head =
    `<h1>${esc(g.id)}</h1>` +
    `<p class="sv-sub">${esc(g.path)} · ${esc(g.kinds.join(", "))}</p>`;

  if (g.state === "declared") {
    // No projection, so no dashboard — and the page says which of the two it
    // is rather than rendering zeros for a graph nothing read.
    return page({
      title: `${g.id} — state`,
      metas: [],
      body:
        head +
        `<p class="sv-sub">This graph is <strong>declared</strong> and nothing publishes a ` +
        `projection for it yet, so there is nothing to draw. That is bean <code>2krx</code>: ` +
        `a declared subgraph with no visualiser is unreachable, and 19 of this instance's 22 ` +
        `were in that state when this was written. The directory is <code>${esc(g.path)}</code>.</p>` +
        registry(graphs, g.id),
    });
  }

  // ONE graph per page, so one meta: the renderer tells an absent meta from a
  // failed fetch, and a second meta here would quietly make this the combined
  // view under a single graph's name.
  //
  // `../../assets/<id>/index.json` — the projection `gen-docs-pages.ts`
  // already publishes, read relative to this page rather than composed.
  const src = `../assets/${esc(g.id)}/index.json`;
  const metas = [
    g.id === "beans"
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
      `not rendered. Rename the directory's id in harness.json.`,
  );
}
const graphs = all.filter((g) => !taken.includes(g));

for (const g of graphs) {
  emit(join(SITE, g.id, "index.html"), dashboardPage(g, graphs));
}

if (check) {
  if (stale > 0 || taken.length > 0) {
    console.error(`\n${stale} dashboard(s) stale or missing — run \`bun run state:visualizer\`.`);
    process.exit(1);
  }
  console.log(`state visualiser: ${graphs.length} dashboard(s) up to date`);
} else {
  console.log(`\nWrote ${wrote} dashboard(s) under ${relative(ROOT, SITE)}/`);
  if (taken.length > 0) process.exit(1);
}
