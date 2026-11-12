---
# folio-assistant-obux
$schema: bean/1.0.0
title: 'Memory: dth-* seeders copied the PDF front matter verbatim (printed TOC, cover repeat); dth-phc fix and gate to port to other DTHs'
status: completed
type: task
priority: low
created_at: 2026-11-01T23:34:07Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dth-front-matter-page-furniture.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: dth-* seeders copied the PDF front matter verbatim (printed TOC, cover repeat); dth-phc fix and gate to port to other DTHs

2026-11-01: the owner saw the PHC landing page render the PDF's printed contents (dot leaders, page numbers) and the colophon as one run-on paragraph, and asked to "fix process".

Cause: `scripts/folio/seed_from_l1.py` build_front_matter() copied who-iris `sec-front-matter.md` as is. That section is the raw PDF text, one PDF line per line.

Fix, in dth-phc#23 (merged):
- `clean_front_matter()` drops the cover repeat, the printed contents and running page numbers, and joins wrapped lines into paragraphs. No words change.
- Gate `check:page-furniture` (scripts/folio/check_page_furniture.ts) is in `site.build.pre`.

**How to apply:** dth-pc, dth-sc and dth-hrh probably share this seeder pattern. Port both pieces to each of them. The site's contents are always generated from the structure. See folio-assistant-yqdf.
