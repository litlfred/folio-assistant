---
# folio-assistant-6h47
title: 'RENDER STAGE 3: the dynamic-state export has a position but no filename — the owner left it open on purpose'
status: todo
type: task
priority: normal
created_at: 2026-09-20T19:59:52Z
updated_at: 2026-10-03T07:43:33Z
parent: folio-assistant-yj32
---


Owner, 2026-09-20, settling where the README render sits in the pipeline:

> dynamic content then hets get json/jsonld export avaiable under
> cat-harness/state.jsonld or so (whatever matches the dyanmic state
> vsualizesrs)

**"or so (whatever matches …)" is an explicit uncertainty, and it was not
closed by guessing.** `scripts/render-pipeline.ts` declares the step
(`kg-dynamic`), fixes its POSITION — after every stage-2 renderer has
contributed, fatal on failure — and re-exports the graph as its body. What it
should actually write is open.

## What settles it

The dynamic-state visualisers saying what they read. Until one exists and
names its input, any filename minted here is a published artefact name nobody
chose, and a consumer fetching it would be relying on a guess.

## Done when

[ ] A dynamic-state visualiser names the document it reads
[ ] `kg-dynamic` writes that, at the path that visualiser resolves
[ ] It is distinguishable from the stage-1 current-state export — two
    documents, two names, and a reader can tell which is which

Related: `render-order` skill §"What stage 3 writes is not settled", issue
#592, PR #593.

## Re-measured 2026-10-03 — still blocked on its first box

- `kg-viewer` reads the stage-1 current-state export (`../<stub>.jsonld`), not a dynamic-state document.
- PR #1918 (the newest viewer work open at the time) reads no `.jsonld` at all.
- `kg-dynamic` still writes `state.jsonld` to scratch only; nothing published, nothing consumes it.

So no dynamic-state visualiser yet names an input, and the rule above stands:
no filename is minted here by guess. Left `todo`; re-measure when a viewer
that reads dynamic state opens a PR.
