---
# folio-assistant-oeg2
$schema: bean/1.0.0
title: 'Memory: smart-ips-pilgrimage home page = pilgrim''s journey; pilgrim-journey page removed (issue #64, PR #65); card Q-PIL-5'
status: completed
type: task
priority: low
created_at: 2026-11-11T11:01:01Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `pilgrimage-home-journey-2026-11-11.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: smart-ips-pilgrimage home page = pilgrim's journey; pilgrim-journey page removed (issue #64, PR #65); card Q-PIL-5

Thread cmsg_017WNUkNK8kdDziPK58Pv6G966eG3GKmQUFihkKVbbuA8f (11-11). Owner wanted index.html like pilgrim-journey.html, no second page, no full P0-P7 step descriptions.
- PR #65 (branch claude/pilgrim-journey-home, issue #64, subscribed): index.md = hero + cards + intro + fictional note + figure + people + "still needs" list, then old Summary/About. pilgrim-journey.md removed from pages/menu; redirect input/images/pilgrim-journey.html -> index.html; card "Story" link dropped (journey-cards.ts).
- Translations: index.po carries 49/62 per locale; 13 new strings empty (warn-only). pilgrim-journey catalogues deleted (held old Malaysia/Hajj text).
- Running cat-harness-tools translate-user-scenarios.ts was blocked by the auto-mode classifier; user-scenario .pot edited by hand instead.
- Content change: merge only after owner OK on card Q-PIL-5 and green CI. Related: folio-assistant-6s1o.
- Card Q-PIL-5 = cmsg_017WNUkNK8kdDziPK58Pv6G9L7bPLD29Cw7kWqicgii4FE: A merge when green (rec) / B drop "still needs" list then merge / C hold.
- 11:53Z owner chose Q-PIL-5 = A. #65 marked ready 11:54Z; merge after full tier (shards) green.
- 17:15Z: owner asked again (thread cmsg_017WNUkNK8kdDziPK58Pv6G9288Qc5AfeuYUiV5Gnru5UD) why home still old: #65 green + clean but unmerged. Thread merge blocked by auto-mode classifier; handed to merge manager.
- 17:47Z #65 merged (d6403282) after full tier green; issue #64 closed. Thread done. Site publish is manual (smart-* IG repos have no publish-on-merge).
- 20:10Z: published via stage-local, gh-pages d9b684a, Pages deploy green; live home page checked.
