---
# folio-assistant-hn0l
title: 'pdf-structure/v1: the text origin is spelled two ways (source.text_source embedded|ocr vs text_source text-layer|ocr)'
status: completed
type: bug
parent: folio-assistant-slw1
created_at: 2026-09-23T16:30:13Z
updated_at: 2026-09-23T16:30:13Z
---

Measured while defining pdf-structure/v1 (issue #1112, `cat-harness/schemas/pdf-structure.ts`).

One question, whether the section text came from the PDF's own text layer or from OCR, has two fields and two vocabularies in the same file:

| writer | field | values |
|---|---|---|
| `scripts/pdf-structure.py` | `source.text_source` | `embedded`, `ocr` |
| `scripts/pdf-pages.py` | top-level `text_source` | `text-layer`, `ocr` |

A page-granularity entry that `pdf-structure` ran on first carries **both**. Measured on 2026-09-23: 10 files carry `source.text_source` and 15 carry the top-level one. A consumer asking "is this an OCR transcription?" has to know both spellings.

The schema accepts each spelling only where it is written today, so no committed file changed. Its tests pin that.

**Fix (a producer change):**
- pick one field and one vocabulary, most likely `source.text_source` with `embedded | ocr`, since `source` is where `nso8` put technical facts;
- migrate `pdf-pages.py` and the committed files;
- narrow the schema.

Two spellings of one concept is the defect class `rlp5` and the `section_id` crash already record.

## Summary of Changes (issue #1121)

- **Canonical:** `source.text_source` ∈ `embedded | ocr`.
- `pdf-pages.py` now writes it: `page_texts` returns `embedded` instead of `text-layer`, sets `source.text_source`, and removes the old top-level field. Section front matter says `text_source: embedded | ocr`.
- **Migrated mechanically:** 15 `structure.json` files (the top-level value moved into `source`; no file disagreed with itself) and 680 section front matters (`text-layer` → `embedded`). No value changed meaning.
- **`PdfStructureSchema` narrowed:** a top-level `text_source`, or `source.text_source: text-layer`, is rejected. Tests pin both.
- **Docs:** the library-ingestion skill's routing table and structure listing, and `ingest-document.ts`'s routing comment. The two dated `qou` measurements quoting `"text_source": "ocr"` are left as history; `ocr` is unchanged.
