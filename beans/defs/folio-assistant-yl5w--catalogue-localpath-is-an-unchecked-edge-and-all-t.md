---
# folio-assistant-yl5w
title: 'CATALOGUE: localPath is an unchecked edge, and all three point at nothing'
status: in-progress
type: bug
priority: high
created_at: 2026-09-20T18:49:27Z
updated_at: 2026-09-21T10:09:05Z
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

---

## 2026-09-21, session_01AYHimvYMmf8h8e9fFN6dW5 — the check exists, and this bean's own description was wrong in three ways

Claimed and worked after the owner picked it. **The defect is real. The way
this bean describes it is not**, and the corrections matter because they change
what the fix is.

### 1. Not "all three point at nothing" — three of NINE

Each of the three items carries three materialisations, not one: a node-level
one plus one per bitstream. **Six resolve. Three do not**, and all three are
`bitstreams[0]`, the ORIGINAL-bundle PDF.

### 2. `localPath` is instance-relative, and that was never ambiguous

Measured repo-root-relative first, which made all nine look dead.
`MaterializationSchema.localPath` says it outright — *"Where the bytes landed,
instance-relative"* — and `check-catalogue.ts` already resolves `metadataRef`
against `INSTANCE` the same way.

**So this settles nothing `yt7j` is holding open.** That bean is about
`coverage.*` being repo-root relative while a directory's path is
instance-relative, with 27 paths depending and an explicit *do not change
resolution behaviour without the owner's ruling*. Nothing here changes: this
field already had a declared answer and nobody was reading it.

### 3. Not "a move that is on someone else's plate" — the bytes were never here

This bean reads as though the files moved and the catalogue lagged. They did
not. **Measured:**

| bitstream declares | only PDF in `uploads/<slug>/iris-capture/` |
|---|---|
| `9789241548960_eng.pdf`, 2,136,157 B | `WHO handbook for guideline development-info.pdf`, **569,673 B** |
| `WHO_PUB_TPS_93.1.pdf`, 3,293,424 B | `WHO editorial style manual-info.pdf`, **229,365 B** |
| `WPR-RDO-2020-003-eng.pdf`, 2,810,648 B | `Publication and information products style guide.pdf`, **201,099 B** |

An order of magnitude out in every case. The third looked like a name match and
is not: 201 KB is a DSpace landing-page capture, not a 2.8 MB publication. And
`who-pub-tps-931/intake.json` lists **only** the `-info.pdf`, so the
publication was never captured at all.

**So re-pointing `localPath` would be wrong.** The bytes are genuinely absent;
the `state` is what is false.

## What this actually exposes — a gate permitted on a false basis

Each of the three carries a `fixity.sha256` and:

> `"sourceLoss": { "verdict": "permitted", "basis": "original bytes held locally with a recorded sha256" }`

The bytes are not held locally. That is worse than a broken link: the five
gates exist to record *why* holding a copy is safe, and this one claims a
resilience the repository does not have. A `permitted` verdict and "nobody
looked" are exactly the pair `materialization.ts` was written to keep apart.

## What shipped, and what deliberately did not

**Shipped:** `check:catalogue` now resolves `materialization.localPath` on
every `materialized` node and bitstream, naming the bitstream by index. Its
closing line used to read *"every metadataRef, libraryId and parent path
resolves"* — true, exhaustive-sounding, and silent about the one field that
says where the bytes are. The `dh4f` shape, one field over, inside the check
written to stop that class.

**Not shipped: the data repair.** Rewriting another instance's gate verdicts
and fixity digests is not a checker's to do on its own initiative. The three
are **baselined** — `catalogue/localpath-baseline.json`, the same shape and the
same reasons as `bean-bodies-baseline.json`: a NEW dead path fails, the backlog
is listed every run, and an entry that stops matching is reported as **stale**
so the file shrinks rather than fossilises.

## Verification

Falsified in all three directions against the real corpus: planting a fourth
dead path **failed** (exit 1); a baseline entry matching nothing **reported
stale**; restored, **exit 0**. The pure split is in
`scripts/catalogue-baseline.ts` so it can be tested at all —
`check-catalogue.ts` runs at module top level and ends in `process.exit`, so
importing it runs the whole check. **9 tests, 4 of which go red when the rule
is stubbed**; the rest are the direction that must never fail — an unreadable
baseline reads as EMPTY, so a typo in that file cannot silently pass the whole
backlog.

## Done when

- [x] `check:catalogue` resolves `materialization.localPath` on nodes and
      bitstreams, so a `materialized` claim cannot name nothing
- [x] The three are listed on every run rather than suppressed, with a NEW one
      failing
- [ ] **The catalogue's owner repairs the three.** The fix is the `state`, not
      the path: `referenced` rather than `materialized`, which the schema then
      requires to carry neither `localPath` nor `gates`
- [ ] The `sourceLoss: permitted` basis is re-stated or withdrawn on each —
      it asserts local bytes that are not there
- [ ] Baseline entries removed as they are repaired; the check reports a stale
      one, so this cannot be forgotten
