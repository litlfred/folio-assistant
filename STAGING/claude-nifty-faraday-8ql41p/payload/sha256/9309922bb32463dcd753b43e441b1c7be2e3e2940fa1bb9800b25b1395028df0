---
# folio-assistant-0dav
title: 'QA READERS F2b: the eleven self-sidecar gates compute and judge; audit-coverage stops reporting a moved kind as empty'
status: todo
type: task
priority: high
created_at: 2026-10-01T08:47:13Z
updated_at: 2026-10-01T08:47:13Z
parent: folio-assistant-3fva
blocked_by:
    - folio-assistant-16ei
---

Arc `3fva`, from reader audit `gxvk` (`cat-harness/docs/proposals/qa-readers-audit-2026-10-01.md`, family F2b). Refines `oqe3` 3.1c and part of 3.1a. Blocked on `16ei`. Its write-in-check fixes to `skill-register.ts` and `check-harness-state.ts` come from the live-defects bean, which must land first.

## Readers
Every one of these compares its OWN committed sidecar with a fresh run:
- `cat-harness/scripts/audit-coverage.ts:538`: `audit-coverage.qa-results.json` (A). Loud when absent.
- **C8** `audit-coverage.ts:301` `census`: the `qa` and `health` directories (B). **Absent today: FALSE-EMPTY.** The `qa` row goes from `covered`, 278 files, to `empty`, 0, and so does `health`. Masked only because the same run fails on its absent self-sidecar.
- `cat-harness/scripts/root-scan-census.ts:246-249` (A). Loud: exit 0 → 1.
- `cat-harness/scripts/check-reference-direction.ts:936-939` (A). Loud.
- `cat-harness/scripts/check-term-mapping.ts:424` (A). Loud.
- `cat-harness/scripts/subgraph-readmes.ts:155-160` (A). Loud. The absent run also counted 14 `test/results/` directories as absent.
- `cat-harness/scripts/check-viewer-nav.ts:75,161-189` (A). Loud on a missing sidecar; a stale one exits 0.
- `cat-harness/scripts/check-l1-complete.ts:1288-1300` (`--check`, `library-qa/**`) (A). Loud.
- `cat-harness/scripts/skill-register.ts:665` and its verify chain (A). Loud. It writes in check.
- `folio-assistant-core/scripts/glossary-page.ts:595` (`check:glossary`, `term-mapping.qa-results.json`) (A/C). Loud.
- `cat-harness/scripts/check-harness-state.ts:151-161` (the health report) (B). Correct unknown: exit 2. It writes in check.

## Migration action
- Compute and judge. "Stale" stops existing. `--against qa-reports:main/<merge-base>` reports new findings separately from inherited ones. A missing baseline is `unknown`.
- `audit-coverage` honours `ContentDirectory.storage`: a kind stored on the branch is census-ed from the fetch, or reported `unknown`. It is never `empty`.

## Done when
- [ ] every gate above passes on `main` with `test/results/` and `test/health/results/` absent from the checkout
- [ ] with no fetch, `audit:coverage` reports `qa` and `health` as `unknown`, not `empty`
- [ ] a seeded new finding fails a PR, and an inherited one does not
