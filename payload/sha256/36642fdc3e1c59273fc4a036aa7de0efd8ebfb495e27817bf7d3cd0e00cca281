---
# folio-assistant-r3y6
title: beans:rollover raises adjudicate where one side is a strict SUPERSET — a false positive a person must not be spent on
status: in-progress
type: bug
created_at: 2026-10-03T00:13:30Z
updated_at: 2026-10-06T21:45:13Z
parent: folio-assistant-fs43
---

`bun run beans:rollover` (issue #1850 step 2) classifies each authored bean path a PR
touches as `already-on-main`, `port`, `adjudicate` or `could-not-determine`. The
`adjudicate` state means BOTH the PR and the base changed the bean since the fork, so a
person must pick, because porting either way drops the other's edit.

That default is right. But it cannot yet see the case where one side's content is a
**strict superset** of the other's once `updated_at` is set aside — and then no edit is
at risk and no person is needed.

## The measured instance

Run 2026-10-03 against `origin/main`: 28 PRs, 166 authored bean paths, **164 port, 2
adjudicate, 0 could-not-determine**. One of the two adjudications was not real.

`beans/defs/folio-assistant-2h76--state-branch-p2-...md` on PR #1937. The whole
difference between main's copy and the PR's:

    7c7
    < updated_at: 2026-10-02T22:42:36Z      (main)
    > updated_at: 2026-10-02T22:42:40Z      (#1937)
    55,56d54
    < _2026-10-02T22:42:36Z_ — Claimed by claude/state-branch-store — pushed to main so
      sibling sessions see it before this branch has a PR (bean 35nj).

Four seconds apart, the same `status: todo` → `in-progress` transition on both sides, and
the PR's copy simply **lacks** the claim note that the same session pushed to main. Main's
version contains everything the PR's version contains. Resolution is "take main", and
nothing is lost.

So of the 2 adjudications, one was a genuine two-sided edit (`dlqu` on #1894, which the
owner ruled "keep both") and one was this. **Half the human-adjudication load in that run
was a false positive**, and the shape will recur because `bean-coordination`'s own
practice — push the claim to main so siblings see it before the branch has a PR (bean
`35nj`) — produces exactly it.

## Why this is NOT just "add a fifth state and auto-resolve"

The dangerous direction is the one to design against. A tool that resolved a
"superset" silently would drop an edit any time the subset test was wrong — and a bean id
is referenced from commits, issues and other beans, so that loss is not local. The whole
reason `adjudicate` exists is that porting the wrong way is invisible afterwards.

So the state must still say a person MAY look. Something like `port-superset`: reported
separately from `adjudicate`, carrying which side is the superset and the exact diff, and
counted in neither the "needs a person" total nor the plain `port` total.

`differsOnlyInRegions` in `cat-harness/scripts/merge-pipeline-paths.ts` is the precedent:
it answers a narrower question than "are these equal" and is used only where that
narrower answer is sufficient. Reuse the shape, not a new classifier — a second answer to
"what differs" is free to disagree with the first.

## Done when
- [ ] `updated_at` is excluded from the comparison, by name, with a test that a change to
      ONLY `updated_at` is not an adjudication
- [ ] a strict-superset side is detected and reported as its own state, never folded into
      `port` and never auto-resolved
- [ ] a NEGATIVE control: two genuinely divergent bodies (the `dlqu` case) still report
      `adjudicate`, so the refinement cannot swallow a real one
- [ ] the exit-code contract still distinguishes "needs a person" from "portable"

_2026-10-06T21:45:13Z_ — Claimed by claude/r3y6-rollover-superset — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
