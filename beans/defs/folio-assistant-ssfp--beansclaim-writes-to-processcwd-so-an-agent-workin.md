---
# folio-assistant-ssfp
title: beans:claim writes to process.cwd(), so an agent working in a git worktree claims in the WRONG checkout
status: completed
type: bug
priority: high
created_at: 2026-09-30T10:11:53Z
updated_at: 2026-09-30T17:48:33Z
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

- [x] a claim made from a worktree lands in THAT worktree, or the command
      refuses and says which tree it was about to write to
- [x] the mismatch is detectable rather than silent — comparing the resolved
      store against `git rev-parse --show-toplevel` is one way, and is
      worktree-aware where `process.cwd()` is merely literal
- [x] a test covers a claim invoked from a worktree, since no existing test
      exercises a second checkout

Not proposed here: whether `--repo` should become required. That is a
usability call with its own cost, and this bean is the measurement.


## My proposed fix was wrong on the half that did the damage — corrected 2026-09-30

I suggested comparing the target store against `git rev-parse --show-toplevel`.
A sibling agent that hit this live checked it and the objection is right:

> **A worktree's toplevel *is* the worktree, so that check passes in exactly this
> case: the store was correct, the branch name was not.**

That is worth stating plainly because it inverts what the bean looked like. The
`process.cwd()` dependency is in **two** places in `claim-bean.ts` — the store
(~lines 185, 426) and the holder branch (`git rev-parse --abbrev-ref HEAD` in
that same directory) — and the damaging one is the **label**, not the store.
Measured on `rjug`: the claim **did** land correctly on `main` (`e1815ab372f`,
2026-09-30 10:09:58Z) and was not lost; it recorded `heldBy` as
`claude/zhg2-direction-sidecar`, the branch the main checkout happened to be on.
Re-running from the correct worktree then refused `already-claimed by
claude/zhg2-direction-sidecar`, because the script compares `heldBy` against the
current branch and **a mislabelled claim is indistinguishable from a sibling's.**

So a store-only guard would have reported everything fine while producing the
exact failure this bean is about.

### The narrower fix, and a second guard worth having on its own

1. **Derive the holder branch from the repository the bean's store was found
   in**, not from the process cwd — `git -C <dirname of the store> rev-parse
   --abbrev-ref HEAD`. Then store and label cannot disagree, which is the
   invariant actually wanted; the store's own location becomes irrelevant to
   correctness rather than something to police.
2. **When `heldBy` names a branch that does not exist on the remote, say so**
   instead of reporting a flat `already-claimed`. That is the case that
   currently reads identically to a live sibling, and it is the reason a
   mislabelled claim costs a second agent time rather than being self-evident.
   Independent of (1) and useful even after it.

Whether `ssfp` takes one or both is open. (1) alone fixes the cause; (2) alone
fixes the *symptom* for every mislabelled claim already on `main` — of which
`c3d7` measured 97 out of 100 `in-progress` beans recording no usable holder at
all, so the existing population is large and (1) does nothing for it.

### Kept, not erased

`main`'s mislabelled note on `rjug` was left in place through the merge. Erasing
it would erase the evidence, and `deletion-requires-confirmation` applies to a
record of a mistake as much as to anything else.

_2026-09-30T17:47:07Z_ — Claimed by claude/magical-archimedes-4qkfxp-ssfp — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Summary of Changes

Built 2026-09-30, branch `claude/magical-archimedes-4qkfxp-ssfp`, and claimed from its own worktree.

- **The claim resolves the checkout's top level.** It uses `git rev-parse --show-toplevel` rather than the literal `process.cwd()`, so running from a subdirectory of a worktree claims in that worktree.
- **The command says which tree it claims from.** Every run prints `claiming from <tree> (branch <b>)`.
- **A claim from the wrong checkout is refused, not misattributed.** New `wrongCheckout()`: if the checkout is on the default branch or detached, the command exits 5 and names the tree it was about to write to. That is the signature of the measured failure, where the main checkout sat on `main` while a worktree held the work. `--repo <worktree>` and `--any-branch` are the ways out.
- **Tests.** Three new cases in `claim-bean.test.ts` against a real bare remote and a real `git worktree`:
  - a claim from the main checkout on `main` is refused, and its bean is untouched;
  - a claim from a subdirectory of the worktree lands in the worktree, and the main checkout's copy is untouched;
  - `wrongCheckout` names the tree.
  18 pass, and the four other claim test files pass too (60 tests).
- **Documented.** `bean-coordination` explains the refusal and its exit code.
