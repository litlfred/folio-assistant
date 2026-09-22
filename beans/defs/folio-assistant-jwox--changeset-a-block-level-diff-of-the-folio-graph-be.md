---
# folio-assistant-jwox
title: 'CHANGESET: a block-level diff of the folio/ graph between main and a staging branch — added, removed, modified, moved, renamed'
status: todo
type: task
priority: normal
created_at: 2026-09-22T21:02:54Z
updated_at: 2026-09-22T21:03:10Z
parent: folio-assistant-q4jm
blocked_by:
    - folio-assistant-5xzc
---

**What.** A `ChangeSet` node computed between two refs (`origin/main` and the
branch that STAGING rendered). For each block it records one of: added,
removed, modified (prose / structure / metadata), moved (new parent or order),
or renamed (via `renamedFrom`, child 01). It is keyed on folio/ graph ids,
**not** on file paths.

**Why not reuse `diff`.** The `diff` skill is `git diff origin/main..HEAD` over
the content `.ts` files. It sees files. A move across chapters, or two blocks
in one file, reads as noise at that level.

**Existing pieces to reuse, not rebuild:**
- `scripts/render-changed-blocks.ts` already computes "blocks this branch
  touched", but only for the PDF path.
- `staging-banner.ts` already writes `staging.json` with a compare-with-main
  deep link (g4dv).

**Publishing.** The ChangeSet ships as part of the staging deployment's
metadata graph. This is 6pfo's subject ("staging metadata as a KG graph"), so
it lands there, not in a second file. It is exposed as a Tool node
(`folio_changeset`) so an agent gets the same answer the page shows.

## Done when
- [ ] a `ChangeSet` schema in folio-assistant-core/schemas, with the five change kinds
- [ ] the computation is a Tool node bound to a BPMN task, tested on a fixture with each kind
- [ ] feature-staging.yml emits it into the staging metadata (coordinated with 6pfo)
- [ ] `diff` and `staging-review` read it instead of re-deriving from git
