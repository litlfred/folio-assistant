---
# folio-assistant-k59d
title: 'MILESTONE CRITICAL PATHS GO STALE: p5wm and yg29 both advertise blockers that are completed or settled, and check:bean-bodies cannot see them'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-21T06:30:00Z
updated_at: 2026-09-25T16:06:46Z
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

## Built, 2026-09-21 — `bun run check:stale-paths`

Premise re-measured on current `main` before starting, because several beans
closed that morning: **it still holds.** `p5wm` routes through `2krx`, `5y4b`
and `pb04`, all `completed`; `yg29`'s numbered "Shortest path" names `z7ev` and
`jbx2`, both `completed`.

Checked first that no sibling was on it — no open PR, no remote branch, bean
`todo` on main. That check exists because the same session duplicated `yl5w`
earlier the same morning.

### Two rules, and the ratio that made them narrow

The first draft over the whole store found **three, of which two were wrong.**
Both are now guards with tests.

| rule | shape |
|---|---|
| **chain** | an id that is an OPERAND of an arrow (`→` or `->`) |
| **numbered step** | a numbered item under a heading naming a path/order/sequence |

**An arrow is not always a dependency.** `x3bd` says *"README is 97 → 66
lines"* in a paragraph mentioning `lv3j` hundreds of characters away. A step is
now a segment between arrows that is **only ids**, optionally with a route's own
punctuation — `` (`6lb8` ‖ `ivfw` + `5y4b`) `` is the shape `p5wm` uses for
parallel work. Anything with prose in it is a sentence containing an arrow.

**A bean describing another bean's stale path is not stale.** This bean quotes
`p5wm`'s chain as evidence and the first draft reported it as `k59d`'s own
defect — the shape `check-bean-bodies` closed with a quotation guard, and the
shape that flagged `jijc` hours earlier. A **table row is attributed by its
first cell**, which is the robust signal: a quoted chain often sits inside ONE
code span, leaving the backticks unpaired so the subject reads as a step.

### My doc comment overclaimed, and the test caught it

The first implementation took *"the first id after the arrow"* while the
comment beside it said *"adjacent to an arrow"*. Those differ: it accepted
`97 -> 66 lines, and bean `2krx` carries the reason`, where the id is a whole
clause away. **Its own guard test went red**, and the rule was rewritten to
match what the comment claimed rather than the comment softened to match the
code.

### Two gates of this repository's own caught the first draft

**`check:declared-paths`** refused `join(root, "beans", "defs")` — a literal
where the declaration should be read. Replaced with `readBeanFiles` from the
shared `bean-store-read.ts`, which resolves the directory from the declaration
and handles `defs/archive/` besides. The rule was right and my file was wrong.

**And that fix introduced a silent clean run**, which is the failure this
repository names most often. `readBeanFiles` returns a FULL id
(`folio-assistant-p5wm`) while a bean body cites the four-character suffix
(`` `p5wm` ``). Every lookup missed, `stalePaths` returned nothing, and the
check printed **"no NEW stale path"** over a store it had read perfectly — and
would have kept printing it forever. Caught only because the baseline then
reported all three of its entries as *no longer matching*, which is the
property that exists so a baseline cannot quietly become empty. The index now
holds both id forms.

### Baselined, not repaired

`p5wm` and `yg29` are GOAL milestones owned by other sessions, and a milestone
is a statement of what its owner believes the goal needs next. Rewriting
somebody else's belief is not a checker's to do. `stale-paths-baseline.json`,
same shape and reasons as `bean-bodies-baseline.json` — a NEW stale path fails,
the backlog lists every run, and an entry that stops matching is reported as
**stale** so the file shrinks. Keyed `<bean>:<rule>` rather than by line,
because the line is the thing that gets edited.

### Verification

Falsified in all three directions against the real store: a planted fourth path
**failed** (exit 1); an unmatched baseline entry **reported stale**; restored,
**exit 0**. 14 tests, **2 of which go red when both guards are stubbed** — the
rest are the guards themselves, which must keep passing if the rule is widened.
`bun run gates` with the check wired in.

## Done when

- [x] A check reports an open bean whose body names a `completed` or `scrapped`
      bean in a critical-path chain or a numbered path, not only in a
      `blocked on \`id\`` sentence — measured against the whole store first,
      with the false-positive classes named and closed
- [x] The rule distinguishes what it can from what it cannot: a chain position
      is directional by construction, so *"waits on"* vs *"unblocks"* does not
      arise for it. Nothing looser is implemented, and prose that merely
      mentions a closed bean is **not examined and not counted as clean** —
      stated in the module header and in the report's own footer
- [ ] `p5wm` and `yg29` are repaired **by their owners** — this bean does not
      edit them; baseline entries come out as they are

