---
# folio-assistant-e0i4
$schema: bean/1.0.0
title: 'Memory: 11-10 Actions run-time/init analysis (Docker image question): numbers, card Q-ACT-1, data path'
status: completed
type: task
priority: low
created_at: 2026-11-10T20:38:04Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `actions-runtime-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: 11-10 Actions run-time/init analysis (Docker image question): numbers, card Q-ACT-1, data path


Thread "Speed up Actions start times" cmsg_017WNUkNK8kdDziPK58Pv6G9QGpcoGu6tbBreoK3fpomEb (user asked in smart-fp thread 20:33Z 11-10: docker image for AST refresh / gh-pages publish init? can things be parallelised?).
Data + findings: /mnt/project-files/ci-speed/actions-init-2026-11-10/findings.md (runs.json, jobs.json, collect.py).
Key facts: init = 14% of job time; IG Publisher itself 1.5 min (smart-fp) to 10-11 min (immunizations, smart-base); fhir-ig-tooling cache key per-IG + saved on default branch only -> forks cold (publisher clone+mvn 41 s cold vs 10 s warm, gem jekyll 21 s). Main push shards 15-18 min because GATE_CONE=record traces gates serially under strace despite GATE_JOBS=4 (run-gates.py). Prepare-main derive:publish 501 s blocks shards.
Card Q-ACT-1 posted 20:5xZ: A caching+parallel (rec), B A+GHCR image, C none. No workflow changes until picked; coordinate PRs with merge manager + CI thread. Related: folio-assistant-uxx6.
Picks: Q-ACT-1 = A, Q-ACT-2 = A+ (shared prebuilt publisher), Q-ACT-3 = A (fhir-harness release asset, not GHCR). Issue fhir-harness#349, draft PR #352 (branch claude/ig-toolchain-cache): ast-export-bundle.yml publishes release ast-export-<commit> (227 MB tgz, classes+lib, 180 jars), ig-ast-refresh uses it only if sha256 matches scripts/ast-export-bundles.tsv (empty until pinned after first publish), Jekyll pinned 4.4.1 + cached in ~/.ig-toolchain, cache key v3. Site publish template rollout handed to WHO-forks thread. Parallel traced gates: design (write-set guard) sent to CI thread …S6hQK9aQqtGErPT2gmEEUW 20:45Z; check-in 21:16Z.
21:05Z: CI thread OK'd design (4 points). cat-harness-tools issue #1798, draft PR #1801 (branch claude/parallel-traced-gates): ci-cone.ts CI_CONE_TOUCHED_OUT / CI_CONE_RECORD_OUT + `keep` subcommand; run-gates.py run_traced/cone_clashes, feature-detected on mounted ci-cone, GATE_CONE_PARALLEL=0 off. Takes effect after each layer's tools re-pin. #352 green; mark-ready refused by classifier -> merge manager readies. Local test setup: sibling clones + ln -s cat-harness-tools/node_modules /home/user/node_modules. Remaining: shards-start-early (needs layer-pr-checks.yml split; not started), bundle sha pin after #352 merges.
22:45Z: #352 and tools#1801 MERGED; bundle release ast-export-b1f85fa… sha256 78576b2e… (verified); pin PR fhir-harness#356 green+ready. Re-measure check scheduled ~06:45Z 11-11 (after re-pins). Shards-start-early not started.
06:5xZ 11-11 re-measure: who-iris Gates step SLOWER after #1801 (700-950 s -> 1000-1300 s): 5-18 of ~27 pooled gates re-ran alone (failed traced runs re-run untraced in place; git --git-dir qa-store made touched undetermined). Fix: tools issue #1859, PR #1860 MERGED 07:23Z (branch claude/cone-parallel-fewer-reruns). IG AST refresh: no real rebuild since pins (smart-fp cache hits only; smart-immunizations still pinned before #356). Data: /mnt/project-files/ci-speed/actions-init-2026-11-11/. Next check 12:54Z.
12:55Z 11-11: who-iris re-pinned tools past #1860 (09:38Z) but no full main traced run since (09:48 push skipped shards; only PR runs). No IG cold rebuild yet; smart-base/smart-immunizations still pinned before #356/#1860. Stopped scheduled checks; re-measure when user asks or next thread touches this. Data: ci-speed/actions-init-2026-11-11b/.
