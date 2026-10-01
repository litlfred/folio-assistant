---
# folio-assistant-3fva
title: 'ARC: QA & test evidence off main — a commit-keyed qa-reports branch, and a test-plan → certification process'
status: in-progress
type: epic
priority: high
created_at: 2026-10-01T07:59:35Z
updated_at: 2026-10-01T07:59:35Z
---

Issue #1763. Proposal, workplan, dispatch map and decisions D1–D5: `cat-harness/docs/proposals/qa-reports-branch-and-test-process-2026-10-01.md`.
Sibling of the QA epic `1swy` (an epic cannot be parented under an epic here).

Owner, 2026-10-01: do not pollute main with the QA subgraph; publish it on a
dedicated branch, as caching is; tie QA into a strawperson test process (an agent
or machine is tested against a test plan of many tests with their test data);
QA reports and test/certification/compliance reports are very similar.

This is the write-up `eqxp` said existed ("written up separately") and did not.

Measured at 61b1e747: QA is 2.1 % of tracked bytes but 18.9 % of changed paths
and 34.8 % of changed lines over the last 200 commits.

Related, not reparented: `eqxp`, `520m`, `cflw`, `mcdj` (merge friction); `rjug`
(the qa-report kind); `vm6m`, `vljz`, `y4uj`, `sopq` (test data, SME review,
sources, WHO SOPs); `i2kp`, `kgho`, `1xhc` (the stalled handover).

Claim: held by branch `claude/quirky-davinci-ixuymr`, session
https://claude.ai/code/session_01LKpuPotV3Ve5Za75DQ3AQR. Not pushed to main via
beans:claim, because this session pushes only to its own branch.

## Done when
- [ ] the owner has ruled D1–D5 (proposal §5)
- [ ] the 1.2 spike shows that CI AND a fresh agent container can both push to and read the branch
- [ ] every reader in proposal §4 Phase 3 reads from the branch, and the gates are green
- [ ] the moved files are removed from main, on the owner's explicit go
- [ ] one test plan has been executed and certified end to end (crdm-detect)
