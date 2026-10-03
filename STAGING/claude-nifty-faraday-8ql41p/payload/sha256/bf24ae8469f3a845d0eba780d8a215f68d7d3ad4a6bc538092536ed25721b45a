---
# folio-assistant-24fa
title: beans:claim pushes to main, which GUARANTEES a refuse-class conflict on the claiming branch's own completion
status: todo
type: bug
created_at: 2026-10-03T00:43:10Z
updated_at: 2026-10-03T00:43:10Z
parent: folio-assistant-d33q
---

## Measured on itself, 2026-10-03

`bun run beans:claim 8rff` writes the claim **straight to `main`**:

> `_2026-10-03T00:27:48Z_ — Claimed by claude/merge-patterns-8rff — pushed to
> main so sibling sessions see it before this branch has a PR (bean 35nj)`

That is deliberate and it works — `35nj` ("A bean claim is invisible to a
sibling until the PR exists, so claim-before-work does not prevent a
same-minute duplicate", `completed`) is the bean it solves.

**The cost is not recorded anywhere, and `35nj` mentions conflict zero
times.** The claiming branch then edits the same bean to complete it, so both
sides diverge from the merge base in the same file:

| side | change |
|---|---|
| `main` | `status: todo → in-progress`, new `updated_at`, the claim note appended |
| the claiming branch | `status: todo → completed`, new `updated_at`, a `## Summary of Changes` |

`merge-conflict-patterns` classifies `beans/defs/**` as **`refuse`** on
purpose, and `merge:main` is all-or-nothing, so **the whole merge refuses** on
a bean the claiming session owns outright and nobody else touched.

Measured instance: PR #1943 merging `origin/main` (`ea1d8b105`) refused on
**exactly one** path — `beans/defs/folio-assistant-8rff--…md` — and that
conflict was entirely between two actions of the same session.

## Why this is worth more than its size

**Every bean-completing PR now hits it.** Claim the bean (pushes to main),
complete it on the branch, merge — refuse. It is not an edge case; it is the
normal path, and it manufactures precisely the `[beans: refuse]` class that
blocked #1894 and then #1943.

It also makes the refusal reason misleading. The resolver says *"two sessions
editing one bean is a coordination question"* — true in general, and **false
here**: it is one session, and there is nothing to coordinate. An agent
reading that text looks for a sibling who does not exist.

## Options, none chosen

1. **Claim on the branch and let the PR carry it.** Loses `35nj`'s whole
   point — the claim becomes invisible until the PR exists.
2. **Keep the main push, and have `beans:claim` also write the identical note
   to the branch.** Then the body merges cleanly (git merges identical
   changes) and only the front-matter `status` line can conflict. Cheap, and
   it is what was done by hand on #1943.
3. **A `beans-claim-note` strategy** that resolves the claim block by union
   while leaving the rest of `beans/defs/**` refused. Narrow, and it would
   have to dedupe `updated_at` — `check-bean-front-matter`'s recorded defect.
4. **Accept it**, and change the refusal TEXT so it stops asserting two
   sessions when one will do.

(2) and (4) are compatible and together cost least. Recorded as options
because this is a design question, not a defect with one fix.

## Done when
- [ ] owner or coordinator picks an option
- [ ] if the text stays: the refusal no longer claims "two sessions" when the
      two edits may be one session's
- [ ] `35nj` annotated with the cost its remedy creates, since it is the bean
      a reader lands on

