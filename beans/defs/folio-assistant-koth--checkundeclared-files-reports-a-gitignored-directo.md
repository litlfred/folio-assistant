---
# folio-assistant-koth
title: check:undeclared-files reports a gitignored directory, so stale __pycache__ reds the gate forever
status: completed
type: bug
priority: low
created_at: 2026-09-20T12:56:15Z
updated_at: 2026-09-20T13:56:15Z
parent: folio-assistant-o3xy
---

Found 2026-09-20 while working bean `7yvd`, on a container where `bun run
gates` had been green an hour earlier.

## What happens

`check:undeclared-files` and the `"the root is clean, and stays that way"`
test both report `scripts/` at the repository root. It holds **zero tracked
files** — only `__pycache__/` with three `.pyc` files whose sources moved
under `cat-harness/` in commit `c25761d2cf`. `.gitignore:31` ignores
`__pycache__/`, so git has nothing to say about the directory at all.

Measured: `git ls-files scripts/` → 0. `git check-ignore -v
scripts/__pycache__` → `.gitignore:31:__pycache__/`. Stashing every local
change and re-running the test reproduces the failure identically, so it is
not caused by any diff.

## Why it matters, and why it is not just tidiness

The sweep walks the WORKING TREE. A contributor who ever ran one of those
Python scripts before the move now has a **permanently red gate** that no
commit can fix and no clean checkout reproduces — a local-only failure that
looks exactly like a repository-wide one. That is the worst shape for a gate
to have, because the first thing a reader does is doubt their own branch.

The `mggs` finding this check exists for was three 1.6–1.8 MB PNGs committed
at the root, which git DOES know about. Nothing in that case needed a
gitignored path to be reported.

## The question, which is not obviously one-sided

Ignoring gitignored paths would have missed nothing in the motivating case.
But a `.gitignore` entry is also a place to hide something, and a sweep that
honours it can be silenced by editing one line. So the fix may be to report
an ignored path in a **separate, non-failing** section rather than to drop it
— the same shape as `unchecked` in the link auditor.

## Not done here

`deletion-requires-confirmation`: the stale `__pycache__` was left in place
and reported rather than removed, even though it is regenerable bytecode.
Nothing was deleted to make a gate green.

## CLOSED by a sibling, 2026-09-20 — and my diagnosis here was WRONG

`0f3dec084a` on `main`: *"check-undeclared-files: a directory holding only
ignored files is not a finding"*. Not my work; recorded here so this bean does
not sit open over a fixed defect.

**The correction matters more than the closure.** This bean says the sweep
"reports a GITIGNORED directory". That is not what was happening —
`gitIgnored()` already asks git, and `_kg/` is the case it was written for.
The real gap is narrower:

```
git check-ignore scripts             -> NOT ignored
git check-ignore scripts/__pycache__ -> ignored (.gitignore:31)
```

`.gitignore` names `__pycache__/`, not `scripts/`. So the **husk** — a
directory that exists only because something wrote ignored files into it —
was not itself ignored, and got reported. Their `holdsOnlyIgnored()` asks both
`ls-files` and `status --untracked-files=all`, because each covers the other's
blind spot, and returns false when git is unavailable so the sweep REPORTS
rather than skips.

**The second done-when is withdrawn rather than left unmet.** It asked that a
path the sweep declines to fail on still be SHOWN, on the grounds that "a
silent drop is how the `mggs` PNGs got in". Their falsification answers it:
*cache only → skipped; cache + one real untracked file → REPORTED*. The skip
is provably narrow, so in the case it covers there is nothing being dropped to
show. Inventing display work to satisfy a checkbox I wrote would be worse than
withdrawing it.

## Done when

- [x] a gitignored path at the root does not red the gate for one contributor
      while a clean checkout is green — `0f3dec084a`, a sibling's
- [~] a path the sweep declines to fail on is still SHOWN — **withdrawn**, see
      above: the skip is narrow enough that nothing is dropped to show
