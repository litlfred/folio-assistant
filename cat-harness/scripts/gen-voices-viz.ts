#!/usr/bin/env bun
/**
 * Publish the voices graph as a projection, and a viewer over it.
 *
 * @module scripts/gen-voices-viz
 * @graphNode none — a generator over the voices graph, not a schema itself
 *
 * Sibling of `gen-library-viz.ts` and `gen-schema-viz.ts`, deliberately the
 * same three pieces: a reader (`voices-graph.ts`), a projection under
 * `<site>/assets/<graph>/`, and a zero-dependency viewer under
 * `<site>/<handler>/<graph>/` that fetches the projection relative to its own
 * location. The published segment is the DECLARED directory's own name, read
 * rather than written down.
 *
 * ## The page's one job: show the citations
 *
 * `check-voices.ts` exists because PR #210 shipped ten plausible rules per
 * voice with `source: null`, one of which asserted the opposite of what the
 * source says. Every rule now carries the page and the quote it was read
 * from — machine-checked, and until this page, **unreadable by a person
 * without opening JSON**. So the rule row leads with the quote, and the
 * citation is the column that cannot be sorted away.
 *
 * Bean `bu2q`, on the owner's ask: *"shoulld show list of voices defined"*.
 *
 * ## The visualiser rule does NOT demand this page, and that is worth saying
 *
 * `owesVisualiser` returns false for a `content` kind and `voices` is
 * `content`, so `check:subgraph-coverage` never asked for it — exactly as it
 * never asked for the library viewer (bean `jbx2`). The obligation this page
 * meets is the one in `2krx`'s own words — *"a directory nobody can see is one
 * nobody checks"* — not a failing row. Recording that here so a later reader
 * does not go looking for the finding that motivated it.
 *
 * ## A declared-but-absent directory gets a ROW, not silence
 *
 * `agent-skills` declares a `voices` graph and ships none. The directories
 * panel lists it as declared-but-absent rather than omitting it, because a
 * consumer that scans nothing and reports a clean run is the `dh4f` defect
 * this repository keeps paying for.
 *
 * Usage:
 *   bun run voices:viz          # write
 *   bun run voices:viz:check    # fail if either artefact is stale
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

import { readVoicesGraph, type VoicesGraph } from "./voices-graph.ts";
import { orphanSubjectPages, viewerPlacement } from "./gen-schema-viz.ts";
import {
  directoriesForGraph,
  readDeclaration,
  repoRootFor,
  siteDirFor,
} from "../schemas/cat-harness.ts";
import "../schemas/folio-graph-kind.js";
import { tileCounts } from "../schemas/tile-count.js";

const ROOT = join(import.meta.dir, "..");
const check = process.argv.includes("--check");

/** The projection. Everything the reader found; it is already small. */
export function projection(g: VoicesGraph): unknown {
  return {
    $schema: "folio-voices-index/v1",
    // `totals.voices`, which the graph already computes for the badge row, so
    // the tile and the page cannot disagree — rather than `voices.length`,
    // which would be the same number arrived at twice. `directories` is the
    // container the voices were found in, not a count of voices.
    ...tileCounts({ voices: [g.totals.voices, "voices"] }),
    ...g,
  };
}

export function viewerHtml(dataHref: string, scope = ""): string {
  // NO BACKTICKS BELOW THIS LINE — not in strings, not in comments.
  //
  // The whole page is one template literal, so a backtick anywhere inside it
  // terminates the string and the rest becomes TypeScript. It has happened
  // twice in the sibling generator, both times in a COMMENT. `check:viz-backticks`
  // gates it (bean bmr0), and this file is in its scope.
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Voices — what each rule cites</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' rx='3' fill='%235b2d82'/%3E%3Cpath d='M8 3c-1 0-1.8.8-1.8 1.8v3a1.8 1.8 0 003.6 0v-3C9.8 3.8 9 3 8 3z' fill='white'/%3E%3Cpath d='M4.6 7.4a3.4 3.4 0 006.8 0' stroke='white' stroke-width='1.1' fill='none'/%3E%3Crect x='7.4' y='10.6' width='1.2' height='2.4' fill='white'/%3E%3C/svg%3E">
<style>
:root {
  --bg:#fff; --fg:#17191c; --muted:#5b6168; --line:#d9dde2; --panel:#f6f7f9;
  --accent:#5b2d82; --accent-soft:#f0e9f7; --warn:#8a5300; --warn-soft:#fdf3e0;
  --info:#1a5fb4; --info-soft:#e7eefb; --box:#fff;
  --crit:#9b1c1c; --crit-soft:#fdeaea;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg:#14171a; --fg:#e8eaed; --muted:#9aa2ab; --line:#2e343b; --panel:#1b1f24;
    --accent:#c4a2e0; --accent-soft:#241a2e; --warn:#e0b25e; --warn-soft:#2a2213;
    --info:#7aa7e8; --info-soft:#1d2937; --box:#1b1f24;
    --crit:#f2a0a0; --crit-soft:#2e1a1a;
  }
}
:root[data-theme="dark"] {
  --bg:#14171a; --fg:#e8eaed; --muted:#9aa2ab; --line:#2e343b; --panel:#1b1f24;
  --accent:#c4a2e0; --accent-soft:#241a2e; --warn:#e0b25e; --warn-soft:#2a2213;
  --info:#7aa7e8; --info-soft:#1d2937; --box:#1b1f24;
  --crit:#f2a0a0; --crit-soft:#2e1a1a;
}
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--fg);
  font:15px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
