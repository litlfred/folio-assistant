---
title: "The Beans store behind any Tool, and a state machine that starts any model's agent"
kind: proposal
issue: 991
bean: folio-assistant-bsd1
summary: >-
  How the WHO authoring harness keeps an AI agent's work plan in a store that
  any tool can back, starts an agent of any model (Claude, Gemini) on one step
  of a process with exactly the context that step needs, records every move,
  and lets the ITB test bed run the same work under controlled conditions —
  with the agent told it is working a tracked task, or not told at all — so
  models can be compared fairly for the WHO Assured AI benchmarks.
---

# The Beans store behind any Tool, and a state machine that starts any model's agent
{: .no_toc }

**Superseded for reading by [Testing AI agents fairly: the WHO Assured AI test harness](assured-ai-test-harness-2026-11-03.md)** (2026-11-03), which combines this proposal with the other one on the topic in plain language. This document stays unchanged below as the record of how its decisions were reached.

**Status (2026-11-03):** steps 1 to 5 built and merged, the visual pages and
local refresh in review; Q1 to Q7 ruled by the owner (§8). Issue
[#991](https://github.com/litlfred/cat-harness/issues/991) lists every pull
request.

1. TOC
{:toc}

---

## In brief

WHO is building **SMART Guidelines** content (guidance turned into
structured, computable, testable form) with AI agents doing part of the
authoring. To keep those agents accurate, every piece of work runs through a
**process diagram** (BPMN): each step belongs to a **role**, and an agent
taking that role is given only that step, with only the knowledge it needs.
The software that enforces this is the **harness**.

This proposal does four things:

1. **One work plan, any storage.** The list of work items (each one a
   **work item**) is kept by a store that offers a fixed set of operations (read,
   update, note, history, "where is this item in its process?"). Today the
   store is a git branch; tomorrow it can be a server or an MCP service.
   Nothing that uses the work plan needs to change when the storage does.
2. **The process starts the agent.** When a step is ready and its role is an
   AI agent, the harness starts an agent of a chosen model (Claude, Gemini
   through Antigravity, others) and hands it a **work order**: the item, the
   step, the role's skills. The work order is the same for every model.
3. **Everything is recorded.** Every change to an item, and every step it
   passes through, is kept as history. That history is also the **trace** a
   benchmark is scored on.
4. **Fair testing in the ITB.** The ITB test bed stands up a private copy of
   all of this per test run, starts several agents (possibly of different
   models), and checks what they did. A test can hand the agent its task as a
   tracked work item, or **hide that entirely**: the agent gets an ordinary
   prompt written from the item and works as it would in the real world, while
   the harness tracks the item behind the scenes (§4.9). Every run is set up
   from a saved **run profile** (which model, which knowledge sources, MCP or
   command line, which tools are on), so runs are comparable (§4.12).

---

## Terms used

| Term | Meaning here |
|---|---|
| **WHO Assured AI** | The WHO initiative defining how AI may be used, and tested, for turning health guidance into computable formats |
| **SMART Guidelines, L1–L5** | WHO's layers of a guideline: **L1** the narrative guideline; **L2** its digital adaptation (operational requirements); **L3** machine-readable, executable logic; **L4** and **L5** later layers (software and dynamic, verifiable clinical and public-health workflows) that will be built once the agents have robust guardrails |
| **folio**, **folio-assistant** | A folio is one body of authored content (a guideline, a paper). folio-assistant is the system that authors and publishes folios with AI help |
| **harness**, **cat-harness** | The part of folio-assistant that governs agents: processes, roles, skills, the work plan. *cat-harness* is its repository; *cat-harness-tools* holds the code that runs it |
| **BPMN process**, **diagram** | A standard flow-chart notation for work. Each process here is a diagram the harness can execute |
| **swimlane**, **lane** | A horizontal band in a diagram; every step in it is done by one **role** (a human author, a reviewer, an AI agent) |
| **step** (task), **gateway** | A box in the diagram (something to do) and a diamond (a decision) |
| **instance**, **token** | One run of a process for one piece of work, and the marker showing which step that run is at |
| **state machine**, **engine** | The harness code that moves tokens: it allows a step only when the diagram says it is next, and refuses an out-of-order one |
| **skill** | Written guidance (and sometimes a tool) for doing one kind of task; a role carries a set of skills |
| **Tool** (capital T) | A concrete way of doing something the harness needs, for example "keep the work plan on a git branch" or "start a Claude agent". Several Tools can do the same job; a deployment picks one |
| **MCP** | Model Context Protocol: a standard way for an AI agent to call tools and fetch data from a server |
| **knowledge graph** | The authored content and its links (L1, L2, L3 and the harness's own definitions), which agents read from instead of guessing |
| **work item** | One work item: a title, a status (`todo`, `in-progress`, `completed`…), a description and links to other items. Named after the `beans` tool that manages them |
| **work plan**, **Work items store** | All the work items, plus the process instances that track them |
| **deployment description** | A file saying how one installation is set up: where each actor runs, which Tools it uses, which credentials it is allowed (by name only) |
| **work order** | What an agent is handed when a step is ready: the work item, the step, the role's skills, how to report back |
| **launch Tool** | A Tool that starts an agent of one model, for example Claude through `beans-serve` or Gemini through Antigravity |
| **Route 0 / A / B** | The concept note's evaluation routes: **0** the bare model; **A** the model with skills; **B** the model with skills and the knowledge graph |
| **bean-aware / bean-blind** | Whether the agent is told it is working a tracked item (§4.9) |
| **ITB** | The Interoperability Test Bed, a test-orchestration service. It runs a test plan and reports the result |
| **Gherkin** | A plain-language test format: *Given* a situation, *When* something happens, *Then* this must hold |
| **DAK** | Digital Adaptation Kit: WHO's published L2 package for a guideline (documents, spreadsheets of data elements and decision logic), usually as PDF and Excel files |
| **FHIR implementation guide (IG)** | A published, versioned set of FHIR resources (the L3 computable form of a guideline), identified by its canonical URL and version |
| **run profile** | A named, saved set of test options (models, knowledge sources, tool access, tools on or off, route, context mode) that a test run uses, so every run with the same profile is set up the same way (§4.12) |
| **trace** | The ordered record of a run: every step reached or refused, every change to a work item, what the agent did |
| **Antigravity** (`agy`) | Google's agent environment through which Gemini is run |
| **`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `MEMORY.md`** | The instruction files an agent reads first. `CLAUDE.md` and `GEMINI.md` point at the shared `AGENTS.md`; `MEMORY.md` holds what a role should remember between sessions |

---

## 1. Why: the WHO Assured AI concept note

The concept note *Gemini Integration and Benchmarking Methodology for WHO
Assured AI* (2026-11-02) sets the purpose of this work.

**Its background.** WHO Assured AI is establishing how complex health
guidance becomes computable, structured and verifiable (L2, L3, L5), and how
large language models are to be **benchmarked** for high-stakes health work.
To keep the infrastructure model-agnostic, Gemini must be integrated deeply
enough to reach **usability parity** with the models already in use, and the
methods must be validated against Gemini's own reasoning and tool-calling.

**Its architecture**, which this proposal implements:

- **BPMN swimlanes as a guardrail.** Work is split into swimlanes; each task
  belongs to a role (human or AI) and is supported by skills with tooling or
  prompts behind them. An agent gets one specific, checkable task with
  bounded context, which structurally limits hallucination.
- **MCP servers** give agents their tools and precise data.
- **Layered knowledge graphs**: L1 foundations, L2 importing L1 for digital
  adaptation, L3 importing both for executable logic; L4 and L5 to follow
  once the guardrails are proven.
- **Central instructions, model-specific prompting.** Behaviour is defined
  once, but each model may need its own wording to stay on track. Claude
  already has such prompts in its workflow; replicating them for Gemini
  (`GEMINI.md`) needs dedicated testing.

**Its method.** Models are tested against WHO baselines and new projects
through three routes (Route 0 bare, Route A with skills, Route B with skills
and the knowledge graph), driven by **executable Gherkin test
specifications** through the BPMN harness, so that reasoning traces are
captured and models can be compared on a WHO-approved benchmark.

**Its asks** of Google: Cloud credits to run Antigravity at enterprise scale
for the benchmark pipelines; Gemini Ultra access for three engineers; and a
consultation with the Antigravity developer-experience team on replicating
guardrail prompts, on Gemini's use of the MCP servers and skills, and on
shaping outputs for the ITB.

**Its expected outcomes**: a native Gemini path through the harness, a
validated benchmarking method, and progress toward a WHO-approved standard
for testing LLM output in digital health.

What that requires of the harness, and where this proposal provides it:

| The concept note needs | What the harness must do | Section |
|---|---|---|
| Agents confined to one step with bounded context | The engine, not the agent, decides the step and hands over only that step's context | §4.4, §4.5 |
| Agents reach tools and data over MCP | The work plan reachable over MCP, not only through git commands an agent may not have | §4.2, §4.10 |
| Usability parity; guardrails that do not depend on one vendor's prompt file | A model-neutral work order; model-specific wording kept in the launch Tool, where a test can check it | §4.5 |
| Routes 0, A, B through Gherkin and the BPMN harness, with traces | One dispatcher that runs the same case under each route and records everything in one shape | §4.6, §4.7 |
| Outputs shaped for the ITB | The ITB drives each run through a small set of harness services and receives the trace | §4.8 |
| Behaviour comparable with real-world use | Runs where the agent is not told it is working a tracked item, or that it is being tested | §4.8, §4.9 |
| Models switched and compared on equal terms, with the same sources and tools | A standing test configuration: named run profiles for models, knowledge sources, MCP or command line, and which tools are on | §4.12 |

Two facts matter from the start. Each repository's `GEMINI.md` is a short
pointer to `AGENTS.md`, so today every model gets the same written guidance,
and anything Claude-specific lives outside the process. And the harness's
benchmark requirement already says **a benchmark never writes to the real
work plan**, so a run needs a store of its own (§4.7).

---

## 2. What the owner asked

Owner, 2026-11-02:

> we have a work item data store as part of our processes/skills/tools. i want to
> make sure documentation is complete. currently we are using github repo
> branch as one Tool. another Tool could be using the server (there is an mcp
> service for example) to manage work item state. can we make sure that process
> documentation is independent of Tool.
>
> we also have a bpmn state machine. i think that can use work items already as
> part of context for agents (if not it should be). the state machine should
> be able to start a agent (e.g. via API) and give a work item (which is tagged
> hopefully with process + task + etc.) that the agent is supposed to work on
> and also track process with (as they go through processes and tasks). we
> should be able to track the evolution of the work item over time.

> also in proposal doc, i want to integrate ITB as the testing tool for this.
> so it needs to spin up a bpmn state machine, a work item data store as part of
> test harness. then a testplan would be to start "agents A, B, C,... each
> with their bean sets S_A, S_B, ..." and see what end state is/monitor
> behaviour.
>
> we want agents to know as minimal as possible they are in a test
> environment. we use skills and memory.md to help set up consistent memory
> (based on needs for processes in test plan) across models. we layer all of
> them into a more singular KG (e.g. materialized within a git repo) as part
> of consistent context.

Owner, 2026-11-03:

> One of the ways that we want to be able to run an agent on a process is to
> use the work item context. However, as part of the testing scenarios, we should
> also include divorcing the content of the work item from the fact that it is a
> work item. In particular, we want to have test scenarios in which the agent is
> running without any knowledge of work items, as in a real world situation, but
> the prompting is fixed from the active work item being tested. In other words,
> the work item is the test context.

Owner, 2026-11-03, on the test configuration:

> each test run has a standard set of options of how it can be run. For
> example, the agent can be pointed to the full knowledge graph, published DAK
> resources, such as PDF and Excel files, GitHub repositories, published FHIR
> implementation guides, some combination or none of the above. The test
> harness should have consistent infrastructure and prompting for this.
>
> In amongst the scenarios, we want to be able to switch models, be able to
> choose whether we're using MCP services or only local CLI, determine which of
> the tools are turned on and available as skills for the agents or not. This
> needs to be a part of the standing test configuration.

The goals that follow:

| Goal | In plain words |
|---|---|
| **G1** | Process and skill text says *what* happens to the work plan, never *how one storage does it* |
| **G2** | An agent working a step is given its work item as context |
| **G3** | The harness can start an agent on a step and hand it the work item, tagged with its process and step |
| **G4** | A work item's history can be read whatever storage backs it |
| **G5** | The same process can be run by any model, under Route 0, A or B, leaving a trace that can be scored and compared |
| **G6** | The ITB runs these tests: a private harness per run, several agents with their own work items, the end state and behaviour checked, and agents unable to tell a test from real work |
| **G7** | A test can give the agent its task without the work item: a fixed prompt written from the work item, the agent unaware of work items, the work item still the test's context |
| **G8** | Every run is set up from a standing configuration: which model, which knowledge sources (the full knowledge graph, published DAK files, GitHub repositories, published FHIR implementation guides, any combination or none), MCP services or local command line only, and which tools (and so which skills) are on, with the same infrastructure and prompting whatever is chosen |

---

## 3. Where things stood (2026-11-02)

- **The store was already modelled as a role with Tools**, and its contract
  was written, but it was phrased in terms of git, and **nothing tested it**.
- **The process diagrams were already storage-neutral.** The skills were
  not: about 57 lines in 7 skills told agents to run git commands to change
  a work item.
- **The engine wrote work items one way only**: by running the `beans` command or
  editing the file directly. A server-backed store could not be used without
  changing the engine.
- **Agents got work item ids, not work items.** A step's context named its work items but
  did not carry their content, and nothing on a work item said which process or
  step it was at; the only way to place a work item was to read every instance.
- **Nothing in the harness started an agent.** `beans-serve` (a separate
  work items server) can already start a Claude agent per work item. Gemini through
  Antigravity, GitHub Copilot and local agents were all started by hand, with
  a prompt written for each model.
- **History lived only in git**, with no way to ask for it, and recording
  through processes had stopped in early October.

The detailed findings, with file names, are in Appendix A.

---

## 4. Design

### 4.1 The work plan is a set of operations

Every Tool that keeps the work plan provides the same operations, each with a
guarantee a test can check:

| Operation | What a caller can rely on |
|---|---|
| `get(id)` | the work item as last written, or "none" |
| `list(filter)` | work items by status, type, tag or parent |
| `create(bean)` | the id is unique |
| `update(id, change, ifMatch)` | refused if someone else changed the work item since you read it (`ifMatch` is the version you read); a retry on the fresh version lands, so **no concurrent change is ever lost** |
| `note(id, text, by)` | added to the work item's notes, never rewriting earlier ones |
| `history(id)` | every change, oldest first: when, by whom, what, and from which process step |
| `positions(id)`, `beansAt(process, step)` | where a work item is in its processes, and which work items are at a step (§4.4) |

**Archiving** is a field set through `update`, not a separate operation
(ruled, Q7): it is refused unless the work item is completed or scrapped, and an
archived work item can still be read.

**One conformance test suite** checks every Tool against these guarantees.
*Built: the contract (cat-harness#993), the tests (cat-harness-tools#1418).*

### 4.2 Tools behind the work plan

| Tool | Kept where | Status |
|---|---|---|
| git state branch | a git branch per work plan, read and written with the `beans` command or by editing files | today's storage; has its own page |
| work items server | `beans-serve`, which already offers versioned updates | proposed |
| MCP service | an MCP server offering the operations as tools to any agent | proposed (§4.10) |
| run-scoped store | a private store for one test run (§4.7) | proposed |

The git commands now in the skills move to the git Tool's page; each skill
says the operation ("note the bean", "claim it"). A check refuses git terms
in work-plan skills outside a Tool page.

### 4.3 The engine uses the operations

The engine reads and writes work items only through the operations, so the Tool
can change without touching it. **Which Tool** is named in the deployment
description (ruled, Q2), for example `"stores": { "work-plan":
"beans-git-branch" }`; a checkout says which description is its own with the
`CAT_DEPLOYMENT` environment variable, and without it uses the git branch as
today. A description naming a Tool the toolset does not have is refused,
never silently replaced by the real work plan. *Built (cat-harness-tools#1420,
#1424; cat-harness#1005 names the store in every deployment).*

### 4.4 Where a bean is, and what the agent is given

A work item's position lives **only in the process instances** that name it
(ruled, Q1): there is one source of truth and nothing to keep in step.
`positions(id)` and `beansAt(process, step)` read the instances, including
the sub-processes an instance calls. *Built (cat-harness-tools#1421).*

When the engine reports what step is ready, each step's context now carries
its work items themselves (title, status, description, links, position), not only
their ids. *Built (cat-harness-tools#1423).*

### 4.5 The process starts the agent

A shared step, **Dispatch agent**, is added to the diagrams. When a ready
step's lane belongs to an AI role, the engine hands a **work order** to a
launch Tool:

| Work order field | From |
|---|---|
| the work item | `get` and `positions` |
| the instance and step | the token |
| role, skills, conventions | the step's context |
| the store | which Tool to use and how to reach it |
| how to report | "when done, complete this step of this instance" |

The work order is **the same for every model**: plain data and the skill
texts. How a particular model is best told to stay on the step is the launch
Tool's job, written on that Tool's page and tested, so parity between models
is checked by a test instead of depending on someone copying a prompt into
`GEMINI.md`.

| Launch Tool | Model | Today |
|---|---|---|
| `launch-beans-serve` | Claude, through the work items server | exists; **first** (ruled, Q3) |
| `launch-claude-session` | Claude, cloud session or routine | API exists, no Tool yet |
| `launch-antigravity` | Gemini through Antigravity, on the project the concept note requests | prompts written by hand today |
| `launch-copilot` | GitHub Copilot | API exists, no Tool yet |
| `launch-local` | any command-line agent | no |

The agent reports by completing its step; that moves the token, writes the
instance history and notes the work item, so the position and history stay current
without anyone remembering to update them.

### 4.6 History: one event log

Every change is an **event**: created, status changed, claimed, noted,
changed, archived, step reached, each with when, who and what, and for a
process step the instance and step. `history(id)` returns them in order. For
the git Tool the events are derived from the git history of the work item plus the
instances' own histories, so nothing is migrated (ruled, Q4); a server Tool
would keep them as rows. *Built (cat-harness-tools#1425).*

Each work item's page shows this history with a stepper (buttons and keyboard),
drawing the process the work item was in at each moment. *In review
(cat-harness-tools#1426).*

### 4.7 Benchmark runs: route, private store, trace

A benchmark run is the same dispatch with a few settings, not a new runner:

| Setting | Values |
|---|---|
| system under test | model + launch Tool + its configuration |
| route | **0** the task text only: no skills, no knowledge graph · **A** skills, knowledge-graph tools withheld · **B** skills and the knowledge graph |
| context mode | **bean-aware** or **bean-blind** (§4.9) |
| sources and tools | the run profile (§4.12): knowledge sources, MCP or command line, which Tools are on |
| store | a **run-scoped store**: private to the run, seeded from the test case, thrown away after (ruled, Q5) |

- **A test case** becomes seeded work items and started instances in the run's
  store: *Given* seeds, *When* dispatches, *Then* checks the store and the
  instances afterwards.
- **The trace** is the run's history, its instance histories and every step
  the engine refused, in the same shape whatever the model. That is the
  reasoning trace the concept note wants handed to the ITB, and the count of
  refused steps becomes a metric of every run.
- **Results** are written to the benchmark output area, never into the
  authored content.

### 4.8 The ITB runs the test

The ITB drives each run (ruled, Q6), using Gherkin test plans as already
agreed in [the ITB proposal](test-interop-itb-fhir-testplan-2026-10-24.md).
The harness offers it a few services, so a test step is a call, not a script:

| Service | Does |
|---|---|
| `harness-up` | creates one private harness: a state machine, a run-scoped store and the run's context (below) |
| `seed` | writes work items and started instances into it |
| `start-agents` | starts each agent through its launch Tool, with its model, route, context mode and work items |
| `observe` | streams events while the run goes on |
| `state` | the store and instances at a moment, for *Then* to check |
| `harness-down` | exports the trace and removes the private store |

A test plan reads like a description of work:

```gherkin
Feature: two agents share a merge window
  Background:
    Given a harness with processes "code-change-review" and "merge-train"
    And the context "folio-assistant@<hash>"
  Scenario: A opens changes, B lands them
    Given agent A (gemini, route B, bean-aware) holds beans S_A = {a1, a2}
    And agent B (claude, route B, bean-aware) holds beans S_B = {b1}
    When the agents are started
    Then within 2 hours every bean in S_A is completed
    And bean b1 is at "merge-train" step "End_Landed"
    And no instance recorded a refused step
```

The ITB keeps its role of running the plan and judging the result; the
result comes back in the ITB's own report format.

**Agents should not know they are in a test.** What an agent sees is what it
would see in real work: the same work order, operations and skills; work items
written as real work, never labelled as tests; the run's identity (plan,
route, model) kept in the harness, never shown to the agent. What cannot be
hidden (a fresh store, a short repository history) is listed on the test plan
so a result can be read with it in mind.

**One consistent context.** Each run gets one repository built in layers, the
same for every model in the run:

| Layer | From |
|---|---|
| knowledge graph | the L1, L2, L3 content and harness definitions the processes need, at pinned versions |
| skills | the skills the plan's processes use |
| memory | a `MEMORY.md` per role, generated for the plan's processes, so every model starts with the same memories |
| instruction files | `AGENTS.md`, with `CLAUDE.md` and `GEMINI.md` pointing to it, so no model gets guidance the others lack |

The repository is identified by its commit hash, named in the plan's
*Background*: two runs with the same hash gave their agents the same world.
Route 0 gets an empty context; Route A skills and memory without the
knowledge graph; Route B all of it.

### 4.9 Bean-aware and bean-blind runs

Owner, 2026-11-03: *"the bean is the test context."*

A run hands an agent its task in one of two ways. Both are measured against
the same work item.

| | **Bean-aware** | **Bean-blind** |
|---|---|---|
| What the agent receives | the work order (§4.5): the work item, its step, the store, how to report | **one fixed prompt**, written from the work item |
| What the agent knows | that it is working a tracked item in a process | only the task, as a person would phrase it in real work |
| Who records progress | the agent, by completing its step | the harness, observing what the agent produced |
| What it measures | how well a model works *inside* the harness | how a model behaves on the same task *without* the harness telling it anything: the real-world case |

**The fixed prompt.** For a bean-blind run, the work item under test is turned
into a prompt by a fixed, reviewed template: the task (from the title and
description), the acceptance criteria, the material to work on. It contains
no work item id, no store, no process or step names and no harness vocabulary; a
check refuses a prompt that leaks any of them. The prompt is generated once,
stored with the test case and identified by its hash, so **every model gets
exactly the same words**, and a re-run is reproducible.

**The work item is the test context.** The work item still exists, in the run's private
store, and is what the test is scored against: its acceptance criteria are
the *Then*. The harness plays the agent's part in the process: it watches what
the agent produces (files, answers, a change), moves the instance and notes
the work item on the agent's behalf, so the run leaves the same trace as a
bean-aware run. The agent's own transcript is kept as its reasoning trace.

**With the routes**, this gives a small grid to compare models in:

| | Bean-aware | Bean-blind |
|---|---|---|
| **Route 0** (bare model) | — (no work order without skills) | the bare model on the task: the baseline |
| **Route A** (skills) | skills and the work order | skills available, task in plain words |
| **Route B** (skills + knowledge graph) | the full harness | the full knowledge, no harness framing |

The gap between a bean-aware and a bean-blind run of the same model and route
measures what the process harness itself contributes, which is the guardrail
claim the concept note makes.

In a test plan:

```gherkin
Scenario: the same task, told and untold
  Given bean g7 "Encode the ANC contact schedule as decision logic"
  And agent G1 (gemini, route B, bean-aware) holds bean g7
  And agent G2 (gemini, route B, bean-blind) is given the prompt of bean g7
  When the agents are started
  Then both outputs meet the acceptance criteria of bean g7
  And the trace of G2 shows no harness vocabulary in its prompt
```

### 4.10 A live work plan on your own machine

Owner, 2026-11-03: *"5 sec refresh is local mcp bean store. on ghpages,
refresh makes no sense."*

The published site (GitHub Pages) shows the work plan as it was when the site
was built; it cannot reach a store server. A store server can only be reached
on the machine that runs it (`localhost`). A hosted server (for example on
Hetzner) would change that, but there is none, so it is out of scope.

The local setup:

1. Run the harness server in the checkout:
   `CAT_DEPLOYMENT=developer bun run cat-harness-tools/src/server.ts`.
2. Open the beans-by-process page from the same machine. It offers
   "Refresh every 5 s from the local bean store" and shows what the store
   holds now, through whichever Tool the deployment names. On GitHub Pages
   the control does not appear.
3. If no server answers, the page says so and keeps what it was built with;
   it never shows an empty plan because a request failed.

The route it reads (`GET /api/work-plan/beans-processed`) answers only on
`localhost`, is read-only, and allows cross-site reads from `localhost` pages
only. The proposed **MCP service** (§4.2) would sit on the same server,
offering the operations to agents. *In review (cat-harness-tools#1429).*

### 4.11 Configuring a run: models, the ITB, the deployment

Each setting has one home:

| Setting | Home | Example |
|---|---|---|
| which deployment this machine is | `CAT_DEPLOYMENT` | `itb-benchmark` |
| which store keeps the work plan | the deployment's `stores` | `{ "work-plan": "beans-run-scoped" }` |
| which actors exist and where they run | the deployment's `placements` | `{ "actor": "agent-gemini", "compute": "vendor-cloud" }` |
| which model an agent is, and how it is started | the placement's **`launch`** (proposed, Q8) | `{ "tool": "launch-antigravity", "model": "gemini-<version>" }` |
| credentials | the placement's `credentials`, by the secret's **name** only, never its value | `{ "model-api": "GCP_WIF_ASSURED_AI" }` |
| what is tested, with which work items per agent | the ITB test plan | `Given agent A (gemini, route B, bean-blind) …` |
| the agents' world | the context hash in the plan's *Background* | `Given the context "folio-assistant@<hash>"` |
| knowledge sources, tool access, Tools on, route and context mode | the **run profile** the plan names (§4.12) | `Given the run profile "route-B-dak"` |

A test plan names **agents**, never models: changing a model is a one-line
change to the deployment, and the same plan then compares models fairly.

A sketch of a benchmark deployment with Claude and Gemini:

```json
{
  "id": "itb-benchmark",
  "title": "ITB benchmark run: Claude and Gemini on one plan",
  "modes": ["test"],
  "stores": { "work-plan": "beans-run-scoped" },
  "placements": [
    { "actor": "agent-claude", "host": "local", "compute": "workstation", "toolSurface": "mcp",
      "launch": { "tool": "launch-beans-serve", "model": "claude-<version>" } },
    { "actor": "agent-gemini", "host": "vendor-cloud", "compute": "vendor-cloud", "toolSurface": "mcp",
      "modelProvenance": "hosted",
      "launch": { "tool": "launch-antigravity", "model": "gemini-<version>" },
      "credentials": { "model-api": "GCP_WIF_ASSURED_AI" } }
  ],
  "liveData": "artefacts-only"
}
```

A run, end to end:

1. `CAT_DEPLOYMENT=itb-benchmark` is set where the harness runs.
2. The ITB calls `harness-up`: a state machine, a run-scoped store (because
   `stores` says so) and the pinned context.
3. The plan's *Given* steps call `seed`, and for bean-blind agents the fixed
   prompts are generated and pinned.
4. *When the agents are started* calls `start-agents`: each agent's `launch`
   names its Tool and model; bean-aware agents get the work order, bean-blind
   agents their prompt.
5. The agents work; `observe` streams the events. On `localhost` the
   beans-by-process page shows the run live (§4.10).
6. *Then* steps check `state`; `harness-down` exports the trace and removes
   the store. The ITB reports the result.

From outside the harness, each model needs what the deployment names and
whoever runs it supplies: for Claude, the `claude` command and its login; for
Gemini, the Google Cloud project and identity the concept note requests,
reached through Antigravity.

---

### 4.12 The standing test configuration: run profiles

Every test run is set up from a **run profile**: a named, saved file listing
the options below. A test plan names the profile it uses; it never sets these
options in its own text. Two runs with the same profile (and the same pinned
context, §4.8) were set up identically, whatever model ran.

| Option | Choices | What the harness does with it |
|---|---|---|
| **Models** | which model each agent actor runs, through its launch Tool (§4.11) | starts each agent through that launch Tool; switching a model changes this line only |
| **Knowledge sources**, any combination or none | the **knowledge graph** (all of it, or chosen layers L1, L2, L3); **published DAK files** (PDF, Excel); **GitHub repositories**; **published FHIR implementation guides** | puts exactly those sources into the run's context repository (below), each pinned to a version, and nothing else |
| **Tool access** | **MCP** services, **local command line** only, or **both** | starts the harness's MCP server for the run, or puts the command-line Tools on the agent's path, or both |
| **Tools on or off** | a list of Tools that are on; every other Tool is off | an agent can call only the Tools that are on. A skill whose Tools are all off is not offered to the agent at all, so no agent is told about something it cannot use |
| **Route** | 0, A, B | a shorthand for a combination of the rows above (below) |
| **Context mode** | bean-aware or bean-blind (§4.9) | decides whether the agent gets the work order or the fixed prompt |

**The routes are profiles.** Route 0, A and B are not separate machinery; they
are three standard profiles, and any other combination is a profile too:

| Profile | Knowledge sources | Tools on | Skills offered |
|---|---|---|---|
| `route-0` | none | none | none |
| `route-A` | none | the authoring Tools | the authoring skills |
| `route-B` | the knowledge graph | the authoring Tools and the knowledge-graph Tools | the authoring skills and the knowledge-graph skills |
| `route-B-dak` *(example)* | the knowledge graph and the published DAK files | as `route-B` | as `route-B` |
| `docs-only` *(example)* | published DAK files and FHIR implementation guides, no knowledge graph | file reading only | none |

**Consistent infrastructure.** Whatever the profile, a run is built the same
way, in the same order:

1. **The context repository** (§4.8) is assembled from the profile's
   knowledge sources: knowledge-graph layers at their pinned versions; DAK
   files downloaded once and pinned by their checksum; GitHub repositories
   at a pinned commit; FHIR implementation guides as their published package
   at a pinned version. The repository's commit hash identifies the whole
   context.
2. **Tools**: the run's MCP server (when the profile says MCP) is started
   offering only the Tools that are on; the command-line wrappers (when it
   says command line) are installed for only those Tools. A Tool that is off
   is simply not there; the agent is not told it exists.
3. **Skills**: only skills backed by a Tool that is on (or needing no Tool)
   are copied into the context.
4. **Instruction files** (`AGENTS.md`, with `CLAUDE.md` and `GEMINI.md`
   pointing to it) and `MEMORY.md` are generated from the profile, so every
   model reads the same text.

**Consistent prompting.** The prompt an agent receives comes from one
template per context mode, filled from the profile. It says, in the same
words for every model, what the agent has to work with ("you have the
following documents… you can use the following tools…") and nothing about
sources or Tools that are off. A check compares the prompts the run gave each
agent: for the same profile they must be identical apart from the model's own
launch wording (§4.5), which is kept on the launch Tool's page and reviewed.

**Where the configuration lives, and who reads it:**

| What | Where |
|---|---|
| where agents run, which store, which credentials | the deployment description (§4.11) |
| what a run is allowed to see and use | the **run profile** |
| what is tested | the ITB test plan, which names a profile |

In a test plan:

```gherkin
Scenario Outline: the same task under each profile and model
  Given the run profile "<profile>"
  And agent A (<model>, bean-blind) is given the prompt of bean g7
  When the agents are started
  Then the output meets the acceptance criteria of bean g7

  Examples:
    | profile     | model  |
    | route-0     | claude |
    | route-0     | gemini |
    | route-B     | claude |
    | route-B     | gemini |
    | route-B-dak | claude |
    | route-B-dak | gemini |
```

One plan then sweeps models and profiles, and every row runs on identical
infrastructure; only the line that varies differs.

A sketch of a profile file:

```json
{
  "id": "route-B-dak",
  "title": "Knowledge graph and published DAK files, MCP tools",
  "knowledgeSources": {
    "knowledgeGraph": { "layers": ["L1", "L2", "L3"] },
    "dak": [{ "title": "ANC DAK", "files": ["anc-dak.pdf", "anc-data-dictionary.xlsx"], "sha256": ["…", "…"] }],
    "githubRepositories": [],
    "fhirImplementationGuides": []
  },
  "toolAccess": "mcp",
  "tools": ["kg-search", "kg-read", "skill-fetch", "workflow-next", "workflow-complete"],
  "route": "B",
  "contextMode": "bean-blind"
}
```

### 4.13 Work context, and beans out of the content layers

Owner, 2026-11-03: *"the beans stay out of the smart base dependency tree …
the knowledge graphs for the smart guidelines should not have any reference to
beans in it. Otherwise it pollutes the testing run because the agent will then
learn about beans and processes"*; *"when an agent takes up / processes /
completes a task it should preserve memory/context. one Tool is a bean"*; *"so
we remove beans from explicit in most diagrams, make sdlc a subgraph and clean
up it and dependent harness use of beans"*.

**Where work items reach a content layer today** (review of 2026-11-03):

- Through the dependency chain: smart-base → fhir-harness →
  folio-assistant-core → cat-harness. smart-base mounts cat-harness whole, and
  its instruction file tells the agent to read the cat-harness skills.
- Through the diagrams. `Process_BeanOpen` and `Process_BeanClose` sit in
  `processes/sdlc/`, a folder of the one `processes` graph rather than a
  sub-graph, and are called by 15 cat-harness diagrams (7 of them outside
  `sdlc/`: kg, library, process, global tasks), by 8 fhir-harness diagrams and
  by 4 smart-base diagrams, including the DAK diagram
  `diig-investment-path.bpmn`. cat-harness's diagrams also carry 115 task-level
  `op="note"` steps.
- Through the MCP server, which offers every Tool in the chain, and the skill
  scan, which reads every sibling folder.
- Through prose: about 200 of 265 cat-harness skill files say "bean", many
  only as a provenance id ("bean `kg83`").

The work item **data** does not leak: it is on its own branch. The **words** do.

**A work item is tied to a process instance, not to a task.** An instance names
its work item (`bean`, `carriedBeans`), and every sub-process it calls inherits it.
Tasks only act on it: the `op` steps, a data output to the Work items store
(Q-BR-8 F), and a call activity naming extra work items.

**Work context: what replaces the markup** (ruled, Q11: all three):

1. **The engine**, at every task boundary and with no markup in the diagram:
   - on *take up*, it hands the agent what was kept from earlier work on the
     same item;
   - on *complete*, it stores the agent's completion summary, links and what
     is left open;
   - at the instance's start and end, it does what `Process_BeanOpen` and
     `Process_BeanClose` did: claim, resolve, archive.
2. **A neutral data store**: a diagram may mark a task that must read or
   write the context explicitly with a standard BPMN data store named
   *Work context*. The engine binds it to the chosen Tool.
3. **The agent** may record context during a task through a neutral MCP tool,
   `work_context_note`.

All three write to one **work-context store**, a role like the work plan
(§4.1), whose Tool the deployment or run profile chooses (§4.12):

| `stores["work-context"]` | Used by |
|---|---|
| `work-plan` (default): a work item in the work-plan store, with each line's metadata wrapped by the server | folio-assistant development and bean-aware runs (the real store); bean-blind test runs (the run-scoped store, Q5): the context is kept and measured, and the agent never learns it is a work item |
| `none` | a run that tests a cold start |

Owner, 2026-11-03: *"the neutral work_context_note is in reality a bean with
metadata wrapped in the backend (just not exposed to agent)"*. So
`work_context_note` is **its own Tool**, registered apart from the
`workflow_*` tools and outside the `sdlc` sub-graph: an agent that is offered
it sees a neutral name, description and one input, never the workflow tools
it would otherwise reach through the dependency tree. The run's launcher binds
the session to its instance (`CAT_WORK_INSTANCE`); the agent never sees an
instance or item id. *Built (cat-harness-tools#1435).*

This is separate from `agent-memory`, which assembles each agent's long-lived
memory file; work context belongs to one item and one run.

**Two switches, not one.** The harness's own machinery (store, engine,
trace) stays on in a test run, because the work item is the test's context. What
the **agent** is given (skills, knowledge graph, Tool list, instruction files,
prompt) follows the run profile. A sub-graph that is switched off removes the
material from the agent's context; it does not stop the harness using it.

**`sdlc` becomes a named sub-graph of cat-harness** (ruled, Q12), on the
pattern of `openapi/` and `archimate/`: one folder whose `graph.json` declares
what it holds — the `sdlc` skills, the `sdlc` processes, the work-plan and
work-context typologies, and the work item and workflow Tool definitions. It is
off by default in every layer above cat-harness; folio-assistant switches it
on. The MCP registrar and the skill scan honour the switch, and a whole-mount
does not override it.

**Clean-up** (ruled, Q13):

- No work item markup in diagrams outside the `sdlc` sub-graph: no calls to
  `Process_BeanOpen`/`Process_BeanClose`, no `op` steps, no Beans-store data
  outputs. The engine does that work (above). This covers cat-harness,
  fhir-harness and smart-base.
- Provenance ids move out of agent-facing text (into the node's provenance
  fields or the changelog).
- Generic skills say *work context* and the operation, never "bean".
- The instruction files are generated from the run profile.
- Development checkouts keep work items on; every content layer's knowledge graph
  and every agent test context has them off.

**The leak check, `check:context-leak`.** The runner is generic, in
cat-harness-tools; the vocabulary is a code list the `sdlc` sub-graph
declares. It scans a built context — every file, the live MCP tool list, the
generated instruction files and the fixed prompt — and, in each content
layer's CI, that layer's bean-blind context. It matches *work item*, the
provenance-id pattern, `beans/`, the work items branch name, *work plan*,
*work order*, the `workflow_*` and work-plan tool ids, `Process_Bean*` and
`cat-harness.processes:bean`. It does **not** match *process*, *BPMN* or
*business process*: DAKs hold business processes as content. "Could not
determine" is never clean. It starts in report mode and becomes a gate once
the clean-up lands.

### 4.14 The memory store: drawn only where a process needs it

Owner, 2026-11-03: *"We need the memory store in the diagrams, only if a
process explicitly requires it. For example, if an agent knows that it is
shutting down and wants to write a record of where it's at. Or if an agent
wants to create a shared memory store as part of a swarm that they can
collectively access. It may be that it gets implemented as a tool as beans.
There may be other tools. We use beans as a tool in SDLC. We also use it as a
tool for the same type of agentic memory in collaborative agent-assisted
content development."*

So the work context of §4.13 is one use of a more general Role, the **memory
store**:

- **A Role, not a Tool.** Like the work plan (§4.1), it is a set of
  operations — *keep* an entry, *recall* entries, *checkpoint* where the work
  stands — over a **scope**: one item, one run, or one shared space a group
  of agents opens together. Work items are one Tool for it; a run-scoped store, a
  plain file store or a server are others. The deployment or run profile
  picks the Tool (`stores["memory"]`).
- **Drawn only where a process needs it.** A diagram draws a standard BPMN
  data store whose `dataStoreRef` is `memory` only where the process itself
  depends on memory:
  - **Checkpoint before stopping:** a task such as *Record where the work
    stands* writes to it before an agent shuts down or hands over, and the
    task that resumes reads from it.
  - **Shared memory for a swarm:** a task such as *Open a shared memory
    space* creates a scope that the agents of a parallel or multi-instance
    step all read and write; writes carry the version they read
    (`ifMatch`), so two agents never overwrite each other silently.
  - **Hand-over between lanes:** a task in one lane writes what the next
    lane needs to know.
  No diagram draws it as routine bookkeeping. What every process needs (who
  took the work, when it finished) the engine keeps without a drawing (§4.13).
- **The agent's side is neutral.** The MCP tools (`memory_note`,
  `memory_recall`, `memory_checkpoint`) and their skill name no Tool. The
  backend wraps each entry with its metadata (process, step, instance, agent,
  time). It is its own Tool group, so a bean-blind agent can be offered it.
- **Two kinds of work use work items for it today**, and both keep them:
  software development (`sdlc`) and collaborative, agent-assisted content
  development (folio-assistant). So the work item Tool is **not** inside `sdlc`:
  it is its own sub-graph, `beans`, which `sdlc` and folio-assistant both
  switch on. The memory store Role, its data store, its tools and its skill
  sit in cat-harness itself, outside both, so a content layer's diagram (a
  DAK authoring process, say) can draw a memory store without naming work items.

**A work item is a memory record with more structure** (owner, 2026-11-03:
*"bean is a memory note w/ additional structure for process/role/ etc... can
we formalize this a bit more in schema to show this and align a bit the
services"*; ruled Q17, layered):

| Layer | Schema | Store interface | What it adds |
|---|---|---|---|
| memory record | `memory-record` (new base) | `MemoryStore`: keep, recall, checkpoint, list by scope | id, title, scope (item, run, shared), `about`, tags, timestamps, and **structured entries**: each with text, when, who, kind (note, step done, checkpoint, taken up, closed) and, when the engine knows them, process, step, instance and role |
| work item | `bean-defs` extends `memory-record` | `WorkPlanStore` extends `MemoryStore`: create, update with `ifMatch`, relations, positions, beansAt | status lifecycle, type, priority, parent and blocking |

So the memory service and the work item service are **one service**: a memory
note is a work item note without the work-item fields, and the process and role
are entry metadata the backend fills in. The work items Tool implements both
layers and keeps entries in the work item body as lines it can parse back (the
conformance tests check the round trip, so existing work items stay valid); a
file store implements only `MemoryStore`. The curated agent memory (the
`memory` kind, "never written by a process") stays separate.

**The ITB chooses the memory Tool**, and the test scenarios include (owner,
2026-11-03: *"the test scenarios should include cases where agent is offered
no memory store vs when it is offered beans as a Tool and the SDLC type
processes"*):

| Scenario | The agent is offered | Behind it |
|---|---|---|
| no memory | no memory tools | nothing kept for the agent; the harness still records the run |
| memory, neutral | `memory_note`, `memory_recall`, `memory_checkpoint` | work items (run-scoped) or the file store, chosen by the run profile |
| work items and SDLC | the work item Tools and the `sdlc` processes and skills | the run-scoped work items store, bean-aware (§4.9) |

Each is a run profile (§4.12), so the same case runs under all three and the
ITB compares them.

## 5. Order of work

| Step | Work | Status |
|---|---|---|
| 1 | The contract as operations; the git Tool's own page (§4.1, §4.2) | merged (cat-harness#993) |
| 2 | Conformance tests, run against the git Tool | merged (cat-harness-tools#1418) |
| 3 | The engine uses the operations (§4.3) | merged (#1420) |
| 4 | Where a work item is; the work item in each step's context (§4.4) | merged (#1421, #1423) |
| 4c | The deployment names the store (§4.3) | merged (#1424); deployments updated in cat-harness#1005 |
| 5 | History and its event model (§4.6) | merged (#1425) |
| 5b | The history stepper on each work item's page; open/closed filter; all stores on one page | in review (#1426, #1428, #1432) |
| 6 | Skills say the operation, not the git command; a check keeps it so | in review (cat-harness#1010) |
| 7 | *Dispatch agent* and the first launch Tool, `launch-beans-serve` (§4.5) | |
| 8 | A server Tool passes the same conformance tests | |
| 9 | Run-scoped store; route and context-mode settings; a test case becomes seeded work items and instances (§4.7) | |
| 9b | Bean-blind runs: the fixed-prompt template, the leak check, the harness recording on the agent's behalf (§4.9) | |
| 10 | `launch-antigravity`; the same cases under Routes 0, A, B for Claude and Gemini; traces exported for the ITB | |
| 11 | The context builder: one pinned repository per run (§4.8) | |
| 12 | The ITB services and the Gherkin steps that call them; the first multi-agent plan | |
| 13 | The live local refresh (§4.10) | in review (#1429) |
| 14 | `launch` on a placement (§4.11), once Q8 is ruled; the `itb-benchmark` deployment | |
| 15 | Run profiles (§4.12): the file format and the standard profiles (`route-0`, `route-A`, `route-B`); the context builder reads knowledge sources from a profile (DAK files, GitHub repositories, FHIR implementation guides pinned); MCP or command-line Tools started with only the Tools that are on; skills and instruction files filtered to match; the prompt-equality check | |
| 16 | The engine keeps work context at every task boundary; open and close done by the engine; `work_context_note` as its own Tool (§4.13) | merged (cat-harness-tools#1435; Tool nodes cat-harness#1010 in review) |
| 17 | Work item markup out of the cat-harness diagrams outside `sdlc` (§4.13) | merged (cat-harness#1011, cat-harness-tools#1436) |
| 18 | The `memory-record` base schema with structured entries, `bean-defs` extending it; `MemoryStore` (keep, recall, checkpoint over item, run and shared scopes) with `WorkPlanStore` extending it; the work item Tool for both; conformance tests for both layers; `stores["memory"]` (§4.14, Q17) | merged (cat-harness-tools#1437) |
| 19 | The engine binds a drawn `memory` data store: a task that reads it is handed the recalled entries, a task that writes it keeps its output; shared scopes for a swarm with `ifMatch` | merged (cat-harness-tools#1438) |
| 20 | Neutral tools `memory_note`, `memory_recall`, `memory_checkpoint`, and their skill; `work_context_note` folded in | merged (cat-harness-tools#1438) |
| 21 | A second memory Tool (a run-scoped file store) passes the same conformance tests, so the Role is proven Tool-neutral | merged (cat-harness-tools#1439) |
| 22 | `check:context-leak` in report mode; `check:bean-calls` retired; `bpmn-authoring` teaches the memory store patterns instead of work item open and close | in review (cat-harness-tools#1440) |
| 23 | Two named sub-graph folders of cat-harness, on the pattern of `openapi/` (Q18): `sdlc/` (the development processes and skills) and `work-plan/` (the work item Tool, its skills, the work item and workflow Tool definitions, the work-plan store skills). 23.1 the opt-in switch: a sub-graph marked `optIn`, a layer's `enableSubgraphs`, the development override; honoured by the directory resolver, the skill scan, the tool server and the mount plan. 23.2 the move, a clean break (no redirects). 23.3 the tools layer's paths and tests. 23.4 folio-assistant enables both; development-session hooks. 23.5 the leak check over a smart-base bean-blind context | in progress |
| 24 | fhir-harness and smart-base: work item markup out of their diagrams; their instruction files generated; the leak check a gate in their CI | |
| 25 | Provenance ids out of agent-facing skill text across the layers | |
| 26 | folio-assistant's content-development processes draw the memory store where they need it (checkpoint, shared space) | |
| 27 | Run profiles for the three memory scenarios (none, neutral memory, work items and SDLC), the memory Tool chosen per run, so the ITB compares them on the same cases | |

Steps 1 to 6 change nothing for anyone using the git branch today. Steps 9,
10 and 12 are what the concept note's cloud credits and model access would
pay for; steps 1 to 8 come first and need neither.

---

## 6. Keeping the process recorded

A work item's place in its process is only as good as the habit of recording it,
and nothing can force that: anyone can edit the work-plan branch directly.
So (owner, 2026-11-03) the recorded path is made the easy one, and drift is
reported, never blocked:

- **Claiming or creating a work item starts its process.** The claim command
  starts or advances the work item's process instance.
- **Agents get the work item with its step** (§4.4), and completing the step
  records the move (§4.5).
- **Drift is reported**: an in-progress work item that no running instance names
  is flagged on the beans-by-process pages, in the repository health report
  and when a session starts.
- **The skills say so**: working a work item means starting or advancing its
  instance.

---

## 7. What this does not do

- It does not move work items off the git branch; the git Tool stays the default.
- It does not change what the diagrams mean.
- It does not decide what an agent works on: dispatch starts an agent only on
  a step the process has already made ready.
- It does not replace the ITB proposal's test-plan and result formats; it
  adds the services a plan needs to test agents working through processes.

---

## 8. Decisions

| | Question | Decision |
|---|---|---|
| Q1 | Where does a work item's position live? | **Only in the process instances**, read through store operations (2026-11-02) |
| Q2 | How is the store Tool chosen? | **By the deployment description** (2026-11-02); a checkout names its own with `CAT_DEPLOYMENT` |
| Q3 | First launch Tool? | **`launch-beans-serve`** (2026-11-02) |
| Q4 | Where does the git Tool's history come from? | **Derived from git history plus instance histories**, nothing migrated (2026-11-02) |
| Q5 | Where does a benchmark run keep its work items? | **A run-scoped store** (2026-11-02) |
| Q6 | Who drives a test run? | **The ITB**, calling the harness services (2026-11-02) |
| Q7 | How is archiving expressed? | **A field set through `update`** (2026-11-02) |
| Q8 | How does a deployment say which model runs each agent? | **Open.** Recommended: `launch: { tool, model }` on the agent's placement (§4.11). Default if unruled: that |
| Q9 | Who records progress in a bean-blind run? | **Open.** Recommended: the harness, observing the agent's output (§4.9). Default if unruled: that |
| Q10 | Where do run profiles live? | **Open.** Recommended: one file per profile, in a declared `test-run-profiles/` directory of cat-harness, beside the deployment descriptions, with a schema; a test plan names a profile by its id (§4.12). Default if unruled: that |
| Q11 | How is an agent's context kept as it takes up, works and completes a task? | **All three** (2026-11-03): the engine at every task boundary; an optional neutral *Work context* data store in a diagram; the agent's own `work_context_note`. One work-context store, its Tool chosen by the deployment or run profile: work items, the run trace, or none (§4.13) |
| Q12 | Where does the development material sit? | **`sdlc` becomes a named sub-graph of cat-harness**, off in the layers above, switched on by folio-assistant (2026-11-03, §4.13) |
| Q13 | Do diagrams carry work item markup? | **No, outside `sdlc`** (2026-11-03): the engine does open, close and the per-task record; cat-harness, fhir-harness and smart-base are cleaned up (§4.13) |
| Q14 | When does a diagram draw the memory store? | **Only where the process needs memory** (2026-11-03): a checkpoint before stopping, a shared space for a swarm, a hand-over; never as bookkeeping. Work items are one Tool for it; there may be others (§4.14) |
| Q17 | How are work items and the memory store formalised? | **Layered, one service** (2026-11-03): `memory-record` base schema with structured entries; `bean-defs` extends it; `WorkPlanStore` extends `MemoryStore` (§4.14) |
| Q15 | Where does the work item Tool sit? | **Its own sub-graph** (2026-11-03, the default): `work-plan`, used by `sdlc` and by folio-assistant's content development; the memory store Role stays in cat-harness itself (§4.14) |
| Q16 | Does the engine keep the basics when no memory store is drawn? | **Yes, whenever the deployment names a memory Tool** (2026-11-03, the default): taken up, each step done, closed; not drawn, not seen by the agent |
| Q18 | How are `sdlc` and `work-plan` carved out? | **Named sub-graph folders**, `sdlc/` and `work-plan/`, like `openapi/` (owner, 2026-11-03: option 2), **a clean break**: *"dont worry old IRIs"* — no redirects. Off in every layer unless that layer enables it for itself; a development override turns them on in a working checkout |

---

## Appendix A. Detailed findings (2026-11-02)

Measured on cat-harness `f06cff0` and cat-harness-tools `main`.

**The store as a role.** `scenarios/roles.json` defines `work-plan` as a
mechanical role with a `store` block; `skills/sdlc/sdlc-core/work-plan-store.md`
was its contract; `processes/global-tasks.bpmn` declared one shared data store;
the Tools `beans-cli`, `beans-manual`, `bean-query`, `bean-claim-check` and
`work-plan-prime` satisfied the work item skills; the work item schema is
`schemas/kinds/bean-defs.schema.json`.

**Git in the skills.** Lines naming git or the branch store: `todo-manager` 14,
`bean-coordination` 16, `idle-backlog` 12, `bean-drain` 7,
`continual-progress` 5, `workflow-state` 2, `process-state` 1. The contract's
race and history responsibilities described git behaviour. The diagrams named
no branch.

**The engine.** `workflow_complete` (cat-harness-tools `src/tools/workflow.ts`)
called `applyWorkPlanOp` (`src/workflow/bean-link.ts`), which ran the `beans`
command and fell back to editing the Markdown file.

**Agent context.** `TaskContext` (`src/workflow/instance.ts`) carried
`carriedBeans` (ids), role, skills and conventions; an instance named its work item
but a work item named no instance.

**Starting agents.** No harness step started an agent. `beans-serve`
(`litlfred/beans`) offers `sendAgentMessage`, `stopAgent` and session
subscriptions, with a worktree per work item, running the `claude` command; a
draft work item there wraps it in one MCP tool. The two experiment arms in
cat-harness-tools (`arm-forced.ts`, one step at a time with refusals;
`arm-self-managed.ts`, the whole diagram) already measure the guardrail the
concept note describes, for one case in-process.

**History.** Git history of the work items branch and the instances' own
`history`; the 12 instances on the branch had last moved 28 to 42 days
earlier (#988).

**Gaps, as numbered in the first draft:** N1 contract names git behaviour;
N2 skills give git commands; N3 engine writes through one Tool; N4 no history
operation; N5 a work item does not record its position; N6 context carries ids not
work items; N7 nothing starts an agent; N8 positions go stale; N9 no conformance
tests; N10 guardrails depend on how and which model is started; N11 no
private store for benchmarks; N12 routes are no runner's setting and traces
are scattered; N13 the ITB plan has no steps to stand up a harness or start
agents; N14 each model's context is assembled differently; N15 (added
2026-11-03) no way to run a task without telling the agent it is a tracked
item; N16 (added 2026-11-03) no standing configuration of a run's models,
knowledge sources, tool access and tools.
