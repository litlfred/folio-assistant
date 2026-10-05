// folio-site: the loader every shell page shares (build-folio-site.ts).
// A shell names its paper and its path below the paper; this fetches the
// paper's outline, lays out contents and breadcrumbs from it, and loads the
// scope's blocks (KG nodes with rendered HTML) a unit at a time as the reader
// scrolls. Math is rendered by KaTeX as it nears the viewport.
(async () => {
  const body = document.body;
  const root = body.dataset.root || "./";
  const paper = body.dataset.paper;
  const path = body.dataset.path || "";
  const $ = (id) => document.getElementById(id);
  const content = $("content");
  const el = (tag, attrs = {}, text) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = text;
    return e;
  };
  // A title may carry `$…$`; it becomes a math node like a block's.
  const titled = (text) => {
    const f = document.createDocumentFragment();
    String(text).split(/(\$[^$]+\$)/).forEach((part) => {
      if (/^\$[^$]+\$$/.test(part)) f.append(Object.assign(document.createElement("code"), { className: "math-inline", textContent: part.slice(1, -1) }));
      else if (part) f.append(part);
    });
    return f;
  };
  const link = (h, text) => { const a = el("a", { href: h }); a.append(titled(text)); return a; };
  const getJSON = async (u) => { const r = await fetch(u); if (!r.ok) throw new Error(`${u}: ${r.status}`); return r.json(); };

  if (!paper) {
    const { papers } = await getJSON(root + "papers.json");
    content.replaceChildren(...papers.map((p) => { const li = el("p"); li.append(el("a", { href: `${root}${p.slug}/` }, p.title)); return li; }));
    return;
  }

  const pbase = `${root}${paper}/`;
  const outline = await getJSON(pbase + "outline.json");
  const segs = path ? path.split("/") : [];
  const href = (p) => `${pbase}${p ? p + "/" : ""}`;

  // ── Contents and breadcrumbs, from the outline ──
  const tocList = (items, prefix) => {
    const ul = el("ul");
    for (const it of items) {
      const p = prefix ? `${prefix}/${it.slug}` : it.slug;
      const li = el("li");
      const a = link(href(p), it.title);
      if (p === path) a.setAttribute("aria-current", "page");
      li.append(a);
      if (it.sections && it.sections.length && (path === p || path.startsWith(p + "/"))) li.append(tocList(it.sections, p));
      ul.append(li);
    }
    return ul;
  };
  const tocHead = el("p"); tocHead.append(link(href(""), outline.title));
  $("toc").replaceChildren(tocHead, tocList(outline.chapters, ""));

  let node = null; const trail = [];
  if (segs.length) {
    node = outline.chapters.find((c) => c.slug === segs[0]);
    if (node) trail.push([node.title, segs[0]]);
    for (let i = 1; node && i < segs.length; i++) {
      node = node.sections.find((s) => s.slug === segs[i]);
      if (node) trail.push([node.title, segs.slice(0, i + 1).join("/")]);
    }
    if (!node) { content.replaceChildren(el("p", {}, "This page is not in the outline.")); return; }
  }
  const crumbs = $("crumbs");
  crumbs.append(el("a", { href: href("") }, outline.title));
  for (const [t, p] of trail.slice(0, -1)) { crumbs.append(" › "); crumbs.append(link(href(p), t)); }

  // ── The scope as a list of units, each one section's own blocks ──
  const units = [];
  const flatten = (sec, p, level) => {
    units.push({ title: sec.title, label: sec.label, path: p, level, blocks: sec.blocks });
    for (const sub of sec.sections) flatten(sub, `${p}/${sub.slug}`, level + 1);
  };
  if (!node) for (const ch of outline.chapters) { units.push({ title: ch.title, label: ch.label, path: ch.slug, level: 2, blocks: [], chapter: true }); for (const s of ch.sections) flatten(s, `${ch.slug}/${s.slug}`, 3); }
  else if (segs.length === 1) for (const s of node.sections) flatten(s, `${segs[0]}/${s.slug}`, 2);
  else { units.push({ title: "", path, level: 2, blocks: node.blocks, self: true }); for (const s of node.sections) flatten(s, `${path}/${s.slug}`, 3); }

  // ── Math, rendered lazily ──
  let katexReady = null;
  const loadKatex = () => katexReady ??= new Promise((ok) => {
    const css = el("link", { rel: "stylesheet", href: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" });
    const js = el("script", { src: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" });
    js.onload = ok; document.head.append(css, js);
  });
  const mathIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      mathIO.unobserve(e.target);
      const m = e.target, display = m.classList.contains("math-display");
      const out = el(display ? "div" : "span");
      try { katex.render(m.textContent, out, { throwOnError: false, displayMode: display, macros: outline.macros }); } catch { continue; }
      (display && m.parentElement && m.parentElement.tagName === "PRE" ? m.parentElement : m).replaceWith(out);
    }
  }, { rootMargin: "1500px 0px" });
  const watchMath = async (scope) => {
    const nodes = scope.querySelectorAll("code.math-inline, code.math-display");
    if (!nodes.length || !outline.math) return;
    await loadKatex();
    nodes.forEach((n) => mathIO.observe(n));
  };

  const h1 = document.querySelector("main h1");
  if (h1 && h1.textContent.includes("$")) { const t = h1.textContent; h1.replaceChildren(titled(t)); }
  for (const scope of [$("toc"), crumbs, h1]) if (scope) watchMath(scope);

  // ── Incremental loading ──
  content.replaceChildren();
  let next = 0;
  const loadUnit = async () => {
    if (next >= units.length) return false;
    const u = units[next++];
    const box = el("section", { class: "unit" });
    if (u.label) box.id = u.label;
    if (!u.self) { const h = el(`h${Math.min(6, u.level)}`); h.append(link(href(u.path), u.title)); box.append(h); }
    content.append(box);
    const nodes = await Promise.all(u.blocks.map((b) => getJSON(pbase + b).catch((e) => ({ html: `<p class="muted">${String(e.message)}</p>` }))));
    for (const n of nodes) {
      const d = el("div", { class: "block" });
      d.innerHTML = n.html || "";
      // Pre-rendered figures name a path below the paper; resolve it here, since this block may sit at any depth.
      for (const img of d.querySelectorAll("img[data-src]")) img.src = pbase + img.getAttribute("data-src");
      box.append(d);
    }
    await watchMath(box);
    return true;
  };
  const sentinel = el("p", { class: "muted" }, "…");
  const fill = async () => { while (sentinel.getBoundingClientRect().top < innerHeight * 3 && await loadUnit()) content.append(sentinel); if (next >= units.length) sentinel.remove(); };
  content.append(sentinel);
  new IntersectionObserver((e) => { if (e[0].isIntersecting) fill(); }, { rootMargin: "2000px 0px" }).observe(sentinel);

  // ── Cross-references: load to the target, or go to the page that holds it ──
  const goTo = async (label) => {
    const where = outline.labels[label];
    if (where === undefined) return false;
    const inScope = !path || where === path || where.startsWith(path + "/");
    if (!inScope) { location.href = `${href(where)}#${encodeURIComponent(label)}`; return true; }
    while (!document.getElementById(label) && await loadUnit()) content.append(sentinel);
    document.getElementById(label)?.scrollIntoView();
    return true;
  };
  document.addEventListener("click", (ev) => {
    const a = ev.target.closest && ev.target.closest('a[href^="#"]');
    if (!a) return;
    const label = decodeURIComponent(a.getAttribute("href").slice(1));
    if (document.getElementById(label)) return;
    ev.preventDefault();
    goTo(label).then((ok) => { if (ok) history.replaceState(null, "", `#${encodeURIComponent(label)}`); });
  });
  if (location.hash) await goTo(decodeURIComponent(location.hash.slice(1)));
  await fill();
})();
