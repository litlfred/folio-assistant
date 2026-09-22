---
layout: default
title: 'RACI'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/raci/raci.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/raci/raci.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/raci/raci.md){: .fa-edit-source }

{% raw %}
# RACI — involvement, over the graph that already exists

**R is already declared.** A BPMN lane says who performs an activity; that
IS Responsible, and this methodology does not repeat it. What BPMN cannot
say is the other three:

| letter | means | direction |
|---|---|---|
| **R**esponsible | does the work | from the **lane** |
| **A**ccountable | carries the decision; answers for the outcome | exactly one |
| **C**onsulted | asked for input **before** | two-way |
| **I**nformed | told **after** | one-way |

```xml
<bpmn:task id="A_Entities" name="Identify entities">
  <bpmn:extensionElements>
    <folio:skill ref="crdm-data-model"/>
    <folio:raci ref="business-analyst" involvement="accountable"/>
    <folio:raci ref="stakeholder" involvement="consulted"/>
  </bpmn:extensionElements>
</bpmn:task>
```

`bun run raci` prints the chart across every declared process;
`bun run check:raci` enforces the rule and is a gate.

## Why an overlay and not a registry

RACI needs tasks and parties. **This repository already declares both** —
BPMN activities under the declared workflow directories, and roles in
`scenarios/roles.json`. What was missing is only the relation between
them, and only three quarters of it.

A RACI implemented as its own table of names would be a **second answer to
"who is the reviewer"**, free to disagree with `roles.json` — the drift
this repository keeps paying for, most recently in the retired skill
`roles:` field whose 260 dangling values resolved against nothing
(`qif9`).

**Every letter names a ROLE, not an actor.** `role-model.md`'s rule is that
nothing IS a reviewer — somebody acts as one for the duration of a lane —
and naming a concrete actor would bind a process to one participant. That
holds for *informed* too, where the temptation to name a person is
strongest.

## Exactly one Accountable, and it is enforced

A chart that permits two A's lies about who carries the decision, and that
is the rule most often broken in practice. `check:raci` fails on it.

**Zero is also a breach**, once an activity declares any RACI at all. A
half-annotated activity is worse than an unannotated one, because the
chart looks complete. An activity declaring nothing is `n/a` — annotation
is incremental by design, and the gate is on what a diagram CLAIMS, never
on how much it has claimed so far.

**A role cannot be both accountable and consulted on one activity.** Asking
yourself is not consultation, and that pairing is how *consulted* quietly
becomes a formality while the chart still reads as complete.

## Using it to initiate a project

The chart is the second half. The first is a conversation, and the order
matters:

1. **Enumerate the activities.** From the BPMN if a process exists; from
   the breakdown if it does not. An activity nobody can name is a gap in
   the breakdown, not a gap in the chart — finding those is the point.
2. **Ask who is Accountable, one activity at a time.** Not a list: one
   question per row. The answer *"the team"* means the activity is not yet
   decomposed far enough, and that is the most valuable finding this
   produces.
3. **Then Consulted, then Informed.** In that order, because C is the
   expensive one — every name added is a round trip before the work can
   proceed — and a long C list is a signal to re-read step 2.
4. **Read the columns, not the rows.** A role that is C on everything is
   a bottleneck; a role that appears nowhere was not a stakeholder after
   all, and saying so is cheaper than discovering it late.

**The agent enumerates; the person decides.** CRDM states this for
stakeholder identification — *"the BA knows the domain, the agent does not
guess"* — and it applies here with more force, because a wrong A is
invisible until something goes wrong and somebody has to answer for it.

## What this is NOT

**Not an approval mechanism.** A is who answers for the outcome, not who
signs a gate. Gates are BPMN — a `userTask` in a lane, with the
`fulfilmentKindsForBpmnType` rule that a system actor cannot fill one.

**Not permissions.** What an actor may DO is
`skills/permissions/permissions.json` and cross-cuts roles. RACI says who
is involved in a task, not what they are allowed to do in general.

**Not a substitute for the lane.** If the chart and the lane disagree
about who performs something, the lane is right and the chart is stale —
which is why R is read rather than declared.
{% endraw %}
