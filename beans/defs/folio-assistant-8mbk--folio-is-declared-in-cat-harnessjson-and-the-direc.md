---
# folio-assistant-8mbk
title: folio/ is declared in cat-harness.json and the directory does not exist — the dh4f shape, undocumented this time
status: scrapped
type: bug
priority: normal
created_at: 2026-09-22T08:21:16Z
updated_at: 2026-09-22T10:48:40Z
parent: folio-assistant-zzmr
---

Measured 2026-09-22 while opening jpjt.

`cat-harness.json` declares 34 directories. Three of them are not on disk:

| id | path | documented? |
|---|---|---|
| `library` | `library/` | YES — the description argues the cost at length (`wwi6`, `a02m`) and says outright "IT IS THE dh4f SHAPE AND THAT IS KNOWN, NOT OVERLOOKED" |
| `translation-sources` | `translations/` | not checked yet |
| `folio` | `folio/` | NO — description is one line: "Authored content of this instance itself... Holds the landing sticky" |

`library` is fine: a deliberate cost, argued, bounded. `folio` is the one
to look at — it claims to HOLD the landing sticky and there is no directory
to hold it in, so a consumer scanning it reports a clean run over nothing.

Second finding, and it is about a bean rather than the code: `j2if` states
"folio/ is deliberately absent from cat-harness.json". That was true when
written and is false now. A bean asserting the opposite of the declaration
is worse than one that says nothing, because the next agent reads it as the
reason not to look.

## Done when

- [ ] establish whether `folio/` should exist here or the declaration should go
- [ ] same question for `translations/`
- [ ] if the declarations stay, they carry the `library` entry's reasoning
- [ ] `j2if`'s stale sentence corrected
- [ ] a check that a declared directory exists, or a recorded reason there is none

## Reasons for scrapping

**The premise is false. I measured from the wrong directory.**

`cat-harness.json` declares paths **relative to its own instance**, so
`folio/` means `cat-harness/folio/` and `translations/` means
`cat-harness/translations/`. I tested them at the REPOSITORY ROOT and read
three absences that are not absences:

| declared | at repo root | at `cat-harness/` |
|---|---|---|
| `library/` | absent | **exists** |
| `folio/` | absent | **exists** |
| `translations/` | absent | **exists** |

There is no `dh4f` defect here. `library/`'s own description argues a cost it
is not paying, and the two sentences I wrote about `folio/` and `j2if` being
wrong were themselves wrong.

**Scrapped rather than deleted**, per `todo-manager`: a scrapped bean with
its reasons stops the next agent re-entering the dead end, where a deleted
one leaves a sibling unable to tell abandonment from accident. And this one
is worth keeping visible precisely because the error is easy to repeat — an
instance-relative path checked from the root reads as missing, and every
consumer of that reading inherits the mistake.

## What survives it, as a REAL finding

The owner ruled 2026-09-22: *"folio must be in cat-harness and visualizer
owned by it. transations too... there should be visualizer."*

Measured against that ruling:

- `folio/` — in cat-harness ✓, **no declared visualiser** ✗
- `translations/` — in cat-harness ✓, visualiser declared AND present ✓
  (`docs/translation-status/index.html`, from `gen-translation-status.ts`)
- `library/` — in cat-harness ✓, visualiser declared and present ✓

So exactly one gap, and it is the folio's own viewer. Carried into its own
bean rather than resurrected here, because this bean's title asserts
something untrue and a reader should not have to get to the bottom to learn
that.
