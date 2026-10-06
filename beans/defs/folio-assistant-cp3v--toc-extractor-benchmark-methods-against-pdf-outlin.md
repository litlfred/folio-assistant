---
# folio-assistant-cp3v
title: 'TOC extractor: benchmark methods against PDF outlines and add a font-metric (layout) method (#2302)'
status: in-progress
type: feature
created_at: 2026-10-06T17:14:06Z
updated_at: 2026-10-06T17:14:06Z
---

Issue #2302. The outline-less fallback (infer_headings) is regex-on-text only. Build a benchmark that hides each PDF's embedded outline and scores candidate extractors against it, compare methods (current regex, PyMuPDF font-metric layout, contents-page parse, Grobid/Nougat evaluated), and land the best rule-based method.

- [ ] benchmark harness + metric
- [ ] font-metric method
- [ ] comparison report
- [ ] wire best method into pdf-structure.py fallback
- [ ] tests
