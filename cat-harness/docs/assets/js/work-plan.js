/**
 * The work-plan dashboard — what a harness instance's state graphs HOLD.
 *
 * ## One file, two surfaces, and that is the point
 *
 * This renderer is served two ways and exists once:
 *
 *   - the docs site loads it as a `<script>` beside `docs-ui.js`, and it
 *     mounts into the `beans-and-todos` page's container;
 *   - `scripts/state-visualizer.ts` INLINES these exact bytes into every
 *     generated visualiser page, so `<base>/<stub>/state-visualizer/` needs no
 *     network fetch for its own code.
 *
 * It lived inside `docs-ui.js` for one commit. Moving it out is what stops the
 * second surface becoming a second copy — and a second copy of a renderer is
 * two answers to "what does the work plan look like", free to disagree while
 * both look right in review.
 *
 * ## It self-mounts, so neither surface has to remember to call it
 *
 * Any page carrying `[data-fa-workplan]` gets a dashboard. A page without one
 * pays a single failed `querySelector`. `docs-ui.js` does not call in here and
 * does not need to know it exists.
 *
 * ## No dependencies, no CDN, no build step
 *
 * The same rule `kg-viewer.ts` states for its own page: a view of this
 * repository's data must be openable from a file, reviewable offline, and must
 * not add a third party to its own trust boundary.
 */
