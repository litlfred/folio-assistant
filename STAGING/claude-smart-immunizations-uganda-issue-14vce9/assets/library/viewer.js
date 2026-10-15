"use strict";
var G = null, SORT = { key: "id", dir: 1 }, VIEW = "list";
/* THE PAGE'S IDENTITY, and the only thing a page carries -- owner,
   2026-10-02 (#1881): every page is a thin shell that loads its content from
   the published assets. A JSON data block rather than script, so a shell
   holds no code of its own. DATA_HREF is made ABSOLUTE here, once, before
   anything can rewrite the address bar (see honourAddress). */
var CONFIG = (function(){
  var el = document.getElementById("fa-library-config");
  try { return JSON.parse(el ? el.textContent : "{}") || {}; } catch (_e) { return {}; }
})();
var DATA_HREF = new URL(String(CONFIG.data || ""), location.href).href;
/* The SUBJECT this page is scoped to, or "" for the handler's whole view.
   One projection serves both — a second JSON per subject would be the same
   facts written N+1 times, free to disagree the moment one is regenerated. */
var SCOPE = typeof CONFIG.scope === "string" ? CONFIG.scope : "";
function inScope(x){ return !SCOPE || x.instance === SCOPE; }
/* THE SITE ROOT, derived from the projection's own relative address rather
   than declared -- the page is served at more than one depth, and DATA_HREF
   is already the one path that is right at every one of them. */
var SITE_ROOT = new URL(DATA_HREF.slice(0, DATA_HREF.length - "assets/library/index.json".length)).pathname;
/* An entry's avatar URL, or "". The projection carries a SITE-ROOT path
   (library-graph.ts avatarOf), absent when there is no picture or the site
   does not serve it; nothing is guessed here either. */
function avatarUrl(e){
  var h = e.avatar && typeof e.avatar.href === "string" ? e.avatar.href : "";
  return h.charAt(0) === "/" ? SITE_ROOT + h.slice(1) : "";
}
var BOOK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg>';
/* A cover that fails to load falls back to the glyph. ONE capturing listener
   rather than an inline onerror per image: 'error' does not bubble, and an
   inline handler is a script-src relaxation this site does not make. */
document.addEventListener("error", function(ev){
  var t = ev.target;
  if (t && t.tagName === "IMG" && t.parentNode && t.parentNode.classList &&
      t.parentNode.classList.contains("lib-ava")) t.parentNode.innerHTML = BOOK_SVG;
}, true);
function avatarHtml(e){
  var u = avatarUrl(e);
  return '<span class="lib-ava">' + (u
    ? '<img src="' + esc(u) + '" alt="" loading="lazy">'
    : BOOK_SVG) + "</span>";
}
/* A REFERENCED entry's own links -- the published IG, this site's artefact
   index. Owner, 2026-10-02. An entry recorded by reference holds nothing to
   open, so without these its row names a thing and goes nowhere. A site path
   (leading slash) is composed against SITE_ROOT like an avatar; anything
   else must be http(s), so a record cannot put a script URL in an href. */
function linkHref(h){
  h = typeof h === "string" ? h : "";
  if (h.charAt(0) === "/") return SITE_ROOT + h.slice(1);
  return /^https?:[/][/]/i.test(h) ? h : "";
}
function linksHtml(e){
  return (e.links || []).map(function(l){
    var h = linkHref(l.href);
    return h ? ' <a class="src" href="' + esc(h) + '">' + esc(l.label) + "</a>" : "";
  }).join("");
}
/* EVERY ENTRY HAS ITS OWN IRI, AND IT IS A PATH -- owner, 2026-10-02
   (#1881): "each asset gets its own IRI", "no query strings", materialized
   on gh-pages rather than routed by a 404. The generator writes a shell at
   <library>/<instance>/<id>/ for every entry, so a row links there. LIB_ROOT
   is the library's own directory, given relative to the page by CONFIG and
   resolved once against where the page was LOADED. */
var LIB_ROOT = new URL(String(CONFIG.libRoot || "./"), location.href).pathname;

