---
# folio-assistant-sddf
title: check-head-has-run asserts 'the event was dropped' when it cannot know, and tells you to dispatch — which yv4z measured as unsafe
status: completed
type: bug
priority: high
created_at: 2026-09-21T22:50:59Z
updated_at: 2026-09-21T22:58:49Z
parent: folio-assistant-1xhc
---

`check-head-has-run.ts` is a careful script with a careless ending. Its header
spends forty lines establishing that a PR with zero checks is
**indistinguishable** from one whose checks have not started, and that
could-not-ask must never be rendered as either answer. Then its `no-run` branch
prints:

> It IS pushed, so this is bean `3pqn`: **the event was dropped.**

...and two sentences later, in the same message:

> A pull request carrying zero checks **looks exactly like one whose checks
> have not started.**

It names a cause as fact, then admits the evidence cannot distinguish it. That
is `xom7` reproduced inside the file written to prevent it — and the header's
own §"The hazard this script could itself have become" describes the identical
failure in an earlier draft.

## The live defect: it recommends something now known to be unsafe

The same message ends:

> Dispatch the workflow against this ref instead, and read that run.

A `workflow_dispatch` run resolves `refs/heads/<branch>`, **not**
`refs/pull/N/merge`. On a conflicted PR that is a green signal for a tree that
will never exist — worse than the absence it replaces. `yv4z` established this
and `prepare-merge` §Guardrails gained a **step 0** (read `mergeable_state`
first, and merge the base in rather than dispatching).

**This script never got that memo**, and it is the tool an operator runs at
exactly the moment the guardrail applies. The guardrail lives in a skill the
operator may not be reading; the unsafe advice is printed by the tool they
*are* running.

## What is now measurable that was not

PR #813, 2026-09-21, measured on one PR with mergeability the only variable:

| | conflicted | resolved |
|---|---|---|
| `refs/pull/N/merge` | absent for 433 s | present within 15 s |
| `pull_request` runs | zero for 8+ min | five, 7 s after the push |

And the discriminator is **not** elapsed time: latency varied twenty-fold in
one hour (7 s vs 2 m 43 s) under normal operation, which is why `yv4z`'s flat
timing series across six observations predicted nothing. `yv4z` proposes a
`--wait` flag for this script; **a clock is the wrong instrument.** The merge
ref answers deterministically.

## Why the probe belongs here specifically

`git ls-remote origin 'refs/pull/*/head'` finds the PR number for a sha, and
`refs/pull/N/merge` then answers mergeability — **with no token**. The script
already shells out to `git` for `resolveCommit` and `isPushed` while its runs
query needs `GITHUB_TOKEN`, so the probe still answers in precisely the
degraded case where the API path returns `COULD NOT ASK`.

## Done when

- [x] The script never states "the event was dropped" as fact where it cannot
      distinguish that from "not started yet"
- [x] A conflicted head is reported as its own state, with "resolve the base"
      rather than "dispatch" — no path prints the unsafe advice for it
- [x] The probe is token-free, so it still answers when the runs API cannot
- [x] Tests feeding it each state, including one that would have produced the
      old overclaim
- [x] The header's three-state table covers the new state rather than being
      left describing a shape the code no longer has


---

## Summary of Changes

`mergeStateForHead` in `check-head-has-run.ts` asks WHY a pushed head has no
run, instead of asserting one. Four answers, and only one of them is a known
cause:

| state | meaning | advice |
|---|---|---|
| `conflicted` | no `refs/pull/N/merge` is published | merge the base in. **Never dispatch** |
| `mergeable` | a run is owed and unexplained — this IS `3pqn` | dispatching is safe here |
| `not-a-pr-head` | no open PR has this sha, so nothing was owed | open the PR |
| `unknown` | the probe itself failed | check by hand, assume nothing |

**Token-free, and that is the design point.** `refs/pull/*` is served to anyone
who can clone, so the probe answers in exactly the degraded case where the runs
API returns `COULD NOT ASK` for want of `GITHUB_TOKEN` — which is when an
operator is most alone with an absence.

## Why `yv4z`'s proposed `--wait` was the wrong instrument

That bean asks for a poll-to-timeout so the script can say `dropped` or `could
not determine` honestly. But a clock cannot separate *"will never run"* from
*"has not run yet"*: `pull_request` latency measured **7 s and 2 m 43 s within
one hour** on this repository. That twenty-fold spread is why `yv4z`'s own flat
timing series across six observations predicted nothing. The merge ref is
deterministic where the clock is noise, so the script reads the ref.

## `noRunAdvice` is a pure function on purpose

Same reason `reconcile()` was extracted in `check-bean-front-matter` under
`t6s7`: **the conflicted branch could not be reached by any test while it lived
inline**, because reaching it needs a live forge holding a PR that is open and
conflicted at the same moment. A message nothing can execute is a message
nothing checks — and this one was both wrong and dangerous for however long it
stood.

## Four mutations, each caught

| mutation | tests failing |
|---|---|
| the original overclaim + dispatch advice restored | **4** |
| a failed probe reported as `conflicted` | 1 |
| an absent merge ref read as `mergeable` | 1 |
| the conflicted case told to dispatch anyway | 1 |

22 tests pass; the 14 already there are untouched. `bun run gates` 100/100.


---

## The sibling half had BOTH defects, and one stopped it working entirely

Found 2026-09-21 by running `check:ci-health` rather than by looking for it:
**`PRs without checks` had failed 5 consecutive times with no success in the
window.** The workflow whose whole job is to find pull requests with no checks
was itself failing, hourly, unnoticed — `1xhc` at full strength.

`.github/workflows/pr-checks-present.yml` is the automated half of this same
bean. Its own header says so: *"`check:head-has-run` answers this for one
commit when somebody remembers to look; this is the half that looks when nobody
does."* So it is in scope here rather than a separate topic.

### 1. It fed `gh` a status word where a PR number belonged

```
no pull requests found for branch "no-run"
##[error]Process completed with exit code 1.
```

The sweep prints `  ✗ #731   no-run   751: adopt spec-kit…`, and with awk's
default field splitting that is `$1="✗"`, `$2="#731"`, `$3="no-run"`. The step
read **`$3`**. Verified against real output rather than by counting columns:

```
OLD ($3): no-run
NEW ($2): 731
```

**So the per-PR comment channel has never worked** — one of the two channels
the owner explicitly chose on 2026-09-20. The tracking-issue step runs before
it and succeeds, so the failure was invisible in the place people look.

### 2. It broadcast the SAME unsafe advice, to PR authors

Its comment body carried, verbatim, what this bean removed from the script:

> Dispatch the workflow against this ref and read that run instead.

Unconditional, posted onto the pull request. **Worse than the script's copy**,
because the script printed it to whoever ran a command while this publishes it
to the author of every affected PR.

Now it asks `gh pr view --json mergeable` before advising, and only the
`MERGEABLE` branch mentions dispatching at all. Rendered and checked for all
three states, because the file's own comment warns that these lines sit inside
a YAML block scalar and the dedent is load-bearing.

### A live finding the bug was suppressing

**PR #731 has no run on its head**, and `refs/pull/731/merge` is present — so
it is mergeable, and its missing run is the genuine unexplained `3pqn` case
rather than the conflict case. That is precisely the distinction
`mergeStateForHead` was built to draw, confirmed against a real PR neither
half was reporting.

