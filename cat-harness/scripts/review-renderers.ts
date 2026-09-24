/**
 * The diff renderers the review page runs in the reviewer's browser. Bean
 * `d903`. Their registry, what each needs and which block kinds each is the
 * default for, is `schemas/diff-renderers.ts`.
 *
 * Every function here is SELF-CONTAINED: it closes over nothing in this
 * module and gets what it needs as arguments. `gen-review-page` embeds each
 * one with `toString()`, so the code the e2e test drives is the code the page
 * runs. A copy inside the page's script string would be free to drift.
 *
 * ## Rendered HTML is the folio's own, and it is still cleaned
 *
 * The inline renderer shows a block AS RENDERED, so it must place HTML. That
 * HTML is `changeset-text.json`'s: the folio's own prose, rendered by the
 * platform in the folio's own staging job. That is the same trust as the
 * preview page beside it. It is parsed with `DOMParser` into a detached
 * document, never assigned to `innerHTML`, and {@link cleanRendered} removes
 * what has no business in a diff:
 * - scripts and anything that embeds another document;
 * - `on*` handler attributes;
 * - `javascript:` URLs.
 *
 * A block label, which is data rather than markup, still only ever goes
 * through `textContent`.
 */

/** Parse rendered HTML into a detached, cleaned body. */
export function cleanRendered(doc: Document, html: string): HTMLElement {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  parsed.querySelectorAll("script,iframe,object,embed,frame,frameset,link,meta,base,form").forEach((n) => n.remove());
  parsed.querySelectorAll("*").forEach((el) => {
    for (const a of Array.from(el.attributes)) {
      const v = a.value.replace(/[\s\u0000-\u001f]/g, "").toLowerCase();
      if (/^on/i.test(a.name) || ((a.name === "href" || a.name === "src" || a.name === "xlink:href") && v.startsWith("javascript:"))) {
        el.removeAttribute(a.name);
      }
    }
  });
  return doc.importNode(parsed.body, true) as HTMLElement;
}

/** The source-level word diff: `<del>` removed, `<ins>` added, the rest as typed. */
export function renderWordDiff(doc: Document, ops: Array<{ op: string; text: string }>): HTMLElement {
  const pre = doc.createElement("pre");
  pre.className = "diff diff-word";
  for (const o of ops) {
    const el = doc.createElement(o.op === "ins" ? "ins" : o.op === "del" ? "del" : "span");
    el.textContent = o.text;
    pre.appendChild(el);
  }
  return pre;
}

/**
 * The block as a reader sees it now, with the change marked in place.
 *
 * The word diff runs on the rendered TEXT of both sides. Its operations are
 * then mapped back onto the head's text nodes: an added run becomes `<ins>`
 * around exactly those characters, and a removed run is inserted as `<del>`
 * at the point where it was. The markup around the text (emphasis, links,
 * list items) is the head's own and is left intact, so the reader sees the
 * page, not the source.
 *
 * Returns a string, a reason, when the diff is too large to compute.
 */
export function renderInline(
  doc: Document,
  baseHtml: string | null,
  headHtml: string | null,
  diff: (a: string, b: string) => Array<{ op: string; text: string }> | null,
  clean: (doc: Document, html: string) => HTMLElement,
): HTMLElement | string {
  const box = doc.createElement("div");
  box.className = "diff diff-inline";
  if (headHtml === null) {
    const del = doc.createElement("del");
    if (baseHtml !== null) del.appendChild(clean(doc, baseHtml));
    box.appendChild(del);
    return box;
  }
  const head = clean(doc, headHtml);
  const baseText = baseHtml === null ? "" : clean(doc, baseHtml).textContent || "";
  const texts: Text[] = [];
  const walker = doc.createTreeWalker(head, 4 /* NodeFilter.SHOW_TEXT */);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) texts.push(n as Text);
  const headText = texts.map((t) => t.data).join("");
  const ops = diff(baseText, headText);
  if (ops === null) return "This block is too long for an inline diff. Choose the word diff or side by side.";

  // Inserted character ranges, and removed text keyed by the head offset it sat at.
  const ins: Array<[number, number]> = [];
  const dels = new Map<number, string>();
  let off = 0;
  for (const o of ops) {
    if (o.op === "same") off += o.text.length;
    else if (o.op === "ins") { ins.push([off, off + o.text.length]); off += o.text.length; }
    else if (o.text.trim()) dels.set(off, (dels.get(off) || "") + o.text);
  }
  const inIns = (i: number) => ins.some(([s, e]) => i >= s && i < e);

  let start = 0;
  texts.forEach((t, k) => {
    const end = start + t.data.length;
    const frag = doc.createDocumentFragment();
    let run = "";
    let runIns = false;
    const flush = () => {
      if (!run) return;
      if (runIns) { const e = doc.createElement("ins"); e.textContent = run; frag.appendChild(e); }
      else frag.appendChild(doc.createTextNode(run));
      run = "";
    };
    // A deletion at the boundary between two text nodes goes at the END of the
    // earlier one. Placed at the start of the later one, it would land inside
    // whatever element that node opens, so a removed plain word would read as
    // part of the new bold phrase that replaced it.
    for (let i = start; i <= end; i++) {
      if (dels.has(i) && (i > start || k === 0)) {
        flush();
        const d = doc.createElement("del");
        d.textContent = dels.get(i)!;
        frag.appendChild(d);
        dels.delete(i);
      }
      if (i === end) break;
      const isIns = inIns(i);
      if (isIns !== runIns) { flush(); runIns = isIns; }
      run += t.data[i - start];
    }
    flush();
    t.replaceWith(frag);
    start = end;
  });
  // Removed text with no head text at all to sit beside.
  for (const [, text] of dels) { const d = doc.createElement("del"); d.textContent = text; head.appendChild(d); }
  while (head.firstChild) box.appendChild(head.firstChild);
  return box;
}

