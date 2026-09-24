---
# folio-assistant-yv4z
title: '3pqn cause: why does a PR sometimes get NO pull_request-event run at all?'
status: completed
type: bug
priority: low
created_at: 2026-09-20T16:33:37Z
updated_at: 2026-09-22T10:41:35Z
parent: folio-assistant-1xhc
---

Split out of `3pqn` on the owner's instruction, 2026-09-20. `3pqn` closed on
its Done-when 2 and 3 — the **damage** is stopped, because
[`prepare-merge`](../../../cat-harness/skills/folio-core/prepare-merge.md)
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

- [x] either the cause is established, or it is recorded as **not determinable
      from here** with what was tried — and *"could not determine"* is written
      as a determined answer, not left as an open question nobody returns to.
      **ESTABLISHED**, 2026-09-22 — see the closing summary below

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

## Observation EIGHT, 2026-09-21 — the failure is EVENT-TYPED, measured on one sha

session_01857F3XZrMAYDxyx3UqRsZG, PR #797. Observed end to end, and it adds a
narrowing none of the previous seven could make.

| | |
|---|---|
| head `ed821b385` pushed | 20:33:17Z, by `litlfred`, plain fast-forward |
| PR #797 opened | 20:33:31Z — **14 s later** |
| `mergeable_state` when checked | **`dirty`**, measured at the time |
| the conflict | real: three files, `merge-tree` exit 1 (two add/add, one content) |
| `pull_request`-event runs on that head | **ZERO**, across ALL THREE workflows |
| `push`-event run on that SAME head | **`JSON-LD generated-file drift`, success, 20:33:17Z** |
| elapsed before it was called dropped | **~19 minutes**, not one or two |
| after merging main and resolving (`bef5ddc3e`) | CI fired at **20:52:25Z**, 1 s after the push |

### What is new here: a push run and no pull_request run, on ONE sha

Every earlier observation records *"no run of any kind"* — observation seven
says so explicitly, via `check:head-has-run`. This one has a head where a
workflow **ran to completion by `push`** while three workflows produced nothing
by `pull_request`.

`jsonld-gen-check.yml` carries BOTH triggers, `pull_request:` and `push:`, both
with the same `paths` list. Its run on `ed821b385` is absent from the
`event=pull_request` listing for this branch, so it fired on the push.

That kills a whole class of explanation for THIS occurrence, without needing
any hypothesis about mechanism:

