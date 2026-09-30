---
$schema: folio-fsh-guts/v1
title: "milnorlink.pdf"
kind: source
movedOn: 2026-09-30
movedFrom: "cat-harness/uploads/milnorlink.pdf"
bean: folio-assistant-q7ey
summary: >-
  The archival copy of the source ingested to `folio-assistant-sci/library/milnorlink`
  (sha256 7644abb4d24b46d8…). Retired here per the owner's ruling 2026-09-29 that an
  ingested upload is archival and belongs in `fsh-guts`, not in the queue and
  not deleted. Missed by the 2026-09-30 sweep, which resolved cat-harness's
  library only and so never asked what `folio-assistant-sci` had ingested.
---

# `milnorlink.pdf`

Ingested to [`folio-assistant-sci/library/milnorlink`](../../folio-assistant-sci/library/milnorlink/), which holds what was
derived from it. A library entry may not hold the source bytes:
`check:l1-complete`'s `contents` check refuses an unexpected child, so this is
where the original lives.

`folio-assistant-sci/library/milnorlink/manifest.jsonld` records `source_sha256`, which is
what lets a re-derivation be checked against this file.

**Why it was missed.** The sweep matched each queue file against
`cat-harness/library/`. This one was ingested to `folio-assistant-sci`, so it
matched nothing and read as still-queued — the one-declared-directory error
the same sweep had already corrected once, in its count. Correcting a number a
method produced is not correcting the method, which is why the replacement is
`check:uploads-retired` rather than another sweep.

The rule is in
[`library-ingestion`](../../cat-harness/skills/folio-core/library-ingestion.md)
§"What happens to the upload after it is ingested".
