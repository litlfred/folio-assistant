---
$schema: folio-fsh-guts/v1
title: "WHO-RHR-18.06-eng.pdf"
kind: source
movedOn: 2026-09-30
movedFrom: "uploads/WHO-RHR-18.06-eng.pdf"
bean: folio-assistant-q7ey
summary: >-
  The archival copy of the source ingested to `smart-base/library/who-rhr-1806-eng`
  (sha256 44be3640bb1730da…). Retired here after promotion, per the owner's ruling
  2026-09-29 that an ingested upload is archival and belongs in `fsh-guts`,
  not in the queue and not deleted.
---

# `WHO-RHR-18.06-eng.pdf`

Ingested to [`smart-base/library/who-rhr-1806-eng`](../../smart-base/library/who-rhr-1806-eng/), which holds what was derived
from it — `sections/`, `blocks/`, `images/`, `structure.json` and the manifest.
A library entry may not hold the source bytes: `check:l1-complete`'s `contents`
check refuses an unexpected child, so this is where the original lives.

`smart-base/library/who-rhr-1806-eng/manifest.jsonld` records `source_sha256`, which is what lets a
re-derivation be checked against this file.

The rule and its reasoning are in
[`library-ingestion`](../../cat-harness/skills/folio-core/library-ingestion.md)
§"What happens to the upload after it is ingested".
