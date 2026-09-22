---
layout: default
title: Harness instances
parent: Architecture
nav_order: 6
---

# What a harness instance IS — schematics, visualisations, tools
{: .no_toc }

1. TOC
{:toc}

---

> **Owner statement, 2026-09-20, recorded on bean `yj32`.** This page is the
> settled part of it. The parts that are still the owner's to decide are in
> §"Open, and named rather than guessed" — they are not written as if decided,
> because a guessed answer in a published document is how a wrong one becomes
> canon.

## The sentence

> **A harness instance adds schematics to a knowledge graph, builds
> visualisations for them, and describes the tools to use and manage them.**

Each clause is a different obligation, and an instance that does one without
the others is incomplete rather than minimal:

| clause | what it obliges | where it is declared |
|---|---|---|
| *adds schematics to the KG* | declare the directories it scans and each one's graph kind | `<name>.json` — [directory conventions](../../skills/folio-core/directory-conventions.md) |
| *builds visualisations for it* | a declared subgraph a reader cannot see is a subgraph nobody checks | the renderer, per subgraph |
| *describes the tools* | a Tool is a KG node, not a shell string somebody remembers | `tools/` |

That triple is why `2krx` exists as a QA axis: **every time an instance names a
directory as a subgraph, it needs a visualiser and a documentation entry**, and
it is a finding if there is no skill and no tool for it. The declaration is
cheap to write and the other two are what make it real.

## The four directories every instance has

| directory | what it holds | who writes it |
|---|---|---|
| `docs/` | the documentation pipeline — rendered to gh-pages through just-the-docs | the pipeline, from authored pages |
| `library/` | ingested L1 sources | ingestion |
| `uploads/` | the incoming queue, before anything is decided about it | a person, or an agent on their behalf |
| `folio/` | **the active workspace** | whoever is working |

**`folio/` is not `docs/`, and the difference is the point.** `docs/` is what a
reader browses after the work is done; `folio/` is where the work happens —
publishing, managing the process, authoring and reviewing content. An instance
with a populated `docs/` and an empty `folio/` has a published record and no
workshop.

`uploads/` and `library/` are declared in this repository today and **have no
renderer**, which is exactly the `2krx` finding above rather than an oversight
to be quietly tolerated.

## The default rendering

A harness instance renders, by default, as one thing with two halves:

- **LHS navigation + `docs/`** — the documentation pipeline, one themed section
  per instance in dependency order. Collapsed, a section is information about
  that instance; opened, it shows that instance's docs navigation and the
  display subgraphs **that instance declares**. Attribution follows
  declaration, so a directory renders under the instance that declared it.
- **A folio/Miro-like board** — for accessing, authoring and reviewing content,
  with `beans/` and `todos/` managing the pipeline.

Both sit on the instance's **own theme's ground**: the theme's avatar art is
the background, the way a shared Miro board has one. This is why the scrim
ratios were measured over **pure black** rather than over the art actually in
use — arbitrary art sits behind that text, so the binding case is the darkest
one, and the measured 9.25–9.36:1 clears AAA against it.

It is a **readable** interface. It is a writable one *only* where there is a
writable datastore — a conditional, not a promise, and read-only is the floor.

### Layout is chosen, not fixed

A folio page may carry its own theme, but layout **defaults to choosing
dynamically** on display size and usability, best-fit among three:
**mobile**, **laptop** and **square**. The same three the theme art is already
cropped for, which is not a coincidence — a layout with no crop for it has
nothing to render on.

## Where the requirement starts — bootstrap is the exception

[The minimum `cat-harness`](cat-harness-minimum.html) carries a one-line
admission test from the owner's own #223 revision:

> **If it produces something a human looks at, it is not the harness.**

Read flatly against "an instance renders by default", the two cannot both
hold. **They are not flat.** The owner settled this on 2026-09-20: the
requirement is a *floor that rises*, not a rule applied uniformly.

| layer | visualiser / workflow visualiser | its own `.json` / `.jsonld` |
|---|---|---|
| `bootstrap` | **exempt** — it is the navbar **footer** | **required** |
| `cat-harness` | required | required |
| everything above | required | required |

**CatBootstrap is the exception, and what it owes instead is its graph.** In the
owner's words, its `.json`/`.jsonld` *"is its existence"* — a layer that cannot
emit its own graph has not shown it is a graph. So bootstrap is not simply
dropped from the requirement: it trades the visualiser for a criterion it
cannot fail quietly.

### The exemption is declared data, not a special case in a checker

`bootstrap/bootstrap.json` carries a `renderExemption` — `of`, `reason` and
`owes` — and `2krx`'s axis reads it through `isExemptFrom` rather than testing
an instance name. A name literal would state a rule true only for the instance
somebody remembered, and a vendored or renamed bootstrap would silently
reacquire the obligation it was excused from.

