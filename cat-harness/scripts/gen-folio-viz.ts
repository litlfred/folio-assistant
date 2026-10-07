#!/usr/bin/env bun
/**
 * Publish the folio graph as a projection, and a viewer over it.
 *
 * @module scripts/gen-folio-viz
 * @covers folio
 * @graphNode none — a generator over the folio graph, not a schema itself
 *
 * Owner, 2026-09-22: *"folio must be in cat-harness and visualizer owned by
 * it. transations too... there should be visualizer."*
 *
 * Measured against that ruling before writing anything. The three graphs it
 * names:
 *
 * | graph | in cat-harness | visualiser |
 * |---|---|---|
 * | `library/` | yes | `docs/cat-harness/library/…` — present |
 * | `translations/` | yes | `docs/translation-status/…` — present |
 * | **`folio/`** | yes | **none** |
 *
 * So the ruling was already satisfied twice and once not, and this is the
 * once. Bean `7ofc`.
 *
 * ## `folio` IS RENDERED ALREADY, and that is not the same thing
 *
 * `folio` is the only `renderable` graph typology — a folio graph comes out the
 * other end as a website — and `gen-landing-data.ts` already turns these
 * nodes into the landing board a reader sees. So there is a rendering of the
 * folio's CONTENT.
 *
 * What there is no view of is the GRAPH: which nodes exist, what each one
 * anchors to, which theme it claims, where it was declared, and whether the
 * links it carries resolve. That is the difference between reading a folio
 * and inspecting one, and it is the same difference `gen-library-viz` draws
 * between reading an ingested document and seeing the corpus.
 *
 * ## The obligation is `2krx`'s, not a failing row
 *
 * `check:subgraph-coverage` never asked for this page. `owesVisualiser`
 * exempts the kind, exactly as it exempted `library` (bean `jbx2`) and
 * `voices` (bean `bu2q`) — this generator's two siblings, which say the same
 * thing in their own headers. The obligation met here is `2krx`'s: *"a
 * directory nobody can see is one nobody checks."* Recording that so a later
 * reader does not go hunting for the finding that motivated it, and finds
 * instead the owner's ruling, which is what did.
 *
 * ## Three pieces, the same three as its siblings
 *
 * A reader over the declared directories, a projection under
 * `<site>/assets/folio/`, and a zero-dependency viewer under
 * `<site>/<handler>/folio/` that fetches the projection relative to its own
 * location. The reader's folio comes with the site's layout, which the
 * viewer is on since 2026-10-07: a library surface that did not carry it
 * would be the one page in the set that forgot it.
 *
 * NO BACKTICKS BELOW THE TEMPLATE LITERAL — not in strings, not in comments.
 * The whole page is one template literal and a backtick anywhere inside it
 * terminates the string, failing at a line number far from the mistake. Bean
 * `bmr0` gated this after four warnings did not work, and it caught the
 * author of this file on 2026-09-22 in `gen-library-viz.ts`.
 *
 * Usage:
 *   bun run cat folio:viz
 *   bun run cat folio:viz -- --check
 *
 * Exit: 0 written or up to date · 1 stale under `--check`.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, relative } from "node:path";

import { viewerPlacement } from "./gen-schema-viz.ts";
import {
  directoriesForGraph,
  readDeclaration,
  repoRootFor,
  siteDirFor,
} from "../schemas/cat-harness.js";
import { makeEmit } from "./viewer-page.ts";
import { themedPage } from "./lib/themed-page.ts";
import { publishedHref } from "./lib/jekyll-permalink.ts";
import { withRendersFrontMatter } from "./viewer-declarations.js";

/** This generator's Tool node (`tools/viewers.ts`), named on every page it draws. */
const VIEWER_TOOL = "folio-viewer";

const ROOT = join(import.meta.dir, "..");
const check = process.argv.includes("--check");

/** One node of the folio graph, as the viewer needs it. */
export interface FolioNodeRow {
  id: string;
  summary: string;
  theme: string | null;
  anchor: string | null;
  declaredIn: string | null;
  links: Array<{ label: string; href: string }>;
  /** Characters of prose. A node with none is a sticky with nothing to say. */
  chars: number;
  file: string;
}

