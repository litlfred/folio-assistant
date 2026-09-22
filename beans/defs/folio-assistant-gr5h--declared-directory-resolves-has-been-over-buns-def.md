---
# folio-assistant-gr5h
title: declared-directory-resolves has been over bun's default 5s timeout the whole time — 9.3s measured, passing only on a fast enough machine
status: completed
type: bug
priority: normal
created_at: 2026-09-22T06:55:59Z
updated_at: 2026-09-22T07:22:05Z
parent: folio-assistant-1xhc
---

Found 2026-09-22 while driving `a58y` to green. **Pre-existing on `main`, not
introduced by the branch that found it** — measured both sides: 55 modules
call a directory accessor on `main` and 55 on the branch, so the workload is
identical.

## What it actually was

Not a flake, and not an assertion failure:

    (fail) each one resolves `library` in a FRESH process [5038.08ms]
      ^ this test timed out after 5000ms.

The test spawns **one subprocess per module** — that isolation is its whole
point, since in one process the first module to reach core registers `folio`
for all of them and the test becomes incapable of failing. The cost is
unavoidable and it is large:

| | |
|---|---|
| modules discovered | 55 |
| wall time, three runs | 9,226 / 9,269 / 9,395 ms |
| per spawn | ~169 ms |
| bun's default test timeout | **5,000 ms** |

**So it has been over budget for as long as the corpus has been this size**,
and passed only where the machine was fast enough. That is the worst failure
mode available: green in CI, red on a contributor's laptop, and nothing in the
output saying which — the same shape as `xom7`, where a workflow's outcome was
invisible from a checkout.

It read as a flake twice before it was measured, which is the lesson: *"flake"
is not a root cause*, and the one measurement that settled it was reading
bun's own message rather than the pass/fail line.

## The fix, and why it is not a weakening

The budget is now **derived from the module count** —
`modules.length * SPAWN_BUDGET_MS`, 600 ms/module, ~3.5x the measured cost —
rather than written as a number.

A number is exactly what went stale. The corpus grows, the spawn count grows
with it, and a fixed timeout silently tightens on every module added. Deriving
it means the budget tracks the work, so this cannot recur by accretion.

Nothing is skipped, disabled or quarantined: the test does the same work and
makes the same assertion. Only the limit — which was never set for a test that
spawns 55 processes — is now stated.

## Done when

- [x] The failure is diagnosed as a timeout rather than dismissed as a flake
- [x] Measured: 9.3 s against a 5 s default, three runs within 170 ms
- [x] Established as pre-existing — 55 modules on `main` and on the branch
- [x] The budget is derived from the workload, so it cannot go stale by growth

## Summary of Changes

`declared-directory-resolves` was timing out, not failing an assertion — 9.3 s
of subprocess spawns against bun's 5 s default, so it had been over budget for
as long as the corpus has been this size and passed only on fast enough
machines. Established as pre-existing: 55 modules on `main` and on the branch.

The budget is now derived from the module count (`modules.length *
SPAWN_BUDGET_MS`) rather than written as a number, because a number is exactly
what went stale. Nothing skipped, disabled or quarantined.

Verified on `main` at `2ce66fc`. Merged in #848.
