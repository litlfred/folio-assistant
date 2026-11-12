---
# folio-assistant-7exb
$schema: bean/1.0.0
title: 'Memory: Deep review of CI/render/merge speed (2026-11-01 11:15Z): measured bottlenecks B1-B8, doc link, cards Q-SPD-1..7'
status: completed
type: task
priority: low
created_at: 2026-11-01T11:08:45Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `speed-deep-review-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Deep review of CI/render/merge speed (2026-11-01 11:15Z): measured bottlenecks B1-B8, doc link, cards Q-SPD-1..7


Thread "Speed up CI, render and merge" (cmsg_017WNUkNK8kdDziPK58Pv6G9LZubkHzAS3oJzST6zV8aZE). Doc: https://claude.ai/artifact/9xSv1oadhhMgxT898udL2i
Measured 07:30-11:05Z over 10 repos (1,764 jobs, 9,676 runner-min, avg 45 busy, 34-76 always queued):
- B1 pool full; core full PR run 62 min = ~23 work + ~43 waiting.
- B2 main side rebuilt each PR: base cache key = exact main sha + mains + index; tools main moved 72x in 3.5h; PR-scoped caches; tools pr-tests.yml has no push:main. ~19% of pool.
- B3 18% runner time in later-cancelled runs; 95/429 PR runs repeat a sha.
- B4 fa#2864 re-pin 10 pushes, 0 green since 07:35Z; fa main 2 commits all morning, so merged tools speed fixes not live in fa.
- B5 preview derive 825 s (tools re-pin invalidates writer fingerprints); B6 main deploy QA working copy 488 s in series; B7 Pages deploys collide ("in progress deployment"), 7/12 cancelled/failed since 09:00Z; B8 tools bun test 20 min unsharded, tools#1233 open.
Cards Q-SPD-1..7 posted ~11:20Z, recommendations: 1A main-side records per main commit, 2A cut demand first, 3B re-pin train + merge on no-new-failures, 4B per-writer import fingerprints, 5A one gh-pages publisher, 6A tools#1233 + shard bun test, 7A QA copy in parallel job. Analysis only: PRs only after picks.
Measure scripts were in /home/claude/spd (runs.py, jobs.py, conc.py; gh api works after add_repo access push). Related: folio-assistant-vosx, folio-assistant-7w1o, folio-assistant-xq9j.
Picks 11:09-11:11Z (card taps): 1A, 2A, 3B, 4B, 5B, 6A, 7A. User 11:12Z "no i dont want preview repos": 5B withdrawn, never propose preview repos; coordinator asks about 5A. This thread builds 1A + 6A (tools pr-tests.yml), 7A (fa docs-site QA copy parallel job), merges tools#1233 (card 6A is the OK); siblings asked for 3B, 4B.
Finding: core push (main record) runs: 0 success of 36 since 10-31 (21 failure from main-qa red, 15 cancelled as superseded), ~100 min each (45 min queue, record job 51 min under strace), so PRs never find an answer for their own base.
15:39Z: tools#1266 merged (80dab2a) under user window 15:23Z "+3 hrs functional merges" (cmsg_017WNUkNK8kdDziPK58Pv6G92nTpZHyM4RZ6LQNsxyLjqt, to 18:23Z); fa#2867 marked ready; tools#1233 merged 11:38Z; train fa#2874 merged 15:24Z. Gotcha: on pull_request `closed`, github.ref = base branch, so a closing run shared main's concurrency group and cancelled main's record push run; fix tools#1277 (group by PR number). Q-SPD-7 premise wrong (QA copy feeds security gate + derive), re-asked as Q-SPD-7b. Open cards 15:40Z: Q-SPD-7b, Q-CONE-3, Q-TRAIN-3 (I recommended B token secret: GITHUB_TOKEN-opened PRs run no checks). Classifier refuses merges/ready without the user's own window message.
16:02Z tools#1277 merged (088d84c); first record push run 41324229967. Push runs at 15:56/16:00 were cancelled by other PRs' closing runs (old group); fixed from now on.
16:17Z owner taps: Q-SPD-7b A -> fa#2879 (issue #2878, branch claude/main-deploy-reuse-qa-copy, .github/scripts/qa-copy-reuse.sh, matches tested-tree-<tree> of merged PR's cqg run); Q-CONE-4 A -> cat-harness#919 marked ready 16:18Z, I merge on green. Preview timing 16:20Z: 25 min quiet to ~50 min busy; gh-pages push gate (5 min per push, 10 after main) waits 0-21 min = biggest lever, needs Q-SPD-5 A.
16:24Z owner tapped Q-SPD-5c A: build one batched gh-pages publisher for previews (previews upload artifact + exit; one publisher pushes all waiting per window). Show measured gain before merge.
16:26Z Q-SPD-8 D (A double previews DROPPED: push run self-stops ~1 min when PR exists; B main reuses cqg publish-pages artifact; C core record runs) -> asked coordinator for sibling threads B, C. Q-SPD-9 card (agent pre-built outputs spot-checked by CI; B previews only recommended) open. Q-SPD-5c publisher being built here: previews upload staging-site-<slug> artifact + dispatch staging-publish.yml; fallback to in-job deploy if hand-off fails.
16:28Z Q-SPD-9 B (previews only), then owner asked why random sample; derive breakdown (fa#2867 preview job 124895041599, 479 s): QA copy inside uml:overview 222 s, 20 built-at-publish pages 124 s, 42 writers 137 s; writer skip ON but 2/43 skipped because hub inputs (.git/branch-mounts/beans.json, cat-harness/docs/todos.json, build/qa-refresh.json, code-quality-gates.yml) change. Card Q-SPD-9b: A narrow hubs + full background recheck (rec) / B random sample / C narrow only.
16:32Z correction: Q-SPD-8 C saves nothing; core PRs already reuse main's answer (run 41324848533 exact hit); core#432 only clears false red (#287). Edited my estimate message.
16:36Z fa#2884 (issue #2883, branch claude/staging-batched-publisher): staging-publish.yml + .github/scripts/staging-publish.sh; feature-staging hands off (artifact staging-site-<slug>, dispatch), falls back in-job. Replay sim (/home/claude/spd/sim.py): worst wait 20.3->8.2 min, mean 4.1->3.3. Card Q-SPD-5d (merge on green?) open. 9b A: hub narrowing sent to writer-cone thread; agent-built previews sibling asked of coordinator.
16:40Z: tools main record run 41324229967 SUCCESS (record job saved). PR run 41325729150 restored it (base side skipped). #1287 missed by design (changes check-standalone.ts = judge).
16:56Z fa#2879 red on 'never run elsewhere' (check:declaration-claims, ihris ingest-use-case-model.md) = main's red too; fix in fa#2864 re-pin; commented. Writer-cone thread: tools#1292 (issue #1291) projected reads for 3 hubs (beans mount marker, todos.json, qa-refresh.json), covers 15/41 reruns; arrives via re-pin train.
17:04Z fa#2884's own preview: hand-off packed+uploaded (6 s), dispatch failed (publisher not on main) -> fallback in-job deploy pushed, artifact deleted. Fallback verified.
17:33Z owner card (labelled Q-SPD-RED, first posted as Q-RED-1 by mistake) A: MERGED fa#2879 (df1156c) and fa#2884 (c523aef) on no-new-failures vs main. Next: watch the first docs-site run for qa-reuse, and the first preview hand-off plus staging-publish run.
18:08Z first runs: docs-site df1156c qa-reuse fell back (tree moved); main deploy REFUSED since 17:25Z by check:lockfile-pinning (repin-train.yml plain bun install from fa#2877; baseline in tools lockfile-pinning-baseline.json) -> asked train thread to fix. staging-publish 17:50Z schedule: empty queue. No preview handed off yet.
18:09Z train thread: fix tools#1310 (baseline adds repin-train.yml: bun install); reaches fa via next tools re-pin (fa#2864 or train #2876).
18:36Z cat-harness#919 MERGED (514f4b4) green after re-run.
18:47Z tools#1310 merged 95e275c; fa main deploy passes after a tools re-pin >= 95e275c (train fa#2890 replaces #2876).

19:55Z: fa#2892 (fast path: the preview job pushes itself when the gate is open and nothing is queued; issue #2891) merged 0ed9b2b on owner card Q-SPD-FP B (no new failures). Earlier, fa#2884 (batched publisher) merged 17:32Z. First batch: 8 of about 10 min was runner wait.
