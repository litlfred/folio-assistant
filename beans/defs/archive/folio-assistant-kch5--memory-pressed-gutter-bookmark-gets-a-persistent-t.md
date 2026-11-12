---
# folio-assistant-kch5
$schema: bean/1.0.0
title: 'Memory: Pressed 🔖 gutter bookmark gets a persistent tile + accent ring (issue tools#1745, PRs cat-harness#1174 + tools#1746)'
status: completed
type: task
priority: low
created_at: 2026-11-09T15:34:06Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `bookmark-selected-state-2026-11-09.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Pressed 🔖 gutter bookmark gets a persistent tile + accent ring (issue tools#1745, PRs cat-harness#1174 + tools#1746)

Thread "Show when a bookmark is selected" (cmsg_017WNUkNK8kdDziPK58Pv6G9JHS52kk9Q4HoiMujkDZWUB), user ask 2026-11-09 15:30Z.
- Cause: pressed 🔖 only showed full colour; hovering a block lights all gutter icons, so pressed == unpressed.
- Fix: LINK_CSS in cat-harness-tools src/core/edit-links.ts adds `.ba-bookmark[aria-pressed=true]` tile+ring; cat-harness edit-links.js regenerated (byte-equal checked); docs-ui.css same look for other [data-fa-pin-control] (not .bp-bookmark).
- Branch claude/bookmark-selected-state in both repos. Merge cat-harness#1174 first, then tools#1746. Drafts, subscribed.
- Q-BM-1 = A (tile+ring), user 15:35Z 11-09.
- Preview: /mnt/project-files/bookmark-selected-2026-11-09/bookmark-selected-after.png
Related: folio-assistant-bxc4.
- 15:45Z add-on: 📣/🔖 lit on every section (':hover>.block-actions' matched main). Fixed with :not(.main-content,.fa-doc,main):hover; pushed 324f8f5/8c6ad804. Headless gotcha: test pages need <!doctype html> (quirks mode drops bare :hover).
- 11-10 16:32Z: owner marked both PRs ready + 'ready:' comments (sha 8c6ad804 / 324f8f56). Q-BM-2 withdrawn.
- 11-10 17:32Z: BOTH MERGED (cat-harness#1174, tools#1746). Live after next folio-assistant re-pin.
