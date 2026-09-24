---
# folio-assistant-3pqn
title: A force-push followed immediately by opening a PR produces a PR with zero checks
status: completed
type: bug
priority: normal
created_at: 2026-09-19T08:11:21Z
updated_at: 2026-09-20T16:34:05Z
parent: folio-assistant-1xhc
---

OBSERVED TWICE, 2026-09-19, on `litlfred/folio-assistant`.

- **#340**, head `e0e3b4b8`: no `pull_request`-event run ever fired. The newest run on the branch was for `42efd043`, the commit the previous PR had squash-merged.
- **#349**, head `059cf9e1`: identical. Newest run was `5afe1f0a`, again the merged predecessor.

Both times the sequence was: `git push --force-with-lease`, then open the PR seconds later. Both times all checks had to be produced by hand with `workflow_dispatch` against the same commit.

**It is not a paths filter.** `feature-staging.yml` lists `.github/workflows/feature-staging.yml` among its `paths`, and #340's diff edited exactly that file. `code-quality-gates.yml` has `pull_request:` with no filters at all.

**Counter-evidence that isolates the timing:** a NORMAL push to an open PR (#349, merge commit `08d304b4`) fired all seven checks immediately. And after waiting ~45s between the force-push and opening the PR, #354 and #356 both picked up their full check set. So the trigger appears to be the race between the ref update and the `pull_request.opened` event, not anything in the workflow config.

## Why it matters more than it looks

**A PR carrying zero checks is visually indistinguishable from one whose checks have not started.** Both render as no status. The `xom7` bean is the same shape one layer down — a workflow failing invisibly — and the remedy there was to make the state legible rather than to trust that somebody would notice. Here, an agent or a human who merges on "nothing red" merges unverified.

I caught it only by checking twice and comparing against the workflow-run list.

## Done when

- [ ] the cause is established (GitHub-side race vs. something this repo controls)
- [ ] whatever the cause, a PR with NO check runs on its head is reported as such, not read as green — the third state, as everywhere else here
- [ ] if the workaround is procedural (settle between push and PR-open), it is written in the skill that governs opening a PR, not left as folklore

_2026-09-19T10:15:56Z_ — Two more observations, 2026-09-19, and one is COUNTER-EVIDENCE to the timing hypothesis.

- #383, head 1bbe12b20: force-with-lease push, PR opened ~52s later. ZERO pull_request runs — only a push-triggered jsonld check. Had to workflow_dispatch code-quality-gates and feature-staging by hand.
- #390, head 18a60583b: force-with-lease push, PR opened ~13s later. FULL check set fired automatically on pull_request.

So the shorter gap worked and the longer one did not, which is the opposite of what a ref-update/opened race predicts, and the opposite direction from the ~45s finding on #354/#356. Whatever the cause is, elapsed time alone does not predict it — four observations now, and no monotonic relationship.

I had independently guessed 'GitHub suppresses events authored by the app token' after seeing #383, and #390 falsified that within fifteen minutes. Recording both the wrong guess and its falsification so the next agent does not re-derive it.

What is NOT in doubt, and is the part worth acting on: a PR with zero checks renders identically to one whose checks have not started, so 'nothing red' is not evidence of anything. Verify against the workflow-run list (actions_list on the workflow, filtered by branch) and compare head_sha, rather than reading the PR page.

_2026-09-19T11:48Z_ — FIFTH observation, and the first that was **not a force-push**, which narrows this.

- **#409**, head `678065a99`. Only the push-triggered `.jsonld` check fired; no `pull_request` run for that sha at all. The newest `code-quality-gates` run on the branch was for `ca62e8892` — the commit the PREVIOUS PR (#399) had merged, exactly the #340/#349/#383 pattern. Fixed by `workflow_dispatch` against the branch, as before.

**The new evidence: this was a plain fast-forward push.** `git push -u` with no `--force`, and `git merge-base --is-ancestor ca62e8892 678065a99` returns true, so the old remote tip is an ancestor of the new head — no history was rewritten. Every prior observation in this bean was a `--force-with-lease` push, so the title ("A force-push followed immediately by…") is **too narrow** and a reader filtering for force-pushes will not recognise their own case. Not renaming it here, since it is not my bean; flagging it because the title is what the next agent greps.

Timing, added to the four already recorded: push 11:44:03Z, PR opened ~11:44:30Z, so **~30 s**. The series is now 52 s fail, ~45 s pass, 30 s fail, 13 s pass, seconds fail — which continues to show no monotonic relationship and is further counter-evidence to a ref-update/opened race.

One hypothesis this observation is consistent with and the bean has not recorded: the branch had just been **reset to `origin/main` and force-updated locally** (`branch: Reset to origin/main` in the reflog at 11:33:42Z) after its previous PR merged, so the PUSH was a fast-forward but the branch had very recently pointed at a merged commit. #340, #349 and #383 all also opened a PR on a branch whose predecessor had just merged. That is a property of the BRANCH's recent history rather than of the push, and it would explain why elapsed time predicts nothing. Stated as a hypothesis, not a finding — I have not tested it, and the correct test is to open a PR on a freshly-created branch name and compare.

What is unchanged and is the part worth acting on: a PR with zero checks renders identically to one whose checks have not started, so "nothing red" is evidence of nothing. Verify with `actions_list` on the workflow and compare `head_sha` against the PR's head.

_2026-09-19T11:50Z_ — SIXTH observation on #409, and it contradicts this bean's own counter-evidence.

The note above records #409's PR-open getting no run. I then pushed a second commit (`d87c66031`) to the **already-open** PR — the case this bean explicitly recorded as WORKING:

> Counter-evidence that isolates the timing: a NORMAL push to an open PR (#349, merge commit `08d304b4`) fired all seven checks immediately.

It did not fire. No `code-quality-gates` run exists for `d87c66031` on any event, minutes later. So "a normal push to an open PR always fires" is now falsified too, and the remaining shared property across all six observations is narrower than either the push kind or the elapsed time: **every one of them is on a branch whose previous PR had recently merged**, i.e. a reused branch name.

That strengthens the hypothesis in the note above from "consistent with" to "the only property not yet contradicted". It is still untested — the test remains: open a PR on a **freshly created** branch name and push to it twice, comparing both against the run list.

One incidental result worth keeping, because it is the only thing here that is good news: the hand-dispatched run (#980, `workflow_dispatch`, `678065a99`) completed **success**, including the `readme:audit` step wired in that same commit. So `workflow_dispatch` remains a reliable workaround, and the gate it exercised is sound in CI rather than only locally.

_2026-09-19T11:58:33Z_ — SEVENTH observation, and it is the test the two notes above asked for: **a freshly created branch name**. It falsifies the reused-branch hypothesis.

PR #411, branch `claude/close-w2g5`. The branch was created new from `HEAD` (reflog: `branch: Created from HEAD` at `98144b5a8`) and **#411 is the only pull request that has ever had it as head** — `list_pull_requests` with `state=all` and `head=litlfred:claude/close-w2g5` returns exactly one row. There is no previous PR on this branch name, recently merged or otherwise. So "every one of them is on a branch whose previous PR had recently merged" does not hold: this one is not.

What happened, in the same shape as the observations above:

- push `1e05815db`, PR opened 11:53:43Z → **ZERO runs**, across ALL workflows, not just `code-quality-gates`: `list_workflow_runs` filtered to the branch returned `total_count: 0`. No staging preview either.
- Fixed by `workflow_dispatch` on `code-quality-gates.yml` with `ref=claude/close-w2g5` — run `35441434015`, against the real head `1e05815db`, conclusion success.
- Then pushed a second commit `13cf37c76` to the **already-open** PR → the `pull_request` run **DID** fire (run `35441561712`, event `pull_request`, success).

That last point cuts against the sixth observation above, which recorded a push to an already-open PR NOT firing on #409. Mine fired. So neither "a normal push to an open PR always fires" nor "it never does" survives; the behaviour is intermittent across both cases.

Where that leaves the narrowing, stated as what is left rather than as a new hypothesis: the remaining shared property across all seven is only that a PR was opened or pushed to during a window in which GitHub dropped the event. Elapsed time predicts nothing (already established above), push kind predicts nothing (fifth observation), branch reuse predicts nothing (this one), and push-to-open-PR predicts nothing (this one against the sixth). I have no better hypothesis to offer and would rather say so than invent one.

Corroborating, from the same window: another session hand-dispatched `code-quality-gates` for its own #409 at 11:52:34Z (run `35441299274`, event `workflow_dispatch`) — so two sessions hit this within ninety seconds of each other.

Unchanged and still the part worth acting on, agreeing with the notes above: **a PR with zero checks renders identically to one whose checks are green.** No red X, no failure, no pending row — just an empty list. An agent following "never merge red" merges it happily, because it is not red. The check wants to be POSITIVE — did the expected set of checks report at all on this head, with absent as a third state — rather than a search for failures.

_2026-09-19T13:00Z_ — EIGHTH observation, contributed for its **denominator** rather than as another failure.

The notes above conclude "intermittent" and offer no better hypothesis, which I
agree with. But this bean records only the cases that FAILED, so it cannot say
how often — and a rate is what turns "intermittent" from a description into
something measurable. One branch, one session, four pushes to the same open PR
inside 35 minutes, all plain `git push` with no force:

| head | `pull_request` run | verdict |
|---|---|---|
| `b095cfdf8` | run 1010 | fired |
| `684b78ad1` | run 1017 | fired |
| `fd4828efb` | run 1032 | fired |
| `412c00cd2` | **none** | dropped |
| `b55b700d1` | **none** | dropped |
| `08dfba029` | run 1045 | fired |

**4 of 6 fired, so ~33 % dropped on one branch in one sitting** — and **the two
drops are CONSECUTIVE.** (I first recorded this table as 3 of 4 / ~25 %, before
`b55b700d1`'s absence was established: its `workflow_dispatch` run 1041 existed
and I mistook that for coverage. Correcting rather than appending, since a stale
rate in a shared bean is worse than none. The lesson is the bean's own rule
applied to me: a `workflow_dispatch` run on a sha is not evidence that the
`pull_request` event fired for it, and only the latter is what a PR's checks
show.)

The adjacency is the part worth having. The seventh observation above wondered
whether the drops "cluster in windows" after two sessions hit this ninety seconds
apart; two consecutive drops inside one branch's push sequence, with three
successes before and one after, is a second independent sign of that. It also
means **~33 % is not a per-push probability** — if drops cluster, the per-push
figure is not the useful number and the window is. Established from
`list_workflow_runs` on `code-quality-gates.yml` filtered to the branch AND
`event=pull_request`, comparing `head_sha` against the PR's head — not from the
PR page, per this bean's own rule. Fixed the same way: `workflow_dispatch` with
`ref=claude/fervent-mccarthy-nw4olk`.

This is #414, on `claude/fervent-mccarthy-nw4olk` — a REUSED branch name whose
previous PR (#409) had just merged. So it is the same branch class as the first
six observations, and three of its four pushes fired anyway. That is a second,
independent reason the reused-branch hypothesis does not hold: the seventh
observation showed a fresh branch name dropping an event, and this one shows a
reused branch name firing three times in a row. The property is not the branch.

Caveat on the number, because a rate invites over-reading: n=6 on one branch in
one session gives a very wide interval, and the adjacency above means the drops
are probably NOT independent, so a single percentage is the wrong summary
statistic for them. Treat this as **"common, and clustered"** — which is the
load-bearing part, and is also what makes the workaround discipline matter:
after one dropped push, expect the next one to drop too rather than assuming it
was a one-off.

Unchanged, and agreeing with every note above: **zero checks renders identically
to green.** An agent following "never merge red" merges it happily. The check
wants to be positive — did the expected set report on THIS head, with absent as
a third state.

---

## A THIRD case, 2026-09-20 — and it breaks this bean's own framing

Observed on `#518` of this repository. **No force-push. No PR being opened.**
The pull request was already open and the pushes were ordinary.

| commit | committed | `pull_request` run |
|---|---|---|
| `f93582e52b` | 13:16:18 | yes |
| `cbfd048a1d` | 13:23:46 — **448 s later** | **none, ever** |
| `f9cb1ee08f` | 13:24:12 — 26 s after that | **none, ever** |

Re-queried hours afterwards across **all forty** `pull_request` runs on the
branch: neither commit appears. The checks had to be produced by hand with
`workflow_dispatch`, exactly as in the two 2026-09-19 cases.

**Two things this rules out.**

1. **It is not only the `opened` race.** A `synchronize` was dropped too.
2. **It is not only a race at all.** `cbfd048a1d` was pushed **seven and a
   half minutes** after the previous push — far outside the ~45 s window that
   made #354 and #356 behave. There was nothing to race.

And the consolation the bean's counter-evidence implies — that the *later* of
two rapid pushes will pick up the checks — does not hold either: the second
push, 26 s after the first, was dropped as well.

## Built: `check:head-has-run` — detection, since delivery is not ours to fix

GitHub's event delivery cannot be fixed from here. What was missing is the
fact itself: **this commit has no run**, which nobody could see. The bean's own
argument is that a PR with zero checks renders identically to one whose checks
have not started.

`scripts/check-head-has-run.ts` asks the API for runs whose `head_sha` **is
this commit** — not the branch's recent runs, which is the listing that misled
in both original cases, where the newest run was for the commit the previous
PR had merged.

Three states, and the third is the point:

| state | means | exit |
|---|---|---|
| has a run | a run names this exact `head_sha` | 0 |
| **no run** | GitHub answered, and nothing names it | 1 |
| could not ask | no remote, no network, 403, 404 | 2 |

**It nearly became the defect it detects.** The first draft reported
`deadbeef…` as *"has NO workflow run of any kind"* — an id GitHub never heard
of returns an empty list exactly as a dropped event does. The commit is now
resolved against the local repository first, and an unknown id is
`cannot-ask`. A commit that exists but is on no remote ref is reported as
**not pushed**, with that as the reason, because telling somebody GitHub lost
their event when they simply have not pushed is how a warning gets ignored.

Falsified against the real commits rather than fixtures: `cbfd048a1d` →
exit 1 *"It IS pushed, so this is bean `3pqn`"*; a fabricated sha → exit 2;
the current head → exit 0 with its two runs listed.

**Exempt from the unrun-script ratchet as a `report`, and the reason is
circularity**: a CI job asking whether this commit has a CI run has already
answered it. It exists for the moment *before* the run.

## Wired into `/prepare-merge` — and what that is and is not worth

Step 6 now ends with `bun run check:head-has-run`, in both the command recipe
and the skill that carries the discipline.

**It does not change what you do next, and the entry says so.** Step 7 already
dispatches CI unconditionally — *"local green is not CI green"* — so a run
exists either way. What the check changes is **what you can honestly say**: a
pull request showing zero checks is indistinguishable from one whose checks
have not started, so a reviewer cannot tell *CI is coming* from *CI is never
coming*. When the push produced no run, that fact goes in the PR body beside
the dispatched run's URL, and the PR stops looking merely early.

Overselling this would be easy and wrong. It is a labelling fix on top of a
mitigation that was already there.

## Built: the unattended sweep — and the three decisions were the owner's

`check:prs-have-runs` + `.github/workflows/pr-checks-present.yml`. The three
open questions were put to the owner on 2026-09-20 **with a measurement rather
than in the abstract**: sweeping the six open pull requests at that moment,
**two had no run of any kind on their head** (`#525`, updated three minutes
earlier; `#477`, one minute earlier). A third of the set.

| decision | chosen |
|---|---|
| age gate | **15 minutes** |
| cadence | **hourly**, at :37 |
| reporting | **both** — tracking issue *and* a PR comment |

**The age gate is the difference between useful and ignored**, and it is not a
tuning knob. A head pushed thirty seconds ago legitimately has no run, and a
sweep reporting those is one nobody reads — this bean's own failure mode,
reproduced by its fix. A younger head is **not judged**, never called clean.

**"Both" needed a consequence handled.** Hourly comments would put
twenty-four notifications a day on one unchanged pull request, which is how a
warning gets muted. So the comment is keyed by
`<!-- pr-no-checks:<sha> -->` and posted **once per (pull request, head
sha)**; the issue is **edited in place**, never appended to.

Only `unknown` fails the job — a finding records itself and the workflow stays
GREEN, the same inversion as `ci-health`. And one unreadable answer makes the
**whole** run unknown: a sweep blind on one pull request has not cleared the
others.

### Caught by this session's own earlier work, twice

- The workflow's YAML **would not parse** — a comment body at column 0 broke
  out of the block scalar. `check:workflow-coverage` reported it as
  COULD NOT DETERMINE rather than as uncovered, which is exactly the
  distinction bean `7yvd` added.
- Adding an auto-triggering workflow **re-opened the gap `7yvd` closed**, one
  bean after `30hn` recorded me doing precisely that. So it ships with
  `pr-checks-present.bpmn` and a declared `<folio:policy enforcement="strict"/>`:
  **9/9 auto-triggering documented, jobs match.**


## SIXTH observation, 2026-09-20 — caught live, and it narrows the bean twice

Reproduced while opening **#552** from `claude/ecstatic-goldberg-eroyaz`, and
measured at the moment it happened rather than reconstructed.

| | |
|---|---|
| push | `7810d021ce..ee90b3cb19`, a plain fast-forward (`git push -u`, no `--force`) |
| PR opened | seconds later |
| `get_check_runs` on #552 | **`total_count: 0`** |
| newest `code-quality-gates` run on the branch | `head_sha: 7810d021ce` — **the previous head**, which #543 had just merged |
| remedy | `workflow_dispatch` against the branch, as in every prior observation |

### What this narrows

**1. The title is now wrong twice over, not once.** `#409` already showed a
non-force push doing this. This is the second, and it adds a case the recorded
hypothesis does not cover: the branch was **not** reset to `origin/main`. It
was merged forward normally (`git merge origin/main`), and has carried
unmerged commits continuously all session. So *"the branch had very recently
pointed at a merged commit"* — the hypothesis from `#409` — **does not hold
here**, and is falsified as a general explanation.

What IS common to all six: **the branch's previous PR had just merged.** #552
was opened minutes after #543 merged, and every prior observation names the
same shape. The branch's own history was not rewritten in this case, so what
survives is a property of the *pull request sequence* on one ref, not of the
push.

**2. The timing series grows and still shows nothing.** 52 s fail, ~45 s pass,
30 s fail, 13 s pass, seconds fail, and now seconds fail. Six observations, no
monotonic relationship. Elapsed time should stop being tested.

### Done-when #2 is actionable NOW and does not need the cause

> *"whatever the cause, a PR with NO check runs on its head is reported as
> such, not read as green — the third state, as everywhere else here."*

Nothing in this repository reports it. A PR with zero checks renders exactly
like one whose checks have not started, and **an agent operating under a
standing merge authorisation will merge it**. That is not hypothetical: this
session holds such an authorisation, and #552 was a minute away from being
read as "no checks red".

The check is cheap and entirely local to what an agent already does before
merging: compare the PR's `head_sha` against the newest workflow run on the
branch, and refuse to call it green when no run exists for that sha. It is the
same three-state discipline as `check:l1-complete`, `ci-health`, and
`toc_source` — **could-not-determine is never rendered as clean.**

Claimed by `claude/ecstatic-goldberg-eroyaz` for #2 and #3. #1 stays open and
is a question for the author, below.

## QUESTIONS FOR THE AUTHOR

1. **Is establishing the cause (#1) worth more agent time?** Six observations
   have falsified three hypotheses — paths filter, ref-update race, app-token
   suppression — and the timing series is flat. This looks GitHub-side and not
   determinable from here. My recommendation: split #1 into its own bean at
   low priority with the six observations attached, and close `3pqn` on #2 and
   #3, which are the parts that stop the damage.
2. **Should the guard REFUSE the merge or just report?** Refusing is safer and
   is what the third-state rule implies everywhere else here; reporting keeps
   an agent unblocked when GitHub is merely slow. The two differ in exactly
   the case that matters — a PR whose checks will never arrive.


## 2026-09-20 — Done-when 2 and 3 landed; #1 stays open

Both were actionable without the cause, which is the argument for splitting
them off #1 rather than waiting on it.

**Where it went.** `skills/folio-core/prepare-merge.md` §Guardrails, directly
under **Honest green** — which covered *red* and said nothing about *absent*,
the exact gap. The new rule is **NO CHECKS IS NOT GREEN — verify against the
run list, never the PR page**, carrying the six observations, the three
falsified hypotheses, the flat timing series, and a four-step procedure: read
`head_sha`, match it against `list_workflow_runs` for the branch, treat
no-run-for-that-sha as **not ready** in those words, and re-run by
`workflow_dispatch`. Step 4 is *re-check after every push* — a new commit
moves the head, and the head is what the absence attaches to.

**Why a guardrail rather than a recipe step.** An agent holding a standing
merge authorisation reads zero checks as nothing-red and merges unverified.
Measured, not argued: this session held such an authorisation when #552
reproduced the bug **twice in eight minutes on two different commits**, and
was one step from merging a PR with no coverage.

**Mirrored into `prepare-merge-auto.md` §Anti-patterns**, with a cross-link
each way. `prepare-merge.md` itself records why: the branch-deletion rule was
stated in only one of the two files, *"which is how it got broken"*.

Done-when 3 asked for the workaround to be written down rather than left as
folklore. It is the dispatch step above — and the six observations are what
justify it over "wait longer", which the timing series falsifies.


## CLOSED 2026-09-20 — owner's decisions on both open points

**"2 bean"** — the cause is split out as **`yv4z`**, low priority, carrying the
six observations, the three falsified hypotheses (paths filter, ref-update
race, app-token suppression), the two narrowings (not a force-push property;
not "recently pointed at a merged commit"), and the one surviving hypothesis
(the branch's previous PR had just merged). Its Done-when allows *"not
determinable from here"* as a determined answer, so it cannot sit open forever
as a question nobody returns to.

**"3 report"** — the guard **reports loudly and re-runs**; it does not refuse.
That is what shipped, so nothing changes. Worth recording why the alternative
was arguable: refusing matches the third-state rule everywhere else here, and
the two differ exactly where it matters — a PR whose checks will never arrive.
Reporting keeps an agent moving when GitHub is merely slow, and the re-run step
means a report is never the end of it.

### Done when — final

- [ ] the cause is established → **moved to `yv4z`**, not dropped
- [x] a PR with NO check runs on its head is reported as such, not read as
      green — `prepare-merge.md` §Guardrails, **"NO CHECKS IS NOT GREEN — verify
      against the run list, never the PR page"**, with the four-step procedure
      and the evidence
- [x] the workaround is written in the skill that governs opening a PR, not
      left as folklore — the `workflow_dispatch` step, with the flat timing
      series recorded so nobody substitutes "wait longer"

Mirrored into `prepare-merge-auto.md` §Anti-patterns, because that file records
what happened the last time a rule lived in only one of the two copies.

**It caught its own author within the minute.** #552's head moved and the rule
refused the merge until a completed run existed for the new sha. Merged as
`92e83dbcb1` once it did.
