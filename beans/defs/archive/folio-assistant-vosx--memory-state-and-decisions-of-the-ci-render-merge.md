---
# folio-assistant-vosx
$schema: bean/1.0.0
title: 'Memory: State and decisions of the CI/render/merge speed work (layer-pr-checks, cone, verdicts, repins) as of 2026-10-16'
status: completed
type: task
priority: low
created_at: 2026-10-16T09:54:02Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `ci-speed.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: State and decisions of the CI/render/merge speed work (layer-pr-checks, cone, verdicts, repins) as of 2026-10-16


Work continues bean `lpcs` (layer-pr-checks speed) and bean `4rbc` (CI cone). Read those beans first; they live on folio-assistant branch `cat/cat-harness/beans`.

Owner decisions, 2026-10-16:
- Pins stay decentralized. Each site is responsible for its own consent, so repins use standing consent rules.
- GitHub is one Tool of several. Verdicts are published by tree digest, so any runner can judge.
- Main's cached answer is keyed on the tips of the branch-kept state graphs too (the "Include" option). This settles lpcs's open question.

Draft PRs:
- cat-harness-tools #406: prepare each side once, skip pins-only PRs, balance shards by time.
- cat-harness-tools #411: the cone, stacked on #406.
- cat-harness-tools #408 and cat-harness #313: the verdict contract.
- cat-harness-tools #409: the derive writer cache.
- cat-harness-tools #410 and cat-harness #312: standing consent. cat-harness #312 must merge first.

Merge window: 2026-10-16 09:55Z "repin/merge when green ready three hour window" (to ~12:56Z) for this thread's PRs, renewed 11:20Z "merge repin window oopen 3 hts" (to ~14:20Z), then 14:32Z "go" (read as a new 3 hr window, to ~17:30Z). 2026-10-20 09:12Z "1": merge #411 + the 11 caller PRs when green and repin, within 3 hrs of folio-assistant#2600 landing (landed 10:29Z as 958337b, so window ends 13:29Z). 2026-10-20 12:10Z "mergen when green. repim as needed" (after the 34cm follow-ups): merge callers + cat-harness#363/#364/#371, tools#447, fa#2599 when green and repin; read as 3 hr window to 15:11Z. 2026-10-23 15:45Z "merege ready when green + repin + merge window open +3hrs. if blocked askefd structured Q&A with FULL context" (window to 18:45Z). 16:44Z "for next 3 hours you can merge when things turn green and ready" (window to 19:44Z). 20:15Z card "A. Extend 3 hrs" (window to ~23:15Z), includes tools#651 and the cat-harness-tools re-pin after it. 23:03Z card Q6 "A. Re-pin these" = combined fa re-pin #2681 (main tips of cat-harness, tools, core, smart-base, bootstrap, bootstrap-tools; not fhir-harness, who-iris, sci). 23:07Z "Extend the merge-when-green window + 3hrs" (to ~02:15Z 2026-10-24). 09:55Z "push" = yes to caller PRs adding `push: main`.

Owner, 2026-10-16 10:54Z: "dont wait on other threads long. take over if needded". **Why:** stalled siblings block the merge pipeline. **How to apply:** if a sibling thread's fix is the blocker and it doesn't come quickly, do it yourself and tell that thread.

Runner queueing (smart-base trial, 2026-10-16): jobs run 4-13 min each but wait up to 31 min for a runner. The shared pool, not test time, sets the wall clock. Cancelling other workflows' runs is refused by auto mode unless the owner asks for it explicitly.

Owner, 2026-10-16 11:20Z: "you can push". This lets this thread push fixes to the bean state branches (plain git commits) when a gate needs one.

Gotcha: GitHub caches saved in a PR run are visible only to that PR, so caches shared across PRs need a `push: main` run in callers.

Gate races (2026-10-23): a gate that is red in CI and green when run alone is usually a GATE_JOBS neighbour race. Example: Uganda #9's 5 render-exemption failures came from check:bootstrap-standalone git-initing bootstrap/ while check:cat-harness-standalone copied its closure. This was reproduced locally and fixed by cat-harness-tools#505 (TREE_TOOLS run alone).

2026-10-23: owner asked speed PRs first; OK'd cancel-and-restart of queued PR runs to let a speed-critical run through (card 15:55Z); restart with rerun-failed-jobs. Started 4 speed items ("1y 2y 3y 4y" 16:03Z): drafts run fast checks only, oqe3, p7mb regen skips builtAtPublish, fwtz cone deploy. Owner 2026-10-23 16:05Z: "i dont want the merge guard check" — do not require merge-guard on any repo; bean pwi4 scrapped (fa bean branch 340c73c). Do not re-propose. Lists: /mnt/project-files/ci-speed/.
