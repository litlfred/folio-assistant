---
# folio-assistant-n4w8
$schema: bean/1.0.0
title: 'Memory: Thread "Green the smart-ra drafts" (…6fbDk8ZG5kaLTpD1m7m7RP) 11-12: 21 smart-ra PRs red; causes, conflicts (#195 card Q-RA-MRG-1, #199 resolved local...'
status: completed
type: task
priority: low
created_at: 2026-11-12T08:37:06Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `smart-ra-drafts-green-2026-11-12.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Thread "Green the smart-ra drafts" (…6fbDk8ZG5kaLTpD1m7m7RP) 11-12: 21 smart-ra PRs red; causes, conflicts (#195 card Q-RA-MRG-1, #199 resolved locally), waiting on smart-ra re-pin

Survey 2026-11-12 08:40Z (main 52320f05, 23 commits ahead of all drafts after #97/#183/#204 merged 11-12):
- Every PR fails only "No new failures": corpus-gate NEW (CS drafts), upstream-pins NEW (#154 #221), "two sides pinned to different commits" (#151 etc). #241 (old re-pin + publish-on-push) has 14 new gate failures; the cascade's pin-only smart-ra re-pin (Q-RA-PIN A) supersedes it.
- Merge main: all clean except #195 (p-1-1-4 "Others" audience item vs #97's merged version; card Q-RA-MRG-1) and #199 (glossary JSON; union of both sides, done locally as 6a194c49 in the sandbox only, not pushed).
- Waived corpus gate (Q-RA-VAL-2 A): #154 #185 #190 #191 #192 #195. Rest held for owner review: no pushes (each push = CI run + email).
- Merge manager asked to hold content pushes ~1h from 08:35Z so runners serve core#760/#761/tools#1941.
Plan: when the smart-ra re-pin merges, merge main into the 6 waived PRs one at a time, then hand each to the merge manager. See folio-assistant-m9ad, folio-assistant-h5ud.
