// Lean KG viewer — loads the `lean` directory's knowledge-graph shards on demand.
//
// Data layout (written by lean-kg-ingest.ts, published by lean-kg-publish.ts):
//   data/index.json            module list + totals
//   data/names.json            search list, fetched on first search
//   data/m/<Module>.jsonld     module graph: module node + declaration nodes
//   data/m/<Module>.<k>.sig.json  rendered signatures, fetched as cards scroll in
//   data/overlay.json          optional: a branches/ overlay; modules not in
//                              `changed` are fetched from `base` instead
//   config.json                { repo, ref, contentPrefix } for block links
//
// Routes: #/  ·  #/m/<Module>  ·  #/m/<Module>/<declName>

const DATA = "data/";
const $ = (id) => document.getElementById(id);
const state = { index: null, names: null, overlay: null, config: {}, shards: new Map(), chunks: new Map() };

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.json();
}
async function optionalJSON(url) {
  try { return await getJSON(url); } catch { return null; }
}

/** Where a module's files live: the overlay for changed modules, else the base. */
function moduleBase(name) {
  const o = state.overlay;
  if (!o || o.changed.includes(name)) return DATA;
  return o.base.replace(/\/+$/, "") + "/";
}

function shard(name) {
  if (!state.shards.has(name)) state.shards.set(name, getJSON(`${moduleBase(name)}m/${name}.jsonld`));
  return state.shards.get(name);
}
function chunk(name, k) {
  const key = `${name}#${k}`;
  if (!state.chunks.has(key)) state.chunks.set(key, getJSON(`${moduleBase(name)}m/${name}.${k}.sig.json`));
  return state.chunks.get(key);
}

function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k === "text") e.textContent = v;
    else e.setAttribute(k, v);
  }
  for (const c of kids) if (c != null) e.append(c);
  return e;
}

function typeset(node) {
  if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise([node]).catch(() => {});
}

// ── HTML from the data ──────────────────────────────────────────────────────
// Docstrings (rendered by marked, which does not sanitise) and signature chunks
// (doc-gen4's header HTML, passed through lean-kg-ingest.ts with only its links
// rewritten) come from ingested Lean sources and may be fetched from a staging
// overlay's base. Neither is trusted: every piece of HTML goes through
// DOMPurify, and when DOMPurify is missing the node gets plain text instead —
// never the raw HTML.

/** The text of an HTML string, read from an inert document (nothing runs or loads). */
function htmlText(html) {
  return new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";
}
/** Put sanitised HTML into `node`, or plain text when no sanitiser is loaded. */
function setSafeHTML(node, html) {
  const purify = window.DOMPurify;
  if (purify?.isSupported && typeof purify.sanitize === "function") node.innerHTML = purify.sanitize(html);
  else node.textContent = htmlText(html);
}
/** A link target from the data: http(s) or relative, else nothing. */
function safeHref(url) {
  if (typeof url !== "string") return null;
  try {
    const u = new URL(url, location.href);
    return u.protocol === "http:" || u.protocol === "https:" ? url : null;
  } catch { return null; }
}

function renderDoc(md) {
  const d = el("div", { class: "lkg-doc" });
  if (window.marked && window.DOMPurify) setSafeHTML(d, window.marked.parse(md));
  else d.textContent = md;
  return d;
}

function blockHref(b) {
  const c = state.config;
  if (!c.repo) return b.md;
  return `https://github.com/${c.repo}/blob/${c.ref || "main"}/${c.contentPrefix || ""}${b.md}`;
}

