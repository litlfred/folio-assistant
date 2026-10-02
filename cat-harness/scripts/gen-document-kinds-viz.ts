#!/usr/bin/env bun
/**
 * A viewer over every instance's declared DOCUMENT KINDS.
 *
 * @module scripts/gen-document-kinds-viz
 * @covers document-kinds
 * @graphNode none — a generator over the document-kinds graph, not a schema itself
 *
 * Sibling of `gen-voices-viz.ts`, in its placement: one index under
 * `<site>/<handler>/document-kinds/` and one page per SUBJECT instance under
 * it, each naming the directories it draws (`renders`) and this generator's
 * Tool (`rendered-by`). Static pages — a kind is a short structure, and there
 * is nothing to filter.
 *
 * Generic on purpose: core knows that document kinds exist and never which
 * (`schemas/document-kind.ts`). The WHO DAK and L1 kinds are smart-base's
 * DATA, and this page draws them because smart-base declares them — the same
 * way it would draw any other harness's. Stage D5 of the smart-* separation,
 * #1767, bean `qvxh`.
 *
 * ## What each kind's card must show
 *
 * The structure (fixed or semi-fixed), every section in order with whether it
 * is required, what a section is `computedFrom`, and the sources — the kind's
 * and each section's. A section with no source of its own inherits the kind's,
 * and the card says so rather than leaving it blank.
 *
 * Usage:
 *   bun run document-kinds:viz          # write
 *   bun run document-kinds:viz:check    # fail if a page is stale or orphaned
 */
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";

import {
  DOCUMENT_KIND_COVERAGE_SCHEMA_TAG,
  DocumentKindCoverageSchema,
  DocumentKindSchema,
  type DocumentKind,
  type DocumentKindCoverage,
} from "../schemas/document-kind.ts";
import { directoriesForGraph, instanceRootsIn, readDeclaration, repoRootFor, siteDirFor } from "../schemas/cat-harness.ts";
import { orphanSubjectPages, viewerPlacement } from "./gen-schema-viz.ts";
import { makeEmit, type ViewerNav } from "./viewer-page.ts";
import { withRenders } from "./viewer-declarations.js";

/** This generator's Tool node (`tools/viewers.ts`), named on every page it draws. */
const VIEWER_TOOL = "document-kinds-viewer";
const GRAPH = "document-kinds";

const ROOT = join(import.meta.dir, "..");
const check = process.argv.includes("--check");

export interface KindEntry {
  instance: string;
  /** Repo-relative path of the kind's JSON file. */
  file: string;
  kind: DocumentKind;
  /** Computed reports of how subjects realise this kind, from the same directory. */
  coverage: DocumentKindCoverage[];
}

