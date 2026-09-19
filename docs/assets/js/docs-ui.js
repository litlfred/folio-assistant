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

  /**
   * The language bar, as content for an action tile's view.
   *
   * It used to mount its own header toggle and its own outside-click and
   * Escape handlers. Both now belong to the tile panel that contains it: two
   * things listening for Escape is two things that can disagree about whether
   * anything is open, and the bug this whole area already paid for was a
   * control fighting its container for position.
   */
  function buildLanguageBar() {
    var meta = getTranslationMeta();
    var currentLang = (meta && meta.lang) || "en";
    var available = (meta && meta.availableLocales) || [];
    var supported = ["ar", "zh", "en", "fr", "ru", "es"];
    var path = window.location.pathname;
    var basePath = deriveBasePath(path, currentLang);

    // Horizontal language bar — shows all 6 UN languages. Inside a tile view
    // it is simply present: the view's own disclosure decides whether anyone
    // can see it, so the bar carries no open/closed state of its own.
    var bar = el("div", { class: "fa-lang-bar fa-tile-content", "data-open": "true" });

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

    return bar;
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

    // No inline colours, here or below. Every one of this bar's pairs is a
    // per-scheme token in `docs-ui.css` with its measured ratio written beside
    // it -- bean `rptk`, where a literal written against the sidebar's dark
    // card came out at 1.34:1 on the page's light one.
    var container = el("div", { class: "fa-page-lang-bar" });

    // Globe emoji
    var globe = el("span", {
      class: "fa-page-lang-globe",
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
        class: "fa-page-lang-tab" +
               (isCurrent ? " is-current" : isAvailable ? "" : " is-unavailable") +
               (isRemembered ? " is-remembered" : "")
      }, loc.toUpperCase());

      // Hover is a CSS `:hover` rule now. It was a pair of listeners writing
      // `style.background`, which is an inline colour literal with extra steps
      // -- and one nothing could measure, since it exists only while a pointer
      // is over the tab.
      if (isAvailable && !isCurrent) {
        (function (locale, link) {
          link.addEventListener("click", function () { setGlobalLocale(locale); });
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

  /**
   * The light/dark control, as a tile.
   *
   * The owner placed it "under settings" rather than in the top row, which is
   * the right call and worth recording: it is the one control here a reader
   * sets once and then never touches, so it costs a row of prime space for a
   * single use. It keeps its own class so the e2e spec and any muscle memory
   * in the stylesheet still find it.
   */
  function buildThemeTile() {
    var btn = el("button", { type: "button", class: "fa-tile fa-theme-toggle" });
    var caption = el("span", { class: "fa-tile-caption" });

    function paint(name) {
      // The icon shows the scheme you are IN, not the one you would get. A
      // lit bulb for light, a struck-through one for dark. Labelling it with
      // the destination instead is the other convention and is a coin-flip
      // either way; what is not optional is that the label says which.
      btn.innerHTML = name === "light" ? BULB_ON : BULB_OFF;
      btn.appendChild(caption);
      // The caption is the visible half of the same fact the label states, so
      // a reader who cannot tell the two bulbs apart at 16px does not have to.
      caption.textContent = name === "light" ? "Light" : "Dark";
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

  /** The reading-preference rows, as content for the settings tile's view. */
  function buildReadingPrefs() {
    var prefs = storedPrefs() || defaultPrefs();
    applyPrefs(prefs);

    var panel = el("div", { class: "fa-a11y-panel fa-tile-content", role: "group",
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

    return panel;
  }

  function firstMatch(selectors) {
    for (var i = 0; i < selectors.length; i++) {
      var found = document.querySelector(selectors[i]);
      if (found) return found;
    }
    return null;
  }

  /* ── Action tiles ────────────────────────────────────────────────────── */

  // A three-by-three of rounded squares: the launcher. It says "there are
  // several things here" without naming one of them, which the gear and the
  // globe both did while standing for the whole row.
  var TILES_GLYPH =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<rect x="3" y="3" width="6" height="6" rx="1.4"/>' +
    '<rect x="15" y="3" width="6" height="6" rx="1.4"/>' +
    '<rect x="3" y="15" width="6" height="6" rx="1.4"/>' +
    '<rect x="15" y="15" width="6" height="6" rx="1.4"/>' +
    '<rect x="9.5" y="9.5" width="5" height="5" rx="1.2"/>' +
    "</svg>";

  // A net: nodes joined by edges. The owner asked for "an icon of a net" for
  // the knowledge graph, which is also what the thing IS, so the glyph is not
  // a metaphor that has to be learned.
  var NET_GLYPH =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M12 4.5 5 9.5M12 4.5l7 5M5 9.5l3.5 8M19 9.5l-3.5 8M8.5 17.5h7M5 9.5h14" ' +
    'fill="none" stroke="currentColor" stroke-width="1.3"/>' +
    '<circle cx="12" cy="4.5" r="2.1"/><circle cx="5" cy="9.5" r="2.1"/>' +
    '<circle cx="19" cy="9.5" r="2.1"/><circle cx="8.5" cy="17.5" r="2.1"/>' +
    '<circle cx="15.5" cy="17.5" r="2.1"/>' +
    "</svg>";

  // Angle brackets and a slash: the source.
  var CODE_GLYPH =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M8.6 6.4 3 12l5.6 5.6 1.5-1.5L6 12l4.1-4.1zM15.4 6.4l-1.5 1.5L18 12l-4.1 4.1 1.5 1.5L21 12z"/>' +
    '<path d="M13.6 3.6 10 20.4l-1.9-.4L11.7 3.2z"/>' +
    "</svg>";

  // A braced document: the graph as DATA, as against the net (the graph as a
  // thing to browse) and the angle brackets (the code that produced it). The
  // three tiles are three different artefacts and must not share a glyph.
  var DATA_GLYPH =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M6 3h7l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" ' +
    'fill="none" stroke="currentColor" stroke-width="1.4"/>' +
    '<path d="M13 3v5h5" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
    '<path d="M10.2 12.3c-1 0-1.2.5-1.2 1.2v.9c0 .7-.3 1.1-1 1.1.7 0 1 .4 1 1.1v.9c0 .7.2 1.2 1.2 1.2" ' +
    'fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>' +
    '<path d="M13.8 12.3c1 0 1.2.5 1.2 1.2v.9c0 .7.3 1.1 1 1.1-.7 0-1 .4-1 1.1v.9c0 .7-.2 1.2-1.2 1.2" ' +
    'fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>' +
    "</svg>";

  // A magnifier: search. The owner asked for the search to leave the main
  // panel and become "a icon in navbar that expands" -- this is the icon, and
  // the launcher it lives in is the expansion.
  var SEARCH_GLYPH =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
    '<path d="M15.2 15.2 20 20" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round"/>' +
    "</svg>";

  // Where just-the-docs puts its search. `.search` is the container holding
  // BOTH the input and the results list; moving the container keeps them
  // together and keeps the theme's own handlers, which are bound to the
  // elements rather than to their position.
  var SEARCH_SELECTORS = [".search", "#search", ".main-header .search"];

  /**
   * Where the knowledge-graph and source tiles point.
   *
   * Read from `#fa-site-links`, which `head_custom.html` fills from
   * `_config.yml` through `relative_url`. Hardcoding either here would put a
   * folio's own address inside shared client code and would break under a
   * `baseurl` -- this site serves from `/folio-assistant/`, so an absolute
   * `/kg/` is a 404 rather than a wrong-looking link.
   *
   * An unreadable or absent block returns an empty object and the affected
   * tile is NOT DRAWN. A tile that goes nowhere is worse than a missing one,
   * because the reader cannot tell a broken link from a broken site.
   */
  function getSiteLinks() {
    var node = document.getElementById("fa-site-links");
    if (!node) return {};
    try {
      var parsed = JSON.parse(node.textContent || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_e) {
      console.warn("docs-ui: #fa-site-links is not valid JSON; the knowledge-graph " +
                   "and source tiles were not mounted.");
      return {};
    }
  }

  /**
   * The header's controls, as ONE launcher over a grid of same-sized tiles.
   *
   * ## Why one, and not five
   *
   * There were four header buttons -- theme, reading preferences, language, QR
   * -- inside a row just-the-docs caps at `3.75rem` and shares with the site
   * title. The owner's words were "that navbar is getting crowded", and adding
   * the knowledge-graph viewer and the source link to that row would have made
   * it six. One launcher takes the row from four icons to one.
   *
   * The alternative reading of the request -- a row of icons that each open a
   * tile-sized panel -- takes it from four to five and makes the stated
   * problem worse, which is what decided it.
   *
   * ## The tile is the QR panel's footprint
   *
   * "build out to the size of the QR code. use that as kind of the template
   * size for action icons". So the panel is exactly the region the QR code
   * already occupies -- `16.5rem` in the sidebar column -- and every view
   * renders into it. Nothing here introduces a new place for content to appear.
   *
   * ## The panel is a SIBLING of the header
   *
   * Unchanged, and load-bearing: `.site-header` is a hard-capped row, so a
   * panel left inside it is clipped. `mountPanelInSidebarColumn` puts it in
   * `.side-bar`'s flex column where it pushes the nav down instead of covering
   * it. Three separate panels used to solve this three different ways, one of
   * them by opening upward into the staging banner; there is now one panel and
   * one answer.
   *
   * ## Accessibility (bean `gjli`)
   *
   * Tiles are 4rem tall, well over the 24px SC 2.5.8 floor, because this
   * instance's declared interaction profile is low-dexterity and a target that
   * is barely legal is a target that is hard to hit. Every tile is a real
   * `<button>` or `<a>`, so it comes with keyboard activation rather than
   * needing it added. Opening a view moves focus to the view's own heading and
   * Back returns it to the tile that was pressed -- a reader who cannot easily
   * point must never have to hunt for where the keyboard went.
   */
  function mountActionTiles() {
    var title = firstMatch(TITLE_SELECTORS);
    var header = title ? title.parentNode : firstMatch(HEADER_SELECTORS);
    if (!header) {
      // The one unrecoverable case: no sidebar header of any shape.
      console.warn("docs-ui: no site header found (tried " + HEADER_SELECTORS.join(", ") +
                   "); the action tiles were not mounted.");
      return;
    }
    if (!title) {
      // Degraded but usable: the control works, it just sits on its own
      // rather than beside a title it could not locate.
      console.warn("docs-ui: no site title found (tried " + TITLE_SELECTORS.join(", ") +
                   "); mounting the action tiles into the header without it.");
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
      class: "fa-qr-toggle fa-tiles-toggle",
      "aria-label": "Actions",
      "aria-expanded": "false",
    });
    toggle.innerHTML = TILES_GLYPH; // static markup above, no input involved
    host.appendChild(toggle);

    var panel = el("div", {
      class: "fa-tiles",
      "data-open": "false",
      role: "region",
      "aria-label": "Actions",
      tabindex: "-1",
    });
    var grid = el("div", { class: "fa-tiles-grid", role: "group", "aria-label": "Actions" });
    var view = el("div", { class: "fa-tiles-view", hidden: "hidden" });
    panel.appendChild(grid);
    panel.appendChild(view);
    mountPanelInSidebarColumn(host, panel);

    /* ── The search field, adopted out of the main panel ────────────────── */

    /*
     * The owner: "move the search to a icon in navbar that expands.... keep
     * main display panel uncluttered." just-the-docs renders its search at
     * the top of `.main-header`, which is exactly the clutter named.
     *
     * ## Moved, never rebuilt
     *
     * The theme's own script binds to the input it rendered. A search box
     * reconstructed here would look identical and do nothing -- the failure
     * mode this file's header calls out, a feature that quietly does nothing.
     * So the theme's `.search` container is MOVED, with its input, its label
     * and its results list intact, and every handler moves with it because
     * handlers belong to elements and not to positions.
     *
     * ## It must never leave the document
     *
     * just-the-docs looks its input up by id when it initialises, and
     * `getElementById` does not find a detached node. Parking the container
     * in a variable until the view is first opened would therefore kill
     * search outright on any page where the theme initialises second.
     *
     * So it is moved at MOUNT time into a holder that is already inside the
     * panel -- in the document, hidden by CSS -- and shuttled between that
     * holder and the open view. `display: none` on an ancestor keeps a node
     * in the tree; removing it from the tree does not.
     *
     * ## Absent is a real state
     *
     * `search_enabled: false`, or a theme that renamed the container, means
     * there is nothing to adopt. The tile is then NOT DRAWN and the warning
     * says what was looked for -- rather than a Search tile that opens onto
     * an empty panel.
     */
    var searchHolder = null;
    var adopted = firstMatch(SEARCH_SELECTORS);
    if (adopted) {
      searchHolder = el("div", { class: "fa-search-holder", hidden: "hidden" });
      searchHolder.appendChild(adopted);
      panel.appendChild(searchHolder);
    } else {
      console.warn("docs-ui: no site search found (tried " + SEARCH_SELECTORS.join(", ") +
                   "); the Search tile was not mounted and the theme's search, if any, " +
                   "was left where it was.");
    }

    /** Put the search back in its always-in-document holder. */
    function parkSearch() {
      if (searchHolder && searchHolder.parentNode !== panel) panel.appendChild(searchHolder);
      if (searchHolder) searchHolder.setAttribute("hidden", "hidden");
    }

    /* ── The views ─────────────────────────────────────────────────────── */

    // Built once, on first open, and kept. Rebuilding on every open would
    // discard a half-set checkbox and re-encode the QR for nothing; building
    // at mount time would run the encoder on every page load for a panel most
    // readers never open.
    var built = false;
    var qrArt = el("span");
    var qrCaption = el("span", { class: "fa-qr-caption" });
    var views = {};
    var openTile = null;   // the tile to return focus to when Back is pressed

    function renderQr() {
      var url = window.location.href;
      var q = qrcode(0, "M");
      q.addData(url);
      q.make();
      // createSvgTag builds the tag from module bits; the URL is not present
      // in the string it returns.
      qrArt.innerHTML = q.createSvgTag({ scalable: true, margin: 4 });
      qrCaption.textContent = url;
    }

    function buildViews() {
      if (built) return;
      built = true;

      var settings = el("div", { class: "fa-tile-content" });
      settings.appendChild(buildThemeTile());
      settings.appendChild(buildReadingPrefs());
      views.settings = settings;

      views.language = buildLanguageBar();

      if (typeof qrcode === "function") {
        var qr = el("div", { class: "fa-qr-panel fa-tile-content", "data-open": "true" });
        qr.appendChild(qrArt);
        qr.appendChild(qrCaption);
        views.qr = qr;
      }
    }

    /* ── Navigation between the grid and a view ────────────────────────── */

    function showGrid() {
      view.setAttribute("hidden", "hidden");
      // Before the wipe: `innerHTML = ""` DETACHES, and a detached search
      // input is one `getElementById` away from being dead.
      parkSearch();
      view.innerHTML = "";
      grid.removeAttribute("hidden");
      if (openTile) openTile.focus();
      openTile = null;
    }

    function showView(key, label, tile) {
      buildViews();
      openTile = tile;
      grid.setAttribute("hidden", "hidden");
      parkSearch();
      view.innerHTML = "";

      var head = el("div", { class: "fa-tiles-head" });
      var back = el("button", {
        type: "button",
        class: "fa-tiles-back",
        // The visible text is a chevron and the word; the accessible name says
        // WHERE back goes, because "Back" alone is a direction, not a place.
        "aria-label": "Back to all actions",
      }, "‹ All actions");
      back.addEventListener("click", showGrid);
      var heading = el("h3", { class: "fa-tiles-title", tabindex: "-1" }, label);
      head.appendChild(back);
      head.appendChild(heading);
      view.appendChild(head);
      if (key === "search") {
        // A move, not a copy: the holder travels into the view with the
        // theme's own input inside it, and travels back on the way out.
        view.appendChild(searchHolder);
        searchHolder.removeAttribute("hidden");
      } else {
        view.appendChild(views[key]);
      }
      view.removeAttribute("hidden");

      if (key === "qr") renderQr();
      // The panel is rewritten in place, so a reader whose cursor did not move
      // would be told nothing at all about what just happened.
      //
      // Search is the exception, and deliberately: a reader who pressed a
      // magnifier is going to type. The input carries the theme's own label,
      // so a screen reader is still told what it landed on -- the heading is
      // reachable by Shift+Tab, one key away, rather than in the way of the
      // thing the tile exists for.
      var input = key === "search" && searchHolder
        ? searchHolder.querySelector("input")
        : null;
      if (input) input.focus();
      else heading.focus();
    }

    /* ── The grid ──────────────────────────────────────────────────────── */

    function tileButton(glyph, label, key) {
      var b = el("button", { type: "button", class: "fa-tile", "aria-label": label });
      b.innerHTML = glyph;
      b.appendChild(el("span", { class: "fa-tile-caption" }, label));
      b.addEventListener("click", function () { showView(key, label, b); });
      return b;
    }

    function tileLink(glyph, label, href, hint) {
      var a = el("a", { class: "fa-tile", href: href, "aria-label": label + " — " + hint });
      a.innerHTML = glyph;
      a.appendChild(el("span", { class: "fa-tile-caption" }, label));
      return a;
    }

    // Search leads the grid. It is the one action here a reader reaches for
    // repeatedly, and it is the one that was taken off the main panel -- so
    // it gets the first cell rather than being buried behind the others.
    if (searchHolder) grid.appendChild(tileButton(SEARCH_GLYPH, "Search", "search"));
    grid.appendChild(tileButton(GEAR_GLYPH, "Settings", "settings"));
    grid.appendChild(tileButton(GLOBE_GLYPH, "Language", "language"));
    // The encoder is a separate vendor script. Without it the OTHER tiles must
    // still work -- the old code returned early from the whole mount when it
    // was missing, so a failed vendor request took the theme switch, the
    // reading preferences and the language switch down with the QR code.
    if (typeof qrcode === "function") {
      grid.appendChild(tileButton(GLYPH, "QR code", "qr"));
    } else {
      console.warn("docs-ui: QR encoder not loaded (vendor/qrcode.js must be included " +
                   "first); the other action tiles were mounted without it.");
    }

    // A tile that DOES something rather than opening a sidebar view. The board
    // lives in the main display, so `showView` is the wrong machinery for it.
    function tileAction(glyph, label, onClick) {
      var b = el("button", { type: "button", class: "fa-tile", "aria-label": label });
      b.innerHTML = glyph;
      b.appendChild(el("span", { class: "fa-tile-caption" }, label));
      b.addEventListener("click", function () { open(false); onClick(); });
      return b;
    }

    // The todo tile is added when the board reports itself ready, because the
    // index is fetched and the tile carries its COUNT. A tile that appeared
    // immediately would show no count, then change under the reader's cursor.
    function addTodoTile(board) {
      if (board.count === 0) return;   // nothing outstanding is not a tile
      var tile = tileAction(STICKY_GLYPH, "Todos", function () { board.toggle(); });
      tile.appendChild(el("span", { class: "fa-tile-count" }, String(board.count)));
      tile.setAttribute("aria-label", "Todos — " + board.count + " outstanding");
      grid.appendChild(tile);
    }
    if (window.__faTodoBoard) addTodoTile(window.__faTodoBoard);
    else document.addEventListener("fa:todos-ready", function (e) { addTodoTile(e.detail); });

    var links = getSiteLinks();
    if (links.kg) {
      grid.appendChild(tileLink(NET_GLYPH, "Knowledge graph", links.kg,
                                "browse this instance's skills, tools and schemas"));
    }
    // The owner: "the source goes to github, i wanted the jsonld and github
    // available." One affordance was doing two jobs. They are two artefacts --
    // the graph as data, and the code that produced it -- so they are two
    // tiles, each saying where it goes.
    if (links.jsonld) {
      grid.appendChild(tileLink(DATA_GLYPH, "JSON-LD", links.jsonld,
                                "this instance's knowledge graph as a JSON-LD document"));
    }
    if (links.source) {
      // A `github.com/<owner>/<repo>` link, never a `raw.githubusercontent`
      // one: raw 404s on a private repository and a browser session cookie
      // does not authenticate it, while the blob form follows the viewer's
      // own GitHub session. Same rule as `readme-toc`'s `linkStyle: "blob"`
      // default, and the reason it is the default there.
      grid.appendChild(tileLink(CODE_GLYPH, "Source", links.source,
                                "this site's repository on the forge"));
    }

    /* ── Disclosure ────────────────────────────────────────────────────── */

    function open(isOpen) {
      host.setAttribute("data-open", isOpen ? "true" : "false");
      // Mirrored onto the panel because the panel is no longer a DESCENDANT of
      // the host -- it lives in the sidebar column now, so a
      // `.fa-qr-host[data-open] .fa-tiles` selector would never match it.
      panel.setAttribute("data-open", isOpen ? "true" : "false");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      if (isOpen) {
        buildViews();
        panel.focus();
      } else {
        showGrid();
        toggle.focus();
      }
    }

    toggle.addEventListener("click", function () {
      open(host.getAttribute("data-open") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || host.getAttribute("data-open") !== "true") return;
      // Escape from a view returns to the grid rather than closing outright:
      // one keystroke should undo one step, not three.
      if (view.hasAttribute("hidden")) open(false);
      else showGrid();
    });
    // An in-page anchor changes the address without a reload, so a code left
    // open would go stale and point somewhere the reader is no longer at.
    window.addEventListener("hashchange", function () {
      if (host.getAttribute("data-open") === "true" && !view.hasAttribute("hidden") &&
          view.contains(qrArt)) renderQr();
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


  /* ═══ Sticky todos ════════════════════════════════════════════════════
   *
   * A TODO is a person's outstanding item, published by `gen-docs-pages.ts`
   * to `/assets/todos/index.json`. This mounts three surfaces over it:
   *
   *   - a tile in the action launcher, carrying a COUNT;
   *   - a board in the MAIN display, with every sticky lined up;
   *   - a sticky that can be lifted off the board and pinned to the page.
   *
   * ## Why the board is not a tile view
   *
   * Every other tile renders into `.fa-tiles-view`, which is the QR panel's
   * footprint -- 16.5rem in the sidebar column. The owner asked for the board
   * "in the main display", and a wall of stickies at 16.5rem would be a
   * single column of slivers. So the tile is a LAUNCHER for a surface that
   * lives in `.main-content`, and the panel machinery is left alone rather
   * than widened for one caller.
   *
   * ## Content reaches the DOM through textContent, never innerHTML
   *
   * A todo's `summary` and `comment` are authored -- by a person, or by an
   * agent on their behalf -- and travel through a JSON file to this page. The
   * only glyphs built with `innerHTML` here are the static SVG constants
   * above, which no input touches. That is the same rule the QA panel's
   * evidence follows, and for the same reason: the string that closes a tag
   * is exactly the string somebody eventually writes.
   *
   * ## The pencil is `.fa-node-edit`, not an editor
   *
   * "default pattern for any content object in just-the-docs -- it should be
   * at that class level". `gen-docs-pages.ts` already emits that affordance
   * per node, and `editHref` is composed there at build time, so this file
   * carries no repo URL. A published page cannot write back to the repo, and
   * the honest control is the one that takes you where writing happens.
   */

  var STICKY_GLYPH =
    '<svg class="fa-tile-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M5 3h10l4 4v14H5z" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linejoin="round"/><path d="M15 3v4h4" fill="none" stroke="currentColor" ' +
    'stroke-width="1.6" stroke-linejoin="round"/></svg>';

  var todoState = { items: [], floating: {}, processes: {} };

  /** The published index, or `null` when it could not be read. */
  function fetchTodoIndex(done) {
    var src = document.querySelector('meta[name="fa-todo-src"]');
    var url = src && src.getAttribute("content");
    if (!url) return done(null);
    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (doc) {
        if (!doc || !Array.isArray(doc.items)) return done(null);
        todoState.processes = doc.processes || {};
        done(doc.items);
      })
      .catch(function (e) {
        // Third state, reported rather than rendered as "no todos". A board
        // that opens empty is indistinguishable from a person with nothing
        // outstanding, and those are opposite facts.
        console.warn("docs-ui: could not read " + url + " (" + e.message + "); " +
                     "the todo board was not mounted.");
        done(null);
      });
  }

  /** Paragraphs, split on blank lines. Text only -- see the header. */
  function renderBody(text) {
    var wrap = el("div", { class: "fa-sticky-body" });
    var paras = String(text || "").split(/\n{2,}/);
    for (var i = 0; i < paras.length; i++) {
      var p = paras[i].trim();
      if (p !== "") wrap.appendChild(el("p", null, p));
    }
    if (wrap.childNodes.length === 0) {
      wrap.appendChild(el("p", { class: "fa-sticky-empty" }, "No detail recorded."));
    }
    return wrap;
  }


  /**
   * Board order: todos stacked by the BPMN subprocess hierarchy.
   *
   * "stacking should follow hiearchy od busines subprocesses". The diagrams
   * already carry that hierarchy as `calledElement` refs — `Process_Lifecycle`
   * calls `Process_Publication`, which calls `Process_Editing` — and the
   * generator publishes it beside the todos.
   *
   * ## Depth is the process's own, not the todo's
   *
   * A todo tagged `Process_Publication` sits at the depth `Process_Publication`
   * sits at, so two todos on the same process always land together and a todo
   * on a caller always sorts above one on its callee. Computing depth from the
   * todo would make the same process appear at different levels depending on
   * which todo reached it first.
   *
   * ## A todo on SEVERAL processes takes the shallowest
   *
   * `what-kick-off-means-for-a-ci-watcher` is tagged `Process_CodeReview` AND
   * `Process_Publication`, because its two dispatch points are in different
   * diagrams. It belongs where a reader would look first, which is the outer
   * one; listing it twice would double a single outstanding item.
   *
   * ## Untagged todos are not orphans
   *
   * They sort FIRST, not last. Most todos carry no process — both of the
   * others here do not — and sinking them below a process hierarchy they are
   * not part of would bury the common case under the rare one.
   */
  function processDepth(id, hierarchy) {
    // A process's depth is how many callers stand above it. Cycles are
    // possible in principle (two diagrams calling each other), so the walk is
    // bounded by the number of processes rather than trusting acyclicity.
    var parents = {};
    for (var p in hierarchy) {
      var kids = hierarchy[p] || [];
      for (var k = 0; k < kids.length; k++) if (!parents[kids[k]]) parents[kids[k]] = p;
    }
    var depth = 0;
    var at = id;
    var guard = 0;
    var limit = Object.keys(hierarchy).length + 1;
    while (parents[at] && guard++ < limit) { at = parents[at]; depth++; }
    return depth;
  }

  function stackTodos(items, hierarchy) {
    var rows = [];
    for (var i = 0; i < items.length; i++) {
      var t = items[i];
      var procs = (t.tags && t.tags.processes) || [];
      if (procs.length === 0) { rows.push({ todo: t, process: null, depth: -1 }); continue; }
      var best = procs[0];
      var bestD = processDepth(best, hierarchy);
      for (var j = 1; j < procs.length; j++) {
        var d = processDepth(procs[j], hierarchy);
        if (d < bestD) { best = procs[j]; bestD = d; }
      }
      rows.push({ todo: t, process: best, depth: bestD });
    }
    rows.sort(function (a, b) {
      if (a.depth !== b.depth) return a.depth - b.depth;
      if (a.process !== b.process) return String(a.process).localeCompare(String(b.process));
      return a.todo.id.localeCompare(b.todo.id);
    });
    return rows;
  }

  function buildSticky(todo, onFloat, onDock, opts) {
    var compact = opts && opts.compact;
    var card = el("article", {
      class: "fa-sticky fa-sticky-p-" + (todo.priority || "medium"),
      "data-todo-id": todo.id,
    });

    var head = el("div", { class: "fa-sticky-head" });
    var toggle = el("button", {
      type: "button",
      class: "fa-sticky-toggle",
      "aria-expanded": "false",
    });
    toggle.appendChild(el("span", { class: "fa-sticky-summary" }, todo.summary));
    head.appendChild(toggle);

    var chips = el("div", { class: "fa-sticky-chips" });
    chips.appendChild(el("span", { class: "fa-sticky-chip fa-sticky-status" }, todo.status));
    chips.appendChild(el("span", { class: "fa-sticky-chip fa-sticky-prio" }, todo.priority));
    head.appendChild(chips);

    // The EDGES. A todo carries six relationship axes -- who it is for, which
    // lane and process and task it sits in, what it points at in the knowledge
    // graph, and which issues, PRs and commits it concerns -- and a sticky that
    // showed only `status` and `priority` would waste all of it on two enums.
    //
    // Each edge is resolved to an href at BUILD time where one exists. An edge
    // that could not be resolved is still shown, as a chip with no link: a
    // dangling reference and no reference at all are different facts, and
    // dropping the first makes it look like the second.
    var rels = todo.relations || [];
    if (rels.length) {
      var relBox = el("ul", { class: "fa-sticky-rels", "aria-label": "Related" });
      for (var r = 0; r < rels.length; r++) {
        var rel = rels[r];
        var li = el("li", { class: "fa-sticky-rel" });
        li.appendChild(el("span", { class: "fa-sticky-rel-axis" }, rel.axis));
        if (rel.href) {
          li.appendChild(el("a", { class: "fa-sticky-rel-link", href: rel.href }, rel.label));
        } else {
          // Title says WHY there is no link, so a reader is not left guessing
          // whether the chip is broken or the target simply is not reachable.
          li.appendChild(el("span", {
            class: "fa-sticky-rel-dangling",
            title: "No link: nothing on this site resolves " + rel.label,
          }, rel.label));
        }
        relBox.appendChild(li);
      }
      head.appendChild(relBox);
    }

    var tools = el("div", { class: "fa-sticky-tools" });
    // The SAME affordance every node on this site already has, pointed at this
    // todo's own file. `editHref` is composed at build time.
    if (todo.editHref) {
      var pencil = el("a", {
        class: "fa-node-edit fa-sticky-edit",
        href: todo.editHref,
        title: "Edit this todo's markdown",
        "aria-label": "Edit " + todo.summary,
      }, "✎ Edit");
      tools.appendChild(pencil);
    }
    // An INLINE sticky is already beside the content it is about, so Pin and
    // Close have nothing to do: pinning it would move it AWAY from the thing
    // it annotates, and closing it would hide a block-level annotation with no
    // way back. The board is where those two controls mean something.
    if (!compact) {
      var pin = el("button", {
        type: "button",
        class: "fa-sticky-pin",
        "aria-label": "Pin " + todo.summary + " to the page",
      }, "⇱ Pin");
      pin.addEventListener("click", function () { onFloat(todo); });
      tools.appendChild(pin);

      var close = el("button", {
        type: "button",
        class: "fa-sticky-close",
        "aria-label": "Close " + todo.summary,
      }, "×");
      close.addEventListener("click", function () { onDock(todo); });
      tools.appendChild(close);
    }

    head.appendChild(tools);

    card.appendChild(head);
    var body = renderBody(todo.comment);
    body.setAttribute("hidden", "hidden");
    card.appendChild(body);

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
      if (open) body.setAttribute("hidden", "hidden");
      else body.removeAttribute("hidden");
    });
    return card;
  }

  /**
   * The board, and the float layer.
   *
   * ## "Pick up and move" is a MOVE, not a drag
   *
   * The spec says the reader picks a sticky up off the panel and fixes it to
   * the page. A pointer drag cannot be operated from a keyboard without
   * reimplementing the whole interaction -- arrow-key nudging, a grab mode, an
   * escape hatch -- and this instance's declared interaction profile is
   * low-dexterity, where a drag is the single worst control to depend on.
   *
   * So the gesture is a BUTTON: Pin lifts the sticky onto the page, Close
   * returns it. It is one keystroke either way, it needs no pointer at all,
   * and nothing about it is harder with a mouse than a drag would have been.
   * Drag can be added ON TOP later as an accelerator; it must not be the only
   * way in.
   *
   * ## A floating sticky is greyed on the board, not removed from it
   *
   * The owner's words: "when floating, they are greyed out on sticky panel but
   * can also return the sticky note by clicking disabled." So the board keeps
   * every sticky in a stable position -- a list that reflows when you pin one
   * makes the next one you want move under your cursor -- and the greyed entry
   * is a real button that docks it again.
   */
  function mountTodoBoard(items) {
    var main = firstMatch(["#main-content", ".main-content", "main"]);
    if (!main) {
      console.warn("docs-ui: no main content region found; the todo board was not mounted.");
      return null;
    }

    var layer = el("div", { class: "fa-sticky-layer", "aria-live": "polite" });
    document.body.appendChild(layer);

    var board = el("section", {
      class: "fa-sticky-board",
      hidden: "hidden",
      tabindex: "-1",
      role: "region",
      "aria-label": "Todos",
    });
    var head = el("div", { class: "fa-sticky-board-head" });
    var heading = el("h2", { class: "fa-sticky-board-title", tabindex: "-1" }, "Todos");
    head.appendChild(heading);
    var boardClose = el("button", {
      type: "button",
      class: "fa-sticky-board-close",
      "aria-label": "Close the todo board",
    }, "×");
    head.appendChild(boardClose);
    board.appendChild(head);

    var grid = el("div", { class: "fa-sticky-grid" });
    board.appendChild(grid);
    main.insertBefore(board, main.firstChild);

    var slots = {};

    function dock(todo) {
      var f = todoState.floating[todo.id];
      if (f) {
        layer.removeChild(f);
        delete todoState.floating[todo.id];
      }
      var slot = slots[todo.id];
      if (slot) {
        slot.classList.remove("fa-sticky-slot-floating");
        var b = slot.querySelector(".fa-sticky-recall");
        if (b) slot.removeChild(b);
        var card = slot.querySelector(".fa-sticky");
        if (card) card.removeAttribute("hidden");
      }
    }

    function float(todo) {
      if (todoState.floating[todo.id]) return;
      var card = buildSticky(todo, float, dock);
      card.classList.add("fa-sticky-floating");
      layer.appendChild(card);
      todoState.floating[todo.id] = card;

      var slot = slots[todo.id];
      if (slot) {
        slot.classList.add("fa-sticky-slot-floating");
        var inner = slot.querySelector(".fa-sticky");
        if (inner) inner.setAttribute("hidden", "hidden");
        // The greyed entry is a REAL button, not a disabled one. `disabled`
        // removes it from the tab order, and the owner asked that clicking it
        // bring the sticky back -- a control you cannot reach is not a control.
        var recall = el("button", {
          type: "button",
          class: "fa-sticky-recall",
          "aria-label": "Return " + todo.summary + " to the board",
        }, todo.summary);
        recall.addEventListener("click", function () { dock(todo); });
        slot.appendChild(recall);
      }
      // Focus follows the sticky, or a reader who cannot see the page has no
      // idea anything happened.
      var t = card.querySelector(".fa-sticky-toggle");
      if (t) t.focus();
    }

    var rows = stackTodos(items, todoState.processes);
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var slot = el("div", {
        class: "fa-sticky-slot" + (row.process ? " fa-sticky-slot-in-process" : ""),
      });
      if (row.process) {
        // The process is named ON the sticky rather than as a run-in heading,
        // so the grid stays a grid: a full-width heading between cards would
        // break the `auto-fill` columns into one per group.
        slot.setAttribute("data-fa-depth", String(row.depth));
        slot.appendChild(el("span", { class: "fa-sticky-process" }, row.process));
      }
      slot.appendChild(buildSticky(row.todo, float, dock));
      slots[row.todo.id] = slot;
      grid.appendChild(slot);
    }
    if (items.length === 0) {
      grid.appendChild(el("p", { class: "fa-sticky-empty" }, "Nothing outstanding."));
    }

    function setOpen(isOpen) {
      if (isOpen) {
        board.removeAttribute("hidden");
        heading.focus();
      } else {
        board.setAttribute("hidden", "hidden");
      }
      return isOpen;
    }
    boardClose.addEventListener("click", function () { setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !board.hasAttribute("hidden")) setOpen(false);
    });

    return {
      toggle: function () { return setOpen(board.hasAttribute("hidden")); },
      count: items.length,
    };
  }

  /**
   * Todos attached to a block ON THIS PAGE, rendered beside the block.
   *
   * Matched on `targetLabel` against the heading's `data-fa-label`, which is
   * PAGE-QUALIFIED (`sec:<page>-<node>`). The bare heading id cannot serve:
   * `what-is-not-built-yet` is a node on two different pages, so matching on
   * it would attach a todo to whichever page the reader opened.
   *
   * The count sits on a toggle beside the heading rather than at the top of
   * the page. The owner asked for "a sticky icon with a count" at the top and
   * for the stickies to appear "relative to content they are assigned to" —
   * and those pull apart once a page has blocks with different counts. One
   * badge per block says which block, which is the half that carries
   * information; a single page-level number cannot say where to look.
   */
  function mountPageStickies(items, board) {
    var byLabel = {};
    for (var i = 0; i < items.length; i++) {
      var t = items[i];
      if (!t.targetLabel) continue;
      (byLabel[t.targetLabel] = byLabel[t.targetLabel] || []).push(t);
    }

    var heads = document.querySelectorAll("[data-fa-label]");
    var placed = 0;
    for (var h = 0; h < heads.length; h++) {
      var head = heads[h];
      var mine = byLabel[head.getAttribute("data-fa-label")];
      if (!mine || mine.length === 0) continue;

      var host = el("div", { class: "fa-sticky-inline" });
      var badge = el("button", {
        type: "button",
        class: "fa-sticky-badge",
        "aria-expanded": "false",
        "aria-label": mine.length + " todo(s) on this section",
      });
      badge.innerHTML = STICKY_GLYPH;
      badge.appendChild(el("span", { class: "fa-sticky-badge-count" }, String(mine.length)));

      var list = el("div", { class: "fa-sticky-inline-list", hidden: "hidden" });
      (function (list, mine) {
        for (var k = 0; k < mine.length; k++) {
          list.appendChild(buildSticky(mine[k], function () {}, function () {}, { compact: true }));
        }
      })(list, mine);

      (function (badge, list) {
        badge.addEventListener("click", function () {
          var open = badge.getAttribute("aria-expanded") === "true";
          badge.setAttribute("aria-expanded", open ? "false" : "true");
          if (open) list.setAttribute("hidden", "hidden");
          else list.removeAttribute("hidden");
        });
      })(badge, list);

      host.appendChild(badge);
      // A SIBLING of the heading, not a child: a <div> inside an <h2> is not
      // valid HTML and the browser would reparent it -- the same rule the QA
      // panel already follows for the same reason.
      head.parentNode.insertBefore(host, head.nextSibling);
      host.parentNode.insertBefore(list, host.nextSibling);
      placed += mine.length;
    }

    // Reported, not silent. A todo carrying a `targetLabel` that matches no
    // block on any page is a dangling edge, and the reader would otherwise
    // only ever see it on the board -- where nothing says it was SUPPOSED to
    // appear somewhere and did not.
    var tagged = 0;
    for (var j = 0; j < items.length; j++) if (items[j].targetLabel) tagged++;
    if (board) board.placed = placed;
    return { placed: placed, tagged: tagged };
  }

  /** Fetch, then mount the board and hand the launcher a way to open it. */
  function mountTodoStickies() {
    fetchTodoIndex(function (items) {
      if (items === null) return;
      todoState.items = items;
      var board = mountTodoBoard(items);
      if (!board) return;
      mountPageStickies(items, board);
      window.__faTodoBoard = board;
      document.dispatchEvent(new CustomEvent("fa:todos-ready", { detail: board }));
    });
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

  /* ── The navbar filters by the selected locale ───────────────────────── */

  /*
   * THE BUG THIS EXISTS FOR, in the owner's words (2026-09-19):
   *
   *   "i have english selected, but i see the translated pages in LHS navbar."
   *
   * Two halves, and only the second is here.
   *
   * The first half is `nav_exclude: true` on every translated page. The nav is
   * built by just-the-docs AT BUILD TIME, from front matter, on a static site
   * that is serving the same HTML to every reader. It cannot know which locale
   * anybody selected, so a translated page left in it is in it FOR EVERYBODY.
   * No amount of client-side work fixes that: a script can swap a nav item,
   * it cannot un-render one without a flash of the wrong nav first. So the
   * translations leave the static nav entirely, and the navbar a reader gets
   * with no JavaScript at all is the SOURCE-LANGUAGE one -- which is the
   * correct degraded answer rather than an arbitrary one.
   *
   * The second half is this function. With a non-source locale selected, each
   * nav item that HAS a page in that locale is rewritten IN PLACE -- same
   * position, same parent, translated title, translated href. "In place of",
   * not "in addition to", is the requirement, and rewriting rather than
   * inserting is what makes it structurally true rather than something the
   * ordering has to be trusted to preserve.
   *
   * FALLBACK IS THE ABSENCE OF A REWRITE. An item with no page in the selected
   * locale is not touched, so it keeps its source-language title and link.
   * There is deliberately no code path for it: a fallback implemented as its
   * own branch is a branch that can be wrong, and this one cannot be.
   *
   * ## Three states, and the third is why the index is published as `null`
   *
   *   ok        -- the index parsed; filter the nav.
   *   empty     -- it parsed and holds no pages; nothing to swap, and every
   *                item correctly stays in the source language.
   *   unknown   -- no island, or it would not parse, or `index` is `null`
   *                because the data file was absent at build time. The nav is
   *                left EXACTLY as built and nothing is claimed.
   *
   * `empty` and `unknown` produce the same navbar and are not the same answer:
   * one is "this folio has no translations", the other is "this build could not
   * tell". They are recorded separately in `data-fa-nav-index` so that a
   * reader, a test, or the next person debugging this can distinguish them --
   * the same rule the README sections and the CI-health report follow.
   */

  /**
   * The key a nav `href` and an indexed page are matched on.
   *
   * MUST stay in step with `pageKey` in content/pipeline/translation-index.ts
   * — the two are one convention implemented twice, once in the generator and
   * once in the consumer, because they run in different languages on different
   * machines. Jekyll serves one page at several spellings (`/`, `/x.html`,
   * `/x/`) under a `baseurl` this script is told rather than guesses, so both
   * sides normalise to a bare extensionless path with no `index` and no
   * slashes at either end.
   */
  function navKey(href, baseurl) {
    if (!href) return null;
    var path;
    try {
      // Resolves relative hrefs against the current page, and rejects
      // `mailto:`/`#`/external links by their origin below.
      var u = new URL(href, window.location.href);
      if (u.origin !== window.location.origin) return null;
      path = u.pathname;
    } catch (_e) {
      return null;
    }
    if (baseurl && path.indexOf(baseurl) === 0) path = path.slice(baseurl.length);
    path = path.replace(/^\/+/, "").replace(/\/+$/, "");
    path = path.replace(/\.html?$/i, "");
    path = path.replace(/(^|\/)index$/i, "");
    return path.replace(/^\/+|\/+$/g, "");
  }

  /** The published index, or null when this build could not determine one. */
  function getTranslationIndex() {
    var node = document.getElementById("fa-translation-index");
    if (!node) return null;
    var parsed;
    try { parsed = JSON.parse(node.textContent); } catch (_e) { return null; }
    if (!parsed || typeof parsed !== "object") return null;
    // `index: null` is the deliberate signal that `docs/_data/translations.json`
    // was not there when the site was built. It is NOT an empty index.
    if (!parsed.index || typeof parsed.index !== "object") return null;
    if (!parsed.index.pages || typeof parsed.index.pages !== "object") return null;
    return { baseurl: typeof parsed.baseurl === "string" ? parsed.baseurl : "", data: parsed.index };
  }

  /**
   * Which locale the navbar should be in.
   *
   * In precedence order, and each step answers a question the next cannot:
   *
   *   1. `?lang=` on the URL -- an explicit, shareable request for one page
   *      view. It wins because somebody typed it.
   *   2. the page's own `lang`, when the page IS a translation. A reader
   *      looking at the French page is reading French, whatever a stale
   *      localStorage entry from another device says; a navbar in English
   *      around French prose is the mismatch this whole change is about.
   *   3. the remembered choice (`fa-locale`), which the sidebar language bar
   *      has been writing since it was built.
   *   4. the source language.
   *
   * A locale the index has never heard of is NOT honoured -- it would rewrite
   * nothing and merely label the nav with a language it is not in.
   */
  function navLocale(data, pageLang) {
    var sourceLocale = data.sourceLocale || "en";
    var known = (data.locales || []).concat([sourceLocale]);
    var wanted = null;
    try {
      var q = new URL(window.location.href).searchParams.get("lang");
      if (q) wanted = q;
    } catch (_e) { /* a URL we cannot parse simply does not ask for a locale */ }
    if (!wanted && pageLang && pageLang !== sourceLocale) wanted = pageLang;
    if (!wanted) wanted = getGlobalLocale();
    if (!wanted || known.indexOf(wanted) === -1) return sourceLocale;
    return wanted;
  }

  function mountNavLocale() {
    var nav = document.querySelector(".site-nav") || document.querySelector(".nav-list");
    if (!nav) return;

    var idx = getTranslationIndex();
    if (!idx) {
      // Degrade LOUDLY, the discipline this whole file follows: a feature that
      // quietly does nothing is indistinguishable from one nobody looked at.
      nav.setAttribute("data-fa-nav-index", "unknown");
      if (window.console && console.warn) {
        console.warn(
          "docs-ui: no readable translation index (#fa-translation-index). " +
          "The navbar is left exactly as built -- this is NOT a claim that " +
          "the folio has no translations. Run: bun run translation:index"
        );
      }
      return;
    }

    var data = idx.data;
    var pages = data.pages;
    var meta = getTranslationMeta();
    var locale = navLocale(data, meta && meta.lang);
    nav.setAttribute("data-fa-nav-index", Object.keys(pages).length === 0 ? "empty" : "ok");
    nav.setAttribute("data-fa-nav-locale", locale);

    // The source language needs no rewriting at all, and saying so explicitly
    // is cheaper than walking the nav to discover it.
    if (locale === (data.sourceLocale || "en")) return;

    var here = navKey(window.location.href, idx.baseurl);
    var links = nav.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var key = navKey(link.getAttribute("href"), idx.baseurl);
      if (key === null) continue;
      var entry = Object.prototype.hasOwnProperty.call(pages, key) ? pages[key] : null;
      var t = entry && entry.translations ? entry.translations[locale] : null;
      if (!t || !t.url) {
        // FALLBACK. Not a branch that does something -- a branch that does
        // nothing, on purpose, so the item keeps the source-language page it
        // already points at.
        link.setAttribute("data-fa-translated", "source");
        continue;
      }
      link.setAttribute("href", (idx.baseurl || "") + t.url);
      if (t.title) link.textContent = t.title;
      link.setAttribute("lang", locale);
      // Per-LINK direction, not per-page: an Arabic item inside an otherwise
      // English navbar has to carry its own, or the bracket and the trailing
      // "(AR)" render on the wrong side of it.
      link.setAttribute("dir", t.dir === "rtl" ? "rtl" : "ltr");
      link.setAttribute("data-fa-translated", locale);
      if (t.status) link.setAttribute("data-fa-translation-status", t.status);
      // just-the-docs computed "you are here" at build time against the SOURCE
      // page's url, so a reader on the translated page loses the marker unless
      // it is put back against the rewritten target.
      if (here !== null && navKey(t.url, "") === here) link.setAttribute("aria-current", "page");
    }
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
    // the pipeline hasn't stamped availableLocales yet. Scans whatever carries
    // `data-locale`, which is what `buildLanguageBar` above emits — it used to
    // read a `_includes/language-selector.html`, deleted once this file did the
    // same job better (it greys out untranslated locales, which that include
    // only promised in a comment).
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

    mountActionTiles();
    // Before the badges: both read the same translation metadata, and the nav
    // is the thing a reader sees first.
    mountNavLocale();
    mountTranslationBadges();
    mountQaPanels();
    mountTodoStickies();
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
