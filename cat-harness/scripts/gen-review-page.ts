/**
 * The `review/` page of a folio's preview site: what changed from `main`,
 * block by block. Bean `txut`, epic `q4jm`.
 *
 * ## One static page that reads its data when it is opened
 *
 * `folio-staging.yml` builds the site FIRST and computes the ChangeSet AFTER
 * it, into `<site>/changeset.json`, and the banner step writes
 * `<site>/staging.json`. A page generated at build time would therefore never
 * see the ChangeSet. So this page carries no data. It fetches
 * `../changeset.json` and `../staging.json` in the reader's browser, which
 * also makes the same file correct on every build.
 *
 * ## The three states, each said in words
 *
 * - **A ChangeSet with changes.** The list, grouped by section.
 * - **A ChangeSet with none.** "No block changed," with the count of blocks
 *   compared. A determined empty.
 * - **No ChangeSet.** On `main`, or on any build that is not a preview. The
 *   page says there is nothing to compare against, instead of showing an
 *   empty list that would read as "nothing changed".
 *
 * ## Each change is a before/after pair
 *
 * A changed block links to its anchor on this preview AND to the same anchor
 * on `main` (`staging.json`'s `mainSite`). An added block has only the
 * preview link, and a removed block only the `main` link. Anchors are the
 * block labels that `build-document-site` writes, which the `id-unique` and
 * `id-stable` QA criteria guard.
 *
 * ## Review comments (bean `423d`)
 *
 * `../review-comments.json` is the `folio-review-comments` Tool's output:
 * `folio-review-comment/v1` todos, one per tagged PR comment. The page lists
 * each block's comments under it. It gives three more groups their own
 * headings, because each would otherwise vanish:
 * - comments on blocks this PR did not change;
 * - ORPHANED comments, whose block is gone;
 * - tags nobody could read.
 *
 * Every changed block also shows the `block: <label>` line to start a new
 * comment with, and links to the PR, since GitHub cannot pre-fill a comment
 * box. No file at all is SAID, never shown as an empty list: "no comment
 * data" and "nobody commented" are different facts. The skill that governs
 * all of this is `review-comments`.
 *
 * ## Choosing how to see a change (bean `d903`)
 *
 * Every changed block has a "Show this change as" selector over the renderers
 * in `schemas/diff-renderers.ts`: a word diff of the source, the block inline
 * as rendered, or the two published pages side by side. Each block opens
 * with its kind's default. A page-level selector overrides every block, and
 * that one choice is remembered for this viewer in `localStorage`. Every read
 * and write is wrapped, so a private window or blocked storage just means
 * the defaults.
 *
 * A renderer that cannot run on a block is still listed, disabled, with the
 * reason in its label. The renderers themselves are
 * `scripts/review-renderers.ts` and `scripts/word-diff.ts`, embedded here
 * with `toString()`, so the functions the tests drive are the ones that run.
 *
 * ## Where to look first: the heat map (bean `qbfi`)
 *
 * Above the list, a section-by-metric table: changed blocks, open review
 * comments (defects apart), and stale comments (the block changed after the
 * comment was made). Review coverage and QA are columns too, and say per row
 * that they are not measured or not published YET, never 0. The numbers are
 * `scripts/review-heat.ts`, embedded with `toString()`. The tint is a
 * one-hue sequential ramp validated with the dataviz skill's validator in
 * both themes, and every cell also shows its number, so colour never carries
 * meaning alone. Each row's header moves focus to that section in the list.
 *
 * ## Accessibility is not a finish
 *
 * - Every change kind is a WORD, never a colour alone.
 * - `j` and `k` move to the next and previous change, and each has a visible
 *   button twin, so one key or one click does it.
 * - Focus is always visible.
 * - The status line is `aria-live`.
 * - The list is built with DOM APIs, never `innerHTML`: a block label is folio
 *   content and must not be able to become markup.
 */

import { DIFF_RENDERERS } from "../schemas/diff-renderers.js";
import { cleanRendered, renderInline, renderSideBySide, renderWordDiff } from "./review-renderers.js";
import { computeHeat, heatBucket, renderHeat } from "./review-heat.js";
import { wordDiff } from "./word-diff.js";

