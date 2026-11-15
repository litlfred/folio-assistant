---
# folio-assistant-bxc4
$schema: bean/1.0.0
title: 'Memory: Right-gutter 🔖/📣/🔗 hover tile fix (cat-harness#1134, PRs cat-harness#1135 + tools#1674, branch claude/rail-icon-hover)'
status: completed
type: task
priority: low
created_at: 2026-11-08T07:10:23Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `rail-icon-hover-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Right-gutter 🔖/📣/🔗 hover tile fix (cat-harness#1134, PRs cat-harness#1135 + tools#1674, branch claude/rail-icon-hover)

Thread "Highlight pin icon on hover" (cmsg_017WNUkNK8kdDziPK58Pv6G9BkDd56D4goHdEKA3ckwXKo), user ask 2026-11-08 07:05Z.
- Cause: pinned 🔖 (aria-pressed=true) is always full colour, so hover changed nothing.
- Fix: LINK_CSS in cat-harness-tools src/core/edit-links.ts adds a tinted tile on own hover for .ba-trigger, .ba-bookmark, .anchor-heading. cat-harness site-chrome/assets/js/edit-links.js regenerated (byte-equal to editLinksAsset()).
- Merge cat-harness#1135 first, then tools#1674. Label ready-to-merge when green; Merge Manager merges.
- Before/after: /mnt/project-files/pin-hover-2026-11-08/pin-hover-before-after.png
- Overlap: left-strip thread PRs tools#1682 + cat-harness#1137 also edit LINK_CSS / edit-links.js (different lines). Whoever merges second: merge main, regenerate edit-links.js, check byte-equal.
Related: folio-assistant-decn.
