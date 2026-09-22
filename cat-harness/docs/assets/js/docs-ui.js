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
    if (attrs) Object.keys(attrs).forEach(function (k) {
      // AN ABSENT VALUE MEANS AN ABSENT ATTRIBUTE. `setAttribute(k, undefined)`
      // writes the string "undefined", so `{ href: undefined }` produced
      // `href="undefined"` — a relative link to a page called `undefined`,
      // which is a link to somewhere wrong rather than no link at all.
      //
      // Two callers already relied on the intent: the language switcher passes
      // `href: undefined` for a locale that is not available, and `safeHref`
      // returns `undefined` for a URL a link may not carry. `pb04` in both
      // cases — no link beats a link to nowhere.
      if (attrs[k] === undefined || attrs[k] === null) return;
      node.setAttribute(k, attrs[k]);
    });
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

  /* The six UN languages, matching `UN_LOCALES` in `schemas/translation.ts`.

     A FALLBACK, never the answer: `fa-translation-meta` carries the instance's
     own `supportedLocales`, and an instance may support more or fewer. This is
     what a page with no meta block falls back to, in one place, because the
     same array was written out three times below and the three were free to
     disagree with each other and with the schema. */
  var UN_LOCALES = ["ar", "zh", "en", "fr", "ru", "es"];

  /**
   * Every locale a reader can read THIS page in \u2014 the source language included.
   *
   * The source language is a language. An English page on a six-UN-language
   * site is available in one of them, not none, and the coverage badge read
   * `0/5` because both halves of that fraction excluded it: the denominator was
   * hardcoded to `supported.length - 1`, and the numerator came from
   * `available_locales`, which the generator derives by resolving
   * `translations/<locale>/<stem>.po` \u2014 a lookup the source language can never
   * satisfy, since there is no `translations/en/` and there never will be.
   *
   * So the page's own `lang` is folded in here rather than being expected in
   * the data, which also repairs the two front-matter conventions that had
   * drifted apart: generated source pages stamped the PO-derived list while the
   * hand-authored translated pages stamped the full supported set, and
   * `docs/fr/index.md` therefore rendered `6/5 languages`.
   *
   * Filtered by `supported` so a locale outside the declared set cannot inflate
   * a count taken against it, and ordered by `supported` so every page's bar
   * and badge read in the same order. Issue #687.
   */
  function localesAvailable(meta, supported) {
    var have = {};
    if (meta && meta.lang) have[meta.lang] = true;
    var declared = (meta && meta.availableLocales) || [];
    for (var i = 0; i < declared.length; i++) have[declared[i]] = true;
    return supported.filter(function (loc) { return have[loc] === true; });
  }

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
    // No `loc !== "en"` exemption: `available` carries the source language now,
    // so membership answers this on its own, and the exemption would have
    // offered English on a folio that has no English.
    if (available.indexOf(loc) === -1) return null;
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
    var supported = (meta && meta.supportedLocales) || UN_LOCALES;
    var available = localesAvailable(meta, supported);
    var path = window.location.pathname;
    var basePath = deriveBasePath(path, currentLang);

    // Horizontal language bar — shows all 6 UN languages. Inside a tile view
    // it is simply present: the view's own disclosure decides whether anyone
    // can see it, so the bar carries no open/closed state of its own.
    var bar = el("div", { class: "fa-lang-bar fa-tile-content", "data-open": "true" });

    var remembered = rememberedLocale(currentLang, available);

    for (var i = 0; i < supported.length; i++) {
      var loc = supported[i];
      // `available` now carries the source language, so membership is the whole
      // test. `loc === "en"` stood here, which made English clickable on a
      // folio authored in French and left French greyed out on its own page.
      var isAvailable = available.indexOf(loc) !== -1;
      var isCurrent = loc === currentLang;
      var isRemembered = loc === remembered;

      // Available = clickable <a>. Unavailable = disabled <span>.
      //
      // No inline colours. Every pair is a token in `docs-ui.css` with its
      // measured ratio beside it -- bean `rptk`, whose second half is this
      // function: the unavailable tab was `#475569` at `opacity:0.5`, which
      // composites to 1.39:1 on the tile panel, and the current tab was
      // #ffffff on #3b82f6 at 3.67:1. The per-page bar was fixed first and
      // this one kept the literals, because the gate never opened this view.
      var tab = el(isAvailable ? "a" : "span", {
        href: isAvailable ? safeHref(localePath(basePath, loc)) : undefined,
        "data-locale": loc,
        title: isAvailable
          ? LOCALE_NAMES[loc] + (isRemembered ? " \u2014 your saved language" : "")
          : LOCALE_NAMES[loc] + " \u2014 not yet translated",
        class: "fa-lang-tab" +
               (isCurrent ? " is-current" : isAvailable ? "" : " is-unavailable") +
               (isRemembered ? " is-remembered" : "")
      }, loc.toUpperCase());

      // Hover is a CSS `:hover` rule now, for the same reason: a colour
      // written by `style.background` is a literal nothing can measure,
      // because it exists only while a pointer is over the tab.
      if (isAvailable && !isCurrent) {
        (function (locale, link) {
          link.addEventListener("click", function () { setGlobalLocale(locale); });
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
    var supported = (meta && meta.supportedLocales) || UN_LOCALES;
    var available = localesAvailable(meta, supported);
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
      // `available` now carries the source language, so membership is the whole
      // test. `loc === "en"` stood here, which made English clickable on a
      // folio authored in French and left French greyed out on its own page.
      var isAvailable = available.indexOf(loc) !== -1;
      var isCurrent = loc === currentLang;
      var isRemembered = loc === remembered;

      var tab = el(isAvailable ? "a" : "span", {
        href: isAvailable ? safeHref(localePath(basePath, loc)) : undefined,
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

  /* ── ONE scheme, TWO controls that must never disagree ─────────────────
   *
   * The light/dark switch now exists in two places: the Settings tile it has
   * always had, and a mini-button in the header row (owner, 2026-09-21:
   * *"can you put dark/light mode switch in mini-icon on top as well as
   * language icon. to right of folio-asst, to left of the [3x3 checkboard]"*).
   *
   * Two buttons over one fact is how a control starts lying: press the header
   * one and the tile still shows the old bulb, so the next reader to open
   * Settings sees "Light" on a dark page. So NEITHER button owns the state.
   * Each REGISTERS a painter here, one click path mutates, and every
   * registered painter repaints. Adding a third control is one more
   * `registerSchemePainter` call and no new coordination.
   *
   * This is the same rule the search field is moved rather than rebuilt for:
   * a second copy that looks identical and disagrees is worse than no copy.
   */
  var schemePainters = [];
  var schemeInitialised = false;

  /**
   * Apply the reader's STORED choice once, before any control paints.
   *
   * Idempotent, because both controls call it and either may mount first --
   * and their order is not fixed: the tile is built lazily when Settings is
   * first opened, while the header button mounts on load. `jtd.getTheme()`
   * reflects the stylesheet the SERVER sent, which does not know what this
   * reader picked last visit, so without this the page paints in the
   * configured scheme and then flips.
   */
  function initScheme() {
    if (schemeInitialised) return;
    schemeInitialised = true;
    var scheme = currentScheme();
    if (storedScheme()) applyScheme(scheme);
    else document.documentElement.setAttribute("data-fa-scheme", scheme);
  }

  /** Register a control's painter and paint it immediately, so it is never
   *  briefly showing a scheme the page is not in. */
  function registerSchemePainter(paint) {
    initScheme();
    schemePainters.push(paint);
    paint(currentScheme());
  }

  /** The ONE mutation path. Every control calls this and none sets the
   *  scheme itself. */
  function toggleScheme() {
    var next = currentScheme() === "light" ? "dark" : "light";
    if (!applyScheme(next)) return;
    try { window.localStorage.setItem(SCHEME_KEY, next); } catch (_e) { /* private mode */ }
    for (var i = 0; i < schemePainters.length; i++) schemePainters[i](next);

    // No reload. Diagrams are pinned to Mermaid's LIGHT palette on a white
    // card in both schemes (docs/_includes/mermaid_config.js), so nothing on
    // the page needs re-rendering when the scheme changes. An earlier version
    // reloaded here because the diagram palette followed the scheme; that
    // coupling is gone and the reload went with it.
  }

  /**
   * The light/dark control, as a tile.
   *
   * The owner originally placed it "under settings" rather than in the top
   * row, and that reasoning still holds for the TILE: it is a control a
   * reader sets once, so it does not earn prime space on its own. What
   * changed 2026-09-21 is that the owner asked for a header mini-button TOO
   * -- so this is no longer the only way in, and it keeps its class because
   * the e2e spec and the stylesheet still find it by that name.
   */
  function buildThemeTile() {
    var btn = el("button", { type: "button", class: "fa-tile fa-theme-toggle" });
    var caption = el("span", { class: "fa-tile-caption" });

    registerSchemePainter(function (name) {
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
    });

    btn.addEventListener("click", toggleScheme);
    return btn;
  }

  /**
   * The same switch as a HEADER MINI-BUTTON, beside the tiles launcher.
   *
   * No caption -- the header row is capped at 3.75rem and shares its width
   * with the site title, which is the whole reason `1le7` collapsed four
   * header icons into one launcher. Two icons come back here because the
   * owner asked for them by name; the launcher stays, so the row is three
   * rather than the six that decision was avoiding.
   *
   * The bulb alone therefore has to carry the state, which is why the
   * `aria-label` is a sentence rather than a word: a reader who cannot see
   * the glyph gets the same fact the tile's caption gives.
   */
  function buildSchemeMini() {
    var btn = el("button", { type: "button", class: "fa-qr-toggle fa-scheme-mini" });
    registerSchemePainter(function (name) {
      btn.innerHTML = name === "light" ? BULB_ON : BULB_OFF;
      btn.setAttribute("aria-label",
        name === "light" ? "Light mode is on — switch to dark" : "Dark mode is on — switch to light");
      btn.setAttribute("aria-pressed", name === "dark" ? "true" : "false");
    });
    btn.addEventListener("click", toggleScheme);
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


  /* ── Discarded items — the fsh-guts viewer ─────────────────────────────
   *
   * Owner, 2026-09-19: *"only available under settings at dead fish icon.
   * opening it shows a list of all the nodes in fsh-guts/ (has counter on
   * icon) and use can open dialog to select and display them."*
   *
   * ## Why it is fetched when SETTINGS opens, not on page load
   *
   * The document carries every node's body. Measured: 64 KB with them
   * against 5 KB without. The control lives inside Settings, so its count is
   * not needed until Settings is opened — fetching 64 KB on every page view
   * to populate a badge nobody has looked at would be indefensible. The
   * result is cached for the page, so opening Settings twice fetches once.
   *
   * ## Three states, and the middle one is the whole point
   *
   * The todo tile hides itself when the count is zero, which is right for
   * todos. Doing the same here would be wrong: a FAILED fetch and an empty
   * trashcan would look identical, and they are opposite facts. So
   *
   *   loaded, n > 0   the control, with n in its accessible name
   *   loaded, n === 0 a plain line saying the trashcan is empty
   *   failed          a plain line saying it could not be read, and why
   *
   * ## The body is rendered as TEXT
   *
   * `renderBody` splits on blank lines and emits paragraphs via textContent.
   * No markdown renderer and no sanitiser, deliberately: `fsh-guts/` is a
   * dumping ground anyone may drop a file into, and the safe thing to do
   * with content like that is not to interpret it. A link to the source on
   * the forge is offered for anyone who wants it rendered.
   */

  var FISH_GLYPH =
    '<svg class="fa-tile-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    // Body, tail, and an X for the eye — a dead fish, per the owner.
    '<path d="M2 12c3-4 7-6 11-6s7 2 9 6c-2 4-5 6-9 6s-8-2-11-6z" fill="none" ' +
    'stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<path d="M22 12l-3-3v6z" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linejoin="round"/>' +
    '<path d="M7.2 10.2l2 2m0-2l-2 2" fill="none" stroke="currentColor" ' +
    'stroke-width="1.6" stroke-linecap="round"/></svg>';

  /** `{ nodes }` on success, `{ error }` when it could not be read. Cached. */
  var discardedCache = null;

  function fetchDiscarded(done) {
    if (discardedCache) return done(discardedCache);
    var src = document.querySelector('meta[name="fa-fsh-guts-src"]');
    var url = src && src.getAttribute("content");
    if (!url) {
      // Not an error and not an empty trashcan: this build published no
      // document, so there is nothing to say a count about.
      discardedCache = { absent: true };
      return done(discardedCache);
    }
    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (doc) {
        var g = doc && doc["@graph"];
        if (!Array.isArray(g)) throw new Error("no @graph array");
        discardedCache = { nodes: g };
        done(discardedCache);
      })
      .catch(function (e) {
        discardedCache = { error: e.message, url: url };
        done(discardedCache);
      });
  }

  /** One node's detail: what it was, where it came from, and its text. */
  function buildDiscardedDetail(node, onBack) {
    var wrap = el("div", { class: "fa-discarded-detail" });

    var back = el("button", { type: "button", class: "fa-discarded-back" },
                  "‹ All discarded items");
    back.addEventListener("click", onBack);
    wrap.appendChild(back);

    var h = el("h4", { class: "fa-discarded-title", tabindex: "-1" },
               String(node.name || node.sourcePath || "Untitled"));
    wrap.appendChild(h);

    // The metadata that makes it not an orphan. `movedFrom` first: a reader
    // asking "what is this" is usually asking where it used to be.
    var meta = el("dl", { class: "fa-discarded-meta" });
    function row(label, value) {
      if (!value) return;
      meta.appendChild(el("dt", null, label));
      meta.appendChild(el("dd", null, String(value)));
    }
    row("Was at", node.movedFrom);
    row("Moved", node.movedOn);
    row("Kind", node.nodeKind);
    row("Issue", node.issue ? "#" + node.issue : "");
    if (meta.childNodes.length) wrap.appendChild(meta);

    if (node.description) {
      wrap.appendChild(el("p", { class: "fa-discarded-summary" }, String(node.description)));
    }

    // NEVER A BLANK PANE. A node with no body says so; it does not render
    // nothing and leave the reader wondering whether it failed.
    if (node.body) {
      wrap.appendChild(renderBody(node.body));
    } else {
      wrap.appendChild(el("p", { class: "fa-discarded-none" },
        "This item carries no text — only the record of what it was and where it came from."));
    }

    var links = getSiteLinks();
    if (links.source && node.sourcePath) {
      wrap.appendChild(el("a", {
        class: "fa-discarded-source",
        href: safeHref(String(links.source).replace(/\/$/, "") + "/blob/main/" + node.sourcePath),
      }, "View the source of this item"));
    }
    return wrap;
  }

  /**
   * Stickies THIS BROWSER discarded, with a way to get each one back.
   *
   * A separate section from the repository's own nodes, and labelled as
   * such. They are different facts with different reach: one is committed
   * and visible to everyone, the other is `localStorage` and visible to
   * nobody else. Listing them together unlabelled would tell a reader they
   * had cleared something for the team.
   *
   * RESTORE is not a nicety. `fsh-guts` is "the trashcan that is kept" and
   * its rule is that a thing in it can be read, cited and restored — a
   * one-way dismiss would wear the crumpled icon while breaking the rule the
   * icon stands for.
   */
  function buildDiscardedTodos() {
    var wrap = el("section", { class: "fa-discarded-local",
                               "aria-label": "Todos you discarded in this browser" });
    var ids = discardedTodoIds();
    if (ids.length === 0) return wrap;   // nothing to say, and no empty heading

    wrap.appendChild(el("h4", { class: "fa-discarded-local-title" },
      ids.length === 1 ? "1 todo you discarded" : ids.length + " todos you discarded"));
    wrap.appendChild(el("p", { class: "fa-discarded-local-note" },
      "Discarded in this browser only — saved here, not sent anywhere, and not " +
      "discarded for anyone else."));

    var byId = {};
    (todoState.items || []).forEach(function (t) { byId[t.id] = t; });

    var ul = el("ul", { class: "fa-discarded-list" });
    ids.forEach(function (id) {
      var todo = byId[id];
      var li = el("li", { class: "fa-discarded-local-row" });
      // The id is the fallback, not a blank: a discarded todo whose entry has
      // since left the published index still has to be nameable to be
      // restorable.
      li.appendChild(el("span", { class: "fa-discarded-item-name" },
                        todo ? todo.summary : id));
      var b = el("button", { type: "button", class: "fa-discarded-restore",
                             "aria-label": "Restore " + (todo ? todo.summary : id) +
                                           " to the todo board" }, "Restore");
      b.addEventListener("click", function () {
        restoreTodo(id);
        li.parentNode.removeChild(li);
      });
      li.appendChild(b);
      ul.appendChild(li);
    });
    wrap.appendChild(ul);
    return wrap;
  }

  /** The list, and the detail it swaps to. */
  function buildDiscardedView(state) {
    var wrap = el("div", { class: "fa-discarded fa-tile-content" });

    if (state.error) {
      wrap.appendChild(el("p", { class: "fa-discarded-error" },
        "The discarded-items document could not be read (" + state.error + "). " +
        "This is not the same as there being nothing discarded."));
      // The locally discarded stickies are a SEPARATE fact and are still
      // known: they live in this browser, not in the document that failed.
      wrap.appendChild(buildDiscardedTodos());
      return wrap;
    }
    var nodes = state.nodes || [];
    if (nodes.length === 0) {
      wrap.appendChild(el("p", { class: "fa-discarded-none" },
        "Nothing has been discarded in the repository. Items moved here instead of being deleted would appear in this list."));
      wrap.appendChild(buildDiscardedTodos());
      return wrap;
    }

    var list = el("ul", { class: "fa-discarded-list" });
    var detail = el("div", { hidden: "hidden" });
    wrap.appendChild(buildDiscardedTodos());

    function showList() {
      detail.setAttribute("hidden", "hidden");
      detail.innerHTML = "";
      list.removeAttribute("hidden");
      var first = list.querySelector("button");
      if (first) first.focus();
    }

    nodes.forEach(function (node) {
      var li = el("li");
      var b = el("button", { type: "button", class: "fa-discarded-item" });
      b.appendChild(el("span", { class: "fa-discarded-item-name" },
                       String(node.name || node.sourcePath || "Untitled")));
      if (node.nodeKind) {
        b.appendChild(el("span", { class: "fa-discarded-item-kind" }, String(node.nodeKind)));
      }
      b.addEventListener("click", function () {
        list.setAttribute("hidden", "hidden");
        detail.innerHTML = "";
        detail.appendChild(buildDiscardedDetail(node, showList));
        detail.removeAttribute("hidden");
        // Focus the heading, not the top of the pane: the reader chose this
        // item and the first thing they should be told is which one opened.
        var h = detail.querySelector(".fa-discarded-title");
        if (h) h.focus();
      });
      li.appendChild(b);
      list.appendChild(li);
    });

    wrap.appendChild(list);
    wrap.appendChild(detail);
    return wrap;
  }


  /* ── The kind fan (bean `4kj4`) ────────────────────────────────────────
   *
   * Owner, 2026-09-19: *"each content type should have an avatar in and out
   * of trash"*, *"if more than one kind then it fades through the avatars in
   * a loop"*, *"openning fan is panel. shows the DECLared kinds for that
   * instance, not inheritance"*, and — asked which of fan / autoplay-fade /
   * hover-fade they wanted — **all three**.
   *
   * ## The three layer rather than conflict, and that is what makes it legal
   *
   *   the fan        every kind visible AT ONCE — the base presentation
   *   the cycle      an emphasis moving through them, with a pause control
   *   hover / focus  drives the same emphasis, user-initiated
   *
   * **Nothing is conveyed by the motion.** The fan is already complete when
   * it is still: every avatar is present, and the accessible name lists
   * every kind in one string. The cycle only moves a highlight over a
   * display a reader can already read.
   *
   * That is what makes an autoplaying loop defensible here at all. WCAG
   * 2.2.2 requires motion over five seconds to be pausable — hence the
   * button — but the deeper requirement is that a reader who never sees the
   * animation loses nothing, and a cycling BADGE (one slot, swapping) would
   * have failed that no matter how many pause controls it carried.
   *
   * ## `prefers-reduced-motion` is checked in BOTH places
   *
   * The CSS suppresses the transition and the script never starts the timer.
   * Either alone is a bug: CSS-only leaves a timer mutating the DOM for no
   * visible reason, script-only leaves the transition running on whatever
   * the script does change. The media query is also LIVE — a reader who
   * turns the setting on mid-session has the loop stop, rather than having
   * to reload.
   */

  var KIND_CYCLE_MS = 2200;

  /** The kinds this instance declares, or [] when the page did not say. */
  function declaredKinds() {
    var node = document.getElementById("fa-declared-kinds");
    if (!node) return [];
    try {
      var parsed = JSON.parse(node.textContent || "[]");
      return Array.isArray(parsed) ? parsed.filter(function (k) { return typeof k === "string"; }) : [];
    } catch (_e) {
      console.warn("docs-ui: #fa-declared-kinds is not valid JSON; the kind fan was not mounted.");
      return [];
    }
  }

  function prefersReducedMotion() {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (_e) {
      // No matchMedia is not "the reader wants motion". Unknown resolves to
      // the safe answer, which is the same third-state rule as everywhere.
      return true;
    }
  }

  /**
   * One avatar. `trash` gives the discarded treatment.
   *
   * `aria-hidden` on every tile: the NAME is on the group, listing every
   * kind in one string. Sixteen focusable images would be sixteen stops for
   * a screen-reader user to walk through to learn one fact.
   */
  function avatarTile(kind, trash) {
    var a = el("span", { class: "fa-avatar", "data-fa-kind": kind, "aria-hidden": "true" });
    if (trash) a.setAttribute("data-fa-trash", "true");
    return a;
  }

  /**
   * The fan: every declared kind, with a cycling emphasis and a pause.
   *
   * Returns null when there is nothing to show — a caller must not mount an
   * empty control, and an instance that declares no kinds is a real state
   * rather than an error.
   */
  function buildKindFan(kinds, opts) {
    var list = (kinds || []).filter(Boolean);
    if (list.length === 0) return null;
    // Returns { fan, pause } rather than one element, and the caller places
    // them. The pause CANNOT live inside the fan when the fan is the face of
    // a button: a <button> inside a <button> is invalid, the parser closes
    // the outer one, and the whole control is destroyed at parse time. A
    // spec caught exactly that — after clicking pause, `.fa-kind-fan` was
    // "element(s) not found", because it had never survived parsing.
    //
    // It is also an accessibility fault in its own right: nested interactive
    // controls have no sane keyboard order and no agreed name computation.
    var trash = Boolean(opts && opts.trash);

    var wrap = el("div", {
      class: "fa-kind-fan",
      role: "img",
      // EVERY kind, in one string. The cycle conveys nothing a reader with
      // no sight of it would miss, because the name already said all of it.
      "aria-label":
        (trash ? "Discarded kinds: " : "Kinds this instance declares: ") + list.join(", "),
    });

    var strip = el("span", { class: "fa-kind-fan-strip" });
    list.forEach(function (kind) {
      var slot = el("span", { class: "fa-kind-fan-slot", "data-fa-kind-slot": kind });
      slot.appendChild(avatarTile(kind, trash));
      strip.appendChild(slot);
    });
    wrap.appendChild(strip);

    var slots = strip.querySelectorAll(".fa-kind-fan-slot");
    var at = 0;
    var timer = null;

    function paint(i) {
      for (var n = 0; n < slots.length; n++) {
        slots[n].setAttribute("data-fa-lit", n === i ? "true" : "false");
      }
    }

    function step() {
      at = (at + 1) % slots.length;
      paint(at);
    }

    function stop() {
      if (timer !== null) { clearInterval(timer); timer = null; }
      wrap.setAttribute("data-fa-cycling", "false");
    }

    function start() {
      // One kind has nothing to cycle THROUGH, and a "pause" on a still
      // image is a control that does nothing.
      if (slots.length < 2 || prefersReducedMotion() || timer !== null) return;
      timer = setInterval(step, KIND_CYCLE_MS);
      wrap.setAttribute("data-fa-cycling", "true");
    }

    paint(0);

    // ── The pause control — WCAG 2.2.2 ──────────────────────────────
    //
    // Only when the loop can actually run. A button that says "pause" beside
    // something already still is worse than no button: it tells a reader
    // there is motion they cannot see.
    var pause = null;
    if (slots.length > 1 && !prefersReducedMotion()) {
      pause = el("button", {
        type: "button",
        class: "fa-kind-fan-pause",
        "aria-label": "Pause the cycling highlight",
      }, "❙❙");
      pause.addEventListener("click", function () {
        if (timer === null) {
          start();
          pause.setAttribute("aria-label", "Pause the cycling highlight");
          pause.textContent = "❙❙";
        } else {
          stop();
          pause.setAttribute("aria-label", "Resume the cycling highlight");
          pause.textContent = "▶";
        }
      });
      start();
    }

    // ── Hover and focus drive it too ────────────────────────────────
    //
    // User-initiated, so it is outside 2.2.2 entirely — and it is why a
    // reader who paused gets the emphasis back on demand without unpausing.
    function nudge() {
      if (prefersReducedMotion()) return;
      step();
    }
    wrap.addEventListener("mouseenter", nudge);
    strip.addEventListener("focusin", nudge);

    // LIVE, not read once. A reader who turns reduced-motion on mid-session
    // should have the loop stop, not have to reload the page to be heard.
    try {
      var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      var onChange = function () {
        if (mq.matches) {
          stop();
          if (pause) pause.remove();
        }
      };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    } catch (_e) {
      // No matchMedia: `prefersReducedMotion` already returned true, so the
      // loop never started and there is nothing to tear down.
    }

    return { fan: wrap, pause: pause, stop: stop };
  }

  /**
   * The panel the fan opens: every declared kind, named.
   *
   * The fan says HOW MANY and gives them a face; this says WHICH, in words.
   * A reader who cannot tell a spanner from a shield at 24px — which is
   * most readers, most of the time — gets the answer here rather than by
   * hovering each one.
   *
   * It states DECLARED vs INHERITED in the panel itself, because the
   * distinction is the owner's and is invisible from the list: a reader
   * seeing twelve kinds has no way to know the effective set is larger
   * unless the panel says so.
   */
  function buildKindsPanel(kinds) {
    var wrap = el("div", { class: "fa-kinds-panel fa-tile-content" });
    wrap.appendChild(el("p", { class: "fa-kinds-note" },
      "What this instance declares in its own harness. A dependency's kinds " +
      "are inherited at resolve time and are deliberately not listed here."));

    var ul = el("ul", { class: "fa-kinds-list" });
    kinds.forEach(function (kind) {
      var li = el("li", { class: "fa-kinds-row" });
      li.appendChild(avatarTile(kind, false));
      li.appendChild(el("span", { class: "fa-kinds-name" }, kind));
      // The discarded treatment, beside the live one. The owner asked for
      // an avatar "in and out of trash", and the pair is only legible as a
      // pair — shown apart, nobody can tell muted from a different colour.
      var t = avatarTile(kind, true);
      t.classList.add("fa-kinds-trash");
      li.appendChild(t);
      ul.appendChild(li);
    });
    wrap.appendChild(ul);
    wrap.appendChild(el("p", { class: "fa-kinds-legend" },
      "Each kind is shown twice: as it appears normally, and as it appears " +
      "once discarded to the trashcan."));
    return wrap;
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

  /* ── The glyph a tile wears, by declared NAME ────────────────────────
   *
   * Every graph tile wore NET_GLYPH — the graph-as-a-thing-to-browse net —
   * because a tile had no way to say otherwise. `VisualisationSchema.icon`
   * gives it one, and this is the registry that name resolves against.
   *
   * A NAME rather than markup, and the reason is not style. `tileLink` assigns
   * its glyph with `innerHTML`, so a declaration carrying SVG would make
   * `<instance>.json` an HTML injection site — and a declaration is INHERITED,
   * reaching this instance from a dependency through `resolveSkillDirs`. The
   * markup would not even have to be authored by somebody with commit access
   * here. R17's rule, one surface along: allow-list, default-deny.
   *
   * `hasOwnProperty` and not `TILE_GLYPHS[name]`, because the name comes from
   * a declaration: `"constructor"` and `"toString"` are inherited properties
   * of every object literal, and a bare lookup would hand one of them to
   * `innerHTML`.
   *
   * An unknown name falls back rather than failing. The registry ships with
   * the site and the declaration is authored apart from it, so a folio may
   * name a glyph a slightly older platform has not got; a tile that vanished
   * over that would turn a cosmetic mismatch into a missing navigation entry.
   * The fallback is exactly what every tile rendered before this existed.
   */
  /*
   * TWO beans, not the four the owner's reference art has, and the count was
   * MEASURED rather than chosen. `.fa-tile svg` is `1.25rem` — 20px — so 20px
   * is the whole of this glyph's job. Five candidates were rendered at it:
   * three outlined beans crowd until the hilums merge into one grey mass;
   * three filled with an oval cut-out read as olives; a filled crescent
   * collapses to a speck. At two beans the shapes and their hilums stay
   * separate at 20px and the drawing still looks like the reference at 64.
   *
   * Which is the usual trade and worth naming: an icon is not a picture
   * shrunk, and fidelity to the source art at a size nobody views it at is
   * not fidelity to anything.
   */
  var BEANS_GLYPH =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
    '<g transform="translate(8.4,8.6) rotate(-32)">' +
    '<ellipse rx="5.6" ry="3.7"/><path d="M-1.9 0.7A2.3 2.3 0 0 1 1.9-0.4"/></g>' +
    '<g transform="translate(15.6,15.4) rotate(26)">' +
    '<ellipse rx="5.6" ry="3.7"/><path d="M-1.9 0.7A2.3 2.3 0 0 1 1.9-0.4"/></g>' +
    "</g></svg>";

  /*
   * A TRAY WITH SOMETHING DROPPING INTO IT — the intake queue, and
   * deliberately not a folder or a book. `uploads` and `library` are two
   * stages of one pipeline, so their tiles have to be told apart at a glance:
   * the library's is the corpus, this one is the inbox. Both tiles opened the
   * same page until 2026-09-21 and wore the same glyph, which is how a reader
   * came to think there was one thing under two names.
   *
   * Drawn for 20px like BEANS_GLYPH, for the reason recorded there: the arrow
   * is a single stroke and the tray a single closed path, because two nested
   * outlines merge into a grey block at the size this is actually rendered.
   */
  var UPLOADS_GLYPH =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<g fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M3.6 14.8v2.9a1.9 1.9 0 0 0 1.9 1.9h13a1.9 1.9 0 0 0 1.9-1.9v-2.9h-4.9' +
    'l-1.3 1.9h-3.4l-1.3-1.9z"/>' +
    '<path d="M12 3.6v7.7"/><path d="M8.7 8.1 12 11.4l3.3-3.3"/>' +
    "</g></svg>";

  var TILE_GLYPHS = { beans: BEANS_GLYPH, uploads: UPLOADS_GLYPH };

  function glyphFor(name) {
    if (typeof name !== "string") return NET_GLYPH;
    return Object.prototype.hasOwnProperty.call(TILE_GLYPHS, name)
      ? TILE_GLYPHS[name]
      : NET_GLYPH;
  }

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

    /* ── Two mini-icons, between the title and the launcher ──────────────
     *
     * Owner, 2026-09-21: *"can you put dark/light mode switch in mini-icon on
     * top as well as language icon. to right of folio-asst, to left of the
     * [3x3 checkboard]"* — the checkerboard being this launcher, confirmed in
     * the same exchange.
     *
     * ## This partly reverses `1le7`, deliberately and on the owner's word
     *
     * That bean collapsed FOUR header icons into one launcher because "that
     * navbar is getting crowded", and the comment on `tileButton` below still
     * refuses a dedicated search magnifier for exactly that reason. The two
     * are not in conflict and the difference is worth stating, because the
     * next reader will otherwise "fix" one of them:
     *
     *   - search was refused because it would save ONE PRESS on a control
     *     reached twice a session, and the owner answered "search is two";
     *   - these two were ASKED FOR by name.
     *
     * A row of three is not the row of six `1le7` was avoiding. If a fourth
     * is ever proposed, that is the point to go back and ask.
     *
     * ## Language OPENS the launcher rather than duplicating its view
     *
     * The button presses the same `showView("language")` the tile does, so
     * there is one language panel and one copy of its state. A second bar
     * built here would look identical and drift — the failure this file's
     * header calls out, and the reason the search field is MOVED rather than
     * rebuilt. The mini-button is a shortcut INTO the panel, not a second
     * panel.
     */
    host.appendChild(buildSchemeMini());

    var langMini = el("button", {
      type: "button",
      class: "fa-qr-toggle fa-lang-mini",
      "aria-label": "Language",
    });
    langMini.innerHTML = GLOBE_GLYPH;
    langMini.addEventListener("click", function () {
      // Open the launcher first: `showView` hides the grid and renders into
      // the panel, which is invisible while the host is closed, so a reader
      // pressing this on a closed launcher would otherwise get nothing and
      // conclude the button is dead.
      open(true);
      showView("language", "Language", langMini);
    });
    host.appendChild(langMini);

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

    /* ── The search field: in the top navbar, slidable to the corner ─────
     *
     * Owner, 2026-09-21: *"also i want the search restored back to the top
     * display navbar, with option to slide out to the UR corner as an icon."*
     *
     * ## THIS REVERSES THE 2026-09-19 DECISION, and the old one is recorded
     *
     * The previous version of this block adopted the theme's search OUT of
     * the main panel and into a Settings tile, on the owner's *"move the
     * search to a icon in navbar that expands.... keep main display panel
     * uncluttered."* The tile comment below went further and REFUSED a
     * header magnifier outright, citing an answer of "search is two" given on
     * 2026-09-19 when the trade was put to the owner.
     *
     * That refusal is now void, superseded by the line above. It is rewritten
     * rather than deleted, because an agent finding a comment that forbids
     * what the code does concludes the code is the mistake.
     *
     * What survives is the REASON behind the old answer — the main panel
     * should not be cluttered — and the slide-out is how both hold at once:
     * the field is in the navbar where it is reached, and a reader who wants
     * the space back sends it to the corner as an icon.
     *
     * ## Moved, never rebuilt — UNCHANGED, and still the load-bearing part
     *
     * The theme's own script binds to the input it rendered. A search box
     * reconstructed here would look identical and do nothing. So the theme's
     * `.search` container is MOVED, with its input, its label and its results
     * list intact, and every handler moves with it because handlers belong to
     * elements and not to positions.
     *
     * ## It must never leave the document — ALSO UNCHANGED
     *
     * just-the-docs looks its input up by id when it initialises, and
     * `getElementById` does not find a detached node. So the holder lives
     * inside `searchHome`, which is in the document from mount, and the two
     * states move `searchHome` between CSS classes rather than moving the
     * input out of the tree. Sliding to the corner is a class change and a
     * `hidden` on nothing — the node never leaves.
     *
     * ## Absent is a real state
     *
     * `search_enabled: false`, or a theme that renamed the container, means
     * there is nothing to adopt. Nothing is mounted, no corner icon is drawn,
     * and the warning says what was looked for.
     */
    var SEARCH_PLACE_KEY = "fa-search-place";

    /** "navbar" (default) or "corner". Anything unrecognised is the default —
     *  a stored value from an older build must not leave search nowhere. */
    function storedSearchPlace() {
      try {
        return window.localStorage.getItem(SEARCH_PLACE_KEY) === "corner" ? "corner" : "navbar";
      } catch (_e) { return "navbar"; }
    }

    var searchHolder = null;
    var searchHome = null;
    var adopted = firstMatch(SEARCH_SELECTORS);
    if (adopted) {
      searchHolder = el("div", { class: "fa-search-holder" });
      searchHolder.appendChild(adopted);

      searchHome = el("div", { class: "fa-search-home", "data-place": "navbar", "data-open": "true" });

      /* The corner's collapsed face. Only ever visible in the corner state,
       * where the field itself is hidden — so it is the ONE control that can
       * bring search back, which is `l4zi`'s rule: an action whose inverse is
       * not reachable is not a toggle, it is a delete. */
      var cornerIcon = el("button", {
        type: "button",
        class: "fa-search-peek",
        "aria-label": "Open search",
        "aria-expanded": "false",
      });
      cornerIcon.innerHTML = SEARCH_GLYPH;

      /* The slide control, beside the field. Chevron, not an ✕: closing search
       * is not dismissing it, and an ✕ promises removal. */
      var slide = el("button", { type: "button", class: "fa-search-slide" });

      function paintSearchPlace(place) {
        var corner = place === "corner";
        searchHome.setAttribute("data-place", place);
        // In the navbar the field is always shown. In the corner it starts
        // collapsed behind the icon — that IS the point of sending it there.
        searchHome.setAttribute("data-open", corner ? "false" : "true");
        cornerIcon.setAttribute("aria-expanded", "false");
        slide.setAttribute("aria-label",
          corner ? "Dock search back into the navbar" : "Slide search out to the corner");
        slide.setAttribute("title", slide.getAttribute("aria-label"));
        slide.textContent = corner ? "⌄" : "⌃";
      }

      slide.addEventListener("click", function () {
        var next = searchHome.getAttribute("data-place") === "corner" ? "navbar" : "corner";
        try { window.localStorage.setItem(SEARCH_PLACE_KEY, next); } catch (_e) { /* private mode */ }
        paintSearchPlace(next);
        // Focus follows the control that replaced the thing that moved, or a
        // keyboard reader is left on a node that is now display:none.
        if (next === "corner") cornerIcon.focus();
        else { var i = searchHolder.querySelector("input"); if (i) i.focus(); }
      });

      cornerIcon.addEventListener("click", function () { revealSearch(); });

      searchHome.appendChild(cornerIcon);
      searchHome.appendChild(searchHolder);
      searchHome.appendChild(slide);

      /* WHERE THE NAVBAR IS. `.main-header` is where just-the-docs renders
       * search itself, so putting it back there is putting it back. The
       * fallbacks exist because a theme that renamed the container may also
       * have renamed the header, and search in the wrong place beats search
       * nowhere. */
      var navbar = firstMatch([".main-header", "#main-header", ".main-content-wrap"]);
      if (navbar) navbar.insertBefore(searchHome, navbar.firstChild);
      else {
        var mainEl = firstMatch(["#main-content", ".main-content", "main"]);
        if (mainEl && mainEl.parentNode) mainEl.parentNode.insertBefore(searchHome, mainEl);
        else document.body.appendChild(searchHome);
      }

      paintSearchPlace(storedSearchPlace());
    } else {
      console.warn("docs-ui: no site search found (tried " + SEARCH_SELECTORS.join(", ") +
                   "); search was not mounted in the navbar and no corner icon was drawn.");
    }

    /**
     * Show search wherever it currently lives, and put the cursor in it.
     *
     * The one entry point for "I want to search": the corner icon presses it,
     * and so does the Search tile. Neither MOVES the field, because two
     * places search can be is two places a reader has to look for it.
     */
    function revealSearch() {
      if (!searchHome) return;
      searchHome.setAttribute("data-open", "true");
      if (searchHome.getAttribute("data-place") === "corner") {
        var peek = searchHome.querySelector(".fa-search-peek");
        if (peek) peek.setAttribute("aria-expanded", "true");
      }
      var input = searchHolder && searchHolder.querySelector("input");
      if (input) input.focus();
    }

    /**
     * Formerly: return the search field to its always-in-document holder.
     *
     * The field no longer travels into the tiles panel, so in the normal case
     * there is nothing to undo. It is KEPT as a safeguard rather than deleted
     * because `showGrid` wipes the view with `innerHTML = ""`, and that
     * DETACHES whatever is inside — if any future view ever borrows the
     * holder again, the wipe would silently kill search, which is the exact
     * failure the long comment above exists about. A no-op guard is cheap;
     * rediscovering that bug is not.
     */
    function parkSearch() {
      if (searchHolder && searchHome && searchHolder.parentNode !== searchHome) {
        searchHome.insertBefore(searchHolder, searchHome.lastChild);
      }
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

      // The discarded-items control — UNDER SETTINGS, per the owner, which is
      // also why the 64 KB document is fetched here and not on page load.
      //
      // A placeholder goes in immediately and is replaced when the fetch
      // settles. A control that appeared later would move the rows under a
      // reader's cursor; one that showed a count of nothing and then changed
      // is the flicker the todo tile's comment already records.
      var discardedSlot = el("div", { class: "fa-discarded-slot" },
                             "Checking for discarded items\u2026");
      settings.appendChild(discardedSlot);

      // REBUILT whenever a sticky is discarded or restored, not once.
      //
      // `buildViews` runs when the LAUNCHER opens and caches forever, so a
      // reader who opens the launcher, discards a sticky and then opens
      // Settings would find the control absent — with no way back until
      // they reloaded the page. That is the one-way delete this whole
      // feature exists not to be, arriving through a cache. Found by a spec
      // that happened to open the launcher before discarding, which is also
      // the order a person uses.
      function paintDiscarded() {
        fetchDiscarded(renderDiscardedSlot);
      }
      document.addEventListener("fa:todos-discarded", paintDiscarded);

      function renderDiscardedSlot(state) {
        discardedSlot.innerHTML = "";
        // Re-attached because a previous pass may have removed it.
        if (!discardedSlot.parentNode) settings.appendChild(discardedSlot);
        var localCount = discardedTodoIds().length;
        if (state.absent) {
          // This build published no document. Not an error and not an empty
          // trashcan — there is nothing to report a count ABOUT.
          //
          // But a sticky this reader discarded is a fact that does not
          // depend on the document, and it has to stay reachable: `fsh-guts`
          // is the trashcan that is KEPT, so a discard with no way back is
          // a delete wearing a crumpled icon. Caught by a spec, in a harness
          // that published no document — which is also every folio that has
          // not deployed one yet.
          if (localCount === 0) {
            discardedSlot.remove();
            return;
          }
          state = { nodes: [] };
        }
        if (state.error) {
          // NOT hidden, and this is the case the todo tile's "count === 0 is
          // not a tile" rule would have got wrong: a failed fetch and an
          // empty trashcan are opposite facts.
          discardedSlot.appendChild(el("p", { class: "fa-discarded-error" },
            "Discarded items could not be read (" + state.error + ")."));
          return;
        }
        // BOTH sources. A badge counting only the published nodes would
        // read 0 on a site with no trashcan while the reader has three
        // stickies in it.
        var n = (state.nodes || []).length + localCount;
        var label = n === 1 ? "1 item" : n + " items";
        var btn = el("button", {
          type: "button",
          class: "fa-tile fa-discarded-open",
          // The accessible name says WHAT it is and HOW MANY. "Dead fish" is
          // the icon, not the name — a screen-reader user is told what the
          // control does, and the count is in the name rather than conveyed
          // by the badge alone.
          "aria-label": "Discarded items \u2014 " + label,
        });
        btn.innerHTML = FISH_GLYPH;
        btn.appendChild(el("span", { class: "fa-tile-caption" }, "Discarded"));
        btn.appendChild(el("span", { class: "fa-tile-count" }, String(n)));
        btn.addEventListener("click", function () {
          // Rebuilt per open, so a restore made in this view is reflected
          // the next time it is opened without a reload.
          views.discarded = buildDiscardedView(state);
          showView("discarded", "Discarded items", btn);
        });
        discardedSlot.appendChild(btn);
      }

      paintDiscarded();

      // ── The kind fan, and the panel it opens ──────────────────────
      //
      // Owner: *"openning fan is panel."* The fan is the CLOSED state and
      // the panel is the open one — not a tooltip, and not a badge that
      // cycles in place. So the fan is the face of a button, and pressing
      // it shows the same kinds listed with their names.
      //
      // Under Settings for the same reason the discarded control is: it is
      // something a reader consults once, not a thing they act on.
      var kinds = declaredKinds();
      if (kinds.length) {
        var fanBtn = el("button", {
          type: "button",
          class: "fa-kind-fan-open",
          // Names the COUNT and the fact, not the picture. A fan of glyphs
          // is meaningless to a screen reader; the panel behind it is not.
          "aria-label":
            "What this instance declares \u2014 " +
            (kinds.length === 1 ? "1 kind" : kinds.length + " kinds"),
        });
        // NOT `built` — that is `buildViews`'s memoisation flag, and a `var`
        // of the same name inside this function hoists over it, so
        // `if (built) return` would read `undefined` and rebuild every view
        // on every launcher open. eslint caught it by reporting the OUTER
        // one as unused, which is a subtler symptom than the cause.
        var fanParts = buildKindFan(kinds);
        if (fanParts) fanBtn.appendChild(fanParts.fan);
        fanBtn.appendChild(el("span", { class: "fa-tile-caption" }, "Declared kinds"));
        fanBtn.addEventListener("click", function () {
          views.kinds = buildKindsPanel(kinds);
          showView("kinds", "Declared kinds", fanBtn);
        });

        // A ROW, because the pause control must sit BESIDE the button and
        // not inside it — see `buildKindFan`. Two siblings, one subject.
        var row = el("div", { class: "fa-kind-fan-row" });
        row.appendChild(fanBtn);
        if (fanParts && fanParts.pause) row.appendChild(fanParts.pause);
        settings.appendChild(row);
      }

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
      // No `search` branch any more: search lives in the navbar and the tile
      // REVEALS it there rather than dragging it into the sidebar. A field
      // that moves to wherever you summoned it from is a field with no home.
      view.appendChild(views[key]);
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
      heading.focus();
    }

    /* ── The grid ──────────────────────────────────────────────────────── */

    function tileButton(glyph, label, key) {
      var b = el("button", { type: "button", class: "fa-tile", "aria-label": label });
      b.innerHTML = glyph;
      b.appendChild(el("span", { class: "fa-tile-caption" }, label));
      b.addEventListener("click", function () { showView(key, label, b); });
      return b;
    }


    /* Search leads the grid, and the tile now REVEALS rather than moves.
     *
     * ## The comment that stood here refused what now ships
     *
     * It read, in part: *"the obvious 'improvement' is a second, dedicated
     * magnifier in the header row: one press instead of two. Do not make
     * it."* — citing the row's 3.75rem cap, bean `1le7`, and an answer of
     * "search is two" given by the owner on 2026-09-19.
     *
     * The owner reversed it on 2026-09-21: *"i want the search restored back
     * to the top display navbar, with option to slide out to the UR corner as
     * an icon."* Quoted rather than deleted, because the next agent to read a
     * prohibition the code plainly violates will assume the CODE is wrong and
     * revert working behaviour to satisfy a dead instruction.
     *
     * ## And the reversal did not cost the row
     *
     * Worth noting, because it is why the old objection does not simply
     * reapply in a new form: search did NOT come back as a fourth icon in the
     * capped sidebar header. It went to the MAIN DISPLAY navbar, which is
     * where just-the-docs renders it and which has the width. The sidebar row
     * is the mark, the scheme bulb, the globe and the launcher — three icons
     * beside the title, which is what `1le7` costed.
     *
     * ## Why this is an action and not a view
     *
     * The tile used to drag the live field into the sidebar panel. With
     * search visible in the navbar that is strictly worse: the same field
     * would be in two places depending on how you got to it, and a reader who
     * closed the panel would find search had moved. So the tile calls
     * `revealSearch`, which un-collapses the field where it lives and focuses
     * it. One search box, one home, two ways to reach it.
     */
    if (searchHolder) {
      grid.appendChild(tileAction(SEARCH_GLYPH, "Search", revealSearch));
    }
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

    // The declared visualisations. `mountGraphTiles` is module-level so the
    // board mounts the SAME tiles from the same array — Q11, one declaration
    // and per-surface visibility.
    mountGraphTiles("navbar", grid, readerShownTiles());

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

  var todoState = { items: [], floating: {}, floatGeom: {}, processes: {}, themeArt: {} };

  /* ═══ Semantic zoom and windows — TWO mechanisms, kept apart ═══════════
   *
   * |                   | trigger                                   | who       |
   * |-------------------|-------------------------------------------|-----------|
   * | **semantic zoom** | the card's RENDERED width crosses a number | automatic |
   * | **open / close**  | opening a card, or `[x]`                   | a person  |
   *
   * The owner, 2026-09-20: *"start everyrting in avatar"*, `[x]` closes to the
   * avatar, and on which mechanism wins —
   *
   *   open is like window, avatar/tiles project open panels onto window. sum
   *   functionality, need to handle z-order.. selecting any part raises
   *
   * **An open card is a WINDOW, not a zoom state.** It is projected ON TO the
   * board rather than being the card grown large, which is why the zoom code
   * below never asks what is open and the window code never asks how wide
   * anything is. A flag joining them would be the conflation made permanent —
   * and it is also what makes "an open window survives a zoom-out" true by
   * construction rather than by a special case.
   *
   * ## THE THRESHOLD IS DECLARED DATA, and its absence is a third state
   *
   * R2: *"the threshold SHALL be declared data, not a literal in the
   * renderer."* `gen-docs-pages.ts` publishes the folio's
   * `semantic-zoom.json` — and publishes NOTHING when the folio has not
   * declared one. So `zoomState.zoom === null` means *could not determine*,
   * and this file must never turn that into a number: with no declaration
   * every card keeps its words, and the console says why once.
   *
   * ## This mirrors `schemas/window-stack.ts`, and that is a real cost
   *
   * The model is specified and unit-tested there; this is a browser script and
   * cannot import it. Two implementations of one rule can drift, so the
   * mitigation is named rather than hoped for: `test/board-windows.e2e.ts`
   * mirrors `window-stack.test.ts` case for case, against the real file.
   */
  var zoomState = { zoom: null, asked: false };

  /* ═══ Panel chrome — the kind declares, the platform fixes ════════════
   *
   * Owner: *"each content type controls its own avatar, visualtion/rendering.
   * but assume they can open a full screen panel w/ fixed controls like [x] or
   * [linksrc] or [edit] or what not depedning on conent."*
   *
   * CRDM Q7 settled the line: `[x]` is in the same place with the same
   * behaviour on every panel, so a reader learns the frame once; everything
   * else is the kind's to offer.
   *
   * THREE STATES, and collapsing any two loses a fact: not declared (this kind
   * does not offer it), declared and servable (the control), declared and
   * unservable (no control, AND a reason). The third is the one that gets
   * lost, and `pb04` is the case already paid for — an `[edit]` the pipeline
   * cannot perform 404s for exactly the reader who cannot edit, which reads as
   * "this page is broken" rather than "you cannot do this".
   *
   * Mirrors `schemas/panel-chrome.ts`, which this file cannot import. Same
   * cost, same mitigation as `window-stack.ts`: the e2e asserts the browser's
   * answer against the model's, case for case.
   */
  var FIXED_CONTROLS = ["close"];
  var PANEL_CONTROLS = {
    close: { id: "close", label: "Close", needs: "none" },
    view: { id: "view", label: "View source", needs: "source-read" },
    edit: { id: "edit", label: "Edit", needs: "source-write" },
    pin: { id: "pin", label: "Pin to the page", needs: "none" },
    discard: { id: "discard", label: "Discard", needs: "none" },
    move: { id: "move", label: "Move or resize", needs: "none" },
    relocate: { id: "relocate", label: "Send to the trashcan", needs: "none" },
  };
  var KIND_CONTROLS = {
    todo: ["view", "edit", "move", "pin", "discard", "relocate"],
    bean: ["view"],
  };

  /** The frame first and always, then what the kind declared. Unknowns dropped. */
  function controlsFor(kind) {
    var declared = (KIND_CONTROLS[kind] || []).filter(function (id) {
      return (
        Object.prototype.hasOwnProperty.call(PANEL_CONTROLS, id) &&
        FIXED_CONTROLS.indexOf(id) === -1
      );
    });
    return FIXED_CONTROLS.concat(declared).map(function (id) { return PANEL_CONTROLS[id]; });
  }

  /**
   * The badge for the CONTENT NODE a card is about, or null.
   *
   * R7: *a node rendered as its avatar carries the same badge, from the same
   * query as R6.* One function, called once per card, whose answer both the
   * avatar and the open window render — so the two surfaces cannot disagree
   * for the same reason the badge and its panel cannot (`1rta`).
   *
   * `null` when the card is about no node: a board card with no `targetLabel`
   * annotates nothing, and a badge of nothing is not a zero, it is absent.
   */
  function nodeBadge(todo) {
    var label = todo.targetLabel;
    if (!label) return null;
    var count = 0;
    for (var i = 0; i < todoState.items.length; i++) {
      if (todoState.items[i].targetLabel === label) count++;
    }
    // R5's threshold, and the same split: the chip takes `showCount`, the
    // accessible name takes the exact `count`.
    return { count: count, showCount: count > 1, label: label };
  }

  /** One badge, rendered the same way wherever it rides. */
  function badgeChip(badge, where) {
    var chip = el("span", {
      class: "fa-node-badge fa-node-badge--" + where,
      "data-fa-notes": String(badge.count),
      "aria-label":
        badge.count + (badge.count === 1 ? " note" : " notes") + " on this section",
    });
    if (badge.showCount) {
      chip.appendChild(el("span", { class: "fa-node-badge-count" }, String(badge.count)));
    }
    return chip;
  }

  /* ═══ The READER's filter, which commits nothing ══════════════════════
   *
   * Owner: *"be able to filter out by kind properties things on miror board"*.
   *
   * TWO FILTERS, AND THEY MUST NOT BECOME ONE FIELD. A board carries a
   * DECLARED filter (`schemas/board.ts`) that says what the board IS, and it
   * lives in `boards/<id>.json` where everyone opening that board gets it.
   * This is the other one: a reader narrowing their own view, at view time.
   * Conflating them would make one reader's temporary view edit the board
   * everyone else opens — which is what happens the moment a filter control
   * writes to the file the other filter lives in.
   *
   * So this writes NOTHING: no file, no `localStorage`, no event anybody
   * persists. It is session state, like the window stack, and the absence is
   * the design rather than an omission.
   *
   * Mirrors `schemas/reader-filter.ts`, which this file cannot import — same
   * cost and same mitigation as its siblings: the e2e checks the browser's
   * answer against the model's.
   */
  var readerFilter = { properties: {} };

  /**
   * Tiles this READER has flipped from their declared default.
   *
   * Q9: *declared default, reader may override.* The folio says which tiles
   * start out of frame; this is the other half, and it is session state — no
   * file, no `localStorage`, nothing anybody else opens. A reader's view of
   * the navbar is not a change to the navbar, which is the same separation
   * `reader-filter.ts` holds between a reader's filter and a board's.
   */
  var readerTileOverrides = [];
  function readerShownTiles() { return readerTileOverrides; }

  /**
   * `1le7`'s tile, as a link. MODULE-LEVEL so both surfaces share one template.
   *
   * It was nested inside the action launcher until the board needed it too,
   * and the bean is explicit about the alternative: *"the tile template is
   * `1le7`'s, extended if it needs to be, never duplicated."* A second copy
   * would be two tiles that look alike until one of them is changed.
   */
  function tileLink(glyph, label, href, hint) {
    // Every tile's href goes through the same check as every other link on
    // this page. A tile is the one place a declared value reaches an `href`
    // with no composition in between, so it is the one most worth checking.
    var a = el("a", {
      class: "fa-tile",
      href: safeHref(href),
      "aria-label": label + " — " + hint,
    });
    a.innerHTML = glyph;
    a.appendChild(el("span", { class: "fa-tile-caption" }, label));
    return a;
  }

  /* ── Where a declared, site-root path is composed ────────────────────
   *
   * `graph-tiles.ts` stores a tile's href relative to the SITE ROOT — `/beans/`
   * — which is right, and is what `harness.links[].path` stores as well. Every
   * other consumer of such a path hands it to Liquid's `relative_url`, which
   * prepends `site.baseurl`. A tile cannot: it is composed here, after Liquid
   * has finished, from JSON on a `<meta>`.
   *
   * SO IT HAS TO BE DONE HERE, AND IT WAS NOT — issue #801. This site serves
   * from `/folio-assistant`, so an unprefixed `/beans/` resolves against the
   * ORIGIN and every one of the twelve tiles 404ed. The rule was already
   * written down 800 lines above, on the action tiles: *"an absolute `/kg/`
   * is a 404 rather than a wrong-looking link"*. Two tile families, one rule,
   * and only one of them was following it.
   *
   * NOT applied inside `tileLink`, which both families share. The action tiles
   * are handed `#fa-site-links` values that Liquid ALREADY composed, so
   * prefixing there would double the base and break the family that works.
   * The base belongs where the raw declared value enters, which is here.
   *
   * An ABSENT meta falls back to `baseurlFromTodoSrc`, and then to `""`. The
   * empty answer is the previous behaviour and is deliberate: a site with no
   * baseurl is the common case (the e2e fixtures, a local `jekyll serve`),
   * and it is indistinguishable from a declared empty one — `site.baseurl`
   * renders as the empty string for both. There is nothing here to report as
   * a finding.
   *
   * ## ONE function, because there were briefly two
   *
   * A second `siteBaseurl` was defined ~500 lines below this one, deriving
   * the prefix from `meta[name="fa-todo-src"]` for the sticky art. Same name,
   * same IIFE scope — so the later declaration silently replaced this one,
   * and `withBase` began asking a meta that the graph-tile fixtures do not
   * carry. Every tile lost its base, which is issue #801 coming straight back
   * on a merge that touched neither feature.
   *
   * The two were never different questions. `fa-baseurl` is the DECLARED
   * answer, written by Liquid from `site.baseurl`; the todo-src derivation is
   * a RECONSTRUCTION for a page that has the one meta and not the other. So
   * the declared value wins and the derivation is the fallback, which is the
   * only order that cannot make a page contradict its own server.
   */
  function siteBaseurl() {
    var meta = document.querySelector('meta[name="fa-baseurl"]');
    var v = (meta && meta.getAttribute("content")) || "";
    return v ? v.replace(/\/+$/, "") : baseurlFromTodoSrc();
  }

  /* ── Is this a STAGING preview? ──────────────────────────────────────
   *
   * Non-empty `fa-staging` means a `STAGING/<slug>/` preview; empty means the
   * canonical deploy, a local build, or a page whose `_data/build.yml` was
   * never written. All three of those are treated as canonical, which is the
   * SAFE direction: a build that cannot say it is a preview hides the tile
   * rather than advertising a page that may not be deployed.
   *
   * That matches `compose-docs.ts`, which withholds a staging-only page unless
   * positively told `--staging`. One direction in both places, so the page and
   * its tile cannot end up disagreeing about which deploy they are on — and if
   * they ever did, the failure would be a tile linking to a 404, which is the
   * thing this exists to prevent.
   */
  function isStagingPreview() {
    var meta = document.querySelector('meta[name="fa-staging"]');
    return !!(meta && (meta.getAttribute("content") || "").trim());
  }

  /**
   * A site-root path, composed against this deploy's base.
   *
   * Only a path that starts with `/` is composed. Anything else is already
   * relative to the page, or is not ours, and prefixing it would invent a URL.
   * No guard against a base that is already present: a tile whose declared
   * path genuinely begins with the base's spelling is a directory somebody
   * named that way, and skipping it would be this bug with the sign flipped.
   */
  function withBase(href) {
    if (typeof href !== "string" || href.charAt(0) !== "/") return href;
    return siteBaseurl() + href;
  }

    /* ── The DECLARED visualisations, one tile each ──────────────────────
   *
   * Owner: *"if harness declares visaluzers, those should have tile"*, and
   * *"those should open their exisiting visualzaiton"*.
   *
   * Read from `_data/harness.json`, which `graph-tiles.ts` derives from the
   * `coverage.visualiser` obligation every instance already carries and
   * `check:subgraph-coverage` already audits. **There is no second list**: a
   * registry of "things that get tiles" would be free to disagree with the
   * audited one, and a tile missing because nobody added it there would look
   * exactly like a graph nobody declared.
   *
   * `1le7`'s `tileLink` — the template is not duplicated, and a tile with no
   * published href is not rendered as a link to nowhere (`pb04`).
   */
  function mountGraphTiles(surface, into, hiddenIds) {
    var meta = document.querySelector('meta[name="fa-tiles"]');
    var raw = meta && meta.getAttribute("content");
    if (!raw) return 0;
    var tiles;
    try { tiles = JSON.parse(raw); } catch (_e) { return 0; }
    var shown = 0;
    for (var i = 0; i < tiles.length; i++) {
      var t = tiles[i];
      if (!t.href) continue;                                   // pb04
      if ((t.surfaces || []).indexOf(surface) === -1) continue;
      // DECLARED default, then this READER's override. The reader's half is
      // theirs alone and is committed nowhere — `reader-filter.ts`'s rule on
      // another surface.
      if (t.hidden && hiddenIds.indexOf(t.id) === -1) continue;
      if (!t.hidden && hiddenIds.indexOf(t.id) !== -1) continue;
      // A tile whose PAGE is withheld from this deploy is not rendered at all.
      // Distinct from `hidden` above, which is a reader's own preference about
      // a page that exists: this one is about whether the page is there.
      // Conflating them would let "show hidden" resurrect a link to a 404.
      if (t.publish === "staging-only" && !isStagingPreview()) continue;
      var tile = tileLink(glyphFor(t.icon), t.title, withBase(t.href),
                          "the declared visualisation of " + t.directory);
      tile.setAttribute("data-fa-tile", t.id);
      tile.setAttribute("data-fa-surface", surface);
      if (t.theme) tile.setAttribute("data-fa-theme", t.theme);
      into.appendChild(tile);
      shown++;
    }
    return shown;
  }


  /* ═══ Which URL schemes may reach an `href` ══════════════════════════
   *
   * R17, the owner: *"skill tool hints for XSSrsiction"*. `schemas/safe-url.ts`
   * carries the argument; this is its mirror, and the rule is one line long:
   * **default-deny**. A blocklist has to enumerate every dangerous scheme and
   * is wrong the day a browser ships a new one; an allow-list is wrong only
   * about things it refuses, and a refusal is visible.
   *
   * TAB / LF / CR are removed EVERYWHERE before deciding, because the URL
   * parser removes exactly those three before parsing — so `java<TAB>script:`
   * is `javascript:` to the browser and a relative path to a naive test. That
   * is the classic bypass and the TypeScript version shipped it for one
   * commit.
   *
   * Same drift cost as every other mirror in this file, same mitigation: the
   * e2e checks this answer against the model's, case for case.
   */
  var ALLOWED_URL_SCHEMES = ["http:", "https:", "mailto:", "tel:"];

  function safeHref(url) {
    if (url === undefined || url === null) return undefined;
    var stripped = String(url).replace(/[\u0009\u000A\u000D]/g, "");
    var trimmed = stripped.replace(/^[\u0000- ]+/, "").replace(/[\u0000- ]+$/, "");
    if (trimmed === "") return undefined;
    // `//host/path` is absolute and looks like a path — excluded deliberately.
    if (trimmed.indexOf("//") === 0) return undefined;
    if (/^[#?./]/.test(trimmed) || !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return trimmed;
    var scheme = trimmed.slice(0, trimmed.indexOf(":") + 1).toLowerCase();
    return ALLOWED_URL_SCHEMES.indexOf(scheme) === -1 ? undefined : trimmed;
  }

  /** OR within a property's values, AND across properties — the board's logic. */
  function readerShows(filter, todo) {
    var props = filter.properties || {};
    for (var name in props) {
      if (!Object.prototype.hasOwnProperty.call(props, name)) continue;
      var values = props[name];
      if (!values || values.length === 0) continue;
      // A node that cannot answer has not answered YES.
      if (values.indexOf(todo[name]) === -1) return false;
    }
    return true;
  }

  /** Every value present in the corpus for one property, sorted. */
  function propertyValues(items, name) {
    var seen = {};
    for (var i = 0; i < items.length; i++) {
      var v = items[i][name];
      if (v !== undefined && v !== null && v !== "") seen[v] = true;
    }
    return Object.keys(seen).sort();
  }

  /* ═══ Move and resize — keyboard FIRST, drag as the accelerator ═══════
   *
   * Owner: *"can resize open content, move around. drag and drop moving.."*
   * and, on the floor every board control sits on, *"ALWAYS collapsable to
   * linearly rendablee"*.
   *
   * **Drag is the accelerator, never the only way in.** This instance's
   * declared interaction profile is low-dexterity — it is why the Pin control
   * is a button rather than a drag — and a board whose only affordance is drag
   * excludes its own owner. So the keyboard path is built first and the
   * pointer path is added over it, rather than the other way round where the
   * keyboard half is the thing that never gets finished.
   *
   * ## A MODE, because arrows already mean something
   *
   * Arrow keys scroll. A window that moved whenever a reader pressed one while
   * reading it would have stolen the page's own navigation, so moving is a
   * mode: the `move` control turns it on, the window says so, arrows move,
   * `Shift`+arrows resize, and `Escape` or `Enter` leaves. The mode is
   * announced rather than merely styled — a reader who cannot see the outline
   * has to be told what their arrow keys now do.
   *
   * ## SESSION-ONLY, like the stack above it
   *
   * `schemas/board-positions.ts` is where a move becomes durable, and
   * `moveBy` is the function that does it — for a tool or an agent, against
   * the repository. A published page cannot write that file, and the lesson
   * `db7g` settled applies unchanged: it is better to be a control over this
   * reader's view and say so than to look like it changed the folio.
   */
  var MOVE_STEP = 16;
  var RESIZE_STEP = 24;
  var MIN_WINDOW = 160;

  /** Turn the move mode on or off for one window, and say which it is. */
  function setMoveMode(panel, on, live) {
    panel.setAttribute("data-fa-moving", on ? "true" : "false");
    if (live) {
      live.textContent = on
        ? "Move mode on. Arrow keys move this window; hold Shift to resize; Escape to finish."
        : "Move mode off.";
    }
    if (on) panel.focus();
  }

  /** Current inline geometry, falling back to what the cascade laid out. */
  function geometryOf(panel) {
    var rect = panel.getBoundingClientRect();
    var parent = panel.offsetParent ? panel.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
    return {
      left: parseFloat(panel.style.left) || rect.left - parent.left,
      top: parseFloat(panel.style.top) || rect.top - parent.top,
      width: parseFloat(panel.style.width) || rect.width,
      height: parseFloat(panel.style.height) || rect.height,
    };
  }

  function applyGeometry(panel, g) {
    panel.style.left = g.left + "px";
    panel.style.top = g.top + "px";
    panel.style.width = g.width + "px";
    panel.style.height = g.height + "px";
  }

  /**
   * One arrow press in move mode.
   *
   * Returns true when it acted, so the caller knows whether to swallow the
   * key. Swallowing unconditionally would eat a reader's scrolling the moment
   * a window had focus and the mode did not.
   */
  function nudge(panel, key, shift) {
    var g = geometryOf(panel);
    var step = shift ? RESIZE_STEP : MOVE_STEP;
    if (key === "ArrowLeft") { if (shift) g.width = Math.max(MIN_WINDOW, g.width - step); else g.left -= step; }
    else if (key === "ArrowRight") { if (shift) g.width += step; else g.left += step; }
    else if (key === "ArrowUp") { if (shift) g.height = Math.max(MIN_WINDOW, g.height - step); else g.top -= step; }
    else if (key === "ArrowDown") { if (shift) g.height += step; else g.top += step; }
    else return false;
    // NEVER off the top-left. A window moved past the origin is a window a
    // reader cannot reach the controls of, which is `l4zi` by another route.
    g.left = Math.max(0, g.left);
    g.top = Math.max(0, g.top);
    applyGeometry(panel, g);
    return true;
  }

  /**
   * The whole move interaction, wired onto one panel. ONE implementation.
   *
   * Bean `ivfw` is the second surface that needs this — a sticky lifted onto
   * the page, which until now had nowhere to go. The bean's own warning is
   * against giving it a second one: *"the two must agree rather than ship two
   * notions of position"*. So the board window and the floating sticky call
   * this, and neither owns the behaviour.
   *
   * `panel` takes the keyboard path and the geometry; `handle` is the region a
   * pointer may drag by, which is the title bar on a window and the head on a
   * sticky. They differ because dragging a card by its BODY would fight text
   * selection, and a reader who cannot select the text of a note cannot quote
   * it.
   */
  function wireMove(panel, handle, live) {
    // THE KEYBOARD PATH, and it acts only in the mode. Outside it the arrows
    // go on scrolling the page, which is what a reader expects of them.
    panel.addEventListener("keydown", function (e) {
      if (panel.getAttribute("data-fa-moving") !== "true") return;
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        setMoveMode(panel, false, live);
        return;
      }
      if (nudge(panel, e.key, e.shiftKey)) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    /* THE ACCELERATOR, over the top of the path above rather than instead of
     * it. Everything it can do, the keyboard can already do. */
    var from = null;
    handle.addEventListener("mousedown", function (e) {
      // Not on a control: a drag that started on `[x]` would fight the click
      // that closes the panel.
      if (e.target.closest("[data-fa-control]") || e.target.closest("button")) return;
      from = { x: e.clientX, y: e.clientY, g: geometryOf(panel) };
      e.preventDefault();
    });
    document.addEventListener("mousemove", function (e) {
      if (!from) return;
      applyGeometry(panel, {
        left: Math.max(0, from.g.left + (e.clientX - from.x)),
        top: Math.max(0, from.g.top + (e.clientY - from.y)),
        width: from.g.width,
        height: from.g.height,
      });
    });
    document.addEventListener("mouseup", function () { from = null; });
  }

  /* ═══ The fishbone — relocate, behind a confirm that names the scope ═══
   *
   * Owner: *"confrim arctions [fishbones] on open content puts in fsh guts"*,
   * and CRDM Q5: **delete becomes MOVE**. `processes/board-relocate.bpmn`
   * is the drawn process; this is its reader-facing half.
   *
   * ## THE CONFIRM IS THE REQUIREMENT, AND IT MUST NOT OVERSTATE EITHER WAY
   *
   * `deletion-requires-confirmation` names the failure: a dialog that says
   * "remove?" when it means "unpublish everywhere". The same lie pointed the
   * other way is just as bad, and it is the one THIS surface could tell — a
   * published page cannot move a file in the repository, so a dialog
   * promising "off the site, everywhere" would be describing something that
   * did not happen.
   *
   * So the dialog says exactly two things: what this does (takes the card off
   * THIS BROWSER's board, reversibly, from the trashcan tile), and what it
   * does not (move the content out of the folio at all). Naming the second is
   * not an apology; it is the difference between a reader thinking they
   * cleared something for the team and knowing they did not.
   *
   * THE SCOPE IS THE OWNER'S, settled 2026-09-21 when `db7g` could not meet
   * its own first line: **reader-local is the whole feature.** The fishbone is
   * a control over one reader's view, and the durable relocation is not the
   * board's — so this dialog describes a per-reader action rather than
   * promising a repository change that is coming. `board-relocate.bpmn`'s
   * `A_MoveContent` is the AGENT's path to fsh-guts and is not wired to this
   * control; wiring them would re-open the question the owner just closed.
   *
   * ## ONE PATH, shared with `d1r6`
   *
   * The relocation itself is `discardTodo` — the same function, the same
   * `localStorage` key, the same `fa:todos-discarded` event the trashcan
   * counter already listens to. The bean asked for one path rather than a
   * second answer, and a second store would have been two counts of one thing.
   */
  function relocateDialog(todo, onConfirm) {
    var dialog = el("div", {
      class: "fa-relocate",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "fa-relocate-title",
      "aria-describedby": "fa-relocate-scope",
    });
    dialog.appendChild(el("h3", { class: "fa-relocate-title", id: "fa-relocate-title" },
      "Send \u201C" + todo.summary + "\u201D to the trashcan?"));

    var scope = el("div", { class: "fa-relocate-scope", id: "fa-relocate-scope" });
    // WHAT WILL HAPPEN, in the words of what it actually does.
    scope.appendChild(el("p", { class: "fa-relocate-does" },
      "This takes the card off your board in this browser. It is saved here, not " +
      "sent anywhere, and not removed for anyone else. You can put it back from " +
      "the trashcan tile."));
    // WHAT WILL NOT, which is the half a reader would otherwise assume.
    scope.appendChild(el("p", { class: "fa-relocate-does-not" },
      "It does not move the content out of the folio, and nothing on this page " +
      "does: the fishbone is a control over YOUR view of the board. Moving content " +
      "into fsh-guts is a change to the repository, made by whoever is editing it."));
    dialog.appendChild(scope);

    var row = el("div", { class: "fa-relocate-actions" });
    var cancel = el("button", { type: "button", class: "fa-relocate-cancel" },
      "Leave it where it is");
    var confirm = el("button", { type: "button", class: "fa-relocate-confirm" },
      "Send to the trashcan");
    row.appendChild(cancel);
    row.appendChild(confirm);
    dialog.appendChild(row);

    function close() {
      if (dialog.parentNode) dialog.parentNode.removeChild(dialog);
    }
    cancel.addEventListener("click", function () { close(); });
    confirm.addEventListener("click", function () { close(); onConfirm(); });
    // ESCAPE IS THE CANCEL, never the confirm. A dialog whose dismissal
    // performs the action is a dialog that did not ask.
    dialog.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.stopPropagation(); close(); }
    });
    // Focus lands on the SAFE choice. The reader who hits Enter without
    // reading has left the content where it is, which is the recoverable
    // outcome of the two.
    setTimeout(function () { cancel.focus(); }, 0);
    return dialog;
  }

  /**
   * One declared control, as a button the frame can place.
   *
   * The frame decides the SHAPE and the placement; `handlers` supplies the
   * behaviour, which the board already owns. A kind declares WHICH controls it
   * offers, never what they do — two panels whose `[x]` did different things
   * would be two frames, and the whole point of a fixed chrome is that a
   * reader learns it once.
   *
   * A control with no handler renders and does nothing rather than throwing.
   * That is deliberate: it is the visible half of a wiring gap, and a panel
   * that refused to build would hide which control was unwired.
   */
  /**
   * What a frame control shows, where a glyph is clearer than the words.
   *
   * The accessible name is always the control's LABEL — a glyph alone is a
   * guess, and `aria-label` is what a screen reader announces. `\u2A37` is the
   * owner's `[fishbones]`.
   */
  var CONTROL_GLYPHS = { close: "\u00D7", relocate: "\u2A37", move: "\u271C" };

  function controlButton(control, todo, handlers) {
    if (control.id === "view" || control.id === "edit") {
      return el("a", {
        class: "fa-board-window-control fa-node-edit",
        "data-fa-control": control.id,
        href: safeHref(control.id === "view" ? todo.viewHref : todo.editHref),
        "aria-label": control.label + " — " + todo.summary,
      }, control.id === "view" ? "\u2398" : "\u270E");
    }
    var b = el("button", {
      type: "button",
      class: "fa-board-window-control",
      "data-fa-control": control.id,
      "aria-label": control.label + " — " + todo.summary,
    }, CONTROL_GLYPHS[control.id] || control.label);
    // The frame wires what the frame owns; everything else delegates to the
    // behaviour the board already has. A kind declares WHICH controls it
    // offers, never what they do — two panels whose `[x]` did different
    // things would be two frames.
    var act = handlers[control.id];
    if (act) {
      b.addEventListener("click", function (e) { e.stopPropagation(); act(todo, b); });
    }
    return b;
  }

  /** Split into what this node can serve and what it cannot, with reasons. */
  function servableControls(controls, capabilities) {
    var shown = [];
    var hidden = [];
    for (var i = 0; i < controls.length; i++) {
      var c = controls[i];
      if (c.needs === "none" || capabilities[c.needs] === true) shown.push(c);
      else {
        hidden.push({
          control: c,
          because: c.label + " needs " + c.needs + ", which this node does not have.",
        });
      }
    }
    return { shown: shown, hidden: hidden };
  }
  var windowStack = { open: [] };

  function isWindowOpen(id) { return windowStack.open.indexOf(id) !== -1; }

  /** Open at the top; opening an already-open card RAISES it, never duplicates. */
  function openWindowFor(id) {
    windowStack.open = windowStack.open.filter(function (o) { return o !== id; });
    windowStack.open.push(id);
  }

  function closeWindowFor(id) {
    windowStack.open = windowStack.open.filter(function (o) { return o !== id; });
  }

  /** Raising a card that is not open does NOT open it — selection is not opening. */
  function raiseWindow(id) { if (isWindowOpen(id)) openWindowFor(id); }

  /** One-based, bottom to top. `undefined` for a card that is not open. */
  function zIndexFor(id) {
    var at = windowStack.open.indexOf(id);
    return at === -1 ? undefined : at + 1;
  }

  /**
   * The declared threshold for a kind, with where it came from — or null.
   *
   * Returns the SOURCE alongside the number for the reason
   * `schemas/semantic-zoom.ts` gives: an inherited value is still a fact
   * somebody must be able to trace, and a reviewer looking at a card that
   * flipped too early needs to tell a deliberate override from the folio's
   * default landing somewhere it does not fit.
   */
  function zoomThresholdFor(kind) {
    var z = zoomState.zoom;
    if (!z) return null;
    var o = z.byKind && z.byKind[kind];
    if (o) return { belowPx: o.belowPx, source: "kind", because: o.because };
    return { belowPx: z.belowPx, source: "folio" };
  }

  /** Strictly below, so the declared number is the last width that still shows words. */
  function rendersAvatar(kind, widthPx) {
    var t = zoomThresholdFor(kind);
    if (!t) return false;
    return widthPx < t.belowPx;
  }

  /**
   * THE SITE'S BASEURL, derived from a path the server already resolved —
   * the FALLBACK arm of `siteBaseurl`, never called directly.
   *
   * Every backdrop in the todo index was arriving as `/assets/img/...` —
   * site-ROOT-absolute with no baseurl — and this site is served from
   * `/folio-assistant/` on the canonical deploy and
   * `/folio-assistant/STAGING/<branch>/` on a preview. So every one of them
   * 404'd, and the owner saw todo cards with a broken-image placeholder
   * beside landing stickies that had their art: *"i want the theme on the
   * lower ones too. why are they dispalyed differently."*
   *
   * They were not displayed differently by design. The theme WAS applied —
   * `data-fa-sticky-theme` and `fa-sticky--backdrop` both set — and only the
   * picture failed to load. A styling answer would have been the wrong fix
   * for a broken path.
   *
   * ## Why derive it rather than read it
   *
   * `gen-docs-pages.ts` cannot write the baseurl in: the SAME index file is
   * served from the canonical prefix and from every staging prefix, so a
   * baked-in prefix is wrong on all but one. Liquid could pass it, and
   * `#fa-translation-index` does carry `site.baseurl` — but that island is
   * about translations and may legitimately be absent, which would make the
   * art depend on an unrelated feature being switched on.
   *
   * `meta[name="fa-todo-src"]` is the honest source: it is emitted through
   * `relative_url`, so the SERVER has already resolved the prefix, and the
   * board does not mount at all without it. Stripping the known suffix gives
   * the prefix the same page used to fetch the index itself.
   */
  function baseurlFromTodoSrc() {
    var m = document.querySelector('meta[name="fa-todo-src"]');
    var src = m && m.getAttribute("content");
    var suffix = "/assets/todos/index.json";
    if (src && src.length >= suffix.length && src.slice(-suffix.length) === suffix) {
      return src.slice(0, -suffix.length);
    }
    return "";
  }

  /**
   * Prefix every art path in a `themeArt` map with the site's baseurl.
   *
   * Left alone: anything already absolute (`http:`, `//`) and anything that
   * already starts with the prefix. The second guard is what stops a
   * double-prefix if the generator is ever changed to resolve paths itself —
   * at which point this becomes a no-op rather than a bug.
   */
  function baseurlResolved(themeArt) {
    var base = siteBaseurl();
    if (!base) return themeArt;
    var out = {};
    Object.keys(themeArt).forEach(function (theme) {
      var layouts = themeArt[theme] || {};
      out[theme] = {};
      Object.keys(layouts).forEach(function (layout) {
        var src = layouts[layout];
        if (typeof src !== "string" || /^([a-z]+:)?\/\//i.test(src) || src.indexOf(base + "/") === 0) {
          out[theme][layout] = src;
        } else {
          out[theme][layout] = base + src;
        }
      });
    });
    return out;
  }

  /** Fetch the folio's declaration. Absent is a real answer and stays null. */
  function fetchZoom(done) {
    var src = document.querySelector('meta[name="fa-zoom-src"]');
    var url = src && src.getAttribute("content");
    if (!url) return done();
    fetch(url)
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (doc) {
        if (doc && typeof doc.belowPx === "number") zoomState.zoom = doc;
        done();
      })
      .catch(function (e) {
        // Said once, and never replaced by a number. A board that guessed a
        // threshold would put the literal R2 forbids one layer further from
        // where anybody would look for it.
        console.warn("docs-ui: no semantic-zoom declaration at " + url + " (" + e.message +
                     "); cards keep their words at every width.");
        done();
      });
  }

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
        // The art, per THEME rather than per todo — fifty todos sharing a
        // theme would otherwise carry fifty copies of the same three paths.
        // Absent is a real state: a theme with no backdrop renders a flat
        // themed card, which is correct rather than degraded.
        todoState.themeArt = baseurlResolved(doc.themeArt || {});
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


  /* ── Discarding a sticky (bean `d1r6`) ─────────────────────────────────
   *
   * Owner, 2026-09-19: *"stikies have an [x] to close/restore to panel...
   * that should now be replaced with it going into the fsh-guts. icon there
   * should be crumpled sticky."*
   *
   * ## What "into the fsh-guts" can mean on a static site
   *
   * The published `fsh-guts.jsonld` is built from the repository; a page has
   * no way to write to it. So a discard here is **per-viewer and
   * per-browser**, in `localStorage`, exactly like the reading preferences.
   *
   * **The UI says so, in words, wherever a discarded item appears.** A reader
   * who thinks they have cleared a todo for the team when they have cleared
   * it for themselves has been misled by the control, and that is a worse
   * failure than not having the control.
   *
   * ## It is a discard, not a delete — `fsh-guts`'s whole rule
   *
   * "Delete means relocate", and a thing in the trashcan can be read, cited
   * and restored. So a discarded sticky is listed in the Discarded view with
   * a Restore control beside it. A one-way dismiss would carry the crumpled
   * icon while breaking the rule the icon stands for.
   *
   * ## Removing the × does not strand anyone
   *
   * The × returned a FLOATING sticky to the board, and the board already
   * offers that a second way: the greyed slot entry is a real button that
   * docks it (owner: *"can also return the sticky note by clicking
   * disabled"*). So the close control's old job survives without it.
   */

  var CRUMPLED_GLYPH =
    '<svg class="fa-crumpled-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    // A sticky square with its corner turned in and creases across it.
    '<path d="M4 5h13l3 3v11H4z" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linejoin="round"/>' +
    '<path d="M17 5v3h3" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linejoin="round"/>' +
    '<path d="M7 9l4 4-3 2 5 3M14 10l-2 3 4 1" fill="none" stroke="currentColor" ' +
    'stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/></svg>';

  var DISCARDED_TODOS_KEY = "fa-discarded-todos";

  /** Ids this browser has discarded. Never throws — storage may be blocked. */
  function discardedTodoIds() {
    try {
      var raw = localStorage.getItem(DISCARDED_TODOS_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_e) {
      return [];
    }
  }

  function setDiscardedTodoIds(ids) {
    try {
      localStorage.setItem(DISCARDED_TODOS_KEY, JSON.stringify(ids));
      return true;
    } catch (_e) {
      // Saying nothing would be worse than a console note nobody reads: the
      // reader will discard something, reload, and wonder why it came back.
      console.warn("docs-ui: the discard could not be saved (storage blocked); " +
                   "it applies to this page view only.");
      return false;
    }
  }

  function discardTodo(id) {
    var ids = discardedTodoIds();
    if (ids.indexOf(id) === -1) ids.push(id);
    setDiscardedTodoIds(ids);
    document.dispatchEvent(new CustomEvent("fa:todos-discarded", { detail: { id: id } }));
  }

  function restoreTodo(id) {
    setDiscardedTodoIds(discardedTodoIds().filter(function (x) { return x !== id; }));
    document.dispatchEvent(new CustomEvent("fa:todos-discarded", { detail: { id: id } }));
  }

  /**
   * The `<picture>` a themed sticky renders its art in.
   *
   * MARKUP, not a CSS background, and the reason is recorded on the stylesheet
   * rule this feeds: `<picture>` swaps the FILE at a breakpoint and
   * `background-image: url(...)` can only name one crop. Serving the wide crop
   * to a phone is a bug this repository has already shipped once.
   *
   * TWO sources, not three. The `card` crop is the default because a todo
   * sticky IS a board card — dense, roughly square — and `mobile` takes over
   * below 30rem where a square card has the least room on the tallest screen.
   * The `laptop` crop is deliberately unused here: it is composed for a
   * page-width surface, and handing it to a card would show the art's quiet
   * area in the wrong place. The landing sticky still uses all three, because
   * it really is a page-width surface at the top end.
   *
   * `alt=""` and `aria-hidden`: this is decoration behind text that already
   * says everything. A description of the cat would be read out before every
   * todo on the board.
   */
  function buildBackdrop(art) {
    var pic = el("picture", { "aria-hidden": "true" });
    if (art.mobile) {
      var src = el("source", { media: "(max-width: 30rem)", srcset: art.mobile });
      pic.appendChild(src);
    }
    // `card` when there is one, else whatever the theme did supply — the
    // generator only publishes complete sets, so this fallback is reached only
    // by a hand-written index.
    var chosen = art.card || art.mobile || art.laptop;
    pic.appendChild(el("img", { class: "fa-sticky-art", src: chosen, alt: "", loading: "lazy" }));
    return pic;
  }

  /* The pencil and the eye, as inline SVG rather than `✎` and `⎘`.
   *
   * Which glyph a font actually has for those two characters varies, and `⎘`
   * falls back to a box on several common stacks — a control that looks
   * broken without anybody changing it. An inline path draws the same shape
   * everywhere and takes `currentColor`. */
  var EYE_GLYPH =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M12 5c-5 0-8.6 4.2-9.6 6a1 1 0 0 0 0 1c1 1.8 4.6 6 9.6 6s8.6-4.2 9.6-6a1 1 0 0 0 0-1c-1-1.8-4.6-6-9.6-6zm0 11a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zm0-2.2a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6z"/>' +
    "</svg>";
  var PENCIL_GLYPH =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M4 16.5V20h3.5L17.8 9.7l-3.5-3.5L4 16.5zM20.7 7.3a1 1 0 0 0 0-1.4l-2.6-2.6a1 1 0 0 0-1.4 0l-1.7 1.7 3.5 3.5 1.7-1.7z"/>' +
    "</svg>";

  /**
   * View and Edit for a todo's source file, as a caption row.
   *
   * ## The SLOT owns these, not the card
   *
   * The owner asked for them below the sticky rather than inside it, and the
   * slot is what "below" means here — but there is a second reason the slot
   * is the right owner rather than merely a convenient one. A card can be
   * PINNED onto the glass, where it is positioned freely and has no "below"
   * to put a caption in. Hanging the links on the card would mean either
   * dragging a caption around the glass behind it or losing the links
   * whenever a sticky is pinned.
   *
   * On the slot they simply stay put: the card floats away, the greyed recall
   * button takes its place, and View and Edit are still exactly where the
   * reader left them. That is the same reasoning the board already uses for
   * keeping a floating sticky's slot in the grid rather than reflowing it.
   *
   * ## Absent, never disabled
   *
   * `sourceLinks` returns `undefined` for anything that is not a github.com
   * origin, so the keys are simply missing when the pipeline has no forge.
   * `pb04`: a dead link invites a click and then 404s for exactly the reader
   * who cannot edit, which reads as "this page is broken" rather than "you
   * cannot do this". Returns null so the caller appends nothing at all.
   */
  function buildSourceLinks(todo) {
    if (!todo.viewHref && !todo.editHref) return null;
    var row = el("p", { class: "fa-sticky-links" });
    if (todo.viewHref) {
      var v = el("a", {
        class: "fa-node-edit fa-sticky-view",
        href: safeHref(todo.viewHref),
        title: "View this todo's source on GitHub",
        // No visible text, so the label and the title are BOTH needed and are
        // not interchangeable: the label names the action for a screen
        // reader, the title gives a pointer user the same words on hover.
        "aria-label": "View the source of " + todo.summary,
      });
      v.innerHTML = EYE_GLYPH;
      row.appendChild(v);
    }
    if (todo.editHref) {
      var e = el("a", {
        class: "fa-node-edit fa-sticky-edit",
        href: safeHref(todo.editHref),
        title: "Edit this todo's markdown on GitHub",
        "aria-label": "Edit " + todo.summary,
      });
      e.innerHTML = PENCIL_GLYPH;
      row.appendChild(e);
    }
    return row;
  }

  /**
   * One line of text, from prose that was never one line.
   *
   * Owner, 2026-09-21, on what a CLOSED sticky shows: *"just the condensend
   * text"*, and then *"(strip whitesaplnce, newlines, bullets....)"*.
   *
   * ## Why this rather than an `aria-label`
   *
   * The first proposal was a visually-hidden name. The owner rejected it —
   * *"that's new data to maintain"* — and the rejection is the better
   * design: a hidden label is a SECOND string beside the visible one, and two
   * strings for one fact is the defect `1rta` and `6lb8` §6 already name about
   * a badge that can disagree with its own panel. The card's own text IS its
   * name; a screen reader and a sighted reader get the same string because
   * there is only one.
   *
   * ## What it strips, and what it deliberately does not
   *
   * Markdown list markers, blockquote carets, heading hashes and every run of
   * whitespace — the structure that makes prose readable DOWN a card and
   * unreadable ACROSS one. It does not truncate: cutting at a character count
   * puts the elision in the model, where a stylesheet cannot undo it for a
   * wider card. `text-overflow` is the renderer's job and stays there.
   */
  function condense(text) {
    if (!text) return "";
    return String(text)
      // List markers and blockquote carets, at the start of any line only —
      // a hyphen mid-sentence is a hyphen.
      .replace(/^[ \t]*(?:[-*+\u2022]|\d+[.)]|>)+[ \t]*/gm, "")
      // Heading hashes, same rule.
      .replace(/^[ \t]*#{1,6}[ \t]*/gm, "")
      // Every run of whitespace, newlines included, becomes one space.
      .replace(/\s+/g, " ")
      .trim();
  }

  function buildSticky(todo, onFloat, onDock, onDiscard, opts) {
    var compact = opts && opts.compact;
    var attrs = {
      class: "fa-sticky fa-sticky-p-" + (todo.priority || "medium"),
      "data-todo-id": todo.id,
    };
    // THE THEME IS A PROPERTY OF THE STICKY, NOT OF THE PINNED STATE.
    //
    // Bean `ivfw`, the owner: "when you unpin, sticky, it loses its theme".
    // Read from `todo.theme` HERE, in the one function that builds a card,
    // which is what makes the round-trip safe rather than the transitions
    // being careful: `float` constructs a second card on the layer and `dock`
    // destroys it, so any theme carried on the DOM node instead of on the todo
    // would be dropped by construction. Neither transition needs to know the
    // theme exists.
    //
    // The attribute is what `themes.css` selects on, so this is the same
    // mechanism the landing stickies use rather than a second one.
    if (todo.theme) attrs["data-fa-sticky-theme"] = todo.theme;
    // THE BACKDROP, when this todo's theme has art. Bean `5y4b`, the owner:
    // "todos need grump cat themeing based on content too."
    //
    // Until now the landing board carried two kinds of sticky side by side —
    // a harness card with per-theme art, a measured text region and a scrim,
    // and a todo that was a flat card with a coloured left border. On one page
    // they read as two systems, which is why this looked wrong rather than
    // merely plain.
    //
    // `fa-sticky--backdrop` is the SAME class the landing sticky uses, so the
    // art positioning, the clipping, the `isolation` stacking context and the
    // scrim all come from rules that already exist and are already measured.
    // Nothing here re-implements them, and nothing here sets a colour: the
    // scrim is `--fa-sticky-scrim` from `themes.css`, whose AAA-over-pure-black
    // guarantee travels with the value rather than being restated.
    var art = todo.theme && todoState.themeArt[todo.theme];
    if (art) attrs.class += " fa-sticky--backdrop";
    var card = el("article", attrs);
    if (art) card.appendChild(buildBackdrop(art));

    var head = el("div", { class: "fa-sticky-head" });
    var toggle = el("button", {
      type: "button",
      class: "fa-sticky-toggle",
      "aria-expanded": "false",
    });
    toggle.appendChild(el("span", { class: "fa-sticky-summary" }, condense(todo.summary)));
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
        // `safeHref`, not a truthiness test: `TodoRelationSchema.href` is
        // `z.string()`, so the schema permits a scheme this must refuse. A
        // refused edge falls through to the dangling branch below, which
        // already says why there is no link.
        var relHref = safeHref(rel.href);
        if (relHref) {
          li.appendChild(el("a", { class: "fa-sticky-rel-link", href: relHref }, rel.label));
        } else {
          // Title says WHY there is no link, so a reader is not left guessing
          // whether the chip is broken or the target simply is not reachable.
          // TWO REASONS THERE IS NO LINK, and they are different facts. The
          // edge may have resolved to nothing — nobody built the target — or
          // it may carry a scheme a link may not carry. Saying "nothing
          // resolves this" about the second would be wrong, and wrong in the
          // direction that hides a hostile value as a missing one.
          li.appendChild(el("span", {
            class: "fa-sticky-rel-dangling",
            title: rel.href
              ? "No link: " + rel.label + " points at a scheme a link may not carry"
              : "No link: nothing on this site resolves " + rel.label,
          }, rel.label));
        }
        relBox.appendChild(li);
      }
      head.appendChild(relBox);
    }

    var tools = el("div", { class: "fa-sticky-tools" });

    /* THREE ON THE FACE, ONE THAT HOLDS THE REST — bean `qefk`, the owner:
     * *"the todos controls are too clunky / take up too much real estate."*
     * Asked how far to go and answered **"3+1"**.
     *
     * The split is by WHAT THE GESTURE DOES, not by how often it is used:
     *
     *   face      Pin, Discard, and Move once the card is floating
     *             — the things you do to a card ON THE BOARD
     *   behind    View, Edit — the things that LEAVE for the forge
     *
     * That keeps `pb04` intact. Its rule was that View and Edit are two acts
     * and both must be present — *"a reader checking what a card says should
     * not land in a text box, and one who wants to fix it should not have to
     * find the button"*. Present is what it asked for; competing with a
     * one-line summary is not. Both are still here, still keyboard-reachable,
     * one keystroke further away.
     *
     * AND IT IS A `<details>`, not a scripted menu. The disclosure, the
     * keyboard path, the Escape behaviour and the accessible name are the
     * browser's; a hand-rolled popup would be four affordances to reimplement
     * and four ways to get them wrong. It also degrades to "everything
     * visible" with no JavaScript, which is `R4`'s floor rather than a
     * convenience.
     */
    // VIEW *AND* EDIT — two controls, because they are two acts. Bean `pb04`,
    // the owner: *"rendeding shows edit src icon (and also need view icon)"*.
    // `/blob/` is reading and `/edit/` opens GitHub's editor: a reader
    // checking what a card says should not land in a text box, and one who
    // wants to fix it should not have to find the button.
    //
    // BOTH ARE ABSENT, NOT BROKEN, when the rendering pipeline has no forge.
    // The keys are simply missing from the published index — `sourceLinks`
    // returns `undefined` for anything that is not a github.com `origin` — so
    // the test here is presence, and there is nothing to disable or grey out.
    // A dead link is worse than no link: it invites a click, and on a private
    // repository it 404s for exactly the reader who cannot edit, which reads
    // as "this page is broken" rather than "you cannot do this".
    // THE SOURCE LINKS ARE NOT IN THE CARD ANY MORE. Owner, 2026-09-21:
    // *"i want the [pencil] edit icon, (edit, view links can be below, not
    // inside stick)"*. `buildSourceLinks` renders them, and the SLOT places
    // them under the card — see the note on that function for why the slot
    // and not the card is the right owner.
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

      // WAS `×`, which returned a floating sticky to the board. It is now a
      // discard, per the owner — and the old job survives on the greyed
      // board slot, which is a real button that docks it.
      var discard = el("button", {
        type: "button",
        class: "fa-sticky-close fa-sticky-discard",
        // The name says where it goes and that it is reversible. "Close"
        // said neither, and a crumpled icon with no words is a guess.
        "aria-label": "Discard " + todo.summary + " to the trashcan (restorable, this browser only)",
      });
      discard.innerHTML = CRUMPLED_GLYPH;
      discard.addEventListener("click", function () { onDiscard(todo); });
      tools.appendChild(discard);
    }

    /* THE `⋯` DRAWER IS GONE, and this note is why rather than a silence.
     *
     * `main` answered `qefk` by collapsing View and Edit into a `<details>`
     * on the card's face — the owner's *"3+1"*: three board gestures on the
     * face, the two forge links one level in. That was the right shape for
     * the instruction it had.
     *
     * The owner then went further, 2026-09-21: *"i want the [pencil] edit
     * icon, (edit, view links can be below, not inside stick)"*. The links
     * leave the card entirely, which is the same direction `qefk` was
     * pointing and one step past the drawer. A drawer with nothing to hold
     * is `pb04`'s failure in a new costume — an affordance that promises and
     * delivers nothing — so it goes rather than staying as an empty control.
     *
     * WHAT SURVIVES IS THE SPLIT ITSELF, and it is main's: board gestures
     * (Pin, Discard, Move) belong on the face because they act on the card;
     * the forge links act on the FILE and now sit below it, in the cell.
     * `buildSourceLinks` renders them and the slot places them.
     */

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
  /**
   * THE GLASS — the reader's folio, pulled down over whatever they are
   * browsing. R25: *"the user in visualization should be able to pull down
   * their folio."*
   *
   * ## Why this is its own function, and what the move cost before it
   *
   * The layer already existed and was already `document.body`'s, fixed to the
   * viewport — structurally a glass. It was created INSIDE `mountTodoBoard`,
   * after two guards that have nothing to do with a glass:
   *
   *   mountTodoStickies -> fetchTodoIndex -> `if (items === null) return`
   *   mountTodoBoard    -> `if (!main) return null`   (#main-content / main)
   *
   * So the folio existed only on a page that had a just-the-docs main region
   * AND a readable todo index. A `who-iris` replica page has neither — its
   * own `<style>`, no Jekyll, no `<main>` — which is why bean `jpjt` measured
   * `docs-ui.js` 0 / boards 0 / tiles 0 there and concluded F8/F9 was blocked
   * on this. **A folio that only exists where a board mounted is not a folio
   * a reader carries between libraries.**
   *
   * ## Idempotent, and it returns the SAME layer the board floats into
   *
   * Called from `init` before anything else and again by `mountTodoBoard`.
   * One layer or the glass and the board would be two surfaces that agree
   * only by accident — the shape `harness-tiles` calls two registries.
   *
   * ## An empty glass still comes down
   *
   * `.fa-sticky-layer:empty { display: none }` hides a layer with no children,
   * which is right for a float layer and wrong for a glass: "nothing on your
   * glass" and "the glass is broken" are opposite facts, and the first is a
   * state a reader reaches by tidying. The open glass therefore always holds
   * its own chrome, so it is never `:empty` while open.
   */
  var glassLayer = null;
  function mountGlass() {
    if (glassLayer && glassLayer.isConnected) return glassLayer;

    var layer = el("div", {
      class: "fa-sticky-layer",
      "aria-live": "polite",
      "data-fa-glass": "closed",
    });
    document.body.appendChild(layer);
    glassLayer = layer;

    // The handle. A BUTTON, not a div with a click: the disclosure, the focus
    // ring and the keyboard path are the browser's, and this instance's
    // declared interaction profile is low-dexterity, so the way in is never a
    // pointer-only gesture.
    var handle = el("button", {
      type: "button",
      class: "fa-glass-handle",
      "aria-expanded": "false",
      "aria-label": "Pull down your folio",
      title: "Pull down your folio",
    }, "\u25BE Folio");
    document.body.appendChild(handle);

    // The glass's own chrome, so an open glass is never `:empty`.
    var sheet = el("div", { class: "fa-glass-sheet", role: "region", "aria-label": "Your folio" });
    var empty = el("p", { class: "fa-glass-empty" },
      "Nothing on your folio glass. Open a library and pull an item out to put it here.");
    sheet.appendChild(empty);
    layer.appendChild(sheet);

    function setOpen(open) {
      layer.setAttribute("data-fa-glass", open ? "open" : "closed");
      handle.setAttribute("aria-expanded", open ? "true" : "false");
      handle.setAttribute("aria-label", open ? "Put your folio away" : "Pull down your folio");
      handle.title = handle.getAttribute("aria-label");
      // The EMPTY LINE is about the glass's contents, not about the sheet:
      // the sheet is chrome and is always present. `slots` are the cards the
      // board floats here, so the count is taken from them rather than from
      // the layer's children, which would count the sheet itself.
      var floating = layer.querySelectorAll(".fa-sticky-floating").length;
      empty.hidden = floating > 0;
    }
    setOpen(false);

    // `l4zi`: the inverse is reachable, and by the same control. The handle
    // stays on the page while the glass is open — a glass whose only way out
    // is Escape excludes a reader who never learned that Escape was a way out.
    handle.addEventListener("click", function () {
      setOpen(layer.getAttribute("data-fa-glass") !== "open");
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "Escape") return;
      if (layer.getAttribute("data-fa-glass") !== "open") return;
      setOpen(false);
      handle.focus();
    });

    layer.__faSetGlassOpen = setOpen;
    return layer;
  }

  function mountTodoBoard(items) {
    // THE LANDING FOLIO BOARD FIRST, when the page has one. The owner, 2026-09-20:
    // "i want todo board inside of the landing folio/board."
    //
    // The landing page is itself a board of sticky notes -- one card per
    // harness, each an initiation receipt -- so a second board floating above
    // it, hidden behind a launcher, put two boards of the same thing on one
    // page and made the todos the one you could not see. Mounted into the
    // landing board they are the same surface: the harness cards say what ran,
    // the todo stickies say what is outstanding, and both are stickies.
    //
    // Everywhere else the old target and the old behaviour are unchanged: the
    // board goes to the top of the main region and starts hidden, opened by its
    // launcher.
    var landing = firstMatch([".fa-landing-board"]);
    var main = landing || firstMatch(["#main-content", ".main-content", "main"]);
    if (!main) {
      console.warn("docs-ui: no main content region found; the todo board was not mounted.");
      return null;
    }

    // THE LAYER IS THE GLASS, and it is no longer created here. `mountGlass`
    // made it before this ran, because a folio that only exists where a board
    // mounted is not a folio a reader carries. See that function for what the
    // two guards above used to cost.
    var layer = mountGlass();

    // VISIBLE on the landing board, hidden everywhere else. On a page whose
    // whole content is a board of stickies, a hidden board of stickies is the
    // one thing a reader cannot find; anywhere else it is an overlay and must
    // not cover the page it was opened from.
    /* ONE PANEL, NOT TWO. Owner, 2026-09-21, on the staging preview:
     * *"why are there two panels???"*
     *
     * `.fa-sticky-board` carries a border, a background, padding, an `<h2>`
     * and a close button — correct when it is an overlay opened by a
     * launcher, and wrong the moment it is mounted INSIDE the landing
     * board, because the landing board is now itself inside
     * `.fa-sticky-panel`. The reader got panel-inside-panel: a bordered box
     * headed "Todos" sitting in a bordered panel headed "Stickies", with a
     * close button next to a summary that already toggles.
     *
     * So a board nested in the sticky panel renders BARE. The chrome is not
     * restyled smaller — it is the OUTER panel's job and is already there
     * once.
     */
    var bare = !!(landing && landing.closest && landing.closest(".fa-sticky-panel"));

    var boardAttrs = {
      class: "fa-sticky-board" + (landing ? " fa-sticky-board--inline" : "") +
             (bare ? " fa-sticky-board--bare" : ""),
      tabindex: "-1",
      role: "region",
      "aria-label": "Todos",
    };
    if (!landing) boardAttrs.hidden = "hidden";
    var board = el("section", boardAttrs);
    var head = el("div", { class: "fa-sticky-board-head" });

    /* THE HEADING SURVIVES BARE, VISUALLY HIDDEN.
     *
     * Deleting it was the obvious move and is wrong twice. It is the focus
     * target for `discard()` and `setOpen()` — without it focus lands on
     * `<body>` and a keyboard reader loses their place, which is the defect
     * `l4zi` already records against this very board. And the section is
     * `role="region"`, so it owes an accessible name: "Stickies" on the
     * summary and "Todos" here are different facts, and a screen-reader user
     * moving by region needs the inner one.
     *
     * `fa-sr-only` is the clip-not-hide class the search label uses, for the
     * same reason spelled out there: `display: none` would take it out of the
     * accessibility tree along with the pixels. */
    var heading = el("h2", {
      class: "fa-sticky-board-title" + (bare ? " fa-sr-only" : ""),
      tabindex: "-1",
    }, "Todos");
    head.appendChild(heading);

    /* THE CLOSE BUTTON DOES NOT SURVIVE BARE, and that is not a lost control.
     *
     * Its inverse is the `<summary>` one line up, which closes the whole
     * panel — so `l4zi` is satisfied by the panel rather than by a second
     * button inside it. Keeping it would have given the reader two closes
     * doing different things at the same spot: one collapsing the panel, one
     * swapping the board for a "Todos (n)" reopen button INSIDE the still-open
     * panel. That second state is the one nobody would be able to describe. */
    var boardClose = el("button", {
      type: "button",
      class: "fa-sticky-board-close",
      "aria-label": "Close the todo board",
    }, "\u00d7");
    if (!bare) head.appendChild(boardClose);
    board.appendChild(head);

    /* THE READER'S FILTER, in the board's head and nowhere in any document.
     *
     * Two selects rather than a search box: the values come from the CORPUS
     * (`propertyValues`), so a reader picks from what is actually there rather
     * than guessing a spelling — and an option list built from the data cannot
     * offer a filter that matches nothing. */
    var filterRow = el("div", {
      class: "fa-board-filter",
      role: "group",
      "aria-label": "Filter this view",
    });
    board.appendChild(filterRow);

    /* THE OTHER SURFACE for the same declarations. Q11: declared once,
     * per-surface visibility. This filters the same array the navbar reads, so
     * a tile cannot be one thing in the sidebar and another here. */
    /* AN EDGE DOCK, NOT A ROW IN FLOW — bean `v0jv`, the owner: *"folios have
     * tiles do not go to the window. they are stacked around (bottom?) of
     * folio, slid away, open to tiles to things like fsh-gts, todos, docs."*
     *
     * It was `display: flex; flex-wrap: wrap` appended after the sticky grid,
     * so on the landing board it landed below every full-bleed card and read
     * as absent. The DECLARATION side was already right and is untouched:
     * `harness-tiles` — *"declared once, per-surface visibility, never two
     * registries free to disagree about what a tile is"* — and the call below
     * still filters the same array the navbar reads. Only the placement was
     * wrong.
     *
     * FOLIO CHROME, NOT BOARD CONTENT, which is the distinction the bean
     * records: *"the tiles must NOT be projected onto the glass — they are
     * folio chrome, where a window is content."* So the dock is a SIBLING of
     * the board's content, at its edge, and never a layer over it. Same arrow
     * as `board-diagram-interchange`: chrome frames content, never the
     * reverse.
     *
     * A `<details>` for the same reason the sticky drawer is one — the
     * disclosure, the keyboard path, Escape and the expanded state are the
     * browser's, and it degrades to everything-visible with no JavaScript,
     * which is R4's floor rather than a convenience. */
    var boardStrip = el("details", { class: "fa-board-strip", open: "" });
    boardStrip.appendChild(el("summary", {
      class: "fa-board-strip-summary",
      // NAMES WHAT IS INSIDE. "Tiles" is the shape; a reader deciding whether
      // to spend a keystroke needs the subject.
      "aria-label": "Visualisations for this folio",
      title: "Visualisations for this folio",
    }, "\u25A6 Visualisations"));
    var boardTiles = el("div", {
      class: "fa-board-tiles",
      role: "group",
      "aria-label": "Visualisations",
    });
    boardStrip.appendChild(boardTiles);

    var grid = el("div", { class: "fa-sticky-grid" });
    /* THE STRIP IS ALONG THE TOP, and OPEN by default — owner, 2026-09-21:
     * *"lets have the square tiles lined up on the top of the
     * folio-sicky-board-landingpanel whole slides up if user doesnt want."*
     *
     * It was a `<details>` dock at the BOTTOM, closed, which got two things
     * wrong at once: the edge, and the default. Tiles a reader has to open
     * before they can see what a folio offers are tiles that read as absent —
     * which is the same complaint that opened `v0jv` about the in-flow row.
     * So `open` is the initial state and sliding it UP is the reader's act,
     * not the other way round.
     *
     * NOT A SUB-PANEL, which the owner ruled in the same breath: *"i dont
     * want sub-panels of the folio, just one open (miro-like) board.
     * everything lives on fa-sticky-board, fa-landing-board."* The strip is
     * chrome ALONG the board rather than a panel within it — it carries no
     * card, no content and no second surface. */
    board.appendChild(boardStrip);
    board.appendChild(grid);
    // APPEND on the landing board, insert-first everywhere else. The harness
    // cards are the page's first statement -- what this repository is, and
    // which layers initiated -- and putting the todos above them would answer
    // "what is outstanding" before "what is this".
    if (landing) main.appendChild(board);
    else main.insertBefore(board, main.firstChild);

    var slots = {};

    function dock(todo) {
      var f = todoState.floating[todo.id];
      if (f) {
        // REMEMBER WHERE IT WAS, because dock DESTROYS the card and float
        // CONSTRUCTS a new one — the same round-trip that drops a theme
        // carried on the DOM node. A reader who moves a sticky, docks it and
        // pins it again has not asked for it to jump back to the corner.
        // Session-only and this-reader-only, like the window stack: a position
        // a published page cannot write is not the folio's.
        todoState.floatGeom[todo.id] = geometryOf(f);
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

    /** Crumple it into the trashcan, and take it off the board. */
    function discard(todo) {
      dock(todo);                      // if it was floating, bring it down first
      var slot = slots[todo.id];
      if (slot && slot.parentNode) slot.parentNode.removeChild(slot);
      delete slots[todo.id];
      discardTodo(todo.id);
      if (Object.keys(slots).length === 0 && !grid.querySelector(".fa-sticky-empty")) {
        grid.appendChild(el("p", { class: "fa-sticky-empty" }, "Nothing outstanding."));
      }
      // Focus would otherwise land on <body>, which tells a reader nothing.
      heading.focus();
    }

    /**
     * Where a newly pinned sticky lands, and why it is computed rather than
     * left to the cascade.
     *
     * The layer used to be a small `inset: auto 1rem 1rem auto` box that
     * stacked its children in flow, which is exactly the defect the owner
     * reported as *"you cant move around dispaly"*: the layer decided, and the
     * sticky had no say. It is a full-viewport frame now, so each card carries
     * its own geometry — and the default reproduces the old bottom-right pile,
     * offset per card, so nothing MOVES until a reader moves it.
     *
     * `Math.max(0, …)` for the same reason `nudge` clamps: a card placed past
     * the origin is a card whose controls cannot be reached.
     */
    function placeFloating(card, todo) {
      var saved = todoState.floatGeom[todo.id];
      if (saved) { applyGeometry(card, saved); return; }
      var n = Object.keys(todoState.floating).length;
      var w = Math.min(352, Math.max(240, window.innerWidth - 32));
      var h = card.getBoundingClientRect().height || 120;
      applyGeometry(card, {
        left: Math.max(0, window.innerWidth - w - 16),
        top: Math.max(0, window.innerHeight - h - 16 - n * 12),
        width: w,
        height: h,
      });
    }

    function float(todo) {
      if (todoState.floating[todo.id]) return;
      var card = buildSticky(todo, float, dock, discard);
      card.classList.add("fa-sticky-floating");
      // Focusable so the move mode has somewhere to put focus and the arrow
      // keys have a target. `-1`: it is reached BY the Move control, not by
      // tabbing past every pinned note on the way to the page.
      card.setAttribute("tabindex", "-1");

      // The live region the move mode announces through. One per card, so a
      // reader is told about the sticky they are in rather than the last one
      // anybody touched — the same reason the board window has its own.
      var live = el("span", { class: "fa-sr-only", "aria-live": "polite" });
      card.appendChild(live);

      /* THE MOVE CONTROL. `move` is already declared for the `todo` kind in
       * `panel-chrome.ts` and already mirrored in `KIND_CONTROLS` above — this
       * surface simply never asked for it. Declared and unoffered is the gap
       * `t4my`'s three states are about, and this closes it for the one card
       * that had nowhere to go. */
      var tools = card.querySelector(".fa-sticky-tools");
      if (tools) {
        var moveBtn = el("button", {
          type: "button",
          class: "fa-sticky-move",
          "data-fa-control": "move",
          // Words, not just the glyph: "✜" alone is a guess, and the mode it
          // enters changes what the arrow keys do, which a reader must be told.
          "aria-label": "Move " + todo.summary + " around the page",
          "aria-pressed": "false",
        }, CONTROL_GLYPHS.move);
        moveBtn.addEventListener("click", function () {
          var on = card.getAttribute("data-fa-moving") !== "true";
          setMoveMode(card, on, live);
          moveBtn.setAttribute("aria-pressed", on ? "true" : "false");
        });
        // APPENDED, after the other board gestures. This used to insert
        // before the `⋯` drawer, which no longer exists — the forge links
        // moved out of the card altogether — so the face is Pin, Discard,
        // Move and nothing else. `firstChild` was the version before that
        // and put Move ahead of Pin, which reordered the row every time a
        // card floated; appending keeps the order stable.
        tools.appendChild(moveBtn);
      }

      wireMove(card, card.querySelector(".fa-sticky-head") || card, live);
      layer.appendChild(card);
      placeFloating(card, todo);
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

    // Items this browser discarded are off the board. Filtered HERE rather
    // than at fetch, so `fa:todos-discarded` can re-render without refetching
    // and the published index stays the single source of what exists.
    var hidden = discardedTodoIds();
    var live = items.filter(function (t) { return hidden.indexOf(t.id) === -1; });
    var rows = stackTodos(live, todoState.processes);
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
      slot.appendChild(buildSticky(row.todo, float, dock, discard));
      // BELOW the card, and it stays here when the card is pinned away.
      var links = buildSourceLinks(row.todo);
      if (links) slot.appendChild(links);
      slots[row.todo.id] = slot;
      grid.appendChild(slot);
    }
    if (live.length === 0) {
      grid.appendChild(el("p", { class: "fa-sticky-empty" }, "Nothing outstanding."));
    }

    /* ── Applying the reader's filter ─────────────────────────────────────
     *
     * It hides SLOTS and touches nothing else: no note, no position, no
     * stored preference. A filtered-out card keeps its place on the board and
     * comes back the moment the filter is cleared, because nothing about it
     * changed.
     *
     * `hidden` rather than a class, so the card leaves the accessibility tree
     * too. A reader using a screen reader who filtered to "open" should not
     * still be walked through the done ones.
     */
    function applyReaderFilter() {
      var shown = 0;
      for (var fi = 0; fi < rows.length; fi++) {
        var t = rows[fi].todo;
        var slot = slots[t.id];
        if (!slot) continue;
        var keep = readerShows(readerFilter, t);
        if (keep) { slot.removeAttribute("hidden"); shown++; }
        else slot.setAttribute("hidden", "hidden");
      }
      board.setAttribute("data-fa-filtered", String(shown));
      var none = grid.querySelector(".fa-sticky-filtered-out");
      if (shown === 0 && rows.length > 0 && !none) {
        // A DETERMINED empty, and it says which: "nothing matches this filter"
        // and "nothing outstanding" are opposite facts about the same blank
        // grid, and a reader who cannot tell them apart will clear the wrong
        // thing.
        grid.appendChild(el("p", { class: "fa-sticky-filtered-out" },
          "No card matches this filter. Clearing it brings them all back."));
      } else if (shown > 0 && none) {
        grid.removeChild(none);
      }
    }

    // One select per property a todo carries. Built from the corpus, so a
    // folio whose todos never set a priority simply gets no priority control.
    ["status", "priority"].forEach(function (name) {
      var values = propertyValues(live, name);
      if (values.length < 2) return;   // nothing to choose between
      var id = "fa-filter-" + name;
      var label = el("label", { class: "fa-board-filter-label", for: id }, name);
      var select = el("select", { class: "fa-board-filter-select", id: id });
      select.appendChild(el("option", { value: "" }, "any " + name));
      values.forEach(function (v) { select.appendChild(el("option", { value: v }, v)); });
      select.addEventListener("change", function () {
        if (select.value === "") delete readerFilter.properties[name];
        else readerFilter.properties[name] = [select.value];
        applyReaderFilter();
      });
      filterRow.appendChild(label);
      filterRow.appendChild(select);
    });
    applyReaderFilter();

    // THE SAME TILES, on the board — the other surface of one declaration.
    // Mounted after the grid so the board's own content leads and the
    // visualisations follow: the same argument the landing board uses for
    // putting the harness cards before the todos.
    mountGraphTiles("board", boardTiles, readerShownTiles());

    /* ── Windows, projected ON TO the board ───────────────────────────────
     *
     * A separate layer, and that is the design rather than an implementation
     * detail: an open card is not the card grown large, so it is not in the
     * grid at all. The grid goes on doing semantic zoom — its slot becomes an
     * avatar when the board shrinks — while the window it spawned stays
     * exactly where it was. "An open window survives a zoom-out" is then true
     * by construction, with nothing to special-case.
     */
    var windows = el("div", {
      class: "fa-board-windows",
      role: "group",
      "aria-label": "Open cards",
    });
    board.appendChild(windows);
    var windowEls = {};

    function renderStack() {
      for (var id in windowEls) {
        if (!Object.prototype.hasOwnProperty.call(windowEls, id)) continue;
        var z = zIndexFor(id);
        // `undefined` rather than 0 for a closed card, so "bottom of the
        // stack" and "not on it" cannot be confused — see `window-stack.ts`.
        windowEls[id].style.zIndex = z === undefined ? "" : String(z);
        windowEls[id].setAttribute("data-fa-z", z === undefined ? "" : String(z));
      }
    }

    function closeCard(todo) {
      closeWindowFor(todo.id);
      var w = windowEls[todo.id];
      if (w && w.parentNode) w.parentNode.removeChild(w);
      delete windowEls[todo.id];
      renderStack();
      // Focus returns to the avatar that opened it. A close that leaves focus
      // on <body> tells a reader who cannot see the page nothing at all, and
      // the avatar IS the way back — `l4zi`.
      var slot = slots[todo.id];
      var opener = slot && slot.querySelector(".fa-sticky-avatar");
      if (opener) opener.focus();
      else heading.focus();
    }

    function openCard(todo) {
      openWindowFor(todo.id);
      var existing = windowEls[todo.id];
      if (existing) { renderStack(); existing.focus(); return; }
      var panel = el("div", {
        class: "fa-board-window",
        tabindex: "-1",
        role: "group",
        "aria-label": todo.summary,
        "data-fa-window": todo.id,
      });
      var bar = el("div", { class: "fa-board-window-bar" });
      bar.appendChild(el("span", { class: "fa-board-window-title" }, todo.summary));
      // R7: THE SAME BADGE AS THE AVATAR, from the same query. Not a second
      // count — `nodeBadge` is called once per card and both surfaces render
      // what it returned, which is R6's rule carried onto a second surface.
      var nb = nodeBadge(todo);
      if (nb) bar.appendChild(badgeChip(nb, "window"));

      /* THE CONTROLS. The frame first, then what the kind declared, then what
       * this node can actually serve. A declared control the node cannot serve
       * is HIDDEN and the reason is reported — never rendered as a button that
       * would 404 for exactly the reader who cannot use it (`pb04`). */
      var caps = { "source-read": !!todo.viewHref, "source-write": !!todo.editHref };
      var split = servableControls(controlsFor("todo"), caps);
      // The live region the move mode announces through. One per window, so a
      // reader is told about the window they are in rather than the last one
      // anybody touched.
      var live = el("span", { class: "fa-sr-only", "aria-live": "polite" });
      panel.appendChild(live);

      var handlers = {
        close: function (t) { closeCard(t); },
        move: function () {
          setMoveMode(panel, panel.getAttribute("data-fa-moving") !== "true", live);
        },
        pin: function (t) { float(t); },
        discard: function (t) { closeCard(t); discard(t); },
        // THE FISHBONE. The only control that asks first, because it is the
        // only one whose subject is the content rather than this reader's
        // view of it.
        relocate: function (t, button) {
          var dialog = relocateDialog(t, function () {
            closeCard(t);
            // ONE PATH, shared with `d1r6`: the same function, the same key,
            // the same event the trashcan counter already listens to.
            discard(t);
          });
          (button.closest(".fa-board-window") || document.body).appendChild(dialog);
        },
      };
      for (var ci = 0; ci < split.shown.length; ci++) {
        bar.appendChild(controlButton(split.shown[ci], todo, handlers));
      }
      if (split.hidden.length) {
        // Reported once per panel rather than swallowed: "this kind does not
        // offer edit" and "this deployment cannot serve edit" are different
        // facts, and only one of them is somebody's to fix.
        panel.setAttribute(
          "data-fa-hidden-controls",
          split.hidden.map(function (h) { return h.control.id; }).join(" "),
        );
        for (var hi = 0; hi < split.hidden.length; hi++) {
          console.info("docs-ui: " + todo.id + " — " + split.hidden[hi].because);
        }
      }
      panel.appendChild(bar);
      // The card's own rendering: the kind controls what its panel shows, the
      // platform fixes the frame around it. `compact` because the window
      // already carries the frame's `[x]` — a second Close inside it would be
      // two controls for one act, and they would not agree about what they
      // close. Which controls a kind may declare here is `t4my`'s.
      panel.appendChild(buildSticky(todo, float, dock, discard, { compact: true }));
      // SELECTING ANY PART RAISES — the owner's words, so the listener is on
      // the panel rather than on its title bar. `mousedown` and not `click`,
      // so the raise happens before a control inside the panel acts on it.
      panel.addEventListener("mousedown", function () {
        raiseWindow(todo.id);
        renderStack();
      });
      panel.addEventListener("focusin", function () {
        raiseWindow(todo.id);
        renderStack();
      });

      // The keyboard path and the drag accelerator, both from `wireMove`.
      // They were written inline here first; `ivfw` needed the same behaviour
      // on a floating sticky, and two copies of a move interaction is two
      // notions of position waiting to disagree.
      wireMove(panel, bar, live);
      windows.appendChild(panel);
      windowEls[todo.id] = panel;
      renderStack();
      panel.focus();
    }

    /* ── Semantic zoom, which never asks what is open ─────────────────────
     *
     * Measured on the SLOT's rendered width, in CSS pixels after zoom, which
     * is what `semantic-zoom.ts` says the declared number is about:
     * legibility is a property of what reaches the reader's eye.
     *
     * With no declaration the threshold is `null` and every card keeps its
     * words. That is the third state carried through rather than filled in.
     */
    function applyZoom() {
      for (var id in slots) {
        if (!Object.prototype.hasOwnProperty.call(slots, id)) continue;
        var slot = slots[id];
        var width = slot.getBoundingClientRect().width;
        var avatar = rendersAvatar("todo", width);
        slot.classList.toggle("fa-sticky-slot--avatar", avatar);
        slot.setAttribute("data-fa-avatar", avatar ? "true" : "false");
      }
    }

    if (typeof ResizeObserver === "function") {
      var ro = new ResizeObserver(function () { applyZoom(); });
      // EVERY SLOT, not the grid. The threshold is measured on the slot's own
      // rendered width, and a grid can re-lay its tracks without its own box
      // changing at all — `grid-template-columns` from `400px` to `180px` in a
      // wider container is exactly that. Observing the grid meant the cards
      // never flipped, which looked like the zoom not working and was the
      // observer watching the wrong box.
      for (var oid in slots) {
        if (Object.prototype.hasOwnProperty.call(slots, oid)) ro.observe(slots[oid]);
      }
    } else {
      // No ResizeObserver: the width is still read once and on resize, so the
      // feature degrades to "correct at every layout change the window
      // reports" rather than to "always words".
      window.addEventListener("resize", applyZoom);
    }

    /* ── The avatar that opens the card ───────────────────────────────────
     *
     * Every slot gets one, at every width — the owner's *"start everyrting in
     * avatar"*. It is what semantic zoom leaves behind when the board shrinks
     * and it is the control that opens the window, so the two mechanisms meet
     * at exactly one element and nowhere else.
     *
     * A BUTTON, because this instance's declared interaction profile is
     * low-dexterity and every board action has to be keyboard-operable.
     */
    for (var si = 0; si < rows.length; si++) {
      (function (todo) {
        var slot = slots[todo.id];
        if (!slot) return;
        var open = el("button", {
          type: "button",
          class: "fa-avatar fa-sticky-avatar",
          "data-fa-kind": "todo",
          // WHICH card this avatar opens. The board stacks by BPMN subprocess
          // depth, so DOM order is not the index order of anything a caller
          // holds — an avatar addressed by position is addressed by a fact
          // the board is free to change.
          //
          // `data-fa-opens`, NOT `data-fa-todo`: the linear floor already uses
          // that name for a listing entry, and one attribute over two
          // different objects means every `[data-fa-todo]` selector silently
          // returns both. Caught by `linear-floor.e2e.ts` asserting its
          // listing is not duplicated — which it was not; it had been joined
          // by a control from another surface.
          "data-fa-opens": todo.id,
          "aria-label": "Open " + todo.summary,
          title: todo.summary,
        });
        // R7: a node rendered as its avatar carries the same badge as its open
        // window, from ONE query. `nodeBadge` is the query; both surfaces
        // render its answer, so there is no second count to disagree.
        var ab = nodeBadge(todo);
        if (ab) open.appendChild(badgeChip(ab, "avatar"));
        open.addEventListener("click", function () { openCard(todo); });
        slot.insertBefore(open, slot.firstChild);
      })(rows[si].todo);
    }
    applyZoom();

    /**
     * The way back, and on the landing board it has to be ON THE PAGE.
     *
     * Bean `l4zi`, the owner 2026-09-21: *"clicking on postit display panel,
     * hides it, no place to get it back."*
     *
     * Closing set `hidden` and stopped. On an OVERLAY page that is fine — the
     * board was covering what you were reading, and the launcher's Todos tile
     * re-opens it. On the LANDING board it is not: there the board is page
     * content, so closing it removes a section of the page and leaves nothing
     * where it was. A control two clicks deep inside a collapsed launcher is
     * not "a place to get it back"; it is a place a reader has to already know
     * about.
     *
     * So the inline board collapses to a button in its own position rather
     * than vanishing. Same rule `d1r6` follows for a discarded sticky, which
     * goes somewhere with a way back instead of being deleted: **an action
     * whose inverse is not reachable is not a toggle.**
     */
    var reopen = null;
    function reopenControl() {
      if (reopen) return reopen;
      reopen = el("button", {
        type: "button",
        class: "fa-sticky-board-reopen",
        "aria-label": "Show the todo board — " + live.length + " outstanding",
      }, "Todos (" + live.length + ")");
      reopen.addEventListener("click", function () { setOpen(true); });
      return reopen;
    }

    function setOpen(isOpen) {
      if (isOpen) {
        board.removeAttribute("hidden");
        if (reopen && reopen.parentNode) reopen.parentNode.removeChild(reopen);
        heading.focus();
      } else {
        board.setAttribute("hidden", "hidden");
        if (landing) {
          var b = reopenControl();
          if (!b.parentNode && board.parentNode) board.parentNode.insertBefore(b, board);
          // Focus follows the control that replaced the thing being closed.
          // Left alone it lands on <body>, which tells a reader nothing and
          // loses the keyboard position entirely.
          b.focus();
        }
      }
      return isOpen;
    }
    boardClose.addEventListener("click", function () { setOpen(false); });

    /* ESCAPE CLOSES AN OVERLAY. IT MUST NOT CLOSE A BARE BOARD.
     *
     * Everywhere else this board is an overlay over the page, so Escape
     * dismissing it is the standard gesture. Inside `.fa-sticky-panel` it is
     * page content with no close button (see above), and letting Escape run
     * would produce exactly the state that button was removed to prevent: the
     * board swapped for a "Todos (n)" reopen control INSIDE a panel that is
     * still open, reached by a key the reader pressed for some other reason.
     *
     * The panel's own `<summary>` is the way to close it, and it is one Tab
     * away. So: no handler at all when bare, rather than a handler that
     * checks and returns — an event listener that never acts is a thing the
     * next reader has to prove is dead. */
    if (!bare) {
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !board.hasAttribute("hidden")) setOpen(false);
      });
    }

    /* THE COLLAPSED PANEL'S COUNT has to include what THIS function just
     * mounted, or it understates the thing it exists to declare.
     *
     * `landing.html` renders the panel's summary server-side and can only
     * count the stickies Liquid knows about; the todo cards arrive here,
     * after a fetch. A collapsed panel saying "3" over six cards is the badge
     * defect `rta` pinned a test against — a count that is not the
     * cardinality of the thing it labels.
     *
     * Added to the SERVER'S number, read back from `data-fa-sticky-count`,
     * rather than recomputed from the DOM. The attribute is the one value
     * that does not change when this runs twice; counting `.fa-sticky` nodes
     * would double on a re-mount, and re-reading the text content would
     * compound whatever it wrote last time.
     *
     * No panel (an ordinary page, or a landing page with no stickies) is not
     * a failure — there is simply nothing to relabel, and the board's own
     * heading already carries the count there. */
    var panelCount = document.querySelector(".fa-sticky-panel__count");
    if (panelCount) {
      var declared = parseInt(panelCount.getAttribute("data-fa-sticky-count"), 10);
      // NaN when the attribute is missing or not a number. Falling back to 0
      // would silently drop the stickies from the total and report only the
      // todos, which is a wrong number rather than a missing one.
      if (!isNaN(declared)) panelCount.textContent = String(declared + live.length);
    }

    return {
      toggle: function () { return setOpen(board.hasAttribute("hidden")); },
      count: live.length,
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
    /* ── The two relations, from ONE pass ─────────────────────────────────
     *
     * Mirrors `notesAt()` in `schemas/note-anchor.ts`, including the rule
     * that decides the overlap: a note both attached here AND also-about
     * here counts ONCE, as attached — the stronger relation wins, so a
     * self-referential declaration cannot inflate a badge past the length of
     * the list it labels.
     *
     * Two indexes rather than one because they are two relations, and
     * building them together is what stops a caller computing the badge from
     * one query and rendering the panel from another.
     */
    var attachedBy = {};
    var alsoAboutBy = {};
    for (var i = 0; i < items.length; i++) {
      var t = items[i];
      if (t.targetLabel) {
        (attachedBy[t.targetLabel] = attachedBy[t.targetLabel] || []).push(t);
      }
      var also = t.alsoAbout || [];
      for (var ai = 0; ai < also.length; ai++) {
        var lbl = also[ai] && also[ai].label;
        // The overlap rule: already attached here, so not counted again.
        if (!lbl || lbl === t.targetLabel) continue;
        (alsoAboutBy[lbl] = alsoAboutBy[lbl] || []).push(t);
      }
    }

    var heads = document.querySelectorAll("[data-fa-label]");
    var placed = 0;
    for (var h = 0; h < heads.length; h++) {
      var head = heads[h];
      var label = head.getAttribute("data-fa-label");
      var mine = attachedBy[label];
      if (!mine || mine.length === 0) continue;

      var host = el("div", { class: "fa-sticky-inline" });

      /* ── The panel FIRST, then the badge from what it rendered ──────────
       *
       * R6: *the badge's count SHALL be the cardinality of the query the
       * panel renders.* Stated as a requirement it is a property somebody
       * has to keep true; built this way it is one the code cannot break,
       * because the number is read off the panel's own children rather than
       * recomputed from anything. **A badge that can disagree with its own
       * panel is the defect to design out** — so there is no second count to
       * go out of step.
       */
      var list = el("div", { class: "fa-sticky-inline-list", hidden: "hidden" });
      (function (list, mine) {
        for (var k = 0; k < mine.length; k++) {
          /* A CELL, for the same reason the board uses a slot: the source
           * links live BELOW the sticky now, not inside it, so something has
           * to hold the pair. An inline sticky keeps them when it loses Pin,
           * Close and Discard — that is the point of the inline case, which
           * drops the BOARD's controls and keeps the content object's. */
          var cell = el("div", { class: "fa-sticky-cell" });
          cell.appendChild(buildSticky(mine[k], function () {}, function () {}, function () {}, { compact: true }));
          var inlineLinks = buildSourceLinks(mine[k]);
          if (inlineLinks) cell.appendChild(inlineLinks);
          list.appendChild(cell);
        }
      })(list, mine);
      var shown = list.children.length;

      var badge = el("button", {
        type: "button",
        class: "fa-sticky-badge",
        "aria-expanded": "false",
        // THE EXACT NUMBER, always — R5's threshold is a DENSITY decision
        // about the visual, and a screen-reader user must not be told less
        // than a sighted one. `note`/`notes` rather than "todo(s)": a reader
        // hears the label, and "(s)" is a written convention.
        "aria-label": shown + (shown === 1 ? " note" : " notes") + " on this section",
        "data-fa-notes": String(shown),
      });
      badge.innerHTML = STICKY_GLYPH;
      // R5, the owner: *"badge of # if > 1"*. One note gets the icon and no
      // number — the icon already says there is something here.
      if (shown > 1) {
        badge.appendChild(el("span", { class: "fa-sticky-badge-count" }, String(shown)));
      }
      // The secondaries at this label, recorded and deliberately NOT added to
      // the badge. Published so a test can prove they were present and still
      // did not inflate it: an assertion over a page with no secondaries at
      // all would pass for an implementation that counted them.
      host.setAttribute("data-fa-also-about", String((alsoAboutBy[label] || []).length));

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
      // `shown`, not `mine.length`: the same rule one level out. `placed`
      // is reported as how many notes reached the page, and reading it off
      // the intent rather than the result would let the two disagree exactly
      // where the badge no longer can.
      placed += shown;
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

  /* ═══ The linear floor ════════════════════════════════════════════════
   *
   * `_includes/generated/todo-listing.html` puts every note into the bytes the
   * server sends, in document order. That listing is the ARTEFACT; the board
   * is an overlay over it. Owner: "this dymanic moving state is overlayed, its
   * an 'extra'. on stndard folio just simple tile based listing."
   *
   * ## Collapsed, never removed
   *
   * When the board is available this collapses the listing into a `<details>`
   * so the page is not showing the same notes twice. It does NOT remove it,
   * hide it from assistive technology, or set `display: none` on it, and the
   * reason is bean `l4zi`: an action whose inverse is not reachable is not a
   * toggle. A reader who cannot use the board — or who simply wants the
   * printable list — reaches it by opening one disclosure, with the keyboard,
   * from any page.
   *
   * ## Why this runs at mount rather than at page load
   *
   * The listing must stay OPEN when the board did not mount, and "did not
   * mount" includes the two cases a reader cannot distinguish from the
   * outside: the index failed to load, and this script never ran at all. Both
   * leave the floor exactly as the server sent it, which is the correct
   * result in both.
   */
  function collapseFloor(count) {
    var floor = document.getElementById("fa-todo-listing");
    if (!floor || floor.dataset.faCollapsed === "1") return;
    floor.dataset.faCollapsed = "1";
    var details = el("details", { class: "fa-todo-listing-details" });
    var summary = el(
      "summary",
      { class: "fa-todo-listing-toggle" },
      "Linear listing (" + count + ")",
    );
    details.appendChild(summary);
    floor.parentNode.insertBefore(details, floor);
    // MOVED, not copied: two copies of a note in one document is two answers
    // to "how many are open", and a screen reader would read both.
    details.appendChild(floor);

    // PRINT. A printed page has no board, so the floor is the only listing
    // there is — and a closed `<details>` cannot be revealed by a stylesheet
    // in Chromium, which hides its contents with `content-visibility` on an
    // internal slot. A `@media print` rule would look like it worked and
    // print nothing, so the disclosure is opened here and put back after.
    if (typeof window.addEventListener === "function") {
      var wasOpen = false;
      window.addEventListener("beforeprint", function () {
        wasOpen = details.open;
        details.open = true;
      });
      window.addEventListener("afterprint", function () {
        details.open = wasOpen;
      });
    }
  }

  /** Fetch, then mount the board and hand the launcher a way to open it. */
  function mountTodoStickies() {
    // The threshold FIRST, because the board applies it as it mounts. Its
    // absence is a real answer and does not block anything: `fetchZoom` calls
    // back either way, and a board with no declaration keeps every card's
    // words rather than waiting for a number that is never coming.
    fetchZoom(function () {
    fetchTodoIndex(function (items) {
      if (items === null) return;
      todoState.items = items;
      var board = mountTodoBoard(items);
      if (!board) return;
      mountPageStickies(items, board);
      collapseFloor(items.length);
      window.__faTodoBoard = board;
      document.dispatchEvent(new CustomEvent("fa:todos-ready", { detail: board }));
    });
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

    var supported = meta.supportedLocales || UN_LOCALES;
    var available = localesAvailable(meta, supported);
    var totalLangs = supported.length;
    var availLangs = available.length;

    // Auto-detect available locales from the page's own language links if
    // the pipeline hasn't stamped availableLocales yet. Scans whatever carries
    // `data-locale`, which is what `buildLanguageBar` above emits — it used to
    // read a `_includes/language-selector.html`, deleted once this file did the
    // same job better (it greys out untranslated locales, which that include
    // only promised in a comment).
    //
    // The trigger is `<= 1`, not `=== 0`: a page whose only available locale is
    // its own source language has nothing stamped either, and under the old
    // `=== 0` test that case stopped reaching this fallback the moment the
    // source language joined the count. It also no longer drops `meta.lang`
    // from what it finds — the page's own language is one of the answers, which
    // is the whole correction here.
    if (availLangs <= 1) {
      var langLinks = document.querySelectorAll(".fa-lang-tab, [data-locale]");
      var found = {};
      if (meta.lang) found[meta.lang] = true;
      langLinks.forEach(function (link) {
        var loc = link.getAttribute("data-locale") || link.textContent.trim().toLowerCase();
        if (loc) found[loc] = true;
      });
      var detected = supported.filter(function (loc) { return found[loc] === true; });
      if (detected.length > availLangs) {
        availLangs = detected.length;
        available = detected;
      }
    }

    // Find the page title (first h1 in main content)
    var title = document.querySelector(".main-content h1, #main-content h1");
    if (!title) return;

    // Create badge container — block-level row below the title
    // No `style` here, and none on either badge below. Every colour this row
    // used to carry inline is a per-scheme token in `docs-ui.css` now, with its
    // measured ratio written beside it -- bean `n7vv`. The container is also
    // where those tokens are DECLARED, so a badge outside this row would resolve
    // none of them, which is the intended failure rather than a silent default.
    var container = el("span", { class: "fa-translation-badges" });

    // Language coverage badge — always shown.
    //
    // Green means EVERY supported language, not "all but one": the old test was
    // `availLangs >= totalLangs - 1`, the same off-by-one the fraction carried,
    // and it painted a page missing a whole language as complete. Amber is now
    // the source language plus at least one translation; grey is the source
    // language alone, which is the honest resting state of an untranslated page
    // and is no longer indistinguishable from "no languages at all".
    var langState = availLangs >= totalLangs
      ? "is-ok"
      : availLangs > 1 ? "is-partial" : "is-idle";

    var langBadge = el("span", {
      class: "fa-translation-badge fa-lang-coverage-badge " + langState,
      // Three wordings, because the fraction alone does not say which case it
      // is. The "of <every supported locale>" tail is what makes a partial
      // count actionable -- it names the languages still missing -- and is
      // dropped when the two lists are equal, where it read "available in:
      // ar, zh, en, fr, ru, es -- of ar, zh, en, fr, ru, es".
      title: availLangs >= totalLangs
        ? "Available in every supported language: " + available.join(", ")
        : availLangs > 1
          ? "Available in: " + available.join(", ") + " \u2014 of " + supported.join(", ")
          : "Available in " + (available[0] || meta.lang || "its source language") +
            " only; not yet translated"
    }, "\uD83C\uDF10 " + availLangs + "/" + totalLangs + " languages");
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
    var sweepState, sweepIcon, sweepLabel, sweepTitle;
    if (!sweep.run) {
      sweepState = "is-idle"; sweepIcon = "\u2B58";
      sweepLabel = "QA: not run";
      sweepTitle = "Translation QA sweep has not been run. " +
                   "Run: bun run content/pipeline/translation-qa-sweep.ts";
    } else if (sweep.complete && sweep.pagesWithTranslations > 0) {
      var ratio = sweep.pagesWithTranslations + "/" + sweep.totalPages;
      sweepState = "is-ok"; sweepIcon = "\u2705";
      sweepLabel = "Swept " + ratio;
      sweepTitle = "QA sweep complete. " + sweep.pagesWithTranslations + " of " +
                   sweep.totalPages + " pages have translations. Last run: " + sweep.sweptAt;
    } else {
      sweepState = "is-partial"; sweepIcon = "\u26A0\uFE0F";
      sweepLabel = "Swept 0/" + sweep.totalPages;
      sweepTitle = "QA sweep complete but no pages have translations yet. " +
                   "Last run: " + sweep.sweptAt;
    }

    var sweepBadge = el("span", {
      class: "fa-translation-badge fa-sweep-badge " + sweepState,
      title: sweepTitle
    }, sweepIcon + " " + sweepLabel);
    container.appendChild(sweepBadge);

    /* Unverified translation notice — ONE LINE, opening to the detail.
     *
     * Owner, 2026-09-21, on a translated page: *"should be a slim one line
     * '⚠️ Unverified translation — This page has been translated
     * automatically and has not been reviewed by a subject-matter expert.'
     * which then can open to the full trnslation QA report."*
     *
     * It was four lines of banner above the page title — the warning, the
     * source, and two tool names a reader cannot run from a browser. On a
     * translated page that is the first thing between the reader and the
     * content they came for, every page, permanently.
     *
     * ## `role="alert"` is gone, and that is not a downgrade
     *
     * An alert demands immediate announcement and is for something that has
     * just happened. This is a standing property of the page, true before
     * the reader arrived and still true when they leave. As a `<summary>`
     * it is in the tab order, states its own expanded/collapsed state, and
     * can be returned to — which an alert that fires once cannot.
     *
     * ## "The full report" is the EXISTING panel, not a second one
     *
     * The page already carries a Translation QA badge that opens a panel
     * over the real sidecar. Restating its contents here would be a second
     * answer to one question, free to disagree — the defect this file warns
     * about in several other places. So the drawer holds the two facts that
     * are NOT in that panel (which file this translates, and how to sign it
     * off) and a control that opens the panel itself.
     *
     * The badge is looked up AT CLICK TIME, not here: it is built further
     * down this same function, so it does not exist yet. When there is no
     * badge — a page with no projection — the control is not drawn at all
     * rather than drawn dead (`pb04`).
     */
    if (meta.translationStatus === "unverified" && !document.querySelector(".fa-translation-warning")) {
      var warning = el("details", { class: "fa-translation-warning" });
      var warnSummary = el("summary", { class: "fa-translation-warning__line" });
      warnSummary.innerHTML =
        "\u26A0\uFE0F <strong>Unverified translation</strong> \u2014 " +
        "This page has been translated automatically and has <strong>not been reviewed</strong> by a subject-matter expert.";
      warning.appendChild(warnSummary);

      var warnBody = el("div", { class: "fa-translation-warning__body" });
      warnBody.innerHTML =
        (meta.translationSource
          ? "<p><strong>Source:</strong> " + meta.translationSource + " (English)</p>"
          : "") +
        "<p><strong>How to verify:</strong> Run <code>translation_signoff</code> after SME review, " +
        "or use <code>translation_validate</code> to check for staleness and coverage.</p>";
      warning.appendChild(warnBody);

      if (meta.translationQa && meta.translationQa.src) {
        var openReport = el("button", {
          type: "button",
          class: "fa-translation-warning__report",
        }, "Open the translation QA report");
        openReport.addEventListener("click", function () {
          var badge = document.querySelector('.fa-qa-badge[data-qa-family="translation"]');
          // Absent is a real state and is REPORTED, not swallowed: a button
          // that silently does nothing is worse than one that is not there,
          // and this path is only reachable if the badge failed to build
          // after `translationQa.src` promised it.
          if (badge) badge.click();
          else console.warn("docs-ui: no translation QA badge to open; the page declared a " +
                            "projection at " + meta.translationQa.src + " but no badge was built.");
        });
        warnBody.appendChild(openReport);
      }

      var mainContent = document.querySelector(".main-content, #main-content");
      if (mainContent && mainContent.firstChild) {
        mainContent.insertBefore(warning, mainContent.firstChild);
      }
    }

    // A HAND-AUTHORED page has no generator to write its badge into the
    // markup, so it is built here from the paths `head_custom.html` published.
    // Those paths are STRUCTURE — `_data/translation-qa-pages.json` says a
    // projection exists, never what it found — so this badge is emitted only
    // where there is something to open, and `paintQaBadges` (which runs right
    // after `mountTranslationBadges`) fetches its state from the same
    // `qa-index.json` every other badge uses.
    //
    // Deliberately identical markup to the generated one, down to the
    // `fa-qa-pending` class and the `…` glyph: one badge, one painter, one
    // panel. A second shape here would be a second set of states to keep in
    // step with the first.
    var tq = meta.translationQa;
    if (tq && tq.src && tq.index && !document.querySelector(".fa-page-qa-badges")) {
      var tqBadge = el("button", {
        type: "button",
        class: "fa-qa-badge fa-qa-pending fa-qa-fam-translation",
        "data-qa-family": "translation",
        "data-qa-key": tq.key || "page.translation",
        "data-qa-label": "Translation QA",
        "data-qa-noun": "page",
        "data-qa-src": tq.src,
        "data-qa-index": tq.index,
        "aria-expanded": "false",
        "aria-busy": "true",
        title: "Translation QA: loading the verdict…",
        "aria-label": "Translation QA: loading the verdict…"
      });
      tqBadge.appendChild(el("span", { class: "fa-qa-tag" }, "TR"));
      tqBadge.appendChild(el("span", { class: "fa-qa-glyph", "aria-hidden": "true" }, "…"));
      container.appendChild(tqBadge);
    }

    // The page-level QA badges the generator emitted under the h1 join this
    // row rather than standing as a second one. They are SERVER-rendered,
    // because whether a page's blocks carry any translation verdict is
    // structure — the same argument `gen-docs-pages.ts` makes for the per-node
    // icons — and they are moved rather than rebuilt here so there is exactly
    // one place that knows their markup.
    var pageQa = document.querySelector(".fa-page-qa-badges");
    if (pageQa) {
      while (pageQa.firstChild) container.appendChild(pageQa.firstChild);
      // The now-empty span, and the paragraph kramdown wrapped it in when that
      // span was the whole line. Left behind, the paragraph keeps its margins
      // and opens a gap under the title that looks like a rendering fault.
      var host = pageQa.parentNode;
      pageQa.parentNode.removeChild(pageQa);
      if (host && host.tagName === "P" && host.textContent.trim() === "" &&
          host.children.length === 0 && host.parentNode) {
        host.parentNode.removeChild(host);
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
    // On a page-level roll-up one panel carries verdicts about many blocks, so
    // the row has to say WHICH — a `fail` with no subject is a page-wide alarm
    // a reader cannot act on. Absent on a per-block panel, where the doc's own
    // subject already says it.
    if (c.block) {
      btn.appendChild(el("span", { class: "fa-qa-chip fa-qa-block" }, c.block));
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
      var a = el("a", { class: "fa-qa-sidecar-link", href: safeHref(REPO_BLOB + p), rel: "noopener" }, p);
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

  /* ── Badge verdicts, fetched rather than baked in ─────────────────────── */

  /**
   * The state mark, and it has to say GOOD or BAD without a legend.
   *
   * Moved here from `scripts/gen-docs-pages.ts` when the badges stopped
   * carrying their verdict in the markup (bean `d2kp`). The reasoning is the
   * generator's and is kept verbatim because it was paid for:
   *
   * `● ◐ ○ ·` shipped in #274 and was reported unreadable by the first person
   * to use it: filled-vs-open circles encode a scale, but nothing in them says
   * which end is the good one, and at 0.75rem `●` and `·` differ only in size.
   * `✓ ! ✕` carry their meaning on their own, survive monochrome, and keep
   * colour as reinforcement rather than as the message.
   *
   * **Two states carry no mark at all, and they are not the same state.**
   * `empty` is a subject that WAS swept and whose every criterion came back
   * `n/a`; a subject nobody has swept never reaches this map, because the
   * generator renders it server-side as a dulled `<span>` — there is nothing
   * to fetch and nothing to open. Any glyph on either would be a claim about a
   * check that returned no verdict.
   *
   * **`unknown` is the third state and it is NOT a quiet pass.** `?` is loud
   * on purpose: a badge that could not read its verdict must not look like one
   * that read a clean one. This repository has paid for that collapse before —
   * an absent simulators directory rendered as "this folio has no simulators",
   * replacing a correct nine-row table.
   */
  var QA_GLYPH = { fail: "✕", warn: "!", pass: "✓", empty: "", unknown: "?" };

  /** Every class this painter owns, so painting twice cannot leave two on. */
  var QA_STATE_CLASSES = [
    "fa-qa-pending", "fa-qa-fail", "fa-qa-warn", "fa-qa-pass",
    "fa-qa-empty", "fa-qa-unknown"
  ];

  /** One fetch per page index, shared by every badge that names it. */
  var QA_INDEX_CACHE = {};

  /**
   * The counts line, shared by the icon's tooltip and its accessible name.
   *
   * `n/a` and `unknown` are reported, never folded into the others: a criterion
   * that did not apply and one the sidecar holds no verdict for are different
   * facts, and both are the reader's business. Lifted from the generator with
   * its wording intact, so the badge reads as it always did.
   */
  function qaBadgeTitle(label, noun, state, counts) {
    if (state === "unknown") {
      return label + ": could not determine — this page's verdict index could not be read";
    }
    if (state === "empty") {
      return label + ": swept, and no criterion applied to this " + noun +
        " — open for witnesses";
    }
    var c = counts || {};
    var parts = [
      (c.fail || 0) + " fail", (c.warn || 0) + " warn",
      (c.pass || 0) + " pass", (c.na || 0) + " n/a"
    ];
    if (c.unknown > 0) parts.push(c.unknown + " no verdict");
    return label + ": " + parts.join(", ") + " — open for witnesses";
  }

  /**
   * Paint one badge into one of the three determinable outcomes.
   *
   * `entry` is the index row for this badge, or null for could-not-determine.
   * A row whose `state` is the projector's `unswept` becomes `empty` here: the
   * projector uses one word for "nothing ruled on this" whatever the reason,
   * and by the time a row EXISTS the subject has demonstrably been swept.
   */
  function qaPaintBadge(badge, entry) {
    var label = badge.getAttribute("data-qa-label") || "QA";
    var noun = badge.getAttribute("data-qa-noun") || "subject";
    var state = entry ? (entry.state === "unswept" ? "empty" : entry.state) : "unknown";
    if (!QA_GLYPH.hasOwnProperty(state)) state = "unknown";

    QA_STATE_CLASSES.forEach(function (c) { badge.classList.remove(c); });
    badge.classList.add("fa-qa-" + state);

    var title = qaBadgeTitle(label, noun, state, entry && entry.counts);
    badge.setAttribute("title", title);
    badge.setAttribute("aria-label", title);
    badge.removeAttribute("aria-busy");

    // The glyph node is replaced rather than left in place with new text: a
    // state with no mark must contribute nothing to the accessible name, and
    // an empty `<span>` beside the tag still opens a gap in the flex row.
    var glyph = badge.querySelector(".fa-qa-glyph");
    var mark = QA_GLYPH[state];
    if (mark === "") {
      if (glyph) glyph.parentNode.removeChild(glyph);
      return;
    }
    if (!glyph) {
      glyph = el("span", { class: "fa-qa-glyph", "aria-hidden": "true" });
      badge.appendChild(glyph);
    }
    glyph.textContent = mark;
  }

  /**
   * Fetch each page's verdict index and paint the badges that named it.
   *
   * **Why the page no longer carries the verdict.** `gen-docs-pages.ts` used
   * to write the state class, the glyph and the counts straight into
   * `docs/*.md`, which made a generated page stale every time a sweep changed
   * its mind. Bean `d2kp` measured both halves of the damage: twelve pages
   * stale on `main`, one of them because the graph got BETTER, and a published
   * page telling readers a knowledge-graph check failed on
   * `publication-workflow.md` when it passed. A document that carries a
   * measurement does not go stale loudly; it goes stale by lying.
   *
   * **One request per page, not one per badge.** `publication-workflow` has 39
   * badges over 21 projections totalling 376 KB. The index holds the state and
   * the counts only, so it is a few kilobytes; the projection behind a badge
   * is still fetched on click, by `qaToggle`, exactly as before.
   *
   * **A failure paints `unknown`, never a verdict.** No network, a 404, a body
   * that is not JSON, or an index that has no row for this badge all land in
   * the same honest place: the reader is told the verdict could not be
   * determined, and the badge still opens — `qaToggle` fetches the projection
   * itself and says which file it could not read if that fails too.
   */
  function paintQaBadges(root) {
    var scope = root || document;
    var badges = scope.querySelectorAll(".fa-qa-badge[data-qa-index]");
    if (badges.length === 0) return;

    var byIndex = {};
    Array.prototype.forEach.call(badges, function (b) {
      var src = b.getAttribute("data-qa-index");
      (byIndex[src] = byIndex[src] || []).push(b);
    });

    Object.keys(byIndex).forEach(function (src) {
      var group = byIndex[src];
      function paintAll(doc) {
        group.forEach(function (b) {
          var key = b.getAttribute("data-qa-key");
          var row = doc && doc.badges && key ? doc.badges[key] : null;
          qaPaintBadge(b, row || null);
        });
      }
      if (QA_INDEX_CACHE[src]) { paintAll(QA_INDEX_CACHE[src]); return; }
      fetch(src, { credentials: "same-origin" })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        })
        .then(function (doc) { QA_INDEX_CACHE[src] = doc; paintAll(doc); })
        .catch(function () { paintAll(null); });
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
    paintQaBadges();
    // THE GLASS FIRST, and unconditionally. It is the reader's folio rather
    // than this page's furniture, so it must not inherit any of the guards
    // that decide whether a BOARD mounts — see `mountGlass`.
    mountGlass();
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
