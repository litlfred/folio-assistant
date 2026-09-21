---
# folio-assistant-yv4z
title: '3pqn cause: why does a PR sometimes get NO pull_request-event run at all?'
status: in-progress
type: bug
priority: low
created_at: 2026-09-20T16:33:37Z
updated_at: 2026-09-21T14:06:54Z
parent: folio-assistant-1xhc
---

Split out of `3pqn` on the owner's instruction, 2026-09-20. `3pqn` closed on
its Done-when 2 and 3 — the **damage** is stopped, because
[`prepare-merge`](../../cat-harness/skills/folio-core/prepare-merge.md)
§Guardrails now says *"NO CHECKS IS NOT GREEN"* and gives the procedure. This
bean carries the remaining **why**, at low priority, with the evidence
attached so nobody re-derives it.

## The observation, six times

A push, a PR opened shortly after, and **no `pull_request`-event run ever
fires for that head**. The newest run on the branch is for the *previous*
head — usually the commit the branch's last PR had just merged. Every time,
the fix was `workflow_dispatch` against the branch.

## Three hypotheses, all FALSIFIED — do not re-test these

| hypothesis | how it died |
|---|---|
| a `paths` filter excluded the diff | `feature-staging.yml` lists its own path and #340's diff edited exactly that file; `code-quality-gates.yml` has `pull_request:` with **no filters at all** |
| a race between the ref update and `pull_request.opened` | the timing series is **flat**: 52 s fail, ~45 s pass, 30 s fail, 13 s pass, seconds fail, seconds fail. Shorter gaps have both passed and failed. **Elapsed time predicts nothing** |
| GitHub suppresses events authored by the app token | guessed after #383 and falsified by #390 within fifteen minutes |

Two further narrowings from the observations:

- **It is not a force-push property.** #409 and #552 were plain fast-forwards
  (`git push -u`, no `--force`); `git merge-base --is-ancestor` confirmed the
  old tip was an ancestor of the new head. The original title says
  "force-push", and a reader filtering for that will not recognise their case.
- **"The branch had recently pointed at a merged commit" does not hold
  either.** That hypothesis came from #409, whose branch had been reset to
  `origin/main`. #552's branch was merged forward normally and carried
  unmerged commits continuously.

**What survives all six:** the branch's previous PR had **just merged**. That
is a property of the pull-request sequence on one ref, not of the push. Stated
as the surviving hypothesis, not a finding — the correct test is to open a PR
on a freshly-created branch name whose predecessor did not just merge, and
compare.

---

## Observation SEVEN, 2026-09-21 — and it refines the surviving hypothesis

session_01AYHimvYMmf8h8e9fFN6dW5, PR #715, observed end to end rather than
reconstructed.

| | |
|---|---|
| head `fa87e3cbfc` pushed | 13:19Z |
| PR #715 opened | 13:19:48Z |
| `pull_request` runs for that head | **zero**, confirmed via the runs list — the newest run on the branch was for the PREVIOUS head |
| `mergeable_state` when checked | **`dirty`** |
| conflicting commit `fdb5097f4e` reached main | **12:52:22Z — 27 minutes BEFORE the PR was opened** |
| after merging main and resolving (`c4abe241ea`) | CI fired **immediately**; five checks, all green |

So the PR was **unmergeable at the moment it was created**, and this is the
first observation in this bean where that was measured rather than inferred.

### The refinement: "previous PR had just merged" looks like a CORRELATE

This case satisfies the surviving hypothesis too — #704 merged at ~13:06,
shortly before. But it also satisfies a narrower one that supplies a
**mechanism**, which the surviving hypothesis does not:

> `code-quality-gates.yml` is `on: pull_request:` and uses
> `actions/checkout@v4` with **no `ref:`**. For a `pull_request` event that
> default is `refs/pull/N/merge` — the merge commit GitHub computes between
> head and base. **A conflicting PR has no such commit.**

And the two hypotheses are linked rather than rival: *the previous PR merging*
moves `main`, which is exactly what makes the next PR from a branch cut earlier
conflict. The correlate has a causal path to the proposed cause.

**It also explains the one fact every previous observation shares and none of
them accounts for: `workflow_dispatch` always fixed it.** A dispatch run
resolves `refs/heads/<branch>`, not the merge ref, so it is unaffected by a
conflict. Six times the workaround worked, and the reason it worked is evidence
about the cause.

### What was NOT tested, stated so nobody reads this as settled

- **No live conflicted PR was available to test the merge ref directly.** All
  seven open PRs had `refs/pull/N/merge` present; #715's was already gone
  because it had merged, so that check could not discriminate. The claim that
  an unmergeable PR has no merge ref is **the mechanism this observation is
  consistent with, not something measured here.**
- **The six earlier observations were not re-checked for conflict.** GitHub
  does not retain historical mergeability, so #340, #383, #390, #409 and #552
  cannot be confirmed or refuted retroactively.

### The test that would settle it

Cheaper and sharper than the one this bean proposes. On any branch: push a
commit that **conflicts with `main`**, open a PR, and record whether a
`pull_request` run fires and whether `refs/pull/N/merge` exists. Then resolve
the conflict and record both again. One PR, two observations, and it
discriminates conflict from "previous PR just merged" directly — the second
half of that is already observed here.

