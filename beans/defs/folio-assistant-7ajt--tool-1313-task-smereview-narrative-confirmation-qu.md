---
# folio-assistant-7ajt
title: 'TOOL 13/13: Task_SmeReview — narrative confirmation queue (1 file, 1 entry point)'
status: in-progress
type: task
priority: high
created_at: 2026-09-20T04:35:27Z
updated_at: 2026-09-20T16:47:03Z
parent: folio-assistant-d308
---

Group 13 of 13 in `d308`, and the reason the epic has a thirteenth entry at all.

**1 file, 1 entry point:** `scripts/narratives.ts`, with `schemas/narrative.ts`
as its subject.

**BPMN:** `editing-hci-validation · Task_SmeReview` and `Task_RecordDecision` —
both `userTask`, the human confirmation gate, which existed before this script did.

**Target repo (#223):** `folio-assist-core`.

## Why this one is `high` despite being one file

`main` added it on 2026-09-19. Its own header states the constraint it was built
for: *"the owner has very limited hand function, so every action is selection by
number"*, and that an unusable review step makes `confirmed` mean "nobody got
round to objecting", which launders an unreviewed machine summary into an accepted
one.

And `grep narrative folio-assistant/tools/*.ts` returns nothing. **The
accessibility mechanism is the least discoverable thing in the repository.** An
agent that does not already know the command exists cannot find it by asking the
graph, which is precisely the population the command is for.

That is also the evidence that `d308` is describing a live habit rather than
historical debt: the gap was created the day before the rule was stated, in the
feature that least tolerates it.

## Done when
- [ ] a Tool node for the narrative queue
- [ ] `satisfies` names the review skill `Task_SmeReview` refs
- [ ] its IO makes the numbered-selection contract visible in the node, not only in prose
- [ ] it cannot confirm a draft it drafted — `confirmed_by.kind` stays `human`
- [ ] `tool-coverage` reflects it


---

## MEASURED 2026-09-20 — blocked on the same class of question, and this is the one that matters most  ⟵ BLOCKER

The node cannot be written honestly today, and the reason is not effort.

### The BPMN's own skill ref does not fit the mechanism

`Task_SmeReview` refs **`content-review`**, so that looked like the answer. It is
not. `content-review`'s declared contract **requires `reviewType` and
`contentRef`**, and its prose is about WHO SMART Guidelines phase gates:

> Review L2 content before L3 begins (phase gate) · Review L3 content before
> publication · Assess breaking vs. non-breaking changes · Provide final
> publication release sign-off

`narratives.ts` has no notion of either required field. It takes a **queue index**
and a **numbered reason preset**. A node declaring `reviewType` and `contentRef`
would be asserting an interface the script does not have, and `check:tools` would
refuse it — correctly.

### And no other skill states the capability

Searched by DESCRIPTION rather than by name, which is the mistake `shzs` cost:

| candidate | why not |
|---|---|
| `qa-report-signing` | signing a **QA report** — "what was measured and who vouches for it", two routes because a signer may be air-gapped. The subject is a test run, not an agent-drafted narrative |
| `one-voice-style-guide`, `readability-editing`, `editor` | authoring and voice, not confirmation |
| `deletion-requires-confirmation` | confirmation of a **removal**, a different act |

**Nothing states "confirm an agent-drafted narrative, and do it by numbered
selection".** That is the `yean` shape, and authoring the skill is a claim about
the capability vocabulary every dependent instance inherits.

### Why this instance of the gap is the sharpest one in `d308`

The bean already said it and the measurement confirms it: this is the
accessibility mechanism, built because *"the owner has very limited hand function,
so every action is selection by number"*, and it is **the least discoverable thing
in the repository**. An agent that does not already know the command exists cannot
find it by asking the graph — and that is exactly the population the command is
for.

So the cost of leaving it unreachable is not tidiness. It is that
`confirmed` quietly comes to mean *"nobody got round to objecting"*, which is the
laundering `narratives.ts` was written to prevent.

### One thing the node will hit when it is written

`--why-text` is **free prose as an argv word**, so `check:tools` will refuse it
exactly as it refused `render-log.summary` (bean `ru6i`). The remedy is the same —
prose on stdin — and it is worth knowing before the node is attempted rather than
after. The numbered `--why` preset is fine: an enum is injection-safe by
construction.

### Done when

- [ ] **a skill stating "confirm an agent-drafted narrative by numbered
      selection"** — the owner's call, `yean`-shaped
- [ ] then a Tool node for the narrative queue, `satisfies` that one skill
- [ ] its IO makes the numbered-selection contract visible in the node, not only
      in prose
- [ ] `--why-text` on stdin rather than argv, per `ru6i`
- [ ] it cannot confirm a draft it drafted — `confirmed_by.kind` stays `human`
- [ ] `tools:coverage` reflects it
