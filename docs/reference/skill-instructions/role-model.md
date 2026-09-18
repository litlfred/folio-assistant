---
layout: default
title: Roles are swimlanes
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/role-model.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/role-model.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/role-model.md){: .fa-edit-source }

{% raw %}
# Roles are swimlanes

One sentence carries the whole model:

> **An actor performs a task in a process as a role, using that role's skills.**

Four objects, each with a home:

| object | what it is | declared in |
|---|---|---|
| **Actor** | a concrete participant. Human or agentic. Persists across every process. | `.claude/skills/actors/*.json` |
| **Role** | **the swimlane** — a persona an actor *takes on* because of the lane it is acting in. Carries a collection of Skills. | `skills/roles/roles.json` |
| **Skill** | an instruction body: what the actor needs to know to perform the task it was handed. | `skills/<pkg>/*.md`, `src/skills/`, `schemas/skills/<name>/`, `.claude/skills/local/` |
| **Process / Decision** | BPMN and DMN. Lanes bind roles; activities name skills; gateways may compute their branch from a table. | `skills/workflows/*.bpmn`, `skills/workflows/decisions/*.dmn` |
| **Requirement** | a conformance obligation that **points at** the others: `satisfiedBy` names the skill or capability discharging it, `actors` who is bound, `derivedFrom` the broader requirement it specialises. | `skills/requirements/*.json` |

Schema: [`schemas/role-graph.ts`](../../schemas/role-graph.ts). Audit:
[`scripts/kg-audit.ts`](../../scripts/kg-audit.ts), sidecar schema
[`schemas/kg-qa.ts`](../../schemas/kg-qa.ts).

## Why a role is the lane and not the person

Because the same actor is a different thing in two diagrams, and two different
actors are the same thing in one.

In `crdm-requirements.bpmn` the session agent acts in `Lane_Agent`. In
`bean-lifecycle.bpmn` that very same session agent is, from the other diagram's
point of view, the **sibling session** — the lane that exists precisely to mark
what is *not yours to close*. The skills differ because the **lane** differs,
not because the actor did.

So nothing is "a reviewer". Somebody **acts as** reviewer, inside a process,
for the duration of a lane.

> **The actor registry used to model this backwards, and now does not.**
> `.claude/skills/actors/*.json` held eighteen entries with an `inherits`
> chain — `author` inherits `reviewer` inherits `viewer`. That is a **role**
> lattice wearing an actor's name: "can review", "can push" are properties of a
> position, not of a person. Those entries now carry **`roles[]`** — the roles
> each actor may take on — and the lattice lives in the role graph, where
> `inherits` means what it says. Six actors were added for participants that
> had none: the end user, a stakeholder, the onboarding / ingestion / evidence
> agents, and the CI pipeline.
>
> `roles: []` and an **absent** `roles` mean different things. `[]` says the
> actor takes on no role, which is the honest value for a read-only identity
> that never appears in a swimlane; absent says nothing has been asserted.
>
> The `actor-is-not-a-role` criterion stays even though it now passes, because
> the next registry written by hand will reach for `inherits` again.

> **Some lanes are acted upon, not performed.** `Work plan — beans`, `Corpus`,
> `Publish — GitHub Pages` and the external registries are drawn as lanes
> because tasks act ON them, and a reader needs to see where the plan or the
> corpus is touched. Nobody takes them on, so they carry `actedUpon: true` and
> `role-has-actor` records **n/a** rather than failing. Reporting "no actor can
> fill the corpus" is a finding nobody can act on, and a check that produces
> those is a check somebody switches off.

## Requirements are the fifth node kind, and they only point

A requirement is not a skill and not a role. It is an obligation *about* them:

```jsonc
{ "id": "req:commit-hygiene",
  "derivedFrom": ["req:agent-workflow"],
  "actors": ["author", "admin"],
  "statements": [
    { "key": "no-secrets", "conformance": "SHALL",
      "requirement": "Commits SHALL NOT include secrets, API keys, tokens…",
      "satisfiedBy": [{ "kind": "skill", "ref": "content-plan" }] } ] }
```

