---
# folio-assistant-xowb
$schema: bean/1.0.0
title: 'Memory: Thread "Stabilise platform state and CI" (MVP Phase 2c): main green ledger script, who owns which main red, 7mwa test/results PRs'
status: completed
type: task
priority: low
created_at: 2026-11-01T21:05:03Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `platform-ci-stability-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Thread "Stabilise platform state and CI" (MVP Phase 2c): main green ledger script, who owns which main red, 7mwa test/results PRs


Thread cmsg_017WNUkNK8kdDziPK58Pv6G9MRZwakYehKJLvPdaJcTu2m, started 2026-11-01 20:52Z from Q-MVP-3 A. Owns beans fs43, 3fva, 7mwa, 1xhc, ksek, rwmf + fa#937 (all post-MVP in the queue except 7mwa). Bar: one green run on every main.
- Ledger: `python3 /mnt/project-files/platform-ci-2026-11-01/main-ledger.py` (13 cone repos; newest completed non-cancelled run per workflow on main). First run 21:01Z: red fa, cat-harness, core, smart-base, smart-trust-phw.
- Split agreed 20:55Z: fa main reds thread keeps fa, smart-base, phw (train fa#2893, fhir-harness#266, bootstrap-tools#66). This thread: cat-harness main, post-merge regen "unrepaired slice:sqlite / nav-names", cancelled mains (bootstrap, fhir-harness, sci re-run 21:00Z). Core main-qa = core record-runs thread.
- Finding: cat-harness main-qa graph:check-tools red = fa main pins tools 329f553, lacking `archimate:blocks` (tools#1268). Regen classification fix (p7mb, c26194f5) is also missing from 329f553. Train fa#2893 pins tools f92092e, which has both.
- Locally on train tree: slice:sqlite:check fails only because the published payload tree is absent (builtAtPublish); nav-names UNDETERMINED (harness.json absent). Dry-run regen on the train tree was run to confirm.
- 7mwa: draft PRs stop committing test/results (storage already declared): fhir-harness#267, folio-assistant-sci#166, smart-base#275. who-iris#162 CLOSED: its test/results holds only translation-roundtrip agent outputs that tests read (committed inputs, not QA working copy). tools still has 2 screenshots under test/results/5rmf (tfqf). fa .gitattributes test/results lines stay (owner 2026-10-23 ruling).
- cat-harness regen cannot open repair PRs: "Actions not permitted to create PRs" setting unticked in litlfred/cat-harness (user action).
- Sibling CI thread cmsg_017WNUkNK8kdDziPK58Pv6G9LpArXTbi8RCePgLUzgqwrT owns fa#2857, fs43, 3fva, 1xhc, ksek, rwmf, fa#937. This thread owns p7mb's close (needs train fa#2893 merged + 2 clean layer regen runs); tell the sibling when it closes.
- 21:55Z: full regen on train tree still unrepaired slice:sqlite + nav-names (they read derive:publish output; CQG judges them after B1 restore). Fix tools#1347 (JUDGED_AFTER_PUBLISH, falsified test). p7mb closes after #1347 merges + re-pin + 2 clean regens.
- 22:45Z merge-speed measure (since 10:00Z): fa CQG 10 main pushes, 0 green (5 cancelled by the next push: CQG cancel-in-progress on push, owner ruling 2026-10-07), runs 58-74 min. cat-harness 20 pushes, 2 green; core 22, 1 green. Layer runs are NOT cancelled by concurrency, but layer-main-qa.yml job concurrency (cancel-in-progress true) cancels the older run's report, so a run whose checks all passed ends "cancelled" (cat-harness 1b22283). Long poles: runner queue 15-20 min between stages; fwtz "Record main's page-build scripts" 85 min on cat-harness. Card Q-CIS-1 asked.
- 22:41Z Q-CIS-1 A tapped: fa#2895 (CQG push runs not cancelled) + tools#1350 (layer-main-qa per-sha, never cancel). Merge on green.
- 22:55Z queue dominates (since 12:00Z, summed job queue vs work): core 246 vs 75 min, fa 160 vs 85, cat-harness 106 vs 39, tools 92 vs 32. cat-harness shards 1.5 min work / 18 min wait; "No new failures" 0.1 min / 15-43 min wait. Card Q-CIS-2 (A: collapse tiny jobs in layer-pr-checks + reuse newest main answer + fwtz off main path; B jobs only; C A+runners; D measure).
- 23:00Z Q-CIS-3 A tapped (lazy base), but on checking smart-base#275 compare log: ~25 lower-layer gates (cat-harness-tools:check:*) are red on main in layer roots, so head is never clean; lazy base would save ~nothing and serialize. Re-asked as Q-CIS-3b (rec A: wait for green mains, then build; B: targeted base for head-failed gates only; C: drop). Artifact blob downloads are blocked by the proxy; read compare job logs instead.
