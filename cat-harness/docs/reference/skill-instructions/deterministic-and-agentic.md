---
layout: default
title: 'The deterministic-to-agentic spectrum'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/workflow/deterministic-and-agentic.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/workflow/deterministic-and-agentic.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/workflow/deterministic-and-agentic.md){: .fa-edit-source }

{% raw %}
# The deterministic-to-agentic spectrum

> **A spectrum of deterministic vs agentic BPMN state management / workflow
> processing can happen. Goal of research: which are safety risks / how much
> needs to be deterministic? How do models compare across different
> sub-workflows with a controlled / managed overlay of context and memories?**
> — the owner, 2026-09-20

**This page is an agenda, not a result.** Everything below is marked
**measured**, **decided** or **hypothesis**, and the proportions matter: there
is more of the third than of the first. A research note that reads as though
the question were settled is worse than none, because the next agent stops
looking.

## The spectrum is already being navigated, unnamed

**Measured.** Four distinct mechanisms in this repository place a step at a
different point, and none of them refers to the others:

| mechanism | what it fixes | where |
|---|---|---|
| `folio:policy enforcement` | whether a step that is not enabled is **refused** or merely noted | per process, `strict` or `advisory` |
| `relaxable="false"` | whether a package may **negotiate** a base step away | per activity |
| `folio:decision` | whether the branch is **computed** from a table, refusing a hand-supplied outcome | per exclusive gateway |
| `check-corpus-gate` | whether the **write** is refused at the commit boundary, by something that is not the agent | outside the process |

They are not one axis, and treating them as one is the first thing to get
wrong. **At least three questions are being conflated:**

1. **Who decides** the branch — a table, or a reading of intent?
2. **What happens if the decision is wrong** — refused, noted, or nothing?
3. **Who enforces** — the agent asking, or a gate that does not care whether
   anyone asked?

A step can be agentic on (1) and fully deterministic on (3). The commit
boundary is exactly that: an agent decides freely, and a hook refuses the write
regardless. **Any answer to "how much needs to be deterministic" that does not
say WHICH of the three it means is not an answer.**

## What is measured today

**Measured**, by `bun run check:workflow-refs` — ask it, not this page:

- Exclusive gateways split three ways: **computed** by a DMN table, **declared
  judgement** (`folio:judgement`, with a reason), and **undeclared**.
- The undeclared set is a **backlog**, not a finding. Every gateway predating
  the marker lands there, and it is the number this agenda most needs to
  shrink: an undeclared gateway is one where nobody has said whether a table
  could exist.

**Measured, and worth knowing before trusting any prose on this:** issue #200
§6 classified "all ten" of this repository's decision points. There are
considerably more than ten. A count in prose is a claim nothing checks.

**Decided**, and independently of the above: five steps carry
`relaxable="false"` — the editor seeing the findings, the decision, the write,
the release authorisation, the publish. Somebody has already judged those
non-negotiable, and that list is a second, differently-derived sample of "must
not be agentic".

## The three questions, open

### 1. Which judgement points are safety risks?

**Open.** A **hypothesis**, offered because it is testable and not because it
is established:

> Judgement is admissible where a wrong branch is **recoverable** — the next
> turn corrects it and nothing downstream was authorised meanwhile — and
> inadmissible where it **authorises the un-authorisable**.

Evidence for it: **two gateways**, both in `session-state-machine`, where it
holds. That is not evidence, it is a worked example. Against it: the criterion
says nothing about a wrong branch that is recoverable but **expensive**, or one
that is recoverable only by a person who will not be looking. Both are
plausible risks the criterion does not see.

What would test it: take the `relaxable="false"` five, which were classified by
a different route, and ask whether recoverability predicts them. If it does
not, the criterion is wrong or incomplete, and finding that out is the point.

### 2. How much needs to be deterministic?

**Open, and probably malformed as stated** — see the three-way conflation
above. A better-formed version, and even this is a guess at the right question:

> For each of *who decides*, *what happens when it is wrong*, and *who
> enforces*, what is the cheapest mechanism that still refuses the failure
> that matters?

**Decided** and worth carrying into it: this repository's answer at the commit
boundary is *refuse by default, and refuse when you cannot tell*. A gate that
fails open reports clean by not looking. Whether that generalises to the other
two questions is unknown.

### 3. How do models compare across sub-workflows, under a controlled overlay
of context and memories?

**Open, and not yet answerable** — the instrument does not exist. What would be
needed, stated so the gap is visible rather than implied:

- **The same sub-process, run by different models**, with everything else held.
  The engine makes this nearly possible already: a process instance is a
  committed record of which branch was taken at each gateway, so two runs are
  comparable without instrumenting anything.
- **A controlled overlay.** `context` is now a named layer —
  agent memory and interaction preferences are `holds: "context"`, read and not
  written by a step — so "the same task with and without this memory entry" is
  expressible. Whether it is *controllable* is untested: nothing yet varies the
  overlay deliberately.
- **A comparison that is not the agent's own report.** A model grading its own
  run is the failure mode this repository already names for QA verdicts.

**No experiment has been run.** Anyone reading this as a finding is reading it
wrong.

## What this means when you author a step

The practical half, and the only part that is not research:

**Say which point you are at.** A gateway is `folio:decision`, or
`folio:judgement` with a reason, and an undeclared one is a gap somebody will
have to measure later. The reason is what makes the corpus countable — and a
corpus that cannot enumerate its judgement points cannot answer any of the
three questions above.

**Do not reach for `strict` to express a safety concern about a BRANCH.**
Enforcement and who-decides are different axes. A strict process with an
undeclared gateway is rigidly walking a path chosen by nobody-says-what.

**Where the failure is unrecoverable, prefer the mechanism that does not
depend on asking.** The commit boundary bites whether or not the agent
consulted it; `workflow_gate` only answers agents that ask.

## See also

- [`session-state-machine`](session-state-machine.md) — the worked case, and
  where `folio:judgement` came from.
- [`bpmn-processes`](bpmn-processes.md) — strict vs advisory, the four steps no
  package may relax, and the commit-boundary gate.
- [`content-context-and-state-graphs`](../folio-core/content-context-and-state-graphs.md)
  — the layer that makes "a controlled overlay of context" a thing you can name.
{% endraw %}