const STYLE = `
  :root { color-scheme: light dark; --fg: #1b1b1b; --bg: #fdfdfb; --muted: #5b5b5b; --link: #0b5cad; --rule: #d8d8d4; }
  @media (prefers-color-scheme: dark) { :root { --fg: #e8e8e6; --bg: #161616; --muted: #a8a8a4; --link: #7db4ff; --rule: #3a3a38; } }
  body { margin: 0 auto; max-width: 52rem; padding: 2rem 1rem 4rem; font: 1.05rem/1.6 system-ui, sans-serif; color: var(--fg); background: var(--bg); }
  a { color: var(--link); }
  a:focus-visible, button:focus-visible, li:focus-visible { outline: 3px solid var(--link); outline-offset: 2px; }
  .nav { display: flex; gap: .5rem; margin: 1rem 0; flex-wrap: wrap; align-items: center; }
  button { font: inherit; padding: .5rem 1rem; min-height: 2.75rem; border: 1px solid var(--muted); border-radius: .4rem; background: transparent; color: var(--fg); cursor: pointer; }
  h2 { font-size: 1.05rem; margin-top: 2rem; border-bottom: 1px solid var(--rule); padding-bottom: .25rem; }
  ul { list-style: none; padding: 0; }
  li { padding: .5rem .25rem; border-bottom: 1px solid var(--rule); }
  .kind { font-weight: 600; margin-right: .5rem; }
  .label { font-family: ui-monospace, monospace; }
  .links a { margin-right: 1rem; }
  .muted { color: var(--muted); }
  .comments { margin: .25rem 0 0 1rem; padding-left: .75rem; border-left: 3px solid var(--rule); }
  .comment { padding: .15rem 0; }
  .tagline { font-family: ui-monospace, monospace; font-size: .9rem; }
  select { font: inherit; min-height: 2.75rem; padding: .25rem .5rem; color: var(--fg); background: var(--bg); border: 1px solid var(--muted); border-radius: .4rem; }
  select:focus-visible { outline: 3px solid var(--link); outline-offset: 2px; }
  .viewrow { margin: .5rem 0 .25rem; display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; }
  .diff { margin: .25rem 0 .5rem; padding: .5rem .75rem; border: 1px solid var(--rule); border-radius: .4rem; overflow-x: auto; }
  pre.diff { white-space: pre-wrap; font: .95rem/1.5 ui-monospace, monospace; }
  ins { background: #d7f5dc; color: #0b3d17; text-decoration: underline; }
  del { background: #fbdada; color: #5c0b0b; text-decoration: line-through; }
  @media (prefers-color-scheme: dark) { ins { background: #12391d; color: #c8f2d0; } del { background: #45181a; color: #f5caca; } }
  .diff-sbs { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
  .diff-sbs iframe { width: 100%; height: 22rem; border: 1px solid var(--rule); border-radius: .3rem; background: #fff; }
  @media (max-width: 40rem) { .diff-sbs { grid-template-columns: 1fr; } }
  /* Heat map (qbfi). Blue 250/400/550 on light and 600/500/400 on dark: an
     ordinal ramp that passes the dataviz validator, each fill paired with an
     ink that clears 4.7:1 against it. */
  .heatwrap { overflow-x: auto; margin: 1rem 0; }
  table.heat { border-collapse: separate; border-spacing: 2px; font-size: .95rem; }
  table.heat caption { text-align: left; color: var(--muted); padding-bottom: .4rem; }
  table.heat th, table.heat td { padding: .35rem .6rem; text-align: left; border-radius: .25rem; }
  table.heat thead th { font-weight: 600; border-bottom: 1px solid var(--rule); }
  table.heat td { font-variant-numeric: tabular-nums; }
  .h1 { background: #86b6ef; color: #1b1b1b; } .h2 { background: #3987e5; color: #1b1b1b; } .h3 { background: #1c5cab; color: #ffffff; }
  @media (prefers-color-scheme: dark) { .h1 { background: #184f95; color: #ffffff; } .h2 { background: #256abf; color: #ffffff; } .h3 { background: #3987e5; color: #161616; } }
  button.linklike { border: 0; padding: 0; min-height: 0; background: none; color: var(--link); text-decoration: underline; cursor: pointer; font: inherit; text-align: left; }
  h2:focus-visible { outline: 3px solid var(--link); outline-offset: 2px; }
`;

