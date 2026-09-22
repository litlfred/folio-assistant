---
layout: default
title: 'Opening brief'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/opening-brief.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/opening-brief.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/opening-brief.md){: .fa-edit-source }

{% raw %}
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

### When it applies — proportionality, so this does not become ceremony

**The trigger is irreversibility and surprise, not line count.**

- **A one-line fix with an obvious route needs no brief.** Say what you are
  doing and do it.
- **Anything touching a shipped gate, a shared artefact, a formal declaration
  with consumers, or a number a reader sees — brief it.**
- **Anything where you expect to be wrong some of the time — brief it**, and say
  *where* you expect to be wrong. Research is the case this is most valuable for
  and most often skipped, on the grounds that the outcome is unknown. **The
  unknown outcome is the reason to write down the route**, not a reason to skip
  it.

### Why it is a rule and not a style preference

**Sessions end mid-thread.** Containers are reclaimed, context windows fill, a
branch is picked up days later by an agent with none of the reasoning that
produced it. The bean body and the commit are durable; the chain of inference
that made them sensible is not, unless it is written down at the point where it
was still obvious. An agent resuming cold should be able to read the brief and
continue — not reconstruct its predecessor's rabbit hole first.

**It catches wrong work before it is done rather than after.** A route stated in
advance can be corrected by the author in one line. The same route discovered in
a finished diff costs a review cycle and, often, a revert.

It is the same discipline as the question frame in
[`interaction-modality`](interaction-modality.md) §4.1, applied to work instead
of decisions. That rule exists because a terse question forces the author to go
and find context the agent already had; a terse *start* does the same thing one
step earlier.

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

### What a thin brief looks like, and why it fails

> Starting `qou-93hu` — fixing CriticalExponent.

Names the bean and nothing else. It does not say the field is a closed numeral
identity with no exponent variable in it, so a reader cannot tell whether this
is cosmetic or load-bearing; it does not say the class signature changes, so
nobody can warn that every binder in two consumer modules moves with it; and it
does not say what "fixed" will be checked against, so the agent is free to
declare victory on a compile. **Each of those omissions is a place the author
could have intervened for the cost of reading one sentence.**

### The failure this prevents

An agent that has spent an hour inside a problem writes in the private
vocabulary it built along the way, and a reader — the author, or the next agent
— has to reconstruct that vocabulary before evaluating anything. The brief is
written at the one moment when the agent still knows which parts are
non-obvious, because it has just finished finding them out.

**Cheapest correct move when you do not want to spend the words: do not start
the topic.** A task you cannot brief is one you have not understood well enough
to begin.
{% endraw %}
