---
# folio-assistant-2gst
$schema: bean/1.0.0
title: 'Memory: Never ask the owner to turn on Pages until that repo''s gh-pages branch exists (checked live at ask time)'
status: completed
type: task
priority: low
created_at: 2026-11-10T20:24:03Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `gh-pages-before-pages-settings.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Never ask the owner to turn on Pages until that repo's gh-pages branch exists (checked live at ask time)

Owner, 2026-11-10 20:22Z (thread "Harness the 10 new WHO forks"): "you need to create gh-pages first.. update process/skill (create gh-pages THEN update settings. you make this mistake a lot)". I had listed 8 forks for Pages while smart-dak-chud's first publish was still running (no branch yet).

**Why:** Pages cannot serve a branch that doesn't exist; asking early wastes the owner's effort (typing is hard for them) and repeats a known mistake.

**How to apply:** before any Pages ask, run `gh api repos/<o>/<r>/branches/gh-pages` for EACH repo right then; list only repos where it exists; ask for the rest later. Create the branch first (first Site publish run, or an orphan placeholder). The Pages settings API is proxy-blocked here, so the ask goes to the owner. Rule written into bootstrap skills/publish-site.md (bootstrap#49, issue #48). Related: folio-assistant-nbtb, folio-assistant-lwdn.
