#!/usr/bin/env bun
/**
 * A page that makes the published knowledge graph legible.
 *
 * Bean `1dfh`, outstanding item 1: "**No viewer.** This is the dump only, as
 * asked. `kg.json` is the input a viewer would take. Unblocked now."
 *
 * ## Why this is generated rather than committed as a static file
 *
 * The page must fetch the graph document, and that document is named after the
 * repository — `<stub>.jsonld`. A committed page would have to either hardcode
 * one instance's stub (the genericity failure `AGENTS.md` catalogues, where a
 * platform script carried `quantum-observable-universe`), or COMPOSE the name
 * from something at runtime, which is the "resolve, do not compose" rule this
 * project keeps re-learning. Generating it means the exporter — which already
 * knows the stub — writes it in, and the page resolves nothing.
 *
 * It fetches the graph **relative to its own location**, so the same bytes work
 * at `<canonical>/<stub>/` and at `STAGING/<slug>/<stub>/` with no
 * configuration. A staging build that needed a different page would be a
 * staging build testing something other than what ships.
 *
 * **The graph is its PARENT, not its sibling.** The renderings sit at the base
 * — `<base>/<stub>.jsonld` — and the viewer is the directory that makes
 * `<base>/<stub>` a page a browser can open, since GitHub Pages resolves an
 * extensionless URL only to a directory index. So the page reads
 * `../<stub>.jsonld`. It was a sibling while both lived in `kg/`; the relation
 * moved with the layout, which is why it is written here rather than assumed.
 *
 * ## Why no dependencies, and no force-directed graph
 *
 * **No CDN, no framework, no build step.** A page that needs a network fetch
 * to render cannot be opened from a file, cannot be reviewed offline, and adds
 * a third party to the trust boundary of a page whose whole job is to display
 * this repository's own data. Everything here is one HTML file.
 *
 * **1111 nodes and ~2000 edges do not want to be a force-directed graph.**
 * That renders as a hairball: it looks like a knowledge graph and answers no
 * question about one. The questions people actually bring — what is this node,
 * what does it point at, what points at it, what else is of this kind — are
 * answered by a faceted index with a detail panel, and by a ONE-HOP
 * neighbourhood diagram for the selected node, which is small enough to read.
 *
 * ## The viewer reports the graph's own gaps
 *
 * `undeclaredTerms` is rendered, and every property the `@context` does not
 * declare is marked in the detail panel. The first real consumer of a document
 * is the right place to surface what the document is missing: 34 property
 * names, 3461 occurrences, all silently dropped by a JSON-LD processor. A
 * viewer that quietly displayed them as though they were part of the graph
 * would be hiding exactly what it exists to reveal.
 *
 * @module scripts/kg-viewer
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { exportIdentity } from "./kg-export.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The page, with the graph document's filename written in.
 *
 * `stub` is the ONLY thing interpolated. Everything else is static, so the
 * generated file is reviewable as a diff rather than as a template.
 */
