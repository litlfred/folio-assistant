---
name: merge-queue
description: >
  Order the ready PRs and land them as a train: read each PR's live facts,
  let the reprioritisation table place it, merge the members together, run the
  gate set on the combination, and on red attribute and eject the culprit
  rather than reject the train. Use for "merge the ready PRs", "what lands
  next", "run a merge train", "why was my PR ejected", "move this PR up", and
  when tuning the train's order or size.
user_invocable: false
---

# Merge queue — what lands next, and as what

`processes/sdlc/merge-train.bpmn` is the process. The ORDER is computed by
`processes/sdlc/decisions/merge-priority.dmn`; the facts it reads are derived
by `scripts/merge-queue.ts`; what the steward decided is recorded against
`schemas/merge-queue.ts`. This page says what each piece is FOR. Bean `hfag`.

## The rule everything else follows from

**The queue stores decisions, never GitHub's facts.** CI status, mergeability,
labels and head SHA change without the queue being told, so a stored copy is
stale the moment it is written and a reader cannot tell which. They are read
live at each step. What a queue entry holds is what the steward DECIDED — the
placement, a hold, an ejection — with who decided it, when, and the evidence
URL it acted on. `FORBIDDEN_FACT_KEYS` in the schema refuses an entry that
carries a fact.

## Placement is computed, not chosen

`GW_Placement` is DMN-backed, so `workflow_complete` refuses a hand-supplied
outcome there. The table (hit policy FIRST) answers a `route` (`admit` or
`hand back`), a `class` (`PRIORITY_CLASSES`), a `rank` and whether the PR
rides alone.

- **An owner override is an INPUT** (`ownerOverride`), never an outcome. The
  owner places a PR by hand in `Task_Override`; the schema refuses an
  `override` placement without a reason.
- **Independence is decided on AUTHORED paths** (`authoredPaths`,
  `touchesShared`). Generated paths are excluded because
  `merge-conflict-patterns` already resolves them; counting them would make
  every pair of PRs conflict.
- **Ties go to the oldest PR** (`orderQueue`): overrides at their positions,
  then rank, then PR number.

## Admission asks which runs are OWED, never whether anything is red

**A member is admitted on `ownCi == "green"` and `green` means every workflow
owed for the head's event ran and succeeded.** It does not mean "nothing is
failing". The two readings come apart, and the gap is the whole reason this
section exists.

Measured 2026-10-02 on #1889's head `7ab6119405`:

| | |
|---|---|
| check runs on the head | 9 |
| gating job NAMES present, of 9 expected | 9 — a complete name set |
| runs `in_progress` with `conclusion: null` | 3 |
| check SUITES `completed` with `conclusion: action_required` and `latest_check_runs_count: 0` | 3 |
| runs whose conclusion is `failure` | **0** |

So a filter for `conclusion == "failure"` returns nothing, and three suites
completed having executed nothing at all. **Counting the runs does not catch
it either** — nine were present and every expected name matched. Only asking
*which runs are owed for this event* catches it, and
[`check-head-has-run`](../../../scripts/check-head-has-run.ts) is the one
thing here that asks (bean `3pqn`). Do not write a second checker: it already
keeps the states apart, has a test, and is already wired into
`pr-checks-present.bpmn`.

Its five states are the five values of `ownCi`, and collapsing any two is the
defect:

| value | means |
|---|---|
| `green` | every owed run present and successful — **the only admitting value** |
| `red` | an owed run ran and failed |
| `missing-required` | it HAS runs, but not the ones owed |
| `none` | GitHub answered and nothing names this head |
| `unknown` | could not ask: no network, rate limit, HTTP error |

`unknown` is handed back, never admitted and **never reported as red** (bean
`0qjq`): telling somebody their head is unverified when you merely could not
look trains them to ignore the signal, which costs more than the gap.

**This is a gate, not advice.** `Rule_HeadNotGreen` in
[`merge-priority.dmn`](../../../processes/sdlc/decisions/merge-priority.dmn)
sits immediately after `Rule_Refused` under `hitPolicy="FIRST"`, so anything
but `green` routes to hand-back before any admitting rule can fire, and
`workflow_gate` refuses a hand-supplied outcome.

**A dispatch is not an owed run.** `workflow_dispatch` is the designed
workaround for the bot-actor push condition (bean `0qjq`, and `merge-main.yml`
dispatches the gating workflows for exactly that reason), but a dispatched run
is evidence about the TREE, not evidence that the owed `pull_request` run
exists. The session that wrote this section made that error on #1888 — read
eight dispatched jobs as "green" because the names matched — and
`check:head-has-run` caught it. Report the two facts separately or the
distinction is lost.

