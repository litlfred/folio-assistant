# A harness registry, one page per instance — as-is intent

## Covers

- Declared visualisers (cat-harness `visualisers`, `renderedBy: state-viewer`, `coversKinds` + `subgraphs: "instance"`): `cat-harness/graph-typologies`, `cat-harness/validators`, `cat-harness/qa-checkers`, `cat-harness/block-kinds`, `cat-harness/content-adapters`, `cat-harness/code-lists` (bean `folio-assistant-k7ro`, 2026-10-15); `cat-harness/pipeline-plugins`, `cat-harness/editor-checkers` and `cat-harness/memory` (owner, 2026-10-16). Memory's instance page is a variant: its subtitle counts lessons (and archived ones) against other nodes, and its table adds a `label` column.
- Generator: `cat-harness-tools/scripts/state-visualizer.ts` — a hub page at `<base>/cat-harness/<id>/` listing the instances that hold a directory of the kind, and one page per instance at `<base>/cat-harness/<id>/<instance>/`. All are built at publish.
- Drawn from the generated `validators/` hub and `validators/<fhir-ig-layer>/` instance page; the other five registries use the same template.

## Who it is for, and what they need to do

- **Reader:** the owner or an agent asking what one instance declares in a registry (which validators, which graph typologies, ...), and moving between instances.
- **Tasks:** from the hub, pick an instance; on an instance page, read the families by `$schema` and the list of nodes (id, title or summary, schema, file); go back to every instance's page.

## What it must show (read off the generator)

- hub: an `h1` with the registry title, one sentence, and one link per instance with its declared path
- instance page: an `h1` "<Registry>: <instance>", a subtitle with the instance, path and a link back to the hub
- "Families — N, over M document(s)": one card per `$schema`, saying when a family has no counts rather than showing zero
- "Nodes — N": a table of id, title or summary, `$schema`, file, scrolling sideways when narrow
- `render_with_liquid: false`, so authored titles cannot break the build

## Findings

1. Many validator nodes have no title or summary, so the second column is often empty; the id carries the meaning.
2. The family card repeats what the node table already says when there is one family; it is most useful on an instance with several schemas.
