---
# folio-assistant-ansc
title: 'LSI: Latent Semantic Indexing methodology, KG index tool, need-an-LSI audit, and epic filing (#1482)'
status: in-progress
type: feature
priority: normal
created_at: 2026-09-29T17:34:06Z
updated_at: 2026-09-29T20:15:35Z
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
