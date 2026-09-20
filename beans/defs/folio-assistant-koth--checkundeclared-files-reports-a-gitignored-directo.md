---
# folio-assistant-koth
title: check:undeclared-files reports a gitignored directory, so stale __pycache__ reds the gate forever
status: todo
type: bug
priority: low
created_at: 2026-09-20T12:56:15Z
updated_at: 2026-09-20T12:56:31Z
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

## Done when

- [ ] a gitignored path at the root does not red the gate for one contributor
      while a clean checkout is green
- [ ] whatever the answer, a path the sweep declines to fail on is still
      SHOWN — a silent drop is how the `mggs` PNGs got in
