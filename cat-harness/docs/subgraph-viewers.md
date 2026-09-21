---
layout: default
title: Subgraph viewers
nav_order: 14
lang: en
---

# Subgraph viewers
{: .no_toc }

A harness instance declares the directories it holds and the **kind of graph**
in each. Some of those graphs have a page you can open; the sections below are
the list, and **counting them here would be a number that goes stale by
lying** — a section is added when a viewer is, and a reader wanting the total
counts the sections.

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

- A **relationship diagram** at the top, collapsible and closed by default:
  the declarations this page is scoped to, as UML boxes wired by labelled
  edges — *what is defined here, and how it is linked?*

There is still **no whole-corpus class diagram.** Hundreds of labelled
declaration boxes render as a wall that looks like a data model and answers no
question about one — the same argument the knowledge-graph viewer made and won.
The diagram obeys it by staying **scoped**, and by declining when the scope is
too big rather than drawing it anyway.

### The relationship diagram

A collapsible panel at the top draws the declarations the page is scoped to as
**UML class boxes wired by their edges, each edge labelled with the field it
goes through** — so you can read not just that `Role` is linked to `Skill`, but
that it goes through `skills`, and that it is a list.

**It is scoped, and refusing is an answer.** The diagram draws the page's scope
narrowed by the module filter; above 40 declarations it declines and says to
pick a module. Drawing 812 labelled boxes is the hairball the knowledge-graph
viewer measured at 1111 nodes.

**One hop of context is drawn, faded.** A strict module filter cuts the edge
most worth seeing — `RoleDefSchema --skills--> SkillDefinitionSchema` spans two
files — so a declaration just outside the filter that a drawn one touches is
drawn too, dashed and dimmed. Counting a cut edge is not showing it.

Three edge kinds, and the third is drawn differently on purpose:

| kind | drawn | means |
|---|---|---|
| generalisation | solid, hollow triangle | `extends` |
| field reference | solid, open arrow | a reference **in the source** |
| id reference | **dashed** | an association **declared** with `@ref` |

A field reference is something the reader *found*; an id reference is something
an author *asserted*, because the target is a string id no syntactic reader can
see. Drawing them alike would claim the reader saw something it did not.

Clicking a box opens that declaration's definition, which is what makes the
panel navigation rather than a poster.

The layout is **static**: computed once, deterministically, no simulation.
Dragging and alternate arrangements are tracked separately.

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

## The voices — what each rule cites

**[`/cat-harness/voices/`]({{ '/cat-harness/voices/' | relative_url }})** — every voice
its instance declares, every rule, and **the passage the rule was read from**.

A voice is an editorial register asserted by an instance, and this subsystem's
whole claim is that it is **auditable rather than asserted**. `check-voices.ts`
exists because PR #210 shipped three WHO profiles carrying ten plausible rules
each with `source: null` — and one of those plausible rules asserted the
opposite of what the WHO Editorial Style Manual says on p14. Every rule now
carries the page and the quote.

**Until this page, none of it was readable without opening JSON.** A citation
that is only machine-checked is one the reader takes on trust, which is the
state the citations were added to end. So the rule row leads with the quote,
and the citation is the one column that cannot be filtered away. Bean `bu2q`.

### A rule citing nothing is drawn as a finding, not as a blank

`VoiceRuleSourceSchema` requires **exactly one** of an ingested source
(`libraryId` + `sectionId`) or a node of the instance's own knowledge graph
(`kgRef`), so a rule with neither cannot load. The viewer renders that state
anyway, in red, saying that something is loading voices without validating
them — because a reader who cannot tell "no citation" from "citation not
rendered" learns nothing from an empty cell.

### A declared directory that is not there gets a row

`agent-skills` declares a `voices` graph and ships none. It appears in the
directories table as **declared, not present**, rather than being omitted:
those are different facts, and a consumer that scans nothing and reports a
clean run is the `dh4f` defect.

### The visualiser rule did not ask for this page

`owesVisualiser` returns false for a `content` kind and `voices` is `content`,
so `check:subgraph-coverage` never raised a finding for it — exactly as it
never raised one for the library. What this page answers is `2krx`'s own
sentence, *"a directory nobody can see is one nobody checks"*, which is a
reason to build a viewer and not a row in a report.

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
| `/cat-harness/library/folio-assistant-sci/` | its one entry |
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
