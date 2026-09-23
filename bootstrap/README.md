# bootstrap — your user story

**You are an agent, and this page is your user story.** You have been pointed
at a repository you know nothing about, and you are reading its `README.md` to
turn it into a harness.

The page is written in the **user-scenario formalism** of a WHO SMART Digital
Adaptation Kit: persona, user scenario, business process, functional
requirement. The persona is you. Every term links to the file that defines it;
this page restates none of them.

---

## 1 · Persona — who you are

> **DAK L2, generic persona.** A persona here is a **role**, and a role is a
> **BPMN swimlane**: you do not *are* one, you **act as** one for the length
> of a lane. All four are declared in [`scenarios/roles.json`](scenarios/roles.json).

| persona | who it is |
|---|---|
| **Initiator** | **you**: the agent asked to initialize a harness, knowing only what this page gives you. |
| **Requestor** | the person who wants one initialized, and the only one who can say *which*. |
| **Knowledge Graph Data Store** | a git repository: where a harness is read from and a new one written to, through the git CLI or a forge's API. |
| **Logger** | where an actor says what it is doing. It records and decides nothing; here it is the conversation you are already in. |

A **harness** is what a repository can be made into: `bootstrap` itself, or a
derivative such as `cat-harness`, `folio-assistant` or `smart-guidelines`,
declared by a [`bootstrap.json`](bootstrap.json). A **process** is a diagram
with lanes, steps and branches; each lane is a persona.

> **An Initiator has no harness, no server, no tools and no work plan.** If a
> step seems to need one, you are reading instructions meant for later.

---

## 2 · The user story

> **As an** Initiator,
> **I want to** turn a repository I know nothing about into a **named harness**,
> **so that** everything written into it afterwards inherits the right
> upstream. That is the one thing that cannot be fixed later: a wrong harness
> does not fail, it succeeds at being the wrong thing.

**Acceptance.** The story is done when **either** a harness is installed **or**
a failure is logged. Both are outcomes.

---

## 3 · User scenario — the walkthrough

> **DAK L2, user scenario.** The business process that realises it is
> [`processes/initialize-harness.bpmn`](processes/initialize-harness.bpmn).
> Each step names the requirement in §4 that governs it.

