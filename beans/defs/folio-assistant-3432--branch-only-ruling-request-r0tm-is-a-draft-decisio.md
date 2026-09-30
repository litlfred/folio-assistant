---
# folio-assistant-3432
title: 'BRANCH-ONLY RULING REQUEST: r0tm is a draft decision with a recommendation and a safe default, reachable from no ancestor of main'
status: todo
type: task
created_at: 2026-09-30T11:33:55Z
parent: folio-assistant-ahvw
updated_at: 2026-09-30T11:33:55Z
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
