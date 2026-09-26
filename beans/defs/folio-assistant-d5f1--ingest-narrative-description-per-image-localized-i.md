---
# folio-assistant-d5f1
title: 'INGEST: narrative description per image, localized, including images extracted from PDFs'
status: in-progress
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-20T04:47:50Z
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

Diagram: `processes/ingest-derive-content.bpmn`, `Task_Image`.

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

_2026-09-19T16:20Z_ — a block was recorded here against
`folio-assistant-68dt` (declare Python dependencies and install them in CI).
**NOT blocked on `folio-assistant-68dt` as of 2026-09-20** — see the entry below, which already recorded the unblock; this
line is corrected in place because a reader hits it first and a later
contradiction does not undo a live assertion.

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

## 2026-09-20 — measured with a working backend, and it changes the scope

Bean `68dt` merged, so the image path can be measured rather than reasoned
about. Two findings, and both change what this bean is.

### 1. "Each image in manifest.jsonld" is currently an EMPTY SET

No manifest in `library/` carries any image at all — all four have keys
`@context @id @type contains meta provenance title` and nothing imagey. The
"Done when" as written is vacuous: there is nothing to describe. **Extraction
and recording must exist before the narrative half means anything**, which is a
materially bigger scope than the title suggests.

### 2. Image count is not figure count, and the discriminator is clean

| document | pages | placed images | coverage | verdict |
|---|---|---|---|---|
| `WHO_PUB_TPS_93.1` | 121 | 121 | 0.998 each, one per page | page scans |
| `milnorlink` | 20 | 20 | 19 full-bleed + 1 at 0.008 | 19 scans, 1 figure |
| `9789241548960_eng` | 179 | 2 | ~0.50 | figures |
| `WPR-RDO-2020-003-eng` | 33 | 21 on 7 pages | median 0.013 | figures |

**140 page scans against 24 candidate figures.** Describing every extracted
image would produce 140 narratives of "a scanned page" — six times as many as
there are real figures.

The separation has no overlap, so no content heuristic is needed: a page scan
is one near-full-bleed image per page; a figure is smaller and occurs 0..n per
page. Measured as image-rectangle area over page area, via
`page.get_image_rects(xref)` rather than the image's own pixel dimensions,
because a placed image is what a reader sees.

### `milnorlink` was recorded wrong earlier in the same session

An earlier note here read "20 pages / 1 image then codec error". That was
measured with no working backend. It actually carries 19 full-bleed page images
**plus** an extractable text layer (47 871 chars) — a scan with OCR baked in,
consistent with the JSTOR provenance established in `8shg` the same day. The
earlier figure was an artefact of the measuring tool, not the document.

### Consequence for the design

An image entry must record the verdict AND its basis (coverage, images per
page), not just the verdict — the `nso8` discipline. A bare `kind: "scan"` is
unfalsifiable by the next reader, and this bean has already been misled once by
a stored conclusion whose reason was not checkable.

## 2026-09-20 — Stage A and Stage B shipped; the narrative half remains

### What now exists

| | |
|---|---|
| `scripts/pdf-images.py` | extracts placed images, classifies each, writes `images.json` |
| `schemas/document-image.ts` | role + the **basis** it was computed from; refuses a verdict with no working |
| `figure` block kind | registered at all seven points; `folio:Figure` + `doco:Figure` |
| `gen-library-jsonld.ts` | emits figure blocks into the section whose pages hold them |

**24 figure blocks on the real corpus** — 21 / 2 / 1 / **zero** for the
121-page scan. Matches the hand survey exactly.

Each carries `narrative: {state: "not-authored"}`, so the bean's "Done when"
is now a **non-empty** set for the first time: there are images in
`manifest.jsonld`, and each says it has no description yet.

### What is NOT done

The descriptions themselves, and their localisation. That needs a **vision
backend**, and nothing declares one — the same shape as `1r0p`'s missing
transcription backend, and the same rule applies: do not claim the capability
until something declares it. `schemas/python-deps.ts` is where it would go.

The narrative machinery is ready: `schemas/narrative.ts` has the four states
and the rule that **only a human may confirm a draft**, and
`scripts/narratives.ts` refuses to record a human decision from a
non-interactive shell.

### A measurement corrected here

An earlier note in this bean said 141 scans / 23 figures. The true split is
**140 / 24** — `milnorlink`'s one small image (coverage 0.008) was tallied as a
scan though the same table had already called it figure-shaped. Total of 164
was right; the split was not.

## 2026-09-20 (later) — the blocker I recorded does not exist, and the 24 are not 24

### The "no vision backend" claim was WRONG

The note above said the descriptions "need a vision backend, and nothing
declares one", by analogy with `1r0p`'s missing audio transcription backend.
**The analogy does not hold.** An audio backend is separate software that must
be installed. For images the reading agent is itself vision-capable: reading
`library/9789241548960-eng/images/img-p126-1.png` directly returns the GRADE
evidence-assessment table — study design, initial confidence, reasons for
lowering or raising, final confidence with the ⊕ ratings.

So the honest declaration is a **Tool node naming the agent**, not a missing
dependency. `1r0p` stays blocked; this one never was. A blocker recorded and
not retested is how a capability goes unused — which is the `apui` shape from
2026-09-19, one level out.

### What the 24 "figures" actually are

Read as one contact sheet rather than 24 files. The classification is
`role: "figure"` for all of them, and that is far too coarse:

| what it is | placements |
|---|---|
| **real data figures** (both tables, `9789241548960-eng` p126, p154) | **2** |
| organisation logos — JSTOR, MSF ×2, FAO ×2, UNDP ×2, ILO, WHO ×4 (incl. 世界卫生组织 西太平洋区域) | **12** |
| photographs — 7 of them the same children-on-a-road picture, plus one of a health worker | **8** |
| unreplaced template text: "WPRO PUBLICATION / **SAMPLE TITLE** IN THE WESTERN PACIFIC" | **2** |

Describing "every figure" would therefore produce **12 logo descriptions and
seven descriptions of one photograph** against two that are actually about the
document's content.

### Measured

* Only **2** placements are byte-identical (FAO, UNDP). The seven photographs
  are different crops — 604×366 down to 263×308 — so a hash dedupe catches the
  logos and misses the photo entirely.
* Those seven crops are **3.83 MB of the 5.54 MB** on disk: **69 %** of the
  extracted bytes are one picture a reader sees once.

### Consequences to decide

1. `figure` is not one role. A logo is publisher/organisational furniture; a
   decorative photograph is not a figure of the document either. The geometric
   rule cannot see the difference — only looking can.
2. `milnorlink`'s single "figure" is the **JSTOR logo**, which completes
   `8shg`: that document is wrapped in JSTOR furniture at every level — its
   outline was a journal wrapper, and its one image is the publisher's mark.
3. The **SAMPLE TITLE** placeholder is a defect in the published WHO document,
   not in this pipeline. Worth reporting upward rather than describing.
