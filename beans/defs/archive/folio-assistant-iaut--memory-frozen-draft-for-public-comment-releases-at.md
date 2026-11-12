---
# folio-assistant-iaut
$schema: bean/1.0.0
title: 'Memory: Frozen "Draft for Public Comment" releases at gh-pages PC/<version>/ plus a line-numbered PDF (cat-harness-tools#1145)'
status: completed
type: task
priority: low
created_at: 2026-10-31T14:15:04Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `pc-release.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Frozen "Draft for Public Comment" releases at gh-pages PC/<version>/ plus a line-numbered PDF (cat-harness-tools#1145)


- 2026-10-31: cat-harness-tools draft PR #1145 (issue #1144). It adds scripts/pc-release.ts (freeze/close/verify) and scripts/pc-line-numbered-pdf.ts.
- Freeze is write-once: it copies STAGING/<slug>/ to PC/<version>/ and writes release.json with every file's sha256. Close is the archive step and changes only the record.
- PC/ is reserved by publish-main-site, kept by build-instance-site, and carried by restore-staging.
- The PDF uses Chromium with gutter line numbers that run continuously by default. Each number is read back with pdftotext. It writes pc-line-map/v1 (block anchor to lines and page).
- The BPMN side is Process_PublicCommentRelease in folio-assistant-core: Task_BuildPcRelease and Task_ArchiveRelease, skill document-publishing. See folio-assistant-2a0d.
- 2026-10-31 14:16Z: user chose continuous line numbering (option A), which is what the PR already does.
- 2026-10-31 14:26Z: PR #1145 merged (squash 8eb9198) on the user's card OK. Folios pick it up on their next cat-harness-tools repin.
