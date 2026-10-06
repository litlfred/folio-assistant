/**
 * The DOCUMENT view of an ingested library entry — what a reader browses.
 *
 * @module scripts/lib/library-document
 *
 * Issue #2302, bean `turh`. Owner, 2026-10-06: an ingested document should be
 * browsable "page by page", with "an overview of figures/tables, the TOC and
 * link to sections, and extracted summaries of each section" — and not for one
 * instance: "it is being ingested into a certain schema, no? that schema needs
 * a visualizer." So this reads the SCHEMA, `pdf-structure/v1`
 * (`schemas/pdf-structure.ts`), and every `library/<slug>/` of every instance
 * that carries a `structure.json` gets the same view.
 *
 * ## What it reads, and only that
 *
 * - `structure.json` — the TOC (with each inferred entry's confidence and
 *   evidence), the sections, `pages[]` (each physical page's printed label),
 *   `figures[]`, and the diagnostics: contents-vs-body alignment, figure
 *   numbering gaps, page-label conflicts.
 * - `summaries.json` (`folio-block-summaries/v1`) — a section's summary, matched
 *   by the section FILE it summarises (`source`), never by position.
 * - `sections/<id>.md` — an EXTRACT (the opening of the section's text) where
 *   no summary exists. An extract is labelled as one: it is the document's own
 *   words cut short, never our writing about it, and a reader must be able to
 *   tell the two apart.
 *
 * ## Two states that must not look alike
 *
 * - an entry with no `structure.json` — `null`, and the viewer shows no
 *   document panel: there is nothing in this schema to show;
 * - a field the artefact does not carry (an older ingestion with no `pages`)
 *   — the key is ABSENT from the projection, and the viewer says "not
 *   recorded for this entry" rather than drawing an empty table.
 *
 * A WITHHELD entry (bean `cw35`) publishes no verbatim text: its extracts are
 * omitted and say so; its structure, labels and our summaries stay.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** How much of a section's text an extract carries. */
export const EXTRACT_CHARS = 420;

export interface DocTocEntry {
  level: number;
  title: string;
  number: string | null;
  page: number | null;
  pageLabel: string | null;
  confidence: number | null;
  evidence: string[] | null;
  source: string;
  /** The section this entry opens, when one was split at it. */
  section: string | null;
}

export interface DocSection {
  id: string;
  number: string | null;
  title: string;
  level: number;
  pageStart: number | null;
  pageEnd: number | null;
  labelStart: string | null;
  labelEnd: string | null;
  words: number;
  summary: { text: string; status: string } | null;
  /** The opening of the section's own text; null when withheld or empty. */
  extract: string | null;
  extractCut: boolean;
}

export interface DocumentView {
  $schema: "folio-library-document/v1";
  id: string;
  title: string | null;
  pages: number;
  tocSource: string | null;
  tocMethod: string | null;
  toc: DocTocEntry[];
  sections: DocSection[];
  pageLabels?: { physical: number; label: string | null; source: string | null; confidence: number }[];
  figures?: { kind: string; number: string; title: string; page: number; pageLabel: string | null; confidence: number; evidence: string[] }[];
  checks: {
    tocAlignment?: Record<string, { count: number; items: string[] }>;
    figureSequenceGaps?: string[];
    pageLabelConflicts?: { count: number; items: string[] };
  };
  withheld: boolean;
}

/** The raw `structure.json` fields this view reads (schemas/pdf-structure.ts). */
interface RawToc { level?: number; title: string; number?: string | null; page?: number | null; page_label?: string | null; confidence?: number | null; evidence?: string[] | null; source?: string }
interface RawSection { id: string; number?: string | null; title: string; level?: number; page_start?: number | null; page_end?: number | null; label_start?: string | null; label_end?: string | null; n_words?: number }
interface RawPage { physical: number; label?: string | null; source?: string | null; confidence?: number }
interface RawFigure { kind: string; number: string; title: string; page: number; page_label?: string | null; confidence: number; evidence?: string[] }
interface RawStructure {
  source?: { pages?: number };
  metadata?: { title?: string };
  toc_source?: string;
  toc?: RawToc[];
  sections?: RawSection[];
  pages?: RawPage[];
  figures?: RawFigure[];
  diagnostics?: {
    toc_inferred_method?: string;
    toc_alignment?: Record<string, { count: number; items: string[] }>;
    figure_sequence_gaps?: string[];
    page_label_conflicts?: { count: number; items: string[] };
  };
}
interface RawSummaries { summaries?: { source?: string; status?: string; narrative?: { text?: string; status?: string } }[] }

function readJson<T>(path: string): T | undefined {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return undefined;
  }
}

