---
# folio-assistant-x5o1
title: 'GLOSSARY: seed the who-style-guide glossary from the WHO Editorial Style Manual Annex 1 (preferred spellings)'
status: todo
type: task
priority: normal
created_at: 2026-09-30T00:27:28Z
updated_at: 2026-09-30T00:27:28Z
parent: folio-assistant-lqo9
---

Follow-up of ftu0 (owner chose 2026-09-30: who-style-guide owns the WHO glossary, seeded from the HQ manual's spelling lists).

Annex 1 of the WHO Editorial Style Manual (who-iris/library/who-pub-tps-931, OCR pages ~86-102) lists preferred spellings, most with a REJECTED variant in brackets: 'immunological (not immunologic)', 'inflection (not inflexion)', plus sense-split pairs 'indexes (of texts)' / 'indices (mathematical)'. Roughly 400-600 entries.

OPEN DESIGN QUESTION (blocking, for the owner): a rejected spelling is not an equivalent name. SKOS altLabel means 'also acceptable'; SKOS hiddenLabel means 'findable but not shown' — the closer fit for a spelling to avoid — but folio-glossary/v1 has no hiddenLabel field. Options: (a) add hiddenLabel to the glossary schema and record rejected forms there; (b) record spellings as rules in the who-editorial voice (9 rules today, none on spelling) and keep the glossary for stated equivalences only; (c) both.

Extraction is OCR: every entry must be checked against the page image (yg4c found OCR errors on these pages). Status of each term: candidate until inspected.
