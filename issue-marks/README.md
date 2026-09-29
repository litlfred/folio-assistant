<!-- kg:subgraph:begin -->
# issue-marks

How far an agent has read an issue: `lastCommentId`, `lastUpdatedAt` and `checkedAt`, one file per issue. NOT the comments — the marks say what was seen, and one of the two files here says so in its own note. Two marks rather than one because a comment EDITED after being read keeps its id, so the id alone would call it seen and an edited requirement is a changed requirement (`issue-working`). `state`: a running process writes one each time it checks. Moved out of `.harness/issue-comments/` on 2026-09-20 for the reason `.beans/` and `.harness/workflow/` moved on 2026-09-18 — the artefacts a person looks for first were the hardest to find. SCOPE IS `repository`, and omitting it was a live defect for an hour on 2026-09-20: without it the path resolves against the INSTANCE, so a consumer looked in `cat-harness/` while the content sat at the repository root — and `harness:dirs` then created the empty instance-level directory to satisfy the declaration, turning declared-but-absent into declared-and-empty, which is the `dh4f` false pass wearing a tidier face. Repository, not instance, for the same reason `beans/` and `todos/` are: these are read by every agent working in this repository, not by this instance's code.

Part of [C@T Harness](../cat-harness/README.md) 0.1.0, declared as `issue-marks`, holding `issue-marks`.

| file | what it is | used by |
|---|---|---|
| [`litlfred-folio-assistant-203.json`](litlfred-folio-assistant-203.json) | data |  |
| [`litlfred-folio-assistant-223.json`](litlfred-folio-assistant-223.json) | data |  |
<!-- kg:subgraph:end -->
