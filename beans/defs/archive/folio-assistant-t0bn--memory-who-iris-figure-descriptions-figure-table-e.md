---
# folio-assistant-t0bn
$schema: bean/1.0.0
title: 'Memory: who-iris figure descriptions + figure/table extraction 2026-11-11 — who-iris#229 (issue #224), tools#1850, cards Q-FIG-1/2/3, gotchas'
status: completed
type: task
priority: low
created_at: 2026-11-11T02:56:27Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `iris-figures-2026-11-11.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: who-iris figure descriptions + figure/table extraction 2026-11-11 — who-iris#229 (issue #224), tools#1850, cards Q-FIG-1/2/3, gotchas


Thread "Describe figures in IRIS documents" (cmsg_017WNUkNK8kdDziPK58Pv6G9MgLzYE4CC933YWuugjFYV2), 2026-11-11.

- User: extract figures AND tables from IRIS docs; descriptions in all 6 UN languages. Q-FIG-1 = A (WebP q80, max 1600 px, figure role only). Q-FIG-2 = A (transcribe captioned tables) in the corpus's existing format = folio-tabular-csvw/v1.
- Merged: tools#1841 (verdict translations), who-iris#225 (re-pin), folio-assistant-core#728 (document-intake skill section).
- MERGED 2026-11-11 07:23Z: who-iris#229 (5,032 verdicts, 929 WebP 46 MB, 244 tables in 36 entries, all pins on mains) after Q-FIG-3 = A; tools#1850 (tables/ dir). Q-FIG-4 = B (07:31Z): held entry's 278 figures committed as WebP in who-iris#233 (merged 08:35Z; also restored 19 non-IRIS entries #229 rewrote — whole-corpus apply-image-verdicts drops translations not held in image-verdicts.json, so never run it corpus-wide on non-IRIS entries); tools#1854 closed. Its 57 tables stay held (card didn't cover them). Extraction-fixes thread re-derives ~30 items on top; image ids must stay stable.
- 10665-381036 ("do not distribute"): figures now kept (Q-FIG-4 = B); its 57 tables still not committed.
- 55 images the page renderer couldn't place were pulled from PDF objects (Pixmap/extract_image) and described (batch d-01). Review notes: iris-figures-2026-11-11/review-notes.md.
- Gotchas: CSVW file must be named `tabular.csvw.json` (TABULAR_CSVW_FILENAME). assemble.py must run on CLEAN sidecars (git checkout images.json/vector-figures.json/image-verdicts.json first), else roles already applied shrink its targets. who-iris `bun install` fails with a sibling ../cat-harness-tools clone; keep clones in /home/user/w/. pdf-tables.py is memory-heavy (OOM with 8 shards). ingest-and-l1 "real corpus" test already fails on main (other entries lack translations).
- LIVE 2026-11-12 01:11Z (gh-pages 3401bc9, publish of main 2868ff4): figures+tables on site. Blocker was Jekyll OOM (>13.5 GB) from 7,219 bibliography reference pages in just-the-docs nav; fixed by nav_exclude (core#746, merged) + re-pin who-iris#249. Also core#744/who-iris#237 (control chars in references). who-iris publishes on merge (#235); a publish run fails if main moves mid-run, the next one publishes.
- Scratch scripts (ephemeral): /tmp/claude-0/fig/{assemble,tables,check,tcheck}.py.
