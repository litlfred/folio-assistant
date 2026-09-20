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

## Where they are published — the URL is the directory's path

Owner, 2026-09-20:

> it `<baseurl>/<path to kind in knowledge graph>` or
> `<path to dir handled>/<optional subject>`

So a viewer's address **is the repo-relative path of the directory it
handles**, and `<subject>` is optional — a viewer with no subject is the view
over all of them. These two handle `cat-harness/schemas/` and
`cat-harness/library/`, so they sit at `/cat-harness/schemas/` and
`/cat-harness/library/`.

**That is a resolution, not a composition, and the difference is not
cosmetic.** An earlier draft composed the address from the rendering
instance's name plus the graph kind. It gives the right answer for
`cat-harness/schemas/` by coincidence — that directory happens to sit at
owner/kind — and the wrong one for every directory that does not:
`who-iris/library/` would have been addressed as `cat-harness/library`, naming
the machinery where the rule names the data. Taking the path means the two can
never disagree, because there is only one of them.

Neither generator writes a path down. The rendered-content root is resolved
from the declaration, the segment is the handled directory's resolved path,
and the page's link back to its projection is computed from its own depth — so
moving a directory moves its source, its URL and its data link together.
