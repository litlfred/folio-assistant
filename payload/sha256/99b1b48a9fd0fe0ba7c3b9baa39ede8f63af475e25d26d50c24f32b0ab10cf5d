---
name: archimate-models
description: >
  ArchiMate models as knowledge-graph content: how an instance declares the
  Archi models it holds, what the `archimate` subgraph gives every model,
  view, element and relationship (an IRI, a thin page, and every view drawn as
  SVG from the model's own diagram, and its metamodel derived and checked),
  how to version the models, how to wire
  them into a folio's staging build and navbar, how to count and lower the
  crossed lines in a view before committing it, why every view carries a
  plain-language key, why names are the source's own terms linked to their
  SKOS concepts, and why no Java, no Archi CLI
  and no Archi HTML report is ever part of the pipeline. Read before adding,
  authoring, publishing or rendering an `.archimate` file, before citing an
  ArchiMate element from prose, and before reaching for Archi's own tooling in CI.
---

# ArchiMate models — every view, element and relationship a node

> Skill id: `archimate-models` · Package: `ui-core` · Subgraph:
> [`cat-harness/archimate/`](../../../archimate/README.md) · Tools:
> `archimate-check`, `archimate-metamodel`, `archimate-pages`, `archimate-crossings`, `archimate-detangle` · Process:
> `archimate-publish` (`processes/ui/archimate-publish.bpmn`)

Owner, 2026-10-09: *"need new specialixed harness (like openapi) for archimate
content in the KG"*, and then, of the Archi CLI report: *"do not do java
200mb... that's not usable for webclients and is too heavy."*

## The rule

**An ArchiMate model is content, and every view, element and relationship in
it is a node.** The model is authored in Archi and committed where it is held.
Everything a reader sees is made from it on each build, by the `archimate`
subgraph, in TypeScript, with no tool installed:

| node | IRI (under the graph's path) | page | |
|---|---|---|---|
| model | `<m>.jsonld` | `<m>/` | views; elements by layer |
| view | `<m>/views/<id>.jsonld` | `<m>/views/<slug>/` | the drawing, `<m>/views/<id>.svg` |
| element | `<m>/elements/<id>.jsonld` | `<m>/elements/<slug>/` | documentation, properties, relationships, views it is in |
| relationship | `<m>/relationships/<id>.jsonld` | `<m>/relationships/<id>/` | its ends, the views it is drawn in |

Ids are **Archi's own** (`id-<32 hex>`). An element therefore keeps its IRI
across a model's versions wherever Archi kept its id — the property the RA
mapper's mappings already depend on. Never rewrite one; the reader refuses an
id that is not filename-safe rather than minting one nobody chose.

## Readable page paths: slugs, worked out each build

Owner, 2026-10-30, of `…/views/id-007936f8c2424b96ad1893ef0ff66059/`: *"do
we need to use such ugly IDs … why not nicer slug IRIs?"*; then, of the
designs offered (cat-harness-tools#1054): *"B. clean break ok"*.

**The IRI stays the id; only the page is at a slug.** A view's or element's
page is at `<m>/views/1-central-health-workforce-registry/`, while its node
keeps `<m>/views/<id>.jsonld`. Cite the IRI when a link must last: the page
path is for reading. Relationships keep id paths, since almost none are
named (smart-ra 0.2.0: 6 of 284).

Slugs are worked out from the names on every build (`archimate/schemas/slugs.ts`
in cat-harness-tools). Nothing is committed and nothing redirects, so:

- a rename moves the page, and the old path is gone (a clean break, as the
  owner chose; old `<m>/views/<id>/` page paths are gone too);
- on a clash the object first in the model keeps the plain slug and a later
  one gets `-<first hex of its id>`;
- an author can choose a slug in Archi with a `slug` property (lower-case
  words joined by `-`); a malformed one, or two objects choosing the same
  one, is refused rather than rewritten;
- an object with no readable name keeps its id as its path.

Do not put slugs in the IRIs: the mapper keys on the ids, and a rename would
move an IRI.

## The metamodel is derived, never drawn

Owner, 2026-10-31: *"i dont really like native UML, rather derived"*, then
*"make mechanical tools as parts of skills/processes"*.

**Do not draw a metamodel view.** Which element types a model uses, and which
relationships it draws between them, is computed from the model by the Tool
`archimate-metamodel` (`schemas/metamodel.ts` in cat-harness-tools):

- every element type, with how many elements it has;
- every pattern (source type, relationship, target type), with its count and
  the ids of the relationships that follow it;
- for each pattern, whether ArchiMate allows it, from Appendix B of ArchiMate
  3.2 as Archi holds it (`archimate/schemas/archimate-relationships.json`,
  MIT, written only by `scripts/import-archi-relationships.ts`; to adopt a
  newer table, re-run it on a newer Archi checkout);
- the **placeholder elements**: an element named after its own type ("Goal",
  "Application Component (MS)"). They are how a metamodel gets drawn by hand
  inside a model, so they and their relationships are listed and kept out of
  the patterns. A Grouping or Junction left with its default name is not one.

`archimate-pages` draws the same result on each model's **Metamodel in use**
page (`<m>/metamodel/`), linked from the model page and the rail: a class
diagram laid out from DOT by Graphviz in WebAssembly (`@hpcc-js/wasm-graphviz`,
no binary, no JVM), with the same diagram as DOT, Mermaid and JSON beside it
(`<m>/metamodel.dot|.mmd|.json|.svg`), and tables of the types and patterns,
each pattern linking its relationships.

`archimate-metamodel --check` fails when a relationship follows a pattern
ArchiMate does not allow. Placeholders are reported, never fatal: a model is
its authors', so removing a hand-drawn metamodel view (smart-ra 0.2.0's
"Metamodel", "Metamodel vs EIRA" and "Testing", 34 placeholders) is their
call. Cite the derived page instead of the view in the meantime.

The steps run in this order, all in the pipeline lane of process
`archimate-publish`: `archimate-check`, then `archimate-metamodel --check`,
then `archimate-pages`. A refused relationship goes back to the model's author.

## Untangle every view you touch

Owner, 2026-10-31, of a view with lines drawn across each other and through
boxes: *"lots crossed lines. detangle. (skill/process always check and try
minimize when authoring archimate)"*, then *"improve skills / make mechanical
tools where you can"*.

**A change to a view never adds tangles, and every view you touch leaves with
no more than it came with.** A tangle is a line crossing another line, or a
line running through a box that is not one of its ends and does not hold one.
Groups (bands) are not boxes here; a line may cross a band.

Every time you add, move or re-route anything in a view:

1. **Count before.** `bun run cat archimate:crossings --model <file> --view <id or page slug>`
   lists each tangle by the boxes it joins.
2. **Make the change.**
3. **Let the tool lower it.** `bun run cat archimate:detangle --model <file> --view <id or page slug>`
   reports what it would do: re-route lines (straight, an L, or a Z through a
   free lane between rows) and swap same-size boxes in the same row or column.
   It keeps a change only if the count goes down. Add `--apply` to write it,
   or `--routes-only` when the boxes' places carry meaning (an order, a flow).
4. **Look at the drawing** (`gen-archimate-pages.ts --out`, or the view's SVG)
   before and after. The count is a gate, not taste: undo a swap that breaks a
   reading order, and fix by hand what the tool cannot (it never adds, resizes
   or regroups boxes).
5. **Count after, and say both numbers** in the PR: *"view X: 10 crossings,
   13 through a box → 1, 2"*. More tangles after than before is a finding to
   fix before review, not a note.

Ways to untangle by hand, in the order to try them:

- Put a box beside the boxes it is joined to: a line's ends in neighbouring
  rows, not across the view.
- Order a row like the row it connects to (the order of the boxes above),
  so lines between the two rows run parallel.
- Route a long line along the gap between rows or bands, with right-angle
  bendpoints, rather than diagonally across boxes.
- Nest instead of drawing a line where the notation allows it (composition,
  aggregation, assignment, realization): a box drawn inside another already
  says how they relate, and the renderer draws no line for it.
- When nothing else works, a view shows too much: split it.

## Every view carries a key for readers who do not know ArchiMate

Owner, 2026-10-31: *"what do arrows/colors/shapes mean, need legend"*.

Readers of a view are mostly not architects. **Every rendered view carries a
plain-language key** below it, saying what each colour, shape, line and end
used ON THAT VIEW means, in words a reader without ArchiMate understands
("Realization: makes real, or achieves"), not the specification's terms
alone. `render-view.ts` draws it by default (cat-harness-tools#1059), keyed
only to what the view uses. Do not turn it off for a published view, and do
not export a view without it. When the renderer gains a new mark, the key
gains its line in the same change.

## Names are the source's own terms, linked to their concept

Owner, 2026-10-31, after an NHWA element was named in our words rather than
the handbook's (smart-ra#163).

**An element or view named from a source uses the source's own term, and
links to that term's SKOS concept.** Not our paraphrase, shortening or
merger of two terms. When smart-ra models a module of *National health
workforce accounts: a handbook*, the box is named as the handbook names it,
and the element carries the concept's IRI (a property, e.g.
`concept` = the `skos:Concept` IRI in the source's glossary scheme) so its
page links to the definition.

- No concept for the term yet: add it to the source's glossary scheme first,
  from the source's own words, then name the element.
- The source's term is too long for a box: keep the full term as the name
  and let the renderer wrap it; a short form goes in `skos:altLabel`, never
  in place of the name.
- Our term and the source's disagree: that is a content decision
  ([`term-disagreement`](../../library/library-core/term-disagreement.md)),
  not something to settle by renaming in Archi.

## No Java, no Archi CLI, no Archi report — ever

The Archi command line (`com.archimatetool.commandline.app`) renders an HTML
report and view images, and it is **not part of any pipeline here**:

- it needs a JVM, a virtual display (`xvfb`) and a ~200 MB download on every
  run — too heavy for CI, and impossible in a web client, which is where an
  agent or a reader working in the browser is;
- its views are raster images nobody can link into, and its pages are not
  nodes: nothing it writes has an IRI in the graph.

`render-view.ts` draws the same views from the same coordinates — the bounds
Archi stores for every box (made absolute, since Archi nests a child's bounds
in its parent's) and the relative bendpoints it stores for every line — into
SVG in ArchiMate's notation, every box a link to its element. The reader
handles Archi's native XML and its zipped archive with `node:zlib`. If a view
ever needs something the renderer does not draw, **extend the renderer**; do
not bring Archi back into a workflow.

The same reasoning applies to any other Java-only ArchiMate tooling (jArchi
scripts, coArchi). Authors use Archi on their own machines; the pipeline never
does.

## What an instance declares

1. A directory of graph typology `archimate` in its `<instance>.json`, with a
   `coverage.visualiser` naming `<dir>/index.html` so the navbar carries a tile
   to it (`harness-tiles`). `served: true` only if the pages are written into
   the graph rather than a site build.
2. `cat-archimate.config.json`, at the instance root or inside that directory:
   `{ "$schema": "cat-archimate-config/v1", "directory": "<id>", "models": [{ "id", "file", "title"?, "description"? }] }`.
3. `cat-harness` in its `needs`, directly or through its closure.

**Order matters when a platform is pinned.** A declaration naming the
`archimate` typology throws in every platform reader that does not know the
kind yet (`cat-harness.ts`: *unknown graph typology*). Move the instance's pin
of cat-harness to a commit carrying this subgraph first, then declare.

## Versions — one folder per SemVer version

A model is named for the version of the thing it describes. In a WHO IG
repository that is the `version:` in `sushi-config.yaml`: `archimate/0.2.0/`,
with earlier drafts as SemVer pre-releases (`0.2.0-draft.1`, …). The model id
in the config is that version, so `…/archimate/0.2.0/elements/<id>.jsonld` is
both versioned and stable. Never name a folder `v2`, `prev1` or `current`: a
label that says nothing about what it is a version of is how smart-ra came to
hold two byte-identical models under two names.

## In a folio's build

```sh
bun run <platform>/cat-harness-tools/archimate/scripts/check-archimate.ts --instance .
bun run <platform>/cat-harness-tools/archimate/scripts/gen-archimate-pages.ts --instance . --out _site
```

Run both in the staging build, after the document site is built and before
the navbar pass, so the pages are railed like every other page. `--out` is
the normal mode: smart-ra's four models are 5,809 pages and 131 drawings
(~24 MB, 1.5 s), which belong in a build, not a commit.
`gen-archimate-pages.ts` without `--out` writes into the graph and `--check`
gates it, as the `openapi` subgraph does, for an instance small enough to
commit its pages.

## Citing the model from prose

Link the element's or the view's page, never a copy of a picture. A view's
SVG links relative to its own address, so it can also be embedded in a
document as a figure (`<m>/views/<id>.svg`) and stay current with the model.
Where the document and the model disagree — a figure in the text that is not
a view in the model — that is a finding for the model's authors, not
something to paper over with an exported image. (smart-ra, 2026-10-09:
Figures 3.7.1 and 3.7.2 of the DPI-H review draft were in no committed model;
the 0.2.0 model now draws them as views "B" and "D", so cite those.)

## What is not read yet

The Open Group exchange format; custom images and fonts on a diagram (each box
names its type in its corner instead of Archi's icons — the icons are the
tool's artwork, not the notation's); sketch and canvas views; ingesting a
model from another repository. Each is an extension of `schemas/archimate.ts`
or `render-view.ts`, in TypeScript.

## Do not

- Draw a metamodel, or any class diagram of the model's types, by hand: cite
  the derived "Metamodel in use" page.
- Run Archi, a JVM or `xvfb` in a workflow to render a model.
- Commit exported view images beside a model; they go stale on the next edit.
- Name model folders by anything but the version they describe.
- Declare the `archimate` typology in an instance whose platform pin predates it.
- Commit a change to a view without counting its tangles before and after.
- Publish a view without its key, or name an element from a source in words the source does not use.
