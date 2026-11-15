---
# folio-assistant-pb15
$schema: bean/1.0.0
title: 'Harness PR backlog plan 2026-11-15'
status: in-progress
type: task
priority: high
created_at: 2026-11-15T07:15:00Z
updated_at: 2026-11-15T07:10:00Z
tags:
    - handover
    - pr-backlog
    - handover-2026-11-15
---

Plan to clear the open-PR backlog in the harness repos (all litlfred repos except qou, sgex, pqtorus, folio-test, fmlrunner). Owner ask 07:00Z "for harness repos: make a plan to resolve", then 07:01Z "coordinate w/ merge manager. stack merges and fix issues afterwards, send agents to complete work on stalled PRs" and 07:03Z "dispatch siblings fix existing reds". The merge manager (thread cmsg_017WNUkNK8kdDziPK58Pv6G9HtujCofFVVPVPppfDRTSNR, handover bean folio-assistant-mm15) does every merge. Re-check each PR live before acting.

## Snapshot 07:05Z

125 open PRs across 32 repos read (the merge manager counted 132; the other 7 are in repos not read here). 35 have a check that truly failed. Most other "red" PRs only have runs that concurrency cancelled. 22 are drafts.

## Groups and actions

**Merge now (green, non-content).** tools#2182, tools#2130, fa#3123, smart-hiv#28, smart-ips-pilgrimage#112. Hand them to the merge manager.

**Bean-note flood (noise).** About 33 cat-harness-tools PRs titled `beans:note(cat-tools-pfng): claim|done <repo>` (#2228, #2230 to #2267). Each holds one note and cancels the others' CI. Fold all the notes into one PR and close the rest. Asked the merge manager at 07:08Z.

**G1 Opt-in collab groups family** (session_01EucfRmKpseotmkuL7U14cV, idle since 11-13/14). dth-hrh#126, dth-phc#44, dth-sc#32, smart-immunizations#139, smart-trust#212, smart-trust-phw#62, smart-ra#249, smart-ips-pilgrimage#81, and the drafts aai#64, smart-anc#8, smart-fp#13, smart-trust-tools#65. Root: the gate tools#1980 (check:optin-refs) and cat-harness#1288 (opt-in refs, a dirty draft) are not on main, so declaration-resolution, optin-links, nav-names and ns:check report new failures. Fix: land tools#1980 and cat-harness#1288, then rebase the family.

**G2 Re-pins superseded by fa#3124.** smart-immunizations#145, smart-immunizations-uganda#39, smart-ips-pilgrimage#109, smart-trust#236, smart-trust-phw#78, smart-pcmt#6, folio-assistant-core#799, smart-hiv#29. Root: pins are behind main (lock-consistency, bun-pin, corpus-gate). Fix: close them and do one batched re-pin per layer after #3124. The bot standing repins smart-immunizations#149 and smart-trust#241 already exist. Needs owner card Q-PB-1.

**G3 smart-ra CS-* change sets** (session 0196zyp…, looks gone). #151, #152, #156, #158, #189, #193, #194, #196, #197, #199, #203, #218, #221; 8 of them are conflicted. Root: corpus-gate and upstream-pins judged against a main from 11-11. #221 also crashes out of memory in site:archimate. Fix: rebase onto main and re-run. They are content, so each needs an owner tap before merge.

**G4 Single code reds.** tools#2229 (1 new test failure), smart-base#405 (1 new test failure), cat-harness#1329 (graph:check-tools), fhir-harness#426 (declaration-resolution and kind-validators; probably needs a paired tools change), smart-base#259 (bean-bodies, optin-refs), smart-pcmt#5 (lock:coherence).

**Conflicts.** imm#145 and smart-trust#236 are in G2, so close them. imm#139 and smart-trust#212 are in G1, so rebase them. smart-ra#236 (review-log archive, session 01Qmmkt7j5DJ…) needs a rebase. dth-hrh#96, dth-pc#10, dth-phc#4 and smart-ra#156, #172, #189, #193, #197, #199 and #215 are also conflicted.

**Drafts parked (leave them).** dth-sfp#3 to #8 (stale since 11-01, content), dth-hrh#75 and #94, dth-sc#7, dth-pc#7, smart-ra#172, #215 and #224 (HOLD for committee), fa#3126, #3129, #3130 and #3132, core#808, who-iris#282 and #290, phw#82, tools#2243.

**Content awaiting owner or committee.** dth-hrh#81, #82 and #83, dth-phc#47 and who-iris#288 are already tapped; the merge manager merges them on full green. Also smart-ra G3, smart-ra#185 and smart-ra#236, and who-iris#279.

## Order against fa#3124

1. Merge the green non-content PRs and fold the bean-note flood now.
2. G4 fixes and tools#1980 / cat-harness#1288 land in tools and cat-harness, stacked.
3. fa#3124 re-pin train lands.
4. Batched re-pin sweep, which replaces G2.
5. Rebase G1 and G3 on the new mains, then merge them; G3 waits for owner taps.

## Owner decisions

Q-PB-1: close the 8 G2 re-pin PRs in favour of one batched re-pin after fa#3124 (recommended A).

_2026-11-15T07:15:00Z_ — Filed by thread "Plan to clear harness repo PR backlog" (https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9Pzsco5hgSQWpJp8bXkgHgM), session https://claude.ai/code/session_01Qmmkt6wr9MYahGh9dkaS15. Red groups G1 to G4 sent to the coordinator at 07:08Z for fix threads.

_2026-11-15T07:10:00Z_ — Q-PB-1 = A (owner tap 07:07Z). Closed the 8 G2 re-pins (imm#145, uganda#39, pilgrimage#109, smart-trust#236, phw#78, smart-pcmt#6, core#799, smart-hiv#29). The merge manager re-pins each layer after fa#3124.
