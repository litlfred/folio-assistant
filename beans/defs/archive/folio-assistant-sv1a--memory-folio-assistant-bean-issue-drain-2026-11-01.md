---
# folio-assistant-sv1a
$schema: bean/1.0.0
title: 'Memory: folio-assistant bean/issue drain 2026-11-01 09:50Z: who owns which item, siblings asked for, rule "only litlfred''s issues"'
status: completed
type: task
priority: low
created_at: 2026-11-01T09:50:29Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `fa-drain-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: folio-assistant bean/issue drain 2026-11-01 09:50Z: who owns which item, siblings asked for, rule "only litlfred's issues"


Thread "Drain folio-assistant beans and issues" (cmsg_017WNUkNK8kdDziPK58Pv6G9YMhdVdN9QwFpcLCWy242QS), 2026-11-01.
User rule 09:48Z: drain only issues opened by litlfred (not Jose/costateixeira, Ritika/ritikarawlani, or others).
Closed fa#2527 (locale moves done). Siblings requested: dead links fa#2741 (Q-FAD-1 smart-base#260), close finished epics yj32/vke6/iirv + fa#937 + fa#2702 (Q-FAD-2), repo health fa#860 (Q-FAD-3+).
Owned elsewhere: fa#2781 "Fix red checks"; #2864/#2869 "Drain fa issues and P1 bugs"; #2865/#2867/#2870/#2871 CI speed siblings; agy: ksek (#2857), security sb31/aso6/vbhb/wox6 (#2829), 75c5, max2; llxa blocked on max2; paused: r29x, 17iw, 9hxd, fvec, nvhg, amom, oz9e. #2605 needs Chine-E.
See folio-assistant-82df, folio-assistant-8jbp, folio-assistant-wmmg.
Epic tidy-up (thread "Close finished folio-assistant epics and issues", 09:58Z): vke6 closed (split done; paused r29x moved under yj32). yj32 stays open (no BPMN; docs not on theme ground; owner's "where does the background live?" open). iirv waits on 6fez only. fa#937 open (itka fixed via #941/#953/#1136; p7mb + 2 done-when boxes left). fa#2702 CLOSED (owner chose Option D 2026-10-30 13:58Z; negd done), so Q-FAD-2 was not needed.
fa#2741 dead links (thread "Fix the last dead links on the docs site", cmsg_017WNUkNK8kdDziPK58Pv6G9By6erVSpSCw7rRavjnsj8s): all 4 fixes merged 2026-11-01: tools#1165 7902a8b, fhir-harness#251 da547ab, cat-harness#866 32fcb41, smart-base#260 95eb96a. Re-pin rides fa#2864 (S1 thread) + fa#2869 (fhir-harness; owner unknown). Then re-run site:dead-links on the published tree and close fa#2741 if zero.
