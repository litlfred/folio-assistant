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

  function gapList(g) {
    var labels = {};
    try {
      labels = JSON.parse(g.getAttribute("data-jp-gap-labels") || "{}");
    } catch (_e) {
      labels = {};
    }
    function draw() {
      var n = 0;
      Array.prototype.forEach.call(g.querySelectorAll("[data-jp-gap]"), function (li) {
        var v = store("jv:" + li.getAttribute("data-jp-gap"));
        var marked = v !== null && v !== li.getAttribute("data-jp-gap-ok");
        li.hidden = !marked;
        if (marked) {
          n++;
          li.querySelector("[data-jp-gap-value]").textContent = labels[v] || v;
        }
      });
      g.querySelector("[data-jp-gap-count]").textContent = String(n);
      g.querySelector("[data-jp-gap-none]").hidden = n > 0;
    }
    var clear = g.querySelector("[data-jp-gap-clear]");
    if (clear) {
      clear.addEventListener("click", function () {
        Array.prototype.forEach.call(g.querySelectorAll("[data-jp-gap]"), function (li) {
          try {
            window.localStorage.removeItem("jv:" + li.getAttribute("data-jp-gap"));
          } catch (_e) {
            /* storage unavailable */
          }
        });
        draw();
      });
    }
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
    each("[data-jp-gaplist]", gapList);
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
