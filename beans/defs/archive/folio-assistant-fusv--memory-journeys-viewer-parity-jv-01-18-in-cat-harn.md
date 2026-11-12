---
# folio-assistant-fusv
$schema: bean/1.0.0
title: 'Memory: Journeys viewer parity JV-01..18 in cat-harness-tools (issues #1867, #1869; PRs #1868 #1870 #1871 #1873 merged, #1874 #1875 open); content waits on o...'
status: completed
type: task
priority: low
created_at: 2026-11-11T09:55:43Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `journeys-viewer-parity-jv.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Journeys viewer parity JV-01..18 in cat-harness-tools (issues #1867, #1869; PRs #1868 #1870 #1871 #1873 merged, #1874 #1875 open); content waits on one re-pin

2026-11-11. Beans smart-trust-demo-jv01..18 (smart-trust-demo PR #112, branch claude/journeys-wording). Spec docs/proposals/journeys-viewer-parity/, refs ref/01..13.

- JV-01/02 (#1868, issue #1867), merged. Q-JV-1 = A: shared payload files per example, loaded on tab open; file:// falls back to a link.
- Style beans, issue #1869, code PRs via the merge manager:
  - #1870 merged (0860bc2d): JV-06, 09 tagRows, 10, 12, 18.
  - #1871 merged: JV-07 Reset Simulation and JV-08 inspector bar.
  - #1873 merged (main 728ef3a3): JV-11 map fits 1400px and JV-13 architecture panel, read from the ArchiMate graph via presentation.architecture {model, root, countries, shared}.
  - #1874 open: JV-15/16/17, device demo pills, compact header, and a status bar from device-screen `client`.
  - #1875 open, stacked on #1874: JV-14, sheets cover via presentation.cover {fields?, table}.
  - Keep rows D01, D04, D10, D12, D15, D16, D18, D22 untouched.
- Graph fact: the DPI-H RA files "DPI-F Information Mediator" only under Interoperability, so the panel puts the OHS gateway there (VaxLink: DPI-F).
- Content for smart-trust-demo: /mnt/project-files/journeys-viewer-style-2026-11-11/presentation-content.json. That thread waits for #1875's merge commit, then asks the owner for one re-pin (consent per exact commit).
- Local test: folio-assistant clone at /home/user/w/fa. The smart-trust-demo/cat-harness-tools copy must be refreshed with `cp -r scripts schemas` (no rsync).
Related: folio-assistant-dhls.
