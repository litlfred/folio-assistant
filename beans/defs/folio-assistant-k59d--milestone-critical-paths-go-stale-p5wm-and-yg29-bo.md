---
# folio-assistant-k59d
title: 'MILESTONE CRITICAL PATHS GO STALE: p5wm and yg29 both advertise blockers that are completed or settled, and check:bean-bodies cannot see them'
status: todo
type: bug
created_at: 2026-09-21T06:30:00Z
updated_at: 2026-09-21T06:30:00Z
parent: folio-assistant-ahvw
---


Found 2026-09-21 by the `goal-review` sweep of 2026-09-20T19:00Z →
2026-09-21T06:25Z (session_01AYHimvYMmf8h8e9fFN6dW5), independently by **two**
delegated agents reading two different milestones. An instruction gap.

## Measured

| milestone | what its own body advertises | what the store says |
|---|---|---|
| `p5wm` (GOAL 2) | critical path `b5f0 → 603s → hfkl → 2krx → (6lb8 ‖ ivfw + 5y4b) → pb04 → supn` | `2krx`, `5y4b`, `pb04` and `1hvo` are all **`completed`** |
| `yg29` (GOAL 3) | "blocked on `hqku`, and on the disposition of `xffc` and `d3yq`" | `hqku` is **`completed`**; `xffc` and `d3yq` both carry *"RE-SCOPED, owner 2026-09-20 — not scrapped"* |
| `yg29` | "Shortest path" step 1: *"Close the three beans that are built but still read open"* — `z7ev`, `lzbw`, `huiu`, `frs5`, `w095` | all five are **`completed`** |

A crude sweep for the wider class — an open bean naming a `completed` or
`scrapped` bean on a line containing *block / wait / gate / depends / prereq* —
returns **17 lines across 15 open beans** of 199 open. That figure is an
**upper bound, not a finding**: it counts *"what this unblocks: `5y4b`"*, which
is correct prose. The number is here to size the class, not to name defects.

## Why `check:bean-bodies` does not catch it

`sfhr` shipped the detector and it is right about what it does: it requires a
**prose ``blocked on `id` ``** with the id in a code span, and skips a match
inside a quotation. Both narrowings were measured and both are correct — a
bare word matched *"blocked on there being a dataset"*.

None of the three rows above is phrased that way. `p5wm` writes a **chain**
(`a → b → c`); `yg29` writes *"This goal depends on goal 2 and on `o7eq`"* and
a **numbered shortest path**. A milestone states its blockers as a route, and
the detector reads sentences.

## Why a milestone is the worst place for it

`bean-blocking` already carries the reason: a block whose blocker is gone
reads to the next agent as abandoned work. On a leaf bean that costs one
agent one read. On a **milestone** it costs every agent that asks "what is
next for this goal" — which is precisely this sweep, and which is why the
first thing both delegated agents had to do was correct the milestone they
were sent to read.

`nvbr` has this exact shape at leaf level, was caught, and carries
*"The blocker is VOID — `fsch` was scrapped"* in its own body. Nothing
propagated that to `p5wm`, which still routes through it.

## Done when

- [ ] A check reports an open bean whose body names a **`completed` or
      `scrapped`** bean in a critical-path chain (`a → b → c`) or a numbered
      path, not only in a `blocked on \`id\`` sentence — measured against the
      whole store first, with the false-positive classes named and closed the
      way `sfhr` named its three
- [ ] The rule distinguishes *"this waits on `x`"* from *"this unblocks `x`"*,
      or records that it cannot and reports the class as **could not
      determine** rather than as clean
- [ ] `p5wm` and `yg29` are repaired **by their owners** — this bean does not
      edit them

## The detector flagged THIS bean while it was being written, and that is a finding

First run after the body above was written:

```
✗ folio-assistant-k59d [dead-blocker]: "blocked on `hqku`" — that bean is
  `completed`, so the block can never lift on its own
```

The sentence is `yg29`'s, quoted here as evidence. `sfhr` measured and closed
exactly this false-positive class — *"a match **inside a quotation** is
skipped — this bean quotes `nvbr`'s blocker, and the first draft reported that
as `sfhr`'s own dead blocker"* — and the guard it shipped counts **double
quotes on the line** (`check-bean-bodies.ts`, "Is the match inside a quotation
on its own line?").

A **table cell** is not covered. The evidence a bean of this kind naturally
carries is a table of "what it says" against "what the store says", and that
is the one shape the guard misses. Worked around here by double-quoting the
cell, which is both correct English and what the guard reads.

- [ ] The quotation guard covers a markdown table cell, or the guard's stated
      scope says it does not and why — a workaround in one bean is not a fix