export interface FolioGraph {
  /** Every declared folio directory, ABSENT ONES INCLUDED. */
  directories: Array<{ dir: string; present: boolean; nodes: number }>;
  nodes: FolioNodeRow[];
}

/**
 * Read every declared folio directory.
 *
 * A DECLARED-BUT-ABSENT DIRECTORY IS A ROW, NOT SILENCE — `dh4f`, the defect
 * this repository keeps paying for, and one the author of this file
 * personally re-enacted on 2026-09-22 by measuring an instance-relative path
 * from the repository root (bean `8mbk`, scrapped). A consumer that scans
 * nothing and reports a clean run is worse than one that says it found
 * nothing.
 */
export function readFolioGraph(roots: string[], repo?: string): FolioGraph | null {
  const dirs = new Set<string>();
  for (const root of roots) for (const d of directoriesForGraph(root, "folio")) dirs.add(d);
  if (dirs.size === 0) return null;

  // REPO-RELATIVE, AND THE COMMITTED ARTEFACT IS WHY.
  //
  // The first version emitted absolute paths, so the projection carried
  // `/home/user/folio-assistant/cat-harness/folio/...` — the author's own
  // checkout. CI builds at `/home/runner/work/...`, so `folio:viz:check`
  // went red on a file that was correct: the artefact could never be
  // current anywhere but the machine that wrote it, and it published that
  // machine's directory layout into a JSON anyone can read.
  //
  // Caught by the gate this same change added, on its first CI run. Its
  // siblings (`library/`, `voices/`) already emit relative paths; this one
  // did not, and nothing said so until the path differed.
  const base = repo ?? roots[roots.length - 1] ?? "";
  const rel = (p: string): string => (base ? relative(base, p) : p).split("\\").join("/");

  const g: FolioGraph = { directories: [], nodes: [] };
  for (const dir of [...dirs].sort()) {
    const present = existsSync(dir);
    let n = 0;
    if (present) {
      for (const name of readdirSync(dir).sort()) {
        if (!name.endsWith(".json")) continue;
        const file = join(dir, name);
        let raw: Record<string, unknown>;
        try {
          raw = JSON.parse(readFileSync(file, "utf-8")) as Record<string, unknown>;
        } catch {
          // UNREADABLE IS NOT ABSENT. A node counted as missing would make a
          // broken file look like a file nobody wrote.
          g.nodes.push({
            id: basename(name, ".json"),
            summary: "could not be read — this file is not valid JSON",
            theme: null,
            anchor: null,
            declaredIn: null,
            links: [],
            chars: 0,
            file: rel(file),
          });
          n++;
          continue;
        }
        const anchor = raw.anchor as { kind?: string; page?: string } | undefined;
        g.nodes.push({
          id: String(raw.id ?? basename(name, ".json")),
          summary: String(raw.summary ?? ""),
          // A ThemeRef `{instance?, themeId}` since #1168 B8; the page shows the id.
          theme:
            raw.theme == null
              ? null
              : typeof raw.theme === "object"
                ? String((raw.theme as { themeId?: unknown }).themeId ?? "")
                : String(raw.theme),
          anchor: anchor?.kind ? `${anchor.kind}:${anchor.page ?? ""}` : null,
          declaredIn: raw.declaredIn == null ? null : String(raw.declaredIn),
          links: Array.isArray(raw.links)
            ? (raw.links as Array<Record<string, unknown>>).map((l) => ({
                label: String(l.label ?? ""),
                // Authored as the page's source location; published elsewhere
                // for the docs-folder pages (bean `kc7k`).
                href: publishedHref(join(ROOT, siteDirFor(ROOT)), String(l.href ?? "")),
              }))
            : [],
          chars: String(raw.comment ?? raw.text ?? "").length,
          file: rel(file),
        });
        n++;
      }
    }
    g.directories.push({ dir: rel(dir), present, nodes: n });
  }
  return g;
}

export function projection(g: FolioGraph): unknown {
  return {
    $schema: "folio-graph-projection/v1",
    tile: { folio: { count: g.nodes.length, unit: "stickies" } },
    directories: g.directories,
    nodes: g.nodes,
  };
}

