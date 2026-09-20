---
# folio-assistant-7ajt
title: 'TOOL 13/13: Task_SmeReview — narrative confirmation queue (1 file, 1 entry point)'
status: todo
type: task
priority: high
created_at: 2026-09-20T04:35:27Z
updated_at: 2026-09-20T04:35:27Z
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
