# Directory conventions — what an instance declares it scans

Every instance carries an **`agent-harness.json`** at its repository root. It declares the directories the instance scans for content,
and what **kind of graph** each one holds.

Schema and resolution: `schemas/agent-harness.ts`.

**It is the *harness's* schema, not folio-assistant's.** `agentic-harness` is
the layer that defines Roles, Skills, Tools and these conventions, and every
other instance inherits from it — so an instance need not be a folio-assistant
to carry one. A Tool repo or a Test repo carries the same declaration. Issue
[#223](https://github.com/litlfred/folio-assistant/issues/223), Phase 0.3.

## Why directories rather than a content type

The obvious reading of "an instance holds zero or more content instances" is a
list of instances under one `contentType`. That shape does not survive the
five-repo split, for a reason worth stating once:

**The things `agentic-harness` holds are not folios.** They are Tool
definitions, a knowledge graph of skills and workflows, and a schema graph.
None renders as a document and none has a `contentType` in the
`document | paper` sense. A model that gives every instance a content type
forces the harness to claim one it does not have.

So the general object is **an instance with directories, each holding a
graph**. `folio` is one graph kind among several.

## The graph kinds

| kind | holds | renderable |
|---|---|---|
| `folio` | authored content | **yes** — the just-the-docs pipeline renders it to a website |
| `tools` | Tool definitions, themselves nodes in the KG | no |
| `kg` | skills, workflows, roles — the instance's own knowledge graph | no |
| `schemas` | schema definitions, self-declared in the smart-base manner | no |

`renderable` is the **only** behavioural distinction in the table, and it is
what makes `folio` special. The others are graphs that tools read. Nothing
stops a consumer treating them uniformly — that is the point of making them all
graphs — but only a renderable one is wired to the site build.

## The conventional layout

```
agentic-harness/          folio-assist-core/
  agent-harness.json        agent-harness.json
  tools/     → tools        folio/     → folio
  kg/        → kg           (inherits tools/, kg/, schemas/)
  schemas/   → schemas
```

`agentic-harness` declares `tools/`, `kg/` and `schemas/`.
`folio-assist-core` declares **only** `folio/` and inherits the other three.

## Inheritance

An instance inherits its dependencies' directories, walked depth-first through
`dependencies.folioAssistant` — the same order `schemas/folio-config.ts` uses
for skills and translations. Deepest dependency first, root last, so the root
wins.

**Overrides match on the directory's `id`, never on its `path`.** An instance
that wants its knowledge graph somewhere other than `kg/` redeclares the `kg`
id with a different path:

```jsonc
{ "id": "kg", "path": "graph/knowledge/", "graph": "kg" }
```

Matching on path instead would make two knowledge graphs out of one
relocation, and every consumer would scan a directory that is not there. An
override also **keeps the inherited position** in the scan order rather than
moving to the end — a relocation should not reshuffle what is scanned first.

## Three states, as everywhere else here

- **No `agent-harness.json`** → `readDeclaration` returns `undefined`. An
  instance not yet migrated is ordinary, and callers fall back to today's
  conventions. Not an error.
- **Present but unreadable** → **throws.** A declaration nobody can parse
  leaves every consumer scanning the wrong directories, which is strictly worse
  than not having one.
- **An unknown graph kind** → rejected, not accepted and ignored.

## Declare what exists

A directory that is declared but absent is worse than one that is missing:
every consumer scans nothing and reports a clean run over it — the same defect
bean `dh4f` found in thirty pipeline scripts, where three were passing over a
corpus they could not read.

This repository's own declaration is the worked example. It is **pre-split**,
so it declares `schemas/` and `skills/` — which exist — and deliberately does
**not** declare `tools/`, `kg/` or `folio/`, which do not exist here yet. Note
also that its `kg` id points at `skills/`: ids are stable across a relocation,
paths are not.

## The declaration is itself a graph

`toJsonLd()` projects a declaration into the folio namespace: each directory is
a node with an `@id` and an `@type`. The set of directories an instance scans
is then queryable by the same machinery as anything else in the knowledge
graph, rather than being configuration only one module understands.

The authored form is the stored one and the graph form is derived — one truth,
not two. `readDeclaration` accepts **either**, and a round-trip test pins that:
the projection emits `@type` *instead of* `graph`, so reading the published
form back without the reverse lookup silently loses the one field that says
what a directory holds.

## Skills are KG content

The `kg` graph is where skills live, and that is why they are addressed through
the declaration rather than by path. An agent asks `skill_list` / `skill_fetch`
for a skill; it does not open `skills/<something>.md` from memory. An instance
may site its `kg` anywhere — this repo's `kg` id points at `skills/` — and a
downstream instance inherits its dependencies' skills through the same
inheritance rules above. A hardcoded path breaks on the first relocation, which
is the whole reason overrides match on `id`.

**Not yet true end to end.** `resolveSkillDirs` (`schemas/folio-config.ts`)
computes the cross-instance overlay and has **no caller**, so skill discovery is
root-only in practice today and a dependency's skills are not reachable. Stated
here rather than implied, because an agent that assumes inheritance works will
silently miss half its instructions.

## Layering — a harness module must not import the content vocabulary

The declaration schema needs the platform's IRI namespace to mint `@type`
values. That namespace used to live in `schemas/jsonld.ts`, which is
`folio-assist-core`'s **content** vocabulary — block kinds, DoCO structural
types, SPAR citation terms. Importing it would have made `agentic-harness`
depend on the content model for its own type IRIs: a `harness → core` edge,
already the largest wrong-direction group `bun run check:partition` reports.

It is now `schemas/namespaces.ts`, a leaf that imports nothing, classified to
the harness. The direction only works one way round — **core may import the
harness; the harness may not import core** — so a constant both layers need has
to live at or below the harness. Putting it in core reintroduces the edge.

The first attempt was a duplicated constant in the harness module with a test
asserting the two stayed equal. That works and is worse: **a drift guard is an
admission that there are two definitions.** Extract instead, and re-export from
the old home so existing importers are untouched.

`agent-harness.test.ts` pins the property structurally — it asserts the module
does not import `./jsonld` or `./block-kinds`. Reach for that test when adding
anything else at the harness layer.

## Adding a graph kind

One entry in `GRAPH_KINDS` (`schemas/agent-harness.ts`): its `@type` IRI, its
`renderable` flag, and a one-line summary. The Zod enum, the JSON-LD projection
and the reverse lookup all derive from that object, so nothing else needs
touching — and a kind that is added without deciding `renderable` will not
compile.
