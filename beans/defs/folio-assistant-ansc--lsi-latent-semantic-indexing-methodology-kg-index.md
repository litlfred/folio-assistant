---
# folio-assistant-ansc
title: 'LSI: Latent Semantic Indexing methodology, KG index tool, need-an-LSI audit, and epic filing (#1482)'
status: in-progress
type: feature
priority: normal
created_at: 2026-09-29T17:34:06Z
updated_at: 2026-09-29T17:49:08Z
parent: folio-assistant-zzmr
---

Issue #1482. Methodology node, applicability analysis, options, prototype on three WHO IRIS docs, QA audit for needing an LSI kg, then epic filing of beans/PRs/branches. Branch claude/brave-hawking-511rrx.


## Todo
- [x] Methodology node methodologies/lsi.md (sources located, unreachable: egress 403)
- [x] Engine content/pipeline/lsi.ts (log-entropy + seeded randomized SVD)
- [x] CLI scripts/lsi.ts: index / query / audit (need-an-index)
- [x] Skill graph-management/lsi-indexing.md, registered
- [x] Run on who-iris library (3 docs, 342 sections): 2 narrow dims = Lorem-ipsum specimen in WPRO guide pp. 21, 29-31; 12 near-dup page pairs
- [x] Applicability analysis + options: docs/proposals/lsi-applicability.md
- [x] Epic-filing proposal: docs/proposals/lsi-epic-filing-2026-09-29.md (7/254 unfiled; 59% leave-one-out agreement; 34 disputed; 13 dup pairs; 145 unmerged branches)
- [ ] Owner picks options A-F
- [ ] Owner decides symptom-vs-subject epic axis
- [ ] Apply accepted filings one bean at a time
