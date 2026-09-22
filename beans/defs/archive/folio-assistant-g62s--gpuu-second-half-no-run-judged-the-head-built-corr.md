---
# folio-assistant-g62s
title: 'gpuu second half: no run judged the head — built, correct, and inert in this repo'
status: completed
type: task
priority: normal
created_at: 2026-09-19T05:30:30Z
updated_at: 2026-09-19T05:36:35Z
---

The deferred half of bean `gpuu`. `newestUnsettled` catches "a run for the head
exists but has not finished". It does not reach the other silence: **no run for
the head was ever created.** `docs-site.yml` sat in that state for two months
under bean `xom7`.

## Built, and correct

`RunSummary.head_sha`, `AssessOptions.headSha`, `AssessOptions.triggersOnPush`,
`WorkflowHealth.headUnjudged`, plus `pushTriggerOf` — a pure reader of a
workflow's `on:` block answering `true` / `false` / `undefined`. The CLI asks
the forge for the branch tip rather than `git rev-parse origin/main`, because a
stale remote-tracking ref gives a WRONG head, and a wrong answer here is worse
than no answer.

Thirteen tests. Every unknown clears the flag rather than setting it.

## Measured, and inert — read this before trusting it

**`headUnjudged` cannot fire in this repository.** Of 36 workflows:

| `pushTriggerOf` | count |
|---|---|
| `true` — every push, so flaggable | **0** |
| `false` — never on push | 32 |
| `undefined` — push with a filter | 4 |

The four filtered ones are `docs-site.yml`, `code-quality-gates.yml`,
`jsonld-gen-check.yml`, `atomic-mass-gen-check.yml`.

**`docs-site.yml` is in that list, and it is the workflow bean `xom7` was opened
for.** So the conservative reading silences exactly the case this was built to
catch.

## Why it is conservative anyway, and what the alternative cost

The first version returned `true` for a filtered push trigger. The live report
then flagged `jsonld-gen-check.yml` as unjudged — a workflow that owed no run,
because its fifteen `paths:` entries did not match the commit. That is a false
fire of precisely the kind the trigger check exists to prevent, and it was found
by running the thing rather than by reasoning about it.

So the choice is not between conservative and useful. It is between a check that
is silent and a check that is wrong, unless a third thing is built.

## The third thing, not attempted

Deciding a filtered trigger properly means evaluating its `paths` /
`paths-ignore` globs against the files the head commit changed —
`GET /repos/{slug}/commits/{sha}` returns `files[]`, so the data is one request
away. What makes it more than an afternoon is the glob semantics: `**`,
negation, and the interaction of `paths` with `paths-ignore`. Getting those
subtly wrong reintroduces false fires, which is the one outcome this whole
design refuses.

That is a scope decision for the owner, not a detail to absorb quietly.

## Todo
- [x] `head_sha` on `RunSummary`, `headSha` + `triggersOnPush` on `AssessOptions`
- [x] `headUnjudged`, set only when all three facts are known
- [x] `pushTriggerOf`, with the filtered-trigger clause
- [x] both renderers distinguish the two silences
- [x] thirteen tests, including the four "must NOT flag" cases
- [x] measure how many workflows remain flaggable — **zero**
- [x] OWNER DECISION taken: build the filter evaluation (owner chose both — merge dormant, then make it fire)
- [x] evaluate `branches` / `branches-ignore` against the branch
- [x] evaluate `paths` / `paths-ignore` globs against the commit's changed files
- [x] guard the 300-file cap on GitHub's commit endpoint
- [x] re-measure: flaggable went 0 -> 1, cannot-tell 4 -> 0

## Done when
A workflow that should have run for the current head and did not is reported as
such, with no false fire against one that owed no run. **Not met today**: the
second half holds, the first cannot be exercised here.


## Second pass — the filters are evaluated, and it fires

