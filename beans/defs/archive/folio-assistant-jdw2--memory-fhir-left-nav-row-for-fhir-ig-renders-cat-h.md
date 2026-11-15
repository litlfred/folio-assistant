---
# folio-assistant-jdw2
$schema: bean/1.0.0
title: 'Memory: [fhir] left-nav row for FHIR IG renders: cat-harness-tools#1186 merged 2026-10-31 (b5e81dc); staging check waits on an fa tools re-pin'
status: completed
type: task
priority: low
created_at: 2026-10-31T21:20:05Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `fhir-rail-row.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: [fhir] left-nav row for FHIR IG renders: cat-harness-tools#1186 merged 2026-10-31 (b5e81dc); staging check waits on an fa tools re-pin


User 2026-10-31: a harnessed FHIR IG gets a "[fhir]" row in the LHS rail's Harnesses list, linking the index.html of the IG's just-the-docs render.

Done in cat-harness-tools#1186 (issue #1185), merged b5e81dc 2026-10-31 21:20Z (user tapped A on Q-FHIRNAV1). Code: `scripts/lib/ig-render-row.ts`, wired in `mount-instance-docs.ts` where per-page rail harness rows are built. A directory is the IG render when it holds toc.html beside index.html; looked for at ig/ then root on a foreign (IG repo) site, <owner>/ig/ then <owner>/ on the platform site. Row goes right after the owner's harness row.

Expected: smart-base, smart-immunizations get it; smart-ra and dth-pc don't (no IG render on their sites yet).

Icon follow-up: cat-harness-tools#1189 merged eba0dfc 2026-10-31 21:25Z (flame glyph derived from the FHIR logo, tone 14; Q-FHIRNAV2 A).
Pending: verify on staging once folio-assistant re-pins tools to eba0dfc or later (fa#2862 pinned 6a9a5b3). github.io is blocked from sessions; read gh-pages via `gh api` instead. Thread "Add FHIR harness link to left nav".
