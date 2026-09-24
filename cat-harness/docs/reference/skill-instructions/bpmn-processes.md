---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Processes are BPMN, and the diagrams are executable'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/workflow/bpmn-processes.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/workflow/bpmn-processes.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/workflow/bpmn-processes.md){: .fa-edit-source }

{% raw %}
# Processes are BPMN, and the diagrams are executable

**The `.bpmn` file is the source of truth.** The rendered SVGs are generated —
regenerate after editing one, and the staleness check fails the build if you
forget. Never hand-edit a rendered diagram.

**Do not quote a count of diagrams from prose.** This repository's own
`AGENTS.md` said "six `.bpmn` files" long after there were far more, in a file
that elsewhere warns against exactly that. Count the directory.

## Authoring: if it has actors, activities and a control flow, it is a process

Author it as **BPMN**, not as a diagram-in-a-fence. Fenced diagrams stay for the
things that are *not* processes — component maps, an inheritance lattice, a
navigation graph.

Every activity carries **`<folio:skill ref="…">`** naming the skill that
implements it, and **`<folio:bean …>`** where it touches the work plan. Add both
when you add an activity; the audit reports an activity that names no skill, and
the exemptions for the legitimate cases are *declarations*, not silence — see
[`role-model`](../folio-core/role-model.md).

Lanes bind roles, not people. A lane is the role; an actor **takes it on** for
the duration. [`role-model`](../folio-core/role-model.md) carries that model.

## Edge routing: rectilinear, and never over a task

Owner, 2026-09-23, on `document-ingestion`'s rendered diagram: **"keep
rectilinear if possible, no overlapping."** Two rules, and the second is the
one that actually bites.

**Rectilinear.** A sequence flow turns at right angles. A diagonal reads as a
different kind of edge to anybody who has seen a BPMN diagram before, and the
notation has no such kind — so the reader spends attention deciding whether
the difference means something. It does not.

**Never over a task, a lane label or another edge.** The case that prompted
this: the `gap` flow from *Record the gap as a bean* back to *Derive content
from the assets* was drawn as one long diagonal crossing the full width of the
process, passing under every task in the lane. It is a perfectly ordinary
loop-back and it was the hardest edge on the page to follow.

A loop-back belongs in the **channel below the lane's tasks** — out of the row,
back along it, and up into its target. That is where a reader already looks for
one, and it crosses nothing.

**This is about the DIAGRAM, not the process.** `BPMNDiagram` carries where a
thing was drawn and the process carries what is true, so a routing fix changes
no semantics and needs no re-validation of the flow — the same split
`board-diagram-interchange` draws one level up. What it changes is whether
somebody can read the thing.

**Check it by looking at the rendered SVG, not the XML.** Waypoints that look
orderly in source can still emit a diagonal, and `render:bpmn` is what a reader
sees. The rendered page is the artefact under review — `preview:site` exists
for exactly this reason, after a generator shipped 22 headings with one anchor
and every gate was green across it.

## Running one: the engine refuses work claimed out of order

The list / start / next / complete calls run a process from its diagram.
**"What is enabled now"** is the useful one: it reports the enabled step, the
lane that owns it, **and the skill that implements it** — so the answer is
something to act on rather than a bare step name.

**Completion refuses a step that is not enabled.** That is what makes the
diagram a control rather than a picture.

**Completion also checks WHO.** Before any task or decision is recorded, the
engine asks four questions: is the actor authenticated, eligible for the role
the lane binds (`roleRef`), permitted by an ODRL policy to `perform-task` in
this process and task, and allowed to touch the target content? This is
generic engine behaviour, so **do not draw an authorization task into a
diagram**: a check drawn into some processes is a check missing from the rest.
What a diagram owes the check is a lane bound to a declared role. See
[`task-authorization`](../folio-core/task-authorization.md).

**Instance state is committed**, alongside the work plan, so a sibling session
sees the same position. That is the whole reason not to hand-roll a second
tracker: a second answer to *where are we* is free to disagree with the first.

## Strict by default, and what a package may never relax

Base processes carry **`<folio:policy enforcement="strict"/>`** — the gate
refuses a step that is not enabled. Per-content-type processes are **advisory**:
their package owns what *adequate* means in that domain. **Absent policy means
strict.**

To relax a base step, a package **declares** it with a **reason**. No reason, no
load — silencing a gate must cost more than satisfying it.

**Some steps are marked unrelaxable and no package may touch them**: the editor
*seeing* the findings, the decision itself, the write, and release
authorisation. Those four are the gate; everything else is procedure around it.

A validator checks every declared relaxation and runs in CI, so a relaxation
naming a step that no longer exists fails rather than sitting in the file
looking like policy while permitting nothing.

## The commit boundary enforces what the diagram decided

A corpus gate, run from a pre-commit hook or CI in a folio, **refuses a changed
block that no instance records the editor having authorised** — no instance, not
past the decision, or discarded.

**It refuses when it cannot tell, too.** A file that reads as a manifest but
will not import is refused rather than waved through: *could not determine* is
never rendered as a pass. Sweep-written sidecars are excluded, and a warn-only
mode exists for gradual adoption.

## Some gateways are computed, not chosen

A gateway carrying **`<folio:decision/>`** is backed by a decision table. Pass
the facts — the counts a QA sweep already produced — and the table returns the
branch.

**Completion refuses a hand-supplied outcome there**, and that refusal is the
point: asserting the answer would defeat having a table. Adding one means adding
the table and the reference and nothing else; the loader checks that every
outcome the table can return names a real branch.

## A bean-marked step performs the operation, not a note about it

An activity carrying a bean operation **does it** when you complete the step:

| op | what happens |
|---|---|
| `claim` | sets in-progress, idempotent |
| `note` | appends what you pass |
| `resolve` | completes the bean **only once the instance itself has completed** |

**That last row is a judgement guard, not a sequencing detail.** A still-running
process gets a note instead, because whether work is done is a judgement and a
bean is never closed on someone else's say-so — the same rule that stops you
resolving a sibling's.

**There is no fourth op, and `resolve` is NOT the end of the bean's life.**
`resolve` sets `completed`; `completed` is what `beans archive` moves; and
nothing in any diagram archives. Measured 2026-09-20: `draft-to-publication`
does claim → note → resolve, `crdm-close` does resolve, `code-change-review`
does claim → resolve — every one manufactures the condition and none
discharges it, which is how **219** beans accumulated.

Before reaching for an `archive` op, read
[`todo-manager`](../folio-core/todo-manager.md) §"Archiving — two dispositions": an op and
a periodic sweep answer different questions, and for most processes the
answer is the sweep. An op is worth an edge on your diagram only where your
process's completion is *itself* the reason a bean is finished — and then the
archive records **why**, which a sweep cannot. Bean `folio-assistant-m8gz`
decides which this instance builds.

Work-plan priming reports every instance's position next to its bean, so the
plan and the process are one answer rather than two.
{% endraw %}
