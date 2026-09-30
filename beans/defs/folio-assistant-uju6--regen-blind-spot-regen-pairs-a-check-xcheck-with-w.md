---
# folio-assistant-uju6
title: 'REGEN BLIND SPOT: regen pairs a check `X:check` with writer `X`, so a `check:X` gate whose writer is spelled differently is never repaired'
status: todo
type: bug
created_at: 2026-09-30T08:57:47Z
updated_at: 2026-09-30T08:57:47Z
parent: folio-assistant-1xhc
---

Measured 2026-09-30 on PR #1550. `Repository gates` failed on `check:prov-qaqc`: `cat-harness/docs/prov-qaqc/index.md` was stale after #1533 added a workflow instance (`code-change-review--issue-1531-upload-step`) without regenerating it. `bun run regen` reported "63 current, 0 regenerated" across the whole episode. It never asked this check, because it pairs by the `X:check` → `X` spelling, and here the check is `check:prov-qaqc` while the writer is `prov:qaqc`.

Of the 103 `check:*` gates in `code-quality-gates.yml`, 4 have a writer under another spelling, so regen cannot repair any of them:
- `check:harness-dirs` / `harness:dirs`
- `check:prov-qaqc` / `prov:qaqc`
- `check:raci` / `raci`
- `check:subgraphs` / `subgraphs`

Some of these "writers" may only report, not write, so read each before pairing it.

Sibling of `14ve` (regen is one pass, not a fixed point). Both are ways regen says "current" over a tree that fails a gate.

## Fix
Declare the pairing rather than inferring it from the script name. Either map each check to its writer in one table that regen reads, or rename to the `X` / `X:check` convention. A check with no declared writer stays `no-writer`, and is reported as such rather than silently skipped.

## Done when
- [ ] each of the 4 gates above is paired with its writer, or recorded as having none
- [ ] regen repairs a stale prov-qaqc page after a merge that adds a workflow instance
