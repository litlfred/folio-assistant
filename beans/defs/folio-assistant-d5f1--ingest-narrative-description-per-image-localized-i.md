---
# folio-assistant-d5f1
title: 'INGEST: narrative description per image, localized, including images extracted from PDFs'
status: todo
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-20T04:15:47Z
parent: folio-assistant-slw1
---

## What

Generate a narrative description for every image, localized to the folio's
languages.

## The half that is easy to miss

**This applies to an image EXTRACTED FROM A PDF, not only to an uploaded one.**
Most images in this corpus arrive inside a paper, and a figure nobody has
described is a figure no grep and no agent can reach.

## Provenance is not optional

Every description carries its author — human, or agent **with model version**.
See `folio-assistant-iqim`. An uncited narrative is indistinguishable from a
transcription of the source, and the two have very different standing.

## Done when

Each image in `manifest.jsonld` has a description per configured language, each
stamped with its author, and the PDF-extraction path produces them too.

Diagram: `skills/workflows/ingest-derive-content.bpmn`, `Task_Image`.

## 2026-09-19 — measured before building, and it changes the design

Not started. Two findings, and the second is a design problem I could not have
seen without measuring.

### 1. No image backend, and the chain is three deep

`pypdf`, `PyMuPDF`, `Pillow`, `pdfplumber` — **none present**. `pip` reaches an
index, but getting to a working extractor took three installs: `pypdf`, then
`cffi` (its absence made `cryptography` panic under pyo3 on import), then
`Pillow` (pypdf refuses image extraction without it).

**CI installs only `ruff`.** This repository declares no Python dependencies at
all — no `requirements.txt`, no `pyproject.toml` — which is already a latent
gap, since `pdf-structure.py` needs PyMuPDF and nothing says so.

### 2. "Every extracted image" is the WRONG unit — 121 of them are page scans

| upload | pages | images | shape |
|---|---|---|---|
| `9789241548960-eng` | 179 | **2** | born-digital; its figures are vector, not raster |
| `who-pub-tps-931` | 121 | **121 TIFF** | **one per page — these are page SCANS, not figures** |
| `wpr-rdo-2020-003-eng` | 33 | 21 | real embedded figures, on 7 pages |
| `milnorlink` | 20 | 1, then `DependencyError` | a codec Pillow lacks |

A naive "describe every extracted image" would put **121 descriptions of
whole-page scans** into the review queue for one document — and `ju0u` means a
human has to confirm each. That is not merely wasted effort: it would bury the
handful of real figures, and make `confirmed` mean "the reviewer gave up".

So this arm needs a **figure / page-scan discriminator** before it needs a
describer. The signal is already recorded: `structure.json` carries
`text_source: ocr | text-layer | embedded`, and a full-page image whose page
text came from OCR is a scan of that page. Image dimensions against page
dimensions is the second check.

Also worth noting: the document with the most *figures* is not the one with the
most *images*, and the 179-page handbook has almost none — an image count is
not a figure count, and treating them as the same is how this arm would have
reported "179 pages described" while describing nothing anyone wanted.

### Correction

My first probe printed "0 images in the first 30 pages". That was not a
measurement: `len(p.images)` returned 0 while iterating actually raised
`ImportError: pillow is required`. The real count is above.

### What this waits on

A decision on Python dependencies (see the session report). `pypdf` + `Pillow`
were installed to take these measurements and then **uninstalled**, so the
environment does not quietly carry deps CI lacks.

_2026-09-19T16:20Z_ — **Blocked on `folio-assistant-68dt`** (declare Python
dependencies and install them in CI).

- **waits on**: a working backend for images out of PDFs that CI also has. Measured absent
  2026-09-19; `pip` reaches an index but CI installs only `ruff`, so anything
  built now would ship an untested path — the `5rfy` defect.
- **since**: 2026-09-19.
- **expires**: 2026-10-19. After that, presume this stale and re-measure rather
  than trusting it.
- **handoff**: if `68dt` has landed, this is ordinary work — unblock and
  proceed. If it has not, do NOT hand-roll a parser; say what is missing.
  For `d5f1`, read this bean's measurement first: the image count is not the
  figure count, and 121 of `who-pub-tps-931`'s images are page scans.

_2026-09-20T04:20Z_ — **Unblocked on the backend half.** `68dt` is done: the
Python dependencies are declared in `schemas/python-deps.ts`, generated into
`requirements.txt`, and **CI installs the lean set** — so the PDF rungs are now
a path CI can exercise rather than the `5rfy` defect.

`pymupdf`, `pypdf`, `pillow`, `pdfplumber`, `pdfminer.six` and `cffi` are all
present. Only `camelot-py` (for `pdf-tables.py`) stays out of CI, at 323 MB
with numpy/pandas/OpenCV — declared in `requirements-extended.txt` with the
cost stated.

Note before starting: `probe()` in `ingest-document.ts` imported the deprecated
`fitz` alias, which prints a deprecation warning to STDOUT and broke the JSON
parse. Fixed in `68dt`. Routing now works — and for `d5f1` specifically, read
this bean's own 2026-09-19 measurement FIRST: the image count is not the figure
count, and 121 of `who-pub-tps-931`'s images are page scans.