1. **You arrive knowing nothing.** You can open a file, and that is all
   ([FR-1](#4--functional-requirements)). How to open anything here is
   [`skills/bootstrap-kg-navigation.md`](skills/bootstrap-kg-navigation.md).
2. **You open [`processes/initialize-harness.bpmn`](processes/initialize-harness.bpmn)
   and begin at its start event** (FR-2). You read it; the engine that would
   run it belongs to the harness you have not installed yet.
3. **You ask the Requestor which harness, and where** (FR-3), bringing the
   candidates and locations you found, and following
   [`skills/confirm-harness.md`](skills/confirm-harness.md). The asking is the
   [`discussion`](processes/discussion.bpmn) process. It is finished when a
   document conforming to its
   [output schema](schemas/discussion.output.schema.json) exists, not when a
   pleasant exchange has happened.
4. **You read what each location already is.** One that already carries a
   `bootstrap.json` ends the story (FR-5).
5. **You follow the chosen harness to its own instructions** (FR-4), which are
   always at:

   ```
   <name>/docs/bootstrap/initialization.md
   ```

   `<name>` is the `name` in that harness's `bootstrap.json`. You need not
   know what the harness *is*, only where every harness keeps its
   instructions. You log the start of the install first, and any failure
   along the way, through the [`log-message`](processes/log-message.bpmn)
   sub-process.
6. **You leave a README at the repository root** (FR-8), following
   [`skills/root-readme.md`](skills/root-readme.md).
7. **The story ends**, one of the two ways its acceptance names. Anything that
   does not resolve on the way ends it too (FR-6).

---

## 4 · Functional requirements

> **DAK L2, functional requirements.** Each is testable, and each `realises`
> the user story. Each rule is stated here and nowhere else on this page.

| id | requirement |
|---|---|
| **FR-1** | An Initiator can reach every asset named here with no capability but opening a file. |
| **FR-2** | Exactly **one** process may be started: `initialize-harness`. `discussion` and `log-message` are called by its steps, never started. |
| **FR-3** | Only the Requestor chooses the harness. The Initiator may narrow the candidates, and may never break a tie. |
| **FR-4** | Every harness keeps its initialization instructions at `<name>/docs/bootstrap/initialization.md`, so a harness nobody has seen before is still reachable. |
| **FR-5** | A repository whose root already carries a `bootstrap.json` has been initialized. That is **logged and ended**, never redone: re-initializing over content, history and dependents cannot be undone by running anything again. |
| **FR-6** | Anything that does not resolve (a missing file, a harness with no instructions at the FR-4 path, a name that matches nothing) is **reported, and stops the process**. Nothing is worked around. |
| **FR-7** | This directory contains no executable code, so FR-1 cannot quietly stop being true. |
| **FR-8** | A successful install leaves a root `README.md` naming the harness and the overall install status. It is created when absent, and **never** replaces one that exists. |

---

## 5 · DAK onto the harness data model

Every DAK concept this page uses already has one home in the harness data
model:

| DAK (SMART) | bootstrap / harness | declared in |
|---|---|---|
| Generic **persona** | **Role**: a swimlane an actor acts in | [`scenarios/roles.json`](scenarios/roles.json), [`role-graph.ts`](../cat-harness/schemas/role-graph.ts) |
| **Actor** | **Actor**: a concrete participant, across processes | [`role-graph.ts`](../cat-harness/schemas/role-graph.ts) |
| **User scenario** | this page | [`dak-blocks.ts`](../cat-harness/schemas/dak-blocks.ts) `UserScenarioBlock` |
| **Business process** | the BPMN diagrams, lanes bound to roles | [`processes/`](processes), [`dak-blocks.ts`](../cat-harness/schemas/dak-blocks.ts) `BusinessProcessBlock` |
| **Functional requirement** | §4 | [`dak-blocks.ts`](../cat-harness/schemas/dak-blocks.ts) `FunctionalRequirementBlock` |
| **Core data element** | the fields of a harness declaration | [`cat-harness.ts`](../cat-harness/schemas/cat-harness.ts) |
| L1 → L2 → L3 traceability | `realises` on every DAK block | [`dak-blocks.ts`](../cat-harness/schemas/dak-blocks.ts) `DakBlockBase.realises` |

**The persona binding is an edge, not prose.** `UserScenarioBlock.personas`
holds role ids (required, one or more, declared `@ref RoleDef`), so *"which
scenarios involve the Requestor?"* is a query rather than a search. It is
deliberately not `uses[]`, which is the editorial relation (what a reader must
have read first); overloading it would corrupt every ordering metric computed
from it.

---

## 6 · Every asset in this harness

Every file here is one you read. A file nobody can reach from this page is one
nobody checks.

| asset | what it is |
|---|---|
| [`README.md`](README.md) | this page: the user scenario, and the entry point |
| [`AGENTS.md`](AGENTS.md) | the agent-generic pointer into this directory |
| [`bootstrap.json`](bootstrap.json) | this instance's declaration: its directories, and the graph kind each holds |
| [`processes/initialize-harness.bpmn`](processes/initialize-harness.bpmn) | the process you start |
| [`processes/discussion.bpmn`](processes/discussion.bpmn) | asking the Requestor what only they can answer |
| [`processes/log-message.bpmn`](processes/log-message.bpmn) | saying what you are doing |
| [`skills/bootstrap-kg-navigation.md`](skills/bootstrap-kg-navigation.md) | how to open anything here, assuming nothing |
| [`skills/confirm-harness.md`](skills/confirm-harness.md) | asking *which* harness |
| [`skills/discussion.md`](skills/discussion.md) | running the discussion process |
| [`skills/log-message.md`](skills/log-message.md) | running the log-message process |
| [`skills/root-readme.md`](skills/root-readme.md) | writing the root README, and why that write is allowed |
| [`skills/bootstrap-graph-emission.md`](skills/bootstrap-graph-emission.md), [`skills/bootstrap-graph-publication.md`](skills/bootstrap-graph-publication.md) | emitting and publishing this instance's own graph. bootstrap has no visualiser; its `.json`/`.jsonld` is how it shows it is a graph. The Tool that performs it is cat-harness's `kg-graph-export`. |
| [`skills/package-manifest.json`](skills/package-manifest.json) | the skills package declaration |
| [`schemas/discussion.input.schema.json`](schemas/discussion.input.schema.json), [`schemas/discussion.output.schema.json`](schemas/discussion.output.schema.json) | the question and the answer, as data. A conforming output document finishes step 3. |
| [`scenarios/roles.json`](scenarios/roles.json) | the four personas of §1 |

---

**Precise definitions:**
[harness declaration](../cat-harness/schemas/cat-harness.ts) ·
[skill](../cat-harness/schemas/skill-package.ts) ·
[role](../cat-harness/schemas/role-graph.ts) ·
[DAK blocks](../cat-harness/schemas/dak-blocks.ts) ·
[process](../cat-harness/processes) ·
[tool](../cat-harness/schemas/tool.ts).
Why bootstrapping is built this way:
[the proposal](../cat-harness/docs/proposals/bootstrap.md).
