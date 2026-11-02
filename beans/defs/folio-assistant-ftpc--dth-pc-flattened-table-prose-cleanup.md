---
# folio-assistant-ftpc
$schema: bean/1.0.0
title: 'dth-pc: drop flattened step/risks table text from prose pages'
status: in-progress
type: task
priority: normal
created_at: 2026-11-02T19:30:00Z
updated_at: 2026-11-02T19:30:00Z
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
2. [ ] Before/after images, card to owner (content change: never merge without OK; editing gate may need editor sign-off).
3. [ ] If owner says so: same cleanup on 12 more pages (ch01 021/022/023, ch02 025/027/031/032, ch03 035/036, ch04 039/040, ch05 043). These mix real prose with table text, so cut per page against the table blocks.
4. [ ] Process fix: seed_from_l1.py should not emit table text into prose when a table block covers it (gate idea: check for "INPUTS STEPS RESOURCES" / "POTENTIAL RISKS MITIGATION" in prose).
5. [ ] Padding / right grill in cat-harness site chrome.

Thread: https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G94BkArgbUhEUSTweR879Ve4

## Log

_2026-11-02T19:30Z_ — Step 1 pushed (dth-pc 7-line diff per page), PR #16 draft, issue #15. Staging site litlfred.github.io is blocked from the sandbox, so before/after is rendered locally.
