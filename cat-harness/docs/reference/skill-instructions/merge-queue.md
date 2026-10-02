---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Merge queue'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/sdlc/sdlc-core/merge-queue.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/sdlc/sdlc-core/merge-queue.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/sdlc/sdlc-core/merge-queue.md){: .fa-edit-source }

{% raw %}
# Merge queue — what lands next, and as what

`processes/sdlc/merge-train.bpmn` is the process. The ORDER is computed by
`processes/sdlc/decisions/merge-priority.dmn`; the facts it reads are derived
by `scripts/merge-queue.ts`; what the steward decided is recorded against
`schemas/merge-queue.ts`. This page says what each piece is FOR. Bean `hfag`.

## The rule everything else follows from

**The queue stores decisions, never GitHub's facts.** CI status, mergeability,
labels and head SHA change without the queue being told, so a stored copy is
stale the moment it is written and a reader cannot tell which. They are read
live at each step. What a queue entry holds is what the steward DECIDED — the
placement, a hold, an ejection — with who decided it, when, and the evidence
URL it acted on. `FORBIDDEN_FACT_KEYS` in the schema refuses an entry that
carries a fact.

## Placement is computed, not chosen

`GW_Placement` is DMN-backed, so `workflow_complete` refuses a hand-supplied
outcome there. The table (hit policy FIRST) answers a `route` (`admit` or
`hand back`), a `class` (`PRIORITY_CLASSES`), a `rank` and whether the PR
rides alone.

- **An owner override is an INPUT** (`ownerOverride`), never an outcome. The
  owner places a PR by hand in `Task_Override`; the schema refuses an
  `override` placement without a reason.
- **Independence is decided on AUTHORED paths** (`authoredPaths`,
  `touchesShared`). Generated paths are excluded because
  `merge-conflict-patterns` already resolves them; counting them would make
  every pair of PRs conflict.
- **Ties go to the oldest PR** (`orderQueue`): overrides at their positions,
  then rank, then PR number.

## A red train ejects one member, not the train

1. **Retry only a declared-flaky gate, and only once** (`Task_RetryFlaky`).
   A deterministic gate retried learns nothing.
2. **Attribute from each member's own CI first** (`Task_Attribute`). A member
   whose own CI is red, or never ran on its head — GitHub runs no
   `pull_request` CI while a PR conflicts — is the prime suspect, at no cost.
3. **Bisect only when every member is green alone** (`Task_Bisect`).
4. **Eject and hand back with the reason** (`Task_Eject`, then
   `merge-refusal.bpmn`). The ejection is written on the member's entry; the
   rest re-run without it. The owning session fixes and re-signals ready; it
   is never merged on its behalf.

## Landing

Only with the owner's release (`Task_Release`): explicit, or a standing ruling
quoted verbatim with its date. What lands is exactly the SHA CI tested; if
`main` moved after the train's CI started, re-run rather than land.

## What this does not do yet

The train's size is a fixed cap. Sizing it by risk waits for this process's
own run records, which is why each run is a committed instance under
`beans/workflows/`. The tools named on the steps (`merge:overlap`,
`merge:train`, `merge:leftover`) live on branch `claude/merge-pipeline-tools`
until it lands.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [A merge train](../../processes/merge-train.html) | Read each queued PR's live facts; Take the next PR in queue order; Admit it to the train, record the train id; Attribute the failure: each member's own CI first; Bisect the train; Eject the culprit, record why |

