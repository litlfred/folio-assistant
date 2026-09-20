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

## What the graph structurally CANNOT see — measured, not guessed

The reader sees a reference when one schema names another. It sees nothing when
a reference is carried as a **string id**, because `actorId: z.string()` holds
no syntactic link to the schema it names. Neither would JSON Schema, and
neither would the type checker: the information is not in the types at all.

**Measured against `schemas/assistant-schema.puml`**, 266 lines of UML a person
drew by hand, used as a control:

| relation the diagram draws | reproduced by the reader |
|---|---|
| composition (`*--`) — a nested schema | **14 of 15** |
| association (`-->`) — a foreign key by id | **0 of 9** |

A clean split, and it names the limit exactly. So the viewer states it —
permanently in the header, and again on any type carrying id-style fields —
because a diagram that omitted a whole class of relation *silently* would be
the "rendered as nothing" failure this repository works to avoid. An
undrawn association is **invisible, not absent**.

If you want those edges drawn, they have to be **declared**: the id field must
say what it points at. That is a modelling change, not a reader change, and it
belongs to [`data-modelling`](data-modelling.md).

### The control worked in both directions

The same run found the hand-drawn diagram wrong: it draws
`SkillDefinition *-- SkillSchemaRef : schemas`, and `SkillDefinitionSchema`
has no `schemas` field at all. That corroborates bean `3lbz`, which found
`SkillDefinition.schemas` had no readers and its only referencing code was a
script nothing invokes.

**That is why the `.puml` is kept rather than retired.** A hand-drawn model is
a cheap control for a generated one, and in one run it found a blind spot in
the reader *and* a stale relation in itself.

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
5. Run `check:schema-nodes`, `typecheck` and `bun test`.

`schema:viz:check` is worth running locally and is deliberately **not** a CI
gate (owner, 2026-09-20). The projection derives from the WHOLE repository, so
on a fast-moving repo the check reddens when somebody else merges rather than
when you forget — which is not an omission, and not what a gate is for. The
site build runs the writer at deploy, so nothing PUBLISHED goes stale; what can
lag is the committed copy, which exists to be browsable.

## Keeping the projection's gate honest

The projection is committed. It HAD a staleness gate, and the gate came out —
because **a staleness gate is only worth having if its red means an
omission**, and this one's did not.

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

## Where a viewer publishes — TWO rules, not three

Owner, 2026-09-20:

> i want two rules.... not three. one is cat-harness handling the `library/`
> dir which has who-iris assets in it. one is who-iris handler to mock current
> iris website.

| rule | form | what it is |
|---|---|---|
| **1 — a handler renders a kind's assets** | `<base>/<handler>/<kind>/<optional subject>` | cat-harness's machinery over some graph. `<base>/cat-harness/library/who-iris/` |
| **2 — an instance presents itself** | `<base>/<instance>/` | who-iris mocking the IRIS website |

The handler is the instance doing the rendering, the kind names what it
renders, and the **subject is optional** — a page with no subject is the view
over every subject.

**A subject page must NEVER be published at `<base>/<subject>/<kind>/`.** That
is rule 2's namespace, and a viewer parked there squats on the instance's own
site. An earlier draft was about to publish `who-iris/library/` exactly there,
on a misreading of "path to dir handled" as the page's address rather than as
what the page shows.

`viewerPlacement` in `gen-schema-viz.ts` is the single implementation, shared
with the library viewer — two statements of one placement rule are two answers
the moment either moves. It also computes the page's link back to its
projection from the page's own depth, because a literal `../assets/…` keeps
parsing and fetches nothing once a page gains a level.

**One projection serves every page.** A scoped page filters client-side on a
`SCOPE` constant; a second JSON per subject would be the same facts written
N+1 times, free to disagree the moment one is regenerated. Counts are scoped
too — reporting the graph-wide edge total on a page showing nine declarations
claims 512 edges among those nine.

### `docs/` is the same shape, and its subject means something specific

Owner, same day:

> `<base>/cat-harness/docs/` is where all harness user documentation is... so
> documentation at `<base>/cat-harness/docs/who-iris/` is more documentation
> ABOUT iris, how it is ingested etc. **not the iris content**. source content
> is repo root `who-iris/docs`. part of cat-handler `docs/` handler is to look
> out for `docs/` directories in harness kinds.

So a subject page under a handler is **about** its subject, rendered by the
handler — never the subject's own content relocated. The content stays in the
subject's own `docs/`, and the handler's job includes looking for those
directories.

**Measured 2026-09-20 and not yet true:** only `cat-harness` has a `docs/`
directory and only it declares one, with `dependents: "skip"` — which is
precisely what stops a dependent from getting its own. Nothing was declared
against an absent directory here, because a declared-but-absent directory is
the `dh4f` defect. Bean `n0nf` carries the same `skip` finding from the root's
side.

## Editing a viewer — no backticks## Editing a viewer — no backticks

Both viewers are a whole HTML document inside one TypeScript template literal.
A backtick **anywhere** inside it — including in a JavaScript comment in the
embedded script — terminates the string, and the failure surfaces as a parse
error a couple of hundred lines from the mistake. It has happened twice.

`schemas/viz-generators.test.ts` imports both generators, so a stray backtick
reddens the suite rather than only the next person's generator run. Run it
before assuming a generator change is fine.

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
