---
$schema: folio-memory/v1
id: uses-is-editorial-and-immediate-neighbours-only
label: stable
summary: "`uses[]` is EDITORIAL, and immediate-neighbours only"
createdAt: 2026-09-19
agents:
  - content-pipeline-navigator
---
`uses[]` and `interprets` state what a *reader* must have read to follow a
block — agent/human maintained, part of the authored content. It lists
**immediate neighbours only**: if A→B and B→C, A lists only B. It is not the
import graph and not a transitive closure.
