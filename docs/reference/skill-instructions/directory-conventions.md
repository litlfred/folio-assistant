---
layout: default
title: Directory conventions
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/directory-conventions.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/directory-conventions.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/directory-conventions.md){: .fa-edit-source }

{% raw %}
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

The vocabulary is **open**, and split across two layers.

| kind | declared by | holds | renderable |
|---|---|---|---|
| `tools` | **harness** | Tool definitions, themselves nodes in the KG | no |
| `kg` | **harness** | skills, workflows, roles — the instance's own knowledge graph | no |
| `schemas` | **harness** | schema definitions, self-declared in the smart-base manner | no |
| `workplan` | **harness** | work items — what is being worked on (`beans/`) | no |
| `process` | **harness** | running BPMN instances — where each got to (`beans/workflow/`) | no |
| `folio` | **`folio-assist-core`** | authored content | **yes** — just-the-docs renders it to a website |

**Why the work plan is the harness's and not core's.** The test is whether the
harness *has* one, and it does: an instance has work whether or not it has
content, and `agentic-harness` carries a `beans/` store for its own. A Tool repo
and a Test repo have work plans too. That is a different test from the one that
sent `folio` to core, which is about capability — only core can render.

**Why `workplan` and `process` are two kinds.** They sit in nested directories
and are easy to conflate, which is exactly why they are separated. `workplan` is
WHAT IS BEING WORKED ON — authored by people and agents, carrying judgement.
`process` is WHERE A RUNNING PROCESS GOT TO — a token marking the interpreter
owns, that no human is invited to edit. A consumer asking for the work plan must
not be handed BPMN instance state.

> **Nesting is not inheritance.** `beans/workflow/` sits inside `beans/` and
> holds a *different* graph. A consumer scanning a declared directory must not
> assume it owns everything beneath it — check whether a deeper path is itself
> declared. Today the two happen to be distinguishable by extension (`.md`
> beans, `.json` instance state), but that is a coincidence of the current
> layout, not a contract.

`renderable` is the **only** behavioural distinction, and it is why `folio` is
not the harness's to declare: **`agent-harness` is not self-documenting.** It
has no just-the-docs pipeline and no webpage content type, so a layer that
cannot render must not own the renderable kind. Core registers it, through the
same load-time registration the contribution mechanism uses.

This is enforced rather than described. A bare `GraphKindRegistry` — the
harness with nothing above it — genuinely **does not know `folio` exists**, and
a declaration naming it is refused with an error listing the kinds that *are*
known. A test pins that. The version where `folio` stays in the harness's table
with a comment saying core owns it reads fine and means nothing: the harness
would still know the string, and the boundary would live only in prose.

**Registering is idempotent for an identical definition and throws on a
conflicting one** — the same rule `schemas/contributions.ts` follows, so a
diamond dependency graph reaching core twice is not an error while two layers
claiming one name is.

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
`dependencies.folioAssistant` — the same order `schemas/harness-config.ts` uses
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

**Not yet true end to end.** `resolveSkillDirs` (`schemas/harness-config.ts`)
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

Decide which layer owns it first — **if it renders, it is not the harness's.**

- A harness kind: one entry in `BASE_GRAPH_KINDS` (`schemas/agent-harness.ts`).
- A kind belonging to a layer above: a module like
  `schemas/folio-graph-kind.ts` that calls `registry.register(name, def)` at
  import, so the harness never learns the name until that layer is loaded.

Either way the definition is `@type` IRI + `renderable` + summary, and the
JSON-LD projection and the reverse lookup both derive from it. A kind added
without deciding `renderable` will not compile.

Note the declaration's `graph` field is validated **against the registry at
read time**, not by a closed Zod enum. An enum would be built at module load —
before core has registered `folio` — so it would reject the one kind the entire
rendering pipeline depends on.
{% endraw %}
