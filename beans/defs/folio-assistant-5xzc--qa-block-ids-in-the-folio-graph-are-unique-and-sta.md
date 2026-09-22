---
# folio-assistant-5xzc
title: 'QA: block ids in the folio/ graph are unique and stable across render, move and re-ingest — the precondition every review view keys on'
status: todo
type: feature
created_at: 2026-09-22T21:02:54Z
updated_at: 2026-09-22T21:02:54Z
parent: folio-assistant-q4jm
---

Owner: *"blocks are in the knoledge graph folio/. QA, to manage IDs"*.

**Why first.** Every other child keys on the block id. A diff matches blocks
across `main` and STAGING by id, a review comment anchors to an id, and a heat
map aggregates by id. If ids drift, the diff reads everything as removed and
re-added, and every comment orphans. That is how this whole epic fails.

**Measured 2026-09-22.** `qa-criteria-registry.ts` has **no** criterion for
block-id uniqueness or stability. The hits for "duplicate" are about proofs,
prose and bibliography entries, not ids.

**Criteria to add**, as QA criteria in the registry that emit sidecars like
every other axis:
- `id-unique`: no two nodes in a folio's `folio/` graph share an id.
- `id-stable`: an id present on `origin/main` whose content-hash neighbourhood
  still exists on the branch keeps its id. A **rename without a recorded
  `supersedes`/`renamedFrom`** is a finding.
- `id-reingest-stable`: re-running ingest on an unchanged upload yields the
  same ids. Where the ids come from is child 03.

## Done when
- [ ] the three criteria are registered, with severity (`id-unique` critical)
- [ ] a rename carries `renamedFrom` in the folio/ graph, and the schema lives in folio-assistant-core/schemas
- [ ] a test renames a block both with and without `renamedFrom`, and only the second produces a finding
- [ ] `kg:audit` / the QA sweep runs the criteria over every declared folio
