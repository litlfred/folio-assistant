---
# folio-assistant-qpyq
$schema: bean/1.0.0
title: 'Memory: cat-harness-tools#1748 links methodology names/library paths on the methodologies page and fixes evidence links on IG sites'
status: completed
type: task
priority: low
created_at: 2026-11-10T16:29:03Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `methodology-prose-links-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: cat-harness-tools#1748 links methodology names/library paths on the methodologies page and fixes evidence links on IG sites


Methodologies page (gen-methodologies-viz.ts) now links code spans in applies-when/origin (`linkProse`). PR litlfred/cat-harness-tools#1748 (draft, 2026-11-10), thread cmsg_017WNUkNK8kdDziPK58Pv6G998Fp84XXTZCBamVnpLYa72.

Root cause of unlinked "Ingested sources" on IG sites: libraryResolver read baseDocsDir instead of the `--site` dir, and visualiser-writers ran writers in visualiser order (methodologies before library). Fixed by a `site` param and `inPublishOrder` (derive:publish writer order).

**How to apply:** pilgrimage and other IGs see it only after re-pinning cat-harness-tools past the merge.
