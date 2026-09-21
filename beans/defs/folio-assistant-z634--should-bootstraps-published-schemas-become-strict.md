---
# folio-assistant-z634
title: 'Should bootstrap''s published schemas become STRICT (additionalProperties: false)?'
status: todo
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

- [ ] Does anything actually produce these documents today? If nothing does,
      the compatibility risk is zero and this is free.
- [ ] Do the `.bpmn` documentation and `skills/discussion.md` imply extra
      keys are permitted, or merely not mention them?

## Done when

Either strictness is turned on DELIBERATELY — one line in
`gen-bootstrap-schemas.ts`, announced, with the corpus in
`discussion.test.ts` gaining an extra-key case — or this is scrapped with the
reason.

**Not a silent flip either way.** The point of the bean is that a change to
what validates is a decision about the CONTRACT, never a side effect of a
tooling choice.
