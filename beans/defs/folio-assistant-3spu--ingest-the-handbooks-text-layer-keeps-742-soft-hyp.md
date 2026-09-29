---
# folio-assistant-3spu
title: 'INGEST: the Handbook''s text layer keeps 742 soft hyphens (U+00AD) that split words in library sections'
status: todo
type: bug
created_at: 2026-09-29T21:51:12Z
updated_at: 2026-09-29T21:51:12Z
parent: folio-assistant-slw1
---

9789241548960-eng carries 742 U+00AD in 186 section files ('recommenda­tions', 'organi­zation'); the two style guides carry none; 21 sections in other libraries do too. The LSI tokenizer now joins them (tokenizer v2), but the section TEXT still carries them, so summaries, translation extraction and any lexical grep see fragments. Done when: the PDF rungs normalise U+00AD (join across the line break) and a check reports any section still carrying one.

Found 2026-09-29 by the LSI/CA analysis of who-iris (bean ansc, report cat-harness/docs/proposals/lsi-who-iris-2026-09-29.md); lsi:near found no existing bean >= 0.7.
