---
# folio-assistant-pomp
title: A stale origin/main produced two confident wrong findings in one session — 'not in my checkout' is not 'does not exist'
status: in-progress
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

- [x] the cheap version is DONE: `bean-coordination` §"Re-derive from the
      REMOTE, never from your checkout" (STRICT) carries both measured
      occurrences and the two distinct guards, and `issue-working` §"Before
      you publish that something does not exist" carries the short form,
      because an issue comment is where one of the two was published
- [ ] a ruling on whether this ALSO wants a tool — see below
- [ ] if a tool: something that answers "does `<path>` exist anywhere reachable
      — this branch, `origin/main`, or an open PR's head" in one call, since
      the third case is the one neither guard above catches
- [ ] the two occurrences above stay recorded wherever the corrections went,
      rather than being tidied away once the guard exists

## Not in scope

Re-litigating either finding. Both are corrected at their sites: `s8nu` for
occurrence 1 (with the issue comment on #641), and this bean plus the PR
comment for occurrence 2.


## The cheap half shipped 2026-09-21, and doing it sharpened the question

Writing it down made the structure clearer than the bean had it. There are
**three** cases, not two, and the third is the one neither guard catches:

| case | guard |
|---|---|
| a branch older than the claim | ask the remote — `git show origin/main:<path>` |
| a fetch in the same compound command | fetch and read in **separate** commands |
| **the file exists only on an open PR's head** | neither — you have to look at the branches |

The third is the expensive one and it is not hypothetical: this session
started building `ankg`, `s8nu` and a `viewer-prune` module that siblings had
already landed or had in flight, **five times**. The check that would have
prevented each is one `git diff --name-only origin/main...<branch>` per open
PR — cheap per branch, but it needs the branch list, which is why it is the
case a skill line cannot really discharge.

### So the tool question, if it is still wanted, is narrower than the title

Not *"does `<path>` exist"* — the remote answers that in one command. It is:

> **Does `<path>`, or anything matching `<pattern>`, exist on `main` or on any
> open PR's head — and if so, where?**

That is one call against a list nobody has to remember, and it answers the
question an agent actually has before starting work, rather than the one it
has while writing a finding.

**Recommendation: build it, but only after a second session hits case 3.**
One session's five occurrences is a strong signal and a sample of one. The
skill lines cover cases 1 and 2 today, which is where both *published* errors
came from.
