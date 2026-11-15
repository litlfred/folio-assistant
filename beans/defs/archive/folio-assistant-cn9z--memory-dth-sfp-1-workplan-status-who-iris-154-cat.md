---
# folio-assistant-cn9z
$schema: bean/1.0.0
title: 'Memory: dth-sfp#1 workplan status: who-iris#154, cat-harness#889, smart-base#280 and #284 all merged 2026-11-02; workplan done except dth-sfp#8'
status: completed
type: task
priority: low
created_at: 2026-11-02T05:57:06Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dth-sfp-workplan-status.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: dth-sfp#1 workplan status: who-iris#154, cat-harness#889, smart-base#280 and #284 all merged 2026-11-02; workplan done except dth-sfp#8

Thread "Finish the dth-sfp workplan", status 2026-11-02 06:00Z:
- P0/P1: who-iris#154 MERGED 2026-11-01 21:09Z (6ab534a). dth-sfp#6 repinned who-iris to 6ab534a (80/80 coverage).
- P2: cat-harness#889 MERGED 2026-11-02 02:17Z (5c408ec), owner card Q-DTH3-2 A (covers regenerating smart-base's page).
- smart-base#280 (head af7766d) repins cat-harness 5c408ec and regenerates findings/dth-terms.md. It is red only because layer-mode CI mounts folio-assistant's lock (old cat-harness). Circular with the re-pin train fa#2906 (thread cmsg_017WNUkNK8kdDziPK58Pv6G9MmDK4fGPz89Zs2mtVYEY36). Suggested: fa#2906 pins smart-base af7766d with cat-harness 5c408ec; then re-run #280 and merge.
- who-iris#154 removed 9789240120747-eng page-NNN. smart-base dth-term-alternatives.json quotes 43 SFP items by page ids, so dth-terms:check fails once smart-base's who-iris pin passes c71f257. Fix ready (git stash on the #280 branch): page-009/010/011->sec-002-glossary, page-013->sec-003-introduction, page-016->sec-006-how-to-use-this-handbook, plus a who-iris repin to b727f82. Card Q-DTH3-3 answered A 2026-11-02 06:23Z -> smart-base#284 (issue #283), stacked on #280, who-iris 234f2ff; 3 quotes fixed for page-break artefacts. Re-pin train told to pin #284's head if fa's who-iris passes c71f257. Merge #280 then #284 on green, merge commits (no squash: the train pins af7766d).
- 2026-11-02 13:18Z: smart-base#280 (82b037a) and #284 (168b992) MERGED with merge commits, owner card Q-DTH3-4 A, despite the circular dth-terms:check red (CI used fa's old lock). Re-pin train fa#2911 told to pin smart-base 168b992.
- P3 = dth-sfp#8. P6d = smart-base#259. P4-P7 done in dth-sfp#3.
Related: folio-assistant-gdav, folio-assistant-wmmg.
