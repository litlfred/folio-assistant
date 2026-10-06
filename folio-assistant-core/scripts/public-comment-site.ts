#!/usr/bin/env bun
/**
 * public-comment-site — add the public review to a built document site: a
 * DASHBOARD of every comment and where it stands, and each comment shown
 * BESIDE the block it is about in the document itself. Bean `v26p`.
 *
 * Run after `build-document-site.ts`, over the same `--out`:
 *
 *   <out>/public-comments/index.html   the dashboard
 *   <out>/<slug>/index.html            gains a comment note at each anchored block
 *
 * ## Why the data is inlined, not fetched
 *
 * The same pages are opened from `file://` on a reviewer's machine and from
 * GitHub Pages. `fetch` fails on the first. A few hundred comments are tens of
 * kilobytes, so they go in the page as JSON.
 *
 * ## Deep links
 *
 * A comment whose decision names a change set gets two links to its anchor:
 * BEFORE on the published `main` site, and AFTER on the change set's staging
 * preview, `STAGING/<slug>/`. The slug is computed exactly as
 * `folio-staging.yml` computes it, so the link is where the preview is. A
 * comment with a discussion URL links it. Every comment also links a GitHub
 * search for its reference, which finds every issue and PR that mentions it.
 *
 * Nothing here decides anything. It renders the store, and the store is moved
 * only by `public-comment.ts`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import type { ReviewAnchors } from "./docx-to-folio.js";
import { type ChangeSet, DECISION_LABELS, IN_EDIT_STATUSES, OPEN_STATUSES, type PublicComment } from "../schemas/public-comment.js";
import { changeSets, discussUrl } from "./public-comment-changesets.js";
import { Store } from "./public-comment.js";
import { darkRules } from "../../cat-harness/scripts/lib/scheme-css.ts";

/** `folio-staging.yml`'s slug rule, step `slug`. */
export const stagingSlug = (branch: string) =>
  branch.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export interface SiteComment {
  ref: string;
  status: string;
  phase: "open" | "editing" | "decided" | "closed";
  type: string;
  target: string | null;
  section: string;
  sectionTitle: string;
  citation: string;
  anchorNote: string;
  confidence: string;
  summary: string;
  text: string;
  suggestion: string;
  reviewer: string;
  recommendations: Array<{ by: string; code: string; rationale: string; url?: string }>;
  decision?: { code: string; label: string; reason: string; by: string };
  /** The change-sets it is in (issue #2183), derived from the change-set records. */
  changeSets: Array<{ id: string; title: string; status: string; issue?: number }>;
  links: { document?: string; before?: string; after?: string; pr?: string; discussion?: string; search?: string; record?: string };
}

export function siteComments(
  all: PublicComment[],
  anchors: ReviewAnchors,
  opts: { slug: string; site?: string; repo?: string; storeDir?: string; changeSets?: ChangeSet[] },
): SiteComment[] {
  const inSets = new Map<string, SiteComment["changeSets"]>();
  for (const cs of opts.changeSets ?? [])
    if (cs.status !== "merged") for (const r of cs.refs) (inSets.get(r) ?? inSets.set(r, []).get(r)!).push({ id: cs.id, title: cs.title, status: cs.status, ...(cs.issue ? { issue: cs.issue } : {}) });
  const blocks = new Map(anchors.blocks.map((b) => [b.label, b]));
  const sections = new Map(anchors.sections.map((s) => [s.label, s]));
  return all.map((c) => {
    const p = c.public;
    const b = c.targetLabel ? blocks.get(c.targetLabel) : undefined;
    const secLabel = b ? b.sections.at(-1) : c.targetLabel && sections.has(c.targetLabel) ? c.targetLabel : undefined;
    const sec = secLabel ? sections.get(secLabel) : undefined;
    const cs = p.decision?.changeSet;
    const frag = c.targetLabel ? `#${encodeURIComponent(c.targetLabel)}` : "";
    const phase = OPEN_STATUSES.includes(c.status)
      ? "open"
      : IN_EDIT_STATUSES.includes(c.status)
        ? "editing"
        : c.status === "decided"
          ? "decided"
          : "closed";
    const site = opts.site?.replace(/\/$/, "");
    return {
      ref: p.ref,
      status: c.status,
      phase,
      type: p.type ?? "",
      target: c.targetLabel,
      section: sec?.number ?? "",
      sectionTitle: sec?.title ?? "",
      citation: p.citation.raw ?? "",
      anchorNote: p.anchor.note ?? p.anchor.method,
      confidence: p.anchor.confidence,
      summary: c.summary,
      text: p.text,
      suggestion: p.suggestedRevision ?? "",
      reviewer: [p.reviewer.name, p.reviewer.organisation, p.reviewer.country].filter(Boolean).join(", ") || "a reviewer",
      recommendations: p.recommendations.map((r) => ({ by: r.by, code: r.code, rationale: r.rationale, ...(r.url ? { url: r.url } : {}) })),
      ...(p.decision ? { decision: { code: p.decision.code, label: DECISION_LABELS[p.decision.code], reason: p.decision.reason, by: p.decision.by } } : {}),
      changeSets: inSets.get(p.ref) ?? [],
      links: {
        ...(c.targetLabel ? { document: `../${opts.slug}/index.html${frag}` } : {}),
        ...(site && c.targetLabel && cs ? { before: `${site}/${opts.slug}/index.html${frag}` } : {}),
        ...(cs ? { after: cs.stagingUrl ? `${cs.stagingUrl.replace(/\/$/, "")}/${opts.slug}/index.html${frag}` : site ? `${site}/STAGING/${stagingSlug(cs.branch)}/${opts.slug}/index.html${frag}` : undefined } : {}),
        ...(cs?.pr && opts.repo ? { pr: `https://github.com/${opts.repo}/pull/${cs.pr}` } : {}),
        ...(p.discussion ? { discussion: p.discussion } : {}),
        ...(opts.repo ? { search: `https://github.com/${opts.repo}/search?type=issues&q=${encodeURIComponent(`"${p.ref}"`)}` } : {}),
        ...(opts.repo && opts.storeDir ? { record: `https://github.com/${opts.repo}/blob/main/${opts.storeDir}/comments/${p.ref}.json` } : {}),
      },
    };
  });
}

