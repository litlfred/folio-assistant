/*
  One todo's page — issue #1908. Generated pages at <site>/todos/<id>/ carry a
  config block (`fa-todo-page-config`) naming the todo; this script loads the
  todo's published JSON-LD and draws it. Nothing about the todo is written into
  the page itself: the JSON-LD is the one copy (scripts/todo-page.ts).

  Every value reaches the DOM through textContent, and every href through
  safeHref, because a todo's text is authored and its links come from data.
*/
(function () {
  "use strict";
  var cfgEl = document.getElementById("fa-todo-page-config");
  if (!cfgEl) return;
  var cfg;
  try { cfg = JSON.parse(cfgEl.textContent || "{}"); } catch (_e) { return; }

  function $(id) { return document.getElementById(id); }
  function el(tag, text, cls) {
    var n = document.createElement(tag);
    if (text != null) n.textContent = String(text);
    if (cls) n.className = cls;
    return n;
  }
  function safeHref(h) {
    if (typeof h !== "string" || h === "") return null;
    var m = /^([a-z][a-z0-9+.-]*):/i.exec(h);
    if (m && !/^https?$/i.test(m[1])) return null;
    return h;
  }
  function link(text, href) {
    var safe = safeHref(href);
    if (!safe) return el("span", text);
    var a = el("a", text);
    a.href = safe;
    return a;
  }
  function list(v) { return v == null ? [] : Array.isArray(v) ? v : [v]; }
  function idOf(v) { return v && typeof v === "object" ? v["@id"] : v; }

  function meta(dt, dd) {
    var dl = $("fa-todo-meta");
    dl.appendChild(el("dt", dt));
    var d = el("dd");
    if (typeof dd === "string") d.textContent = dd; else d.appendChild(dd);
    dl.appendChild(d);
  }

  function edge(axis, node) {
    var li = el("li");
    li.appendChild(el("span", axis + ": ", "fa-todo-page-axis"));
    var text = (node && (node.name || node.identifier)) || String(idOf(node) || node);
    li.appendChild(link(text, idOf(node)));
    $("fa-todo-edges").appendChild(li);
  }

  function draw(todo) {
    document.title = todo.summary + " — todo";
    $("fa-todo-summary").textContent = todo.summary;
    $("fa-todo-status").textContent = "";
    meta("Status", String(todo.status));
    meta("Priority", String(todo.priority));
    if (todo.origin) meta("Raised by", String(todo.origin));
    meta("Created", String(todo.created));
    if (todo.target) {
      var about = el("span");
      if (cfg.targetHref) {
        about.appendChild(link(todo.target.label || idOf(todo.target), cfg.targetHref));
        about.appendChild(document.createTextNode(" ("));
        about.appendChild(link("node JSON-LD", idOf(todo.target)));
        about.appendChild(document.createTextNode(")"));
      } else {
        about.appendChild(link(todo.target.label || idOf(todo.target), idOf(todo.target)));
      }
      meta("About", about);
    } else if (todo.label) {
      meta("About", String(todo.label) + " (no block in this build carries this label)");
    }
    var body = $("fa-todo-body");
    var paras = String(todo.description || "").split(/\n{2,}/).filter(function (p) { return p.trim() !== ""; });
    if (paras.length === 0) body.appendChild(el("p", "No detail recorded.", "fa-todo-page-empty"));
    paras.forEach(function (p) { body.appendChild(el("p", p.trim())); });

    list(todo.assignee).forEach(function (n) { edge("who", n); });
    list(todo.bean).forEach(function (n) { edge("bean", n); });
    list(todo.pullRequest).forEach(function (n) { edge("PR", n); });
    list(todo.issue).forEach(function (n) { edge("issue", n); });
    list(todo.process).forEach(function (n) { edge("process", n); });
    if (todo.source) edge("source", { "@id": todo.source, name: "View source" });
    edge("JSON-LD", { "@id": cfg.jsonld, name: todo["@id"] });
  }

  function siblings(todo) {
    if (!todo.target || !cfg.graph) return;
    var at = idOf(todo.target);
    fetch(cfg.graph).then(function (r) {
      if (!r.ok) throw new Error(r.status + " " + r.statusText);
      return r.json();
    }).then(function (g) {
      var others = list(g["@graph"]).filter(function (t) {
        return t["@id"] !== todo["@id"] && t.target && idOf(t.target) === at;
      });
      if (others.length === 0) return;
      var ul = $("fa-todo-sibling-list");
      others.forEach(function (t) {
        var li = el("li");
        li.appendChild(link(t.summary, cfg.pages + encodeURIComponent(t.identifier) + "/"));
        ul.appendChild(li);
      });
      $("fa-todo-siblings").hidden = false;
    }).catch(function () { /* the todo itself is drawn; siblings are an extra */ });
  }

  fetch(cfg.jsonld).then(function (r) {
    if (!r.ok) throw new Error(r.status + " " + r.statusText);
    return r.json();
  }).then(function (todo) {
    draw(todo);
    siblings(todo);
  }).catch(function (e) {
    // "Could not load" is not "nothing to show", and the page says which.
    $("fa-todo-status").textContent = "Could not load this todo from " + cfg.jsonld + ": " + e.message;
  });
})();
