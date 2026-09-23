# bootstrap — your user story

**You are an agent. This page is your user story, and you are inside it right
now**: you have been pointed at a repository, you know nothing about it, and
you are reading a `README.md` in order to bootstrap yourself into a harness.

That is not a figure of speech. This page is written in the **user-scenario
formalism** a WHO SMART Digital Adaptation Kit uses for exactly this job —
*persona*, *user scenario*, *business process*, *functional requirement* — and
every term below is a link to the asset that defines it. The scenario's
persona is the one reading it.

Read this page, then start the one process it names. Nothing else here is a
prerequisite.

---

## 1 · Persona — who you are

> **DAK L2, generic persona.** Declared in
> [`scenarios/roles.json`](scenarios/roles.json); a persona here is a
> **role**, and a role is a **BPMN swimlane**. You do not *are* a role — you
> **act as** one, for the duration of a lane.

| persona | id | who it is |
|---|---|---|
| **Initiator** | [`initiator`](scenarios/roles.json) | **you**: the agent asked to initialize a harness, knowing only what this page gives you. |
| **Requestor** | [`requestor`](scenarios/roles.json) | the person who wants one initialized. The only one who can say *which*. |
| **Knowledge Graph Data Store** | [`knowledge-graph-data-store`](scenarios/roles.json) | a git repository — where a harness is read from and a new one written to. Reached through the git CLI, or a forge's API. |
| **Logger** | [`logger`](scenarios/roles.json) | where an actor says what it is doing. Records; decides nothing. Here it is the discussion you are already in. |

Two more words, used by every sentence below rather than re-explained:

| | |
|---|---|
| **Harness** | what a repository can be made into — `bootstrap` itself, or a derivative such as `cat-harness`, `folio-assistant`, `smart-guidelines`. Declared by a [`bootstrap.json`](bootstrap.json). |
| **Process** | a diagram with lanes, steps and branches. Each lane is a persona; you act in yours. |

> **An Initiator has no harness, no server, no tools and no work plan.**
> If a step seems to need one, you are reading instructions meant for later.
>
> This is the invariant that shapes everything else here, including what this
> directory is allowed to contain: 8 `.md`, 6 `.json`, 3 `.bpmn`, and **no
> executable code of any kind**. Every file below is one you *read*.

---

## 2 · The user story

> **As an** [Initiator](scenarios/roles.json),
> **I want to** turn a repository I know nothing about into a **named harness**,
> **so that** every artefact written into it afterwards inherits the right
> upstream — because that is the one thing that cannot be fixed later.

### Acceptance

The story is done when **either** a harness is installed **or** a failure is
logged. Both are outcomes. Neither is a reason to improvise.

---

## 3 · User scenario — the narrative walkthrough

> **DAK L2, user scenario.** The business process that realises it is
> [`processes/initialize-harness.bpmn`](processes/initialize-harness.bpmn).

**1. You arrive knowing nothing.** You can open a file, and that is all you are
assumed to be able to do. How to open things here, and nothing more, is
[`skills/bootstrap-kg-navigation.md`](skills/bootstrap-kg-navigation.md).

**2. You start the one process there is.**

> Open [`processes/initialize-harness.bpmn`](processes/initialize-harness.bpmn)
> and begin at its start event.

**It is the only process you START, and that is deliberate** — you cannot begin
the wrong one. It is a file you **read**, not something you run: the engine
that executes a diagram belongs to the harness you have not installed yet.

**3. You ask the Requestor which harness.** You bring a list of candidates and
locations; the Requestor returns **at most one**. You may narrow the list. You
may **not** break a tie. The skill is
[`skills/confirm-harness.md`](skills/confirm-harness.md); the conversation it
happens in is the process
[`processes/discussion.bpmn`](processes/discussion.bpmn), whose skill is
[`skills/discussion.md`](skills/discussion.md) and whose two ends are declared
as data:
[`discussion.input.schema.json`](schemas/discussion.input.schema.json) —
what you already know and which unknown is still open — and
[`discussion.output.schema.json`](schemas/discussion.output.schema.json) —
the harness, the repositories as read-from / written-to pairs, `determinedBy`,
and who answered. **The task is finished when a document conforming to the
output schema exists**, not when a pleasant exchange has occurred.

