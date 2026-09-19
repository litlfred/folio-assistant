---
# folio-assistant-g62s
title: 'gpuu second half: no run judged the head — built, correct, and inert in this repo'
status: in-progress
type: task
created_at: 2026-09-19T05:30:30Z
updated_at: 2026-09-19T05:30:30Z
---

The deferred half of bean `gpuu`. `newestUnsettled` catches "a run for the head
exists but has not finished". It does not reach the other silence: **no run for
the head was ever created.** `docs-site.yml` sat in that state for two months
under bean `xom7`.

## Built, and correct

`RunSummary.head_sha`, `AssessOptions.headSha`, `AssessOptions.triggersOnPush`,
`WorkflowHealth.headUnjudged`, plus `pushTriggerOf` — a pure reader of a
workflow's `on:` block answering `true` / `false` / `undefined`. The CLI asks
the forge for the branch tip rather than `git rev-parse origin/main`, because a
stale remote-tracking ref gives a WRONG head, and a wrong answer here is worse
than no answer.

Thirteen tests. Every unknown clears the flag rather than setting it.

## Measured, and inert — read this before trusting it

**`headUnjudged` cannot fire in this repository.** Of 36 workflows:

| `pushTriggerOf` | count |
|---|---|
| `true` — every push, so flaggable | **0** |
| `false` — never on push | 32 |
| `undefined` — push with a filter | 4 |

The four filtered ones are `docs-site.yml`, `code-quality-gates.yml`,
`jsonld-gen-check.yml`, `atomic-mass-gen-check.yml`.

**`docs-site.yml` is in that list, and it is the workflow bean `xom7` was opened
for.** So the conservative reading silences exactly the case this was built to
catch.

## Why it is conservative anyway, and what the alternative cost

The first version returned `true` for a filtered push trigger. The live report
then flagged `jsonld-gen-check.yml` as unjudged — a workflow that owed no run,
because its fifteen `paths:` entries did not match the commit. That is a false
fire of precisely the kind the trigger check exists to prevent, and it was found
by running the thing rather than by reasoning about it.

So the choice is not between conservative and useful. It is between a check that
is silent and a check that is wrong, unless a third thing is built.

## The third thing, not attempted

Deciding a filtered trigger properly means evaluating its `paths` /
`paths-ignore` globs against the files the head commit changed —
`GET /repos/{slug}/commits/{sha}` returns `files[]`, so the data is one request
away. What makes it more than an afternoon is the glob semantics: `**`,
negation, and the interaction of `paths` with `paths-ignore`. Getting those
subtly wrong reintroduces false fires, which is the one outcome this whole
design refuses.

That is a scope decision for the owner, not a detail to absorb quietly.

## Todo
- [x] `head_sha` on `RunSummary`, `headSha` + `triggersOnPush` on `AssessOptions`
- [x] `headUnjudged`, set only when all three facts are known
- [x] `pushTriggerOf`, with the filtered-trigger clause
- [x] both renderers distinguish the two silences
- [x] thirteen tests, including the four "must NOT flag" cases
- [x] measure how many workflows remain flaggable — **zero**
- [ ] OWNER DECISION: evaluate path filters against the commit's changed files, or leave this dormant

## Done when
A workflow that should have run for the current head and did not is reported as
such, with no false fire against one that owed no run. **Not met today**: the
second half holds, the first cannot be exercised here.
