---
# folio-assistant-8xx6
title: BPMN re-render for translated labels
status: in-progress
type: task
priority: normal
created_at: 2026-09-18T15:07:07Z
updated_at: 2026-09-18T15:15:52Z
---

The "next" recorded on bean `t8g3`. Re-render BPMN diagrams so translated
labels appear, handling text overflow.

**Now unblocked.** Its own input list was partly broken: `schemas/translation-tools.ts`
listed `docs/workflows/publication-workflow.bpmn` in the `dak` entry's
`bpmnDiagrams`, and **that file has never existed** — `docs/publication-workflow.md`
is a PAGE embedding three diagrams. An unresolvable path makes the re-render
SKIP it, and a skipped diagram is indistinguishable from one that needed no
work. Corrected to `draft-to-publication.bpmn` and gated by
`bun run check:workflow-refs` (PR #245).

The `draft-to-publication` reading is an inference, flagged for the author.
