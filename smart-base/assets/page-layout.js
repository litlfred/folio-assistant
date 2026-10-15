// page-layout.js: the scrolling half of page-layout.css (cat-harness-tools
// `scripts/page-layout.ts`, which says why). Three things, each a no-op on a
// page that does not need it. Plain ES5, no dependencies, idempotent.
//
// 1. The stuck bar's height as `--fa-page-bar-h` on <html>, which the
//    stylesheet's `scroll-padding-top` reads, so an anchor or a focus scroll
//    lands below the bar rather than under it. 0 while the bar is not stuck.
// 2. A `#hash` whose target the page draws AFTER load (a thin page draws from
//    JSON): scrolled to once, when it appears. The browser tried at load, when
//    there was nothing to scroll to.
// 3. Back, forward and reload return to where the reader was. The browser's
//    own restore ran before the drawn content existed and stopped short.
(function () {
  "use strict";
  var root = document.documentElement;
  if (root.hasAttribute("data-fa-page-layout")) return;
  root.setAttribute("data-fa-page-layout", "");

  function bar() {
    return document.querySelector(".fa-page-bar");
  }

  function measure() {
    var b = bar();
    if (!b) return;
    var stuck = window.getComputedStyle(b).position === "sticky";
    root.style.setProperty("--fa-page-bar-h", stuck ? Math.ceil(b.getBoundingClientRect().height) + "px" : "0px");
  }

  // Stop helping the moment the reader scrolls on their own.
  var reader = false;
  function readerMoved() { reader = true; }
  ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (t) {
    window.addEventListener(t, readerMoved, { passive: true, once: true });
  });

  function settleHash() {
    var h = window.location.hash;
    if (!h || h.length < 2) return;
    var id;
    try { id = decodeURIComponent(h.slice(1)); } catch (_e) { return; }
    if (document.getElementById(id) || typeof MutationObserver === "undefined") return;
    var mo = new MutationObserver(function () {
      var t = document.getElementById(id);
      if (!t) return;
      mo.disconnect();
      if (!reader) t.scrollIntoView();
    });
    mo.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(function () { mo.disconnect(); }, 15000);
  }

  var KEY = "fa-page-scroll:" + window.location.pathname;
  function navigationType() {
    try {
      var e = window.performance.getEntriesByType("navigation")[0];
      return e ? e.type : "";
    } catch (_e) { return ""; }
  }
  function remember() {
    try { window.sessionStorage.setItem(KEY, String(Math.round(window.scrollY || 0))); } catch (_e) { /* private mode */ }
  }
  function restore() {
    var type = navigationType();
    if (type !== "back_forward" && type !== "reload") return;
    var y = 0;
    try { y = Number(window.sessionStorage.getItem(KEY)) || 0; } catch (_e) { return; }
    if (y <= 0) return;
    var tries = 0;
    (function step() {
      if (reader || Math.abs((window.scrollY || 0) - y) <= 2) return;
      if (root.scrollHeight - window.innerHeight >= y) { window.scrollTo(0, y); return; }
      if (++tries < 50) window.setTimeout(step, 100);
    })();
  }

  // The browser jumped to the hash before the bar was measured, so the
  // target may sit under the bar: once more, now the padding is known.
  function rejumpHash() {
    var h = window.location.hash;
    if (!h || h.length < 2 || reader) return;
    var t;
    try { t = document.getElementById(decodeURIComponent(h.slice(1))); } catch (_e) { return; }
    if (t) t.scrollIntoView();
  }

  function start() {
    measure();
    var b = bar();
    if (b && typeof ResizeObserver !== "undefined") new ResizeObserver(measure).observe(b);
    window.addEventListener("resize", measure);
    if (navigationType() !== "back_forward" && navigationType() !== "reload") rejumpHash();
    settleHash();
    restore();
  }

  window.addEventListener("pagehide", remember);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
