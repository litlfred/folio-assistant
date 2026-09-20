---
layout: default
title: Subgraph viewers
nav_order: 14
lang: en
---

# Subgraph viewers
{: .no_toc }

A harness instance declares the directories it holds and the **kind of graph**
in each. Two of those graphs now have a page you can open.

1. TOC
{:toc}

---

## Why these pages exist

A directory nobody can see is one nobody checks. Measured on this instance,
2026-09-20: **19 declared subgraphs had no way to look at them**, and the two
most depended on were among them — `schemas/`, whose shapes everything else is
validated against, and `library/`, which every knowledge-graph reference to a
source resolves *through*.

Bean `2krx` states the rule this is the first half of: **every directory an
instance names as a subgraph needs a visualiser, a documentation entry, and a
governing skill.** Three separate requirements, because they fail differently
— nothing renders it, nothing says what it is for, and nothing an agent can
invoke against it. This page is the second of the three for these two graphs;
[`schema-management`](reference/skill-instructions/schema-management.html) and
the library-ingestion skills are the third.

`bootstrap` is exempt from the visualiser requirement and not from the others:
it is the navbar footer, and what it owes instead is its own `.json`/`.jsonld`
— *"that is its existence"*.

## The schema graph

**[`/cat-harness/schemas/`]({{ '/cat-harness/schemas/' | relative_url }})** — every declaration in
every declared `schemas` directory, with the edges between them.

- A **faceted index**: search, filter by kind, filter by module.
- A **detail panel**: fields with their types, optionality and doc comments;
  what the declaration references and what references it.
- A **per-type UML neighbourhood**, drawn as a class box with its
  generalisations above it and its field references below, each labelled with
  the field it goes through.

There is deliberately **no whole-corpus class diagram**. Hundreds of
declarations and hundreds of edges render as a wall that looks like a data
model and answers no question about one — the same argument the knowledge-graph
viewer already made and won. The diagram is a *view over the projection*, so
the projection carries every edge and another view costs nothing to add.

### Reading it

Three of the states it shows are easy to mistake for noise:

- **`undetermined`** — the reader saw an expression it does not model, and
  **says what it saw**. This is never rendered as a type with no fields,
  because "no fields" and "could not be read" are different answers.
- **`unresolved`** — a name the module binds, from a module inside this graph,
  that resolves to no declaration. A real finding, usually a vocabulary
  constant.
- **`external`** — bound to something outside this graph. Resolved correctly;
  nothing to do.

### What the diagram cannot show

A reference carried as a **string id** is not drawn, and this is a structural
limit rather than a gap: a field declared as a plain string holds no link to
the schema it names, so nothing syntactic — and nothing in JSON Schema or the
type checker either — can recover it.

Measured against `schemas/assistant-schema.puml`, a hand-drawn UML diagram
used as a control: **14 of 15** compositions reproduced, **0 of 9** id
associations. The page says so permanently, and again on any type carrying
id-style fields, because an undrawn association is **invisible, not absent**.

The same comparison found the hand-drawn diagram wrong in one place, which is
what a control is for.

The data is at `assets/schemas/index.json` and is the same file the page
reads; anything else may draw it.

## The library — the L1 corpus

**[`/cat-harness/library/`]({{ '/cat-harness/library/' | relative_url }})** — every entry, and the
`uploads/` queues feeding them.

Two views over one projection, because they answer different questions:

- **Listing** — every column sortable, every metadatum visible. *Which is
  biggest? Which has no OCR? Which came from which upload?*
- **Desktop** — the corpus as tiles. *What is in here*, before you know what
  you are looking for.

### Ingestion state is three states, and none of them is an error

OCR is the case that forces it:

| shown | means |
|---|---|
| `not scanned` | no `ocr/` directory at all — a **determined** answer, not a failure |
| `N OCR pages` | scanned |
| `ocr/ present, empty` | a third answer again, and the one worth looking at |

Rendering the first as "0" would say OCR *failed* on a document that was never
scanned.

### The uningested badge, and what it is computed from

Each queue carries a count of how many units are still waiting, **per
declaring instance and never merged** — two instances' queues shown as one
would report a set that does not exist.

The relation behind it is not a guess. Each `library/<slug>/manifest.jsonld`
carries `meta.source_file` and `meta.source_sha256`, and the reader
**recomputes the hash** rather than trusting it — so an entry's source is
*content-verified*, and a file replaced in the queue shows as `differs` rather
than passing as the same document.

A queued unit is a loose file, **or** a directory whose `intake.json` declares
a capture. An intake is **one** queued document however many files it declares:
counting a four-file capture as four would say four documents are waiting when
one is.

### It is read-only

Nothing on this page edits an asset. The actions that would write — starting an
ingest from the corpus view, and materialising an entry into a folio of choice
— are open work, because the write path is a decision the repository owner has
not yet made.

## Where they are published — two rules, not three

| rule | form | what it is |
|---|---|---|
| **1 — a handler renders a kind's assets** | `/<handler>/<kind>/<optional subject>` | `/cat-harness/library/who-iris/` |
| **2 — an instance presents itself** | `/<instance>/` | `/who-iris/` mocking the IRIS website |

The handler is the instance doing the rendering; the kind names what it
renders; the **subject is optional**, and a page without one is the view over
every subject.

A subject page is never published at `/<subject>/<kind>/` — that is rule 2's
namespace, and a viewer there would squat on the instance's own site.

### The subject pages

| page | shows |
|---|---|
| `/cat-harness/library/` | every declared `library/`, and every queue |
| `/cat-harness/library/who-iris/` | who-iris's three entries and its queue |
| `/cat-harness/library/agent-skills/` | its two entries |
| `/cat-harness/library/folio-assist-sci/` | its one entry |
| `/cat-harness/schemas/` | every declared `schemas/` |
| `/cat-harness/schemas/<instance>/` | that instance's modules and declarations |

One projection serves all of them — a scoped page filters client-side.
A second file per subject would be the same facts written N+1 times, free to
disagree the moment one is regenerated. **Counts are scoped too**: reporting
the graph-wide edge total on a page showing nine declarations would claim 512
edges among those nine.

### `docs/` is the same shape, and its subject means something specific

`/cat-harness/docs/` is where the harness user documentation lives, so
`/cat-harness/docs/who-iris/` is documentation **about** IRIS — how it is
ingested, what the handler does with it — and **not IRIS content relocated**.
The content stays in that instance's own `docs/`, and part of the handler's
job is to look for those directories.

Measured 2026-09-20: only `cat-harness` has a `docs/` directory today, and its
declaration carries `dependents: "skip"` — which is exactly what prevents a
dependent from getting one. Nothing is declared against a directory that does
not exist.

### Nothing composes a path

The rendered-content root is resolved from the declaration, the handler from
the instance's declared name, and the page's link back to its projection from
the page's own depth — so moving a directory moves its source, its URL and its
data link together.
