# bootstrap

This directory is where an agent starts when it has been handed a repository
and knows nothing else about it. Everything here is a file to read: text
(`.md`), data (`.json`) and diagrams (`.bpmn`). Nothing here is a program, so
you need nothing installed to use it.

A capitalized word on this page is a defined term. It links to its definition
the first time it appears. Every definition is in one file,
[`schemas/graph.schema.json`](schemas/graph.schema.json).

---

## What you are setting up

A [Knowledge Graph](schemas/graph.schema.json#/$defs/KnowledgeGraph) is
information kept as files in a repository: things, and the named relations
between them. One file at its root, `<name>.json`, declares it. That file
gives its name and lists its
[Subgraphs](schemas/graph.schema.json#/$defs/Subgraph), the named directories
it is divided into.

A [Harness](schemas/graph.schema.json#/$defs/Harness) is what you use to work
with a Knowledge Graph. A Harness is a Knowledge Graph too, declared the same
way. This directory is the first Harness, `bootstrap`, declared by
[`bootstrap.json`](bootstrap.json).

**Setting up a repository means making it one particular Harness.** A person
chooses which one, and the choice is hard to undo. Everything added to the
repository afterwards is built on it.

---

## Who takes part

An [Actor](schemas/graph.schema.json#/$defs/Actor) is a person, an agent or a
program. Each Actor takes a [Role](schemas/graph.schema.json#/$defs/Role), and
the four Roles here are declared in [`scenarios/roles.json`](scenarios/roles.json):

| Role | who plays it |
|---|---|
| **Initiator** | you: the agent setting the repository up |
| **Requestor** | the person who asked for it. Only the Requestor chooses the Harness. |
| **Knowledge Graph Data Store** | a repository: the one being set up, and any a Harness is read from |
| **Logger** | the record of what you did. Here, it is the conversation you are in. |

As the Initiator you have no Harness yet, so you have no
[Tools](schemas/graph.schema.json#/$defs/Tool) (programs to call). If a step
seems to need one, it belongs to the Harness you are about to set up, not to
this one.

---

## User story

> **As** the Initiator, **I want** to set up the repository I was handed as
> the Harness the Requestor chooses, **so that** everything added to it later
> is built on the right Harness.

The story ends in one of two ways, and both are acceptable: the Harness is set
up, or the reason it could not be is recorded.

---

## Steps

The steps are drawn as a
[Process](schemas/graph.schema.json#/$defs/Process),
[`initialize-harness.bpmn`](processes/initialize-harness.bpmn). It is the only
Process you start. Each step names the
[Skill](schemas/graph.schema.json#/$defs/Skill) to read and the Functional
Requirement it must meet (see the next section).

1. **Learn how to open files here.** Read
   [`skills/bootstrap-kg-navigation.md`](skills/bootstrap-kg-navigation.md).
   Opening files is all you can do (Functional Requirement 1, FR-1).
2. **Find the candidates, and ask the Requestor to choose.** List the
   Harnesses the repository could become, and the repositories it could be
   set up in. Then ask the Requestor for one Harness and its repositories
   (FR-3). Read [`skills/confirm-harness.md`](skills/confirm-harness.md) for
   what to ask, and [`skills/discussion.md`](skills/discussion.md) for how.
   This step is done when the answer is written down as a document that
   matches [`schemas/discussion.output.schema.json`](schemas/discussion.output.schema.json).
3. **Check each repository.** If its root already holds a declaration,
   `<name>.json`, it is already set up, and you stop (FR-5).
4. **Record that you are starting.** Read
   [`skills/log-message.md`](skills/log-message.md).
5. **Follow the chosen Harness's own instructions.** Every Harness keeps them
   at the same path (FR-4):

   ```
   <name>/docs/bootstrap/initialization.md
   ```

   Here `<name>` is the name the Requestor chose, as it appears in that
   Harness's declaration, `<name>.json`.
6. **Leave a README at the repository's root, if it has none** (FR-8). Read
   [`skills/root-readme.md`](skills/root-readme.md).

If anything cannot be found or read along the way, record what failed (step
4's Skill) and stop (FR-6).

---

## Functional Requirements

A Functional Requirement is a rule the steps must meet. Each has a number, so
a step can name it: Functional Requirement 1 is FR-1.

| | rule |
|---|---|
| **FR-1** | Everything named here can be reached by opening files, and by nothing else. |
| **FR-2** | You start one Process, `initialize-harness`. The Processes `discussion` and `log-message` are started only by its steps. |
| **FR-3** | Only the Requestor chooses the Harness. You may shorten the list of candidates, but never choose between two. |
| **FR-4** | Every Harness keeps its set-up instructions at `<name>/docs/bootstrap/initialization.md`, so you can set up a Harness you have never seen. |
| **FR-5** | A repository whose root already holds a declaration is already set up. You record that and stop; you never set it up again. |
| **FR-6** | Anything that cannot be found or read is recorded, and stops the Process. Nothing is worked around. |
| **FR-7** | This directory holds no program code, so FR-1 stays true. |
| **FR-8** | When the set-up succeeds, the repository's root has a `README.md` naming the Harness and whether the set-up succeeded everywhere. An existing README is added to, never replaced. |

---

## Every file here

| file | kind | what it is |
|---|---|---|
| [`README.md`](README.md) | text | this page |
| [`AGENTS.md`](AGENTS.md) | text | sends an agent that reads `AGENTS.md` first to this page |
| [`bootstrap.json`](bootstrap.json) | declaration | this Harness's declaration: its Subgraphs and its files |
| [`schemas/graph.schema.json`](schemas/graph.schema.json) | schema | the shape of a declaration, and the definition of every term on this page |
| [`schemas/discussion.input.schema.json`](schemas/discussion.input.schema.json) | schema | what you know before asking the Requestor |
| [`schemas/discussion.output.schema.json`](schemas/discussion.output.schema.json) | schema | the Requestor's answer; a document matching it completes step 2 |
| [`scenarios/roles.json`](scenarios/roles.json) | data | the four Roles |
| [`skills/bootstrap-kg-navigation.md`](skills/bootstrap-kg-navigation.md) | Skill | how to open anything here |
| [`skills/confirm-harness.md`](skills/confirm-harness.md) | Skill | what to ask the Requestor |
| [`skills/discussion.md`](skills/discussion.md) | Skill | how to ask |
| [`skills/log-message.md`](skills/log-message.md) | Skill | how to record what you are doing |
| [`skills/root-readme.md`](skills/root-readme.md) | Skill | how to write the root README |
| [`skills/bootstrap-graph-emission.md`](skills/bootstrap-graph-emission.md) | Skill | writing this Harness's own Knowledge Graph as a data file |
| [`skills/bootstrap-graph-publication.md`](skills/bootstrap-graph-publication.md) | Skill | publishing that file |
| [`skills/package-manifest.json`](skills/package-manifest.json) | data | the list of Skills |
| [`processes/initialize-harness.bpmn`](processes/initialize-harness.bpmn) | diagram | the steps above |
| [`processes/discussion.bpmn`](processes/discussion.bpmn) | diagram | asking the Requestor (step 2) |
| [`processes/log-message.bpmn`](processes/log-message.bpmn) | diagram | recording what you are doing, and any failure |