Three reference types, all audited: `requirement-satisfied-by-resolves`,
`requirement-actors-resolve` and `requirement-derived-from-resolves` are all
`critical`, because a reader following a broken one gets nothing — the same test
as a dangling `<folio:skill ref>`. `requirement-statements-graded` is `major`: an
ungraded statement is readable, it just cannot be conformance-tested, and
SHALL-vs-SHOULD is the whole reason to write a requirement rather than a note.

**Do not fold a requirement into the skill that satisfies it.** The grading, the
`derivedFrom` lattice, the actor binding and the many-to-many `satisfiedBy` are
the only machine-checkable things about it, and prose in a skill doc carries
none of them. `satisfiedBy` is many-to-many in both directions — one skill
discharges statements in several requirements — so inlining duplicates rather
than relocates.

**They were in `.claude/skills/requirements/` until 2026-09-18**, which is a
Claude-Code-only directory that Gemini, Cursor and Copilot never read, and their
joins were unchecked the whole time. Moving them into the `kg` graph found four
broken references on the first run: `req:agent-workflow` did not exist although
three requirements declared `derivedFrom` it, and `capability:role-detection`
did not exist either — capabilities here are environment probes
(`detection: { method: "command" }`), and role detection is the actor registry
read against the session identity, which is a skill.

## Two compositions, and they are not the same

**`inherits` — a role IS-A role.** `qc-reviewer` inherits `reviewer` and gets
its skills everywhere, in every process, forever. Static. `resolveRoleSkills`
closes over it breadth-first, so a skill's reported `via` is the *nearest*
ancestor that supplies it.

**The subprocess stack — a role acting INSIDE another role's task.** A process
calls a subprocess and the actor keeps acting: it does not stop being the outer
role, it *additionally* takes on the inner lane's role. The skills available at
that task are the union along the whole call path. `resolveRoleStack` takes the
path outermost-first and keeps each skill's provenance, because a reader needs
to know not only that a skill was available but which level supplied it.

```ts
resolveRoleSkills(graph, "qc-reviewer")       // static: + everything reviewer has
resolveRoleStack(graph, ["editor", "viewer"]) // scoped: the union for this call only
```

**Do not merge them.** A flat union would make `reviewer` permanently hold every
skill any caller ever had, and a closure that broad cannot fail an audit, which
is the same as not having one.

## Lanes are free text — which is the problem the role graph solves

Measured across the twenty diagrams on 2026-09-18: **60 distinct lane names for
roughly two dozen actual positions.** Four spellings of *reviewer*
("Reviewer / SME", "Reviewer / subject-matter expert", "Reviewer (SME or
editor)", "Review Committee"); three of *the work plan*. Nothing joined any of
them to anything, so "which skills does this task's performer have" had no
answer and an undefined lane was a silence rather than a finding.

A role therefore declares the lane names it **binds**:

```jsonc
{
  "id": "reviewer",
  "name": "Reviewer / SME",
  "summary": "Reads a change and judges it. Cannot accept it — that is the editor's lane.",
  "actorKind": "person",
  "lanes": ["Reviewer / SME", "Reviewer (SME or editor)", "Review Committee"],
  "skills": ["content-review", "content-feedback"],
  "inherits": ["viewer"]
}
```

That resolved the whole existing corpus without editing a single `.bpmn`.

**A new diagram should not add a name here.** Bind the lane explicitly:

```xml
<bpmn:lane id="Lane_Reviewer" name="Reviewer">
  <bpmn:extensionElements>
    <folio:role ref="reviewer" />
  </bpmn:extensionElements>
  ...
</bpmn:lane>
```

An explicit `<folio:role ref>` **wins** over name matching: a diagram that has
said which role it means must not be second-guessed by a string table. A ref
naming no declared role is a `critical` finding — it is *not* quietly
name-matched instead.

## The audit — `bun run kg:audit`

Fourteen criteria, one per join in the sentence at the top:

