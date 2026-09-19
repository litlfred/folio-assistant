---
# folio-assistant-cy4p
title: 'BPMN ENGINE: a Tool node, with downcompilation per coding agent'
status: todo
type: task
created_at: 2026-09-19T17:04:01Z
updated_at: 2026-09-19T17:04:01Z
parent: folio-assistant-ahvw
---


**Uncaptured owner requirement, found 2026-09-19T17:0x** while checking
[#363](https://github.com/litlfred/folio-assistant/issues/363) for replies.
The ask was made at 09:20 and had reached no bean in eight hours — the
`issue-working` re-check is what surfaced it, which is the case that skill
exists for.

Owner, [#363 comment](https://github.com/litlfred/folio-assistant/issues/363#issuecomment-5740727385):

> as part of tools, if bpmn-engine (including skills to downcompile to
> different languages per coding agent need).

## Two halves

**The engine as a Tool node.** BPMN execution already exists here —
`workflow_start` / `workflow_next` / `workflow_complete` over
`src/workflow/`, with state committed under `beans/workflows/`. What does
not exist is a **Tool** declaration for it. "as part of tools" reads as:
the engine should be a first-class node other instances can discover and
depend on, not an implementation detail of this repo's MCP server.

**Downcompilation "per coding agent need".** The harder half, and the one
to scope before building. Different coding agents consume instructions in
different forms, so a diagram may need emitting AS something a given agent
can follow — a skill body, a checklist, a state machine in its own config
format. This is a generator FROM the BPMN, not a second source of truth.

## The trap this must not fall into

**A downcompiled artefact is a rendering, never an authority.** The moment
one can be edited and fed back, there are two answers to "what is the
process" and they are free to disagree. That is `render:bpmn`'s existing
discipline — the SVGs are generated and `render:bpmn:check` fails if
stale — and the same must hold here, including a staleness gate.

## Before drawing anything

Ask what a target agent actually cannot do with the diagram today. If the
answer is "read XML", the fix may be a projection rather than a compiler.

## Done when

- [ ] the scope question above is answered: which agents, needing what form
- [ ] the engine is declared as a Tool node and the declaration is audited
      by `kg:audit`
- [ ] any downcompiled artefact is generated, with a `--check` gate, and
      carries in its own text that it is generated