const SCRIPT = `
(function () {
  var status = document.getElementById("status");
  var summary = document.getElementById("summary");
  var list = document.getElementById("changes");
  var items = [];
  var at = -1;

  function el(tag, text, cls) {
    var e = document.createElement(tag);
    if (text != null) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }
  // The document a block belongs to is its manifest's first path segment,
  // which is the page build-document-site writes. Kept to one safe segment.
  function docOf(at) {
    var seg = String((at && at.file) || "").split("/")[0];
    return /^[A-Za-z0-9._-]+$/.test(seg) ? seg : null;
  }
  function href(base, at, label) {
    var doc = docOf(at);
    return doc == null ? null : base + doc + "/index.html#" + encodeURIComponent(label);
  }
  function kindWords(c) {
    if (c.change === "added") return ["added"];
    if (c.change === "removed") return ["removed"];
    var words = { renamed: "renamed", prose: "reworded", manifest: "edited", moved: "moved" };
    return c.aspects.map(function (a) { return words[a] || a; });
  }
  function focusItem(i) {
    if (!items.length) return;
    at = (i + items.length) % items.length;
    items[at].focus();
    status.textContent = "Item " + (at + 1) + " of " + items.length;
  }

  document.getElementById("next").addEventListener("click", function () { focusItem(at + 1); });
  document.getElementById("prev").addEventListener("click", function () { focusItem(at - 1); });
  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    // A letter typed into a selector picks an option; it is not navigation.
    var tag = e.target && e.target.tagName;
    if (tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key === "j") { focusItem(at + 1); e.preventDefault(); }
    else if (e.key === "k") { focusItem(at - 1); e.preventDefault(); }
  });

  // One comment as a line of words: kind, status, who, what — never colour alone.
  function commentEl(c) {
    var d = el("div", null, "comment");
    var r = c.review || {};
    d.appendChild(el("span", (r.kind || "comment") + ", " + c.status, "kind"));
    d.appendChild(el("span", (r.reviewer || "?") + " as " + (r.role || "reviewer") + ": "));
    d.appendChild(el("span", c.summary));
    if (r.anchoredFrom && r.anchoredFrom.length) d.appendChild(el("span", " (made on " + r.anchoredFrom.join(", ") + ")", "muted"));
    if (r.commentUrl) { d.appendChild(el("span", " ")); var a = el("a", "read on the pull request"); a.href = r.commentUrl; d.appendChild(a); }
    return d;
  }
  function commentList(cs) {
    var box = el("div", null, "comments");
    cs.forEach(function (c) { box.appendChild(commentEl(c)); });
    return box;
  }
  function section(title, nodes, key) {
    if (!nodes.length) return;
    var h = el("h2", title);
    h.tabIndex = -1;
    if (key) h.setAttribute("data-section", key);
    list.appendChild(h);
    var ul = el("ul");
    nodes.forEach(function (n) { var li = el("li"); li.tabIndex = -1; li.appendChild(n); ul.appendChild(li); items.push(li); });
    list.appendChild(ul);
  }

  // ── Diff renderers (bean d903) ─────────────────────────────────
  var VIEW_KEY = "folio-review:view";
  function loadView() { try { return window.localStorage.getItem(VIEW_KEY) || ""; } catch (e) { return ""; } }
  function saveView(v) { try { window.localStorage.setItem(VIEW_KEY, v); } catch (e) { /* the defaults, then */ } }
  function defaultFor(kind) {
    var fb = null;
    for (var i = 0; i < RENDERERS.length; i++) {
      if (RENDERERS[i].defaultFor.indexOf(kind) >= 0) return RENDERERS[i].id;
      if (RENDERERS[i].defaultFor.indexOf("*") >= 0) fb = RENDERERS[i].id;
    }
    return fb || RENDERERS[0].id;
  }
  // Why a renderer cannot run on this block, or null when it can.
  function unavailable(r, ctx) {
    for (var i = 0; i < r.needs.length; i++) {
      var n = r.needs[i];
      if (n === "text" && !ctx.text) return "no prose on either side";
      if (n === "pages" && !ctx.before && !ctx.after) return "no page to show";
    }
    return null;
  }
  function renderInto(panel, id, ctx) {
    while (panel.firstChild) panel.removeChild(panel.firstChild);
    var t = ctx.text || {};
    var base = t.base || null;
    var head = t.head || null;
    var out;
    if (id === "word") {
      var ops = wordDiff(base ? base.prose : "", head ? head.prose : "");
      out = ops === null ? "This block is too long for a word diff. Choose side by side." : renderWordDiff(document, ops);
    } else if (id === "inline") {
      out = renderInline(document, base ? base.html : null, head ? head.html : null, wordDiff, cleanRendered);
    } else if (id === "side-by-side") {
      out = renderSideBySide(document, ctx.before, ctx.after);
    }
    if (typeof out === "string") panel.appendChild(el("p", out, "muted"));
    else if (out) panel.appendChild(out);
  }
  var viewers = [];
  function viewSelector(ctx) {
    var row = el("div", null, "viewrow");
    var id = "view-" + viewers.length;
    var lab = el("label", "Show this change as");
    lab.htmlFor = id;
    var sel = document.createElement("select");
    sel.id = id;
    RENDERERS.forEach(function (r) {
      var why = unavailable(r, ctx);
      var o = el("option", r.label + (why ? " (unavailable: " + why + ")" : ""));
      o.value = r.id;
      o.title = r.description;
      if (why) o.disabled = true;
      sel.appendChild(o);
    });
    var panel = el("div");
    function pick(v) {
      var r = RENDERERS.filter(function (x) { return x.id === v; })[0];
      if (!r || unavailable(r, ctx)) {
        // The chosen view cannot run here: fall back to the first one that can.
        r = RENDERERS.filter(function (x) { return !unavailable(x, ctx); })[0];
      }
      if (!r) { while (panel.firstChild) panel.removeChild(panel.firstChild); panel.appendChild(el("p", "Nothing to show for this change: it is to the manifest only.", "muted")); return; }
      sel.value = r.id;
      renderInto(panel, r.id, ctx);
    }
    sel.addEventListener("change", function () { pick(sel.value); });
    row.appendChild(lab);
    row.appendChild(sel);
    var v = { row: row, panel: panel, pick: pick, kind: ctx.kind };
    viewers.push(v);
    return v;
  }
  function applyView(global) {
    viewers.forEach(function (v) { v.pick(global || defaultFor(v.kind)); });
  }
  var viewAll = document.getElementById("view");
  var none = el("option", "Each block's default");
  none.value = "";
  viewAll.appendChild(none);
  RENDERERS.forEach(function (r) { var o = el("option", r.label); o.value = r.id; o.title = r.description; viewAll.appendChild(o); });
  viewAll.value = loadView();
  if (viewAll.value !== loadView()) viewAll.value = "";
  viewAll.addEventListener("change", function () { saveView(viewAll.value); applyView(viewAll.value); });

  function get(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); });
  }

  get("../changeset.json").then(function (cs) {
    return Promise.all([
      get("../staging.json").catch(function () { return {}; }),
      get("../review-comments.json").catch(function () { return null; }),
      get("../changeset-text.json").catch(function () { return null; }),
      get("../blocks.json").catch(function () { return null; }),
    ]).then(function (both) {
      var blocksFile = both[3];
      var st = both[0];
      var rc = both[1];
      var txt = both[2];
      var byLabel = {};
      var shown = {};
      ((rc && rc.comments) || []).forEach(function (c) {
        if (c.review && c.review.orphaned) return;
        (byLabel[c.targetLabel] = byLabel[c.targetLabel] || []).push(c);
      });
      var main = st.mainSite ? String(st.mainSite).replace(/\\/?$/, "/") : null;
      var s = cs.summary;
      // The head is "worktree" in CI (the checkout under review), which names
      // nothing a reader recognises; the banner's staging.json has the branch.
      var headName = cs.head.ref === "worktree" && st.branch ? st.branch : cs.head.ref;
      summary.textContent =
        cs.base.ref + " \\u2192 " + headName + ": " +
        s.added + " added, " + s.removed + " removed, " + s.changed + " changed (" +
        s.prose + " reworded, " + s.moved + " moved, " + s.renamed + " renamed, " + s.manifest + " edited), " +
        s.unchanged + " unchanged.";
      if (!rc) summary.textContent += " No comment data on this build.";
      else summary.textContent += " " + rc.comments.length + " review comment(s).";
      if (!cs.changes.length) {
        status.textContent = "No block changed. " + s.unchanged + " block(s) compared.";
      }
      var groups = {};
      var order = [];
      cs.changes.forEach(function (c) {
        var where = (c.head || c.base || {}).section || "(listed in no section)";
        if (!groups[where]) { groups[where] = []; order.push(where); }
        groups[where].push(c);
      });
      order.forEach(function (where) {
        var h2 = el("h2", where.replace("::", " \\u203a "));
        h2.tabIndex = -1;
        h2.setAttribute("data-section", where);
        list.appendChild(h2);
        var ul = el("ul");
        groups[where].forEach(function (c) {
          var li = el("li");
          li.tabIndex = -1;
          li.appendChild(el("span", kindWords(c).join(", "), "kind"));
          li.appendChild(el("span", c.label, "label"));
          if (c.from) li.appendChild(el("span", " (was " + c.from + ")", "muted"));
          var links = el("div", null, "links");
          var after = c.change !== "removed" ? href("../", c.head, c.label) : null;
          var before = c.change !== "added" && main ? href(main, c.base, c.from || c.label) : null;
          if (after) { var a = el("a", "view on this preview"); a.href = after; links.appendChild(a); }
          if (before) { var b = el("a", "view on main"); b.href = before; links.appendChild(b); }
          if (!after && !before) links.appendChild(el("span", "no page to link to", "muted"));
          li.appendChild(links);
          var v = viewSelector({
            kind: (c.head || c.base || {}).kind || "",
            text: txt && txt.blocks ? txt.blocks[c.label] || null : null,
            before: before,
            after: after,
          });
          li.appendChild(v.row);
          li.appendChild(v.panel);
          var mine = byLabel[c.label] || [];
          shown[c.label] = true;
          if (mine.length) li.appendChild(commentList(mine));
          if (c.change !== "removed") {
            var t = el("div", null, "muted");
            t.appendChild(el("span", "To comment, start a pull-request comment with "));
            t.appendChild(el("code", "block: " + c.label, "tagline"));
            if (st.prUrl) { t.appendChild(el("span", " ")); var p = el("a", "open the pull request"); p.href = st.prUrl; t.appendChild(p); }
            li.appendChild(t);
          }
          ul.appendChild(li);
          items.push(li);
        });
        list.appendChild(ul);
      });
      if (rc) {
        var elsewhere = [];
        Object.keys(byLabel).forEach(function (label) {
          if (shown[label]) return;
          var d = el("div");
          d.appendChild(el("span", label, "label"));
          d.appendChild(commentList(byLabel[label]));
          elsewhere.push(d);
        });
        section("Comments on blocks this pull request did not change", elsewhere, "(unchanged)");
        section("Orphaned: the block these were made on is gone", rc.comments
          .filter(function (c) { return c.review && c.review.orphaned; })
          .map(function (c) { var d = el("div"); d.appendChild(el("span", c.targetLabel, "label")); d.appendChild(commentList([c])); return d; }));
        section("Comments whose tag could not be read", rc.malformed.map(function (m) {
          var d = el("div");
          d.appendChild(el("span", m.error + " "));
          var a = el("a", "fix it on the pull request"); a.href = m.url; d.appendChild(a);
          return d;
        }));
      }
      if (!txt && cs.changes.length) summary.textContent += " No change text on this build, so only side by side is available.";
      applyView(viewAll.value);
      // The heat map (qbfi), above the list it indexes.
      var heat = computeHeat({ changes: cs.changes, comments: rc ? rc.comments : null, blocks: blocksFile });
      if (heat.rows.length) {
        var wrap = document.getElementById("heat");
        wrap.appendChild(renderHeat(document, heat, heatBucket, function (sec) {
          var t = list.querySelector('h2[data-section="' + (window.CSS && CSS.escape ? CSS.escape(sec) : sec) + '"]') ||
            list.querySelector('h2[data-section="(unchanged)"]');
          if (t) { t.focus(); t.scrollIntoView({ block: "start" }); }
        }));
        wrap.appendChild(el("p", "Review coverage is not measured yet: it needs a per-block reviewer verdict, which nothing records until the review process does, and resolved comments are not approval. QA is not published to previews yet.", "muted"));
      }
      if (items.length) status.textContent = items.length + " item(s). Press j for the next, k for the previous.";
    });
  }).catch(function () {
    status.textContent =
      "No ChangeSet on this build, so there is nothing to compare against main. " +
      "It appears on a staging preview, built for a pull request.";
  });
})();
`;

