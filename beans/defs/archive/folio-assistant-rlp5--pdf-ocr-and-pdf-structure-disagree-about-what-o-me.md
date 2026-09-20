---
# folio-assistant-rlp5
title: pdf-ocr and pdf-structure disagree about what -o means
status: completed
type: bug
priority: normal
created_at: 2026-09-19T00:12:09Z
updated_at: 2026-09-19T08:56:51Z
---

`scripts/pdf-structure.py -o DIR` writes `DIR/<doc-id>/` — its help says 'root for <doc-id>/ output dirs'. `scripts/pdf-ocr.py -o DIR` writes `DIR/ocr/` with no doc-id level at all.

Measured 2026-09-19: `python3 scripts/pdf-ocr.py -o library uploads/WHO_PUB_TPS_93.1.pdf` put 121 pages in `library/ocr/`, not `library/who-pub-tps-931/ocr/`. Had a second scanned document been OCR'd into the same `library/`, the first one's pages would have been overwritten silently — same filenames, same directory.

Then `pdf-structure.py --ocr` looks for the cache in the doc-id location, so the two steps of one documented pipeline do not compose: the OCR has to be moved by hand between them, which is what 'Today the move is a script plus whatever the agent remembers' (bean `apui`) describes.

## Done when
- `-o` means the same thing in both scripts: the ROOT that `<doc-id>/` hangs off.
- `pdf-ocr.py` derives `<doc-id>` the same way `pdf-structure.py` does, from one shared helper rather than two spellings.
- Overwriting another document's cached OCR is impossible by construction, not by convention.

## Worked 2026-09-19 — one meaning for `-o`, one spelling for the doc-id

### A second defect, which decided the design

`ocr_pages` looked up the cache with `slugify(basename, 60)` — the **fallback**
doc-id spelling — while the writer used `derive_doc_id`, which returns
`arxiv-<id>[v<n>]` when arXiv metadata is present. **For an arXiv document the
writer and the reader disagreed**, so the cache would never be found.

What made that decidable rather than a judgement call: the arXiv id is found by
**regex over page one's extracted text** (`pdf-structure.py:597`). No usable text
layer is the precondition for running OCR at all, so for every document
`pdf-ocr.py` is ever used on, `derive_doc_id` necessarily falls back to the
basename slug. **`pdf-ocr.py` can therefore compute the same doc-id from the
filename alone** — no metadata pass, no new dependency on `pypdf`. `meta` is
optional in the shared helper for that measured reason, not for convenience.

### There were FOUR spellings, not two

1. `slugify` + `derive_doc_id` defined in `pdf-structure.py`
2. `ocr_pages`'s own inline `slugify(basename, 60)` — the disagreeing one
3. `pdf-pages.py`'s 26-line `_load_slugify()`, reading the function out of
   `pdf-structure.py` **by file path** because a hyphenated filename is not
   importable, with a second comment explaining why the module had to be
   registered in `sys.modules` before exec or `dataclasses` died
4. `pdf-pages.py`'s inline `outroot / slug(stem) / "ocr"`

`scripts/_pdf_doc_id.py` is the one home; the loader is **deleted** in favour of
an import. Underscore-prefixed for the same reason as `scripts/_pypdf_compat.py`.

### Verified end to end, with tesseract actually running

- `pdf-ocr.py -o ROOT` on a real 2-page scan → `ROOT/tiny-scan-21/ocr/page-00{1,2}.txt`,
  and it now **names the directory** in its output, because it is no longer the
  one the caller passed.
- `pdf-structure.py`'s `ocr_pages` found both pages, 2851 chars, **with no
  hand-move** — the composition failure this bean opened on.
- A second document OCR'd into the same ROOT landed in `other-scan/ocr/` and the
  first document's pages were byte-for-byte intact (1416 + 1436). The overwrite is
  impossible by construction.
- `pdf-structure.py -o` unchanged: `ROOT/9789241548960-eng/` on a real 179-page PDF.

### The test asserts identity, not equal strings

`scripts/tests/pdf-doc-id.test.py` (14 properties) checks that each script's
`derive_doc_id` / `ocr_cache_dir` **is the same function object** as the shared
one. Three equal strings could still be three implementations — which is exactly
what the previous state looked like from outside. Probed: reimplementing
`derive_doc_id` inside `pdf-ocr.py` so that it still returns the right answer for
that input **fails** on the identity check.

Second probe — making `ocr_cache_dir` return the flat location again — first died
with a bare `FileExistsError` and a traceback that said nothing. Hardened: the
"doc-id cache is not the flat cache" assertion now runs **before** the directory
is created, so the same probe reports six named findings including *"two
documents, two cache directories: got False"*.

### Two things noticed and deliberately not changed

- **`read_cache` in `pdf-ocr.py` has no callers.** Its signature is corrected for
  consistency, but an unused function is a maintenance cost somebody should
  decide about rather than have me delete in a bean about `-o`.
- **`ocr_pdf` creates the cache directory before checking the PDF opens**, so a
  missing input leaves an empty `<doc-id>/ocr/` behind. Observed while testing.
  Cosmetic, and outside this bean.

The flat `ROOT/ocr/` stays **readable** with a warning naming the new location:
dropping it would make a 121-page cache silently invisible and re-OCR it at
seconds per page. Reading it cannot cause the overwrite — only writing could, and
nothing writes there any more.

## Done when

- [x] `-o` means the ROOT that `<doc-id>/` hangs off, in both scripts
- [x] `pdf-ocr.py` derives `<doc-id>` from one shared helper, not a second spelling
- [x] overwriting another document's cached OCR is impossible by construction,
      proven with two real OCR runs into one root
