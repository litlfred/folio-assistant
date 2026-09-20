---
name: schema-management
description: >
  Manage a schema over its life — add one, change one, read the schema graph
  and its viewer, and act on what the reader could not determine. The layout
  rule lives in `directory-conventions`; the entity question lives in
  `data-modelling`; this is the work in between.
consulted: true
---

# Managing a schema — the graph, the viewer, and the three answers that are not "fine"

**This skill does not restate where schemas live or how they are laid out.**
[`directory-conventions`](directory-conventions.md) §"What lives in the
`schemas` graph" owns that — the Zod `.ts` is authoritative, every other form
is generated, and a rendering is never where a fix lands. A rule stated twice
is a rule free to drift, and the copy a reader finds first is the one with no
test behind it.

Nor does it restate how to *model*. [`data-modelling`](data-modelling.md) owns
the question that matters before any of this — **what are the things, and what
is true of each of them exactly once?** — with three worked failures from this
repository where a fact sat on the wrong entity.

What is here is the work between those two: reading the graph the schemas
form, and keeping it readable.

## The schema graph is a graph, and it is published

`scripts/schema-graph.ts` reads every **declared** `schemas` directory and
returns declarations plus the edges between them.
`scripts/gen-schema-viz.ts` publishes that as a projection and a viewer.
`bun run schema:graph` prints the counts; `schema:viz` writes; `schema:viz:check`
is the gate.

**It reads every declared directory, not one**, and that is not a convenience.
`directoryForGraph` throws when several directories declare a graph — the
`wggr` guard, which exists because returning the first silently once resolved
`cat-harness` to `schemas/` and wrote 37 sidecars against the wrong subjects on
a run that exited 0. Several instances declare a `schemas` graph, so the
singular question has no answer, and **the fix is never to pick one.** A view
of one of several reports a corpus that does not exist.

Resolution is scoped **per directory** for the same reason one level down: two
instances may each have a `foo.ts`, and a global index by module stem would
resolve one instance's import to another instance's export — the same failure,
silently, with every edge still computing.

## Why the AST, and not the two things that look easier

Both obvious alternatives **erase the edges a schema graph is made of**, and it
is the same erasure at two levels. Know this before proposing either again:

- **The published JSON Schema.** `harness-schema-export` renders with
  `$refStrategy: "none"`, which is correct for a dereferenceable document — a
  consumer following an `$id` gets something self-contained. The cost is that
  a referenced type is not a named thing in the output at all; it is an
  anonymous object repeated at each use site. A diagram drawn from it is
  disconnected boxes.
- **The TypeScript type checker.** `z.infer<typeof FooSchema>` resolves to a
  deeply expanded structural type, so asking what `Foo.bar` is returns the
  whole of `Bar` inlined rather than a reference to it.

So the **syntactic** form is not the compromise. It is the only one of the
three that still holds `bar: BarSchema` as a reference to a named thing.

## The three answers that are not "fine", and what each one means

The reader reports three things that are easy to read as noise and are not.
**Check them when you add or change a schema** — the viewer surfaces all three.

| answer | what it means | what to do |
|---|---|---|
| **`undetermined`** | the walker saw an expression it does not model, and says what it saw | usually correct and nothing to do — a bare object literal is not a Zod call. If it is a shape you expect to be modelled, the walker is missing a case. |
| **`unresolved`** | a name the module BINDS, imported from a module inside this graph, that resolves to no declaration | a real finding. Usually a `const` array of literals imported as a vocabulary. Ask whether it wants to be a schema. |
| **`external`** | a name bound to a non-relative import, or to something in this module that is not a declaration | resolved correctly, outside this graph. Nothing to do. |

**`undetermined` is never rendered as an empty type**, and that is the whole
reason it exists as a state: a declaration with no fields and a declaration
whose expression could not be read are different answers, and rendering them
alike reports a clean run over something never looked at.

**The fix for noise is never a deny-list.** The first version of the reader
collected every identifier and reported `z` as the graph's most-referenced
missing declaration, 175 times. A list of names to ignore would have been a
second, drifting statement of this graph's vocabulary. The fix was to ask what
the module BINDS: `z` is bound, to `zod`, which is not a relative import and
therefore not part of this graph. Distinct unresolved names fell from 150 to 6,
and the 6 are real.

## Adding or changing a schema — the loop

1. **Model first** — [`data-modelling`](data-modelling.md). A field on the
   wrong entity is the error no schema check can catch.
2. Write the Zod schema in `.ts`. The type is `z.infer<typeof Schema>`, never
   declared alongside it.
3. **Tag the module** — `@graphNode schema`, or `@graphNode none — <reason>`
   with a reason. `check:schema-nodes` fails an untagged module, because an
   untagged one is silently absent from the published graph and absence is the
   one failure a consumer cannot tell apart from "this instance has none".
4. `bun run schema:viz` and look at your declaration in the viewer. Its kind,
   its fields, its generalisation, and what it references — and the three
   answers above.
5. Run the gates: `check:schema-nodes`, `schema:viz:check`, `typecheck`,
   `bun test`.

## Keeping the projection's gate honest

The projection is committed, so it has a staleness gate — and **a staleness
gate is only worth having if its red means an omission.**

This one nearly failed that test. The projection carried each declaration's
line number, so any edit *above* a declaration made it stale: a merge that
shifted two declarations by 36 lines went red with nothing else in 895 KB
different. A red meaning "somebody added a blank line" teaches contributors to
regenerate reflexively rather than to read the finding, which is the opposite
of what a gate is for.

**A line number is an editor coordinate, not a property of a declaration.** It
is kept on the reader and dropped from the projection. The general rule, worth
applying to any generated artefact you gate:

> If a red can be caused by a change that alters nothing the artefact
> describes, the artefact is carrying something it should not.

The same reasoning removed the per-module declaration list: a declaration
already names its module, so the list was one fact written twice.

## Where the boundaries are

- **`schemas/` holds content.** `BASE_GRAPH_KINDS.schemas` carries
  `holds: "content"` — a shape is the subject matter of the schema graph, and
  it is true before anything is validated against it. See
  [`content-context-and-state-graphs`](content-context-and-state-graphs.md).
- **Adding a graph KIND is a different job** —
  [`directory-conventions`](directory-conventions.md) §"Adding a graph kind",
  and decide which layer owns it first: if it renders, it is not the harness's.
- **Publishing a schema at a dereferenceable `$id`** is
  `harness-schema-export`, a separate rendering with a separate consumer.
  Generate as many renderings as have a consumer, and no more.
- **An unwired generator is worse than none.** Three schema generators were
  written here before the current one and all three rotted, because nothing
  ever asked whether their output still matched their input. If you add a
  fourth rendering, it ships with a `--check` twin in the gate set or it does
  not ship.
