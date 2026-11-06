// The IG site's search (fhir-harness `scripts/ig-search.ts`): the box in the
// IG's top bar, searching the IG's pages and artefacts from the index the
// build wrote (`assets/ig-search.json`). The index is fetched the first time
// the box is focused, never on page load. Every term must match; a match in a
// title outranks one in an identifier, which outranks one in a description,
// which outranks one in a page's text. Plain ES5, no dependencies.
(function () {
  "use strict";
  var MAX = 25;
  var FORMAT = "fhir-harness-ig-search/v1";

  function norm(s) {
    return String(s || "").toLowerCase();
  }

  function terms(q) {
    return norm(q).split(/[\s,;]+/).filter(function (t) { return t.length > 0; });
  }

  // Score one entry for every term; 0 when a term matches nowhere.
  function score(e, ts) {
    var t = e._t, i = e._i, d = e._d, x = e._x, total = 0;
    for (var n = 0; n < ts.length; n++) {
      var q = ts[n], s = 0;
      if (t === q) s = 100;
      else if (t.indexOf(q) === 0) s = 40;
      else if (t.indexOf(q) >= 0) s = 25;
      if (i.indexOf(q) >= 0) s = Math.max(s, i.split(" ").indexOf(q) >= 0 ? 30 : 15);
      if (!s && d.indexOf(q) >= 0) s = 6;
      if (!s && x.indexOf(q) >= 0) s = 2;
      if (!s) return 0;
      total += s;
    }
    return total + (e.k === "page" ? 1 : 0);
  }

  // An index entry as the scorer reads it: lower-cased once, its href resolved.
  function prep(e, base) {
    return {
      t: e.t, k: e.k, d: e.d, href: new URL(e.h, base).href,
      _t: norm(e.t), _i: norm(e.i), _d: norm(e.d), _x: norm(e.x),
    };
  }

  function search(entries, q) {
    var ts = terms(q);
    if (!ts.length) return [];
    var hits = [];
    for (var n = 0; n < entries.length; n++) {
      var s = score(entries[n], ts);
      if (s) hits.push({ e: entries[n], s: s, n: n });
    }
    hits.sort(function (a, b) { return b.s - a.s || a.n - b.n; });
    return hits;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function init(form) {
    var input = form.querySelector("input");
    var list = form.querySelector(".ig-search-results");
    var src = form.getAttribute("data-ig-search-index");
    if (!input || !list || !src) return;
    // Once per box, however many times the client is loaded on the page.
    if (form.hasAttribute("data-ig-search-ready")) return;
    form.setAttribute("data-ig-search-ready", "");
    var indexUrl = new URL(src, document.baseURI);
    var loading = null;
    var entries = null;
    var failed = false;
    var selected = -1;

    function load() {
      if (loading) return loading;
      loading = fetch(indexUrl.href)
        .then(function (r) {
          if (!r.ok) throw new Error(r.status + " " + r.statusText);
          return r.json();
        })
        .then(function (ix) {
          if (!ix || ix.format !== FORMAT || !Array.isArray(ix.entries)) throw new Error("not an IG search index");
          var base = new URL(ix.base || "../", indexUrl);
          entries = ix.entries.map(function (e) { return prep(e, base); });
          if (input.value) render();
        })
        .catch(function (err) {
          failed = true;
          console.warn("ig-search: the search index " + indexUrl.href + " could not be read: " + err.message);
          render();
        });
      return loading;
    }

    function close() {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      selected = -1;
    }

    function links() {
      return list.querySelectorAll("a");
    }

    function select(n) {
      var a = links();
      if (!a.length) return;
      if (selected >= 0 && a[selected]) a[selected].removeAttribute("aria-selected");
      selected = (n + a.length) % a.length;
      a[selected].setAttribute("aria-selected", "true");
      a[selected].scrollIntoView({ block: "nearest" });
    }

    function render() {
      list.textContent = "";
      selected = -1;
      var q = input.value.trim();
      if (!q) return close();
      if (failed) list.appendChild(el("li", "ig-search-none", "Search is not available: the index could not be read."));
      else if (!entries) list.appendChild(el("li", "ig-search-none", "Loading the search index…"));
      else {
        var hits = search(entries, q);
        if (!hits.length) list.appendChild(el("li", "ig-search-none", "Nothing matches “" + q + "”."));
        for (var n = 0; n < hits.length && n < MAX; n++) {
          var e = hits[n].e;
          var li = el("li");
          var a = el("a");
          a.href = e.href;
          a.appendChild(el("span", "ig-search-kind", e.k === "page" ? "Page" : e.k));
          a.appendChild(document.createTextNode(e.t));
          if (e.d) a.appendChild(el("small", "", e.d));
          li.appendChild(a);
          list.appendChild(li);
        }
        if (hits.length > MAX) list.appendChild(el("li", "ig-search-none", (hits.length - MAX) + " more — add a word to narrow the search."));
      }
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }

    input.addEventListener("focus", load);
    input.addEventListener("input", function () {
      load();
      render();
    });
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowDown") { ev.preventDefault(); select(selected + 1); }
      else if (ev.key === "ArrowUp") { ev.preventDefault(); select(selected - 1); }
      else if (ev.key === "Escape") { close(); }
      else if (ev.key === "Enter") {
        var a = links();
        var go = a[selected >= 0 ? selected : 0];
        if (go) { ev.preventDefault(); window.location.href = go.href; }
      }
    });
    form.addEventListener("submit", function (ev) { ev.preventDefault(); });
    document.addEventListener("click", function (ev) {
      if (!form.contains(ev.target)) close();
    });
  }

  function start() {
    var forms = document.querySelectorAll("form.ig-search");
    for (var n = 0; n < forms.length; n++) init(forms[n]);
  }

  // Exposed for the tests, which run the scorer without a page.
  if (typeof window !== "undefined") window.__igSearch = { search: search, terms: terms, prep: prep };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