header { padding:16px; border-bottom:1px solid var(--line); }
h1 { font-size:1.15rem; margin:0 0 6px; }
h2 { font-size:1rem; margin:0; }
p.lede { margin:6px 0 0; color:var(--muted); max-width:62ch; font-size:.9rem; }
.badges { display:flex; flex-wrap:wrap; gap:8px; margin:10px 0 0; }
.badge { border:1px solid var(--line); border-radius:8px; padding:5px 10px; font-size:.82rem; background:var(--panel); }
.badge b { font-variant-numeric:tabular-nums; }
.badge.warn { border-color:var(--warn); background:var(--warn-soft); }
.toolbar { padding:10px 16px; display:flex; flex-wrap:wrap; gap:8px; align-items:center;
  border-bottom:1px solid var(--line); }
input, select, button { font:inherit; color:var(--fg); background:var(--box);
  border:1px solid var(--line); border-radius:6px; padding:6px 9px; }
input { flex:1 1 220px; min-width:0; }
main { padding:16px; }
.voice { border:1px solid var(--line); border-radius:10px; margin:0 0 16px; background:var(--box); overflow:hidden; }
.voice > summary { padding:12px 14px; cursor:pointer; background:var(--panel); list-style:none; }
.voice > summary::-webkit-details-marker { display:none; }
.voice > summary::before { content:"\\25B8"; display:inline-block; width:1em; color:var(--muted); }
.voice[open] > summary::before { content:"\\25BE"; }
.vhead { display:flex; flex-wrap:wrap; gap:10px; align-items:baseline; }
.vhead .id { font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:.85rem; color:var(--muted); }
.vmeta { margin:6px 0 0 1em; color:var(--muted); font-size:.84rem; }
.vmeta code { font-size:.95em; }
.rules { padding:4px 14px 14px; }
.rule { border-top:1px solid var(--line); padding:12px 0 2px; }
.rule:first-child { border-top:0; }
.rtitle { font-weight:600; }
.rid { font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:.8rem; color:var(--muted); margin-left:6px; }
.rdesc { margin:4px 0 0; font-size:.9rem; }
blockquote { margin:8px 0 6px; padding:8px 12px; border-left:3px solid var(--accent);
  background:var(--accent-soft); font-size:.9rem; }
blockquote .cite { display:block; margin-top:6px; color:var(--muted); font-size:.82rem;
  font-family:ui-monospace, SFMono-Regular, Menlo, monospace; }
.chips { display:flex; flex-wrap:wrap; gap:6px; margin:6px 0 10px; }
.chip { border:1px solid var(--line); border-radius:999px; padding:2px 9px; font-size:.78rem; background:var(--panel); }
.chip.sev-critical { color:var(--crit); background:var(--crit-soft); border-color:var(--crit); }
.chip.sev-major { color:var(--warn); background:var(--warn-soft); border-color:var(--warn); }
.chip.mech { color:var(--info); background:var(--info-soft); border-color:var(--info); }
.chip.ci { color:var(--warn); background:var(--warn-soft); border-color:var(--warn); }
/* A provenance FLAG is a question for a person, so it is warn and never crit —
   the same distinction .nocite below draws from the other side. Backticks stay
   OUT of this file's page template: it is one template literal, and a stray
   pair reads as a tagged template and fails the generator. */
.pflag { color:var(--warn); background:var(--warn-soft); border:1px solid var(--warn);
  border-radius:6px; padding:.5rem .7rem; margin:.4rem 0 0; font-size:.86rem; }