## Overlap has a KIND, and a train is the right answer to one of the four

`conflictRisk` answers *is there a collision*. A steward needs *is it the kind
a train is for*, which is `overlapKind`:

| kind | means | what it needs |
|---|---|---|
| `none` | no path shared with any live member | nothing |
| `generated-only` | shares paths, every one resolved by a declared pattern | **regeneration** |
| `shared-declaration` | the only authored paths shared are shared declarations | **ordering** |
| `authored` | shares an authored path that is not a declaration | **a train** |

Four values rather than three, and the reason is measured rather than tidy. A
shared declaration is a **subset** of an authored path, not a sibling:
`classify("package.json").strategy` is `refuse`, so it is authored, *and*
`isSharedDeclaration("package.json")` is true (both measured 2026-10-02). A
three-value partition therefore files a declaration-only collision under
`authored`.

That is not hypothetical. `merge:overlap` over all 36 open PRs on 2026-10-02
(459 pairs) found **#1907 × #1909 `independent: false` with
`authored_overlap = 0`** — colliding on `package.json` and generated regions
only. **A pipeline that treats that like a content collision builds trains
nobody needed.**

`authored` outranks `shared-declaration`, which outranks `generated-only`,
because at each step the earlier kind is the one the later kind's remedy
cannot resolve. The partition is tested in
[`scripts/tests/merge-queue.test.ts`](../../../scripts/tests/merge-queue.test.ts)
— including that a refused member cannot be the other side of a collision,
since it never enters a train.

## Regenerate on a clean tree, and check it

**`git status --porcelain` is empty before a member is merged and the tree
regenerated.** Checked, not assumed, on `Task_Admit`.

Generated directory READMEs carry a per-subdirectory file count, and the
writer counts the files git would commit —
`git ls-files --cached --others --exclude-standard`
(`bootstrap-tools/scripts/git-files.ts:23`). `--exclude-standard` keeps
*ignored* junk out, which is the `__pycache__` case that drove that line, but
`--others` still counts an untracked file nobody has ignored. So a transient
written by an earlier train step moves a committed count,
`readme:subgraphs:check` goes red, and **the red belongs to nobody**. Train 6
hit this.

The precondition does not make the count stable, and saying so is the point: two
members each adding a file still write different integers to one line. Bean
`y7b3` measured 76 of 300 replayed merges conflicting on `beans/README.md`,
every one on the `| defs/ | N files |` line — and the class is wider than that
bean states: **54 generated READMEs across 14 instances carry 207 such rows**
(measured 2026-10-02). `merge:main` already resolves them under
`readme-generated-regions`, so the residual cost falls on merges made by plain
git rather than by the pipeline.

The fix is bean `ba9e`: take the integer off `main` into the KG's `_data`
layer, which classifies `take-base` and is therefore already auto-resolved by
`merge-conflict-patterns.ts:171`. Not `-merge` and not a merge driver — both
are refused in `.gitattributes` on measured grounds, the first because it
tidies conflicts without removing them and the second because it needs
per-checkout `git config`.

## A red train ejects one member, not the train

1. **Retry only a declared-flaky gate, and only once** (`Task_RetryFlaky`).
   A deterministic gate retried learns nothing.
2. **Attribute from each member's own CI first** (`Task_Attribute`). A member
   whose own CI is red, or never ran on its head — GitHub runs no
   `pull_request` CI while a PR conflicts — is the prime suspect, at no cost.
3. **Bisect only when every member is green alone** (`Task_Bisect`).
4. **Eject and hand back with the reason** (`Task_Eject`, then
   `merge-refusal.bpmn`). The ejection is written on the member's entry; the
   rest re-run without it. The owning session fixes and re-signals ready; it
   is never merged on its behalf.

## Landing

Only with the owner's release (`Task_Release`): explicit, or a standing ruling
quoted verbatim with its date. What lands is exactly the SHA CI tested; if
`main` moved after the train's CI started, re-run rather than land.

## Your merge cadence is an input to the bot's throughput

**Pacing and concurrency are one question, not two.** `merge-main.yml` sweeps
the `merge-main`-labelled PRs on every push to `main`, so each merge you land
starts a sweep — and the per-PR `merge` job's concurrency group decides what
happens to the sweep already running.

Measured 2026-10-03 over the last 100 runs of that workflow (bean `o8s9`):

