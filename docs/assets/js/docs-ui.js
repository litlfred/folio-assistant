/*
 * Docs-site UI: a QR of the current page in the sidebar header, and zoom /
 * full-width controls on the workflow figures.
 *
 * Loaded as an external same-origin script with no inline handlers, so the
 * site needs no script-src relaxation. Nothing here interpolates a URL into
 * markup: the QR carries the address in module geometry, and the caption is
 * set through textContent. The only innerHTML assignment takes the vendored
 * encoder's own <svg>, which is built from bits rather than from the string.
 *
 * Depends on vendor/qrcode.js and vendor/qrcode_UTF8.js being loaded first.
 * Cross-checked by scripts/tests/qr.test.js, which decodes the encoder's
 * output with an independent reader.
 */
(function () {
  "use strict";

  var ZOOM_STEPS = [0.5, 0.67, 0.8, 1, 1.25, 1.5, 2, 3, 4];
  var DEFAULT_STEP = 3; // index of 1.0

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text != null) node.textContent = text;
    return node;
  }

  /* ── Header QR ───────────────────────────────────────────────────────── */

  // A static glyph: three finder squares and a scatter of modules. Inline so
  // it needs no extra request and inherits the header's colour.
  var GLYPH =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M3 3h7v7H3V3zm2 2v3h3V5H5zm9-2h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5z"/>' +
    '<path d="M13 13h3v3h-3v-3zm5 0h3v2h-3v-2zm-5 5h2v3h-2v-3zm4 1h4v2h-4v-2zm2-3h2v2h-2v-2z"/>' +
    "</svg>";

  function mountQr() {
    var header = document.querySelector(".site-header");
    var title = header && header.querySelector(".site-title");
    if (!title || typeof qrcode !== "function") return;

    var host = el("div", { class: "fa-qr-host", "data-open": "false" });
    title.parentNode.insertBefore(host, title);
    host.appendChild(title);

    var toggle = el("button", {
      type: "button",
      class: "fa-qr-toggle",
      "aria-label": "Show a QR code linking to this page",
      "aria-expanded": "false",
    });
    toggle.innerHTML = GLYPH; // static markup defined above, no input involved
    host.appendChild(toggle);

    var panel = el("button", {
      type: "button",
      class: "fa-qr-panel",
      "aria-label": "Hide the QR code",
    });
    var art = el("span");
    var caption = el("span", { class: "fa-qr-caption" });
    panel.appendChild(art);
    panel.appendChild(caption);
    host.appendChild(panel);

    function render() {
      var url = window.location.href;
      var q = qrcode(0, "M");
      q.addData(url);
      q.make();
      // createSvgTag builds the tag from module bits; the URL is not present
      // in the string it returns.
      art.innerHTML = q.createSvgTag({ scalable: true, margin: 4 });
      caption.textContent = url;
    }

    function open(isOpen) {
      if (isOpen) render();
      host.setAttribute("data-open", isOpen ? "true" : "false");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      (isOpen ? panel : toggle).focus();
    }

    toggle.addEventListener("click", function () { open(true); });
    panel.addEventListener("click", function () { open(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && host.getAttribute("data-open") === "true") open(false);
    });
    // An in-page anchor changes the address without a reload, so a code left
    // open would go stale and point somewhere the reader is no longer at.
    window.addEventListener("hashchange", function () {
      if (host.getAttribute("data-open") === "true") render();
    });
  }

  /* ── Figure zoom and full width ──────────────────────────────────────── */

  function mountFigure(scope, isPlain) {
    if (scope.dataset.faTools === "1") return;
    scope.dataset.faTools = "1";
    scope.classList.add("fa-figure-scope");
    if (isPlain) scope.classList.add("fa-plain");

    var step = DEFAULT_STEP;
    var tools = el("div", { class: "fa-figure-tools", role: "group", "aria-label": "Figure view controls" });
    var out = el("button", { type: "button", "aria-label": "Zoom out" }, "−");
    var level = el("span", { class: "fa-zoom-level", "aria-live": "polite" }, "100%");
    var into = el("button", { type: "button", "aria-label": "Zoom in" }, "+");
    var reset = el("button", { type: "button", "aria-label": "Reset zoom" }, "Reset");
    var wide = el("button", { type: "button", "aria-label": "Expand to the full display width", "aria-pressed": "false" }, "Full width");

    function apply() {
      var z = ZOOM_STEPS[step];
      scope.style.setProperty("--fa-zoom", String(z));
      level.textContent = Math.round(z * 100) + "%";
      out.disabled = step === 0;
      into.disabled = step === ZOOM_STEPS.length - 1;
    }
    out.addEventListener("click", function () { if (step > 0) { step--; apply(); } });
    into.addEventListener("click", function () { if (step < ZOOM_STEPS.length - 1) { step++; apply(); } });
    reset.addEventListener("click", function () { step = DEFAULT_STEP; apply(); });
    wide.addEventListener("click", function () {
      var on = scope.classList.toggle("is-fullwidth");
      wide.setAttribute("aria-pressed", on ? "true" : "false");
    });

    [out, level, into, reset, wide].forEach(function (n) { tools.appendChild(n); });
    scope.parentNode.insertBefore(tools, scope);
    apply();
  }

  function mountFigures() {
    document.querySelectorAll(".bpmn-figure").forEach(function (f) { mountFigure(f, false); });

    // Any other SVG in the body gets the same controls, wrapped so the
    // scrolling and sizing rules have something to attach to.
    document.querySelectorAll(".main-content img[src$='.svg'], .main-content svg").forEach(function (node) {
      if (node.closest(".bpmn-figure") || node.closest(".fa-qr-host")) return;
      if (node.closest(".fa-figure-scope")) return;
      var wrap = el("div", { class: "bpmn-figure" });
      node.parentNode.insertBefore(wrap, node);
      wrap.appendChild(node);
      mountFigure(wrap, true);
    });
  }

  function init() { mountQr(); mountFigures(); }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
