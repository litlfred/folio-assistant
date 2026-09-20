#!/usr/bin/env bun
/**
 * A browsable view of what each instantiated harness's STATE graphs hold.
 *
 * @module scripts/state-visualizer
 *
 * Owner, 2026-09-20:
 *
 * > should be able to browse at `<base-url>/state-visualizer/` or so … for
 * > instantiated harness
 *
 * and, settling the layout:
 *
 * > The state dashboard at `/<stub>/state/dashboard/`, `state/beans/`,
 * > `state/todos/` etc. make clickable. also links to edit (using
 * > tools/github). if linked to issue, pr etc make clickable
 *
 * > actually `<base-url>/<path-to-harness-declaring-functionality>/dashboard`,
 * > `<base-url>/<path-to-harness-declaring-functionality>/beans`, etc… these
 * > are all registered sub visualisations of one (sub)harness
 *
 * and, on where a rendered asset belongs:
 *
 * > rendered assets should be available at toplevel like `<baseURL>/` for main
 * > just-the-docs pipeline, or `<baseurl>/<page>` where is registered rendered
 * > page from a harness that was instantiated and enabled (by default enabled)
 * > relative to their url, so `<baseurl>/<instantiated harness>/<path_to_rendered_content>`
 *
 * ## The route — a registry of sub-visualisations, under the harness that declares it
 *
 * ```
 * <base>/<stub>/            the knowledge-graph viewer  (already there, untouched)
 * <base>/<stub>/dashboard/  the work plan: both live stores, and the registry
 * <base>/<stub>/beans/      one visualisation
 * <base>/<stub>/todos/      another
 * <base>/<stub>/<id>.json   their data
 * ```
 *
 * **There is no `state/` segment**, and its absence is the design rather than
 * a shortening. A visualisation is registered against the harness that
 * DECLARES the functionality, so the harness's own path is the namespace and
 * every visualisation is a sibling under it. Interposing `state/` would have
 * said these are a kind apart, when the knowledge-graph viewer already sitting
 * at `<base>/<stub>/` is a sub-visualisation of exactly the same harness.
 *
 * A page and a data file are siblings without colliding, because one is a
 * directory and the other a file: `beans/` and `beans.json` resolve
 * differently. The real collisions are ids the layout has already spent —
 * see {@link RESERVED_SEGMENTS}.
 *
 * ## The route was already half-built, and this finishes the half
 *
 * `docs-site.yml` publishes `<base>/<stub>.jsonld` as an instance's graph and
 * `<base>/<stub>/index.html` as the viewer that makes it legible. The instance
 * SEGMENT is therefore not new — it is the thing that already "separates one
 * instance's renderings from another's in a tree that overlays several", and
 * that viewer is the first registered sub-visualisation. This registers more
 * beside it rather than adding a second convention.
 *
 * ## Which graphs it shows is DECLARED, never listed here
 *
 * `harness.json` gives every graph kind a `holds` layer — `content`, `context`
 * or `state` — and a state graph is one a running process WRITES as it runs.
 * Five kinds carry it: `beans`, `todos`, `qa`, `health` and `uploads`. This
 * generator asks the registry rather than carrying a list, so a kind added
 * with `holds: "state"` appears here without anybody remembering to come back,
 * and a kind whose layer changes stops appearing for the same reason.
 *
 * That is the point of it being generic: an instantiated harness gets a
 * visualiser over ITS OWN declaration, not over this repository's.
 *
 * ## Declared-with-no-renderer is a STATE, not an omission to hide
 *
 * `beans` and `todos` have readers, so their pages carry live data. `qa`,
 * `health` and `uploads` are declared state graphs with no renderer yet — bean
 * `2krx`, which measured 19 of this instance's 22 declared subgraphs as having
 * no way to look at them. Their pages say exactly that and link the directory.
 * Leaving them off the index would make the visualiser agree with itself while
 * disagreeing with the declaration, which is the failure the whole `2krx`
 * family is about.
 *
 * ## No CDN, no framework, no build step
 *
 * `kg-viewer.ts` states the rule and it holds here: a view of this
 * repository's own data must be reviewable offline and must not add a third
 * party to its own trust boundary. The renderer and its stylesheet are INLINED
 * from `docs/assets/{js,css}/work-plan.*`, the same bytes the docs site
 * serves, so the two surfaces cannot drift.
 *
 * **It does NOT open from `file://`, and that is a browser rule rather than a
 * choice here.** The CODE is inlined, but the DATA is fetched, and Chromium
 * blocks `fetch` from a `file://` origin as cross-origin — measured, not
 * assumed. Over any HTTP root, including a bare `python3 -m http.server`, the
 * page works with no configuration. Inlining the data too would fix that and
 * cost the property below.
 *
 * ## Data is fetched RELATIVE to the page
 *
 * A page at `<base>/<stub>/<id>/` reads `../<id>.json`. Nothing composes a
 * base URL, so the same bytes work at the canonical base, at a staging
 * preview, and under any HTTP root.
 *
 * ## Every identifier on the page is a link, and they are composed HERE
 *
 * A bean id, an epic's bar, an issue or PR number in a finding — each resolves
 * to somewhere on the forge. The repository's web URL is `detectRepoUrl`'s
 * answer and travels in the projection as `repoWeb`, so the renderer builds
 * hrefs from DATA rather than carrying one instance's address in shared client
 * code. That is the rule `editHref` already follows in `gen-docs-pages.ts`.
 *
 * ## It has NO `--check`, and every sibling generator has one
 *
 * `gen-docs-pages.ts`, `gen-landing-data.ts` and the CSS generators all gate
 * on exact content, because each writes a file that is COMMITTED — so "the
 * committed copy disagrees with the source" is a real thing that happens and
 * a reviewer needs told.
 *
 * This one writes into `_site`, a build output that is not committed and does
 * not exist in a fresh checkout. A staleness gate over it could only ever
 * report every file missing, which is a check that fires on all of its
 * subjects — the shape this repository already calls a check that is wrong.
 * `gates.test.ts` caught the `state:visualizer:check` script it was shipped
 * with for exactly that reason: no workflow ran it, and none could have
 * usefully.
 *
 * The gate that does exist is the site build itself, which runs this
 * generator in `docs-site.yml`: a generator that throws turns the publish red,
 * and `tests/state-visualizer.test.ts` pins the output shape.
 *
 * Usage:
 *   bun run state:visualizer                # writes into ./_site
 *   bun run state:visualizer -- --out-dir X
 *
 * Exit: 0 written, non-zero on an unreadable source.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import {
  artefactStub,
  graphKindsOfLayer,
  instanceRootsIn,
  isStateGraph,
  readDeclaration,
  repoRootFor,
  siteDirFor,
  type CatHarnessDeclaration,
} from "../schemas/cat-harness.js";
// REQUIRED: `folio` is registered by core on import and this instance declares
// a folio graph, so `readDeclaration` throws on a valid declaration without it.
// The same line `print-stub.ts` carries, for the same reason.
import "../schemas/folio-graph-kind.js";
import { beanFindings, readBeans } from "./beans.js";
import { readTodoFiles } from "./todos.js";
import { detectRepoUrl } from "../src/core/git-refs.js";

const HERE = dirname(new URL(import.meta.url).pathname);
const INSTANCE_ROOT = resolve(HERE, "..");
const REPO_ROOT = repoRootFor(INSTANCE_ROOT);

const args = process.argv.slice(2);
const outArg = args.indexOf("--out-dir");
const OUT_DIR = resolve(outArg >= 0 && args[outArg + 1] ? args[outArg + 1]! : "_site");

/**
 * The renderer and its styles, read from the files the docs site also serves.
 *
 * `siteDirFor` rather than the literal `docs`: the site root is one answer,
 * read from the declaration, and `site-dir-single-answer.test.ts` is the gate
 * that caught the literal in the first draft of this file.
 */
