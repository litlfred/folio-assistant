---
# folio-assistant-6uqk
$schema: bean/1.0.0
title: 'Memory: BPMN label tidy pass (bootstrap-tools #87+#88 merged) + square-task redraws across repos (phw#61, fhir-harness#388, cat-harness#1254, core#757, boots...'
status: completed
type: task
priority: low
created_at: 2026-11-11T18:06:59Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `bpmn-label-tidy-square-tasks.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: BPMN label tidy pass (bootstrap-tools #87+#88 merged) + square-task redraws across repos (phw#61, fhir-harness#388, cat-harness#1254, core#757, bootstrap#54, ihris#46); Q-SQ-1, Q-BPMN-FIX-1


Thread "Fix overlapping BPMN labels in smart-trust-phw" (cmsg_017WNUkNK8kdDziPK58Pv6G9AonKYSN5pzp1WvC45sYU7Q), 2026-11-11.
- Label layout fixed ONCE in renderer: bootstrap-tools scripts/bpmn-tidy.ts (#87 MERGED 17:54Z). #88 MERGED 22:47Z (outside-pool penalty only for anchors inside a pool).
- Q-SQ-1 = C: square = TASK BOXES equal w/h, not arrow corners. Q-BPMN-FIX-1 = B: merge #87, re-pin, phw#61 ready for owner OK, AND redraw other repos.
- CAT-stack rule (cat-harness skills/process/workflow/bpmn-detangle.md): task FIXED 120x120, never grows (shorten name instead = content); budget 1400x900; check = cat-harness-tools scripts/bpmn-detangle.ts. Run it locally from /home/user/litlfred/cat-harness-tools with node_modules symlinked to bootstrap-tools. Smart stack (phw) used 120-180 per diagram.
- PRs (all content, need owner OK): phw#61 (re-pinned to bootstrap-tools b31c534 incl. lock treeDigest + layers:publish + cherry-picked layers-move caller b903a99; all green 23:05Z; merge manager posted owner card), fhir-harness#388, cat-harness#1254 (6/17, issue #1253), folio-assistant-core#757 (9/14, #756), bootstrap#54 (2/3, #53), ihris#46 (gen_bpmn.py SIZE 120x120; ihris BPMNs are GENERATED from processes/specs), who-iris none (all 3 need hand work).
- Hand-layout list + tools (square.py, squarify.py with SQ_FIXED=120, choose-cat.ts, svg-only.ts): /mnt/project-files/bpmn-square-tasks-2026-11-11/.
- Bean k6dz (another agent) is shrinking cat-harness diagram widths; avoid clashing.
Related: folio-assistant-dvwr, folio-assistant-oepg.
