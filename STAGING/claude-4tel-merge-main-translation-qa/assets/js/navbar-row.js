/* THE HARNESS ICON ROW, ONE MECHANISM FOR EVERY NAVBAR — beans `lhvt`, `9rq1`.
 *
 * Owner, 2026-10-05: *"this should be a common navbar functionality in
 * harness"*, then, choosing how: *"1. Small shared script"*.
 *
 * WHY THIS IS ITS OWN FILE. The row was drawn by `mountNavIconRow` inside
 * `docs-ui.js`, so it existed only where that 589 KB script loads. Measured on
 * the built main site after #2149: 2,709 of the 2,747 pages railed by
 * `lib/navbar.ts` never load it — the TypeDoc `api/*` pages, `auto-docs`, the
 * schema, voice and upload viewers — so they carried the row's DATA
 * (`#fa-navbar-row`, written by `injectRail`) and nothing drew it. This file
 * is the drawing, small enough for every railed page to load.
 *
 * TWO MODES, ONE DRAWING.
 *
 * - FULL — `docs-ui.js` calls `FaNavbarRow.mount(hooks)`. The fsh-guts slot is
 *   the button whose dialog and live count `docs-ui.js` wires, the launcher
 *   proxies its actions panel, and `hooks.after` appends the light/dark switch.
 * - LITE — no `docs-ui.js` on the page. The row draws what works without it:
 *   the link slots, and fsh-guts as a link to its own page. The launcher is
 *   LEFT OUT, not greyed — owner, 2026-10-05: *"1. Leave it out"* — because
 *   the panel it opens is built by `docs-ui.js`, and these pages never had it.
 *
 * FULL REPLACES LITE, never the other way. `folio-mount.ts` appends
 * `docs-ui.js` from an inline script, so on those pages the two files may run
 * in either order; whichever arrives second, the row ends up full.
 *
 * The glyphs are copies of `docs-ui.js`'s, which still draws them on its tiles.
 * `navbar-row.test.ts` fails the moment the two copies differ.
 */
