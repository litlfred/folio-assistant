---
# folio-assistant-mc8h
title: 'MERGE-FORWARD TREADMILL: re-merging main faster than CI can answer means never getting a verdict — #1064 took four base merges and observed zero gates runs'
status: in-progress
type: bug
parent: folio-assistant-1swy
created_at: 2026-09-23T13:25:16Z
updated_at: 2026-09-23T13:25:16Z
---


Found by getting it wrong on [#1064](https://github.com/litlfred/folio-assistant/pull/1064),
and written down because the mistake is cheap to repeat.

## What happened

`main` absorbed **31, 13, 11 and 12** commits under one branch in about
seventy minutes. Each time, the PR went `dirty`, and each time the response
was: merge `origin/main`, resolve, `bun run gates`, push. Four rounds.

**`get_status` returned `total_count: 0` on every one of the four heads.** The
PR merged without a Code-quality gates verdict ever arriving.

## The claim that was wrong

Reported in chat as *"the `pull_request` trigger is systematically stalled"*.
**Measured afterwards, that is false**: Code-quality gates ran on
`pull_request` and completed for #1085, #1074 and #1086 inside the same
window. The workflow fires.

## What the timing says, and what it does not

| head | pushed | gap to next |
|---|---|---|
| `f5a1e1f` | 11:44 | 3 min |
| `50bf8c7` | 11:47 | 7 min |
| `cdb7e33` | 11:54 | **20 min** |
| `8e6eb44` | 12:14 | 7 min |
| `66e262a` | 12:21 | merged |

A gates run takes about **4 minutes** once started (measured: runs 3062 and
3063). So three of the four gaps are plausibly explained by a new push
superseding a queued run before it could start — self-inflicted.

**The 20-minute gap is not**, and this bean does not pretend to explain it.
The repository was carrying heavy concurrent load; queue depth is a candidate
and was not measured. `undetermined`, stated as such.

## The lesson, which holds either way

**Merging main forward faster than CI can answer guarantees you never get an
answer.** The `dirty` state is not an emergency: a PR that cannot merge right
now can still be waiting for a verdict on the head it already has. Re-merging
preemptively resets that clock and throws away the run in flight.

So: after a base merge, **push once and wait for the verdict** before merging
main again — unless the base merge is needed to fix an actual red, or a
reviewer is blocked.

## Done when

- [x] the false claim corrected, with the measurement that falsifies it
- [x] the push timings recorded against the ~4-minute run duration
- [x] the 20-minute gap left `undetermined` rather than explained away
- [ ] the rule written into a skill — **not done unasked**; `continual-progress`
      or `prepare-merge` is the likely home, and which one is a judgement the
      owner should make rather than this bean assume


---

# CORRECTION, 2026-09-23 — the evidence above was an INSTRUMENT ERROR

Everything in this bean that rests on *"`get_status` returned `total_count: 0`"*
is unfounded. **`get_status` reads GitHub's legacy commit-status API. This
repository's CI is GitHub Actions, which writes CHECK RUNS, not commit
statuses. So it returns an empty list for every commit, always** — whether CI
ran, passed, failed or never started.

Proved on one commit, with the two instruments disagreeing about the same sha:

| instrument | on `90c5daf` |
|---|---|
| `get_status` | `total_count: 0, statuses: []` |
| Actions run 3070, `head_sha: 90c5daf…` | **completed, `conclusion: success`** |

So the sentence this bean was built on — *"the PR merged without a
Code-quality gates verdict ever arriving"* — is **not something I measured**.
It is what an instrument that cannot see verdicts says about every commit in
this repository.

## What is now known, and what is not

**Known.** #1090's gates run completed **success** at 13:30:35, about a minute
after I merged it. I reported that PR as merged without a verdict; the verdict
existed and I could not see it.

**NOT known.** Whether gates ran on #1064's four heads. I did not establish it
then and have not established it since. `undetermined` — which is the state
this repository insists be distinguished from both "passed" and "never ran",
and which I collapsed into the third.

**Still true, independently.** `main` did absorb 31, 13, 11 and 12 commits
under one branch in about seventy minutes; the four pushes were 3, 7, 20 and 7
minutes apart; a gates run takes about 4 minutes once started. Those are
measurements of git and of run durations, not of `get_status`.

## Does the lesson survive?

**Partly, and weaker than stated.** "Re-merging main faster than CI can answer
means you never get an answer" is plausible on the timings alone — a push
supersedes a queued run — but this bean claimed it was *demonstrated*, and it
was not. What was actually demonstrated is smaller and different:

> **A verdict you cannot see is not a verdict that is absent.** Four times I
> concluded CI had produced nothing, and acted on it — merging on local gates
> instead — when the honest reading was that I was asking the wrong endpoint.

Read the conclusion from `actions_list` / `actions_get` on the run whose
`head_sha` matches, or from a check-run API. Never from `get_status` in a
repository whose CI is Actions.

## What this cost

Two beans carried the false claim onto `main` — this one and `0818`'s
`## Summary of Changes`, both merged before the error was found. #1064 was
merged on `bun run gates` rather than on CI, justified by a CI absence that
was never established. That justification is withdrawn; the merge stands, and
`bun run gates` at 135/135 across four merged trees remains real evidence —
it is simply no longer propped up by a claim about what CI did not do.

## Done when

- [x] the instrument error proved on one commit, both readings side by side
- [x] this bean's own central claim withdrawn rather than softened
- [x] `0818`'s Summary corrected
- [x] the surviving lesson restated at the size the evidence supports
- [ ] a check that no tool reads `get_status` for a verdict — **not built**;
      whether that is worth a gate is the owner's call, not this bean's
