---
# folio-assistant-pomp
title: A stale origin/main produced two confident wrong findings in one session — 'not in my checkout' is not 'does not exist'
status: todo
type: task
created_at: 2026-09-21T06:43:56Z
updated_at: 2026-09-21T06:43:56Z
parent: folio-assistant-vke6
---



Two occurrences in one session, same shape, both published before being
caught. Recorded because the failure mode is invisible from inside: the
command succeeds, the output is definite, and the conclusion is about somebody
else's work being broken.

## Occurrence 1 — `ankg`'s precedent

Asserted, in a commit message, a PR body and an issue comment: *"#607 says it
built pruning in `gen-iris-pages.ts`; that file has no `OWNED`, no prune, no
orphan code — checked rather than assumed."*

`OWNED` is at `who-iris/scripts/gen-iris-pages.ts:104`; the prune runs at
1575-1601. The grep ran against a checkout branched before #607 merged, and
**"not present in my base" was published as "does not exist"** — while
accusing the bean of a mis-citation.

## Occurrence 2 — `compose-docs.ts`

`stage` went red with `Module not found "cat-harness/scripts/compose-docs.ts"`.
The probe reported it absent from `main` and the conclusion drawn was a
repo-wide breakage: *a workflow step landed without its script, breaking every
PR's staging job.*

It landed complete — commit `129b2461` added the workflow step, the 249-line
script and a 209-line test together. The probe read a **stale `origin/main`**:
the commit arrived between the fetch and the check, in the same compound
command.

## The two distinct causes, because they need different guards

**1. A branch older than the claim.** Grepping the working tree answers *"is
this in MY base"*, which is a different question from *"does this exist"*. The
guard is to ask the remote: `git show origin/main:<path>` or
`git log origin/main -- <path>`, never `grep` over the checkout.

**2. A fetch in the same compound command is not a barrier.** `git fetch -q
origin main && git cat-file -e origin/main:<path>` looks airtight and is not,
on a repository where sibling sessions merge every few minutes. The ref was
current when fetched and stale when read.

## Why this is worth a bean rather than a resolution to be careful

Both findings were **published** — one to an issue and a PR body, one about to
be. A wrong finding about a sibling's work is worse than no finding: it sends
the next reader to verify an accusation, and in occurrence 1 it sat in a bean
as a correction of a correction.

The cost is concentrated in this repository's shape: many sessions, merges to
`main` every few minutes, and beans that cite each other by id. A citation is
checked against whatever the checker happens to have.

## Done when

- [ ] a ruling on whether this wants a tool at all, or is a skill line —
      the cheap version is one sentence in `bean-coordination` and in
      `issue-working`: **before publishing a finding that something does not
      exist, re-fetch and read it off the remote ref, in a separate command**
- [ ] if a tool: something that answers "does `<path>` exist anywhere reachable
      — this branch, `origin/main`, or an open PR's head" in one call, since
      the third case is the one neither guard above catches
- [ ] the two occurrences above stay recorded wherever the corrections went,
      rather than being tidied away once the guard exists

## Not in scope

Re-litigating either finding. Both are corrected at their sites: `s8nu` for
occurrence 1 (with the issue comment on #641), and this bean plus the PR
comment for occurrence 2.
