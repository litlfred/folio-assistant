---
# folio-assistant-5dj9
$schema: bean/1.0.0
title: 'Memory: BPMN figures sized so task-name labels equal body text size (cat-harness#976, docs-ui fitTextToBody)'
status: completed
type: task
priority: low
created_at: 2026-11-02T12:07:49Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `bpmn-text-size-2026-11-02.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: BPMN figures sized so task-name labels equal body text size (cat-harness#976, docs-ui fitTextToBody)


Owner 2026-11-02 12:03Z: "bpmn diagrams should be scaled so the text size matches narrative text size". Thread cmsg_017WNUkNK8kdDziPK58Pv6G9CHRzEc1asrdqkm9CvszFMo.

cat-harness#976 (MERGED 2026-11-02 12:18Z as d89dd2e on owner "ok merge", before full CI finished): docs-ui.js `fitTextToBody` reads the task-name font size (largest size with >=25% of the characters; bpmn-js draws task names 16px, event/flow labels 15px, lanes 13px) and sets `--fa-natural` = viewBox width x 0.8 x body/label (owner 12:13Z: labels at 80% of body text); CSS `.fa-figure-scope.fa-textfit`. 100% zoom = labels at 80% of body size; wide drawings scroll. Applies to all `.bpmn-figure` (PlantUML too). Screenshots in project-files bpmn-text-size-2026-11-02/.

Sites get it after re-pin. Related: folio-assistant-v4cn, folio-assistant-8pg0.
