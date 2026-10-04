---
# folio-assistant-yzp9
title: 'Preview cap by size: rotate STAGING previews to a 3 GB total, not a count of 10'
status: in-progress
type: task
priority: normal
created_at: 2026-10-04T06:10:18Z
updated_at: 2026-10-04T06:10:22Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-04 (session 01LW3Zx): replace the #1868 count cap (MAX_PREVIEWS = 10) with a byte budget, 3 GB. Previews grew from ~88 MiB (2026-09-22) to 200-780 MB, so 10 previews rotate off in 1-2 h. Keep the current preview + the most recently updated others while the total fits; remove the rest oldest-first, same records as today.

- [ ] staging-rotate.ts: MAX_PREVIEW_BYTES, planRotation by bytes
- [ ] tests
- [ ] skills (feature-staging, staging-review, render-logging), bpmn doc, workflow comments, gates.ts text
- [ ] health check basis (staging-preview-size) names the new budget
