(() => {
  if (window.faEditLinks) return;
  function faBlockUrls(c, b) {
  var enc = encodeURIComponent;
  var path = b.source.split("/").map(enc).join("/");
  var branch = c.branch || "main";
  var repo = b.repo || c.repo;
  var src = "https://github.com/" + repo + "/blob/" + branch + "/" + path + (b.line ? "#L" + b.line : "");
  var url = c.siteUrl && b.page ? c.siteUrl.replace(/\/$/, "") + "/" + b.page + "#" + enc(b.label) : (b.pageUrl || "");
  var values = { block: b.label, section: b.section || "", source: b.source, page: b.page || "", url: url, content: c.content || "" };
  var q = new URLSearchParams();
  q.set("title", "Feedback" + (c.content ? " [" + c.content + "]" : "") + ": " + (b.section ? b.section + " — " : "") + b.label);
  if (c.labels && c.labels.length) q.set("labels", c.labels.join(","));
  if (c.template) {
    q.set("template", c.template);
    (c.templateFields || []).forEach(function (f) { if (values[f]) q.set(f, values[f]); });
  } else {
    var facts = c.content ? ["**Content:** \u0060" + c.content + "\u0060"] : [];
    facts.push("**Block:** \u0060" + b.label + "\u0060");
    if (b.section) facts.push("**Section:** " + b.section);
    facts.push("**Source:** " + src);
    if (url) facts.push("**On the site:** " + url);
    q.set("body", facts.concat(["", "**Type:** general | technical | editorial", "", "**Comment:**", "", "", "**Proposed change:**", ""]).join("\n"));
  }
  return { edit: "https://github.com/" + repo + "/edit/" + branch + "/" + path, suggest: "https://github.com/" + repo + "/edit/" + branch + "/" + path, source: src, feedback: "https://github.com/" + c.repo + "/issues/new?" + q };
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
  const fill = (root) => { addSuggest(root); for (const h of (root || document).querySelectorAll("[data-src], a[data-fa-link]")) ready(h); };
  // A page that learns its repository later (the folio site reads it from its outline) says so here.
  const configure = (c) => { cfg = c; };
  // ── ✍ suggest: a block's Markdown in a WYSIWYG editor, the change as a prefilled issue ──
  //
  // Beside every ✎ edit link whose source is Markdown, on any page of any
  // harness. The editor (Milkdown Crepe, MIT) is imported only on first use.
  // The text is read through the block's KG node (<block>.jsonld, its text)
  // from the repository itself, and the change leaves as a GitHub issue the
  // reader submits: no OAuth, no token, no server. Variables, directives and
  // LaTeX references are the reader's to change, add or delete; what is
  // checked is that each is well-formed, and the panel under the editor shows
  // each variable's current value from the site's values.jsonld. Nothing read
  // is written as HTML.
  const SUGGEST_LIB = "https://cdn.jsdelivr.net/npm/@milkdown/crepe@7.22.2";
  const SUGGEST_KATEX_CSS = "https://cdn.jsdelivr.net/npm/katex@0.18.10/dist/katex.min.css";
  const TOKENISH = /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}|:{1,2}[A-Za-z][\w-]*\[[^\]\n]*\](?:\{[^}\n]*\})?|\\[A-Za-z]+\{[^}\n]*\}/g;
  // Variables, directives and LaTeX references stay the reader's to change,
  // add or delete. They are wrapped in \u27e6 \u27e7 only so the editor's
  // Markdown escaping cannot corrupt them, and unwrapped on submit; what is
  // checked is that each one is still well-formed, nothing more (owner,
  // 2026-10-14: "I only want that the syntax is valid").
  const wrap = (md) => md.replace(TOKENISH, (m) => "\u27e6" + m + "\u27e7");
  const unwrap = (md) => md.replace(/\u27e6([^\u27e6\u27e7]*)\u27e7/g, (m, inner) => inner.replace(/\\([!-\/:-@\[-\u0060{-~])/g, "$1"));
  const LIQUID = /^\{\{\s*[A-Za-z_][\w-]*(?:\.[\w-]+|\[\d+\])*\s*(?:\|\s*[A-Za-z_]\w*(?:\s*:\s*[^|{}]+?)?\s*)*\}\}$/;
  const TAG = /^\{%\s*[A-Za-z_]\w*[^%]*%\}$/;
  const DIRECTIVE = /^:{1,2}[A-Za-z][\w-]*\[[^\]\n]*\](?:\{[^{}\n]*\})?$/;
  const LATEXREF = /^\\[A-Za-z]+\{[^{}\n]+\}$/;
  const syntaxErrors = (md) => {
    const bad = [];
    for (const m of md.matchAll(/\{\{[\s\S]*?(?:\}\}|$)|\{%[\s\S]*?(?:%\}|$)/g)) if (!LIQUID.test(m[0]) && !TAG.test(m[0])) bad.push(m[0]);
    for (const m of md.matchAll(/:{1,2}[A-Za-z][\w-]*\[[^\n]*?(?:\](?:\{[^\n]*?\})?|$)/gm)) if (!DIRECTIVE.test(m[0])) bad.push(m[0]);
    for (const m of md.matchAll(/\\(?:cite|ref|eqref|autoref|cref)\b[^\s]*/g)) if (!LATEXREF.test(m[0].replace(/[.,;:)]+$/, ""))) bad.push(m[0]);
    return bad;
  };
  // Variable names and, when the site published them, their current values.
  const variablesIn = (md) => Array.from(md.matchAll(/\{\{\s*([A-Za-z_][\w.\-\[\]]*)/g), (m) => m[1]);
  const lineDiff = (a, b) => {
    const x = a.split("\n"), y = b.split("\n"), n = x.length, m = y.length;
    const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const out = [];
    let i = 0, j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && x[i] === y[j]) { out.push(" " + x[i]); i++; j++; }
      else if (j < m && (i === n || L[i][j + 1] > L[i + 1][j])) out.push("+" + y[j++]);
      else out.push("-" + x[i++]);
    }
    // Two lines of context around each change.
    const keep = out.map((l, k) => out.slice(Math.max(0, k - 2), k + 3).some((c) => c[0] !== " "));
    const hunks = [];
    out.forEach((l, k) => { if (keep[k]) hunks.push(l); else if (hunks.length && hunks[hunks.length - 1] !== "@@") hunks.push("@@"); });
    if (hunks[hunks.length - 1] === "@@") hunks.pop();
    return hunks.join("\n");
  };
  const raw = (repo, branch, path) => "https://raw.githubusercontent.com/" + repo + "/" + branch + "/" + path.split("/").map(encodeURIComponent).join("/");
  const sourceOf = (a) => {
    const h = a.closest("[data-src]");
    if (h && h.dataset.src) return { src: h.dataset.src, label: h.dataset.block || h.dataset.src, repo: h.dataset.repo, branch: h.dataset.branch };
    if (a.dataset.src || adopt(a)) return { src: a.dataset.src, label: a.dataset.block || a.dataset.src, repo: a.dataset.repo, branch: a.dataset.branch };
    return null;
  };
  const el = (tag, props, kids) => { const e = Object.assign(document.createElement(tag), props || {}); for (const k of kids || []) e.append(k); return e; };
  const suggest = async (a) => {
    const s = sourceOf(a), c = config();
    if (!s || !/\.md$/.test(s.src)) return;
    const repo = s.repo || c.repo, branch = s.branch || c.branch || "main";
    const status = el("p", { className: "fa-suggest-status", textContent: "Loading " + s.src + " …" });
    const host = el("div", { className: "fa-suggest-editor" });
    const send = el("button", { type: "button", textContent: "Submit as an issue", disabled: true });
    const close = el("button", { type: "button", textContent: "Cancel" });
    const vars = el("ul", { className: "fa-suggest-vars" });
    const dlg = el("dialog", { className: "fa-suggest" }, [el("h2", { textContent: "Suggest a change: " + s.label }), status, host, vars, el("p", {}, [send, " ", close])]);
    close.onclick = () => { dlg.close(); dlg.remove(); };
    if (!document.getElementById("fa-suggest-css"))
      document.head.append(el("style", { id: "fa-suggest-css", textContent: "dialog.fa-suggest{width:min(60rem,95vw);max-height:90vh;overflow:auto;padding:1rem 1.25rem}dialog.fa-suggest h2{font-size:1.1rem;margin:0 0 .5rem}.fa-suggest-status{color:#5b6770;font-size:.9rem}.fa-suggest-editor{border:1px solid #d6dde2;min-height:12rem;margin:.5rem 0}.fa-suggest-vars{font-size:.85rem;color:#5b6770;margin:.25rem 0;padding-left:1.2rem}.fa-suggest-vars .bad{color:#b3261e}" }));
    document.body.append(dlg);
    dlg.showModal();
    let path = s.src, original;
    try {
      // The KG node names the block's text; a page without one falls back to the source.
      const node = await fetch(raw(repo, branch, s.src.replace(/\.md$/, ".jsonld"))).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      if (node && typeof node.text === "string") path = s.src.replace(/[^/]*$/, "") + node.text;
      const r = await fetch(raw(repo, branch, path));
      if (!r.ok) throw new Error(r.status + " reading " + path);
      original = await r.text();
    } catch (e) { status.textContent = "Could not load the block: " + e.message; return; }
    const wrapped = wrap(original);
    // The site's variable values, as KG nodes (values.jsonld), when it publishes them.
    const values = c.values ? await fetch(c.values).then((r) => (r.ok ? r.json() : null)).catch(() => null) : null;
    const valueOf = (key) => {
      const nodes = values && (values["@graph"] || values);
      const n = Array.isArray(nodes) ? nodes.find((x) => x.key === key) : null;
      return n ? String(n.formatted !== undefined ? n.formatted : n.value) : undefined;
    };
    let get;
    try {
      const lib = (c.suggest && c.suggest.lib) || SUGGEST_LIB;
      // The theme's own @import of KaTeX names a package, which a CDN cannot resolve: named here.
      for (const href of [lib + "/lib/theme/common/style.css", lib + "/lib/theme/frame/style.css", SUGGEST_KATEX_CSS])
        if (!document.querySelector('link[href="' + href + '"]')) document.head.append(el("link", { rel: "stylesheet", href: href }));
      const { Crepe } = await import((c.suggest && c.suggest.module) || lib + "/+esm");
      const crepe = new Crepe({ root: host, defaultValue: wrapped });
      await crepe.create();
      get = () => crepe.getMarkdown();
      status.textContent = wrapped === original ? "" : "Variables, glossary terms and references are shown in \u27e6 \u27e7: change, add or delete them freely; their syntax is checked when you submit.";
    } catch (e) {
      // No editor (offline, blocked CDN): the same flow over plain Markdown.
      const ta = el("textarea", { value: wrapped, rows: 16, style: "width:100%" });
      host.append(ta);
      get = () => ta.value;
      status.textContent = "The visual editor did not load (" + e.message + "); editing the Markdown directly.";
    }
    const base = get();
    // Live: each variable and its current value, and any item whose syntax is broken.
    const refresh = () => {
      if (!dlg.isConnected) return clearInterval(timer);
      const text = unwrap(get());
      const items = variablesIn(text).map((k) => { const v = valueOf(k); return el("li", { textContent: k + (v === undefined ? (values ? " \u2014 not a published variable" : " \u2014 value not published") : " = " + v) }); });
      for (const b of syntaxErrors(text)) items.push(el("li", { className: "bad", textContent: "Not well-formed: " + b.slice(0, 80) }));
      vars.replaceChildren(...items);
    };
    const timer = setInterval(refresh, 800);
    refresh();
    send.disabled = false;
    send.onclick = async () => {
      const now = get();
      if (now === base) { status.textContent = "Nothing has changed yet."; return; }
      const errs = syntaxErrors(unwrap(now));
      if (errs.length) { status.textContent = "Fix the syntax first: " + errs.map((e) => e.slice(0, 60)).join(" \u00b7 "); return; }
      const facts = ["**Block:** \u0060" + s.label + "\u0060", "**Source:** https://github.com/" + repo + "/blob/" + branch + "/" + path, "**On the site:** " + location.href.split("#")[0] + "#" + encodeURIComponent(s.label)];
      const body = facts.concat(["", "**Suggested change**, made in the visual editor (the diff is against the editor's rendering of the source):", "", "\u0060\u0060\u0060diff", lineDiff(unwrap(base), unwrap(now)), "\u0060\u0060\u0060", "", "**Why:**", ""]).join("\n");
      const q = new URLSearchParams({ title: "Suggested edit: " + s.label, body: body });
      let url = "https://github.com/" + (c.repo || repo) + "/issues/new?" + q;
      // GitHub refuses very long URLs: carry the body on the clipboard instead.
      if (url.length > 7000) {
        try { await navigator.clipboard.writeText(body); } catch { status.textContent = "Too long for a link, and the clipboard is blocked."; return; }
        url = "https://github.com/" + (c.repo || repo) + "/issues/new?" + new URLSearchParams({ title: "Suggested edit: " + s.label, body: "The suggested change is on the clipboard: paste it here." });
      }
      window.open(url, "_blank", "noopener");
      close.onclick();
    };
  };
  const SUGGEST_TITLE = "Suggest a change in a visual editor (opens a GitHub issue)";
  const addSuggest = (root) => {
    // Only over a real DOM: the runtime is also evaluated against stubs (a
    // viewer's own tests), where there is nothing to add a link to.
    const r = root || document;
    if (!r || typeof r.querySelectorAll !== "function") return;
    for (const a of r.querySelectorAll('a[data-fa-link="edit"], a.ba-edit')) {
      if (a.nextElementSibling && a.nextElementSibling.dataset.faLink === "suggest") continue;
      const s = sourceOf(a);
      if (!s || !/\.md$/.test(s.src)) continue;
      const b = el("a", { className: "ba-suggest", href: a.getAttribute("href") || "#", title: SUGGEST_TITLE, textContent: "✍ suggest", tabIndex: 0 });
      b.dataset.faLink = "suggest";
      a.after(b);
    }
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest('a[data-fa-link="suggest"]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    suggest(a);
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => addSuggest());
  else addSuggest();
  window.faEditLinks = { urls: faBlockUrls, fill: fill, configure: configure };
  // Both the link reached and the host it sits in: a pointer that lands
  // straight on a compact host's link (no gap crossed) or keyboard focus on it
  // matches the bare link first, which carries no facts of its own.
  for (const ev of ["pointerover", "focusin", "touchstart"])
    document.addEventListener(ev, (e) => {
      if (!e.target.closest) return;
      const a = e.target.closest("a[data-fa-link]"), h = e.target.closest("[data-src]");
      if (a) ready(a);
      if (h && h !== a) ready(h);
    }, { passive: true });
})();
(function(){var d=document.getElementById("ig-source-lines");if(!d)return;var m;try{m=JSON.parse(d.textContent)}catch(e){return}
var repo=(m.blob.match(/^https:\/\/github\.com\/[^/]+\/[^/]+/)||[])[0];
var n=function(s){return s.toLowerCase().replace(/[^a-z0-9]+/g," ").trim()};var used={};
var link=function(h,cls,href,title,glyph){var a=document.createElement("a");a.className=cls;a.href=href;a.title=title;a.textContent=glyph;a.rel="noopener";a.target="_blank";h.appendChild(document.createTextNode(" "));h.appendChild(a)};
document.querySelectorAll("#main-content h1,#main-content h2,#main-content h3,#main-content h4,#main-content h5,#main-content h6").forEach(function(h){
var text=h.textContent.trim(),k=n(text),line,file;for(var i=0;i<m.lines.length;i++){if(!used[i]&&n(m.lines[i].t)===k){used[i]=1;line=m.lines[i].l;file=m.lines[i].b;break}}
var src=line?(file||m.blob)+"#L"+line:m.blob;
if(line)link(h,"ig-src",src,"This section's source, line "+line+", on GitHub","\u270E");
if(repo){var here=location.href.split("#")[0]+(h.id?"#"+h.id:"");
var pt=document.title.split(" | ")[0].trim();
var body="**Page:** "+here+"\n**Section:** "+text+(h.id?" (#"+h.id+")":"")+"\n**Source:** "+src+"\n\n**Feedback:**\n\n";
link(h,"ig-feedback",repo+"/issues/new?title="+encodeURIComponent("Feedback on \u201C"+text+"\u201D"+(pt&&n(pt)!==k?" (page: "+pt+")":""))+"&body="+encodeURIComponent(body),"Give feedback on this section (opens a GitHub issue)","\uD83D\uDCE3")}})})();
