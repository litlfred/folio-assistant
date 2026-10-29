---
# folio-assistant-6h47
$schema: bean/1.0.0
title: 'RENDER STAGE 3: the dynamic-state export has a position but no filename — the owner left it open on purpose'
status: completed
type: task
priority: normal
created_at: 2026-09-20T19:59:52Z
updated_at: 2026-10-29T12:10:00Z
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

_2026-10-24T07:40:00Z_ — Re-measured, still blocked on box 1. On cat-harness-tools `main` only `scripts/render-pipeline.ts` names `kg-dynamic`; in cat-harness only the `render-order` / `incremental-render` skills and the `render-order` Tool mention it. No viewer reads a dynamic-state document, so no filename is minted. Left `todo`. Session https://claude.ai/code/session_01AnAGBDDY8TMwCApxe4b3pX.

*2026-10-29T12:10:00Z* — **Completed.** The owner chose option A on 2026-10-29 (Lane B card Q1) and OK'd the merge at 12:04Z. Render stage 3 (`kg-dynamic`) publishes `<site>/<harness>/state.jsonld`, typed `cat-harness:DynamicState`, and the workflow instance pages read it: litlfred/cat-harness-tools#839 (53d4497) and litlfred/cat-harness#688 (e134b39). All three boxes are met. Session https://claude.ai/code/session_01Qmmkt7rXCDPexdBbNqeJqU
