---
name: retry-backoff
description: >-
  Every error gets a falling-off retry rate — each wait doubles, with jitter.
  Read before writing any call that can fail transiently, and before deciding
  that a failure is worth retrying at all. Exhausting the retries does not
  change the verdict.
# consulted: reference material nobody performs — a PRINCIPLE, not a procedure: every heading is an argument ("Retrying a definitive answer is not caution", "Jitter is not decoration here"), and it names no actor and no trigger. It is read when writing retry code, never performed as a step.
consulted: true
---

# A falling-off retry rate, on every error

Owner, 2026-09-20: **"as rule, use logarithmic fall-off on all errors. core
best practice."**

`src/core/retry.ts` is that rule as code — `withBackoff`, `classifyResponse`,
`waitFor`. Use it rather than writing a loop; a retry policy invented per
call site is a policy nobody can change in one place.

## From a shell script or a workflow, call `backoff-sleep.ts`

**"Use `retry.ts`" does not cover a `run:` body**, which cannot import
TypeScript — and reading it as though it did is how this rule was broken
everywhere it applied while its test suite stayed green.

Measured 2026-09-20, bean `06kg`: **all four** retry loops in
`.github/workflows/feature-staging.yml` slept `$((attempt * 5))` — 5 s then
10 s, linear and unjittered. That is the schedule §"Jitter is not decoration
here" below names as the thundering herd, on `gh-pages`, the ref it cites as
the contended one, written by the same concurrent sessions it says contend on
it. Nothing noticed, because the rule had an implementation and a test **in
TypeScript** and four call sites **in bash that no check read**. It was found
by somebody reading a sibling's open PR, which is not a mechanism.

So, from shell:

```sh
bun run cat-harness/scripts/backoff-sleep.ts --attempt "$attempt"
```

It calls `waitFor` directly, so a workflow and `withBackoff` compute the same
number from the same code. Do **not** write a shell function instead: copied
into four `run:` bodies it is four implementations again, which is how six
copies of `stripLeanComments` ended up with three broken and nothing saying so
(bean `bqrg`).

`retry-backoff-in-workflows.test.ts` is the enforcement, and it pins the
*property* — a loop that retries does not compute its own wait — rather than
any spelling. A loop reaching the shared implementation some other way passes.

One number to read correctly: the cap applies to the **ideal** wait, before
jitter. `waitFor` caps `baseMs * 2 ** (attempt - 1)` and then multiplies by
`[0.5, 1.5)`, so an actual wait runs to 1.5x the cap — 24 s against a 16 s
cap, which is not a bug in the cap.

## Retrying a definitive answer is not caution

This is the half that gets skipped, and it is the half that matters. A retry
is for a **transient** failure. Spending four waits to re-reach a `404` does
not make the answer better — it delays the honest report of it by fifteen
seconds and tells the reader nothing new.

| retry | do not retry |
|---|---|
| the call threw — socket, DNS, timeout | `400`, `401`, `404`, `422` — an answer |
| `5xx` — the far side is unwell, the question stands | `403` **permission** — more tries will not grant it |
| `429`, honouring `Retry-After` over the doubling | `403` **rate limited** — the reset outlives any backoff |

`403` means two different things and the response says which:
`x-ratelimit-remaining: 0` is a rate limit, anything else is permission.
Neither is worth hammering, and they are reported differently because the
reader's next move differs.

## Exhausting the retries does NOT change the verdict

When the last attempt still fails, the answer is **could not determine** — the
same third state it would have been with no retry at all. Backoff makes that
state rarer. It never converts it into a pass or a finding.

That is the rule this repository applies everywhere else
([`ci-health`](ci-health.md), the QA third state, the health sweep) meeting
this one: a check that retried hard and still could not look has **not**
established anything, and must not render as clean.

## Jitter is not decoration here

Several agent sessions run against this repository at once — four were pushing
to `gh-pages` inside ninety minutes on 2026-09-20 (bean `bm6d`). Sessions that
fail together and retry on the same doubling schedule retry **together**,
which is the thundering herd that keeps the far side down. Each wait is
multiplied by a random factor in `[0.5, 1.5)`.

## Inject the clock, or the code is untestable

A retry loop with real sleeps takes 1 + 2 + 4 + 8 s, and any suite with a sane
timeout fails on it. Measured: the first draft of `runsForHead` made
`a thrown fetch is cannot-ask` take fifteen seconds and fail at bun's five.

So `withBackoff` takes `sleep` and `rand`, and any function wrapping it should
pass its options through. A test then asserts **how many attempts were made**
and **which failures were retried**, which is the behaviour worth pinning —
not that a timer elapsed.

## Where it is already applied

| call site | why it matters there |
|---|---|
| `scripts/check-head-has-run.ts` | asks GitHub whether a commit has a run; a blip would read as could-not-ask |
| `scripts/check-prs-have-runs.ts` | the PR listing fails the WHOLE sweep, where one PR's failure only makes that row `unknown` |

Git operations follow the same shape by convention —
`git push -u origin <branch>`, retried with 2s, 4s, 8s, 16s on a **network** error, never on a
rejected push.

## Related

| | |
|---|---|
| the three states, and never rendering the third as clean | [`ci-health`](ci-health.md) |
| do not encode a constraint you have not verified | [`unverified-constraints`](unverified-constraints.md) |
