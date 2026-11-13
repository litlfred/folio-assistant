// qa-panel: one block's QA report, in a dialog (build-folio-site.ts).
// Loaded by folio-site.js the first time a reader opens a [QA] badge, so a
// page that is only read never downloads it. The report is
// `qa/<chapter>/<block>.json` (folio-site-qa-report/v1, folio-site-blocks.ts):
// each criterion's MOST RECENT verdict, who gave it and when, and whether the
// block's files have changed since (stale). Milnor exposition comes first.
(() => {
  const el = (tag, attrs = {}, text) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = text;
    return e;
  };
  let dlg = null;
  const dialog = () => {
    if (dlg) return dlg;
    dlg = el("dialog", { class: "qa-dialog", "aria-label": "QA report" });
    document.body.append(dlg);
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    return dlg;
  };
  const bad = (r) => r === "fail" || r === "warn";
  const blob = (s, p) => (s ? `https://github.com/${s.repository}/blob/${s.ref}/${p}` : null);
  const linkOrCode = (s, p) => { const u = blob(s, p); return u ? el("a", { href: u, target: "_blank", rel: "noopener" }, p) : el("code", {}, p); };

  const open = ({ report, error, title, lean, source, leanStatus }) => {
    const d = dialog();
    d.replaceChildren();
    const head = el("div", { class: "qa-head" });
    head.append(el("h2", {}, `QA report — ${title}`));
    const x = el("button", { type: "button", class: "qa-close", "aria-label": "Close" }, "✕");
    x.onclick = () => d.close();
    head.append(x);
    d.append(head);

    const meta = el("p", { class: "qa-meta" });
    if (error) d.append(error);
    else if (report) {
      const c = report.counts;
      meta.append(`${report.criteria.length} criteria: ${c.pass} pass, ${c.fail} fail, ${c.warn} warn, ${c.na} n/a${c.unknown ? `, ${c.unknown} without a verdict` : ""}; ${c.stale} stale (the block changed since the verdict). Each row is the criterion's most recent review. Sidecar: `);
      report.sidecars.forEach((p, i) => { if (i) meta.append(", "); meta.append(linkOrCode(source, p)); });
    } else meta.append("No QA verdict is recorded for this block.");
    d.append(meta);

    const lp = el("p", { class: "qa-meta" });
    if (lean && lean.path) {
      lp.append("Lean: ", linkOrCode(source, lean.path));
      const build = lean.compiles && lean.compiles !== "unchecked" ? `build ${lean.compiles}` : "build unchecked (no measured compile status)";
      lp.append(` (${lean.via === "ref" ? `via lean.ref ${lean.ref}` : "sibling"}; ${lean.sorry ? "has a sorry" : "no sorry"}${lean.sorryBasis === "text" ? " — read from the text" : ""}; ${build}${leanStatus && leanStatus.measuredAt ? `, measured ${leanStatus.measuredAt}` : ""})`);
      if (lean.error) lp.append(el("code", { class: "qa-err" }, lean.error));
    } else if (lean && lean.expected) {
      lp.append(`Lean: expected for this kind, none found${lean.ref ? ` (lean.ref ${lean.ref} ${lean.refState === "no-resolver" ? "could not be resolved: no Lean packages declared" : "does not resolve"})` : ""}.`);
    } else lp.append("Lean: not expected for this kind.");
    d.append(lp);

    if (report) {
      const groups = [];
      for (const r of report.criteria) {
        let g = groups[groups.length - 1];
        if (!g || g.name !== r.group) groups.push((g = { name: r.group, rows: [] }));
        g.rows.push(r);
      }
      for (const g of groups) {
        const n = g.rows.filter((r) => bad(r.result)).length;
        const det = el("details", { class: "qa-group" + (g.name === "Milnor" ? " milnor" : "") });
        if (g.name === "Milnor" || n) det.open = true;
        det.append(el("summary", {}, `${g.name === "Milnor" ? "Milnor exposition" : g.name} — ${g.rows.length} criteria${n ? `, ${n} not passing` : ""}`));
        const tb = el("table");
        const hr = el("tr");
        for (const h of ["criterion", "result", "reviewer", "date", "notes"]) hr.append(el("th", {}, h));
        tb.append(hr);
        for (const r of g.rows) {
          const tr = el("tr");
          tr.append(el("td", {}, r.id));
          const res = el("td", { class: `res res-${r.result === "n/a" ? "na" : r.result}`, title: r.stale ? `stale: ${(r.changed || []).join(", ")} changed since this review` : r.freshness !== "fresh" ? `freshness ${r.freshness === "unknown" ? "cannot be established" : r.freshness}${r.changed ? " — " + r.changed.join("; ") : ""}` : "" },
            `${r.result}${r.severity && r.result !== "pass" ? ` (${r.severity})` : ""}${r.stale ? " · stale" : r.freshness === "unknown" ? " · ?" : ""}`);
          tr.append(res);
          tr.append(el("td", {}, [r.reviewer, r.by, r.model].filter(Boolean).join(" · ") + (r.history > 1 ? ` (${r.history} reviews)` : "")));
          tr.append(el("td", {}, r.at || ""));
          const nt = el("td", { class: "notes" });
          if (r.notes) { const det2 = el("details"); det2.append(el("summary", {}, r.notes.slice(0, 90) + (r.notes.length > 90 ? "…" : ""))); det2.append(el("div", {}, r.notes)); nt.append(det2); }
          tr.append(nt);
          tb.append(tr);
        }
        det.append(tb);
        d.append(det);
      }
    }
    d.showModal();
  };
  window.folioSiteQa = { open };
})();
