---
# folio-assistant-yn06
$schema: bean/1.0.0
title: 'Memory: Readable schema pages for every layer + library-iri page + keyword link (tools#1751) and library entry folder guide (core#700), 2026-11-10'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `schema-pages-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Readable schema pages for every layer + library-iri page + keyword link (tools#1751) and library entry folder guide (core#700), 2026-11-10


Thread "Publish Dublin Core schema pages" (cmsg_017WNUkNK8kdDziPK58Pv6G97PFJUJimum1pW1nwPFmZi8), user asks 2026-11-10 16:35Z.

- Root cause: kg-export `collectSchemas` audited only the harness's schemas/, so `--instance` exports (core) had no Schema nodes/pages; schema pages showed only name + truncated first line.
- tools#1751 (issue #1750, draft): schemas generic in COLLECTOR_SCOPE; Schema nodes get `jsonSchema` links to `<stub>/schema/zod/...`; pages render docblock + field tables (scripts/lib/schema-page.ts); library-iri now `@graphNode schema`; LSI page links keywords/.
- core#700 (issue #699, draft): guide section "What is in a library entry folder". Links to new pages 404 until #1751 merges + re-pin.
- Keyword viewer: already merged (tools 21e9964, cat-harness route); not on site because fa main pins tools 1c1632a. Re-pin train fa#3058 pins 21e9964.
- Card answers: keep link list in chat only (A); add folder guide (A).
- MERGED 2026-11-10 17:28Z: tools#1751 (1ccb9f70), core#700 (b2672977); issues #1750/#699 closed. Pages go live after the next fa re-pin + publish.
