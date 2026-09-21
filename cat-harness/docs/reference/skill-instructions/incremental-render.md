---
layout: default
title: 'Incremental render'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/incremental-render.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/incremental-render.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/incremental-render.md){: .fa-edit-source }

{% raw %}
# Incremental render — the cache is easy, the cascade is the work

Owner, 2026-09-20, bean `9c34`:

> *"new skill for staging rendernig.... dont rerender the whole thing... if
> main render is not stale, copy that to staging render pipleine as cahche.
> trigger rerender only on assets that have changed and downstream depndent
> index."*

Three steps. **Only the third is hard**, and it is the one that fails quietly:

1. **Seed** — start from a previous render rather than from nothing.
2. **Re-render what changed** — the steps whose inputs moved.
3. **Re-render what DEPENDS on them** — and this is the whole bean.

## Why step 3 is the bean

A page that was not re-rendered **looks exactly like a page that was.** There
is no visible difference between a correct cache hit and a stale one, so an
incremental render that gets the dependency graph wrong ships wrong pages and
reports a clean build. That is the `xom7` shape — *a red workflow looks exactly
like a green one from in here* — moved into the render.

Everything below follows from taking that seriously.

## The two edges, one mechanism

| edge | example | one change means |
|---|---|---|
| **projection** | `ingestion-notes.html` ← `iris-dspace.md` | one source file → one page |
| **index** | `community-list.html` ← every catalogue node | one **member** → the whole index |

The index edge is the one people forget: **an index is derived from a SET, so
it goes stale when a member changes even though the index file itself did
not.**

They differ in what a reader should expect and **not** in what the runner must
do — if any declared input changed, the step re-runs, and the step's own
`--check` decides which outputs actually differ. So one declaration expresses
both, and the distinction lives in what a human reads there.

**The downstream half needs no new mechanism.** `needs` already orders the
pipeline, and a step whose dependency re-ran must re-run too. One edge, two
uses.

## A step declares GRAPH KINDS, not paths

`RenderStep` carries two ways to say what it reads, and the second is the one
to use:

| field | what it names | when |
|---|---|---|
| `inputs` | repository-relative files or directories | a path that is not a declared graph — a config file, a script's own fixtures |
| `inputGraphs` | graph **kinds** from `<name>.json` — `cat-harness`, `beans`, `schemas`, … | anything the declaration already locates |

The first draft used `inputs` throughout and `check:declared-paths` rejected
nine literals. **It was right.** A second answer to *where do the skills live*
goes stale the moment a directory moves, and the failure is silent in the
worst direction: the render goes on hashing a path that is not there, finds
nothing, and reports the step unchanged. Under-declaration does not look like
under-declaration.

### The subprocess, and why there is one

`render-pipeline.ts` is in the **harness** layer. Resolving a graph kind means
`readDeclaration`, which validates **every** kind in the declaration — and this
repository declares a `folio` directory whose kind is registered by **core**,
on the argument (written on `schemas/folio-graph-kind.ts`) that a layer which
cannot render must not own the renderable kind. So the harness layer cannot
resolve *any* kind in-process without importing core, which `check:partition`
rejects.

The three options were: spell the paths as literals (rejected, and rightly);
import core (rejected, and rightly); or **ask across the boundary the way the
pipeline already asks every renderer it runs** — by spawning one.
`cat-harness/scripts/declared-dirs.ts` is that third option: core-layer, one
line of JSON on stdout, `{graph: [dirs]}`.

**A failure prints nothing to stdout and exits non-zero**, so the caller cannot
read *could not resolve* as *declares nothing* — the distinction this whole
skill turns on. The pipeline reports it:

> `Graph kinds could not be resolved here, so every step that declared only
> graphs re-rendered: <reason>`

and every graph-declared step becomes undeclared, which always re-renders. Safe
direction, **said out loud**. An earlier version of this was correct and
silent — it degraded to a full render without a word, so the feature was inert
(0 steps cached) and nothing in the output said why.

### The cost: a graph is coarser than a file list

`kg-current` declares the whole `cat-harness` graph, so **editing one skill
re-renders all ten steps** — where a literal file list would have re-rendered
four. That is a real loss and it is the right trade: over-declaring costs
needless runs, under-declaring ships stale pages that look fresh. A finer
declaration is available whenever a step's reads can be expressed without
spelling a declared path.

