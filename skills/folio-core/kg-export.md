---
name: kg-export
description: >
  Serialize an instance's knowledge graph to one JSON document, for
  publication and inspection. Read when asked to visualize, audit or share the
  KG, and before adding a node type to the export.
---

# KG export — publishing the graph as data, not as a page

**`agentic-harness` has no renderer.** `folio` is the only `renderable` graph
kind and it belongs to `folio-assist-core`, so the harness cannot put its
knowledge graph on a page the way a folio puts a chapter on one. That boundary
is deliberate and this does not move it.

**The way out is that the export is data.** One JSON document describing the
graph; drawing it is somebody else's job, and may be a static viewer, an
external tool, or nothing at all. Publishing data does not make the harness
self-documenting — it makes it *inspectable*, which is the thing that was
missing.

Per [`skills-and-tools`](skills-and-tools.md):

| | |
|---|---|
| **this skill** | produce the serialization — generic, no host named |
| **the Tool** | publish it somewhere — today `pages-publish` (GitHub Pages) |

A GitLab Pages or object-store Tool satisfies the same skill later. Nothing in
this skill names a host, and nothing in it should.

## The edges are the reason to publish

A list of skills is not a graph, and a JSON array of them would not have been
worth a pipeline. What makes the export worth having is the relations that
already exist on disk and that **no tool surfaces**:

- **activity → skill.** Every BPMN activity may carry
  `<folio:skill ref="…"/>`, so the export can say which process step is
  implemented by which skill.
- **activity → role.** A BPMN lane is the role that performs the step.
- **skill → package**, and a skill's **two facets**: its instruction body
  (`<name>.md`) and its I/O contract (`schemas/skills/<name>/`).

That last one is the one to understand before editing the exporter. **A name
may have an instruction body, an I/O contract, or both — they are facets of one
skill, not two kinds of skill.** So the graph is keyed by *name*, which is also
what a BPMN ref uses. Keying by file instead produces two disconnected node
sets and loses the relation entirely.

It is also what makes "declared somewhere, written nowhere" visible: measured
on `main` 2026-09-18, of 135 skills only **11 have both**, 113 are prose with
no declared I/O, and 11 are an I/O contract with no prose. None of that was
visible before the export existed.

## A partial graph must never pass for a whole one

This is the rule, and it was learned by breaking it in the module that states
it. The first exporter looked in six instruction-body directories, did not know
about `schemas/skills/`, and reported **11 BPMN skill refs as dangling** — they
resolve fine. A partial graph had been produced and would have been published
as a complete one.

**Why that is worse than an error.** A consumer of the JSON cannot distinguish
a skill that is absent from one that was never collected: both are simply not
in `@graph`. Counts look plausible either way and nothing fails. It is the
`dh4f` shape — a clean run over a corpus the tool could not read.

Three consequences, all of which the implementation carries:

1. **A source that cannot be read goes in `problems[]` and the export exits
   non-zero.** Publishing is blocked, rather than a truncated file being
   deployed.
2. **`counts` by type ships with the graph**, so a consumer can see at a glance
   that a corpus it expected is missing, without re-deriving it.
3. **The invariant is asserted against something outside the exporter's own
   view.** `scripts/tests/kg-export.test.ts` requires every skill a *diagram*
   names to appear — and `check:workflow-refs` independently guarantees those
   refs resolve against the real skill locations. So if the exporter's notion
   of where skills live ever narrows again, the test fails. An invariant
   checked only against the exporter's own collection would have passed the
   original bug.

## Adding a node type

1. **Decide it is in this graph.** The `kg` graph holds skills, processes,
   roles, capabilities and the directory declaration. **Beans are not in it** —
   `beans/` is its own graph kind with its own nodes (`defs`, `workflows`), and
   folding the work plan into the KG re-merges exactly what was separated.
2. **Give it an `@id` under the folio namespace and an `@type`.** Both are
   asserted by test; a node with neither is not a graph node.
3. **Report what you could not read**, in `problems[]`. Never `continue`
   silently past a parse failure.
4. **Say which edges it carries.** A node type that relates to nothing is a
   list, and belongs in a list.

## Running it

```sh
bun run kg:export                      # → _kg/kg.json  (gitignored)
bun run kg:export -- --out path.json
```

The output is a **build artifact**, deliberately not committed: it is a
snapshot of a tree that changes every commit, so a committed copy is stale by
construction and invites the drift `5o3a` describes. CI regenerates it on every
publish.

> **Do not read `.claude/skills/registry.json` for this.** It is a runtime
> manifest, not the graph: measured 2026-09-18 it reported **23** skills
> against 126 on disk, because it reads only `.claude/skills/local/*.json`.
> Package skills appear in it as bare name lists with no instruction body, and
> processes, the graph-kind registry and the declaration are absent entirely.
> It is also uncommitted and published nowhere. The two coexist; only one is
> the graph.
