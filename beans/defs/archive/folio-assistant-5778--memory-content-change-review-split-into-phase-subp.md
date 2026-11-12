---
# folio-assistant-5778
$schema: bean/1.0.0
title: 'Memory: content-change-review split into phase subprocesses (2026-10-31): open PRs and the do-not-merge staging re-pin to close afterwards'
status: completed
type: task
priority: low
created_at: 2026-10-31T10:24:54Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `ccr-phase-split.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: content-change-review split into phase subprocesses (2026-10-31): open PRs and the do-not-merge staging re-pin to close afterwards


Thread "Simplify content change review process" (2026-10-31).
- folio-assistant-core#370 (issue #369): content-change-review.bpmn split into top level + make/stage/committee/publish phases. Draft until the owner sees the preview.
- cat-harness#847: "Split by phase: how" in bpmn-authoring, stacked on #846 (research thread's "Readable diagrams" rules). Whoever merges second rebases.
- folio-assistant#2833: STAGING re-pin only, labelled do-not-merge, marked ready so the preview builds. Close it once #370 merges and the normal re-pin lands. Never merge it.
Related: folio-assistant-5hkz.

2026-10-31 13:12Z owner card 'A. Merge both PRs': merged core#370 (beb57d8) and cat-harness#847 into #846's branch (cf9c4f2), so it reaches main when #846 merges. Closed fa#2833 unmerged. Core still needs the normal re-pin in folio-assistant.
