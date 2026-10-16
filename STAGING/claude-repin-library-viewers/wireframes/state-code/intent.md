# An instance's code directories — as-is intent

## Covers

- Declared visualiser (cat-harness `visualisers`, `renderedBy: state-viewer`, `coversKinds: ["code"]`, `subgraphs: "instance"`): `cat-harness/code` (bean `folio-assistant-svgx`, 2026-10-15).
- Generator: `cat-harness-tools/scripts/state-visualizer.ts` — one page per instance at `<base>/cat-harness/code/<instance>/`, built at publish.
- Drawn from the generated `code/<content-core>/` page.

## Who it is for, and what they need to do

- **Reader:** the owner or an agent asking what code an instance declares, and opening a file.
- **Tasks:** read how many code directories the instance declares; for each, read its id and description, and open a file on GitHub at the commit the index pins.

## What it must show (read off the generator)

- an `h1` "Code: <instance>" and a subtitle with the number of declared code directories and where files open
- one card per directory: path, id tag, description, file count, and the files as links to GitHub at the pinned commit
- a directory over 300 files says it was cut, and how many there are
- files listed without links when the instance has no pin, rather than linking to a guessed ref
- `render_with_liquid: false`, so file names cannot break the build

## Findings

1. Directory descriptions are Markdown in the declaration and are shown as plain text, so backticks appear literally.
2. A long directory makes a long page; there is no collapse or filter.
