---
# folio-assistant-rapm
title: 'PAGE: Knowledge Graph — the subgraph taxonomy, which way the arrows flow, and how each is used'
status: completed
type: feature
priority: high
created_at: 2026-09-21T16:21:34Z
updated_at: 2026-09-21T19:50:29Z
parent: folio-assistant-2upx
---

Owner's structure, 2026-09-21, captured as given:

- **Schema subgraph** — everything has JSON-LD / JSON Schema definitions describing all managed content. Comes EMPTY except for what is self-describing; harnesses add knowledge content assets.
- **Content subgraph** — instances of knowledge assets, with Schemas and Skills.
  - **Scenarios subgraph** (a kind of Content) — Actors (Machine, Human, Agent), the Roles they can play (Software Developer, SMART Guideline Author, Translator, ...), and User Stories.
  - **Process subgraph** (a kind of Content) — business process via BPMN, DMN. References the Context graph.
    - **Skill subgraph** (a kind of Content) — the Skills needed to accomplish a Task in a Process.
    - **Tools subgraph** (a kind of Content) — the software Tools that can accomplish a Skill, allowing several ways to be tested along a spectrum from fully deterministic to agentic/non-deterministic.
  - **Context subgraph** — README, Memories: what changes the context a business process executes IN, but does not change DURING execution. Overlaying a context is what makes testing across contexts repeatable.
- **Harness / workflows subgraph** — JSON-LD rendered, visualisers, docs. Its requirements and what it does.
- **Dynamic state subgraph** — beans, todos, fsh-guts.

The page MUST describe the core concepts of each subgraph, WHICH WAY THE ARROWS FLOW, and how each is used in the system.

**Two terminology decisions the owner flagged, which belong here:**
- Consolidate on terms — prefer **workflows** over **processes**.
- The CRDM connection MUST be tighter: CRDM output is workflows, User Stories, Roles — so CRDM develops the User Stories for Processes, and Scenarios is where they live.

A companion page on **JSON / JSON-LD** is needed for the Schema subgraph to point at.

Depends on `zzmr` (the KG's own structure) and should not restate it.


## Added 2026-09-21 — GraphKind subtyping, and nodes that declare subgraph directories

Owner, verbatim:

> 'for content graph, GraphKind (this is an ugly name) can subtype and nodes can declare directories as containing subgraphs, like <stub>/Skills/voices should be declared in cat-harness as sub-graph (double check!) then any dependents like folio-assistant can add voices in folio-assisant/Skills/voices that they want to be made available.'

Two asks:

1. **`GraphKind` SHOULD subtype.** The name is called out as ugly and is a
   rename candidate in its own right.
2. **A node SHOULD be able to declare a directory as containing a SUBGRAPH**,
   so a dependent instance can contribute into the same subgraph. The worked
   example is voices: cat-harness declares the subgraph, and a dependent such
   as folio-assistant adds its own voices under its own tree, which are then
   available.

### The "double check!" — checked, and the premise does not hold today

`cat-harness/cat-harness.config.json` declares voices as a **top-level
directory**, not as a subgraph under `skills/`:

    id=voices          path=voices/       graphs=['voices']
    id=cat-harness     path=skills/       graphs=['cat-harness']

So the file is `cat-harness/voices/technical-writer.json`, NOT
`cat-harness/skills/voices/…`. The `technical-writer` voice added this day sits
at the declared path, matching `milnor.json` beside it and `who-style-guide/voices/`.

That makes the ask a REAL CHANGE rather than documentation of what exists:
either voices moves under `skills/` as a declared subgraph, or the subgraph
mechanism is expressed some other way. Note the contribution pattern the owner
wants already half-exists by a different route — cat-harness declares
`who-iris/skills/`, `kg-navigation/skills/` and `large-datasets/skills/` as
`cat-harness`-kind directories, which is dependents contributing skills without
any subgraph concept. Whether that IS the mechanism, or the thing the subgraph
mechanism should replace, is the decision to take before writing the page.


## Added 2026-09-21 — two terminology decisions, with their measured scope

### 1. Knowledge Graph is **KGraph**

Owner, twice: *"lets make it KGraph for Knowledge Graph"*. It is a Glossary
Term, so it is Capitalized on every use, per the `technical-writer` voice.

Measured surface, so the sweep is scoped rather than blind:

| occurrence | files |
|---|---|
| `termIri("KnowledgeGraph")` — an EMITTED IRI | 4 |
| "Knowledge Graph" in prose | 13 |
| "knowledge graph" lower-case in prose | 152 |
| `kgRef` / `kgDirectories` identifiers | 9 / 17 |
| `kg:audit` and its sidecars | 137 |

Three separate decisions, deliberately not one commit:

- **The IRI — DONE 2026-09-21, and it was NOT breaking.** `termIri("KnowledgeGraph")`
  -> `termIri("KGraph")` on the owner's go-ahead. Checked before acting rather
  than assumed: the namespace is unchanged (both resolve under
  `…/cat-harness/ns#`, so only the local name moved), and **no committed file
  carries a graph-kind IRI** — `ns:export` writes to `_kg/ns.jsonld`, a build
  output. That is exactly what `namespaces.ts` predicted would make it cheap:
  *"Nothing served `<base>/ns` until this branch, so no consumer holds any of
  these IRIs."* Once the vocabulary IS published, the same rename would need an
  alias carried forever, as `kg` -> `cat-harness` needed `GRAPH_KIND_ALIASES`.
- **The prose** is the 152-file body. It SHOULD be swept as part of the
  consolidation pass (`88mg`) rather than by find-and-replace, because most
  occurrences are incidental lower-case mentions and some are quotations of
  other people's text, which MUST NOT be silently rewritten.
- **The identifiers** (`kgRef`, `kgDirectories`, `kg:audit`) are a third
  question. `kg:audit` alone appears in 137 files, mostly committed QA
  sidecars, so renaming the script renames data.

### 2. A directory's `graphs:` field lists KINDS, not graphs

This is the conflation that makes `GraphKind` read as ugly, and it is in the
DATA rather than the type. From `cat-harness.config.json`:

    { "id": "voices", "path": "voices/", "graphs": ["voices"] }

`"voices"` is not a graph. It is the name of a KIND, registered in
`BASE_GRAPH_KINDS` with a `type` IRI, `renderable`, `holds` and a `summary`.
The graph is the thing at `voices/`. Three directories declare
`graphs: ["voices"]` today and `cat-harness` is declared by **22** — so read
literally, twenty-two directories each assert they ARE the cat-harness graph.

**The minimal fix is the field, not the type**: `graphs:` -> `graphKinds:`.
Then `GraphKind` names exactly what it is, and "the voices graph" can mean one
directory's contents without ambiguity.

The owner also asked whether the type could simply be `Graph`. The
multiplicity above is the argument against: one kind already has up to 22
instances, and the subgraph direction recorded above — dependents contributing
voices into a shared subgraph — leans on the class/instance distinction
harder, not less. If a rename is still wanted, `GraphType` is the safe option;
`GraphDefinition` matches this repository's `ActorDefinition` idiom but
collides with FHIR's own `GraphDefinition` resource.
