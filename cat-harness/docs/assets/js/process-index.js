/**
 * The process index — every declared BPMN process, drawn from published data.
 *
 * Owner, 2026-10-02 (bean `ax6r`): the "Every workflow in the repo" table was
 * hand-maintained and drifted from the diagrams it described. The page now
 * carries only a container, and this file fills it from
 * `assets/processes/index.json`, which `bun run docs:auto` writes from every
 * instance's declared `processes` directories. A row's text is the diagram's
 * own `bpmn:documentation`, first sentence — so the place to change what a row
 * says is the diagram, never this page.
 *
 * Same shape as the library viewer (`assets/library/viewer.js`) and the
 * work-plan dashboard: a thin page, a published projection, a renderer that
 * self-mounts on `[data-fa-process-index]`. A page without the container pays
 * one failed `querySelector`.
 *
 * The pure half — {@link groupRows} and {@link rowLinks} — is exposed on
 * `window.faProcessIndex` so `scripts/tests/process-index.test.ts` evaluates
 * the shipped bytes rather than a copy of them.
 */
(function () {
  "use strict";

  var GROUP_NONE = "(top level)";

  function compare(a, b) {
    a = String(a == null ? "" : a);
    b = String(b == null ? "" : b);
    return a < b ? -1 : a > b ? 1 : 0;
  }

  /**
   * Rows grouped by `key` ("group" — the concern group — or "instance"),
   * groups in name order, rows inside a group ordered by the OTHER key and
   * then by name. A row with no concern group is grouped under one label
   * rather than under an empty heading.
   */
  function groupRows(rows, key) {
    var by = key === "instance" ? "instance" : "group";
    var other = by === "group" ? "instance" : "group";
    var groups = {};
    (rows || []).forEach(function (r) {
      var k = r && r[by] ? String(r[by]) : GROUP_NONE;
      (groups[k] = groups[k] || []).push(r);
    });
    return Object.keys(groups).sort(function (a, b) {
      // The unlabelled group goes last: it is the remainder, not a concern.
      if (a === GROUP_NONE) return b === GROUP_NONE ? 0 : 1;
      if (b === GROUP_NONE) return -1;
      return compare(a, b);
    }).map(function (k) {
      return {
        label: k,
        rows: groups[k].slice().sort(function (x, y) {
          return compare(x[other], y[other]) || compare(x.name, y.name) || compare(x.path, y.path);
        }),
      };
    });
  }

  /**
   * Where a row links. The SVG is a SITE-ROOT path in the projection and is
   * composed against `siteRoot`; the source must be http(s). Anything else is
   * dropped rather than linked, so a record cannot put a script URL in an href.
   */
  function rowLinks(row, siteRoot) {
    var out = { svg: "", source: "" };
    if (row && typeof row.svg === "string" && row.svg.charAt(0) === "/" && row.svg.charAt(1) !== "/") {
      out.svg = String(siteRoot || "/").replace(/\/?$/, "/") + row.svg.slice(1);
    }
    if (row && typeof row.source === "string" && /^https?:\/\//i.test(row.source)) out.source = row.source;
    return out;
  }

  window.faProcessIndex = { groupRows: groupRows, rowLinks: rowLinks, GROUP_NONE: GROUP_NONE };

  var FA = window.faRender;
  if (typeof document === "undefined" || !document.querySelector) return;
  var host = document.querySelector("[data-fa-process-index]");
  if (!host) return;
  if (!FA) {
    if (window.console && console.warn) {
      console.warn("process-index: assets/js/kg-render.js did not load, so the process " +
                   "index was not drawn. The container keeps its fallback link.");
    }
    return;
  }
  var el = FA.el;

  function cell(tag, child) {
    var c = el(tag);
    if (child) c.appendChild(child);
    return c;
  }

  function renderTable(group, key, siteRoot) {
    var other = key === "instance" ? "Concern group" : "Instance";
    var table = el("table", { class: "fa-process-index-table" });
    table.appendChild(el("caption", null, group.label + " — " + group.rows.length));
    var head = el("tr");
    ["Process", other, "What it is for", "Diagram"].forEach(function (h) {
      head.appendChild(el("th", { scope: "col" }, h));
    });
    table.appendChild(el("thead")).appendChild(head);
    var body = el("tbody");
    group.rows.forEach(function (r) {
      var links = rowLinks(r, siteRoot);
      var tr = el("tr", { "data-process-id": r.id });
      var name = el("td");
      name.appendChild(el("strong", null, r.name));
      name.appendChild(el("br"));
      name.appendChild(el("code", null, r.id));
      if (r.calls && r.calls.length) {
        name.appendChild(el("br"));
        name.appendChild(el("small", null, "Calls: " + r.calls.map(function (c) {
          return NAMES[c] || c;
        }).join(" · ")));
      }
      tr.appendChild(name);
      tr.appendChild(el("td", null, key === "instance" ? (r.group || GROUP_NONE) : r.instance));
      tr.appendChild(r.summary
        ? el("td", null, r.summary)
        : el("td", { class: "fa-process-index-none" }, "This diagram carries no documentation of its own."));
      var links_td = el("td");
      if (links.svg) links_td.appendChild(el("a", { href: links.svg }, "SVG"));
      if (links.svg && links.source) links_td.appendChild(document.createTextNode(" · "));
      if (links.source) links_td.appendChild(el("a", { href: links.source }, "BPMN"));
      tr.appendChild(links_td);
      body.appendChild(tr);
    });
    table.appendChild(body);
    return table;
  }

  /** Process id → name, so a call reads as the process it calls. An id nothing declares stays an id. */
  var NAMES = {};

  function render(doc, key, siteRoot) {
    (doc.processes || []).forEach(function (p) { NAMES[p.id] = p.name; });
    var mount = host.querySelector(".fa-process-index-tables");
    if (!mount) {
      mount = el("div", { class: "fa-process-index-tables" });
      host.appendChild(mount);
    }
    while (mount.firstChild) mount.removeChild(mount.firstChild);
    groupRows(doc.processes, key).forEach(function (g) {
      mount.appendChild(renderTable(g, key, siteRoot));
    });
  }

  function controls(doc, siteRoot) {
    var bar = el("div", { class: "fa-process-index-controls", role: "group", "aria-label": "Group the processes" });
    var buttons = [["group", "By concern group"], ["instance", "By instance"]].map(function (pair) {
      var b = el("button", { type: "button", "data-key": pair[0], "aria-pressed": pair[0] === "group" ? "true" : "false" }, pair[1]);
      b.addEventListener("click", function () {
        buttons.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        render(doc, pair[0], siteRoot);
      });
      bar.appendChild(b);
      return b;
    });
    var total = (doc.processes || []).length;
    var asked = (doc.instances || []).length;
    bar.appendChild(el("span", { class: "fa-process-index-count" },
      total + " processes, read from the declarations of " + asked + " instances"));
    return bar;
  }

  var region = FA.region ? FA.region("process-index") : null;
  FA.fetchIndex("fa-processes-src", function (doc, why) {
    var meta = document.querySelector('meta[name="fa-processes-src"]');
    var url = meta ? meta.getAttribute("content") : "";
    if (!doc) {
      if (doc === null) host.appendChild(FA.failureNote("process index", url, why));
      if (region) { if (doc === null) region.failed(); else region.empty(); }
      return;
    }
    var abs = new URL(String(url), location.href);
    var siteRoot = abs.pathname.replace(/assets\/processes\/index\.json$/, "");
    host.setAttribute("data-fa-process-index", "ready");
    if (!(doc.processes || []).length) {
      host.appendChild(FA.emptyNote("process index"));
      if (region) region.empty();
      return;
    }
    host.appendChild(controls(doc, siteRoot));
    render(doc, "group", siteRoot);
    if (region) region.ready();
  });
})();
