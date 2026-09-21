---
# folio-assistant-cmsl
title: 'DEDUPE: 11 directories declared twice — and both obvious fixes are measurably wrong'
status: todo
type: task
priority: normal
created_at: 2026-09-21T19:18:36Z
updated_at: 2026-09-21T19:21:24Z
parent: folio-assistant-zzmr
---

Owner asked 2026-09-21: *"we need to dediplicate. options? auto stub prefix?"*
Both options were put to them, both were chosen, and **both turned out to be
measurably wrong**. Recorded here so the next agent does not re-derive it.

## The measurement

**63 declared entries across 52 distinct directories; 11 declared twice.**
Every duplicate has one shape: `cat-harness` declares another instance's
directory with `scope: repository`, and that instance declares it itself.

```
large-datasets/skills
    cat-harness      id=large-datasets-skills   scope=repository
    large-datasets   id=large-datasets-skills   scope=-
```

They have already drifted, which is what a duplicate does:
`detangle-schemas` vs `detangle-schemas-local`, `kg-navigation` vs
`kg-navigation-skills`, and the `graphKinds` differ on some pairs.

## Option 1 — delete the mirrors. TRIED, REVERTED, 23 tests fail.

`kg-export` 2,157 -> 2,125 nodes; `kgDirectories(cat-harness)` 11 -> 7.
23 failures across schema-graph spanning, library reachability, BPMN skill-ref
resolution, package identity and self-URL publication.

**The reason, and it is the whole finding: `cat-harness` has NO
`cat-harness.config.json`, so it has no `dependencies` block at all.** The
`scope: repository` entries are the ONLY mechanism by which it reaches
`who-iris/skills/`, `large-datasets/schemas/`, `agent-skills/library/` and the
rest. They are not redundant copies of an ownership fact. They are an EDGE.

So the two entries are **two different facts wearing one shape**:

- `who-iris:skills/` — who-iris HOLDS this directory. Ownership.
- `cat-harness:who-iris/skills/ scope=repository` — cat-harness REACHES INTO
  it. An edge, in the `utilizes`/`references` sense of the owner's own
  repo-topology diagram.

Deleting the second deletes the edge. The fix is not deletion; it is giving
the edge its own spelling instead of overloading a directory declaration —
either a `dependencies` block on a `cat-harness.config.json`, or an explicit
relation field. That is the real work and it is not small.

## Option 2 — auto stub prefix. NOT NEEDED. Zero collisions today.

10 ids are used by more than one entry, of which 3 are genuinely different
directories sharing a short id (`library` in 4 instances, `voices` in 3,
`uploads` in 2).

**But the export already scopes every id by its instance's own document IRI**
— `<stub>.jsonld#directory/<id>`. Measured: **63 directory IRIs minted, 0
collide.** Prefixing would add a stub to identifiers that are already unique,
and those ids appear in `coverage` paths and committed QA sidecars, so it is
churn on data for no benefit.

What the duplicates DO produce is not a collision but a **disagreement**: one
physical directory carries two different ids in two different documents, so a
consumer merging both exports sees two Directory nodes for one directory. That
is worth fixing, and prefixing does not fix it — it is the same finding as
option 1, from the other end.

## Done when

- The `cat-harness` -> dependency edge has a spelling that is not a directory
  declaration, and the 11 mirrors are removed in the same change.
- A check refuses a new mirror, so this cannot regrow.
- NOT: an auto stub prefix. Reopen only if a real collision is measured.

## Status

todo. The measurement is done and reproducible
(`instanceRootsIn` + `readDeclaration`, resolving `scope: repository` against
the repo root). The design is not taken.