*Issue link, recorded on creation.* **[#696](https://github.com/litlfred/folio-assistant/issues/696)**


## The quotation-guard Done-when is closed, 2026-09-21 — `4v62`

> [x] The quotation guard covers a markdown table cell, or the guard's stated
> scope says it does not and why — a workaround in one bean is not a fix

**The second branch, on the corpus's evidence rather than on taste.** Measured
over every bean body for `blocked on \`id\`` on a line beginning `|`: two hits.
This bean quotes yg29 and marks it; `xgd8` asserts its OWN blocker in a cell,
and `slw1` was `todo`, so that block is live. The only unquoted cell in the
store is a genuine self-assertion the checker must keep reading — treating a
cell as a quotation would silently exempt exactly it.

So this bean's double-quoting was **never a workaround**: quoting what you
quote is correct English and is precisely the signal the guard reads. The
scope now says so in `insideQuotation`'s docstring, `insideQuotation` and
`BLOCKER` are exported and tested case by case, and a table row's finding
message teaches the marking instead of the checker guessing at it.

A blockquote rule was considered and **not built**: `>` is unambiguously a
quotation, and the store contains zero of them. Priced, not missed, with a
test recording the choice.

Entered here rather than by editing the checklist above, because this bean is
another session's and an append cannot collide. The remaining Done-when —
*"`p5wm` and `yg29` are repaired by their owners"* — is untouched and is not
an agent's.

## Half of the remaining Done-when is closed, 2026-09-22 — `yg29` repaired by its owner

> [ ] `p5wm` and `yg29` are repaired **by their owners** — this bean does not
> edit them; baseline entries come out as they are

**`yg29` is repaired.** Stream 3 of the #956 consolidation (`w0cr`) owns GOAL 3,
so the repair was made by the milestone's owner, which is exactly the condition
this clause states. `p5wm` is stream 2's and is **untouched** — the clause stays
open for it.

This bean's judgement was right on both halves and is worth recording as having
held rather than as having been overtaken:

- **The defect was real and worse than measured here.** This bean found `yg29`
  routing through `z7ev` and `jbx2`. Re-measuring the whole body found two more:
  `hqku`, carried as a live *"blocked on the owner"* for two days after it
  completed, and *"`who-iris/` has no `docs/`"* against a directory holding three
  rendered pages. A milestone's staleness is not confined to the lines a path
  detector can see, which is the argument for repairing the body rather than only
  the path.
- **Declining to edit it was also right.** The repair needed `check:voices`,
  `check:catalogue`, `iris:pages:check` and a *built site* re-run to state what is
  true now. A checker could not have written that, and a checker that guessed
  would have replaced a stale belief with an invented one.

`stale-paths-baseline.json` shrank from 3 entries to 1 by the route the file
describes — the entry was removed when its milestone was repaired, and the run
reported **no stale unmatched entry**, which is the property that exists so the
baseline cannot quietly become empty.

Entered as an append, on this bean's own stated precedent: it is another
session's, and an append cannot collide.

*Recorded by stream 3/3 of the #956 consolidation — session_013vZiHGPug7PuHoMxRS82vw.*

## Round 2 — re-measured 2026-09-25, and the class is NOT what the first pass implied

Third sweep of the same three milestones (2026-09-21 found it, 2026-09-22
repaired `p5wm` and `yg29`, this is 2026-09-25). What the window since shows:

| milestone | drifted in 3 days? | what changed |
|---|---|---|
| `p5wm` (GOAL 2) | **no** | `b5f0 → 603s → 6lb8 → supn` — all four still open, nothing withdrawn |
| `vuip` (GOAL 1) | **yes, mildly** | `zkgs` closed and stayed in the chain; box 2's measurement is written in `harness.json`, a filename the tree no longer has |
| `yg29` (GOAL 3) | **yes, substantially** | `kupb` went from 13 open children to **4**; `j66n`, recorded as owner-blocked with a clause left, is `completed` |

### The rate is not uniform, and that changes what the fix should be

The first pass read as "milestone bodies rot". Three days of evidence say
something narrower: **a body rots at the rate its subject moves.** `p5wm`
needed no correction at all; `yg29` needed a substantial one. A periodic hand
pass therefore spends most of its effort confirming things that did not move,
and still misses the one that did — which is the argument for the mechanical
check this bean asks for, and against scheduling another manual round.

### A measurement trap, reproduced deliberately

A crude sweep counting bean ids named in a milestone body against their status
reports GOAL 3 at 19-of-29 "already closed" and GOAL 2 at 18-of-36. **Both
numbers are near-meaningless as defect counts.** A repaired milestone names
closed beans *on purpose* — withdrawal tables, "what this unblocks", "the
ruling that settled this" — so correct prose about finished work is
indistinguishable from a stale blocker to anything matching ids alone. This
bean already said the figure was an upper bound; it is recorded again here
because a session acting on it this window nearly rewrote a milestone that was
correct.

The discriminator a real check needs is therefore **not** "does this body name
a closed bean" but "does it name one in a position that asserts it is still to
come" — a route arrow, a numbered path step, an open Done-when clause.

### What was changed, and what was left alone

- `vuip`: `zkgs` withdrawn from the chain with its reason; box 2 re-measured by
  running `check:instance-config` rather than counting files — 16 declared, 6
  configs written, 10 absent **and legitimate by the gate's own verdict**, so
  the box's premise needs an owner decision rather than more work.
- `yg29`: `kupb`'s children re-derived (9 closed, 4 open); the stale `j66n`
  line corrected in place rather than deleted.
- `p5wm`: confirmation recorded. A confirmation is a measurement.
- **Nobody else's bean was closed.** `j66n`, `zkgs` and the nine closed
  children were closed by the sessions that did the work.

Falsified both ways: after the edits, every id still asserted as a live
blocker across the three milestones resolves to `todo` or `in-progress`
(11 of 11), and the same check rejects `zkgs`, `j66n` and `54rk` — the ids
just withdrawn — so it is not passing over an empty set.
