---
# folio-assistant-06kg
title: 'RETRY: retry-backoff.md is an owner rule with a TS implementation and FOUR shell loops nothing checks'
status: todo
type: bug
priority: normal
created_at: 2026-09-20T17:00:45Z
updated_at: 2026-09-20T17:01:11Z
parent: folio-assistant-1xhc
---


Found 2026-09-20 by reading the OTHER open PRs on this repository before
picking up new work — the owner's standing instruction to watch them for
incoming insights. It came out of PR #565, which is not merged and whose own
fate is a separate question (below).

## The rule

`cat-harness/skills/folio-core/retry-backoff.md`, quoting the owner on
2026-09-20:

> **"as rule, use logarithmic fall-off on all errors. core best practice."**

and, in its own §"Jitter is not decoration here":

> Several agent sessions run against this repository at once — four were
> pushing to `gh-pages` inside ninety minutes on 2026-09-20 (bean `bm6d`).
> Sessions that fail together and retry on the same doubling schedule retry
> **together**, which is the thundering herd that keeps the far side down.
> Each wait is multiplied by a random factor in `[0.5, 1.5)`.

## The measurement

`src/core/retry.ts` is that rule as code — `withBackoff`, `classifyResponse`,
`waitFor` — and `scripts/tests/retry.test.ts` covers it. That half is fine.

Every retry loop in `.github/workflows/` is a SHELL loop, and there are four,
all in `feature-staging.yml`:

```
638    sleep $((attempt * 5))     stage          — deploy the preview
844    sleep $((attempt * 5))     cleanup        — remove a merged PR's preview
903    sleep $((attempt * 5))     cleanup        — the retained-log path
1103   sleep $((attempt * 5))     cleanup-dispatch
```

**All four are linear and none has jitter.** 5s, 10s — the exact schedule the
skill names as the thundering herd, on the exact ref the skill cites as the
contended one, written by the sessions the skill says contend on it.

## Why nothing caught it

The rule has an implementation and a test **in TypeScript**, and four call
sites **in bash** that no check reads. That is the `dh4f` shape: a consumer
scans nothing and the absence reads as compliance. `retry.ts` passing its
tests says nothing at all about `feature-staging.yml`, and there is no gate
that would notice if a fifth loop were added tomorrow.

It is also `xom7` in the small — the failure is invisible from a checkout,
because a herd only shows up as someone else's push rejection.

## Done when

- [ ] All four shell loops double and jitter, matching `[0.5, 1.5)` from the
      skill rather than approximating it.
- [ ] A gate reads the WORKFLOWS, not just `retry.ts` — so a fifth loop
      written linear fails `bun run gates` rather than being found by the next
      person who happens to read a sibling's PR. `staging-slug.test.ts` is the
      shape to copy: it asserts a property per job rather than counting
      occurrences.
- [ ] The skill says which call sites it governs, so "use `retry.ts`" does not
      read as covering a bash loop that structurally cannot call it.

## Not in scope

Changing the ATTEMPT COUNTS. Three vs five is a separate judgement, it is
argued in `bm6d` and `85im` on the merits of the contended ref, and mixing it
in here would make a backoff fix look like a retry-policy change.

## Cross-reference — PR #565, which found this first

PR #565 (`claude/sleepy-babbage-ls90iz`, "fix(staging): one commit per deploy,
path-scoped — beans 85im + bm6d") implements jittered doubling for `stage`
and cites this skill and the owner's date. Two things follow.

**Credit: the backoff argument here is that PR's, not this bean's.** It also
carries a second insight worth keeping whatever happens to it — its loop
**REBUILDS rather than rebases** (reset to `FETCH_HEAD`, redo the copy and the
append) on the grounds that a rebase replays a stale append and can conflict,
while `main`'s loop does `git -C pages pull --rebase`. That argument is sound
and `main` does not have it.

**But #565 is written against a base `main` has moved past.** `bm6d` landed
separately (the `peaceiris` action is gone from `stage`; the payload and the
render-log entry are already one commit) and `85im` landed as #563 (the
`rm -rf` before the copy, at line 619). #565's diff still *removes* the
`peaceiris` steps, so it is re-doing both beans against an older tree and will
conflict across the whole region.

**Whose call that is, is the author's, not an agent's.** It is a sibling
session's branch; nothing here should push to it, close it, or resolve its
threads. What this bean records is the part that is salvageable regardless —
the backoff rule and the rebuild-not-rebase argument — so that if #565 is
closed as superseded, the two insights in it are not lost with it. That is the
same reason a bean is `scrapped` with its reasons rather than deleted.
