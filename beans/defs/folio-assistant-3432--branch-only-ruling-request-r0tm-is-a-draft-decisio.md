---
# folio-assistant-3432
title: 'BRANCH-ONLY RULING REQUEST: r0tm is a draft decision with a recommendation and a safe default, reachable from no ancestor of main'
status: todo
type: task
priority: normal
created_at: 2026-09-30T11:33:55Z
updated_at: 2026-09-30T19:50:14Z
parent: folio-assistant-ahvw
---

## The finding, and how it was measured

`beans/defs/folio-assistant-r0tm--adapters-closure-*.md` exists on exactly one
ref — `origin/claude/yj6r-adapters-closure-plan` — and its commit
(`974a0eac0ce`) is **not an ancestor of `origin/main`**:

    git merge-base --is-ancestor 974a0eac0ce origin/main   -> non-zero
    git branch -a --contains 974a0eac0ce                   -> that one branch

It is not an ordinary work item. Its front matter is `status: draft`, its title
is *"ruling request"*, and it carries a `## 6. Recommendation` with a marked
option A and a stated **safe default**. Its own body says *"Plan only — no
source file in this repository is changed by this work"*. So its entire purpose
is to put a decision in front of the owner — and the store the owner reads
cannot show it.

Provenance: four git commands against the fetched remote refs, 2026-09-30.

## Why this is the store's problem and not the sibling's

`AGENTS.md` gives one reason for the bean store being committed: *"`beans/` is
committed, so the plan survives a resume in a fresh container"* — and
`bean-coordination` adds the cross-session half, that a claim **announces**.
Both assume a sibling's beans become visible when its PR lands. A `draft`
ruling request breaks that assumption in the one case where it costs most: the
work is deliberately *not* landing, because it is waiting on the answer, so the
event that would publish the question is gated on the question.

A bean on an unmerged branch is normally fine and this bean does not claim
otherwise. What is not fine is a bean **whose type is a request to the owner**
being unreachable from the owner's own view.

## Done when

1. The `r0tm` ruling request reaches the owner — as an issue comment, a review
   question, or a bean on a landed branch. Which one is the owner's call.
2. A check reports beans that are `status: draft` **and** carry a
   recommendation/default section **and** exist on no ancestor of the default
   branch, with a denominator. `could not determine` is a finding, never green
   (`dh4f`).
3. `bean-coordination` says what a session owes a `draft` decision bean it does
   not intend to land soon.


## CORRECTION + RULING 2026-09-30 — the question DID reach the owner, twice

The owner chose **relay it here**, and carrying that out falsified part of this
bean's premise. Recorded rather than quietly dropped.

### What this bean got right

`r0tm` is on exactly one ref and its commit is not an ancestor of `origin/main`.
Re-verified. Its front matter is `status: draft`, it carries a
`## 6. Recommendation` with a marked option A and a stated safe default (D), and
its body says *"Plan only."* All as described.

### What it got wrong

The finding reads as though the question is unreachable from the owner's view.
It is not. `r0tm`'s own closing section says where it was put:

> Posted as a comment on issue #1558, the escape-tranche issue, 2026-09-30

and **PR #1581** — *"beans(r0tm): the adapters closure, planned"* — is OPEN
against #1558, which #1558 lists under `closed_by_pull_requests`. Issue #1558 is
open with 7 comments.

So the question reached the owner through **two** of the three channels this
bean's own done-when item 1 names as acceptable ("an issue comment, a review
question, or a bean on a landed branch"). Item 1 was already satisfied when this
bean was written.

**The store-visibility gap is real; the "cannot reach the owner" framing was
not.** A bean unreachable from `main` is invisible to a sibling SESSION reading
the committed store — which is a coordination cost, and the accurate statement
of the defect. It is not an owner-visibility cost, because a draft ruling
request that follows the convention posts to the issue as well.

### Done when — restated on the corrected finding

1. [x] The `r0tm` ruling request reaches the owner — **already done** via
       issue #1558's comment and PR #1581, before this bean existed. Relayed in
       chat as well, on the owner's ruling.
2. [ ] A check reports beans that are `status: draft` AND carry a
       recommendation/default section AND exist on no ancestor of the default
       branch, **with a denominator**. `could not determine` is a finding, never
       green (`dh4f`). Still worth building — for SIBLING visibility, which is
       the corrected subject.
3. [ ] `bean-coordination` says what a session owes a `draft` decision bean it
       does not intend to land soon. The answer `r0tm` demonstrates: post the
       question to the issue, and say on the bean where it was posted. That is a
       convention worth writing down because it WORKED here.

### The lesson

I wrote "the store the owner reads cannot show it" from the git measurement
alone, without checking the two channels the bean itself went on to list. The
measurement was right and the conclusion overreached — the same shape as
declaring a gate flappy without checking whether the base had moved
(bean `gm9g`, same session, same day).
