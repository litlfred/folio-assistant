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
 * and, on where a rendered asset belongs:
 *
 * > rendered assets should be available at toplevel like `<baseURL>/` for main
 * > just-the-docs pipeline, or `<baseurl>/<page>` where is registered rendered
 * > page from a harness that was instantiated and enabled (by default enabled)
 * > relative to their url, so `<baseurl>/<instantiated harness>/<path_to_rendered_content>`
 *
 * ## The route was already half-built, and this finishes the half
 *
 * `docs-site.yml` publishes `<base>/<stub>.jsonld` as an instance's graph and
 * `<base>/<stub>/index.html` as the viewer that makes it legible. The instance
 * SEGMENT is therefore not new — it is the thing that already "separates one
 * instance's renderings from another's in a tree that overlays several". This
 * adds `<base>/<stub>/state-visualizer/` beneath it, which is the same rule
 * applied to a second kind of rendered content.
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
 * A page at `<base>/<stub>/state-visualizer/<graph>/` reads `../../state/<graph>.json`.
 * Nothing composes a base URL, so the same bytes work at the canonical base, at
 * a staging preview, and under any HTTP root.
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
        items: beans.map((b) => ({
          id: b.id, title: b.title, status: b.status, type: b.type,
          priority: b.priority, parent: b.parent, blocking: b.blocking,
          createdAt: b.createdAt, updatedAt: b.updatedAt,
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
        items: todos.map(({ todo }) => ({
          id: todo.id, summary: todo.summary, status: todo.status,
          priority: todo.priority, origin: todo.origin, createdAt: todo.createdAt,
        })),
      },
      null,
      2,
    ) + "\n";
  }
  return null;
}

function graphPage(g: StateGraph, stub: string): string {
  const back = `<a class="sv-back" href="../">← ${esc(stub)} state</a>`;
  const head =
    `<h1>${esc(g.id)}</h1>` +
    `<p class="sv-sub">${esc(g.path)} · ${esc(g.kinds.join(", "))}</p>`;

  if (g.state === "declared") {
    // No data, so no dashboard — and the page says which of the two it is.
    return page({
      title: `${g.id} — ${stub} state`,
      stub, metas: [],
      body:
        back + head +
        `<p class="sv-sub">This graph is <strong>declared</strong> and nothing renders it yet. ` +
        `That is bean <code>2krx</code>: a declared subgraph with no visualiser is ` +
        `unreachable, and 19 of this instance's 22 were in that state when the ` +
        `visualiser was written. The directory is <code>${esc(g.path)}</code>.</p>`,
    });
  }

  // `work-plan.js` self-mounts on this container and reads the metas below.
  const metas =
    g.id === "beans"
      ? [`<meta name="fa-beans-src" content="../../state/beans.json">`]
      : [`<meta name="fa-todo-src" content="../../state/todos.json">`];
  return page({
    title: `${g.id} — ${stub} state`,
    stub, metas,
    body: back + head + `<div class="fa-workplan" data-fa-workplan>
  <p class="fa-workplan-fallback">This view needs JavaScript. The data is
  <a href="../../state/${esc(g.id)}.json">a plain JSON file</a>.</p>
</div>`,
  });
}

function indexPage(graphs: StateGraph[], stub: string, name: string): string {
  const rows = graphs.map((g) =>
    `  <li class="sv-item">
    <h2><a href="${esc(g.id)}/">${esc(g.id)}</a><span class="sv-tag is-${g.state}">${g.state}</span></h2>
    <p>${esc(g.description || g.path)}</p>
  </li>`).join("\n");

  const body = graphs.length === 0
    // A true statement about this instance, not a skipped page. An instance
    // that declares no state graph has nothing running that writes state, and
    // saying so is more useful than a 404.
    ? `<h1>${esc(name)} — state</h1>
<p class="sv-sub">This instance declares no state graph, so there is nothing here to watch.</p>`
    : `<h1>${esc(name)} — state</h1>
<p class="sv-sub">The graphs this instance declares as <code>state</code> — the ones a
running process writes as it goes. ${graphs.length} of them.</p>
<ul class="sv-list">
${rows}
</ul>
<div class="fa-workplan" data-fa-workplan>
  <p class="fa-workplan-fallback">The combined work-plan view needs JavaScript.</p>
</div>`;

  // The index shows both live graphs together, which is the question a reader
  // opening `<stub>/state-visualizer/` is actually asking: how much work, and
  // what is stuck — across both stores rather than one at a time.
  const metas = graphs.some((g) => g.state === "live")
    ? [
        `<meta name="fa-beans-src" content="../state/beans.json">`,
        `<meta name="fa-todo-src" content="../state/todos.json">`,
      ]
    : [];
  return page({ title: `${name} — state`, stub, metas, body });
}

let instances = 0;
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

  for (const g of graphs) {
    if (g.state !== "live") continue;
    const data = dataFor(g.id, root);
    if (data !== null) emit(join(base, "state", `${g.id}.json`), data);
  }
  for (const g of graphs) {
    emit(join(base, "state-visualizer", g.id, "index.html"), graphPage(g, stub));
  }
  emit(join(base, "state-visualizer", "index.html"), indexPage(graphs, stub, decl.name ?? stub));
  instances++;
  console.log(`  ✓ ${stub}/state-visualizer/ (${graphs.length} state graph(s))`);
}

console.log(`\nWrote ${wrote} file(s) for ${instances} instance(s) under ${OUT_DIR}`);
