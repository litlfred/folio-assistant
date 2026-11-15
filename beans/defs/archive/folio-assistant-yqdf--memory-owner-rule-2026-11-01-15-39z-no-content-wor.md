---
# folio-assistant-yqdf
$schema: bean/1.0.0
title: 'Memory: Owner rule 2026-11-01 15:39Z - no content work on smart-ra or any dth-* repo; other smart-* content OK; functional fixes OK'
status: completed
type: task
priority: low
created_at: 2026-11-01T15:40:12Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `content-pause-smart-ra-dth.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Owner rule 2026-11-01 15:39Z - no content work on smart-ra or any dth-* repo; other smart-* content OK; functional fixes OK

Owner (2026-11-01 15:39Z): "we can work on content from smart-* except smart-ra. dont work content on dth-*".

**Why:** owner's call; reason not given.
**How to apply:** pause content PRs such as dth-phc#12, dth-phc#4, smart-ra#203 and l1 exclusion sign-offs. Functional fixes (lockfiles, CI, publish gates) are still fine. Content work on other smart-* repos is allowed. dth-phc publish card Q-PHC13: A makes l1-coverage warn-only on publish, B waits. See folio-assistant-934v, folio-assistant-wmmg.

Refined 15:50Z: on ingested dth-* repos, content work that improves EXTRACTION is allowed (PNG -> computable graphic, fix content/ingestion errors, PDF -> computable assets) as long as semantic meaning is unchanged. Merges still need the owner's OK.
