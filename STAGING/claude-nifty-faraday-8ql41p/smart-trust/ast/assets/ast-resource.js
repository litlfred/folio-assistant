/*
 * ast-resource.js: the one shared loader for an artefact page drawn from the
 * IG Publisher AST cache (skill `visualizer-loading`, bean `wnhh`).
 *
 * The page carries identity, layout and a POINTER: a `[data-ast-src]` element
 * naming the resource's JSON in the restored AST, relative to the page. This
 * fetches it and shows what the Publisher's own resource page shows:
 *
 *   - the narrative (`text.div`), the Publisher's generated XHTML, sanitised:
 *     no script, no event handler, no `javascript:` URL;
 *     Its relative links name the Publisher's pages: one naming a page this
 *     site has (`data-ast-pages`, a list fetched once) stays; any other goes to
 *     the published IG (`data-ast-published`), or loses its href when there is
 *     none. A `file:` URL is a path on the machine that ran the build and is
 *     dropped — 29 in smart-trust, measured 2026-10-02;
 *   - the resource as `JSON.stringify(parsed, null, 2)`, as the Publisher's
 *     JSON view does, never the file's own bytes.
 *
 * Three states, always visible: loading, loaded, and could-not-load naming the
 * file and the error. Completion is signalled for print and PDF: each load
 * counts itself in and out of `window.__kgLoads`, and the last to finish sets
 * `<html data-kg-loaded>`, on success or failure.
 *
 * No dependencies: `fetch`, `DOMParser` and `textContent` are the whole loader.
 */
(function () {
  "use strict";

  var DROP = { SCRIPT: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, LINK: 1, META: 1, BASE: 1, FORM: 1 };

  function begin() {
    window.__kgLoads = (window.__kgLoads || 0) + 1;
  }
  function end() {
    window.__kgLoads -= 1;
    if (window.__kgLoads <= 0) document.documentElement.setAttribute("data-kg-loaded", "");
  }

  function sanitise(node) {
    for (var i = node.childNodes.length - 1; i >= 0; i--) {
      var c = node.childNodes[i];
      if (c.nodeType !== 1) continue;
      if (DROP[c.tagName.toUpperCase()]) {
        node.removeChild(c);
        continue;
      }
      for (var j = c.attributes.length - 1; j >= 0; j--) {
        var a = c.attributes[j];
        var n = a.name.toLowerCase();
        if (n.indexOf("on") === 0) c.removeAttribute(a.name);
        else if ((n === "href" || n === "src" || n === "xlink:href") && /^\s*javascript:/i.test(a.value)) c.removeAttribute(a.name);
      }
      sanitise(c);
    }
    return node;
  }

  function narrative(resource) {
    var div = resource && resource.text && resource.text.div;
    if (typeof div !== "string" || !div.trim()) return null;
    var doc = new DOMParser().parseFromString(div, "text/html");
    var holder = document.createElement("div");
    holder.className = "ast-narrative";
    // adoptNode MOVES each child out of the parsed document; importNode would
    // copy it and leave the list as long as it was, looping forever.
    while (doc.body.firstChild) holder.appendChild(document.adoptNode(doc.body.firstChild));
    return sanitise(holder);
  }

  var localPages = {};

  function pagesFrom(url) {
    if (!url) return Promise.resolve(null);
    if (!localPages[url]) {
      localPages[url] = fetch(url)
        .then(function (r) {
          return r.ok ? r.json() : [];
        })
        .then(function (list) {
          var set = {};
          for (var i = 0; i < list.length; i++) set[list[i]] = 1;
          return set;
        })
        .catch(function () {
          return {};
        });
    }
    return localPages[url];
  }

  function relink(node, local, published) {
    var els = node.querySelectorAll("[href],[src]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var attr = el.hasAttribute("href") ? "href" : "src";
      var v = el.getAttribute(attr);
      if (/^\s*file:/i.test(v)) {
        el.removeAttribute(attr);
        continue;
      }
      if (/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(v)) continue;
      if (local && local[v.split("#")[0]]) continue;
      if (published) el.setAttribute(attr, new URL(v, published).href);
      else el.removeAttribute(attr);
    }
    return node;
  }

  function heading(text) {
    var h = document.createElement("h3");
    h.textContent = text;
    return h;
  }

  function load(el) {
    var src = el.getAttribute("data-ast-src");
    var state = el.querySelector(".ast-state");
    var local = null;
    begin();
    pagesFrom(el.getAttribute("data-ast-pages"))
      .then(function (set) {
        local = set;
        return fetch(src);
      })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (resource) {
        var frag = document.createDocumentFragment();
        var n = narrative(resource);
        if (n) relink(n, local, el.getAttribute("data-ast-published"));
        frag.appendChild(heading("Narrative"));
        if (n) frag.appendChild(n);
        else {
          var none = document.createElement("p");
          none.textContent = "This resource carries no narrative.";
          frag.appendChild(none);
        }
        frag.appendChild(heading("JSON"));
        var pre = document.createElement("pre");
        pre.className = "ast-json";
        pre.textContent = JSON.stringify(resource, null, 2);
        frag.appendChild(pre);
        if (state) state.remove();
        el.appendChild(frag);
        el.setAttribute("data-state", "loaded");
      })
      .catch(function (err) {
        if (state) {
          state.textContent = "Could not load " + src + ": " + (err && err.message ? err.message : String(err));
          state.className = "ast-state ast-error";
        }
        el.setAttribute("data-state", "error");
      })
      .then(end, end);
  }

  function start() {
    var els = document.querySelectorAll("[data-ast-src]");
    for (var i = 0; i < els.length; i++) load(els[i]);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
