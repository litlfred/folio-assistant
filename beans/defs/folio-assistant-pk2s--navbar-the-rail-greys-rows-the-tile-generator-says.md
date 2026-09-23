---
# folio-assistant-pk2s
title: 'NAVBAR: the rail greys rows the tile generator says are PUBLISHED — mount table and harness.json disagree'
status: todo
type: task
created_at: 2026-09-23T05:12:12Z
updated_at: 2026-09-23T05:12:12Z
---


Found while executing #956's empty-graph ruling (PR #996), by rendering the
site and running the mount step rather than by reading a diff. It is NOT that
PR's defect and was deliberately not widened into it: that ruling is about a
row's LABEL, this is about a row's LINK.

## Measured, 2026-09-23

On who-iris's mounted rail, four of six graph rows draw inert. Two of them —
`catalogue` and `uploads` — carry no reason, and correctly so: `harness.json`
gives BOTH a path.

| kind | `harness.json` says | the rail draws |
|---|---|---|
| catalogue | `path: /cat-harness/catalogue/who-iris/`, `readOnly: true` | inert, no reason |
| uploads | `path: /cat-harness/library/who-iris/`, `readOnly: false` | inert, no reason |
| skills | no path, `note: "no viewer yet"` | inert, labelled |
| themes | no path, `note: "no viewer yet"` | inert, labelled |

So TWO PRODUCERS DISAGREE about whether those graphs open. `declaredGraphs`
takes its hrefs from the MOUNT TABLE — deliberately, and the comment says why:
*"Built from the mount table, so a kind gains a link the moment it gains a
viewer and loses one the moment it does not — never from a list here."*
`harness-tiles` resolves a path by convention plus the declaration. Neither is
obviously wrong; they are answering slightly different questions and nobody
reconciled them.

## Why the note did not paper over it

`graphNotes` guards on `v.path === undefined`, so a row the generator believes
is published gets no caption. That guard was written for a stale-note case and
it did this too: it REFUSED TO GUESS, and the disagreement surfaced instead of
being labelled "no viewer yet" — which would have been false, and would have
sent the next reader off to build a viewer that already exists.

## What is NOT known yet

Whether `/cat-harness/catalogue/who-iris/` and `/cat-harness/library/who-iris/`
actually serve a page on the deployed site. `harness-tiles` PRESENCE-CHECKS
before emitting a path, so it believes they do — but that check runs against
the working tree, and the mount table is built from what was actually mounted.
Resolve that before choosing a fix: if the pages are there, the rail is losing
two working links; if they are not, `harness-tiles` is emitting a path for a
page that does not exist, which is the worse of the two.

## Done when

[ ] it is established which producer is right, by fetching both URLs from a
deployed build — not by reading either generator
[ ] the two are reconciled, or the disagreement is REPORTED as a finding
rather than resolved silently by whichever one the rail happens to ask
[ ] who-iris's `catalogue` and `uploads` rows either link or say why they do
not — a row that is neither is the state this bean exists for
