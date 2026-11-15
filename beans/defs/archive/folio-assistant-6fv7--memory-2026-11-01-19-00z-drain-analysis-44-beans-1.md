---
# folio-assistant-6fv7
$schema: bean/1.0.0
title: 'Memory: 2026-11-01 19:00Z drain analysis (44 beans, 147 issues, 154 PRs), Claude Doc link, blockers, card Q-DRAIN-19'
status: completed
type: task
priority: low
created_at: 2026-11-01T18:50:51Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `drain-status-2026-11-01-1900Z.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: 2026-11-01 19:00Z drain analysis (44 beans, 147 issues, 154 PRs), Claude Doc link, blockers, card Q-DRAIN-19


Thread "Analyse bean and issue drain" (cmsg_017WNUkNK8kdDziPK58Pv6G9Hg9BR969ujM2YAX9DPArcj). Doc: https://claude.ai/artifact/Q7Us3d1gjoanbeddGmqstH
Counts 18:55Z: 44 open beans (17 epics, 27 work; pga6 new), 147 issues (130 litlfred), 154 PRs (48 ready) in 26 harness repos. Last day: 173 issues opened/113 closed, 291 PRs opened/252 merged.
Main blocker: fa#2864 open since 07:35Z; train fa#2876 closed UNMERGED 18:25Z, replaced by fa#2890. New fa#2888 "Publishing failed after the publish button". core#287 has 42 red gates.
Unanswered cards seen: Q-DTH1-7 (core#506), core#489 merge, Q-PHC17/18, Q-RAD-1/2, Q-EPIC-1..5, Q-IRIS1, Q-MS1, Q-STALL1/2, 6fez groups, Q-FIG11, Q-ITO1, Q-DTH1-2/3/5, Q-DTH2-1..3, Q-DTH4-1, lo3p/6chd (S5).
Method: same as folio-assistant-82df (search API + clone bean stores). Card Q-DRAIN-19 (A fa re-pin first, B card sweep, C red-main thread, D=A+B recommended).
Merge sweep (user 19:31Z "merge what green and ready (not committee content)", window +6h to 2026-11-02 01:36Z): merged core#331, #464, #489, smart-ra#181; beans x09n, ylu8 closed (fa beans c4917b7). who-iris#154: main merged in (fc9c8a92, keywords.json taken from main), awaiting CI. core#469 NOT merged: its fix is superseded by core#472 on main and it carries unmerged colour-key work (core#513). core#474 and cat-harness#883 were routed to their own threads. Recheck scheduled for 20:05Z.
20:10Z: also merged cat-harness#927, smart-trust#122. Standing rule (user 20:07Z): merge every non-content PR once green; for green content, ask in project chat (one lettered card per batch via coordinator). Sweeps every 30 min to 01:36Z. dth-hrh#53 and #47 are committee issues: keep OPEN (#61 is reverted in dth-hrh#74).
20:26Z rule (user): non-content PR may merge if green OR its only reds match main's reds. Sweep script: scratchpad sweep.sh (repos with a "No new failures" check judge it themselves; fa's main has no comparable runs, so fa re-pins stay with the train). Skip cat-harness#929, tools#1308, core#508: their thread waits for the user to see the preview first.
20:45Z: window to 2026-11-02 02:40Z. Rules added: split mixed content+functional branches and merge the functional part; ingestion/extraction fidelity fixes count as mergeable (no meaning change). Merged core#506. Non-content queue: /mnt/project-files/drain-queue-2026-11-01/queue.md (regenerate with scratchpad refresh.sh then queue.py). MVP owner thread cmsg_017WNUkNK8kdDziPK58Pv6G991qa3xg86ZCWdyH2spZ7FS.
Queue page: https://claude.ai/artifact/5meRC6rLUk692NrMp6UFDk (republish scratchpad drain-queue.html after refresh.sh). User 20:45Z: CS-xxx change-set items (e.g. dth-pc#6/#7 Rwanda FDA) are content, so leave them alone; queue.py excludes titles starting CS-. User wants cards in THIS thread for structured Q&A. Cards Q-DQ-1..6 posted 20:45Z (Q-DQ-6 A: S10 already closed smart-ips-pilgrimage#1).
Q-DQ-4 B (20:46Z): merge cat-harness#929, tools#1308, core#508 when green (the section-headings thread was told). Q-DQ-5 A: commented on who-iris#104.
Q-DQ-1 A: children moved (fa beans 2051edd); epic-close PRs tools#1330 and core#525 are ready, to merge on green. Q-DQ-2 A: lo3p and 6chd closed (fa beans 5b68a6f). Q-DQ-3 A: core#469 closed; issue core#468 is still open, for S7 to check against main. Card ids done.
22:35Z: user extended window +12h, now to 2026-11-02 14:40Z. Merged cat-harness#933, tools#1330. tools#1308 and core#508 already merged. Attached fhir-harness, smart-base, folio-assistant-sci, bootstrap-tools, bootstrap, dth-phc. smart-base#274 is a trial pin (held). Republish the queue WITH url (a plain publish made the stray copy HBCNfpqShQ2LepQfLnyJTF).
22:44Z: siblings S11 (harness, cmsg_017WNUkNK8kdDziPK58Pv6G9X8RGmVrycXjBnLD4yPpLkD), S12 (folio, …TMrQgmjQU7nCiNxeveE4fT), S13 (instances, …AENX5UzUawZxwfYJKhmQwa) work drafts/issues; briefs /mnt/project-files/drain-queue-2026-11-01/siblings-S11-S13.md. Their cards come to this thread.
22:46Z: BPMN helpers B1 (G-blocks, cmsg_017WNUkNK8kdDziPK58Pv6G9Cj6NCezeD1GFfVaBHe9cE8), B2 (store lanes/slugs, …AMyAnfp2aFf9Z9UMDNXjts), B3 (processes pages, …5Jg4iMbh6CkGMLXL4i2BZW) split S9 load; S9 does final merges.
23:02Z sweep: merged tools#1340/1345/1346, cat-harness#837/838/935/936/938/939, core#454/512/519/520/528/529, fa#2857. core#514/#517 conflict (S7). Q-S11-1 A, Q-S13-1 A, Q-B2-1 A answered. Next sweep trig_01NFeSBWzS2choW65A3Lk1pE 23:33Z.
2026-11-02 14:46Z: merge window closed; sweeps stopped. 421 done since 19:30Z, 119 open. Open: Q-B1-2 card here, fa re-pin train, cat-harness#945 (Q-FMR-9). Restart sweeps only if user extends the window.
14:47Z correction: window to 20:40Z (Q-MVP-6 A); code freeze on lower layers (only slash-IRI + re-pin cascade fixes). Sweeps resume, sites and fa only.
17:56Z: window +4h to 2026-11-03 00:40Z. Freeze lifted 17:54Z. Merged core#608, #612, smart-base#293.
