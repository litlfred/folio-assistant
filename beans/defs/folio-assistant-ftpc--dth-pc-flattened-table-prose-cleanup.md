---
# folio-assistant-ftpc
$schema: bean/1.0.0
title: 'dth-pc: drop flattened step/risks table text from prose pages'
status: in-progress
type: task
priority: normal
created_at: 2026-11-02T19:30:00Z
updated_at: 2026-11-08T07:00:00Z
parent: folio-assistant-dthl
tags:
    - dth-pc
    - content
    - extraction-fix
---

## Goal

Owner saw "POTENTIAL RISKS MITIGATION MITIGATION ..." run-on text under the real risks table on the dth-pc staging site (Chapter 4). The seeder copied PDF table text into prose pages next to the structured t-chNN-step-N table blocks.

Same owner message also asked: more padding between content and the "grill" (side decoration), and no right-side grill. That is site chrome (cat-harness), not dth-pc content.

## Plan

1. [x] Fix p-ch02-page-033, p-ch03-page-037, p-ch04-page-041, p-ch05-page-044: keep only "End of chapter checkpoint" as a heading + list. Branch claude/dth-pc-flattened-tables, draft PR litlfred/dth-pc#16 (base claude/dth-pc-scaffold), issue litlfred/dth-pc#15.
2. [x] Before/after images, card to owner (content change: never merge without OK; editing gate may need editor sign-off).
3. [x] (owner Q-FT-1 A, 19:19Z) If owner says so: same cleanup on 12 more pages (ch01 021/022/023, ch02 025/027/031/032, ch03 035/036, ch04 039/040, ch05 043). These mix real prose with table text, so cut per page against the table blocks.
4. [ ] Process fix (NOT in dth-pc: AGENTS.md says validators live in the platform, and seed_from_l1.py is a one-shot seeder): a folio-assistant-core gate that fails when a prose block repeats a table block of its section (markers "INPUTS STEPS RESOURCES" / "POTENTIAL RISKS MITIGATION"). Old idea: seed_from_l1.py should not emit table text into prose when a table block covers it (gate idea: check for "INPUTS STEPS RESOURCES" / "POTENTIAL RISKS MITIGATION" in prose).
5. [x] Padding / right grill: already done by smart-ra panel thread in cat-harness#994 (merged 19:18Z) + #981. dth-pc needs a cat-harness re-pin to show it; asked that thread who re-pins.

Thread: https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G94BkArgbUhEUSTweR879Ve4

## Log

_2026-11-02T19:30Z_ — Step 1 pushed (dth-pc 7-line diff per page), PR #16 draft, issue #15. Staging site litlfred.github.io is blocked from the sandbox, so before/after is rendered locally.

_2026-11-02T19:35Z_ — Before/after PNGs in /mnt/project-files/dth-pc-flattened-tables-2026-11-02/. Card Q-FT-1 posted (A: OK + clean other 12 pages + seeder fix; B: these 4 only; C: hold).

_2026-11-02T20:05Z_ — #16 merged a3330c9 (owner A). 12 pages: draft dth-pc#17 (3e97f27), fragment check script in scratch (every removed run found in the section's table blocks). Re-pin cat-harness 356ca7a + core 3c13890: dth-pc#18 (mechanical, merge on green), stage-local of that branch running. Empty pages 022/027/032/036 keep their blocks (tags, BPMN uses).

_2026-11-06T08:35:45Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: no other agent's commit in the window, no open PR naming it.

_2026-11-07T16:20Z_ — Thread paused 11-02 19:34Z (usage limit). #18 merged 11-05 by the owner. Padding: #994's rule did not take effect on the #18 preview; cat-harness has since moved block icons to the right gutter with 1rem panel padding (fe6c98f, 11-06), so the ask now rides the next re-pin. #17 rebased to 69b0a5e and marked ready by the owner 11-06; CI red only on check:corpus-gate (platform crash: 2 mounts have id beans, dpi-h-ra.beans + dth-sc.beans, cat-harness-tools resolveBeanGraphNode) and check:bean-one-home (live stores; passes now). Commented on #17. Cards Q-FT-2, Q-FT-3 still open.

_2026-11-08T07:00Z_ — Owner: Q-FT-2 B, Q-FT-3 A. #17 a050ec3 removes the 4 emptied blocks, tags merged into step tables (only t-ch03-step-2 gained tags). Card Q-FT-4 (merge #17) open. Q-FT-3: the check already exists, core 2ecd260 (dth-block-check prose rule, merged 11-06 by another session). Verified with core main's script: scaffold base flags all 12 pages, #17 head flags none. dth-pc's pinned core predates it and dth-pc does not run dth-block-check (24 other problems: missing DMN/BPMN companions etc.).