// ── Module tree ─────────────────────────────────────────────────────────────
function countMods(node) {
  let n = node.__mod ? 1 : 0;
  for (const k of Object.keys(node)) if (k !== "__mod") n += countMods(node[k]);
  return n;
}
function buildTree() {
  const root = {};
  for (const m of state.index.modules) {
    let node = root;
    for (const part of m.name.split(".")) node = (node[part] ??= {});
    node.__mod = m;
  }
  const render = (node, prefix) => {
    const frag = document.createDocumentFragment();
    for (const key of Object.keys(node).filter((k) => k !== "__mod").sort()) {
      const child = node[key];
      const name = prefix ? `${prefix}.${key}` : key;
      const subs = Object.keys(child).filter((k) => k !== "__mod");
      const count = subs.length ? `${countMods(child)} modules` : `${child.__mod?.decls ?? 0}`;
      const link = child.__mod
        ? el("a", { href: `#/m/${name}`, "data-mod": name, text: key }, " ", el("span", { class: "n", text: `(${count})` }))
        : el("span", { text: key }, " ", el("span", { class: "n", text: `(${count})` }));
      if (subs.length === 0) frag.append(el("div", {}, link));
      else {
        const d = el("details", { "data-ns": name }, el("summary", {}, link));
        d.addEventListener("toggle", () => { if (d.open && !d.dataset.filled) { d.append(render(child, name)); d.dataset.filled = "1"; } }, { once: false });
        frag.append(d);
      }
    }
    return frag;
  };
  $("tree").replaceChildren(render(root, ""));
  $("filter").addEventListener("input", () => {
    const q = $("filter").value.trim().toLowerCase();
    if (!q) return buildTree();
    const hits = state.index.modules.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 300);
    $("tree").replaceChildren(...hits.map((m) => el("div", {}, el("a", { href: `#/m/${m.name}`, "data-mod": m.name, text: m.name }, " ", el("span", { class: "n", text: `(${m.decls})` })))));
  });
}
function markCurrent(name) {
  for (const a of document.querySelectorAll(".lkg-tree a.cur")) a.classList.remove("cur");
  const a = document.querySelector(`.lkg-tree a[data-mod="${CSS.escape(name)}"]`);
  if (a) a.classList.add("cur");
}

// ── Search ──────────────────────────────────────────────────────────────────
async function search(q) {
  if (!state.names) state.names = await getJSON(`${DATA}names.json`);
  const ql = q.toLowerCase();
  const out = [];
  for (const [name, mi, ki] of state.names) {
    const nl = name.toLowerCase();
    const i = nl.indexOf(ql);
    if (i < 0) continue;
    const score = (nl.endsWith(ql) ? 0 : 1) + (i === nl.lastIndexOf(".") + 1 ? 0 : 1) + name.length / 1000;
    out.push([score, name, mi, ki]);
    if (out.length > 4000) break;
  }
  out.sort((a, b) => a[0] - b[0]);
  return out.slice(0, 60);
}
function wireSearch() {
  const q = $("q"), hits = $("hits");
  let seq = 0;
  q.addEventListener("input", async () => {
    const v = q.value.trim(), my = ++seq;
    if (v.length < 2) { hits.hidden = true; return; }
    const res = await search(v);
    if (my !== seq) return;
    hits.replaceChildren(...res.map(([, name, mi, ki]) => {
      const mod = state.index.modules[mi].name;
      return el("li", {}, el("a", { href: `#/m/${mod}/${encodeURIComponent(name)}` }, name, el("small", { text: state.index.kinds[ki] })));
    }));
    hits.hidden = res.length === 0;
  });
  hits.addEventListener("click", () => { hits.hidden = true; });
  document.addEventListener("click", (e) => { if (!$("search").contains(e.target)) hits.hidden = true; });
}

// ── Pages ───────────────────────────────────────────────────────────────────
function home() {
  const t = state.index.totals;
  const roots = [...new Set(state.index.modules.map((m) => m.name.split(".")[0]))];
  $("main").replaceChildren(...[
    el("h1", { text: "Lean declarations" }),
    el("p", { text: `${t.modules} modules, ${t.decls} declarations; ${t.formalized} formalize a content block.` }),
    state.overlay ? el("p", { class: "lkg-note", text: `Staging overlay: ${state.overlay.changed.length} module(s) changed; the rest load from the base graph.` }) : null,
    el("ul", {}, ...roots.map((r) => el("li", {}, el("a", { href: `#/m/${r}`, text: r })))),
  ].filter(Boolean));
}

