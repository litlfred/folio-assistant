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
    status.textContent = "Change " + (at + 1) + " of " + items.length;
  }

  document.getElementById("next").addEventListener("click", function () { focusItem(at + 1); });
  document.getElementById("prev").addEventListener("click", function () { focusItem(at - 1); });
  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "j") { focusItem(at + 1); e.preventDefault(); }
    else if (e.key === "k") { focusItem(at - 1); e.preventDefault(); }
  });

  function get(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); });
  }

  get("../changeset.json").then(function (cs) {
    return get("../staging.json").catch(function () { return {}; }).then(function (st) {
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
      if (!cs.changes.length) {
        status.textContent = "No block changed. " + s.unchanged + " block(s) compared.";
        return;
      }
      var groups = {};
      var order = [];
      cs.changes.forEach(function (c) {
        var where = (c.head || c.base || {}).section || "(listed in no section)";
        if (!groups[where]) { groups[where] = []; order.push(where); }
        groups[where].push(c);
      });
      order.forEach(function (where) {
        list.appendChild(el("h2", where.replace("::", " \\u203a ")));
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
          ul.appendChild(li);
          items.push(li);
        });
        list.appendChild(ul);
      });
      status.textContent = items.length + " change(s). Press j for the next, k for the previous.";
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
  <button type="button" id="prev">Previous change (k)</button>
  <button type="button" id="next">Next change (j)</button>
  <a href="../index.html">All documents</a>
</div>
<div id="changes"></div>
</main>
<script>${SCRIPT}</script>
</body>
</html>
`;
}
