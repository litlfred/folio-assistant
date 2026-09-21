---
# folio-assistant-2b5s
title: 'MOUNT COPIES A DIRECTORY WHOLESALE: /who-iris/ publishes 1,367 corpus files as pages, and /library/who-iris/ publishes all 1,378 a second time'
status: todo
type: task
priority: normal
parent: folio-assistant-yj32
created_at: 2026-09-21T20:00:52Z
updated_at: 2026-09-21T20:00:52Z
---

## What

`mount-instance-docs.ts` mounts a directory when it carries an `index.html`
**at its own root**, and then copies **everything beneath it**. For
`who-iris/library/` that is 1,378 files, of which 11 are pages:

| | count | what |
|---|---|---|
| pages | 11 | 7 `.html` (index, community-list, 2 collections, 3 items), 3 cover `.png`, `image-verdicts.json` |
| L1 corpus | 1,367 | 813 `.jsonld`, 404 `.md` section files, 121 `.txt`, 26 `.png`, under `9789241548960-eng` (757), `who-pub-tps-931` (487), `wpr-rdo-2020-003-eng` (123) |

Measured 2026-09-21 by `find who-iris/library -type f`, not estimated.

**And it is copied TWICE**, because `who-iris/library/` declares
`instanceRoot: true` *and* carries the graph kind `library`:

```
_site/who-iris/         <- cpSync who-iris/library/   1,378 files
_site/library/who-iris/ <- cpSync who-iris/library/   1,378 files
_site/docs/who-iris/    <- cpSync who-iris/docs/          3 files
```

Nothing is duplicated in the REPOSITORY. One source directory, two `cpSync`
calls, in the built site only.

## Why it is two questions, not one

The owner asked *"where are duplicates?"* and the answer surfaced the larger
half. They are independent:

1. **Should `/library/who-iris/` exist at all**, now that the rail links the
   kind to its declared visualiser (`hw9g`, PR #785)? Nothing links to the
   mount route any more. Leave it / stop mounting it (a live URL 404s) /
   serve a one-file redirect stub. A **copy** of the visualiser cannot go
   there: its `fetch("../../../assets/library/index.json")` is written for
   depth 3 and that route is depth 2, so the copy would reach past the site
   root and report a corpus it could not load — which the page renders as
   "could not be read", the honest third state, but still wrong.

2. **Should a mount copy a directory wholesale**, or only the pages it
   renders? `/who-iris/` is meant to be the IRIS replica, and 1,367 of its
   1,378 files are the ingestion sidecars behind the replica rather than
   pages a reader reaches. This is the prior question: answering it may
   dissolve the first.

## Not decided here

Both change what is reachable under a published URL, so both are the owner's.
Recorded rather than acted on, per `deletion-requires-confirmation`: this is
the shape that skill's worked example (`plj1`) warns about — a sweep that
removes published artefacts because a rule said they were redundant.

## Done when

- [ ] The owner has ruled on whether a mount copies a directory wholesale
- [ ] `/library/who-iris/` has a decided answer, and the decision is written
      into `mount-instance-docs.ts` as a rule rather than a special case
- [ ] Whatever the ruling, the count is re-measured rather than quoted from
      this bean

