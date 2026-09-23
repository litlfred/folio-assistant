---
# folio-assistant-pk2s
title: 'NAVBAR: the rail greys rows the tile generator says are PUBLISHED — mount table and harness.json disagree'
status: in-progress
type: task
priority: normal
created_at: 2026-09-23T05:12:12Z
updated_at: 2026-09-23T06:05:22Z
parent: folio-assistant-yj32
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

[x] it is established which producer is right, by fetching both URLs from a
deployed build — not by reading either generator — SETTLED against
`refs/heads/gh-pages`, which is the deployed bytes rather than a description
of them: `cat-harness/catalogue/who-iris/index.html` 23,534 B and
`cat-harness/library/who-iris/index.html` 20,204 B. `harness-tiles` was right
on both counts and the rail was losing two WORKING links — the opposite of
the reading this bean was opened with, and the better of the two outcomes.
[x] the two are reconciled, or the disagreement is REPORTED as a finding
rather than resolved silently by whichever one the rail happens to ask —
RECONCILED, and neither producer changed. They answer different questions and
the caller was asking the wrong one.
[x] who-iris's `catalogue` and `uploads` rows either link or say why they do
not — a row that is neither is the state this bean exists for. Both LINK now;
zero rows on that rail are inert-without-a-reason.

## Summary of Changes

Issue: https://github.com/litlfred/folio-assistant/issues/998

**Neither generator was buggy, and nothing in either was changed.**

| producer | the question it answers | `catalogue` |
|---|---|---|
| the mount table (`mountable()`) | did we copy this instance's own RENDERED directory? | no |
| `harness-tiles` | is there a PUBLISHED VIEWER for this kind? | yes |

`mountable()` requires an `index.html`, and rightly: a directory with no
rendered page has nothing to mount. Measured on who-iris — `library/` and
`docs/` carry one; `catalogue/`, `uploads/`, `skills/` and `themes/` do not,
because they hold DATA. The page that renders who-iris's catalogue is the
cat-harness HANDLER's, laid down by Jekyll at
`/cat-harness/catalogue/who-iris/`. It is not a mount and can never become
one, so the mount table is blind to it by construction.

That is the split `harness_details.html` already states: *"`/who-iris/` is
who-iris presenting itself, `/library/who-iris/` is the cat-harness handler's
default rendering of its library."* The rail's rows are meant to reach the
second, and reached it only where a mount coincided — the whole of why
`library` linked and `catalogue` did not.

So `declaredGraphs` gained a second witness, consulted ONLY where the mount
table is silent. `graphNotes` became `publishedGraphs` and now carries an
href as well as a reason — one reader over `harness.json` rather than two,
since duplicating that read is the shape being fixed. The mount table still
wins where it answers, which is the owner's order rather than a tie-break:
*"cliking shoud go to folio view, not the schema viweer."*

**Not the hardcoded list the caller's comment forbids.** `harness.json` is
generated and presence-checked; the rule that comment states — a kind gains a
link the moment it gains a viewer — is the rule kept here, against a witness
that can see one.

### Verified on the rendered rail, not on green gates

Rebuilt the site and re-ran the mount step. who-iris's six rows:

| row | before | after |
|---|---|---|
| catalogue | inert, no reason | **links** `../cat-harness/catalogue/who-iris/` |
| uploads | inert, no reason | **links** `../cat-harness/library/who-iris/` |
| docs, library | link | link, unchanged |
| skills, themes | inert + "no viewer yet" | unchanged |

Every emitted href resolved against the built tree, and the two new targets
match `gh-pages` byte-for-byte. `bun run gates` 127/127.
