---
# folio-assistant-yv4z
title: '3pqn cause: why does a PR sometimes get NO pull_request-event run at all?'
status: todo
type: bug
priority: low
created_at: 2026-09-20T16:33:37Z
updated_at: 2026-09-20T16:33:37Z
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
