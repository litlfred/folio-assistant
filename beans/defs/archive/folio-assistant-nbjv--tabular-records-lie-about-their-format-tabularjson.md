---
# folio-assistant-nbjv
title: 'TABULAR RECORDS LIE ABOUT THEIR FORMAT: tabular.jsonld has no @context, so a JSON-LD reader keeps only its @id'
status: scrapped
type: bug
created_at: 2026-09-23T13:25:01Z
updated_at: 2026-09-23T13:25:01Z
parent: folio-assistant-0lmb
---

**Scrapped the hour it was opened. The defect was already fixed, the other
way, and I did not check before asking the owner to choose.**

## What this bean claimed

That `scripts/tabular-records.py` writes `tabular.jsonld` with no `@context`,
so a JSON-LD processor keeps only its `@id` and drops every other key. The
proposed fix was bean `792y`'s ruling applied to the twin: rename to
`tabular.json`, `@id` to `doc_id`.

## Why it is void

Bean `yh6u`, merged as `b4612fb7` — *"Ingest records are real JSON-LD; every
content key is a declared term (#1078)"* — fixed exactly this, roughly two
hours earlier, having **found it while closing `792y`**. Its commit message
records the owner's choice in one line:

> Owner's choice (2026-09-23): make them real JSON-LD rather than rename.

That is the option this bean argued against. `yh6u` weighed the rename as its
options 1 and 2 and the owner set both aside.

## The argument that felt strongest was the one most wrong

This bean's load-bearing claim was that JSON-LD drops `null`, so the
three-state rule's determined `narrative.text: null` could not survive
expansion — therefore the record had to stay plain JSON.

True of naive JSON-LD, and **false of the design that shipped**. `yh6u` types
`narrative`, `sheets`, `source`, `entries` and `archive` as `@type: "@json"`,
which carries them verbatim, nulls intact. Verified in
`ns/content/v1.jsonld`. So the constraint was real and the conclusion drawn
from it was not: there was a third design that satisfied it better than the
rename, and it is the one in the tree.

## How the mistake happened, since that is the reusable part

The measurement was **right when taken and stale when used**. `grep -c
"@context"` over the writer returned 0 — on `claude/v1hw-verify`, whose base
predated `b4612fb7`. I then branched from fresh `main`, carried the number
across, briefed on it, and put it to the owner as settled fact. The stale
number survived a branch change because nothing re-ran it.

Two pointers made it easy to believe, and both are now stale:
`792y`'s *"Found, not fixed here"* note, and `eief`'s done-when line
*"folio-tabular-records/v1 is migrated"*. Neither names `yh6u`. Anyone
following either lands where this bean landed.

**The cheap check I skipped:** `git log -S` on the symbol, or `beans list |
grep tabular`, either of which surfaces `yh6u` in one command. A measurement
taken on one branch is not evidence about another.

## Not deleted

Scrapped per `deletion-requires-confirmation`. A deleted bean leaves the next
agent unable to tell abandonment from accident; this one's whole value is that
it stops the next reader of those two stale pointers repeating the hour.