(function () {
  "use strict";

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text != null) node.textContent = text;
    return node;
  }

  /** Untouched for this long, an `in-progress` bean is worth a second look. */
  var BEAN_STALE_DAYS = 14;

  /**
   * Status roles, and the reason these four are the only coloured things here.
   *
   * `good` / `warning` / `serious` are reserved for state and are never reused
   * as series colours. The bean STATUSES deliberately take none of them: a
   * bean being `todo` is not a warning, and painting a work plan's ordinary
   * resting state amber teaches a reader to ignore amber.
   */
  var WORKPLAN_FINDING = {
    "blocker-closed": { role: "serious", label: "Block never lifted" },
    "blocked-without-expiry": { role: "warning", label: "No expiry" },
    "blocking-unknown": { role: "critical", label: "Unknown bean" },
    "stale-in-progress": { role: "warning", label: "Untouched" }
  };

  var WORKPLAN_GLYPH = {
    // A filled ring: state, not decoration. One shape per role would be
    // better still; one shape plus a LABEL is the floor, and the label is
    // always present beside it.
    good:
      '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" class="fa-workplan-icon">' +
      '<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M5 8.4l2.1 2.1L11 6.6" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>',
    warning:
      '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" class="fa-workplan-icon">' +
      '<path d="M8 2l6 11H2z" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linejoin="round"/><path d="M8 6.5v3" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round"/><circle cx="8" cy="11.6" r="0.9" fill="currentColor"/></svg>',
    serious:
      '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" class="fa-workplan-icon">' +
      '<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M8 4.8v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="8" cy="11.3" r="0.9" fill="currentColor"/></svg>',
    critical:
      '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" class="fa-workplan-icon">' +
      '<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round"/></svg>'
  };

  var WORKPLAN_OPEN = { "todo": true, "in-progress": true };

  /** Whole days since an ISO timestamp, or `null` when there is no usable one. */
  function daysSince(iso) {
    if (!iso) return null;
    var t = Date.parse(iso);
    if (isNaN(t)) return null;
    return Math.floor((Date.now() - t) / 86400000);
  }

  /**
   * Fetch a published index by its `<meta>` name.
   *
   * THREE answers, and keeping them apart is the whole of this function:
   *
   *   - `undefined` — the page carries no such meta, so it never meant to show
   *     this graph. A per-graph visualiser page carries exactly one of the two.
   *   - `null` — the meta is there and the fetch failed. Something is wrong.
   *   - the document — it was read.
   *
   * Collapsing the first two is how a page that deliberately shows only beans
   * comes to report "the todo index could not be read", which is an error
   * message about a decision.
   */
  function fetchIndex(metaName, done) {
    var src = document.querySelector('meta[name="' + metaName + '"]');
    var url = src && src.getAttribute("content");
    if (!url) return done(undefined);
    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (doc) {
        done(doc && Array.isArray(doc.items) ? doc : null);
      })
      .catch(function (e) {
        // Third state, reported and never rendered as "nothing outstanding".
        // A dashboard that opens at zero is indistinguishable from a store
        // with no work in it, and those are opposite facts.
        console.warn("work-plan: could not read " + url + " (" + e.message + "); " +
                     "that half of the work-plan dashboard was not mounted.");
        done(null);
      });
  }

  /** One `<dt>/<dd>` pair in a count row. */
  function countItem(label, value, hero) {
    var item = el("div", { class: "fa-workplan-count" + (hero ? " is-hero" : "") });
    item.appendChild(el("dd", { class: "fa-workplan-count-value" }, String(value)));
    item.appendChild(el("dt", { class: "fa-workplan-count-label" }, label));
    return item;
  }

  /**
   * Open beans per epic, largest first.
   *
   * Only OPEN beans and only real epics: a completed bean is history, and
   * `check-bean-parents.ts` already guarantees every open non-epic bean names
   * an epic that exists, so an "unparented" bucket here would be a column that
   * is always zero — and a chart with a permanently empty category teaches a
   * reader to stop reading its categories.
   */
  function epicDistribution(beans) {
    var titles = {};
    var i;
    for (i = 0; i < beans.length; i++) {
      if (beans[i].type === "epic") titles[beans[i].id] = beans[i].title || beans[i].id;
    }
    var counts = {};
    for (i = 0; i < beans.length; i++) {
      var b = beans[i];
      if (!WORKPLAN_OPEN[b.status] || b.type === "epic") continue;
      if (!b.parent || !titles[b.parent]) continue;
      counts[b.parent] = (counts[b.parent] || 0) + 1;
    }
    var rows = Object.keys(counts).map(function (id) {
      return { id: id, title: titles[id], count: counts[id] };
    });
    // Descending by count, then by id — so two epics on the same count do not
    // swap places between builds. A chart that reorders on reload looks like
    // it is reporting a change.
    rows.sort(function (a, c) { return c.count - a.count || a.id.localeCompare(c.id); });
    return rows;
  }

  /** The bar chart: one row per epic, label and value as text on every row. */
  function epicChart(rows) {
    var fig = el("figure", { class: "fa-workplan-chart" });
    var cap = el("figcaption", { class: "fa-workplan-chart-title" },
                 "Open beans by epic");
    fig.appendChild(cap);
    if (rows.length === 0) {
      fig.appendChild(el("p", { class: "fa-workplan-empty" }, "No open beans."));
      return fig;
    }
    var max = rows[0].count;
    var list = el("ol", { class: "fa-workplan-bars" });
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var li = el("li", { class: "fa-workplan-bar-row" });
      // The epic's own title, in full, in the `title` attribute: the visible
      // label is clamped to two lines and these run long.
      var label = el("span", { class: "fa-workplan-bar-label", title: row.title }, row.title);
      var track = el("span", { class: "fa-workplan-bar-track" });
      var fill = el("span", { class: "fa-workplan-bar-fill" });
      // Percent of the LARGEST bar, not of the total: this is a magnitude
      // comparison between epics, not a part-to-whole.
      fill.style.width = Math.max(2, Math.round((row.count / max) * 100)) + "%";
      track.appendChild(fill);
      var value = el("span", { class: "fa-workplan-bar-value" }, String(row.count));
      li.appendChild(label);
      li.appendChild(track);
      li.appendChild(value);
      list.appendChild(li);
    }
    fig.appendChild(list);
    return fig;
  }

  /** One finding row: icon, role label, then the sentence. */
  function findingRow(role, label, text, href) {
    var li = el("li", { class: "fa-workplan-finding is-" + role });
    var badge = el("span", { class: "fa-workplan-finding-badge" });
    badge.innerHTML = WORKPLAN_GLYPH[role] || WORKPLAN_GLYPH.warning;  // static constant
    badge.appendChild(el("span", { class: "fa-workplan-finding-role" }, label));
    li.appendChild(badge);
    if (href) {
      var a = el("a", { class: "fa-workplan-finding-text", href: href }, text);
      li.appendChild(a);
    } else {
      li.appendChild(el("span", { class: "fa-workplan-finding-text" }, text));
    }
    return li;
  }

  /**
   * The findings panel — the generator's structural findings, plus the
   * time-relative one this page is the only place that can compute.
   */
  function findingsPanel(beans, findings) {
    var byId = {};
    var i;
    for (i = 0; i < beans.length; i++) byId[beans[i].id] = beans[i];

    var section = el("section", { class: "fa-workplan-panel" });
    section.appendChild(el("h3", { class: "fa-workplan-panel-title" }, "What is stuck"));
    var list = el("ul", { class: "fa-workplan-findings" });

    for (i = 0; i < findings.length; i++) {
      var f = findings[i];
      var spec = WORKPLAN_FINDING[f.kind] || { role: "warning", label: f.kind };
      var subject = byId[f.bean];
      var text = (subject && subject.title ? subject.title : f.bean) + " — " + f.detail;
      list.appendChild(findingRow(spec.role, spec.label, text,
                                  subject ? subject.editHref : null));
    }

    // Computed here rather than in the projection. See the module note.
    var stale = [];
    for (i = 0; i < beans.length; i++) {
      var b = beans[i];
      if (b.status !== "in-progress") continue;
      var age = daysSince(b.updatedAt);
      if (age !== null && age > BEAN_STALE_DAYS) stale.push({ bean: b, age: age });
    }
    stale.sort(function (a, c) { return c.age - a.age; });
    for (i = 0; i < stale.length; i++) {
      list.appendChild(findingRow(
        "warning", WORKPLAN_FINDING["stale-in-progress"].label,
        stale[i].bean.title + " — claimed in-progress and untouched for " +
          stale[i].age + " days",
        stale[i].bean.editHref));
    }

    if (list.childNodes.length === 0) {
      list.appendChild(findingRow(
        "good", "Clear",
        "No unlifted blocks, no block without an expiry, and nothing claimed " +
        "and left for more than " + BEAN_STALE_DAYS + " days."));
    }
    section.appendChild(list);
    return section;
  }

  /** The counts panel, both stores side by side. */
  function countsPanel(beans, todos) {
    var status = {};
    var i;
    for (i = 0; i < beans.length; i++) {
      status[beans[i].status] = (status[beans[i].status] || 0) + 1;
    }
    var open = (status["todo"] || 0) + (status["in-progress"] || 0);

    var section = el("section", { class: "fa-workplan-panel" });
    section.appendChild(el("h3", { class: "fa-workplan-panel-title" },
                            "Beans — the agent work plan"));
    var row = el("dl", { class: "fa-workplan-counts" });
    row.appendChild(countItem("open", open, true));
    row.appendChild(countItem("todo", status["todo"] || 0));
    row.appendChild(countItem("in progress", status["in-progress"] || 0));
    row.appendChild(countItem("completed", status["completed"] || 0));
    row.appendChild(countItem("scrapped", status["scrapped"] || 0));
    section.appendChild(row);

    // The human half. Absent is NOT zero: a failed fetch and an empty store
    // are opposite facts and the panel says which one it is looking at.
    var todoHead = el("h3", { class: "fa-workplan-panel-title" },
                       "Todos — the human half");
    section.appendChild(todoHead);
    // Absent by design — this page was not asked to show todos — so the
    // heading comes off with it rather than standing over an apology.
    if (todos === undefined) {
      section.removeChild(todoHead);
      return section;
    }
    if (todos === null) {
      section.appendChild(el("p", { class: "fa-workplan-empty" },
                              "The todo index could not be read."));
      return section;
    }
    var todoOpen = 0;
    for (i = 0; i < todos.length; i++) if (todos[i].status === "open") todoOpen++;
    var todoRow = el("dl", { class: "fa-workplan-counts" });
    todoRow.appendChild(countItem("open", todoOpen, true));
    todoRow.appendChild(countItem("total", todos.length));
    section.appendChild(todoRow);
    return section;
  }

  /**
   * The todos panel on its own, for a page whose only graph is `todos/`.
   *
   * Separate from `countsPanel` rather than a flag on it: that function's job
   * is "both stores side by side", and a boolean turning half of it off is how
   * one function comes to mean two things.
   */
  function todoOnlyPanel(todos) {
    var section = el("section", { class: "fa-workplan-panel" });
    section.appendChild(el("h3", { class: "fa-workplan-panel-title" },
                            "Todos — the human half"));
    if (!todos) {
      section.appendChild(el("p", { class: "fa-workplan-empty" },
                              "The todo index could not be read."));
      return section;
    }
    var open = 0;
    for (var i = 0; i < todos.length; i++) if (todos[i].status === "open") open++;
    var row = el("dl", { class: "fa-workplan-counts" });
    row.appendChild(countItem("open", open, true));
    row.appendChild(countItem("total", todos.length));
    section.appendChild(row);
    return section;
  }

  /**
   * Mount the dashboard into the container the page declares.
   *
   * The page carries `<div data-fa-workplan>` with prose inside it saying
   * where the data lives. That fallback is REPLACED on success and LEFT ALONE
   * on failure, so a reader with no JavaScript, or on a build where the
   * projection is missing, still gets a working link to the file rather than
   * an empty box.
   */
  function mountWorkPlan() {
    var host = document.querySelector("[data-fa-workplan]");
    if (!host) return;
    fetchIndex("fa-beans-src", function (beanDoc) {
      fetchIndex("fa-todo-src", function (todoDoc) {
        // Nothing to show at all — a fetch that failed, or a page carrying
        // neither meta. The container's fallback prose stays put, because it
        // links the data directly and an empty box would not.
        if (!beanDoc && !todoDoc) return;

        var todoItems = todoDoc === undefined ? undefined : (todoDoc ? todoDoc.items : null);
        var board = el("div", { class: "fa-workplan-board" });

        if (beanDoc) {
          var beans = beanDoc.items;
          var findings = Array.isArray(beanDoc.findings) ? beanDoc.findings : [];
          board.appendChild(countsPanel(beans, todoItems));
          board.appendChild(findingsPanel(beans, findings));
          var chartPanel = el("section", { class: "fa-workplan-panel fa-workplan-panel--wide" });
          chartPanel.appendChild(epicChart(epicDistribution(beans)));
          board.appendChild(chartPanel);
        } else {
          // A todos-only page. The bean panels are not stubbed out with zeros:
          // this page was never asked about beans, and a zero is an answer.
          board.appendChild(todoOnlyPanel(todoItems));
        }

        host.textContent = "";
        host.appendChild(board);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountWorkPlan);
  } else {
    mountWorkPlan();
  }
})();
