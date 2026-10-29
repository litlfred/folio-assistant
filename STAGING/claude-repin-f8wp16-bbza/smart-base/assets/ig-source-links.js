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
  function faSuggestTokens(contributed) {
  var re = function (s) { if (s instanceof RegExp) return s; var i = s.lastIndexOf("/"); return new RegExp(s.slice(1, i), s.slice(i + 1)); };
  var withG = function (r) { return r.flags.indexOf("g") >= 0 ? r : new RegExp(r.source, r.flags + "g"); };
  var own = [
    { id: "liquid", shield: /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/, find: /\{\{[\s\S]*?(?:\}\}|$)|\{%[\s\S]*?(?:%\}|$)/g,
      valid: /^\{\{\s*[A-Za-z_][\w-]*(?:\.[\w-]+|\[\d+\])*\s*(?:\|\s*[A-Za-z_]\w*(?:\s*:\s*[^|{}]+?)?\s*)*\}\}$|^\{%\s*[A-Za-z_]\w*[^%]*%\}$/ },
    { id: "directive", shield: /:{1,2}[A-Za-z][\w-]*\[[^\]\n]*\](?:\{[^}\n]*\})?/, find: /:{1,2}[A-Za-z][\w-]*\[[^\n]*?(?:\](?:\{[^\n]*?\})?|$)/gm,
      valid: /^:{1,2}[A-Za-z][\w-]*\[[^\]\n]*\](?:\{[^{}\n]*\})?$/ },
  ];
  var theirs = (contributed || []).filter(function (t) { return t && typeof t.id === "string"; }).map(function (t) {
    return { id: t.id, shield: t.shield && re(t.shield), find: t.find && re(t.find), valid: t.valid && re(t.valid), trim: t.trim && re(t.trim) };
  });
  var shieldOf = function (rules) {
    return new RegExp(rules.filter(function (r) { return r.shield; }).map(function (r) { return "(?:" + r.shield.source + ")"; }).join("|"), "g");
  };
  var both = own.concat(theirs), ownShield = shieldOf(own), allShield = shieldOf(both);
  return {
    wrap: function (md, ownOnly) { return md.replace(ownOnly ? ownShield : allShield, function (m) { return "\u27e6" + m + "\u27e7"; }); },
    errors: function (md, ownOnly) {
      var bad = [];
      (ownOnly ? own : both).forEach(function (r) {
        if (!r.find || !r.valid) return;
        for (const m of md.matchAll(withG(r.find))) if (!r.valid.test(r.trim ? m[0].replace(r.trim, "") : m[0])) bad.push(m[0]);
      });
      return bad;
    },
  };
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
  // any syntax a content profile declares are the reader's to change, add or
  // delete; what is checked is that each is well-formed (faSuggestTokens), and
  // the panel under the editor shows each variable's current value from the
  // site's values.jsonld. Nothing read is written as HTML.
  const unwrap = (md) => md.replace(/\u27e6([^\u27e6\u27e7]*)\u27e7/g, (m, inner) => inner.replace(/\\([!-\/:-@\[-\u0060{-~])/g, "$1"));
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
    // From the link's parent: ready() gives a link with no facts of its own
    // (the ✍ link beside ✎ edit) a data-src adopted from its href, and the
    // block's label is the host's, not the link's.
    const h = a.parentElement && a.parentElement.closest("[data-src]");
    if (h && h.dataset.src) return { src: h.dataset.src, label: h.dataset.block || h.dataset.src, repo: h.dataset.repo, branch: h.dataset.branch, mode: h.dataset.suggestMode, text: h.dataset.suggestText };
    if (a.dataset.src || adopt(a)) return { src: a.dataset.src, label: a.dataset.block || a.dataset.src, repo: a.dataset.repo, branch: a.dataset.branch, mode: a.dataset.suggestMode, text: a.dataset.suggestText };
    return null;
  };
  const el = (tag, props, kids) => { const e = Object.assign(document.createElement(tag), props || {}); for (const k of kids || []) e.append(k); return e; };
  // A block's YAML front matter is not the reader's to edit: Crepe would turn
  // it into a thematic break and a setext heading. It is kept aside, unchanged.
  const FRONT_MATTER = /^---\n[\s\S]*?\n---\n/;
  // The site root, from any same-origin URL under /assets/ the page already
  // loads (a page is served at several depths, and the runtime is often
  // inlined, so it cannot use its own script's URL); the editor bundle is under it.
  // The page's own site root: the longest root of a same-origin /assets/ URL
  // the page loads that also contains this page (a page can load another
  // site's chrome from the same origin, /folio-assistant/assets/…).
  const vendorBase = () => {
    let best = null;
    for (const e of document.querySelectorAll("script[src], link[href]")) {
      let u;
      try { u = new URL(e.getAttribute("src") || e.getAttribute("href"), location.href); } catch { continue; }
      const i = u.pathname.indexOf("/assets/");
      if (u.origin !== location.origin || i < 0) continue;
      const root = u.pathname.slice(0, i + 1);
      if (location.pathname.indexOf(root) === 0 && (!best || root.length > best.length)) best = root;
    }
    return best === null ? null : location.origin + best + "assets/vendor/crepe/";
  };
  // The site's editor bundle (suggest-editor.ts), fetched once: on the first
  // hover or focus of a ✍ suggest link, so it is usually ready by the click.
  // A failed fetch is forgotten, so the next open tries again.
  let bundle = null;
  const editorBundle = () => {
    const sc = config().suggest || {};
    const vb = vendorBase();
    const moduleUrl = sc.module || (vb && vb + "crepe.js");
    if (!moduleUrl) return Promise.reject(new Error("this site has no editor bundle (assets/vendor/crepe/)"));
    const cssUrl = sc.css || (vb && !sc.module ? vb + "crepe.css" : null);
    if (cssUrl && !document.querySelector('link[href="' + cssUrl + '"]')) document.head.append(el("link", { rel: "stylesheet", href: cssUrl }));
    if (!bundle) bundle = import(moduleUrl).catch((e) => { bundle = null; throw e; });
    return bundle;
  };
  // How long the visual editor may take to open before the dialog falls back
  // to the raw Markdown: a slow link or a stalled import must not leave the
  // reader looking at an empty editor (smart-ra, 2026-10-26).
  const VISUAL_WAIT_MS = 20000;
  // The KG labels and bibliography keys a profile's checker warns against, read once from the page's graph.
  let kgRefs;
  const kgReferences = async (c) => {
    if (kgRefs !== undefined) return kgRefs;
    kgRefs = null;
    const g = c.graph ? await fetch(c.graph).then((r) => (r.ok ? r.json() : null)).catch(() => null) : null;
    const nodes = g && (g["@graph"] || g);
    if (!Array.isArray(nodes)) return kgRefs;
    const labels = [], keys = [];
    for (const n of nodes) {
      if (n && typeof n.label === "string" && n.label) labels.push(n.label);
      const m = n && typeof n["@id"] === "string" ? /(?:^|\/)references\/([^/#?]+)$/.exec(n["@id"]) : null;
      if (m) keys.push(decodeURIComponent(m[1]));
    }
    // A graph with no reference nodes says nothing about citations: that check is skipped, not failed.
    kgRefs = keys.length ? { labels: labels, citeKeys: keys } : { labels: labels };
    return kgRefs;
  };
  // A profile (an editor-checker node a content layer declares, bundled by the
  // site) for the block's kind: its checker, its tokens, and its Crepe settings.
  // Or a mode: a profile whose module opens its own editor (a Questionnaire
  // form builder, in the page or in another window) over a file it declares by
  // extension. A host names one with data-suggest-mode.
  const profilesOf = (c) => ((c.suggest && c.suggest.profiles) || []).filter((p) => p && p.module);
  const fileOk = (p, src) => (p.extensions && p.extensions.length ? p.extensions.some((x) => src.endsWith(x)) : /\.md$/.test(src));
  // A host that names its mode is served by that profile whatever its file is
  // (a Questionnaire written in FSH); otherwise by file type.
  const suggestable = (c, s) => (s.mode ? profilesOf(c).some((p) => p.id === s.mode) : /\.md$/.test(s.src) || profilesOf(c).some((p) => fileOk(p, s.src)));
  const profileFor = (c, kind, s) => s.mode
    ? profilesOf(c).find((p) => p.id === s.mode)
    : profilesOf(c).find((p) => fileOk(p, s.src) && (!p.kinds || p.kinds.indexOf(kind) >= 0));
  // The issue: prefilled by URL, or, past GitHub's URL limit, carried on the clipboard.
  const openIssue = async (repo, title, body, template, status) => {
    const q = { title: title, body: body };
    if (template) q.template = template;
    let url = "https://github.com/" + repo + "/issues/new?" + new URLSearchParams(q);
    if (url.length > 7000) {
      try { await navigator.clipboard.writeText(body); } catch { status.textContent = "Too long for a link, and the clipboard is blocked."; return false; }
      url = "https://github.com/" + repo + "/issues/new?" + new URLSearchParams({ title: title, body: "The suggested change is on the clipboard: paste it here." });
    }
    window.open(url, "_blank", "noopener");
    return true;
  };
  const findingItem = (f) => el("li", { className: f.severity === "error" ? "bad" : "warn", textContent: (f.severity === "error" ? "Error" : "Warning") + (f.line ? " (line " + f.line + ")" : "") + ": " + f.message });
  // \u2500\u2500 The dialog: wireframe candidate A (cat-harness docs/wireframes/suggest-editor,
  // owner's choice 2026-10-14): one screen, a toolbar always shown, changes
  // marked as you type (new text green and underlined, removed text red and
  // struck through), a Why field that becomes the issue's reason, and a size
  // the reader chooses. Underline is not offered: Markdown has none, and
  // underlined means added.
  const SUGGEST_CSS = [
    "dialog.fa-suggest{width:min(60rem,95vw);height:min(44rem,90vh);max-width:100vw;max-height:100vh;padding:0;border:2px solid #1b1b1b;display:flex;flex-direction:column;overflow:hidden}",
    "dialog.fa-suggest:not([open]){display:none}",
    "dialog.fa-suggest.fa-sg-large{width:min(80rem,98vw);height:94vh}",
    "dialog.fa-suggest.fa-sg-full{width:100vw;height:100vh;margin:0}",
    ".fa-sg-hd{display:flex;align-items:center;gap:.5rem;padding:.5rem .75rem;border-bottom:1px solid #d6dde2}",
    ".fa-sg-hd h2{font-size:1.05rem;margin:0;flex:1;overflow-wrap:anywhere}",
    "dialog.fa-suggest button{min-height:44px;min-width:44px;padding:0 .7rem;border:1px solid #1b1b1b;background:#fff;color:#1b1b1b;font:inherit;cursor:pointer;border-radius:4px}",
    "dialog.fa-suggest button[aria-pressed=true]{background:#e8e8e8;font-weight:700}",
    "dialog.fa-suggest button:focus-visible{outline:3px solid #0b57d0;outline-offset:2px}",
    ".fa-sg-tb{display:flex;flex-wrap:wrap;gap:.25rem;align-items:center;padding:.4rem .75rem;border-bottom:1px solid #d6dde2}",
    ".fa-sg-tb .fa-sg-sep{width:1px;align-self:stretch;background:#d6dde2;margin:0 .2rem}",
    ".fa-sg-tb .fa-sg-note{font-size:.8rem;color:#5b6770;margin:0 .4rem}",
    ".fa-sg-tb .fa-sg-mode{margin-left:auto;display:inline-flex;gap:.25rem}",
    ".fa-suggest-status{color:#5b6770;font-size:.9rem;margin:.25rem .75rem}",
    ".fa-suggest-status:empty{display:none}",
    ".fa-suggest-editor{flex:1;min-height:8rem;overflow:auto;margin:0}",
    ".fa-suggest-editor textarea{width:100%;height:100%;min-height:12rem;box-sizing:border-box;font-family:ui-monospace,monospace;font-size:.9rem;border:0;padding:.75rem;resize:none}",
    "dialog.fa-suggest .milkdown .ProseMirror{padding:.75rem 1rem}",
    "dialog.fa-suggest .ProseMirror a{text-decoration-style:dotted}",
    "ins.fa-sg-ins,.fa-sg-ins-block{color:#0b6b2a;background:#e6f4ea;text-decoration:underline 3px;text-underline-offset:3px}",
    "del.fa-sg-del{color:#b3261e;text-decoration:line-through 2px;margin-right:.2em;user-select:none}",
    "ins.fa-sg-ins::before,del.fa-sg-del::before{position:absolute;clip-path:inset(50%);width:1px;height:1px;overflow:hidden}",
    "ins.fa-sg-ins::before{content:' [added: '}del.fa-sg-del::before{content:' [removed: '}",
    ".fa-suggest-vars{font-size:.85rem;color:#5b6770;margin:.25rem .75rem;padding-left:1.2rem;max-height:6rem;overflow:auto}",
    ".fa-suggest-vars .bad{color:#b3261e}.fa-suggest-vars .warn{color:#8a5a00}",
    ".fa-sg-why{padding:.25rem .75rem}.fa-sg-why label{font-weight:700;display:block}",
    ".fa-sg-why textarea{width:100%;box-sizing:border-box;min-height:4rem;font:inherit;padding:.4rem;border:1px solid #1b1b1b;border-radius:4px}",
    ".fa-sg-ft{display:flex;gap:.5rem;align-items:center;padding:.5rem .75rem;border-top:1px solid #d6dde2}",
    ".fa-sg-ft .fa-sg-help{flex:1;font-size:.85rem;color:#5b6770}",
    ".fa-sg-ft button.fa-sg-send{font-weight:700}",
    "@media (max-width:700px){dialog.fa-suggest,dialog.fa-suggest.fa-sg-large{width:100vw;height:100vh;margin:0;border:0}.fa-sg-size{display:none}.fa-sg-tb .fa-sg-note{flex-basis:100%;order:9}.fa-sg-tb .fa-sg-mode{margin-left:0}.fa-sg-ft{flex-wrap:wrap}.fa-sg-ft .fa-sg-help{flex-basis:100%}.fa-sg-ft button{flex:1}}",
  ].join("");
  // A block's text as tokens (words, spaces, and a separator between paragraphs),
  // each with the document position it starts at: what the change marks diff.
  const tokensOf = (node, at0) => {
    const start = at0 + 1;
    const out = [];
    let word = null;
    const flush = () => { if (word) { out.push(word); word = null; } };
    node.descendants((child, pos) => {
      if (child.isTextblock && out.length + (word ? 1 : 0)) { flush(); out.push({ t: "\n", pos: start + pos }); }
      if (child.isText) {
        const at = start + pos;
        for (let k = 0; k < child.text.length; k++) {
          const ch = child.text[k], sp = /\s/.test(ch);
          if (word && word.sp === sp) word.t += ch;
          else { flush(); word = { t: ch, pos: at + k, sp: sp }; }
        }
      } else if (child.isLeaf && !child.isText) { flush(); out.push({ t: "\ufffc" + child.type.name, pos: start + pos, size: child.nodeSize }); }
      return true;
    });
    flush();
    return out;
  };
  // Longest common subsequence of two arrays by key: the pairs that did not change.
  const lcs = (a, b, key) => {
    const n = a.length, m = b.length;
    if (n * m > 4e6) return [];
    const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = key(a[i]) === key(b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const pairs = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (key(a[i]) === key(b[j])) { pairs.push([i, j]); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) i++;
      else j++;
    }
    return pairs;
  };
  // The change marks: what differs between the source as the editor first
  // showed it and the document now, as ProseMirror decorations. Removed text is
  // a widget (it is not in the document); added text an inline <ins>.
  const changeMarks = (lib, baseOf) => {
    let count = 0;
    const key = new lib.PluginKey("fa-suggest-changes");
    const decorate = (doc) => {
      const base = baseOf();
      count = 0;
      if (!base) return lib.DecorationSet.empty;
      const blocks = [];
      doc.forEach((node, offset) => blocks.push({ node: node, pos: offset, text: node.type.name + ":" + node.textContent }));
      const decos = [];
      const del = (pos, text) => {
        if (!text.trim()) return;
        decos.push(lib.Decoration.widget(pos, () => { const d = document.createElement("del"); d.className = "fa-sg-del"; d.textContent = text; return d; }, { side: -1, key: "del" + pos + ":" + text }));
      };
      const tokenDiff = (was, now, blockEnd) => {
        const pairs = lcs(was, now, (x) => x.t);
        let wi = 0, ni = 0;
        const step = (toW, toN) => {
          const gone = was.slice(wi, toW).map((x) => (x.t === "\n" ? " " : x.t.charAt(0) === "\ufffc" ? "" : x.t)).join("");
          const added = now.slice(ni, toN).filter((x) => x.t !== "\n");
          const hasAdd = added.length && added.some((x) => !/^\s+$/.test(x.t));
          if (hasAdd || gone.trim()) count++;
          if (hasAdd) {
            const last = added[added.length - 1];
            decos.push(lib.Decoration.inline(added[0].pos, last.pos + (last.size || last.t.length), { nodeName: "ins", class: "fa-sg-ins" }));
          }
          const at = toN < now.length ? now[toN].pos : blockEnd;
          if (gone) del(added.length ? added[0].pos : at, gone);
          wi = toW; ni = toN;
        };
        // A shared space between two changed words does not split one replacement into two.
        for (const [w, n] of pairs) { if (/^\s+$/.test(was[w].t)) continue; if (w > wi || n > ni) step(w, n); wi = w + 1; ni = n + 1; }
        if (wi < was.length || ni < now.length) step(was.length, now.length);
      };
      const pairs = lcs(base, blocks, (x) => x.text);
      let bi = 0, di = 0;
      const gap = (toB, toD) => {
        const goneB = base.slice(bi, toB), newB = blocks.slice(di, toD);
        const k = Math.min(goneB.length, newB.length);
        for (let x = 0; x < k; x++) tokenDiff(goneB[x].tokens, tokensOf(newB[x].node, newB[x].pos), newB[x].pos + newB[x].node.nodeSize - 1);
        for (let x = k; x < newB.length; x++) { count++; decos.push(lib.Decoration.node(newB[x].pos, newB[x].pos + newB[x].node.nodeSize, { class: "fa-sg-ins-block" })); }
        const at = toD < blocks.length ? blocks[toD].pos : doc.content.size;
        for (let x = k; x < goneB.length; x++) { count++; del(at, goneB[x].node.textContent); }
        bi = toB; di = toD;
      };
      for (const [b, d] of pairs) { if (b > bi || d > di) gap(b, d); bi = b + 1; di = d + 1; }
      if (bi < base.length || di < blocks.length) gap(base.length, blocks.length);
      return lib.DecorationSet.create(doc, decos);
    };
    const plugin = new lib.Plugin({
      key: key,
      state: { init: (_, state) => decorate(state.doc), apply: (tr, old, _, state) => (tr.docChanged || tr.getMeta(key) ? decorate(state.doc) : old) },
      props: { decorations: (state) => key.getState(state) },
    });
    return { plugin: plugin, key: key, count: () => count };
  };
  // The base blocks, with their tokens, from the document the editor first showed.
  const baseBlocksOf = (doc) => {
    const out = [];
    doc.forEach((node, offset) => out.push({ node: node, pos: offset, text: node.type.name + ":" + node.textContent, tokens: tokensOf(node, offset) }));
    return out;
  };
  // Markdown around the raw pane's selection, typed so the browser's own undo keeps it.
  const rawWrap = (ta, before, after, linePrefix) => {
    ta.focus();
    const a = ta.selectionStart, b = ta.selectionEnd, sel = ta.value.slice(a, b);
    let text;
    if (linePrefix) {
      const ls = ta.value.lastIndexOf("\n", a - 1) + 1;
      ta.setSelectionRange(ls, b);
      text = ta.value.slice(ls, b).split("\n").map((l) => linePrefix + l).join("\n");
    } else text = before + (sel || "text") + after;
    if (!document.execCommand("insertText", false, text)) ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, "end");
  };
  const suggest = async (a) => {
    const s = sourceOf(a), c = config();
    if (!s || !suggestable(c, s)) return;
    const repo = s.repo || c.repo, branch = s.branch || c.branch || "main";
    const btn = (label, title, extra) => { const b = el("button", Object.assign({ type: "button", textContent: label, title: title }, extra || {})); b.setAttribute("aria-label", title); return b; };
    const titleId = "fa-sg-title-" + Date.now();
    const status = el("p", { className: "fa-suggest-status", textContent: "Loading " + s.src + " …" });
    status.setAttribute("role", "status");
    const host = el("div", { className: "fa-suggest-editor" });
    const send = btn("Submit as an issue", "Submit as an issue", { className: "fa-sg-send", disabled: true });
    const close = btn("Cancel", "Cancel");
    const larger = btn("Larger", "Make the editor larger", { className: "fa-sg-size" });
    const full = btn("Full screen", "Fill the screen", { className: "fa-sg-size" });
    const x = btn("\u2715", "Close");
    larger.setAttribute("aria-pressed", "false");
    full.setAttribute("aria-pressed", "false");
    const toolbar = el("div", { className: "fa-sg-tb" });
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", "Formatting");
    const visualBtn = btn("Visual", "Edit visually"), rawBtn = btn("Raw", "Edit the raw Markdown");
    const mode = el("span", { className: "fa-sg-mode" }, [visualBtn, rawBtn]);
    const vars = el("ul", { className: "fa-suggest-vars" });
    vars.setAttribute("aria-live", "polite");
    const why = el("textarea", { id: titleId + "-why", rows: 3, placeholder: "What should change, and why? This becomes the issue's reason." });
    const whyBox = el("div", { className: "fa-sg-why" }, [el("label", { htmlFor: why.id, textContent: "Why?" }), why]);
    const h2 = el("h2", { id: titleId, textContent: "Suggest a change: " + s.label });
    const dlg = el("dialog", { className: "fa-suggest" }, [
      el("div", { className: "fa-sg-hd" }, [h2, larger, full, x]),
      status, toolbar, host, vars, whyBox,
      el("div", { className: "fa-sg-ft" }, [el("span", { className: "fa-sg-help", textContent: "Opens a GitHub issue with your change and your reason." }), send, close]),
    ]);
    dlg.setAttribute("aria-labelledby", titleId);
    let surface = null, timer = null;
    const cleanup = () => { if (timer) clearInterval(timer); if (surface) surface.destroy(); surface = null; if (dlg.isConnected) dlg.remove(); };
    close.onclick = x.onclick = () => { if (dlg.open) dlg.close(); cleanup(); };
    // Esc closes it, as a modal dialog does; focus stays inside while it is open.
    dlg.addEventListener("close", cleanup);
    larger.onclick = () => { const on = dlg.classList.toggle("fa-sg-large"); larger.setAttribute("aria-pressed", String(on)); };
    full.onclick = () => { const on = dlg.classList.toggle("fa-sg-full"); full.setAttribute("aria-pressed", String(on)); };
    if (!document.getElementById("fa-suggest-css")) document.head.append(el("style", { id: "fa-suggest-css", textContent: SUGGEST_CSS }));
    document.body.append(dlg);
    dlg.showModal();
    let path = s.src, original, kind = String(s.label).split(":")[0];
    try {
      // The KG node names the block's text and its kind; a page without one falls back to the source.
      const node = await fetch(raw(repo, branch, s.src.replace(/\.md$/, ".jsonld"))).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      if (node && typeof node.text === "string") path = s.src.replace(/[^/]*$/, "") + node.text;
      if (node && typeof node.kind === "string") kind = node.kind;
      const r = await fetch(raw(repo, branch, path));
      if (!r.ok) throw new Error(r.status + " reading " + path);
      original = await r.text();
    } catch (e) { status.textContent = "Could not load the block: " + e.message; return; }
    status.textContent = "Loaded " + path + ". Opening the editor …";
    const fm = FRONT_MATTER.exec(original);
    const head = fm ? fm[0] : "", body = original.slice(head.length);
    // The site's variable values, as KG nodes (values.jsonld), when it publishes them.
    const values = c.values ? await fetch(c.values).then((r) => (r.ok ? r.json() : null)).catch(() => null) : null;
    const valueOf = (key) => {
      const nodes = values && (values["@graph"] || values);
      const n = Array.isArray(nodes) ? nodes.find((x) => x.key === key) : null;
      return n ? String(n.formatted !== undefined ? n.formatted : n.value) : undefined;
    };
    // The block's profile, when the site declares one for its kind. A profile
    // that fails to load leaves the generic editor and its generic checks.
    const prof = profileFor(c, kind, s);
    let mod = null;
    const notes = [];
    if (prof) {
      try { mod = await import(new URL(prof.module, location.href).href); }
      catch (e) { notes.push("The " + (prof.id || "profile") + " checks did not load (" + e.message + ")."); }
    }
    const facts = ["**Block:** \u0060" + s.label + "\u0060", "**Source:** https://github.com/" + repo + "/blob/" + branch + "/" + path, "**On the site:** " + location.href.split("#")[0] + "#" + encodeURIComponent(s.label)];
    const reason = () => (why.value.trim() ? why.value.trim() : "");
    // A mode: its own editor, the same issue flow over the text it hands back.
    // get() may be async (an editor in another window answers by postMessage);
    // it is read on submit, not polled.
    if (mod && typeof mod.open === "function") {
      toolbar.hidden = true;
      // The mode's text: the block's source, or, when the host names one
      // (data-suggest-text), what the site BUILT from it, e.g. a Questionnaire
      // compiled from FSH. The source stays the issue's subject either way.
      let text = original;
      if (s.text) {
        try {
          const r = await fetch(new URL(s.text, location.href).href);
          if (!r.ok) throw new Error(r.status + " reading " + s.text);
          text = await r.text();
        } catch (e) { status.textContent = "Could not load the built text: " + e.message; return; }
      }
      // ctx.why is live: the reader's reason as it stands when the mode reads it.
      const ctx = { text: text, sourceText: original, sourcePath: path, src: s.src, path: path, label: s.label, kind: kind, repo: repo, branch: branch, config: c, status: (m) => { status.textContent = String(m); }, get why() { return reason(); } };
      const formBox = el("div"), srcBox = el("div", { hidden: true });
      host.replaceChildren(formBox, srcBox);
      let handle;
      try { handle = await mod.open(formBox, ctx); }
      catch (e) { status.textContent = "The " + (prof.id || "editor") + " did not open: " + e.message; return; }
      surface = { name: "mode", get: () => handle.get(), base: text, destroy: () => { try { if (handle && handle.dispose) handle.dispose(); } catch {} } };
      // Both editors when the mode edits a built text (owner, 2026-10-14: "Both"):
      // the mode's own, and the source itself, raw. The issue carries whichever
      // the reader used; the mode stays open, so switching back loses nothing.
      let onSource = false, srcArea = null;
      if (s.text) {
        const ext = (path.match(/\.([A-Za-z0-9]+)$/) || [])[1];
        const formBtn = btn("Form", "Edit in the form"), srcBtn = btn(ext ? ext.toUpperCase() : "Source", "Edit the source text");
        const sw = el("div", { className: "fa-sg-tb" }, [el("span", { className: "fa-sg-mode" }, [formBtn, srcBtn])]);
        sw.setAttribute("role", "group");
        sw.setAttribute("aria-label", "Editor");
        host.before(sw);
        const show = () => {
          formBtn.setAttribute("aria-pressed", String(!onSource));
          srcBtn.setAttribute("aria-pressed", String(onSource));
          formBox.hidden = onSource;
          srcBox.hidden = !onSource;
        };
        formBtn.onclick = () => { onSource = false; show(); };
        srcBtn.onclick = () => {
          if (!srcArea) { srcArea = el("textarea", { value: original }); srcArea.setAttribute("aria-label", "The source: " + path); srcBox.append(srcArea); }
          onSource = true; show(); srcArea.focus();
        };
        show();
      }
      status.textContent = notes.join(" ");
      const sourceIssue = async () => {
        const now = srcArea.value;
        if (now === original) { status.textContent = "Nothing has changed yet."; return; }
        const body = facts.concat(["", "**Suggested change**, made in the source (" + path + "):", "", "\u0060\u0060\u0060diff", lineDiff(original, now), "\u0060\u0060\u0060", "", "**Why:**", reason(), ""]).join("\n");
        if (await openIssue(c.repo || repo, "Suggested edit: " + s.label, body, undefined, status)) close.onclick();
      };
      send.disabled = false;
      send.onclick = async () => {
        if (onSource) return sourceIssue();
        let now;
        try { now = await surface.get(); } catch (e) { status.textContent = "Could not read the edit: " + e.message; return; }
        if (typeof now !== "string" || now === text) { status.textContent = "Nothing has changed yet."; return; }
        let found = [];
        if (typeof mod.check === "function") {
          try { found = (await mod.check(text, now, { kg: (await kgReferences(c)) || undefined })) || []; }
          catch (e) { found = [{ severity: "warning", message: "the checker failed: " + e.message }]; }
        }
        vars.replaceChildren(...found.map(findingItem));
        const errs = found.filter((f) => f.severity === "error");
        if (errs.length) { status.textContent = "Fix first: " + errs.map((f) => String(f.message).slice(0, 60)).join(" \u00b7 "); return; }
        let custom = null;
        if (typeof mod.issue === "function") { try { custom = await mod.issue(text, now, ctx); } catch { custom = null; } }
        const title = (custom && custom.title) || "Suggested edit: " + s.label;
        // A mode's own body keeps the reader's reason: appended when the body does not already carry it.
        const why = reason();
        const own = custom && custom.body ? (why && custom.body.indexOf(why) < 0 ? custom.body + "\n\n**Why:**\n" + why + "\n" : custom.body) : null;
        const issueBody = own || facts.concat(["", "**Suggested change**, made in the " + (prof.id || "profile") + " editor:", "", "\u0060\u0060\u0060diff", lineDiff(text, now), "\u0060\u0060\u0060", "", "**Why:**", reason(), ""]).join("\n");
        if (await openIssue(c.repo || repo, title, issueBody, custom && custom.template, status)) close.onclick();
      };
      return;
    }
    const km = (c.suggest && c.suggest.katexMacros) || {};
    const macros = mod && typeof mod.macros === "function" ? mod.macros(km) : undefined;
    const kg = mod && typeof mod.check === "function" ? await kgReferences(c) : null;
    // The harness's tokens and the profile's. A profile whose module keeps its
    // own syntax verbatim (remarkFirst) must not have it wrapped in \u27e6 \u27e7
    // as well, and one whose module loaded checks its own syntax: its tokens
    // are shielded and checked here only when its module is not.
    const tokens = faSuggestTokens(prof && prof.tokens);
    const shield = (t) => tokens.wrap(t, !!(mod && mod.remarkFirst));
    const syntaxErrors = (t) => tokens.errors(t, !!mod);
    const wrapped = shield(body);
    let katex = null, lib = null, visualBase = null;
    // Each surface choice takes a ticket; a visual editor still opening when
    // a newer choice (a timeout, Raw, closing the dialog) is made is dropped.
    let ticket = 0;
    const abandoned = () => new Error("abandoned");
    // The visual surface: Crepe, with the profile's feature settings, node views
    // and first remark transformer, the toolbar's commands and the change
    // marks. Its base is Crepe's round-trip of the SOURCE, kept across a
    // switch to raw and back, so escapes Crepe adds are not counted as the
    // reader's change and the marks always compare with the source.
    const visual = async (text) => {
      // The site's own bundle (suggest-editor.ts): Crepe and KaTeX from one
      // copy of ProseMirror, its stylesheet with every import resolved.
      const sc = c.suggest || {};
      const mine = ++ticket;
      const live = () => mine === ticket && dlg.isConnected;
      lib = lib || (await editorBundle());
      const Crepe = lib.Crepe;
      if (mod && mod.nodeViews && !katex) katex = sc.katex ? (await import(sc.katex)).default : lib.default;
      if (!live()) throw abandoned();
      const box = el("div");
      host.replaceChildren(box);
      // The dialog's own toolbar replaces Crepe's selection toolbar, and
      // Crepe's block handle (the wide left gutter) is not used here.
      const opts = { root: box, defaultValue: text, features: { [Crepe.Feature.Toolbar]: false, [Crepe.Feature.BlockEdit]: false } };
      if (mod && typeof mod.featureConfigs === "function") opts.featureConfigs = mod.featureConfigs(Crepe.Feature, km);
      const crepe = new Crepe(opts);
      let baseBlocks = null;
      const marks = lib.Plugin && lib.DecorationSet ? changeMarks(lib, () => baseBlocks) : null;
      // Milkdown's own InitReady timer, found in the schema's wait list so no
      // second copy of @milkdown/core is imported: after it, before the schema
      // builds the parser, is when a remark plugin can still go first, and
      // before the editor state is made a ProseMirror plugin can still join.
      crepe.editor.use((ctx) => {
        const init = (ctx.get("schemaTimer") || []).find((t) => t && t.name === "InitReady");
        return async () => {
          if (init) await ctx.wait(init);
          if (mod && typeof mod.remarkFirst === "function") ctx.update("remarkPlugins", mod.remarkFirst(macros));
          if (mod && mod.nodeViews && katex) ctx.update("nodeView", (v) => v.concat(Object.keys(mod.nodeViews).map((n) => [n, mod.nodeViews[n](katex, km)])));
          if (marks) ctx.update("prosePlugins", (p) => p.concat([marks.plugin]));
        };
      });
      await crepe.create();
      if (!live()) { try { crepe.destroy(); } catch {} throw abandoned(); }
      const view = crepe.editor.action((ctx) => ctx.get("editorView"));
      const run = (cmd, payload) => { view.focus(); crepe.editor.action(lib.callCommand(cmd.key, payload)); };
      const get = () => unwrap(crepe.getMarkdown());
      // The base, and the marks, are the SOURCE as Crepe shows it: this
      // editor's first document when it opened on the source, else a probe
      // editor's (it opened on text carried over from the raw pane).
      if (text === wrapped) {
        if (visualBase === null) visualBase = get();
        if (marks) baseBlocks = baseBlocksOf(view.state.doc);
      } else if (marks || visualBase === null) {
        const probe = new Crepe({ root: el("div"), defaultValue: wrapped, features: { [Crepe.Feature.Toolbar]: false, [Crepe.Feature.BlockEdit]: false } });
        probe.editor.use((ctx) => { const init = (ctx.get("schemaTimer") || []).find((t) => t && t.name === "InitReady"); return async () => { if (init) await ctx.wait(init); if (mod && typeof mod.remarkFirst === "function") ctx.update("remarkPlugins", mod.remarkFirst(macros)); }; });
        await probe.create();
        if (visualBase === null) visualBase = unwrap(probe.getMarkdown());
        if (marks) baseBlocks = baseBlocksOf(probe.editor.action((ctx) => ctx.get("editorView")).state.doc);
        probe.destroy();
        if (!live()) { try { crepe.destroy(); } catch {} throw abandoned(); }
      }
      if (marks) view.dispatch(view.state.tr.setMeta(marks.key, true));
      return {
        name: "visual", get: get, base: visualBase, changes: () => (marks ? marks.count() : null),
        destroy: () => { try { crepe.destroy(); } catch {} },
        bold: () => run(lib.toggleStrongCommand), italic: () => run(lib.toggleEmphasisCommand), strike: () => run(lib.toggleStrikethroughCommand),
        heading: () => run(lib.wrapInHeadingCommand, 3), bullets: () => run(lib.wrapInBulletListCommand), numbers: () => run(lib.wrapInOrderedListCommand),
        code: () => run(lib.toggleInlineCodeCommand), undo: () => run(lib.undoCommand), redo: () => run(lib.redoCommand),
        link: () => { const href = window.prompt("Link address"); if (href) run(lib.toggleLinkCommand, { href: href }); },
      };
    };
    // The raw surface: the block's Markdown exactly as it is; the toolbar types Markdown.
    const rawSurface = (text) => {
      ticket++;
      const ta = el("textarea", { value: text });
      ta.setAttribute("aria-label", "The block's Markdown");
      host.replaceChildren(ta);
      const ex = (c2) => () => { ta.focus(); document.execCommand(c2); };
      return {
        name: "raw", get: () => ta.value, base: body, changes: () => null, destroy: () => {},
        bold: () => rawWrap(ta, "**", "**"), italic: () => rawWrap(ta, "_", "_"), strike: () => rawWrap(ta, "~~", "~~"),
        heading: () => rawWrap(ta, "", "", "### "), bullets: () => rawWrap(ta, "", "", "- "), numbers: () => rawWrap(ta, "", "", "1. "),
        code: () => rawWrap(ta, "\u0060", "\u0060"), undo: ex("undo"), redo: ex("redo"),
        link: () => { const href = window.prompt("Link address"); if (href) rawWrap(ta, "[", "](" + href + ")"); },
      };
    };
    // The toolbar: the same buttons on both surfaces.
    const tools = [["B", "Bold", "bold"], ["I", "Italic", "italic"], ["S", "Strikethrough", "strike"], null, ["H", "Heading", "heading"], ["\u2022", "Bulleted list", "bullets"], ["1.", "Numbered list", "numbers"], null, ["\ud83d\udd17", "Link", "link"], ["</>", "Code", "code"], null, ["\u21b6", "Undo", "undo"], ["\u21b7", "Redo", "redo"]];
    for (const t of tools) {
      if (!t) { toolbar.append(el("span", { className: "fa-sg-sep" })); continue; }
      const b = btn(t[0], t[1]);
      if (t[2] === "bold") b.style.fontWeight = "700";
      if (t[2] === "italic") b.style.fontStyle = "italic";
      if (t[2] === "strike") b.style.textDecoration = "line-through";
      b.onmousedown = (e) => e.preventDefault();
      b.onclick = () => { if (surface && surface[t[2]]) surface[t[2]](); };
      toolbar.append(b);
    }
    toolbar.append(el("span", { className: "fa-sg-note", textContent: "No underline: underlined text means added." }), mode);
    const rawFirst = !!(prof && prof.rawFirstFor && prof.rawFirstFor.indexOf(kind) >= 0);
    const show = () => {
      visualBtn.setAttribute("aria-pressed", String(surface.name === "visual"));
      rawBtn.setAttribute("aria-pressed", String(surface.name === "raw"));
    };
    // The visual editor, unless it does not open in time: then the raw pane.
    const visualInTime = (text) => new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("it did not open within " + VISUAL_WAIT_MS / 1000 + " seconds; press Visual to try again")), VISUAL_WAIT_MS);
      visual(text).then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
    });
    try {
      surface = rawFirst ? rawSurface(body) : await visualInTime(wrapped);
    } catch (e) {
      // No editor bundle, or it failed: the same flow over plain Markdown.
      surface = rawSurface(body);
      notes.push("The visual editor did not load (" + e.message + "); editing the Markdown directly.");
    }
    show();
    const describe = () => (surface.name === "raw" ? "Editing the raw Markdown." : wrapped === body ? "" : "Variables, glossary terms and references are shown in \u27e6 \u27e7: change, add or delete them freely; their syntax is checked when you submit.");
    status.textContent = notes.concat([describe()]).filter(Boolean).join(" ");
    const switchTo = async (next) => {
      if (surface.name === next) return;
      const text = surface.get();
      surface.destroy();
      status.textContent = next === "raw" ? "" : "Opening the visual editor …";
      try { surface = next === "raw" ? rawSurface(text) : await visualInTime(shield(text)); }
      catch (e) { surface = rawSurface(text); notes.push("The visual editor did not load (" + e.message + ")."); }
      show();
      status.textContent = notes.concat([describe()]).filter(Boolean).join(" ");
    };
    visualBtn.onclick = () => switchTo("visual");
    rawBtn.onclick = () => switchTo("raw");
    // What the profile's checker says the edit introduces: errors block, warnings do not.
    const findings = (text) => {
      if (!mod || typeof mod.check !== "function" || text === surface.base) return [];
      try { return mod.check(surface.base, text, { macros: macros, kg: kg || undefined }) || []; }
      catch (e) { return [{ severity: "warning", message: "the checker failed: " + e.message, line: 0 }]; }
    };
    // Live: how many changes, each variable and its current value, any item
    // whose syntax is broken, and the profile's findings.
    const refresh = () => {
      if (!dlg.isConnected || !surface) return clearInterval(timer);
      const text = surface.get();
      const n = surface.changes();
      const items = [];
      if (n !== null) {
        const li = el("li", {}, [n ? n + (n === 1 ? " change: " : " changes: ") : "No changes yet. ", ...(n ? [Object.assign(document.createElement("ins"), { className: "fa-sg-ins", textContent: "added" }), " ", Object.assign(document.createElement("del"), { className: "fa-sg-del", textContent: "removed" })] : [])]);
        items.push(li);
      } else if (text !== surface.base) items.push(el("li", { textContent: "Changed. Switch to Visual to see the changes marked." }));
      for (const k of variablesIn(text)) { const v = valueOf(k); items.push(el("li", { textContent: k + (v === undefined ? (values ? " \u2014 not a published variable" : " \u2014 value not published") : " = " + v) })); }
      for (const b of syntaxErrors(text)) items.push(el("li", { className: "bad", textContent: "Not well-formed: " + b.slice(0, 80) }));
      for (const f of findings(text)) items.push(findingItem(f));
      vars.replaceChildren(...items);
    };
    timer = setInterval(refresh, 800);
    refresh();
    send.disabled = false;
    send.onclick = async () => {
      const now = surface.get();
      if (now === surface.base) { status.textContent = "Nothing has changed yet."; return; }
      const errs = syntaxErrors(now).concat(findings(now).filter((f) => f.severity === "error").map((f) => f.message));
      if (errs.length) { status.textContent = "Fix the syntax first: " + errs.map((e) => e.slice(0, 60)).join(" \u00b7 "); return; }
      const how = surface.name === "raw" ? "in the raw editor" : "in the visual editor (the diff is against the editor's rendering of the source)";
      const issue = facts.concat(["", "**Suggested change**, made " + how + ":", "", "\u0060\u0060\u0060diff", lineDiff(surface.base, now), "\u0060\u0060\u0060", "", "**Why:**", reason(), ""]).join("\n");
      if (await openIssue(c.repo || repo, "Suggested edit: " + s.label, issue, undefined, status)) close.onclick();
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
      if (!s || !suggestable(config(), s)) continue;
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
      if (a && a.dataset.faLink === "suggest") editorBundle().catch(() => {});
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
