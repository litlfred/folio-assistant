---
# folio-assistant-ifqu
$schema: bean/1.0.0
title: 'Memory: BPMN ⓘ task panel skill links — skills without instruction pages get processes/skills/<name> pages from source; QA page panel-links-qa; merged cat-ha...'
status: completed
type: task
priority: low
created_at: 2026-11-08T10:32:03Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `task-panel-skill-links-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: BPMN ⓘ task panel skill links — skills without instruction pages get processes/skills/<name> pages from source; QA page panel-links-qa; merged cat-harness-tools#1679


cat-harness-tools#1679 (issue #1678) merged 2026-11-08 10:31Z. Thread "Link skills in BPMN task panel" (…QpFrpRhKoCqMULNtqEn26R).
- Cause: bootstrap's skills (confirm-harness, discussion, …) have no reference/skill-instructions page on the fa site by ruling pve3, so the panel showed "no page for this one".
- Fix (user: "fill in missing"): gen-processes-viz renders `processes/skills/<name>.md` from the skill's source file for any named skill with no instruction page (stays out of the graph, pve3 holds); else falls back to the GitHub blob URL (`skillTarget` in lib/skill-pages.ts).
- Panel task title → `<stem>.html#step-<id>` (step table row); subject page on the id line; lane fallback `#lane-<id>`.
- QA: `processes/panel-links-qa.md` lists panel names that link nowhere; generator warns once per name.
- CI gotchas: adding an import of `yaml` needs `bun run cat libraries:derive`; Standalone gate has no index lock/origin, so corpus tests must not assume forge links. remote-mount H3 is flaky on CI shards.