.pflag b { font-weight:700; }
.nocite { color:var(--crit); background:var(--crit-soft); border:1px solid var(--crit);
  border-radius:6px; padding:8px 12px; font-size:.9rem; margin:8px 0; }
table.dirs { border-collapse:collapse; width:100%; font-size:.86rem; margin:0 0 20px; }
table.dirs th, table.dirs td { text-align:left; padding:7px 10px; border-bottom:1px solid var(--line); }
table.dirs code { font-size:.95em; }
td.absent { color:var(--warn); font-weight:600; }
.empty { color:var(--muted); padding:20px 0; }
footer { padding:14px 16px; border-top:1px solid var(--line); color:var(--muted); font-size:.82rem; }
</style>
</head>
<body>
<header>
  <h1>Voices</h1>
  <p class="lede">Every voice this repository's instances declare, with the passage each
    rule was read from. A voice is auditable rather than asserted: uphold a finding by
    opening the citation, never by trusting a restatement.</p>
  <div class="badges" id="badges"></div>
</header>
<div class="toolbar">
  <input id="q" type="search" placeholder="Search voices, rules, quotes…" aria-label="Search">
  <select id="inst" aria-label="Filter by instance"><option value="">every instance</option></select>
  <select id="sev" aria-label="Filter by rule severity">
    <option value="">every severity</option>
    <option value="critical">critical</option>
    <option value="major">major</option>
    <option value="minor">minor</option>
  </select>
  <button id="expand" type="button">expand all</button>
</div>
<main>
  <table class="dirs" id="dirs"><caption class="empty" style="text-align:left;padding:0 0 6px">
    Declared <code>voices</code> directories</caption></table>
  <div id="out"></div>