export function viewerHtml(stub: string): string {
  const doc = `../${stub}.jsonld`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${stub} — knowledge graph</title>
<style>
  :root {
    --bg: #fbfbfa; --fg: #1a1a18; --dim: #6b6b64; --line: #e0e0da;
    --panel: #ffffff; --accent: #4a6b52; --accent-bg: #edf3ee; --warn: #8a5a00;
    --warn-bg: #fdf4e3;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #17181a; --fg: #e8e8e4; --dim: #9a9a92; --line: #2e3033;
      --panel: #1e2022; --accent: #8fb99a; --accent-bg: #232b25; --warn: #d9a441;
      --warn-bg: #2a2418;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--fg);
    font: 15px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  header { padding: 14px 16px; border-bottom: 1px solid var(--line); }
  h1 { margin: 0 0 2px; font-size: 17px; font-weight: 600; }
  .meta { color: var(--dim); font-size: 12.5px; }
  .meta code { font-size: 12px; }
  main { display: grid; grid-template-columns: 210px minmax(0,1fr) minmax(0,1.15fr); gap: 0; align-items: start; }
  @media (max-width: 860px) { main { grid-template-columns: 1fr; } aside { border-right: none !important; } }
  aside, .list, .detail { padding: 14px 16px; }
  aside, .list { border-right: 1px solid var(--line); }
  h2 { font-size: 11px; letter-spacing: .09em; text-transform: uppercase; color: var(--dim); margin: 0 0 8px; font-weight: 600; }
  .facet { display: block; width: 100%; text-align: left; background: none; border: 0; color: inherit;
           font: inherit; padding: 3px 7px; border-radius: 5px; cursor: pointer; }
  .facet:hover { background: var(--accent-bg); }
  .facet[aria-pressed="true"] { background: var(--accent); color: #fff; }
  .facet .n { float: right; color: var(--dim); font-variant-numeric: tabular-nums; font-size: 12.5px; }
  .facet[aria-pressed="true"] .n { color: #fff; opacity: .85; }
  input[type=search] { width: 100%; padding: 6px 9px; border: 1px solid var(--line);
                       border-radius: 6px; background: var(--panel); color: inherit; font: inherit; }
  ol { list-style: none; margin: 10px 0 0; padding: 0; max-height: 72vh; overflow-y: auto; }
  ol li button { display: block; width: 100%; text-align: left; background: none; border: 0;
                 color: inherit; font: inherit; padding: 4px 7px; border-radius: 5px; cursor: pointer; }
  ol li button:hover { background: var(--accent-bg); }
  ol li button[aria-current="true"] { background: var(--accent); color: #fff; }
  .kind { color: var(--dim); font-size: 12px; }
  ol li button[aria-current="true"] .kind { color: #fff; opacity: .8; }
  .detail { max-height: 88vh; overflow-y: auto; }
  .detail h3 { margin: 0 0 3px; font-size: 16px; }
  .iri { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px;
         color: var(--dim); word-break: break-all; margin-bottom: 12px; }
  table { border-collapse: collapse; width: 100%; font-size: 13.5px; }
  th, td { text-align: left; vertical-align: top; padding: 4px 8px 4px 0; border-bottom: 1px solid var(--line); }
  th { width: 33%; font-weight: 500; color: var(--dim); white-space: nowrap; }
  td { word-break: break-word; }
  .link { background: none; border: 0; padding: 0; font: inherit; color: var(--accent);
          cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
  .undeclared { color: var(--warn); }
  .undeclared::after { content: " ⚠"; }
  .note { background: var(--warn-bg); border: 1px solid var(--warn); color: var(--warn);
          padding: 9px 11px; border-radius: 6px; font-size: 12.5px; margin: 0 0 14px; }
  .note strong { color: inherit; }
  svg { display: block; margin: 14px 0 4px; max-width: 100%; height: auto; }
  svg text { font: 11px ui-sans-serif, system-ui, sans-serif; fill: var(--fg); }
  svg line { stroke: var(--line); stroke-width: 1.5; }
  svg circle { fill: var(--panel); stroke: var(--accent); stroke-width: 1.5; cursor: pointer; }
  svg circle.self { fill: var(--accent); }
  .empty { color: var(--dim); font-style: italic; }
  details > summary { cursor: pointer; color: var(--accent); }
  details > summary code { color: var(--dim); }
  details[open] > summary { margin-bottom: 4px; }
  pre { margin: 0; padding: 8px 10px; background: var(--bg); border: 1px solid var(--line);
        border-radius: 5px; overflow-x: auto; font-size: 12px; line-height: 1.45; max-height: 300px; }
</style>
</head>
<body>
<header>
  <h1 id="title">${stub} — knowledge graph</h1>
  <div class="meta" id="meta">loading <code>${doc}</code>…</div>
</header>
<main>
  <aside><h2>Kind</h2><div id="facets"></div></aside>
  <div class="list">
    <h2>Nodes</h2>
    <input type="search" id="q" placeholder="search name, id, title…" autocomplete="off">
    <ol id="list"></ol>
  </div>
  <div class="detail" id="detail"><p class="empty">Select a node.</p></div>
</main>
<script>
"use strict";
// The document is a SIBLING of this page — never an absolute URL and never a
// composed one. The same bytes therefore work at the canonical base and under
// STAGING/<slug>/ with no configuration.
const DOC = ${JSON.stringify(doc)};

const el = (id) => document.getElementById(id);
let G = [], byId = new Map(), backlinks = new Map(), declared = new Set(),
    linkTerms = new Set(), kind = null, sel = null, undeclared = [];

const short = (iri) => String(iri).includes("#") ? String(iri).split("#").pop() : String(iri);
const typeOf = (n) => short(n["@type"] ?? "").split("/").pop();
const label = (n) => n.title ?? n.name ?? n.localId ?? short(n["@id"]);

fetch(DOC)
  .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
  .then(init)
  .catch((e) => {
    // Three states, not two: a graph that could not be LOADED is never drawn
    // as an empty graph. An empty index and a failed fetch look identical on
    // screen and mean opposite things.
    el("meta").innerHTML =
      '<span class="undeclared">could not load <code>' + DOC + "</code> — " + String(e.message) + "</span>";
    el("detail").innerHTML = '<p class="empty">The graph could not be read, so nothing is shown. ' +
      "This is not an empty graph.</p>";
  });

function init(doc) {
  G = doc["@graph"] ?? [];
  const ctx = doc["@context"] ?? {};
  declared = new Set(Object.keys(ctx).filter((k) => !k.startsWith("@")));
  for (const [k, v] of Object.entries(ctx)) {
    if (v && typeof v === "object" && v["@type"] === "@id") linkTerms.add(k);
  }
  undeclared = doc.undeclaredTerms ?? [];

  for (const n of G) byId.set(n["@id"], n);
  // Back-links are computed here rather than published: they are derivable, and
  // a stored inverse is a second copy that can disagree with the first.
  for (const n of G) {
    for (const t of linkTerms) {
      for (const v of [].concat(n[t] ?? [])) {
        if (!byId.has(v)) continue;
        if (!backlinks.has(v)) backlinks.set(v, []);
        backlinks.get(v).push({ from: n["@id"], via: t });
      }
    }
  }

  const bits = [G.length + " nodes"];
  if (doc.sourceCommitSha) bits.push("commit " + String(doc.sourceCommitSha).slice(0, 8));
  if (doc.sourceTreeDirty) bits.push("tree dirty");
  if (doc.generatedAt) bits.push(String(doc.generatedAt).slice(0, 19).replace("T", " ") + "Z");
  el("meta").textContent = bits.join(" · ");
  if (doc["@type"] && String(doc["@type"]).includes("Preview")) {
    el("title").textContent += " (preview)";
  }

  drawFacets(doc.counts ?? {});
  el("q").addEventListener("input", drawList);
  drawList();
}

function drawFacets(counts) {
  const f = el("facets");
  f.innerHTML = "";
  const add = (name, n, value) => {
    const b = document.createElement("button");
    b.className = "facet";
    b.type = "button";
    b.setAttribute("aria-pressed", String(kind === value));
    b.innerHTML = '<span class="n">' + n + "</span>" + name;
    b.onclick = () => { kind = kind === value ? null : value; drawFacets(counts); drawList(); };
    f.appendChild(b);
  };
  add("All", G.length, null);
  for (const [t, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) add(t, n, t);
}

function matches(n, q) {
  if (kind !== null && typeOf(n) !== kind) return false;
  if (!q) return true;
  return (label(n) + " " + short(n["@id"]) + " " + (n.description ?? "")).toLowerCase().includes(q);
}

function drawList() {
  const q = el("q").value.trim().toLowerCase();
  const hits = G.filter((n) => matches(n, q));
  const ol = el("list");
  ol.innerHTML = "";
  el("list").setAttribute("data-count", String(hits.length));
  if (hits.length === 0) {
    ol.innerHTML = '<li class="empty">No node matches.</li>';
    return;
  }
  for (const n of hits.slice(0, 400)) {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-current", String(n["@id"] === sel));
    b.innerHTML = escape(label(n)) + ' <span class="kind">' + escape(typeOf(n)) + "</span>";
    b.onclick = () => select(n["@id"]);
    li.appendChild(b);
    ol.appendChild(li);
  }
  if (hits.length > 400) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "… and " + (hits.length - 400) + " more; narrow the search.";
    ol.appendChild(li);
  }
}

function escape(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

function select(id) {
  sel = id;
  drawList();
  const n = byId.get(id);
  const d = el("detail");
  if (!n) { d.innerHTML = '<p class="empty">No such node.</p>'; return; }

  let h = "<h3>" + escape(label(n)) + "</h3>";
  h += '<div class="iri">' + escape(n["@id"]) + "</div>";

  const undeclaredHere = Object.keys(n).filter((k) => !k.startsWith("@") && !declared.has(k));
  if (undeclaredHere.length > 0) {
    h += '<p class="note"><strong>' + undeclaredHere.length + " of this node's properties are not in the " +
      "<code>@context</code></strong>, so a JSON-LD processor drops them. They are shown below, marked. " +
      "Across the graph: " + undeclared.length + " such property names.</p>";
  }

  h += "<table><tbody>";
  h += row("type", escape(typeOf(n)), false);
  for (const [k, v] of Object.entries(n)) {
    if (k.startsWith("@")) continue;
    h += row(k, value(k, v), !declared.has(k));
  }
  const back = backlinks.get(id) ?? [];
  if (back.length > 0) {
    h += row("← referenced by", back.map((b) =>
      btn(b.from, label(byId.get(b.from)) + " (" + b.via + ")")).join("<br>"), false);
  }
  h += "</tbody></table>";
  d.innerHTML = h + neighbourhood(n, back);
  for (const b of d.querySelectorAll("[data-goto]")) b.onclick = () => select(b.getAttribute("data-goto"));
}

function row(k, v, flag) {
  return "<tr><th" + (flag ? ' class="undeclared"' : "") + ">" + escape(k) + "</th><td>" + v + "</td></tr>";
}

function btn(id, text) {
  return '<button class="link" type="button" data-goto="' + escape(id) + '">' + escape(text) + "</button>";
}

function value(key, v) {
  if (Array.isArray(v)) return v.length === 0 ? '<span class="empty">none</span>' : v.map((x) => value(key, x)).join("<br>");
  // A nested object goes behind a disclosure, pretty-printed.
  //
  // Dumping it inline was the first thing that showed up when the page was
  // actually LOOKED AT rather than reasoned about: a Tool's \`io\` is ~900
  // characters of JSON, and rendering it raw pushed \`satisfies\` and the
  // neighbourhood diagram off the bottom of the screen. The most interesting
  // property on the node was the one that made the node unreadable.
  if (v !== null && typeof v === "object") {
    const pretty = JSON.stringify(v, null, 2);
    const oneLine = JSON.stringify(v);
    const summary = oneLine.length <= 70 ? oneLine : oneLine.slice(0, 67) + "\u2026";
    return "<details><summary><code>" + escape(summary) + "</code></summary><pre>" +
      escape(pretty) + "</pre></details>";
  }
  if (linkTerms.has(key) && byId.has(v)) return btn(v, label(byId.get(v)));
  if (typeof v === "string" && /^https?:\\/\\//.test(v)) {
    return '<a href="' + escape(v) + '" rel="noreferrer">' + escape(short(v)) + "</a>";
  }
  return escape(v);
}

/**
 * One hop, drawn. Deliberately not the whole graph — see the module note.
 */
function neighbourhood(n, back) {
  const out = [];
  for (const t of linkTerms) {
    for (const v of [].concat(n[t] ?? [])) if (byId.has(v)) out.push({ id: v, via: t, dir: "out" });
  }
  const nodes = out.concat(back.map((b) => ({ id: b.from, via: b.via, dir: "in" }))).slice(0, 14);
  if (nodes.length === 0) return '<p class="empty">No links to or from this node.</p>';

  const W = 560, cx = W / 2, cy = 150, R = 112;
  let s = '<svg viewBox="0 0 ' + W + ' 300" role="img" aria-label="one-hop neighbourhood">';
  nodes.forEach((m, i) => {
    const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R * 0.82;
    s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x + '" y2="' + y + '"></line>';
  });
  s += '<circle class="self" cx="' + cx + '" cy="' + cy + '" r="7"></circle>';
  nodes.forEach((m, i) => {
    const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R * 0.82;
    const anchor = Math.abs(Math.cos(a)) < 0.3 ? "middle" : (Math.cos(a) > 0 ? "start" : "end");
    const dx = anchor === "middle" ? 0 : (Math.cos(a) > 0 ? 10 : -10);
    s += '<circle cx="' + x + '" cy="' + y + '" r="5" data-goto="' + escape(m.id) + '"></circle>';
    s += '<text x="' + (x + dx) + '" y="' + (y + (anchor === "middle" ? (Math.sin(a) > 0 ? 17 : -9) : 4)) +
      '" text-anchor="' + anchor + '">' + escape(String(label(byId.get(m.id))).slice(0, 26)) + "</text>";
  });
  s += "</svg>";
  return s;
}
</script>
</body>
</html>
`;
}

if (import.meta.main) {
  const arg = (f: string): string | undefined => {
    const i = process.argv.indexOf(f);
    return i !== -1 ? process.argv[i + 1] : undefined;
  };
  const { stub } = exportIdentity({ baseUrl: arg("--base-url") ?? process.env.KG_BASE_URL });
  const out = arg("--out") ?? join(ROOT, "_kg", stub, "index.html");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, viewerHtml(stub));
  console.log(`KG viewer → ${relative(ROOT, out)}\n  reads  ../${stub}.jsonld  (parent, resolved at load)`);
}