/**
 * The viewer — a THEMED Jekyll page since 2026-10-07 (lib/themed-page.ts):
 * on the site's default layout, so it carries the top band (search, Folio,
 * language) that only that layout delivers, and the folio with it — the
 * layout loads docs-ui, so the page carries no folio-mount fragment of its
 * own (check:folio-mount counts a page on the layout as mounted). Every rule
 * is scoped under .fo-page; the one hue, the warn pill, is keyed on the
 * site's own scheme switch (data-fa-scheme), dark first because the site's
 * ground is, and everything else is neutral and translucent.
 */
export function viewerHtml(dataHref: string): string {
  // NO BACKTICKS BELOW THIS LINE — see the module header.
  return themedPage({
    title: "folio — the graph",
    generator: "cat-harness/scripts/gen-folio-viz.ts",
    command: "bun run folio:viz",
    body: `<style>
.fo-page { --edge:rgba(127,127,127,.4); --box:rgba(127,127,127,.12);
           --warn:#f0c27a; --warn-edge:#8a6420; --warn-bg:rgba(236,148,51,.16); }
:root[data-fa-scheme="light"] .fo-page { --warn:#7a4a10; --warn-edge:#ec9433; --warn-bg:#fdf4e8; }
.fo-page h1 { margin:0 0 .2rem; }
.fo-page .lede { opacity:.9; margin:0 0 1.2rem; }
.fo-page .badge { display:inline-block; border:1px solid var(--edge); background:var(--box);
         border-radius:0; padding:.2rem .5rem; margin:0 .4rem .4rem 0; font-size:.85rem; }
.fo-page table { display:table; width:100%; border-collapse:collapse; margin:1rem 0; font-size:.95rem; }
.fo-page th, .fo-page td { text-align:left; padding:.5rem .55rem; border:0; border-bottom:1px solid var(--edge); vertical-align:top; background:transparent; }
.fo-page th { font-weight:600; white-space:nowrap; }
.fo-page .muted { opacity:.9; }
.fo-page .pill { display:inline-block; font-size:.72rem; font-weight:700; letter-spacing:.04em;
        text-transform:uppercase; padding:.12rem .45rem; border:1px solid var(--edge); }
.fo-page .pill.warn { color:var(--warn); border-color:var(--warn-edge); background:var(--warn-bg); }
.fo-page .empty { opacity:.9; }
</style>
<div class="fo-page">
  <h1 id="fo-title">folio — the graph</h1>
  <p class="lede">Every node the folio graph holds: what it anchors to, the theme it claims,
     where it was declared, and the links it carries. The folio's <em>content</em> renders as
     the landing board; this is a view of the graph behind it.</p>
  <div id="badges"></div>
  <div id="dirs"></div>
  <div id="nodes"><p class="empty">loading…</p></div>
</div>
<script>
var DATA_HREF = ${JSON.stringify(dataHref)};
// Bean "qgjh": a node's links are LINKS. An absolute http(s) href is used as
// it is; a site-rooted one ("/concepts/agentic-harness.html") is resolved against this
// site's root, found from where the page reads its data, so it works under the
// bare site, the project baseurl and a staging preview alike. Anything else
// stays text rather than becoming a link that 404s.
var SITE_ROOT = (function (h) { var i = h.lastIndexOf("assets/"); return i < 0 ? "" : h.slice(0, i); })(DATA_HREF);
function linkHref(h) {
  if (/^https?:[/][/]/.test(h)) return h;
  if (h.charAt(0) === "/" && h.charAt(1) !== "/") return SITE_ROOT + h.slice(1);
  return "";
}
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s == null ? "" : s)
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

fetch(DATA_HREF).then(function(r){ if(!r.ok) throw new Error(r.status + " " + r.statusText); return r.json(); })
.then(function(G){
  $("badges").innerHTML =
    '<span class="badge"><b>' + G.nodes.length + "</b> stick" + (G.nodes.length===1?"y":"ies") + "</span>" +
    '<span class="badge"><b>' + G.directories.length + "</b> declared director" +
    (G.directories.length===1?"y":"ies") + "</span>";

  /* A DECLARED-BUT-ABSENT DIRECTORY GETS A ROW. Omitting it is the dh4f
     shape: a consumer scans nothing and reports a clean run over it. */
  $("dirs").innerHTML = "<table><thead><tr><th>declared directory</th><th>state</th><th>stickies</th></tr></thead><tbody>" +
    G.directories.map(function(d){
      return "<tr><td><code>" + esc(d.dir) + "</code></td><td>" +
        (d.present ? "present" : '<span class="pill warn">declared, absent</span>') +
        "</td><td>" + d.nodes + "</td></tr>";
    }).join("") + "</tbody></table>";

  if (G.nodes.length === 0) {
    $("nodes").innerHTML = '<p class="empty">No stickies. That is a folio graph with no nodes, ' +
      "not a graph that could not be read \\u2014 the directories above say which were found.</p>";
    return;
  }

  $("nodes").innerHTML = "<table><thead><tr><th>id</th><th>summary</th><th>anchor</th>" +
    "<th>theme</th><th>declared in</th><th>links</th><th>prose</th></tr></thead><tbody>" +
    G.nodes.map(function(n){
      return "<tr>" +
        "<td><code>" + esc(n.id) + "</code></td>" +
        "<td>" + esc(n.summary) + "</td>" +
        "<td>" + (n.anchor ? "<code>" + esc(n.anchor) + "</code>"
                           : '<span class="muted">none</span>') + "</td>" +
        "<td>" + (n.theme ? esc(n.theme) : '<span class="muted">none</span>') + "</td>" +
        "<td><code class=\\"muted\\">" + esc(n.declaredIn || "\\u2014") + "</code></td>" +
        "<td>" + (n.links.length
          ? n.links.map(function(l){
              var h = linkHref(l.href);
              return h ? '<a href="' + esc(h) + '">' + esc(l.label) + "</a>" : esc(l.label);
            }).join("<br>")
          : '<span class="muted">none</span>') + "</td>" +
        '<td class="muted">' + n.chars.toLocaleString() + " chars</td>" +
      "</tr>";
    }).join("") + "</tbody></table>";
})
.catch(function(e){
  /* COULD NOT LOAD IS NOT EMPTY, and the page says which. */
  $("nodes").innerHTML = '<p class="empty">The projection at <code>' + esc(DATA_HREF) +
    "</code> could not be read: " + esc(e.message) +
    ". That is not an empty folio \\u2014 it is a folio that could not be loaded.</p>";
});
</script>`,
  });
}

