---
# folio-assistant-7iog
title: 'COMMAND PATHS ARE CHECKED AGAINST THE REPO, NOT THE RUN: three of four backoff calls in feature-staging resolved at check time and not at run time'
status: in-progress
type: bug
priority: high
created_at: 2026-09-20T21:55:16Z
updated_at: 2026-09-20T22:45:13Z
parent: folio-assistant-ahvw
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

- [x] A check resolves workflow-command paths against the step's effective cwd
      (job checkout layout + `working-directory:`), not the repository root
- [x] It is falsified in both directions on the three sites fixed here
- [x] `a6kl` is re-read against it — same root cause, and it should either be
      caught by this or have its own reason for not being
- [x] `check:command-paths`' summary line stops claiming "every
      repository-relative path resolves" when what it verified is narrower

## What it actually was — smaller, and not where the bean pointed

*2026-09-20, session_01AYHimvYMmf8h8e9fFN6dW5.*

**The reader this bean asks for already exists.** `check:workflow-paths`
(bean `52dz`) parses the workflows, computes a cwd from `defaults.run`, the
step's `working-directory` and any `cd` in the block, and already collected
`actions/checkout` `path:` values. So this is not a missing check; it is one
input short of a complete one, and the fix is ~40 lines rather than a new
module.

`check:command-paths` — the reader this bean names — does not read workflow
YAML at all. Its corpus is markdown fenced blocks, `.ts`/`.sh` printed
commands and `.claude/settings.json`. Verified by reverting line 1021 and
running it: `✓ every repository-relative path inside a fenced command
resolves`, exit 0. Both readings are true, but the proximate reason it was
silent is that workflows were never in its frame, not that it judged them
wrongly.

### The defect, exactly

`checkoutPaths` was used ONLY to strip a prefix, which can only ever make a
check **more** permissive:

| invocation | under a checkout? | old verdict | at run time |
|---|---|---|---|
| `source/cat-harness/x.ts` | yes, stripped | resolves | resolves |
| `cat-harness/x.ts` from the workspace root | no, left alone | **resolves** (measured against the repo) | **empty directory, step aborts** |

Knowing the prefixes is not knowing where the tree IS. `atRoot` is the half
that was missing: when a job checks this repository out somewhere else and
nothing to the workspace root, a path landing at the root names a directory
the job never materialised.

### A third state the bean did not have

Sites 1021 and 1086 were caught by that rule; **1303 was not**, and the reason
is worth keeping. Its cwd is `pages`, which is `actions/checkout` with
`ref: gh-pages` — this repository at a different commit. The broken form
joins to `pages/cat-harness/…`, which IS under a collected checkout, so the
prefix was stripped and the path measured against HEAD's tree. Now a checkout
carrying a non-self `ref:` is kept apart from the HEAD checkouts, and a path
landing inside one is `Undetermined` — the directory and its contents are
real, they are simply not readable from here. Not a pass, per this module's
own house rule.

### The failure message was itself the misconception

The generic line read *"`cat-harness/scripts/backoff-sleep.ts` does not
resolve from the repository root"* — which is **false**; it resolves there
perfectly well, and that is the entire trap. A `note` now overrides it and
says what is actually wrong. A check that misdiagnoses its own finding sends
the next reader to fix the wrong thing.

### `a6kl` is not caught, and that is the right answer

CI runs `bun run check:l1-complete` — an npm script NAME, which `invokedPath`
declines on purpose, because naming the script instead of the path is the fix
this check recommends. The workflow line was correct; `check:l1-complete`
resolved its own corpus from `process.cwd()`. So the recommended fix **moves**
the exposure rather than removing it: out of the workflow, into the script's
own root resolution — which is `check:anchor-names`' subject, and why `a6kl`'s
fix resolves `INSTANCE_ROOT` rather than the CWD. Recorded in the module
header so the pair is legible from either end.

### Verification

Falsified in both directions. Each of the three sites broken in turn is
caught with an accurate, distinct reason; the tree as it stands passes with
**0 findings across 61 invocations**, so the new rule has no false positives
on this corpus. Six tests added, of which exactly two go red when the two new
rules are stubbed out — the other four are false-positive guards that must
pass either way.

### The ordinal collision, unresolved

This bean calls itself "a fourth class beyond `b963`'s three" while `b963`'s
own fourth class is what `check:anchor-names` shipped for. Two different
defects wearing the same number. Left for the owner; renaming either would
break references from commits and sibling beans.

Related: `b963` (the three known classes; this is a fourth), `a6kl` (same root
cause, different victim, `critical`), `06kg` (the sweep that introduced it),
`yzsj` / #605 (the work that surfaced it), `dh4f` (a clean run reported over
nothing).
