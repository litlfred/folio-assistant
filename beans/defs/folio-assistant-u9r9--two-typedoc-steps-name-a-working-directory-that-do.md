---
# folio-assistant-u9r9
title: TWO TypeDoc steps name a working-directory that does not exist, and both workflows are unjudged so nothing has said so
status: todo
type: bug
priority: normal
parent: folio-assistant-1xhc
created_at: 2026-09-22T05:57:48Z
updated_at: 2026-09-22T05:57:48Z
---

Found 2026-09-22 while re-deriving `j41m`'s own numbers adversarially, in the
spirit of `w4tq`. **Not fixed, because it cannot be confirmed from here** —
see §"Why this is a bean and not a push".

## What the files say

    .github/workflows/discoverability-docs.yml:206   working-directory: folio-assistant
    .github/workflows/publish.yml:566                working-directory: folio-assistant

Neither workflow's `actions/checkout` carries a `path:`, so the repository
lands at the workspace root and there is **no `folio-assistant/`
subdirectory** — `ls -d folio-assistant` fails in this checkout. GitHub
Actions fails a step whose `working-directory` does not exist, so on the
reading above both TypeDoc steps die before running.

This is the same class as the `scripts/` prefix that `AGENTS.md` records
outliving the split, and as `j41m`'s `cd content` — **a path that was true
before a rename and is nobody's to notice afterwards.**

## Why this is a bean and not a push

`bun run check:ci-health` places both workflows among the **32 that produced
no run in the window — "unjudged, not green."** So there is no failing run to
read, and the claim above rests on reading the file rather than on observing
the failure.

That is exactly the `ci-health` rule applied to myself: **could-not-determine
is never rendered as clean, and it is not rendered as broken either.** Editing
a publish workflow on a file-read suspicion is the speculative change this
repository forbids, and if the step really never runs then "fixing" it would
turn a dormant step into a live one — a behaviour change nobody asked for.

## What would settle it

Dispatch each workflow once and read the step. If it fails on the
`working-directory`, the fix is a one-line path correction; if it succeeds,
this bean is wrong and says so.

## While it stands, the two install lines inside those steps are baselined

`bun install || npm install` at `publish.yml:570` and
`discoverability-docs.yml:210` — unpinned, and the `|| npm install` half is a
RUNTIME fallback rather than a lockfile one, immediately after
`oven-sh/setup-bun@v2` has already installed bun. Both are in
`lockfile-pinning-baseline.json` rather than fixed, for the same reason: the
step they sit in may not run at all, and the baseline may only shrink, so if
this is resolved the entries go stale and the gate says so.

## Done when

- [ ] Each workflow is dispatched once and the step's real outcome recorded
- [ ] If it fails: the path is corrected and the two installs pinned in the
      same change, and their baseline entries removed
- [ ] If it succeeds: this bean is marked wrong, with what the checkout
      actually produces written down so the next reader does not re-derive it
