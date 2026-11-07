// The ArchiMate pages' one loader, published once at `assets/archimate.js`
// and loaded by every page `gen-archimate-pages.ts` writes. The page holds
// identity and a pointer; this fetches the SERVED model (`model.json`, the
// model normalised) and draws the page from it: a model's views and elements
// by layer; a view's drawing and what it shows; an element's or a
// relationship's documentation, properties, relationships and views
// (`visualizer-loading`).
//
// No dependencies, and no `innerHTML` of anything read from the model: every
// string it shows is set as text, because the model is its authors'. A view's
// drawing is an <object>, never inlined, so its markup stays its own document.
(function () {
  // PRINT AND PDF: count in and out; the last loader to finish marks
  // <html data-kg-loaded>, on success or failure (`visualizer-loading`).
  var kg = (window.__kgLoads = window.__kgLoads || {
    pending: 0,
    done: function () {
      if (--this.pending === 0) document.documentElement.setAttribute("data-kg-loaded", "");
    },
  });
  var cfgEl = document.getElementById("archimate-page");
  var host = document.querySelector(".am-body");
  if (!cfgEl || !host) return;
  var cfg = JSON.parse(cfgEl.textContent);

  var LAYERS = ["Strategy", "Business", "Application", "Technology", "Physical", "Motivation", "Implementation & Migration", "Other"];

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) e.setAttribute(k, attrs[k]);
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return e;
  }
  function text(s) {
    return el("div", { class: "am-text" }, String(s).split(/\n{2,}/).map(function (p) { return el("p", {}, [p]); }));
  }
  function typeLabel(t) {
    return String(t).replace(/([a-z])([A-Z])/g, "$1 $2");
  }
  function getJson(href) {
    return fetch(href).then(function (r) {
      if (!r.ok) throw new Error(r.status + " " + r.statusText);
      return r.json();
    });
  }

  // Hrefs, relative to the page that is drawing.
  // A view's or an element's page is at its slug where the model gives one
  // (`slugs`, from the instance's slug ledger), else at its id.
  var root = cfg.kind === "model" ? "./" : "../../";
  var slugs = {};
  function seg(id) { return encodeURIComponent(Object.prototype.hasOwnProperty.call(slugs, id) ? slugs[id] : id); }
  function elHref(id) { return root + "elements/" + seg(id) + "/"; }
  function relHref(id) { return root + "relationships/" + encodeURIComponent(id) + "/"; }
  function viewHref(id) { return root + "views/" + seg(id) + "/"; }

  function index(m) {
    var ix = { el: {}, rel: {}, view: {}, out: {}, inc: {} };
    m.elements.forEach(function (e) { ix.el[e.id] = e; });
    m.relationships.forEach(function (r) {
      ix.rel[r.id] = r;
      (ix.out[r.source] = ix.out[r.source] || []).push(r);
      (ix.inc[r.target] = ix.inc[r.target] || []).push(r);
    });
    m.views.forEach(function (v) { ix.view[v.id] = v; });
    return ix;
  }
  function endLink(ix, id) {
    var e = ix.el[id];
    if (e) return el("a", { href: elHref(id) }, [e.name || "(unnamed)"]);
    var r = ix.rel[id];
    return r ? el("a", { href: relHref(id) }, [typeLabel(r.type) + " relationship"]) : el("span", {}, [id + " (not in the model)"]);
  }
  function props(list) {
    if (!list || !list.length) return null;
    return el("table", { class: "am-props" }, [
      el("thead", {}, [el("tr", {}, [el("th", {}, ["Property"]), el("th", {}, ["Value"])])]),
      el("tbody", {}, list.map(function (p) { return el("tr", {}, [el("td", {}, [p.key]), el("td", {}, [p.value])]); })),
    ]);
  }
  function viewList(m, ix, ids) {
    if (!ids || !ids.length) return el("p", {}, ["Not drawn in any view."]);
    return el("ul", {}, ids.map(function (id) { return el("li", {}, [el("a", { href: viewHref(id) }, [ix.view[id] ? ix.view[id].name : id])]); }));
  }
  function relRows(ix, rels, dir) {
    return rels.map(function (r) {
      var other = dir === "out" ? r.target : r.source;
      return el("li", {}, [
        el("a", { href: relHref(r.id) }, [typeLabel(r.type)]),
        r.name ? " “" + r.name + "”" : "",
        dir === "out" ? " → " : " ← ",
        endLink(ix, other),
        ix.el[other] ? el("span", { class: "am-type" }, [" (" + typeLabel(ix.el[other].type) + ")"]) : null,
      ]);
    });
  }
  function links(extra) {
    return el("p", { class: "am-links" }, [el("a", { href: cfg.node }, ["This node as JSON-LD"])].concat(extra || []));
  }

  // ── A model: its views, and its elements by layer ──────────────────────
  function drawModel(m) {
    var out = [el("p", {}, [m.views.length + " views · " + m.elements.length + " elements · " + m.relationships.length + " relationships"])];
    if (m.documentation) out.push(text(m.documentation));
    out.push(props(m.properties));
    out.push(el("h2", {}, ["Views"]));
    out.push(el("ul", { class: "am-views" }, m.views.map(function (v) {
      return el("li", {}, [el("a", { href: viewHref(v.id) }, [v.name || "(unnamed view)"]), v.folder && v.folder.length > 1 ? el("span", { class: "am-type" }, [" — " + v.folder.slice(1).join(" / ")]) : null]);
    })));
    LAYERS.forEach(function (layer) {
      var es = m.elements.filter(function (e) { return e.layer === layer; });
      if (!es.length) return;
      es.sort(function (a, b) { return a.type === b.type ? (a.name || "").localeCompare(b.name || "") : a.type.localeCompare(b.type); });
      out.push(el("h2", { class: "am-layer am-layer-" + layer.replace(/\W+/g, "-").toLowerCase() }, [layer + " (" + es.length + ")"]));
      out.push(el("ul", { class: "am-els" }, es.map(function (e) {
        return el("li", {}, [el("a", { href: elHref(e.id) }, [e.name || "(unnamed)"]), el("span", { class: "am-type" }, [" " + typeLabel(e.type)]), (m.inViews[e.id] || []).length ? null : el("span", { class: "am-type" }, [" · in no view"])]);
      })));
    });
    out.push(links([" · ", el("a", { href: "../" + m.file.split("/").map(encodeURIComponent).join("/") }, ["The Archi model file"])]));
    return out;
  }

  // ── A view: the drawing, and what it shows ─────────────────────────────
  function drawView(m) {
    var ix = index(m);
    var v = ix.view[cfg.id];
    if (!v) throw new Error("view " + cfg.id + " is not in the model");
    var out = [];
    if (v.viewpoint) out.push(el("p", { class: "am-type" }, ["Viewpoint: " + typeLabel(v.viewpoint)]));
    if (v.documentation) out.push(text(v.documentation));
    // A `bpmn-figure`, so docs-ui.js gives it the zoom, pan, full-width and copy controls every other figure has.
    out.push(el("figure", { class: "bpmn-figure am-figure" }, [
      el("object", { data: cfg.svg, type: "image/svg+xml", "aria-label": v.name }, [el("a", { href: cfg.svg }, ["The drawing of " + v.name])]),
    ]));
    var shown = Object.keys(m.inViews).filter(function (id) { return ix.el[id] && m.inViews[id].indexOf(v.id) >= 0; });
    if (shown.length) {
      out.push(el("h2", {}, ["Elements in this view (" + shown.length + ")"]));
      out.push(el("ul", { class: "am-els" }, shown.map(function (id) {
        return el("li", {}, [el("a", { href: elHref(id) }, [ix.el[id].name || "(unnamed)"]), el("span", { class: "am-type" }, [" " + typeLabel(ix.el[id].type)])]);
      })));
    }
    out.push(links([" · ", el("a", { href: cfg.svg }, ["The drawing (SVG)"])]));
    return out;
  }

  // ── An element ─────────────────────────────────────────────────────────
  function drawElement(m) {
    var ix = index(m);
    var e = ix.el[cfg.id];
    if (!e) throw new Error("element " + cfg.id + " is not in the model");
    var out = [];
    if (e.folder && e.folder.length) out.push(el("p", { class: "am-type" }, ["Filed under " + e.folder.join(" / ")]));
    out.push(e.documentation ? text(e.documentation) : el("p", { class: "am-type" }, ["No documentation."]));
    out.push(props(e.properties));
    var o = ix.out[e.id] || [];
    var i = ix.inc[e.id] || [];
    out.push(el("h2", {}, ["Relationships (" + (o.length + i.length) + ")"]));
    if (o.length + i.length) out.push(el("ul", { class: "am-rels" }, relRows(ix, o, "out").concat(relRows(ix, i, "in"))));
    else out.push(el("p", {}, ["None."]));
    out.push(el("h2", {}, ["Views"]));
    out.push(viewList(m, ix, m.inViews[e.id]));
    out.push(links());
    return out;
  }

  // ── A relationship ─────────────────────────────────────────────────────
  function drawRelationship(m) {
    var ix = index(m);
    var r = ix.rel[cfg.id];
    if (!r) throw new Error("relationship " + cfg.id + " is not in the model");
    var out = [el("p", { class: "am-ends" }, [endLink(ix, r.source), " → ", endLink(ix, r.target)])];
    if (r.accessType) out.push(el("p", { class: "am-type" }, ["Access: " + r.accessType]));
    if (r.strength) out.push(el("p", { class: "am-type" }, ["Strength: " + r.strength]));
    if (r.directed) out.push(el("p", { class: "am-type" }, ["Directed"]));
    if (r.documentation) out.push(text(r.documentation));
    out.push(props(r.properties));
    out.push(el("h2", {}, ["Views"]));
    out.push(viewList(m, ix, m.inViews[r.id]));
    out.push(links());
    return out;
  }

  var draw = { model: drawModel, view: drawView, element: drawElement, relationship: drawRelationship }[cfg.kind];
  if (!draw) return;
  kg.pending++;
  getJson(cfg.model)
    .then(function (m) {
      slugs = m.slugs || {};
      var parts = draw(m);
      host.textContent = "";
      parts.forEach(function (p) { if (p) host.appendChild(p); });
    })
    .catch(function (e) {
      host.textContent = "";
      host.appendChild(el("p", { class: "am-error" }, ["Could not load " + cfg.model + ": " + e.message]));
    })
    .finally(function () {
      kg.done();
    });
})();
