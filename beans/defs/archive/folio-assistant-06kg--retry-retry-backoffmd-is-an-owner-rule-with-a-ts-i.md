---
# folio-assistant-06kg
title: 'RETRY: retry-backoff.md is an owner rule with a TS implementation and FOUR shell loops nothing checks'
status: completed
type: bug
priority: normal
created_at: 2026-09-20T17:00:45Z
updated_at: 2026-09-22T07:23:02Z
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

- [x] All four shell loops double and jitter, matching `[0.5, 1.5)` from the
      skill rather than approximating it — **by calling it**, not by matching
      it. See below.
- [x] A gate reads the WORKFLOWS, not just `retry.ts`.
- [x] The skill says which call sites it governs.

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


---

*2026-09-20* — **Done. The fix is not "add jitter to four loops".**

Approximating the policy in bash would have left four implementations free to
drift — `bqrg`'s shape, where six copies of one function had three broken and
nothing saying so. `cat-harness/scripts/backoff-sleep.ts` **imports
`waitFor`**, so a workflow and `withBackoff` now compute the same number from
the same code and changing the policy is one edit.

```sh
bun run cat-harness/scripts/backoff-sleep.ts --attempt "$attempt"
```

Four call sites, one implementation, zero arithmetic repeated.

### Three decisions worth keeping

**It sleeps rather than printing a number.** `sleep $(bun run …)` passes an
EMPTY argument on any failure of the script, and `sleep` with no operand is an
error the loop would take as its own. Sleeping inside means a fault is this
script's exit code.

**Base 5 s, not `waitFor`'s 1 s.** `waitFor`'s defaults are tuned for an HTTP
call; a rejected push to `gh-pages` is a lost race against another session's
whole job. 5 s is what the linear version started at, kept deliberately so
this is a change of SHAPE and not a change of scale. The cap stays 16 s.

**A bad `--attempt` exits 2.** Silently treating a typo as attempt 1
reintroduces the short wait, which is the herd this exists to break.

### The gate, and its vacuity guard

`retry-backoff-in-workflows.test.ts` (7 tests) discovers every `for attempt`
loop across every workflow and pins the **property** — *a loop that retries
does not compute its own wait* — not any spelling. It also refuses to pass on
an empty discovery: the counts of workflows and of loops are asserted first,
because `check-declared-assets` shipped exactly that failure (`6tkl`, "0
across 0 instances, exit 0").

**Ratcheted three ways, all red on the regression:** reverting one loop to
linear fails 2 tests; hand-rolling jitter with `$RANDOM` fails 1; making
`backoff-sleep.ts` reimplement the doubling instead of calling `waitFor`
fails 1.

### Two things I got wrong, both caught by measuring

**The log line claimed a cap it does not keep.** It read *"capped at 16s"*,
and attempt 5 measured **22.9 s**. `waitFor` caps the IDEAL and then
multiplies by `[0.5, 1.5)`, so an actual wait runs to 1.5x the cap. The
wording now says "capped at 16s before jitter of [0.5, 1.5)", and the skill
says it too — an unexplained 22.9 s reads as a broken cap to whoever next
times the job.

**The gate failed on its own subject's prose.** `backoff-sleep.ts` documents
*why* it does not reimplement the doubling, and that explanation necessarily
spells `baseMs * 2 ** (attempt - 1)` — which the "carries no copy of the
arithmetic" assertion matched. I had written the comment-stripper for the
workflows and not applied it to the script. **Third time this trap has been
paid for here**, after `staging-replaces-preview.test.ts` and the workflow
comments in this very change.

### Still open, and honestly

- [ ] **The other insight banked from PR #565 is NOT implemented**: its retry
      loop REBUILDS rather than rebases (reset to `FETCH_HEAD`, redo the copy
      and the append), because a rebase replays a stale append and can
      conflict. `main` still does `git -C pages pull --rebase`. That argument
      is sound and is a change to deploy semantics rather than to a wait, so
      it is deliberately not folded into a backoff fix. It stays here so it is
      not lost with the closed PR.

## Closed on re-derived evidence, 2026-09-22

Every `## Done when` item was ticked while the bean stayed open. Re-derived
against `main` at `2ce66fc` rather than trusted:

| claim | evidence |
|---|---|
| all four shell loops call it | `feature-staging.yml` references `backoff-sleep.ts` **4 times** |
| a gate reads the WORKFLOWS | `check:workflow-paths` — registered in `package.json`, present in `code-quality-gates.yml`, and passing: *"72 invocation(s): 55 resolve, 17 need a folio, 0 missing, 0 undetermined"*. Its own comments cite the backoff calls it was built around |
| the skill names its call sites | `skills/folio-core/retry-backoff.md`, 4 matches for call-site language |

Closed by **evidence, not authorship** — `bean-coordination` §"Closing a bean
whose work has already landed".
