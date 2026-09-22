---
# folio-assistant-1xrg
title: 'STATE DASHBOARDS: 4 of 7 render a shell — a declared page that displays nothing is dh4f with a URL'
status: todo
type: task
priority: normal
created_at: 2026-09-22T06:48:40Z
updated_at: 2026-09-22T06:49:02Z
parent: folio-assistant-zzmr
---


Found 2026-09-22 by LOOKING at a page rather than at the generator that wrote
it. `lqo9` slice 2 added the `glossary` state graph, `state:visualizer`
generated `docs/glossary/index.html` for it, every gate went green, and the
page displays **nothing about the glossary**.

It is not a defect that slice introduced. Measured across all seven state
graphs the visualizer writes a page for:

| graph | page size | has `assets/<g>/index.json` | fetches |
|---|---|---|---|
| `beans` | 51 013 | yes | 3 |
| `todos` | 51 012 | yes | 3 |
| `qa` | 53 914 | yes | 2 |
| `health` | 51 124 | **no** | 1 |
| `issue-marks` | 51 118 | **no** | 1 |
| `uploads` | 51 048 | **no** | 1 |
| `glossary` | 51 018 | **no** | 1 |

**Three of seven have a data feed. Four render a shell** — the nav, the
"State graphs this harness declares" list, and a generic `fetch(url)` helper
with nothing graph-specific to fetch. `docs/glossary/index.html` is
byte-for-byte in the same state as `docs/health/index.html`, which predates it
by weeks.

## Why this is a finding rather than a backlog item

It is `dh4f` with a URL. A declared directory whose consumer scans nothing and
reports a clean run is the shape this repository keeps paying for; a declared
DASHBOARD that renders a heading and no data is the same defect where a person
can see it. Worse, it is reachable: `published-graphs.md` lists
`glossary` as **"1 of 2 published"** and links to the page, so a reader
following that link is told the graph is published and shown an empty page.

And nothing fails. `state:visualizer:check` compares the generated page with
what the generator would write — both empty — so the check is green by
construction. `6tkl`: a check that cannot fail.

## What it does NOT say

Not that the four should be deleted, and not that every state graph needs a
dashboard. `health` writes one report per sweep and `issue-marks` two
timestamps per issue; either might legitimately have nothing worth a page. The
finding is that **"has no data feed" and "has one and it is empty" are
currently the same page**, so a reader cannot tell a graph with nothing in it
from a graph the visualizer never learned to read.

## Open questions

- **Is the third state expressible?** A page that says "this graph declares no
  projection" is honest; a page that renders a heading over silence is not.
  Cheapest fix, and it may be the whole fix.
- **Which of the four warrant a real feed?** `glossary` plainly does — the
  ledger is small, committed, and exactly what a reader of a glossary wants.
  `uploads` is an ingestion queue and arguably does. `health` and
  `issue-marks` are the judgement calls.
- **Should `published-graphs.md` count a shell as published?** It says
  "1 of 2 published" for `glossary` today. If a page with no feed is not a
  publication, that count is wrong for four graphs at once.

## Done when

- [ ] A state graph with no data projection says so ON THE PAGE, rather than
      rendering a heading over nothing
- [ ] `state:visualizer:check` can fail on an empty page — today it compares
      empty against empty and is green by construction
- [ ] Whether each of the four gets a real feed is decided and recorded, per
      graph, with the reason
- [ ] `published-graphs.md` counts a shell as whatever it is decided to be,
      consistently

Related: `lqo9` (which surfaced it), `ankg` (subgraph viewer generators write
but nothing reads), `dh4f` and `6tkl` as the named shapes.
