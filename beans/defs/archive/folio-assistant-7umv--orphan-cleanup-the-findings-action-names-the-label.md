---
# folio-assistant-7umv
title: 'ORPHAN CLEANUP: the finding''s action names the label first, and the label provably cannot reach an orphan'
status: completed
type: bug
priority: high
created_at: 2026-09-23T20:59:52Z
updated_at: 2026-09-23T21:01:56Z
parent: folio-assistant-1xhc
---


The owner applied `staging:cleanup` to both orphaned slugs, as
`staging-preview-orphans` told them to. **Nothing happened.** 201.2 MB stayed
exactly where it was.

## Why the label cannot work, in the workflow's own words

`feature-staging.yml`, on its dispatch inputs:

> the label path cannot reach the previews the health sweep reports: `cleanup`
> below fires on `pull_request_target: closed`, and **being findable as an
> orphan REQUIRES the pull request to be closed already** — so the event has
> fired, the job has run, and the label was absent. **Labelling afterwards
> fires nothing**, and re-running the old run replays the stored payload, which
> still carries no label. Bean `w2g5`.

`cleanup` is `if: github.event.action == 'closed'` and reads
`github.event.pull_request.labels.*.name` from **that** payload. There is no
`labeled` trigger anywhere in the file.

So the condition that puts a preview in the orphan list is the same condition
that has already spent its one chance to read a label. **The finding's first
prescribed remedy is unreachable for every subject the finding can ever have.**

`deletion-requires-confirmation` already had it right — *"once closed unmerged,
a `feature-staging.yml` dispatch with `cleanup_slug` + a matching
`cleanup_confirm`, since the label cannot reach a closed PR (bean `w2g5`)"* —
so the knowledge was in the corpus and the check's action contradicted it.

## The class

Fourth of the family this session, after `o5qj`, `thux` and `vq8g`: a finding
whose prescribed action cannot clear it. This one is the worst of the four,
because the others merely failed to clear — **this one spent the owner's
effort** on an instruction that could not work.

Applying `generalise-the-fix` to it: the SYMPTOM is "the label did nothing";
the DEFECT is an action naming a mechanism that cannot reach its own subject.
The sweep for siblings found two more — both `staging-preview-size` actions say
"add `staging:cleanup` to the PRs" without the open-PR qualifier, and a reader
holding a closed-PR preview is sent down the same dead path.

## What changed

- The ORPHAN action now names the **dispatch**, with the exact
  `cleanup_slug` / `cleanup_confirm` values, and says outright that the label
  does not work here and why. Named rather than silently dropped: a reader who
  has already tried it needs to know it was not their mistake.
- Both SIZE actions gain the qualifier — the label works **while the PR is
  still open**, and a closed one goes to the dispatch.

## Verified

A test asserts the orphan action names `workflow_dispatch` with both inputs,
and does NOT offer the label as the remedy. **Falsified**: restoring the label
as the first option fails it; restoring the fix passes it.

The two orphans were removed by dispatch, which is the route this bean
installs.

## Done when

- [x] The orphan action names a mechanism that can reach an orphan
- [x] It says the label does not work here, rather than omitting it
- [x] The two size actions gain the open-PR qualifier
- [x] A test holds it, falsified against the original wording
- [x] The two orphans are actually removed

Parent `1xhc`.
