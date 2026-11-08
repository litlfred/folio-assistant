---
# folio-assistant-hd58
$schema: bean/1.0.0
title: 'CI speed II (h): merge train — batch opted-in PRs, CI once, bisect on red (linear compute in # PRs merged)'
status: in-progress
type: feature
priority: high
tags:
    - ci-speed-ii
created_at: 2026-11-05T11:54:45Z
updated_at: 2026-11-08T07:03:00Z
parent: folio-assistant-k3vv
---

Owner litlfred, 2026-11-05, via the analysis session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf: *"quadratic compute time in terms of # PRs to merge — how to linearize? do it all properly"*. Builds on [`saturation-meta-merge`](../../cat-harness/sdlc/skills/sdlc-core/saturation-meta-merge.md) (stack ready PRs on one branch, land once), [`merge-queue`](../../cat-harness/sdlc/skills/sdlc-core/merge-queue.md) §"A red train ejects one member", and the working re-pin train (`.github/workflows/repin-train*.yml`, `.github/scripts/repin-train.ts`). GitHub's merge queue is unavailable on this user-owned repo (work item `1hjm`; org move deferred, work item `xaa8`).

## Why it is quadratic today

With N PRs landing in a window, main moves N times. Already fixed: merge-main merges main only into CONFLICTED PRs (#2947), and PR results are reused when only main moved (#2949). What remains:

1. A conflicted labelled PR is re-merged and its CI re-run on EVERY push to main: c conflicted PRs × N pushes.
2. Every merge triggers a main push run: N main runs, each judging a tree that will be superseded.
3. People and agents update branches before merging: each PR re-runs once per main move it sees.
4. Superseded runs are cancelled late, after they hold a runner.

Each is (something per PR) × (number of main moves) = O(N²).

## The design: a batch train with lazy integration

**Opt-in.** A PR joins when it carries the label `merge-train` and that label was added by a person (the `labeled` event's actor is a `User`, never a bot), or when it has an APPROVED review from a person with write access and its own checks are green. Never a draft, never a fork, base `main` only. Merging into main stays a person's decision: the label (or the approval) IS the decision, and the train merges nothing else.

**Not admitted** (stay in the pool, named in the train's report): a head with a failing check of its own (the author fixes it first); a head with checks still running; a PR touching `.github/workflows/` (the train's token cannot push workflow files) or `subscriptions/` (held copies).

**One candidate per tick.** On a tick (the 15-minute `sweeps.yml` dispatcher, or a dispatch) when no train is in flight, `merge-train.yml` builds `merge-train/<stamp>` from `origin/main` with `bun run cat merge:train -- --base origin/main --no-main <members>` (cat-harness-tools/scripts/merge-train.ts): each member merged with `merge-base.ts --no-regen`, conflicts resolved ONLY by declared patterns, then ONE `regen` over the stack. A member with an authored conflict is refused by the tool and stays out (back to its owner, as `merge-queue` §"A train admits only members that STACK cleanly" requires). Conflicts are thus resolved once, at train time, never per main push.

**CI once.** The branch is pushed and ONE train PR (label `merge-train-batch`) is opened against main. CI runs once on the candidate head C (a bot-token push starts `pull_request`; with only GITHUB_TOKEN the gates are dispatched on the branch, as the re-pin train does). Affected-only selection and the result cache (siblings "CI speed 7" and "8") apply to that one run when they land.

**Land in one step.** The verdict is the re-pin train's: no check fails on C that passes on main, check by check (`repin-train.ts compare`). When green, the train PR is merged with a merge commit, expected sha C. Its tree equals C's tree when main did not move, and its second parent is C, so main's push run REUSES C's verdict (`verdict-reuse.sh`, rule 1: second parent's run tested this tree) and skips the heavy jobs. Every member's head is now an ancestor of main, so GitHub marks each member PR merged; each gets one comment linking the train. If main moved meanwhile, GitHub refuses or the reuse misses; the next tick rebuilds.

**Red: bisect, eject one.** A red batch B (|B| > 1) is split into halves B1, B2. B1 is tested next; B2 is queued behind it. Green halves land as they pass; a red half is split again. A red singleton is the culprit: it is ejected (label removed, one comment with the failing checks), and the rest land. With one culprit among k this costs about ⌈log₂ k⌉ extra runs, and the innocent halves land on the way. The queue is kept in the train PR's body (`<!-- merge-train:state {json} -->`), so the next tick resumes from the newest train PR; no store elsewhere.

**Coordination with merge-main.yml.** Its sweep skips any PR labelled `merge-train`: the train integrates it lazily. A named dispatch still merges main into it if a person asks.

## Compute model, per merged PR

R = one full gates run on a candidate, M = a main push run (≈ R without reuse, ≈ light with reuse), k = PRs per train, c = conflicted labelled PRs, N = PRs merged in a window, p = a PR's own pushes.

| | runner cost for N merged PRs | per merged PR |
|---|---|---|
| before (per-PR merge, merge-main on conflicted PRs) | N·p·R + c·N·R + N·M | p·R + c·R + M — grows with N through c and with every update-branch |
| after (train) | N·p·R + (N/k)·(R + M_reused) + (red trains)·⌈log₂ k⌉·R | p·R + (R + M_reused)/k (+ log₂ k·R/k on a red train) |

The quadratic term c·N·R is gone (the train never re-merges per main push); main runs drop from N to N/k and are reused.

## Done when
- [x] `.github/scripts/merge-train.ts` with tested pure parts (select, bisect state, decide), node-only imports
- [x] `.github/workflows/merge-train.yml` (build, push, open, CI, verdict, merge, eject) and a `sweeps.yml` step that dispatches it only when there is work
- [x] `merge-main.yml` sweep skips `merge-train` PRs
- [x] code-quality-gates: a dispatch on main whose HEAD is a two-parent merge is looked up by its second parent (so a GITHUB_TOKEN merge still reuses C's run)
- [ ] measured compute per merged PR before (done, below) and after (once trains run)
- [x] the skill `merge-queue` points at the automated train (cat-harness#1053, e1a7cc1)

## Measured before (2026-11-05)

The last 100 `Code-quality gates` runs, 2026-11-03T07:44Z → 2026-11-05T12:00Z, against the 15 PRs merged in that window (#2924 … #2955):

| event | runs | conclusions | run-wall-minutes |
|---|---|---|---|
| `pull_request` | 72 | 18 success, 28 failure, **21 cancelled**, 4 running, 1 action_required | 3791 |
| `push` to main | 15 (= one per merge) | 11 failure, 2 cancelled, 2 running | 426 |
| `workflow_dispatch` on a branch (merge-main) | 13 | 13 failure | 467 |

**6.7 gates runs per merged PR** (100 / 15), about 312 run-wall-minutes each (wall time of runs, not runner time; at the ~130 runner-minutes of one full run, `k3vv`, about 870 runner-minutes per merged PR as an upper bound). The part that grows with N: the 13 merge-main dispatches and 15 main runs (1.9 runs per merged PR), the 21 late-cancelled PR runs, and the PR runs caused by main moving (18-90 % of a PR's runner time, `k3vv`).

## After (modelled; to be measured once trains run)

Per merged PR in a train of k: its own pushes (unchanged, linear) + 1/k candidate run + 1/k main run that reuses the candidate's verdict (heavy jobs skipped) + 0 merge-main dispatches for train PRs, + ⌈log₂ k⌉/k on a red train. At k = 5: ≈ 0.4 shared runs per PR instead of 1.9, and no term that grows with N.

## Owner ruling, 2026-11-05

Asked in session https://claude.ai/code/session_01VQDpPdXwTy9PWgFEpEYCSM, answer **1. Declared only**: the train resolves conflicts that a declared pattern covers, mechanically at train time, and refuses (hands back) any authored conflict. This narrows the 2026-10-04 "members must stack cleanly" ruling for the automated train only; `merge-queue` should say so (cat-harness follow-up).

## Owner ruling, 2026-11-05 (card, relayed by the analysis session): "Resolve generated only"

Supersedes the 2026-10-04 "stack cleanly" ruling **for generated paths only**. At train time the train resolves conflicts in declared generated paths mechanically (declared patterns + one regen, judged by the candidate's CI). A conflict in any hand-written file EJECTS that PR with a comment (label removed); it waits for its author. Implemented: `merge-train.ts eject-refused`, run after each build.

## Owner ruling, 2026-11-05: off switch for workflow PRs

8 of 10 open ready PRs changed `.github/workflows/`, which GITHUB_TOKEN can neither push nor merge. Answer **1**: the train carries such PRs only when the repository variable `MERGE_TRAIN_CARRIES_WORKFLOWS` is `true` AND a bot token (harness App or `PUSH_BRANCH_TRIGGERING_CI`) is present; off until the owner grants that token the workflows permission and sets the variable. `subscriptions/` is never carried. Implemented in #2960 (4c4c045).

## Open, with the CI speed 7 owner

#2962 scopes `bun test` on every `pull_request`. A `merge-train/*` (and `repin-train/*`) PR must run the full suite: it is the members' only CI, and after #2963 main refuses to reuse a scoped run. Proposed: #2962 treats those head refs as full runs.

_2026-11-05T13:43Z_: owner, relayed by the analysis session, on the token: **"1. I merge when green"**. No new token; PRs that change `.github/workflows/` merge one at a time and the train skips them. The off switch stays OFF (variable unset), so the two answers agree; no code change.

_2026-11-05T14:30Z_: all in #2960. Still open: #2960 green and merged (waits for #2954 to make main green); #2962 runs the full suite on `merge-train/*` and `repin-train/*` (CI speed 7); the after-measurement.

_2026-11-05T23:30Z_: #2954 landed (04cf7ef); #2960 updated at f4d51da (main merged, plus the landed-member fix and the mergeable_state qualifications). Waiting for its CI; the owner merges it when green (a workflow PR).

_2026-11-06T01:48Z_: **#2960 merged** (the owner merged it; all 30 checks green at 5dd07aa). The train is live. Remaining: the first train run (needs PRs labelled `merge-train` by a person), the after-measurement, and #2962's full-run rule for `merge-train/*` and `repin-train/*`.

_2026-11-06T04:49Z_: #2962 merged with the full-suite rule for `merge-train/*` and `repin-train/*` (confirmed by CI speed 7), so that item is closed. On the owner's OK, #2951 was labelled `merge-train` at 04:48Z for the first live train. The parking branch `claude/merge-train-hold` stays with the owner (delete refused, 403).

_2026-11-06T05:15Z_: first live attempt: #2951 was labelled at 04:48:2x and **merged directly at 04:48:31** by the merge-sweep helper (merged_by litlfred), before the train's first tick. The 04:52 sweep then found nothing; merge-train.yml: 0 runs. No defect in the train, but the merge sweep (green PRs one at a time = the per-PR path) starves it. Asked the steward to have the merge sweep skip `merge-train` / `merge-train-batch` PRs, as merge-main.yml does.

## Owner ruling, 2026-11-06T05:16Z: "1. The train"

PRs labelled `merge-train` are landed by the train only; the steward's merge sweep skips them (and `merge-train-batch` PRs), as merge-main.yml does. Every other green PR still merges as before. Sent to the steward to apply in the merge-sweep helper.

_2026-11-06T06:25Z_: second miss: #2987 was labelled at 05:18 and **merged directly at 05:52:34** (merged_by litlfred), after merge-planning's rule R0 should have been in. The 05:43 sweep printed only "nothing to do", most likely because #2987's checks were still running; there was no log to prove it. Fix for the log in #2991 (pending prints why each opted-in PR waits). Asked the steward which merger landed #2987. merge-train.yml: still 0 runs.

_2026-11-06T06:25Z_: #2987 was merged by its own session (CI speed 12) under the owner's "Update now" card. Every merging session now has the rule: leave `merge-train` PRs to the train, or remove the label before merging. **Follow-up (not built):** when a labelled PR is merged outside a train, the train should comment once on it, so a race shows instead of passing silently (steward's suggestion).

_2026-11-06T08:11Z_: #2991 merged (pending says why each opted-in PR waits). Its bun-test shards ran 39-53 s each with affected-only (#2962), against ~5-7 min for a full shard. Open: the first real train (waits for an eligible PR the owner opts in), the after-measurement, and the follow-up "comment when a labelled PR is merged outside the train".

_2026-11-07T05:35Z_: #2997 merged 2026-11-06 10:30Z. The **first merge-train run** (run 42206640400, 10:58Z) correctly posted the one-time stray comments (#2987 confirmed) and built nothing. But it spent 28 of 30 min on a full-history checkout. Fix in #3002: fetch-depth 1, and unshallow only when building. The owner opened a 12 h re-pin + merge window at about 05:27Z on 2026-11-07.

## Owner ruling, 2026-11-07T06:10Z (card, via the merge manager): "A. Yes, use the train"

When the owner approves a folio-assistant PR that changes no workflow files, the merge manager labels it `merge-train` instead of merging it one by one. The train stacks the approved PRs, runs CI once and lands them together; a red batch is bisected. PRs that change workflows are still merged directly by the merge manager. The train session reports "landed: train #<n> (PRs …)" after each batch, and says when a batch bisects.

_2026-11-08T07:03:00Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: inactive > 3h, completing verification/close-out in Round 4 drain.
