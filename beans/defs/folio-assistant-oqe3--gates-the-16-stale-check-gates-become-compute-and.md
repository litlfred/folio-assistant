---
# folio-assistant-oqe3
title: 'Gates: the 16 stale-check gates become compute-and-judge, with --against <ref> for new-vs-inherited findings'
status: todo
type: feature
priority: high
created_at: 2026-10-01T08:00:46Z
updated_at: 2026-10-01T08:48:10Z
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



## Refined by the reader audit (`gxvk`, 2026-10-01)
`cat-harness/docs/proposals/qa-readers-audit-2026-10-01.md` measured every gate on this list with `test/results/` moved aside. The work is now queued per reader family, and this bean is the umbrella for the gate half:
- `folio-assistant-2gst` (F1): `kg:audit:check` and `kg:audit:all:check` (3.1a). **Two false-cleans**: pair attestations 13 → 0 findings, and test-run criteria `pass` → `n/a`.
- `folio-assistant-0dav` (F2b): `audit:coverage:*`, `check:harness-state:check`, `skill:register:check`, `readme:subgraphs:check`, `root-scan-census:check`, `check:term-mapping`, `check:viewer-nav`, `check:reference-direction:check`, `check:glossary`, `check:l1-complete`. `audit-coverage` reports a moved kind as `empty` (false-empty).
- `folio-assistant-id4s` (F2a): `qa-results.ts`, `check-version-bump.ts` and `check-published-instance-exports.ts`.
- `folio-assistant-oq1j` (F3): `lsi:skills:check`, `lsi:viz:check`, `kg:detangle:check` and `uml:overview:check` (3.1b).
- `folio-assistant-8wj1` (F4): `translation:block-qa:check` (3.1b).
- `folio-assistant-tfqf` (F6): `docs:pages:check`.
- `folio-assistant-c8uq` (F5): `check:orphan-verdicts` and `check:qa-reviewer-permission`, which this list did not name. **Both pass on an empty corpus.**

Corrections to this list:
- **`check:prov-qaqc` is not a reader.** It writes `docs/assets/prov/` and never opens `test/results/` (its output was identical in both runs).
- **`check:published-instance-exports` compares nothing today.** Both of its invocations use `export-graph`, which writes no sidecar. That is `folio-assistant-r7v6`.
