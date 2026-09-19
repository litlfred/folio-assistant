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
| **Actor** | a concrete participant. Human, agentic or mechanical. Persists across every process. | `.claude/skills/actors/*.json` |
| **Role** | **the swimlane** — a persona an actor *takes on* because of the lane it is acting in. Carries a collection of Skills. | `skills/roles/roles.json` |
| **Skill** | an instruction body: what the actor needs to know to perform the task it was handed. | `skills/<pkg>/*.md`, `src/skills/`, `schemas/skills/<name>/`, `.claude/skills/local/` |
| **Process / Decision** | BPMN and DMN. Lanes bind roles; activities name skills; gateways may compute their branch from a table. | `skills/workflows/*.bpmn`, `skills/workflows/decisions/*.dmn` |
| **Requirement** | a conformance obligation that **points at** the others: `satisfiedBy` names the skill or capability discharging it, `actors` who is bound, `derivedFrom` the broader requirement it specialises. | `skills/requirements/*.json` |
| **Permission** | what an actor is **allowed to do**, in any lane. Cross-cuts roles. | `skills/permissions/permissions.json` |

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

> **Some roles perform, but by judgement.** `stakeholder` carries
> `judgementOnly: true`: somebody really does sign off, deliberates and is
> accountable — they simply cannot be handed a procedure that produces the
> answer. That is a different thing from `actedUpon`, where nobody acts at all,
> and the two must not be merged: marking the stakeholder `actedUpon` would say
> no one signs off, which is false and would take the lane out of every
> actor-coverage question it belongs in.
>
> The flag exists because prose did not hold. The role's own summary has said
> "carries no skills deliberately: sign-off is a judgement, not a procedure, and
> a skill here would suggest an agent could supply it" since the graph was
> written — and a later pass, reading four `activity-names-skill` findings on
> that lane, came within one commit of resolving them by giving the role a
> skill. A decision recorded only in a summary is a decision the next agent
> re-litigates.
>
> Effect: `activity-names-skill` records **n/a** for activities in the lane,
> which is what lets that criterion gate on the undeclared ones instead of
> staying advisory for ever.

## An actor is one of three kinds — human, agentic, mechanical

```jsonc
{ "id": "ci-pipeline", "title": "CI pipeline", "kind": "system", … }
```

`kind` takes one of four values, and three of them are the classification that
matters. `external` is the fourth: a participant outside this instance, which is
not ours to task at all.

| `kind` | the kind it names | what it can be handed |
|---|---|---|
| `person` | **human** | a skill to read, and a judgement to make |
| `agent` | **agentic** | a skill to read, and a judgement to make |
| `system` | **mechanical** | a program to run, and nothing to decide |
| `external` | outside this instance | nothing |

**The line is judgement.** An agent and a person can both be handed an
instruction body and asked to decide something; a mechanical system executes a
procedure and decides nothing. That is not a taxonomy for its own sake — it is
what says whether a given step may be given to a given participant.

**It was two values until 2026-09-19 and the conflation was the defect.** Every
entry carried `type`, which read `person` or `system`, and `system` covered an
LLM agent and a CI runner alike. Measured on `main` that morning: **16 `person`,
8 `system`** — and those 8 held **five agents and three mechanical services**.
So "which tasks can this actor perform" had no answer for a third of the
registry, because the question turns on judgement and both sides wore one label.

**The distinction was already written down, in prose nothing could read.**
`ci-pipeline`'s own description has always said *"It runs a fixed program and
exercises no judgement, so anything needing a decision belongs in another
lane."* `review-agent`'s says it performs *"NON-MECHANICAL validation …
judgement calls escalate to a human reviewer."* Both sentences state exactly
this rule; neither was machine-readable. That is the `judgementOnly` lesson
again — a load-bearing rule kept only in a summary is one the next pass
re-litigates.

**It was also already in a schema — the wrong one of two.** `ACTOR_KINDS` in
`schemas/role-graph.ts` has read all four values since the role graph was
written, while `ActorTypeSchema` in `schemas/skill-package.ts` read
`["person", "system"]` — and the registry validated the actor files against the
narrower one, so the four-kind vocabulary could not be used by the files it
existed for. There is now one declaration, in `skill-package.ts` (the zod-only
base both the registry schema and the role graph import), re-exported from
`role-graph.ts`.

**A legacy `type` still loads, and is never read as `agent`.** An unmigrated
downstream registry has not said whether its non-person actors exercise
judgement, so they read as `system` — the reading that refuses a judgement task
rather than granting one on a guess. Guessing from an id ending in `-agent`
would put an unreviewed claim into the graph wearing the appearance of data.
An unrecognised `kind` **throws**: coercing a typo to `system` would silently
disqualify an actor from every task it exists to perform.

## A task declares which actor kinds may fulfil it — mostly without saying so

> **Tasks can be fulfilled by only certain actor types.**

`activity-fulfilment-kind` checks that against the lane's role, and almost no
diagram has to declare anything, because **BPMN already answers it and nothing
was reading the answer**:

| task type | who may perform it | from |
|---|---|---|
| `bpmn:userTask` | `person` | the spec: "performed by a human being with the assistance of a software application" |
| `bpmn:serviceTask` | `agent`, `system` | the spec: "uses some sort of service … a Web service or an automated application" — no human in the loop |
| `bpmn:task` | **nothing asserted** | the abstract task says nothing, so neither does the check |
| `bpmn:callActivity` | **nothing asserted** | the constraint belongs to the called process's own steps |