const ASSET_DIR = join(INSTANCE_ROOT, siteDirFor(INSTANCE_ROOT), "assets");
const WORK_PLAN_JS = readFileSync(join(ASSET_DIR, "js", "work-plan.js"), "utf-8");
const WORK_PLAN_CSS = readFileSync(join(ASSET_DIR, "css", "work-plan.css"), "utf-8");

/** Every graph kind whose `holds` is `state`, asked of the registry. */
const STATE_KINDS = new Set(graphKindsOfLayer("state"));

/**
 * The forge this checkout points at, or `undefined` when it has none.
 *
 * DETECTED, not written down. It travels in each projection as `repoWeb` so
 * the renderer composes its links from data — the rule `editHref` follows in
 * `gen-docs-pages.ts`, and the reason is the same: one instance's address
 * does not belong inside shared client code.
 *
 * `undefined` is a real answer, not a failure. A checkout with no `origin`
 * still gets every page; the identifiers on it simply render as text, which
 * is what an unresolvable reference should look like.
 */
const REPO_WEB = detectRepoUrl(REPO_ROOT);

/**
 * Segments under `<stub>/` that a graph id may not take, because the layout
 * has already spent them.
 *
 * `dashboard` is this generator's own entry point. `index` and `assets` belong
 * to the knowledge-graph viewer `docs-site.yml` writes at `<base>/<stub>/`.
 * A declared directory with one of these ids would silently overwrite a page
 * it does not own, or be overwritten by one, and a reader would then be shown
 * one thing under another thing's name.
 *
 * Refused loudly instead. A route collision is a DECLARATION problem, and
 * guessing which of the two the reader meant is not this generator's call —
 * the same posture every "could not determine" in this repository takes.
 */
