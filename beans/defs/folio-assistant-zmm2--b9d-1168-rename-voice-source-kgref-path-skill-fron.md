---
# folio-assistant-zmm2
title: 'B9d (#1168): rename voice source kgRef → path, skill front matter capability: → requiresCapability'
status: todo
type: task
created_at: 2026-09-30T10:54:25Z
updated_at: 2026-09-30T10:54:25Z
parent: folio-assistant-tr05
---

Owner, 2026-09-30: Rename both. Voice source kgRef holds a file path (76 uses); skill front-matter capability: (19 files) collides with the Capability kind. Codemod plus retired-name record so the old names fail loudly.

## Done when
- [ ] both renamed across the corpus, readers updated
- [ ] old names recorded as retired and rejected
