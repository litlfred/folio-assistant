# bootstrap

This directory is where an agent starts when it has been handed a repository
and knows nothing else about it. Everything here is a file to read: text
(`.md`), data (`.json`) and diagrams (`.bpmn`). Nothing here is a program, so
you need nothing installed to use it.

A capitalized word on this page is a defined term. It links to its definition
the first time it appears, and `[src]` beside it opens the schema that defines
it. Every definition is drawn on one page,
[`schemas/README.md`](schemas/README.md), from one file,
[`schemas/graph.schema.json`](schemas/graph.schema.json).

**Contents**

1. [What you are setting up](#what-you-are-setting-up): what a repository becomes
2. [Who takes part](#who-takes-part): you, the person who asked, and the rest
3. [User story](#user-story): what you are here to do, in one sentence
4. [Steps](#steps): the six steps, drawn and then in order
5. [Functional Requirements](#functional-requirements): the eight rules the steps meet
6. [Every file here](#every-file-here): what each file is

---

## What you are setting up

A [Knowledge Graph](schemas/README.md#knowledge-graph) ([src](schemas/graph.schema.json#/$defs/KnowledgeGraph)) is
information kept as files in a repository: things, and the named relations
between them. One file at its root, `<name>.json`, declares it. That file
gives its name and lists its
[Subgraphs](schemas/README.md#subgraph) ([src](schemas/graph.schema.json#/$defs/Subgraph)), the named directories
it is divided into.

A [Harness](schemas/README.md#harness) ([src](schemas/graph.schema.json#/$defs/Harness)) is what you use to work
with a Knowledge Graph. A Harness is a Knowledge Graph too, declared the same
way. This directory is the first Harness, `bootstrap`, declared by
[`bootstrap.json`](bootstrap.json).

**Setting up a repository means instantiating one or more different kinds of
Knowledge Graph Harness on the data in the repository.** A person chooses which
ones, and the choice is hard to undo.

---

## Who takes part

An [Actor](schemas/README.md#actor) ([src](schemas/graph.schema.json#/$defs/Actor)) is a person, an agent or a
program. Each Actor takes a [Role](schemas/README.md#role) ([src](schemas/graph.schema.json#/$defs/Role)), and
the four Roles here are declared in [`scenarios/roles.json`](scenarios/roles.json):

| Role | who plays it |
|---|---|
| **Bootstrapping Agent** | you: the agent setting the repository up |
| **Requestor** | the person who asked for it. Only the Requestor chooses the Harness. |
| **Knowledge Graph Data Store** | a repository: the one being set up, and any a Harness is read from |
| **Logger** | the record of what you did. Here, it is the conversation you are in. |

As the Bootstrapping Agent you have no Harness yet, so you have no
[Tools](schemas/README.md#tool) ([src](schemas/graph.schema.json#/$defs/Tool)) (programs to call). If a step
seems to need one, it belongs to the Harness you are about to set up, not to
this one.

---

## User story

> **As** the Bootstrapping Agent, **I want** to set up the repository I was handed as
> the Harness the Requestor chooses, **so that** everything added to it later
> is built on the right Harness.

The story ends in one of two ways, and both are acceptable: the Harness is set
up, or the reason it could not be is recorded.

---

## Steps

The steps are drawn as a
[Process](schemas/README.md#process) ([src](schemas/graph.schema.json#/$defs/Process)),
[`initialize-harness.bpmn`](processes/initialize-harness.bpmn). It is the only
Process you start. Each step names the
[Skill](schemas/README.md#skill) ([src](schemas/graph.schema.json#/$defs/Skill)) to read and the Functional
Requirement it must meet (see the next section).

```text
 1  Learn how to open files here
 |
 2  Find the candidates  --- ask --->  the Requestor chooses one Harness
 |
 3  Check each repository  --- already set up? --->  record it and stop
 |
 4  Record that you are starting
 |
 5  Follow the chosen Harness's own instructions
 |
 6  Leave a README at the repository's root, if it has none

    At any step: something cannot be found or read  --->  record it and stop
```

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

Grouped by directory. "Used in" names the step that reads the file; a file no
step reads says so.

**At the top**

| file | what it is | used in |
|---|---|---|
| [`README.md`](README.md) | this page | start here |
| [`AGENTS.md`](AGENTS.md) | points an agent that opens `AGENTS.md` first to this page | start here |
| [`bootstrap.json`](bootstrap.json) | this Harness's declaration: its Subgraphs and its files | step 1 |

**`schemas/`**: the shapes of the JSON files

| file | what it is | used in |
|---|---|---|
| [`schemas/README.md`](schemas/README.md) | every schema here drawn as boxes, and every term's definition | every step |
| [`schemas/graph.schema.json`](schemas/graph.schema.json) | the shape of a declaration, and the definition of every term on this page | step 1 |
| [`schemas/discussion.input.schema.json`](schemas/discussion.input.schema.json) | what you know before asking the Requestor | step 2 |
| [`schemas/discussion.output.schema.json`](schemas/discussion.output.schema.json) | the Requestor's answer; a document matching it completes step 2 | step 2 |
| [`schemas/requirement.schema.json`](schemas/requirement.schema.json) | the shape of a Requirement: statements made with SHALL, SHOULD, MAY or SHALL NOT | no step |
| [`schemas/model-registry.schema.json`](schemas/model-registry.schema.json) | the shape of `models/models.json` | no step |

**`processes/`**: the diagrams

| file | what it is | used in |
|---|---|---|
| [`processes/initialize-harness.bpmn`](processes/initialize-harness.bpmn) | the steps on this page, drawn | every step |
| [`processes/discussion.bpmn`](processes/discussion.bpmn) | asking the Requestor | step 2 |
| [`processes/log-message.bpmn`](processes/log-message.bpmn) | recording what you are doing, and any failure | step 4, and on failure |
| [`processes/ns.jsonld`](processes/ns.jsonld) | the elements the diagrams add (`skill`, `role`, `precondition`), written `bootstrap.processes:` | reading any diagram |

**`scenarios/`**: who takes part

| file | what it is | used in |
|---|---|---|
| [`scenarios/roles.json`](scenarios/roles.json) | the four Roles | every step |

**`skills/`**: instructions for one step each

| file | what it is | used in |
|---|---|---|
| [`skills/bootstrap-kg-navigation.md`](skills/bootstrap-kg-navigation.md) | how to open anything here | step 1 |
| [`skills/confirm-harness.md`](skills/confirm-harness.md) | what to ask the Requestor | step 2 |
| [`skills/discussion.md`](skills/discussion.md) | how to ask | step 2 |
| [`skills/log-message.md`](skills/log-message.md) | how to record what you are doing | step 4, and on failure |
| [`skills/root-readme.md`](skills/root-readme.md) | how to write the root README | step 6 |
| [`skills/bootstrap-graph-emission.md`](skills/bootstrap-graph-emission.md) | what this Harness's Knowledge Graph looks like as one data file | no step |
| [`skills/bootstrap-graph-publication.md`](skills/bootstrap-graph-publication.md) | where that file is published | no step |
| [`skills/package-manifest.json`](skills/package-manifest.json) | the list of Skills | no step |

**Other data**

| file | what it is | used in |
|---|---|---|
| [`models/models.json`](models/models.json) | which languages each model is good at, and whether a person checked; empty until one does | no step |
| [`glossary/glossary-ledger.json`](glossary/glossary-ledger.json) | every term the glossary has held, with when it first appeared and when it was retired | no step |
| [`test/results/`](test/results/) | what auditing this Harness found, one file per Skill, Process and Role | no step |
