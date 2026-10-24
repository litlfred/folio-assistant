---
# folio-assistant-pomp
$schema: bean/1.0.0
title: A stale origin/main produced two confident wrong findings in one session — 'not in my checkout' is not 'does not exist'
status: completed
type: task
priority: normal
created_at: 2026-09-21T06:43:56Z
updated_at: 2026-10-24T11:25:00Z
parent: folio-assistant-ahvw
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
- [x] a ruling on whether this ALSO wants a tool — see below
- [x] if a tool: something that answers "does `<path>` exist anywhere reachable
      — this branch, `origin/main`, or an open PR's head" in one call, since
      the third case is the one neither guard above catches
- [x] the two occurrences above stay recorded wherever the corrections went,
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


_2026-09-29_ — **Re-parented `vke6` → `ahvw`** by subject, per todo-manager §"WHICH parent" (owner choice '1 2 3' on the LSI epic-filing proposal, bean ansc). A stale origin/main producing confident wrong findings is about how an agent verifies before it reports — process; nothing here is the split. (LSI's first guess was 1xhc.)

_2026-10-16T10:30:00Z_ — Back to `todo`: nobody is holding this; its last note says it is parked (waiting on a trigger, a ruling or a deferred row), and an untouched `in-progress` claim misleads sibling sessions (owner choice, https://claude.ai/code/session_01NUrhvvMEwU5MmPW4L2w9jP).

## Owner, 2026-10-22: wait

Asked whether to build the "exists on main or any open PR head" tool now, the
owner answered *"wait"* — build only after a second session hits case 3, as
recommended above. Session https://claude.ai/code/session_01JkK6uP3iU2etyMbrw7v3cu.

## Closed 2026-10-24 (owner choice B)

Ruling: no tool. The owner closed this bean on 2026-10-24 rather than build an "exists on main or any open PR head" checker, so the "if a tool" item does not apply. The two occurrences stay recorded in this bean.


## Reopened 2026-10-24 08:20Z (owner choice B): build the lookup

The owner tapped "B: Reopen pomp, full lookup" on 2026-10-24 08:20Z. The 2026-10-22
answer was *"wait"* until a second session hits case 3. Today one did:

| time (UTC) | what |
|---|---|
| 07:46:28 | agy's first f1e1 commit (branch feat/f1e1-host-and-multiuser-identity) |
| 07:47:35 | agy opens cat-harness-tools#686 |
| 07:49:20 | agy opens cat-harness#502 |
| 07:50:08 | a cloud thread's first f1e1 commit (claude/f1e1-agent-hosts) |
| 07:50:22 | cloud opens cat-harness-tools#688 (merged 08:04) |
| 07:50:29 | cloud opens cat-harness#503 |
| 07:52:57 | agy's first f1e1 commit on the bean branch |

The bean branch said nothing new about f1e1 until 07:52:57, and its status had read
`in-progress` since 2026-10-16, so neither a status check nor a bean-log check would
have stopped the second start. The duplicate existed only on an open PR's head: case 3.
`gh api` on the four PRs is the measurement.

So the "if a tool" item applies again: a Tool that answers *does `<path>`, a pattern,
or a bean id appear on main or on any open PR head, and where?* (bean n7x7 uses it as
the claim check's last step).

_2026-10-24T08:30:00Z_ — Reopened and claimed by https://claude.ai/code/session_01MMQkmKdyvbBnE6dR9xMAmg, plain commit on both copies.

_2026-10-24T08:45:00Z_ — The lookup is the open-work-lookup Tool: definition in litlfred/cat-harness#520, implementation in litlfred/cat-harness-tools#706. Session https://claude.ai/code/session_01MMQkmKdyvbBnE6dR9xMAmg.

## Summary of Changes

Merged 2026-10-24 11:23Z by the owner: litlfred/cat-harness#520 (fb62124: skill `bean-drain` with input/output schemas, Tool definitions drain-queue, bean-claim-check, open-work-lookup, pointers from bean-coordination, idle-backlog, issue-working, AGENTS.md) and litlfred/cat-harness-tools#706 (9b133fa: `beans:drain-queue`, `beans:claim-check`, `lookup:open-work`, 20 tests). Issue litlfred/cat-harness#515. The drain as a BPMN process is bean bssi, waiting on m8gz. Session https://claude.ai/code/session_01MMQkmKdyvbBnE6dR9xMAmg.
