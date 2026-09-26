---
# folio-assistant-x89g
title: 'BEAN GRAPH: beans/ is a real graph with defs and workflows nodes; paths leave harness config'
status: completed
type: task
priority: normal
created_at: 2026-09-18T17:56:09Z
updated_at: 2026-09-23T19:25:46Z
parent: folio-assistant-zzmr
---

## The ask

Owner, in chat 2026-09-18:

> instead of beans/ and beans/workflow lets do beans/ beans/defs and
> beans/workflows with beans/ being a bean graph with a definitions node and
> workflow node

Clarified by the owner when asked whether the graph is a declaration or an
artefact:

> a real graph, move content out of harness config. make beangraph schema.

## What changes

| | before (bean `8xzw`) | after |
|---|---|---|
| bean files | `beans/*.md`, flat | `beans/defs/*.md` |
| workflow state | `beans/workflow/` | `beans/workflows/` |
| `beans/` itself | just a directory | a **real graph artefact** with two nodes |
| where paths are declared | `harness.config.json` → `harness.workPlan` / `harness.workflowState` | the bean graph |

New `BeanGraphSchema`. `workPlan` and `workflowState` come **out** of
`HarnessDirsSchema`; `interaction` stays, because it is not bean content.

## Why this is better than what it replaces, not just different

`8xzw` put the paths in `harness.config.json`, which meant the same path was
written in two places — there and `.beans.yml` — and needed
`check:harness-dirs` to stop them drifting. That check was correct given the
design.

Making the graph the single declaration **removes one of the two**, rather
than adding a third. The `.beans.yml` duplication CANNOT be removed — the
`beans` binary is third-party and does not read our files — so that one
check stays and still earns its place. But harness config no longer
restates what the graph already says.

## Builds on 8xzw, does not revert it

`8xzw` is completed and stays completed. It did the hard parts and they are
all reused:

- moving out of dot-prefixed directories (the visibility problem)
- `scripts/beans-fallback.ts`, the WRITABLE no-CLI path
- the `.beans.yml` drift check

This is a follow-on refinement of the layout, per the owner's decision.

## Consumers to repoint

- `schemas/harness-config.ts` — drop `workPlan` / `workflowState`
- `scripts/check-harness-dirs.ts` — read the graph, not the harness block
- `scripts/tests/harness-dirs.test.ts`
- `harness.config.example.json`
- `src/workflow/store.ts` — `WORKFLOW_DIR` is compiled in as
  `join("beans", "workflow")`
- `.beans.yml` — `beans.path` → `beans/defs`
- `AGENTS.md` and the skills that name `.beans/`

## Verification gate

`git mv` for the 153 bean files so history follows. Then: the `beans` CLI
lists and creates against the new store, `scripts/beans-fallback.ts`
round-trips with it, `check:harness-dirs` green, full hard gate.

## What would falsify the approach

If a consumer reads the bean path in a way that cannot be redirected. The
third-party binary is the known one and is handled by `.beans.yml`. If a
second such consumer turns up, the "single declaration" claim is wrong and
the design needs revisiting rather than forcing.

## Summary of Changes

Closed 2026-09-23 **on evidence, not authorship**, in the owner's "go through remaining beans" sweep. A read-only check against `main` called it landed, and it was re-verified before closing:

`beans/beans.json` declares the `defs` and `workflows` nodes, and its schema is `cat-harness/schemas/bean-graph.ts`. `.beans.yml` has `path: beans/defs`. `workflow/store.ts` has `WORKFLOW_DIR = join("beans","workflows")`. `bun run check:harness-dirs` reports `✓ consistent`.
