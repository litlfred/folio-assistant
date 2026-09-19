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
    try { return localStorage.getItem("fa-locale") || "en"; } catch (_e) { return "en"; }
  }
  function setGlobalLocale(loc) {
    try { localStorage.setItem("fa-locale", loc); } catch (_e) { /* noop */ }
  }

  /* The remembered language, when it is worth pointing at: a locale the
     visitor previously chose, that is not the one they are already reading,
     and that this page actually has.

     `fa-locale` was WRITE-ONLY before this: the sidebar switcher stored the
     choice on click and nothing ever read it back, so picking French and
     navigating anywhere landed you in English again with the preference
     sitting in localStorage unused. This deliberately does NOT redirect --
     a docs link that silently lands somewhere other than where it points is
     worse than one extra click -- it just makes the remembered language
     visibly one click away. */
  function rememberedLocale(currentLang, available) {
    var loc = getGlobalLocale();
    if (!loc || loc === currentLang) return null;
    if (loc !== "en" && available.indexOf(loc) === -1) return null;
    return loc;
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

  /**
   * Put a disclosure panel where the sidebar header cannot clip it.
   *
   * just-the-docs hard-caps `.site-header` height at the desktop breakpoint,
   * so a panel left inside it is cut off. The QR panel solved this by moving
   * itself into `.side-bar` as a sibling of the header, where it joins the
   * flex column in NORMAL FLOW: it pushes the nav down instead of covering
   * anything, and inherits the sidebar's fixed positioning for free.
   *
   * The reading-preferences and language panels did not use that route. They
   * stayed inside the header — the language bar additionally opening UPWARD
   * (`bottom: 100%`) to escape the cap, which only traded one clipping for
   * another: it then ran off the top of the column and under the staging
   * banner. Both are reported broken by readers; the QR panel is not. Same
   * problem, one fix, so this is shared rather than copied a third time.
   *
   * Returns true when the panel reached the sidebar column, so a caller can
   * style the two cases differently.
   */
  function mountPanelInSidebarColumn(host, panel) {
    var sideBar = host.closest ? host.closest(".side-bar") : null;
    if (sideBar) {
      // The direct child of `.side-bar` that contains `host` — normally
      // `.site-header`. Walking up rather than assuming `host.parentNode`
      // keeps this correct if the host is nested any deeper.
      var anchor = host;
      while (anchor.parentNode && anchor.parentNode !== sideBar) anchor = anchor.parentNode;
      if (anchor.parentNode === sideBar) {
        sideBar.insertBefore(panel, anchor.nextSibling);
        panel.classList.add("fa-panel-in-sidebar");
        return true;
      }
    }
    // No sidebar of the expected shape: anchor to the host as before. The
    // control still works, it is just positioned less well.
    if (host.parentNode) host.parentNode.insertBefore(panel, host.nextSibling);
    else host.appendChild(panel);
    return false;
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
    var bar = el("div", {
      class: "fa-lang-bar",
      "data-open": "false",
      // Positioning lives in CSS so the in-sidebar and fallback cases can
      // differ. Inline styles here would win over both.
      style: "display:none;"
    });

    var remembered = rememberedLocale(currentLang, available);

    for (var i = 0; i < supported.length; i++) {
      var loc = supported[i];
      var isAvailable = loc === "en" || available.indexOf(loc) !== -1;
      var isCurrent = loc === currentLang;
      var isRemembered = loc === remembered;

      // Available = clickable <a>. Unavailable = disabled <span>.
      var tab = el(isAvailable ? "a" : "span", {
        href: isAvailable ? localePath(basePath, loc) : undefined,
        "data-locale": loc,
        title: isAvailable
          ? LOCALE_NAMES[loc] + (isRemembered ? " \u2014 your saved language" : "")
          : LOCALE_NAMES[loc] + " \u2014 not yet translated",
        style: "display:inline-block;padding:4px 8px;border-radius:4px;" +
               "text-decoration:none;font-size:0.8rem;margin:0 1px;" +
               "transition:background 0.15s;" +
               (isCurrent
                 ? "background:#3b82f6;color:#fff;font-weight:bold;"
                 : isAvailable
                   ? "color:#93c5fd;cursor:pointer;"
                   : "color:#475569;cursor:default;opacity:0.5;") +
               (isRemembered ? "box-shadow:inset 0 0 0 1px #93c5fd;" : "")
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

    host.insertBefore(btn, before);
    mountPanelInSidebarColumn(host, bar);
    return btn;
  }

  /**
   * Per-page language bar — always visible inline in the main content area.
   * Shows all 6 UN languages as horizontal tabs. Available translations are
   * clickable links; unavailable are greyed-out disabled spans.
   * Does NOT change the global locale (that's the sidebar globe's job).
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

    var remembered = rememberedLocale(currentLang, available);

    for (var i = 0; i < supported.length; i++) {
      var loc = supported[i];
      var isAvailable = loc === "en" || available.indexOf(loc) !== -1;
      var isCurrent = loc === currentLang;
      var isRemembered = loc === remembered;

      var tab = el(isAvailable ? "a" : "span", {
        href: isAvailable ? localePath(basePath, loc) : undefined,
        title: isAvailable
          ? LOCALE_NAMES[loc] + (isRemembered ? " \u2014 your saved language" : "")
          : LOCALE_NAMES[loc] + " \u2014 not yet translated",
        style: "display:inline-block;padding:2px 7px;border-radius:3px;" +
               "text-decoration:none;font-size:0.8rem;" +
               "transition:background 0.15s;" +
               (isCurrent
                 ? "background:#3b82f6;color:#fff;font-weight:bold;"
                 : isAvailable
                   ? "color:#3b82f6;cursor:pointer;"
                   : "color:#94a3b8;cursor:default;opacity:0.4;") +
               (isRemembered ? "box-shadow:inset 0 0 0 1px #3b82f6;" : "")
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


  /* ── Reading preferences ─────────────────────────────────────────────── */

  /*
   * Four reader-facing affordances behind one gear, all WCAG 2.2 AA criteria a
   * static site can actually satisfy:
   *
   *   large-type   1.4.4 Resize text. The criterion is 200 % without loss of
   *                content; the step here is a modest one a reader can take
   *                twice on top of browser zoom, not a replacement for it.
   *   contrast     1.4.3 Contrast (Minimum) and 2.4.7 Focus Visible.
   *   underline    1.4.1 Use of Colour. A link distinguished only by hue is
   *                invisible to a reader with a colour-vision deficiency, and
   *                just-the-docs styles links exactly that way.
   *   motion       2.3.3 Animation from Interactions. Defaults ON when the OS
   *                already says `prefers-reduced-motion`, because a user who
   *                has set that should not have to set it again.
   *
   * THIS IS NOT `.folio/interaction.json`, and conflating the two would be a
   * real bug. This is per-viewer and per-browser, in localStorage, and it never
   * reaches an agent — a reader who is not the author picking large type must
   * not silently reconfigure how an agent talks to the author. The agent-facing
   * record is the committed file; see skills/folio-core/interaction-modality.md.
   *
   * Every read and write is wrapped: localStorage throws in a private window
   * with site data blocked, and the panel must still work when it does.
   */

  var A11Y_KEY = "fa-reading-prefs";

  var A11Y_OPTIONS = [
    { id: "large-type", label: "Larger text", hint: "Bigger body text and wider line spacing" },
    { id: "contrast", label: "Higher contrast", hint: "Stronger text and a thicker focus ring" },
    { id: "underline", label: "Underline links", hint: "Never colour alone (WCAG 1.4.1)" },
    { id: "reduce-motion", label: "Reduce motion", hint: "Turn off transitions and animation" }
  ];

  var GEAR_GLYPH =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    '<path d="M12 2.6v2.2M12 19.2v2.2M21.4 12h-2.2M4.8 12H2.6' +
    'M18.6 5.4l-1.6 1.6M7 17l-1.6 1.6M18.6 18.6L17 17M7 7L5.4 5.4" ' +
    'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
    "</svg>";

  function storedPrefs() {
    try {
      var raw = localStorage.getItem(A11Y_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  function defaultPrefs() {
    var prefs = {};
    // The OS has already been asked. Asking again is WCAG 3.3.7 (Redundant
    // Entry) applied to a setting rather than to a form field.
    var reduced = false;
    try {
      reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch { /* matchMedia absent: the default stays off. */ }
    prefs["reduce-motion"] = Boolean(reduced);
    return prefs;
  }

  function applyPrefs(prefs) {
    A11Y_OPTIONS.forEach(function (opt) {
      document.documentElement.toggleAttribute("data-fa-" + opt.id, Boolean(prefs[opt.id]));
    });
  }

  function mountReadingPrefs(host, before) {
    var prefs = storedPrefs() || defaultPrefs();
    applyPrefs(prefs);

    var btn = el("button", {
      type: "button",
      class: "fa-qr-toggle fa-a11y-toggle",
      "aria-label": "Reading preferences",
      "aria-expanded": "false"
    });
    btn.innerHTML = GEAR_GLYPH; // static markup above, no input involved

    var panel = el("div", { class: "fa-a11y-panel", hidden: "hidden", role: "group",
                            "aria-label": "Reading preferences" });

    A11Y_OPTIONS.forEach(function (opt) {
      var row = el("label", { class: "fa-a11y-row" });
      var box = el("input", { type: "checkbox" });
      box.checked = Boolean(prefs[opt.id]);
      box.addEventListener("change", function () {
        prefs[opt.id] = box.checked;
        applyPrefs(prefs);
        try {
          localStorage.setItem(A11Y_KEY, JSON.stringify(prefs));
        } catch {
          // Blocked storage: the setting still applies for this page view.
          // Saying nothing would be worse than a console note nobody reads,
          // because the reader will wonder why it did not stick.
          console.warn("docs-ui: reading preferences could not be saved (storage blocked); " +
                       "the change applies to this page view only.");
        }
      });
      var text = el("span", { class: "fa-a11y-text" });
      text.appendChild(el("span", { class: "fa-a11y-label" }, opt.label));
      text.appendChild(el("span", { class: "fa-a11y-hint" }, opt.hint));
      row.appendChild(box);
      row.appendChild(text);
      panel.appendChild(row);
    });

    var note = el("p", { class: "fa-a11y-note" },
      "Saved in this browser only. It is not sent anywhere.");
    panel.appendChild(note);

    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      if (open) panel.setAttribute("hidden", "hidden");
      else panel.removeAttribute("hidden");
    });

    if (before && before.parentNode === host) host.insertBefore(btn, before);
    else host.appendChild(btn);
    mountPanelInSidebarColumn(host, panel);
  }

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
    mountReadingPrefs(host, toggle);
    mountLanguageSwitcher(host, toggle);

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
  /* ── Automatic full width ────────────────────────────────────────────── */

  /* A workflow diagram is drawn far wider than the text column it lands in, so
     it arrives shrunk to the point where the label inside a task box is not
     readable -- and the reader has to notice a toolbar and press a button
     before the page shows them the thing the page is about.

     So a figure that is genuinely wider than its column now starts expanded.
     Three conditions, because auto-expanding the wrong figure is worse than
     not auto-expanding at all:

       - the viewport is wide enough for full width to mean anything (the same
         50rem the CSS uses -- on a phone the column IS the display);
       - the drawing's own coordinate width exceeds the column by a clear
         margin, so a figure that already fits is left alone;
       - the reader has not turned it off. That last one is the difference
         between a default and an imposition: press "Full width" to collapse a
         figure and the choice is remembered, and nothing auto-expands again.

     The stored value is READ, not just written. `fa-locale` was stored by this
     same file for a week and never read back, which is the bug this deliberately
     does not repeat. */
  var FULLWIDTH_PREF = "fa-figure-fullwidth";
  var AUTO_MIN_VIEWPORT_PX = 800;   /* 50rem at the theme's 16px root */
  var AUTO_MIN_RATIO = 1.25;        /* drawing must be 25% wider than its column */

  function fullWidthPref() {
    try { return localStorage.getItem(FULLWIDTH_PREF); } catch (_e) { return null; }
  }
  function setFullWidthPref(v) {
    try { localStorage.setItem(FULLWIDTH_PREF, v); } catch (_e) { /* noop */ }
  }

  /* The drawing's intrinsic width in its own coordinates, from `viewBox`.
     `getBoundingClientRect` cannot answer this: it reports the width the
     figure was SQUEEZED to, which is the column width, so the ratio would be
     1 for every figure and nothing would ever qualify. */
  function intrinsicWidth(scope) {
    var svg = scope.querySelector("svg");
    if (!svg) return 0;
    var vb = svg.getAttribute("viewBox");
    if (!vb) return 0;
    var parts = vb.split(/[\s,]+/);
    var w = parseFloat(parts[2]);
    return isFinite(w) ? w : 0;
  }

  function shouldAutoExpand(scope) {
    if (fullWidthPref() === "off") return false;
    if (window.innerWidth < AUTO_MIN_VIEWPORT_PX) return false;
    var column = scope.clientWidth;
    if (!column) return false;
    var natural = intrinsicWidth(scope);
    if (!natural) return false;
    return natural / column >= AUTO_MIN_RATIO;
  }

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
      // An explicit press is the reader overriding the default, in either
      // direction, and it sticks for the next page too.
      setFullWidthPref(on ? "on" : "off");
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

    // After insertion, so `clientWidth` is the real column width rather than 0.
    if (shouldAutoExpand(scope)) {
      scope.classList.add("is-fullwidth");
      wide.setAttribute("aria-pressed", "true");
      applyFullWidth();
      markFullWidthOnRoot();
    }
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

    // The round-trip QA badge that stood here is gone, and the data behind it
    // with it. It read `page.qa_translation_*`, stamped from a node-level
    // `roundTripQA` whose back-translation map held 6 entries against 36
    // strings: every string nobody back-translated scored 0 similarity and was
    // published as semantic drift. Per-block translation QA replaces it —
    // `<stem>.<locale>.translation-qa.json`, opened from the `TR` icon beside
    // each block, where a verdict names the witness that reached it.

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

    // Unverified translation warning — auto-injected on translated pages
    if (meta.translationStatus === "unverified" && !document.querySelector(".fa-translation-warning")) {
      var warning = el("div", {
        class: "fa-translation-warning",
        style: "background:#78350f;border:1px solid #d97706;border-radius:6px;" +
               "padding:12px 16px;margin:1em 0;color:#fef3c7;font-size:0.9rem;",
        role: "alert"
      });
      warning.innerHTML =
        "\u26A0\uFE0F <strong>Unverified translation</strong> \u2014 " +
        "This page has been translated automatically and has <strong>not been reviewed</strong> by a subject-matter expert." +
        (meta.translationSource
          ? "<br><strong>Source:</strong> " + meta.translationSource + " (English)"
          : "") +
        "<br><strong>How to verify:</strong> Run <code>translation_signoff</code> after SME review, " +
        "or use <code>translation_validate</code> to check for staleness and coverage.";
      var mainContent = document.querySelector(".main-content, #main-content");
      if (mainContent && mainContent.firstChild) {
        mainContent.insertBefore(warning, mainContent.firstChild);
      }
    }

    // Place badges AFTER the h1, not inside it. Inside the h1 they were
    // invisible because kramdown's {: .fs-9 } makes the heading enormous
    // and the tiny badges got lost in it.
    if (title.nextSibling) {
      title.parentNode.insertBefore(container, title.nextSibling);
    } else {
      title.parentNode.appendChild(container);
    }
  }

  /* ── QA witness panels ───────────────────────────────────────────────── */

  // The icons beside each node's Edit link carry a state; this opens what is
  // UNDER the state. Two levels, both asked for directly: a criterion list for
  // the sidecar, and under each criterion every witness that has ruled on it --
  // which script, model, agent or person, when, at which SHA, and whether the
  // verdict still applies to the files as they stand.
  //
  // The data is the `qa-witness/v1` projection written by gen-docs-pages.ts,
  // fetched on first click and cached for the life of the page. The sidecars
  // themselves are not published: 14 of them are 392 KB and a reader opens one
  // criterion, not forty-eight.
  //
  // Nothing here interpolates fetched text into markup. Every value from the
  // JSON goes in through textContent, because a sidecar carries verbatim
  // evidence quoted out of the content -- which is exactly the string that
  // would close a tag if it were concatenated into HTML.

  var QA_CACHE = {};
  var QA_SEQ = 0;

  var QA_RESULT_LABEL = {
    fail: "fail", warn: "warn", pass: "pass", "n/a": "n/a", unknown: "no verdict"
  };

  // A criterion the sidecar holds with no verdict recorded is shown as loudly
  // as a failure, not filed with the passes: it is the case a reader cannot
  // otherwise tell from a clean one.
  var QA_LOUD = { fail: 1, warn: 1, unknown: 1 };

  var QA_KIND_LABEL = {
    script: "script", agent: "agent", human: "human"
  };

  var QA_FRESH_LABEL = {
    fresh: "current",
    partial: "current on files",
    stale: "STALE",
    unknown: "currency unknown"
  };

  var REPO_BLOB = "https://github.com/litlfred/folio-assistant/blob/main/";

  /** Short SHA for display; the full value stays in the title attribute. */
  function shortSha(s) {
    if (!s) return null;
    var bare = s.indexOf(":") === -1 ? s : s.slice(s.indexOf(":") + 1);
    return bare.length > 12 ? bare.slice(0, 12) : bare;
  }

  /**
   * A timestamp as the reader's own locale renders it, plus how long ago.
   *
   * An absent timestamp returns null and the caller prints "not recorded" --
   * kg-audit.ts records none, and inventing one would make an undated witness
   * indistinguishable from a dated one.
   */
  function qaWhen(iso) {
    if (!iso) return null;
    var d = new Date(iso);
    if (isNaN(d.getTime())) return { text: iso, title: iso };
    var days = Math.floor((Date.now() - d.getTime()) / 86400000);
    var ago = days <= 0 ? "today" : days === 1 ? "yesterday" : days + " days ago";
    // `YYYY-MM-DD HH:MM`, not the locale's long form: it is one short line in a
    // grid cell, it sorts by eye, and the exact instant is in the title.
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    var stamp = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
    return { text: stamp + " (" + ago + ")", title: iso };
  }

  /** One labelled field of a witness. Absent values are STATED, not dropped. */
  function qaField(label, value, opts) {
    var row = el("div", { class: "fa-qa-field" });
    row.appendChild(el("span", { class: "fa-qa-field-label" }, label));
    var v = el("span", { class: "fa-qa-field-value" }, value == null ? "not recorded" : value);
    if (value == null) v.className += " fa-qa-absent";
    if (opts && opts.title) v.setAttribute("title", opts.title);
    if (opts && opts.mono) v.className += " fa-qa-mono";
    row.appendChild(v);
    return row;
  }

  function qaWitnessCard(w) {
    var card = el("div", { class: "fa-qa-witness fa-qa-kind-" + (w.kind || "script") });

    var head = el("div", { class: "fa-qa-witness-head" });
    head.appendChild(el("span", { class: "fa-qa-chip fa-qa-chip-kind" },
      QA_KIND_LABEL[w.kind] || w.kind || "unrecorded"));
    head.appendChild(el("code", { class: "fa-qa-witness-id" }, w.id || "unrecorded"));
    if (w.version) head.appendChild(el("span", { class: "fa-qa-witness-ver" }, w.version));
    var fresh = w.freshness || "unknown";
    head.appendChild(el("span", {
      class: "fa-qa-chip fa-qa-fresh-" + fresh,
      title: fresh === "stale"
        ? "The files this verdict was measured against have changed since."
        : fresh === "unknown"
          ? "This verdict's currency could not be established -- it is not reported as current."
          : fresh === "partial"
            ? "Every file this verdict was measured against still matches. A derived input -- one computed rather than read off disk -- was not re-checked here."
            : "Measured against the files as they stand."
    }, QA_FRESH_LABEL[fresh] || fresh));
    card.appendChild(head);

    var why = null;
    if (fresh !== "fresh" && w.changed && w.changed.length) {
      why = el("div", { class: "fa-qa-changed" });
      why.appendChild(el("span", { class: "fa-qa-field-label" },
        fresh === "stale" ? "changed since review" : "could not compare"));
      var ul = el("ul");
      w.changed.forEach(function (c) { ul.appendChild(el("li", null, c)); });
      why.appendChild(ul);
      card.appendChild(why);
    }
    // Named, not implied: "current on files" is only readable next to WHICH
    // input went unchecked.
    if (w.notCompared && w.notCompared.length) {
      var nc = el("div", { class: "fa-qa-changed" });
      nc.appendChild(el("span", { class: "fa-qa-field-label" }, "not re-checked"));
      var ncl = el("ul");
      w.notCompared.forEach(function (c) { ncl.appendChild(el("li", null, c)); });
      nc.appendChild(ncl);
      card.appendChild(nc);
    }

    var when = qaWhen(w.at);
    var grid = el("div", { class: "fa-qa-field-grid" });
    grid.appendChild(qaField("when", when && when.text, { title: when && when.title }));
    grid.appendChild(qaField("repo SHA at review", shortSha(w.sha),
      { mono: true, title: w.sha || undefined }));
    if (w.kind === "script" || w.scriptHash) {
      grid.appendChild(qaField("checker source hash", shortSha(w.scriptHash),
        { mono: true, title: w.scriptHash || undefined }));
      grid.appendChild(qaField("checker last commit", shortSha(w.scriptCommitSha),
        { mono: true, title: w.scriptCommitSha || undefined }));
    }
    if (w.depsHash) {
      grid.appendChild(qaField("extra-input hash", shortSha(w.depsHash), { mono: true }));
    }
    if (w.kind === "agent") {
      grid.appendChild(qaField("model", w.model, { mono: true }));
      grid.appendChild(qaField("session", w.session, { mono: true }));
      grid.appendChild(qaField("skill", w.skill, { mono: true }));
    }
    if (w.method) grid.appendChild(qaField("method", w.method));
    card.appendChild(grid);

    if (w.notes) {
      card.appendChild(el("p", { class: "fa-qa-notes" }, w.notes));
    }
    return card;
  }

  function qaCriterionRow(c, idx, panelId) {
    var li = el("li", { class: "fa-qa-crit-item" });
    var bodyId = panelId + "-c" + idx;

    var btn = el("button", {
      type: "button",
      class: "fa-qa-crit",
      "aria-expanded": "false",
      "aria-controls": bodyId
    });
    btn.appendChild(el("span", { class: "fa-qa-caret", "aria-hidden": "true" }, "▸"));
    btn.appendChild(el("span", { class: "fa-qa-chip fa-qa-res-" + (c.result || "unknown") },
      QA_RESULT_LABEL[c.result] || c.result || "no verdict"));
    if (c.severity) {
      btn.appendChild(el("span", { class: "fa-qa-chip fa-qa-sev-" + c.severity }, c.severity));
    }
    if (c.locale) {
      btn.appendChild(el("span", { class: "fa-qa-chip fa-qa-locale" }, c.locale));
    }
    btn.appendChild(el("code", { class: "fa-qa-crit-id" }, c.id));
    var n = (c.witnesses || []).length;
    btn.appendChild(el("span", { class: "fa-qa-wcount" },
      n === 0 ? "no witness" : n === 1 ? "1 witness" : n + " witnesses"));

    var body = el("div", { class: "fa-qa-crit-body", id: bodyId, hidden: "hidden" });

    if (c.evidence && c.evidence.length) {
      var ev = el("div", { class: "fa-qa-evidence" });
      ev.appendChild(el("div", { class: "fa-qa-field-label" }, "evidence"));
      c.evidence.forEach(function (line) {
        ev.appendChild(el("pre", null, line));
      });
      body.appendChild(ev);
    }
    if (c.metrics) {
      var keys = Object.keys(c.metrics);
      if (keys.length) {
        var mg = el("div", { class: "fa-qa-field-grid" });
        keys.sort().forEach(function (k) {
          mg.appendChild(qaField(k, String(c.metrics[k])));
        });
        body.appendChild(mg);
      }
    }
    if (c.score) {
      body.appendChild(qaField("score", c.score.value + " / " + c.score.max));
    }

    if (n === 0) {
      // Not a blank space: a criterion carried with nothing behind it is a gap
      // in the audit, and saying so is the only way a reader learns of it.
      body.appendChild(el("p", { class: "fa-qa-absent" },
        "No witness recorded for this criterion — nobody has ruled on it."));
    } else {
      c.witnesses.forEach(function (w) { body.appendChild(qaWitnessCard(w)); });
    }

    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      if (open) body.setAttribute("hidden", "hidden");
      else body.removeAttribute("hidden");
      btn.firstChild.textContent = open ? "▸" : "▾";
    });

    li.appendChild(btn);
    li.appendChild(body);
    return li;
  }

  function qaCountsLine(doc) {
    var c = doc.counts || {};
    var parts = [];
    ["fail", "warn", "pass", "na", "unknown"].forEach(function (k) {
      var v = c[k] || 0;
      if (k === "unknown" && v === 0) return;
      parts.push(v + " " + (k === "na" ? "n/a" : k === "unknown" ? "no verdict" : k));
    });
    return parts.join(" · ");
  }

  function qaBuildPanel(doc, panelId, badge) {
    var panel = el("div", {
      class: "fa-qa-panel fa-qa-panel-" + (doc.state || "unswept"),
      id: panelId,
      role: "region",
      "aria-label": "QA detail for " + (doc.subject || "this node"),
      tabindex: "-1"
    });

    var head = el("div", { class: "fa-qa-panel-head" });
    head.appendChild(el("strong", null, (badge.getAttribute("aria-label") || "").split(":")[0]));
    head.appendChild(el("span", { class: "fa-qa-subject" }, doc.subject || ""));
    head.appendChild(el("span", { class: "fa-qa-counts" }, qaCountsLine(doc)));

    (doc.sidecars || []).forEach(function (p) {
      var a = el("a", { class: "fa-qa-sidecar-link", href: REPO_BLOB + p, rel: "noopener" }, p);
      head.appendChild(a);
    });

    var close = el("button", { type: "button", class: "fa-qa-close", title: "Close this panel" },
      "✕ Close");
    close.addEventListener("click", function () { qaToggle(badge); });
    head.appendChild(close);
    panel.appendChild(head);

    var loud = [];
    var quiet = [];
    (doc.criteria || []).forEach(function (c) {
      (QA_LOUD[c.result] ? loud : quiet).push(c);
    });

    var list = el("ul", { class: "fa-qa-crit-list" });
    var i = 0;
    loud.forEach(function (c) { list.appendChild(qaCriterionRow(c, i++, panelId)); });
    panel.appendChild(list);

    if (quiet.length) {
      // 48 criteria per block, 46 of them pass or n/a. Folding those behind one
      // control keeps the two that need reading at the top -- and the fold is
      // labelled with its count, so a clean sweep still says how much it checked.
      var more = el("button", {
        type: "button",
        class: "fa-qa-more",
        "aria-expanded": loud.length === 0 ? "true" : "false"
      }, (loud.length === 0 ? "▾ " : "▸ ") + "show " + quiet.length +
         " passing / not-applicable criteria");
      var quietList = el("ul", { class: "fa-qa-crit-list" });
      quiet.forEach(function (c) { quietList.appendChild(qaCriterionRow(c, i++, panelId)); });
      if (loud.length !== 0) quietList.setAttribute("hidden", "hidden");
      more.addEventListener("click", function () {
        var open = more.getAttribute("aria-expanded") === "true";
        more.setAttribute("aria-expanded", open ? "false" : "true");
        if (open) quietList.setAttribute("hidden", "hidden");
        else quietList.removeAttribute("hidden");
        more.textContent = (open ? "▸ show " : "▾ ") + quiet.length +
          (open ? " passing / not-applicable criteria" : " passing / not-applicable criteria");
      });
      panel.appendChild(more);
      panel.appendChild(quietList);
    }

    if (!doc.criteria || doc.criteria.length === 0) {
      panel.appendChild(el("p", { class: "fa-qa-absent" },
        "The sidecar holds no criteria — nothing about this subject has been checked."));
    }
    return panel;
  }

  /** Where a panel goes: after the block-level line holding the icon. */
  function qaAnchorFor(badge) {
    var p = badge.parentNode;
    while (p && p.parentNode && p.tagName !== "P" && p.tagName !== "LI" &&
           p.className !== "main-content" && p.id !== "main-content") {
      p = p.parentNode;
    }
    return p || badge;
  }

  function qaFail(badge, panelId, src, msg) {
    var panel = el("div", { class: "fa-qa-panel fa-qa-panel-error", id: panelId, role: "region" });
    // Loud, and specific about which file could not be read: a panel that opens
    // empty is indistinguishable from a subject with nothing to report.
    panel.appendChild(el("strong", null, "Could not load the QA detail"));
    panel.appendChild(el("p", null, msg));
    panel.appendChild(el("code", null, src));
    var close = el("button", { type: "button", class: "fa-qa-close" }, "✕ Close");
    close.addEventListener("click", function () { qaToggle(badge); });
    panel.appendChild(close);
    return panel;
  }

  function qaToggle(badge) {
    var panelId = badge.getAttribute("aria-controls");
    if (panelId) {
      var open = document.getElementById(panelId);
      if (open) {
        open.parentNode.removeChild(open);
        badge.setAttribute("aria-expanded", "false");
        badge.focus();
        return;
      }
    } else {
      panelId = "fa-qa-panel-" + (++QA_SEQ);
      badge.setAttribute("aria-controls", panelId);
    }

    var src = badge.getAttribute("data-qa-src");
    if (!src) return;
    badge.setAttribute("aria-expanded", "true");
    badge.setAttribute("aria-busy", "true");

    var anchor = qaAnchorFor(badge);
    function mount(node) {
      badge.removeAttribute("aria-busy");
      if (anchor.nextSibling) anchor.parentNode.insertBefore(node, anchor.nextSibling);
      else anchor.parentNode.appendChild(node);
      node.focus();
    }

    if (QA_CACHE[src]) { mount(qaBuildPanel(QA_CACHE[src], panelId, badge)); return; }

    fetch(src, { credentials: "same-origin" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (doc) {
        QA_CACHE[src] = doc;
        mount(qaBuildPanel(doc, panelId, badge));
      })
      .catch(function (e) {
        mount(qaFail(badge, panelId, src, e.message));
      });
  }

  function mountQaPanels() {
    // Delegated, so icons added later (or by a future client-side render) work
    // without re-binding, and one listener serves a page with fifty of them.
    document.addEventListener("click", function (ev) {
      var badge = ev.target && ev.target.closest
        ? ev.target.closest(".fa-qa-badge[data-qa-src]")
        : null;
      if (!badge) return;
      ev.preventDefault();
      qaToggle(badge);
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "Escape") return;
      var panel = ev.target && ev.target.closest ? ev.target.closest(".fa-qa-panel") : null;
      if (!panel) return;
      var badge = document.querySelector('.fa-qa-badge[aria-controls="' + panel.id + '"]');
      if (badge) qaToggle(badge);
    });
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
    mountQaPanels();
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