/** Every declared document kind in the checkout, validated; throws on an invalid one. */
export function readDocumentKinds(repoRoot: string): { kinds: KindEntry[]; dirs: { instance: string; dir: string }[] } {
  const kinds: KindEntry[] = [];
  const dirs: { instance: string; dir: string }[] = [];
  for (const root of instanceRootsIn(repoRoot)) {
    const instance = readDeclaration(root)?.name ?? basename(root);
    for (const dir of directoriesForGraph(root, GRAPH)) {
      dirs.push({ instance, dir });
      if (!existsSync(dir)) continue;
      const coverage: DocumentKindCoverage[] = [];
      for (const f of readdirSync(dir).filter((n) => n.endsWith(".json")).sort()) {
        const path = join(dir, f);
        const raw = JSON.parse(readFileSync(path, "utf-8")) as { $schema?: string };
        // Two families share the directory (graph-kind-registry `nodeSchemas`):
        // the file's own tag says which, never its name.
        const isCoverage = raw.$schema === DOCUMENT_KIND_COVERAGE_SCHEMA_TAG;
        const parsed = (isCoverage ? DocumentKindCoverageSchema : DocumentKindSchema).safeParse(raw);
        if (!parsed.success) {
          throw new Error(`${path} is not a valid ${isCoverage ? "coverage report" : "document kind"}: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
        }
        if (isCoverage) coverage.push(parsed.data as DocumentKindCoverage);
        else kinds.push({ instance, file: relative(repoRoot, path).split(sep).join("/"), kind: parsed.data as DocumentKind, coverage: [] });
      }
      for (const c of coverage) {
        const owner = kinds.find((k) => k.instance === instance && k.kind.id === c.kind);
        if (!owner) throw new Error(`${dir}: a coverage report for kind "${c.kind}" (subject ${c.subject}) names no kind this directory declares`);
        owner.coverage.push(c);
      }
    }
  }
  return { kinds, dirs };
}

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function sourceText(src: { ref: string; locator?: string; note?: string }): string {
  const ref = /^https?:\/\//.test(src.ref) ? `<a href="${esc(src.ref)}">${esc(src.ref)}</a>` : `<code>${esc(src.ref)}</code>`;
  return ref + (src.locator ? `, ${esc(src.locator)}` : "") + (src.note ? ` — ${esc(src.note)}` : "");
}

function kindCard(e: KindEntry): string {
  const k = e.kind;
  const rows = k.sections
    .map(
      (s, i) =>
        `<tr><td>${i + 1}</td><td><b>${esc(s.title)}</b><br><code>${esc(s.id)}</code></td>` +
        `<td>${s.required ? "required" : "optional"}</td><td>${esc(s.description)}` +
        (s.computedFrom ? `<br><span class="m">computed from: ${s.computedFrom.map((c) => `<code>${esc(c)}</code>`).join(", ")}</span>` : "") +
        (s.modelledBy ? `<br><span class="m">modelled by: ${s.modelledBy.map((c) => `<code>${esc(c)}</code>`).join(", ")}</span>` : "") +
        `</td><td>${s.sources ? s.sources.map(sourceText).join("<br>") : '<span class="m">the kind&#39;s sources</span>'}</td></tr>`,
    )
    .join("\n");
  return `<section class="kind" id="${esc(e.instance)}-${esc(k.id)}">
<h2>${esc(k.title)} <code>${esc(k.id)}</code></h2>
<p>${esc(k.description)}</p>
<p class="m"><b>${k.structure}</b> structure · ${k.sections.length} section(s)` +
    (k.extends ? ` · extends <a href="#${esc(e.instance)}-${esc(k.extends)}"><code>${esc(k.extends)}</code></a>` : "") +
    ` · declared by <b>${esc(e.instance)}</b> in <code>${esc(e.file)}</code>` +
    (k.generatedBy ? ` · generated by <code>${esc(k.generatedBy)}</code>` : "") +
    `</p>
<div class="clip"><table class="sec">
<thead><tr><th>#</th><th>Section</th><th></th><th>What it holds</th><th>Source</th></tr></thead>
<tbody>
${rows}
</tbody></table></div>
<p class="m">Sources: ${k.sources.map(sourceText).join("; ")}</p>
${e.coverage.length > 0 ? coverageTable(k, e.coverage) : ""}
</section>`;
}

/** How each subject realises the kind: members per section, and the unplaced remainder. */
function coverageTable(k: DocumentKind, cov: readonly DocumentKindCoverage[]): string {
  const subjects = [...cov].sort((a, b) => a.subject.localeCompare(b.subject));
  const head = subjects.map((c) => `<th>${esc(c.subject)}</th>`).join("");
  const rows = k.sections
    .map((s) => {
      const cells = subjects
        .map((c) => {
          const m = c.sections.find((x) => x.id === s.id)?.members ?? [];
          if (m.length === 0) return '<td class="m">—</td>';
          const list = m.slice(0, 12).map((x) => `<li>${esc(x.label)}</li>`).join("") + (m.length > 12 ? `<li class="m">…and ${m.length - 12} more</li>` : "");
          return `<td><details><summary>${m.length}</summary><ul>${list}</ul></details></td>`;
        })
        .join("");
      return `<tr><td>${esc(s.title)}</td>${cells}</tr>`;
    })
    .join("\n");
  const unplaced = subjects
    .map((c) => `<td>${c.unplaced.length === 0 ? "none" : c.unplaced.map((u) => `${esc(u.group)} ${u.count}`).join(", ")}</td>`)
    .join("");
  const totals = subjects.map((c) => `<td>${c.total}</td>`).join("");
  return `<h3>How each subject realises it</h3>
<p class="m">${esc(subjects[0]!.method)}</p>
<div class="clip"><table class="cov">
<thead><tr><th>Section</th>${head}</tr></thead>
<tbody>
${rows}
<tr><td><b>Unplaced</b></td>${unplaced}</tr>
<tr><td><b>Artefacts classified</b></td>${totals}</tr>
</tbody></table></div>`;
}

export function pageHtml(entries: readonly KindEntry[], scope?: string): string {
  const title = scope ? `Document kinds — ${scope}` : "Document kinds";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
:root { --bg:#fff; --fg:#17191c; --muted:#5b6168; --line:#d9dde2; --panel:#f6f7f9; }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { --bg:#14171a; --fg:#e8eaed; --muted:#9aa2ab; --line:#2e343b; --panel:#1b1f24; }
}
:root[data-theme="dark"] { --bg:#14171a; --fg:#e8eaed; --muted:#9aa2ab; --line:#2e343b; --panel:#1b1f24; }
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--fg); font:15px/1.55 ui-sans-serif, system-ui, sans-serif; }
main { max-width:72rem; margin:0 auto; padding:16px; }
h1 { font-size:1.2rem; margin:8px 0; } h2 { font-size:1.05rem; margin:24px 0 6px; }
.m { color:var(--muted); font-size:.88rem; }
.kind { border-top:1px solid var(--line); padding-top:4px; }
.clip { width:100%; overflow-x:auto; }
table { width:100%; border-collapse:collapse; font-size:.9rem; }
th, td { text-align:left; vertical-align:top; padding:6px 8px; border-bottom:1px solid var(--line); }
th { background:var(--panel); }
code { font-size:.85em; overflow-wrap:anywhere; }
main { min-width:0; overflow-wrap:anywhere; }
/* "overflow-wrap:anywhere" above is for long codes and paths; it also broke the
   narrow number and required/optional cells mid-word ("1 0", "o pt io n al")
   once a kind's source column grew long — dth's does. Those cells never wrap,
   and the section title keeps a width it can be read at. */
.sec td:nth-child(1), .sec td:nth-child(3) { white-space:nowrap; overflow-wrap:normal; }
.sec td:nth-child(2) { min-width:11rem; overflow-wrap:normal; }
/* On a phone a five-column table cannot fit beside the rail: each section
   becomes a stacked card instead, header row hidden, nothing scrolls sideways. */
@media (max-width: 640px) {
  .sec thead { display:none; }
  .sec, .sec tbody, .sec tr, .sec td { display:block; width:100%; }
  .sec tr { border-bottom:1px solid var(--line); padding:6px 0; }
  .sec td { border:0; padding:2px 0; }
}
.cov td, .cov th { white-space:normal; overflow-wrap:normal; }
.cov td:first-child { min-width:9rem; width:30%; }
.cov ul { margin:4px 0 0 1em; padding:0; font-size:.85rem; }
h3 { font-size:.95rem; margin:18px 0 4px; }
</style>
</head>
<body>
<main>
<h1>${esc(title)}</h1>
<p class="m">A document kind is a named structure of sections that a document authored with a harness follows: <b>fixed</b> (exactly these sections) or <b>semi-fixed</b> (these required, others allowed). Every kind and section names its sources.</p>
${entries.length === 0 ? '<p class="m">No document kinds are declared.</p>' : entries.map(kindCard).join("\n")}
</main>
</body>
</html>
`;
}

let stale = 0;

if (import.meta.main) {
  const repoRoot = repoRootFor(ROOT);
  const { kinds, dirs } = readDocumentKinds(repoRoot);
  const handler = readDeclaration(ROOT)?.name;
  if (!handler) {
    console.log("  · this instance declares no name — no handler segment to publish under");
    process.exit(0);
  }
  const site = join(ROOT, siteDirFor(ROOT));
  const { pageDir } = viewerPlacement(site, `${handler}/${GRAPH}`, GRAPH);
  const nav: ViewerNav = { built: basename(ROOT), docsRoot: site };
  const emitPage = (n: ViewerNav) => makeEmit({ check, onStale: () => { stale++; }, nav: n });
  const present = (subject?: string): string[] =>
    // Repo-relative, as every viewer's `renders` is: an absolute path names this
    // machine's checkout, and no page or test can match it anywhere else.
    dirs
      .filter((d) => existsSync(d.dir) && (subject === undefined || d.instance === subject))
      .map((d) => relative(repoRoot, d.dir).split(sep).join("/"));

  emitPage(nav)(join(pageDir, "index.html"), withRenders(pageHtml(kinds), present(), VIEWER_TOOL));
  const subjects = [...new Set(kinds.map((k) => k.instance))].sort();
  for (const subject of subjects) {
    const sub = viewerPlacement(site, `${handler}/${GRAPH}/${subject}`, GRAPH);
    emitPage({ ...nav, instance: subject })(
      join(sub.pageDir, "index.html"),
      withRenders(pageHtml(kinds.filter((k) => k.instance === subject), subject), present(subject), VIEWER_TOOL),
    );
  }
  const { owned, foreign } = orphanSubjectPages(pageDir, subjects);
  for (const name of foreign) console.error(`  ! ${join(pageDir, name)} is not a subject and does not identify itself — left in place`);
  for (const name of owned) {
    const dir = join(pageDir, name);
    if (check) {
      console.error(`  ✗ ${dir} is an orphan — it serves a subject the declarations no longer describe`);
      stale++;
      continue;
    }
    rmSync(dir, { recursive: true });
    console.log(`  ✗ pruned ${dir}`);
  }
  if (!check) console.log(`  ${kinds.length} document kind(s) across ${subjects.length} instance(s)`);
  if (stale > 0) {
    console.error(`\n${stale} page(s) stale — run \`bun run document-kinds:viz\``);
    process.exit(1);
  }
}
