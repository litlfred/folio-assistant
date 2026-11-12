# Editor checkers, one page per layer — as-is intent

## Covers

- Declared visualiser: `folio-assistant-sci/editor-checkers` (`renderedBy: state-viewer`, `coversKinds: [editor-checkers]`, `subgraphs: "instance"`, `builtOnHostSite`). The kind is this layer's (`typologies/editor-checkers.json`), so the page is declared here, not in cat-harness (cat-harness#1150, item 3).
- Generator: `cat-harness-tools/scripts/state-visualizer.ts`, the same registry template as cat-harness's `state-registry` wireframe. A hub page at `<base>/folio-assistant-sci/editor-checkers/` lists the layers that hold an `editor-checkers` directory, and there is one page per layer at `<base>/folio-assistant-sci/editor-checkers/<instance>/`. All are built at publish on the host site.
- Drawn from the generated hub and the `folio-assistant-sci` layer page.

## Who it is for, and what they need to do

- **Reader:** the owner or an agent asking which editor checker a content profile loads (`paper-latex` today) and where its code is.
- **Tasks:** from the hub, pick a layer. On a layer page, read the nodes (id, rationale, `$schema`, file), then go back to the hub.

## What it must show (read off the generator)

- hub: an `h1` with the registry title, one sentence, and one link per layer with its declared path
- layer page: an `h1` "Editor checkers: <instance>", and a subtitle with the layer, the path and a link back to the hub
- "Families — N, over M document(s)": one card per `$schema`, which says when a family has no counts rather than showing zero
- "Nodes — N": a table of id, title or summary, `$schema` and file, which scrolls sideways when narrow

## Findings

1. A checker node has no `title`, so the second column shows its `rationale`, clipped to 160 characters.
