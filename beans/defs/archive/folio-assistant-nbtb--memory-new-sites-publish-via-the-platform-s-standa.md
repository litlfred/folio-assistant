---
# folio-assistant-nbtb
$schema: bean/1.0.0
title: 'Memory: New sites publish via the platform''s standard gh-pages route; any deviation is a card for the owner first'
status: completed
type: task
priority: low
created_at: 2026-11-09T14:23:44Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `publish-standard-practice.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: New sites publish via the platform's standard gh-pages route; any deviation is a card for the owner first

Owner, 2026-11-09 14:23Z (thread …XqKVGpzpLAbWKjURUeqy2S): asked why smart-html-jtd's Compose deployed via an Actions Pages artifact (no gh-pages) when every repo uses a gh-pages branch. "What was process failure that you didnt follow standard practice?" Owner chose gh-pages (card, option B); smart-html-jtd#4 switches to a one-commit gh-pages.

**Why:** I invented a new deploy path without checking the platform's route (reuse before adding) and buried the deviation in a doc instead of a card.

**How to apply:** Before building any publish/deploy step, find and reuse the platform's own route (stage-local.ts / site-publish.yml, gh-pages). Any departure from standard practice is a decision card BEFORE implementation, never a doc line. Related: folio-assistant-o6rs.
