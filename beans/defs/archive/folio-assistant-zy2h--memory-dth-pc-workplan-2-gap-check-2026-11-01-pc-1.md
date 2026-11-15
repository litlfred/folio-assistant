---
# folio-assistant-zy2h
$schema: bean/1.0.0
title: 'Memory: dth-pc workplan (#2) gap check 2026-11-01: PC-1 outline never merged, link fix #10, open cards Q-DTH2-1..3'
status: completed
type: task
priority: low
created_at: 2026-11-01T09:58:11Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dth-pc-workplan-status.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: dth-pc workplan (#2) gap check 2026-11-01: PC-1 outline never merged, link fix #10, open cards Q-DTH2-1..3

2026-11-01 ~10:20Z, thread "Finish the dth-pc workplan" (cmsg_017WNUkNK8kdDziPK58Pv6G9GpcySMT6ege2zqXEy1qC8T).
- PC-0..PC-8 are all on dth-pc#1 (claude/dth-pc-scaffold), EXCEPT PC-1: the who-iris chapter outline lives only on unmerged branch fix/dth-pc-l1-9789240116191-eng (f98ec83). who-iris main keeps 9789240116191-eng page-granular (bean 6xaz). "who-iris#7" in the workplan was a wrong reference.
- Fix: issue dth-pc#9, draft PR dth-pc#10 (base = #1's branch) re-points 33 table blocks' source.section/file to page-NNN. check:l1-coverage fails before and after (22 unaccounted); that drift is dth-pc#8 / Q-CYSV1.
- dth-pc#4 (DMN noun phrases) already on #1 at 1193cb8; leave open until #1 merges.
- dth-pc#11 mirrors smart-ra#142 (Registry, Open Standards, AEFI open; Trade Item decided).
- PC ArchiMate elements sit IN the smart-ra 0.3.0-draft.1 model (smart-ra#147), predating the overlay rule folio-assistant-934v.
- Cards handed to "Drain DTH issues": Q-DTH2-1 overlay for PC (A recommended), Q-DTH2-2 unassigned BPMN lanes PC-BP-06/07/08 (A keep), Q-DTH2-3 fold #10 into #1 (A).
- #1 "Prepare the main side" check is red because dth-pc main is empty (no lock replayer); pre-existing.
Related: folio-assistant-gdav.
