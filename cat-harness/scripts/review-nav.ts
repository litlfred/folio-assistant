/**
 * The review page's navigation: an outline, a breadcrumb, and a minimap. Bean
 * `eb4l`, epic `q4jm`.
 *
 * ## The owner's rulings this follows
 *
 * - **Outline on the review page only** (2026-09-22). It lists a DOCUMENT
 *   folio's chapters and sections in manifest order, from `outline.json`,
 *   which the folio's own site build writes. The "no toc" ruling for normal
 *   pages stands.
 * - **One key or one click; never a drag or a hover.** The owner works with
 *   very limited hand function.
 *
 * ## Why the minimap is ONE tab stop
 *
 * A 300-page document has thousands of blocks. As plain buttons, each cell
 * would be a tab stop, and a keyboard or switch user could not get past it.
 * So the minimap is a roving-tabindex list:
 * - one cell is reachable with Tab;
 * - Up and Down move between cells, and Home and End go to either end;
 * - Enter or Space (the cell is a native button) jumps to the block.
 * Every cell is labelled in words ("prose:dose: changed, 2 open comments, QA
 * failing"), and its visible glyphs repeat that, so colour is never the only
 * signal.
 *
 * Every function here is self-contained, and `gen-review-page` embeds each
 * one with `toString()`.
 */

export interface NavOutline {
  documents: Array<{
    slug: string;
    title: string;
    page: string;
    chapters: Array<{ title: string; sections: Array<{ key: string; title: string; blocks: string[] }> }>;
  }>;
}

/** Where a section sits: `document › chapter › section`, or null when the outline does not know it. */
export function crumbFor(outline: NavOutline | null, sectionKey: string): string | null {
  if (!outline) return null;
  for (const d of outline.documents)
    for (const ch of d.chapters)
      for (const s of ch.sections) if (s.key === sectionKey) return d.title + " › " + ch.title + " › " + s.title;
  return null;
}

/** Per-section badges, in words. */
export interface SectionBadges {
  changed: number;
  open: number;
  qaFailing: number;
}

/**
 * The outline as a `<nav>` of nested lists. A section with something to
 * review is a button that moves focus to it in the list below; any other
 * section is a link to it on the preview.
 */
export function renderOutline(
  doc: Document,
  outline: NavOutline,
  badges: (key: string) => SectionBadges | null,
  jump: (key: string) => void,
): HTMLElement {
  const nav = doc.createElement("nav");
  nav.setAttribute("aria-label", "Outline");
  nav.className = "outline";
  const h = doc.createElement("h2");
  h.textContent = "Outline";
  nav.appendChild(h);
  for (const d of outline.documents) {
    const dt = doc.createElement("div");
    dt.className = "ol-doc";
    dt.textContent = d.title;
    nav.appendChild(dt);
    const chs = doc.createElement("ol");
    for (const ch of d.chapters) {
      const cli = doc.createElement("li");
      const ct = doc.createElement("div");
      ct.className = "ol-ch";
      ct.textContent = ch.title;
      cli.appendChild(ct);
      const secs = doc.createElement("ol");
      for (const s of ch.sections) {
        const sli = doc.createElement("li");
        const b = badges(s.key);
        const words: string[] = [];
        if (b && b.changed) words.push(b.changed + " changed");
        if (b && b.open) words.push(b.open + " comment" + (b.open > 1 ? "s" : ""));
        if (b && b.qaFailing) words.push("QA failing");
        let target: HTMLElement;
        if (words.length) {
          const btn = doc.createElement("button");
          btn.type = "button";
          btn.className = "linklike";
          btn.addEventListener("click", () => jump(s.key));
          target = btn;
        } else {
          const a = doc.createElement("a");
          a.href = "../" + d.page;
          target = a;
        }
        target.textContent = s.title;
        sli.appendChild(target);
        if (words.length) {
          const w = doc.createElement("span");
          w.className = "badges";
          w.textContent = " " + words.join(", ");
          sli.appendChild(w);
        }
        secs.appendChild(sli);
      }
      cli.appendChild(secs);
      chs.appendChild(cli);
    }
    nav.appendChild(chs);
  }
  return nav;
}

/** What the minimap knows about one block. */
export interface BlockMark {
  change: "added" | "changed" | null;
  open: number;
  qaFailing: boolean;
}

/**
 * The whole document as one column of cells, in outline order. Darker means
 * more reasons to look (a change, open comments, a QA failure); glyphs and
 * the label say which.
 */
export function renderMinimap(
  doc: Document,
  outline: NavOutline,
  mark: (label: string) => BlockMark,
  jumpBlock: (label: string, page: string) => void,
): HTMLElement {
  const box = doc.createElement("div");
  box.className = "minimap";
  const h = doc.createElement("h2");
  h.id = "minimap-h";
  h.textContent = "Minimap";
  box.appendChild(h);
  const help = doc.createElement("p");
  help.className = "muted";
  help.textContent = "One cell per block, in order. Up and Down move, Enter jumps. Δ changed, + added, ● open comments, ! QA failing.";
  box.appendChild(help);
  const ol = doc.createElement("ol");
  ol.setAttribute("aria-labelledby", "minimap-h");
  const cells: HTMLButtonElement[] = [];
  for (const d of outline.documents)
    for (const ch of d.chapters)
      for (const s of ch.sections)
        for (const label of s.blocks) {
          const m = mark(label);
          const reasons = (m.change ? 1 : 0) + (m.open ? 1 : 0) + (m.qaFailing ? 1 : 0);
          const li = doc.createElement("li");
          const b = doc.createElement("button");
          b.type = "button";
          b.className = "cell h" + reasons;
          b.tabIndex = -1;
          const glyphs = (m.change === "added" ? "+" : m.change ? "Δ" : "") + (m.open ? "●" : "") + (m.qaFailing ? "!" : "");
          b.textContent = glyphs;
          const words = [m.change === "added" ? "added" : m.change ? "changed" : "unchanged"];
          if (m.open) words.push(m.open + " open comment" + (m.open > 1 ? "s" : ""));
          if (m.qaFailing) words.push("QA failing");
          b.setAttribute("aria-label", label + ": " + words.join(", "));
          b.title = label + ": " + words.join(", ") + " (" + s.title + ")";
          b.addEventListener("click", () => jumpBlock(label, d.page));
          li.appendChild(b);
          ol.appendChild(li);
          cells.push(b);
        }
  // One tab stop: the first cell with something to look at, else the first.
  const first = cells.find((c) => !/\bh0\b/.test(c.className)) || cells[0];
  if (first) first.tabIndex = 0;
  ol.addEventListener("keydown", (e) => {
    const i = cells.indexOf(e.target as HTMLButtonElement);
    if (i < 0) return;
    let j = -1;
    if (e.key === "ArrowDown") j = Math.min(cells.length - 1, i + 1);
    else if (e.key === "ArrowUp") j = Math.max(0, i - 1);
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = cells.length - 1;
    if (j < 0) return;
    e.preventDefault();
    e.stopPropagation();
    cells[i]!.tabIndex = -1;
    cells[j]!.tabIndex = 0;
    cells[j]!.focus();
  });
  box.appendChild(ol);
  return box;
}
