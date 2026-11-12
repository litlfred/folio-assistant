---
# folio-assistant-8sqp
$schema: bean/1.0.0
title: 'Memory: Cast names respelled per Thai feedback (Somsack->Somsak, Chanthasone->Chanthason): smart-trust-demo #115/#116, vaxlink#16, card Q-THN-1'
status: completed
type: task
priority: low
created_at: 2026-11-11T09:30:50Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `th-name-spelling.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Cast names respelled per Thai feedback (Somsack->Somsak, Chanthasone->Chanthason): smart-trust-demo #115/#116, vaxlink#16, card Q-THN-1

2026-11-11, thread cmsg_017WNUkNK8kdDziPK58Pv6G99DbGbnqoTqKDg2MquKYt6Q. User (TH feedback): baby is Somsak (not Somsack), nurse is Chanthason (not Chanthasone). Use these spellings in all new content.

- smart-trust-demo issue #115, draft PR #116 (branch claude/th-name-spelling, stacked on #114 -> #112). 191 files incl. all 5 locales (names stay Latin in .po), FHIR ids TrustDemoSomsak / TrustDemoTaifafekiSomsak / TrustDemoChanthason, actor files somsak-sengmany.json, chanthason.json. SUSHI clean (populate cache with `python3 -I tools/ig-gen/fhir_cache.py` first; packages.fhir.org is blocked).
- 09:46Z #116 MERGED (dc9089c). litlfred/vaxlink#16 draft (fork; issues off): deploy check needs re-sync; smart-trust-demo gh-pages last published 11-07, so waits for a publish (asked merge manager).
- No hits in smart-trust (all branches), smart-ips-pilgrimage, smart-trust-phw.
- Q-THN-1 = A (user 09:32Z): merge #116 once #112 and #114 merge and CI is green (retarget to main); merge vaxlink#16 after re-running `node scripts/sync-upstream.mjs` there once #116 is merged and gh-pages republished (deploy check needs the lock to match). Related: folio-assistant-3f7g.
- Q-THN-2 = C (user 10:34Z): user publishes smart-trust-demo gh-pages themselves (agent publish to gh-pages was blocked as a production deploy). After it lands: re-run vaxlink sync-upstream on claude/th-name-spelling, push, send vaxlink#16 to merge manager for a card.
- DONE 11-11 ~12:20Z: smart-trust-demo live (gh-pages 6611bfb, published by merge manager from fa6c6fe). vaxlink#16 re-synced (8dbea1e; sync-upstream now reads archimate/0.1.0/view/ singular; ConceptMap TrustDemoProductToOnesaEpi), merged (main 12c1b2d), deploy green. Open follow-up: vaxlink fork's own screens still say Lao/Thailand/Vientiane (not renamed to Onesa/Taifafeki).
- 12:3xZ owner 404 on smart-trust-demo/vaxlink/ (stale 11-07 copy). vaxlink#17 (claude/ig-link-ids) fixes 13 IG links (Lao->Onesa, Th->Taifafeki, Vientiane->Lomaru ids; vaxlink-examples.html gone -> artifacts.html); green; my merge blocked (Merge Without Review) -> handed to merge manager, plus refresh of gh-pages vaxlink/ from fork dist. /vaxlink/ removal undecided: don't delete.
