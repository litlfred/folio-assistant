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

## 2026-09-22, another session — the count is 8, not 2, and SIX OF THEM ARE A DIFFERENT CASE

Measured while picking this up, then **not acted on**, because settling it
needs a `publish.yml` dispatch that is the owner's to authorise. Adding the
measurement rather than the fix, and separating two things this bean currently
reads as one.

### Every `working-directory: folio-assistant*` in the tree

    discoverability-docs.yml:208   folio-assistant                    <- this bean
    publish.yml:568                folio-assistant                    <- this bean
    hecke-engine-wasm.yml:95,98    folio-assistant/computations
    snappea_wasm.yml:21,69,96,132  folio-assistant/snappea-wasm

Plus many more path references, not `working-directory`, in
`publish.yml` (lines 192-195, 274, 301-313) and `witness-refresh.yml`
(4, 92, 113-116). `folio-assistant/` still does not exist, and none of the
`actions/checkout@v4` steps in either workflow carries a `path:`.

### The six extra ones are NOT this bean's defect, and that matters

They point at **folio content**, and a path correction alone would not make
them run:

- `computations/` DOES exist — at **`cat-harness/computations`**, one
  directory over. So the path is stale from the rename, exactly as this bean
  describes. **But** that directory holds **one** file,
  `wall-violations.witness.json`, and **zero `.py`**. The workflows `cd` there
  and run Python. Correcting the path would move the failure, not remove it.
- `snappea-wasm/` exists **nowhere** in the checkout.

So `AGENTS.md`'s *"`witness-refresh` fails by design … the platform carries no
folio"* **stands**. I went looking to correct it — `computations/` existing
looked like it falsified the stated reason — and the content measurement says
otherwise. Recorded because the near-miss is the useful part: the directory
existing is not the same as the directory being usable, and a reader who
greps for the name and stops will conclude the opposite.

### What that leaves as this bean's actual subject

The two TypeDoc steps, and they are the ones worth a dispatch, because
**TypeDoc over the platform's own source needs no folio at all**. If they fail
on `working-directory`, a one-line path fix genuinely makes them run — which
is precisely the behaviour change this bean is right to want observed first.

`snappea_wasm.yml` is `workflow_dispatch`-only, so its four occurrences never
fire on their own and are unjudged for a second, independent reason.

### Not done here

No dispatch, no path edited, no baseline entry touched. The `## Done when`
below is unchanged and still needs the owner's go-ahead for the dispatch.
