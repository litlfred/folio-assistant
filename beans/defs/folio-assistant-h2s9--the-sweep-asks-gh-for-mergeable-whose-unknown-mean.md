---
# folio-assistant-h2s9
title: The sweep asks gh for mergeable, whose UNKNOWN means 'not computed yet' — and renders it as 'could not be read'
status: in-progress
type: bug
priority: high
created_at: 2026-09-22T00:47:08Z
updated_at: 2026-09-22T00:47:22Z
parent: folio-assistant-1xhc
---

`sddf` fixed the sweep's advice by asking `gh pr view --json mergeable` before
choosing it. **That field is not a reliable discriminator**, and the first run
after the fix proved it.

## Measured, on the first run carrying the fix

Run 32 of `PRs without checks` (2026-09-21T23:41Z) — the first success after
five consecutive failures — commented on PR #731 with the **UNKNOWN** variant:

> Its mergeability could not be read, so the reason is unknown.

But the forge was publishing `refs/pull/731/merge` at that moment, and still
is. Checked both ways:

```
GET /pulls/731  ->  mergeable_state: "unknown"
git ls-remote origin refs/pull/731/merge  ->  1 ref
```

So the API said `unknown` while the merge ref existed. GitHub computes that
field lazily — a read can return `unknown` because nothing has computed it
yet, which is *not* the same as "this PR's mergeability cannot be determined".

## It is this session's own defect class, one level in

`sddf` exists because a tool stated a cause it could not establish. The fix
then took a field whose `unknown` means **"not computed yet"** and rendered it
as **"could not be read"** — the same not-yet/cannot-know confusion, in the
remedy.

## The discriminator that works is already written

`mergeStateForHead` in `check-head-has-run.ts` probes
`git ls-remote origin refs/pull/N/merge`. Deterministic, token-free, and
measured on #813: absent for 433 s while conflicted, present within 15 s of
resolution. The script uses it; the workflow does not. **That disagreement is
what `sddf` was about**, so leaving the two halves on different instruments
reopens it.

## Done when

- [x] The workflow decides mergeability with the **merge-ref probe**, not
      `gh pr view --json mergeable`
- [x] Both halves use the same instrument, so they cannot disagree
- [x] The UNKNOWN branch is reserved for the probe genuinely failing, never
      for a value that merely has not been computed
- [ ] Verified on the next scheduled run against a live PR, not asserted


---

## Summary of Changes

The probe replaces `gh pr view --json mergeable`, so both halves of `3pqn`
detection now use one instrument and cannot disagree — which is what `sddf`
was for.

## Two defects in MY OWN fix, both caught by running it rather than reading it

The naive swap looked right and was wrong twice, in the same direction:
**an absence read as evidence.**

**First: a nonexistent PR read as `CONFLICTING`.** `git ls-remote` exits 0 with
empty output for a ref that was never there, so probing only the merge ref
turns "no such PR" into "conflicted".

**Then the guard for it was also wrong.** Adding a `refs/pull/N/head` check
does not help, because **a head ref SURVIVES a close while the merge ref is
reaped** — measured here as 681 head refs against 12 merge refs, the twelve
being exactly the then-open PRs. So on a *merged* PR the pair reads precisely
like an open conflicted one, and #831 came back `CONFLICTING` three minutes
after it merged.

Both were found by exercising the branch against the live forge with real PR
numbers. Neither was visible by reading the code, and the second was
introduced *while fixing the first*.

## The fix: mergeability is only a question for an OPEN pull request

`gh pr view --json state,headRefOid` — one call, widening one already made.
A PR that is not `OPEN` is skipped with its state named, because nothing is
owed to it. The merge-ref probe then runs **only for a confirmed-open PR**,
which is what makes an absent merge ref mean *conflicted* rather than *closed*.

Exercised against the live forge, all four cases:

```
#731     (open, mergeable)      -> MERGEABLE     <- the case that was wrong
#229     (open)                 -> MERGEABLE
#831     (merged)               -> SKIPPED, state named
#999999  (never existed)        -> SKIPPED, state named
```

## What this cost, and why it is the session's own lesson again

`sddf` exists because a tool stated a cause it could not establish. Its remedy
then read a lazily-computed `UNKNOWN` as "could not be read", and the
correction to THAT read an absent ref as "conflicted", twice. Three
iterations of one mistake — **treating the absence of a signal as the presence
of its negation** — and each was caught only by running the thing against
reality. `gates` was 100/100 across every one of them.

Last box deliberately open: the claim rests on the next scheduled run, not on
this description.

