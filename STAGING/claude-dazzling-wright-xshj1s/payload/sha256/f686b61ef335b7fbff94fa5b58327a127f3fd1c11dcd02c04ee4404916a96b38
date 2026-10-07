---
# folio-assistant-yzp9
title: 'Preview cap by size: rotate STAGING previews to a 3 GB total, not a count of 10'
status: completed
type: task
priority: normal
created_at: 2026-10-04T06:10:18Z
updated_at: 2026-10-04T17:26:07Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-04 (session 01LW3Zx): replace the #1868 count cap (MAX_PREVIEWS = 10) with a byte budget, 3 GB. Previews grew from ~88 MiB (2026-09-22) to 200-780 MB, so 10 previews rotate off in 1-2 h. Keep the current preview + the most recently updated others while the total fits; remove the rest oldest-first, same records as today.

- [x] staging-rotate.ts: MAX_PREVIEW_BYTES, planRotation by bytes
- [x] tests
- [x] skills (feature-staging, staging-review, render-logging), bpmn doc, workflow comments, gates.ts text
- [x] health check basis (staging-preview-size) names the new budget

## Summary of Changes

Preview rotation is capped by size (`MAX_PREVIEW_BYTES` = 3 GiB, `planRotation` by bytes), with tests, skill and doc text, and the health check's basis names the budget. Owner ruling: *"Cap by size, not count"*, 3 GB. Health re-run on 2026-10-04: `staging-preview-size` is determined and finds 7 previews at 3.18 GB, over the 3.00 GB budget, which is the check working. Lands with PR #2055 (owner: *"Approve"*, 2026-10-04).
