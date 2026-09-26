---
# folio-assistant-t2yg
title: 'EXCISE: SkillDefinition.schemas, declared 11 times and read by nothing'
status: completed
type: task
priority: normal
created_at: 2026-09-20T08:19:16Z
updated_at: 2026-09-20T08:36:15Z
parent: folio-assistant-zzmr
---


**Owner, 2026-09-20**: *"three zero-reader fields cleanup/excise"*.

## Only ONE of the three was zero-reader — the correction

I listed three together and that reads as equivalent. Re-measured before
touching anything:

| field | declarations | readers |
|---|---|---|
| `SkillDefinition.schemas` | 11 of 22 modules | **none** — excised here |
| `SkillCapabilityRef.degradation` | 23 values, and **required** | none, but see below |
| `SkillCapabilityRef.fallbackRole` | 1 | **`check-fallback-roles.ts`** — a live CI gate |

`fallbackRole` is **not** zero-reader. Excising it means deleting a gate
added the previous day and the `qa-report-signing` declaration that is its
only use. Not done; flagged.

`degradation` is unread but **structurally load-bearing**: it is the field
that says *under what condition* `fallbackCapabilityId` and `fallbackRole`
apply. Removing it while keeping a fallback that IS read leaves "fall back"
with no stated trigger. Not done; flagged. One word and it goes.

## What was excised

`SkillDefinition.schemas` — the interface field, its Zod counterpart, and
all 11 declarations.

The interface `SkillSchemaRef` **stays as a type**: a downstream instance may
hold one, and a removed export is a breaking change for something that costs
nothing to leave declarable. Its doc now records why it has no field.

## The reason worth keeping

`skill-package.ts` had a comment saying `schemas` was *"documented and
appears in the interface's own example, but had no counterpart here — so
`.parse()` stripped it"*. That was a real defect, correctly fixed.

**And fixing a field's plumbing is not evidence that anything is on the
other end.** The fix made the value survive `.parse()` and travel to exactly
one consumer — `generate-docs.ts`, which had never run since the root commit
and is now retired (`3w0i`). Both states reached no reader. That is written
into the file, because it is the trap, not the trivia.

## Done when

- [x] the 11 declarations removed
- [x] the field and its Zod counterpart removed
- [x] the type kept, with the reason it has no field
- [x] `degradation` and `fallbackRole` reported rather than excised
