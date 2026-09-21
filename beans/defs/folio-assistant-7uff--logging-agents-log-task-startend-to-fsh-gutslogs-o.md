---
# folio-assistant-7uff
title: 'LOGGING: agents log task start/end to fsh-guts/logs/, off by default, as a mechanical role'
status: completed
type: feature
priority: high
created_at: 2026-09-19T11:23:31Z
updated_at: 2026-09-20T20:00:00Z
parent: folio-assistant-8jt6
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
- `processes/activity-log.bpmn` + rendered SVG, indexed in
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


## KG wiring — done, and it turned up three things (commit `db7e9124`)

Owner: *"it should be wired into cat-harness KG"*.

**Measured: `scenarios/roles.json` was never a source of Role nodes.** 65 of
66 carried `sourceKind: "bpmn-lane"`, so what a role IS — its actor kinds, its
skills, whether it is `actedUpon` — was absent from the published graph
entirely. `collectDeclaredRoles()` now emits the registry view **joined to**
the lane view by `bindsLane` rather than replacing it: **31 registry roles, 98
Role nodes**. `log`, `corpus` and `work-plan` are all present; `corpus` was a
pre-existing instance of the same gap.

Three findings, none predicted:

1. **An empty lane was invisible.** The lane view read lanes off the lanes that
   flow nodes *name*, and an `actedUpon` lane holds no flow nodes by
   construction — it is written to and never acts. So exactly the lanes whose
   emptiness is the point were the ones dropped, and the `log` role's
   `bindsLane` was the graph's one dangling link. Now read from the declared
   lane set.
2. **`ns:check` named four undefined minted terms, and two were duplicates.**
   `carriesSkill` and `hasLane` restated `hasSkill` and `bindsLane`, which
   `schemas/role-graph.ts`'s own JSON-LD projection already publishes. Reused,
   not glossed — the reflex on that gate is to write the missing definition,
   which would have put one concept in the vocabulary twice. `actedUpon` and
   `judgementOnly` are genuinely new and glossed as two flags: collapsing them
   would give a store an actor or a stakeholder a skill.
3. **The fsh-guts strip caught me.** The `log` role's own `description` named
   `fsh-guts/logs/`, and `roles.json` carried a stale lane alias with the same
   path. A role description IS published; the location belongs in the skill.
   Zero `fsh-guts` mentions in the export.

Five tests, each verified to fail without its fix, with a vacuity guard on the
filters — every assertion here filters, and a filter over nothing passes.

### Still open on this bean

- **Nothing writes a log entry.** The schema, the role, the skill and the BPMN
  exist; no code produces one. A producer is the next piece.
- **`activity-log.bpmn` is not called from any existing process.** The owner
  asked to "connect it to existing agentic processes" — that means call
  activities in `crdm-requirements`, `editing-hci-validation` and
  `content-lifecycle`, which is not done.


## The producer and the rich schema (commit `20e57de2`)

Both remaining pieces are done.

**`src/logging/log-writer.ts`** — writes to every directory `logDirs()`
resolves, never throws (a log is instrumentation; an agent whose task dies
because logging died has been made worse off by the thing meant to help it),
and never silent (`written: false` always carries the reason).

**`references[]` and `execution`**, from the owner's *"rich schema including
references to discussion/chats, cmn execution logs, etc."* The `etc.` is the
spec: `kind` is an **open** string over a known set, and an unrecognised kind
is accepted and flagged rather than refused. A list rather than
`issue`/`pr`/`commitSha` fields, because one entry routinely touches several
of one kind. `execution` has **no field to inline output into** — `outputRef`
points at where it went, because output is the likeliest place for a token and
`capture: "on"` puts an entry in git.

`cmn` read as **command**: no CMMN exists in this codebase and "execution
logs" pairs with a command. If CMMN was meant it arrives as `kind: "case"`
with no schema change.

