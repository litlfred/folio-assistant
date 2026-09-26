---
layout: default
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

Every activity carries **`<bootstrap.processes:skill ref="…">`** naming the skill that
implements it, and **`<cat-harness.processes:bean …>`** where it touches the work plan. Add both
when you add an activity; the audit reports an activity that names no skill, and
the exemptions for the legitimate cases are *declarations*, not silence — see
[`role-model`](role-model.md).

Lanes bind roles, not people. A lane is the role; an actor **takes it on** for
the duration. [`role-model`](role-model.md) carries that model.

### There is no `tool` element, and that is a decision

An activity names a **skill**. A Tool declares `satisfies: ["<skill>"]`. So the
activity→Tool join **already exists and is derivable** — `activity → skill →
Tool` — and a `<…:tool ref>` on an activity would be a second, independent edge
answering the same question, free to disagree with the first.

It would also put the edge on the wrong side. `satisfies` is owned by the Tool,
which knows what it implements and is versioned with it; a `tool` ref would be
owned by the diagram author, who would have to track Tools across every
instance — measured 2026-09-26, **116** Tools are discovered from four
`tools/` graphs (`cat-harness`, `smart-base`, `folio-assistant-core`,
`fhir-harness`), so a diagram in one instance would be asserting facts about
three others.

**What is NOT being claimed** is that the join is well populated. Measured the
same day over the authoritative registry (`tools/discover.ts`, never a grep):

| | |
|---|---|
| distinct skills named by an activity, across all 74 `.bpmn` | **99** |
| …of those, some Tool satisfies | **32** |
| …of those, no Tool satisfies | **67** |
| distinct skills some Tool satisfies, corpus-wide | 69 |

The gap is real and is reported rather than gated —
`activity-skill-has-tool` (`minor`) locates it per activity, and
`check:tools` carries the corpus-wide count with the ruling that a skill with
no Tool is **not** an error, since plenty of skills are pure judgement. Those
two are a location and a count, not two answers: a corpus total cannot say
*which* activity hands a performer a skill whose mechanism is still inlined in
its prose.

One number here disagrees with `check:tools`, which reports "64 skill(s) have a
Tool" against the 69 above, and the disagreement is recorded rather than
reconciled away: the two count different sets (a `satisfies` naming a skill
that does not resolve is in one and not the other), and neither is wrong for
its own question.

### Binding the extension namespaces

**An element's prefix names the Subgraph that declares it** (owner, 2026-09-24,
bean `12s9`). A diagram binds one address per vocabulary it uses:

```xml
xmlns:bootstrap.processes="https://litlfred.github.io/folio-assistant/bootstrap/processes/ns#"
xmlns:cat-harness.processes="https://litlfred.github.io/folio-assistant/cat-harness/processes/ns#"
```

- `bootstrap.processes:` for `skill`, `role` and `precondition`, which bootstrap
  declares in `bootstrap/processes/ns.jsonld`.
- `cat-harness.processes:` for every other element (`bean`, `policy`,
  `adjudication`, `raci`, …), declared in `cat-harness/processes/ns.jsonld`.

Readers match **the address, never the prefix text**, so a diagram that binds a
different prefix to the same address reads identically, and `folio:` bound to
anyone else's address is not ours. The older single address,
`…/folio-assistant/bpmn`, is **retired** (2026-09-24). An element under it is
no longer read, and `external-schemas` reports a diagram that still binds it
as drift. A test fails if an element is written under an address whose
vocabulary does not define it.

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
[`task-authorization`](task-authorization.md).

**Instance state is committed**, alongside the work plan, so a sibling session
sees the same position. That is the whole reason not to hand-roll a second
tracker: a second answer to *where are we* is free to disagree with the first.

## Strict by default, and what a package may never relax

Base processes carry **`<cat-harness.processes:policy enforcement="strict"/>`** — the gate
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

A gateway carrying **`<cat-harness.processes:decision/>`** is backed by a decision table. Pass
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
[`todo-manager`](todo-manager.md) §"Archiving — two dispositions": an op and
a periodic sweep answer different questions, and for most processes the
answer is the sweep. An op is worth an edge on your diagram only where your
process's completion is *itself* the reason a bean is finished — and then the
archive records **why**, which a sweep cannot. Bean `folio-assistant-m8gz`
decides which this instance builds.

Work-plan priming reports every instance's position next to its bean, so the
plan and the process are one answer rather than two.
{% endraw %}
