---
# folio-assistant-cj6x
$schema: bean/1.0.0
title: 'Memory: Never merge a PR that edits files under subscriptions/*/ (held, fixity-checked copies); cat-harness#936 broke staging on 2026-11-02'
status: completed
type: task
priority: low
created_at: 2026-11-02T00:52:16Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `held-subscription-trees-no-merge.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Never merge a PR that edits files under subscriptions/*/ (held, fixity-checked copies); cat-harness#936 broke staging on 2026-11-02


On 2026-11-02 at about 23:00Z, the drain sweep merged cat-harness#936. It edited `subscriptions/ihris/subgraphs/skills/tree/ingest-use-case-model.md`, which is a held copy of litlfred/ihris. Its bytes then stopped matching `materialization.json`, so `mount-instance-docs` exits 1 (fixity mismatch) and stage-local stops for every folio pinned at or after fd8e8d1c. Issue cat-harness#944 records it. Revert PR cat-harness#945 restores the held bytes; the fa reds thread owns the merge (card Q-FMR-9).

**Why:** held subscription trees are read-only materialized copies. A change must be made upstream (here, in litlfred/ihris src/skills), followed by a re-materialize with kg:materialize.

**How to apply:** before a sweep merges a PR, check its file list. If any path is under `subscriptions/`, do not merge it. Send it back to its owner to make the change upstream. Green CI does not catch this. See folio-assistant-6fv7.
