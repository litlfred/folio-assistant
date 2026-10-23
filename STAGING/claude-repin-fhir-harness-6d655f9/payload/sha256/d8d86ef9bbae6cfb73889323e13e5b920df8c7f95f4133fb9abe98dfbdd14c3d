---
# folio-assistant-r3ei
$schema: bean/1.0.0
title: 'f017 follow-up: review the remaining input sites that block ~57 checks from the input-hash skip'
status: completed
type: task
created_at: 2026-10-06T22:53:13Z
updated_at: 2026-10-09T17:16:51Z
parent: folio-assistant-xpcu
---

PR #2327 (bean f017) audits every skippable check's import closure. `bun run cat input-hash:coverage --blockers` lists the unannotated sites that keep the remaining ~57 declared tasks running every time.

The biggest blockers:
- kind-validator.ts:196: a computed import of validator modules.
- staging-stamp.ts:61 and :81: environment reads.
- kg-export.ts: spawn, clock, env and host.

Each site needs reading, then one of: an annotation with the right verdict, a `traced` hook, or a small refactor that moves the impure read to its one caller (as `freshness()` did).

## Done when
- [x] each listed blocker is annotated, traced or refactored, with its reason
- [x] the coverage report's blocked count is re-measured and recorded here

## Closed 2026-10-09

- **Branch:** `claude/r3ei-input-hash-blockers`
- **Commit:** `dfeb31e6` (`feat(input-hash): annotate input sites in kind-validator, staging-stamp and kg-export (folio-assistant-r3ei)`)
- **Blocker sites annotated & resolved:**
  - `schemas/kind-validator.ts:196`: annotated with `imports */schemas/**/*.ts,*/src/**/*.ts,schemas/**/*.ts,src/**/*.ts #771876e3` covering validator modules referenced by graph typology and node-kind declarations.
  - `scripts/staging-stamp.ts:61` & `:81`: annotated with `env GITHUB_SHA,KG_BRANCH,GITHUB_REF_NAME,GITHUB_RUN_ID #8cd909dc` and `#631c5920` for CI staging build/git identity variables.
  - `scripts/kg-export.ts:2512`: annotated with `tree #f295b07d` (git ls-files count of committed files under dir).
  - `scripts/kg-export.ts:2797`: annotated with `tree; head #952da9d7` (HEAD commit, status, and remote origin for source provenance).
  - `scripts/kg-export.ts:3389`: annotated with `inert #b5aa0ca3` (export timestamp, ignored by check/judge).
  - `scripts/kg-export.ts:3493` & `:3649`: annotated with `env KG_BASE_URL #fa804f2f` (base URL override for export IRI resolution).
  - `scripts/kg-export.ts:3594`: annotated with `inert #b05195b2` (scratch tmpdir removed in finally).
  - `scripts/kg-export.ts:3605`: annotated with `runs */scripts/kg-export.ts,scripts/kg-export.ts #393d449f` (spawns export of each declared instance graph).
  - `scripts/kg-export.ts:3705`: annotated with `inert #1d8aaee1` (default export destination, write-only path).
- **Test Evidence:**
  - `bun test scripts/tests/input-sites.test.ts`: 35 pass, 0 fail (2.08s)
  - `bun test scripts/tests/changed-paths.test.ts`: 33 pass, 0 fail (662ms)
  - `bun run typecheck`: clean (tsc --noEmit -p tsconfig.json exits 0)
- **Re-measured blocker counts:**
  - `schemas/kind-validator.ts:196`: reduced from 20 blocked tasks to 0 (completely unblocked).
  - `scripts/staging-stamp.ts:61` & `:81`: reduced from 13 blocked tasks each to 0 (completely unblocked).
  - `scripts/kg-export.ts`: sites previously blocking 12 tasks each reduced to 0 (completely unblocked).
  - All annotated blocker sites in kind-validator, staging-stamp, and kg-export verified `ok` by `input-hash-coverage.ts --sites`.