**`owes` is required by the schema**, because an exemption with no substitute
is a hole and a list of holes is the silence list `2krx` says an opt-out must
not become. bootstrap's names the two skills that govern its emission, and
a test asserts the files it names exist.

**The guard against spreading is global, not local.** The declaration is local
because only the instance knows why; `renderExemptionProblems` takes every
instance in the repository, because *"only the bottom layer may claim this"* is
a fact about the stack that a per-instance check structurally cannot see. A
second claimant fails `check:instance-render`. At most one, not exactly one — a
repository that vendors no bootstrap has nothing to exempt, and failing it
for that would be asking it to declare something to stay green.

What it owes lives in **`bootstrap/render/`**, a declared subgraph holding
[`bootstrap-graph-emission`](https://github.com/litlfred/folio-assistant/blob/main/bootstrap/render/bootstrap-graph-emission.md)
and
[`bootstrap-graph-publication`](https://github.com/litlfred/folio-assistant/blob/main/bootstrap/render/bootstrap-graph-publication.md).
Until that directory existed the emission discipline lived in a code comment in
`kg-export.ts` and a YAML comment in `docs-site.yml` — which is why it was
rediscovered rather than read, and why one of those comments still called the
document *committed* four days after it stopped being.

**`cat-harness` is where the rest begins to apply**, and the reason is an
obligation rather than a convention: cat-harness is what supplies the layers
above with `folio/`. A layer that hands its dependents a folio and renders
nothing itself is asking of them what it did not do. Concretely that means a
minimal just-the-docs rendering in `cat-harness/folio/` describing what a folio
is, and `cat-harness/folio/render/` for the rendering skills and tools.

This is the **same shape** the workflow split already has — bootstrap keeps the
bare minimum, `cat-harness/workflows` elaborates — so it is a second instance
of one rule rather than a new one.

*Tracked: `hfkl` (bootstrap's exemption and its `render/` subgraph — **done**), `ohx6`
(`cat-harness/folio/`), `1hvo` (`cat-harness/skills/theming/`), `7po1` (the workflow
split this parallels).*

## Open, and named rather than guessed

Four questions from `yj32`, unanswered at the time of writing. Two are
expensive to get wrong:

1. **Where does the background live?** A theme's `backdrop` is a
   *sticky-scoped* concept today. Making it the page ground is a different CSS
   surface — `body`, or a board element — and probably a different crop set: a
   sticky's crop is chosen for a **card**, and a page is a different aspect
   entirely.
2. **What is the writable datastore?** gh-pages is static. The artifact
   database, a local server, and a GitHub write path through editor links are
   three different answers with three different security postures.
3. **Which subgraphs are "display" subgraphs?** Every declared `graphs` entry,
   or an opt-in subset?
*(A fourth, "what does KG-DS expand to", is now answered — see below.)*

## KG-DS is the Knowledge Graph Data Store, and its machine is **git**

Not a new concept: `bootstrap/scenarios/roles.json` has declared a role with
exactly this id and title all along. Its description names the machine:

> A git repository, reached either through the git CLI or through a forge's
> API. It is where a declaration and its graph are READ from and where a new
> instance's declaration is WRITTEN to. It is `actedUpon`: it holds and serves,
> and takes no part in deciding what should happen — which is why it carries no
> skills and why naming one for it would be a lie about what it does.

`actorKinds: ["system"]`, `skills: []`, `actedUpon: true`.

**This is why "writable interface *if* writable datastore" is a real
conditional rather than hedging.** The store is a git repository, so writing
means a commit through the CLI or a forge API — which is available to an agent
with a checkout and credentials, and *not* available to a reader browsing a
static gh-pages site. The same page can therefore be readable to everyone and
writable only to some, and that is a property of the store rather than of the
rendering.

**The role carries no skills on purpose.** It holds and serves and decides
nothing, so giving it a skill would claim it participates in a decision it does
not make — which is the `actedUpon` flag doing real work rather than
decorating.

## Related

- [`yj32`](https://github.com/litlfred/folio-assistant/blob/main/beans/defs/folio-assistant-yj32--harness-as-interface-a-harness-instances-default-r.md)
  — the epic, with the owner's statement verbatim
- Its children: `603s` (the LHS navigation), `6lb8` (the board), `pb04` (edit
  and view affordances on content), `7po1` (`workflows/state` owning the beans
  and todos skills)
- [Minimum `cat-harness`](cat-harness-minimum.html) — the layering this page
  is in tension with
- [Directory conventions](../../skills/folio-core/directory-conventions.md) —
  the declaration schema and every graph kind
