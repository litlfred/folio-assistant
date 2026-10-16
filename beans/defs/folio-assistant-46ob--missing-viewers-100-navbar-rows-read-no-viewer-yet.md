---
# folio-assistant-46ob
$schema: bean/1.0.0
title: "Missing viewers: 100 navbar rows read 'no viewer yet' across 47 kinds on the live site"
status: todo
type: epic
priority: normal
created_at: 2026-10-15T16:53:28Z
updated_at: 2026-10-16T10:30:00Z
parent: folio-assistant-rwmf
---

## The ask, owner 2026-10-15 (verbatim)

> bean up for missing viewers

Context: the owner's screenshot of `/en/cat-harness/library/` showed "no viewer yet" on Processes and other declared sub-graphs.

## Measured

From the deployed `gh-pages` (folio-assistant `ac9cba167`, 2026-10-15T16:46Z), page `en/cat-harness/library/index.html`, parsing the rendered rail: **210 rows, 100 of them "no viewer yet", over 47 kinds**. The children of this bean group them by the fix each needs.

**Already fixed, not yet deployed:** Processes (6 rows) — the page is built at publish and was never seen on a fresh checkout; cat-harness-tools#313 (merged) derives the writer from the harness's `builtAtPublish`. Clears at the next index re-pin + publish; tracked as the verify child.

## How the row is decided (read before fixing)

A navbar row says **no viewer yet** when no harness declares a visualiser over that kind (`visualisers` in a harness declaration, resolved by `cat-harness-tools/scripts/viewer-declarations.ts` → `harness-tiles.ts` `inertNote`). The other notes are not gaps: **no viewer by design** (`renderExemption.of: ["visualiser"]`), **staging only**, **viewer not published**.

Each kind therefore closes one of three ways — pick per kind, with the owner:
1. **Declare a viewer** that already exists elsewhere (cheapest; often a scope fix).
2. **Build a viewer** (a Tool + page writer + `builtAtPublish` entry).
3. **Exempt it**: `renderExemption.of: ["visualiser"]` on the instance, when the kind is internal plumbing a reader never browses — the row then reads "no viewer by design".

## Done when

Every child is closed: each kind either links to a viewer, or reads "no viewer by design" by a recorded owner decision. Re-measure the live rail and record the count here.

_2026-10-16T10:30:00Z_ — Parented to GOAL 4 (`rwmf`): it had no parent, so its open beans sat under no goal (owner choice, https://claude.ai/code/session_01NUrhvvMEwU5MmPW4L2w9jP).
