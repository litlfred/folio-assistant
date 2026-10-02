---
# folio-assistant-zgba
title: 'WHO-IRIS ROUTING: the KG renders library-side, the documentation docs-side, and the replica navbar stops carrying docs'
status: completed
type: task
priority: high
created_at: 2026-09-21T10:51:32Z
updated_at: 2026-09-21T11:02:32Z
parent: folio-assistant-kupb
---

Owner, 2026-09-21, two messages:

> i want the proposal pages for who-iris moved to their docs/. the docs/ should
> not be for the who-iris top navbar, instead, f-a navbar should still be on
> the left, with who-iris and then link to docs on side in navbar. see other
> beans/sibling work on LHS

and, ruling out the question of where the replica lives:

> the iris KG should be in who-iris/library (served by cat-harness/library)
> which may or may not inlude materialized content, the docs in who-iris/docs
> (served by cat-harness/docs)

## What was actually wrong

`who-iris/docs/` held BOTH the replica and the documentation, and
`mount-instance-docs.ts` copies a declared directory to `/<kind>/<instance>/`.
So `/docs/who-iris/` was not merely styled like the replica — it WAS the
replica, byte for byte, with the replica's own top navbar carrying the two
documentation links. That is what the owner was looking at.

## Done when

[x] the replica renders to `who-iris/library/`, served by cat-harness/library
[x] the documentation renders to `who-iris/docs/`, served by cat-harness/docs
[x] the replica's top navbar no longer links the documentation
[x] both directories carry an `index.html`, or neither mounts
[ ] `/who-iris/` serves the THEMED replica, not whichever kind sorts first


## Summary of Changes — 2026-09-21

### The split

`gen-iris-pages.ts` writes by what each page IS. The home page, community
list, collection and item pages are a **rendering of the KG** → `library/`.
The ingestion notes and the portal proposal are **documentation** → `docs/`.
Each side gains its own `index.html`, because `mount-instance-docs.ts` refuses
to mount a directory without one, so `docs/` would have stopped mounting the
moment the replica left.

**Only loose files go into `library/`.** Every DIRECTORY under a library graph
is read as a corpus entry, so an `assets/` folder there would appear in the L1
listing as a document titled "assets" with no sections. The covers stay where
the catalogue's `localPath` names them — nothing from `yl5w` moves again.

The replica's top navbar no longer links the documentation. That is the
owner's ruling, and it is also what stops the pages linking across two mount
points by a relative path that breaks when either route moves.

### `/who-iris/` is now DECLARED, not alphabetical

`instanceRoot: true` on a declared directory says which kind answers at the
instance's own route. It used to be the first by sort order, while the comment
doing it claimed the choice was "the instance's own business" — it was the
alphabet's, and who-iris made that concrete: `docs` sorts before `library`, so
the themed root would have served the documentation, contradicting the very
ruling it implemented (*"who-iris themed at /who-iris/"*).

Several kinds and none declared is **UNDETERMINED** and reported: the
deterministic order still serves something, because a site must answer at that
URL, but nobody is told it was chosen on purpose.

Measured after:

    who-iris/library/  ->  /who-iris/          themed replica
    who-iris/docs/     ->  /docs/who-iris/     documentation
    who-iris/library/  ->  /library/who-iris/  the KG

### Two bugs found by looking rather than assuming

1. The cross-side prune asked `!files.has(name)` — but `index.html` IS written
   (to `library/`), so every stale docs-side copy looked live and survived
   exactly where the owner did not want it. A page carrying the other side's
   name does not belong in that directory at all.
2. `index.html` is owned on BOTH sides, so the cross-side sweep has to subtract
   what is owned here — without it, the docs index is deleted every run and the
   directory silently stops mounting.

Also the backtick trap again, in a comment inside the page template.
**`check:viewer-backticks` does not cover this file** — worth a follow-up.

### Open, measured and not decided

`who-iris/library/` is **1,375 files** (the whole L1 corpus) and mounts at two
routes, so the published site carries ~2,750 where `docs/` used to contribute
9. The owner said the KG lives there and "may or may not include materialized
content", so this is the model working as described — but the size is a fact
they should see rather than discover.

6 new tests on the root selection, including the undetermined case. Gates
84/84, 5048 tests pass.
