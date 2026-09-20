---
# folio-assistant-357k
title: 'activity-fulfilment-kind: 15 lanes whose role cannot perform the step type'
status: completed
type: task
priority: normal
created_at: 2026-09-19T07:27:41Z
updated_at: 2026-09-19T07:43:28Z
---

## What the audit found

15 `major` findings where two declarations contradicted each other: the diagram
said a step runs without a person, and the role graph said a person is who
stands in that lane. 14 × `activity-fulfilment-kind` across five processes, plus
1 × `actor-kind-fits-role`. The criterion cannot say which of the two is wrong,
so each one needed a judgement.

## The three answers, and why each

**Nine were the TASK TYPE.** `Task_Personas`, `Task_Bpmn`, `Task_Dmn`,
`Task_DataDict`, `Task_Indicators`, `Task_Terminology`, `Task_AssembleDak`
(l2-dak-authoring), `Task_AuthorFsh` (l3-fhir-pipeline) and
`Task_AttachEvidence` (evidence-retrieval) were `serviceTask`. BPMN's `userTask`
is *"performed by a human being with the assistance of a software application"* —
which is exactly what authoring personas, DMN tables, FSH profiles or attaching
evidence to a recommendation is. `serviceTask` asserts no human at all. Each
diagram already used `userTask` for a sibling step of the same kind in the same
lane (`Task_ScopeDak`, `Task_MapL2`, `Task_FramePico`), so the diagrams were
internally inconsistent, not the role graph.

**Five were the STEP genuinely admitting a system**, and carry
`<folio:fulfilment kinds="person system" reason="…"/>`: `Task_PublishRelease`
(draft-to-publication), `Task_Deploy`, `Task_Seed`, `Task_DeployPreview`
(ig-incremental-build) and `Task_PublishIg` (l3-fhir-pipeline). Version-tag-publish,
deploy and cache-seed are mechanical. They sit in the publication manager's or
reviewer's lane because that role is ACCOUNTABLE for what is live, not because a
person performs each step — `ig-incremental-build`'s lane is literally named
"Publication manager — deploy and seed".

Widening the ROLE was rejected for these: a publication manager is a person, and
an actor of kind `system` cannot BE one. The role's `actorKinds` is right; the
override on the step is the correct instrument, which is what it exists for.
Moving them to a build lane was also rejected — it would lose the accountability
that is the reason they are in that lane, and `Task_PublishRelease` is marked
`relaxable="false"` precisely because the publication manager owns it.

**One was the ACTOR's roles list.** `authoring-agent` declared role `editor`. Its
own description says *"It never commits: its output enters the HCI validation
pipeline and the editor accepts, revises or discards it"* — naming the editor as
a different party. `editing-hci-validation.bpmn` gives the agent `Lane_Agent`,
separate from the editor's lane, and the actor's `meta.workflow` points at
`#Lane_Agent`. An agent holding `editor` would let it accept its own change,
which is the gate the HCI validation process exists to enforce. Role dropped.

Checked and dismissed as counter-evidence: `editor` binds the lane named
"Editors + authoring agents" in `draft-to-publication.bpmn`. That lane holds
exactly one node — a `callActivity` into `editing-hci-validation`, where the two
lanes ARE separate. The name describes the called subprocess's participants, and
a call activity asserts no fulfilment kind, so nothing contradicts the fix.

## Falsification

Both fix kinds were regressed and the criterion re-fired: reverting
`Task_Personas` to `serviceTask` produced 1 finding; removing the
`<folio:fulfilment/>` from `Task_Deploy` produced 1 more. The criterion is not
silenced — 17 processes still evaluate it, 13 are `n/a`.

## Not fixed here

The remaining 10 `major` are the `skill-not-a-document` family (a skill over 400
lines) plus 137 `minor` — `skill-is-brief`, `skill-no-repeated-heading`, and
`skill-in-role-or-process` (101, which is coverage and must not gate). Those are
an editorial job on the skill corpus, not a contradiction between declarations.