```
activity ──names────▶ skill      skill-ref-resolves             critical
gateway  ──computes─▶ decision   decision-ref-resolves          critical
lane     ──is───────▶ role       role-ref-resolves              critical
activity ──sits in──▶ lane       activity-in-lane               major
lane     ──is───────▶ role       lane-binds-role                major
role     ──carries──▶ skill      role-carries-activity-skill    major
decision ──is used──▶ gateway    decision-outcomes-used         major
role     ──carries──▶ skill      role-skills-resolve            critical
role     ──is-a─────▶ role       role-inherits-resolves         critical
activity ──names────▶ skill      activity-names-skill           minor
role     ──is used──▶ lane       role-binds-a-lane              minor
actor    ──takes on─▶ role       role-has-actor                 minor
skill    ──reachable▶ anything   skill-reachable                minor
actor    ──is not a─▶ role       actor-is-not-a-role            minor
```

| command | does |
|---|---|
| `bun run kg:audit` | write the sidecars, print the summary |
| `bun run kg:audit:check` | fail on a `critical` finding, or on a stale sidecar |
| `bun run kg:audit:strict` | ...and on `major` too |
| `bun run scripts/kg-audit.ts --json` | the full report set, for a tool |

### Why sidecars rather than a console report

`check-workflow-refs.ts` prints and exits, so its **previous** answer is gone.
That makes *"this lane has been unbound since the day it was drawn"* and
*"this lane broke in the commit under review"* indistinguishable, and a
reviewer cannot separate a new defect from inherited debt. The 53 sidecars are
committed, under `kg-qa/` beside whatever they audit, so the diff says exactly
which findings a change introduced. Same argument and same file shape as the
block sweep's `*.qa.json` and the script sweep's `*.script-qa.json`.

### Three states, and what `unknown` costs

A criterion returns `pass`, `fail`, `n/a` (does not apply to this subject) or
`unknown` (could not be evaluated — the file would not parse, a dependency was
absent). **`unknown` is never written as a pass.** It counts as a failure at
its criterion's own severity.

It is not *promoted* to `major` either, and the distinction matters: a diagram
that will not load records `unknown` against its `critical` criteria too, so it
still fails the gate — which is the case promotion was reaching for. Promoting
an unevaluable `minor` criterion as well would gate the build on something
nobody agreed was blocking, and a gate that fires on those is a gate somebody
switches off.

### Severity, and why coverage is only `minor`

`critical` is a **broken reference** — something names a thing that does not
exist, and a consumer following it gets nothing. `major` is a **missing join** —
the graph is intact but a question has no answer, e.g. a lane bound to no role.
`minor` is **coverage**: a real gap with legitimate instances. A human signing
something off is not implemented by a markdown file, so failing on
`activity-names-skill` would force a fake ref onto a real step, which is worse
than the gap.

## What counts as a skill

`scripts/known-skills.ts` is the single answer, shared by `kg-audit` and
`check-workflow-refs` so the two cannot disagree.

**`.claude/skills/` is not uniformly skills**, and reading it as though it were
was a live defect: `actors/` holds participants, `capabilities/` holds
environment probes (`docker`, `pandoc`, `python3`), `roles/` holds an assignment
table and `hooks/` holds a shell script. Scanning all of them put 46 non-skills
into the set, so `<folio:skill ref="viewer"/>` or `ref="latex-compiler"` would
have resolved. `NON_SKILL_GROUPS` excludes them — 176 names down to 136, with no
existing reference becoming dangling.

It is a **deny-list of groups known not to hold skills**, not an allow-list of
`local/`, so a new group of real skills is picked up automatically and a new
group of something else is a one-line addition.

## Adding a role

1. Add it to `skills/roles/roles.json` with a `summary` that says what the
   **position** is, not what it is called. `actorKind` is `person`, `agent`,
   `system` or `external`.
2. Bind its lanes — `<folio:role ref>` in new diagrams, `lanes[]` for an
   existing name you are not renaming.
3. Give it the skills its lane's activities name. `role-carries-activity-skill`
   fails if an activity demands something its performer was never given.
4. `bun run kg:audit` and commit the sidecars.

A role that binds no lane in any diagram is reported by `role-binds-a-lane`:
either a lane name has drifted, or the role is dead.
{% endraw %}
