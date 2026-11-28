# A harness registry, one page per layer — as-is intent

## Covers

- Declared visualisers (cat-harness `visualisers`, `renderedBy: state-viewer`, `coversKinds` + `subgraphs: "instance"`): `cat-harness/graph-typologies`, `cat-harness/validators`, `cat-harness/qa-checkers`, `cat-harness/block-kinds`, `cat-harness/content-adapters`, `cat-harness/code-lists`, `cat-harness/pipeline-plugins` and `cat-harness/memory`. Editor checkers moved to the layer that registers the kind, with its own wireframe there (cat-harness#1150, item 3). Memory's layer page is a variant: its subtitle counts lessons (and archived ones) against other nodes, and its table adds a `label` column.
- Generator: `cat-harness-tools/scripts/state-visualizer.ts` — a hub page at `<base>/cat-harness/<id>/` listing the layers that hold a directory of the kind, and one page per layer at `<base>/cat-harness/<id>/<instance>/`. All are built at publish.
- Drawn from the generated `validators/` hub and `validators/<fhir-ig-layer>/` layer page; the other registries use the same template.

## Who it is for, and what they need to do

- **Reader:** the owner or an agent asking what one layer declares in a registry (which validators, which graph typologies, ...), and moving between layers.
- **Tasks:** from the hub, pick a layer; on a layer page, read the families by `$schema` and the list of nodes (id, title or summary, schema, file); go back to every layer's page.

## What it must show (read off the generator)

- hub: an `h1` with the registry title, one sentence, and one link per layer with its declared path
- layer page: an `h1` "<Registry>: <instance>", a subtitle with the layer, path and a link back to the hub
- "Families — N, over M document(s)": one card per `$schema`, saying when a family has no counts rather than showing zero
- "Nodes — N": a table of id, title or summary, `$schema`, file, scrolling sideways when narrow
- `render_with_liquid: false`, so authored titles cannot break the build

## Findings

1. Many validator nodes have no title or summary, so the second column is often empty; the id carries the meaning.
2. The family card repeats what the node table already says when there is one family; it is most useful on a layer with several schemas.
