/**
 * The LINEAR FLOOR — every note, in document order, as server-rendered HTML.
 *
 * @module scripts/todo-listing
 *
 * ## Why this exists at all
 *
 * Owner, 2026-09-21: *"this dymanic moving state is overlayed, its an 'extra'.
 * on stndard folio just simple tile based listing"*, and from the original ask
 * *"but ALWAYS collapsable to linearly rendablee/just the docs."*
 *
 * **The tile listing is the artefact and the board is the overlay**, which is
 * the opposite of how it was built. Measured on `main`, 2026-09-21:
 * `docs-ui.js` reads `meta[name="fa-todo-src"]`, `fetch`es
 * `assets/todos/index.json` and builds every sticky in the DOM. With
 * JavaScript off, a reader gets **nothing** — no note, no count, no hint that
 * notes exist. That is not a degraded board; it is an absent artefact.
 *
 * This is an accessibility floor rather than a fallback. A board that cannot
 * be read linearly cannot be read by a screen reader, printed, or translated,
 * and this instance's declared interaction profile is **low-dexterity**, which
 * is why the Pin control is already a button rather than a drag.
 *
 * ## One function, two callers, and why that is not drift
 *
 * `gen-docs-pages.ts` emits this into the site as a generated include; the
 * e2e that loads a page with `javaScriptEnabled: false` renders the same
 * function and serves the result. **Everything that could drift — the field
 * set, the order, the escaping, the element structure — is this function's**,
 * so the test and the site cannot disagree about any of it.
 *
 * The ONE thing that differs is the attachment link, and it differs because
 * Jekyll owns `baseurl`: on the site the href must go through
 * `relative_url`, which is a Liquid filter and means nothing to a static
 * server. So the caller supplies {@link TodoListingOptions.pageHref} and
 * nothing else. Stating the limit rather than hiding it: the e2e proves the
 * LISTING is served and readable without JavaScript, not that Jekyll's
 * `baseurl` resolution is correct — `site-links.test.ts` is what covers that.
 *
 * ## Document order is the input's order, and it is already deterministic
 *
 * `readTodoFiles` sorts, so the array this receives is stable across
 * regenerations. This function must therefore **never** sort, filter or
 * reverse: the board may stack by BPMN subprocess depth, and the floor
 * deliberately does not, because "document order" is the property a screen
 * reader and a printout depend on.
 *
 * ## Everything is escaped, and the reason is not hypothetical
 *
 * A note's `summary` and `comment` are authored — by a person, or by an agent
 * on their behalf — and land in HTML here. `docs-ui.js` reaches the DOM
 * through `textContent` for exactly this reason; a string renderer has no
 * such affordance, so {@link escapeHtml} is applied to every interpolated
 * value without exception, including ones that "cannot" contain markup.
 */
import type { TodoIndexItem } from "../schemas/todo-index.js";
import { safeHref } from "../schemas/safe-url.js";

/** How the caller turns a note's attachment into an href it can serve. */
export interface TodoListingOptions {
  /**
   * The link to a note's attachment, or `undefined` for none.
   *
   * `undefined` is a real answer and the honest one when the caller cannot
   * produce a URL a reader could follow: bean `pb04` — a dead link is worse
   * than no link — so the listing then names the page and node as text.
   */
  pageHref?: (page: string, node: string) => string | undefined;
}

/**
 * HTML-escape, including both quote characters.
 *
 * `'` is escaped as well as `"` because an attribute value in this file may
 * legitimately be single-quoted by a later edit, and an escaper that is only
 * correct for today's quoting style is one refactor from a hole.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Paragraphs, split on blank lines — the same split `docs-ui.js` performs. */
function paragraphs(text: string): string[] {
  return String(text ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p !== "");
}

function metaRow(label: string, value: string): string {
  return `        <dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`;
}

