---
# folio-assistant-ansc
title: 'LSI: Latent Semantic Indexing methodology, KG index tool, need-an-LSI audit, and epic filing (#1482)'
status: in-progress
type: feature
priority: normal
created_at: 2026-09-29T17:34:06Z
updated_at: 2026-09-29T22:10:07Z
parent: folio-assistant-zzmr
---

Issue #1482. Methodology node, applicability analysis, options, prototype on three WHO IRIS docs, QA audit for needing an LSI kg, then epic filing of beans/PRs/branches. Branch claude/brave-hawking-511rrx.


## Todo
- [x] Methodology node methodologies/lsi.md (sources located, unreachable: egress 403)
- [x] Engine content/pipeline/lsi.ts (log-entropy + seeded randomized SVD)
- [x] CLI scripts/lsi.ts: index / query / audit (need-an-index)
- [x] Skill graph-management/lsi-indexing.md, registered
- [x] Run on who-iris library (3 docs, 342 sections): 2 narrow dims = placeholder text in WPRO guide (Lorem-ipsum filler pp. 21, 29-31; pseudo-Latin font specimens pp. 14-15, 28); 12 near-dup page pairs
- [x] Applicability analysis + options: docs/proposals/lsi-applicability.md
- [x] Epic-filing proposal: docs/proposals/lsi-epic-filing-2026-09-29.md (7/254 unfiled; 59% leave-one-out agreement; 34 disputed; 13 dup pairs; 145 unmerged branches)
- [ ] Owner picks options A-F
- [ ] Owner decides symptom-vs-subject epic axis
- [ ] Apply accepted filings one bean at a time


## Round 2 (2026-09-29)
- [x] Sources ingested (owner PDFs): Deerwester 1990, Landauer-Foltz-Laham 1998, Halko et al. arXiv:0909.4061v2, Qi et al. 2023, Hang et al. arXiv:2202.02427. H91-1044 was the wrong paper (Magerman & Marcus); not ingested.
- [x] Method node checked against the primary: corrected k (50-100) and stemming (CISI); log-entropy form divergence recorded; CA is a parallel track (option G).
- [x] Engine test reproduces the 1990 Appendix singular values and the c3/c5 retrieval.
- [x] A: lsi:near in check-before-create
- [x] B: ingest --promote re-indexes the library
- [x] C: graph-search --latent + lsi_query MCP tool (Tool node lsi-query)
- [x] D: kg:audit lsi-index-fresh; skill:register step lsi:skills + CI lsi:skills:check
- [ ] Owner: apply epic filings? (F) / build CA (G)?


## Round 4 (2026-09-29): owner 'go' on G
- [x] Correspondence analysis adopted as its own methodology node (Qi et al. 2023, held); engine content/pipeline/ca.ts on the shared term matrix, tested on Qi et al. Table 1 (0.475/93.2%, 0.017/3.4%, inertia = chi2/N, transition formula).
- [x] Measured vs LSI on the PRE-refiling bean store (post-refiling would score LSI against itself): CA-raw 146 vs LSI-raw 136 of 250 (Qi's direction, McNemar p=0.17); vs log-entropy LSI p=0.71. No significant difference; LSI stays the filing default.
- [x] who-iris: LSI dim 1 = margin (342/342 one side), CA dim 1 = contrast (46/296); CA leading dims go to outliers (place-name list, placeholder text).
- [ ] Owner: index visualiser / central index page (queued question)


## Round 6 (2026-09-29): owner chose 'Viewer + surface page'
- [x] /lsi/ viewer (gen-lsi-viz.ts, lsi:viz + CI lsi:viz:check), declared as a titled visualiser on the qa directory, registered in tools/viewers.ts
- [x] Published graphs (/cat-harness/) put in the sidebar (was nav_exclude) and given an 'Every declared viewer' section from graphTiles — the same tiles the navbar/board read — so a titled viewer on a kind that already has a conventional page is reachable from the central page
- [x] Viewer output excluded from index units (self-reference fixed point)
