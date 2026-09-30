---
# folio-assistant-2c2b
title: 'CI WATCH IS TWO-STATE: cancelled read as failure and reported a green main red — bun run ci:watch, three states with undetermined never collapsing'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-30T14:56:30Z
updated_at: 2026-09-30T19:42:58Z
parent: folio-assistant-1xhc
---

Issue #1624. Owner asked for this as a repo tool rather than session-local
scratch tooling, 2026-09-30.

## The defect, measured

An agent's CI poll folded `cancelled` into the failure set and reported **`main`
red** on `3d2c7fbe869`, whose every hard gate had passed:

```
success   Repository gates (hard)
success   TypeScript — tests, lint, types (hard)
success   End-to-end + accessibility (hard)
success   Skill-registration chain, unmasked (hard)
cancelled build-and-deploy            <- docs-site.yml, superseded by the next push
```

`ci-health`'s own rule, already written down and not followed:

> `cancelled` as a **third state**, and saying **whose** contention a
> cancellation was.

A two-state filter, written while working in a repository whose entire
discipline is that two states are not enough.

## What landed

| file | what |
|---|---|
| `cat-harness/src/workflow/check-verdict.ts` | the classification — pure, no network |
| `cat-harness/scripts/watch-ci.ts` | the CLI: `bun run ci:watch <sha>` |
| `cat-harness/scripts/tests/check-verdict.test.ts` | 15 tests |

**Exit codes carry the third state**, because a caller that reads "not 1" as
success rebuilds the collapse at the call site:

```
0  pass          every judgeable check completed clean
1  fail          a check failed, timed out, or needs action
2  undetermined  cancelled/superseded, still pending, no runs, or unreadable
```

## Precedence, and why each step sits where it does

1. **failure wins over everything** — a run that failed is a fact about the
   tree; a cancellation beside it does not soften that.
2. **pending beats cancelled** — while anything is still running nothing is
   concluded, because the in-flight run may yet fail.
3. **cancelled/stale with nothing failed is `undetermined`** — never a pass.
4. only then, `pass`.

## Two bugs, and the second was found by falsifying the first

**`cancelled` classified as failure** — the defect above.

**`stale` classified as failure** — the same collapse wearing a different
word, and it survived the first fix. GitHub marks a run `stale` when a **newer
run supersedes it**: that is the same concurrency fact as a cancellation, not
a verdict about the code. Moved to `undetermined`.

## The vacuous cases, which were one `else` from reading green

- **no check runs at all** → `undetermined`. A check set nobody ran is not a
  green one.
- **an unreadable response** → `undetermined`, not `pass`.
- **only `cleanup` / `cleanup-dispatch`** → `undetermined`. Those report
  `skipped` on every ordinary run, so counting them would make a commit with
  no real checks read as clean — and a test asserts they do not mask a real
  failure beside them.

That is `dh4f`: a consumer that looked at nothing and reported a clean run.

## WHOSE contention — asked of the branch, not the check run

The check run cannot say why it was cancelled. The branch can:

```
cancelled, and the branch HAS moved past this commit — superseded by: <commit>.
That is concurrency, not a failure. Judge the newer commit instead.
```

and, when it has not moved:

```
cancelled, and the branch has NOT moved past this commit. Nothing here
explains it — say could-not-determine and look, rather than assuming concurrency.
```

**The second branch is the one that matters.** "Probably concurrency" is
exactly the guess this tool exists to refuse, and a test asserts that string
is ABSENT when the branch has not moved.

## Not a duplicate of `check:ci-health`

That asks whether the **workflows** are passing on the default branch across
recent history. This asks about **one commit**: may I merge, must I fix, or do
I not yet know? They come apart in both directions — a workflow can be healthy
while one commit's run was cancelled, and a commit can be green while a
workflow has been red for a month on a path it never touched. Stated in both
docblocks so neither reads as a second answer to the other's question.

## Verified

Falsified against live data, not only fixtures:

```
3d2c7fbe869  UNDETERMINED  build-and-deploy, superseded by 5b8db8da691   exit 2
deadbeef000  UNDETERMINED  the check-run response could not be read      exit 2
(no sha)     usage + "no commit given — nothing to watch"                exit 2
```

15 unit tests; `typecheck`, `eslint`, `check:usage-paths`,
`check:command-paths`, `check:partition`, `root-scan-census:check`,
`audit:coverage:require-all`, `check:declared-paths` and `skill:register` all
pass. Classified `harness` in `instance-rules.ts` beside `check-ci-health.ts`,
by the same test: its subject is CI state, which is the harness's.

## One thing found in passing, NOT fixed here

**`build-and-deploy` was cancelled on both commits probed.** If `docs-site.yml`
is routinely superseded before it finishes, the docs site may be deploying far
less often than the workflow's green history suggests — which is the Pages
question `ci-health` asks separately and reports as a third state for the same
reason. **Not measured here**, and must not be read as established: two
observations are not a rate.

## Done when

- [x] Three states, with `undetermined` carrying its own exit code.
- [x] `stale` classified with `cancelled`, not with failure.
- [x] The vacuous cases refuse to read as `pass`.
- [x] A cancellation names its superseding commit, or says it cannot.
- [ ] Whether the session-start sweep should USE it — it currently runs
      `check:ci-health`, which answers a different question. Not presumed.
- [ ] Whether `build-and-deploy` is chronically superseded. Two observations
      are not a rate; this needs the run history, which `ci-health` already
      fetches.

_2026-09-30T19:42:58Z_ — Claimed by claude/magical-archimedes-4qkfxp-2c2b — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