let stale = 0;
/**
 * The viewer `emit`, for the projection and the page alike. No `nav` since
 * 2026-10-07: the page is themed, so the theme's sidebar is its navigation
 * and there is no rail to inject.
 */
const emit = makeEmit({ check, onStale: () => { stale++; } });

if (import.meta.main) {
  const repoRoot = repoRootFor(ROOT);
  const g = readFolioGraph([ROOT, repoRoot], repoRoot);
  if (g === null) {
    console.log("  · no folio directory is declared — nothing to publish");
    process.exit(0);
  }

  const site = join(ROOT, siteDirFor(ROOT));
  const seg = basename(g.directories[0]!.dir);
  const handler = readDeclaration(ROOT)?.name;
  if (!handler) {
    console.log("  · this instance declares no name — no handler segment to publish under");
    process.exit(0);
  }

  const { pageDir, dataDir, dataHref } = viewerPlacement(site, `${handler}/${seg}`, seg);

  emit(join(dataDir, "index.json"), JSON.stringify(projection(g), null, 2) + "\n");
  // The page says which directories it draws (#1168 B7a-2).
  emit(
    join(pageDir, "index.html"),
    withRendersFrontMatter(viewerHtml(dataHref), g.directories.filter((d) => d.present).map((d) => d.dir), VIEWER_TOOL),
  );

  const absent = g.directories.filter((d) => !d.present).length;
  console.log(
    `  ${g.nodes.length} sticky(ies) across ${g.directories.length} declared director(ies)` +
      (absent ? `, ${absent} declared but absent` : ""),
  );
  if (check && stale > 0) {
    console.error(`\n${stale} artefact(s) stale — run \`bun run cat folio:viz\``);
    process.exit(1);
  }
}
