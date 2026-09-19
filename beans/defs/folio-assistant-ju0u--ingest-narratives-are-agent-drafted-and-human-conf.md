---
# folio-assistant-ju0u
title: 'INGEST: narratives are agent-drafted and human-confirmed — a state machine, not a boolean'
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T16:04:09Z
updated_at: 2026-09-19T16:04:33Z
parent: folio-assistant-slw1
---


## What

A generated narrative — an image description, a transcript, a dataset summary —
is **drafted by an agent and confirmed by a human**. The owner chose this over
"agent writes it, attributed" (2026-09-19) and over a human writing every one.

So `narrative_state` stops being a boolean dressed as an enum
(`not-authored` | `authored`) and becomes the state machine the choice implies.

## Per narrative

TWO attributions, not one: who **drafted** it (agent, with its model) and who
**confirmed** it (human). They are different acts by different actors and
collapsing them loses which is which.

`rejected` is a real state and carries its reasons. A rejected draft that is
silently re-offered wastes the reviewer's time; one that vanishes lets the next
agent redraft the identical thing. Same argument `scrapped` wins on for beans.

## Why not a new review model

`schemas/qa-review.ts` already has `DECISION_OUTCOMES`
(`approve | request-changes | reject`) and `Overrule`, and `block-qa.ts`
carries agent + human adjudication over one subject. `iqim` already shares
`ATTRIBUTION_KINDS` across both. A second review vocabulary is what `rlp5`
records the cost of.

`todo-review` is NOT this: it triages content feedback under a folio's
`feedback/`, a different layer from the harness's `library/`.

## The review surface

The owner has very limited hand function. Confirmation must be **selection, not
typing**: a numbered list of pending drafts and a short command taking a number.
If confirming costs more than a couple of keystrokes, this design is worse in
practice than plain agent attribution and that should be said rather than
shipped.

## Done when

`narrative_state` is a checked state machine, a draft cannot be confirmed
without a human attribution, a rejection keeps its reasons, and
`check:l1-complete` fails a narrative whose state and attributions disagree.

Blocks the narrative half of `p67i`, and `d5f1` / `1r0p`.
