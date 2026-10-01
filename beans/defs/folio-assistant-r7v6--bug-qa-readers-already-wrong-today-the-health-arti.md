---
# folio-assistant-r7v6
title: 'BUG: QA readers already wrong today — the health artifact is never uploaded, a dead export comparison, a legacy qa-agent-write path, gates that write in --check'
status: todo
type: bug
priority: high
created_at: 2026-10-01T08:47:15Z
updated_at: 2026-10-01T08:47:15Z
parent: folio-assistant-3fva
---

Arc `3fva`, found by reader audit `gxvk` (`cat-harness/docs/proposals/qa-readers-audit-2026-10-01.md` §4.1, **C2 and C3**, plus R11, R21, R50). **Live today, and not blocked on `16ei`.** Each item is a reader that is wrong already, whatever happens to the branch.

## Readers and defects
- **C3** `.github/workflows/health-check.yml:132` uploads `test/health/results/repository.health-report.json`, which is relative to the repository root. `cat-harness/test/health/run.ts:200` writes `healthReportPath(ROOT)` with `ROOT` = the instance root (`run.ts:54`), so the file is at `cat-harness/test/health/results/`. With `if-no-files-found: warn`, the job is green and keeps nothing. Measured: `gh api repos/litlfred/folio-assistant/actions/runs/36827961155/artifacts` → `total_count: 0`. `cat-harness/test/health/workflow.test.ts:122` passes over the wrong path, because it only checks `toContain("repository.health-report.json")`.
- **C2** `cat-harness/scripts/check-published-instance-exports.ts:263-267`: the committed-sidecar comparison never runs. Both invocations use `export-graph`, which writes no sidecar. `cat-harness/test/results/kg-export.bootstrap.qa-results.json` therefore has no live producer and no live reader. Measured: identical output with the file present and absent.
- `cat-harness/src/qa-agent-write.ts:163,181,225` reads and writes the LEGACY `${base}.qa.json` beside the block. `existingBlockQaPath` prefers `test/results/block-qa/`, so an agent verdict written here is shadowed by the results-tree copy.
- **Gates that write in `--check`:** `skill:register:check` modified the committed `skill-register.qa-results.json` (four `current: true → false`). In a run over an absent tree, `check:harness-state:check` and `skill:register:check` recreated their sidecars. A check that writes is the `ymsu` / gate-tree-mutation defect.

## Done when
- [ ] the next scheduled health-check run carries a `repository-health-report` artifact, and the workflow test asserts the exact path
- [ ] the export comparison either has a subject, or is removed (with the owner's go, since it deletes a gate half) and the orphaned `kg-export.bootstrap.qa-results.json` is reported for a person to decide on
- [ ] `qa-agent-write` writes where `existingBlockQaPath` reads, with a test
- [ ] `skill:register:check` and `check:harness-state:check` leave `git status` clean
