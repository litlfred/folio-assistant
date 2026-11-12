---
# folio-assistant-xm34
$schema: bean/1.0.0
title: 'Memory: BPMN helper B1 (2026-11-01..02): landed G-block PRs; Q-BR-8 = F (Beans data store); tools#1381 then G5'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `bpmn-gblocks-b1-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: BPMN helper B1 (2026-11-01..02): landed G-block PRs; Q-BR-8 = F (Beans data store); tools#1381 then G5


Thread "Land BPMN G-block PRs" (cmsg_017WNUkNK8kdDziPK58Pv6G9Cj6NCezeD1GFfVaBHe9cE8), helper of S9 (folio-assistant-2xsz). S9 does final merges; check with S9 before pushing to S9's branches. Results to drain thread …Hg9BR969ujM2YAX9DPArcj.
- Local: /home/claude/{cat-harness-tools, cat-harness, bootstrap-tools}; CAT_HARNESS_ROOT=/home/claude/cat-harness. 8 tools tests fail locally regardless (need a git checkout).
- ALL original G-block PRs MERGED by 07:03Z 2026-11-02: cat-harness#905 G7, #899 G3, #901 G8, #896 G2; tools#1247, #1373; core#481 G6; core#485 superseded by core#575 (G10).
- Lesson: cat-harness CI loads tools from the fa index lock pin, so a tools change needs an fa re-pin before cat-harness PRs see it; a workflow re-run reuses the old pin.
- Q-BR-8 design doc: https://claude.ai/artifact/K788kSocaKG5E3En9UgS1Y (options A-G).
- OWNER RULE 06:34Z: an agent can take up any task associated to a skill for which it has a tool => a bean can be picked up at any task.
- Q-BR-8 = F TAPPED 06:37Z: keep drawn Process_BeanOpen/Close; each bean-working task has a dataOutputAssociation to a Beans dataStoreReference (dataStoreRef="work-plan", global in cat-harness processes/global-tasks.bpmn), replacing hidden bean op="note". Owner chose data STORE over data object (outlives the run).
- tools issue #1380, PR #1381 (branch claude/bean-store-associations, 21bf903): write assoc to work-plan => workPlanOp note + worksBean; completing claims a todo bean (never draft/in-progress/finished) then notes. Q-B1-1 A (07:08Z): marked ready. Next: green -> hand to S9 -> fa re-pin -> G5 in cat-harness (swap 115 note extensions in 31 files for store associations).
- 07:54Z tools#1381 MERGED; #1380 closed. Next: fa re-pin, then G5 + note swap (diagram redraw => ask card).
- 10:06Z Q-B1-2 = A: one cat-harness DRAFT PR, G5 + swap 115 note marks in 31 diagrams for Beans store links; user reviews before ready.
- 10:50Z cat-harness issue #971, draft PR #972 (branch claude/beans-store-links, 39f8c96): 116 notes swapped (script /mnt/project-files/bpmn-guidance-review-2026-11-01/swap.py). Next commit: G5 split. Needs fa re-pin tools>=347499b.
- 11:40Z #972 d544f61: G5 phases (kg-separation-{detangle,prepare,authorise,move,cutover}.bpmn) + tops rebuilt; generator /mnt/project-files/bpmn-guidance-review-2026-11-01/{lib,build}.py (sources copied in /tmp, re-copy from git HEAD~ if rerun). sub-kg waits Q-B1-3 (card cmsg_017WNUkNK8kdDziPK58Pv6G9QzW1JxWDumMZsLVjir5cer, rec A).

## 11-07 16:10Z
- fa#2921 re-pin merged 11-02 23:28Z. cat-harness#972 is now 442 behind main with 20 BPMN conflicts. Main's c1f61f98 (#991, tools#1435) removed bean markup outside sdlc/, and the engine now does it implicitly, so the Beans-store swap is obsolete. kg-separation on main is ~5858px wide (graph-detanglement 1550, fine), so the G5 split still has value.
- Card Q-B1-4 (cmsg_017WNUkNK8kdDziPK58Pv6G98QWrCouQmoaqHuZ4TLZs6h): A redo only the split on main (rec) / B close as superseded / C hold. Q-B1-3 still open.
- 11-08 06:31Z Q-B1-4 = A. #972 rebuilt on main as e48baab1 (force-push, retitled "kg-separation: draw it in phases (G5)"): 4 phase files (prepare/authorise/move/cutover), top 5858→2905 wide; Beans swap dropped. Generator: scratchpad g2/build2.py (lib SRC=/tmp/claude-0/m main copies, ns/ IRIs). Renders need /home/claude/node_modules symlink → cat-harness-tools/node_modules. Next: ready-or-hold card Q-B1-5; Q-B1-3 still open.
- 11-08 10:16Z cat-harness#972 MERGED (Q-B1-5 A). Only Q-B1-3 (sub-kg-lifecycle) remains open in thread B1.
- 11-08 11:46Z Q-B1-3 = A. Draft cat-harness#1152 (issue #1151, branch claude/sub-kg-shared-phases, 88dddc13): sub-kg calls shared authorise/move/cutover; Move gains Repoint/FreshClone/GW_Fresh; authorise ask relaxable=false. Generator scratchpad g2/build3.py. Open review points: Repoint vs Consume overlap; sub-kg now runs Release+Verify. Waits on user review, then ready card.
- 11-08 12:05Z #1152 READY (owner 40A) at 7674dee2: + lane rows k/(n+1) (script /mnt/project-files/bpmn-guidance-review-2026-11-01/lane_align.py), shared-port fixes in qa-publish & saturation-meta-merge, rules in bpmn-processes/bpmn-authoring skills. tools draft #1714 (issue #1713, branch claude/edge-shared-port): edge-shared-port finding (report-only). Handed #1152 to merge manager via coordinator.
- 11-08 12:40Z cat-harness#1152 MERGED; tools#1714 merged 12:21Z. Thread B1 work complete; resolved.
