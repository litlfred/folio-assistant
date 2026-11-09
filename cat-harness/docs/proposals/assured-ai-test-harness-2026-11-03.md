---
title: "Testing AI agents fairly: the WHO Assured AI test harness"
kind: proposal
issue: 991
summary: >-
  One proposal for how the harness tests AI agents that help write WHO SMART
  Guidelines content: what is tested, the scenarios each test can be run
  under (model, knowledge, tools, memory, whether the agent is told it is
  doing tracked work), how the Interoperability Test Bed (ITB) runs the
  tests, and the design that makes the runs comparable. It replaces the
  bean-store and ITB test-plan proposals, which stay as the record.
---

# Testing AI agents fairly: the WHO Assured AI test harness
{: .no_toc }

**Status, 2026-11-03.** This document combines two earlier proposals: [the work items store and process driver](bean-store-and-process-driver-2026-11-02.md) and [test plans, FHIR TestPlan and the ITB](test-interop-itb-fhir-testplan-2026-10-24.md). Both stay unchanged as the record of how each decision was reached. The foundations are built: the work-plan store, the process engine's use of it, history, memory, and the visual pages. The test-running parts are designed but not built. §9 lists what is done and what is next. The tracking issue is [#991](https://github.com/litlfred/cat-harness/issues/991).

1. TOC
{:toc}

---

## Executive summary

**The problem.** WHO is turning health guidelines into structured, computable content (the *SMART Guidelines*). AI agents do part of that writing. Before an AI model can be trusted with this work, WHO needs to **measure** how well it does it, and to compare models fairly: Claude, Gemini, and others.

**The idea.** Every piece of work runs through a **process diagram**: a flow chart in which each step belongs to one role. An AI agent is given one step at a time, with only the knowledge that step needs. This keeps the agent on track. The same structure makes testing possible. A test sets up a task, starts one or more agents on it, records everything they do, and checks the result.

**What a fair test needs.** Each test must be repeatable, and only one thing may change between two runs that are compared. So every test run is set up from a saved **run profile**:

- which **model** runs each agent;
- which **knowledge** the agent may read: the WHO knowledge graph, the published guideline documents (PDF, Excel), code repositories, published FHIR guides, some mix, or nothing;
- which **tools** are switched on, and whether they are reached as online services (MCP) or only as local commands;
- whether the agent has a **memory store**, and of which kind;
- whether the agent is **told** that it is doing tracked work in a process, or is simply given the task in plain words, as a person would ask it.

**Who runs the tests.** The **Interoperability Test Bed (ITB)**, the test-running service used in the WHO digital-health community. Test plans are written in plain-language *Given / When / Then* form. The harness gives the ITB a few services: create a private test environment, load the work, start the agents, watch them, read the result, and clean up.

**What is built (2026-11-03).**

- The store that keeps the list of work items, with one set of operations whatever the storage.
- The process engine reads and writes work only through that store.
- Each work item's full history.
- A memory store for agents, with the engine keeping notes at every step.
- Pages that show which work is at which step of which process.
- A switch that keeps the development machinery out of the content an agent under test reads. The layers above cat-harness do not use it yet (step 23.4).

**What is next.** Starting agents from the process, private stores for test runs, run profiles, and the ITB services. §9 gives the full order.

### See it working

These pages are drawn from the real work plan of this project, on the main site (published 2026-11-04).