**`<folio:log capture="on"/>` on the process, NOT a call activity.** That is
the one judgement worth recording. A call activity is a node in the control
flow, so the log would become a step completed in sequence — and two of the
three processes are `enforcement="strict"`, where `workflow_gate` refuses a
step that is not enabled. It would have changed what those diagrams say and
needed policy relaxations for a concern that is not a phase of anything. There
is a test asserting both strict processes still enforce exactly what they did.

Marked: `crdm-requirements`, `editing-hci-validation`, `content-lifecycle`.

### Not done, and deliberately

- **No agent calls the producer outside the workflow tools.** `workflow_start`
  and `workflow_complete` write entries; an agent working outside a process
  still writes nothing. Whether that wants a hook or an MCP tool is a separate
  question.
- **Emptying is specified and not implemented.** The skill defines one entry,
  all of them, and a periodic sweep; no code does any of the three.


## Emptying (commit `8289e34d`) — 7uff is complete

`emptyLog(root, selector)`, selector one of `{id}`, `{session}`, `{before}`,
`{all: true}`. No default selector.

**The judgement worth recording:** the exception fsh-guts grants is to a KIND
OF FILE, not to a path. An `rm` over the directory's contents would have
relaxed never-delete for `fsh-guts/logs/` itself, so a stray proposal dropped
there would have gone with the logs. A file is removed only if it declares
itself `folio-log/v1`; "could not tell" resolves to keep; a symlink out is
refused by `realpath`; and every file not removed says why, with
`describeSweep` separating a selector miss from a refusal.

13 tests, both guards proven load-bearing by disabling them.

### Everything on this bean is now done

schema · role · skill · BPMN · producer · rich references · `<folio:log>`
capture on three processes · emptying. Ready to resolve once the owner
confirms; not resolving unilaterally.

### The one thing I would still add, as its own bean if wanted

Nothing outside `workflow_start` / `workflow_complete` calls the producer, so
an agent working outside a process logs nothing. Whether that wants a session
hook or its own MCP tool is a real design question, not an oversight.


---

**Parented to `8jt6` (MEMORY & TODOS), 2026-09-19**, which was previously
absent and is why `check-bean-parents` failed on this branch.

`8jt6`'s own framing is *"notes an agent or a person carries, attached to a
node of the graph"*, and its schema bean `h32d` is one schema attachable to
any KG node — which is structurally what a log entry with `references[]` is.
**The alternative considered was `ahvw` (PROCESS)**, on the grounds that
capture is declared on a BPMN process and the producer is called by
`workflow_start` / `workflow_complete`. Recorded so a later agent can move it
cheaply rather than re-deriving the argument: this is a judgement, not a fact.

## Evidence

Tagged `ready-to-close` by the `bbbl` sweep, 2026-09-20. **Not closed** — the
owner confirms the batch (`bun run check:ready-to-close`).

**What the bean itself records as done**, under its own heading *"Everything on
this bean is now done"*: schema · role · skill · BPMN · producer · rich
references · `<folio:log>` capture on three processes · emptying. It carries
*"13 tests, both guards proven load-bearing by disabling them"* — a falsifier
that was actually run, which is the strongest evidence in the four.

**Its own words on why it stayed open**: *"Ready to resolve once the owner
confirms; not resolving unilaterally."* That is the collision `bbbl` names, not
an outstanding task.

**What this session could NOT re-derive**: the 13 tests were not re-run here,
and 0 of the bean's 7 Done-when boxes are ticked, so the mapping from "done" to
each box is the author's claim rather than a re-measurement. The open design
question the bean raises at the end — nothing outside `workflow_start` /
`workflow_complete` calls the producer — is explicitly *"a real design
question, not an oversight"*, and belongs in its own bean rather than holding
this one open.

---

_2026-09-20T20:00Z_ — **CLOSED on the owner's confirmation of the `ready-to-close`
batch, 2026-09-20.** The evidence above is what was confirmed against; nothing
new was measured at closing time, and this note says so rather than implying a
re-derivation that did not happen.

The `ready-to-close` tag is spent and removed: `check:ready-to-close` reports a
tag on a closed bean as one to take off, so leaving it would make the queue
report a defect on its own success.