### One thing DID change in the guardrail, and it stands whatever the cause

`prepare-merge` §Guardrails said: no run for that sha → dispatch the workflow.
That is right for a mergeable PR and **actively unsafe for a conflicted one**,
and this is independent of whether the conflict hypothesis is correct:

> A `workflow_dispatch` run resolves `refs/heads/<branch>`, so it tests **the
> branch, not the merge result.** On a conflicted PR that is a green signal for
> a tree that will never exist — worse than the absence it replaced.

So a **step 0** was added: read `mergeable_state` first, and when it is
`dirty`, merge the base branch in rather than dispatching. The workaround is
now scoped to the case it was measured on.

*The cause is recorded as a refinement of the surviving hypothesis, not as a
finding. The guardrail change does not rest on it — `3pqn` closed the harm and
nothing here reopens it.*

## Why this is LOW priority

The harm is closed. An agent that follows the guardrail cannot read zero
checks as green any more, and the dispatch workaround takes one call. What
remains is understanding, and it looks GitHub-side — six observations from
inside the repository have not isolated it, and three plausible mechanisms are
already dead.

## Done when

- [ ] either the cause is established, or it is recorded as **not determinable
      from here** with what was tried — and *"could not determine"* is written
      as a determined answer, not left as an open question nobody returns to

## Where the rest lives

`3pqn` holds the six observations in full, with dates, shas and timings.


## OWNER: **"yv4z: ok"**, 2026-09-20

Acknowledged as filed — low priority, no work scheduled. Its value is the
record of what NOT to re-test: three falsified hypotheses (paths filter,
ref-update race, app-token suppression), two narrowings (not a force-push
property; not "recently pointed at a merged commit"), and a flat timing series
across six observations.

Left open deliberately rather than closed. Its Done-when allows *"not
determinable from here"* as a **determined** answer, so whoever next hits this
can close it honestly without having solved it — which is the outcome this
bean expects.


---

## Observation seven, 2026-09-21 — and it narrows the claim rather than confirming it

PR #601 merged on `claude/lhs-navbar-harness-folios-cqo9mu`; the branch was
restarted from `origin/main`, a commit pushed (`5f80b5cd`), and PR #644 opened.
`check:head-has-run` reported **no run of any kind**. A second push after
merging main in (`e6890728`) reported the same, ~20 s after pushing.

**It matches the surviving hypothesis exactly**: the branch's previous PR had
just merged. That is now seven for seven.

**But the runs APPEARED, with no `workflow_dispatch`.** Polled until they
showed: roughly one to two minutes after the push, both `Code-quality gates`
and `Feature Staging` were present on `e6890728` (`in_progress` and `queued`).
Nothing was dispatched and nothing was re-pushed in between.

So **this occurrence was LAG, not a dropped event**, and that distinction is
load-bearing for the tool as much as for the cause:

- the observation set may be contaminated. Some of the six may have been the
  same lag, observed at a moment when the operator concluded "dropped" and
  dispatched — a dispatch that then LOOKS like the fix and is
  indistinguishable from waiting. **The correct test now needs a wait** before
  it counts an occurrence: poll to a stated timeout, and only then call it
  dropped;
- **`check:head-has-run` states the wrong thing with confidence.** Its body
  already says *"a pull request carrying zero checks looks exactly like one
  whose checks have not started"* — and its headline then asserts
  *"It IS pushed, so this is bean `3pqn`: the event was dropped."* Those are
  the same third-state failure this repository names everywhere else: it
  cannot tell `dropped` from `not yet`, so it must say so rather than pick.
  A `--wait` (poll to a timeout, then report `dropped` or `could not
  determine`) would make its answer honest without changing what an operator
  does about it.

Recorded here rather than as a new bean: this is evidence on the open question
this bean exists to hold, and a duplicate would split the six observations
from the seventh.


**And the refutation is cleaner still**: at 05:40Z a `check_suite.completed`
event arrived for **`5f80b5cd`** — the very head `check:head-has-run` had
reported as having *"NO workflow run of any kind"* and attributed to a dropped
event. That head did not merely acquire runs late; it **finished** them. Both
heads in this occurrence lagged, and the tool was wrong about both.

---

*Claimed 2026-09-21T14:0xZ by session_01AYHimvYMmf8h8e9fFN6dW5.* **This claim is pushed BEFORE the work**, not after it.

Two beans were duplicated in this session today (`yl5w`, `lps0`) because a claim
is branch-local and invisible to siblings until a commit carrying it exists on
the forge. `bean-coordination` states that limit; what today measured is that
running the pre-claim check faithfully does not close it — both times the check
was clean and a sibling was already mid-build. Pushing the claim first is the
one mitigation a single session can apply.

*Issue link, recorded on creation.* **[#723](https://github.com/litlfred/folio-assistant/issues/723)**


---

## Step 2 of the decisive test — IN PROGRESS

This block exists to CREATE a conflict against `main`, which already carries a
different block at exactly this position. It is the instrument, not a finding:
`yv4z`'s step 2 asks whether a PR that is unmergeable AT CREATION carries
`refs/pull/N/merge`, and that can only be measured on a PR which is open and
conflicted at the same moment. Every open PR checked so far was mergeable.

Replaced by the measurement once taken.
