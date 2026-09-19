---
# folio-assistant-7uff
title: 'LOGGING: agents log task start/end to fsh-guts/logs/, off by default, as a mechanical role'
status: in-progress
type: feature
priority: high
created_at: 2026-09-19T11:23:31Z
updated_at: 2026-09-19T11:32:32Z
---

Owner, 2026-09-19:

> under cat-harness i want to add a logging skill. the will live in
> fsh-guts/logs/ by default. an agent whenever it starts or ends a task or
> has a log message, they should add an entry to a log entry in the trash.
> define skills, i/o, bpmn and connect it to existing agentic processes. by
> default commit audit log to git data store is turned off - need explict
> like (cpature log when agent runs this workflow). make objecs/ts/schema
> for roles. Log is a mechaniscal role, it can be empteid by an actor all at
> once or individually. can be periocially empited. dont get published

## Measured before starting — two of these already exist

**Roles already have a TS schema.** `schemas/role-graph.ts` carries
`RoleDefSchema`, `ActorDefSchema`, `RoleGraphSchema` — all zod — plus
`ACTOR_KINDS`, `MECHANICAL_KINDS` and `JUDGEMENT_KINDS`. Building a second
one would be a second answer beside a working one, which is the drift this
repo keeps paying for. **No new role schema.**

**Mechanical roles already exist**, seven of them, all `actorKinds:
["system"]`: `build-pipeline`, `validation-pipeline`, `publish-target`,
`lean-toolchain`, `ig-publisher-service`, `work-plan`, `corpus`. So `log`
is a new ROW in an established pattern, not a new concept. `work-plan` and
`corpus` are the closest precedents — things that are *acted upon* and
exercise no judgement.

**What genuinely does not exist:** a schema for a log ENTRY. `ls schemas/ |
grep -i log` returns nothing.

## "Dont get published" is already covered — verify, do not rebuild

`fsh-guts/logs/` is inside `fsh-guts/`, and `folio-assistant-uv09` strips
every `fsh-guts` reference from the published graph, with a test. The
requirement is satisfied by placement. **Add a test that asserts it for
logs specifically** rather than assuming the parent rule reaches them.

## The interesting requirement: off by default

> by default commit audit log to git data store is turned off - need
> explict like (cpature log when agent runs this workflow)

`fsh-guts/logs/` is inside the repository, so writing there IS committing
unless something prevents it. Two things must therefore be true at once:

- the agent can **write and read** its own log during a session
- nothing reaches git **unless explicitly enabled**

So the default is *write locally, ignored by git*; opt-in promotes it to
committed. Per-workflow opt-in is the owner's example — *"capture log when
agent runs this workflow"* — which suggests the switch belongs on the BPMN
activity as well as in config, the same way `<folio:bean op>` already
marks steps that touch the work plan.

**The trap:** a logging system that silently keeps nothing is worse than
none, because an agent believes it has an audit trail. Whichever way the
switch is set, the state must be *reported*, not assumed.

## Emptying

> it can be empteid by an actor all at once or individually. can be
> periocially empited.

Three operations: clear one entry, clear all, and a periodic sweep. Note
the tension with the never-delete rule in `fsh-guts.md`: this directory IS
the destination for things that would otherwise be deleted, and logs are
the one thing inside it that may be genuinely discarded. **That exception
needs writing down in the skill**, or the next agent reads the two rules
and cannot act.

## Done when

- [ ] `schemas/log-entry.ts` — zod, `$schema: folio-log/v1`, with the I/O
      the owner asked for
- [ ] `log` role in `roles.json`, `actorKinds: ["system"]`
- [ ] a logging skill under the `cat-harness` graph
- [ ] BPMN for the log lifecycle, and at least one real wiring point into
      an existing process
- [ ] git persistence OFF by default, explicit opt-in, and the current
      state reported rather than silent
- [ ] emptying: one, all, periodic — with the never-delete exception stated
- [ ] a test that log entries never reach the published graph

## Round 1 landed, 2026-09-19

- `schemas/log-entry.ts` — zod, `$schema: folio-log/v1`, four events,
  three-valued `capture`, `resolveCapture` and `shouldPersist`
- `log` role in `roles.json`: `actorKinds: ["system"]`, `actedUpon: true`
- `skills/folio-core/activity-log.md`
- `skills/workflows/activity-log.bpmn` + rendered SVG, indexed in
  `every-workflow-in-the-repo.md`
- `.gitignore` ignores `fsh-guts/logs/` and NOT the rest of the trashcan
- 20 tests

## What I did NOT build, having measured first

**No role schema.** The owner asked for "objecs/ts/schema for roles" and
`schemas/role-graph.ts` already carries `RoleDefSchema`,
`ActorDefSchema`, `RoleGraphSchema`, `ACTOR_KINDS`, `MECHANICAL_KINDS`
and `JUDGEMENT_KINDS` — all zod. A second one would have been a second
answer beside a working one. Reported rather than built.

## Three defects the checks found in my own work

1. **`A_DoWork` declared `F_3` but not `F_4`** — a sequence flow with no
   matching `outgoing`. Found by writing a wiring check rather than by
   reading it.
2. **No `bpmndi:BPMNDiagram`** — "no diagram to display". Every diagram
   here carries hand-written DI; mine had none. Generated the layout
   programmatically so coordinates are consistent rather than eyeballed.
3. **The lane conflated a person with a timer.** "Operator (human or
   scheduled sweep)" bound to no role, because the role model binds a lane
   to exactly ONE role. Split into `Log operator (human)` → `user` and
   `Scheduled log sweep` → `build-pipeline`, which is the honest shape: a
   person chooses what to discard, a sweep runs a fixed program and chooses
   nothing.

Also edited the wrong file first — `docs/folio-assistant/publication-workflow.md`
is GENERATED; the authored index is
`content/docs/publication-workflow/every-workflow-in-the-repo.md`. Reverted
and redone.

## Still open

- `<base>/fsh-guts.jsonld` (parent `t0i3`), which the log needs too
- wiring `activity-log` into the EXISTING processes — the diagram exists
  and nothing calls it yet
- a writer: no code creates an entry, so the schema is unexercised by a real
  producer
