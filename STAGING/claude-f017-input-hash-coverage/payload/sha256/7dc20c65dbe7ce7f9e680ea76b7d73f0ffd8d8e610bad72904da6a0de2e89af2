---
# folio-assistant-zmm2
title: 'B9d (#1168): rename voice source kgRef → path, skill front matter capability: → requiresCapability'
status: completed
type: task
priority: normal
created_at: 2026-09-30T10:54:25Z
updated_at: 2026-09-30T14:29:18Z
parent: folio-assistant-tr05
---

Owner, 2026-09-30: Rename both. Voice source kgRef holds a file path (76 uses); skill front-matter capability: (19 files) collides with the Capability kind. Codemod plus retired-name record so the old names fail loudly.

## Done when
- [ ] both renamed across the corpus, readers updated
- [ ] old names recorded as retired and rejected



## 2026-09-30 progress
- [x] voice source kgRef → path (37 voice files, schema, readers, tests). An old kgRef now fails the exactly-one refinement.
- [ ] skill front matter capability: — BLOCKED on owner. Its values (review, architecture, quality-assurance…) are categories, not Capability ids, and nothing reads it; requiresCapability would assert something false. Options: retire (B8a precedent), rename to e.g. area, keep.



## Done
- kgRef → path: #1593.
- capability: RETIRED (owner 2026-09-30, after the deeper analysis) rather than renamed: record fsh-guts/retired/skill-capability-front-matter.md; 5 role-less skills added to roles; smart-base became requiresCapabilities.
