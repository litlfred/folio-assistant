---
name: opening-brief
roles: [reader, collaborator, owner]
description: >
  Brief a bean or a topic BEFORE touching anything: what you are doing and why
  it is worth doing, what you already know and with what provenance, how you
  plan to do it and what would falsify the approach. Scales with
  irreversibility, not line count.
allowed-tools: Read Grep Glob AskUserQuestion
---

# Opening brief — brief the topic before you touch anything

Split out of `todo-manager.md` on 2026-09-19 (bean `tdmg`), which had reached
396 lines against `skill-not-a-document`'s 400-line threshold while carrying
three separable disciplines. This is the one that governs what you say
**before** the work; [`turn-reporting.md`](turn-reporting.md) governs what you
say during and after it; [`todo-manager.md`](todo-manager.md) keeps the bean
mechanics. Nothing in this file changed in the split.

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