## Hash content, never mtime

`mtime` is the obvious shortcut and it is wrong twice: a fresh checkout
rewrites every mtime, so CI would re-render everything; and a file touched but
unchanged re-renders for nothing. Hash the **content**, and hash the **path
alongside it** — moving a file is a change, and an index keyed on filenames
notices.

Sort before hashing, **by codepoint**. `readdirSync` order is not stable across
machines, and `localeCompare` is ICU-dependent — a seed written on one machine
would mismatch on another for no reason anybody could see. `byCodepoint` in
`render-selection.ts` is the comparator, and it exists because the first draft
used `localeCompare`.

## Could-not-determine always re-renders

Four states send a step to the "run it" pile, and **none of them is an error**:

| state | why it runs |
|---|---|
| inputs changed | the obvious one |
| something it `needs` re-ran | the cascade |
| the seed's manifest does not mention it | absent is not fresh — it may never have run |
| **it declares no inputs** | it has not said what it reads, so nothing can be concluded |

And three at the build level: **no manifest at all** is a full render; a
manifest that is unparseable or carries the wrong schema tag is treated as
absent; and **graph kinds that could not be resolved** turn every
graph-declared step into the fourth row above. **A corrupt manifest is never
partially believed** — half a cache is worse than none, because the half that
is wrong is invisible.

This is the repository's standing rule applied to rendering: *could-not-check
is never green.* Here it costs a re-render, which is the cheap direction.

## Under-declaring is the dangerous direction

A step whose real input is not listed keeps a stale output **and looks exactly
like one that re-rendered**. A step that over-declares costs one needless run.
So when unsure, list it.

`bun run render:order` names every step that declares no inputs, because those
are the ceiling on how incremental a build can be — and a step that always
re-renders should be a decision (`alwaysRun`, with a reason) rather than an
omission nobody noticed.

## Measured, on this repository

`bun run render` over ten steps, 2026-09-21, after the move to `inputGraphs`:

| build | wall | steps |
|---|---|---|
| full, writing a seed | **3.9 s** | 10 ran |
| seeded, nothing changed | **0.9 s** | 2 ran, **8 served from the seed** |
| seeded, one bean touched | **1.1 s** | 4 ran, 6 served |
| seeded, one skill file touched | **3.8 s** | 10 ran, **0 served** |

The last row is the coarseness above, measured rather than asserted: a skill
edit moves the `cat-harness` graph, `kg-current` reads that graph, and
everything `needs` its way back to `kg-current`. The bean row is what a
narrower graph buys — `beans` reaches only `docs-pages` and `state-dashboards`.

The two that always run are `bootstrap` (pending — nothing to cache yet) and
`kg-dynamic` (`alwaysRun`: it exports the graph *after* stage 2 has
contributed, so its input is that output rather than a source file).

**Report the cached steps as cached, never as a pass.** In this pipeline a
"skip" already means *its input never rendered*, which is a much worse fact —
so a served-from-seed step gets its own mark (`=`). And the counts must add
up: the first draft reported *"10 ran … 8 served from the seed"*,
double-counting eight of them, because the runner records a step as having run
whenever the callback returned no error and a cached step returns no error by
doing nothing. A build report that sums to more than its own steps is one
nobody trusts the rest of.

## Usage

```sh
bun run render                                   # full
bun run render:order                             # order + which steps are cacheable
bun run render --write-manifest <path>           # full, and record the inputs
bun run render --seed <path>                     # incremental against that record
bun run render --seed <old> --write-manifest <new>
```

## Not built

**Seeding from the published render.** The manifest and the selection are
here; copying a previous build's OUTPUT into place before the run is a
deployment step and belongs with `feature-staging.yml`. Until it exists, a
seeded run skips steps whose inputs are unchanged but has nothing to serve —
so use `--seed` only where the previous output is already in place.

## Related

- `scripts/render-selection.ts` — the selection, the manifest, and the hash.
- `scripts/declared-dirs.ts` — the graph-kind resolver, and why it is a process.
- [`directory-conventions`](directory-conventions.md) — what a graph kind is
  and where `<name>.json` declares it.
- [`ci-health`](ci-health.md) — the same third-state discipline one level out.
- Bean `9c34`.
{% endraw %}