const RESERVED_SEGMENTS = new Set(["dashboard", "index", "assets"]);

/**
 * What a state graph's page can show.
 *
 * `live` graphs have a reader here and get data; `declared` ones are in the
 * declaration with nothing able to read them yet. The third value a reader
 * might expect — "not declared" — is absent on purpose: an undeclared graph
 * does not reach this generator at all, and inventing a row for it would be
 * this visualiser asserting something the declaration does not say.
 */
type GraphState = "live" | "declared";

interface StateGraph {
  /** The declared directory's id — the URL segment. */
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
 * The state graphs an instance declares.
 *
 * Reads the instance's OWN declaration. An instance declaring none gets an
 * index that says so — which is a true statement about that instance, and the
 * reason this does not skip it silently.
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
      state: d.id === "beans" || d.id === "todos" ? "live" : "declared",
      // The declaration's own words, clipped. Restating what a directory is
      // for, here, would be a second description free to contradict the first.
      description: (d.description ?? "").split(/(?<=\.)\s/)[0]?.slice(0, 260) ?? "",
    });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

/** One generated file. */
let wrote = 0;
function emit(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  wrote++;
}

/**
 * The page shell.
 *
 * It takes no base URL and composes none. Each caller writes its own metas
 * with a path relative to where that page sits — `../state/x.json` from the
 * index, `../../state/x.json` from a graph page — so the depth is expressed
 * once, at the only place that knows it, rather than threaded through here as
 * a number two callers have to agree about.
 */
function page(opts: {
  title: string;
  stub: string;
  metas: string[];
  body: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(opts.title)}</title>
<!--
  Generated by scripts/state-visualizer.ts. Do not hand-edit: the next run
  overwrites it, and a hand-edit here is a change nothing else in the tree
  knows about.
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
.sv-back { display: inline-block; margin-bottom: 1rem; color: var(--sv-ink-2); font-size: 0.85rem; }
.sv-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.6rem; }
.sv-item {
  border: 1px solid rgba(255,255,255,0.10); border-radius: 8px;
  padding: 0.8rem 1rem;
}
:root[data-fa-scheme="light"] .sv-item { border-color: rgba(11,11,11,0.10); }
.sv-item h2 { font-size: 1rem; margin: 0 0 0.2rem; }
.sv-item p { margin: 0; color: var(--sv-ink-2); font-size: 0.85rem; }
.sv-tag {
  font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.03em;
  font-weight: 600; margin-left: 0.5rem;
}
/* A state, not a warning: "declared, nothing renders it yet" is an honest
   answer about the graph, and painting it amber would rank it as a fault. */
