/* The journeys viewer's presentation script (cat-harness-tools
   scripts/journeys/present.ts). Dependency-free. Every page is complete
   without it; it adds what a facilitator does in a room:
   - ← / PageUp and → / PageDown: the previous and next moment (the page's
     <link rel="prev|next">);
   - W: reveal the "What if…"; T: show or hide what is under the hood;
   - presenter mode: the presenter's note and the facilitator cue, on or off,
     remembered in this browser;
   - the gap strip's answers, remembered in this browser only;
   - zoom on a BPMN drawing;
   - the journey map's Focus on, its two toggles, and a click on a column;
   - tabs (the ArchiMate views, the payload drawer), the drawer, Inspect JSON
     and Copy;
   - the discussion's gap list, read from the gap strips' answers;
   - an old VaxLink address (#/walkthrough/J3b, #/map, #/personas/khamla,
     #/how/gdhcn, #/discuss, #/sheets, #/demo/S4) opens that view. */
(function () {
  "use strict";
  var doc = document;
  var root = doc.documentElement;

  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (_e) {
      return null;
    }
    return null;
  }
  function each(sel, fn) {
    Array.prototype.forEach.call(doc.querySelectorAll(sel), fn);
  }
  function linkHref(rel) {
    var l = doc.querySelector('link[rel="' + rel + '"]');
    return l ? l.getAttribute("href") : null;
  }

  function setPresenter(on) {
    root.setAttribute("data-presenter", on ? "on" : "off");
    store("jp:presenter", on ? "on" : "off");
  }

  function toggleWhatIf() {
    each("[data-jp-whatif]", function (s) {
      s.classList.toggle("is-open");
    });
  }

  function setHood(show) {
    var hood = doc.querySelector("[data-jp-hood]");
    var btn = doc.querySelector("[data-jp-hood-toggle]");
    if (!hood || !btn) return;
    hood.hidden = !show;
    btn.classList.toggle("is-on", show);
    btn.setAttribute("aria-expanded", String(show));
    store("jp:hood", show ? "on" : "off");
  }

  function zoom(box) {
    var fig = box.querySelector(".jv-bpmn");
    if (!fig) return;
    Array.prototype.forEach.call(box.querySelectorAll("[data-jp-zoom]"), function (b) {
      b.addEventListener("click", function () {
        var z = b.getAttribute("data-jp-zoom");
        if (z === "full") {
          if (fig.requestFullscreen) fig.requestFullscreen();
          return;
        }
        Array.prototype.forEach.call(box.querySelectorAll("[data-jp-zoom]"), function (x) {
          x.classList.toggle("is-on", x === b);
        });
        fig.classList.toggle("is-fit", z === "fit");
        if (z !== "fit") fig.style.setProperty("--z", z);
      });
    });
  }

  function remember(input) {
    var key = "jv:" + input.name;
    if (store(key) === input.value) input.checked = true;
    input.addEventListener("change", function () {
      if (input.checked) store(key, input.value);
    });
  }

  var VIEWS = { overview: 1, walkthrough: 1, map: 1, personas: 1, how: 1, discuss: 1, sheets: 1, demo: 1 };
  function oldAddress() {
    if (!doc.body.classList.contains("jp-overview")) return;
    var m = /^#\/([a-z]+)(?:\/([^/]+))?\/?$/.exec(location.hash);
    if (!m || !VIEWS[m[1]] || m[1] === "overview") return;
    location.replace("../" + m[1] + "/" + (m[2] ? encodeURIComponent(decodeURIComponent(m[2])) + "/" : ""));
  }

  function journeyMap(map) {
    var focus = null;
    function lanes(fn) {
      Array.prototype.forEach.call(map.querySelectorAll('[data-row="lane"]'), fn);
    }
    each("[data-jp-focus]", function (b) {
      b.addEventListener("click", function () {
        focus = b.getAttribute("data-jp-focus") || null;
        each("[data-jp-focus]", function (x) {
          x.classList.toggle("is-on", x === b);
        });
        lanes(function (r) {
          r.classList.toggle("is-dim", focus !== null && r.getAttribute("data-actor") !== focus);
        });
      });
    });
    each("[data-jp-show]", function (c) {
      c.addEventListener("change", function () {
        var g = c.getAttribute("data-jp-show");
        Array.prototype.forEach.call(map.querySelectorAll('[data-jp-group="' + g + '"]'), function (r) {
          r.hidden = !c.checked;
        });
      });
    });
    function select(col) {
      Array.prototype.forEach.call(map.querySelectorAll("[data-col]"), function (c) {
        c.classList.toggle("is-sel", c.getAttribute("data-col") === col);
      });
      each("[data-jp-panel]", function (p) {
        p.hidden = p.getAttribute("data-jp-panel") !== col;
      });
    }
    map.addEventListener("click", function (ev) {
      var c = ev.target.closest("[data-col]");
      if (!c) return;
      // A link inside a column still opens; a click elsewhere in it inspects that moment.
      if (ev.target.closest("a") && !ev.target.closest("[data-jp-col]")) return;
      if (ev.target.closest("[data-jp-col]")) ev.preventDefault();
      select(c.getAttribute("data-col"));
    });
    select("0");
  }

  function tabs(root) {
    function show(id) {
      Array.prototype.forEach.call(root.querySelectorAll("[data-jp-tab]"), function (b) {
        var on = b.getAttribute("data-jp-tab") === id;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-selected", String(on));
      });
      Array.prototype.forEach.call(root.querySelectorAll("[data-jp-pane]"), function (p) {
        p.hidden = p.getAttribute("data-jp-pane") !== id;
      });
    }
    Array.prototype.forEach.call(root.querySelectorAll("[data-jp-tab]"), function (b) {
      b.addEventListener("click", function () {
        show(b.getAttribute("data-jp-tab"));
      });
    });
    return show;
  }

  function drawer(d) {
    var show = tabs(d);
    var bar = d.querySelector("[data-jp-drawer-toggle]");
    var body = d.querySelector(".jp-drawer-body");
    function open(on) {
      body.hidden = !on;
      bar.setAttribute("aria-expanded", String(on));
    }
    bar.addEventListener("click", function () {
      open(body.hidden);
    });
    each("[data-jp-inspect]", function (b) {
      b.addEventListener("click", function () {
        show(b.getAttribute("data-jp-inspect"));
        open(true);
        d.scrollIntoView({ block: "end" });
      });
    });
    var copy = d.querySelector("[data-jp-copy]");
    if (copy) {
      copy.addEventListener("click", function () {
        var pane = d.querySelector("[data-jp-pane]:not([hidden]) pre");
        if (!pane || !navigator.clipboard) return;
        navigator.clipboard.writeText(pane.textContent).then(function () {
          copy.textContent = "Copied";
          setTimeout(function () {
            copy.textContent = "Copy";
          }, 1500);
        });
      });
    }
  }

  // The gap report on the discussion page: the gap strip's answers in this
  // browser, summarised by assets/gap-report.js, drawn, printed and downloaded.
  function gapReport(g) {
    var lib = window.jpGapReport;
    var src = g.querySelector("[data-jp-gapreport-model]");
    if (!src) return;
    // gap-report.js is deferred after this script; DOMContentLoaded waits for every deferred script.
    if (!lib) {
      if (!g.hasAttribute("data-jp-waited")) {
        g.setAttribute("data-jp-waited", "");
        doc.addEventListener("DOMContentLoaded", function () {
          gapReport(g);
        });
      }
      return;
    }
    var model;
    try {
      model = JSON.parse(src.textContent);
    } catch (_e) {
      return;
    }
    var body = g.querySelector("[data-jp-gapreport-body]");
    var report = null;
    function el(tag, cls, text) {
      var n = doc.createElement(tag);
      if (cls) n.className = cls;
      if (text !== undefined) n.textContent = text;
      return n;
    }
    function answer(name) {
      return store("jv:" + name);
    }
    function stepLink(step) {
      var a = el("a", "jp-revisit");
      a.href = step.href;
      a.title = step.title;
      a.appendChild(el("b", null, step.id));
      a.appendChild(el("span", null, step.title));
      return a;
    }
    function countsTable(caption, rows, head) {
      var t = el("table", "jp-gr-counts");
      t.appendChild(el("caption", null, caption));
      var tr = el("tr");
      tr.appendChild(el("th", null, head));
      report.statusOptions.forEach(function (o) {
        tr.appendChild(el("th", null, o.label));
      });
      tr.appendChild(el("th", null, "Not rated"));
      var thead = el("thead");
      thead.appendChild(tr);
      t.appendChild(thead);
      var tb = el("tbody");
      rows.forEach(function (r) {
        var row = el("tr");
        var th = el("th");
        th.scope = "row";
        if (r.link) th.appendChild(r.link);
        else th.textContent = r.label;
        row.appendChild(th);
        report.statusOptions.forEach(function (o, i) {
          var n = r.counts.byStatus[o.id];
          row.appendChild(el("td", n && i > 0 ? "is-gap" : null, String(n)));
        });
        row.appendChild(el("td", "jp-gr-unrated", String(r.counts.unrated)));
        tb.appendChild(row);
      });
      t.appendChild(tb);
      return t;
    }
    function draw() {
      report = lib.summarise(model, answer);
      body.textContent = "";
      g.querySelector("[data-jp-gap-count]").textContent = String(report.gapCount);
      g.querySelector("[data-jp-gap-none]").hidden = report.gapCount > 0;
      report.gaps.forEach(function (u) {
        var sec = el("section", "jp-gr-urgency" + (u.urgency === null ? " is-unset" : ""));
        var n = 0;
        u.modules.forEach(function (m) {
          n += m.rows.length;
        });
        sec.appendChild(el("h4", "jp-gr-u", u.label + " (" + n + ")"));
        u.modules.forEach(function (m) {
          sec.appendChild(el("h5", "jp-gr-m", (m.module ? m.module + " · " : "") + m.title));
          var ul = el("ul", "jp-gr-rows");
          m.rows.forEach(function (r) {
            var li = el("li");
            li.appendChild(stepLink(r.step));
            li.appendChild(el("span", "jp-gr-cap", r.capability.label));
            li.appendChild(el("b", "jp-gr-st jp-gr-st-" + r.status, r.statusLabel));
            ul.appendChild(li);
          });
          sec.appendChild(ul);
        });
        body.appendChild(sec);
      });
      var grid = el("div", "jp-gr-grid");
      grid.appendChild(
        countsTable(
          "Per moment",
          report.perMoment.map(function (x) {
            return { link: stepLink(x.step), counts: x.counts };
          }),
          "Moment",
        ),
      );
      grid.appendChild(
        countsTable(
          "Per module",
          report.perModule.map(function (x) {
            return { label: (x.module ? x.module + " · " : "") + x.title, counts: x.counts };
          }),
          "Module",
        ),
      );
      body.appendChild(grid);
    }
    var print = g.querySelector("[data-jp-report-print]");
    if (print) {
      print.addEventListener("click", function () {
        root.classList.add("jp-print-report");
        window.print();
      });
      window.addEventListener("afterprint", function () {
        root.classList.remove("jp-print-report");
      });
    }
    var csvBtn = g.querySelector("[data-jp-report-csv]");
    if (csvBtn) {
      csvBtn.addEventListener("click", function () {
        var text = lib.csv(report || lib.summarise(model, answer), location.href);
        var url = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }));
        var a = el("a");
        a.href = url;
        a.download = "gap-report.csv";
        doc.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () {
          URL.revokeObjectURL(url);
        }, 1000);
      });
    }
    var clear = g.querySelector("[data-jp-gap-clear]");
    if (clear) {
      clear.addEventListener("click", function () {
        model.items.forEach(function (it) {
          [it.name.status, it.name.urgency].forEach(function (k) {
            if (!k) return;
            try {
              window.localStorage.removeItem("jv:" + k);
            } catch (_e) {
              /* storage unavailable */
            }
          });
        });
        draw();
      });
    }
    // Another tab answering the gap strip updates this one.
    window.addEventListener("storage", function (ev) {
      if (ev.key && ev.key.indexOf("jv:") === 0) draw();
    });
    draw();
  }

  function init() {
    oldAddress();
    each("[data-jp-presenter]", function (b) {
      b.addEventListener("click", function () {
        setPresenter(root.getAttribute("data-presenter") !== "on");
      });
    });
    each("[data-jp-dismiss]", function (b) {
      b.addEventListener("click", function () {
        setPresenter(false);
      });
    });
    each("[data-jp-reveal]", function (b) {
      b.addEventListener("click", function () {
        b.closest("[data-jp-whatif]").classList.add("is-open");
      });
    });
    each("[data-jp-hood-toggle]", function (b) {
      b.addEventListener("click", function () {
        setHood(!b.classList.contains("is-on"));
      });
    });
    if (store("jp:hood") === "off") setHood(false);
    each(".jp-proc", zoom);
    each("input[data-jv-store]", remember);
    each("[data-jp-map]", journeyMap);
    each(".jp-am", tabs);
    each("[data-jp-drawer]", drawer);
    // An ArchiMate drawing in an <object> takes its own proportions once it loads.
    each("object[data-jp-fit]", function (o) {
      function fit() {
        try {
          var svg = o.contentDocument && o.contentDocument.documentElement;
          var vb = svg && svg.viewBox && svg.viewBox.baseVal;
          if (vb && vb.width && vb.height) {
            o.style.aspectRatio = vb.width + " / " + vb.height;
            o.style.minHeight = "0";
          }
        } catch (_e) {
          /* another origin: keep the default height */
        }
      }
      o.addEventListener("load", fit);
      fit();
    });
    each("[data-jp-gapreport]", gapReport);
    each("[data-jv-print]", function (b) {
      b.addEventListener("click", function () {
        window.print();
      });
    });
    doc.addEventListener("keydown", function (ev) {
      var t = ev.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
      var go = null;
      if (ev.key === "ArrowRight" || ev.key === "PageDown") go = linkHref("next");
      else if (ev.key === "ArrowLeft" || ev.key === "PageUp") go = linkHref("prev");
      else if (ev.key === "w" || ev.key === "W") toggleWhatIf();
      else if (ev.key === "t" || ev.key === "T") {
        var b = doc.querySelector("[data-jp-hood-toggle]");
        if (b) setHood(!b.classList.contains("is-on"));
      }
      if (go) {
        ev.preventDefault();
        location.href = go;
      }
    });
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
  else init();
})();
