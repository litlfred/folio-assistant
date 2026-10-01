---
# folio-assistant-oqe3
title: 'Gates: the 16 stale-check gates become compute-and-judge, with --against <ref> for new-vs-inherited findings'
status: todo
type: feature
priority: high
created_at: 2026-10-01T08:00:46Z
updated_at: 2026-10-01T08:00:55Z
parent: folio-assistant-3fva
blocked_by:
    - folio-assistant-16ei
---

Arc `3fva`, proposal §2.3 and §4 item 3.1. Blocked on the qa-store bean. Can be dispatched to 3 agents, one per family.

- 3.1a: `kg:audit:check`, `kg:audit:all:check`, `audit:coverage:require-all/strict`, `check:harness-state:check`
- 3.1b: `lsi:skills:check`, `lsi:viz:check`, `kg:detangle:check`, `translation:block-qa:check`
- 3.1c: `skill:register:check`, `readme:subgraphs:check`, `root-scan-census:check`, `check:term-mapping`, `check:viewer-nav`, `check:prov-qaqc`, `check:reference-direction:check`, `docs:pages:check`
- also: `check-version-bump.ts` and `check-published-instance-exports.ts`, which read committed sidecars

New semantics:
- a critical finding exits 1;
- "stale" no longer exists;
- `--against` diffs with `qa-reports:main/<merge-base>` and reports new findings separately from inherited ones;
- a missing baseline is `unknown`. It is reported, and it does not fail the PR.

This retires the defect class behind `uju6`, `5qq3`, `ymsu`, `3ozg` and `i2kp`.

## Done when
- [ ] every gate listed passes on main with `test/results/` absent from the checkout
- [ ] a seeded new finding fails a PR, and an inherited one is reported but does not fail
