---
# folio-assistant-dvwr
$schema: bean/1.0.0
title: 'Memory: Harness BPMN overlap redraw (2026-11-02): cat-harness#989/#990, bean bpnl, card Q-LAYOUT-1, generator in project files'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `bpmn-layout-overlaps-2026-11-02.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Harness BPMN overlap redraw (2026-11-02): cat-harness#989/#990, bean bpnl, card Q-LAYOUT-1, generator in project files


Thread "Fix overlapping harness BPMN layouts" (cmsg_017WNUkNK8kdDziPK58Pv6G9TKtbAKvnZPFwBmpCcBD2oP). Owner 18:41Z: harness BPMN "has overlaps, does not meet nice bpmn criteria".
- Audit at main 18:45Z: 63/80 diagrams flagged by bpmn-detangle (43 with overlaps, 20 width-only). `--write` fixes little.
- Draft PR cat-harness#990 (branch claude/bpmn-layout-overlaps), issue #989: code-change-review + crdm-requirements redrawn by hand, clean. CONTENT: merge only on owner OK.
- Card Q-LAYOUT-1 (cmsg_017WNUkNK8kdDziPK58Pv6G98dneVM42ZT1yfvbYaTn5fp): A redraw 43 (rec) / B all 63 / C merge two now / D stop.
- Generator /mnt/project-files/bpmn-layout-2026-11-02/gen/di.py; images same folder. Bean folio-assistant-bpnl holds plan + local setup.
- Check gap: a box on a lane line is not reported; needs a shape-off-lane finding in cat-harness-tools diagram-fit.ts.
Related: folio-assistant-8pg0, folio-assistant-tx6r.
