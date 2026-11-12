---
# folio-assistant-wc3m
$schema: bean/1.0.0
title: 'Memory: 25 dth-* content drafts brought up to date 11-11 for one-by-one owner cards (Q-WRAP-2 C); report path, flags, previews pending mirror'
status: completed
type: task
priority: low
created_at: 2026-11-11T16:55:47Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dth-content-drafts-review-2026-11-11.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: 25 dth-* content drafts brought up to date 11-11 for one-by-one owner cards (Q-WRAP-2 C); report path, flags, previews pending mirror

2026-11-11 16:40-17:10Z, thread "Prep DTH content drafts for review" (cmsg_017WNUkNK8kdDziPK58Pv6G9485GDkaugFAYVaNMpCMzaR). Main (or the PR's base) was merged into the dth-hrh/pc/sc/phc content drafts with no wording changes. Report: /mnt/project-files/merge-manager/content-review/dth-content-drafts-2026-11-11.md. Handed to the merge manager for card batches.
Flags: hrh#109 merged 11-12 06:08Z (Q-109-1). Origin of no-2015 rule: user Q-GLD-3 = C on 11-08 bulk review (reversing 11-02 ask to link MDS 2015 as related). hrh#85 MDS term + hrh#98 2015 bib node vs the 2015 MDS rule (decide #109 first); pc#10 conflicts with scaffold #1 on caption wording; sc#15 and phc#11 need a retarget to main (base PATCH refused by the auto-mode classifier); sc#12 superseded by main.
Previews: site-publish.yml workflow_dispatch per branch -> litlfred.github.io/<repo>/branches/<branch-dashed>/. Blocked at the apt step by the mirror outage (test run hrh 43061232504 failed).
See folio-assistant-8nm4, folio-assistant-yqdf.
21:50Z gate reds (Q-DTH-3 A merges): pushed sc#22 1a0e72c (anchors, references README, l1 quote for ICMRA URL line-break), phc#31 55075c9 (anchors, README), pc#14 38ca2f8 (main merged). Not mechanical: corpus-gate on References-block PRs needs owner record (card); subgraph-coverage serialisations undeclared platform-wide (layer red); sc#22 bibliography key clash because sc mounts dpi-h-ra references/ (options A drop mount / B rename keys / C checker). Platform mounts work here: `bash .claude/hooks/session-start.sh` (~30s).
11-12 09:10Z: hrh#118 (restore 2015 MDS cross-refs, reverts #109) MERGED. Red-fix pass: sc#15 fa19720 anchors; phc#31 ready (Q-DTH-COV A); corpus waivers needed sc#4, sc#15; layer reds: sc#24 foreign-paths (moved files, no re-key in check-foreign-paths), pc#14 business-processes kind has no @covers gate; hrh#69 waits on #119.
