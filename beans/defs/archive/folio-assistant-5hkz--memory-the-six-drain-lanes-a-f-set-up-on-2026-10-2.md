---
# folio-assistant-5hkz
$schema: bean/1.0.0
title: 'Memory: The six drain lanes (A-F) set up on 2026-10-29 and which stalled threads they absorbed'
status: completed
type: task
priority: low
created_at: 2026-10-29T07:19:08Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `drain-lanes-2026-10-29.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: The six drain lanes (A-F) set up on 2026-10-29 and which stalled threads they absorbed


2026-10-29, thread "Prioritize and drain harness beans and issues": plan at /mnt/project-files/drain-plan-2026-10-29/plan.md (catalog in its catalog/ folder). Six lane threads were requested from the coordinator:
- A: GOAL 1 separation/placement (absorbs "Drain separation beans")
- B: process, BPMN, agent workflow (absorbs "Drain KG tools beans", "Drain folio-assistant-core beans")
- C: FHIR/IG stack, smart-* forks (absorbs "FHIR beans and WHO migration")
- D: rendered surface + fa#2683 publish bug (absorbs "Library viewers: memory and leftovers", "Page weight")
- E: KG, mounts, publication + fa#2682 (absorbs "README regen and follow-ups")
- F: land agy's ~55 library content PRs (x80s/d5f1) and ingest issues; never writes that content
CI speed thread keeps fa#2681 and all CI issues. ~95 of 114 open PRs were finished work waiting on merge or on fa#2681. See folio-assistant-8jbp, folio-assistant-wmmg.

2026-10-30 12:39Z, thread "Finish leftovers from closed lanes": owner card "A. Apply all" accepted these recommendations. fa#206, #243 and #1902 close. tools#638 splits into sub-issues and closes. fa#1719: go ahead with the first real subscription (litlfred/ihris) using slice 5's layout (G11). g196: keep preview IRIs in the HTML, and give the rail data a stable filename. fa#2527: docs pages (auto-docs, kind-table) are exempt. b5f0 box (e), bootstrap.config.json, is withdrawn. Findings: /mnt/project-files/leftovers-2026-10-30/findings.md

2026-10-30 14:43Z (Finish leftovers thread): card "B. Mine now, agy's +3h" = merge tools#889, cat-harness#730, tools#894, cat-harness#735 now; merge agy smart-base #194-#208 as they go green until ~17:44Z.

2026-10-30 19:30Z (thread "Update drain workplan and status"): live counts 60 issues / 33 PRs / 42 beans. All earlier drain lanes closed. Fresh catalog in drain-plan-2026-10-29/catalog-2026-10-30-1930Z/, status in status-2026-10-30/drain-status-1930Z.md. Seven new lanes proposed in plan.md (main-red+publish, merge sweeper, GOAL 1 finish, CI/QA beans, site+KG, IG/DAK, owner proposal sweep); owner card pending (recommended A = lanes 1-6).

2026-10-31 20:22Z (thread "Drain workplan, issues and beans", owner card A): merged 30 green non-content PRs (11 security, 19 tools/skills/gates) and completed 16 beans (bean commit aa25706). Left: tools#1093 conflicts with main (handed to Fix publishing), bean ylu8 waits on smart-ra#181, 6 content summary PRs need their own OK. Report: /mnt/project-files/drain-review-2026-10-31/drain-review-2010Z.md
