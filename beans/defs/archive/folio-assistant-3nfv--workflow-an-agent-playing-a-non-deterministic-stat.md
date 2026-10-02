---
# folio-assistant-3nfv
title: 'WORKFLOW: an agent playing a non-deterministic state machine, as a workflow'
status: completed
type: feature
priority: normal
created_at: 2026-09-20T05:04:19Z
updated_at: 2026-09-20T07:18:17Z
parent: folio-assistant-ahvw
---

Owner, 2026-09-20:

> an agent could also play a (non-deterministic) state machine as a tool.
> managing state (kinda) during human/agentic discussion. this should be a
> workflow.

## Where the non-determinism actually lives

A machine whose SHAPE were non-deterministic could not be drawn here: the
interpreter supports nine BPMN element types and **throws** on the rest,
deliberately. So the shape is strict and enumerable, and what varies is
**which enabled branch the agent takes** and what it writes.

**That needed no engine change.** An exclusive gateway carrying
`<folio:decision>` is computed and `workflow_complete` REFUSES a hand-supplied
outcome; one without it already meant the caller supplies the answer. The
mechanism for a non-deterministic transition was there before anybody asked
for one — which is the useful finding, and the opposite of what the bean
assumed.

## What DID need adding, and why it is the part that matters

A gateway with no decision table was two things wearing one appearance:
somebody's call, and a table nobody wrote. Indistinguishable — the gap
`folio:no-skill` closed for activities, one element type along.

`<folio:judgement reason="…"/>`, with the same three rules: reason REQUIRED or
it does not load; refused on anything but an exclusive gateway; refused
ALONGSIDE `folio:decision`, because a node claiming both that a table decides
it and that a person does leaves a reader unable to tell which was meant.

**A step with no skill is a documentation gap. A gateway with no table is a
point where an LLM decides the branch** — and how many there are, and which,
is precisely what `q0tc` asks. A mechanism that cannot enumerate its own
judgement points cannot answer it.

Measured the moment it could be: **5 computed by a DMN table, 2 declared
judgement, 63 undeclared.** Issue #200 §6 classified "all ten" decision points
in prose, in an issue; there are seventy, and now something reads them.

## Summary of Changes

- `folio:judgement` parsed into `ProcessNode.judgementReason`, validated at
  load.
- `processes/session-state-machine.bpmn` — strict shape, both gateways
  declared judgement, ADVISORY policy. **No `folio:bean` anywhere**: the
  machine records that an actor claimed a bean, it does not claim one, because
  a claim announces rather than reserves and a machine claiming on an actor's
  behalf makes the owner unrecoverable. `A_CloseSession` closes the session and
  nothing else — beans and instances outlive it by design.
- `skills/workflow/session-state-machine.md` — the above, plus the two
  gateways and why each is safe to BE judgement: getting one wrong is
  recoverable, the next turn corrects it, and nothing downstream was
  authorised meanwhile. Contrasted with the five steps marked
  `relaxable="false"`, where a wrong branch authorises the un-authorisable.
  **Stated as a candidate criterion for `q0tc`, not as its answer.**
- `check:workflow-refs` reports the three-way split.
- Two roles bound: `Agent (playing the machine)` to `authoring-agent` (whose
  own description is "the session agent doing the work"), and a new
  `session-record` role modelled on `work-plan` / `corpus` / `log`.

## A THIRD `knownSkills` found and removed

`workflow-skill-refs.test.ts` carried its own, listing **five directories by
hand** — the exact defect `known-skills.ts`'s header records fixing, left
standing in a copy the fix did not reach. Measured: it missed **19** real
skills, including `bpmn-authoring` and `l2-dak-authoring`, which are named by
`<folio:skill ref>` in the diagrams that test checks.

It announced itself the way these always do: the test failed on a diagram
whose refs `check:workflow-refs` had already resolved. Two checkers, two
answers, and the wrong one gating.

## Done when

- [x] the machine is a diagram the engine can load and run
- [x] judgement points are DECLARED rather than inferred from an absence
- [x] the count is printed, so `q0tc` has data instead of prose
- [x] the machine claims nothing and closes nothing but itself
- [x] 43 gates pass
