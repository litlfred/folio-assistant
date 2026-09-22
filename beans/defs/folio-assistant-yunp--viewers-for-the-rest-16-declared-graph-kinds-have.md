---
# folio-assistant-yunp
title: 'VIEWERS FOR THE REST: 16 declared graph kinds have no visualiser — fsh-guts among them — so the navbar lists them disabled'
status: todo
type: task
priority: normal
parent: folio-assistant-p5wm
created_at: 2026-09-21T21:59:34Z
updated_at: 2026-09-21T21:59:34Z
---

## What — owner, 2026-09-21

> i eant to see beans/ todos/ fsh-guts/
>
> catalogue = libraru?   move?
>
> yes need viewer made for rest. bean up.. add links but disabled to LHS
> navbar on the "harneesd" dirs/sub-graphs

The last clause is **already done** (`sjic`, PR #802): every declared graph
reaches the navbar, and one with no published viewer renders as a non-link.
This bean is the other half — building the viewers those disabled entries are
waiting for.

## Measured: 6 kinds have a declared visualiser, 16 do not

Read from `cat-harness.json`, 2026-09-21. **Re-measure rather than quote this.**

| | kinds |
|---|---|
| **with** a viewer | `schemas`, `cat-harness`, `beans`, `todos`, `uploads`, `library` |
| **without** | `tools`, `skills`, `scenarios`, `workflows`, `methodology`, `qa`, **`fsh-guts`**, `health`, `memory`, `waiver`, `interaction`, `issue-marks`, `voices`, `translation-sources`, `folio`, `docs` |

So of the three the owner named: `beans` and `todos` already have viewers and
will render as LINKS the moment the main site's navbar uses the renderer;
`fsh-guts` has none and will render DISABLED. Nothing is missing for the first
two — they are waiting on the sidebar switch (`sjic`, after #791), not on a
viewer.

who-iris's own four disabled entries — `catalogue`, `skills`, `themes`,
`uploads` — are the same question one instance down.

## Prioritise by who is standing in front of it

Not all sixteen are worth the same. A viewer earns its place when a PERSON
reaches for that graph:

- **`fsh-guts`** — named by the owner, so it leads
- **`catalogue`** — who-iris's largest graph (12 nodes against 1,057,223 files
  known) and the one the instance exists to show
- **`workflows`** — the BPMN diagrams already render to SVG; a viewer is
  mostly an index over work already done
- **`qa`, `health`** — already produce committed JSON sidecars, so the data
  exists and only the rendering is missing
- **`memory`, `waiver`, `interaction`, `issue-marks`** — agent-facing state; a
  person rarely opens these, and a viewer each would be work spent on an
  audience of one agent

## `catalogue` is NOT `library`, and it should not move

The owner asked. Answering here because the answer is a fact about the
instance rather than a preference:

| | holds | scale |
|---|---|---|
| `catalogue/` | `folio-catalogue-node/v1` — what EXISTS in IRIS, by reference | 12 nodes against 1,057,223 files upstream; 9 `referenced` |
| `library/` | the L1 corpus — the bytes actually HELD, with sections and sidecars | 3 materialized items |

`who-iris/AGENTS.md`: *"the gap between twelve modelled nodes and a million
upstream files is the POINT rather than a backlog."* Folding `catalogue` into
`library` makes "we know this exists" indistinguishable from "we hold this",
which is the one distinction the catalogue exists to draw. **Not moved.** If
the owner still wants it moved, that is a ruling and this paragraph is the
argument it overrides.

## Done when

- [ ] The 6-of-22 split is RE-MEASURED, not quoted from here
- [ ] `fsh-guts` has a viewer, or a recorded reason it should not
- [ ] Every remaining disabled entry either has a viewer or a bean saying why
      it does not — a disabled entry with no explanation is a gap that looks
      like neglect
- [ ] The prioritisation above is the owner's, not mine: a kind I called
      agent-facing may be one they open weekly

