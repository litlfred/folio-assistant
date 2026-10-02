---
# folio-assistant-luke
title: Wire folio:skill refs for the 90 uncovered BPMN activities
status: completed
type: task
priority: normal
created_at: 2026-09-18T15:07:07Z
updated_at: 2026-09-18T15:13:24Z
---

**Measured 2026-09-18**, `bun run check:workflow-refs`: **90 activities** across
18 diagrams name no implementing skill. Six diagrams at 0%:

- `content-change-review.bpmn`
- `human-translation-workflow.bpmn`
- `translation-workflow.bpmn`
- `ingest-build-l1-kg.bpmn`
- `ingest-derive-content.bpmn`
- `ingest-l1-completeness-gate.bpmn`

`workflow_next` can only return a step name for these, not something
actionable — the same defect fixed for `crdm-requirements.bpmn` in PR #241
(1 ref across 35 nodes → 13).

**Coverage is deliberately NOT gated**: a human sign-off step has no skill to
name, so failing on coverage would force a fake ref onto a real step, which is
worse than the gap. Wire the ones that genuinely have an implementing skill.
