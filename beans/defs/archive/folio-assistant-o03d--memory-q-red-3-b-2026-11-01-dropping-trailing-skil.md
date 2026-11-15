---
# folio-assistant-o03d
$schema: bean/1.0.0
title: 'Memory: Q-RED-3 B (2026-11-01): dropping trailing [skill] slugs from BPMN task names; PRs, rule used, how derived files were refreshed'
status: completed
type: task
priority: low
created_at: 2026-11-01T10:53:32Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `bpmn-task-name-slugs.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Q-RED-3 B (2026-11-01): dropping trailing [skill] slugs from BPMN task names; PRs, rule used, how derived files were refreshed


Thread "Remove skill lists from BPMN task names" (cmsg_017WNUkNK8kdDziPK58Pv6G9AKAGLwFDSgXB4cdFzknaLS). User chose Q-RED-3 B 2026-11-01 09:11Z.
- DONE 2026-11-02 08:35Z: all 5 PRs merged by the user, issues closed. PRs: cat-harness#885 (issue #884), folio-assistant-core#471 (#470), fhir-harness#259 (#258), folio-assistant-sci#161 (#160), smart-base#265 (#264). Branch claude/drop-task-name-skill-slugs.
- Q-SLUG2 A (09:28Z): tool/schema names written into task documentation, then all non-skill brackets dropped; only core board-open-close `[x]` stays. Q-SLUG3 B: smart-base names shortened to "Identify interventions and recommendations (Component 1)" and "Check exclusions against page and sign".
- PRs are NAMES ONLY (10:50Z): the square 120x120 detangle layout was reverted out of them; thread "Fix harness BPMN diagrams" runs detangle on its own branches (claude/bpmn-guidance-fixes, cat-harness#897, core#478). Whichever lands second regenerates checklists, SVGs and .pot files.
- Overlap: Q-FIX-3 A shortened 104 task names (also dropping slugs) on claude/bpmn-store-lanes: cat-harness#914, core#487, fhir#263, bootstrap#41 (list /mnt/project-files/bpmn-guidance-fixes/overflowing-task-names.md). On conflict keep THEIR shorter names.
- How-to: tools need an fa checkout with repos at mount paths and fa/.git moved away (instanceRootsIn skips foreign checkouts); park smart-immunizations/smart-trust* (unknown typology). `bun run cat render:bpmn` and `translate-bpmn:extract` work for cat-harness. For core/fhir/sci/smart-base the .pot files carry old `../repo/` source paths, so a re-extract rewrites every file; edit only the msgids instead. Glossary prefLabels edited in place. bpmn-checklist already strips one trailing bracket.
Related: folio-assistant-8pg0, folio-assistant-co5e.
