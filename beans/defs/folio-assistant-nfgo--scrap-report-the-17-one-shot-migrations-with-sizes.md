---
# folio-assistant-nfgo
title: 'SCRAP: report the 17 one-shot migrations with sizes and ages — the decision is the owner''s'
status: todo
type: task
priority: low
created_at: 2026-09-20T04:36:04Z
updated_at: 2026-09-20T04:36:04Z
parent: folio-assistant-d308
---

The SCRAP row of `d308`. **17 files** — `migrate-*`, `codemod-*`, `fix-*`,
`wire_stale_claims`, `materialize_iw_queue`, `audit-wiring-migrate`,
`scripts/migrations/`.

These are the fossil record of previous reorganisations of this repository:
`fix-moved-scripts.py`, `fix-root-script-shim.py`,
`fix-cross-cluster-witness-loads.py`, `migrate-cluster-phase.py`,
`migrate-computation-paths.ts`, `migrate-cites.ts`, `migrate-lean-refs.ts`,
`codemod-leanval.ts`, `codemod-refterm.ts`, `codemod-val.ts`.

**BPMN:** none. That is the finding, not a gap in the analysis. A one-shot codemod
serves no task in any process, which under the owner's rule — *"the code needs to
do something"* — is exactly what disqualifies it.

## This bean does not delete anything

`deletion-requires-confirmation`: an agent never removes a durable artefact on its
own initiative. It reports what would go, **with sizes and ages**, and waits.

So the deliverable here is a REPORT — 17 paths, each with its size, its
last-touched date, and the reorganisation it belonged to — posted for the owner,
and nothing else. The owner decides. If the answer is keep, the answer is keep,
and the row stays in `d308` as a known permanent exception rather than a pending
action.

## The observation worth keeping either way

Ten of the seventeen exist because this repository has reorganised its own file
layout enough times to leave stratigraphy. `d308` proposes another reorganisation.
Whatever is decided about these files, the next migration should not add an
eighteenth: a codemod is a commit, not a committed script.

## Done when

- [ ] the 17 paths reported with size and last-touched date
- [ ] each attributed to the reorganisation it belonged to, where git can say
- [ ] the owner has answered
- [ ] nothing removed before that answer