/** A section file's body, front matter removed. */
function sectionText(path: string): string | null {
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf8");
  const body = raw.startsWith("---") ? raw.replace(/^---\n[\s\S]*?\n---\n?/, "") : raw;
  const t = body.replace(/\s+/g, " ").trim();
  return t || null;
}

/** Cut at a word boundary, and say whether anything was cut. */
export function extractOf(text: string | null, max = EXTRACT_CHARS): { extract: string | null; cut: boolean } {
  if (!text) return { extract: null, cut: false };
  if (text.length <= max) return { extract: text, cut: false };
  const head = text.slice(0, max);
  const at = head.lastIndexOf(" ");
  return { extract: (at > max * 0.6 ? head.slice(0, at) : head).trimEnd(), cut: true };
}

/**
 * The document view of one entry directory, or null when it carries no
 * `structure.json`. `withheld` suppresses every verbatim extract.
 */
export function readEntryDocument(dir: string, id: string, opts: { withheld?: boolean } = {}): DocumentView | null {
  const s = readJson<RawStructure>(join(dir, "structure.json"));
  if (!s || typeof s !== "object") return null;
  const withheld = !!opts.withheld;

  const summaries = new Map<string, { text: string; status: string }>();
  const sj = readJson<RawSummaries>(join(dir, "summaries.json"));
  for (const r of sj?.summaries ?? []) {
    const src = String(r.source ?? "").replace(/^sections\//, "").replace(/\.md$/, "");
    const text = r.narrative?.text;
    if (src && typeof text === "string" && text.trim()) {
      summaries.set(src, { text, status: String(r.narrative?.status ?? r.status ?? "draft") });
    }
  }

  const sections: DocSection[] = (s.sections ?? []).map((x) => {
    const text = withheld ? null : sectionText(join(dir, "sections", `${x.id}.md`));
    const { extract, cut } = extractOf(text);
    return {
      id: x.id,
      number: x.number ?? null,
      title: x.title,
      level: x.level ?? 1,
      pageStart: x.page_start ?? null,
      pageEnd: x.page_end ?? null,
      labelStart: x.label_start ?? null,
      labelEnd: x.label_end ?? null,
      words: x.n_words ?? 0,
      summary: summaries.get(x.id) ?? null,
      extract,
      extractCut: cut,
    };
  });

  // A TOC entry links to the section split at it: same title, starting on
  // its page. Matched on both, because a title can repeat.
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const toc: DocTocEntry[] = (s.toc ?? []).map((e) => {
    const sec = sections.find((x) => norm(x.title) === norm(e.title) && (e.page == null || x.pageStart === e.page))
      ?? sections.find((x) => norm(x.title) === norm(e.title));
    return {
      level: e.level ?? 1,
      title: e.title,
      number: e.number ?? null,
      page: e.page ?? null,
      pageLabel: e.page_label ?? null,
      confidence: e.confidence ?? null,
      evidence: e.evidence ?? null,
      source: e.source ?? "outline",
      section: sec ? sec.id : null,
    };
  });

  const d = s.diagnostics ?? {};
  const view: DocumentView = {
    $schema: "folio-library-document/v1",
    id,
    title: s.metadata?.title ?? null,
    pages: s.source?.pages ?? 0,
    tocSource: s.toc_source ?? null,
    tocMethod: d.toc_inferred_method ?? null,
    toc,
    sections,
    checks: {},
    withheld,
  };
  if (Array.isArray(s.pages)) {
    view.pageLabels = s.pages.map((p) => ({
      physical: p.physical, label: p.label ?? null, source: p.source ?? null, confidence: p.confidence ?? 0,
    }));
  }
  if (Array.isArray(s.figures)) {
    view.figures = s.figures.map((f) => ({
      kind: f.kind, number: f.number, title: withheld ? "" : f.title, page: f.page,
      pageLabel: f.page_label ?? null, confidence: f.confidence, evidence: f.evidence ?? [],
    }));
  }
  if (d.toc_alignment) view.checks.tocAlignment = d.toc_alignment;
  if (Array.isArray(d.figure_sequence_gaps)) view.checks.figureSequenceGaps = d.figure_sequence_gaps;
  if (d.page_label_conflicts) view.checks.pageLabelConflicts = d.page_label_conflicts;
  return view;
}

/**
 * The viewer's document panel — browser code, embedded verbatim in the page
 * (same pattern and reasons as `library-withheld-view.ts`): a unit test can
 * run the exact text the page runs. Needs `esc` and `$` from the page.
 */
export const DOCUMENT_VIEW_JS = String.raw`
/* THE DOCUMENT PANEL -- issue #2302. See scripts/lib/library-document.ts. */
var DOC = null, DOC_TAB = "contents";
function docHref(id){
  var dir = DATA_HREF.slice(0, DATA_HREF.lastIndexOf("/") + 1);
  return dir + "entries/" + encodeURIComponent(id) + ".doc.json";
}
function pageText(phys, label){
  /* The label a reader sees first; the physical index beside it when they
     differ, because that is what a PDF viewer's page box takes. */
  if (phys == null) return "—";
  return label && String(label) !== String(phys) ? esc(label) + ' <span class="note">(p' + phys + ')</span>' : 'p' + phys;
}
function confPill(c, ev){
  if (c == null) return "";
  var cls = c >= 0.8 ? "ok" : c >= 0.6 ? "info" : "warn";
  return '<span class="pill ' + cls + '" title="' + esc((ev || []).join(", ")) + '">' + c.toFixed(2) + '</span>';
}
function notRecorded(what){
  return '<p class="empty">' + esc(what) + ' not recorded for this entry — it was ingested before this field existed. Re-ingest to add it.</p>';
}
function docContents(d){
  if (!d.toc.length) return '<p class="empty">No table of contents: the PDF carries no outline and none could be inferred.</p>';
  var how = d.tocSource === "outline" ? "the PDF’s own outline"
    : "inferred (" + esc(d.tocMethod || "unknown") + "); each entry’s confidence and the evidence behind it are shown";
  return '<p class="note">Source: ' + how + '.</p><ol class="toc">' + d.toc.map(function(e){
    var t = (e.number ? esc(e.number) + ' ' : '') + esc(e.title);
    var link = e.section ? '<a href="#sec-' + esc(e.section) + '" data-sec="' + esc(e.section) + '">' + t + '</a>' : t;
    return '<li style="margin-left:' + ((e.level - 1) * 1.2) + 'rem">' + link +
      ' <span class="note">' + pageText(e.page, e.pageLabel) + '</span> ' + confPill(e.confidence, e.evidence) + '</li>';
  }).join("") + '</ol>';
}
function docPages(d){
  if (!d.pageLabels) return notRecorded("Page labels");
  var secAt = {}, figAt = {};
  d.sections.forEach(function(s){ if (s.pageStart != null) (secAt[s.pageStart] = secAt[s.pageStart] || []).push(s); });
  (d.figures || []).forEach(function(f){ (figAt[f.page] = figAt[f.page] || []).push(f); });
  return '<table><thead><tr><th>page</th><th>printed label</th><th>sections starting</th><th>figures &amp; tables</th></tr></thead><tbody>' +
    d.pageLabels.map(function(p){
      var secs = (secAt[p.physical] || []).map(function(s){
        return '<a href="#sec-' + esc(s.id) + '" data-sec="' + esc(s.id) + '">' + esc((s.number ? s.number + ' ' : '') + s.title) + '</a>'; }).join('<br>');
      var figs = (figAt[p.physical] || []).map(function(f){ return esc(f.kind + ' ' + f.number); }).join(', ');
      var lab = p.label ? esc(p.label) + ' <span class="note">' + esc(p.source) + '</span>' : '<span class="note">none printed</span>';
      return '<tr><td class="num">' + p.physical + '</td><td>' + lab + '</td><td>' + secs + '</td><td>' + figs + '</td></tr>';
    }).join("") + '</tbody></table>';
}
function docFigures(d){
  if (!d.figures) return notRecorded("Figures and tables");
  if (!d.figures.length) return '<p class="empty">No captions found. Nothing failed — none opens a line with a label and number.</p>';
  var gaps = (d.checks.figureSequenceGaps || []);
  return (gaps.length ? '<p class="note">Numbering gaps in the document: ' + esc(gaps.join(", ")) + '.</p>' : '') +
    '<table><thead><tr><th>kind</th><th>no.</th><th>caption</th><th>page</th><th>confidence</th></tr></thead><tbody>' +
    d.figures.map(function(f){
      return '<tr><td>' + esc(f.kind) + '</td><td>' + esc(f.number) + '</td><td>' + (f.title ? esc(f.title) : '<span class="note">withheld</span>') +
        '</td><td>' + pageText(f.page, f.pageLabel) + '</td><td>' + confPill(f.confidence, f.evidence) + '</td></tr>';
    }).join("") + '</tbody></table>';
}
function docSections(d){
  if (!d.sections.length) return '<p class="empty">No sections.</p>';
  return d.sections.map(function(s){
    var range = s.pageStart == null ? "" : pageText(s.pageStart, s.labelStart) +
      (s.pageEnd != null && s.pageEnd !== s.pageStart ? ' – ' + pageText(s.pageEnd, s.labelEnd) : '');
    var body = s.summary
      ? '<div class="sum"><span class="pill info">summary · ' + esc(s.summary.status) + '</span><p>' + esc(s.summary.text) + '</p></div>'
      : s.extract
        ? '<div class="sum"><span class="pill">extract — the section’s own opening text' + (s.extractCut ? ', cut' : '') + '</span><p>' + esc(s.extract) + (s.extractCut ? '…' : '') + '</p></div>'
        : '<p class="note">' + (d.withheld ? 'Withheld — no text published; no summary yet.' : 'No text and no summary.') + '</p>';
    return '<article id="sec-' + esc(s.id) + '" class="docsec"><h3>' + esc((s.number ? s.number + ' ' : '') + s.title) +
      ' <span class="note">' + range + ' · ' + s.words + ' words</span></h3>' + body + '</article>';
  }).join("");
}
function docChecks(d){
  var c = d.checks, out = [];
  if (c.tocAlignment) {
    var names = { listed_not_found: "Listed on the contents page, not found in the body",
      found_not_listed: "Numbered in the body, missing from the contents page", page_mismatch: "Page differs from the contents page" };
    Object.keys(names).forEach(function(k){
      var v = c.tocAlignment[k]; if (!v) return;
      out.push('<h4>' + names[k] + ' — ' + v.count + '</h4>' + (v.items.length ? '<ul>' + v.items.map(function(i){ return '<li>' + esc(i) + '</li>'; }).join("") + '</ul>' : ''));
    });
  }
  if (c.figureSequenceGaps) out.push('<h4>Figure and table numbering gaps — ' + c.figureSequenceGaps.length + '</h4>' + (c.figureSequenceGaps.length ? '<p>' + esc(c.figureSequenceGaps.join(", ")) + '</p>' : ''));
  if (c.pageLabelConflicts) out.push('<h4>Page-label conflicts — ' + c.pageLabelConflicts.count + '</h4>' + (c.pageLabelConflicts.items.length ? '<ul>' + c.pageLabelConflicts.items.map(function(i){ return '<li>' + esc(i) + '</li>'; }).join("") + '</ul>' : ''));
  return out.length ? '<p class="note">Findings about the DOCUMENT, reported and never corrected — drafts drift.</p>' + out.join("")
    : '<p class="empty">No checks recorded for this entry.</p>';
}
var DOC_TABS = [["contents","Contents",docContents],["pages","Pages",docPages],["figures","Figures & tables",docFigures],["sections","Sections",docSections],["checks","Checks",docChecks]];
function renderDocument(id, d, err){
  var el = $("document");
  /* No structure.json: nothing in this schema to show, a determined answer
     served as a file (absent: true), never a 404 to tell from a failure. */
  if (!err && d && d.absent) { el.hidden = true; return; }
  el.hidden = false;
  if (err) { el.innerHTML = '<h2>Document</h2><p class="empty">Could not read the document view for ' + esc(id) + ' — ' + esc(err) + '. This is a failure to read, not an empty document.</p>'; return; }
  DOC = d;
  var tab = DOC_TABS.filter(function(t){ return t[0] === DOC_TAB; })[0] || DOC_TABS[0];
  el.innerHTML = '<h2>Document — ' + esc(d.title || id) + ' <span class="note">(' + d.pages + ' pages)</span></h2>' +
    '<div class="seg" role="tablist" aria-label="Document view">' + DOC_TABS.map(function(t){
      return '<button type="button" role="tab" aria-selected="' + (t[0] === tab[0]) + '" data-tab="' + t[0] + '">' + esc(t[1]) + '</button>';
    }).join("") + '</div><div class="docbody" role="tabpanel">' + tab[2](d) + '</div>';
  Array.prototype.forEach.call(el.querySelectorAll("[data-tab]"), function(b){
    b.addEventListener("click", function(){ DOC_TAB = b.getAttribute("data-tab"); renderDocument(id, DOC, null); });
  });
  /* A section link from any tab opens the Sections tab at that section. */
  Array.prototype.forEach.call(el.querySelectorAll("[data-sec]"), function(a){
    a.addEventListener("click", function(ev){
      ev.preventDefault(); DOC_TAB = "sections"; renderDocument(id, DOC, null);
      var t = document.getElementById("sec-" + a.getAttribute("data-sec")); if (t) t.scrollIntoView();
    });
  });
}
function loadDocument(id){
  fetch(docHref(id), {cache: "no-store"})
    .then(function(r){ if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function(d){ renderDocument(id, d, null); })
    .catch(function(e){ renderDocument(id, null, String(e && e.message || e)); });
}
`;
