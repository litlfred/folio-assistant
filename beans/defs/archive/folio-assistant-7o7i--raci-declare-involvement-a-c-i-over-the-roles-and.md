---
# folio-assistant-7o7i
title: 'RACI: declare involvement (A, C, I) over the roles and activities that already exist'
status: completed
type: task
priority: normal
created_at: 2026-09-20T10:46:33Z
updated_at: 2026-09-20T13:18:15Z
parent: folio-assistant-ahvw
---

Owner, 2026-09-20: *"please adopt RACI chart as part of generic project
management as a sub-graph — set of skills. use it as a way to work w/
stakeholders and determine involvement in project being initiated"*,
*"to help sketch project breakdown"*.

## Why this fits here rather than being a new vocabulary

RACI assigns **involvement** — Responsible, Accountable, Consulted,
Informed — to a *(task, party)* pair. This repository already declares
both halves and has nowhere to put the relation:

| RACI needs | this repo already has |
|---|---|
| tasks | BPMN activities under `processes/` |
| parties | `scenarios/roles.json` (33 roles), `.claude/skills/actors/` (27 actors) |
| **the involvement between them** | only **R** — a lane says who PERFORMS |

A BPMN lane expresses **Responsible** and nothing else. *Accountable*
(one per task, the neck on the block), *Consulted* (two-way, before) and
*Informed* (one-way, after) have no home, so today they are either absent
or smuggled into a lane name.

**So this is not a new registry — it is three missing edge kinds over two
existing node kinds.** That framing matters: a RACI implemented as its own
table of names would be a second answer to "who is the reviewer", free to
disagree with `roles.json`, which is the drift this repository keeps
paying for.

## Where it plugs into work already done

- **`stakeholder-map`** (`src/impact/stakeholder-map.ts`) already answers
  *which lanes does this change reach* and now resolves them to declared
  roles. It says R. Adding A/C/I turns it from "who does this" into "who
  needs to know", which is what the owner is asking for.
- **CRDM phase 1** asks the agent to identify stakeholders and is explicit
  that *"the agent does not guess"* — naming humans is the BA's answer. A
  RACI chart is the STRUCTURE that question should be asked in: the agent
  supplies the tasks and the candidate roles, the human supplies the
  assignment.
- **`5tul`** (CRDM data modelling) and this are the same shape — a phase
  that produces a declared artefact — and should be authored consistently.

## Sketching the breakdown, which is the owner's second sentence

RACI is being asked for as a *project-initiation* instrument, not only a
chart: given a project, enumerate its tasks and who is involved in each.
That means the deliverable is at least as much **a skill for running the
conversation** as a schema — the questions to ask, in what order, and what
to do when the answer is "everyone".

## Open questions, none answered here

1. **One A per task, enforced?** Classic RACI insists on exactly one
   Accountable. An enforced cardinality is checkable and is the rule most
   often broken in practice; an advisory one is a chart that lies.
2. **Assigned to ROLES or to ACTORS?** `role-model.md` says nothing IS a
   reviewer — somebody acts as one for a lane. That argues roles. But
   "informed" is often a named person, and the CRDM note says humans are
   the BA's answer, which argues actors. Possibly both, with different
   letters.
3. **Where does the chart live** — per process diagram (BPMN extension
   elements, so it renders with the lanes), or as its own graph kind under
   a declared directory?
4. **Does it gate anything**, or is it documentation with an audit
   criterion? Everything in this repo that is only documentation has gone
   inert within weeks (`roles:` front matter, `degradation`,
   `SkillDefinition.schemas`), so this should ship with a reader.

## Done when

- [ ] the four questions above answered
- [ ] RACI declared over EXISTING roles/actors and BPMN activities — not a
      new party registry
- [ ] a skill for running the initiation conversation, not just a schema
- [ ] a reader from day one: an audit criterion, `stakeholder-map`
      integration, or both
- [ ] `kg:audit` criterion per join, as every other relation here has

---

## Built 2026-09-20 — three edge kinds, one enforced rule, a chart

Owner: *"1y"* (exactly one Accountable, enforced), *"1"* (roles for all
four letters), *"overlay RACI onto process/actors/scenarios as needed"*,
*"skills to make raci charts across processes"*, and
*"put CRDM and RACI under methodologies as well"*.

### What landed

| artefact | what it is |
|---|---|
| `folio:raci` on a BPMN activity | `ref="<role>" involvement="accountable\|consulted\|informed"` |
| `ProcessNode.raci` | parsed, with unrecognised values DROPPED not coerced |
| `scripts/raci-chart.ts` | `bun run raci` (chart), `bun run check:raci` (gate 54) |
| `methodologies/raci/raci.md` | the methodology, `consulted: true` |
| `crdm-data-model.bpmn` | first real use — 5 activities, 3 lanes bound to roles |

### R is absent by construction, and that is the design

A BPMN lane already says who performs an activity. That IS Responsible, so
`responsible` is **not a value `folio:raci` accepts** — the chart reads
`roleRef`. Declaring it would be one fact in two places with nothing
asserting they agree, which is exactly what `85e8` removed `fallbackRole`
for, in this same session.

A test asserts the enum is the three letters, so R cannot be added back
without someone arguing for it.

### Not a registry — three edges over nodes that already exist

RACI needs tasks and parties, and both were already declared: BPMN
activities, and `roles.json`. A RACI with its own table of names would be
a second answer to *"who is the reviewer"*, free to disagree with the
registry — the drift the retired skill `roles:` field cost 260 dangling
values (`qif9`).

Every letter names a **role**, never an actor, including *informed* where
the pull toward naming a person is strongest: `role-model.md`'s rule is
that nothing IS a reviewer, somebody acts as one for a lane.

### The rule, and the two breaches beyond the obvious one

Exactly one Accountable, enforced. Two more the same check catches:

- **Zero A once anything is claimed.** A half-annotated activity is worse
  than an unannotated one, because the chart looks complete. An activity
  declaring nothing never reaches the rule — `raciRows` omits it — which
  is what keeps annotation incremental.
- **A and C on one activity.** Asking yourself is not consultation, and
  that pairing is how *consulted* quietly becomes a formality while the
  chart still reads as complete.

Falsified rather than assumed: flipped a `consulted` to `accountable` in
the real diagram, watched the gate name both affected activities, restored.

### The conversation, which is half the ask

The owner asked for this to *initiate projects* and *sketch breakdown*, so
the skill carries the procedure and not just the schema. The load-bearing
step: **ask who is Accountable one activity at a time, and treat "the
team" as the finding** — it means the activity is not decomposed far
enough. Then read the COLUMNS: a role that is C on everything is a
bottleneck; a role appearing nowhere was not a stakeholder after all.

The agent enumerates, the person decides — CRDM's *"the BA knows the
domain, the agent does not guess"*, and it binds harder here, because a
wrong A is invisible until something goes wrong and somebody must answer.

### Done when

- [x] declared over EXISTING roles and activities, not a new registry
- [x] a skill for running the conversation, not only a schema
- [x] a reader from day one — chart and gate, both in CI
- [x] one A enforced; zero and self-consultation caught too
- [ ] `kg:audit` criterion per join — `check:raci` gates today; folding it
      into the audit's sidecars is the next step, so a breach is durable
      rather than only printed
- [ ] the nested-kind question carried from `g43o`: `methodologies/raci/`
      and `methodologies/crdm/` are `cat-harness` graphs inside a
      `methodology` directory. Still the sibling author's to settle.
