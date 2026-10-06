/**
 * The review page's RENDERED list (bean `bnjs`, issue #971): which pages of the
 * built site a Change Set alters, read in the reader's browser from the
 * preview's own `rendered-impact.json`.
 *
 * Owner, 2026-10-06: *"do the staging build step with dynamic loading on
 * review page"*. So the page is static and carries no list: it fetches the
 * file the staging build published (one `rendered-impact/v1` per renderer)
 * when it is opened, as it fetches `changeset.json`. A preview whose build
 * published no such file says so in words; an empty list is never shown in
 * its place, because "no page changed" and "nobody computed which" are
 * different facts.
 *
 * Both functions are embedded in the page by `toString()`, like the heat map
 * and the outline, so they must stay self-contained: no imports, no closures
 * over module state, `var` only where the page's ES5 target needs it.
 *
 * @module cat-harness/scripts/review-rendered
 */

/** One link row: what a reviewer opens. */
export interface RenderedRow {
  renderer: string;
  path: string;
  anchor?: string;
  role: string;
  change: string;
  /** Relative to the review page (`review/`), so `../<path>`. */
  after: string;
  /** On the before side's published site; absent when the page does not know it. */
  before?: string;
}

export interface RenderedModel {
  rows: RenderedRow[];
  /** Index files (search data, outlines, artefact lists): counted, not listed. */
  indexCount: number;
  /** Inputs a renderer could not place: "not known", never "no change". */
  unknown: Array<{ renderer: string; input: string; reason: string; scope: string }>;
  renderers: string[];
}

/**
 * The model the list is drawn from: one row per content or data file, one per
 * anchor where the file names several (a document page with a changed block
 * each), in path order within each renderer. Accepts one impact or an array,
 * as the CLI writes either.
 */
export function renderedModel(impacts: unknown, mainSite?: string | null): RenderedModel {
  const list = (Array.isArray(impacts) ? impacts : [impacts]) as Array<{
    renderer: string;
    files: Array<{ path: string; change: string; role: string; anchors?: string[] }>;
    undetermined?: Array<{ input: string; reason: string; scope?: string }>;
  }>;
  const base = mainSite ? String(mainSite).replace(/\/?$/, "/") : null;
  const model: RenderedModel = { rows: [], indexCount: 0, unknown: [], renderers: [] };
  list.forEach(function (imp) {
    if (!imp || !Array.isArray(imp.files)) return;
    model.renderers.push(imp.renderer);
    imp.files
      .slice()
      .sort(function (a, b) { return a.path < b.path ? -1 : a.path > b.path ? 1 : 0; })
      .forEach(function (f) {
        if (f.role === "index") { model.indexCount++; return; }
        const anchors = f.anchors && f.anchors.length ? f.anchors : [undefined];
        anchors.forEach(function (a) {
          const frag = a ? "#" + encodeURIComponent(a) : "";
          const row: RenderedRow = { renderer: imp.renderer, path: f.path, role: f.role, change: f.change, after: "../" + f.path + frag };
          if (a) row.anchor = a;
          if (base && f.change !== "added") row.before = base + f.path + frag;
          model.rows.push(row);
        });
      });
    (imp.undetermined || []).forEach(function (u) {
      model.unknown.push({ renderer: imp.renderer, input: u.input, reason: u.reason, scope: u.scope || "unknown" });
    });
  });
  return model;
}

/**
 * Draw the model into `box`, by textContent only: a path or a reason is the
 * folio's text and is never parsed as markup.
 */
export function renderRendered(box: HTMLElement, model: RenderedModel): void {
  function el(tag: string, text?: string | null, cls?: string) {
    const e = document.createElement(tag);
    if (text != null) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }
  box.textContent = "";
  if (!model.rows.length && !model.unknown.length) {
    box.appendChild(el("p", "No rendered page changes: every renderer placed every changed input, and none reaches a page. " + model.indexCount + " index file(s) change.", "muted"));
    return;
  }
  box.appendChild(el("p", model.rows.length + " page(s) to review, from " + model.renderers.join(", ") + "." + (model.indexCount ? " " + model.indexCount + " index file(s) also change and are not listed." : ""), "muted"));
  const ul = el("ul");
  model.rows.forEach(function (r) {
    const li = el("li");
    li.appendChild(el("span", r.change, "kind"));
    li.appendChild(el("span", r.path + (r.anchor ? " › " + r.anchor : ""), "label"));
    li.appendChild(document.createTextNode(" "));
    const after = el("a", "after") as HTMLAnchorElement;
    after.href = r.after;
    li.appendChild(after);
    if (r.before) {
      li.appendChild(document.createTextNode(" · "));
      const before = el("a", "before") as HTMLAnchorElement;
      before.href = r.before;
      li.appendChild(before);
    }
    ul.appendChild(li);
  });
  box.appendChild(ul);
  if (model.unknown.length) {
    box.appendChild(el("p", "Not known: these inputs could not be placed, so any page may have changed. This is not “no change”.", "muted"));
    const uk = el("ul");
    model.unknown.forEach(function (u) {
      uk.appendChild(el("li", u.input + " (" + u.renderer + ", " + (u.scope === "all" ? "any page" : "unknown pages") + "): " + u.reason));
    });
    box.appendChild(uk);
  }
}