function entryFromPath(pathname, libRoot){
  if (typeof pathname !== "string" || typeof libRoot !== "string" || !libRoot) return null;
  if (pathname.indexOf(libRoot) !== 0) return null;
  var rest = pathname.slice(libRoot.length).replace(/index\.html$/, "").replace(/\/+$/, "");
  var parts = rest.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  try {
    return { instance: decodeURIComponent(parts[0]), id: decodeURIComponent(parts[1]) };
  } catch (_e) {
    return null;
  }
}
function legacyKey(hash){
  var raw = String(hash || "").replace(/^#/, "");
  if (!raw) return "";
  var key;
  try { key = decodeURIComponent(raw); } catch (_e) { key = raw; }
  return /^[^/]+\/[^/]+$/.test(key) ? key : "";
}

function entryHref(e){
  return LIB_ROOT + encodeURIComponent(e.instance) + "/" + encodeURIComponent(e.id) + "/";
}
function $(i){ return document.getElementById(i); }
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function kb(n){ return n >= 1048576 ? (n/1048576).toFixed(1)+" MB" : Math.round(n/1024)+" KB"; }

/* The three-state OCR display jbx2 asks for. "Never scanned" is a DETERMINED
   answer, not a failure, and an ocr/ directory that exists and is empty is a
   third answer again — so none of the three is styled as an error. */
function ocrState(e){
  if (!e.hasOcr) return { label: "not scanned", cls: "" };
  if (e.ocrPages > 0) return { label: e.ocrPages + " OCR pages", cls: "info" };
  return { label: "ocr/ present, empty", cls: "warn" };
}
/* Three states again, and the middle one is the point of the whole column.
   The library is L1 because every reference to a source resolves through it,
   so a slug nothing names is a slug that claim is NOT true of -- a finding
   rather than a blank. A scan that did not run is a third answer: the
   projection carries no refScan, so nobody looked.
   (No backticks in here. See the warning at the top of viewerHtml.) */
function refState(e){
  if (!e.referencedBy) return { label: "not scanned", cls: "", n: -1 };
  var n = e.referencedBy.length;
  if (n === 0) return { label: "referenced by nothing", cls: "warn", n: 0 };
  var kinds = {};
  e.referencedBy.forEach(function(r){ kinds[r.kind] = (kinds[r.kind]||0) + 1; });
  var parts = Object.keys(kinds).sort().map(function(k){ return kinds[k] + " " + k; });
  return { label: parts.join(", "), cls: "ok", n: n };
}
function uploadState(e){
  return {
    match:   { label: "source verified", cls: "ok" },
    differs: { label: "source DIFFERS", cls: "warn" },
    absent:  { label: "source not in a queue", cls: "warn" },
    unknown: { label: "no source named", cls: "" }
  }[e.upload] || { label: e.upload, cls: "" };
}

var COLS = [
  /* THE SLUG OPENS THE ENTRY'S VISUALISER -- e.view, generated per entry by
     the projection (owner, 2026-10-02: "click on smart-trust slug and open
     up the visualizer"). A site-root path, composed like an avatar; an entry
     whose projection carries none keeps a plain slug. */
  { k:"id",       t:"slug",     n:false, f:function(e){
      var v = typeof e.view === "string" && e.view.charAt(0) === "/" ? SITE_ROOT + e.view.slice(1) : "";
      var s = '<span class="slug">'+esc(e.id)+"</span>";
      return avatarHtml(e) + (v ? '<a class="lib-view" href="'+esc(v)+'">'+s+"</a>" : s); } },
  /* Bean qgjh: an entry can be OPENED. The title is a link to the item's own
     page (its generated README) where one exists, and the document's upstream
     record rides beside it: arXiv or DOI, from the identifier its manifest
     records. Nothing is linked that the projection does not carry. */
  { k:"title",    t:"title",    n:false, c:"t-title", f:function(e){
      /* THE TITLE OPENS THE ENTRY'S OWN PAGE -- its path IRI (#1881). It
         used to open the item's README on GitHub, which a referenced entry
         may not have (owner, 2026-10-02: the smart-trust title went to a
         404). The README stays as a secondary link, only when one exists. */
      var t = '<a class="lib-title" href="'+esc(entryHref(e))+'">'+esc(e.title)+"</a>";
      var src = e.arxiv ? "https://arxiv.org/abs/"+encodeURIComponent(e.arxiv) : e.doi ? "https://doi.org/"+e.doi : "";
      return t + (src ? ' <a class="src" href="'+esc(src)+'">source</a>' : "") +
        (e.readme ? ' <a class="src" href="'+esc(e.readme)+'">README</a>' : "") + linksHtml(e);
    } },
  { k:"instance", t:"instance", n:false, f:function(e){ return '<span class="pill">'+esc(e.instance)+"</span>"; } },
  { k:"rung",     t:"rung",     n:false, f:function(e){ return '<span class="pill '+(e.rung==="none"?"warn":"ok")+'">'+esc(e.rung)+"</span>"; } },
  { k:"sections", t:"sections", n:true },
  { k:"blocks",   t:"blocks",   n:true },
  { k:"images",   t:"images",   n:true },
  { k:"ocrPages", t:"ocr",      n:true, f:function(e){ var s=ocrState(e); return '<span class="pill '+s.cls+'">'+esc(s.label)+"</span>"; } },
  { k:"pageEnd",  t:"pages",    n:true, f:function(e){ return e.pageStart==null?'<span class="pill">—</span>':esc(e.pageStart+"–"+e.pageEnd); } },
  { k:"words",    t:"words",    n:true, f:function(e){ return e.words.toLocaleString(); } },
  { k:"bytes",    t:"size",     n:true, f:function(e){ return kb(e.bytes); } },
  { k:"refCount", t:"referenced by", n:true, c:"t-refs", f:function(e){ var s=refState(e);
      /* The referencing files used to ride in a title attribute, which touch
         and keyboard readers cannot reach (bean gnqa, finding 6). A details
         element is focusable and opens on tap, Enter or Space. */
      var refs = e.referencedBy || [];
      var pill = '<span class="pill '+s.cls+'">'+esc(s.label)+"</span>";
      if (!refs.length) return pill;
      return '<details class="refs"><summary>'+pill+'</summary><ul>' + refs.map(function(r){
        return "<li>"+esc(r.from)+" ("+r.count+")</li>"; }).join("") + "</ul></details>"; } },
  { k:"upload",   t:"source",   n:false, c:"t-source", f:function(e){ var s=uploadState(e);
      return '<span class="pill '+s.cls+'">'+esc(s.label)+"</span>"+(e.sourceFile?'<br><span class="slug" style="font-size:.72rem;color:var(--muted)">'+esc(e.sourceFile)+"</span>":""); } }
];

function rows(){
  var q = $("q").value.trim().toLowerCase();
  var r = G.entries.filter(function(e){
    if (!inScope(e)) return false;
    if (!q) return true;
    return (e.id+" "+e.title+" "+(e.extractedTitle||"")+" "+e.sourceFile+" "+e.docId+" "+e.instance).toLowerCase().indexOf(q) >= 0;
  });
  var k = SORT.key, d = SORT.dir;
  return r.sort(function(a,b){
    var x=a[k], y=b[k];
    if (typeof x === "number" && typeof y === "number") return (x-y)*d;
    return String(x==null?"":x).localeCompare(String(y==null?"":y))*d;
  });
}

function renderList(){
  var r = rows();
  var h = "<table><thead><tr>" + COLS.map(function(c){
    var sorted = SORT.key === c.k;
    return "<th" + (sorted ? ' aria-sort="'+(SORT.dir>0?"ascending":"descending")+'"' : "") +
      '><button type="button" data-k="'+c.k+'">'+esc(c.t)+"</button></th>";
  }).join("") + "</tr></thead><tbody>";
  h += r.map(function(e){
    /* THE ROW DECLARES ITSELF, and the folio reads nothing else.
       A selector guessing at cell positions would bind to this generator's
       markup and break silently the next time a column moves; an attribute
       is a contract. docs-ui.js decorates any row carrying these and
       ignores every page that has none -- so this generator knows nothing
       about the folio beyond emitting three attributes. R30, bean j2if. */
    var key = e.instance + "/" + e.id;
    /* THE HREF IS THIS PAGE, ANCHORED -- and it is composed from
       location.pathname rather than declared anywhere.

       Measured 2026-09-22 before choosing: an ingested library document has
       NO published page of its own. Nothing writes one; this viewer is the
       only thing that renders these entries at all. So there was no stale
       URL to fix, there was no URL. The owner named the reason a per-asset
       route was the wrong shape -- "asset has too much drift" -- and ruled
       the route belongs to the HARNESS.

       cat-harness owns this viewer, so the viewer IS the asset's address.
       Composing it from the page's own location means the same generator
       emits both the row and the page it points at, and a reader arriving
       at the anchor gets the row selected rather than a 404. Nothing to
       declare, so nothing to drift -- the folio-mount's argument for
       deriving its root, applied one level in.

       Since 2026-10-02 the address is the entry's PATH (entryHref above),
       which the generator backs with a page that lands on this same anchor
       -- so the anchor is still the contract, and the path is a name a
       person can type and share. */
    var href = entryHref(e);
    /* data-fa-pullout-host puts the pull-out control in the FIRST cell.
       It used to land in the last one, which on a table wider than the
       screen is past its right edge -- the owner could not find a way onto
       the glass at all (issue #1006). */
    return '<tr data-fa-library-item="' + esc(key) + '"' +
      ' data-fa-library-href="' + esc(href) + '"' +
      ' data-fa-library-avatar="' + esc(avatarUrl(e)) + '"' +
      ' data-fa-library-title="' + esc(e.title || e.id) + '">' + COLS.map(function(c, i){
      var cls = i === 0 ? "lib-first" : [c.n ? "num" : "", c.c || ""].join(" ").trim();
      return "<td" + (cls ? ' class="'+cls+'"' : "") + (i === 0 ? " data-fa-pullout-host" : "") +
        ' data-label="'+esc(c.t)+'">' + (c.f ? c.f(e) : esc(e[c.k])) + "</td>";
    }).join("") + "</tr>";
  }).join("") || '<tr><td colspan="'+COLS.length+'"><p class="empty">Nothing matches.</p></td></tr>';
  $("listing").innerHTML = h + "</tbody></table>";
}

function renderDesk(){
  var r = rows();
  $("desktop").innerHTML = r.map(function(e){
    var o = ocrState(e), u = uploadState(e);
    /* The SAME three attributes the listing row carries, so a card is a
       library item too and the folio's pull-out finds it in either view. */
    var key = e.instance + "/" + e.id;
    return '<article class="card" data-fa-library-item="' + esc(key) + '"' +
      ' data-fa-library-href="' + esc(entryHref(e)) + '"' +
      ' data-fa-library-avatar="' + esc(avatarUrl(e)) + '"' +
      ' data-fa-library-title="' + esc(e.title || e.id) + '"><div class="spine"></div>' +
      '<div data-fa-pullout-host style="display:flex;gap:8px;align-items:flex-start">' + avatarHtml(e) +
      "<h3>"+esc(e.title)+"</h3></div>" +
      '<div class="slug">'+esc(e.instance)+" / "+esc(e.id)+"</div>" +
      '<div class="rows">' +
        "<span>sections</span><b>"+e.sections+"</b>" +
        "<span>blocks</span><b>"+e.blocks+"</b>" +
        (e.summaries && e.summaries.prose ? "<span>summarised</span><b>"+e.summaries.summarised+" / "+e.summaries.prose+"</b>" : "") +
        "<span>images</span><b>"+e.images+"</b>" +
        "<span>pages</span><b>"+(e.pageStart==null?"—":e.pageStart+"–"+e.pageEnd)+"</b>" +
        "<span>words</span><b>"+e.words.toLocaleString()+"</b>" +
        "<span>size</span><b>"+kb(e.bytes)+"</b>" +
      "</div>" +
      '<div class="tags"><span class="pill '+(e.rung==="none"?"warn":"ok")+'">'+esc(e.rung)+"</span>" +
        '<span class="pill '+o.cls+'">'+esc(o.label)+"</span>" +
        '<span class="pill '+u.cls+'">'+esc(u.label)+"</span>" +
        '<span class="pill '+refState(e).cls+'">'+esc(refState(e).label)+"</span></div>" +
      "</article>";
  }).join("") || '<p class="empty">Nothing matches.</p>';
}

function renderQueue(){
  var h = "<table><thead><tr><th>unit</th><th>queue</th><th>kind</th><th>size</th><th>state</th></tr></thead><tbody>";
  h += G.uploads.filter(inScope).map(function(u){
    /* An intake is ONE queued document however many files it declares, and
       the row says so — otherwise a four-file capture reads as four things
       waiting. The count comes from the intake's own declared file list. */
    var kind = u.kind === "intake"
      ? '<span class="pill info">intake · ' + u.declaredFiles + " file" + (u.declaredFiles === 1 ? "" : "s") + "</span>"
      : esc(u.ext || "—");
    var label = esc(u.file) + (u.kind === "intake" && u.title
      ? '<br><span style="font-family:inherit;color:var(--muted);font-size:.78rem">' + esc(u.title) + "</span>" : "");
    return '<tr><td class="slug" data-label="unit">' + label + '</td><td data-label="queue"><span class="pill">' + esc(u.instance) +
      '</span></td><td data-label="kind">' + kind + '</td><td class="num" data-label="size">' + kb(u.bytes) + '</td><td data-label="state">' +
      (u.ingestedBy ? '<span class="pill ok">ingested → ' + esc(u.ingestedBy) + "</span>"
                    : '<span class="pill warn">uningested</span>') + "</td></tr>";
  }).join("") || '<tr><td colspan="5"><p class="empty">No uploads queue for this subject.</p></td></tr>';
  $("queue").innerHTML = h + "</tbody></table>";
}

function render(){ if (VIEW === "list") renderList(); else renderDesk(); }

/* WHICH ENTRY THIS PAGE IS ABOUT -- read off its own PATH (#1881).

   THREE OUTCOMES, and the middle one is why this is not a one-liner. The
   path names an entry of this page's library and it is selected; the path
   names something the library does not hold, and the page says "not found"
   with a link to the library rather than showing an unfiltered table as if
   it had worked (pb04); or the page is a library page, with no entry, and
   nothing happens.

   A LEGACY #<instance>/<id> link is honoured ONCE and normalised to the path
   IRI: replaceState when the entry is this page's own, a real navigation
   when it belongs to another library page. Nothing emits the fragment form
   any more. Every URL composed here is built from an entry the PROJECTION
   holds, never from the address bar's text. */
function byKey(key){
  return G.entries.filter(function(e){ return e.instance + "/" + e.id === key; })[0];
}
function selectEntry(known){
  if (VIEW !== "list") setView("list");
  $("q").value = known.id;
  renderList();
  var key = known.instance + "/" + known.id;
  var row = document.querySelector('[data-fa-library-item="' + key.replace(/"/g, '\"') + '"]');
  if (row) {
    row.setAttribute("data-fa-anchored", "1");
    row.scrollIntoView({ block: "center" });
  }
  document.title = (known.title || known.id) + " — " + known.instance + " library";
  /* The graph of the thing the reader just opened -- bean 7nvr. */
  loadDocument(known.id);
  loadBlocks(known.id, known);
}
function honourAddress(){
  var legacy = legacyKey(location.hash);
  if (legacy) {
    var old = byKey(legacy);
    if (old) {
      var to = entryHref(old);
      if (SCOPE && old.instance === SCOPE) history.replaceState(null, "", to);
      else { location.replace(to); return; }
    }
  }
  var at = entryFromPath(location.pathname, LIB_ROOT);
  if (!at) return;
  var known = at.instance === SCOPE ? byKey(at.instance + "/" + at.id) : undefined;
  if (!known) {
    var lib = LIB_ROOT + encodeURIComponent(SCOPE) + "/";
    $("status").innerHTML = "No entry at this address in the " + esc(SCOPE) + ' library. <a href="' + esc(lib) +
      '">Open the ' + esc(SCOPE) + " library</a>.";
    $("status").setAttribute("data-fa-not-found", "1");
    return;
  }
  selectEntry(known);
}

/* THE BLOCK GRAPH OF ONE ENTRY, fetched only when a reader opens one.
   Bean 7nvr.

   The index carries a COUNT of blocks; this is what they are. It is a
   separate fetch because the corpus holds 1715 blocks over about a megabyte
   of JSON-LD against a 44 KB index, so inlining would multiply the cost of
   the page that answers "what is in here" to serve a question asked about
   one entry at a time.

   THREE OUTCOMES, like honourAnchor above. The file loads and the blocks are
   listed; the file loads and the entry genuinely has none, which is a
   determined answer and says so; or the fetch fails, which is reported as a
   failure rather than rendered as an empty document. An entry with no blocks
   and an entry we could not read must never look the same. */
function blocksHref(id){
  var dir = DATA_HREF.slice(0, DATA_HREF.lastIndexOf("/") + 1);
  return dir + "entries/" + encodeURIComponent(id) + ".json";
}
function renderBlocks(id, data, err, entry){
  var el = $("blocks");
  el.hidden = false;
  if (err) {
    el.innerHTML = '<h2>Blocks</h2><p class="empty">Could not read the block graph for ' +
      esc(id) + ' — ' + esc(err) + '. This is a failure to read, not an empty document.</p>';
    return;
  }
  var bs = (data && data.blocks) || [];
  if (!bs.length) {
    el.innerHTML = '<h2>Blocks</h2><p class="empty">' + esc(id) +
      ' has no blocks. Nothing failed — the entry carries none.</p>';
    return;
  }
  /* THE DRAIN, for this entry -- counted over the rows below, so the line and
     the table cannot disagree. Advisory: a backlog is work nobody has done
     yet, not a defect. */
  var sums = bs.filter(function(b){ return b.summary; }).map(function(b){ return b.summary.status; });
  var prose = sums.filter(function(x){ return x !== "empty" && x !== "unreadable"; }).length;
  var done = sums.filter(function(x){ return x === "draft" || x === "confirmed"; }).length;
  var drain = prose ? '<p class="note">Agent summaries: <b>' + done + '</b> of ' + prose +
    ' prose block(s) summarised, <b>' + (prose - done) + '</b> still in the queue. ' +
    'Summaries are drafted by an agent a few at a time and confirmed only by a person.</p>' : '';
  el.innerHTML = '<h2>Blocks — ' + esc(id) + ' <span class="note">(' + bs.length +
    ', in page order)</span></h2>' + withheldBanner(entry, bs) + drain + '<table><thead><tr>' +
    '<th>page</th><th>kind</th><th>types</th><th>title</th><th>narrative / summary</th></tr></thead><tbody>' +
    bs.map(function(b){
      /* BOTH types, never one. A block is dual-typed so a DoCO reader gets
         something without knowing our vocabulary, and showing only ours
         would hide the half this project did not invent. */
      var pages = b.pageStart == null ? '—'
        : (b.pageEnd != null && b.pageEnd !== b.pageStart ? b.pageStart + '–' + b.pageEnd : String(b.pageStart));
      /* A narrative state is three-valued and none of them is an error:
         not-authored means nobody has written one, which is a fact rather
         than a gap. Rendered as plain text for that reason. */
      var nar = b.summary ? summaryBadge(b.summary)
        : b.narrative == null ? '—' : esc(b.narrative);
      /* THE CONTENT IS BEHIND A NATIVE <details> — bean lrmo.
         The owner opened this view and said "i expected to be able to see
         narrative content of extracted node": a row carrying only a state
         says a description exists without saying what it is.

         <details> rather than a scripted panel because it expands, collapses
         and takes focus from the keyboard with no JavaScript at all, which is
         one less thing to get wrong and one less thing to test. gjli.

         TRUNCATION IS DECLARED, never inferred from length. A reader who
         cannot tell a short section from a cut one is being shown a claim the
         data does not support. */
      /* THE CONTENT CELL is blockBody -- summary, withheld line, or the
         neutral "(no content carried)", in that order (issue #1794). Its
         text lives in scripts/lib/library-withheld-view.ts so a test runs
         exactly what this page runs. */
      var body = blockBody(b, entry);
      return '<tr><td class="num">' + esc(pages) + '</td><td>' + esc(b.kind) +
        '</td><td>' + esc((b.types || []).join(' + ')) + '</td><td class="bt">' + body +
        '</td><td>' + nar + '</td></tr>';
    }).join("") + '</tbody></table>';
}
/* A BLOCK SUMMARY'S STATE, in words. Owner, 2026-09-24. Every state is said
   as text rather than colour alone, and none is styled as an error: "not yet
   summarised" is the drain's backlog, which is expected and slow on purpose.
   A draft names its MODEL, because "a model wrote this" without which one is
   the provenance gap schemas/attribution.ts closes. */
function summaryLabel(s){
  var d = s.draftedBy;
  switch (s.status) {
    case "draft":
      return { cls: "info", t: d && d.kind === "agent"
        ? (d.model === "not-disclosed" ? "agent draft (model not disclosed)" : "agent draft (model " + (d.model || "unknown") + ")")
        : "draft by " + (d ? d.id : "unknown") };
    case "confirmed": return { cls: "ok", t: "confirmed by " + (s.confirmedBy || "a person") };
    case "stale": return { cls: "warn", t: "stale: source changed" };
    case "rejected": return { cls: "warn", t: "rejected — back in the queue" };
    case "empty": return { cls: "", t: "no text to summarise" };
    case "unreadable": return { cls: "warn", t: "text unreadable" };
    default: return { cls: "", t: "not yet summarised" };
  }
}

/* WITHHELD ENTRIES -- issue #1794. See scripts/lib/library-withheld-view.ts. */
var GATE_VERDICT_WORDS = { refused: "not granted" };
function joinAnd(xs){
  return xs.length > 1 ? xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1] : (xs[0] || "");
}
/* "copyright and restrictions not granted", from the recorded gates; "" when
   the list carried none, and the caller then says the recorded sentence. */
function withheldGateText(e){
  var gs = e && e.withheldBy && e.withheldBy.gates;
  if (!gs || !gs.length) return "";
  var by = {}, order = [];
  gs.forEach(function(g){
    var v = GATE_VERDICT_WORDS[g.verdict] || g.verdict;
    if (!by[v]) { by[v] = []; order.push(v); }
    by[v].push(g.gate);
  });
  return order.map(function(v){ return joinAnd(by[v]) + " " + v; }).join("; ");
}
function withheldLine(e){
  return "Withheld \u2014 " + (withheldGateText(e) || (e && e.withheld) || "not published");
}
/* The catalogue record: its published page first (a SITE-ROOT path, resolved
   the way an avatar is), its upstream URI second, nothing rather than a guess. */
function withheldRecord(e){
  var r = e && e.withheldBy && e.withheldBy.record;
  if (!r) return null;
  if (typeof r.page === "string" && r.page.charAt(0) === "/")
    return { href: SITE_ROOT + r.page.slice(1), label: "catalogue record" };
  if (typeof r.uri === "string" && r.uri) return { href: r.uri, label: "catalogue record (" + r.uri + ")" };
  return null;
}
function hasSummaryText(b){ return !!(b && b.summary && b.summary.text); }
/* ONE ROW'S CONTENT CELL. e is the entry the row belongs to. */
function blockBody(b, e){
  var title = esc(b.title || "\u2014");
  if (b.content) {
    var extract = "<pre>" + esc(b.content) + "</pre>" +
      (b.truncated ? '<p class="note">Excerpt \u2014 the first 600 characters. The section file holds the rest.</p>' : "");
    return "<details><summary>" + title + '</summary><div class="block-body">' +
      (b.summary
        ? '<div class="pair"><div><p class="lbl">Extract</p>' + extract + "</div>" +
          '<div><p class="lbl">Agent summary</p>' + summaryPanel(b.summary) + "</div></div>"
        : extract) +
      "</div></details>";
  }
  if (hasSummaryText(b)) {
    return "<details><summary>" + title + '</summary><div class="block-body">' +
      '<p class="lbl">Summary \u2014 an account of this section, not its text</p>' +
      summaryPanel(b.summary) + "</div></details>";
  }
  if (e && e.withheld) {
    var rec = withheldRecord(e);
    return title + ' <span class="wh-line">' + esc(withheldLine(e)) +
      (rec ? ' \u2014 <a href="' + esc(rec.href) + '">' + esc(rec.label) + "</a>" : "") + "</span>";
  }
  /* No content is a DETERMINED answer for a page-scan or an image with no
     description, and is said plainly rather than left blank. */
  return title + ' <span class="note">(no content carried)</span>';
}
/* THE BANNER over a withheld entry's rows, or "" for any other entry. */
function withheldBanner(e, bs){
  if (!e || !e.withheld) return "";
  var n = bs.filter(hasSummaryText).length;
  var gates = withheldGateText(e);
  var rec = withheldRecord(e);
  return '<div class="wh-banner" role="note" title="' + esc(e.withheld) + '">' +
    "<p><b>" + esc(withheldLine(e)) + ".</b> This work's text is held here but is not published: " +
    (gates ? "the publication gates named above did not grant it." : esc(e.withheld) + ".") +
    " Each section is listed by page and title only. Where a section has a summary \u2014 an account of it, not its words \u2014 the summary is shown instead.</p>" +
    "<p>" + (rec ? 'What the work is, and who holds it: <a href="' + esc(rec.href) + '">' + esc(rec.label) + "</a>. " : "") +
    "<b>" + n + "</b> of " + bs.length + " section" + (bs.length === 1 ? "" : "s") + " summarised.</p></div>";
}

/* The shared edit/feedback recipe (bean v433): the Document panel's [source],
   [feedback] and [edit] links are built by it (bean zcak). */
(() => {
  if (window.faEditLinks) return;
  function faBlockUrls(c, b) {
  var enc = encodeURIComponent;
  var path = b.source.split("/").map(enc).join("/");
  var branch = c.branch || "main";
  var repo = b.repo || c.repo;
  var src = "https://github.com/" + repo + "/blob/" + branch + "/" + path + (b.line ? "#L" + b.line : "");
  var url = c.siteUrl && b.page ? c.siteUrl.replace(/\/$/, "") + "/" + b.page + "#" + enc(b.label) : (b.pageUrl || "");
  var values = { block: b.label, section: b.section || "", source: b.source, page: b.page || "", url: url, content: c.content || "" };
  var q = new URLSearchParams();
  q.set("title", "Feedback" + (c.content ? " [" + c.content + "]" : "") + ": " + (b.section ? b.section + " — " : "") + b.label);
  if (c.labels && c.labels.length) q.set("labels", c.labels.join(","));
  if (c.template) {
    q.set("template", c.template);
    (c.templateFields || []).forEach(function (f) { if (values[f]) q.set(f, values[f]); });
  } else {
    var facts = c.content ? ["**Content:** \u0060" + c.content + "\u0060"] : [];
    facts.push("**Block:** \u0060" + b.label + "\u0060");
    if (b.section) facts.push("**Section:** " + b.section);
    facts.push("**Source:** " + src);
    if (url) facts.push("**On the site:** " + url);
    q.set("body", facts.concat(["", "**Type:** general | technical | editorial", "", "**Comment:**", "", "", "**Proposed change:**", ""]).join("\n"));
  }
  return { edit: "https://github.com/" + repo + "/edit/" + branch + "/" + path, suggest: "https://github.com/" + repo + "/edit/" + branch + "/" + path, source: src, feedback: "https://github.com/" + c.repo + "/issues/new?" + q };
}
  function faSuggestTokens(contributed) {
  var re = function (s) { if (s instanceof RegExp) return s; var i = s.lastIndexOf("/"); return new RegExp(s.slice(1, i), s.slice(i + 1)); };
  var withG = function (r) { return r.flags.indexOf("g") >= 0 ? r : new RegExp(r.source, r.flags + "g"); };
  var own = [
    { id: "liquid", shield: /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/, find: /\{\{[\s\S]*?(?:\}\}|$)|\{%[\s\S]*?(?:%\}|$)/g,
      valid: /^\{\{\s*[A-Za-z_][\w-]*(?:\.[\w-]+|\[\d+\])*\s*(?:\|\s*[A-Za-z_]\w*(?:\s*:\s*[^|{}]+?)?\s*)*\}\}$|^\{%\s*[A-Za-z_]\w*[^%]*%\}$/ },
    { id: "directive", shield: /:{1,2}[A-Za-z][\w-]*\[[^\]\n]*\](?:\{[^}\n]*\})?/, find: /:{1,2}[A-Za-z][\w-]*\[[^\n]*?(?:\](?:\{[^\n]*?\})?|$)/gm,
      valid: /^:{1,2}[A-Za-z][\w-]*\[[^\]\n]*\](?:\{[^{}\n]*\})?$/ },
  ];
  var theirs = (contributed || []).filter(function (t) { return t && typeof t.id === "string"; }).map(function (t) {
    return { id: t.id, shield: t.shield && re(t.shield), find: t.find && re(t.find), valid: t.valid && re(t.valid), trim: t.trim && re(t.trim) };
  });
  var shieldOf = function (rules) {
    return new RegExp(rules.filter(function (r) { return r.shield; }).map(function (r) { return "(?:" + r.shield.source + ")"; }).join("|"), "g");
  };
  var both = own.concat(theirs), ownShield = shieldOf(own), allShield = shieldOf(both);
  return {
    wrap: function (md, ownOnly) { return md.replace(ownOnly ? ownShield : allShield, function (m) { return "\u27e6" + m + "\u27e7"; }); },
    errors: function (md, ownOnly) {
      var bad = [];
      (ownOnly ? own : both).forEach(function (r) {
        if (!r.find || !r.valid) return;
        for (const m of md.matchAll(withG(r.find))) if (!r.valid.test(r.trim ? m[0].replace(r.trim, "") : m[0])) bad.push(m[0]);
      });
      return bad;
    },
  };
}
  let cfg = null;
  const config = () => {
    if (cfg) return cfg;
    const el = document.getElementById("fa-edit-cfg");
    if (el) cfg = JSON.parse(el.textContent);
    else {
      const meta = (n) => { const m = document.querySelector('meta[name="' + n + '"]'); return m ? m.content : undefined; };
      cfg = { repo: meta("fa-repo"), branch: meta("fa-branch") || "main" };
    }
    return cfg;
  };
  // A link that names a GitHub file but carries no facts (a generator wrote
  // its href from data, e.g. sourceLinks) gives them up from its own URL.
  const GH = /^https:\/\/github\.com\/([^/]+\/[^/]+)\/(?:blob|edit)\/([^/]+)\/([^#?]+)(?:#L(\d+))?$/;
  const adopt = (a) => {
    const m = GH.exec(a.getAttribute("href") || "");
    if (!m) return false;
    a.dataset.repo = m[1]; a.dataset.branch = m[2];
    a.dataset.src = m[3].split("/").map(decodeURIComponent).join("/");
    if (m[4]) a.dataset.line = m[4];
    return true;
  };
  const ready = (host) => {
    if (host.dataset.ready) return;
    if (!host.dataset.src && !(host.matches("a[data-fa-link]") && adopt(host))) return;
    const c0 = config();
    const c = host.dataset.branch ? Object.assign({}, c0, { branch: host.dataset.branch }) : c0;
    if (!c.repo && !host.dataset.repo) return;
    host.dataset.ready = "1";
    const label = host.dataset.block || host.dataset.src;
    const u = faBlockUrls(c, { label: label, source: host.dataset.src, section: host.dataset.sec,
      line: host.dataset.line ? Number(host.dataset.line) : undefined, repo: host.dataset.repo, page: host.dataset.page || c.page,
      pageUrl: location.href.split("#")[0] + "#" + encodeURIComponent(label) });
    const links = host.matches("a[data-fa-link]") ? [host] : host.querySelectorAll("a[data-fa-link]");
    // Only this host's own links: a nested host (a Lean link inside a block's row) fills itself.
    for (const a of links) if ((a === host || a.closest("[data-src]") === host) && u[a.dataset.faLink]) a.href = u[a.dataset.faLink];
  };
  const fill = (root) => { addSuggest(root); for (const h of (root || document).querySelectorAll("[data-src], a[data-fa-link]")) ready(h); };
  // A page that learns its repository later (the folio site reads it from its outline) says so here.
  const configure = (c) => { cfg = c; };
  // ── ✍ suggest: a block's Markdown in a WYSIWYG editor, the change as a prefilled issue ──
  //
  // Beside every ✎ edit link whose source is Markdown, on any page of any
  // harness. The editor (Milkdown Crepe, MIT) is imported only on first use.
  // The text is read through the block's KG node (<block>.jsonld, its text)
  // from the repository itself, and the change leaves as a GitHub issue the
  // reader submits: no OAuth, no token, no server. Variables, directives and
  // any syntax a content profile declares are the reader's to change, add or
  // delete; what is checked is that each is well-formed (faSuggestTokens), and
  // the panel under the editor shows each variable's current value from the
  // site's values.jsonld. Nothing read is written as HTML.
  const unwrap = (md) => md.replace(/\u27e6([^\u27e6\u27e7]*)\u27e7/g, (m, inner) => inner.replace(/\\([!-\/:-@\[-\u0060{-~])/g, "$1"));
  // Variable names and, when the site published them, their current values.
  const variablesIn = (md) => Array.from(md.matchAll(/\{\{\s*([A-Za-z_][\w.\-\[\]]*)/g), (m) => m[1]);
  const lineDiff = (a, b) => {
    const x = a.split("\n"), y = b.split("\n"), n = x.length, m = y.length;
    const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const out = [];
    let i = 0, j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && x[i] === y[j]) { out.push(" " + x[i]); i++; j++; }
      else if (j < m && (i === n || L[i][j + 1] > L[i + 1][j])) out.push("+" + y[j++]);
      else out.push("-" + x[i++]);
    }
    // Two lines of context around each change.
    const keep = out.map((l, k) => out.slice(Math.max(0, k - 2), k + 3).some((c) => c[0] !== " "));
    const hunks = [];
    out.forEach((l, k) => { if (keep[k]) hunks.push(l); else if (hunks.length && hunks[hunks.length - 1] !== "@@") hunks.push("@@"); });
    if (hunks[hunks.length - 1] === "@@") hunks.pop();
    return hunks.join("\n");
  };
  const raw = (repo, branch, path) => "https://raw.githubusercontent.com/" + repo + "/" + branch + "/" + path.split("/").map(encodeURIComponent).join("/");
  const sourceOf = (a) => {
    // From the link's parent: ready() gives a link with no facts of its own
    // (the ✍ link beside ✎ edit) a data-src adopted from its href, and the
    // block's label is the host's, not the link's.
    const h = a.parentElement && a.parentElement.closest("[data-src]");
    if (h && h.dataset.src) return { src: h.dataset.src, label: h.dataset.block || h.dataset.src, repo: h.dataset.repo, branch: h.dataset.branch, mode: h.dataset.suggestMode, text: h.dataset.suggestText };
    if (a.dataset.src || adopt(a)) return { src: a.dataset.src, label: a.dataset.block || a.dataset.src, repo: a.dataset.repo, branch: a.dataset.branch, mode: a.dataset.suggestMode, text: a.dataset.suggestText };
    return null;
  };
  const el = (tag, props, kids) => { const e = Object.assign(document.createElement(tag), props || {}); for (const k of kids || []) e.append(k); return e; };
  // A block's YAML front matter is not the reader's to edit: Crepe would turn
  // it into a thematic break and a setext heading. It is kept aside, unchanged.
  const FRONT_MATTER = /^---\n[\s\S]*?\n---\n/;
  // The site root, from any same-origin URL under /assets/ the page already
  // loads (a page is served at several depths, and the runtime is often
  // inlined, so it cannot use its own script's URL); the editor bundle is under it.
  // The page's own site root: the longest root of a same-origin /assets/ URL
  // the page loads that also contains this page (a page can load another
  // site's chrome from the same origin, /folio-assistant/assets/…).
  const vendorBase = () => {
    let best = null;
    for (const e of document.querySelectorAll("script[src], link[href]")) {
      let u;
      try { u = new URL(e.getAttribute("src") || e.getAttribute("href"), location.href); } catch { continue; }
      const i = u.pathname.indexOf("/assets/");
      if (u.origin !== location.origin || i < 0) continue;
      const root = u.pathname.slice(0, i + 1);
      if (location.pathname.indexOf(root) === 0 && (!best || root.length > best.length)) best = root;
    }
    return best === null ? null : location.origin + best + "assets/vendor/crepe/";
  };
  // The KG labels and bibliography keys a profile's checker warns against, read once from the page's graph.
  let kgRefs;
  const kgReferences = async (c) => {
    if (kgRefs !== undefined) return kgRefs;
    kgRefs = null;
    const g = c.graph ? await fetch(c.graph).then((r) => (r.ok ? r.json() : null)).catch(() => null) : null;
    const nodes = g && (g["@graph"] || g);
    if (!Array.isArray(nodes)) return kgRefs;
    const labels = [], keys = [];
    for (const n of nodes) {
      if (n && typeof n.label === "string" && n.label) labels.push(n.label);
      const m = n && typeof n["@id"] === "string" ? /(?:^|\/)references\/([^/#?]+)$/.exec(n["@id"]) : null;
      if (m) keys.push(decodeURIComponent(m[1]));
    }
    // A graph with no reference nodes says nothing about citations: that check is skipped, not failed.
    kgRefs = keys.length ? { labels: labels, citeKeys: keys } : { labels: labels };
    return kgRefs;
  };
  // A profile (an editor-checker node a content layer declares, bundled by the
  // site) for the block's kind: its checker, its tokens, and its Crepe settings.
  // Or a mode: a profile whose module opens its own editor (a Questionnaire
  // form builder, in the page or in another window) over a file it declares by
  // extension. A host names one with data-suggest-mode.
  const profilesOf = (c) => ((c.suggest && c.suggest.profiles) || []).filter((p) => p && p.module);
  const fileOk = (p, src) => (p.extensions && p.extensions.length ? p.extensions.some((x) => src.endsWith(x)) : /\.md$/.test(src));
  // A host that names its mode is served by that profile whatever its file is
  // (a Questionnaire written in FSH); otherwise by file type.
  const suggestable = (c, s) => (s.mode ? profilesOf(c).some((p) => p.id === s.mode) : /\.md$/.test(s.src) || profilesOf(c).some((p) => fileOk(p, s.src)));
  const profileFor = (c, kind, s) => s.mode
    ? profilesOf(c).find((p) => p.id === s.mode)
    : profilesOf(c).find((p) => fileOk(p, s.src) && (!p.kinds || p.kinds.indexOf(kind) >= 0));
  // The issue: prefilled by URL, or, past GitHub's URL limit, carried on the clipboard.
  const openIssue = async (repo, title, body, template, status) => {
    const q = { title: title, body: body };
    if (template) q.template = template;
    let url = "https://github.com/" + repo + "/issues/new?" + new URLSearchParams(q);
    if (url.length > 7000) {
      try { await navigator.clipboard.writeText(body); } catch { status.textContent = "Too long for a link, and the clipboard is blocked."; return false; }
      url = "https://github.com/" + repo + "/issues/new?" + new URLSearchParams({ title: title, body: "The suggested change is on the clipboard: paste it here." });
    }
    window.open(url, "_blank", "noopener");
    return true;
  };
  const findingItem = (f) => el("li", { className: f.severity === "error" ? "bad" : "warn", textContent: (f.severity === "error" ? "Error" : "Warning") + (f.line ? " (line " + f.line + ")" : "") + ": " + f.message });
  // \u2500\u2500 The dialog: wireframe candidate A (cat-harness docs/wireframes/suggest-editor,
  // owner's choice 2026-10-14): one screen, a toolbar always shown, changes
  // marked as you type (new text green and underlined, removed text red and
  // struck through), a Why field that becomes the issue's reason, and a size
  // the reader chooses. Underline is not offered: Markdown has none, and
  // underlined means added.
  const SUGGEST_CSS = [
    "dialog.fa-suggest{width:min(60rem,95vw);height:min(44rem,90vh);max-width:100vw;max-height:100vh;padding:0;border:2px solid #1b1b1b;display:flex;flex-direction:column;overflow:hidden}",
    "dialog.fa-suggest:not([open]){display:none}",
    "dialog.fa-suggest.fa-sg-large{width:min(80rem,98vw);height:94vh}",
    "dialog.fa-suggest.fa-sg-full{width:100vw;height:100vh;margin:0}",
    ".fa-sg-hd{display:flex;align-items:center;gap:.5rem;padding:.5rem .75rem;border-bottom:1px solid #d6dde2}",
    ".fa-sg-hd h2{font-size:1.05rem;margin:0;flex:1;overflow-wrap:anywhere}",
    "dialog.fa-suggest button{min-height:44px;min-width:44px;padding:0 .7rem;border:1px solid #1b1b1b;background:#fff;color:#1b1b1b;font:inherit;cursor:pointer;border-radius:4px}",
    "dialog.fa-suggest button[aria-pressed=true]{background:#e8e8e8;font-weight:700}",
    "dialog.fa-suggest button:focus-visible{outline:3px solid #0b57d0;outline-offset:2px}",
    ".fa-sg-tb{display:flex;flex-wrap:wrap;gap:.25rem;align-items:center;padding:.4rem .75rem;border-bottom:1px solid #d6dde2}",
    ".fa-sg-tb .fa-sg-sep{width:1px;align-self:stretch;background:#d6dde2;margin:0 .2rem}",
    ".fa-sg-tb .fa-sg-note{font-size:.8rem;color:#5b6770;margin:0 .4rem}",
    ".fa-sg-tb .fa-sg-mode{margin-left:auto;display:inline-flex;gap:.25rem}",
    ".fa-suggest-status{color:#5b6770;font-size:.9rem;margin:.25rem .75rem}",
    ".fa-suggest-status:empty{display:none}",
    ".fa-suggest-editor{flex:1;min-height:8rem;overflow:auto;margin:0}",
    ".fa-suggest-editor textarea{width:100%;height:100%;min-height:12rem;box-sizing:border-box;font-family:ui-monospace,monospace;font-size:.9rem;border:0;padding:.75rem;resize:none}",
    "dialog.fa-suggest .milkdown .ProseMirror{padding:.75rem 1rem}",
    "dialog.fa-suggest .ProseMirror a{text-decoration-style:dotted}",
    "ins.fa-sg-ins,.fa-sg-ins-block{color:#0b6b2a;background:#e6f4ea;text-decoration:underline 3px;text-underline-offset:3px}",
    "del.fa-sg-del{color:#b3261e;text-decoration:line-through 2px;margin-right:.2em;user-select:none}",
    "ins.fa-sg-ins::before,del.fa-sg-del::before{position:absolute;clip-path:inset(50%);width:1px;height:1px;overflow:hidden}",
    "ins.fa-sg-ins::before{content:' [added: '}del.fa-sg-del::before{content:' [removed: '}",
    ".fa-suggest-vars{font-size:.85rem;color:#5b6770;margin:.25rem .75rem;padding-left:1.2rem;max-height:6rem;overflow:auto}",
    ".fa-suggest-vars .bad{color:#b3261e}.fa-suggest-vars .warn{color:#8a5a00}",
    ".fa-sg-why{padding:.25rem .75rem}.fa-sg-why label{font-weight:700;display:block}",
    ".fa-sg-why textarea{width:100%;box-sizing:border-box;min-height:4rem;font:inherit;padding:.4rem;border:1px solid #1b1b1b;border-radius:4px}",
    ".fa-sg-ft{display:flex;gap:.5rem;align-items:center;padding:.5rem .75rem;border-top:1px solid #d6dde2}",
    ".fa-sg-ft .fa-sg-help{flex:1;font-size:.85rem;color:#5b6770}",
    ".fa-sg-ft button.fa-sg-send{font-weight:700}",
    "@media (max-width:700px){dialog.fa-suggest,dialog.fa-suggest.fa-sg-large{width:100vw;height:100vh;margin:0;border:0}.fa-sg-size{display:none}.fa-sg-tb .fa-sg-note{flex-basis:100%;order:9}.fa-sg-tb .fa-sg-mode{margin-left:0}.fa-sg-ft{flex-wrap:wrap}.fa-sg-ft .fa-sg-help{flex-basis:100%}.fa-sg-ft button{flex:1}}",
  ].join("");
  // A block's text as tokens (words, spaces, and a separator between paragraphs),
  // each with the document position it starts at: what the change marks diff.
  const tokensOf = (node, at0) => {
    const start = at0 + 1;
    const out = [];
    let word = null;
    const flush = () => { if (word) { out.push(word); word = null; } };
    node.descendants((child, pos) => {
      if (child.isTextblock && out.length + (word ? 1 : 0)) { flush(); out.push({ t: "\n", pos: start + pos }); }
      if (child.isText) {
        const at = start + pos;
        for (let k = 0; k < child.text.length; k++) {
          const ch = child.text[k], sp = /\s/.test(ch);
          if (word && word.sp === sp) word.t += ch;
          else { flush(); word = { t: ch, pos: at + k, sp: sp }; }
        }
      } else if (child.isLeaf && !child.isText) { flush(); out.push({ t: "\ufffc" + child.type.name, pos: start + pos, size: child.nodeSize }); }
      return true;
    });
    flush();
    return out;
  };
  // Longest common subsequence of two arrays by key: the pairs that did not change.
  const lcs = (a, b, key) => {
    const n = a.length, m = b.length;
    if (n * m > 4e6) return [];
    const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = key(a[i]) === key(b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const pairs = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (key(a[i]) === key(b[j])) { pairs.push([i, j]); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) i++;
      else j++;
    }
    return pairs;
  };
  // The change marks: what differs between the source as the editor first
  // showed it and the document now, as ProseMirror decorations. Removed text is
  // a widget (it is not in the document); added text an inline <ins>.
  const changeMarks = (lib, baseOf) => {
    let count = 0;
    const key = new lib.PluginKey("fa-suggest-changes");
    const decorate = (doc) => {
      const base = baseOf();
      count = 0;
      if (!base) return lib.DecorationSet.empty;
      const blocks = [];
      doc.forEach((node, offset) => blocks.push({ node: node, pos: offset, text: node.type.name + ":" + node.textContent }));
      const decos = [];
      const del = (pos, text) => {
        if (!text.trim()) return;
        decos.push(lib.Decoration.widget(pos, () => { const d = document.createElement("del"); d.className = "fa-sg-del"; d.textContent = text; return d; }, { side: -1, key: "del" + pos + ":" + text }));
      };
      const tokenDiff = (was, now, blockEnd) => {
        const pairs = lcs(was, now, (x) => x.t);
        let wi = 0, ni = 0;
        const step = (toW, toN) => {
          const gone = was.slice(wi, toW).map((x) => (x.t === "\n" ? " " : x.t.charAt(0) === "\ufffc" ? "" : x.t)).join("");
          const added = now.slice(ni, toN).filter((x) => x.t !== "\n");
          const hasAdd = added.length && added.some((x) => !/^\s+$/.test(x.t));
          if (hasAdd || gone.trim()) count++;
          if (hasAdd) {
            const last = added[added.length - 1];
            decos.push(lib.Decoration.inline(added[0].pos, last.pos + (last.size || last.t.length), { nodeName: "ins", class: "fa-sg-ins" }));
          }
          const at = toN < now.length ? now[toN].pos : blockEnd;
          if (gone) del(added.length ? added[0].pos : at, gone);
          wi = toW; ni = toN;
        };
        // A shared space between two changed words does not split one replacement into two.
        for (const [w, n] of pairs) { if (/^\s+$/.test(was[w].t)) continue; if (w > wi || n > ni) step(w, n); wi = w + 1; ni = n + 1; }
        if (wi < was.length || ni < now.length) step(was.length, now.length);
      };
      const pairs = lcs(base, blocks, (x) => x.text);
      let bi = 0, di = 0;
      const gap = (toB, toD) => {
        const goneB = base.slice(bi, toB), newB = blocks.slice(di, toD);
        const k = Math.min(goneB.length, newB.length);
        for (let x = 0; x < k; x++) tokenDiff(goneB[x].tokens, tokensOf(newB[x].node, newB[x].pos), newB[x].pos + newB[x].node.nodeSize - 1);
        for (let x = k; x < newB.length; x++) { count++; decos.push(lib.Decoration.node(newB[x].pos, newB[x].pos + newB[x].node.nodeSize, { class: "fa-sg-ins-block" })); }
        const at = toD < blocks.length ? blocks[toD].pos : doc.content.size;
        for (let x = k; x < goneB.length; x++) { count++; del(at, goneB[x].node.textContent); }
        bi = toB; di = toD;
      };
      for (const [b, d] of pairs) { if (b > bi || d > di) gap(b, d); bi = b + 1; di = d + 1; }
      if (bi < base.length || di < blocks.length) gap(base.length, blocks.length);
      return lib.DecorationSet.create(doc, decos);
    };
    const plugin = new lib.Plugin({
      key: key,
      state: { init: (_, state) => decorate(state.doc), apply: (tr, old, _, state) => (tr.docChanged || tr.getMeta(key) ? decorate(state.doc) : old) },
      props: { decorations: (state) => key.getState(state) },
    });
    return { plugin: plugin, key: key, count: () => count };
  };
  // The base blocks, with their tokens, from the document the editor first showed.
  const baseBlocksOf = (doc) => {
    const out = [];
    doc.forEach((node, offset) => out.push({ node: node, pos: offset, text: node.type.name + ":" + node.textContent, tokens: tokensOf(node, offset) }));
    return out;
  };
  // Markdown around the raw pane's selection, typed so the browser's own undo keeps it.
  const rawWrap = (ta, before, after, linePrefix) => {
    ta.focus();
    const a = ta.selectionStart, b = ta.selectionEnd, sel = ta.value.slice(a, b);
    let text;
    if (linePrefix) {
      const ls = ta.value.lastIndexOf("\n", a - 1) + 1;
      ta.setSelectionRange(ls, b);
      text = ta.value.slice(ls, b).split("\n").map((l) => linePrefix + l).join("\n");
    } else text = before + (sel || "text") + after;
    if (!document.execCommand("insertText", false, text)) ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, "end");
  };
  const suggest = async (a) => {
    const s = sourceOf(a), c = config();
    if (!s || !suggestable(c, s)) return;
    const repo = s.repo || c.repo, branch = s.branch || c.branch || "main";
    const btn = (label, title, extra) => { const b = el("button", Object.assign({ type: "button", textContent: label, title: title }, extra || {})); b.setAttribute("aria-label", title); return b; };
    const titleId = "fa-sg-title-" + Date.now();
    const status = el("p", { className: "fa-suggest-status", textContent: "Loading " + s.src + " …" });
    status.setAttribute("role", "status");
    const host = el("div", { className: "fa-suggest-editor" });
    const send = btn("Submit as an issue", "Submit as an issue", { className: "fa-sg-send", disabled: true });
    const close = btn("Cancel", "Cancel");
    const larger = btn("Larger", "Make the editor larger", { className: "fa-sg-size" });
    const full = btn("Full screen", "Fill the screen", { className: "fa-sg-size" });
    const x = btn("\u2715", "Close");
    larger.setAttribute("aria-pressed", "false");
    full.setAttribute("aria-pressed", "false");
    const toolbar = el("div", { className: "fa-sg-tb" });
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", "Formatting");
    const visualBtn = btn("Visual", "Edit visually"), rawBtn = btn("Raw", "Edit the raw Markdown");
    const mode = el("span", { className: "fa-sg-mode" }, [visualBtn, rawBtn]);
    const vars = el("ul", { className: "fa-suggest-vars" });
    vars.setAttribute("aria-live", "polite");
    const why = el("textarea", { id: titleId + "-why", rows: 3, placeholder: "What should change, and why? This becomes the issue's reason." });
    const whyBox = el("div", { className: "fa-sg-why" }, [el("label", { htmlFor: why.id, textContent: "Why?" }), why]);
    const h2 = el("h2", { id: titleId, textContent: "Suggest a change: " + s.label });
    const dlg = el("dialog", { className: "fa-suggest" }, [
      el("div", { className: "fa-sg-hd" }, [h2, larger, full, x]),
      status, toolbar, host, vars, whyBox,
      el("div", { className: "fa-sg-ft" }, [el("span", { className: "fa-sg-help", textContent: "Opens a GitHub issue with your change and your reason." }), send, close]),
    ]);
    dlg.setAttribute("aria-labelledby", titleId);
    let surface = null, timer = null;
    const cleanup = () => { if (timer) clearInterval(timer); if (surface) surface.destroy(); surface = null; if (dlg.isConnected) dlg.remove(); };
    close.onclick = x.onclick = () => { if (dlg.open) dlg.close(); cleanup(); };
    // Esc closes it, as a modal dialog does; focus stays inside while it is open.
    dlg.addEventListener("close", cleanup);
    larger.onclick = () => { const on = dlg.classList.toggle("fa-sg-large"); larger.setAttribute("aria-pressed", String(on)); };
    full.onclick = () => { const on = dlg.classList.toggle("fa-sg-full"); full.setAttribute("aria-pressed", String(on)); };
    if (!document.getElementById("fa-suggest-css")) document.head.append(el("style", { id: "fa-suggest-css", textContent: SUGGEST_CSS }));
    document.body.append(dlg);
    dlg.showModal();
    let path = s.src, original, kind = String(s.label).split(":")[0];
    try {
      // The KG node names the block's text and its kind; a page without one falls back to the source.
      const node = await fetch(raw(repo, branch, s.src.replace(/\.md$/, ".jsonld"))).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      if (node && typeof node.text === "string") path = s.src.replace(/[^/]*$/, "") + node.text;
      if (node && typeof node.kind === "string") kind = node.kind;
      const r = await fetch(raw(repo, branch, path));
      if (!r.ok) throw new Error(r.status + " reading " + path);
      original = await r.text();
    } catch (e) { status.textContent = "Could not load the block: " + e.message; return; }
    const fm = FRONT_MATTER.exec(original);
    const head = fm ? fm[0] : "", body = original.slice(head.length);
    // The site's variable values, as KG nodes (values.jsonld), when it publishes them.
    const values = c.values ? await fetch(c.values).then((r) => (r.ok ? r.json() : null)).catch(() => null) : null;
    const valueOf = (key) => {
      const nodes = values && (values["@graph"] || values);
      const n = Array.isArray(nodes) ? nodes.find((x) => x.key === key) : null;
      return n ? String(n.formatted !== undefined ? n.formatted : n.value) : undefined;
    };
    // The block's profile, when the site declares one for its kind. A profile
    // that fails to load leaves the generic editor and its generic checks.
    const prof = profileFor(c, kind, s);
    let mod = null;
    const notes = [];
    if (prof) {
      try { mod = await import(new URL(prof.module, location.href).href); }
      catch (e) { notes.push("The " + (prof.id || "profile") + " checks did not load (" + e.message + ")."); }
    }
    const facts = ["**Block:** \u0060" + s.label + "\u0060", "**Source:** https://github.com/" + repo + "/blob/" + branch + "/" + path, "**On the site:** " + location.href.split("#")[0] + "#" + encodeURIComponent(s.label)];
    const reason = () => (why.value.trim() ? why.value.trim() : "");
    // A mode: its own editor, the same issue flow over the text it hands back.
    // get() may be async (an editor in another window answers by postMessage);
    // it is read on submit, not polled.
    if (mod && typeof mod.open === "function") {
      toolbar.hidden = true;
      // The mode's text: the block's source, or, when the host names one
      // (data-suggest-text), what the site BUILT from it, e.g. a Questionnaire
      // compiled from FSH. The source stays the issue's subject either way.
      let text = original;
      if (s.text) {
        try {
          const r = await fetch(new URL(s.text, location.href).href);
          if (!r.ok) throw new Error(r.status + " reading " + s.text);
          text = await r.text();
        } catch (e) { status.textContent = "Could not load the built text: " + e.message; return; }
      }
      // ctx.why is live: the reader's reason as it stands when the mode reads it.
      const ctx = { text: text, sourceText: original, sourcePath: path, src: s.src, path: path, label: s.label, kind: kind, repo: repo, branch: branch, config: c, status: (m) => { status.textContent = String(m); }, get why() { return reason(); } };
      const formBox = el("div"), srcBox = el("div", { hidden: true });
      host.replaceChildren(formBox, srcBox);
      let handle;
      try { handle = await mod.open(formBox, ctx); }
      catch (e) { status.textContent = "The " + (prof.id || "editor") + " did not open: " + e.message; return; }
      surface = { name: "mode", get: () => handle.get(), base: text, destroy: () => { try { if (handle && handle.dispose) handle.dispose(); } catch {} } };
      // Both editors when the mode edits a built text (owner, 2026-10-14: "Both"):
      // the mode's own, and the source itself, raw. The issue carries whichever
      // the reader used; the mode stays open, so switching back loses nothing.
      let onSource = false, srcArea = null;
      if (s.text) {
        const ext = (path.match(/\.([A-Za-z0-9]+)$/) || [])[1];
        const formBtn = btn("Form", "Edit in the form"), srcBtn = btn(ext ? ext.toUpperCase() : "Source", "Edit the source text");
        const sw = el("div", { className: "fa-sg-tb" }, [el("span", { className: "fa-sg-mode" }, [formBtn, srcBtn])]);
        sw.setAttribute("role", "group");
        sw.setAttribute("aria-label", "Editor");
        host.before(sw);
        const show = () => {
          formBtn.setAttribute("aria-pressed", String(!onSource));
          srcBtn.setAttribute("aria-pressed", String(onSource));
          formBox.hidden = onSource;
          srcBox.hidden = !onSource;
        };
        formBtn.onclick = () => { onSource = false; show(); };
        srcBtn.onclick = () => {
          if (!srcArea) { srcArea = el("textarea", { value: original }); srcArea.setAttribute("aria-label", "The source: " + path); srcBox.append(srcArea); }
          onSource = true; show(); srcArea.focus();
        };
        show();
      }
      status.textContent = notes.join(" ");
      const sourceIssue = async () => {
        const now = srcArea.value;
        if (now === original) { status.textContent = "Nothing has changed yet."; return; }
        const body = facts.concat(["", "**Suggested change**, made in the source (" + path + "):", "", "\u0060\u0060\u0060diff", lineDiff(original, now), "\u0060\u0060\u0060", "", "**Why:**", reason(), ""]).join("\n");
        if (await openIssue(c.repo || repo, "Suggested edit: " + s.label, body, undefined, status)) close.onclick();
      };
      send.disabled = false;
      send.onclick = async () => {
        if (onSource) return sourceIssue();
        let now;
        try { now = await surface.get(); } catch (e) { status.textContent = "Could not read the edit: " + e.message; return; }
        if (typeof now !== "string" || now === text) { status.textContent = "Nothing has changed yet."; return; }
        let found = [];
        if (typeof mod.check === "function") {
          try { found = (await mod.check(text, now, { kg: (await kgReferences(c)) || undefined })) || []; }
          catch (e) { found = [{ severity: "warning", message: "the checker failed: " + e.message }]; }
        }
        vars.replaceChildren(...found.map(findingItem));
        const errs = found.filter((f) => f.severity === "error");
        if (errs.length) { status.textContent = "Fix first: " + errs.map((f) => String(f.message).slice(0, 60)).join(" \u00b7 "); return; }
        let custom = null;
        if (typeof mod.issue === "function") { try { custom = await mod.issue(text, now, ctx); } catch { custom = null; } }
        const title = (custom && custom.title) || "Suggested edit: " + s.label;
        // A mode's own body keeps the reader's reason: appended when the body does not already carry it.
        const why = reason();
        const own = custom && custom.body ? (why && custom.body.indexOf(why) < 0 ? custom.body + "\n\n**Why:**\n" + why + "\n" : custom.body) : null;
        const issueBody = own || facts.concat(["", "**Suggested change**, made in the " + (prof.id || "profile") + " editor:", "", "\u0060\u0060\u0060diff", lineDiff(text, now), "\u0060\u0060\u0060", "", "**Why:**", reason(), ""]).join("\n");
        if (await openIssue(c.repo || repo, title, issueBody, custom && custom.template, status)) close.onclick();
      };
      return;
    }
    const km = (c.suggest && c.suggest.katexMacros) || {};
    const macros = mod && typeof mod.macros === "function" ? mod.macros(km) : undefined;
    const kg = mod && typeof mod.check === "function" ? await kgReferences(c) : null;
    // The harness's tokens and the profile's. A profile whose module keeps its
    // own syntax verbatim (remarkFirst) must not have it wrapped in \u27e6 \u27e7
    // as well, and one whose module loaded checks its own syntax: its tokens
    // are shielded and checked here only when its module is not.
    const tokens = faSuggestTokens(prof && prof.tokens);
    const shield = (t) => tokens.wrap(t, !!(mod && mod.remarkFirst));
    const syntaxErrors = (t) => tokens.errors(t, !!mod);
    const wrapped = shield(body);
    let katex = null, lib = null, visualBase = null;
    // The visual surface: Crepe, with the profile's feature settings, node views
    // and first remark transformer, the toolbar's commands and the change
    // marks. Its base is Crepe's round-trip of the SOURCE, kept across a
    // switch to raw and back, so escapes Crepe adds are not counted as the
    // reader's change and the marks always compare with the source.
    const visual = async (text) => {
      // The site's own bundle (suggest-editor.ts): Crepe and KaTeX from one
      // copy of ProseMirror, its stylesheet with every import resolved.
      const sc = c.suggest || {};
      const vb = vendorBase();
      const moduleUrl = sc.module || (vb && vb + "crepe.js");
      if (!moduleUrl) throw new Error("this site has no editor bundle (assets/vendor/crepe/)");
      const cssUrl = sc.css || (vb && !sc.module ? vb + "crepe.css" : null);
      if (cssUrl && !document.querySelector('link[href="' + cssUrl + '"]')) document.head.append(el("link", { rel: "stylesheet", href: cssUrl }));
      lib = lib || (await import(moduleUrl));
      const Crepe = lib.Crepe;
      if (mod && mod.nodeViews && !katex) katex = sc.katex ? (await import(sc.katex)).default : lib.default;
      const box = el("div");
      host.replaceChildren(box);
      // The dialog's own toolbar replaces Crepe's selection toolbar, and
      // Crepe's block handle (the wide left gutter) is not used here.
      const opts = { root: box, defaultValue: text, features: { [Crepe.Feature.Toolbar]: false, [Crepe.Feature.BlockEdit]: false } };
      if (mod && typeof mod.featureConfigs === "function") opts.featureConfigs = mod.featureConfigs(Crepe.Feature, km);
      const crepe = new Crepe(opts);
      let baseBlocks = null;
      const marks = lib.Plugin && lib.DecorationSet ? changeMarks(lib, () => baseBlocks) : null;
      // Milkdown's own InitReady timer, found in the schema's wait list so no
      // second copy of @milkdown/core is imported: after it, before the schema
      // builds the parser, is when a remark plugin can still go first, and
      // before the editor state is made a ProseMirror plugin can still join.
      crepe.editor.use((ctx) => {
        const init = (ctx.get("schemaTimer") || []).find((t) => t && t.name === "InitReady");
        return async () => {
          if (init) await ctx.wait(init);
          if (mod && typeof mod.remarkFirst === "function") ctx.update("remarkPlugins", mod.remarkFirst(macros));
          if (mod && mod.nodeViews && katex) ctx.update("nodeView", (v) => v.concat(Object.keys(mod.nodeViews).map((n) => [n, mod.nodeViews[n](katex, km)])));
          if (marks) ctx.update("prosePlugins", (p) => p.concat([marks.plugin]));
        };
      });
      await crepe.create();
      const view = crepe.editor.action((ctx) => ctx.get("editorView"));
      const run = (cmd, payload) => { view.focus(); crepe.editor.action(lib.callCommand(cmd.key, payload)); };
      const get = () => unwrap(crepe.getMarkdown());
      // The base, and the marks, are the SOURCE as Crepe shows it: this
      // editor's first document when it opened on the source, else a probe
      // editor's (it opened on text carried over from the raw pane).
      if (text === wrapped) {
        if (visualBase === null) visualBase = get();
        if (marks) baseBlocks = baseBlocksOf(view.state.doc);
      } else if (marks || visualBase === null) {
        const probe = new Crepe({ root: el("div"), defaultValue: wrapped, features: { [Crepe.Feature.Toolbar]: false, [Crepe.Feature.BlockEdit]: false } });
        probe.editor.use((ctx) => { const init = (ctx.get("schemaTimer") || []).find((t) => t && t.name === "InitReady"); return async () => { if (init) await ctx.wait(init); if (mod && typeof mod.remarkFirst === "function") ctx.update("remarkPlugins", mod.remarkFirst(macros)); }; });
        await probe.create();
        if (visualBase === null) visualBase = unwrap(probe.getMarkdown());
        if (marks) baseBlocks = baseBlocksOf(probe.editor.action((ctx) => ctx.get("editorView")).state.doc);
        probe.destroy();
      }
      if (marks) view.dispatch(view.state.tr.setMeta(marks.key, true));
      return {
        name: "visual", get: get, base: visualBase, changes: () => (marks ? marks.count() : null),
        destroy: () => { try { crepe.destroy(); } catch {} },
        bold: () => run(lib.toggleStrongCommand), italic: () => run(lib.toggleEmphasisCommand), strike: () => run(lib.toggleStrikethroughCommand),
        heading: () => run(lib.wrapInHeadingCommand, 3), bullets: () => run(lib.wrapInBulletListCommand), numbers: () => run(lib.wrapInOrderedListCommand),
        code: () => run(lib.toggleInlineCodeCommand), undo: () => run(lib.undoCommand), redo: () => run(lib.redoCommand),
        link: () => { const href = window.prompt("Link address"); if (href) run(lib.toggleLinkCommand, { href: href }); },
      };
    };
    // The raw surface: the block's Markdown exactly as it is; the toolbar types Markdown.
    const rawSurface = (text) => {
      const ta = el("textarea", { value: text });
      ta.setAttribute("aria-label", "The block's Markdown");
      host.replaceChildren(ta);
      const ex = (c2) => () => { ta.focus(); document.execCommand(c2); };
      return {
        name: "raw", get: () => ta.value, base: body, changes: () => null, destroy: () => {},
        bold: () => rawWrap(ta, "**", "**"), italic: () => rawWrap(ta, "_", "_"), strike: () => rawWrap(ta, "~~", "~~"),
        heading: () => rawWrap(ta, "", "", "### "), bullets: () => rawWrap(ta, "", "", "- "), numbers: () => rawWrap(ta, "", "", "1. "),
        code: () => rawWrap(ta, "\u0060", "\u0060"), undo: ex("undo"), redo: ex("redo"),
        link: () => { const href = window.prompt("Link address"); if (href) rawWrap(ta, "[", "](" + href + ")"); },
      };
    };
    // The toolbar: the same buttons on both surfaces.
    const tools = [["B", "Bold", "bold"], ["I", "Italic", "italic"], ["S", "Strikethrough", "strike"], null, ["H", "Heading", "heading"], ["\u2022", "Bulleted list", "bullets"], ["1.", "Numbered list", "numbers"], null, ["\ud83d\udd17", "Link", "link"], ["</>", "Code", "code"], null, ["\u21b6", "Undo", "undo"], ["\u21b7", "Redo", "redo"]];
    for (const t of tools) {
      if (!t) { toolbar.append(el("span", { className: "fa-sg-sep" })); continue; }
      const b = btn(t[0], t[1]);
      if (t[2] === "bold") b.style.fontWeight = "700";
      if (t[2] === "italic") b.style.fontStyle = "italic";
      if (t[2] === "strike") b.style.textDecoration = "line-through";
      b.onmousedown = (e) => e.preventDefault();
      b.onclick = () => { if (surface && surface[t[2]]) surface[t[2]](); };
      toolbar.append(b);
    }
    toolbar.append(el("span", { className: "fa-sg-note", textContent: "No underline: underlined text means added." }), mode);
    const rawFirst = !!(prof && prof.rawFirstFor && prof.rawFirstFor.indexOf(kind) >= 0);
    const show = () => {
      visualBtn.setAttribute("aria-pressed", String(surface.name === "visual"));
      rawBtn.setAttribute("aria-pressed", String(surface.name === "raw"));
    };
    try {
      surface = rawFirst ? rawSurface(body) : await visual(wrapped);
    } catch (e) {
      // No editor bundle, or it failed: the same flow over plain Markdown.
      surface = rawSurface(body);
      notes.push("The visual editor did not load (" + e.message + "); editing the Markdown directly.");
    }
    show();
    const describe = () => (surface.name === "raw" ? "Editing the raw Markdown." : wrapped === body ? "" : "Variables, glossary terms and references are shown in \u27e6 \u27e7: change, add or delete them freely; their syntax is checked when you submit.");
    status.textContent = notes.concat([describe()]).filter(Boolean).join(" ");
    const switchTo = async (next) => {
      if (surface.name === next) return;
      const text = surface.get();
      surface.destroy();
      try { surface = next === "raw" ? rawSurface(text) : await visual(shield(text)); }
      catch (e) { surface = rawSurface(text); notes.push("The visual editor did not load (" + e.message + ")."); }
      show();
      status.textContent = notes.concat([describe()]).filter(Boolean).join(" ");
    };
    visualBtn.onclick = () => switchTo("visual");
    rawBtn.onclick = () => switchTo("raw");
    // What the profile's checker says the edit introduces: errors block, warnings do not.
    const findings = (text) => {
      if (!mod || typeof mod.check !== "function" || text === surface.base) return [];
      try { return mod.check(surface.base, text, { macros: macros, kg: kg || undefined }) || []; }
      catch (e) { return [{ severity: "warning", message: "the checker failed: " + e.message, line: 0 }]; }
    };
    // Live: how many changes, each variable and its current value, any item
    // whose syntax is broken, and the profile's findings.
    const refresh = () => {
      if (!dlg.isConnected || !surface) return clearInterval(timer);
      const text = surface.get();
      const n = surface.changes();
      const items = [];
      if (n !== null) {
        const li = el("li", {}, [n ? n + (n === 1 ? " change: " : " changes: ") : "No changes yet. ", ...(n ? [Object.assign(document.createElement("ins"), { className: "fa-sg-ins", textContent: "added" }), " ", Object.assign(document.createElement("del"), { className: "fa-sg-del", textContent: "removed" })] : [])]);
        items.push(li);
      } else if (text !== surface.base) items.push(el("li", { textContent: "Changed. Switch to Visual to see the changes marked." }));
      for (const k of variablesIn(text)) { const v = valueOf(k); items.push(el("li", { textContent: k + (v === undefined ? (values ? " \u2014 not a published variable" : " \u2014 value not published") : " = " + v) })); }
      for (const b of syntaxErrors(text)) items.push(el("li", { className: "bad", textContent: "Not well-formed: " + b.slice(0, 80) }));
      for (const f of findings(text)) items.push(findingItem(f));
      vars.replaceChildren(...items);
    };
    timer = setInterval(refresh, 800);
    refresh();
    send.disabled = false;
    send.onclick = async () => {
      const now = surface.get();
      if (now === surface.base) { status.textContent = "Nothing has changed yet."; return; }
      const errs = syntaxErrors(now).concat(findings(now).filter((f) => f.severity === "error").map((f) => f.message));
      if (errs.length) { status.textContent = "Fix the syntax first: " + errs.map((e) => e.slice(0, 60)).join(" \u00b7 "); return; }
      const how = surface.name === "raw" ? "in the raw editor" : "in the visual editor (the diff is against the editor's rendering of the source)";
      const issue = facts.concat(["", "**Suggested change**, made " + how + ":", "", "\u0060\u0060\u0060diff", lineDiff(surface.base, now), "\u0060\u0060\u0060", "", "**Why:**", reason(), ""]).join("\n");
      if (await openIssue(c.repo || repo, "Suggested edit: " + s.label, issue, undefined, status)) close.onclick();
    };
  };
  const SUGGEST_TITLE = "Suggest a change in a visual editor (opens a GitHub issue)";
  const addSuggest = (root) => {
    // Only over a real DOM: the runtime is also evaluated against stubs (a
    // viewer's own tests), where there is nothing to add a link to.
    const r = root || document;
    if (!r || typeof r.querySelectorAll !== "function") return;
    for (const a of r.querySelectorAll('a[data-fa-link="edit"], a.ba-edit')) {
      if (a.nextElementSibling && a.nextElementSibling.dataset.faLink === "suggest") continue;
      const s = sourceOf(a);
      if (!s || !suggestable(config(), s)) continue;
      const b = el("a", { className: "ba-suggest", href: a.getAttribute("href") || "#", title: SUGGEST_TITLE, textContent: "✍ suggest", tabIndex: 0 });
      b.dataset.faLink = "suggest";
      a.after(b);
    }
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest('a[data-fa-link="suggest"]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    suggest(a);
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => addSuggest());
  else addSuggest();
  window.faEditLinks = { urls: faBlockUrls, fill: fill, configure: configure };
  // Both the link reached and the host it sits in: a pointer that lands
  // straight on a compact host's link (no gap crossed) or keyboard focus on it
  // matches the bare link first, which carries no facts of its own.
  for (const ev of ["pointerover", "focusin", "touchstart"])
    document.addEventListener(ev, (e) => {
      if (!e.target.closest) return;
      const a = e.target.closest("a[data-fa-link]"), h = e.target.closest("[data-src]");
      if (a) ready(a);
      if (h && h !== a) ready(h);
    }, { passive: true });
})();

/* THE DOCUMENT PANEL -- issue #2302. See scripts/lib/library-document.ts. */
var DOC = null, DOC_ID = null, DOC_TAB = "contents";
function docHref(id){
  var dir = DATA_HREF.slice(0, DATA_HREF.lastIndexOf("/") + 1);
  return dir + "entries/" + encodeURIComponent(id) + ".doc.json";
}
function pageText(phys, label){
  /* The label a reader sees first; the physical index beside it when they
     differ, because that is what a PDF viewer's page box takes. */
  if (phys == null) return "\u2014";
  return label && String(label) !== String(phys) ? esc(label) + ' <span class="note">(p' + phys + ')</span>' : 'p' + phys;
}
function confPill(c, ev){
  if (c == null) return "";
  var cls = c >= 0.8 ? "ok" : c >= 0.6 ? "info" : "warn";
  return '<span class="pill ' + cls + '" title="' + esc((ev || []).join(", ")) + '">' + c.toFixed(2) + '</span>';
}
function notRecorded(what){
  return '<p class="empty">' + esc(what) + ' not recorded for this entry \u2014 it was ingested before this field existed. Re-ingest to add it.</p>';
}
function docContents(d){
  if (!d.toc.length && d.variant && d.variant !== "pdf") {
    /* A text or notebook source has no separate outline: its headings ARE its
       sections, so they are its contents. */
    if (!d.sections.length) return '<p class="empty">No sections: the source has no headings.</p>';
    return '<p class="note">Contents: the source\u2019s own headings.</p><ul class="toc">' + d.sections.map(function(s){
      return '<li style="margin-left:' + (Math.max(0, (s.level || 1) - 1)) + 'em"><a href="#sec-' + esc(s.id) + '" data-sec="' + esc(s.id) + '">' +
        (s.number ? esc(s.number) + ' ' : '') + esc(s.title) + '</a></li>';
    }).join("") + '</ul>';
  }
  if (!d.toc.length) return '<p class="empty">No table of contents: the PDF carries no outline and none could be inferred.</p>';
  var how = d.tocSource === "outline" ? "the PDF\u2019s own outline"
    : "inferred (" + esc(d.tocMethod || "unknown") + "); each entry\u2019s confidence and the evidence behind it are shown";
  /* A TREE OF <details>, collapsed to the top level so the document's shape
     is visible at a glance (owner, 2026-10-06: "TOC collapsible and start
     collapsed - hard to see overview"). Native <details>: keyboard and
     screen-reader behaviour with no script. */
  var bySec = {};
  d.sections.forEach(function(s){ bySec[s.id] = s; });
  function line(e){
    var t = (e.number ? esc(e.number) + ' ' : '') + esc(e.title);
    var link = e.section ? '<a href="#sec-' + esc(e.section) + '" data-sec="' + esc(e.section) + '">' + t + '</a>' : t;
    var s = e.section && bySec[e.section];
    return link + ' <span class="note">' + pageText(e.page, e.pageLabel) + '</span> ' + confPill(e.confidence, e.evidence) +
      (s && s.edit && d.links ? ' ' + editHost(s) : '');
  }
  /* Build a node list first, so a level can see how many siblings it has.
     A node that is the ONLY one at its level starts open: an outline whose
     single root is the book's title would otherwise collapse to one line
     (9789241548960-eng). The tree opens down to the first level that
     branches \u2014 the chapters \u2014 and no further. */
  var i = 0;
  function nodes(level){
    var out = [];
    while (i < d.toc.length && d.toc[i].level >= level) {
      var e = d.toc[i++];
      out.push({ e: e, kids: (i < d.toc.length && d.toc[i].level > e.level) ? nodes(e.level + 1) : [] });
    }
    return out;
  }
  function render(ns){
    var only = ns.length === 1;
    return ns.map(function(n){
      return n.kids.length
        ? '<li><details' + (only ? ' open' : '') + '><summary>' + line(n.e) + '</summary><ul>' + render(n.kids) + '</ul></details></li>'
        : '<li class="leaf">' + line(n.e) + '</li>';
    }).join("");
  }
  var tree = render(nodes(d.toc[0].level));
  return '<p class="note">Source: ' + how + '. ' + d.toc.length + ' entries.</p>' +
    '<p><button type="button" data-toc="open">Expand all</button> <button type="button" data-toc="close">Collapse all</button></p>' +
    '<ul class="toc">' + tree + '</ul>';
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
  if (!d.figures.length) return '<p class="empty">No captions found. Nothing failed \u2014 none opens a line with a label and number.</p>';
  var gaps = (d.checks.figureSequenceGaps || []);
  return (gaps.length ? '<p class="note">Numbering gaps in the document: ' + esc(gaps.join(", ")) + '.</p>' : '') +
    '<table><thead><tr><th>kind</th><th>no.</th><th>caption</th><th>page</th><th>confidence</th></tr></thead><tbody>' +
    d.figures.map(function(f){
      return '<tr><td>' + esc(f.kind) + '</td><td>' + esc(f.number) + '</td><td>' + (f.title ? esc(f.title) : '<span class="note">withheld</span>') +
        '</td><td>' + pageText(f.page, f.pageLabel) + '</td><td>' + confPill(f.confidence, f.evidence) + '</td></tr>';
    }).join("") + '</tbody></table>';
}
function chips(ks){
  /* A keyword a heading also names is marked: the document saying it of itself. */
  if (!ks || !ks.length) return "";
  return '<p class="kw">' + ks.map(function(k){
    return '<span class="pill' + (k.heading ? ' ok' : '') + '"' + (k.heading ? ' title="also named by a heading"' : '') + '>' + esc(k.term) + '</span>';
  }).join(" ") + '</p>';
}
/* LINKS -- bean zcak, from the shared recipe (edit-links, bean v433). The
   library is frozen, so [source] and [feedback] are about the library's own
   section file, and [edit] opens the folio block MATERIALISED from the
   section, when there is one. Each is its own host, so the runtime builds
   every href from that host's data-src and nothing else. */
function editHost(s){
  return '<span class="doc-actions" data-src="' + esc(s.edit.path) + '" data-block="' + esc(s.edit.label) + '">' +
    '<a data-fa-link="edit" title="Edit the folio block made from this section (the library copy is frozen)">\u270E edit</a></span>';
}
function secActions(d, s){
  if (!d.links) return '';
  var t = (s.number ? s.number + ' ' : '') + s.title;
  return ' <span class="doc-actions" data-src="' + esc(d.links.dir + '/sections/' + s.id + '.md') + '" data-block="' + esc(s.id) +
    '" data-sec="' + esc(t) + '"><a data-fa-link="source" title="This section as extracted, on GitHub">source</a> ' +
    '<a data-fa-link="feedback" title="Give feedback on this section (opens a GitHub issue)">\u{1f4e3} feedback</a></span>' +
    (s.edit ? ' ' + editHost(s) : '');
}
function docSections(d){
  if (!d.sections.length) return '<p class="empty">No sections.</p>';
  return d.sections.map(function(s){
    var range = s.pageStart == null ? "" : pageText(s.pageStart, s.labelStart) +
      (s.pageEnd != null && s.pageEnd !== s.pageStart ? ' \u2013 ' + pageText(s.pageEnd, s.labelEnd) : '');
    var body = s.summary
      ? '<div class="sum"><span class="pill info">summary \u00B7 ' + esc(s.summary.status) + '</span><p>' + esc(s.summary.text) + '</p></div>'
      : s.extract
        ? '<div class="sum"><span class="pill">extract \u2014 the section\u2019s own opening text' + (s.extractCut ? ', cut' : '') + '</span><p>' + esc(s.extract) + (s.extractCut ? '\u2026' : '') + '</p></div>'
        : '<p class="note">' + (d.withheld ? 'Withheld \u2014 no text published; no summary yet.' : 'No text and no summary.') + '</p>';
    return '<article id="sec-' + esc(s.id) + '" class="docsec"><h3>' + esc((s.number ? s.number + ' ' : '') + s.title) +
      ' <span class="note">' + range + ' \u00B7 ' + s.words + ' words</span>' + secActions(d, s) + '</h3>' + chips(s.keywords) + body + '</article>';
  }).join("");
}
function docChecks(d){
  var c = d.checks, rows = [];
  function row(name, n, items){
    var cell = !items || !items.length ? '<span class="note">none</span>'
      : '<details><summary>' + items.length + (n > items.length ? ' of ' + n : '') + ' shown</summary><ul>' +
        items.map(function(i){ return '<li>' + esc(i) + '</li>'; }).join("") + '</ul></details>';
    rows.push('<tr><td>' + esc(name) + '</td><td class="num">' + n + '</td><td>' + cell + '</td></tr>');
  }
  if (c.tocAlignment) {
    var names = { listed_not_found: "On the contents page, not found in the body",
      found_not_listed: "Numbered in the body, missing from the contents page", page_mismatch: "Page differs from the contents page" };
    Object.keys(names).forEach(function(k){ var v = c.tocAlignment[k]; if (v) row(names[k], v.count, v.items); });
  }
  if (c.figureSequenceGaps) row("Figure and table numbering gaps", c.figureSequenceGaps.length, c.figureSequenceGaps);
  if (c.pageLabelConflicts) row("Page-label conflicts (built-in label vs printed)", c.pageLabelConflicts.count, c.pageLabelConflicts.items);
  if (!rows.length) return '<p class="empty">No checks recorded for this entry.</p>';
  return '<p class="note">Findings about the DOCUMENT, reported and never corrected \u2014 drafts drift.</p>' +
    '<table><thead><tr><th>check</th><th>count</th><th>items</th></tr></thead><tbody>' + rows.join("") + '</tbody></table>';
}
var DOC_TABS = [["contents","Contents",docContents],["pages","Pages",docPages],["figures","Figures & tables",docFigures],["sections","Sections",docSections],["checks","Checks",docChecks]];
function renderDocument(id, d, err){
  var el = $("document");
  /* No structure.json: nothing in this schema to show, a determined answer
     served as a file (absent: true), never a 404 to tell from a failure. */
  if (!err && d && d.absent) { el.hidden = true; return; }
  el.hidden = false;
  if (err) { el.innerHTML = '<h2>Document</h2><p class="empty">Could not read the document view for ' + esc(id) + ' \u2014 ' + esc(err) + '. This is a failure to read, not an empty document.</p>'; return; }
  DOC = d; DOC_ID = id;
  if (d.links && window.faEditLinks) window.faEditLinks.configure({ repo: d.links.repo, branch: d.links.branch, content: id });
  var tab = DOC_TABS.filter(function(t){ return t[0] === DOC_TAB; })[0] || DOC_TABS[0];
  var whole = d.links ? ' <span class="doc-actions" data-src="' + esc(d.links.dir) + '" data-block="' + esc(id) + '"><a data-fa-link="source">source</a> ' +
    '<a data-fa-link="feedback" title="Give feedback on this document (opens a GitHub issue)">\u{1f4e3} feedback</a></span>' : '';
  /* An unknown page count is said as unknown, never as "0 pages". */
  var size = d.variant && d.variant !== "pdf" ? d.sections.length + ' sections'
    : d.pages ? d.pages + ' pages'
    : d.pagesCovered ? 'page count not recorded; sections reach page ' + d.pagesCovered
    : 'page count not recorded';
  el.innerHTML = '<h2>Document \u2014 ' + esc(d.title || id) + ' <span class="note">(' + size + ')</span>' + whole + '</h2>' +
    '<div class="seg" role="tablist" aria-label="Document view">' + DOC_TABS.map(function(t){
      return '<button type="button" role="tab" aria-selected="' + (t[0] === tab[0]) + '" data-tab="' + t[0] + '">' + esc(t[1]) + '</button>';
    }).join("") + '</div>' + (d.keywords && d.keywords.length ? '<div class="dockw"><span class="note">Keywords (LSI):</span> ' + chips(d.keywords) + '</div>' : '') +
    '<div class="docbody" role="tabpanel">' + tab[2](d) + '</div>';
  Array.prototype.forEach.call(el.querySelectorAll("[data-tab]"), function(b){
    b.addEventListener("click", function(){ DOC_TAB = b.getAttribute("data-tab"); renderDocument(id, DOC, null); });
  });
  Array.prototype.forEach.call(el.querySelectorAll("[data-toc]"), function(b){
    b.addEventListener("click", function(){
      var open = b.getAttribute("data-toc") === "open";
      Array.prototype.forEach.call(el.querySelectorAll("ul.toc details"), function(x){ x.open = open; });
    });
  });
  /* Hrefs now, not on first hover: a keyboard reader tabs to these links. */
  if (d.links && window.faEditLinks) window.faEditLinks.fill(el);
  /* A section link from any tab opens the Sections tab at that section. Only
     <a>: a link HOST carries data-sec too (its section's name, for an issue). */
  Array.prototype.forEach.call(el.querySelectorAll("a[data-sec]:not([data-fa-link])"), function(a){
    a.addEventListener("click", function(ev){
      ev.preventDefault(); DOC_TAB = "sections"; renderDocument(id, DOC, null);
      var t = document.getElementById("sec-" + a.getAttribute("data-sec")); if (t) t.scrollIntoView();
    });
  });
}
/* An address naming a section (#sec-<id>), from the rail's contents or a
   link from anywhere, opens the Sections tab at it: the section exists only
   on that tab, so a bare fragment would scroll to nothing. */
function openSectionFromHash(){
  var h = decodeURIComponent(location.hash || "");
  if (h.indexOf("#sec-") !== 0 || !DOC) return;
  if (DOC_TAB !== "sections") { DOC_TAB = "sections"; renderDocument(DOC_ID, DOC, null); }
  var t = document.getElementById(h.slice(1)); if (t) t.scrollIntoView();
}
window.addEventListener("hashchange", openSectionFromHash);
function loadDocument(id){
  fetch(docHref(id), {cache: "no-store"})
    .then(function(r){ if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function(d){ renderDocument(id, d, null); openSectionFromHash(); })
    .catch(function(e){ renderDocument(id, null, String(e && e.message || e)); });
}

function summaryBadge(s){
  var l = summaryLabel(s);
  return '<span class="pill ' + l.cls + '">' + esc(l.t) + '</span>';
}
function summaryPanel(s){
  var why = {
    "not-summarised": "No agent has summarised this block yet. The queue is drained a few blocks at a time.",
    "empty": "The block holds no text, so there is nothing to summarise.",
    "unreadable": "The block names a text file that could not be read."
  }[s.status];
  var who = s.draftedBy
    ? "Drafted by " + s.draftedBy.kind + " " + s.draftedBy.id +
      (s.draftedBy.model === "not-disclosed" ? ", model not disclosed (recoverable from its session)" : s.draftedBy.model ? ", model " + s.draftedBy.model : "") + (s.draftedAt ? ", " + s.draftedAt : "") + ". " +
      (s.status === "confirmed" ? "Confirmed by " + (s.confirmedBy || "a person") + "."
        : s.status === "stale" ? "The block's text has changed since; this summary may no longer match it."
        : s.status === "rejected" ? "Rejected by a person: " + (s.rejectionReason || "no reason recorded") + "."
        : "Not yet confirmed by a person.")
    : "";
  return '<div class="sum">' + summaryBadge(s) +
    (s.text ? '<p>' + esc(s.text) + '</p>' : '<p>' + esc(why || "") + '</p>') +
    (who ? '<p class="note">' + esc(who) + '</p>' : '') + '</div>';
}
function loadBlocks(id, entry){
  fetch(blocksHref(id), {cache: "no-store"})
    .then(function(r){ if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function(d){ renderBlocks(id, d, null, entry); })
    .catch(function(e){ renderBlocks(id, null, String(e && e.message || e), entry); });
}

function setView(v){
  VIEW = v;
  $("vList").setAttribute("aria-pressed", String(v === "list"));
  $("vDesk").setAttribute("aria-pressed", String(v === "desk"));
  $("listing").hidden = v !== "list";
  $("desktop").hidden = v !== "desk";
  render();
}

fetch(DATA_HREF).then(function(r){
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}).then(function(data){
  G = data;
  /* A sortable number for the referenced-by column. -1 for "not scanned" so
     it sorts apart from a real zero rather than beside it. */
  G.entries.forEach(function(e){ e.refCount = e.referencedBy ? e.referencedBy.length : -1; });
  var scoped = G.entries.filter(inScope);
  var words = scoped.reduce(function(n,e){ return n + e.words; }, 0);
  $("status").textContent = (SCOPE ? SCOPE + " · " : "") + scoped.length + " entries · " +
    words.toLocaleString() + " words · " +
    scoped.reduce(function(n,e){ return n + e.sections; }, 0) + " sections";
  if (SCOPE) document.title = SCOPE + " — library";
  $("badges").innerHTML = G.queues.filter(inScope).map(function(q){
    return '<span class="badge q"><b>'+q.uningested+"</b> uningested in <code>"+esc(q.dir)+
      "</code> <span style=\"color:var(--muted)\">of "+q.total+"</span></span>";
  }).join("");
  /* THE SUMMARY DRAIN'S BACKLOG, for the entries this page shows. Advisory,
     like every drain here: styled as a count, never as a failure. Absent
     when the projection carries no count -- nobody counted is not zero. */
  var counted = scoped.filter(function(e){ return e.summaries; });
  if (counted.length) {
    var sb = counted.reduce(function(n,e){ return n + e.summaries.backlog; }, 0);
    var sp = counted.reduce(function(n,e){ return n + e.summaries.prose; }, 0);
    var sd = counted.reduce(function(n,e){ return n + e.summaries.draft; }, 0);
    $("badges").innerHTML += '<span class="badge"><b>' + sb + "</b> of " + sp +
      " prose block(s) not yet summarised" + (sd ? ", <b>" + sd + "</b> agent draft(s) awaiting a person" : "") + "</span>";
  }
  if (G.refScan) {
    var none = scoped.filter(function(e){ return e.refCount === 0; }).length;
    $("badges").innerHTML += '<span class="badge">' +
      (none ? '<b>'+none+"</b> entr(ies) referenced by nothing" : "references scanned") +
      (G.refScan.unreadable.length
        ? ' <span class="pill warn" title="'+esc(G.refScan.unreadable.join("\n"))+'">'+
          G.refScan.unreadable.length+" unreadable — the zeros are provisional</span>"
        : "") + "</span>";
  }
  $("q").addEventListener("input", render);
  $("vList").addEventListener("click", function(){ setView("list"); });
  $("vDesk").addEventListener("click", function(){ setView("desk"); });
  $("listing").addEventListener("click", function(e){
    var b = e.target.closest("button[data-k]");
    if (!b) return;
    var k = b.getAttribute("data-k");
    SORT = { key: k, dir: SORT.key === k ? -SORT.dir : 1 };
    renderList();
  });
  render();
  renderQueue();
  honourAddress();
  window.addEventListener("hashchange", honourAddress);
}).catch(function(e){
  $("status").textContent = "could not load the projection: " + e.message;
  $("listing").innerHTML = '<p class="empty">The projection at <code>' + esc(DATA_HREF) + '</code> could not be read. ' +
    "That is not an empty corpus \u2014 it is a corpus that could not be loaded, and the page says so rather than showing nothing.</p>";
});
