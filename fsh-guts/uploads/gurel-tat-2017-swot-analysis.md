---
$schema: folio-fsh-guts/v1
title: "gurel-tat-2017-swot-analysis.pdf"
kind: source
movedOn: 2026-09-30
movedFrom: "cat-harness/uploads/gurel-tat-2017-swot-analysis.pdf"
bean: folio-assistant-q7ey
summary: >-
  The archival copy of the source ingested to `cat-harness/library/gurel-tat-2017-swot-analysis`.
  Retired from `cat-harness/uploads/` per the owner's ruling 2026-09-29 that an
  ingested upload is archival and belongs in `fsh-guts`. Its bytes were checked
  against the `source_sha256` that entry's manifest records — matches.
---

# `gurel-tat-2017-swot-analysis.pdf`

Ingested to [`cat-harness/library/gurel-tat-2017-swot-analysis`](../../cat-harness/library/gurel-tat-2017-swot-analysis/), which holds what was
derived from it. A library entry may not hold the source bytes:
`check:l1-complete`'s `contents` check refuses an unexpected child, so this is
where the original lives.

`cat-harness/library/gurel-tat-2017-swot-analysis/manifest.jsonld` records `source_sha256`,
which is what lets a re-derivation be checked against this file.

## Correction, 2026-09-30 — this file was never deleted

**The first version of this sidecar said it was, and that was wrong.** It read
*"RESTORED from git history, not relocated from the queue … deleted by an
earlier session under no rule"*, and the sweep that wrote it reported five such
recoveries.

Re-derived from git rather than from that claim:

```
git log --diff-filter=D -- cat-harness/uploads/gurel-tat-2017-swot-analysis.pdf
  (empty — never deleted)
git cat-file -e 4b10661cdde:cat-harness/uploads/gurel-tat-2017-swot-analysis.pdf
  (present, and present at HEAD too)
```

So the file sat at `cat-harness/uploads/` the whole time. The sweep
`git show`-ed a copy out of `4b10661cdde` into here while the live one was
untouched at the same path — producing **two copies of identical bytes** and a
recovery claim with nothing recovered.

**The cause is the same one-directory error twice in one commit.** That sweep
had already corrected its own count from nine to 28 after walking only
`cat-harness/library/`; the *deleted-or-not* determination still looked in
`uploads/` alone, where these five genuinely were absent — because they had
been renamed INTO `cat-harness/uploads/`, not removed. A sweep that resolves
one declared directory and reports over the ones it never opened is `dh4f`,
and correcting the number it produced did not correct the method that produced
it.

The duplicate in `cat-harness/uploads/` is removed as of this commit, and
`check:uploads-retired` now fails on an ingested upload left in any queue.

The rule is in
[`library-ingestion`](../../cat-harness/skills/folio-core/library-ingestion.md)
§"What happens to the upload after it is ingested".
