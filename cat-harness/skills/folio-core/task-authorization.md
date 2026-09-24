---
name: task-authorization
description: >
  The check every BPMN task execution runs before anything is recorded:
  is the actor authenticated, assigned to the role the lane binds, authorized
  by an ODRL policy to perform the task, and allowed access to the content it
  acts on? One generic check in the engine rather than a step drawn in some
  diagrams; advisory today, and what would make it strict. Also how the HTTP
  routes ask the same policies. Triggers on: may this actor, who may perform,
  authorization, authentication, access rights, permission check, RBAC,
  rbac.ts, workflow_complete refused, not eligible for role.
allowed-tools: Read Grep Glob Bash
---

# Task authorization — four questions before every task

> **Before an actor performs a task or answers a decision, the BPMN executor
> asks: who is this, may they act in this lane, does a policy let them do it,
> and may they touch this content?**

Issue [#1207](https://github.com/litlfred/folio-assistant/issues/1207), a
child of #1180. Owner decisions, 2026-09-23, are quoted where they apply.

## The four checks, in order

| # | question | answered from | a "no" |
|---|---|---|---|
| 1 | **Authenticated** — who is the actor, and how do we know? | the executor's `Principal` (`src/core/access.ts`) | recorded as a finding |
| 2 | **Assigned** — may this actor take the role the lane binds? | `ActorDef.roles` in `.claude/skills/actors/`; the lane's `roleRef` | **refuses** |
| 3 | **Authorized** — may they `perform-task` in this process, for this task, as this role? | ODRL policies in `policies/*.jsonld` | `deny` **refuses**; `unknown` is a finding |
| 4 | **Access** — the same, on the content (`target`) the task acts on | the same policies, rule `target` | `deny` **refuses**; `unknown` is a finding |

It is **one function**, `authorizeTask` in `src/workflow/authorize.ts`, run by
the interpreter's `complete()` and by `workflow_gate`. **It is not drawn as a
task in any diagram.** A check drawn into some processes is a check missing
from the others, and the owner asked for *"generic check on each task
execution as part of any bpmn engine"*.

The verdict is written into the instance history (`HistoryEntry.authz`) and the
`task-end` log line, so the record of a step says who did it and on what
authority, not only that it happened.

### Why checks 2 and 3 stay separate

A role is what the actor is acting **as**; a permission is what the actor may
**do** ([`role-model`](role-model.md) §"Permissions"). An actor permitted to
`perform-task` everywhere still cannot sit in a lane its `roles` do not
include. So the role check does not wait on the policy and cannot be overridden
by it.

## One action for every task

Owner: *"Always perform-task."* A task asks for `perform-task`, scoped by
`cat-harness:process`, `cat-harness:task` and `cat-harness:role` constraints
and by `target`. A step needing a narrower right gets it as a **constrained
rule in a policy**, never as a new attribute on the diagram:

```json
{ "assignee": "content-reviewer", "action": "perform-task",
  "constraint": [{ "leftOperand": "cat-harness:role", "operator": "odrl:eq", "rightOperand": "reviewer" }] }
```

Remember the direction of `includedIn`: a grant of a **broader** action covers
a narrower one. `perform-task` sits under `odrl:execute`, so granting
`adjudication` (which is included in `perform-task`) does **not** grant
`perform-task`. It is the other way round.

## Authentication is the executor's job, and GitHub is today's authenticator

Owner: *"process bpmn executor responsibility. its skill, tools may be http but
we dont have this setup yet. we do have agentic discussion + git(hub) KG-DS and
with github we use it as auth / auth control."*

So whoever executes a process (the MCP workflow tools, a script, a swarm
orchestrator) must say **how** it knows who the actor is. A `Principal` carries
`authenticatedBy`:

| value | meaning | today |
|---|---|---|
| `github` | GitHub authenticated the caller | a GitHub Actions run (`GITHUB_ACTOR`, set by the runner) |
| `http-gateway` | the auth-gateway's OAuth session, as headers | the HTTP routes, once deployed ([`deployment-auth`](deployment-auth.md)) |
| `asserted` | an actor id the caller typed | **every local agent session** |
| `none` | nobody named | a step recorded with no `actor` |

The second half of GitHub as access control needs no code: the KG data store
is a git repository on GitHub. An instance file, a bean or a content change
becomes durable **only through a push GitHub has authorised**. The in-process
check decides whether the step may be recorded; branch protection and push
rights decide whether the record lands.

**Do not treat `asserted` as authenticated.** Report it as asserted. Mapping a
GitHub login to a declared actor is the data store's job (`policies/`
deliberately never holds identity), and it is not built yet.

## Advisory now, and what makes it strict

Owner: *"Advisory now."* In advisory mode:

- **`deny` refuses**, and so does **a role the actor may not take**. Both are
  decisions somebody wrote down.
- **`unknown` is allowed and recorded as `unknown`.** It is never read as
  permit. `unknown` means no rule speaks to the request (`schemas/odrl.ts`,
  "three answers, never two").
- An `asserted`, `none` or undeclared actor is allowed and recorded.

**Measured 2026-09-23**, across all 615 tasks and gateways in `processes/`
(counting each once, with every eligible actor asked): **0** have a
`perform-task` permit, **574** are `unknown`, and **41** sit in a lane no
declared actor may take. Strict mode today would stop every process. Strict
(`mode: "strict"`) additionally refuses `unknown`, `asserted`, `none` and an
undeclared actor. Turn it on once policies grant `perform-task` for the lanes
in use, and **re-measure first**: quote the count from a run, not from this
paragraph.

## The HTTP routes ask the same policies

`src/core/rbac.ts` was a viewer < collaborator < owner ladder, with every route
hard-coding its minimum rung. Owner: *"Replace with ODRL now."* Now:

- a route names the **action** it performs: `allows(req, "content-authoring")`;
- the gateway's three sessions are three declared actors (`viewer`,
  `collaborator`, `owner`), and what each may do is
  `policies/http-gateway.jsonld`;
- **at the HTTP boundary `unknown` refuses.** A route is a door, and a door
  nobody has decided about stays shut. That is the one place the two callers
  differ, and it is on purpose.

| route | action |
|---|---|
| edit content, revert content, upload documents, save glossary curation | `content-authoring` |
| delete feedback | `review-comments` |
| adjudicate a relevance verdict | `adjudication` |

The gateway policy reproduces exactly what the ladder allowed (every gated
route asked for "collaborator or higher"), and `task-authorization.test.ts`
pins that.

## When a step is refused

1. Read the verdict line: it names which of the four checks said no.
2. **Role mismatch:** you are acting as the wrong actor, or the lane binds a
   role you do not hold. Hand the step to an actor who may take the role
   ([`process-state`](../workflow/process-state.md)). Do not edit your actor's
   `roles` to get past it; that is `actor-role-administration.bpmn`, and it
   belongs to the administrator lane.
3. **`deny`:** a prohibition was written on purpose. Ask the user; never
   remove it yourself ([`deletion-requires-confirmation`](deletion-requires-confirmation.md)).

## The after-check: the PROV-O QA/QC report

The engine checks **before** a step. An agent swarm acts first, so the same
policy is checked **after**, from the record (issue #1180, step 5;
`content/docs/agentic-harness/bpmn-execution.md`).
`scripts/prov-qaqc.ts` reads every instance in `beans/workflows/`, including
its subprocesses, and for each history entry on an activity or decision:

- writes one `prov:Activity` (`schemas/prov.ts`): `prov:agent` is the entry's
  actor, `prov:hadRole` is the role the lane binds (`laneBinding`),
  `prov:hadPlan` is `<process file stem>#<node id>`, and
  `cat-harness:underPolicy` is every policy evaluated. One log per instance
  goes to `docs/assets/prov/<instance>.prov.jsonld`;
- re-runs `authorizeTask` itself, with the actor `asserted`, because history
  records only a name.

Findings: `unknown`, `deny`, `not-eligible`, `undeclared-actor`, a recorded
`authz` that disagrees with the recomputed one (`authz-disagrees`), and gaps
in the record itself: `no-actor`, `no-role`, `node-not-in-model`,
`source-moved` and `source-missing`. **An entry with no actor, or in a lane
that binds no role, gets no `prov:Activity`**, because the schema requires
both and a guessed value is fabrication. It gets a finding instead.

```sh
bun run prov:qaqc          # write docs/prov-qaqc/index.md and the logs
bun run check:prov-qaqc    # CI: fail when they are stale
```

It is **advisory**, like the engine: findings are listed on the
`/prov-qaqc/` page and never fail the build. `check:prov-qaqc` fails only on
stale outputs, a `prov:Activity` that does not validate, or an internal
error. Quote the counts from a run, not from the page you remember.

## Code

- `src/workflow/authorize.ts`: `authorizeTask`, `describeVerdict`
- `src/core/access.ts`: `loadAccessContext`, `principalFromEnv`
- `src/core/rbac.ts`: `principalOf`, `authorize`, `allows`, `forbidden`
- `schemas/odrl.ts`: `decide` (every policy; any `deny` wins), `PERFORM_TASK`
- `scripts/prov-qaqc.ts`: `buildReport`, `reportInstance` (the after-check)
- tests: `scripts/tests/task-authorization.test.ts`, `scripts/tests/prov-qaqc.test.ts`