</main>
<footer id="foot"></footer>
<script>
var SCOPE = "${scope}";
var DATA = null;
var esc = function (s) {
  return String(s === undefined || s === null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

fetch("${dataHref}").then(function (r) { return r.json(); }).then(function (d) {
  DATA = d;
  var insts = [];
  d.voices.forEach(function (v) { if (insts.indexOf(v.instance) < 0) insts.push(v.instance); });
  insts.sort().forEach(function (i) {
    var o = document.createElement("option");
    o.value = i; o.textContent = i;
    document.getElementById("inst").appendChild(o);
  });
  if (SCOPE) { document.getElementById("inst").value = SCOPE; }
  renderBadges(); renderDirs(); render();
}).catch(function (e) {
  document.getElementById("out").innerHTML =
    '<p class="nocite">The projection could not be loaded: ' + esc(e.message) + "</p>";
});

function renderBadges() {
  var t = DATA.totals;
  var absent = DATA.directories.filter(function (d) { return !d.present; }).length;
  var b = [
    '<span class="badge"><b>' + t.voices + "</b> voice(s)</span>",
    '<span class="badge"><b>' + t.rules + "</b> rule(s)</span>",
    '<span class="badge"><b>' + t.citingLibrary + "</b> citing an ingested source</span>",
    '<span class="badge"><b>' + t.citingKgNode + "</b> citing a KG node</span>",
    '<span class="badge"><b>' + t.mechanical + "</b> with a mechanical half</span>"
  ];
  if (absent > 0) {
    b.push('<span class="badge warn"><b>' + absent + "</b> declared directory(ies) absent</span>");
  }
  document.getElementById("badges").innerHTML = b.join("");
}

function renderDirs() {
  var rows = ["<tr><th>instance</th><th>directory</th><th>voices</th></tr>"];
  DATA.directories.forEach(function (d) {
    rows.push(
      "<tr><td>" + esc(d.instance) + "</td><td><code>" + esc(d.dir) + "</code></td>" +
      (d.present
        ? "<td>" + d.voices.length + "</td>"
        : '<td class="absent">declared, not present</td>') +
      "</tr>"
    );
  });
  document.getElementById("dirs").innerHTML = rows.join("");
}

function ruleMatches(r, q, sev) {
  if (sev && r.severity !== sev) return false;
  if (!q) return true;
  var hay = (r.id + " " + r.title + " " + r.description + " " + r.quote + " " +
    (r.cites || "") + " " + r.category).toLowerCase();
  return hay.indexOf(q) >= 0;
}

function render() {
  var q = document.getElementById("q").value.trim().toLowerCase();
  var inst = document.getElementById("inst").value;
  var sev = document.getElementById("sev").value;
  var open = document.getElementById("expand").getAttribute("data-open") === "1";
  var html = [];
  var shownVoices = 0, shownRules = 0;

  DATA.voices.forEach(function (v) {
    if (inst && v.instance !== inst) return;
    var rules = v.rules.filter(function (r) { return ruleMatches(r, q, sev); });
    // A voice whose HEADER matches keeps all its rules: searching for a voice
    // by name should show you the voice, not an empty shell of it.
    var headHit = q && (v.id + " " + v.title + " " + v.description).toLowerCase().indexOf(q) >= 0;
    if (headHit && !sev) { rules = v.rules; }
    if (rules.length === 0 && !headHit) return;
    shownVoices++; shownRules += rules.length;

    var meta = [
      "shipped by <b>" + esc(v.instance) + "</b>",
      "<code>" + esc(v.path) + "</code>",
      v.rules.length + " rule(s)",
      "overlay <code>" + esc(v.criterion) + "</code> at <b>" + esc(v.overlaySeverity) + "</b>",
      v.hasInstructions ? "with a SKILL.md" : "<b>no SKILL.md</b>",
      "provenance <b>" + esc(v.provenance) + "</b>"
    ];
    if (v.sources && v.sources.length) {
      meta.push("derived from " + v.sources.map(function (s) {
        return esc(s.title) + (s.year ? " (" + s.year + ")" : "");
      }).join("; "));
    } else {
      meta.push("<b>declares no source publication</b>");
    }

    html.push(
      '<details class="voice"' + (open || q || sev ? " open" : "") + ">" +
      "<summary><span class=\\"vhead\\"><h2>" + esc(v.title) + '</h2><span class="id">' +
      esc(v.id) + "</span></span>" +
      '<div class="vmeta">' + esc(v.description) + "</div>" +
      '<div class="vmeta">' + meta.join(" &middot; ") + "</div></summary>" +
      renderFlags(v) +
      '<div class="rules">' + rules.map(renderRule).join("") + "</div></details>"
    );
  });

  document.getElementById("out").innerHTML = html.length
    ? html.join("")
    : '<p class="empty">No voice matches this filter.</p>';
  document.getElementById("foot").textContent =
    shownVoices + " voice(s), " + shownRules + " rule(s) shown" +
    (SCOPE ? " \\u2014 scoped to " + SCOPE : "");
}

// A provenance flag, where the declared value sits oddly against what the rules
// cite. Rendered as a QUESTION and never as a defect: the owner ruled on
// 2026-09-21 that this is "a QA flag", because a voice is a synthesis of
// composite voices with unclear attribution, so a mixed citation pattern is
// normal. Four of the five voices here carry none.
function renderFlags(v) {
  if (!v.provenanceFlags || !v.provenanceFlags.length) return "";
  return v.provenanceFlags.map(function (f) {
    return '<p class="pflag"><b>Provenance flag \u2014 for a person to settle.</b> ' +
      "This voice " + esc(f.detail) + ". Rule(s): " +
      f.ruleIds.map(function (id) { return "<code>" + esc(id) + "</code>"; }).join(", ") +
      ".</p>";
  }).join("");
}

function renderRule(r) {
  var chips = [
    '<span class="chip">' + esc(r.category) + "</span>",
    '<span class="chip sev-' + esc(r.severity) + '">' + esc(r.severity) + "</span>"
  ];
  if (r.patterns > 0) chips.push('<span class="chip mech">' + r.patterns + " pattern(s)</span>");
  if (r.terminology > 0) chips.push('<span class="chip mech">' + r.terminology + " term pair(s)</span>");
  if (r.judgementOnly) chips.push('<span class="chip">judgement only</span>');
  if (r.counterintuitive) chips.push('<span class="chip ci">counterintuitive</span>');

  // The citation is what this page exists for, so a rule with none is shown as
  // a FINDING rather than as an empty cell. The schema makes it unreachable;
  // if it ever appears, the schema stopped being enforced somewhere.
  var cite = r.citation === "none"
    ? '<p class="nocite">This rule cites nothing. The schema requires a source, ' +
      "so something is loading voices without validating them.</p>"
    : "<blockquote>" + esc(r.quote) + '<span class="cite">' +
      (r.citation === "library" ? "" : "KG node ") + esc(r.cites) +
      (r.pages ? ", p" + esc(r.pages) : "") +
      (r.citesInstance ? " \\u2014 in " + esc(r.citesInstance) : "") +
      "</span></blockquote>";

  return '<div class="rule"><span class="rtitle">' + esc(r.title) +
    '</span><span class="rid">' + esc(r.id) + "</span>" +
    '<p class="rdesc">' + esc(r.description) + "</p>" +
    '<div class="chips">' + chips.join("") + "</div>" + cite +
    (r.commonError ? '<p class="rdesc"><b>The wrong instinct:</b> ' + esc(r.commonError) + "</p>" : "") +
    "</div>";
}

document.getElementById("q").addEventListener("input", render);
document.getElementById("inst").addEventListener("change", render);
document.getElementById("sev").addEventListener("change", render);
document.getElementById("expand").addEventListener("click", function () {
  var b = this;
  var open = b.getAttribute("data-open") === "1";
  b.setAttribute("data-open", open ? "0" : "1");
  b.textContent = open ? "expand all" : "collapse all";
  render();
});
</script>
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
  const g = readVoicesGraph([ROOT, repoRoot]);
  if (g === null) {
    console.log("  · no voices directory is declared — nothing to publish");
    process.exit(0);
  }

  const site = join(ROOT, siteDirFor(ROOT));
  // The published segment is the DECLARED directory's own name, and THIS
  // instance declares no voices — it derives none, which is the whole point of
  // the move that produced this graph. So the segment is read from the
  // directories the graph found, whose basename is `voices` under every
  // layout that exists. Composing it here would be a second answer to a
  // question the declarations already answer, and `check:declared-paths`
  // would be right to say so.
  const own = directoriesForGraph(ROOT, "voices");
  const seg = own.length > 0
    ? basename(own[0]!)
    : g.directories.length > 0
      ? basename(g.directories[0]!.dir)
      : null;
  if (seg === null) {
    console.log("  · no voices directory to name the published segment — nothing to publish");
    process.exit(0);
  }

  // `<base>/<handler>/<kind>/` — the handler is THIS instance (the machinery),
  // the kind names what it renders. A subject page goes under it and never at
  // `<base>/<subject>/<kind>/`, which is the instance's own themed namespace.
  const handler = readDeclaration(ROOT)?.name;
  if (!handler) {
    console.log("  · this instance declares no name — no handler segment to publish under");
    process.exit(0);
  }
  const { pageDir, dataDir, dataHref } = viewerPlacement(site, `${handler}/${seg}`, seg);
  emit(join(dataDir, "index.json"), JSON.stringify(projection(g), null, 2) + "\n");
  emit(join(pageDir, "index.html"), viewerHtml(dataHref));

  // One page per SUBJECT — the instances whose voices this handler renders.
  // Read from the VOICES rather than from the directory list, so the instance
  // that declares a voices directory and ships none gets no page claiming to
  // show it. It still gets a row in the directories table, which is the
  // honest place for "declared, not present".
  const subjects = [...new Set(g.voices.map((v) => v.instance))].sort();
  for (const subject of subjects) {
    const sub = viewerPlacement(site, `${handler}/${seg}/${subject}`, seg);
    emit(join(sub.pageDir, "index.html"), viewerHtml(sub.dataHref, subject));
  }

  // ── ORPHANS (bean `ankg`) ──────────────────────────────────────────────
  //
  // A subject page the declaration no longer describes. `emit()` cannot see
  // one — it compares only the files it is about to write — so this is asked
  // separately, and in `--check` an orphan is a FINDING rather than silence.
  const { owned, foreign } = orphanSubjectPages(pageDir, subjects);
  for (const name of foreign) {
    // Reported and LEFT. Ownership could not be established from the file, and
    // `deletion-requires-confirmation` is about exactly this case.
    console.error(`  ! ${join(pageDir, name)} is not a subject and does not identify itself — left in place`);
  }
  for (const name of owned) {
    const dir = join(pageDir, name);
    if (check) {
      console.error(`  ✗ ${dir} is an orphan — it serves a subject the declaration no longer describes`);
      stale++;
      continue;
    }
    rmSync(dir, { recursive: true });
    console.log(`  ✗ pruned ${dir}`);
  }

  if (!check) {
    const absent = g.directories.filter((d) => !d.present).length;
    console.log(
      `  ${g.totals.voices} voice(s), ${g.totals.rules} rule(s), ` +
        `${g.totals.citingLibrary} citing an ingested source, ` +
        `${g.totals.citingKgNode} citing a KG node, ` +
        `${subjects.length} subject page(s)` +
        (absent > 0 ? `, ${absent} declared directory(ies) ABSENT` : ""),
    );
  }
  if (stale > 0) {
    console.error(`\n${stale} artefact(s) stale — run \`bun run voices:viz\``);
    process.exit(1);
  }
}
