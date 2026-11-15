---
# folio-assistant-8jxt
$schema: bean/1.0.0
title: 'Memory: Right-gutter (RHS grill) 📣/🔖/🔗 icons 50% bigger at >=64rem (issue tools#1806, PRs cat-harness#1213 + tools#1807)'
status: completed
type: task
priority: low
created_at: 2026-11-10T21:08:45Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `gutter-icons-bigger-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Right-gutter (RHS grill) 📣/🔖/🔗 icons 50% bigger at >=64rem (issue tools#1806, PRs cat-harness#1213 + tools#1807)

Thread "Enlarge right-side grill icons" (cmsg_017WNUkNK8kdDziPK58Pv6G9Wyw7xcUYv4wkPgN73AoVxC), user ask 2026-11-10 21:02Z. "RHS grill icons" = right-gutter block icons.
- Fix: LINK_CSS in cat-harness-tools src/core/edit-links.ts adds @media (min-width:64rem): tiles 20->30px, 🔗 svg 1.5rem, gutter 2.5->3.25rem. cat-harness edit-links.js regenerated (byte-equal).
- MERGED 21:15Z 11-10 (owner card A): cat-harness#1213 baa62509, tools#1807 9eb5e89b. Live on each site after its next re-pin.
- Before/after: /mnt/project-files/gutter-icons-2026-11-10/before-after.png
- Gotcha: built pages INLINE the edit-links runtime and its <style id=fa-bp-link-css>, so swapping assets/js/edit-links.js on a gh-pages copy changes nothing; preview by adding the new CSS with addStyleTag. Live only after site rebuild/re-pin.
Related: folio-assistant-bxc4, folio-assistant-kch5.
