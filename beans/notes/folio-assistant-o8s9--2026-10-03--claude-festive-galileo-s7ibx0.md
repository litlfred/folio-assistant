---
# note on folio-assistant-o8s9 from claude/festive-galileo-s7ibx0
$schema: folio-bean-note/v1
bean: folio-assistant-o8s9
branch: "claude/festive-galileo-s7ibx0"
created: "2026-10-03"
---
## Owner ruling on drain order — mechanism before throughput

Asked how to drain the queue given that each merge discards a sweep, the owner
chose **"Fix the mechanism first"** over merging on sight, freezing one sweep
window, or going to the root with the `auto-docs` branch (#1966):

> Hold merges until o8s9 (concurrency) and 8c6v (17 docs patterns) land, then
> drain. Both are dispatched and small. Costs ~30-45 min of throughput now;
> after it, my merges stop killing sweeps and ~53-of-55 conflicts auto-resolve.

The Merge Manager therefore merged nothing to `main` between #1764
(`1aaa669f998`) and this bean's own fix (#1969, `077c3673acc`).

**What the freeze measured, which was not what it was for.** Across it, `main`
moved **four times and every one was a `beans:claim` push**, never a merge:
`8c6v` 09:17:36Z, `ax6r` 09:38:42Z, `ay3x` 09:52:37Z, plus a direct
"Add files via upload" at 10:16. So a freeze on merges is not a freeze on
`main` — bean `24fa`'s evidence, gathered by accident.

**Why this note exists rather than an append to the bean body.** The body was
appended to on this branch while `beans:claim` put its own copy of the same
bean on `main` via #1969. With no common ancestor for the file, git saw an
**add/add** conflict, where any difference at all conflicts — and the
merge-main bot refused this branch three times on that one path while
resolving every other conflict by pattern. `bean-coordination` §"Adding to a
bean — a note, not an append" exists for precisely this, one file per branch
per bean, and ignoring it cost three refusals. The def is now byte-identical
to `main`'s and this note carries the addition.

## The cancel-in-progress fix is insufficient: 57% still cancelled

## The fix is insufficient — measured, with a named mechanism

`o8s9`'s second Done-when asked for the cancelled share of push-triggered
`merge-main` runs to be re-measured after a push lands mid-sweep. Measured
now, over the 100 most recent runs of `.github/workflows/merge-main.yml`
(window `2026-10-03T03:13:25Z` → `14:13:41Z`), split at the exact minute the
fix landed on `main` (#1969, merged `2026-10-03T10:06:06Z`, `077c3673acc`):

| push-triggered runs | concluded | cancelled | share |
|---|---|---|---|
| **before** the fix | 19 | 13 | **68 %** |
| **after** the fix | 28 | 16 | **57 %** |

So it moved 11 points and **did not solve the problem.** The fix is on `main`
and is the line it was meant to be — verified rather than assumed:

```
.github/workflows/merge-main.yml:151  concurrency:
.github/workflows/merge-main.yml:152    group: merge-main-${{ matrix.pr }}
.github/workflows/merge-main.yml:153    cancel-in-progress: ${{ github.event_name != 'push' }}
```

## Why it cannot work as written

**`cancel-in-progress` is read from the INCOMING run's configuration, not from
the config of the run being cancelled.** Both event types share one workflow
file and therefore one `concurrency.group`, so:

- a new **`push`** run evaluates the expression to `false` → it does not
  cancel the in-flight run. This half works.
- a new **`pull_request_target`** run evaluates it to `true` → it cancels
  whatever is in `merge-main-<pr>`, **including a push run**.

The guard protects a push run from other *push* runs. It does nothing about
the event that does the cancelling, which is the other one. Stated plainly:
the condition was put on the wrong side of the relation.

The distribution is what that mechanism predicts, and it is lopsided in
exactly the direction required:

| event | runs | cancelled | share |
|---|---|---|---|
| `push` | 49 | 29 | 59 % |
| `pull_request_target` | 46 | **1** | **2 %** |
| `workflow_dispatch` | 5 | 2 | 40 % |

Push runs are the victims almost exclusively, and `pull_request_target` runs
are essentially never cancelled — consistent with them being the cancellers.
Post-fix the two populations also interleave across the same window
(cancelled pushes `10:42:51Z`–`14:01:00Z`, 16 of them; PR-target runs
`10:33:40Z`–`14:10:59Z`, 22 of them), so there is no quiet period that could
explain the cancellations some other way.

**This is NOT a proof.** The run API does not say which run cancelled which,
so the mechanism above is a diagnosis consistent with the distribution rather
than a measurement of causation. What IS measured is that the fix left 57 %
of push runs cancelled, which is enough to say the Done-when fails.

## Not proposing the fix here

Separating the two event types is a design choice with at least two shapes —
distinct `concurrency.group` values per event, or dropping
`pull_request_target` from the group entirely — and they differ in what
happens when a PR is pushed to while its sweep runs. That belongs in its own
change with its own reason, per `merge-conflict-patterns`' rule that a
widened condition is never a substitute for a stated one.

## Done when

- [x] re-measure the cancelled share of push-triggered runs after the fix
      — **57 %, so the fix is insufficient**
- [ ] separate the event types so a `pull_request_target` run cannot cancel a
      `push` run, with the choice of shape stated
- [ ] re-measure once more, and record the share rather than the intention