**4. You say what you are doing, where saying so is required.**
[`processes/log-message.bpmn`](processes/log-message.bpmn) is **not** an
alternative start. It is an independent sub-process: something a step *calls*,
never somewhere you begin. You may call it from any step;
`initialize-harness` calls it at two steps where it is required. Its skill is
[`skills/log-message.md`](skills/log-message.md).

**5. You follow the chosen harness to its own instructions** — always at the
same place inside it:

```
<name>/docs/bootstrap/initialization.md
```

`<name>` is the `name` in that harness's `bootstrap.json`. It is the same path
for **every** harness, which is why you can be sent to one nobody has written
yet: you do not need to know what `f-a-sci` or `smart-guidelines` *is*, only
that it keeps its instructions where every harness does.

**6. You leave a README at the root, if there is none.** The repository now IS
an instance of something and nothing at its top says so — which is the one file
a person, and a cold agent, opens first.
[`skills/root-readme.md`](skills/root-readme.md) says what it carries: a link
to the harness, and the **overall** install status across every location. Two
things and no more; the harness's own `readme_sync` fills the rest once it is
installed. A README that already exists is **never** replaced — the link and
status go in a marker pair beside what its author wrote.

That write looks like a rule violation and is not. `instance-readme` declares
`layer: context` — read at session start, never written by a running process —
and **initialisation is not process runtime**: the rule governs a process
operating on an instance that exists, and this is the act that brings one into
being. A `context` asset that does not exist yet has to come from somewhere.

**7. The story ends**, one of the two ways its acceptance names.

---

## 4 · Functional requirements

> **DAK L2, functional requirements.** Each is testable, and each `realises`
> the user story above.

| id | requirement |
|---|---|
| **FR-1** | An Initiator can reach every asset named here with no capability but opening a file. |
| **FR-2** | Exactly **one** process may be started; the others are callable only as sub-processes. |
| **FR-3** | Only the Requestor may choose the harness. The Initiator may narrow candidates and may never break a tie. |
| **FR-4** | Every harness keeps its initialization instructions at `<name>/docs/bootstrap/initialization.md`, so an unknown harness is still reachable. |
| **FR-5** | A repository whose root already carries a `bootstrap.json` is **logged and ended**, never re-initialised. |
| **FR-6** | Anything that does not resolve is reported and stops the process; nothing is worked around. |
| **FR-7** | This directory contains no executable code, so FR-1 cannot quietly stop being true. |
| **FR-8** | A successful install leaves a root `README.md` naming the harness and the overall install status — created when absent, and **never** replacing one that exists. |

### FR-5, expanded — the likeliest failure

**A repository whose root carries a `bootstrap.json` has been initialized**,
usually because the work is done. That is logged and ended rather than redone.
Re-initialising over an instance that has content, history and dependents is
not undone by running anything again.

### FR-6, expanded — if something does not resolve

**Say so and stop.** A file named here that is missing, a harness whose
instructions are not at that path, a name that matches nothing — each is worth
reporting, and none is a gap to work around.

A wrong harness does not fail. It **succeeds at being the wrong thing**, and
every artefact written afterwards inherits it. A repository left un-initialised
is recoverable; one declaring the wrong upstream is not.

---

## 5 · Minimal mapping — DAK onto the bootstrap data model

The formalism is not decoration. Every DAK concept this page uses already has
a home in the harness data model, and the mapping is one-to-one:

| DAK (SMART) | bootstrap / harness | where it is declared |
|---|---|---|
| Generic **persona** | **Role** — a BPMN swimlane an actor acts in | [`scenarios/roles.json`](scenarios/roles.json) → [`role-graph.ts`](../cat-harness/schemas/role-graph.ts) |
| **Actor** | **Actor** — a concrete participant, persisting across processes | [`role-graph.ts`](../cat-harness/schemas/role-graph.ts) |
| **User scenario** | *this page* — the narrative an Initiator reads | [`dak-blocks.ts`](../cat-harness/schemas/dak-blocks.ts) `UserScenarioBlock` |
| **Business process** | the BPMN diagrams, lanes bound to roles | [`processes/`](processes) → [`dak-blocks.ts`](../cat-harness/schemas/dak-blocks.ts) `BusinessProcessBlock` |
| **Functional requirement** | §4 above | [`dak-blocks.ts`](../cat-harness/schemas/dak-blocks.ts) `FunctionalRequirementBlock` |
| **Core data element** | the fields of a harness declaration | [`cat-harness.ts`](../cat-harness/schemas/cat-harness.ts) |
| L1 → L2 → L3 traceability | `realises` on every DAK block | [`dak-blocks.ts`](../cat-harness/schemas/dak-blocks.ts) `DakBlockBase.realises` |