.sv-tag.is-declared { color: #898781; }
.sv-tag.is-live { color: #0ca30c; }
.sv-h2 { font-size: 0.8rem; font-weight: 600; letter-spacing: 0.02em;
  text-transform: uppercase; color: var(--sv-ink-2); margin: 2rem 0 0.7rem; }
/* The page you are already on is not a link. A link to here is a control that
   does nothing, and a reader who clicks it learns only that it did nothing. */
.sv-here { font-weight: 600; }
.sv-item.is-here { border-color: currentColor; }
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

/** The per-graph data file, or `null` when nothing here can read that graph. */
function dataFor(id: string, instanceRoot: string): string | null {
  if (id === "beans") {
    const beans = readBeans(repoRootFor(instanceRoot));
    if (beans === null) return null;
    return JSON.stringify(
      {
        $schema: "folio-bean-index/v1",
        repoWeb: REPO_WEB,
        items: beans.map((b) => ({
          id: b.id, title: b.title, status: b.status, type: b.type,
          priority: b.priority, parent: b.parent, blocking: b.blocking,
          createdAt: b.createdAt, updatedAt: b.updatedAt,
          // Repo-relative, so the renderer can build BOTH a view and an edit
          // link from one field. Composing two absolute URLs per bean here
          // would put the forge's URL shape in the data 283 times over.
          file: b.file,
        })),
        findings: beanFindings(beans),
      },
      null,
      2,
    ) + "\n";
  }
  if (id === "todos") {
    const todos = readTodoFiles();
    return JSON.stringify(
      {
        $schema: "folio-todo-index/v1",
        repoWeb: REPO_WEB,
        items: todos.map(({ todo, path }) => ({
          id: todo.id, summary: todo.summary, status: todo.status,
          priority: todo.priority, origin: todo.origin, createdAt: todo.createdAt,
          file: path,
        })),
      },
      null,
      2,
    ) + "\n";
  }
  return null;
}

/**
 * One registered sub-visualisation of a harness.
 *
 * The registry is what the owner's instruction names: *"these are all
 * registered sub visualisations of one (sub)harness"*. `dashboard` is
 * registered unconditionally where anything is readable; every state graph the
 * instance declares registers one of its own. Adding a visualisation is adding
 * an entry, not adding a branch to the emit loop.
 */
interface Visualisation {
  /** The URL segment under `<stub>/`, and the data file's basename. */
  id: string;
  /** What the listing calls it. */
  title: string;
  /** One line under the title. */
  blurb: string;
  /** `live` carries data; `declared` says so and shows none. */
  state: GraphState;
  html: () => string;
}

/** The registry rows, rendered as the dashboard's way into each sibling. */
function registryRows(vis: Visualisation[], current?: string): string {
  return vis.map((v) => {
    const here = v.id === current;
    const name = here
      ? `<span class="sv-here">${esc(v.title)}</span>`
      : `<a href="../${esc(v.id)}/">${esc(v.title)}</a>`;
    return `  <li class="sv-item${here ? " is-here" : ""}">
    <h2>${name}<span class="sv-tag is-${v.state}">${v.state}</span></h2>
    <p>${esc(v.blurb)}</p>
  </li>`;
  }).join("\n");
}

/** Every page's way back to the harness it is a visualisation OF. */
function crumb(stub: string): string {
  return `<a class="sv-back" href="../">\u2190 ${esc(stub)}</a>`;
}

/** `<stub>/<graph>/` — one state graph. */
function graphPage(g: StateGraph, stub: string): string {
  const nav =
    crumb(stub) +
    `<h1>${esc(g.id)}</h1>` +
    `<p class="sv-sub">${esc(g.path)} \u00b7 ${esc(g.kinds.join(", "))}</p>`;

  if (g.state === "declared") {
    // No data, so no dashboard — and the page says which of the two it is.
    return page({
      title: `${g.id} — ${stub}`,
      stub, metas: [],
      body:
        nav +
        `<p class="sv-sub">This graph is <strong>declared</strong> and nothing renders it yet. ` +
        `That is bean <code>2krx</code>: a declared subgraph with no visualiser is ` +
        `unreachable, and 19 of this instance's 22 were in that state when this ` +
        `was written. The directory is <code>${esc(g.path)}</code>.</p>`,
    });
  }

  // ONE graph per page, so one meta: the renderer tells an absent meta from a
  // failed fetch, and a second meta here would quietly make this the combined
  // view under a single graph's name.
  const metas = [
    g.id === "beans"
      ? `<meta name="fa-beans-src" content="../${esc(g.id)}.json">`
      : `<meta name="fa-todo-src" content="../${esc(g.id)}.json">`,
  ];
  return page({
    title: `${g.id} — ${stub}`,
    stub, metas,
    body: nav + `<div class="fa-workplan" data-fa-workplan>
  <p class="fa-workplan-fallback">This view needs JavaScript. The data is
  <a href="../${esc(g.id)}.json">a plain JSON file</a>.</p>
</div>`,
  });
}

/**
 * `<stub>/dashboard/` — the work plan, and the registry beside it.
 *
 * The entry point, and the only page that carries both live metas. It lists
 * its siblings because `<base>/<stub>/` is the knowledge-graph viewer's and
 * this generator does not get to take it.
 */
function dashboardPage(vis: Visualisation[], stub: string): string {
  const live = vis.filter((v) => v.state === "live" && v.id !== "dashboard");
  const metas = live.map((v) =>
    v.id === "beans"
      ? `<meta name="fa-beans-src" content="../${esc(v.id)}.json">`
      : `<meta name="fa-todo-src" content="../${esc(v.id)}.json">`);
  const data = live.length
    ? live.map((v) => `<a href="../${esc(v.id)}.json">${esc(v.id)}.json</a>`).join(" and ")
    : "nothing this instance can read yet";
  return page({
    title: `dashboard — ${stub}`,
    stub, metas,
    body:
      crumb(stub) +
      `<h1>Work plan</h1>` +
      `<p class="sv-sub">${esc(stub)} \u2014 what its state graphs hold right now.</p>` +
      `<div class="fa-workplan" data-fa-workplan>
  <p class="fa-workplan-fallback">This view needs JavaScript. The data is published as
  ${data}.</p>
</div>` +
      `<h2 class="sv-h2">Visualisations of this harness</h2>
<ul class="sv-list">
${registryRows(vis, "dashboard")}
</ul>`,
  });
}

let instances = 0;
let collisions = 0;
for (const root of instanceRootsIn(REPO_ROOT)) {
  const decl = readDeclaration(root);
  // An unreadable declaration is "could not determine", and this generator
  // does not get to decide it means "no state". It is skipped loudly.
  if (!decl) {
    console.error(`  ! ${root}: no readable declaration — skipped, not treated as empty`);
    continue;
  }
  const stub = artefactStub(decl);
  const graphs = stateGraphsOf(decl);
  const base = join(OUT_DIR, stub);
  instances++;

  // A declared id that has already been spent by the layout. Reported and
  // skipped rather than written: overwriting the viewer's own page, or being
  // overwritten by it, would show a reader one thing under another's name.
  const taken = graphs.filter((g) => RESERVED_SEGMENTS.has(g.id));
  for (const g of taken) {
    console.error(
      `  ! ${stub}: declared directory \`${g.id}\` collides with a route this layout ` +
      `already uses — not rendered. Rename the directory's id in harness.json.`,
    );
    collisions++;
  }
  const routable = graphs.filter((g) => !RESERVED_SEGMENTS.has(g.id));

  if (routable.length === 0) {
    // A true statement about this instance, not a skipped page. An instance
    // that declares no state graph has nothing running that writes state, and
    // saying so is more useful than a 404.
    emit(join(base, "dashboard", "index.html"), page({
      title: `dashboard — ${stub}`, stub, metas: [],
      body: crumb(stub) + `<h1>Work plan</h1>
<p class="sv-sub">This instance declares no state graph, so there is nothing here to watch.</p>`,
    }));
    console.log(`  \u2713 ${stub}/dashboard/ (no state graph)`);
    continue;
  }

  const vis: Visualisation[] = routable.map((g) => ({
    id: g.id,
    title: g.id,
    blurb: g.description || g.path,
    state: g.state,
    html: () => graphPage(g, stub),
  }));
  vis.unshift({
    id: "dashboard",
    title: "dashboard",
    blurb: "Every readable state graph at once — counts, what is stuck, and where the work sits.",
    state: vis.some((v) => v.state === "live") ? "live" : "declared",
    html: () => dashboardPage(vis, stub),
  });

  for (const g of routable) {
    if (g.state !== "live") continue;
    const data = dataFor(g.id, root);
    if (data !== null) emit(join(base, `${g.id}.json`), data);
  }
  for (const v of vis) emit(join(base, v.id, "index.html"), v.html());
  console.log(`  \u2713 ${stub}/ (${vis.length} visualisation(s))`);
}

if (collisions > 0) {
  console.error(`\n${collisions} declared id(s) collide with a reserved route and were not rendered.`);
}
console.log(`\nWrote ${wrote} file(s) for ${instances} instance(s) under ${OUT_DIR}`);
