---
# folio-assistant-be0f
$schema: bean/1.0.0
title: 'Memory: State of the GOAL 1 placement beans (saqd, rfuq, f8wp, pzwb, 95sk, 4fv8) as of 2026-11-10'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `goal1-placement-2026-10-30.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: State of the GOAL 1 placement beans (saqd, rfuq, f8wp, pzwb, 95sk, 4fv8) as of 2026-11-10


The "Finish GOAL 1 beans" thread covers the placement half of GOAL 1. The "Finish GOAL 1 code-move beans" thread covers the code-move half and closes fa#1770 and fa#223. On 2026-10-31 10:35Z it was told that rfuq and pzwb are done.

As of 2026-10-31 10:35Z:
- Completed: saqd, 95sk, 4fv8, rfuq, pzwb. R29 from 95sk is split into bean r29x, which the owner paused.
- f8wp: completed. Its library regroup moved to bean folio-assistant-6fez, which is also completed. The library is at cat-harness/library/corpus/<group>/<slug>/ in 8 groups. The leftover link fixes, cat-harness#1166 and cat-harness-tools#1732, merged 2026-11-10. Open owner questions, never asked: regroup other layers' libraries too? Add a check that forbids a slug equal to a group code?
- Leaf drain: cat-tools-g7ls was fixed by cat-harness-tools#1089, merged d29eea5 on 2026-10-31 after the owner's card. agy added the follow-up fixes.
- fa main gates are red, which is not placement work: uml:overview:check, bun test, e2e, and state-dirs. The CI thread owns these.

Table of saqd's remaining rows: /mnt/project-files/goal1-placement-2026-10-30/saqd-remaining-rows.md. See folio-assistant-wmmg.
