---
# folio-assistant-ssfp
title: beans:claim writes to process.cwd(), so an agent working in a git worktree claims in the WRONG checkout
status: todo
type: bug
priority: high
created_at: 2026-09-30T10:11:53Z
updated_at: 2026-09-30T10:11:53Z
parent: folio-assistant-ahvw
---


Measured 2026-09-30, on a live subagent. A session delegating to agents that
each work in their own `git worktree` — the pattern this repository's own
guidance pushes, and the one used for every agent in that session — has its
claims land in the wrong tree.

## The measurement

An agent was briefed to work in `/tmp/wtRJ/folio-assistant` and claim bean
`rjug`. Immediately after it reported the claim:

| tree | `status:` |
|---|---|
| `/tmp/wtRJ/folio-assistant` — the agent's worktree, where the work is | `todo` |
| `/home/user/folio-assistant` — the main checkout, doing something else | `in-progress` |

The claim landed in a tree that is not doing the work, **uncommitted**.

## Why

`cat-harness/scripts/claim-bean.ts`:

    export function claimOnDefaultBranch(id, branch, opts = {}) {
      const repo = opts.repo ?? process.cwd();

`process.cwd()` is right when the command runs inside the worktree and wrong
everywhere else, and **nothing notices the difference**. A bean store exists
at every checkout of this repository, so `findBean` succeeds in the wrong one
and the claim is reported as `✓ claimed`.

## What it costs, which is more than a misplaced file

1. **The agent's PR ships without its own claim.** Its branch still reads
   `todo`, so the bean on `main` never records that anyone took it.
2. **The next session sees the bean as unclaimed** and may take it, which is
   the collision `beans:claim` exists to prevent.
3. **A stray uncommitted claim sits in the other tree**, where whoever is
   working there finds it as unexplained dirt. That happened three times in
   one session (`ws99`, `rjug`, and one earlier), each time surfacing as a
   stop-hook complaint about uncommitted changes.

## Distinct from `c3d7`, and the signatures differ

`c3d7` is *"97 of 100 claims record no holder, so `beans:claim` reports
'✓ claimed' for work a sibling holds"* — the claim IS on `main` and carries
no holder note.

This one leaves **no claim on `main` at all**: the bean still reads `todo`.
So it cannot be the cause of `c3d7`'s 97, and a fix for `c3d7` — writing a
holder note — does not touch it. Same downstream feeling, two different
mechanisms.

## Done when

- [ ] a claim made from a worktree lands in THAT worktree, or the command
      refuses and says which tree it was about to write to
- [ ] the mismatch is detectable rather than silent — comparing the resolved
      store against `git rev-parse --show-toplevel` is one way, and is
      worktree-aware where `process.cwd()` is merely literal
- [ ] a test covers a claim invoked from a worktree, since no existing test
      exercises a second checkout

Not proposed here: whether `--repo` should become required. That is a
usability call with its own cost, and this bean is the measurement.
