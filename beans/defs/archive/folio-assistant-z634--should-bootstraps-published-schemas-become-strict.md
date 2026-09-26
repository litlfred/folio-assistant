---
# folio-assistant-z634
title: 'Should bootstrap''s published schemas become STRICT (additionalProperties: false)?'
status: completed
type: task
created_at: 2026-09-20T22:53:31Z
updated_at: 2026-09-20T22:53:31Z
parent: folio-assistant-vke6
---

Raised by the Zod port (#610, bean `etg1`), and deliberately NOT decided there.

## What happened

`z.object()` is strict, so `zodToJsonSchema` emits `additionalProperties:
false` on every object. The hand-written documents it replaces carried none,
at any depth. Publishing it would have TIGHTENED a contract consumers already
follow: a document with one extra key validates today and would have stopped
validating.

`gen-bootstrap-schemas.ts` strips it, so the port changed nothing about what
validates. That is the conservative answer, and it was the right one for a
port — but it is not obviously the right one forever.

## The actual question

These documents are written by AGENTS, and an agent that misspells a key
today gets silence. `additionalProperties: false` is exactly what catches
that — `assumtion` instead of `assumption` would be rejected rather than
ignored, and the `assumed` conditional would then fire and say so.

Against that: the schemas sit at a published `$id`, and anything already
emitting an extra key breaks the day it is turned on.

## What to find out before deciding

- [x] Does anything actually produce these documents today? If nothing does,
      the compatibility risk is zero and this is free.
- [x] Do the `.bpmn` documentation and `skills/discussion.md` imply extra
      keys are permitted, or merely not mention them?

## Done when

Either strictness is turned on DELIBERATELY — one line in
`gen-bootstrap-schemas.ts`, announced, with the corpus in
`discussion.test.ts` gaining an extra-key case — or this is scrapped with the
reason.

**Not a silent flip either way.** The point of the bean is that a change to
what validates is a decision about the CONTRACT, never a side effect of a
tooling choice.


## DECIDED 2026-09-21 — STRICT, on the owner's "Go"

The bean pre-registered the test, and all three answers agreed:

| question | answer |
|---|---|
| producers of a discussion document, anywhere in the repo | **none** |
| `skills/discussion.md` on whether extra keys are permitted | **silent**, not permissive |
| age of the published `$id` | **1 day** (first appeared 2026-09-20) |

So the compatibility risk is zero, which is the condition this bean itself
named as making strictness free. What it buys is the failure these documents
are most exposed to: they are written by AGENTS, and `assumtion` for
`assumption` was silently ignored — the worst of both answers, since the field
is then absent, the `assumed` conditional should have fired, and the stray key
carried the value that would have satisfied it.

### The agent's own recommendation was PERMISSIVE, and the measurement reversed it

Recorded because the reversal is the point. The recommendation put to the
owner three times was *"permissive — tightening a published `$id` later breaks
consumers"*, which assumed consumers. The bean's own pre-registered question
is precisely a test of that assumption, and it came back empty. Applying the
recommendation without running it would have been the silent flip this bean
was opened to prevent — in the other direction.

### The cross-check caught a real divergence, unprompted

Making the JSON Schema strict turned **three** tests red, and two were the
Zod↔JSON-Schema cross-check rather than the new cases:

> `z.object()` STRIPS an unknown key and parses successfully. Only `.strict()`
> rejects it.

So `additionalProperties: false` in the published document would have been a
contract **the source of truth did not hold**. Fixed at the source — all five
objects are `.strict()` — rather than by relaxing the assertion. This is
exactly what that cross-check was built for, and it fired without being aimed.

### What landed

- `gen-bootstrap-schemas.ts` keeps strictness instead of stripping it.
  `stripAdditionalProperties` is **kept, exported and tested** rather than
  deleted: it is the one-line reversal if a consumer ever appears, and a
  deleted function is a decision that cannot be undone by reading a comment.
- All five `z.object()` in `discussion.ts` become `.strict()`.
- Four corpus cases: a typo'd key rejected, **the same document spelled right
  accepted** (without the pair, the first would still pass if rejected for the
  wrong reason — the missing `assumption` rather than the extra key), a nested
  stray key, and an extra top-level input key.
- The old test asserting the opposite is replaced by one that **counts**
  rather than greps, because `toContain` passes on a document strict at the
  top level and open at every nesting — the exact shape a later dropped
  `.strict()` would leave.

Falsified: dropping `.strict()` from one nested object turns **2 red**.
80 gates pass.
