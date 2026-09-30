---
# folio-assistant-6lre
title: 'CI WATCH READS A PARTIAL CHECK SET AS GREEN: 1 of 13 registered, verdict PASS — ask the check SUITES, not only the runs'
status: todo
type: bug
priority: high
created_at: 2026-09-30T16:15:00Z
updated_at: 2026-09-30T16:15:26Z
parent: folio-assistant-1xhc
---

Found while using the tool, not while reading it. Sibling of `2c2b`, which
shipped `ci:watch` for issue #1624.

## The defect, measured

`bun run ci:watch 29b10a68923` at 16:13:58:

```
16:13:58  29b10a68923  PASS — 1 check(s) completed clean
```

exit **0**. At that instant `get_check_runs` on the same commit returned
`total_count: 1` — the `.jsonld siblings` job — and **nothing else had been
created yet**. The `Code-quality gates` workflow, which carries `Repository
gates`, `TypeScript` and `End-to-end`, had not registered a single run.

Thirteen checks ran on the previous head of the same branch. One of the twelve
missing ones (`TypeScript`) had **failed** on that head. So the tool answered
"may I merge" with **yes**, over a check set that had not started, on a branch
whose immediately preceding commit was red.

## Why `2c2b` does not already cover it

`check-verdict.ts` handles the **empty** case and says so:

> An **empty** run list and an **unreadable** response are BOTH `undetermined`
> rather than `pass`. A check set that is vacuously satisfied is the `dh4f`
> defect.

The guard is `if (judgeable.length === 0)`. With one clean run registered,
`judgeable.length` is 1, nothing has failed, nothing is pending, nothing is
cancelled — so control reaches

```ts
return { state: "pass", names: [], because: `${judgeable.length} check(s) completed clean` };
```

**A partial check set is not an empty one, and it is not a complete one
either.** `2c2b` closed the vacuous hole and left the *nearly* vacuous one
open, which is the harder case: it produces a confident sentence with a
plausible number in it.

## The signal that exists and is not consulted

A check RUN does not exist until its job is created, so the run list cannot
say how many are coming. A check **SUITE** can: GitHub creates the suite when
the workflow is triggered and reports it `queued` before any run appears.
`pull_request_read` / the check-suites endpoint expose that.

So the fix is to ask the suites and treat

- a suite `queued` or `in_progress` with no runs yet → **pending**, not pass

Precedence slots below `fail` and beside the existing `pending`, since a suite
that has not produced runs is the same fact as a run still going.

**A second, weaker signal, deliberately NOT proposed as the fix:** comparing
against the check names seen on the base branch. That is a guess about what
*ought* to run, and a workflow whose triggers changed makes it wrong in both
directions — the `vq8g` shape.

## Why this one is high

Every merge decision in this repo now routes through this tool, and its whole
purpose is to stop an agent merging on an inference. A `pass` over an unstarted
check set does not merely fail to help: it **manufactures** the false
confidence it was built to prevent, and does it in the exact window an agent
polls — right after a push.

Measured in this session: I pushed at 16:13, polled at 16:13:58, and got
`PASS`. Had I taken it, I would have merged a head whose predecessor's
`TypeScript` job was red. That is the same merge I made earlier today at the
cost of a red `main`, arrived at by a different route.

## Done when

- [ ] A commit whose suites are queued with no runs reports **pending**, not
      pass, and `ci:watch` exits non-zero.
- [ ] Falsified against live data: poll a commit within seconds of pushing it
      and watch it refuse, then watch it pass once the suites finish.
- [ ] The base-branch-name-comparison alternative is written down as
      considered and rejected, so it is not rediscovered as an improvement.
- [ ] `2c2b`'s docblock says "empty" where it means "empty"; the partial case
      gets its own sentence, since the current wording reads as covering it.

## NOT in this bean

Whether `ci:watch` should be what the session-start sweep runs — that is
`2c2b`'s own open item and a different question.
