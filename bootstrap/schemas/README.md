<!-- kg:subgraph:begin -->
# schemas

The schemas bootstrap is checked against: `graph.schema.json`, the shape of a declaration and the definition of every term bootstrap uses; and the input and output of the discussion Process. Their published `$id`s do not change when a file moves.

Part of [Bootstrap](../README.md), declared as `schemas`, holding `schemas`.

| file | what it is | used by |
|---|---|---|
| [`discussion.input.schema.json`](discussion.input.schema.json) | Discussion Input |  |
| [`discussion.output.schema.json`](discussion.output.schema.json) | Discussion Output |  |
| [`glossary-ledger.schema.json`](glossary-ledger.schema.json) | Glossary Ledger |  |
| [`graph.schema.json`](graph.schema.json) | Knowledge Graph declaration |  |
| [`model-registry.schema.json`](model-registry.schema.json) | Model Registry |  |
| [`requirement.schema.json`](requirement.schema.json) | Requirement |  |
<!-- kg:subgraph:end -->

## Schemas, drawn

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

### Terms

Each defined term, in the words of
[`graph.schema.json`](graph.schema.json). A term whose shape is drawn below links to
its drawing; the rest are defined in words only.

#### Node

One unit of recorded knowledge, held in one file or as one identifiable part of a file, and named by an IRI. [src](graph.schema.json#/$defs/Node)

#### Node Kind

A name for a class of Nodes, together with its Node Schema: a JSON Schema that every Node of that kind satisfies. [src](graph.schema.json#/$defs/NodeKind)

#### Node Instance

A Node that states its Node Kind and satisfies that kind's Node Schema. [src](graph.schema.json#/$defs/NodeInstance)

#### Graph Kind

A named set of Node Kinds whose instances may be held together. [src](graph.schema.json#/$defs/GraphKind)

#### Declaration

A JSON document, `<name>.json`, that gives a name and lists entries, each naming either a directory of Node Instances with the Graph Kinds they belong to, or a single file with its purpose. [src](graph.schema.json#/$defs/Declaration)

#### Subgraph

A named subset of Node Instances: a Declaration's directory entry, with its id, its directory and its Graph Kinds. Drawn in [Knowledge Graph declaration](#knowledge-graph-declaration). [src](graph.schema.json#/$defs/Subgraph)

#### Asset

A Declaration's file entry: one file about the repository itself, such as its README, with its stated purpose. Drawn in [Knowledge Graph declaration](#knowledge-graph-declaration). [src](graph.schema.json#/$defs/Asset)

#### Extension

A field of a Declaration, or of one of its entries, that is not defined here. A reader that does not recognise the field ignores it, and the rest of the Declaration keeps its meaning. [src](graph.schema.json#/$defs/Extension)

#### Knowledge Graph

A semi-static description of one or more datasets or information repositories as of one version: a set of Node Schemas and Node Instances, and the Declaration that divides them into Subgraphs. Published as JSON-LD, each Subgraph is a named graph. Drawn in [Knowledge Graph declaration](#knowledge-graph-declaration). [src](graph.schema.json#/$defs/KnowledgeGraph)

#### Dependency

One Knowledge Graph depends on another when its Declaration names the other. The dependent's Nodes may refer to the other's; the other's never refer back. [src](graph.schema.json#/$defs/Dependency)

#### Content

The Node Kinds whose instances describe the datasets and other information a Knowledge Graph is about: their records, documents, catalogues and terms, and links to other sources of knowledge inside or outside the repository. [src](graph.schema.json#/$defs/Content)

#### Actor

A person, an agent or a program that can carry out work. [src](graph.schema.json#/$defs/Actor)

#### Task

A unit of work an Actor carries out: what it needs to begin, and what it produces. [src](graph.schema.json#/$defs/Task)

#### Skill

The Node Kind whose instances are natural-language instructions an Actor follows to carry out one Task. [src](graph.schema.json#/$defs/Skill)

#### Tool

The Node Kind whose instances describe a program an Actor may run while carrying out a Task: what it takes, what it produces, and how to run it. [src](graph.schema.json#/$defs/Tool)

#### Role

The Node Kind whose instances name a responsibility an Actor takes on when carrying out Tasks, and list the Skills that responsibility needs. [src](graph.schema.json#/$defs/Role)

#### Process Node

One element of a BPMN diagram: a Task, a decision, a start or an end. [src](graph.schema.json#/$defs/ProcessNode)

#### Sequence Flow

An arrow in a BPMN diagram, from one Process Node to the next. [src](graph.schema.json#/$defs/SequenceFlow)

#### Process

The Node Kind whose instances coordinate Tasks: a BPMN diagram whose Process Nodes are joined by Sequence Flows, in lanes that each name the Role an Actor takes to carry out that lane's Tasks. [src](graph.schema.json#/$defs/Process)

#### Harness

A Knowledge Graph whose Subgraphs hold Skills, Tools, Roles and Processes: what an Actor needs in order to work with another Knowledge Graph. [src](graph.schema.json#/$defs/Harness)

### Discussion Input

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

### Discussion Output

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

### Knowledge Graph declaration

[src](graph.schema.json) · describes `<name>.json`

A Declaration. Any field not listed here is an Extension: A field of a Declaration, or of one of its entries, that is not defined here. A reader that does not recognise the field ignores it, and the rest of the Declaration keeps its meaning.

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
  +-- directories (each item) --> +---------------------------------------------------------------------------------------------------------------------------------------+
  |                               | Subgraph                                                                                                                              |
  |                               +---------------------------------------------------------------------------------------------------------------------------------------+
  |                               | * id           [1]     string                                                                                                         |
  |                               | * path         [1]     string                                                                                                         |
  |                               | * graphKinds   [1..*]  list of = "skills" | = "schemas" | = "scenarios" | = "processes" | = "models" | = "swimlane-glossary" | string |
  |                               |   title        [0..1]  string                                                                                                         |
  |                               |   description  [0..1]  string                                                                                                         |
  |                               +---------------------------------------------------------------------------------------------------------------------------------------+
  |
  +-- assets (each item) --> +---------------------+
                             | Asset               |
                             +---------------------+
                             | * id    [1]  string |
                             | * src   [1]  string |
                             | * role  [1]  string |
                             +---------------------+
```

### Model Registry

[src](model-registry.schema.json) · describes `models/models.json`

Which languages a model is good at, and whether a person checked. Only `human-validated` is ever acted on, and only a person can grant it.

```text
+------------------------------------------+
| Model Registry                           |
+------------------------------------------+
| * $schema  [1]     = "model-registry/v1" |
| * models   [0..*]  Model list            |
+------------------------------------------+
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

### Glossary Ledger

[src](glossary-ledger.schema.json)

Every term a Knowledge Graph's Processes have ever named, with the date each was first seen and the date it stopped being used. The glossary itself is regenerated each time; this is the one fact that cannot be, so a retired term is never silently reused.

```text
+-----------------------------------------+
| Glossary Ledger                         |
+-----------------------------------------+
| * $schema   [1]  = "glossary-ledger/v1" |
| * instance  [1]  string                 |
| * concepts  [1]  map of key to Concept  |
+-----------------------------------------+
  |
  +-- concepts (each item) --> +---------------------------------+
                               | Concept                         |
                               +---------------------------------+
                               | * prefLabel  [1]  string        |
                               | * firstSeen  [1]  string        |
                               | * retiredOn  [1]  string | null |
                               +---------------------------------+
```

### Requirement

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
