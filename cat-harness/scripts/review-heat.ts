/**
 * The review heat map's numbers: one row per section, one column per metric.
 * Bean `qbfi`, epic `q4jm`.
 *
 * ## What each column MEANS, and what it must not be read as
 *
 * | column | counts | is NOT |
 * |---|---|---|
 * | changed | blocks in the section the ChangeSet lists | how much text changed; a one-word edit counts 1 |
 * | open | review comments not yet closed (`open` or `addressed`); defects counted apart | how bad the section is; one comment may cover a whole section |
 * | stale | open comments whose block changed AFTER the comment was made | wrong; it means "re-read before replying" |
 * | coverage | NOT MEASURED YET | "every comment resolved". Coverage needs a per-block reviewer verdict, which nothing records until bean en2d's process does. Resolved comments are not approval. |
 * | qa | NOT PUBLISHED YET | a pass. The staging build does not yet publish the folio's QA results; the owner asked for that next (qbfi option 2). |
 *
 * A column with no data is SAID, per row, never shown as 0 or blank. Zero
 * would read as "measured, and nothing there", which is the one thing it
 * does not know.
 *
 * ## One self-contained function
 *
 * `gen-review-page` embeds {@link computeHeat} with `toString()`, as it does
 * the diff renderers, so the function tested here is the one the page runs.
 */
export interface HeatRow {
  /** `<manifest dir>::<section label>`, or `(listed in no section)`. */
  section: string;
  changed: number;
  open: number;
  defects: number;
  stale: number;
}

export interface HeatInput {
  changes: Array<{ label: string; head?: { section?: string }; base?: { section?: string } }>;
  /** `review-comments.json`'s comments, or null when there is no such file. */
  comments: Array<{ targetLabel: string; status: string; review: { kind: string; blockHash: string | null; orphaned?: boolean } }> | null;
  /** `blocks.json`: each head block's current hash and section, or null. */
  blocks: Record<string, { hash: string; section?: string }> | null;
}

export function computeHeat(input: HeatInput): { rows: HeatRow[]; hasComments: boolean; hasBlocks: boolean } {
  const NONE = "(listed in no section)";
  const rows = new Map<string, HeatRow>();
  const row = (s: string | undefined) => {
    const k = s || NONE;
    let r = rows.get(k);
    if (!r) { r = { section: k, changed: 0, open: 0, defects: 0, stale: 0 }; rows.set(k, r); }
    return r;
  };
  const sectionOf = new Map<string, string | undefined>();
  for (const c of input.changes) {
    const s = (c.head || c.base || {}).section;
    sectionOf.set(c.label, s);
    row(s).changed++;
  }
  for (const c of input.comments || []) {
    if (c.status !== "open" && c.status !== "addressed") continue;
    // Orphaned comments have no block and so no section: counted under NONE,
    // never dropped, since an open comment is still open.
    const b = input.blocks ? input.blocks[c.targetLabel] : undefined;
    const s = c.review.orphaned ? undefined : (b && b.section) || sectionOf.get(c.targetLabel);
    const r = row(s);
    r.open++;
    if (c.review.kind === "defect") r.defects++;
    if (b && c.review.blockHash !== null && b.hash !== c.review.blockHash) r.stale++;
  }
  // Reading order: sections as the ChangeSet meets them, then any others by name, NONE last.
  const order = [...new Set(input.changes.map((c) => (c.head || c.base || {}).section || NONE))];
  const rest = [...rows.keys()].filter((k) => !order.includes(k)).sort();
  const all = [...order, ...rest].filter((k) => k !== NONE);
  if (rows.has(NONE)) all.push(NONE);
  return { rows: all.map((k) => rows.get(k)!), hasComments: input.comments !== null, hasBlocks: input.blocks !== null };
}

/** 0 → no fill; otherwise the tertile of the column's maximum, 1–3. */
export function heatBucket(v: number, max: number): number {
  if (!v || !max) return 0;
  const f = v / max;
  return f <= 1 / 3 ? 1 : f <= 2 / 3 ? 2 : 3;
}

/**
 * The heat map as a real `<table>`, so the matrix IS its own table view: a
 * screen reader reads rows and columns, and every cell carries its number.
 * The tint only repeats what the number already says (dataviz: never colour
 * alone). Each row header is a button that moves focus to that section in
 * the list below.
 */
export function renderHeat(
  doc: Document,
  h: { rows: Array<{ section: string; changed: number; open: number; defects: number; stale: number }>; hasComments: boolean; hasBlocks: boolean },
  bucket: (v: number, max: number) => number,
  jump: (section: string) => void,
): HTMLElement {
  const t = doc.createElement("table");
  t.className = "heat";
  const cap = doc.createElement("caption");
  cap.textContent = "Where to look first: each section's changes and open review comments. Darker means more, and every cell shows its number.";
  t.appendChild(cap);
  const cols: Array<[string, string]> = [
    ["Section", ""],
    ["Changed blocks", "blocks the ChangeSet lists"],
    ["Open comments", "open or addressed; defects in brackets"],
    ["Stale comments", "the block changed after the comment was made: re-read before replying"],
    ["Review coverage", "not measured yet"],
    ["QA", "not published yet"],
  ];
  const head = doc.createElement("thead");
  const hr = doc.createElement("tr");
  for (const [name, note] of cols) {
    const th = doc.createElement("th");
    th.scope = "col";
    th.textContent = name;
    if (note) th.title = note;
    hr.appendChild(th);
  }
  head.appendChild(hr);
  t.appendChild(head);
  const max = (k: "changed" | "open" | "stale") => Math.max(0, ...h.rows.map((r) => r[k]));
  const mx = { changed: max("changed"), open: max("open"), stale: max("stale") };
  const body = doc.createElement("tbody");
  const cell = (text: string, b: number, title: string, muted = false) => {
    const td = doc.createElement("td");
    td.textContent = text;
    td.title = title;
    td.className = (b ? "h" + b : "h0") + (muted ? " muted" : "");
    return td;
  };
  for (const r of h.rows) {
    const tr = doc.createElement("tr");
    const th = doc.createElement("th");
    th.scope = "row";
    const btn = doc.createElement("button");
    btn.type = "button";
    btn.className = "linklike";
    btn.textContent = r.section.replace("::", " › ");
    btn.addEventListener("click", () => jump(r.section));
    th.appendChild(btn);
    tr.appendChild(th);
    tr.appendChild(cell(String(r.changed), bucket(r.changed, mx.changed), r.changed + " changed block(s) in " + r.section));
    if (h.hasComments) {
      tr.appendChild(cell(r.open + (r.defects ? " (" + r.defects + " defect" + (r.defects > 1 ? "s" : "") + ")" : ""), bucket(r.open, mx.open), r.open + " open comment(s), " + r.defects + " defect(s)"));
    } else {
      tr.appendChild(cell("no data", 0, "No review-comments.json on this build", true));
    }
    if (h.hasComments && h.hasBlocks) {
      tr.appendChild(cell(String(r.stale), bucket(r.stale, mx.stale), r.stale + " open comment(s) on a block that changed since"));
    } else {
      tr.appendChild(cell("no data", 0, "Needs review-comments.json and blocks.json", true));
    }
    tr.appendChild(cell("not measured yet", 0, "Coverage needs a per-block reviewer verdict, which nothing records yet (bean en2d). Resolved comments are not approval.", true));
    tr.appendChild(cell("not published yet", 0, "The staging build does not publish the folio's QA results yet (bean qbfi, option 2).", true));
    body.appendChild(tr);
  }
  t.appendChild(body);
  return t;
}