| trigger | success | cancelled |
|---|---|---|
| `push` | 20 | **21** |
| `pull_request_target` | 14 | 2 |
| `workflow_dispatch` | 0 | 2 |

Half of every push-triggered sweep was discarded. Run `37111610566` is the
worked case: twelve per-PR jobs, six cancelled inside ten seconds of each
other by the next sweep, and five of those six PRs still conflicted when
re-probed minutes later. Sweep wall time is 1-15 min while a steward draining
the queue lands a merge every 5-10, so under `cancel-in-progress: true` a
sweep rarely survived to finish.

The rule, now that `cancel-in-progress` is trigger-dependent and a push sweep
QUEUES rather than kills:

- **A sweep in flight is work in progress — do not count a PR as unmergeable
  while its merge job is queued behind your last landing.** Re-read it after
  the sweep settles.
- **When you are landing faster than the sweep completes, you are the reason
  the behind-PRs are not catching up.** The concurrency fix bounds the loss at
  zero rather than half, but a merge still carries only `main@T(n-1) -> T(n)`
  per sweep; a burst of landings leaves a backlog of steps to carry.

## A hold has an EXPIRY and a trigger, or it outlives its reason

A hold is a decision, and like every queue entry it records what the steward
decided — not a fact. Facts move. **So a hold is only valid while the condition
that justified it is still true, and the steward re-derives that condition at
every sweep rather than inheriting it.**

Write a hold with three parts or do not write one:

| part | why |
|---|---|
| **what it waits on** | the condition, stated so it can be checked mechanically |
| **what ends it** | the observation that lifts it, not a time |
| **what it costs** | which PRs are being held, so the price is visible |

**Measured, 2026-10-03.** A steward froze merges so a `merge-main` sweep could
finish without being cancelled — correct at the time, and the owner confirmed
the order. The sweep finished. The hold did not. It then survived three more
sweeps, and the steward kept reporting "held for ordering" while four PRs sat
clean and green for roughly forty minutes. The owner had to ask *"what is
blocker on merging?"* to end it. The answer was the steward.

Two specific failures worth naming, because both look like diligence:

- **Inheriting a hold across its own justification.** The premise was "a merge
  now cancels the in-flight job". Once that job completed — and once bean
  `o8s9`'s fix made push sweeps queue instead of cancel — the premise was
  simply false, and nothing re-checked it. A hold whose reason you cannot
  restate from current facts is not a hold, it is a habit.
- **Holding to protect a PR that was already conflicted.** The train head was
  `rc=1` and needed a forward merge whatever happened, so holding other merges
  protected nothing. **If the thing you are protecting already needs the work
  your hold is avoiding, the hold is free of benefit and not free of cost.**

## Sweep the whole queue; a tracked handful is not the queue

**Compute the mergeable set from the open-PR list every time, never from the
PRs you happen to be following.** The same session that held four green PRs
was also unaware of two others that had opened and gone green in the
meantime — they were not in its mental list, so they were in no list at all.

The sweep is cheap and mechanical: for every open non-draft PR, read
`base.ref`, run `git merge-tree --write-tree origin/main <head>` for the rc,
and read the check runs on that exact head. Three columns, one pass. A PR with `base == main` and
`rc == 0` is a *candidate*; whether it is mergeable is still the OWED question
above, not a count of failures.

**`no failures and nothing pending` is NOT green, and this rule got that wrong
on its first use.** The sweep that followed it marked #1953 mergeable on
`ok=1 bad=0 wait=0` — one completed check, the `.jsonld siblings` one, against
the 23 that a full suite produces here. Nothing had failed and nothing was
pending because **almost nothing had been asked**. That is bean `1xhc` inside
the sweep itself: a gate that did not fire is indistinguishable from one that
passed, and a tally of failures cannot tell them apart.

So the third column is the owed SET, never a count: compare the check-run
*names* on that head against the set owed for its event, and treat a missing
name exactly as a red one. A steward that cannot say why it is not merging a PR
which is green **on the owed set** is holding it by accident; one that merges on
`bad=0 wait=0` alone is merging unverified.

## Read `base.ref` BEFORE anything else: a stacked PR is not a main-queue member

**`merge-tree origin/main <head>` answers a question nobody asked when the
PR's base is not `main`.** Mergeability, independence and placement are all
computed against the base, so a stacked PR measured against `main` is measured
against the wrong tree — and the merge button lands it on the wrong tree too.