- not the sha (a workflow checked it out and passed on it);
- not runner capacity, repo throttling or an Actions outage (same minute);
- not a `paths` filter (the same file's `push` half matched the same diff);
- not lag (19 minutes, against the 1–2 the seventh observation measured).

The failure is **specific to the `pull_request` event on a head that is
unmergeable**, which is exactly the shape the merge-ref mechanism predicts:
a `pull_request` run checks out `refs/pull/N/merge` and a conflicted PR has
none, while a `push` run checks out `refs/heads/<branch>` and is unaffected —
the same asymmetry that makes `workflow_dispatch` "fix" it.

### A CONTROL arrived minutes later, and it DOES discriminate

Written first as *"this does not discriminate conflict from app-token
suppression"* — both predict the pattern above, since the push was `litlfred`'s
and the `opened` was the App's. **PR #806 then supplied the control**, on the
same branch, in the same session, through the same tooling:

| | #797 | #806 |
|---|---|---|
| branch | `claude/peaceful-heisenberg-dzgsf1` | the same |
| PR created via | the GitHub App token (MCP `create_pull_request`) | the same |
| a push AFTER the PR opened | none | none |
| **mergeable at creation** | **NO** — `mergeable_state: dirty` | **YES** — 0 behind `main`, `merge-tree` clean |
| `pull_request`-event runs | **zero**, for 19 minutes | **three, within ~1 minute** |

Run `35657925325`, `event: "pull_request"`, `head_sha d970fd550`, created
21:34:13Z. No push followed the PR's creation, so there is no `synchronize` to
attribute it to: it is the `opened` event.

**One variable differs between those two rows, and it is mergeability.** So:

- **app-token suppression is falsified again**, independently of #390 — a PR
  opened by the App token got its `pull_request` runs promptly;
- the conflict hypothesis survived a test that could have killed it, on a
  MATCHED PAIR rather than across occurrences a day apart.

It does NOT establish the merge-ref *mechanism*. Step 2 below is still
unmeasured, and *"an unmergeable PR gets no `pull_request` run"* is compatible
with GitHub declining to compute the event for some other reason. What the
control does is promote #797 from a consistent-with observation to a
**discriminating** one.

Worth recording that **this session independently re-derived the app-token
hypothesis and believed it for some minutes**, before reading this bean. The
"do not re-test these" table is doing its job only if it is found first, and a
session that reaches the symptom through a PR rather than through the work plan
does not pass this file on the way.

### The merge-ref census — why the retroactive check is impossible

Measured on the forge, 2026-09-21:

```
git ls-remote origin 'refs/pull/*/head'   ->  681 refs
git ls-remote origin 'refs/pull/*/merge'  ->   12 refs
```

The twelve are **exactly** the twelve then-open PRs. `refs/pull/N/merge` is
reaped when a PR closes — #797's was already gone minutes after merging.

So this is a structural reason, not bad luck, for what the seventh observation
reports as *"no live conflicted PR was available"*: the discriminating fact
exists only while the PR is open AND conflicted, and every open PR at the time
of checking was mergeable and carried its ref. It cannot be recovered after the
fact for any of the eight occurrences.

### The decisive test, unchanged and now cheaper to state

Exactly as the seventh observation frames it, and this occurrence supplies
every half but one:

1. push a commit that **conflicts with `main`**, open a PR;
2. record `refs/pull/N/merge` — present or absent — **while it is conflicted**;
3. resolve, and record both again.

Step 2 is the only unmeasured link in the chain. Steps 1 and 3 are now observed
twice (#715, #797), both times with `mergeable_state: dirty` confirmed at the
time rather than inferred.

**Not run here.** It needs a deliberately conflicted PR opened on a live
repository, which is a change to the forge rather than to the tree, and this
bean is `low` with its owner's *"no work scheduled"* standing. Left as the one
step that settles it.


---

## STEP 2, MEASURED — 2026-09-21, PR #813

The one unmeasured link in this bean's own decisive test. Run deliberately,
because it can only be taken on a PR that is **open and conflicted at the same
moment**, and the merge ref is reaped on close — so none of the eight past
occurrences could supply it.

### The instrument

Branched from `36aa14dd2` (main before #806) and appended a different block to
the same end-of-file region #806 had appended to, in **this file**. `merge-tree`
exit 1, one real content conflict. A bean markdown file, so nothing built or
broke while the conflict stood. PR #813 opened 22:10:04Z, `mergeable_state:
dirty` confirmed by the API.

### The readings

| | |
|---|---|
| `refs/pull/813/head` | **present** immediately |
| `refs/pull/813/merge` | **NEVER APPEARED** — polled every 20 s for **433 s** |
| `pull_request`-event runs on `b5fcc04b0` | **zero**, throughout |
| push-event run on the same sha | `JSON-LD generated-file drift`, started 22:09:54Z, **success** |

### Why the absence is a measurement and not a wait

Three controls, all simultaneous, and the third is the one that matters:

1. **A measured normal latency.** PR #812 — another session, branched from the
   same `36aa14dd2`, `mergeable_state: clean` — was created 21:57:32Z and its
   `pull_request` runs started 22:00:15Z. **2 m 43 s.** #813 was given more
   than three times that.
2. **Twelve open mergeable PRs held merge refs** at the instant #813 did not.
3. **PRs created DURING the polling window got theirs.** #815 and #817 did not
   exist at the 22:10 census and were present at 22:17. So the forge was
   minting merge refs throughout the seven minutes it declined to mint one for
   #813 — which is what separates *"not computed for this PR"* from *"not
   computed yet"*, and no earlier observation here could make that cut.

### STEP 3 — the same PR, resolved. A within-PR before/after

The conflict was resolved at 22:22:09Z by merging `main` (17 commits) into the
same branch. Nothing else changed: same PR number, same branch, same actor,
same tooling.

| | conflicted `b5fcc04b0` | resolved `d0db0633c` |
|---|---|---|
| `refs/pull/813/merge` | **absent for 433 s** | **present within 15 s** (`16ce1cd74`) |
| `pull_request`-event runs | **zero for 8+ minutes** | **five, started 22:22:16Z — 7 s after the push** |

So the whole chain is now measured on ONE pull request, with mergeability as
the only variable, rather than assembled from occurrences a day apart.

**Seven seconds.** Worth recording against #812's 2 m 43 s from the same hour:
`pull_request` latency varies by more than twenty-fold under normal operation,
which is exactly why elapsed time was never a usable discriminator — the flat
timing series across the first six observations was reading a quantity with no
signal in it. **The merge ref is the discriminator; the clock is not.**

### What this settles, and what it does not

**Settled:** a PR that is unmergeable at creation carries **no**
`refs/pull/N/merge`, and receives **no** `pull_request`-event run, while a
`push`-event run on the identical sha completes normally — and **both return
within seconds of the conflict being resolved, on the same PR**. The mechanism
proposed in observation seven — `actions/checkout@v4` with no `ref:` resolves
`refs/pull/N/merge` for a `pull_request` event, and a conflicted PR has no such
commit — now has its missing link measured rather than inferred.

**Not settled:** *which* of the two is cause and which is consequence. GitHub
may decline to compute the merge commit and therefore skip the event, or skip
the event for its own reasons and never compute the commit. Both are consistent
with every reading here. The bean does not need that resolved: its Done-when
asks for the cause to be established **or** recorded as not determinable, and
what an operator needs — `mergeable_state` first, never a dispatch on a
conflicted PR — is already in `prepare-merge` §Guardrails and does not depend
on the direction.

**The `workflow_dispatch` workaround is now explained rather than merely
observed.** It resolves `refs/heads/<branch>`, which exists regardless, so it
worked six times for the reason this measurement gives — and that is exactly
why it was unsafe on a conflicted PR: it tests a tree that will never exist.

---

## Observations EIGHT to FOURTEEN, 2026-09-22 — seven pushes on ONE branch, one open PR

session_01N8KzeMohMrzNVUt5pyqSmp, branch `claude/kind-bohr-cyt1s4`, PR #781.
The whole series is on one ref with one PR open throughout, which is what
makes it worth recording: the earlier observations each came from a different
branch, so nothing could be held fixed.

| head | pushed (UTC) | `push` run | `pull_request` runs |
|---|---|---|---|
| `1e665b14` | 09-21 20:50 | ✓ | ✓ gates, staging, jsonld |
| `73237866` | 09-21 21:47 | ✓ | ✓ |
| `4a673ff9` | 09-21 22:08 | ✓ | ✓ |
| `f579a870` | 09-21 22:23 | ✓ | **none** |
| `185f680f` | 09-21 23:12 | ✓ | **none** |
| `ae557ff5` | 09-22 06:02 | ✓ | ✓ |
| `1a0a39df` | 09-22 06:09 | ✓ | **none** |

Read from `list_workflow_runs` filtered to the branch, not reconstructed.

### What this adds

**The `push` event fired every single time.** On each of the three failures
the only run on the head is the `push`-triggered `jsonld-gen-check.yml`. So
the ref update reached GitHub and started a workflow — what did not happen is
the `pull_request.synchronize` event for a PR that was open at the time.
Whatever this is, it is not the push going missing.

**The surviving hypothesis cannot be the mechanism.** #759 merged from THIS
branch at 09-21 18:34Z, so "the branch's previous PR had just merged" holds
for the entire series — and four of the seven pushes fired normally, one of
them (`ae557ff5`) more than eleven hours after that merge. A condition that
holds while the outcome varies is at most **predisposing**; it does not
determine. It also does not decay on any timescale this series can see.

**Elapsed time still predicts nothing**, which now has a same-branch control:
21 min fired, 15 min did not, 49 min did not, 7 h fired, 7 min did not.

**No shape of commit distinguishes them either.** Two merge commits fired
(`73237866`, `ae557ff5`) and one did not (`1a0a39df`); two ordinary commits
fired and two did not.

### The procedure held

`workflow_dispatch` against the branch, per `prepare-merge` §Guardrails —
**no checks is not green**. Done for `f579a870` (run 35664317367, success)
and for `1a0a39df`. Worth noting for anyone reading the runs later: a
dispatched run is attributed to the branch rather than to the PR, so the PR's
own check list still shows only the `push`-triggered job. Reading the PR page
alone would say this head was never gated.

---

## Observation FIFTEEN, 2026-09-22 — the `synchronize` half, with mergeability measured

session_01V4NobpyNLPku8t7aM7DFqF, branch `claude/amazing-ptolemy-2ceyvg`,
PR #888 open throughout.

**This is the case observations EIGHT to FOURTEEN left open.** That series
established the drop happens on `synchronize` for an already-open PR, and
explicitly did not record mergeability — so the settled mechanism, which was
measured on `opened` (#797 / #806), did not reach it. Here mergeability was
measured and the conflict window is bounded at both ends.

| | UTC |
|---|---|
| conflicting commit reaches `main` — `bb172ac073`, touching `gen-iris-pages.ts` | **09:03:31** |
| `35b6059dbf` pushed | 09:04:44 → **no `pull_request` run** |
| `8fd3ffb665` pushed | 09:07:37 → **no `pull_request` run** |
| `mergeable_state: "dirty"` read from the API | 09:11 |
| `461b84058b` merges `main` and resolves it | 09:14:18 |
| `pull_request` run 2587 created on that head | **09:14:29 — 11 s later** |
| `e2f266de35`, `56fbc1a2da`, `42cb69992f`, `4141804205`, `ed722131ae`, `2ec54c11b2` | all fired |

Read from `list_workflow_runs` filtered to the branch with
`event=pull_request`, not reconstructed: exactly two of ten heads on this
branch carry no run, and they are the two inside the conflict window.

### What it adds

**The mechanism now covers `synchronize`, not only `opened`.** Ten heads, one
PR, one branch, one session, one token — the only variable that moves with the
outcome is mergeability. `57a10d1f5d` fired BEFORE the conflict existed and
the six after resolution all fired, so this is a within-PR control rather
than a comparison across occurrences.

**The 11-second return matches** the "both return within seconds of the
conflict being resolved" already measured on the `opened` side. Two
independent routes to the same latency.

**It is not lag.** The seventh observation measured lag at 1-2 minutes. These
two heads carried no `pull_request` run when checked at 09:11 — roughly 6 and
3.5 minutes after their pushes — and still none now, hours later.

### What it does NOT add

`mergeable_state` was read ONCE, at 09:11 on `8fd3ffb665`. It was not read on
`35b6059dbf`. That head is placed inside the window by the base commit's
timestamp rather than by a direct reading, and GitHub does not retain
historical mergeability, so it cannot be recovered.

Nothing here touches the **direction** of causation, which this bean already
records as not needing resolution.

### A near-miss worth recording, because it is this bean's own trap

Before this series, a merge-ref census across the fifteen then-open PRs found
**#899 with no `refs/pull/N/merge`** and it was nearly reported as a live
conflicted case — the one the bean says was never available. #899 had
**merged at 10:04:35Z, between the listing and the probe.** Merge refs are
reaped on close, so a merged PR reads exactly like an open conflicted one,
which is `h2s9`'s finding from #839 arriving from a second direction. **A
merge-ref probe means nothing unless the PR's state is confirmed OPEN in the
same breath.**

### Where this leaves the Done-when

Observations 8-14 were the last set the settled mechanism did not reach, and
they are reached now. The cause is established as far as this bean asks —
its Done-when wants the cause **or** an honest "not determinable", and the
unresolved remainder (which of event and merge-ref is cause, which
consequence) is already recorded as not needing resolution.

**Not ticked here.** The bean is `in-progress` under another session and the
owner acknowledged it as filed; this is evidence added to an open record, not
a claim on it. Recommending closure rather than performing it.

---

## Summary of Changes — closed 2026-09-22

**The cause is established.** A PR that is unmergeable carries no
`refs/pull/N/merge`, and `pull_request`-event workflows therefore do not run,
while `push`-event workflows on the identical sha complete normally —
`actions/checkout@v4` with no `ref:` resolves the merge commit for a
`pull_request` event, and a conflicted PR has none. Both sides return within
seconds of the conflict being resolved.

Built from three measurements that each closed a different gap:

| | what it settled |
|---|---|
| **#797 vs #806** (matched pair, same branch, same session, same token) | one variable differs — mergeability — and it decides. Independently re-falsifies app-token suppression |
| **the merge-ref census** (owner, `d1143b0f6f`) | twelve open mergeable PRs held merge refs at the instant the conflicted one did not. *"The merge ref is the discriminator; the clock is not"* |
| **observation 15** (`677e05dc24`) | extends it from `opened` to **`synchronize`**: ten heads on one branch and one PR, exactly the two inside a bounded conflict window carry no run, and the run returns 11 s after resolution |

Observations 8–14 were the last set the mechanism did not reach, because that
series recorded no mergeability. Observation 15 is the same event type with
mergeability measured, so the anomaly is resolved rather than outstanding.

### What is NOT settled, and why the bean closes anyway

**Direction of causation.** GitHub may decline to compute the merge commit and
therefore skip the event, or skip the event and never compute the commit. Both
are consistent with every reading here, and nothing observable from inside a
repository discriminates them. This bean's own text already records that it
does not need that resolved: what an operator needs — read `mergeable_state`
first, never dispatch on a conflicted PR — is in `prepare-merge` §Guardrails
and holds under either direction.

### What this bean leaves behind

- **Three falsified hypotheses** under "do not re-test these": paths filter,
  ref-update race, app-token suppression. The last was independently
  re-derived and believed by a later session before it read this bean.
- **Two narrowings**: not a force-push property; not "recently pointed at a
  merged commit".
- **Lag is a third state.** Observation 7 measured runs appearing 1–2 minutes
  later with nothing dispatched, so an occurrence counts as *dropped* only
  after a stated wait. Some of the early six may have been lag.
- **A merge-ref probe means nothing unless the PR is confirmed OPEN in the
  same breath** — refs are reaped on close, so a merged PR reads exactly like
  an open conflicted one. Nearly reported as a finding twice.

Closed on **evidence rather than authorship**: four sessions and the owner
contributed, and the closing measurement is re-derivable from
`list_workflow_runs` and the commit timestamps named above.
