---
name: archimate-models
description: >
  ArchiMate models as knowledge-graph content: how an instance declares the
  Archi models it holds, what the `archimate` subgraph gives every model,
  view, element and relationship (an IRI, a thin page, and every view drawn as
  SVG from the model's own diagram), how to version the models, how to wire
  them into a folio's staging build and navbar, and why no Java, no Archi CLI
  and no Archi HTML report is ever part of the pipeline. Read before adding,
  publishing or rendering an `.archimate` file, before citing an ArchiMate
  element from prose, and before reaching for Archi's own tooling in CI.
---

# ArchiMate models — every view, element and relationship a node

> Skill id: `archimate-models` · Package: `ui-core` · Subgraph:
> [`cat-harness/archimate/`](../../../archimate/README.md) · Tools:
> `archimate-check`, `archimate-pages`

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
| view | `<m>/views/<id>.jsonld` | `<m>/views/<id>/` | the drawing, `<m>/views/<id>.svg` |
| element | `<m>/elements/<id>.jsonld` | `<m>/elements/<id>/` | documentation, properties, relationships, views it is in |
| relationship | `<m>/relationships/<id>.jsonld` | `<m>/relationships/<id>/` | its ends, the views it is drawn in |

Ids are **Archi's own** (`id-<32 hex>`). An element therefore keeps its IRI
across a model's versions wherever Archi kept its id — the property the RA
mapper's mappings already depend on. Never rewrite one; the reader refuses an
id that is not filename-safe rather than minting one nobody chose.

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
Figures 3.7.1 and 3.7.2 of the DPI-H review draft are in no committed model.)

## What is not read yet

The Open Group exchange format; custom images and fonts on a diagram (each box
names its type in its corner instead of Archi's icons — the icons are the
tool's artwork, not the notation's); sketch and canvas views; ingesting a
model from another repository. Each is an extension of `schemas/archimate.ts`
or `render-view.ts`, in TypeScript.

## Do not

- Run Archi, a JVM or `xvfb` in a workflow to render a model.
- Commit exported view images beside a model; they go stale on the next edit.
- Name model folders by anything but the version they describe.
- Declare the `archimate` typology in an instance whose platform pin predates it.
