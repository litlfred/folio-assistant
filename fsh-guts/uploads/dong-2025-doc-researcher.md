---
$schema: folio-fsh-guts/v1
title: "dong-2025-doc-researcher.pdf"
kind: source
movedOn: 2026-09-30
movedFrom: "uploads/dong-2025-doc-researcher.pdf"
bean: folio-assistant-q7ey
summary: >-
  The archival copy of the source ingested to `folio-assistant-core/library/arxiv-2510.21603v1`
  (sha256 edc03be2ad64077b…). Retired here after promotion, per the owner's ruling
  2026-09-29 that an ingested upload is archival and belongs in `fsh-guts`,
  not in the queue and not deleted.
---

# `dong-2025-doc-researcher.pdf`

Ingested to [`folio-assistant-core/library/arxiv-2510.21603v1`](../../folio-assistant-core/library/arxiv-2510.21603v1/), which holds what was derived
from it — `sections/`, `blocks/`, `images/`, `structure.json` and the manifest.
A library entry may not hold the source bytes: `check:l1-complete`'s `contents`
check refuses an unexpected child, so this is where the original lives.

`folio-assistant-core/library/arxiv-2510.21603v1/manifest.jsonld` records `source_sha256`, which is what lets a
re-derivation be checked against this file.

The rule and its reasoning are in
[`library-ingestion`](../../cat-harness/skills/folio-core/library-ingestion.md)
§"What happens to the upload after it is ingested".
