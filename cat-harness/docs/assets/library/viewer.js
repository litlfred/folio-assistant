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


/* THE DOCUMENT PANEL -- issue #2302. See scripts/lib/library-document.ts. */
var DOC = null, DOC_TAB = "contents";
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
  if (!d.toc.length) return '<p class="empty">No table of contents: the PDF carries no outline and none could be inferred.</p>';
  var how = d.tocSource === "outline" ? "the PDF\u2019s own outline"
    : "inferred (" + esc(d.tocMethod || "unknown") + "); each entry\u2019s confidence and the evidence behind it are shown";
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
  if (!d.figures.length) return '<p class="empty">No captions found. Nothing failed \u2014 none opens a line with a label and number.</p>';
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
      (s.pageEnd != null && s.pageEnd !== s.pageStart ? ' \u2013 ' + pageText(s.pageEnd, s.labelEnd) : '');
    var body = s.summary
      ? '<div class="sum"><span class="pill info">summary \u00B7 ' + esc(s.summary.status) + '</span><p>' + esc(s.summary.text) + '</p></div>'
      : s.extract
        ? '<div class="sum"><span class="pill">extract \u2014 the section\u2019s own opening text' + (s.extractCut ? ', cut' : '') + '</span><p>' + esc(s.extract) + (s.extractCut ? '\u2026' : '') + '</p></div>'
        : '<p class="note">' + (d.withheld ? 'Withheld \u2014 no text published; no summary yet.' : 'No text and no summary.') + '</p>';
    return '<article id="sec-' + esc(s.id) + '" class="docsec"><h3>' + esc((s.number ? s.number + ' ' : '') + s.title) +
      ' <span class="note">' + range + ' \u00B7 ' + s.words + ' words</span></h3>' + body + '</article>';
  }).join("");
}
function docChecks(d){
  var c = d.checks, out = [];
  if (c.tocAlignment) {
    var names = { listed_not_found: "Listed on the contents page, not found in the body",
      found_not_listed: "Numbered in the body, missing from the contents page", page_mismatch: "Page differs from the contents page" };
    Object.keys(names).forEach(function(k){
      var v = c.tocAlignment[k]; if (!v) return;
      out.push('<h4>' + names[k] + ' \u2014 ' + v.count + '</h4>' + (v.items.length ? '<ul>' + v.items.map(function(i){ return '<li>' + esc(i) + '</li>'; }).join("") + '</ul>' : ''));
    });
  }
  if (c.figureSequenceGaps) out.push('<h4>Figure and table numbering gaps \u2014 ' + c.figureSequenceGaps.length + '</h4>' + (c.figureSequenceGaps.length ? '<p>' + esc(c.figureSequenceGaps.join(", ")) + '</p>' : ''));
  if (c.pageLabelConflicts) out.push('<h4>Page-label conflicts \u2014 ' + c.pageLabelConflicts.count + '</h4>' + (c.pageLabelConflicts.items.length ? '<ul>' + c.pageLabelConflicts.items.map(function(i){ return '<li>' + esc(i) + '</li>'; }).join("") + '</ul>' : ''));
  return out.length ? '<p class="note">Findings about the DOCUMENT, reported and never corrected \u2014 drafts drift.</p>' + out.join("")
    : '<p class="empty">No checks recorded for this entry.</p>';
}
var DOC_TABS = [["contents","Contents",docContents],["pages","Pages",docPages],["figures","Figures & tables",docFigures],["sections","Sections",docSections],["checks","Checks",docChecks]];
function renderDocument(id, d, err){
  var el = $("document");
  /* No structure.json: nothing in this schema to show, a determined answer
     served as a file (absent: true), never a 404 to tell from a failure. */
  if (!err && d && d.absent) { el.hidden = true; return; }
  el.hidden = false;
  if (err) { el.innerHTML = '<h2>Document</h2><p class="empty">Could not read the document view for ' + esc(id) + ' \u2014 ' + esc(err) + '. This is a failure to read, not an empty document.</p>'; return; }
  DOC = d;
  var tab = DOC_TABS.filter(function(t){ return t[0] === DOC_TAB; })[0] || DOC_TABS[0];
  el.innerHTML = '<h2>Document \u2014 ' + esc(d.title || id) + ' <span class="note">(' + d.pages + ' pages)</span></h2>' +
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
