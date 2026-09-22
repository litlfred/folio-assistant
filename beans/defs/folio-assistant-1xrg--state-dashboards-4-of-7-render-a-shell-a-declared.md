---
# folio-assistant-1xrg
title: state:visualizer:check cannot fail on a declaration that points at its own page (the '4 of 7 render a shell' premise was a FALSE FINDING — retracted)
status: todo
type: task
priority: normal
created_at: 2026-09-22T06:48:40Z
updated_at: 2026-09-22T10:33:45Z
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

## RETRACTED 2026-09-22 — the central claim was FALSE

I checked before building the fix this bean proposed, and the fix already
exists. **The claim that these pages render "a heading over nothing" is
wrong**, and a false finding in a bean is the thing this bean itself
complains about one artefact over.

`state-visualizer.ts` has `notDrawnHere()`, which distinguishes **three**
states and says which applies, with its reason — more nuance than this bean
proposed adding:

| page | what it actually says |
|---|---|
| `health` | *"declared and nothing publishes a projection for it yet, so there is nothing to draw"*, citing bean `2krx` |
| `uploads` | *"rendered elsewhere … the declaration names a visualiser for it: `/cat-harness/uploads/`"* |
| `glossary` | the same, now linking the docs-auto index |

And `unresolved` is a fourth: a declaration naming a visualiser that is **not
there** is reported as a defect in the declaration rather than as either
neighbouring state — which the source says explicitly, citing bean `flh4`.

### How the false finding was produced

I grepped the rendered pages for `sv-empty`, `No .* found` and `not
published`, got nothing, and concluded the pages said nothing. **The real
class is `sv-sub` and the real wording is prose.** A grep for a guessed
spelling, reported as an absence — the same shape as the `<bpmn:` blind spot
this session already found four times, and I walked into it while writing up a
complaint about exactly that.

The size comparison that opened this bean is still true and still means
nothing: a page saying "rendered elsewhere" is legitimately about the same
size as one saying "declared".

### What checking DID find, and it was mine

The `glossary` entry's `coverage.visualiser` was
`cat-harness/docs/glossary/index.html` — **which IS the state-visualiser's own
page for that graph.** So the page read *"This graph is rendered elsewhere …
the declaration names a visualiser for it: `/glossary/`"*, pointing at the
page you were reading.

I declared it during `lqo9` slice 2 to make `published-graphs.md` count the
graph as published. It made the count look right and the page say something
false — a self-referential claim no check could catch, because every link in
it resolves.

Fixed: it now names the docs-auto glossary index, which is a real rendering of
that graph — 44 terms, each with its definition. Nothing else in this bean's
Done-when needs doing.

### Done when — revised

[x] A state graph with no data projection says so ON THE PAGE — it already
    did, in four distinguished states. Claim retracted.
[x] The `glossary` visualiser declaration is not circular
[ ] `state:visualizer:check` can fail on an empty page — STILL OPEN as a
    narrower question than this bean framed it. The pages are not empty, so
    the check is not green over nothing; what it cannot catch is a
    declaration pointing at ITSELF, which is what happened here and what a
    person had to notice. That is the finding worth keeping.
[~] Whether each of the four gets a real feed — not a defect, so not urgent.
    A graph rendered elsewhere is rendered; `health` is the only one in the
    "nothing yet" state, and bean `2krx` already tracks that class.
[~] `published-graphs.md` counting — it counts a DECLARED visualiser, which is
    the right thing now that the declaration is not lying.

## Summary of Changes

Retracted the central claim with evidence; fixed the one real defect it
surfaced (a self-referential visualiser declaration I had introduced); and
narrowed the remaining open item from "the check is green over empty pages" to
"the check cannot catch a declaration that points at its own page".


## Claim released, title corrected — 2026-09-22

**Status back to `todo`, unclaimed.** It sat `in-progress` under my claim while
I was not working it, which is an unhonoured claim — it tells a sibling session
this is taken when it is not, and `bun run health` counts exactly that.

**The title asserted a measurement I disproved.** "4 of 7 render a shell" was
a FALSE FINDING, already retracted in this bean's body, and leaving it in the
title meant the one line a future agent reads first was the wrong one — the
"a stale gap notice is worse than none" failure `AGENTS.md` names. Corrected
in place rather than deleted, per never-delete-a-bean.

**What actually survives**, and it is narrow but real: `state:visualizer:check`
compares committed bytes against what the generator would write, so it cannot
fail on a declaration whose `coverage.visualiser` points at *its own* page.
I introduced exactly that defect during #596 slice 2 — the `glossary` kind's
visualiser pointed at the state-visualiser's own page for that graph, so the
page said "rendered elsewhere" and linked itself — and the check was green
across it. I found it by opening the page, not by running the gate.

The three other Done-when items rest on the retracted premise and are left
unticked rather than rewritten: whoever picks this up should re-derive what,
if anything, they should say now.
