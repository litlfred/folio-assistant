---
# folio-assistant-rapm
title: 'PAGE: Knowledge Graph — the subgraph taxonomy, which way the arrows flow, and how each is used'
status: todo
type: feature
priority: high
created_at: 2026-09-21T16:21:34Z
updated_at: 2026-09-21T16:21:34Z
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
