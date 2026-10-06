---
# folio-assistant-cp3v
title: 'TOC extractor: benchmark methods against PDF outlines and add a font-metric (layout) method (#2302)'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-06T17:14:06Z
updated_at: 2026-10-06T17:41:57Z
---

Issue #2302. The outline-less fallback (infer_headings) is regex-on-text only. Build a benchmark that hides each PDF's embedded outline and scores candidate extractors against it, compare methods (current regex, PyMuPDF font-metric layout, contents-page parse, Grobid/Nougat evaluated), and land the best rule-based method.

- [x] benchmark harness + metric
- [x] font-metric method
- [x] comparison report
- [x] wire best method into pdf-structure.py fallback
- [x] tests


## Follow-ups (not done here)
- [ ] score on a held-out corpus (the qou library, 715 structure.json) — the 13-document set was also the development set
- [ ] where size-only beats font (arxiv-2601.04544, iHRIS) the extra filters drop real headings — investigate
- [ ] Grobid / Nougat scoring needs a Docker daemon or huggingface.co access
