---
# folio-assistant-90xf
$schema: bean/1.0.0
title: 'Memory: Thread "Speed up merge and CI pipeline" (2026-11-01 23:00Z): queue reprioritisation, cancelled-run list, analysis doc path'
status: completed
type: task
priority: low
created_at: 2026-11-01T22:59:18Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `pipeline-queue-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Thread "Speed up merge and CI pipeline" (2026-11-01 23:00Z): queue reprioritisation, cancelled-run list, analysis doc path


Thread cmsg_017WNUkNK8kdDziPK58Pv6G9Du4UKr1fKNBQmCQ5adEH4s. User 22:55Z asked: analyse pipeline (why many runners, slow, need GH Actions?, defer after merge), put speed PRs first in queue (repeat), restart cancelled jobs. That message is explicit OK to cancel-and-restart queued runs.
Measured 22:57Z: 33 jobs running, all GitHub-hosted ubuntu-latest (no self-hosted); ~130 runs queued over 12 repos. Account concurrency cap is the ceiling.
22:58Z cancelled 72 queued not-started PR runs; list /mnt/project-files/ci-speed/queue-2026-11-01/cancelled-2300Z.tsv. Must rerun them after speed PRs get runners. Do NOT restart 0-job superseded main push runs (intended, per CI thread).
Speed PRs kept first (owned by CI thread …MRZwakYehKJLvPdaJcTu2m, it merges its own): tools#1351/#1350/#1347, fa#2895, fhir-harness#267 (merged), sci#166, cat-harness#940, bootstrap-tools#68 (gate-shards 1), smart-base#276 (merged); train fa#2896. Next priority, never cancel: core#517, core#565 (review-sheet fixes), tools#1247 (S7 last PR, run 41348909395), core#550 (menu thread), bootstrap-tools#72, core#581 (fa reference-direction red), core#582 (fa shard 1 timeout), S9 G-series cat-harness#896 #899 #901 #905 + core#481 #485 (rerun 00:24Z; NEVER cancel), S9B fhir-harness#259 #263, smart-base#265, sci#161 #162 (rerun 00:36Z; NEVER cancel; drop-task-name branches are S9B's), tools#1358 (first; fixes 1-shard flat artifact), cat-harness main push run 41360027924 (saves new cone record; then rerun cat-harness PRs incl #942 that failed on "derived" key). 00:55Z cancelled 10 more (cancelled-0055Z.tsv). 00:13Z cancelled 28 more low-priority queued runs for tools#1358 (cancelled-0013Z.tsv, rerun after #1358 merges). 00:00Z reruns done: 24 rerun, 28 superseded by newer pushes, 18 already running/had runs; log ci-speed/queue-2026-11-01/rerun-log-0000Z.txt.
Analysis report target: /mnt/project-files/ci-speed/pipeline-analysis-2026-11-01.md. Related: folio-assistant-vosx, folio-assistant-7exb, folio-assistant-eahf.
Q-PIPE-1 A picked 23:27Z (card): issue fa#2899. Fix1 regen hourly tick (schedule -> dispatch if main moved): fa#2901 (+ jsonld-gen-check push main-only), cat-harness#942. Fix3: fa previews/e2e already path-scoped; only jsonld branch-push dup remained. Fix2 (fa CQG judge vs main reds) waiting on fa-reds thread …BbaFk6c5F5NCsTkzWpJ1eZ answer. CI thread wants a note when a regen finishes on fa main (bean p7mb).
Fix2 = fa#2902 (branch claude/cqg-no-new-failures; worktree /home/claude/fa-cqg): per-job CQG-REPORT-V1 line in job log; PR passes if failures ⊆ newest main push record; main stays red. Cannot be green pre-merge (no main record). Card Q-PIPE-2 posted 23:5xZ (rec A: merge over red if only main's reds).
00:35Z fa#2902 fixed: GitHub rejects step-level `shell:` with ${{ }} (only defaults.run.shell may) -> whole file invalid, a "push" run named by file path with 0 jobs. Now relative path; merged main (fa#2895). Probe branch claude/cqg-size-probe could not be deleted (proxy 403) -> user to-do. Never cancel fa main CQG runs (CI thread).
00:56Z STOPPED cancelling (coordinator: card Q-MVP-3 unanswered; other threads hurt). All my cancels re-run or superseded. Don't cancel others' runs again without Q-MVP-3 answer.
01:12Z protect tools main push run 41367094710; after it finishes, CI thread will/may rerun tools#1347 #1349 #1344 (stale record a8f46f0).
01:31Z fa#2901 checks done, only inherited reds; merge DENIED by auto-mode classifier (needs user's own OK) -> card Q-PIPE-3 cmsg_017WNUkNK8kdDziPK58Pv6G9X9UMFoXyKbirCGGUdk1Zx3. Q-PIPE-2 card still open. Merges over red need explicit user tap.
02:35Z fa#2902 judge bug fixed (0527d82): gh refuses job logs with ANSI codes unless --allow-escape-sequences; judge retries with flag. New run follows. Next check 03:04Z.
03:36Z fa#2902 run 41378219551: judge reads main logs OK; unrun job red only for main's reds (translate-kg-viewer, libraries stale nodes, bpmn checklists stale — last two masked on main). Comment posted. Remaining jobs still running; check 6 at 04:21Z.
03:45Z e2e shard1 on fa#2902: hidden main failures (shard1 never reaches playwright on main due render:bpmn:check); comment posted.
03:50Z fa#2902 pushed 1f3990c: CQG_UNJUDGED env replaces step-level shell (gate-shell-workflow.test.ts needs absolute shells). ts shard2/3 reds = main's.
03:55Z cat-harness#942 all green; merge DENIED by classifier. Card Q-PIPE-4 cmsg_017WNUkNK8kdDziPK58Pv6G93GJnCRmgjVXcJPdSoaaeKG (A merge both #942+fa#2901 / B only #942 / C hold) replaces Q-PIPE-3 (withdrawn).
04:17Z cat-harness#942 MERGED by litlfred. Verify first tick at 04:43Z. fa#2901 still waits on Q-PIPE-4.
04:48Z cat-harness tick OK (sched 41390201341 -> dispatch 41390211912). fa#2902 run 41384684442 done: only main's/hidden reds. Reported to user.
06:14Z Q-PIPE-4 A + Q-PIPE-2 A tapped. fa#2901 merged 68ee3d4, fa#2902 merged 7b40723. fa#2899 closed. Final verify 07:04Z (fa tick + first main CQG record).
06:23Z Q-MVP-3 A (user tap 06:22Z): scanned 13 accessible repos; 23 queued runs, only 10 PR runs, all but smart-ra#227 already started jobs; smart-ra#227 is a re-pin -> kept. Cancelled 0. Re-pin repos (smart-*, dth-phc/sc) not attached to this session. Log queued-0623Z.tsv.
06:24Z re-pin prep adds keepers: fa#2906 (train), core#590, tools#1376, cat-harness#949 #951, core#487, smart-base#280, smart-ra#223 + wave 5-6 round 2. Merged: smart-base#278, cat-harness#945/#946/#947, tools#1367.
06:53Z drain phase 1 adds keepers (draft, waiting on Q-HDR-2): tools#1384 (layer-pr-checks concurrency by PR number) first, then fhir-harness#273.
07:09Z VERIFIED: fa tick sched 41402439776 -> dispatch 41403377042; fa main CQG run 41399704470 writes CQG-REPORT-V1 (standalone job). Thread done/resolved.
