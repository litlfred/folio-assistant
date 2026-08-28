---
# folio-assistant-p9a2
title: content_validate reports 0 errors when the pipeline never ran
status: in-progress
type: bug
created_at: 2026-08-28T20:08:28Z
updated_at: 2026-08-28T20:08:28Z
---

Found by authoring real content in folio-test. content_validate resolves validate.ts from the FOLIO's content/pipeline/, which folio_init does not create — so the spawn fails with 'Module not found', stdout is empty, the ✗/⚠ counts are 0, and the tool reports 'Validation: 0 error(s), 0 warning(s)'. A check that never looked, reporting clean.
