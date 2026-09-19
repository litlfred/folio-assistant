---
# folio-assistant-nytj
title: 'A sidecar records its auditor''s hash, so two concurrent PRs go green alone and red together'
status: todo
type: task
priority: normal
created_at: 2026-09-19T00:26:19Z
updated_at: 2026-09-19T00:35:15Z
---


_2026-09-19T00:35:15Z_ — A THIRD instance of this shape, 2026-09-19, different mechanism again — worth recording together because the FAMILY is what matters. feature-staging's stage job checks out github.event.pull_request.head.ref, the BRANCH HEAD, while the workflow FILE comes from the merge ref. So main's steps run against the branch's files. PR #307 added both a new step ('Emit the knowledge-graph viewer') and the script it runs; any branch cut before #307 landed then executed that step with no scripts/kg-viewer.ts in its tree and failed with 'error: Module not found'. Green on main, green on the branch, red on the pull request — and the branch author did nothing wrong. Fixed by merging main in, the same remedy as the sidecar case and for the same underlying reason. THE FAMILY, all three found in one session: (1) a sidecar records the hash of its AUDITING SCRIPT, so a PR editing the auditor and a PR adding a subject are each green alone and red merged; (2) a concurrency group serialises only the jobs that NAME it, so a partial fix looks complete from inside the file that has it; (3) a workflow whose checkout ref differs from its workflow-file ref runs new steps against old trees. Each is invisible to the CI of either contributing change, because the state that breaks is the one neither PR evaluates. That common structure is an argument for a merge queue rather than for three separate guards.
