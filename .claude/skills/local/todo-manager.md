# Todo Manager — beans work-plan & cross-agent coordination

The session work-plan and cross-agent coordination tracker for this repo is
[`beans`](https://github.com/hmans/beans): a small Go flat-file issue tracker
that stores issues as markdown under `.beans/`. It is installed on demand by
[`scripts/install-beans.sh`](../../../scripts/install-beans.sh) (fresh cloud
sandboxes do not ship it).

`beans` supersedes ad-hoc `TodoWrite` lists and `todos/*.json` sidecars as the
**durable** work-plan: because it is committed to the repo, a plan survives
container reclamation and is visible to sibling agent sessions.

## What beans are (and are not)

- **Beans are the work-plan.** Goals, probes, and the tasks an agent claims and
  drives to completion live as beans. They are durable and cross-session.
- **Beans are not sidecars.** Bulk machine-generated queues — QA audits, witness
  queues, watcher drain queues — stay as bulk JSON under `todos/` / `.beans/*.json`
  and are read by their own `.ts` tooling. **Never** `beans create` a QA/witness
  queue entry. The discipline is: `beans ≠ sidecars`.

## Core commands

```sh
scripts/install-beans.sh      # install the CLI if missing (--force to reinstall)
beans list                    # show the current work-plan
beans check                   # health-check the .beans/ store
beans create "<title>"        # open a new work-plan item
beans show <id>               # read an item
beans <id> --status in-progress   # claim an item (durable, visible to siblings)
```

## Using beans for todos (session + cross-session)

Beans **is** the todo mechanism for agent work. Do not stand up a separate todo
store — no API route, dashboard, or `todos/*.json` work-plan. One mechanism,
agent-generic, durable.

**Session todos (your work-plan for this session).** Track anything you want to
persist as beans, not in your agent's ephemeral in-memory todo tool (e.g.
Claude's `TodoWrite`, or equivalents). The in-memory list is fine for
throwaway intra-turn scratch, but it evaporates when the container is reclaimed.
Open a bean per task, mark it `in-progress` as you start, close it when done —
because `.beans/` is committed, the plan survives a resume in a fresh container.

**Cross-session / cross-agent coordinated todos.** The same committed `.beans/`
store is the shared work-plan across sibling sessions and across different agent
CLIs. Claim before you work (set `in-progress` + note your branch) so two
sessions don't pick the same item; never resolve or delete a sibling's bean. See
`bean-coordination.md` for the full claim/handoff lifecycle.

**What beans is *not* for:**
- Bulk machine-generated queues (QA `*.qa.json`, witness `*.witness.json`,
  watcher drain queues) — `beans ≠ sidecars`; keep those as bulk JSON.
- Content-review feedback on *published documents* — that is a separate domain
  workflow (the `todo-review` skill over `feedback/<paper>/*.ts`), not the agent
  work-plan. Don't conflate the two.

## Opening brief

**Claiming a bean records the work. Briefing it is what makes the work
resumable.** Both are required, and the brief comes first — before the first
tool call, in the chat, not in the commit.

AGENTS.md §"Opening a bean or a topic" states the rule and when it applies.
This is the shape.

### The four parts

**1. The problem, stated for someone who was not here.** Expand every
identifier on first use. Not "fixing `qou-93hu`" but "bean `qou-93hu` — the
`CriticalExponent` conjecture carrier, whose only field is `(3 * 4 : ℕ) = 12`, a
closed numeral identity with no exponent variable in it, so the class constrains
nothing."

**2. What you know, and how you know it.** Every number with its provenance:

| provenance | how to say it |
|---|---|
| measured this session | "measured just now: 22 of 22 seeded, 0 missed" |
| carried from a prior session | "recorded 2026-08-24 as 43 drifted; not re-measured" |
| asserted by a bean or a doc | "bean `qou-q7lf` says X — **unverified**" |

That third row is the one that bites. A sibling's bean is not a primary source,
and neither is a source file's `## Status` note; both go stale, and a specific,
recent, confidently-worded bean is exactly the kind that gets believed.

**3. The route and the gate.** How you plan to do it, what you will verify
against, and **what would falsify the approach**. A plan with no failure mode is
not a plan; it is an intention. If the gate is a script, name it and its
expected output.

**4. What you are NOT doing.** The adjacent defect you are leaving, the scope
you decline to widen into, the thing you will flag rather than fix. Stating it
up front is what stops it becoming either silent scope creep or a silent
omission — and it puts the scope call where it can still be argued with, which
is before the diff.

### Worked example

> **Starting `qou-93hu`** — the `CriticalExponent` §3b-cond hypothesis class in
> `lean/QOU/AlgebraicSubstrate/ConditionalClasses.lean`.
>
> **The problem.** Its single field is `alpha_three_eq_four : (3 * 4 : ℕ) = 12`
> — a closed numeral identity with the values already substituted in, so no
> exponent variable occurs in it and `rfl` proves it whatever the physics. Four
> sibling carriers in the same file are vacuous too, but they are at least the
> right *shape* (parameter-quantified inequalities); this one has no quantifier
> and no free variable at all.
>
> **What I know.** Measured this session: bound as `[C]` in 5 files; the probe
> baseline records it `proved-vacuous`; the class's own docstring already claims
> "α = 4/3", so the target value is not something I need to invent. Not
> measured: whether any downstream proof depends on the field's *current* type.
>
> **Route.** Make α a class parameter — `class CriticalExponent (α : ℝ) : Prop
> where alpha_eq : α = 4/3`. A `Prop` class cannot carry data, so α must be a
> parameter, not a field. Gate: lean-direct exit 0 on all three affected
> modules, plus a content probe proving `¬ CriticalExponent 2` — because
> inhabitability at 4/3 alone would not show the class constrains anything.
> **Falsifier:** if `¬ CriticalExponent 2` will not go through, the encoding is
> not doing what I claim and I stop.
>
> **Not doing.** The other four carriers need analytic setup their docstrings
> only gesture at — the author's mathematics, not a cleanup. Also leaving the
> separate `CriticalExponent` in `core-levi-form.lean`, a different carrier in a
> different namespace.

~200 words, and it would have let a reader stop the work, redirect it, or pick
it up cold.

### The failure this prevents

An agent that has spent an hour inside a problem writes in the private
vocabulary it built along the way, and a reader — the author, or the next agent
— has to reconstruct that vocabulary before evaluating anything. The brief is
written at the one moment when the agent still knows which parts are
non-obvious, because it has just finished finding them out.

**Cheapest correct move when you do not want to spend the words: do not start
the topic.** A task you cannot brief is one you have not understood well enough
to begin.

## Coordination discipline

1. **Claim before you work.** Mark the bean `in-progress` so sibling sessions
   working the same goal do not duplicate the effort.
   **Brief it in the same turn you claim it** (§"Opening brief" above). The
   claim tells a sibling the item is taken; the brief tells them, and the
   author, what it is being taken *for*.
2. **One source of truth per concern.** Do not fork a bean into a parallel
   `todos/*.json` queue; link to the queue from the bean instead.
3. **Move wiring and script together.** When relocating a hook-backed script,
   move its hook reference in the same change — a script without its wiring (or a
   hook reference without its script) is the migration failure mode that left
   dangling references behind (see `docs/folio-assistant-migration.md` §2).
4. **Close on landing.** When the work lands, close the tracking bean and update
   any cross-repo ownership note.

## Relationship to other surfaces

- `scripts/session-start-coord-sweep.sh` — CLI-independent session-start surface:
  fetches `origin/main`, summarizes sibling branch activity. Works even when the
  `beans` CLI is absent.
- `scripts/install-beans.sh` — provisions the `beans` CLI.
- See `docs/folio-assistant-migration.md` for the full migration plan and the
  open requirements for the qou-side / settings.json agent.
