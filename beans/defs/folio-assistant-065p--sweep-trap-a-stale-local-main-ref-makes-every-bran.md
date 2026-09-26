---
# folio-assistant-065p
title: 'SWEEP TRAP: a stale local `main` ref makes every branch look like it carries unmerged beans'
status: todo
type: bug
priority: normal
created_at: 2026-09-25T15:48:01Z
updated_at: 2026-09-25T15:48:30Z
parent: folio-assistant-ahvw
---


Found 2026-09-25 during a `/goal-review` sweep, by axis 4's own instruction —
*"Items that exist only on a branch … Sweep the open branches' stores too, or
the review is blind to the largest workstream."*

## The trap

The natural way to write that comparison is the way the skill's prose implies:

```sh
git diff --name-only --diff-filter=A main..origin/<branch> -- beans/defs/
```

In this container the local `main` ref was **2655 commits behind**
`origin/main` (`4ba8b7a6712` vs `a83f8bee902`) — because a session fetches
`origin/main` and fast-forwards its own branch, and nothing ever moves the
local `main` ref.

So every branch appeared to carry **566–573 unmerged beans**. Against
`origin/main` the true answer across the nine most recently updated branches
was **1** (`oxka`, on `claude/cool-fermi-htir5p`).

Off by ~570x, in the direction that manufactures a crisis: an agent reading
that figure concludes the work plan has fractured across branches and starts
reconciling something that is not broken.

## Why this is an instruction gap and not just a mistake

The skill says *"sweep the open branches' stores"* and names the measurement,
but not the **ref to measure against**. Both readings are grammatical and one
is silently wrong by two orders of magnitude. The same trap sits in any check
comparing a branch to "main" in a container that only ever fetches.

It is also the `dh4f` shape inverted: instead of a consumer scanning nothing
and reporting clean, a consumer scans the wrong baseline and reports a
catastrophe.

## Done when

- [ ] `goal-review`'s axis 4 says **`origin/main`**, not `main`, and says why
      in one clause — so the next reader cannot pick the wrong one.
- [ ] A sweep that cannot confirm its baseline is fresh reports *could not
      determine* rather than a count. An unverifiable baseline is not a
      measurement, which is this repository's own standing rule.
- [ ] Check whether any committed check or script compares against a local
      `main` ref. Not yet measured — **this bean does not claim there are
      none.**

## Not in scope

Changing how sessions fetch. Keeping a local `main` current is one option and
naming the right ref is another; the second is cheaper and does not depend on
every agent remembering a step.