/** The review page. Static: all of its data is fetched when it is opened. */
export function reviewPageHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Review: what changed</title>
<style>${STYLE}</style>
</head>
<body>
<main>
<h1>What changed</h1>
<p id="summary" class="muted"></p>
<p id="status" role="status" aria-live="polite">Loading the ChangeSet…</p>
<div class="nav">
  <button type="button" id="prev">Previous (k)</button>
  <button type="button" id="next">Next (j)</button>
  <a href="../index.html">All documents</a>
</div>
<div class="viewrow"><label for="view">Show every change as</label> <select id="view"></select></div>
<div id="heat" class="heatwrap"></div>
<div id="changes"></div>
</main>
<script>
var RENDERERS = ${JSON.stringify(DIFF_RENDERERS).replace(/</g, "\\u003c")};
var wordDiff = ${wordDiff.toString()};
var cleanRendered = ${cleanRendered.toString()};
var renderWordDiff = ${renderWordDiff.toString()};
var renderInline = ${renderInline.toString()};
var renderSideBySide = ${renderSideBySide.toString()};
var computeHeat = ${computeHeat.toString()};
var heatBucket = ${heatBucket.toString()};
var renderHeat = ${renderHeat.toString()};
</script>
<script>${SCRIPT}</script>
</body>
</html>
`;
}
