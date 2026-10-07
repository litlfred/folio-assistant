---
# folio-assistant-5ulq
title: 'STRICT IN NAME ONLY: 9 workflow instances against 755 merges, and no gate reads beans/workflows at all'
status: todo
type: bug
created_at: 2026-10-02T23:49:21Z
updated_at: 2026-10-02T23:49:21Z
parent: folio-assistant-0ipy
---

## Measured 2026-10-02 at `871b1da1c`

| | |
|---|---|
| instance files in `beans/workflows/` | **9** |
| first-parent merge commits on `origin/main` since 2026-09-20T18:00Z | **755** |
| gates or workflows referencing `beans/workflows` | **0** (grep over `.github/workflows/` and `cat-harness/scripts/check-*.ts`) |
| bean `vlhk`, which made the rule mandatory | `status: completed`, archived |

`AGENTS.md` §"Say which process you are in" states the rule as STRICT and
cites `vlhk` — *"54 merges in one window with `beans/workflows/` holding only
`.gitkeep` … a STRICT rule whose breach looked exactly like compliance"* — and
records the owner settling it on 2026-09-20: a turn inside a process has an
instance under the declared `workflow-state` graph.

**The remedy did not take, and the only thing watching is a printed line.**
The session-start sweep reports "no instance recorded" as a finding; a printed
verdict is gone the moment the terminal scrolls, which is the exact argument
`kg:audit` makes for committed sidecars over console reports. So the breach
`vlhk` measured at 54 merges is now larger by roughly an order of magnitude,
and the bean that recorded it is closed.

**The honest denominator is unknown and that is stated rather than inferred.**
Not every merge is a turn inside a process — a merge-steward landing somebody
else's train, a docs-only fix, a revert may legitimately have no instance. I
did not compute how many of the 755 owed one, so the ratio is an upper bound
on compliance, not a measurement of non-compliance. What IS measured without a
denominator: **zero gates read the graph**, so no number could be enforced at
any threshold.

A sibling agent measured 661 merges at `9105e1f55` where I measure 755 at
`871b1da1c` with `--first-parent --merges`. The difference is the counting
method, not the finding; both are ~2 orders of magnitude above 9.

## Two honest ways out, and they are not the same

1. **Gate it.** A check that, for a PR whose bean names a process, requires an
   instance under `beans/workflows/`. Then STRICT means something.
2. **Drop the word STRICT.** If the rule is advisory in practice, say advisory.

Leaving it as it is costs more than either, and the reason is in `AGENTS.md`'s
own voice: a rule nothing enforces, whose breach "looked exactly like
compliance", trains agents to read the word STRICT as decoration — which
devalues it everywhere else in the file, including where it is enforced.

## Done when
- [ ] owner picks: gate it, or drop STRICT
- [ ] if gated: the check exists and `vlhk` is reopened or a successor bean
      carries the measurement
- [ ] if advisory: `AGENTS.md` says advisory, and `vlhk`'s closure is annotated
      with the fact that the remedy did not hold
- [ ] either way, the number is computed by a command rather than quoted in
      prose — 54 was quoted and went stale by ~14×

