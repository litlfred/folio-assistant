---
# folio-assistant-vt2w
$schema: bean/1.0.0
title: 'Memory: IG-style Contents card on ArchiMate pages — cat-harness-tools#1885 / PR #1888 (shared contents-card.js in scripts/templates)'
status: completed
type: task
priority: low
created_at: 2026-11-11T12:16:59Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `archimate-contents-card.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: IG-style Contents card on ArchiMate pages — cat-harness-tools#1885 / PR #1888 (shared contents-card.js in scripts/templates)

User 12:02Z 11-11: ArchiMate pages (e.g. smart-ra dpi-h-ra archimate) need the IG card TOC. Thread cmsg_017WNUkNK8kdDziPK58Pv6G9TUkZHyWzJYoA6z6NaPCdY8.
- IG card was only in fhir-harness (IG_CONTENTS_JS, see folio-assistant-yz7s); fhir-harness is above cat-harness-tools, so the card moved DOWN: cat-harness-tools `scripts/templates/contents-card.{js,css}` (`window.faContentsCard(scope)`, same igi-* classes), read via thin-page.ts `contentsCardScript/Style`, bundled into assets/archimate.{js,css}.
- Issue cat-harness-tools#1885, PR #1888 MERGED 17:37Z 11-11 (full suite via release label, Q-ATOC-1 A). Live on smart-ra etc. after they re-pin cat-harness-tools.
- Possible follow-up: fhir-harness switches IG_CONTENTS_JS to the shared copy.
- Screens: /mnt/project-files/archimate-contents-card-2026-11-11/
