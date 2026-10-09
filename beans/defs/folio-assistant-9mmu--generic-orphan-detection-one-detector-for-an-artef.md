---
# folio-assistant-9mmu
title: 'GENERIC ORPHAN DETECTION: one detector for an artefact that names a subject that is gone, across graph kinds'
status: completed
type: feature
priority: normal
created_at: 2026-10-04T15:10:08Z
updated_at: 2026-10-09T18:05:00Z
parent: folio-assistant-zzmr
---

Recorded from the qou work-plan analysis, 2026-10-04 (session https://claude.ai/code/session_01NdDGeP1SyShmoUssLuRZ91). Not started: recorded so the gap has an owner. Orphan selectors exist per artefact family (s8nu found four for one question). qou showed orphans in beans (parents gone), branches (work not on main), and block sidecars. Proposed: one kg:audit criterion family over every declared graph kind, report-only.

## Closed 2026-10-09

Implemented generic orphan detection across declared graph kinds (`beans`, QA sidecars, attestations) in `scripts/orphan-detector.ts` and registered the `orphan-subject-resolves` criterion in `schemas/kg-qa.ts` and `scripts/kg-audit.ts`.

- **Commit**: `e0f5de8c1f84f51e5245a945c9e992ca1eb084a2`
- **Branch**: `claude/9mmu-generic-orphan-detection`
- **Criterion**: `orphan-subject-resolves` (applies: `["graph"]`, scope: `"repo"`, severity: `"minor"`, vacuity-guarded).
- **Verification**:
  - `bun test scripts/tests/orphan-detector-audit.test.ts` (12 pass, 0 fail): verified vacuity guard (empty candidate set returns `unknown`), positive detection of missing bean parents/blocking targets, missing sidecar subjects, unreadable sidecars, missing attestation subjects, clean resolution, and integration with kg-audit.
  - `bun run typecheck` passed with 0 errors.

