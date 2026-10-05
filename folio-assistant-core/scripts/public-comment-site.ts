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
import { join, resolve } from "node:path";

import type { ReviewAnchors } from "./docx-to-folio.js";
import { DECISION_LABELS, IN_EDIT_STATUSES, OPEN_STATUSES, type PublicComment } from "../schemas/public-comment.js";
import { Store } from "./public-comment.js";

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
  links: { document?: string; before?: string; after?: string; pr?: string; discussion?: string; search?: string; record?: string };
}

export function siteComments(
  all: PublicComment[],
  anchors: ReviewAnchors,
  opts: { slug: string; site?: string; repo?: string; storeDir?: string },
): SiteComment[] {
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
  :root { color-scheme: light dark; --fg:#1b1b1b; --bg:#fdfdfb; --muted:#5b5b5b; --line:#d6d6d0; --link:#0b5cad; --chip:#eef2f7;
    --open:#9a5b00; --editing:#0b5cad; --decided:#2e6b2e; --closed:#5b5b5b; }
  @media (prefers-color-scheme: dark) { :root { --fg:#e8e8e6; --bg:#161616; --muted:#a8a8a4; --line:#3a3a38; --link:#7db4ff; --chip:#23272e;
    --open:#f0b35a; --editing:#7db4ff; --decided:#8fd18f; --closed:#a8a8a4; } }
  body { margin:0; font:1rem/1.5 system-ui,sans-serif; color:var(--fg); background:var(--bg); }
  /* Column and gutters belong to main: the harness rail owns body padding-left. */
  main { max-width:90rem; margin:0 auto; padding:1.5rem 1.5rem 4rem; }
  a { color:var(--link); } a:focus-visible, button:focus-visible, select:focus-visible, input:focus-visible { outline:3px solid var(--link); outline-offset:2px; }
  .tiles { display:flex; flex-wrap:wrap; gap:.75rem; margin:1rem 0; }
  .tile { border:1px solid var(--line); border-radius:.5rem; padding:.5rem .9rem; min-width:7rem; }
  .tile b { display:block; font-size:1.6rem; }
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
export function dashboardHtml(rows: SiteComment[], meta: { title: string; slug: string; generated: string }): string {
  const count = (f: (r: SiteComment) => boolean) => rows.filter(f).length;
  const tile = (n: number, label: string) => `<div class="tile"><b>${n}</b>${esc(label)}</div>`;
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
      (r) => `<tr id="${esc(r.ref)}" data-phase="${r.phase}" data-type="${esc(r.type)}" data-section="${esc(r.section)}" data-text="${esc(`${r.ref} ${r.text} ${r.suggestion} ${r.sectionTitle}`.toLowerCase())}">
<td><a href="#${esc(r.ref)}">${esc(r.ref)}</a></td>
<td class="phase phase-${r.phase}">${esc(r.status)}</td>
<td>${esc(r.type)}</td>
<td>${r.target ? `${esc(r.section)} ${esc(r.sectionTitle)}` : `<em>unplaced</em>`}<br><span class="muted">${esc(r.citation)}</span>${r.confidence !== "high" && r.target ? `<br><span class="chip" title="${esc(r.anchorNote)}">anchor: ${esc(r.confidence)}</span>` : ""}</td>
<td><details><summary>${esc(r.summary)}</summary><p>${esc(r.text)}</p>${r.suggestion ? `<p><b>Suggested revision:</b> ${esc(r.suggestion)}</p>` : ""}<p class="muted">${esc(r.reviewer)}</p></details></td>
<td>${r.recommendations.map((x) => `<span class="chip" title="${esc(x.rationale)}">${x.url ? `<a href="${esc(x.url)}">` : ""}${esc(x.by)}: ${esc(x.code)}${x.url ? "</a>" : ""}</span>`).join("") || `<span class="muted">none</span>`}</td>
<td>${r.decision ? `<b>${esc(r.decision.label)}</b>${r.decision.reason ? `<br>${esc(r.decision.reason)}` : ""}<br><span class="muted">${esc(r.decision.by)}</span>` : `<span class="muted">not yet</span>`}</td>
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
<p class="muted">Generated ${esc(meta.generated)} from the comment store. Open = not yet decided. Editing = decided, and the change is being made on a feature branch.</p>
<div class="tiles" role="list">
${[
  tile(rows.length, "comments"),
  tile(count((r) => r.phase === "open"), "open"),
  tile(count((r) => !r.target), "unplaced"),
  tile(count((r) => r.phase === "editing"), "being edited"),
  tile(count((r) => r.phase === "decided"), "decided"),
  tile(count((r) => r.status === "incorporated"), "incorporated"),
]
  .map((t) => t.replace('<div class="tile">', '<div class="tile" role="listitem">'))
  .join("\n")}
</div>
<form id="filters" aria-controls="comments">
<label>Status<select id="f-phase"><option value="">all</option><option value="open" selected>open</option><option value="editing">being edited</option><option value="decided">decided</option><option value="closed">closed</option></select></label>
<label>Type<select id="f-type"><option value="">all</option>${types.map((t) => `<option>${esc(t)}</option>`).join("")}</select></label>
<label>Section<select id="f-section"><option value="">all</option>${sections.map((s) => `<option>${esc(s)}</option>`).join("")}</select></label>
<label>Search<input id="f-text" type="search" placeholder="words, or PC-0042"></label>
<p id="f-count" class="muted" aria-live="polite"></p>
</form>
<div class="table-wrap">
<table id="comments">
<thead><tr><th>Ref</th><th>Status</th><th>Type</th><th>Where</th><th>Comment</th><th>Committee</th><th>Decision</th><th>Links</th></tr></thead>
<tbody>
${body}
</tbody>
</table>
</div>
</main>
<script>
(() => {
  const $ = (id) => document.getElementById(id);
  const rows = [...document.querySelectorAll("#comments tbody tr")];
  const apply = () => {
    const ph = $("f-phase").value, ty = $("f-type").value, se = $("f-section").value, tx = $("f-text").value.trim().toLowerCase();
    let n = 0;
    for (const r of rows) {
      const s = r.dataset.section;
      const ok = (!ph || r.dataset.phase === ph) && (!ty || r.dataset.type === ty)
        && (!se || s === se || s.startsWith(se + ".")) && (!tx || r.dataset.text.includes(tx));
      r.hidden = !ok; if (ok) n++;
    }
    $("f-count").textContent = n + " of " + rows.length + " shown";
  };
  // A link to #PC-0042 shows that comment whatever the filters say.
  if (location.hash.startsWith("#PC-")) $("f-phase").value = "";
  for (const id of ["f-phase", "f-type", "f-section", "f-text"]) $(id).addEventListener("input", apply);
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
export function overlaySnippet(rows: SiteComment[]): string {
  const byTarget: Record<string, Array<Pick<SiteComment, "ref" | "status" | "phase" | "type" | "summary" | "decision">>> = {};
  for (const r of rows) {
    if (!r.target) continue;
    (byTarget[r.target] ??= []).push({ ref: r.ref, status: r.status, phase: r.phase, type: r.type, summary: r.summary, ...(r.decision ? { decision: r.decision } : {}) });
  }
  const json = JSON.stringify(byTarget).replace(/</g, "\\u003c");
  return `
<style>
  .pc-note { border-left:4px solid var(--link,#0b5cad); margin:.4rem 0 .8rem; padding:.2rem .7rem; font-size:.9rem; background:color-mix(in srgb, currentColor 4%, transparent); }
  .pc-note summary { cursor:pointer; font-weight:600; }
  .pc-note ul { margin:.3rem 0; padding-left:1.1rem; }
  .pc-bar { position:sticky; top:0; z-index:1; padding:.4rem 0; background:var(--bg,#fdfdfb); border-bottom:1px solid #8884; margin-bottom:1rem; }
</style>
<script type="application/json" id="pc-data">${json}</script>
<script>
(() => {
  const data = JSON.parse(document.getElementById("pc-data").textContent);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  let total = 0, open = 0;
  for (const [label, list] of Object.entries(data)) {
    const a = document.getElementById(label);
    if (!a) continue;
    total += list.length; open += list.filter((c) => c.phase === "open").length;
    const host = a.parentElement && a.parentElement.tagName === "P" && a.parentElement.textContent.trim() === "" ? a.parentElement : a;
    const d = document.createElement("details");
    d.className = "pc-note";
    const n = list.filter((c) => c.phase === "open").length;
    d.innerHTML = "<summary>" + list.length + " public comment" + (list.length > 1 ? "s" : "") + (n ? " (" + n + " open)" : "") + "</summary><ul>" +
      list.map((c) => "<li><a href=\\"../public-comments/index.html#" + esc(c.ref) + "\\">" + esc(c.ref) + "</a> · " + esc(c.status) +
        (c.type ? " · " + esc(c.type) : "") + (c.decision ? " · <b>" + esc(c.decision.label) + "</b>" : "") + " — " + esc(c.summary) + "</li>").join("") + "</ul>";
    host.after(d);
  }
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
  const cfg = store.config() as ReturnType<Store["config"]> & { repo?: string; title?: string };
  const anchors = store.anchors();
  const rows = siteComments(store.all(), anchors, {
    slug: cfg.document,
    site: cfg.site,
    repo: cfg.repo,
    storeDir: storeDir ?? "review/public-comment",
  });
  const docPage = join(out, cfg.document, "index.html");
  if (!existsSync(docPage)) throw new Error(`${docPage} is missing: run build-document-site.ts --out ${out} first`);
  const html = readFileSync(docPage, "utf-8");
  if (!html.includes('id="pc-data"')) writeFileSync(docPage, html.replace("</body>", `${overlaySnippet(rows)}</body>`));
  mkdirSync(join(out, "public-comments"), { recursive: true });
  writeFileSync(
    join(out, "public-comments", "index.html"),
    dashboardHtml(rows, { title: cfg.title ?? cfg.document, slug: cfg.document, generated: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC" }),
  );
  writeFileSync(join(out, "public-comments", "comments.json"), JSON.stringify(rows, null, 1) + "\n");
  return { comments: rows.length, open: rows.filter((r) => r.phase === "open").length };
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
