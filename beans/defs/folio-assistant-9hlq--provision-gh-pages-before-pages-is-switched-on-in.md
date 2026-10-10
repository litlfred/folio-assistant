---
# folio-assistant-9hlq
$schema: bean/1.0.0
title: Provision gh-pages before Pages is switched on, in every publishing route (#2417)
status: completed
type: task
priority: normal
created_at: 2026-10-07T12:06:33Z
updated_at: 2026-10-08T04:30:00Z
parent: folio-assistant-0mpw
---

Issue #2417. FR-1..FR-4: pages-bootstrap unprovisioned state + --provision; getting-started.bpmn Provision gh-pages task; skills getting-started/repo-conversion/remote-mount name the step. Owner rulings 2026-10-01 and 2026-10-07.

## Completed on landed evidence
Landed on main in PR #2417 (commit fa491d3d5a0c, "Provision gh-pages before Pages is switched on, in every publishing route (#2417)").
- FR-1/FR-2: `pages-bootstrap.ts` checks `gh-pages` presence, supports `--provision` flag, exit 3 `unprovisioned` outcome.
- FR-3: `getting-started.bpmn` updated with `Task_ProvisionGhPages`.
- FR-4: Skills updated (`getting-started`, `repo-conversion`, `remote-mount`).
- Tests added in `pages-bootstrap-provision.test.ts` (158 lines).
- Verified on main.
