# Schemas, drawn

<!-- Generated from the schemas in this directory. Change a schema, not this page. -->

Every JSON file bootstrap defines has a schema in this directory. This page
draws each one, so you can read it without reading JSON Schema.

How to read a drawing:

- Each box is one kind of JSON object. Its first line is its name.
- `*` marks a field that must be present.
- `[1]` means exactly one, `[0..1]` means optional, `[1..*]` means a list
  with at least one item, and `[0..*]` means a list that may be empty.
- A field that holds another object points to that object's box, below it.
- `[src]` opens the schema itself.

## Terms

Each defined term, in the words of
[`graph.schema.json`](graph.schema.json). A term whose shape is drawn below links to
its drawing; the rest are defined in words only.

### Knowledge Graph

Information kept as files in a repository: things, and the named relations between them. It is declared by one file at its root, `<name>.json`, which gives its name and lists its Subgraphs. Drawn in [Knowledge Graph declaration](#knowledge-graph-declaration). [src](graph.schema.json#/$defs/KnowledgeGraph)

### Subgraph

A named directory of a Knowledge Graph, declared with the Graph Kind or Kinds it holds. A Knowledge Graph has zero or more. Drawn in [Knowledge Graph declaration](#knowledge-graph-declaration). [src](graph.schema.json#/$defs/Subgraph)

### Graph Kind

What a Subgraph holds, such as skills, processes or schemas. A reader matches on it to decide whether to look inside. [src](graph.schema.json#/$defs/GraphKind)

### Asset

A single file a Knowledge Graph declares as its own, together with the part it plays, such as its README. Drawn in [Knowledge Graph declaration](#knowledge-graph-declaration). [src](graph.schema.json#/$defs/Asset)

### Harness

What an Actor uses to work with a Knowledge Graph: Skills, Processes, Roles and Tools. A Harness is itself a Knowledge Graph, declared the same way; bootstrap is the first Harness. [src](graph.schema.json#/$defs/Harness)

### Actor

A participant, whether a person, an agent or a program, that takes a Role in each Process it takes part in. [src](graph.schema.json#/$defs/Actor)

### Role

The part an Actor plays in a Process. A Process diagram draws each Role as one lane, and a Role carries the Skills its lane needs. [src](graph.schema.json#/$defs/Role)

### Process

A diagram of the steps, decisions and order of some work, with one lane per Role. It is written in Business Process Model and Notation (BPMN), a standard diagram format, in a `.bpmn` file. [src](graph.schema.json#/$defs/Process)

### Process Node

One element of a Process: a step, a decision, a start or an end. [src](graph.schema.json#/$defs/ProcessNode)

### Sequence Flow

An arrow in a Process, from one Process Node to the next. [src](graph.schema.json#/$defs/SequenceFlow)

### Skill

Written instructions an Actor follows to carry out one step of a Process, in a `.md` file. [src](graph.schema.json#/$defs/Skill)

### Tool

A program an Actor calls to carry out a step. A Harness may declare Tools; bootstrap declares none, because it runs nothing. [src](graph.schema.json#/$defs/Tool)

## Discussion Input

[src](discussion.input.schema.json)

The occasion for asking: what the agent already knows, and which unknown is still open. Deliberately small — a Bootstrapping Agent has read one README and can look nothing up, so an input it cannot populate is an input that stops the process.

```text
+-----------------------------------------------------------------+
| Discussion Input                                                |
+-----------------------------------------------------------------+
| * open               [1..*]  list of "harness" | "repositories" |
| * askedOf            [1]     Asked Of                           |
|   candidates         [0..*]  list of string                     |
|   knownRepositories  [0..*]  Known Repository list              |
|   context            [0..1]  string                             |
+-----------------------------------------------------------------+
  |
  +-- askedOf --> +------------------------------------+
  |               | Asked Of                           |
  |               +------------------------------------+
  |               | * kind  [1]     "person" | "agent" |
  |               |   id    [0..1]  string             |
  |               +------------------------------------+
  |
  +-- knownRepositories (each item) --> +--------------------------------------------+
                                        | Known Repository                           |
                                        +--------------------------------------------+
                                        | * url   [1]     string                     |
                                        | * role  [1]     "read-from" | "written-to" |
                                        |   note  [0..1]  string                     |
                                        +--------------------------------------------+
```

## Discussion Output

[src](discussion.output.schema.json)

What the exchange determined: which harness, which repositories, on whose word, and by what means. This document existing and conforming is what finishes the task — not that a conversation took place.

```text
+------------------------------------------------------------+
| Discussion Output                                          |
+------------------------------------------------------------+
| * outcome       [1]     "settled" | "unsettled"            |
|   harness       [0..1]  string                             |
|   repositories  [0..*]  Repository list                    |
|   determinedBy  [0..1]  "asked" | "assumed"                |
|   assumption    [0..1]  string                             |
| * answeredBy    [1]     Answered By                        |
| * exchange      [1..*]  Exchange list                      |
|   stillOpen     [0..*]  list of "harness" | "repositories" |
+------------------------------------------------------------+
  |
  +-- repositories (each item) --> +--------------------------------------------+
  |                                | Repository                                 |
  |                                +--------------------------------------------+
  |                                | * url   [1]     string                     |
  |                                | * role  [1]     "read-from" | "written-to" |
  |                                |   note  [0..1]  string                     |
  |                                +--------------------------------------------+
  |
  +-- answeredBy --> +------------------------------------+
  |                  | Answered By                        |
  |                  +------------------------------------+
  |                  | * kind  [1]     "person" | "agent" |
  |                  |   id    [0..1]  string             |
  |                  +------------------------------------+
  |
  +-- exchange (each item) --> +----------------------------+
                               | Exchange                   |
                               +----------------------------+
                               | * asked     [1]     string |
                               |   answered  [0..1]  string |
                               |   at        [0..1]  string |
                               +----------------------------+
```

Rules the drawing cannot show:

- If `determinedBy` is "assumed", `assumption` must be present.
- If `outcome` is "unsettled", `stillOpen` must be present.

## Knowledge Graph declaration

[src](graph.schema.json) · describes `<name>.json`

Information kept as files in a repository: things, and the named relations between them. It is declared by one file at its root, `<name>.json`, which gives its name and lists its Subgraphs. This schema is the shape of that declaration, and its `$defs` define every term bootstrap uses.

```text
+--------------------------------------+
| Knowledge Graph declaration          |
+--------------------------------------+
| * name         [1]     string        |
|   title        [0..1]  string        |
|   description  [0..1]  string        |
|   directories  [0..*]  Subgraph list |
|   assets       [0..*]  Asset list    |
+--------------------------------------+
  |
  +-- directories (each item) --> +---------------------------------------+
  |                               | Subgraph                              |
  |                               +---------------------------------------+
  |                               | * id           [1]     string         |
  |                               | * path         [1]     string         |
  |                               | * graphKinds   [1..*]  list of string |
  |                               |   description  [0..1]  string         |
  |                               +---------------------------------------+
  |
  +-- assets (each item) --> +---------------------+
                             | Asset               |
                             +---------------------+
                             | * id    [1]  string |
                             | * src   [1]  string |
                             | * role  [1]  string |
                             +---------------------+
```

## Model Registry

[src](model-registry.schema.json) · describes `models/models.json`

Which languages a model is good at, and whether a person checked. Only `human-validated` is ever acted on, and only a person can grant it.

```text
+------------------------------------------------+
| Model Registry                                 |
+------------------------------------------------+
| * $schema  [1]     = "folio-model-registry/v1" |
| * models   [0..*]  Model list                  |
+------------------------------------------------+
  |
  +-- models (each item) --> +----------------------------------------------------------------------------------+
                             | Model                                                                            |
                             +----------------------------------------------------------------------------------+
                             | * id                  [1]     string                                             |
                             | * title               [1]     string                                             |
                             | * preferredLanguages  [0..*]  list of string                                     |
                             | * validation          [1]     "unverified" | "self-reported" | "human-validated" |
                             |   validatedBy         [0..1]  string                                             |
                             |   validatedOn         [0..1]  string                                             |
                             |   note                [0..1]  string                                             |
                             +----------------------------------------------------------------------------------+
```

## Requirement

[src](requirement.schema.json)

What a harness, or something built with one, must do, said so it can be checked: a titled set of numbered statements, each with a level (SHALL, SHOULD, MAY, SHALL NOT) and one sentence. A test run points at a statement as `req:<slug>#<key>`; the requirement does not list its tests. Statement keys are unique within a requirement.

```text
+----------------------------------------------------------------------------+
| Requirement                                                                |
+----------------------------------------------------------------------------+
| * id            [1]     string                                             |
| * title         [1]     string                                             |
| * description   [1]     string                                             |
|   status        [0..1]  "proposed" | "in-force" | "superseded" | "retired" |
|   derivedFrom   [0..*]  list of string                                     |
| * actors        [0..*]  list of string                                     |
| * statements    [1..*]  Statement list                                     |
|   tags          [0..*]  list of string                                     |
|   proposedIn    [0..1]  string                                             |
|   supersededBy  [0..1]  string                                             |
+----------------------------------------------------------------------------+
  |
  +-- statements (each item) --> +-----------------------------------------------------------------+
                                 | Statement                                                       |
                                 +-----------------------------------------------------------------+
                                 | * key          [1]     string                                   |
                                 | * label        [1]     string                                   |
                                 | * conformance  [1]     "SHALL" | "SHOULD" | "MAY" | "SHALL NOT" |
                                 | * requirement  [1]     string                                   |
                                 |   kind         [0..1]  "functional" | "non-functional"          |
                                 |   activity     [0..1]  string                                   |
                                 |   capability   [0..1]  string                                   |
                                 |   benefit      [0..1]  string                                   |
                                 |   category     [0..1]  string                                   |
                                 |   actors       [0..*]  list of string                           |
                                 |   dependsOn    [0..*]  list of string                           |
                                 +-----------------------------------------------------------------+
```

Rules the drawing cannot show:

- If `status` is "superseded", `supersededBy` must be present.
- In each item of `statements`: if `kind` is "functional", `category` must be absent.
- In each item of `statements`: if `kind` is "non-functional", `activity`, `capability` and `benefit` must be absent.
