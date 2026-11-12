---
# folio-assistant-lwnb
$schema: bean/1.0.0
title: 'Memory: 2026-11-08 09:30Z platform backlog dispatch (thread "Work down platform backlog" …D2Exka7whCUnsTgxVB6cb9): 3 sibling threads asked, what was skipped'
status: completed
type: task
priority: low
created_at: 2026-11-08T09:22:37Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `platform-dispatch-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: 2026-11-08 09:30Z platform backlog dispatch (thread "Work down platform backlog" …D2Exka7whCUnsTgxVB6cb9): 3 sibling threads asked, what was skipped

Thread cmsg_017WNUkNK8kdDziPK58Pv6G9D2Exka7whCUnsTgxVB6cb9 (user "spawn agents for platform work", 09:21Z). Asked coordinator for three threads:
1. fa preview/gate drafts: fa#2953, #3004, #3018, issues #2881, #937.
2. Small leftovers: smart-ips-pilgrimage#13, who-iris#104, core#461, smart-base#281.
3. Stale smart-base drafts: #246, #259, #268, #273, issues #242, #245.
Skipped on purpose: smart-trust translation (#133/#136/#149), vaxlink#14, cat-harness#686/#991 (big proposals, user first), fa#2601/#2605/#968/#969 (programme). Beans not read (no store access from that thread); next wave = uncovered platform beans.
Listing trick: `gh api -X GET search/issues -f q='is:open is:pr user:litlfred archived:false' --paginate` works even with an invalid GH_TOKEN.
