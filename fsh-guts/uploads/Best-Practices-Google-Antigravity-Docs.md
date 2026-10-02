---
$schema: folio-fsh-guts/v1
title: "Best Practices - Google Antigravity Docs.pdf"
kind: source
movedOn: 2026-09-30
movedFrom: "uploads/Best Practices - Google Antigravity Docs.pdf"
bean: folio-assistant-q7ey
summary: >-
  The archival copy of the source ingested to `cat-harness/library/best-practices---google-antigravity-docs`
  (sha256 3c51afd3372420b8…). Retired here after promotion, per the owner's ruling
  2026-09-29 that an ingested upload is archival and belongs in `fsh-guts`,
  not in the queue and not deleted.
---

# `Best Practices - Google Antigravity Docs.pdf`

Ingested to [`cat-harness/library/best-practices---google-antigravity-docs`](../../cat-harness/library/best-practices---google-antigravity-docs/), which holds what was derived
from it — `sections/`, `blocks/`, `images/`, `structure.json` and the manifest.
A library entry may not hold the source bytes: `check:l1-complete`'s `contents`
check refuses an unexpected child, so this is where the original lives.

`cat-harness/library/best-practices---google-antigravity-docs/manifest.jsonld` records `source_sha256`, which is what lets a
re-derivation be checked against this file.

The rule and its reasoning are in
[`library-ingestion`](../../cat-harness/skills/library/library-core/library-ingestion.md)
§"What happens to the upload after it is ingested".