(function () {
  "use strict";

  if (window.FaNavbarRow) return;   // loaded twice: the first copy already ran

  /* The site's base, from this script's own address — the same derivation
   * `docs-ui.js` makes for itself (`SCRIPT_BASE`, bean `zrvt`). A railed page
   * outside the theme carries no `fa-baseurl` meta, so this is the only way it
   * learns that the site is published under `/folio-assistant/`. Read once:
   * `document.currentScript` is only set during first evaluation. */
  var SCRIPT_BASE = (function () {
    try {
      var cs = document.currentScript;
      if (!cs || !cs.src) return "";
      var path = new URL(cs.src, location.href).pathname;
      var suffix = "/assets/js/navbar-row.js";
      return path.slice(-suffix.length) === suffix ? path.slice(0, -suffix.length) : "";
    } catch (_e) {
      return "";
    }
  })();

  /* The site root, in order: the theme's `fa-baseurl` meta; then the
   * `data-fa-root` `injectRail` writes on the row's data — relative on the
   * platform's own site, the platform's absolute address on a folio's site,
   * and the ONLY answer for an inlined copy of this script, which has no
   * address of its own; then this script's own address. */
  /* THE ADDRESS THIS DOCUMENT WAS LOADED FROM, not where the address bar is
   * now. `data-fa-root` is RELATIVE to the document, and a page may
   * `history.replaceState` before this runs: the library page turns a legacy
   * `#instance/id` into `<lib>/<instance>/<id>/`, one segment deeper, so a
   * root resolved against `location.href` afterwards came out one level too
   * deep and the count fetches 404'd — on some loads only, by which ran
   * first (measured: 6 of 12 loads of `library/smart-base/#smart-base%2F…`).
   * The navigation entry keeps the URL the document was fetched from. */
  function loadedFrom() {
    try {
      var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
      if (nav && nav.name) return nav.name;
    } catch (_e) { /* older engines: the address bar is the best there is */ }
    return location.href;
  }

  function siteBaseurl() {
    var meta = document.querySelector('meta[name="fa-baseurl"]');
    var v = (meta && meta.getAttribute("content")) || "";
    if (v) return v.replace(/\/+$/, "");
    var data = document.getElementById("fa-navbar-row");
    var root = data && data.getAttribute("data-fa-root");
    if (root) {
      try {
        var u = new URL(root.replace(/\/*$/, "/"), loadedFrom());
        var path = u.pathname.replace(/\/+$/, "");
        return u.origin === location.origin ? path : u.origin + path;
      } catch (_e) { /* fall through to the script's own address */ }
    }
    return SCRIPT_BASE;
  }

  /** A site-root path, composed against this deploy's base — as `docs-ui.js`'s `withBase`. */
  function withBase(href) {
    if (typeof href !== "string" || href.charAt(0) !== "/") return href;
    return siteBaseurl() + href;
  }

  var ALLOWED_URL_SCHEMES = ["http:", "https:", "mailto:", "tel:"];

  /** The same href guard as `docs-ui.js` (`href-safety.test.ts` holds both). */
  function safeHref(url) {
    if (url === undefined || url === null) return undefined;
    var stripped = String(url).replace(/[\u0009\u000A\u000D]/g, "");
    var trimmed = stripped.replace(/^[\u0000- ]+/, "").replace(/[\u0000- ]+$/, "");
    if (trimmed === "") return undefined;
    if (trimmed.indexOf("//") === 0) return undefined;
    if (/^[#?./]/.test(trimmed) || !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return trimmed;
    var scheme = trimmed.slice(0, trimmed.indexOf(":") + 1).toLowerCase();
    return ALLOWED_URL_SCHEMES.indexOf(scheme) === -1 ? undefined : trimmed;
  }

  /** An element; an absent attribute value means an absent attribute. */
  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (attrs[k] === undefined || attrs[k] === null) return;
      node.setAttribute(k, attrs[k]);
    });
    if (text != null) node.textContent = text;
    return node;
  }

  var STICKY_GLYPH =
    '<svg class="fa-tile-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M5 3h10l4 4v14H5z" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linejoin="round"/><path d="M15 3v4h4" fill="none" stroke="currentColor" ' +
    'stroke-width="1.6" stroke-linejoin="round"/></svg>';
  var BEANS_GLYPH =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
    '<g transform="translate(8.4,8.6) rotate(-32)">' +
    '<ellipse rx="5.6" ry="3.7"/><path d="M-1.9 0.7A2.3 2.3 0 0 1 1.9-0.4"/></g>' +
    '<g transform="translate(15.6,15.4) rotate(26)">' +
    '<ellipse rx="5.6" ry="3.7"/><path d="M-1.9 0.7A2.3 2.3 0 0 1 1.9-0.4"/></g>' +
    "</g></svg>";
  var PROCESS_GLYPH =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<rect x="2.5" y="8" width="7" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/>' +
    '<rect x="14.5" y="8" width="7" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/>' +
    '<path d="M9.5 11h5M13 9.5 14.5 11 13 12.5" fill="none" stroke="currentColor" stroke-width="1.3"/>' +
    "</svg>";
  var NET_GLYPH =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M12 4.5 5 9.5M12 4.5l7 5M5 9.5l3.5 8M19 9.5l-3.5 8M8.5 17.5h7M5 9.5h14" ' +
    'fill="none" stroke="currentColor" stroke-width="1.3"/>' +
    '<g fill="currentColor">' +
    '<circle cx="12" cy="4.5" r="2.1"/><circle cx="5" cy="9.5" r="2.1"/>' +
    '<circle cx="19" cy="9.5" r="2.1"/><circle cx="8.5" cy="17.5" r="2.1"/>' +
    '<circle cx="15.5" cy="17.5" r="2.1"/></g>' +
    "</svg>";
  var TILES_GLYPH =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">' +
    '<rect x="3" y="3" width="6" height="6" rx="1.4"/>' +
    '<rect x="15" y="3" width="6" height="6" rx="1.4"/>' +
    '<rect x="3" y="15" width="6" height="6" rx="1.4"/>' +
    '<rect x="15" y="15" width="6" height="6" rx="1.4"/>' +
    '<rect x="9.5" y="9.5" width="5" height="5" rx="1.2"/>' +
    "</svg>";
  var FISH_GLYPH =
    '<svg class="fa-tile-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M2 12c3-4 7-6 11-6s7 2 9 6c-2 4-5 6-9 6s-8-2-11-6z" fill="none" ' +
    'stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<path d="M22 12l-3-3v6z" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linejoin="round"/>' +
    '<path d="M7.2 10.2l2 2m0-2l-2 2" fill="none" stroke="currentColor" ' +
    'stroke-width="1.6" stroke-linecap="round"/></svg>';

  /* FIVE DISTINCT DRAWINGS: a fallback to NET_GLYPH alone would give four of
   * the five slots the same picture. */
  var ROW_GLYPHS = {
    todos: STICKY_GLYPH, beans: BEANS_GLYPH, processes: PROCESS_GLYPH,
    kg: NET_GLYPH, launcher: TILES_GLYPH, "fsh-guts": FISH_GLYPH
  };
  function rowGlyph(id) {
    return Object.prototype.hasOwnProperty.call(ROW_GLYPHS, id) ? ROW_GLYPHS[id] : NET_GLYPH;
  }

  var LABELS = {
    todos: "Todos", beans: "Beans", processes: "Processes",
    kg: "Knowledge graph", launcher: "More actions", "fsh-guts": "fsh-guts, discarded items"
  };

  /** The row's data: `undefined` when the page carries none or it is unreadable, `null` when the instance declares no row. */
  function readNavbarRow() {
    var node = document.getElementById("fa-navbar-row");
    if (!node) return undefined;
    var text = (node.textContent || "").trim();
    if (text === "" || text === "null") return null;   // declared nothing
    try {
      var parsed = JSON.parse(text);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (_e) {
      console.warn("navbar-row: #fa-navbar-row is not valid JSON; the navbar icon row " +
                   "was not mounted.");
      return undefined;
    }
  }

  /** The page's navbar: the theme's sidebar first — a page carries one or the other, never both. */
  function navbar() {
    return document.querySelector(".side-bar") || document.querySelector("nav.fa-nav");
  }

  /* A link to a slot's published page, or — DECLARED AND NOT PUBLISHED — a
   * non-link that says why in its accessible name (`pb04`: a dead link invites
   * a click and reads as a broken site; a silent omission answers "where is
   * beans" with nothing). Every control carries `data-fa-tip`, the SAME string
   * as its `aria-label` (`ob3m` finding 1). */
  /* COUNT BADGES ON TODOS AND BEANS — owner, 2026-10-05: *"why no count on
   * beans and todos on LHS top navbar as badges like fsh-guts has?"* (bean
   * `gkv6`). Fetched, never baked into the page: a number written at build
   * time is the build's, not this reader's, and would make every bean change
   * restale every railed page. `count.json` is the tiny file `gen-docs-pages.ts`
   * writes beside each index (the bean index is ~900 KB). Beans count OPEN
   * work, the owner's choice. The same four states as the fish: `pending`,
   * `some`/`zero`, `error` ("?"), and `absent` (nothing published: hidden).
   * The tooltip IS the accessible name, so the number goes into both. */
  var COUNTED = { todos: "outstanding", beans: "open" };
  var countCache = {};
  function fetchCount(id, done) {
    if (countCache[id]) return countCache[id].then(done);
    var url = withBase("/assets/" + id + "/count.json");
    countCache[id] = (typeof fetch === "function" ? fetch(url) : Promise.reject(new Error("no fetch")))
      .then(function (r) {
        // The body is CONSUMED on every path: an unread 404 body leaves the
        // request open, which held a test's `networkidle` for its full 180 s.
        if (r.status === 404) return r.text().then(function () { return { absent: true }; }, function () { return { absent: true }; });
        if (!r.ok) return r.text().then(function () { throw new Error("HTTP " + r.status); });
        return r.json().then(function (doc) {
          var n = doc && doc.tile && doc.tile[id] && doc.tile[id].count;
          if (typeof n !== "number") throw new Error("no tile." + id + ".count");
          return { n: n };
        });
      })
      .catch(function (e) { return { error: e.message }; });
    return countCache[id].then(done);
  }
  function countBadge(a, id, label) {
    a.classList.add("fa-nav-icon--counted");
    var badge = el("span", { class: "fa-nav-count", "data-fa-count-state": "pending", "aria-hidden": "true" }, "\u2026");
    a.appendChild(badge);
    fetchCount(id, function (c) {
      var state, text, words;
      if (c.absent) { state = "absent"; text = ""; words = null; }
      else if (c.error) { state = "error"; text = "?"; words = "count could not be read (" + c.error + ")"; }
      else { state = c.n === 0 ? "zero" : "some"; text = String(c.n); words = c.n + " " + COUNTED[id]; }
      badge.textContent = text;
      badge.setAttribute("data-fa-count-state", state);
      var name = words ? label + " — " + words : label;
      a.setAttribute("aria-label", name);
      a.setAttribute("title", name);
      a.setAttribute("data-fa-tip", name);
    });
  }

  function linkSlot(id, label, href, notes, whose) {
    // `safeHref` AFTER `withBase`, so what is checked is the href written.
    var at = safeHref(withBase(href));
    // A link BORROWED from another site (a folio's site linking the
    // platform's graph) says whose it is, as a borrowed tile shows its
    // qualifier (#2263): `whose` is written by `foreign-site-scope.ts`.
    if (at && whose && typeof whose[id] === "string") label = label + " \u2014 " + whose[id];
    if (at) {
      var a = el("a", { class: "fa-nav-icon", href: at, "aria-label": label, title: label, "data-fa-tip": label });
      a.innerHTML = rowGlyph(id);
      if (Object.prototype.hasOwnProperty.call(COUNTED, id)) countBadge(a, id, label);
      return a;
    }
    var why = typeof notes[id] === "string" ? notes[id] : "reason not recorded";
    var dead = el("span", {
      class: "fa-nav-icon fa-nav-icon--dead",
      "aria-label": label + " — " + why,
      title: label + " — " + why,
      "data-fa-tip": label + " — " + why
    });
    dead.innerHTML = rowGlyph(id);
    return dead;
  }

  /* ARRIVING ON AN ICON DOES NOT OPEN THE STRIP — bean `ob3m` finding 1.
   * Hover widens the strip and re-flows the column into a row, so the icon a
   * pointer arrived on moved out from under it before its tooltip could name
   * it. The bar carries `.fa-nav-tip-hold` while the pointer is inside the
   * column's AT-REST box. Bound once per bar; the row is looked up each time,
   * so a row replaced by a full one is measured, not the detached old one. */
  var holding = typeof WeakMap === "function" ? new WeakMap() : null;
  function holdStripForTips(bar) {
    if (!holding) return;
    // RE-MEASURED on every mount: a FULL row replacing a LITE one is a
    // different height, and a box kept from the lite row left the lower icons
    // outside it, so arriving on them opened the strip (`rail-tips.e2e.ts`).
    if (holding.has(bar)) { holding.get(bar)(); return; }
    var rest = null;
    function measure() {
      var host = bar.querySelector(".fa-nav-icons");
      if (!host) return;
      if (bar.classList.contains("fa-nav-tip-hold")) return;
      if (bar.matches(":hover") || bar.matches(":focus-within")) return;
      if (bar.querySelector(".fa-nav-open:checked")) return;
      var r = host.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) rest = { l: r.left, r: r.right, t: r.top, b: r.bottom };
    }
    function inside(e) {
      return !!rest && e.clientX >= rest.l && e.clientX < rest.r && e.clientY >= rest.t && e.clientY < rest.b;
    }
    holding.set(bar, function () { rest = null; measure(); });
    measure();
    window.addEventListener("resize", measure);
    bar.addEventListener("pointerenter", function (e) {
      if (e.pointerType === "touch") return;
      measure();
      if (inside(e)) bar.classList.add("fa-nav-tip-hold");
    });
    bar.addEventListener("pointermove", function (e) {
      if (bar.classList.contains("fa-nav-tip-hold") && !inside(e)) bar.classList.remove("fa-nav-tip-hold");
    });
    bar.addEventListener("pointerleave", function () {
      bar.classList.remove("fa-nav-tip-hold");
      requestAnimationFrame(measure);
    });
  }

  /**
   * Draw the row into the page's navbar.
   *
   * `hooks` (all optional; absent means LITE):
   * - `full`     — true when `docs-ui.js` is the caller.
   * - `launcher` — the click handler for the launcher slot; without it the slot is left out.
   * - `after(host, bar)` — called once the row is in the page (the light/dark switch goes here).
   *
   * Returns the row element, or `null` when there is nothing to draw.
   */
  function mount(hooks) {
    hooks = hooks || {};
    var full = !!hooks.full;
    var bar = navbar();
    if (!bar) return null;
    var existing = bar.querySelector(".fa-nav-icons");
    if (existing) {
      // FULL REPLACES LITE; nothing replaces FULL.
      if (!full || existing.getAttribute("data-fa-row") === "full") return existing;
      existing.parentNode.removeChild(existing);
    }
    var row = readNavbarRow();
    if (row === undefined) return null;
    if (row === null) {
      // Info, not a warning: a declaration gap only an author can fix.
      console.info("navbar-row: this instance declares no navbarIcons and inherits none; " +
                   "no navbar icon row was mounted.");
      return null;
    }
    var icons = Array.isArray(row.icons) ? row.icons : [];
    var hrefs = row.hrefs && typeof row.hrefs === "object" ? row.hrefs : {};
    // WHY a slot has no href — a separate map, so "absent" never means both
    // "resolved to nothing" and "never declared". See `navbarRow` in
    // `sync-docs-harness.ts`.
    var notes = row.notes && typeof row.notes === "object" ? row.notes : {};
    var whose = row.whose && typeof row.whose === "object" ? row.whose : {};

    var host = el("div", {
      class: "fa-nav-icons", role: "group", "aria-label": "Harness actions",
      "data-fa-row": full ? "full" : "lite"
    });

    for (var i = 0; i < icons.length; i++) {
      var id = icons[i];
      // `close` is CSS-placed, never drawn in the row; skipped rather than
      // dropped from the declaration, so the instance's list still says six.
      if (id === "close") continue;
      var label = LABELS[id] || id;

      if (id === "fsh-guts") {
        // THE BUTTON ONLY WHERE THE TRASHCAN IS THIS SITE'S. Its count and
        // list are fetched from this site's `/fsh-guts.json`. On a folio's
        // site the slot is either re-based onto the platform (an absolute
        // href) or unlinked with a note (`foreign-site-scope.ts`), and a
        // button there showed "?" for a document that was never published
        // (#2263 follow-up). It is then a link that says whose, or an inert
        // icon that says why, like every other borrowed slot.
        var elsewhere = typeof notes[id] === "string" ||
          (typeof hrefs[id] === "string" && /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(hrefs[id]));
        if (full && !elsewhere) {
          // THE TRASHCAN, "with the others" (#1925). A button: it opens the
          // fsh-guts dialog and carries the live count, both wired by
          // `docs-ui.js` (`mountFshGutsNav`) through `data-fa-fsh-guts-open`.
          var fish = el("button", {
            type: "button", class: "fa-nav-icon fa-nav-icon--fsh-guts", "data-fa-fsh-guts-open": "",
            "aria-label": label, title: label, "data-fa-tip": label
          });
          fish.innerHTML = FISH_GLYPH;
          fish.appendChild(el("span", { class: "fa-nav-count", "data-fa-count-state": "pending", "aria-hidden": "true" }, "…"));
          host.appendChild(fish);
        } else {
          // No dialog on this page, or not this site's trashcan: the fish
          // goes to the fsh-guts page, or says why it does not.
          host.appendChild(linkSlot(id, label, hrefs[id], notes, whose));
        }
        continue;
      }

      if (id === "launcher") {
        // The launcher proxies `docs-ui.js`'s actions panel. With no panel on
        // the page the slot is LEFT OUT (owner, 2026-10-05).
        if (typeof hooks.launcher !== "function") continue;
        var proxy = el("button", { type: "button", class: "fa-nav-icon", "aria-label": LABELS.launcher, "data-fa-tip": LABELS.launcher });
        proxy.innerHTML = rowGlyph("launcher");
        proxy.addEventListener("click", hooks.launcher);
        host.appendChild(proxy);
        continue;
      }

      host.appendChild(linkSlot(id, label, hrefs[id], notes, whose));
    }

    // Line 1 is the mark and the name, line 2 is this. On the rail, straight
    // under its fixed top inside `.fa-nav-in`; on the theme's sidebar, under
    // `.site-header`.
    var railTop = bar.matches("nav.fa-nav") ? bar.querySelector(".fa-nav-in > .fa-nav-top") : null;
    var header = bar.querySelector(".site-header");
    if (railTop) railTop.parentNode.insertBefore(host, railTop.nextSibling);
    else if (header && header.nextSibling) bar.insertBefore(host, header.nextSibling);
    else bar.appendChild(host);

    if (typeof hooks.after === "function") hooks.after(host, bar);
    // ENGLISH ON EACH ICON, NOT ON THE ROW — bean `giiw`. Every name, count
    // phrase and `data-fa-tip` tooltip here is English on every locale, so
    // on an Arabic page each icon is marked English, which is what lays its
    // tooltip out left-to-right and tells a screen reader which voice to use.
    // The ROW keeps the page's direction: the icons' order beside the
    // mirrored sidebar is layout, and it mirrors with it. After `hooks.after`,
    // so the light/dark switch it appends is marked too.
    Array.prototype.forEach.call(host.children, function (icon) {
      icon.setAttribute("lang", "en");
      icon.setAttribute("dir", "ltr");
    });
    holdStripForTips(bar);
    return host;
  }

  window.FaNavbarRow = { mount: mount };

  // `docs-ui.js` ran first and left its hooks (a `folio-mount.ts` page).
  if (window.faNavbarRowHooks) {
    mount(window.faNavbarRowHooks);
    return;
  }

  function whenReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  if (document.querySelector('script[src*="/docs-ui.js"]')) {
    // `docs-ui.js` will mount the FULL row. If it never does — it 404s, or
    // throws before reaching the row — draw the lite one rather than none.
    // Deferred and appended scripts all run before `load`.
    window.addEventListener("load", function () {
      var bar = navbar();
      if (bar && !bar.querySelector(".fa-nav-icons")) mount({});
    });
  } else {
    whenReady(function () { mount({}); });
  }
})();
