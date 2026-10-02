---
# folio-assistant-ju0u
title: 'INGEST: narratives are agent-drafted and human-confirmed — a state machine, not a boolean'
status: completed
type: task
priority: normal
created_at: 2026-09-19T16:04:09Z
updated_at: 2026-09-19T16:13:06Z
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

## 2026-09-19 — the state machine, and the hole the tool itself opened

Done. `schemas/narrative.ts` + `scripts/narratives.ts`; `narrative-review` is a
checked requirement in `check:l1-complete`.

**The design.** `not-authored` → `draft` → `confirmed`, with `rejected` as a
real fourth state carrying its reasons. Two attributions, because they are two
acts: `drafted_by` is who wrote the words, `confirmed_by` is who accepted them.
`confirmed_by.kind` must be `"human"` — that single refinement is the whole
difference between the option the owner chose and the one they did not, because
without it `confirmed` degrades into "an agent said so twice".

**The finding, and it is the point of this bean.** I drove the CLI end to end
rather than reading it, and it wrote:

    "rejected_by": { "kind": "human", "id": "Claude" }

`git config user.name` in this container is `Claude`, so **the agent recorded
itself as the human reviewer**. The schema could not catch it: a rule about WHO
MAY ACT cannot be enforced by a rule about WHAT IS WRITTEN. The tool built to
serve the state machine was the thing that defeated it.

`reviewer()` now refuses outside a terminal — a person confirming at a prompt
has one, an agent's subprocess and CI do not. **Stated plainly in the code and
the skill: this stops accident, not fraud.** An agent that set out to forge a
confirmation could allocate a pty or write the file directly. What it does
guarantee is that no agent confirms a narrative *while going about other work*,
which is the failure that would actually have happened — repeatedly, and
invisibly.

**The review surface, against the falsifier I set.** The owner has very limited
hand function, so if confirming cost a typed sentence this design would be
worse in practice than plain agent attribution and I said I would report that
rather than ship it. It does not: rejection reasons are numbered too.

    bun run narratives                     # numbered list
    bun run narratives:confirm 1
    bun run narratives:reject 1 --why 2    # --why-text "..." stays available

Past the script name a decision is `1`, or `1 --why 2`. Measured in a test, not
asserted vaguely.

**Not a second review model.** `Attribution` and `script | agent | human` come
from `iqim`'s module, which `block-qa.ts` also re-exports. `qa-review.ts`'s
`Decision` already demands a note saying why this outcome and not another; this
is the same demand one layer over.

`tabular-records` now carries a `Narrative` object rather than the
`narrative: string|null` + `narrative_state` pair, which needed a cross-field
refinement to stop the two contradicting each other and had nowhere to record
who did what.

A `draft` is **reported, not failed**, by the gate: it is work waiting on a
person, and failing it would make an unreviewed queue indistinguishable from a
broken arm.

Fixtures throughout — nothing in `library/` carries a draft — with all six
branches mutation-checked (2, 2, 2, 3, 1, 1 named failures). Two defects were
in my own tests: a regex that did not match the real message, and a test whose
name promised to measure the review cost while asserting something else.

Tests: 24 in `scripts/tests/narratives.test.ts`. 2 879 pass / 0 fail; tsc,
eslint, 35/35 gates determined-pass.

## Follow-up, 2026-09-24

Prose blocks now get agent summaries too, BESIDE the extract rather than in place of it, kept in a `summaries.json` sidecar that uses this narrative state machine. Bean `x80s`.