/** The two published pages next to each other, each scrolled to the block. */
export function renderSideBySide(doc: Document, before: string | null, after: string | null): HTMLElement {
  const box = doc.createElement("div");
  box.className = "diff diff-sbs";
  const pane = (title: string, href: string | null) => {
    const col = doc.createElement("div");
    const h = doc.createElement("div");
    h.className = "muted";
    h.textContent = title;
    col.appendChild(h);
    if (href === null) {
      const p = doc.createElement("p");
      p.className = "muted";
      p.textContent = title === "Main" ? "Not on main: this block is new." : "Not on this preview: this block was removed.";
      col.appendChild(p);
    } else {
      const f = doc.createElement("iframe");
      f.src = href;
      f.title = title + ": " + href;
      f.loading = "lazy";
      col.appendChild(f);
    }
    return col;
  };
  box.appendChild(pane("Main", before));
  box.appendChild(pane("This preview", after));
  return box;
}

/**
 * The visual diff (bean `0rxe`): pictures of the block on each side, from the
 * `folio-block-screenshots` Tool. Four views, each ONE click on a native
 * radio button (arrow keys move between them): the changed pixels marked,
 * before, after, or both side by side. There is no slider, because a slider
 * is a drag, and the owner's rule is one key or one click.
 *
 * The share of changed pixels is stated in WORDS, so the marker colour is
 * never the only signal. A side that could not be pictured says why.
 * Self-contained: the page embeds it with `toString()`.
 */
export function renderVisual(
  doc: Document,
  v: {
    label: string;
    before: { png: string | null; missing?: string } | null;
    after: { png: string | null; missing?: string } | null;
    changed: number | null;
    diff: string | null;
  } | null,
  prefix: string,
  group: string,
): HTMLElement {
  const box = doc.createElement("div");
  box.className = "diff diff-visual";
  const note = (t: string) => {
    const p = doc.createElement("p");
    p.className = "muted";
    p.textContent = t;
    return p;
  };
  if (!v) {
    box.appendChild(note("No pictures of this block on this build."));
    return box;
  }
  const why = (s: { png: string | null; missing?: string } | null, side: string) =>
    s === null ? (side === "before" ? "Not on main: this block is new." : "Not on this preview: this block was removed.")
      : s.missing === "page" ? "Its page is not in the " + (side === "before" ? "published site" : "preview") + "."
      : s.missing === "anchor" ? "Its anchor is not on the " + (side === "before" ? "published" : "preview") + " page."
      : null;
  const pic = (src: string | null, alt: string, fallback: string | null) => {
    if (!src) return note(fallback || "No picture.");
    const i = doc.createElement("img");
    i.src = prefix + src;
    i.alt = alt;
    i.loading = "lazy";
    return i;
  };
  const summary = doc.createElement("p");
  summary.className = "kind";
  summary.textContent = v.changed === null
    ? "Only one side could be pictured, so nothing is compared."
    : v.changed === 0 ? "No pixel changed beyond anti-aliasing: the change is not visible."
    : (v.changed * 100).toFixed(1) + "% of the block's pixels changed.";
  box.appendChild(summary);
  const views: Array<[string, string, () => HTMLElement]> = [];
  if (v.diff) views.push(["diff", "Changed pixels", () => pic(v.diff, v.label + ": changed pixels marked", null)]);
  views.push(["before", "Before", () => pic(v.before && v.before.png, v.label + " on main", why(v.before, "before"))]);
  views.push(["after", "After", () => pic(v.after && v.after.png, v.label + " on this preview", why(v.after, "after"))]);
  views.push(["both", "Both", () => {
    const row = doc.createElement("div");
    row.className = "diff-sbs";
    row.appendChild(pic(v.before && v.before.png, v.label + " on main", why(v.before, "before")));
    row.appendChild(pic(v.after && v.after.png, v.label + " on this preview", why(v.after, "after")));
    return row;
  }]);
  const fs = doc.createElement("fieldset");
  fs.className = "visual-modes";
  const lg = doc.createElement("legend");
  lg.textContent = "Show";
  fs.appendChild(lg);
  const stage = doc.createElement("div");
  // Open on something to SEE: the marked diff when there is one, else the
  // side that was pictured (found by the ojcx run: a new block opened on
  // "Before", which can only say it is missing).
  const has = (s: { png: string | null } | null) => !!(s && s.png);
  const first = views.findIndex(([id]) => id === "diff" || (id === "after" && has(v.after)) || (id === "before" && has(v.before)));
  const start = first < 0 ? 0 : first;
  const show = (i: number) => {
    while (stage.firstChild) stage.removeChild(stage.firstChild);
    stage.appendChild(views[i]![2]());
  };
  views.forEach(([id, label], i) => {
    const l = doc.createElement("label");
    const r = doc.createElement("input");
    r.type = "radio";
    r.name = group;
    r.value = id;
    r.checked = i === start;
    r.addEventListener("change", () => show(i));
    l.appendChild(r);
    l.appendChild(doc.createTextNode(" " + label));
    fs.appendChild(l);
  });
  box.appendChild(fs);
  box.appendChild(stage);
  show(start);
  return box;
}
