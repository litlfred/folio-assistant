---
# folio-assistant-f3bh
title: SUBGRAPH-READMES skips stored directories (5hox follow-up)
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T13:58:10Z
updated_at: 2026-10-02T16:54:07Z
parent: folio-assistant-3fva
blocking:
    - folio-assistant-5hox
---

Found by the 5hox prep (2026-10-02). subgraph-readmes (in bootstrap-tools) lists results/ when a working copy is present and omits it when absent, so after 5hox a contributor who ran qa:fetch gets a different cat-harness/test/README.md from CI. The generator should skip any directory whose declaration carries storage (16ei).

## Done when
- [ ] the generated README is identical with and without a fetched working copy
