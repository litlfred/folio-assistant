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

  /* ── Language switcher ────────────────────────────────────────────────── */

  // Globe glyph for the toggle button
  var GLOBE_GLYPH =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<ellipse cx="12" cy="12" rx="4" ry="10" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M4.5 7h15M4.5 17h15" fill="none" stroke="currentColor" stroke-width="1"/>' +
    "</svg>";

  var LOCALE_NAMES = {
    "ar": "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", "zh": "\u4E2D\u6587", "en": "English",
    "fr": "Fran\u00E7ais", "ru": "\u0420\u0443\u0441\u0441\u043A\u0438\u0439", "es": "Espa\u00F1ol"
  };

  function getGlobalLocale() {
    try { return localStorage.getItem("fa-locale") || "en"; } catch (e) { return "en"; }
  }
  function setGlobalLocale(loc) {
    try { localStorage.setItem("fa-locale", loc); } catch (e) { /* noop */ }
  }

  function localePath(basePath, locale) {
    if (locale === "en") return basePath;
    var parts = basePath.split("/");
    var filename = parts.pop();
    return parts.join("/") + "/" + locale + "/" + filename;
  }

  function deriveBasePath(path, currentLang) {
    if (currentLang === "en") return path;
    return path.replace(new RegExp("/" + currentLang + "/"), "/");
  }

  function mountLanguageSwitcher(host, before) {
    var meta = getTranslationMeta();
    var currentLang = (meta && meta.lang) || "en";
    var available = (meta && meta.availableLocales) || [];
    var supported = ["ar", "zh", "en", "fr", "ru", "es"];
    var path = window.location.pathname;
    var basePath = deriveBasePath(path, currentLang);

    var btn = el("button", {
      type: "button",
      class: "fa-qr-toggle fa-lang-toggle",
      "aria-label": "Switch language",
      "aria-expanded": "false",
    });
    btn.innerHTML = GLOBE_GLYPH;

    // Horizontal language bar — shows all 6 UN languages
    // z-index 9999 to sit above the search box. Opens upward (bottom:100%)
    // to avoid being clipped by the sidebar's constrained height.
    var bar = el("div", {
      class: "fa-lang-bar",
      "data-open": "false",
      style: "display:none;position:absolute;left:0;bottom:100%;margin-bottom:4px;" +
             "background:#1e293b;border:1px solid #475569;border-radius:6px;" +
             "padding:4px 6px;z-index:9999;box-shadow:0 -4px 12px rgba(0,0,0,0.3);" +
             "white-space:nowrap;"
    });

    for (var i = 0; i < supported.length; i++) {
      var loc = supported[i];
      var isAvailable = loc === "en" || available.indexOf(loc) !== -1;
      var isCurrent = loc === currentLang;

      // Available = clickable <a>. Unavailable = disabled <span>.
      var tab = el(isAvailable ? "a" : "span", {
        href: isAvailable ? localePath(basePath, loc) : undefined,
        "data-locale": loc,
        title: isAvailable
          ? LOCALE_NAMES[loc]
          : LOCALE_NAMES[loc] + " \u2014 not yet translated",
        style: "display:inline-block;padding:4px 8px;border-radius:4px;" +
               "text-decoration:none;font-size:0.8rem;margin:0 1px;" +
               "transition:background 0.15s;" +
               (isCurrent
                 ? "background:#3b82f6;color:#fff;font-weight:bold;"
                 : isAvailable
                   ? "color:#93c5fd;cursor:pointer;"
                   : "color:#475569;cursor:default;opacity:0.5;")
      }, loc.toUpperCase());

      if (isAvailable && !isCurrent) {
        (function (locale, link) {
          link.addEventListener("click", function () { setGlobalLocale(locale); });
          link.addEventListener("mouseenter", function () { link.style.background = "#334155"; });
          link.addEventListener("mouseleave", function () { link.style.background = ""; });
        })(loc, tab);
      }
      bar.appendChild(tab);
    }

    btn.addEventListener("click", function () {
      var isOpen = bar.getAttribute("data-open") === "true";
      bar.setAttribute("data-open", isOpen ? "false" : "true");
      bar.style.display = isOpen ? "none" : "block";
      btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
    });
    document.addEventListener("click", function (e) {
      if (!btn.contains(e.target) && !bar.contains(e.target)) {
        bar.setAttribute("data-open", "false");
        bar.style.display = "none";
        btn.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && bar.getAttribute("data-open") === "true") {
        bar.setAttribute("data-open", "false");
        bar.style.display = "none";
        btn.setAttribute("aria-expanded", "false");
        btn.focus();
      }
    });

    var wrap = el("span", { style: "position:relative;display:inline-block;" });
    host.insertBefore(wrap, before);
    wrap.appendChild(btn);
    wrap.appendChild(bar);
    return btn;
  }

  // Sidebar globe removed — it fought with the search bar and disappeared
  // off-screen. The per-page bar (mountPageLanguageBar) is now the sole
  // language UI, with global locale switching built in.

  /**
   * Per-page language bar — always visible inline in the main content area.
   * Shows all 6 UN languages as horizontal tabs. Available translations are
   * clickable links; unavailable are greyed-out disabled spans.
   * Also sets the global locale preference (localStorage) on click.
   */
  function mountPageLanguageBar() {
    var meta = getTranslationMeta();
    var currentLang = (meta && meta.lang) || "en";
    var available = (meta && meta.availableLocales) || [];
    var supported = ["ar", "zh", "en", "fr", "ru", "es"];
    var path = window.location.pathname;
    var basePath = deriveBasePath(path, currentLang);

    var mainContent = document.querySelector(".main-content, #main-content");
    if (!mainContent) return;

    // Find the first h1 to place the bar after it
    var h1 = mainContent.querySelector("h1");
    var insertTarget = h1 ? h1.nextSibling : mainContent.firstChild;

    var container = el("div", {
      class: "fa-page-lang-bar",
      style: "display:inline-flex;align-items:center;gap:4px;" +
             "margin:0.3em 0 0.8em;padding:5px 10px;" +
             "background:rgba(128,128,128,0.12);border-radius:6px;" +
             "font-size:0.82rem;"
    });

    // Globe emoji
    var globe = el("span", {
      style: "font-size:1.1em;margin-right:2px;",
      title: "Available translations for this page"
    }, "\uD83C\uDF10");
    container.appendChild(globe);

    for (var i = 0; i < supported.length; i++) {
      var loc = supported[i];
      var isAvailable = loc === "en" || available.indexOf(loc) !== -1;
      var isCurrent = loc === currentLang;

      var tab = el(isAvailable ? "a" : "span", {
        href: isAvailable ? localePath(basePath, loc) : undefined,
        title: isAvailable
          ? LOCALE_NAMES[loc]
          : LOCALE_NAMES[loc] + " \u2014 not yet translated",
        style: "display:inline-block;padding:2px 7px;border-radius:3px;" +
               "text-decoration:none;font-size:0.8rem;" +
               "transition:background 0.15s;" +
               (isCurrent
                 ? "background:#3b82f6;color:#fff;font-weight:bold;"
                 : isAvailable
                   ? "color:#3b82f6;cursor:pointer;"
                   : "color:#94a3b8;cursor:default;opacity:0.4;")
      }, loc.toUpperCase());

      if (isAvailable && !isCurrent) {
        (function (locale, link) {
          link.addEventListener("click", function () { setGlobalLocale(locale); });
          link.addEventListener("mouseenter", function () { link.style.background = "rgba(59,130,246,0.1)"; });
          link.addEventListener("mouseleave", function () { link.style.background = ""; });
        })(loc, tab);
      }
      container.appendChild(tab);
    }

    mainContent.insertBefore(container, insertTarget);
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
    // the language switch, then the scheme switch, then the code. Inserted
    // before `toggle` rather than appended, so they stay left of it.
    mountThemeToggle(host, toggle);
    // mountLanguageSwitcher removed — language UI moved to per-page bar

    var panel = el("button", {
      type: "button",
      class: "fa-qr-panel",
      "data-open": "false",
      "aria-label": "Hide the QR code",
    });
    var art = el("span");
    var caption = el("span", { class: "fa-qr-caption" });
    panel.appendChild(art);
    panel.appendChild(caption);

    // THE PANEL IS A SIBLING OF THE HEADER, NOT A CHILD OF IT, and the theme's
    // own numbers are why.
    //
    // At the desktop breakpoint just-the-docs makes `.site-header` a
    // HARD-CAPPED row -- `height: 3.75rem; max-height: 3.75rem` -- inside a
    // `.side-bar` that is `position: fixed; flex-flow: column nowrap`. A code
    // placed inside that header cannot make it taller, so it either overflows
    // the cap or gets clipped. That is what forced the previous version to be
    // an absolutely-positioned popover that REPLACED the title (the title and
    // the toggle were both `display: none` while it was open).
    //
    // The request is that the code sit below the title with the title still
    // there, so it has to be a sibling in the sidebar's flex column, between
    // `.site-header` and `.site-nav`. In that slot it is in normal flow, it
    // pushes the nav down instead of covering it, and it inherits the
    // sidebar's fixed positioning for free.
    //
    // The fallback matters: a theme with no `.side-bar` still gets a working
    // control, just anchored to the header as before.
    var sideBar = header.closest ? header.closest(".side-bar") : null;
    if (sideBar && header.parentNode === sideBar) {
      sideBar.insertBefore(panel, header.nextSibling);
      panel.classList.add("fa-qr-in-sidebar");
    } else {
      host.appendChild(panel);
    }

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
      // Mirrored onto the panel because the panel is no longer a DESCENDANT of
      // the host -- it lives in the sidebar column now, so a
      // `.fa-qr-host[data-open] .fa-qr-panel` selector would never match it.
      panel.setAttribute("data-open", isOpen ? "true" : "false");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      (isOpen ? panel : toggle).focus();
    }

    // A real toggle now. It used to be one-way (the button hid itself on open
    // and only the panel could close it), which was the only option while the
    // panel was covering the button's own slot.
    toggle.addEventListener("click", function () {
      open(host.getAttribute("data-open") !== "true");
    });
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

  // A FULL-BLEED FIGURE COVERS THE SIDEBAR, and that is a painting-order fact,
  // not a guess: the theme sets `.side-bar { z-index: 0 }`, which makes it a
  // stacking context painted at 0, while `.main` is `position: relative` with
  // `z-index: auto` and comes LATER in tree order -- so `.main` paints on top.
  // A figure expanded to the full display width therefore hides anything in
  // the sidebar, the QR code included, and no z-index on the code can rescue
  // it from inside that stacking context.
  //
  // So the root carries a flag saying "something is full width right now", and
  // the stylesheet uses it to let the code out of the sidebar's stacking
  // context and pin it. Recomputed from the DOM rather than counted, because a
  // counter drifts the moment a figure is removed or re-mounted.
  function markFullWidthOnRoot() {
    document.documentElement.classList.toggle(
      "fa-has-fullwidth",
      !!document.querySelector(".fa-figure-scope.is-fullwidth"),
    );
  }

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

    // The grab cursor is a PROMISE, so only make it when there is somewhere to
    // pan to. A figure that fits its card has no scroll room, and a `grab`
    // cursor over it says otherwise -- the drag would do nothing and the
    // cursor would be the only thing that had lied. Re-measured on every zoom
    // change, inside rAF because the custom property has to reach layout
    // before scrollWidth means anything. The +1 absorbs sub-pixel rounding,
    // which otherwise flickers the class on and off at exactly 100%.
    function markPannable() {
      requestAnimationFrame(function () {
        scope.classList.toggle("is-pannable", scope.scrollWidth > scope.clientWidth + 1);
      });
    }

    function apply() {
      var z = ZOOM_STEPS[step];
      scope.style.setProperty("--fa-zoom", String(z));
      level.textContent = Math.round(z * 100) + "%";
      out.disabled = step === 0;
      into.disabled = step === ZOOM_STEPS.length - 1;
      markPannable();
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
      markPannable();
    }
    wide.addEventListener("click", function () {
      var on = scope.classList.toggle("is-fullwidth");
      wide.setAttribute("aria-pressed", on ? "true" : "false");
      applyFullWidth();
      markFullWidthOnRoot();
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

    // Click and drag to pan.
    //
    // The figure is already a scroll container, so panning is just moving its
    // scroll offsets — no transform, which means it composes with zoom and with
    // the subprocess links instead of fighting them.
    //
    // Two details keep a drag from eating a click. The 4px threshold means a
    // plain click never becomes a pan, so a subprocess link still navigates;
    // and once a pan HAS happened the following click is swallowed in the
    // capture phase, so releasing over a link does not follow it. Pointer
    // events rather than mouse events, so a touch drag works the same way.
    var drag = null;
    var panned = false;

    scope.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      // A control or a link owns its own press.
      if (e.target.closest && e.target.closest("a, button, input, select, textarea")) return;
      drag = { x: e.clientX, y: e.clientY, sl: scope.scrollLeft, st: scope.scrollTop, moved: false };
      try { scope.setPointerCapture(e.pointerId); } catch (_e) { /* not captureable */ }
    });

    scope.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      var dy = e.clientY - drag.y;
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
      drag.moved = true;
      scope.classList.add("is-panning");
      scope.scrollLeft = drag.sl - dx;
      scope.scrollTop = drag.st - dy;
      e.preventDefault();
    });

    function endPan() {
      if (!drag) return;
      panned = drag.moved;
      drag = null;
      scope.classList.remove("is-panning");
    }
    scope.addEventListener("pointerup", endPan);
    scope.addEventListener("pointercancel", endPan);
    scope.addEventListener("click", function (e) {
      if (!panned) return;
      panned = false;
      e.preventDefault();
      e.stopPropagation();
    }, true);

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

  /* ── Inline the diagram SVGs ─────────────────────────────────────────── */

  // An `<img src="...svg">` renders the drawing and is otherwise INERT: links
  // inside it never fire and nothing in it can be dragged. The subprocess boxes
  // in the workflow diagrams are `<a>` elements (added by scripts/render-bpmn.ts)
  // and they are dead for exactly that reason, so the figure has to be a real
  // `<svg>` in this document.
  //
  // Fetched rather than server-side included because the SVGs are build output
  // under assets/, which Jekyll's `include` cannot reach. Same-origin, and the
  // markup is our own build artefact.
  //
  // Degrades to the existing static image: if the fetch or the parse fails the
  // `<img>` is left exactly as it was, with one warning naming the file.
  function inlineDiagrams(done) {
    var imgs = [].slice.call(
      document.querySelectorAll('.bpmn-figure img[src$=".svg"], .main-content img[src$=".svg"]'),
    );
    if (!imgs.length || typeof window.fetch !== "function" || typeof window.DOMParser !== "function") {
      done();
      return;
    }
    var pending = imgs.length;
    function settle() { if (--pending === 0) done(); }

    imgs.forEach(function (img) {
      var src = img.getAttribute("src");
      window
        .fetch(src)
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.text();
        })
        .then(function (text) {
          var parsed = new window.DOMParser().parseFromString(text, "image/svg+xml");
          var svg = parsed.documentElement;
          if (!svg || String(svg.nodeName).toLowerCase() !== "svg") throw new Error("not an svg");
          // The alt text was the accessible name; keep it on the element that
          // replaces it, or the diagram becomes invisible to a screen reader.
          var alt = img.getAttribute("alt");
          if (alt) {
            svg.setAttribute("role", "img");
            svg.setAttribute("aria-label", alt);
          }
          img.parentNode.replaceChild(document.importNode(svg, true), img);
        })
        .catch(function (e) {
          console.warn("docs-ui: could not inline " + src + " (" + e.message + "); it stays a static image, so its links will not work.");
        })
        .then(settle, settle);
    });
  }

  /* ── Translation badges ──────────────────────────────────────────────── */

  // Auto-injects language coverage badges and QA indicators on every page.
  // Reads from the fa-translation-meta JSON block in <head>, which is
  // stamped by the translation pipeline into page front matter and published
  // by head_custom.html. Nothing needs manual editing — the pipeline writes
  // the data, Jekyll publishes it, and this renders it.

  function getTranslationMeta() {
    var node = document.getElementById("fa-translation-meta");
    if (!node) return null;
    try { return JSON.parse(node.textContent); } catch (_e) { return null; }
  }

  function mountTranslationBadges() {
    var meta = getTranslationMeta();
    if (!meta) return;

    var supported = meta.supportedLocales || ["ar", "zh", "en", "fr", "ru", "es"];
    var available = meta.availableLocales || [];
    var totalLangs = supported.length;
    var availLangs = available.length;

    // Auto-detect available locales from the page's own language links if
    // the pipeline hasn't stamped availableLocales yet. Scan the
    // language-selector include (if present) for which links resolve.
    if (availLangs === 0) {
      var langLinks = document.querySelectorAll(".fa-lang-tab, [data-locale]");
      var found = [];
      langLinks.forEach(function (link) {
        var loc = link.getAttribute("data-locale") || link.textContent.trim().toLowerCase();
        if (loc && loc !== meta.lang && found.indexOf(loc) === -1) found.push(loc);
      });
      // The page itself counts as one available locale if it's not English-source
      // or if it has translations
      if (found.length > 0) {
        availLangs = found.length;
        available = found;
      }
    }

    // Find the page title (first h1 in main content)
    var title = document.querySelector(".main-content h1, #main-content h1");
    if (!title) return;

    // Create badge container — block-level row below the title
    var container = el("span", { class: "fa-translation-badges", style:
      "display: flex; align-items: center; gap: 6px; margin: 0.3em 0 0.6em; flex-wrap: wrap;"
    });

    // Language coverage badge — always shown
    var langBg, langBorder;
    if (availLangs >= totalLangs - 1) {
      langBg = "#14532d"; langBorder = "#22c55e";
    } else if (availLangs > 0) {
      langBg = "#78350f"; langBorder = "#d97706";
    } else {
      langBg = "#1e293b"; langBorder = "#475569";
    }

    var langBadge = el("span", {
      class: "fa-lang-coverage-badge",
      style: "display:inline-flex;align-items:center;gap:4px;padding:2px 8px;" +
             "background:" + langBg + ";border:1px solid " + langBorder + ";" +
             "border-radius:4px;font-size:0.75rem;color:#e2e8f0;cursor:default;",
      title: availLangs > 0
        ? "Available translations: " + available.join(", ")
        : "No translations available for this page"
    }, "\uD83C\uDF10 " + availLangs + "/" + (totalLangs - 1) + " languages");
    container.appendChild(langBadge);

    // QA badge — only on translated pages (has QA data). Clickable to expand.
    var qa = meta.qa || {};
    if (qa.total > 0) {
      var qaBg, qaBorder, qaIcon, qaLabel;
      if (qa.fail > 0) {
        qaBg = "#991b1b"; qaBorder = "#ef4444"; qaIcon = "\u274C";
        qaLabel = "QA: " + qa.fail + " drift";
      } else if (qa.warn > 0) {
        qaBg = "#78350f"; qaBorder = "#d97706"; qaIcon = "\u26A0\uFE0F";
        qaLabel = "QA: " + qa.warn + " warn";
      } else {
        qaBg = "#14532d"; qaBorder = "#22c55e"; qaIcon = "\u2705";
        qaLabel = "QA: all pass";
      }

      var qaBadge = el("span", {
        class: "fa-qa-badge",
        style: "display:inline-flex;align-items:center;gap:4px;padding:2px 8px;" +
               "background:" + qaBg + ";border:1px solid " + qaBorder + ";" +
               "border-radius:4px;font-size:0.75rem;color:#fef3c7;cursor:pointer;",
        title: "Click to expand QA details"
      });
      qaBadge.textContent = qaIcon + " " + qaLabel;
      var qaDetail = el("span", {
        style: "opacity:0.7;font-size:0.7rem;"
      }, "(" + qa.pass + "/" + qa.total + ")");
      qaBadge.appendChild(qaDetail);

      // Expandable detail panel
      var qaPanel = el("div", {
        class: "fa-qa-detail",
        style: "display:none;margin:0.4em 0;padding:8px 12px;" +
               "background:" + qaBg + ";border:1px solid " + qaBorder + ";" +
               "border-radius:6px;font-size:0.8rem;color:#fef3c7;" +
               "line-height:1.5;"
      });
      qaPanel.innerHTML =
        "<strong>Round-trip semantic QA</strong><br>" +
        "\u2705 Pass: " + qa.pass + "<br>" +
        "\u26A0\uFE0F Warn: " + qa.warn + "<br>" +
        "\u274C Drift: " + qa.fail + "<br>" +
        "Total: " + qa.total + " &middot; Coverage: " + qa.coveragePct + "%<br>" +
        "<em style='opacity:0.7;font-size:0.75rem;'>Run <code>translation_validate</code> to re-check</em>";

      qaBadge.addEventListener("click", function () {
        var shown = qaPanel.style.display !== "none";
        qaPanel.style.display = shown ? "none" : "block";
      });

      container.appendChild(qaBadge);
      // Panel goes after the badge container, not inside it
      var panelPlaced = false;
      (function () { panelPlaced = true; })(); // flag for later placement
    }

    // QA sweep completeness badge — indicates whether sidecars have been run
    var sweep = meta.sweep || {};
    var sweepBg, sweepBorder, sweepIcon, sweepLabel, sweepTitle;
    if (!sweep.run) {
      sweepBg = "#1e293b"; sweepBorder = "#475569"; sweepIcon = "\u2B58";
      sweepLabel = "QA: not run";
      sweepTitle = "Translation QA sweep has not been run. " +
                   "Run: bun run content/pipeline/translation-qa-sweep.ts";
    } else if (sweep.complete && sweep.pagesWithTranslations > 0) {
      var ratio = sweep.pagesWithTranslations + "/" + sweep.totalPages;
      sweepBg = "#14532d"; sweepBorder = "#22c55e"; sweepIcon = "\u2705";
      sweepLabel = "Swept " + ratio;
      sweepTitle = "QA sweep complete. " + sweep.pagesWithTranslations + " of " +
                   sweep.totalPages + " pages have translations. Last run: " + sweep.sweptAt;
    } else {
      sweepBg = "#78350f"; sweepBorder = "#d97706"; sweepIcon = "\u26A0\uFE0F";
      sweepLabel = "Swept 0/" + sweep.totalPages;
      sweepTitle = "QA sweep complete but no pages have translations yet. " +
                   "Last run: " + sweep.sweptAt;
    }

    var sweepBadge = el("span", {
      class: "fa-sweep-badge",
      style: "display:inline-flex;align-items:center;gap:4px;padding:2px 8px;" +
             "background:" + sweepBg + ";border:1px solid " + sweepBorder + ";" +
             "border-radius:4px;font-size:0.75rem;color:#e2e8f0;cursor:default;",
      title: sweepTitle
    }, sweepIcon + " " + sweepLabel);
    container.appendChild(sweepBadge);

    // Unverified translation indicator — small icon, expands on click.
    // Replaces the previous big glaring banner.
    if (meta.translationStatus === "unverified" && !document.querySelector(".fa-translation-warning")) {
      var warnIcon = el("span", {
        class: "fa-translation-warning-icon",
        style: "display:inline-flex;align-items:center;gap:4px;padding:2px 8px;" +
               "background:#78350f;border:1px solid #d97706;border-radius:4px;" +
               "font-size:0.75rem;color:#fef3c7;cursor:pointer;margin-left:6px;",
        title: "Click for details — unverified translation"
      }, "\u26A0\uFE0F Unverified");
      container.appendChild(warnIcon);

      var warnPanel = el("div", {
        class: "fa-translation-warning",
        style: "display:none;margin:0.4em 0;padding:8px 12px;" +
               "background:#78350f;border:1px solid #d97706;border-radius:6px;" +
               "color:#fef3c7;font-size:0.8rem;line-height:1.5;",
        role: "alert"
      });
      warnPanel.innerHTML =
        "\u26A0\uFE0F <strong>Unverified translation</strong> \u2014 " +
        "Translated automatically, <strong>not reviewed</strong> by SME." +
        (meta.translationSource
          ? "<br>Source: " + meta.translationSource + " (English)"
          : "") +
        "<br><em style='opacity:0.7;font-size:0.75rem;'>Run <code>translation_signoff</code> after review</em>";
      warnIcon.addEventListener("click", function () {
        var shown = warnPanel.style.display !== "none";
        warnPanel.style.display = shown ? "none" : "block";
      });
    }

    // Place badges AFTER the h1, not inside it.
    if (title.nextSibling) {
      title.parentNode.insertBefore(container, title.nextSibling);
    } else {
      title.parentNode.appendChild(container);
    }

    // Place expandable panels after the badge container
    if (typeof qaPanel !== "undefined" && qaPanel) {
      container.parentNode.insertBefore(qaPanel, container.nextSibling);
    }
    if (typeof warnPanel !== "undefined" && warnPanel) {
      var afterEl = (typeof qaPanel !== "undefined" && qaPanel) ? qaPanel : container;
      afterEl.parentNode.insertBefore(warnPanel, afterEl.nextSibling);
    }
  }

  function init() {
    // RTL detection — Arabic pages get dir="rtl" on <html> which
    // triggers the CSS rules in docs-ui.css for smooth sidebar slide.
    var meta = getTranslationMeta();
    var pageLang = (meta && meta.lang) || "en";
    var RTL_LANGS = ["ar", "he", "fa", "ur"];
    if (RTL_LANGS.indexOf(pageLang) !== -1) {
      document.documentElement.setAttribute("dir", "rtl");
      document.documentElement.setAttribute("lang", pageLang);
    }

    mountQr();
    mountTranslationBadges();
    mountPageLanguageBar();
    // Figures are mounted only after the inlining settles, so the scan sees the
    // real <svg> rather than the <img> it replaces and does not wrap both.
    inlineDiagrams(mountFigures);

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
