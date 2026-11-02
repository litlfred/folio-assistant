---
# folio-assistant-bpnl
$schema: bean/1.0.0
title: 'Fix overlapping harness BPMN layouts (nice-BPMN criteria)'
status: in-progress
type: task
priority: normal
created_at: 2026-11-02T18:55:00Z
updated_at: 2026-11-02T19:20:00Z
parent: folio-assistant-rwmf
tags:
    - bpmn-layout
---

Owner 2026-11-02 18:41Z, on the cat-harness BPMN in the beans-by-process mockup: "this bpmn has overlaps, does not meet nice bpmn criteria". Thread: https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9TKtbAKvnZPFwBmpCcBD2oP

Criteria: skill `bpmn-detangle` (cat-harness skills/process/workflow/bpmn-detangle.md), checks in cat-harness-tools src/workflow/diagram-fit.ts.

Layout redraws are CONTENT under the merge-window rules: show before/after images, lettered card, merge only on the owner's word.

## Plan

1. Baseline: `bpmn-detangle.ts processes` at cat-harness main 18:45Z: 63 of 80 diagrams have findings (232 total: 54 label-on-shape, 48 too-wide, 41 label-on-edge, 30 edge-crossing, 26 edge-through-shape, 17 label-on-lane-line, 5 label-overlap, 4 lane-order, 4 too-tall).
2. Gap in the check: a task straddling a lane line or hanging outside its lane is NOT reported (code-change-review "Run the gates", "Review the change"). Add a shape-outside-lane check (tools issue) and use it locally.
3. Redraw by hand: sdlc/code-change-review.bpmn, process/crdm-requirements.bpmn.
4. Run `--write` (labels, lane order, right angles) on the rest; hand-fix remaining crossings/through-shape.
5. One draft PR in cat-harness, before/after PNGs in /mnt/project-files/bpmn-layout-2026-11-02/, card to the owner.

## How to resume

Local setup: clone cat-harness, cat-harness-tools, bootstrap-tools side by side; in tools drop the two @litlfred deps, `bun install`, restore package.json, symlink node_modules/@litlfred/{bootstrap-tools,cat-harness}; then `CAT_HARNESS_ROOT=... CHROMIUM_PATH=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell bun scripts/bpmn-detangle.ts <dir>`.

_2026-11-02T18:55:00Z_ — Filed by the BPMN layout thread, session https://claude.ai/code/session_01Qmmkt7JGxreHWSJr571Mwq

_2026-11-02T19:20:00Z_ — Issue cat-harness#989, draft PR cat-harness#990 (branch claude/bpmn-layout-overlaps): code-change-review (2050->1390) and crdm-requirements (3146->1142) redrawn by hand, both clean. Generator: /mnt/project-files/bpmn-layout-2026-11-02/gen/{di.py,ccr.py,crdm.py} (rewrites the BPMNPlane from a coordinate spec, keeps DI ids). `--write` on the rest fixed little (62 still flagged), reverted. 43 diagrams have overlap findings, 20 only width. Card Q-LAYOUT-1 (A all 43 rec / B all 63 / C merge two now / D stop). Working on A meanwhile, worst first: activity-log, feature-staging, session-state-machine, refresh-materialized, slice-sqlite-publish, test-plan-execution, merge-base, nquads-distribution...
