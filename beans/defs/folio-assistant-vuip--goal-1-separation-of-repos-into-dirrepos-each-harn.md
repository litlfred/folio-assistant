---
# folio-assistant-vuip
title: 'GOAL 1: separation of repos into dir/repos, each harness instantiation with config and initiation steps skilled, tooled and tested'
status: in-progress
type: milestone
priority: high
created_at: 2026-09-20T18:47:55Z
updated_at: 2026-09-20T18:47:55Z
---

The owner's words, 2026-09-20 (session_017PqeiS4JYySSWGAYLedmus), kept verbatim
because a goal paraphrased by an agent is a different goal:

> get to separtion of repos into dir/repos with each harness instiatiatin w/
> config and initation steps skilled, tooled, and tested (readme, creation of
> directories, active vs static content -- beans todos fsh-guts,etc.)

Created on the owner's ruling for bean `wqht`: *"wqht - milesotne"*. Until
now the three goals existed only as chat text, so every review reclassified
140 open items by hand. This is where goal 1 lives.

## Epics under this milestone

| epic | why |
|---|---|
| `vke6` | SPLIT (#223) — cutting the repo into layers that can depend on each other, which is the goal's first clause |

## Named in the goal, and where each lives

- **config and initiation steps** — `b5f0` (what it means to instantiate),
  `zkgs` (the per-instance config filename), `wwi6` (uploads/ and library/ at
  initiation), `lv3j` (a BPMN precondition for initialize-harness)
- **README** — `b963` fixed the cold-start path the entry documents named;
  `bootstrap/README.md` is the cold reader's entry point
- **creation of directories** — `rday` (a declaration adds and overrides, it
  does not withdraw), `wwi6`
- **active vs static content** — the `holds: content | context | state` axis,
  and `hqku`'s open question about `library/`. `b5f0` §5 argues the missing
  axis is `derived` rather than `dynamic`
- **beans, todos, fsh-guts** — `x89g` (beans/ as a real graph), `c4rz`
  (the todos graph), `t0i3` (fsh-guts as a declared non-renderable graph)

## Deliberately NOT parented here

`zzmr` (KG structure) and `1xhc` (CI reliability) both carry work this goal
needs and work two other goals need. Assigning them here would claim a
breadth they do not have. Listed rather than parented, which is the honest
state until the owner says otherwise.

## Status, measured 2026-09-20

`zlmp` — the gate `vke6` names for the whole cut — is at **0
wrong-direction edges**, re-measured on main at `4cdd77d7d8` with 0
unassigned modules. The critical path is now `wggr` (invert the stub
pattern for the workflow files, `skills/` and `schemas/`), then
`b5f0`, then `zmdo` (fork twice and prove an empty-repo bootstrap).

**`zkgs` withdrawn from the path, 2026-09-25.** It sat beside `b5f0` as a
joint second step and has been `completed` (and archived) since. Withdrawn
rather than deleted, because a reader who remembers the old chain needs to
find out what happened to the step rather than notice it is simply gone —
the same reason `p5wm` keeps a withdrawal table. `wggr`, `b5f0` and `zmdo`
were each re-checked against the store in the same pass and are all still
open, so the rest of the chain stands.

## Box 2 — the owner's ruling, 2026-09-25

The re-measurement below left box 2 with a question the store could not answer:
the box and `check:instance-config` disagreed about whether an instance with no
config is a shortfall. Put to the owner as a selectable decision; the ruling,
kept as chosen:

> **Every config that exists is correct** — "the box means: any config present
> sits at its instantiation root and is named for its instance."

So the box asks about **naming and location, not coverage**, and an instance
with no config is not outstanding work. That is exactly what the gate already
enforces and reports green:

```
✓ every config is named after its instance, and no retired name survives
```

**Box 2 is therefore ticked**, on the gate's evidence rather than on this
bean's say-so — re-derivable at any time by running it, which is the standard
`bean-coordination` asks for when a box is closed.

The rejected reading is recorded because it changes more than this bean: had
the box meant *every instance must carry one*, 10 of 16 would be outstanding
AND `check:instance-config` would have to start failing on a state it currently
prints as legitimate. Nothing needs to change in the gate.

**GOAL 1 now has two open boxes, not three**, and box 1 is still blocked on
`zmdo`. Box 3 is NOT ticked here: the 2026-09-21 row calls it "substantially
satisfied", which is not a measurement, and nobody has re-derived it. That is
the next thing this milestone needs, and it is agent work rather than an owner
decision.

## RE-MEASURED 2026-09-25 — box 2, in the filename that now exists

The 2026-09-21 row below reads *"12 instances declare `harness.json`; **one**
has a `*.config.json`, and 11 have none"*. **`harness.json` no longer exists
anywhere in this repository** — the declaration moved to `<name>.json` beside
a `<name>.config.json` — so that row is a measurement in a vocabulary the tree
has dropped, and its arithmetic cannot be re-derived to agree or disagree.

Re-measured by running the repo's own gate rather than by counting files,
because the gate is what decides the box:

```
bun run check:instance-config
  → 16 instance(s) declared; 6 configs written; 10 declared with no config
  → "(· = declared but no config written; a legitimate state.)"
  → ✓ every config is named after its instance, and no retired name survives
```

So the box's premise has changed rather than its answer improving: **an
instance with no config is not a deficiency** by the gate's own verdict, and
"11 have none" was counting a legitimate state as a shortfall. What the box
still needs is a decision about what it is asking — *every instance carries a
config*, which the gate contradicts, or *every config that exists is at its
instantiation root and named for it*, which is green today. That is the
owner's to settle; it is not re-derivable from the store.

**Not touched:** the `zmdo` blocker on box 1, which was re-checked and still
holds — `zmdo` is `todo`.

## MEASURED, 2026-09-21 — where Goal 1 actually stands, and what blocks each box

Nobody had measured this goal's boxes; they were being carried as intentions.
Measured on `a11eeb39`:

| box | state |
|---|---|
| a new empty repo can bootstrap an instance | **blocked** — `zmdo` says the forks must not start before both layers reach MVP, because a fork taken mid-partition inherits the unfinished classification |
| each instantiation declares its config in one file at its own root | **not yet** — 12 instances declare `harness.json`; **one** has a `*.config.json`, and 11 have none |
| the initiation steps are skilled, tooled and tested | **substantially satisfied** — see below; the first reading of this was wrong |

### A wrong premise, checked and dropped rather than built on

The 11-of-12 number looked at first like the `dh4f` shape — a config resolving
from the wrong root. **It is not.** `resolveHarnessConfigPath` walks from the
instance root **OUTWARD**, deliberately, and says so:

> then each ancestor, because a checkout holding several instances tracks them
> at its own root, **which is the whole point of naming the file after the
> instance**.

So `cat-harness.config.json` sitting at the CHECKOUT root is the designed
placement for a multi-instance checkout, not a misplacement. And
`expectedInstanceConfigPath` returns the found path when there is one and the
instance-root location otherwise — which is the whole of the asymmetry that
looked wrong.

The 11 without a config are not misconfigured either: a config declares
`contentType` and `dependencies`, and a sub-instance that has never been
independently instantiated has neither to declare. **"Not yet" rather than
"broken"**, and it resolves when the split does.

### Box 3: all three parts exist, and my first answer was wrong

I first recorded *"the governing skill is the open half"*. **That was wrong**,
and the mistake is worth naming because it is the same one three other beans
paid for tonight: I searched `skills/folio-core/` for a FILENAME matching
`init|bootstrap` instead of reading what the skills DO.

| part | what it is |
|---|---|
| a skill that governs them | **`getting-started.md`** — *"Use whenever a user asks to create, start, set up, or initialise a folio"* — with a BPMN process, `processes/getting-started.bpmn` |
| a Tool node that performs them | **`folio_init`**, registered in `src/tools/folio-init.ts` |
| a test | **`init-folio.test.ts`**, and `workflow-roles.test.ts` loads the BPMN |

What is absent is any single assertion BINDING the three. Before calling that
a gap I checked whether the model can even express it: **`folio:tool` does not
exist in this repository's BPMN vocabulary.** An activity carries
`<folio:skill ref>` and `<folio:bean op>` and nothing else, so "the process
names the Tool that performs it" is not a link that has gone missing — it is a
relation this repository does not model.

Inventing `folio:tool` to close a box would be adding a vocabulary term on a
test's say-so, which is the wrong direction. Recorded as a design question for
whoever owns `bpmn-processes`, not taken here.

### So there is no actionable slice here, and that is the finding

Every box waits on the same thing `zmdo` names. Recording it so the next
session reads a measurement instead of re-deriving one — and so "is Goal 1
done?" has an answer with a named blocker rather than a shrug.

## Done when

- [ ] A new, empty repository can say "bootstrap a litlfred/folio-assistant
      here" and get a working instance — `zmdo`'s acceptance test, and the
      goal's own falsifier
- [x] Each instantiation declares its config in one file at its own root —
      **settled by the owner 2026-09-25**, see §"Box 2 — the owner's ruling"
- [ ] The initiation steps are skilled, tooled and tested: a skill that
      governs them, a Tool node that performs them, and a test that fails
      when they do not run
