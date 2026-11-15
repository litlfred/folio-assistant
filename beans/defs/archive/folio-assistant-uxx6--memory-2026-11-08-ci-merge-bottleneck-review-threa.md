---
# folio-assistant-uxx6
$schema: bean/1.0.0
title: 'Memory: 2026-11-08 CI/merge bottleneck review (thread "Cut merge and CI bottlenecks"): numbers, report link, Q-CIB-1/2 picks, PRs tools#1677 #1681'
status: completed
type: task
priority: low
created_at: 2026-11-08T07:21:26Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `ci-bottlenecks-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: 2026-11-08 CI/merge bottleneck review (thread "Cut merge and CI bottlenecks"): numbers, report link, Q-CIB-1/2 picks, PRs tools#1677 #1681


Thread cmsg_017WNUkNK8kdDziPK58Pv6G9S6hQK9aQqtGErPT2gmEEUW. Report: https://claude.ai/artifact/8BEjUxjGTryGxMBg98Qa3m ; data+scripts /mnt/project-files/ci-speed/bottlenecks-2026-11-08/ (gh api needs add_repo push on each repo).
Q-CIB-1: NEVER change CodeQL schedule (user).
Related: folio-assistant-90xf, folio-assistant-7exb, folio-assistant-k8nn.
- fa#3035 (folds e2e-scope into verdict-reuse) MERGED 10:50Z (8b5f917) on Q-CIB-3 A. Lesson: moving a workflow step also needs the .feature @test tags updated (check:test-gherkin) and tools test dispatch-gates-can-pass reads the first 'git merge-base origin/main HEAD' in CQG.
- 13:00Z user: "not all CI needs to run unless doing a release build"; "CI not gate on non-release merge to main"; process re-engineering OK. Plan https://claude.ai/artifact/9whKmp78Xwaad1HVZFiSrT (data /mnt/project-files/ci-speed/release-gate-2026-11-08/): PR fast tier advisory, hourly main integration run, full tier gates releases (RC). Q-CIB-4 = A (user tap 13:23Z): full rollout in phases (1 skills/processes, 2 tools, 3 fa, 4 layers+train), re-measure each. Supersedes for NON-RELEASE merges: main-green-first, 10-23 green-index rule, 'merge non-content when green'. Content/committee rules, WHO repos, CodeQL unchanged. Fact: releases today run NO gates; every main push deploys the live site root.
- Phase 1 MERGED 13:46Z: issue cat-harness#1158; PRs cat-harness#1159 (DMN release input, skills) + tools#1721 (merge:guard check 5 advisory unless `release` label/--release). Merge manager told 13:30Z. Phase 2 draft tools#1722 (layer-pr-checks + pr-tests: non-release PR = fast tier; main full suite once/hour via cache stamp). `release` label CREATED in 18 litlfred repos 13:36Z (user "A" to Q-CIB-5). tools#1722 labelled release (full tier on its next push).
- Phase 3a MERGED 14:42Z fa#3047 (CQG: non-release PR + branch dispatch = fast tier). Phase 3b: card Q-CIB-7 (14:5xZ) recommends A = skip fa main batching (fa main runs ~56 min median and already thin to one queued run; only 7 of 17 starts <60 min apart; batched success would make fa main-qa report.py close main-red falsely) and skip preview label (~1% minutes); B adds docs-site /next/ root; C all of 3b.
- Phase 4 map: layer-pr-checks@main in cat-harness, bootstrap, bootstrap-tools, fhir-harness (get #1722 on merge). Pinned SHAs: who-iris c9ba58f, smart-base+core fa5fb43, sci f07c534, dth-hrh d2e4e7c, dth-sc/dth-phc/smart-ra 42cc850 -> bump after #1722. tools#1722 MERGED 15:12Z (961b4d9); re-pin train thread resolved; merge manager (…HtujCofFVVPVPppfDRTSNR) merges; I opened tools-only re-pin PRs 15:2xZ: who-iris#202 smart-base#332 core#688 sci#187 dth-hrh#107 dth-sc#27 dth-phc#35 smart-ra#238 (branch claude/repin-tools-961b4d9). 4 MERGED 15:27Z (who-iris, smart-base, core, sci). dth-hrh/sc/phc/smart-ra wait only on layers-ref gate: sandbox cannot push refs/cat/*; workaround: layers:publish --url <local bare>, push commit to claude/layers-tmp-<key7> branch, user runs fetch+push sha:refs/cat/layers/<key> (API create-ref also blocked). Q-CIB-7 = A (user 15:28Z: "need drafts before release" = keep sites publishing from main). Lesson: a hand re-pin must also update lock treeDigest/files/declaration sha256 (copy from a mount:remote --seed run with same overrides).
- 11-09 10:45Z: all 8 re-pins MERGED (site 4 without layers refs; tmp branches left in dth-sc, dth-phc). Re-measured per run: tools PR 38->1.2 min, fa CQG PR 79->5.3, core PR 4.6->1.5; layer main pushes now 149-208 min/run (watch). Data /mnt/project-files/ci-speed/release-gate-2026-11-08/remeasure-2026-11-09/.