**Measured, 2026-10-03.** PR #1937 was based on `claude/quirky-davinci-ixuymr`,
another PR's branch. Every check the steward ran was against `origin/main`:
`rc=0`, 16/16 green, all true and all irrelevant. The merge went to the stacked
base, the PR closed as merged, and its nine commits were not on `main`. It took
a second PR to re-land, and a sibling agent independently misdiagnosed the
absence as a force-push eating a merge — a scarier cause than the truth, with a
destructive remedy attached.

The tell is cheap and it is first: `gh api repos/<o>/<r>/pulls/<n> --jq .base.ref`.
In one sweep of 30 open PRs here, **four** had a base other than `main`. A
queue sweep that does not print the base will mis-handle roughly one PR in
eight.

A stacked PR is not admitted to the main queue. Either its base lands first and
the PR is re-measured against `main`, or it is rebased onto `main` by its
author. The steward's job is to notice, not to resolve it.

## `git add -A` after a merge silently reverts the submodule gitlinks

**And `git submodule status` does not catch it.** This is bean `ygga` one layer
deeper, and it defeats the check that bean prescribes.

A merge resolves a submodule gitlink like any other path. `git add -A` then
re-records every submodule at **whatever the working tree happens to have
checked out**, overwriting the resolution. If you initialised submodules
*before* merging, and the base advanced them, you have just reverted them to
the merge base — and `git submodule status` shows **no `+` and no `-`**, because
the index and the working tree agree with each other. They are simply both
wrong.

**Measured, 2026-10-03, on #1819.** Main had moved `bootstrap` to `ebfa406` and
`bootstrap-tools` to `3046412`; the branch never touched either, so the
three-way merge correctly took main's side, and `git add -A` undid it. The
symptom was not a submodule error — it was `regen` reporting **five checks as
"a real defect, not staleness"** (`readme:sync` in its four spellings plus
`translate-bpmn:bootstrap`), all of them one module-load failure:

```
SyntaxError: Export named 'generatedBanner' not found in
  .../bootstrap-tools/scripts/generated-by.ts
```

`generatedBanner` exists only from `3046412`. With the pins right, all five
pass untouched and regen settles at 0 unrepaired. The agent had run
`bun install`, so this is not the missing-dependencies case either.

Two rules follow:

- **Stage explicitly after a merge**, never `git add -A`, while any submodule is
  in the tree.
- **Verify the pins against the ref, not against the working tree.**
  `git ls-tree <ref> bootstrap bootstrap-tools` is what exposes this;
  `git submodule status` cannot, and reporting it as clean on that basis is the
  `1xhc` failure — a check that cannot see the defect is not evidence of its
  absence.

## A local gate run in a contended container is not evidence — and here is the ratio

**Measured 2026-10-03.** A full `bun test` shard in this container: **14,625
tests across 715 files in 1438.88 s**. The workflow's own comment puts the same
shard at **2 m 07 s – 2 m 21 s** on a dedicated runner. That is roughly **ten
times slower**, at load average **11** with three concurrent `bun test` runs and
a `regen` belonging to other sessions.

At that ratio the default 5 s per-test budget stops measuring the code:

```
14554 pass · 57 skip · 14 fail
grep -c "timed out after 5000ms"                    -> 14
grep -cE "^error:|Expected:|Received:|toBe|toEqual" ->  0
```

**Fourteen failures, every one a timeout, not one assertion failure**, at real
durations of 5.0–10.9 s. The same shard was green on the dedicated runner.

So the signature is cheap to check and worth checking before you believe a red
local run: **all failures are `timed out after Nms` and the assertion-failure
count is zero.** That is contention. Report it as *inconclusive under
contention* — never as green, and never as a defect — and let CI on the exact
sha be the authority. What you must not do is "fix" a test that is not broken,
and `never skip, disable or quarantine a test to get green` applies with full
force here, because the temptation is strongest when the failure is not real.

**Two ways this measurement was nearly got wrong, both bean `0s6w`:**

- The agent first reported "exactly one failure" from a partial log, then the
  run finished at 14. A count read before the run ends is not a count.
- It read the run's exit code as 0 — but `echo` and `tail` were chained after
  the test command in the same invocation, so **the 0 was `tail`'s**. A
  compound command's exit status is the last command's, and a test runner's
  status has to be captured before anything else runs.

## What this does not do yet

The train's size is a fixed cap. Sizing it by risk waits for this process's
own run records, which is why each run is a committed instance under
`beans/workflows/`. The tools named on the steps (`merge:overlap`,
`merge:train`, `merge:leftover`) live on branch `claude/merge-pipeline-tools`
until it lands.