let observer = null;
async function modulePage(name, target) {
  const main = $("main");
  main.replaceChildren(el("p", { class: "lkg-note", text: `Loading ${name}…` }));
  markCurrent(name);
  let g;
  try { g = await shard(name); } catch (e) {
    main.replaceChildren(el("p", { class: "lkg-note", text: `No module ${name} in this graph (${e.message}).` }));
    return;
  }
  const [mod, ...decls] = g["@graph"];
  observer?.disconnect();
  observer = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      observer.unobserve(en.target);
      fill(en.target);
    }
  }, { rootMargin: "800px 0px" });
  async function fill(card) {
    const i = Number(card.dataset.i), k = Number(card.dataset.k);
    const sigs = await chunk(name, k);
    const sig = card.querySelector(".lkg-sig");
    sig.classList.remove("pending");
    setSafeHTML(sig, sigs[i - k * state.index.chunkSize] ?? "");
    const d = decls[i];
    if (d.doc && !card.querySelector(".lkg-doc")) card.append(renderDoc(d.doc));
    typeset(card);
  }
  const kids = [
    el("h1", { text: name }),
    el("p", { class: "lkg-imports" }, "Imports: ", ...mod.imports.flatMap((id, j) => {
      const m = id.replace(/^lean:module:/, "");
      const known = state.index.modules.some((x) => x.name === m);
      return [j ? ", " : "", known ? el("a", { href: `#/m/${m}`, text: m }) : m];
    })),
    el("p", { class: "lkg-note", text: `${decls.length} declaration(s).` }),
  ];
  let targetCard = null;
  decls.forEach((d, i) => {
    const meta = el("div", { class: "lkg-meta" },
      el("span", { class: "lkg-badge", text: d.kind }),
      el("a", { href: `#/m/${name}/${encodeURIComponent(d.name)}`, text: d.name.slice(name.length + 1) || d.name }),
      safeHref(d.sourceLink) ? el("a", { href: safeHref(d.sourceLink), target: "_blank", rel: "noopener", text: `source${d.line ? ` L${d.line}` : ""}` }) : null,
      ...(d.formalizes ?? []).map((b) => el("a", { class: "lkg-badge", href: safeHref(blockHref(b)), target: "_blank", rel: "noopener", title: "content block formalized by this declaration", text: b.label })),
    );
    const card = el("section", { class: "lkg-decl", id: d.name, "data-i": String(i), "data-k": String(d.signatureChunk) },
      meta, el("div", { class: "lkg-sig pending", text: "signature loading…" }));
    if (d.name === target) targetCard = card;
    kids.push(card);
  });
  main.replaceChildren(...kids);
  for (const c of main.querySelectorAll(".lkg-decl")) observer.observe(c);
  if (targetCard) {
    await fill(targetCard);
    targetCard.classList.add("target");
    targetCard.scrollIntoView({ block: "start" });
  } else window.scrollTo(0, 0);
}

function route() {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
  const m = /^m\/([^/]+)(?:\/(.+))?$/.exec(h);
  if (m) return modulePage(m[1], m[2]);
  return home();
}

async function start() {
  state.config = (await optionalJSON("config.json")) ?? {};
  state.overlay = await optionalJSON(`${DATA}overlay.json`);
  state.index = await getJSON(`${DATA}index.json`);
  const t = state.index.totals;
  $("totals").textContent = `${t.modules} modules · ${t.decls} declarations`;
  buildTree();
  wireSearch();
  addEventListener("hashchange", route);
  route();
}
start().catch((e) => { $("main").replaceChildren(el("p", { class: "lkg-note", text: `Could not load the graph: ${e.message}` })); });