const STYLE = `
.cs-pcs > summary { cursor:pointer; }
.cs-pc-list { margin:.3rem 0 .6rem; padding-left:1.1rem; }
.cs-pc { margin:.5rem 0; padding-bottom:.4rem; border-bottom:1px solid #8883; }
.cs-pc p { margin:.25rem 0; }
  :root { color-scheme: light dark; --fg:#1b1b1b; --bg:#fdfdfb; --muted:#5b5b5b; --line:#d6d6d0; --link:#0b5cad; --chip:#eef2f7;
    --open:#9a5b00; --editing:#0b5cad; --decided:#2e6b2e; --closed:#5b5b5b; }
  ${darkRules(`:root { --fg:#e8e8e6; --bg:#161616; --muted:#a8a8a4; --line:#3a3a38; --link:#7db4ff; --chip:#23272e;
    --open:#f0b35a; --editing:#7db4ff; --decided:#8fd18f; --closed:#a8a8a4; }`)}
  body { margin:0; font:1rem/1.5 system-ui,sans-serif; color:var(--fg); background:var(--bg); }
  /* Column and gutters belong to main: the harness rail owns body padding-left. */
  main { max-width:90rem; margin:0 auto; padding:1.5rem 1.5rem 4rem; }
  a { color:var(--link); } a:focus-visible, button:focus-visible, select:focus-visible, input:focus-visible { outline:3px solid var(--link); outline-offset:2px; }
  .tiles { display:flex; flex-wrap:wrap; gap:.75rem; margin:1rem 0; }
  .tile { border:1px solid var(--line); border-radius:.5rem; padding:.5rem .9rem; min-width:7rem; font:inherit; color:var(--fg); background:transparent; text-align:left; cursor:pointer; }
  .tile b { display:block; font-size:1.6rem; }
  .tile:hover { border-color:var(--link); }
  main input[type=checkbox] { min-height:0; width:1.1rem; height:1.1rem; }
  .sr { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }
  #open-issue { font:inherit; padding:.45rem .9rem; border:1px solid var(--link); border-radius:.4rem; background:transparent; color:var(--link); cursor:pointer; }
  #open-issue:disabled { opacity:.5; cursor:default; }
  .tile[aria-pressed="true"] { border-color:var(--link); box-shadow:inset 0 0 0 1px var(--link); background:var(--chip); }
  form { display:flex; flex-wrap:wrap; gap:.75rem; align-items:end; margin:1rem 0; }
  /* Form, table and details rules are scoped to main: the harness rail's header
     is a label too, and a bare label rule stacked it and hid its avatar. */
  main label { display:flex; flex-direction:column; font-size:.85rem; color:var(--muted); }
  main select, main input { font:inherit; padding:.35rem .5rem; color:var(--fg); background:var(--bg); border:1px solid var(--line); border-radius:.35rem; min-height:2.4rem; }
  .table-wrap { overflow-x:auto; }
  main table { border-collapse:collapse; width:100%; font-size:.92rem; }
  main th, main td { border-bottom:1px solid var(--line); padding:.45rem .5rem; text-align:left; vertical-align:top; }
  main th { position:sticky; top:0; background:var(--bg); }
  .phase { font-weight:600; white-space:nowrap; }
  .phase-open { color:var(--open); } .phase-editing { color:var(--editing); } .phase-decided { color:var(--decided); } .phase-closed { color:var(--closed); }
  .chip { display:inline-block; background:var(--chip); border-radius:.3rem; padding:0 .35rem; margin:0 .2rem .2rem 0; font-size:.82rem; }
  main details > summary { cursor:pointer; }
  .muted { color:var(--muted); }
  .links a { margin-right:.5rem; white-space:nowrap; }
`;

/** The dashboard. Filters run in the page; with scripts off the full table still renders. */
export function dashboardHtml(rows: SiteComment[], meta: { title: string; slug: string; generated: string; repo?: string; changeSets?: ChangeSet[] }): string {
  const issueLink = (n: number) => (meta.repo ? `<a href="https://github.com/${esc(meta.repo)}/issues/${n}">#${n}</a>` : `#${n}`);
  // A change-set with an issue links it; one without offers to open it, which
  // is the moment it gets one (issue #2183: "dont create issue until someone
  // comments").
  const csCell = (c: { id: string; title: string; status: string; issue?: number }) =>
    `<span class="chip" title="${esc(c.title)} (${esc(c.status)})"><a href="#${esc(c.id)}">${esc(c.id)}</a>` +
    (c.issue ? ` ${issueLink(c.issue)}` : meta.repo ? ` <a href="${esc(discussUrl(meta.repo, c))}">discuss</a>` : "") +
    `</span>`;
  const sets = (meta.changeSets ?? []).filter((c) => c.status !== "merged");
  const csRows = sets
    .map(
      (c) => `<tr id="${esc(c.id)}" data-cs-status="${esc(c.status)}"><td>${esc(c.id)}</td><td>${esc(c.title)}<details><summary class="muted">requirements</summary><p>${esc(c.requirements).replace(/\n/g, "<br>")}</p></details><details class="cs-pcs" data-refs="${esc(c.refs.join(" "))}"><summary class="muted">its ${c.refs.length} comment${c.refs.length === 1 ? "" : "s"}, in full</summary></details></td><td>${esc(c.status)}</td><td class="cs-n">${c.refs.length}</td>` +
        `<td>${c.issue ? issueLink(c.issue) + (c.issues.length > 1 ? ` <span class="muted">+${c.issues.length - 1} more</span>` : "") : meta.repo ? `<a class="discuss" href="${esc(discussUrl(meta.repo, c))}">Discuss</a>` : "—"}</td>` +
        `<td>${c.pr && meta.repo ? `<a href="https://github.com/${esc(meta.repo)}/pull/${c.pr.number}">#${c.pr.number}</a>` : ""}</td>` +
        `<td><a href="#" class="show-cs" data-refs="${esc(c.refs.join(" "))}">show its comments</a></td></tr>`,
    )
    .join("\n");
  const count = (f: (r: SiteComment) => boolean) => rows.filter(f).length;
  // A tile is a TOGGLE (owner, 2026-10-05: "some of these should be toggable"):
  // pressing it filters the table to what it counts, pressing it again clears
  // that filter. `key` names the filter; the script keeps the tiles and the
  // Status select in step, so whichever filter is on shows as pressed.
  const tile = (n: number, label: string, key: string) =>
    `<button type="button" class="tile" data-tile="${key}" aria-pressed="false" title="Show ${esc(label)}"><b>${n}</b>${esc(label)}</button>`;
  const linkList = (r: SiteComment) =>
    [
      r.links.document && `<a href="${esc(r.links.document)}">in the document</a>`,
      r.links.before && `<a href="${esc(r.links.before)}">before</a>`,
      r.links.after && `<a href="${esc(r.links.after)}">after (staging)</a>`,
      r.links.pr && `<a href="${esc(r.links.pr)}">change set PR</a>`,
      r.links.discussion && `<a href="${esc(r.links.discussion)}">discussion</a>`,
      r.links.search && `<a href="${esc(r.links.search)}">all mentions on GitHub</a>`,
      r.links.record && `<a href="${esc(r.links.record)}">record</a>`,
    ]
      .filter(Boolean)
      .join(" ");
  const body = rows
    .map(
      (r) => `<tr id="${esc(r.ref)}" data-phase="${r.phase}" data-status="${esc(r.status)}" data-placed="${r.target ? "1" : "0"}" data-incs="${r.changeSets.length ? "1" : "0"}" data-summary="${esc(r.summary)}" data-type="${esc(r.type)}" data-section="${esc(r.section)}" data-text="${esc(`${r.ref} ${r.text} ${r.suggestion} ${r.sectionTitle}`.toLowerCase())}">
<td><input type="checkbox" class="pick" value="${esc(r.ref)}" aria-label="Select ${esc(r.ref)}"></td>
<td><a href="#${esc(r.ref)}">${esc(r.ref)}</a></td>
<td class="phase phase-${r.phase}">${esc(r.status)}</td>
<td>${esc(r.type)}</td>
<td>${r.target ? `${esc(r.section)} ${esc(r.sectionTitle)}` : `<em>unplaced</em>`}<br><span class="muted">${esc(r.citation)}</span>${r.confidence !== "high" && r.target ? `<br><span class="chip" title="${esc(r.anchorNote)}">anchor: ${esc(r.confidence)}</span>` : ""}</td>
<td><details><summary>${esc(r.summary)}</summary><p>${esc(r.text)}</p>${r.suggestion ? `<p><b>Suggested revision:</b> ${esc(r.suggestion)}</p>` : ""}<p class="muted">${esc(r.reviewer)}</p></details></td>
<td>${r.recommendations.map((x) => `<span class="chip" title="${esc(x.rationale)}">${x.url ? `<a href="${esc(x.url)}">` : ""}${esc(x.by)}: ${esc(x.code)}${x.url ? "</a>" : ""}</span>`).join("") || `<span class="muted">none</span>`}</td>
<td>${r.decision ? `<b>${esc(r.decision.label)}</b>${r.decision.reason ? `<br>${esc(r.decision.reason)}` : ""}<br><span class="muted">${esc(r.decision.by)}</span>` : `<span class="muted">not yet</span>`}</td>
<td>${r.changeSets.map(csCell).join(" ") || `<span class="muted">none</span>`}</td>
<td class="links">${linkList(r)}</td>
</tr>`,
    )
    .join("\n");
  const sections = [...new Set(rows.map((r) => r.section).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const types = [...new Set(rows.map((r) => r.type).filter(Boolean))].sort();
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Public comments — ${esc(meta.title)}</title>
<style>${STYLE}</style>
</head>
<body>
<main>
<p><a href="../${esc(meta.slug)}/index.html">← ${esc(meta.title)}</a></p>
<h1>Public comments</h1>
<p class="muted">Generated ${esc(meta.generated)} from the comment store. Open = not yet decided. Editing = decided, and the change is being made on a feature branch. Closed = incorporated, duplicate or withdrawn.</p>
<div class="tiles" role="group" aria-label="Filter by count">
${[
  tile(rows.length, "comments", "all"),
  tile(count((r) => r.phase === "open"), "open", "open"),
  tile(count((r) => !r.target), "unplaced", "unplaced"),
  tile(count((r) => r.phase === "editing"), "being edited", "editing"),
  tile(count((r) => r.phase === "decided"), "decided", "decided"),
  tile(count((r) => r.status === "incorporated"), "incorporated", "incorporated"),
  tile(count((r) => r.phase === "open" && !r.changeSets.length), "open, in no change-set", "noissue"),
].join("\n")}
</div>
<form id="filters" aria-controls="comments">
<label>Status<select id="f-phase"><option value="">all</option><option value="open" selected>open</option><option value="editing">being edited</option><option value="decided">decided</option><option value="closed">closed</option></select></label>
<label>Type<select id="f-type"><option value="">all</option>${types.map((t) => `<option>${esc(t)}</option>`).join("")}</select></label>
<label>Section<select id="f-section"><option value="">all</option>${sections.map((s) => `<option>${esc(s)}</option>`).join("")}</select></label>
<label>Search<input id="f-text" type="search" placeholder="words, or PC-0042"></label>
<p id="f-count" class="muted" aria-live="polite"></p>
</form>
${
  sets.length
    ? `<details id="change-sets"><summary><b>Change-sets (${sets.length})</b>: ${["proposed", "discussing", "editing", "incorporated", "closed"].map((st) => `${sets.filter((c) => c.status === st).length} ${st}`).join(", ")}. A change-set gets its GitHub issue the first time somebody discusses it, recommends on it or decides it. <span id="cs-count" class="muted" aria-live="polite"></span></summary>
<div class="table-wrap"><table><thead><tr><th>Id</th><th>Change</th><th>Status</th><th>Comments</th><th>Issue</th><th>PR</th><th></th></tr></thead><tbody>
${csRows}
</tbody></table></div></details>`
    : ""
}
${meta.repo ? `<p class="picker"><button type="button" id="open-issue" disabled>New change-set from the selected comments</button> <span id="pick-count" class="muted">Tick comments to group them.</span></p>` : ""}
<div class="table-wrap">
<table id="comments">
<thead><tr><th><span class="sr">Select</span></th><th>Ref</th><th>Status</th><th>Type</th><th>Where</th><th>Comment</th><th>Committee</th><th>Decision</th><th>Change-set</th><th>Links</th></tr></thead>
<tbody>
${body}
</tbody>
</table>
</div>
</main>
<script>
(() => {
  const REPO = ${JSON.stringify(meta.repo ?? "")};
  const $ = (id) => document.getElementById(id);
  const rows = [...document.querySelectorAll("#comments tbody tr")];
  const csTrs = [...document.querySelectorAll("#change-sets tbody tr")];
  const tiles = [...document.querySelectorAll(".tile[data-tile]")];
  // Tiles that ARE a Status value set the select; the other two are extra filters.
  const PHASE_TILES = ["open", "editing", "decided"];
  let extra = null; // "unplaced" | "incorporated" | "noissue" | null
  let only = null; // a change-set's comments, from "show its comments"
  const active = () => extra ?? ($("f-phase").value || "all");
  const apply = () => {
    const ph = $("f-phase").value, ty = $("f-type").value, se = $("f-section").value, tx = $("f-text").value.trim().toLowerCase();
    let n = 0;
    for (const r of rows) {
      const s = r.dataset.section;
      const ok = (!ph || r.dataset.phase === ph) && (!ty || r.dataset.type === ty)
        && (!se || s === se || s.startsWith(se + ".")) && (!tx || r.dataset.text.includes(tx))
        && (extra !== "unplaced" || r.dataset.placed === "0")
        && (extra !== "incorporated" || r.dataset.status === "incorporated")
        && (extra !== "noissue" || (r.dataset.incs === "0" && r.dataset.phase === "open"))
        && (!only || only.has(r.id));
      r.hidden = !ok; if (ok) n++;
    }
    $("f-count").textContent = n + " of " + rows.length + " shown";
    // The change-sets follow the same filters (smart-ra walkthrough
    // 2026-10-06, bean uphx): a change-set shows when any of its comments
    // does, and its count says how many of them match. Before this the
    // filters moved only the comment table, thousands of pixels below.
    const shown = new Set(rows.filter((r) => !r.hidden).map((r) => r.id));
    let m = 0;
    for (const tr of csTrs) {
      const refs = tr.querySelector("a.show-cs").dataset.refs.split(" ");
      const k = refs.filter((x) => shown.has(x)).length;
      tr.hidden = k === 0; if (k) m++;
      tr.querySelector(".cs-n").textContent = k === refs.length ? String(k) : k + " of " + refs.length;
    }
    if ($("cs-count")) $("cs-count").textContent = "Showing " + m + " of " + csTrs.length + ", by the filters below.";
    const on = active();
    for (const t of tiles) t.setAttribute("aria-pressed", String(t.dataset.tile === on));
  };
  // BACK WORKS (D-3 of the 2026-10-06 walkthrough): every filter change is a
  // history entry whose query string holds the filters, so Back restores the
  // previous view instead of leaving the page. Typing in Search replaces the
  // entry rather than adding one per keystroke.
  const save = (push = true) => {
    const q = new URLSearchParams();
    const put = (k, v) => { if (v) q.set(k, v); };
    q.set("status", $("f-phase").value);
    put("type", $("f-type").value); put("section", $("f-section").value); put("q", $("f-text").value);
    put("tile", extra); put("only", only ? [...only].join(" ") : "");
    const url = "?" + q + location.hash;
    if (url !== location.search + location.hash) history[push ? "pushState" : "replaceState"](null, "", url);
  };
  function load() {
    const q = new URLSearchParams(location.search);
    if (!q.has("status")) return;
    $("f-phase").value = q.get("status"); $("f-type").value = q.get("type") ?? "";
    $("f-section").value = q.get("section") ?? ""; $("f-text").value = q.get("q") ?? "";
    extra = q.get("tile"); only = q.get("only") ? new Set(q.get("only").split(" ")) : null;
    apply();
  }
  for (const t of tiles) t.addEventListener("click", () => {
    const key = t.dataset.tile;
    // Pressing the tile that is on clears it: back to every comment.
    const clear = key === active() || key === "all";
    extra = !clear && !PHASE_TILES.includes(key) ? key : null;
    $("f-phase").value = !clear && PHASE_TILES.includes(key) ? key : "";
    only = null;
    apply(); save();
  });
  $("f-phase").addEventListener("input", () => { extra = null; });
  for (const a of document.querySelectorAll("a.show-cs")) a.addEventListener("click", (e) => {
    e.preventDefault();
    only = new Set(a.dataset.refs.split(" "));
    // Every one of its comments, whatever was filtered before.
    extra = null; for (const id of ["f-phase", "f-type", "f-section", "f-text"]) $(id).value = "";
    apply(); save();
    document.getElementById("comments").scrollIntoView();
  });
  // A CHANGE-SET'S COMMENTS IN FULL, IN PLACE (owner, 2026-10-06: "in addition
  // to jumping to comment from CS you can expand panel to see original PC
  // details (who, what..)", and "that can be dynamic JS load of KG"). The
  // records are LOADED when a panel is first opened, from "comments.json"
  // beside this page (the comment store as published). Opened from file://,
  // where fetch fails, it falls back to the comment rows already on the page.
  let records = null;
  const loadRecords = () => (records ??= fetch("comments.json")
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((list) => new Map(list.map((x) => [x.ref, x])))
    .catch(() => null));
  const h = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const fromRecord = (x) => "<li class=\\"cs-pc\\"><a href=\\"#" + h(x.ref) + "\\">" + h(x.ref) + "</a> · " + h(x.status) + (x.type ? " · " + h(x.type) : "") +
    "<div class=\\"muted\\">" + (x.target ? h(x.section + " " + x.sectionTitle) : "<em>unplaced</em>") + (x.citation ? " — " + h(x.citation) : "") + "</div>" +
    "<p>" + h(x.text) + "</p>" + (x.suggestion ? "<p><b>Suggested revision:</b> " + h(x.suggestion) + "</p>" : "") +
    "<p class=\\"muted\\">" + h(x.reviewer) + "</p>" +
    (x.recommendations && x.recommendations.length ? "<p>" + x.recommendations.map((r) => "<span class=\\"chip\\" title=\\"" + h(r.rationale) + "\\">" + h(r.by) + ": " + h(r.code) + "</span>").join("") + "</p>" : "") +
    "<div class=\\"cs-pc-decision\\">" + (x.decision ? "<b>" + h(x.decision.label) + "</b>" + (x.decision.reason ? " — " + h(x.decision.reason) : "") : "<span class=\\"muted\\">not decided yet</span>") + "</div></li>";
  const fromRow = (ref) => {
    const tr = document.getElementById(ref);
    if (!tr) return "<li>" + h(ref) + " <span class=\\"muted\\">(not on this page)</span></li>";
    const c = tr.cells;
    const body = [...(c[5].querySelector("details")?.children || [])].filter((x) => x.tagName !== "SUMMARY").map((x) => x.outerHTML).join("");
    return "<li class=\\"cs-pc\\"><a href=\\"#" + h(ref) + "\\">" + h(ref) + "</a> · " + c[2].textContent + (c[3].textContent ? " · " + c[3].textContent : "") +
      "<div class=\\"muted\\">" + c[4].innerHTML + "</div>" + body + "<div class=\\"cs-pc-decision\\">" + c[7].innerHTML + "</div></li>";
  };
  document.addEventListener("toggle", async (e) => {
    const d = e.target;
    if (!(d instanceof HTMLDetailsElement) || !d.classList.contains("cs-pcs") || !d.open || d.dataset.built) return;
    d.dataset.built = "1";
    const ul = document.createElement("ul");
    ul.className = "cs-pc-list";
    ul.innerHTML = "<li class=\\"muted\\">Loading…</li>";
    d.append(ul);
    const byRef = await loadRecords();
    ul.innerHTML = d.dataset.refs.split(" ").map((ref) => (byRef && byRef.get(ref) ? fromRecord(byRef.get(ref)) : fromRow(ref))).join("");
  }, true);
  // GROUPING (issue #2183): tick comments, open the "new change-set" issue
  // form prefilled with them. The repository's workflow records the change-set
  // from the form and adopts that issue as its own.
  const picker = $("open-issue");
  if (picker) {
    const picked = () => [...document.querySelectorAll("input.pick:checked")].map((x) => x.value);
    const sync = () => {
      const n = picked().length;
      picker.disabled = n === 0;
      $("pick-count").textContent = n ? n + " selected" : "Tick comments to group them.";
    };
    document.getElementById("comments").addEventListener("change", (e) => { if (e.target.classList.contains("pick")) sync(); });
    picker.addEventListener("click", () => {
      const refs = picked();
      if (!refs.length) return;
      const q = new URLSearchParams({ template: "change-set-new.yml", title: "New change-set: ", comments: refs.join(", ") });
      const url = "https://github.com/" + REPO + "/issues/new?" + q;
      window.open(url, "_blank", "noopener");
    });
    sync();
  }
  // A link to #PC-0042 shows that comment whatever the filters say; a link to
  // #CS-012 opens the change-sets list there.
  if (location.hash.startsWith("#PC-")) $("f-phase").value = "";
  if (location.hash.startsWith("#CS-") && $("change-sets")) { $("change-sets").open = true; document.getElementById(location.hash.slice(1))?.scrollIntoView(); }
  // A select replaces "show its comments" (it used to stay on, hidden, and
  // made every later filter look broken: D-2 of the 2026-10-06 walkthrough);
  // the search box narrows within it.
  for (const id of ["f-phase", "f-type", "f-section"]) $(id).addEventListener("input", () => { only = null; apply(); save(); });
  $("f-text").addEventListener("input", () => { apply(); save(false); });
  addEventListener("popstate", load);
  addEventListener("hashchange", () => { if (location.hash.startsWith("#PC-")) { $("f-phase").value = ""; only = null; extra = null; apply(); } });
  load();
  apply();
})();
</script>
</body>
</html>
`;
}

/**
 * The note beside each anchored block, added to the document page. The
 * comments are inlined as JSON, and a small script places a collapsible note
 * after each block's anchor. With scripts off the document reads as before.
 */
/** Each anchored block's comments, as the document page's notes list them. */
export function notesByTarget(rows: SiteComment[]) {
  const byTarget: Record<string, Array<Pick<SiteComment, "ref" | "status" | "phase" | "type" | "summary" | "decision"> & { sets?: string[] }>> = {};
  for (const r of rows) {
    if (!r.target) continue;
    (byTarget[r.target] ??= []).push({ ref: r.ref, status: r.status, phase: r.phase, type: r.type, summary: r.summary, ...(r.decision ? { decision: r.decision } : {}), ...(r.changeSets.length ? { sets: r.changeSets.map((c) => c.id) } : {}) });
  }
  return byTarget;
}

/**
 * The document page's comment notes. Inline, the page carries every block's
 * list. With `notesUrl` (a lazy page, bean v433) it carries only each block's
 * counts and change-sets, and the list is fetched from that file the first
 * time a note is opened: 545 KB less on the DPI-H document.
 */
export function overlaySnippet(rows: SiteComment[], opts: { repo?: string; issues?: Record<string, number>; notesUrl?: string } = {}): string {
  const byTarget = notesByTarget(rows);
  const head = Object.fromEntries(
    Object.entries(byTarget).map(([label, list]) => [
      label,
      { n: list.length, o: list.filter((c) => c.phase === "open").length, s: [...new Set(list.flatMap((c) => c.sets ?? []))] },
    ]),
  );
  const json = JSON.stringify({ head, lists: opts.notesUrl ? null : byTarget, url: opts.notesUrl ?? null }).replace(/</g, "\\u003c");
  // The change-sets' issues, so a block's [feedback] can point at the
  // discussion that already exists (REQ-17, bean uphx).
  const meta = JSON.stringify({ repo: opts.repo ?? "", issues: opts.issues ?? {} }).replace(/</g, "\\u003c");
  return `
<style>
  .pc-note { border-left:4px solid var(--link,#0b5cad); margin:.4rem 0 .8rem; padding:.2rem .7rem; font-size:.9rem; background:color-mix(in srgb, currentColor 4%, transparent); }
  .pc-note summary { cursor:pointer; font-weight:600; }
  .pc-note ul { margin:.3rem 0; padding-left:1.1rem; }
  .pc-bar { position:sticky; top:0; z-index:1; padding:.4rem 0; background:var(--bg,#fdfdfb); border-bottom:1px solid #8884; margin-bottom:1rem; }
</style>
<script type="application/json" id="pc-data">${json}</script>
<script type="application/json" id="pc-meta">${meta}</script>
<script>
(() => {
  const pc = JSON.parse(document.getElementById("pc-data").textContent);
  const data = pc.head;
  let notes = null;
  const listOf = (label) => pc.lists ? Promise.resolve(pc.lists[label] || [])
    : (notes ??= fetch(pc.url).then((r) => (r.ok ? r.json() : Promise.reject(r.status))).catch(() => ({})))
      .then((all) => all[label] || []);
  const meta = JSON.parse(document.getElementById("pc-meta").textContent);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  // LIGHT ON LOAD (owner, 2026-10-06: ease "2,520 comment notes built all at
  // once"). Each block gets its one-line summary only; the list inside is
  // built the first time the note is opened. Blocks are done in small batches
  // in idle time, so the page never freezes, and a #fragment target is
  // re-scrolled to once at the end because the notes above it moved it.
  const item = (c) => "<li><a href=\\"../public-comments/index.html#" + esc(c.ref) + "\\">" + esc(c.ref) + "</a> · " + esc(c.status) +
    (c.type ? " · " + esc(c.type) : "") + (c.decision ? " · <b>" + esc(c.decision.label) + "</b>" : "") +
    (c.sets ? " · " + c.sets.map((id) => "<a href=\\"../public-comments/index.html#" + esc(id) + "\\">" + esc(id) + "</a>").join(" ") : "") +
    " — " + esc(c.summary) + "</li>";
  const note = (label, h) => {
    const a = document.getElementById(label);
    if (!a) return;
    const host = a.parentElement && a.parentElement.tagName === "P" && a.parentElement.textContent.trim() === "" ? a.parentElement : a;
    const d = document.createElement("details");
    d.className = "pc-note";
    const n = h.o;
    const sum = document.createElement("summary");
    sum.textContent = h.n + " public comment" + (h.n > 1 ? "s" : "") + (n ? " (" + n + " open)" : "");
    d.append(sum);
    d.addEventListener("toggle", () => {
      if (!d.open || d.dataset.built) return;
      d.dataset.built = "1";
      const ul = document.createElement("ul");
      ul.innerHTML = "<li>Loading…</li>";
      d.append(ul);
      listOf(label).then((list) => { ul.innerHTML = list.map(item).join("") || "<li>Could not load the comments.</li>"; });
    });
    host.after(d);
    // Beside the block's [feedback]: the issues where its change-sets are
    // already being discussed, so a reader joins rather than duplicates.
    const acts = document.querySelector('.block-actions[data-block="' + CSS.escape(label) + '"]');
    const nums = [...new Set(h.s.map((id) => meta.issues[id]).filter(Boolean))];
    if (acts && meta.repo && nums.length) {
      const s = document.createElement("span");
      s.className = "ba-existing";
      s.innerHTML = "discussed in " + nums.map((n) => "<a href=\\"https://github.com/" + esc(meta.repo) + "/issues/" + n + "\\">#" + n + "</a>").join(" ");
      acts.append(s);
    }
  };
  const entries = Object.entries(data);
  let total = 0, open = 0;
  for (const [, h] of entries) { total += h.n; open += h.o; }
  const idle = window.requestIdleCallback || ((f) => setTimeout(() => f({ timeRemaining: () => 8 }), 1));
  let i = 0;
  const batch = (deadline) => {
    do { if (i >= entries.length) break; note(entries[i][0], entries[i][1]); i++; } while (deadline.timeRemaining() > 2 || i % 40 !== 0);
    if (i < entries.length) idle(batch);
    else if (location.hash.length > 1) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  };
  idle(batch);
  const bar = document.createElement("div");
  bar.className = "pc-bar";
  bar.innerHTML = '<a href="../public-comments/index.html">Public comments</a>: ' + total + " shown in this document, " + open + " open";
  const main = document.querySelector("main") || document.body;
  main.prepend(bar);
})();
</script>
`;
}

export function buildPublicCommentSite(repo: string, out: string, storeDir?: string) {
  const store = Store.open(repo, storeDir);
  const cfg = store.config() as ReturnType<Store["config"]> & { title?: string };
  const anchors = store.anchors();
  const sets = changeSets(store);
  const rows = siteComments(store.all(), anchors, {
    changeSets: sets,
    slug: cfg.document,
    site: cfg.site,
    repo: cfg.repo,
    storeDir: storeDir ?? "review/public-comment",
  });
  const docPage = join(out, cfg.document, "index.html");
  if (!existsSync(docPage)) throw new Error(`${docPage} is missing: run build-document-site.ts --out ${out} first`);
  const issues = Object.fromEntries(sets.filter((c) => c.issue).map((c) => [c.id, c.issue!]));
  // A lazy document (bean v433) also publishes the whole text on one page,
  // index.hydrated.html; its comment notes are the same.
  for (const f of [docPage, join(out, cfg.document, "index.hydrated.html")]) {
    if (!existsSync(f)) continue;
    const html = readFileSync(f, "utf-8");
    if (html.includes('id="pc-data"')) continue;
    // A lazy page fetches its notes' lists; the one-page version carries them.
    const lazy = html.includes('id="fa-blocks"');
    if (lazy) writeFileSync(join(out, cfg.document, "pc-notes.json"), JSON.stringify(notesByTarget(rows)));
    writeFileSync(f, html.replace("</body>", `${overlaySnippet(rows, { ...(cfg.repo ? { repo: cfg.repo } : {}), issues, ...(lazy ? { notesUrl: "pc-notes.json" } : {}) })}</body>`));
  }
  mkdirSync(join(out, "public-comments"), { recursive: true });
  writeFileSync(
    join(out, "public-comments", "index.html"),
    dashboardHtml(rows, { title: cfg.title ?? cfg.document, slug: cfg.document, ...(cfg.repo ? { repo: cfg.repo } : {}), changeSets: sets, generated: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC" }),
  );
  writeFileSync(join(out, "public-comments", "comments.json"), JSON.stringify(rows, null, 1) + "\n");
  return { comments: rows.length, open: rows.filter((r) => r.phase === "open").length };
}

/**
 * What this builder READS (bean `ehh6`), repo-relative: the comment store,
 * and the folio, where each comment's anchors and block text live. `args` are
 * the ones the build command passes.
 */
export function siteReads(repoRoot: string, args: string[] = []): string[] {
  const opt = (n: string) => {
    const i = args.indexOf(`--${n}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const repo = resolve(repoRoot, opt("repo") ?? ".");
  const rel = (p: string) => relative(repoRoot, p).split("\\").join("/");
  return [rel(resolve(repo, opt("store") ?? "review/public-comment")), rel(join(repo, "folio"))];
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (n: string) => {
    const i = args.indexOf(`--${n}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  if (args.includes("--help")) {
    console.log("usage: bun run folio-assistant-core/scripts/public-comment-site.ts [--repo <folio root>] [--out _site] [--store review/public-comment]");
    process.exit(0);
  }
  const repo = resolve(opt("repo") ?? process.cwd());
  try {
    const r = buildPublicCommentSite(repo, resolve(repo, opt("out") ?? "_site"), opt("store"));
    console.error(`✓ public comments: ${r.comments} (${r.open} open) → public-comments/index.html`);
  } catch (e) {
    console.error(`✗ ${(e as Error).message}`);
    process.exit(1);
  }
}