| Page | What it shows |
|---|---|
| [Work by process, every store](https://litlfred.github.io/folio-assistant/beans/beans-processed/) | Every tracked work item, grouped by the process it is in and the step it has reached, across all the project's stores |
| [Work by process, one store](https://litlfred.github.io/folio-assistant/beans/cat-harness/beans-processed/) | The same for one store, with an open and closed filter |
| [One process: code change review](https://litlfred.github.io/folio-assistant/beans/cat-harness/beans-processed/Process_CodeChangeReview/) | The items in one process, drawn on its diagram |
| [One work item's history](https://litlfred.github.io/folio-assistant/beans/cat-harness/bean-processed/folio-assistant-1j3q/) | A step-by-step player of everything that happened to one item, drawn on the process it was in at each moment |
| [A process diagram](https://litlfred.github.io/folio-assistant/cat-harness/process/Process_CodeChangeReview/) | An executable process: steps, roles and decisions |

On your own machine, the "work by process" page can also refresh every 5 seconds from a running harness, to watch a test as it happens (§8.9).

---

## 1. Terms

Read this section first if a word later on is unfamiliar. The terms are grouped by topic.

### The setting

| Term | Meaning |
|---|---|
| **WHO Assured AI** | The WHO initiative that defines how AI may be used, and tested, to turn health guidance into computable form |
| **SMART Guidelines** | WHO's approach to guidelines in layers. **L1** is the narrative guideline. **L2** is its digital adaptation: the operational requirements. **L3** is machine-readable, executable logic. **L4** and **L5**, software and verifiable workflows, come later |
| **DAK** | Digital Adaptation Kit: WHO's published L2 package for a guideline, usually PDF documents and Excel spreadsheets of data elements and decision logic |
| **FHIR implementation guide (IG)** | A published, versioned set of FHIR resources: the L3, computable form of a guideline |
| **folio**, **folio-assistant** | A folio is one body of authored content, such as a guideline or a paper. folio-assistant is the system that writes and publishes folios with AI help |
| **knowledge graph** | All the authored content and the links between its parts (L1, L2, L3, and the harness's own definitions). Agents read from it instead of guessing |

### The harness

| Term | Meaning |
|---|---|
| **harness** | The part of folio-assistant that governs AI agents: processes, roles, skills and the work plan. Its definitions are in the *cat-harness* repository; the code that runs it is in *cat-harness-tools* |
| **layer** | The system is built in layers, each a repository. A higher layer uses the ones below. From the bottom: the harness, the content core, the FHIR layer, and then the guideline content (for example *smart-base*) |
| **sub-graph** | A named part of a layer that can be switched on or off. When it is off, nothing in it reaches an agent |
| **process**, **diagram**, **BPMN** | A flow chart of work in the standard BPMN notation. The harness can run these diagrams |
| **role**, **lane** | Who does a step: a human author, a reviewer, or an AI agent. In a diagram each role has a horizontal band, its lane |
| **step**, **decision** | A box in the diagram (something to do) and a diamond (a choice of path) |
| **instance** | One run of a process for one piece of work. The **engine** (the harness's state machine) tracks where each instance is, allows a step only when the diagram says it is next, and refuses one out of order |
| **skill** | Written guidance for one kind of task, sometimes with a tool behind it. A role carries a set of skills |
| **Tool** (capital T) | One concrete way of doing a job the harness needs, such as "keep the work plan on a git branch" or "start a Gemini agent". Several Tools can do the same job; each installation picks one. A **Role** (capital R) is the job itself, defined by the operations it offers |
| **MCP** | Model Context Protocol: a standard way for an AI agent to call tools and read data from a server |
| **deployment description** | A file saying how one installation is set up: where each actor runs, which Tools it uses, and which credentials it may use (named, never their values) |

### Work and memory

| Term | Meaning |
|---|---|
| **work item**, **work item** | One unit of tracked work: a title, a status (*todo*, *in progress*, *completed*…), a description and links to other items. *Work item* is the name the project uses, after the `beans` program that manages them |
| **work plan** | All the work items, and the process instances that track them |
| **memory store** | Where agents keep notes as they work: what was decided, where the work stands before stopping, what a group of agents shares. A work item is one way to keep memory; a plain file is another |
| **work order** | What an agent is handed when its step is ready: the work item, the step, the role's skills, and how to report back |
| **history**, **trace** | The ordered record of everything that happened to a work item, or in a test run: every step reached or refused, every change, and what the agent did. A test is scored on its trace |

### Testing

| Term | Meaning |
|---|---|
| **ITB** | The Interoperability Test Bed: a service that runs test plans and reports the results. WHO's community uses it, through the OpenTestBed tools |
| **test plan** | What is tested, with which data, and what counts as a pass. Written once, in the harness's own format (`test-plan/v1`), and exported to the formats other systems read |
| **Gherkin** | A plain-language test format: *Given* a situation, *When* something happens, *Then* this must hold |
| **system under test** | What a test run is testing: a software library, a service, or an AI agent with a given model and configuration |
| **run profile** | A saved, named set of options for a test run: models, knowledge, tools, memory, route, and whether the agent is told |
| **route 0, A, B** | The evaluation routes in WHO's concept note. **Route 0**: the bare model. **Route A**: the model with skills. **Route B**: the model with skills and the knowledge graph |
| **told** / **untold** (in earlier documents, *bean-aware* / *bean-blind*) | Whether the agent is told that it is working a tracked item in a process (§3.4) |
| **leak** | A word or reference to the test machinery reaching an agent that is meant not to know about it (§8.7) |
| **Antigravity** | Google's environment for running Gemini agents |
| **`AGENTS.md`**, **`CLAUDE.md`**, **`GEMINI.md`**, **`MEMORY.md`** | The instruction files an agent reads first. `CLAUDE.md` and `GEMINI.md` point to the shared `AGENTS.md`, so every model reads the same guidance. `MEMORY.md` holds what a role should remember between sessions |

---

## 2. Why: WHO's concept note

The concept note *Gemini Integration and Benchmarking Methodology for WHO Assured AI* (2026-11-02) sets the purpose.

WHO Assured AI is establishing how complex health guidance becomes computable and verifiable, and how large language models are to be **benchmarked** for high-stakes health work. To stay independent of any one vendor, the infrastructure must work equally well with Gemini as with the models already in use, and the test methods must be checked against how Gemini reasons and calls tools.

The concept note's architecture, which this proposal implements:

- **Process diagrams as guardrails.** Each task belongs to a role and is backed by skills. An agent gets one specific, checkable task with bounded context, which limits made-up answers.
- **MCP servers** give agents their tools and precise data.
- **Layered knowledge graphs**: L1, then L2 built on L1, then L3 built on both.
- **One set of instructions, with model-specific wording where needed.** Behaviour is defined once; each model may need its own phrasing to stay on track, and that phrasing must be tested.

Its method: test models against WHO baselines through **routes 0, A and B**, driven by executable **Gherkin** test plans through the process harness, capturing each model's reasoning so models can be compared on a WHO-approved benchmark.

Its asks of Google: cloud credits to run Antigravity at scale for the benchmarks; Gemini Ultra access for three engineers; and a consultation on guardrail prompts, on Gemini's use of the MCP servers and skills, and on shaping results for the ITB.

---

## 3. What has to be tested

### 3.1 Three kinds of testing

| Kind | The question | Example |
|---|---|---|
| **Software conformance** | Does a library or service do what its requirements say, on every platform it claims? | The HCERT library in smart-trust-tools verifies health certificates correctly, in Kotlin and in Rust, called directly, as a WebAssembly component, or through an MCP server |
| **Agent task performance** | Given a task, does an AI agent produce a correct result? | An agent encodes the antenatal-care contact schedule as decision logic, and the result meets the task's acceptance criteria |
| **Agent behaviour in a process** | Does the agent stay on its step, use the tools it should, and hand over correctly to other agents? | Two agents share a merge window: one opens changes, the other lands them, and no step is taken out of order |

The first kind is ordinary software testing. The second and third are what the benchmark needs. All three use the same test-plan format and the same result records (§8.8), so a QA check, a conformance test and a benchmark run are the same kind of record.

### 3.2 What can vary between runs

Each of these is set in the run profile (§8.6). A comparison changes one and keeps the rest.

| Dimension | Choices |
|---|---|
| **Model** | Claude, Gemini (through Antigravity), GitHub Copilot, a local command-line agent |
| **Knowledge** | Any combination, or none: the knowledge graph (all of it, or chosen layers); the published DAK files; code repositories; published FHIR implementation guides |
| **Tools** | Which tools are on. A skill whose tools are all off is not offered at all |
| **Tool access** | Online services (MCP), local commands only, or both |
| **Memory** | None; a neutral memory (note, recall, checkpoint) with no mention of how it is stored; or the full work-item system with the software-development processes |
| **Told or untold** | The agent is handed a work order and knows it is in a process; or it gets one fixed prompt in plain words and knows nothing about the process |
| **Agents** | One agent, or several, each with its own work and possibly a different model |

### 3.3 Routes are profiles

WHO's three routes are three standard run profiles. Any other combination is a profile too.

| Profile | Knowledge | Tools on | Skills offered |
|---|---|---|---|
| `route-0` | none | none | none |
| `route-A` | none | the authoring tools | the authoring skills |
| `route-B` | the knowledge graph | the authoring tools and the knowledge-graph tools | the authoring and knowledge-graph skills |
| `route-B-dak` *(example)* | the knowledge graph and the published DAK files | as `route-B` | as `route-B` |
| `docs-only` *(example)* | published DAK files and FHIR guides, no knowledge graph | file reading only | none |

### 3.4 Told and untold runs

The same work item can be handed to an agent in two ways. Both are scored against the same item.

| | **Told** | **Untold** |
|---|---|---|
| What the agent receives | A work order: the item, its step, the memory store, how to report | One fixed prompt, written from the item |
| What the agent knows | That it is working a tracked item in a process | Only the task, as a person would ask for it |
| Who records progress | The agent, by completing its step | The harness, by watching what the agent produces |
| What it measures | How well a model works inside the harness | How a model behaves on the same task with no harness framing: the real-world case |

**The fixed prompt.** For an untold run, the work item is turned into a prompt by a fixed, reviewed template: the task, its acceptance criteria and the material to work on. It contains no item id, no process or step names, and no harness vocabulary; a check refuses a prompt that leaks any of them. The prompt is generated once, stored with the test case and identified by its hash, so every model gets exactly the same words and a re-run is reproducible.

**The work item is still the test.** It exists in the run's private store, and its acceptance criteria are the *Then* of the test. The harness plays the agent's part in the process: it moves the instance and records progress on the agent's behalf, so an untold run leaves the same kind of trace as a told one.

**The difference is the measurement.** The gap between a told and an untold run of the same model and route measures what the process harness itself contributes. That is the guardrail claim the concept note makes.

| | Told | Untold |
|---|---|---|
| **Route 0** | not applicable: no work order without skills | the bare model on the task: the baseline |
| **Route A** | skills and the work order | skills available, task in plain words |
| **Route B** | the full harness | full knowledge, no harness framing |

### 3.5 Memory scenarios

| Scenario | The agent is offered | Behind it |
|---|---|---|
| **No memory** | no memory tools | nothing kept for the agent; the harness still records the run |
| **Neutral memory** | three tools: note, recall, checkpoint | a private store for the run, as work items or plain files, chosen by the run profile |
| **Work items and processes** | the work-item tools and the software-development processes and skills | the run's private work-item store, told |

The same task can be run under all three, and the ITB compares them.

### 3.6 Agents must not know they are being tested

What an agent sees in a test is what it would see in real work: the same work order or prompt, the same tools and skills, work items written as real work and never labelled as tests. The run's identity (plan, route, model) stays in the harness and is never shown to the agent. What cannot be hidden, such as a fresh store or a short repository history, is listed on the test plan, so a result can be read with it in mind.

For the untold and no-memory scenarios this goes further: nothing the agent reads may mention the work-item machinery at all. §8.7 explains how that is kept true and checked.

### 3.7 Example test plans

Two agents working together, told:

```gherkin
Feature: two agents share a merge window
  Background:
    Given a harness with processes "code-change-review" and "merge-train"
    And the context "folio-assistant@<hash>"
  Scenario: A opens changes, B lands them
    Given agent A (gemini, route B, told) holds work items {a1, a2}
    And agent B (claude, route B, told) holds work item {b1}
    When the agents are started
    Then within 2 hours every work item of agent A is completed
    And work item b1 is at "merge-train" step "End_Landed"
    And no instance recorded a refused step
```

The same task, told and untold:

```gherkin
Scenario: the same task, told and untold
  Given work item g7 "Encode the ANC contact schedule as decision logic"
  And agent G1 (gemini, route B, told) holds work item g7
  And agent G2 (gemini, route B, untold) is given the prompt of work item g7
  When the agents are started
  Then both outputs meet the acceptance criteria of work item g7
  And the prompt of G2 contains no harness vocabulary
```

One plan across models and profiles:

```gherkin
Scenario Outline: the same task under each profile and model
  Given the run profile "<profile>"
  And agent A (<model>, untold) is given the prompt of work item g7
  When the agents are started
  Then the output meets the acceptance criteria of work item g7

  Examples:
    | profile     | model  |
    | route-0     | claude |
    | route-0     | gemini |
    | route-B     | claude |
    | route-B     | gemini |
    | route-B-dak | claude |
    | route-B-dak | gemini |
```

Every row runs on identical infrastructure; only the line that varies differs.

---

## 4. How a test run works, end to end

1. **The installation is chosen.** The deployment description says where agents run, which store to use and which credentials each may use. For a benchmark that is, for example, `itb-benchmark`.
2. **The ITB creates a private harness** (`harness-up`): a process engine, a private store for this run, and the run's context, built from the run profile.
3. **The work is loaded** (`seed`): work items and started process instances, from the test plan's *Given* steps. For untold agents, the fixed prompts are generated and pinned.
4. **The agents are started** (`start-agents`), each through the Tool for its model. Told agents get a work order; untold agents get their prompt.
5. **The agents work.** The ITB can watch events as they happen (`observe`). On a developer's machine, the "work by process" page shows the run live.
6. **The result is checked.** The *Then* steps read the store and the instances (`state`). The harness exports the trace and removes the private store (`harness-down`). The ITB reports the result in its own report format.

A test plan names **agents**, never models. Which model each agent is comes from the deployment, so changing a model is a one-line change and the same plan compares models fairly.

---

## 5. The approach in one picture

```
   ITB test plan (Gherkin)                 run profile
          │                                    │
          ▼                                    ▼
   harness services ──► private harness: engine + private store + context
   (harness-up, seed,          │
    start-agents, observe,     ├─► start agent (Claude / Gemini / …) ──► agent works
    state, harness-down)       │        told: work order    untold: fixed prompt
                               │
                               ├─► every step, change and note recorded ──► trace
                               ▼
                         result back to the ITB, in its own report format
```

The design rests on five ideas, each in §8:

1. **Each job the harness needs is a Role with fixed operations,** and storage or vendor specifics are Tools behind it. The work plan, the memory store and agent start-up all work this way, so a test can swap storage or model without changing anything else.
2. **The process engine, not the agent, decides what is next,** and hands over only that step's context.
3. **Everything is recorded** in one shape, whatever the model or storage.
4. **Every run is built the same way from its profile:** the same infrastructure and the same prompt wording for every model.
5. **What a test agent reads is controlled and checked:** the development machinery lives in sub-graphs that are off unless switched on, and a leak check proves it.

---

## 6. Where things stood (2026-11-02)

When this work started:

- The work-plan store was defined as a role, but in terms of git, and nothing tested it.
- About 57 lines in 7 skills told agents to run git commands to change a work item.
- The engine wrote work items one way only, so a server-backed store could not be used.
- Agents were given the ids of their work items, not their content, and nothing on an item said which process step it was at.
- Nothing in the harness started an agent. Each model was started by hand, with a prompt written for that model.
- History lived only in git, with no way to ask for it.
- Every guideline layer read the whole harness, including all the work-item machinery, so an agent tested on guideline content would learn about it.

The detailed findings are in Appendix A of [the bean-store proposal](bean-store-and-process-driver-2026-11-02.md#appendix-a-detailed-findings-2026-11-02).

---

## 7. Goals

| Goal | In plain words |
|---|---|
| **G1** | Process and skill text says *what* happens to the work, never how one storage does it |
| **G2** | An agent working a step is given its work item as context |
| **G3** | The harness can start an agent on a step and hand it the work item, tagged with its process and step |
| **G4** | A work item's history can be read whatever storage backs it |
| **G5** | Any model can run the same process under route 0, A or B, leaving a trace that can be scored and compared |
| **G6** | The ITB runs these tests: a private harness per run, several agents with their own work, the end state and behaviour checked, and agents unable to tell a test from real work |
| **G7** | A test can give the agent its task untold: a fixed prompt from the work item, with the work item still the test's context |
| **G8** | Every run is set up from a standing configuration (models, knowledge, tool access, tools on, memory), with the same infrastructure and prompting whatever is chosen |
| **G9** | Memory is kept as an agent takes up, works and completes a task, whatever store backs it, and a test can offer no memory at all |
| **G10** | Guideline content that agents are tested on never mentions the work-item machinery |
| **G11** | Software conformance, agent tasks and machine QA share one test-plan format and one result record, exported to FHIR TestPlan and to the ITB |

---

## 8. Design

### 8.1 The work plan: one set of operations, any storage

Every Tool that keeps the work plan offers the same operations, each with a promise a test can check.

| Operation | What a caller can rely on |
|---|---|
| `get(id)` | the work item as last written, or "none" |
| `list(filter)` | items by status, type, tag or parent |
| `create(item)` | the id is unique |
| `update(id, change, ifMatch)` | refused if someone else changed the item since you read it; a retry on the fresh version lands, so no change is ever lost |
| `note(id, text, by)` | added to the item's notes, never rewriting earlier ones |
| `history(id)` | every change, oldest first: when, by whom, what, and from which process step |
| `positions(id)`, `beansAt(process, step)` | where an item is in its processes, and which items are at a step |

Archiving is a field set through `update`, allowed only for completed or scrapped items.

| Tool | Kept where | Status |
|---|---|---|
| git branch | a git branch per work plan | built; today's default |
| run-scoped store | a private store for one test run | to build (step 9) |
| work items server | `beans-serve`, which already offers versioned updates | proposed |
| MCP service | an MCP server offering the operations as tools | proposed |

**One conformance test suite** checks every Tool against these promises. The deployment description names the Tool (`"stores": { "work-plan": "beans-git-branch" }`). A description that names a Tool the toolset does not have is refused; it is never silently replaced by the real work plan.

### 8.2 The engine and the agent's context

The engine reads and writes work only through these operations. **A work item's position lives only in the process instances** that name it, so there is one source of truth. When the engine reports which step is ready, the step's context carries the work items themselves (title, status, description, links, position), not only their ids.

A work item belongs to a **process instance**, not to a single task: the instance names its item, and every sub-process it calls inherits it.

### 8.3 Memory

**The memory store is a Role.** Its operations are *keep* an entry, *recall* entries, and *checkpoint* where the work stands, over a **scope**: one work item, one run, or one space a group of agents shares. Work items are one Tool for it, and a plain file store is another. The deployment or run profile picks which (`stores["work-context"]`: `work-plan`, `run-files` or `none`).

**The engine keeps the basics**, with nothing drawn in the diagram: when an instance starts (*taken up*), when each step is done (*step done*), and when the instance ends (*closed*). When an agent takes up work, it is handed what was kept from earlier work on the same item.

**A diagram draws a memory store only where the process itself needs memory:**

- **Checkpoint before stopping:** a step such as *Record where the work stands* writes to it before an agent stops or hands over, and the step that resumes reads from it.
- **Shared memory for a group of agents:** a step such as *Open a shared memory space* creates a scope that all the agents of a parallel step read and write. Each write carries the version it read, so two agents never overwrite each other silently.
- **Hand-over between roles:** a step in one lane writes what the next lane needs to know.

It is never drawn as routine bookkeeping.

**The agent's side is neutral.** The agent sees three tools, `memory_note`, `memory_recall` and `memory_checkpoint`, and one skill that says when to use them. None of them names the storage. The backend adds the process, step, instance, agent and time to each entry, out of the agent's sight. The tools are their own group, so an untold agent can be offered memory without learning about work items.

**A work item is a memory record with more structure.** The schemas are layered:

| Layer | Schema | Store interface | Adds |
|---|---|---|---|
| memory record | `memory-record` | `MemoryStore`: keep, recall, open | id, title, scope, what it is about, tags, timestamps, and structured entries (text, when, who, kind, and when known the process, step, instance and role) |
| work item (work item) | `bean`, which shares the memory record's core | `WorkPlanStore` extends `MemoryStore`: create, update, relations, positions | status, type, priority, parent, blocking |

So memory and the work plan are one service: a memory note is a work-item note without the work-item fields. The project's long-lived, curated agent memory (`MEMORY.md`, "never written by a process") is a different thing and stays separate.

### 8.4 Starting agents

When a ready step's lane belongs to an AI role, the engine hands a **work order** to a **launch Tool**:

| Work order field | From |
|---|---|
| the work item | `get` and `positions` |
| the instance and step | the engine |
| role, skills, conventions | the step's context |
| the memory store | which Tool, and how to reach it |
| how to report | "when done, complete this step of this instance" |

The work order is **the same for every model**. How a particular model is best told to stay on its step is the launch Tool's job, written on that Tool's page and tested. Parity between models is then checked by a test, instead of depending on someone copying a prompt into `GEMINI.md`.

| Launch Tool | Model | Today |
|---|---|---|
| `launch-beans-serve` | Claude, through the work items server | the server exists; this Tool is first |
| `launch-claude-session` | Claude, cloud session | API exists, no Tool yet |
| `launch-antigravity` | Gemini, through Antigravity | prompts written by hand today |
| `launch-copilot` | GitHub Copilot | API exists, no Tool yet |
| `launch-local` | any command-line agent | not yet |

The agent reports by completing its step. That moves the instance, writes its history and notes the work item, so position and history stay current without anyone remembering to update them.

### 8.5 History and the trace

Every change is an **event**: created, status changed, claimed, noted, changed, archived, step reached. Each says when, who and what, and for a process step which instance and step. `history(id)` returns them in order. For the git Tool the events are derived from git history and the instances' own records, so nothing had to be migrated.

A test run's **trace** is its history, its instances' histories, and every step the engine refused, in the same shape whatever the model. That is the reasoning trace the concept note wants handed to the ITB. The count of refused steps is a metric of every run. Results go to the benchmark output area, never into the authored content.

### 8.6 Run profiles and the run's context

A **run profile** is a saved file. A test plan names the profile it uses and never sets these options itself.

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
  "tools": ["kg-search", "kg-read", "skill-fetch", "memory-note", "memory-recall"],
  "memory": "run-files",
  "route": "B",
  "contextMode": "untold"
}
```

**Every run is built the same way, in the same order:**

1. **The context repository** is built from the profile's knowledge sources, each pinned: knowledge-graph layers at their versions, DAK files by checksum, repositories at a commit, FHIR guides at a package version. The repository's commit hash identifies the whole context. Two runs with the same hash gave their agents the same world.
2. **Tools.** The run's MCP server offers only the tools that are on, and the command-line wrappers are installed only for those. A tool that is off is simply absent, and the agent is not told it exists.
3. **Skills.** Only skills backed by a tool that is on, or needing none, are copied in.
4. **Instruction files.** `AGENTS.md`, with `CLAUDE.md` and `GEMINI.md` pointing to it, and `MEMORY.md` are generated from the profile, so every model reads the same text.

**One prompt template per mode.** The prompt says, in the same words for every model, what the agent has to work with, and nothing about sources or tools that are off. A check compares the prompts each agent was given: for the same profile they must be identical, apart from the model's own launch wording, which is kept on the launch Tool's page and reviewed.

**Where each setting lives:**

| Setting | Home |
|---|---|
| which installation this machine is | the `CAT_DEPLOYMENT` environment variable |
| which store, which actors, where they run, credentials by name | the deployment description |
| which model each agent is, and how it is started | the agent's placement in the deployment: `launch: { tool, model }` (open question Q8) |
| what a run may see and use | the run profile |
| what is tested, with which work per agent | the ITB test plan, which names a profile |

### 8.7 Keeping the test machinery out of what agents read

Guideline content (for example *smart-base*) is built on the harness. Until now it read the whole harness, so an agent tested on it would read about work items, the work plan and the software-development processes. For untold and no-memory runs that spoils the test: the agent learns the machinery from its context.

**Two switches.** The harness's own machinery (store, engine, trace) stays on in every test run, because the work item is the test's context. What the **agent** is given (skills, knowledge, tool list, instruction files, prompt) follows the run profile. Switching a sub-graph off removes its material from the agent's context; it does not stop the harness using it.

**Two named sub-graphs**, each a folder of the harness with its own declaration, like the existing `openapi/`:

- **`work-plan/`**: the work-item Tool, its skills, and the work-item and workflow Tools. Used by software development and by folio-assistant's content development.
- **`sdlc/`**: the software-development processes and skills.

Both are **off** in every layer unless that layer switches them on for itself (`enableSubgraphs`). A developer can switch them on in a working copy with `CAT_SUBGRAPHS`. The directory resolver, the skill scan, the tool server and the mount plan all honour the switch. The memory store Role, its tools and its skill stay in the harness itself, outside both, so any process can draw a memory store without naming work items. Old web addresses of the moved pages were not kept: a clean break.

**No work-item markup in diagrams outside `sdlc`.** Diagrams elsewhere no longer call the open and close sub-processes, and no longer carry per-task work-item steps; the engine does that work (§8.3). Provenance ids (such as "bean `kg83`") move out of text agents read, into the provenance fields and changelogs.

**The leak check, `check:context-leak`.** It scans what an agent would read: every file of a built context, the live MCP tool list, the generated instruction files and the fixed prompt. It looks for the work-item vocabulary: *work item*, provenance ids, `beans/` paths, the work-plan branch, *work plan*, *work order*, the `workflow_*` and work-plan tool names, and the open and close sub-process names. It does not flag *process*, *BPMN* or *business process*, because DAKs hold business processes as content. An input it could not read is never reported as clean. It runs in report mode now, and becomes a gate in each guideline layer's CI once the clean-up lands.

Measured on smart-base's default view of the harness: 12,762 findings with both sub-graphs on, 9,610 with both off. Most of what remains is prose in documentation and skills, which is steps 24 and 25.

### 8.8 Test plans, the system under test, and the exports

*From the ITB proposal of 2026-10-24; its five decisions were ruled that day.*

**One written plan, several exports.** `test-plan/v1` is the one place a plan is written: its scope, the requirements it tests, its cases and assertions, its data, and its exit rule (a decision table). Both FHIR TestPlan and the ITB's test language (GITB TDL) are **generated** from it, side by side. That is what the OpenTestBed tools already do from Gherkin.

```
                         test-plan/v1  (the one written plan)
                        /       |       \
         FHIR export            |        ITB export
              |                 |              |
  FHIR R5 TestPlan    folio-test-run/v1   Gherkin → GITB TDL (OpenTestBed)
  testRun.script ──────────────────────────► (the ITB test case that runs it)
              |                 ▲              |
  FHIR R5 TestReport ◄──────────┴──── ITB results (TAR) imported
```

- **FHIR TestPlan points at the ITB.** A TestPlan's `testRun.script` names the ITB test case that runs it. The TestPlan describes the plan; the ITB executes it. Converting the ITB's test language back into a TestPlan is not done: requirements and exit rules do not survive that direction.
- **The route to the ITB is Gherkin** (decision D4): the export writes Gherkin features and an OpenTestBed configuration, and OpenTestBed compiles them to the ITB's language. This reuses the community's compiler and plugins (FHIR validator, JWT, OAuth, HCERT decoder). A case with no matching Gherkin step stays in-house, and the export says "not exported" for it rather than leaving it out silently.
- **Results come back**: ITB results are imported as `folio-test-run/v1` records, so an ITB run is judged by the same rule as an in-house run. A FHIR TestReport is generated from the run, not stored.
- **Where the code lives** (D3): the ITB export and import live in cat-harness-tools; the FHIR export in fhir-harness, so the harness stays free of FHIR.

**The system under test is a record** (D1): `system/v1` declares a system, its versions, the actors it can play, its surfaces (library, WebAssembly component, MCP server, command line, HTTP) and its targets (JVM, Node, native, wasm32, Android). A test run names which of each it used, and for an agent also its model and configuration. This is the ITB's own model, a system playing an actor in a conformance statement, so the export is a mapping, not a translation. It also lets a check say that a plan has a run for every declared target.

**Which test stands for which assertion** (D2): each test is tagged in its own code with the assertions it verifies, for example `@verifies("req:stt-ver-001#statement/test")`. A Tool reads the tags and writes the assertion-to-test map onto the `system/v1` record, and CI fails when the map is stale. The plan never names an implementation, so Rust, Kotlin and an MCP server share one plan.

**Three optional fields on a test case**: `skill` (the skill it tests), `level` (skill, vector, negative, fuzz, coverage, target, cross-implementation, interface suite, schema, agreement, review), and the plan's `interface` (the contract it tests, so any system that implements it can run the plan).

**Machine QA and the benchmark use the same records:**

| Thing | Becomes |
|---|---|
| a machine QA check | an assertion id, so a QA verdict and a test verdict are the same kind of record |
| a fixed finding | a regression case, with the finding's input as fixed test data |
| a requirement's success criterion | an assertion id, `req:<id>#<statement>/<criterion>` |
| a benchmark | one plan, several runs, each against a different system under test (model, configuration) |
| cost and tokens | optional fields on the run |

**First worked example: smart-trust-tools.** Its two plans are already `test-plan/v1` records generated from its skills and requirements. The `who-itb-agreement` plan compares the library with WHO-ITB's three HCERT tracks and is the first that would use the ITB route. The first shared agent task for the benchmark is **an agent verifies a health certificate through the MCP tool**, scored against the library's test vectors: fixed data, known right answers, and negative cases with named reasons.

### 8.9 Watching a run live

The published site shows the work plan as it was when the site was built; it cannot reach a running harness. On your own machine:

1. Start the harness server in a checkout: `CAT_DEPLOYMENT=developer bun run cat-harness-tools/src/server.ts`.
2. Open the "work by process" page from the same machine. It offers *Refresh every 5 s from the local store* and shows what the store holds now. On the published site the control does not appear.
3. If no server answers, the page says so and keeps what it was built with. It never shows an empty plan because a request failed.

The route it reads answers only on `localhost`, is read-only, and allows cross-site reads only from `localhost` pages.

### 8.10 Keeping the record honest

A work item's position is only as good as the habit of recording it, and anyone can edit the work-plan branch directly. So the recorded path is made the easy one, and drift is reported, never blocked: claiming or creating a work item starts its process; agents get the item with its step, and completing the step records the move; an in-progress item that no running instance names is flagged on the "work by process" pages, in the repository health report, and when a session starts.

---

## 9. Progress and next steps

### 9.1 Built

| Step | What | Where |
|---|---|---|
| 1–2 | The work plan as operations; the conformance tests | cat-harness#993, cat-harness-tools#1418 |
| 3 | The engine uses the operations | cat-harness-tools#1420 |
| 4 | Where a work item is; the item in each step's context; the deployment names the store | #1421, #1423, #1424; cat-harness#1005 |
| 5 | History and its events | #1425 |
| 5b | The history player on each item's page; open and closed filter; every store on one page | #1426, #1428, #1432 |
| 13 | The live local refresh | #1429 |
| 16 | The engine keeps work context at every step; open and close done by the engine | #1435 |
| 17 | Work-item markup out of the harness's diagrams outside `sdlc` | cat-harness#1011, cat-harness-tools#1436 |
| 18 | The memory-record schema; `MemoryStore` and `WorkPlanStore` | #1437 |
| 19–20 | The engine binds a drawn memory store; the neutral memory tools | #1438 |
| 21 | A second memory Tool, plain files, passes the same conformance tests | #1439 |
| 22 | The leak check, in report mode | #1440 |
| 23.1–23.3 | The on/off switch for sub-graphs; `sdlc/` and `work-plan/` moved into their own sub-graph folders; the tools layer's new paths | #1445, cat-harness#1014, #1446 |

(Pull requests without a repository name are in cat-harness-tools.)

### 9.2 In review

| Step | What | Where |
|---|---|---|
| 23.4 | folio-assistant switches both sub-graphs on, the layers above stop naming the old paths, and folio-assistant re-pins cat-harness past the move | folio-assistant#2926, a draft |
| 16 (Tool nodes) | The memory tools' definitions and their skill | cat-harness#1010, a draft |

### 9.3 Publishing the visual pages

The "work by process" and history pages are on the main site since 2026-11-04. The main site's publishing job (`docs-site.yml`) had failed on every push to main from 2026-11-02, so nothing new was published until cat-harness-tools#1455 fixed it and folio-assistant#2928 brought the fix in.

### 9.4 Next, in order

| Step | Work |
|---|---|
| 23.4 (rest) | Development sessions set `CAT_SUBGRAPHS` |
| 23.5 | The leak check over a smart-base untold context |
| 6 | Skills say the operation, not the git command; a check keeps it so |
| 7 | The *Dispatch agent* step and the first launch Tool, `launch-beans-serve` |
| 8 | A server Tool passes the same conformance tests |
| 9 | The run-scoped store; route and mode settings; a test case becomes seeded work and instances |
| 9b | Untold runs: the fixed-prompt template, its leak check, the harness recording on the agent's behalf |
| 11 | The context builder: one pinned repository per run |
| 15 | Run profiles: the file format, the standard profiles, tools and skills filtered to match, the prompt-equality check |
| 27 | Profiles for the three memory scenarios |
| 10 | `launch-antigravity`; the same cases under routes 0, A and B for Claude and Gemini; traces exported for the ITB |
| 12 | The ITB services and the Gherkin steps that call them; the first multi-agent plan |
| 14 | `launch` on a placement; the `itb-benchmark` deployment |
| 24 | fhir-harness and smart-base: work-item markup out of their diagrams; instruction files generated; the leak check a gate |
| 25 | Provenance ids out of agent-facing text across the layers |
| 26 | folio-assistant's content processes draw the memory store where they need it |
| P1–P2 | `system/v1`; the run's reference to it; `skill`, `level`, `interface` on test plans |
| P3–P4 | smart-trust-tools adopts them; the MCP surface of the HCERT library |
| P5 | The FHIR TestPlan export, pointing at the ITB case |
| P6 | The ITB export (Gherkin and OpenTestBed configuration) and the results import |
| P7 | The agent plan "verify a health certificate", and the first benchmark runs |

Steps 10 and 12 are what the concept note's cloud credits and model access would pay for. Everything before them needs neither.

---

## 10. Decisions

### 10.1 Decided

| | Question | Decision |
|---|---|---|
| Q1 | Where does a work item's position live? | Only in the process instances (2026-11-02) |
| Q2 | How is the store's Tool chosen? | By the deployment description; a checkout names its own with `CAT_DEPLOYMENT` (2026-11-02) |
| Q3 | First launch Tool? | `launch-beans-serve` (2026-11-02) |
| Q4 | Where does the git Tool's history come from? | Derived from git history and instance histories; nothing migrated (2026-11-02) |
| Q5 | Where does a test run keep its work items? | A private, run-scoped store (2026-11-02) |
| Q6 | Who drives a test run? | The ITB, calling the harness services (2026-11-02) |
| Q7 | How is archiving expressed? | A field set through `update` (2026-11-02) |
| Q11 | How is an agent's context kept through a task? | All three: the engine at every step; a memory store drawn where the process needs it; the agent's own memory tools (2026-11-03) |
| Q12 | Where does the development material sit? | `sdlc` becomes a named sub-graph, off in the layers above (2026-11-03) |
| Q13 | Do diagrams carry work-item markup? | No, outside `sdlc` (2026-11-03) |
| Q14 | When does a diagram draw the memory store? | Only where the process needs memory: checkpoint, shared space, hand-over (2026-11-03) |
| Q15 | Where does the work-item Tool sit? | Its own sub-graph, `work-plan` (2026-11-03) |
| Q16 | Does the engine keep the basics when no memory store is drawn? | Yes, whenever the deployment names a memory Tool (2026-11-03) |
| Q17 | How are work items and memory formalised? | Layered, one service: the memory record is the base; a work item adds its fields (2026-11-03) |
| Q18 | How are `sdlc` and `work-plan` carved out? | Named sub-graph folders; a clean break, old addresses not kept (2026-11-03) |
| D1 | Shape of the system under test | A `system/v1` record that runs point at (2026-10-24) |
| D2 | Where the assertion-to-test map lives | Tags in the tests' own code, written onto the `system/v1` record by a Tool; CI fails when stale (2026-10-24) |
| D3 | Where the ITB export and import live | cat-harness-tools (2026-10-24) |
| D4 | Route to the ITB | Through OpenTestBed Gherkin (2026-10-24) |
| D5 | First step for the test-plan fields | smart-trust-tools tries them first; the schemas move into the harness once proven (2026-10-24) |

### 10.2 Open

Each has a recommended answer that stands as the default until it is ruled.

| | Question | Recommended, and the default |
|---|---|---|
| Q8 | How does a deployment say which model runs each agent? | `launch: { tool, model }` on the agent's placement |
| Q9 | Who records progress in an untold run? | The harness, by watching the agent's output |
| Q10 | Where do run profiles live? | One file per profile, in a declared `test-run-profiles/` folder of the harness beside the deployment descriptions, with a schema; a test plan names a profile by its id |

---

## 11. What this does not do

- It does not move work items off the git branch; the git Tool stays the default.
- It does not change what the process diagrams mean.
- It does not decide what an agent works on: an agent is started only on a step the process has already made ready.
- It does not replace the ITB's own report format, or change anything in WHO-ITB or any WHO repository.
- It does not host a work-plan server online; the live view works only on your own machine.

---

## Sources

- [The work items store and process driver](bean-store-and-process-driver-2026-11-02.md), 2026-11-02: the owner's requests in full, and the detailed findings.
- [Test plans, FHIR TestPlan and the ITB](test-interop-itb-fhir-testplan-2026-10-24.md), 2026-10-24: what existed in the platform, smart-trust-tools and OpenTestBed, and the options weighed.
- *Gemini Integration and Benchmarking Methodology for WHO Assured AI*, concept note, 2026-11-02.
- Issue [#991](https://github.com/litlfred/cat-harness/issues/991), which lists every pull request.
- [Tool releases](tool-releases-2026-10-07.md), decision C2 (the ITB is an export); [model swarm and benchmark](https://github.com/litlfred/cat-harness/pull/500); [deployment descriptions](deployment-descriptions.md).
- github.com/OpenTestBed: `itb-cli` (`otb-gherkin`), `itb-manager`, and the ITB plugins (read 2026-10-24).
- HL7 FHIR R5 TestPlan and TestReport.