`fulfilmentKindsForBpmnType` returns `undefined` for the last two, never `[]`.
An empty list would read as *"no kind may perform this"* and fail every
activity drawn as a plain task — the third state, in the place it is easiest
to lose.

**Scoped like `activity-names-skill`.** An `actedUpon` lane records `n/a`:
"the corpus cannot perform a serviceTask" is a finding nobody can act on. An
activity whose lane is unbound or absent is already reported by
`lane-binds-role` and `activity-in-lane`, so it is not reported twice here.

**Override it only when the derived answer is genuinely wrong:**

```xml
<bpmn:extensionElements>
  <folio:fulfilment kinds="person agent"
                    reason="a person or an agent drafts this; a pipeline cannot." />
</bpmn:extensionElements>
```

The **reason is required at load time** and a reasonless declaration does not
parse — the same rule `<folio:no-skill reason>` follows, and for the same
reason. Widening `kinds` is the cheapest way to make this criterion pass, so
silencing it has to cost a sentence somebody reads in the diff.

**Read a failure as a question with three answers, not one.** The task type may
be wrong, the lane may be wrong, or the step may really admit that kind — and
only the third is a `<folio:fulfilment/>`. Reaching for the exemption first is
how it becomes a rubber stamp.

## An actor has three lists, and they answer three different questions

```jsonc
{ "id": "admin",
  "roles":        ["programme-manager", "publication-manager", "editor", "author", "reviewer"],
  "permissions":  ["admin-settings", "role-management", "release-authorization"],
  "capabilities": ["git-push"] }
```

| field | question | scope |
|---|---|---|
| `roles` | what may it act **AS**? | per lane |
| `permissions` | what may it **DO**? | every lane |
| `capabilities` | what does its **machine have**? | the environment |

**These were one field until 2026-09** (bean `ind9`), and the conflation meant
nothing could resolve any of them: 27 claims across 19 names pointed at a
capability registry that only ever held environment probes.

**The obvious fix was wrong, and testing it is what found the real one.** "Can
review" and "can push" are properties of a position — that is exactly the
reasoning that moved `inherits` off actors — so permissions look like they
belong on Role. They do not survive the data. A permission **cross-cuts**:
`content-authoring` is held by actors taking on five different roles;
`qa-reporting` by three, one a build pipeline and one a human QC reviewer;
`admin` holds `admin-settings` in all five lanes it enters. Placing them on Role
produced **36** conflicts where a permission was held by some but not all actors
sharing a role.

The line that does hold: **a skill answers what the performer of this task needs
to KNOW, and belongs to the lane. A permission answers what this participant may
DO, and travels with the participant through every lane it enters.**

Both are audited and both are `critical` — `actor-permissions-resolve` and
`actor-capabilities-resolve`. The latter was `major` only while the field was
overloaded, carrying entries no vocabulary could ever resolve.

**Three names were neither**: `cql-authoring`, `data-dictionary-authoring` and
`lean-diagnostics` are skills with no body anywhere. Dropped rather than
relocated — claiming an unmodelled thing is worse than not claiming it, and
putting them on a role would fail `role-skills-resolve`. Bean `dtod`.

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

One criterion per join in the sentence at the top. The list below is the
actor→role→skill→task core; **`KG_CRITERIA` in `schemas/kg-qa.ts` is the
registry**, and it is longer — it also covers requirements, skill bodies and
the graph as a whole. This said "Fourteen criteria" while the registry held
**32**, which is the same defect the audit exists to catch, one level up: a
count in prose is a claim, and the thing it counts is a file you can read.

```
activity ──names────▶ skill      skill-ref-resolves             critical
gateway  ──computes─▶ decision   decision-ref-resolves          critical
lane     ──is───────▶ role       role-ref-resolves              critical
activity ──sits in──▶ lane       activity-in-lane               major
task type─can be done by▶ kind   activity-fulfilment-kind       major
lane     ──is───────▶ role       lane-binds-role                major
role     ──carries──▶ skill      role-carries-activity-skill    major
decision ──is used──▶ gateway    decision-outcomes-used         major
role     ──carries──▶ skill      role-skills-resolve            critical
role     ──is-a─────▶ role       role-inherits-resolves         critical
activity ──names────▶ skill      activity-names-skill           minor
role     ──is used──▶ lane       role-binds-a-lane              minor
actor    ──takes on─▶ role       role-has-actor                 minor
skill    ──any way in▶ anything  skill-has-entry-point          minor
skill    ──modelled?▶ role/task  skill-in-role-or-process       minor
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
   `system` or `external` — human, agentic, mechanical, or outside this
   instance. It is what `activity-fulfilment-kind` checks the lane's steps
   against, so it is a claim about who can actually stand there, not a label.
2. Bind its lanes — `<folio:role ref>` in new diagrams, `lanes[]` for an
   existing name you are not renaming.
3. Give it the skills its lane's activities name. `role-carries-activity-skill`
   fails if an activity demands something its performer was never given.
4. `bun run kg:audit` and commit the sidecars.

A role that binds no lane in any diagram is reported by `role-binds-a-lane`:
either a lane name has drifted, or the role is dead.
{% endraw %}
