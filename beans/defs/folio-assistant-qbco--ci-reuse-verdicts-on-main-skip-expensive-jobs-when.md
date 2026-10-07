---
# folio-assistant-qbco
title: 'CI: reuse verdicts on main — skip expensive jobs when the tree was already verified green; cancel superseded main runs'
status: in-progress
type: task
priority: normal
created_at: 2026-10-07T19:39:27Z
updated_at: 2026-10-07T20:51:46Z
parent: folio-assistant-hfag
---

Issue #2456. Owner approved 2026-10-07 ~19:40Z ("1y, 2y, 3y, 4y"). Measurements in the issue body.

_2026-10-07T19:39:38Z_ — Claimed by claude/ci-runner-budget (session https://claude.ai/code/session_013WbQekVypi9A6YQbLDXMmJ).

## Done on claude/ci-runner-budget (PR #2457), 2026-10-07 (commit 86ad61f3976)

- (a) concurrency: push events share one group per ref and cancel-in-progress. The comment cites #2456 and the ruling ("1y, 2y, 3y, 4y"). workflow_dispatch (merge-main judging a PR branch) stays per-sha and uncancelled.
- (b) `verdict-reuse` job (push only) + `cat-harness/scripts/verdict-reuse.sh`. It reuses only when ALL hold: a two-parent merge; a run on the second parent concluded success; that run's recorded tested tree (`tested-tree:` in the producer's check-run summary, or the head's tree for dispatch) equals HEAD^{tree}; and all 8 skippable jobs succeeded in it. Then the 4 test shards, the 3 e2e shards and the standalone ratchet are skipped; the gates roll-up accepts the skipped ratchet only then; the summary names the reused run. Anything undetermined runs everything. Kept on main: lint/types, hygiene, gates-kg/docs/unrun, skill chain (some judge against main or read qa-reports), qa-publish.
- Measured ceiling: 24 of the 40 merges before 2026-10-07 20:00Z had a green run on the merged head before the merge. Runs made before this change carry no tested-tree record, so reuse starts after merge.
- On PR runs the job is skipped instantly (observed on run 37683602404), so e2e and standalone do not wait for it.
- Evidence still owed: one main push after merge showing reuse or a stated no-reuse.
