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
 * `folio` is the only `renderable` graph kind — a folio graph comes out the
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
 * location — plus the folio mount, because a library surface that did not
 * carry the reader's folio would be the one page in the set that forgot it.
 *
 * NO BACKTICKS BELOW THE TEMPLATE LITERAL — not in strings, not in comments.
 * The whole page is one template literal and a backtick anywhere inside it
 * terminates the string, failing at a line number far from the mistake. Bean
 * `bmr0` gated this after four warnings did not work, and it caught the
 * author of this file on 2026-09-22 in `gen-library-viz.ts`.
 *
 * Usage:
 *   bun run folio:viz
 *   bun run folio:viz -- --check
 *
 * Exit: 0 written or up to date · 1 stale under `--check`.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";

import { fragment as folioMountFragment } from "./folio-mount.ts";
import { viewerPlacement } from "./gen-schema-viz.ts";
import {
  directoriesForGraph,
  readDeclaration,
  repoRootFor,
  siteDirFor,
} from "../schemas/cat-harness.js";

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
          theme: raw.theme == null ? null : String(raw.theme),
          anchor: anchor?.kind ? `${anchor.kind}:${anchor.page ?? ""}` : null,
          declaredIn: raw.declaredIn == null ? null : String(raw.declaredIn),
          links: Array.isArray(raw.links)
            ? (raw.links as Array<Record<string, unknown>>).map((l) => ({
                label: String(l.label ?? ""),
                href: String(l.href ?? ""),
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

export function viewerHtml(dataHref: string, mount = ""): string {
  // NO BACKTICKS BELOW THIS LINE — see the module header.
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>folio — the graph</title>
<meta name="description" content="Every node of the folio graph: what it anchors to, the theme it claims, and where it was declared.">
<style>
  :root { --bg:#ffffff; --fg:#21252b; --muted:#6c757d; --edge:#d7dbe0; --box:#f7f8fa;
          --accent:#4a34b8; --warn:#7a4a10; --warn-edge:#ec9433; --warn-bg:#fdf4e8; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#1c1d21; --fg:#e8eaed; --muted:#9aa0a6; --edge:#3a3d42; --box:#27262b;
            --accent:#8c74f0; --warn:#f0c27a; --warn-edge:#8a6420; --warn-bg:#2e2417; }
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--fg); font-size:1rem; line-height:1.5;
         font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif; }
  .wrap { max-width:70rem; margin:0 auto; padding:1.5rem 1.2rem 6rem; }
  h1 { font-size:1.5rem; margin:0 0 .2rem; }
  .lede { color:var(--muted); margin:0 0 1.2rem; }
  .badge { display:inline-block; border:1px solid var(--edge); background:var(--box);
           border-radius:0; padding:.2rem .5rem; margin:0 .4rem .4rem 0; font-size:.85rem; }
  table { width:100%; border-collapse:collapse; margin:1rem 0; font-size:.95rem; }
  th,td { text-align:left; padding:.5rem .55rem; border-bottom:1px solid var(--edge); vertical-align:top; }
  th { font-weight:600; white-space:nowrap; }
  code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.85em; }
  .muted { color:var(--muted); }
  .pill { display:inline-block; font-size:.72rem; font-weight:700; letter-spacing:.04em;
          text-transform:uppercase; padding:.12rem .45rem; border:1px solid var(--edge); }
  .pill.warn { color:var(--warn); border-color:var(--warn-edge); background:var(--warn-bg); }
  .empty { color:var(--muted); }
  a { color:var(--accent); }
</style>
</head>
<body>
<div class="wrap">
  <h1>folio — the graph</h1>
  <p class="lede">Every node the folio graph holds: what it anchors to, the theme it claims,
     where it was declared, and the links it carries. The folio's <em>content</em> renders as
     the landing board; this is a view of the graph behind it.</p>
  <div id="badges"></div>
  <div id="dirs"></div>
  <div id="nodes"><p class="empty">loading…</p></div>
</div>
<script>
var DATA_HREF = ${JSON.stringify(dataHref)};
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
          ? n.links.map(function(l){ return esc(l.label); }).join("<br>")
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
</script>
${mount}
</body>
</html>
`;
}

let stale = 0;
function emit(path: string, content: string): void {
  if (check) {
    const current = existsSync(path) ? readFileSync(path, "utf-8") : "";
    if (current === content) return;
    console.error(`  ✗ ${path} ${existsSync(path) ? "is stale" : "is missing"}`);
    stale++;
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  console.log(`  ✓ ${path}`);
}

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
  // The mount's route comes from the values that decided the route, as it
  // does in `gen-library-viz` — so relocating the viewer moves the pattern
  // with it rather than leaving a second copy of the mount table.
  const mount = folioMountFragment(new RegExp(`^(.*?)${handler}\\/${seg}\\/`));

  emit(join(dataDir, "index.json"), JSON.stringify(projection(g), null, 2) + "\n");
  emit(join(pageDir, "index.html"), viewerHtml(dataHref, mount));

  const absent = g.directories.filter((d) => !d.present).length;
  console.log(
    `  ${g.nodes.length} sticky(ies) across ${g.directories.length} declared director(ies)` +
      (absent ? `, ${absent} declared but absent` : ""),
  );
  if (check && stale > 0) {
    console.error(`\n${stale} artefact(s) stale — run \`bun run folio:viz\``);
    process.exit(1);
  }
}
