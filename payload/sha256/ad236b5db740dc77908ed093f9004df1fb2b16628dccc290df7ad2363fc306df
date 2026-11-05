---
# folio-assistant-bpnl
$schema: bean/1.0.0
title: 'Fix overlapping harness BPMN layouts (nice-BPMN criteria)'
status: in-progress
type: task
priority: normal
created_at: 2026-11-02T18:55:00Z
updated_at: 2026-11-05T14:03:00Z
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

_2026-11-02T19:13:00Z_ — Owner chose A (redraw all 43 with overlaps), and asked to improve authoring skills (done in 9dd97fc: bpmn-authoring requires zero `--check` findings; bpmn-detangle "Laying it out by hand" patterns). PR #990 pushed. DONE (clean or width-only): code-change-review, crdm-requirements, activity-log, feature-staging, session-state-machine, refresh-materialized, slice-sqlite-publish, test-plan-execution (too-wide 1760), merge-base, nquads-distribution, sme-test-data-review, code-quality-gates (too-wide 1540), adjudication, crdm-close. Names shortened (with .pot msgids): refresh-materialized Task_RecordConflict; sme-test-data-review 3 tasks.
NEXT (worst first): review-task (no pool: rewrite() needs a pool, use lanes only), subscribe-kg (4186 wide, 32 nodes, wrap rows), kg-separation, test-data-curation, merge-train, crdm-deliver, human-translation-workflow, sub-kg-lifecycle, named-query-execution, mount-subgraph, kg-to-portal, requirements-filing, narrative-code-review, merge-refusal, bean-close, document-ingestion, mount-dependency, graph-detanglement, staging-render-log, qa-publish, bean-drain, crdm-requirements-definition, crdm-issue-linking, voice-review, upstream-pin-watch, publish-verification, options-analysis, secure-agent-permissions, crdm-signoff, translation-workflow, copy-into-folio.
Resume: generator scripts per diagram in /mnt/project-files/bpmn-layout-2026-11-02/gen/ (di.py rewrite/patch, dump.py); /home/claude/work/chk.sh = detangle + before/after PNG (recreate: see How to resume above). Then before/after PNGs for all, merge card.

_2026-11-02T19:55:00Z_ — Pushed to #990 (head 79ceba7): review-task, upstream-pin-watch, publish-verification, options-analysis (task renamed "Record the chosen option AND the rejected ones", .pot updated), secure-agent-permissions (1920->1400), crdm-signoff (1810->1350). 20 redrawn, 25 left (list below).
NEXT: translation-workflow, copy-into-folio, then subscribe-kg, human-translation-workflow, kg-separation, test-data-curation, merge-train, crdm-deliver, sub-kg-lifecycle, named-query-execution, mount-subgraph, kg-to-portal, requirements-filing, narrative-code-review, merge-refusal, bean-close, document-ingestion, mount-dependency, graph-detanglement, staging-render-log, qa-publish, bean-drain, crdm-requirements-definition, crdm-issue-linking, voice-review.

_2026-11-02T20:30:00Z_ — Pushed to #990: translation-workflow (2 rows, names shortened to fit, .pot updated), copy-into-folio, qa-publish, bean-drain, voice-review, crdm-issue-linking, staging-render-log, crdm-requirements-definition. 28 redrawn, 17 left.
NEXT: subscribe-kg, human-translation-workflow, kg-separation, test-data-curation, merge-train, crdm-deliver, sub-kg-lifecycle, named-query-execution, mount-subgraph, kg-to-portal, requirements-filing, narrative-code-review, merge-refusal, bean-close, document-ingestion, mount-dependency, graph-detanglement.
Note: translation-workflow has a laneSet but no pool/lanes drawn (left as-is; follow-up).

_2026-11-05T13:33:51Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: no other agent's commit in the window, no open PR naming it.

_2026-11-05T14:03:00Z_ — Merged `origin/main` into `claude/bpmn-layout-overlaps` (adapting to the `processes/sdlc/` -> `sdlc/processes/` move and `Call_BeanOpen`/`Call_BeanClose` removal outside `sdlc/`), resolved all remaining DI layout overlaps across all 17 remaining diagrams (`subscribe-kg`, `human-translation-workflow`, `kg-separation`, `test-data-curation`, `merge-train`, `crdm-deliver`, `sub-kg-lifecycle`, `named-query-execution`, `mount-subgraph`, `kg-to-portal`, `requirements-filing`, `narrative-code-review`, `merge-refusal`, `bean-close`, `document-ingestion`, `mount-dependency`, `graph-detanglement`) plus the `edge-through-own-end` and `label-on-lane-line` findings introduced by `origin/main`'s stricter `diagram-fit.ts` checks. `bpmn-detangle.ts` across all 82 `.bpmn` files in `cat-harness` (`processes/` + `sdlc/processes/`) now reports **0 overlap/crossing/through-shape/through-own-end/detached/label findings** (only 29 `diagram-too-wide`, 5 `lane-order`, 2 `diagram-too-tall`). Pushed to `claude/bpmn-layout-overlaps` (`d75b53815`) and marked PR `litlfred/cat-harness#990` ready for review (awaiting owner sign-off per merge-window rules).
