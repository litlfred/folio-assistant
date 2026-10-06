/*
 * edit-links.js: the "edit on GitHub" and "feedback" links of every page,
 * built in the browser from one recipe. GENERATED from
 * cat-harness/src/core/edit-links.ts (EDIT_LINKS_RUNTIME); do not edit here.
 * cat-harness/src/core/tests/edit-links.test.ts fails if the two differ.
 */
(() => {
  if (window.faEditLinks) return;
  function faBlockUrls(c, b) {
  var enc = encodeURIComponent;
  var path = b.source.split("/").map(enc).join("/");
  var branch = c.branch || "main";
  var repo = b.repo || c.repo;
  var src = "https://github.com/" + repo + "/blob/" + branch + "/" + path + (b.line ? "#L" + b.line : "");
  var url = c.siteUrl && b.page ? c.siteUrl.replace(/\/$/, "") + "/" + b.page + "#" + enc(b.label) : (b.pageUrl || "");
  var values = { block: b.label, section: b.section || "", source: b.source, page: b.page || "", url: url };
  var q = new URLSearchParams();
  q.set("title", "Feedback: " + (b.section ? b.section + " — " : "") + b.label);
  if (c.labels && c.labels.length) q.set("labels", c.labels.join(","));
  if (c.template) {
    q.set("template", c.template);
    (c.templateFields || []).forEach(function (f) { if (values[f]) q.set(f, values[f]); });
  } else {
    var facts = ["**Block:** \u0060" + b.label + "\u0060"];
    if (b.section) facts.push("**Section:** " + b.section);
    facts.push("**Source:** " + src);
    if (url) facts.push("**On the site:** " + url);
    q.set("body", facts.concat(["", "**Type:** general | technical | editorial", "", "**Comment:**", "", "", "**Proposed change:**", ""]).join("\n"));
  }
  return { edit: "https://github.com/" + repo + "/edit/" + branch + "/" + path, source: src, feedback: "https://github.com/" + c.repo + "/issues/new?" + q };
}
  let cfg = null;
  const config = () => {
    if (cfg) return cfg;
    const el = document.getElementById("fa-edit-cfg");
    if (el) cfg = JSON.parse(el.textContent);
    else {
      const meta = (n) => { const m = document.querySelector('meta[name="' + n + '"]'); return m ? m.content : undefined; };
      cfg = { repo: meta("fa-repo"), branch: meta("fa-branch") || "main" };
    }
    return cfg;
  };
  // A link that names a GitHub file but carries no facts (a generator wrote
  // its href from data, e.g. sourceLinks) gives them up from its own URL.
  const GH = /^https:\/\/github\.com\/([^/]+\/[^/]+)\/(?:blob|edit)\/([^/]+)\/([^#?]+)(?:#L(\d+))?$/;
  const adopt = (a) => {
    const m = GH.exec(a.getAttribute("href") || "");
    if (!m) return false;
    a.dataset.repo = m[1]; a.dataset.branch = m[2];
    a.dataset.src = m[3].split("/").map(decodeURIComponent).join("/");
    if (m[4]) a.dataset.line = m[4];
    return true;
  };
  const ready = (host) => {
    if (host.dataset.ready) return;
    if (!host.dataset.src && !(host.matches("a[data-fa-link]") && adopt(host))) return;
    const c0 = config();
    const c = host.dataset.branch ? Object.assign({}, c0, { branch: host.dataset.branch }) : c0;
    if (!c.repo && !host.dataset.repo) return;
    host.dataset.ready = "1";
    const label = host.dataset.block || host.dataset.src;
    const u = faBlockUrls(c, { label: label, source: host.dataset.src, section: host.dataset.sec,
      line: host.dataset.line ? Number(host.dataset.line) : undefined, repo: host.dataset.repo, page: host.dataset.page || c.page,
      pageUrl: location.href.split("#")[0] + "#" + encodeURIComponent(label) });
    const links = host.matches("a[data-fa-link]") ? [host] : host.querySelectorAll("a[data-fa-link]");
    // Only this host's own links: a nested host (a Lean link inside a block's row) fills itself.
    for (const a of links) if ((a === host || a.closest("[data-src]") === host) && u[a.dataset.faLink]) a.href = u[a.dataset.faLink];
  };
  const fill = (root) => { for (const h of (root || document).querySelectorAll("[data-src], a[data-fa-link]")) ready(h); };
  // A page that learns its repository later (the folio site reads it from its outline) says so here.
  const configure = (c) => { cfg = c; };
  window.faEditLinks = { urls: faBlockUrls, fill: fill, configure: configure };
  for (const ev of ["pointerover", "focusin", "touchstart"])
    document.addEventListener(ev, (e) => { const h = e.target.closest && e.target.closest("[data-src], a[data-fa-link]"); if (h) ready(h); }, { passive: true });
})();
