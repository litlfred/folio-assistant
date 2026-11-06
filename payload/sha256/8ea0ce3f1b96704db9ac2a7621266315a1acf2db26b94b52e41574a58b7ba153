---
# folio-assistant-k6dz
$schema: bean/1.0.0
title: 'Split the 23 oversized harness BPMN diagrams into phases'
status: todo
type: task
priority: normal
created_at: 2026-11-06T05:31:14Z
updated_at: 2026-11-06T05:31:14Z
parent: folio-assistant-rwmf
tags:
    - bpmn-layout
---

Follow-up to litlfred/cat-harness#990 (owner card 2026-11-06, "1. Merge on green"). After #990 none of the 57 harness diagrams has an overlap finding, but 23 still fail `bpmn:detangle --check` on `diagram-too-wide`, `diagram-too-tall` or `lane-order`. These are size budgets, not overlaps. The widest are kg-separation (5798 px), sub-kg-lifecycle (4329), human-translation-workflow (3876) and subscribe-kg (3812). Bringing them under the 1400 px budget means splitting each into phases (sub-processes or linked diagrams). code-change-review's lane-order hint stays as it is on purpose (see #990's body). Before/after pictures: https://github.com/litlfred/cat-harness/pull/990#issuecomment-6677738281

## Done when
Each of the 23 passes `--check`, or the owner accepts its size with a reason.
