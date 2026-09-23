---
# folio-assistant-mc8h
title: 'MERGE-FORWARD TREADMILL: re-merging main faster than CI can answer means never getting a verdict — #1064 took four base merges and observed zero gates runs'
status: completed
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
