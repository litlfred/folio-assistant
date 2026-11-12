---
# folio-assistant-jxsu
$schema: bean/1.0.0
title: 'Memory: Public-comment release channels (Excel, Google Form, GitHub issue form, review sheet) and their intake; skill + tool in folio-assistant-core'
status: completed
type: task
priority: low
created_at: 2026-10-31T13:58:22Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `public-comment-channels.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Public-comment release channels (Excel, Google Form, GitHub issue form, review sheet) and their intake; skill + tool in folio-assistant-core


- 2026-10-31: skill `public-comment-channels` + `scripts/public-comment-channels.ts` (core PR #423 MERGED d5f3dba 2026-10-31 15:26Z, closes #421). refs -> release-references.json from review-anchors.json; xlsx / google-form / issue-form generated from it; issues-csv + check; all intake via existing `public-comment.ts import`.
- Plugs into Process_PublicCommentRelease (core#419) Task_SetUpChannels and Task_WriteAnnouncement.
- Submitters (owner 2026-10-31 14:07Z): record in the review sheet's "Public Comment Source" tab, one row per comment, like DPI-H RefArch (details copied per comment row; repo gets id only, name with consent). Not a Submitters tab, not Config.
- Related: folio-assistant-2a0d.
