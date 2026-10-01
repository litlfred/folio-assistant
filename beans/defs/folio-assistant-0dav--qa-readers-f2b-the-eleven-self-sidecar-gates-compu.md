---
# folio-assistant-0dav
title: 'QA READERS F2b: the eleven self-sidecar gates compute and judge; audit-coverage stops reporting a moved kind as empty'
status: todo
type: task
priority: high
created_at: 2026-10-01T08:47:13Z
updated_at: 2026-10-01T17:34:54Z
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
- [x] with no fetch, `audit:coverage` reports `qa` and `health` as `unknown`, not `empty`
- [x] a seeded new finding fails a PR, and an inherited one does not


## Summary of Changes (2026-10-01, branch `qa-readers-f2-id4s-0dav`, not pushed)

`judgeQaResult` (in `qa-results.ts`) is the shared compute-and-judge rule:
- `failOn` families fail outright. Against a branch baseline, only NEW ones fail.
- `failOnNew` families fail only when NEW against a baseline. The baseline is the committed working copy before the move and `--against <ref>` after.
- A missing baseline is reported UNKNOWN and is never gated (proposal §2.3). Stale is advisory only.

Changes by gate (behaviour with results absent: before → after):
- `audit:coverage` (19d18bda): exit 1 on the absent self-sidecar → judged. **C8:** a declared directory that is neither stored nor present is now `uncounted`, and the `qa` and `health` rows read `unknown` instead of `empty, 0`.
- `root-scan-census:check` and `check:reference-direction:check` (521ab243): exit 1 → each fails only on a NEW exposed scan / unlisted multi-destination file / unqualified PENDING entry / undeclared instance. Reference-direction was already red on this branch's head; it now names the files.
- `check:term-mapping` and `check:glossary` (ba589a2b): exit 1 and six stale pages → the glossary computes the mapping with check-term-mapping's own `run`/`perScheme`. Pages are byte-identical in both states.
- `readme:subgraphs:check` (c9996538): judges its sidecar, and a `qa`/`health` directory may leave main. `absent-directory` findings go from 15 to 0.
- `check:viewer-nav` (7189cc4d): regresses against a baseline. A missing baseline used to exit 1; it is now UNKNOWN, and the regression half is explicitly not claimed.
- `check:l1-complete --check` (1d99b8e4): exit 1 → the committed verdicts are advisory. The UNMET exit is unchanged.
- `check:harness-state:check` (57f2877e): exit 2 → the health report is a stored record. It is read via `readQaTree` with `--against`, otherwise `Family.stored` reports UNKNOWN.
- `skill:register`: its own sidecar is unchanged (r7v6 already stopped the write in check).

### Done when
- [ ] every gate above passes on `main` with `test/results/` and `test/health/results/` absent: **13 of 15 runs pass.** The two left:
  - `readme:subgraphs:check`: `cat-harness/test/README.md` lists `results/` and `health/` with file counts. This is a docs README of the tree, and it goes stable once 5hox untracks and gitignores the results and regenerates it.
  - `skill:register:check`: its verify chain is red on `lsi:*`, `kg:detangle` (oq1j), `kg:audit` (F1) and `uml:overview`. Those are other families.
- [x] with no fetch, `audit:coverage` reports `qa` and `health` as `unknown`, not `empty`
- [x] a seeded new finding fails a PR, and an inherited one does not (`tests/qa-baseline.test.ts`, against the working copy and against a real `qa-reports` remote)
