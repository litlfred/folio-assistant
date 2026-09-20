---
# folio-assistant-yl5w
title: 'CATALOGUE: localPath is an unchecked edge, and all three point at nothing'
status: todo
type: bug
priority: high
created_at: 2026-09-20T18:49:27Z
updated_at: 2026-09-20T18:49:27Z
parent: folio-assistant-kupb
---


MEASURED 2026-09-20, on `main` after #477 merged. Every `bitstreams[].materialization.localPath` in `who-iris/catalogue/nodes/` names a file that does not exist:

| node | localPath | resolves to | state |
|---|---|---|---|
| `item/18892cf3-…` | `uploads/WPR-RDO-2020-003-eng.pdf` | `who-iris/uploads/WPR-RDO-2020-003-eng.pdf` | **MISSING** |
| `item/local:9789241548960-eng` | `uploads/9789241548960_eng.pdf` | `who-iris/uploads/9789241548960_eng.pdf` | **MISSING** |
| `item/local:who-pub-tps-931` | `uploads/WHO_PUB_TPS_93.1.pdf` | `who-iris/uploads/WHO_PUB_TPS_93.1.pdf` | **MISSING** |

All three bytes are really present — in `cat-harness/uploads/`. #477 moved `library/` into `who-iris/` and left `uploads/` behind; its own "Open" list carries the relocation. So the paths are not wrong about the WORLD, they are wrong about WHERE, and every one of them says `state: "materialized"` while pointing at nothing.

THE CHECK IS THE POINT, not the three paths. `who-iris/scripts/check-catalogue.ts` verifies `metadataRef` exists, and its failure message says exactly why:

> `metadataRef … does not exist — an edge to nothing, which reads as a relationship`

`libraryId` is verified too, against `structure.json`. `localPath` gets neither. So `check:catalogue` reports **✓ every node validates; every metadataRef, libraryId and parent path resolves** over three materialisation claims that resolve to nothing — a clean run over exactly the state the three-state model exists to make impossible. `materialized` is supposed to mean the bytes are HERE.

Found while building the `community-list` mockup, whose asset links have to resolve, so the gap surfaced the moment anything actually followed one.

## Not fixed here, and why

The fix is a move, and `uploads/` relocation is live work on someone else's plate (#477's open list; the owner has a library agent running). Correcting the DATA instead is worse: relative to `who-iris`, the real location is only reachable as `../cat-harness/uploads/…`, and bean `z7ev` forbids exactly that shape — a relative path hardcodes a checkout layout into content.

## Done when
- `check-catalogue.ts` verifies `localPath` the way it verifies `metadataRef`, with the same "edge to nothing" reasoning in the message.
- A `materialized` bitstream whose bytes are absent FAILS. It is never reported as a clean run.
- The three paths resolve — by the bytes moving, not by the claim being softened.
