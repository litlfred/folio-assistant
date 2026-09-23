---
# folio-assistant-3psh
title: check:l1-complete cannot see an ORPHAN directory inside a library entry
status: in-progress
type: task
priority: normal
created_at: 2026-09-20T15:28:09Z
updated_at: 2026-09-23T11:16:11Z
parent: folio-assistant-slw1
---


Found 2026-09-20 by causing it, then fixing the cause and finding the
artefact still there.

`pdf-images.py` derived the doc id differently from `pdf-structure.py`, so for
three arXiv papers it wrote `images.json` into a SIBLING directory of the entry
it belonged to. That is fixed. But the same shape can arrive by any arm taking
`-o <library-root>` with a doc id the entry does not have, and **nothing
reports it**:

- `check:l1-complete` walks a library's children and treats each as an entry.
  The orphan has no `structure.json`, so it is not an entry — it is skipped, and
  a skip looks exactly like a clean pass.
- When the orphan lands INSIDE a real entry (which is what happened after the
  entry was renamed to the canonical id) the entry itself passes every
  requirement, because no requirement says what an entry may NOT contain.

Both duplicates were byte-identical to the entry's own `images.json` apart from
`doc_id`, and both were committed before anyone noticed.

## Done when

- [x] An entry's directory contents are CLOSED: `sections/`, `blocks/`, `ocr/`,
      `images/` and the known sidecars — the `contents` requirement, `unmet`
      and NAMING each stray.
- [x] A directory directly under a declared `library/` with no `structure.json`
      is REPORTED rather than skipped — **ALREADY TRUE**, see the correction
      below. This bullet describes a defect that is not there.
- [x] Both fire on a fixture built to have the defect — six fixtures, and
      disabling the guard turns three of them red.

## Summary of Changes

`contents` joins the derivable requirements. `ENTRY_DIRECTORIES` and
`ENTRY_SIDECARS` are exported and are the ONE declaration both the check and
its tests read.

### Measured on a real complete entry, 2026-09-23

| the entry | before | after |
|---|---|---|
| clean | passes | **met** — "5 child(ren), all declared" |
| + nested orphan, `images.json` under the WRONG `doc_id` | **passes** | **unmet**, names it |
| + a wholly unexpected loose file | **passes** | **unmet**, names both |

### Bullet 2 was already satisfied — correction

This bean says *"The orphan has no `structure.json`, so it is not an entry —
it is skipped, and a skip looks exactly like a clean pass."* **Measured: it is
not skipped.** The library walk calls `checkEntry` on every directory, and a
structure-less one reports **7 unmet requirements**. Nothing was built for
this bullet, because there was nothing to build.

One nuance carried rather than dropped: it is reported as an INCOMPLETE ENTRY
("no structure.json"), not as a stray that does not belong. A reader might try
to finish ingesting it. That is a wording question, not a visibility one, and
it is not fixed here.

### Why the corpus could not test this

5 libraries, **21 entries, zero orphans, zero unexpected children**. A green
corpus run proves nothing about this requirement, so the fixtures are not
belt-and-braces — they are the only thing that ever executes the branch
(`1xhc`). Proved by disabling the filter: three tests go red, restoring it
returns zero.

### The allowed set is not the denylist this bean rejects

`images/` appears on 13 of 21 entries and `ocr/` on 2 — arms' output, not
strays — so a closed set excluding them would have failed 13 entries on its
first run, which is how a new gate gets weakened back out again. The set is
what the pipeline PRODUCES and predicts no spelling; an arm that starts
writing something new says so in one place.

### Reported, never removed

`deletion-requires-confirmation`. An orphan is evidence of which arm misfiled
it, and deleting it destroys that evidence. The detail says so in as many
words, and a test asserts the phrase survives.

## Why a closed set rather than a denylist

The orphan was named `260725032v1` — a perfectly plausible doc id. Nothing
about the NAME was wrong; what was wrong was that it was there at all. A
denylist would have to predict the next arm's spelling, which is the drift this
whole cluster of defects is made of.
