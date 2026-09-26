---
# folio-assistant-uuhu
title: Work the 42 activity-names-skill findings
status: completed
type: task
priority: normal
created_at: 2026-09-18T22:22:17Z
updated_at: 2026-09-18T22:25:51Z
---


**Measured 2026-09-18**, `bun run kg:audit`: 42 `activity-names-skill` findings
across the workflow corpus. Classified with the role graph before touching
anything:

- **2 call activities** (`CallActivity_Gate` → `Process_L1Gate`,
  `CallActivity_Evidence` → `Process_EvidenceRetrieval`). The criterion was
  wrong, not the diagram: a call activity is implemented by the process it
  calls. Demanding a second, redundant `<folio:skill ref>` of it is a bug.
- **26 human-judgement steps** in person lanes — a stakeholder approving, a BA
  describing a need, a translator working in their own tool.
- **14 system/agent-lane gaps** — the real finding.
- **0 unresolved lanes**: every activity resolved to a declared role.

**Done:** 27 refs inserted across 8 diagrams; `business-analyst` given
`crdm-requirements-workflow` and `decision-audit`; the call-activity exemption
added, guarded by a new `call-activity-resolves` criterion so a typo in
`calledElement` cannot satisfy both. 42 → 12.

**The 12 that remain are not gaps.** Four stakeholder sign-offs, two "describe
the change in your own words", a translator's external tool, two steps in
`evidence-retrieval` whose own header declares the grading system deliberately
unfixed, and `Task_Commit`, which sits in the `actedUpon` Corpus lane — nobody
performs it, so no skill implements it. Forcing a ref onto any of these is the
fake-ref failure the criterion is `minor` to avoid.
