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
 * Cross-checked by scripts/tests/qr.test.ts, which decodes the encoder's
 * output with an independent reader.
 *
 * KNOWN LIMITATION, stated rather than hidden. Those tests cover the
 * ENCODER. Nothing tests the INTEGRATION -- whether the sidebar markup this
 * script hooks into is really what just-the-docs emits. `_config.yml` uses
 * `remote_theme: just-the-docs/just-the-docs` UNPINNED, so that markup can
 * change with no commit in this repo, and the site cannot be built in the
 * environment this was written in (no network for the remote theme, and no
 * DOM library to stand in for a browser).
 *
 * So the mount below DEGRADES LOUDLY rather than silently: several selectors
 * are tried, the control still mounts into the header when the title anchor
 * is not where it expects, and a miss warns to the console naming what was
 * looked for. A feature that quietly does nothing is indistinguishable from
 * a feature nobody clicked. This is mitigation, not verification.
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

  /* ── Colour scheme ───────────────────────────────────────────────────── */

  // A lightbulb: glass, filament, and the screw base. Same 24x24 box and the
  // same currentColor fill as the QR glyph so the two sit as a pair.
  var BULB_ON =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M12 2a7 7 0 0 0-4 12.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26A7 7 0 0 0 12 2zm-2 12.1A5 5 0 1 1 14 14.1l-.5.33V16h-3v-1.57l-.5-.33z"/>' +
    '<path d="M9 19h6v1.2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V19z"/>' +
    "</svg>";

  var BULB_OFF =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M12 2a7 7 0 0 0-4 12.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26A7 7 0 0 0 12 2zm-2 12.1A5 5 0 1 1 14 14.1l-.5.33V16h-3v-1.57l-.5-.33z" opacity="0.45"/>' +
    '<path d="M9 19h6v1.2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V19z" opacity="0.45"/>' +
    '<path d="M4.2 3.3 20.7 19.8l-1.4 1.4L2.8 4.7z"/>' +
    "</svg>";

  var SCHEME_KEY = "fa-color-scheme";

  // `site.color_scheme` from _config.yml, emitted by head_custom.html as a
  // JSON data block -- not executable script, so the page needs no
  // script-src relaxation for it.
  //
  // It matters because just-the-docs' first stylesheet is
  // `just-the-docs-default.css`, which is the CONFIGURED scheme compiled in.
  // `jtd.getTheme()` parses that filename, so on a fresh load it reports
  // "default", never "dark" -- and "default" means whatever this site chose.
  function configuredScheme() {
    var node = document.getElementById("fa-site-scheme");
    if (!node) return "light";
    try {
      var scheme = JSON.parse(node.textContent).scheme;
      return scheme === "dark" ? "dark" : "light";
    } catch (_e) {
      return "light";
    }
  }

  function storedScheme() {
    try { return window.localStorage.getItem(SCHEME_KEY); } catch (_e) { return null; }
  }

  function currentScheme() {
    var stored = storedScheme();
    if (stored === "light" || stored === "dark") return stored;
    if (window.jtd && typeof window.jtd.getTheme === "function") {
      var t = window.jtd.getTheme();
      if (t === "light" || t === "dark") return t;
    }
    return configuredScheme();
  }

  function applyScheme(name) {
    if (!window.jtd || typeof window.jtd.setTheme !== "function") {
      console.warn("docs-ui: jtd.setTheme is unavailable; the colour scheme was not changed. " +
                   "just-the-docs is an unpinned remote theme, so this is version drift.");
      return false;
    }
    // Always explicit. Passing "default" would work today and would break the
    // day _config.yml's color_scheme changes, because "default" is a moving
    // target and "dark" is not.
    window.jtd.setTheme(name);
    document.documentElement.setAttribute("data-fa-scheme", name);
    return true;
  }

  function mountThemeToggle(host, before) {
    var btn = el("button", { type: "button", class: "fa-qr-toggle fa-theme-toggle" });

    function paint(name) {
      // The icon shows the scheme you are IN, not the one you would get. A
      // lit bulb for light, a struck-through one for dark. Labelling it with
      // the destination instead is the other convention and is a coin-flip
      // either way; what is not optional is that the label says which.
      btn.innerHTML = name === "light" ? BULB_ON : BULB_OFF;
      btn.setAttribute("aria-label",
        name === "light" ? "Light mode is on — switch to dark" : "Dark mode is on — switch to light");
      btn.setAttribute("aria-pressed", name === "dark" ? "true" : "false");
    }

    var scheme = currentScheme();
    // Apply the stored choice even on first paint: `jtd.getTheme()` reflects
    // the stylesheet the server sent, which does not know what this reader
    // picked last visit.
    if (storedScheme()) applyScheme(scheme);
    else document.documentElement.setAttribute("data-fa-scheme", scheme);
    paint(scheme);

    btn.addEventListener("click", function () {
      var next = currentScheme() === "light" ? "dark" : "light";
      if (!applyScheme(next)) return;
      try { window.localStorage.setItem(SCHEME_KEY, next); } catch (_e) { /* private mode */ }
      paint(next);

      // No reload. Diagrams are pinned to Mermaid's LIGHT palette on a white
      // card in both schemes (docs/_includes/mermaid_config.js), so nothing on
      // the page needs re-rendering when the scheme changes. An earlier
      // version reloaded here because the diagram palette followed the scheme;
      // that coupling is gone and the reload went with it.
    });

    host.insertBefore(btn, before);
    return btn;
  }

  /* ── Header QR ───────────────────────────────────────────────────────── */

  // A static glyph: three finder squares and a scatter of modules. Inline so
  // it needs no extra request and inherits the header's colour.
  var GLYPH =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M3 3h7v7H3V3zm2 2v3h3V5H5zm9-2h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5z"/>' +
    '<path d="M13 13h3v3h-3v-3zm5 0h3v2h-3v-2zm-5 5h2v3h-2v-3zm4 1h4v2h-4v-2zm2-3h2v2h-2v-2z"/>' +
    "</svg>";

  // Ordered most specific first. just-the-docs has used `.site-title` across
  // many versions, but the theme is unpinned, so a miss here is configuration
  // drift rather than an impossible state.
  var TITLE_SELECTORS = [".site-title", "#site-title", ".site-header .site-title",
                         ".side-bar .site-title", ".site-header a"];
  var HEADER_SELECTORS = [".site-header", ".site-header-container", ".side-bar header",
                          ".side-bar"];

  function firstMatch(selectors) {
    for (var i = 0; i < selectors.length; i++) {
      var found = document.querySelector(selectors[i]);
      if (found) return found;
    }
    return null;
  }

  function mountQr() {
    if (typeof qrcode !== "function") {
      console.warn("docs-ui: QR encoder not loaded; vendor/qrcode.js must be included first.");
      return;
    }
    var title = firstMatch(TITLE_SELECTORS);
    var header = title ? title.parentNode : firstMatch(HEADER_SELECTORS);
    if (!header) {
      // The one unrecoverable case: no sidebar header of any shape.
      console.warn("docs-ui: no site header found (tried " + HEADER_SELECTORS.join(", ") +
                   "); the page QR was not mounted.");
      return;
    }
    if (!title) {
      // Degraded but usable: the control works, it just sits on its own
      // rather than beside a title it could not locate.
      console.warn("docs-ui: no site title found (tried " + TITLE_SELECTORS.join(", ") +
                   "); mounting the page QR into the header without it.");
    }

    var host = el("div", { class: "fa-qr-host", "data-open": "false" });
    if (title) {
      title.parentNode.insertBefore(host, title);
      host.appendChild(title);
    } else {
      header.appendChild(host);
    }

    var toggle = el("button", {
      type: "button",
      class: "fa-qr-toggle",
      "aria-label": "Show a QR code linking to this page",
      "aria-expanded": "false",
    });
    toggle.innerHTML = GLYPH; // static markup defined above, no input involved
    host.appendChild(toggle);

    // Left of the QR icon, per the header's reading order: the title, then
    // the scheme switch, then the code. Inserted before `toggle` rather than
    // appended, so it stays left of it if more controls are added later.
    mountThemeToggle(host, toggle);

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
    // Full-bleed by MEASUREMENT, not by the centred-element margin trick. The
    // figure sits in a content column offset right by the sidebar, so
    // `margin-left: calc(-1 * (100vw - 100%) / 2)` overshoots by about the
    // sidebar width at each edge -- which is what "way oversize" looked like.
    // Reading the element's own left edge needs no assumption about the
    // theme's geometry, and clientWidth excludes the scrollbar, which 100vw
    // does not.
    function applyFullWidth() {
      if (!scope.classList.contains("is-fullwidth")) {
        scope.style.marginLeft = "";
        scope.style.width = "";
        return;
      }
      scope.style.marginLeft = "";
      scope.style.width = "";
      var left = scope.getBoundingClientRect().left;
      scope.style.marginLeft = -left + "px";
      scope.style.width = document.documentElement.clientWidth + "px";
    }
    wide.addEventListener("click", function () {
      var on = scope.classList.toggle("is-fullwidth");
      wide.setAttribute("aria-pressed", on ? "true" : "false");
      applyFullWidth();
    });
    // The measured offset is only right for the width it was measured at.
    window.addEventListener("resize", applyFullWidth);

    // Scroll pass-through in full width.
    //
    // `overflow-x: auto` on the figure makes it a scroll container on BOTH
    // axes -- CSS promotes the other axis from `visible` to `auto` -- so in
    // full width, where the figure spans the whole viewport, a wheel anywhere
    // in that band is eaten by the figure instead of moving the page. The
    // band is mostly empty: the drawing is centred and the rest is padding.
    //
    // So: if the pointer is NOT over the drawing, and the figure is short
    // enough that scrolling INSIDE it is not what the reader can have meant,
    // send the wheel to the page. The height cut-off is the caller's --
    // 80% of the viewport -- and it is the right shape: a figure taller than
    // that has real vertical travel of its own and should keep its wheel.
    //
    // Only the vertical component is taken. Horizontal wheel (shift-wheel, or
    // a trackpad swipe) is how you pan a wide diagram from the empty band,
    // and that still works.
    var MAX_PASSTHROUGH_FRACTION = 0.8;

    scope.addEventListener("wheel", function (e) {
      if (!scope.classList.contains("is-fullwidth")) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;

      var viewport = document.documentElement.clientHeight;
      if (scope.getBoundingClientRect().height > MAX_PASSTHROUGH_FRACTION * viewport) return;

      var art = scope.querySelector("img, svg");
      if (art) {
        var a = art.getBoundingClientRect();
        if (e.clientX >= a.left && e.clientX <= a.right &&
            e.clientY >= a.top  && e.clientY <= a.bottom) return;
      }

      // deltaY is not always pixels: deltaMode 1 is lines and 2 is pages.
      // Scrolling by a raw line count moves the page by three pixels and
      // reads as the wheel being broken.
      var d = e.deltaY;
      if (e.deltaMode === 1) d *= 16;
      else if (e.deltaMode === 2) d *= viewport;

      e.preventDefault();
      window.scrollBy(0, d);
    }, { passive: false });

    [out, level, into, reset, wide].forEach(function (n) { tools.appendChild(n); });
    scope.parentNode.insertBefore(tools, scope);
    apply();
  }

  function mountFigures() {
    document.querySelectorAll(".bpmn-figure").forEach(function (f) { mountFigure(f, false); });

    // Any other SVG in the body gets the same controls -- but only if it is a
    // FIGURE. The first version of this matched `.main-content svg`, which in
    // just-the-docs also matches the anchor-heading link icons and the search
    // glyph, so every heading on the page grew a zoom toolbar squeezed into a
    // few pixels. An icon is distinguishable from a figure three ways, and all
    // three are cheap:
    //   - it lives inside something interactive or navigational;
    //   - it says so in its class name;
    //   - it is small.
    // Requiring all three to pass keeps a genuinely small diagram out of the
    // controls, which is the right failure direction: a missing toolbar is a
    // nuisance, a toolbar on every heading is unusable.
    var ICON_CONTEXT = "a, button, nav, label, summary, .search, .site-header, .site-footer, .breadcrumb-nav";
    var MIN_FIGURE_PX = 240;

    document.querySelectorAll(".main-content img[src$='.svg'], .main-content svg").forEach(function (node) {
      if (node.closest(".bpmn-figure") || node.closest(".fa-qr-host")) return;
      if (node.closest(".fa-figure-scope")) return;
      if (node.closest(ICON_CONTEXT)) return;
      if (/icon/i.test(node.getAttribute("class") || "")) return;
      var box = node.getBoundingClientRect();
      if (box.width < MIN_FIGURE_PX && box.height < MIN_FIGURE_PX) return;
      // Mermaid renders into a wrapper element; wrap THAT rather than the
      // <svg>, so the scroll container and the zoom rules sit outside
      // everything the renderer owns and it is not fighting us for the
      // element's style.
      //
      // The selector is `.language-mermaid`, which is what THIS theme emits
      // and what it hands to `mermaid.run()` -- see just-the-docs
      // `_includes/components/mermaid.html`. It was `.mermaid`, Mermaid's own
      // conventional class, which this theme never sets: `closest` returned
      // null every time, so the <svg> was wrapped directly and the renderer
      // kept ownership of the element the zoom rules were trying to size.
      var target = node.closest(".language-mermaid") || node;
      var wrap = el("div", { class: "fa-figure-wrap" });
      target.parentNode.insertBefore(wrap, target);
      wrap.appendChild(target);
      mountFigure(wrap, true);
    });
  }

  function init() {
    mountQr();
    mountFigures();

    // Mermaid renders AFTER this runs, and nothing tells us when.
    //
    // just-the-docs loads it as `<script type="module">` and calls
    // `mermaid.run()` after the dynamic import resolves, which is necessarily
    // later than DOMContentLoaded. So the single scan above sees a
    // `.language-mermaid` element holding source text and no <svg> at all --
    // which is why the diagrams on this site had no zoom, no full width and
    // no wrapper, while the BPMN figures (plain <img>, present in the HTML)
    // had all three. Re-scanning on a timer would work and would also be a
    // guess about how long the import takes.
    if (!("MutationObserver" in window)) return;
    var main = document.querySelector(".main-content") || document.body;
    var pending = null;
    var observer = new MutationObserver(function () {
      // Coalesce: Mermaid emits many mutations per diagram, and mountFigures
      // is idempotent but not free.
      if (pending !== null) return;
      pending = window.setTimeout(function () {
        pending = null;
        mountFigures();
      }, 50);
    });
    observer.observe(main, { childList: true, subtree: true });
    // Mermaid is the only thing expected to add a figure after load, so stop
    // watching once it has had its chance. An observer left on the document
    // body for the life of the page fires on every future DOM change,
    // including the ones mountFigures itself makes.
    window.setTimeout(function () { observer.disconnect(); }, 10000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
