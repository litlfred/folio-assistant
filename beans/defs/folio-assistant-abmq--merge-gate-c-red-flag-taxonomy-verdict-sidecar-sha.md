---
# folio-assistant-abmq
title: 'MERGE GATE (c): RED FLAG taxonomy, verdict sidecar shape, and the recorded override path'
status: todo
type: feature
created_at: 2026-10-02T16:29:16Z
updated_at: 2026-10-02T16:29:16Z
parent: folio-assistant-nok9
---

Child (c) of the merge-gate epic. Design: `cat-harness/docs/proposals/merge-gate-2026-10-02.md` §6.

A RED FLAG is a finding the reviewer asserts **blocks the merge**. It reuses the two existing axes in `schemas/qa-review.ts`: `FindingSeverity` (critical | major | minor: what kind of breakage) and `FindingWeight` (blocking | suggestion | praise: what the reviewer asks of the gate). A RED FLAG is `weight: blocking` with a category from a closed taxonomy (security, data loss, correctness, false green, provenance, scope breach, irreversible action, licence).

## Done when
- [ ] the taxonomy is a closed enum in a schema, each category with a definition and an example drawn from this repository's history
- [ ] the verdict sidecar shape is defined and validated, compatible with `kg-qa/v1` (an optional `adversarial_reviews[]` modelled on `voice_reviews[]`)
- [ ] the override path is a recorded `decision` by a human with standing (who, when, why, the finding id), never a deletion of the finding
- [ ] the gate's behaviour is defined for every state: open flag, resolved flag, overridden flag, `unknown` review, stale review (head moved)
