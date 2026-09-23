---
# folio-assistant-04vl
title: the narrative review queue could not see 24 of the 24 drafts, and its own test said zero
status: completed
type: bug
priority: high
created_at: 2026-09-20T09:21:33Z
updated_at: 2026-09-20T09:27:48Z
parent: folio-assistant-slw1
blocking:
    - folio-assistant-d5f1
---

`bun run cat-harness/scripts/narratives.ts` is the only way a person confirms
an agent-drafted narrative. Measured 2026-09-20, immediately after PR #482
made it runnable at all:

```
narratives awaiting you                    : 0
drafts in library/<slug>/images.json       : 24
```

## Two causes, and the second is the one that hid it

1. `NARRATIVE_BEARING` listed `tabular.jsonld`, `contents.jsonld` and
   `manifest.jsonld`. `images.json` was not on it, so the file was never
   opened.
2. And adding it to that list alone finds **nothing**. The first three hold
   ONE narrative at `doc.narrative`; an images sidecar holds MANY, at
   `images[i].narrative`, and has no top-level `narrative` at all. `queue()`
   read that field, `decide()` wrote it.

So the fix is `narrativesIn(doc)`, returning every narrative in a document
WITH ITS PATH, and `setAtPath`, so a decision lands on the picture the reviewer
saw. `doc.narrative = r.data` would have added a stray top-level record, left
all 24 drafts untouched, and reported success — the queue re-offering the same
image forever while each confirmation looked like it worked.

The queue also had nothing to distinguish twenty-four entries by: every one
would have read `wpr-rdo-2020-003-eng`, asking the reviewer to tell them apart
by the text under review. Each item now carries the image id as its subject.

## Why nothing caught it

`scripts/tests/narratives.test.ts` asserted

```ts
test("the real corpus has nothing waiting — a determined zero", () => {
  expect(queue(ROOT)).toEqual([]);
});
```

and went on passing after `d5f1` wrote the 24 drafts. It was true of what the
queue could SEE and false of the repository it named. That file's own header
states the rule it broke: *a queue that finds nothing is indistinguishable
from a queue that cannot see.* Stating a rule is not testing it.

The corpus test now takes the count TWICE — once through `queue()`, once by
walking the JSON in the test file, sharing no code with it — and compares.
A count a component produces cannot check that component.

## Done when

- [x] `narratives.ts` sees both shapes and writes back at the narrative's own path
- [x] the corpus count is derived independently and compared
- [x] every new branch mutation-checked against a NAMED failing test
Reviewing the 24 drafts is `d5f1`'s remaining step, not this one's: it is the
owner's act by construction, and `reviewer()` refuses to record it from a
non-interactive shell. This bean is what made it POSSIBLE, which is a
different claim and the one being closed.
