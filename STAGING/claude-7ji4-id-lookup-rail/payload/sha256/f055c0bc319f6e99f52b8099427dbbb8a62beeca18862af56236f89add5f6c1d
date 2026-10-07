---
# folio-assistant-oqe3
title: 'Gates: the 16 stale-check gates become compute-and-judge, with --against <ref> for new-vs-inherited findings'
status: in-progress
type: feature
priority: high
created_at: 2026-10-01T08:00:46Z
updated_at: 2026-10-02T16:32:42Z
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
- [x] a seeded new finding fails a PR, and an inherited one is reported but does not fail



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

## Done on local branch qa-3hk4-oqe3, 2026-10-02 (NOT pushed)

These are the last stale-compare gates of the 16, the ones the 5hox inventory found still red with the files absent (group A). They now compute and judge, following bo44 and 0dav:

- **`kg:audit:check`** (`kg-audit.ts --check --against main`). It grades every fail or unknown criterion at the gate's severity, one entry per finding. The rule is `gradedKgFindings` in `schemas/kg-qa.ts`, beside `worstSeverity`, so a second finding in an already-failing subject is new. It runs in "absolute" mode: against a branch baseline only new findings fail, and with no readable baseline every finding fails, as before.
  - Still failing: a committed attestation file the run would rewrite, an attestation orphan, and unreadable judgements, which exit 2.
  - A stale or orphaned derived sidecar is advisory in a stored tree and a finding in an unstored one.
  - `--json` now writes its report synchronously. A large `console.log` to a pipe was truncated by `process.exit`.
- **`kg:audit:all:check`** passes `--against` through and relays each instance's judge line. It keeps the four states: a blind instance exits 2.
- **`translation:block-qa:check`** (`--check --against main`) grades `fail` verdicts by substance: criterion, severity, evidence and notes. Timestamps and hashes are excluded, so a re-run does not make an inherited finding new. It runs in "new" mode: only new findings fail, and no baseline means UNKNOWN, which is not gated. Refused pairs exit 2. There are 3 `fail` entries today, so "absolute" mode would have turned a green gate red.
- **`skill:register:check`'s chain** now clears its kg:audit step. It stays red with the files absent only through `lsi:viz:check` and `uml:overview:check`, which are group B.
- The shared judge is `judgeSidecarTree` in `qa-results.ts`. With `--against` it reads the ENTRY first, so an absent entry is ONE unknown, never N new subjects. Inside a readable entry, a missing path means a subject that is new in this change.

Not migrated by name, because they already were (judge mode or not a reader): `audit:coverage:*`, `check:harness-state:check`, `lsi:skills:check`, `kg:detangle:check`, `readme:subgraphs:check`, `root-scan-census:check`, `check:term-mapping`, `check:viewer-nav`, `check:reference-direction:check`. `check:prov-qaqc` is not a reader. `lsi:viz:check` and `docs:pages:check` are 4l4d or group B.

Tests: `cat-harness/scripts/tests/qa-tree-judge.test.ts` (16).
- They cover new vs inherited against the working copy and against a real bare remote, entry-miss = one unknown, an unreachable remote = unknown, extraFailing and undetermined, and what each gate grades.
- CLI runs: an unknown flag and a malformed `--against` each exit 2. kg:audit:check and translation:block-qa:check against a remote with no entry print UNKNOWN, are not gated, and leave `git status` unchanged.

**`bun run gates` with the files ABSENT** (scratch = 2e5c88e52 + 420ab8180, fresh tree): **11 of 206 red, down from 16 of 205.**
- Cleared: `kg:audit:check`, `kg:audit:all:check`, `translation:block-qa:check`, `readme:subgraphs:check` and `bun test`.
- Remaining, all expected:
  - Group B, waiting for a `main/` entry: `lsi:viz:check`, `uml:overview:check`, `check:qa-reviewer-permission`, `check:orphan-verdicts`, `check:kind-validators:require-all`, `check:declared-paths`.
  - `skill:register:check` ×2, red through lsi:viz and uml:overview, so also group B.
  - Group C, 4l4d, committed pages embedding QA badges: `docs:pages:check`, `check:ci-invocations`.
  - Group E, CI-only: `translation:catalogue:check --base`.

Done-when:
- not yet: "every gate listed passes on main with test/results/ absent" — not yet. The group B gates need a main/ entry, and docs:pages needs 4l4d.
- verified: "a seeded new finding fails a PR, and an inherited one is reported but does not fail" — pinned for the tree judge on a real remote, and per gate by what it grades. Not shown end to end on a real PR.
