---
# folio-assistant-16ei
title: 'qa-store: one read/write API for QA results, qa:fetch / qa:publish, ContentDirectory.storage, CI publish and a prune that fires'
status: todo
type: feature
priority: high
created_at: 2026-10-01T08:00:46Z
updated_at: 2026-10-01T08:00:55Z
parent: folio-assistant-3fva
blocked_by:
    - folio-assistant-3ds9
---

Arc `3fva`, proposal §2.2–2.4 and §4 Phase 2. Blocked on the SPIKE bean. Serial, one agent: everything else depends on this.

- `qa-store` module:
  - `readQa(ref, path)` returns hit / miss / corrupt / unknown, and a miss is never read as clean;
  - `publishQa(ref)` follows the lake-cache write path, with fetch → rebuild-on-tip → push, 3 attempts and `backoff-sleep.ts`, and never `-f`.
- `bun run qa:fetch [--ref main|<sha>|pr/<n>]` and `bun run qa:publish`.
- `storage: {branch, keyedBy}` on `ContentDirectory` (`schemas/cat-harness.ts`). `test/results/` goes into `.gitignore` only when it is set. `audit:coverage` and `check:harness-dirs` both honour it.
- CI publishes `main/<sha>` on push and `pr/<n>/<sha>` on PR (D3). A `check-workflows` finding `qa-reports-unretried`.
- A prune workflow on `schedule`. The lake-cache prune never ran, because its trigger cannot fire.

## Done when
- [ ] the module has 4-state tests on real git repositories, not mocks (as `520m` did)
- [ ] main and PR runs publish, and a sibling's entry survives concurrent writes
- [ ] the prune runs on schedule at least once
