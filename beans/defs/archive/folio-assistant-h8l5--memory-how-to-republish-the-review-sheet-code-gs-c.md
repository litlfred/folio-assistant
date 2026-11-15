---
# folio-assistant-h8l5
$schema: bean/1.0.0
title: 'Memory: How to republish the review-sheet Code.gs copy page after a core merge (no thread owns it)'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `review-sheet-copy-page.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: How to republish the review-sheet Code.gs copy page after a core merge (no thread owns it)

The copy page https://claude.ai/artifact/MXNQcLMzLYqq5us5x6phGd is where the user gets each new Code.gs build (updateFromGitHub is broken, so never ask them to run it). No thread owns it (coordinator, 2026-11-01). After a review-sheet-sync merge, the merging thread republishes it at the same URL: an h2 "Code.gs build <sha16>, <KB> KB", a Copy button, 3 steps, and `<pre id="c">` with the HTML-escaped dist/Code.gs from main. Read the live page in full before republishing. 2026-11-01 20:4xZ: version 26, build 4a63cef7486b08c1 (core#474).
Related: folio-assistant-azlf, folio-assistant-jyv2.

- 2026-11-08: core#690 (issue #689, Q-TBL-1 A) adds openInSheetLock so Title opens under a template's whole-tab lock; Title on RA log + PC template already made blue by API 11-02. Merged 2026-11-09 14:1xZ (Q-TBL-2 A); copy page republished as version 33, build a6f49f795b895460. Config LATEST_BUILD rows not updated.
