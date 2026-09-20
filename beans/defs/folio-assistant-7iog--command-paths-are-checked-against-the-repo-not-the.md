---
# folio-assistant-7iog
title: 'COMMAND PATHS ARE CHECKED AGAINST THE REPO, NOT THE RUN: three of four backoff calls in feature-staging resolved at check time and not at run time'
status: todo
type: bug
priority: high
parent: folio-assistant-ahvw
created_at: 2026-09-20T21:55:16Z
updated_at: 2026-09-20T21:55:16Z
---

Found 2026-09-20 (session_017PqeiS4JYySSWGAYLedmus) while implementing #605's
`merge=union` half, in the very loops that fix was going into.

## The defect, measured

`feature-staging.yml` has four retry loops. Each calls `backoff-sleep.ts` —
the ONE shared implementation bean `06kg` established. **Three of the four
name a path that does not exist at run time:**

| loop | job | `working-directory` | platform checked out at | `render-log` call | `backoff-sleep` call | ok? |
|---|---|---|---|---|---|---|
| 787 | `stage` | job root | job root | `cat-harness/…` | `cat-harness/…` | yes |
| 999 | `cleanup` | job root | `source/` | `source/cat-harness/…` | `cat-harness/…` | **no** |
| 1064 | `cleanup` | job root | `source/` | `source/cat-harness/…` | `cat-harness/…` | **no** |
| 1270 | `cleanup-dispatch` | **`pages`** | `source/` | `../source/cat-harness/…` | `cat-harness/…` | **no** |

In every broken case the `render-log` call **in the same step** gets the path
right and the backoff call does not. `stage`'s is correct by coincidence — its
platform happens to sit at the job root.

Workflow `run:` blocks default to `bash -e`, so a `bun run` against a missing
module **aborts the step**. The retry those loops exist to provide therefore
never ran: the first lost push race ended the job.

## Why it is `06kg` inverted, not `06kg` repeated

`06kg` was right to make the backoff ONE implementation — four copies of
`sleep $((attempt * 5))` could drift in behaviour. But it swept one literal
call string across four call sites that stand in **three different path
contexts**. Unifying the implementation is correct; assuming the call text is
therefore uniform is not.

## The reader gap — this is the part worth building

`check:command-paths` exists for exactly this class (`b963`) and **does not
catch it**. Falsified directly: with line 1021 reverted to the broken path it
reports

> ✓ every repository-relative path inside a fenced command resolves

and exits **0**.

It is not wrong on its own terms. `cat-harness/scripts/backoff-sleep.ts` **does**
resolve — from the repository root. The command runs somewhere else. **The
check validates against the repository; the path is consumed at an execution
context the check cannot see**, which for a workflow step is the product of the
job's checkout layout (`path:` on `actions/checkout`) and the step's
`working-directory:`.

So this is a FOURTH class beyond `b963`'s three, and it is the nastiest,
because the check reports a clean run over it — the `dh4f` shape aimed at the
checker rather than at a directory.

**`a6kl` is the same root cause with a different victim**: `check:l1-complete`
resolved its corpus from the repository root, found no `harness.json` there,
and reported *"nothing to check"* over 1,402 files. That bean is one broken
gate; this one is the reader that would find the family.

## What a reader needs

For each command inside a workflow `run:` block, resolve its paths against the
step's **effective** cwd rather than the repo root:

1. the job's checkouts — `actions/checkout` `path:` per job, defaulting to the
   job root;
2. the step's `working-directory:`, if any;
3. then ask whether the literal resolves **there**.

All three are declared in the same YAML the check already reads, so this needs
no new source of truth. The hard part is that a path may legitimately point
into a *different* checkout (`../source/…` is correct at line 1238), so the
answer is "resolves under some checkout this job made", not "exists in the
repo".

## Done when

- [ ] A check resolves workflow-command paths against the step's effective cwd
      (job checkout layout + `working-directory:`), not the repository root
- [ ] It is falsified in both directions on the three sites fixed here
- [ ] `a6kl` is re-read against it — same root cause, and it should either be
      caught by this or have its own reason for not being
- [ ] `check:command-paths`' summary line stops claiming "every
      repository-relative path resolves" when what it verified is narrower

Related: `b963` (the three known classes; this is a fourth), `a6kl` (same root
cause, different victim, `critical`), `06kg` (the sweep that introduced it),
`yzsj` / #605 (the work that surfaced it), `dh4f` (a clean run reported over
nothing).
