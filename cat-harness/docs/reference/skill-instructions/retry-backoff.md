---
layout: default
title: A falling-off retry rate, on every error
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/retry-backoff.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/retry-backoff.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/retry-backoff.md){: .fa-edit-source }

{% raw %}
# A falling-off retry rate, on every error

Owner, 2026-09-20: **"as rule, use logarithmic fall-off on all errors. core
best practice."**

`src/core/retry.ts` is that rule as code — `withBackoff`, `classifyResponse`,
`waitFor`. Use it rather than writing a loop; a retry policy invented per
call site is a policy nobody can change in one place.

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

Git operations follow the same shape by convention — `git push -u origin
<branch>`, retried with 2s, 4s, 8s, 16s on a **network** error, never on a
rejected push.

## Related

| | |
|---|---|
| the three states, and never rendering the third as clean | [`ci-health`](ci-health.md) |
| do not encode a constraint you have not verified | [`unverified-constraints`](unverified-constraints.md) |
{% endraw %}