Owner chose to merge the dormant version (#324) **and** build this.

**Measured before:** 0 of 36 workflows flaggable, 4 unknown.
**Measured after, against the real HEAD (5 changed files):** **1 flaggable, 35
would-not-run, 0 cannot-tell.** Every workflow is now decided; none is guessed.

The flaggable one is `code-quality-gates.yml` — the repo's main gate, and the
check whose silence would matter most.

### What made it tractable, which was not what I expected

I had budgeted for glob semantics. The bigger win needed none: **`code-quality-gates.yml`
declares `branches: [main]` and no paths at all.** A branch filter is fully
decidable from the branch name, which the report already knows. That one clause
turned the repo's most important gate from unknown to decided without touching a
single glob.

The remaining three use a small, bounded vocabulary — literal paths, `dir/**`,
`dir/**/*.ext`. No negation, no `?`, no `[]`, no `paths-ignore`. The feared
surface was mostly absent.

### The subtle case, and the guard

`content/**/*.ts` must match `content/a.ts`. A naive `**` -> `.*` translation
gives `content/.*/[^/]*\.ts`, which requires at least one intermediate
directory and silently drops the top-level file — a false "would not run", and
from there a missed finding rather than a false fire, but wrong either way. So
`/**/` compiles to `(?:/.*)?/`, and there is a test for exactly that, along with
`library/**/structure.json` matching `library/structure.json`.

`patternToRegExp` **refuses** `!`, `?`, `[`, `+`, `{` and returns `undefined`
for the whole decision. Each has real semantics and each is a chance to be
subtly wrong in the direction that invents a finding.

### The cap, which is the real trap

GitHub's commit endpoint returns at most **300** entries in `files` and does not
say when it truncated. A short list makes a matching path look absent, flipping
"this workflow ran" into "no run judged the head" — a false fire. A list at or
above the cap is therefore treated as unknown, and a large commit gets silence.

Verified: `bun test` 2104 tests / 0 fail, tsc and eslint clean, and a live run
against `main` reports three workflows green with no false fire.

## 2026-09-22 — THE SILENCE HAPPENED, through the door this does not watch

Reopening the conclusion rather than the build. `headUnjudged` is correct and
its measurement was correct; what was wrong was the inference drawn from it.

This bean closed on *"`headUnjudged` **cannot fire in this repository**"* — 0 of
36 workflows are `pushTriggerOf: true`, so nothing is flaggable. True, and it
reads as *"therefore the exposure is theoretical here"*. It is not.

**Measured on PR #858, 2026-09-22.** `Code-quality gates` and
`Feature Staging` did not run for **six consecutive pushes** across roughly
forty minutes. Not queued, not failed, not cancelled — **never created**, which
is exactly the state this bean exists to name.

Both are `pull_request`-triggered, so `pushTriggerOf` is `false` and
`headUnjudged` rightly stayed quiet. The detector watches the **push** door;
this repository's real exposure is the **pull_request** door, and they are not
the same door.

### The mechanism, which is not a GitHub outage

A PR whose branch has gone **un-mergeable** gets no merge ref, and without one
GitHub does not fire `pull_request` events. So:

    branch falls behind main -> conflicts -> mergeable_state: "dirty"
      -> no pull_request events -> no gates run, no staging deploy
      -> and the PR page looks quiet rather than broken

It is `xom7` one door along: *a workflow that never ran looks exactly like one
that passed*, and from inside a checkout it looks like nothing at all. I only
found it by listing workflow runs and noticing the newest was forty minutes old.

### Why it is not a one-off here

The conflicts were structural, in the same two places every time:

- **`package.json`'s scripts block** — alphabetical, and every concurrent agent
  appends `check:*` entries to it;
- **committed generated artefacts** — `harness.json`, `docs-auto`, `voices`,
  the QA and beans indexes — which both sides regenerate.

Cadence measured in one session: **70 commits behind → merge → 38 → merge → 3
→ merge → 10 → merge → 0**. Four merges in about an hour, each valid for
minutes. More merging does not fix it; the window closes faster than a sweep
runs.

### What would close the gap, NOT designed here

`pushTriggerOf` has a sibling question — *does this workflow trigger on
`pull_request`, and is the PR mergeable?* — and the second half is a fact
GitHub holds **about** the PR rather than one the repository holds, so it must
be asked externally like the Pages question already is. `mergeable_state` is
the field. Recorded as the shape, not as a decision: the owner chose to record
this in an existing bean rather than open a new one, so it sits here as a
correction to this bean's conclusion for whoever picks the detector up.

### One consequence worth stating plainly

Every green result reported on #858 between 08:14 and the final merge was a
**local** `bun run gates` — said as such in each commit and each PR comment —
and **CI confirmed none of it**. That is not a reporting failure, but it is a
weaker claim than it reads as, and the difference was invisible until somebody
went looking for runs that did not exist.

### The control, 2026-09-22 09:36 — hypothesis confirmed

The note above inferred the mechanism from a correlation: #858 was
`mergeable_state: "dirty"` and its `pull_request` workflows had stopped. That is
suggestive, not conclusive — a GitHub-side outage or a queue backlog would look
the same from here, and `ci-health`'s own first rule is that a
could-not-determine is never rendered as a finding.

**#899 is the control.** Same repository, same workflows, same branch name, a
new PR opened minutes later with **0 conflicts** against main. Within one
minute it had **five check runs** — `TypeScript — tests, lint, types`,
`End-to-end + accessibility`, and the Python / Rust / Lean gates — every one of
them `pull_request`-triggered, and every one of them a workflow that had fired
nothing on #858 for six consecutive pushes.

So the variable is mergeability, not the forge and not the clock:

| PR | conflicts vs main | `pull_request` workflow runs |
|---|---|---|
| #858, 08:14 → 09:34 | yes | **0 across 6 pushes** |
| #899, 09:35 | no | **5 within one minute** |

That is what makes this worth building a detector for rather than filing as
weather. The gap is real, reproducible, and invisible from a checkout — and
the only reason it was noticed at all is that somebody listed workflow runs and
saw the newest was forty minutes old.

### A second cost, measured after the merge

**The staging preview is deleted when its PR closes.** `#858`'s tree went at
09:36 — `staging(cleanup): remove STAGING/claude-determined-euler-gqhkk0 (PR
#858 closed)` — which is correct behaviour and the right default.

But it means a preview that only became reachable AFTER the conflict cleared
(09:05, the first staging deploy in fifty minutes) existed for about half an
hour and was gone before anybody looked. The rendered `/processes/` page has
now been unverifiable twice for two different reasons: first because staging
never ran, then because its output was swept. Not a defect to fix here —
recorded so the next agent knows the preview is a *perishable* artefact and
looks while it exists.
