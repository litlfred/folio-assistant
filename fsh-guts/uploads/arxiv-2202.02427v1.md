---
$schema: folio-fsh-guts/v1
title: "arxiv-2202.02427v1.pdf"
kind: source
movedOn: 2026-09-30
movedFrom: "cat-harness/uploads/arxiv-2202.02427v1.pdf"
bean: folio-assistant-q7ey
summary: >-
  The archival copy of the source ingested to `cat-harness/library/arxiv-2202.02427v1`
  (sha256 f55daf70e8b4d5ac…). Retired here after promotion, per the owner's ruling
  2026-09-29 that an ingested upload is archival and belongs in `fsh-guts`,
  not in the queue and not deleted.
---

# `arxiv-2202.02427v1.pdf`

Ingested to [`cat-harness/library/arxiv-2202.02427v1`](../../cat-harness/library/arxiv-2202.02427v1/), which holds what
was derived from it. A library entry may not hold the source bytes:
`check:l1-complete`'s `contents` check refuses an unexpected child, so this is
where the original lives.

`cat-harness/library/arxiv-2202.02427v1/manifest.jsonld` records `source_sha256`,
which is what lets a re-derivation be checked against this file.

Retired by the rule rather than by a sweep: this source arrived on `main`
while `check:uploads-retired` was being written, and the gate reported it on
its first contact with data it had not been built against. That is the
difference between a rule and a habit, and it is the reason the check exists
(bean `q7ey`).

The rule is in
[`library-ingestion`](../../cat-harness/skills/library/library-core/library-ingestion.md)
§"What happens to the upload after it is ingested".