function renderItem(item: TodoIndexItem, opts: TodoListingOptions): string {
  const lines: string[] = [];
  // `data-fa-todo` is how `docs-ui.js` finds the slot it is overlaying. The
  // board does not REPLACE this element — see `board-windows`: an action whose
  // inverse is not reachable is not a toggle, and a listing the board removed
  // would have no way back with the board open.
  lines.push(
    `    <li class="fa-todo-listing-item" id="fa-todo-listing-${escapeHtml(item.id)}" ` +
      `data-fa-todo="${escapeHtml(item.id)}">`,
  );
  lines.push(`      <h3 class="fa-todo-listing-summary">${escapeHtml(item.summary)}</h3>`);
  lines.push(`      <dl class="fa-todo-listing-meta">`);
  lines.push(metaRow("Status", item.status));
  lines.push(metaRow("Priority", item.priority));
  if (item.origin !== undefined) lines.push(metaRow("Raised by", item.origin));
  lines.push(metaRow("Created", item.createdAt));
  if (item.target !== undefined) {
    // The parts, never the composite: `target` exists precisely so a consumer
    // — this one included — never splits `sec:<page>-<node>` to find out which
    // page a note is on. See `schemas/todo-index.ts`.
    const { page, node } = item.target;
    // The caller's own composition, still checked: `gen-docs-pages.ts` passes a
    // Liquid `relative_url` call, which `safeHref` reads as a relative
    // reference and lets through — so the check costs the legitimate case
    // nothing and refuses the one that matters.
    const href = safeHref(opts.pageHref?.(page, node));
    const text = `${escapeHtml(page)} &rsaquo; ${escapeHtml(node)}`;
    lines.push(
      `        <dt>About</dt><dd>` +
        (href === undefined ? text : `<a href="${href}">${text}</a>`) +
        `</dd>`,
    );
  } else if (item.targetLabel !== undefined) {
    // A label that resolved to no block in this build. Reported rather than
    // dropped, and rather than guessed at by splitting the string.
    lines.push(
      `        <dt>About</dt><dd><code>${escapeHtml(item.targetLabel)}</code> ` +
        `<span class="fa-todo-listing-unresolved">(no block in this build carries this label)</span></dd>`,
    );
  }
  lines.push(`      </dl>`);

  const paras = paragraphs(item.comment);
  lines.push(`      <div class="fa-todo-listing-body">`);
  if (paras.length === 0) {
    // A determined empty, said as one. "No detail recorded" and "the detail
    // failed to load" are opposite facts and this one is the first.
    lines.push(`        <p class="fa-todo-listing-empty">No detail recorded.</p>`);
  } else {
    for (const p of paras) lines.push(`        <p>${escapeHtml(p)}</p>`);
  }
  lines.push(`      </div>`);

  // EVERY href goes through `safeHref` — see `schemas/safe-url.ts`. Escaping
  // closes tags and does nothing about a scheme, so an escaper here is the
  // wrong tool that looks like the right one. A refused URL renders as text
  // rather than as a link to nowhere (`pb04`).
  const links: string[] = [];
  const view = safeHref(item.viewHref);
  if (view !== undefined) links.push(`<a href="${escapeHtml(view)}">View source</a>`);
  const edit = safeHref(item.editHref);
  if (edit !== undefined) links.push(`<a href="${escapeHtml(edit)}">Edit</a>`);
  if (links.length) {
    lines.push(`      <p class="fa-todo-listing-links">${links.join(" &middot; ")}</p>`);
  }

  if (item.relations.length) {
    lines.push(`      <ul class="fa-todo-listing-relations">`);
    for (const r of item.relations) {
      const text = `${escapeHtml(r.axis)}: ${escapeHtml(r.label)}`;
      // Same `pb04` rule as the attachment: an edge that resolved to nothing
      // is shown as text, never as a link to nowhere — and now also an edge
      // whose scheme is not one a link may carry. `TodoRelationSchema.href` is
      // `z.string()`, so the schema permits what this refuses.
      const href = safeHref(r.href);
      lines.push(
        `        <li>` +
          (href === undefined ? text : `<a href="${escapeHtml(href)}">${text}</a>`) +
          `</li>`,
      );
    }
    lines.push(`      </ul>`);
  }

  lines.push(`    </li>`);
  return lines.join("\n");
}

/**
 * The whole listing, as one HTML fragment.
 *
 * Emitted on every page, because the board is launched from every page and a
 * floor that exists only where somebody remembered to put it is not a floor.
 */
export function renderTodoListing(
  items: readonly TodoIndexItem[],
  opts: TodoListingOptions = {},
): string {
  const out: string[] = [];
  out.push(
    `<section class="fa-todo-listing" id="fa-todo-listing" ` +
      `aria-labelledby="fa-todo-listing-heading" data-fa-todo-count="${items.length}">`,
  );
  out.push(
    `  <h2 class="fa-todo-listing-heading" id="fa-todo-listing-heading">` +
      `Open notes (${items.length})</h2>`,
  );
  out.push(
    `  <p class="fa-todo-listing-lead">Every note in this folio, in document order. ` +
      `This listing is the artefact; the board is an overlay over it.</p>`,
  );
  if (items.length === 0) {
    // Zero notes is a DETERMINED empty and says so. The failure this guards
    // against is the other one — a board that opens empty is
    // indistinguishable from a person with nothing outstanding.
    out.push(`  <p class="fa-todo-listing-none">No notes are open in this folio.</p>`);
  } else {
    out.push(`  <ol class="fa-todo-listing-items">`);
    for (const item of items) out.push(renderItem(item, opts));
    out.push(`  </ol>`);
  }
  out.push(`</section>`);
  return out.join("\n") + "\n";
}
