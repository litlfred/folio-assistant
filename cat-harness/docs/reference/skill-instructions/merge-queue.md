---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Merge queue'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/sdlc/sdlc-core/merge-queue.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/sdlc/sdlc-core/merge-queue.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/sdlc/sdlc-core/merge-queue.md){: .fa-edit-source }

{% raw %}
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
[`check-head-has-run`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/check-head-has-run.ts) is the one
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
[`merge-priority.dmn`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/processes/sdlc/decisions/merge-priority.dmn)
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
[`scripts/tests/merge-queue.test.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/tests/merge-queue.test.ts)
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

## A PR lands only through `merge:guard` (STRICT)

**Every merge a steward makes goes through `bun run merge:guard <pr> --merge
--session <your session id>`.** Never `gh api -X PUT …/pulls/<n>/merge`,
never the web button, never `merge_pull_request` from an MCP tool, and never
by marking a PR ready or labelling it yourself first. The script
(`cat-harness/scripts/merge-guard.ts`, bean `uoob`, child (f) of `nok9`) is
the merge: it evaluates seven checks over GitHub's live facts, and performs
the PUT, pinned to the head it evaluated, only when every one passes.

Owner ruling 2026-10-03, after three PRs were landed unfinished by a steward
calling the PUT directly on the same day:

| PR | landed with | check that refuses it |
|---|---|---|
| #1937 | base = #1764's head branch, after #1764 had merged; head newer than its `ready:` (a hand merge and two claim commits since); an unsigned `ready:`; `needs-merge-human` on; its own `pull_request` runs failed, only a dispatch green | 1, 2, 3, 4, 5 |
| #1960 | no `ready-to-merge`, no `ready:` comment, `- [ ] CI green` in the body | 3, 4, 6 |
| #1957 | the steward itself called `ready_for_review` and added `ready-to-merge` 75 s before merging; no `ready:` comment | 2, 3 |

The seven checks, each named in a refusal by number and id:

1. **`base`** — open, based on `main`, and the base is not the head branch of
   a merged PR. A stacked PR is retargeted by its owning session first.
2. **`ready-for-review`** — not a draft, and the latest `ready_for_review`
   event is attributable to the PR's **own** session, never to yours.
3. **`ready-marker`** — a `ready: <sha>` comment **signed with the PR's own
   session link** (the one in its body), naming the head, or with only
   merge-main bot merges after it.
4. **`labels`** — `ready-to-merge` present, `needs-merge-human` absent.
5. **`ci`** — every `pull_request` run on the head is `success` or `skipped`,
   and every workflow owed for that event ran. A `workflow_dispatch` green is
   reported and **not** counted.
6. **`checklist`** — no unticked `- [ ]` in the body.
7. **`open-question`** — no comment after the marker asks the owner or the
   Merge Manager a question (a heuristic; its limits are on `openQuestions`
   in the script — a fresh `ready:` after the answer moves the window).

Exit 0 is pass (or merged), 1 refused, **2 could not determine — never a
pass.** A refusal is handed back to the owning session through
`merge-refusal.bpmn` with the check's text; the steward does not fix the PR
to make it pass, which is the move all three incidents made.

**What the OWNING session does, so a finished PR passes:** mark it ready,
then post `ready: <head sha>` signed with its session link —
`https://claude.ai/code/session_…` in the footer — within ten minutes of
each other, and apply `ready-to-merge`. Every session acts with the owner's
token, so the timeline's actor is always the owner and cannot tell sessions
apart; **the signature is the only thing that can**. An unsigned marker,
like #1937's, is refused.

**The status has four states, and red means wrong, not unfinished.** A PR
that is merely not ready yet (a draft, no marker, no label, an unticked box,
CI still running, an open question) posts `pending`. Only a defect posts
`failure`: a base that is not `main` or is dead, `needs-merge-human`, red CI
on the head, or a marker or ready-flip by a session other than the PR's own.
`success` is pass and `error` is could-not-determine. The status is posted on
every open PR, and red on every draft would teach readers to ignore red. A
required check blocks the merge in every state but `success`.

**The status is the backstop, not the gate.** `.github/workflows/merge-guard.yml`
runs the evaluate mode on label, draft, body, comment and CI-completion
events and posts a `merge-guard` commit status on the head. Making that
context REQUIRED is a ruleset the owner adds; this skill does not, and no
agent changes repository settings.

`Rule_NotReady` in
[`merge-priority.dmn`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/processes/sdlc/decisions/merge-priority.dmn)
applies the cheap half of checks 1-3 at placement (`readiness`, from
`LivePr.draft`, `baseRef`, `readySha`, `readyBy`), so an unfinished PR is
handed back before it is put in a train rather than at the PUT.

## Landing

Only with the owner's release (`Task_Release`): explicit, or a standing ruling
quoted verbatim with its date, and **only through `bun run merge:guard <pr>
--merge --session <id>`** (section above). What lands is exactly the SHA CI
tested — the guard pins the PUT to the head it evaluated, so GitHub refuses it
if the head moved; if `main` moved after the train's CI started, re-run
rather than land.

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

## What this does not do yet

The train's size is a fixed cap. Sizing it by risk waits for this process's
own run records, which is why each run is a committed instance under
`beans/workflows/`. The tools named on the steps (`merge:overlap`,
`merge:train`, `merge:leftover`) live on branch `claude/merge-pipeline-tools`
until it lands.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [A merge train](../../processes/merge-train.html) | Read each queued PR's live facts; Take the next PR in queue order; Admit it to the train, record the train id; Attribute the failure: each member's own CI first; Bisect the train; Eject the culprit, record why |

