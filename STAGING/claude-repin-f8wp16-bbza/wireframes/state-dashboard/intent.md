# A state graph's dashboard — as-is intent

## Covers

- Declared visualisers (cat-harness `visualisers`, `renderedBy: state-viewer`): `cat-harness/qa`, `cat-harness/health`, `cat-harness/attestations`, `cat-harness/issue-marks`, `cat-harness/swimlane-glossary` and `cat-harness/uploads-queue` — each at `<base>/cat-harness/<id>/`, with the bare `<base>/<id>/` (and `/uploads/` for `uploads-queue`) as a declared alias. `beans` and `todos` are the same generator with their own boards and keep their own wireframes.
- Generator: `cat-harness/scripts/state-visualizer.ts`, one themed page per declared visualiser it renders.
- Declared as visualisers on 2026-10-09, when the owner ruled that the harness declares every visualiser (*"Need harness to declare visualizer is renderedBy"*). They were drawn before that too, at the site root, and no tile counted them as anyone's viewer; declared, they owe a wireframe like every other visualiser (issue #1023).
- Drawn from the committed `health` dashboard, the common case: a graph with no projection of its own. `qa` adds server-side family panels above the same registry.

## Who it is for, and what they need to do

- **Reader:** the owner or an agent asking what state a declared state graph is in, and moving between the state graphs this harness declares.
- **Tasks:** read the graph's path and kinds; read which of four states it is in (`live`, `elsewhere`, `declared`, `unresolved`) and, for `elsewhere`, open the page that does render it; move to a sibling dashboard.

## What it must show (read off the generator)

- an `h1` with the graph id and a subtitle with its path and kinds
- one sentence saying which state the graph is in, never zeros for a store nobody read
- the registry "State graphs this harness declares": one card per declared dashboard with its state tag, the current page not linked

## Findings

1. The registry is the same on every dashboard and takes most of the first screen at 390 px; the one sentence that is this page's own answer sits above it and is easy to miss.
2. `declared` reads as a status word; nothing on the card says it means "no projection here yet" until the page is opened.