**The persona binding is an edge, not prose.** `UserScenarioBlock.personas`
holds role ids and is required 1..*, so §1 above is a graph relation and
*"which scenarios involve the Requestor?"* is a query rather than a grep. It
is deliberately **not** `uses[]`: that is the *editorial* relation — what a
reader must have read to follow a block — and overloading it would destroy the
signal every ordering metric is computed from.

Because a role id is carried as a **string**, that edge is invisible to a
syntactic reader unless it is declared. It is, with `@ref RoleDef` on the
field, which is why `UserScenarioBlock --personas--> RoleDef` appears in the
schema graph at all.

**Nothing here is stored twice.** This page does not restate `roles.json`, the
BPMN lanes or the schemas; it links them. A persona's definition has one home,
and it is not this file.

---

## 6 · Every asset in this harness

> Cross-referenced in full, because a file nobody can reach from the entry
> document is a file nobody checks.

| asset | what it is |
|---|---|
| [`README.md`](README.md) | **this page** — the user scenario, and the entry point |
| [`AGENTS.md`](AGENTS.md) | the agent-generic pointer into this directory |
| [`bootstrap.json`](bootstrap.json) | this instance's own declaration: which directories it holds and what kind of graph each is |
| **workflows** | |
| [`processes/initialize-harness.bpmn`](processes/initialize-harness.bpmn) | the **only** process you start |
| [`processes/discussion.bpmn`](processes/discussion.bpmn) | asking the Requestor something only they can answer |
| [`processes/log-message.bpmn`](processes/log-message.bpmn) | saying what you are doing; a sub-process, never a start |
| **skills** | |
| [`skills/bootstrap-kg-navigation.md`](skills/bootstrap-kg-navigation.md) | how to open anything here, assuming nothing |
| [`skills/confirm-harness.md`](skills/confirm-harness.md) | asking *which* harness |
| [`skills/discussion.md`](skills/discussion.md) | running the discussion process |
| [`skills/log-message.md`](skills/log-message.md) | running the log-message process |
| [`skills/root-readme.md`](skills/root-readme.md) | writing the root README when there is none — the link, the install status, and why this write is not the one the `context` layer forbids |
| [`schemas/discussion.input.schema.json`](schemas/discussion.input.schema.json) | the occasion for asking, as data |
| [`schemas/discussion.output.schema.json`](schemas/discussion.output.schema.json) | the answer, as data — **the artefact that finishes the task** |
| [`scenarios/roles.json`](scenarios/roles.json) | the four personas of §1 |
| [`skills/package-manifest.json`](skills/package-manifest.json) | the skills package declaration |
| [`skills/bootstrap-graph-emission.md`](skills/bootstrap-graph-emission.md) | emitting this instance's own graph |
| [`skills/bootstrap-graph-publication.md`](skills/bootstrap-graph-publication.md) | publishing it |

**Why graph emission is here at all**, given an Initiator runs nothing:
bootstrap is the one layer **exempt** from having a visualiser, and what it
owes instead is its own `.json`/`.jsonld` — *that is its existence*. A layer
that cannot emit its own graph has not shown it is a graph. The two skills
above are that exemption's substitute.

They lived in their own `render/` package, then `tools/`, until 2026-09-23
(bean `n350`), when the owner consolidated it by what each part IS: the two
skills joined `skills/`; the Tool that performs the emission is cat-harness's
`kg-graph-export`, which `satisfies` both; and the document they describe is
typed by `BootstrapGraphDocumentSchema` in `bootstrap-tools/schemas/`.
bootstrap declares no `tools` graph, deliberately: an Initiator has no MCP
server and that constraint is the role.

---

**Terms, if you want the precise definitions:**
[harness declaration](../cat-harness/schemas/cat-harness.ts) ·
[skill](../cat-harness/schemas/skill-package.ts) ·
[role](../cat-harness/schemas/role-graph.ts) ·
[DAK blocks](../cat-harness/schemas/dak-blocks.ts) ·
[process](../cat-harness/processes) ·
[tool](../cat-harness/schemas/tool.ts).
Why bootstrapping is built this way:
[the proposal](../cat-harness/docs/proposals/bootstrap.md).
