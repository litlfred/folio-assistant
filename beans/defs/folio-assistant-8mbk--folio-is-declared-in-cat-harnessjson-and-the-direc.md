---
# folio-assistant-8mbk
title: folio/ is declared in cat-harness.json and the directory does not exist — the dh4f shape, undocumented this time
status: completed
type: bug
priority: normal
created_at: 2026-09-22T08:21:16Z
updated_at: 2026-09-22T10:15:36Z
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

## CORRECTED 2026-09-22 ~10:05 — all three directories now exist

This bean was written at 08:21. Measured again ~100 minutes later, against the
raw declaration rather than the resolver:

| | claimed 08:21 | measured 10:05 |
|---|---|---|
| declared directories (cat-harness) | 34 | 35 |
| absent | 3 (`library/`, `translations/`, `folio/`) | **0** |

`cat-harness/folio/` (3 entries), `cat-harness/library/` (1) and
`cat-harness/translations/` (5) are all on disk. So the first three Done-when
items are moot — there is nothing to establish about whether `folio/` should
exist, because it does.

**WHY they were reported absent is TWO different errors, and an earlier draft
of this paragraph gave one explanation for all three.** It said sibling
sessions landed them while the bean sat. Measured from `git log
--diff-filter=A`, 2026-09-22, against this bean's own 08:21 UTC timestamp:

| directory | first appeared | vs 08:21 |
|---|---|---|
| `cat-harness/folio/` | 2026-09-20 09:09 | **already there, two days** |
| `cat-harness/library/` | 2026-09-20 13:06 | **already there, two days** |
| `cat-harness/translations/` | 2026-09-22 10:21 | landed after — a sibling did |

So the sibling explanation is true of exactly one of the three. The other two
were never absent: they were declared **instance-relative** and checked at the
REPOSITORY ROOT, which reads `cat-harness/folio/` as `folio/` and finds
nothing.

That is the same class as the `scope: "repository"` phantoms below, pointed
the other way — one reading resolved too high, the other too low — and it is
why the surviving item is a CHECK rather than a correction. Neither error is
the kind a careful reader avoids; both are the kind a resolver gets right
once.

**One measurement error worth recording, because it was the checker's.** The
first re-measurement joined every declared path onto the INSTANCE root and
reported **ten** absences out of 35. All ten were phantoms: entries carrying
`scope: "repository"` resolve against the REPOSITORY root, and those ten were
other instances' directories. The rule is the one `KgAssetSchema.src` already
states for assets. It is now tested on its own rather than living inside the
sweep.

## What actually survived, and it is the last item

Nothing checked that a declared directory exists — and **no existing check
could have**, because the gap is not in any consumer. `resolveDirectories` is
**existence-filtered**: an absent declared directory is dropped before any
consumer sees it. That is correct for a consumer and is exactly why nobody
reported one. The declaration asserts the directory is ours; when that is
false every scan of it reports a clean run over nothing — the `dh4f` shape
inside the resolver they all share.

The neighbours each answer a different question and none answers this:
`check:declared-assets` walks declared FILES, `check:declared-paths` refuses a
literal naming a declared directory, `check:declaration-claims` compares prose
to files. A directory declared into thin air passes all three.

### What landed

`check:declared-dirs`, gating in CI from the first commit — **66 declared
directories across 14 instances, 0 findings**, so it starts at zero rather
than measuring debt (the repository's own rule: a check is an error only once
its count is zero).

The escape hatch is a declared `absent: { reason }` on the directory entry,
with the reason REQUIRED — the same rule `folio:no-skill`, `folio:fulfilment`
and `folio:judgement` follow, because an exemption justified by `""` is one
somebody adds to get to green. `library/`'s description already argued its
cost at length; that argument now has a field a checker can read.

**Checked in both directions.** An entry declaring `absent` whose directory
EXISTS is also a finding. That is the direction that rots quietly: nothing
goes wrong when an exemption outlives its cause, so nobody notices the
declaration still claims a deliberate absence. No exemptions were added — the
corpus is clean, so the escape hatch ships unused.

### Falsified before it was trusted

| break | result |
|---|---|
| phantom directory, no reason | **1 finding**, exit 1 |
| same, with `absent.reason` | 0 findings, exit 0 |
| `absent.reason` on a directory that exists | **1 finding**, exit 1 |
| a FILE at the declared path | **1 finding** — `existsSync` alone would pass |
| restored | 0 findings, 66 directories, 14 instances |

`bun run gates` — 116 of 116.

## Done when

- [x] establish whether `folio/` should exist here or the declaration should go
      — moot: it exists, and so do `library/` and `translations/`
- [x] same question for `translations/` — exists
- [x] if the declarations stay, they carry the library entry's reasoning — the
      reasoning is now a FIELD (`absent.reason`) rather than prose, and no
      entry needs it because none is absent
- [x] `j2if`'s stale sentence corrected — it claimed `folio/` was
      "deliberately absent from `cat-harness.json`", which is now false
- [x] a check that a declared directory exists, or a recorded reason there is
      none — `check:declared-dirs`, gating in CI, both directions, falsified
