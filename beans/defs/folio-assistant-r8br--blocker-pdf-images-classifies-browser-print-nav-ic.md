---
# folio-assistant-r8br
title: 'BLOCKER: pdf-images classifies browser-print nav icons as figures, so 7 documents cannot be promoted'
status: todo
type: task
priority: high
created_at: 2026-09-20T16:36:29Z
updated_at: 2026-09-20T16:36:52Z
parent: folio-assistant-slw1
---


Seven of the nine agent-skill documents are staged and cannot be promoted.
They fail exactly one requirement — `image-descriptions` — and the images in
question are not figures.

## Measured 2026-09-20

`Agent Skills — Google Antigravity Docs`, a **four-page** browser print:

- **104 images, all classified `figure`**
- page 1 alone carries 26
- coverage of the first three: **0.000183, 0.000183, 0.000856** — hundredths of
  one percent of the page

Those are navigation icons, a copy button, a search glyph, a cookie-banner
control. The two arXiv papers, which are typeset PDFs rather than printed web
pages, produced 1 and 0 describable images and promoted cleanly — so this is
specific to the capture method, not to the corpus.

## Where it comes from

`pdf-images.py` classifies by GEOMETRY, and its rule separates a PAGE SCAN
(coverage near 1.0) from everything else. There is no verdict between "this
image IS the page" and "this image is a figure", so a favicon is a figure by
construction. That was sound while the corpus was scanned WHO publications;
a browser print is a new shape and it arrived with this branch.

## The decision, and why an agent should not take it

The obvious move — give the classifier a lower bound and call sub-threshold
images decorative — is **lowering a gate to unblock my own work**, which is
the one move the rules here forbid without being asked. It is also arguable
on the merits, in both directions:

- **For:** WCAG treats a decorative image as one that takes empty `alt`. An
  image covering 0.018% of a page carries nothing a reader needs described,
  and `image-descriptions` exists to serve readers.
- **Against:** a threshold is a number somebody picked. A small image can be
  load-bearing — a status glyph in a table, an inline equation. Coverage is a
  proxy for "decorative", not a definition of it, and the repository's own
  rule is that a determined empty must be determined, not assumed.

## Three ways out, and they differ in what they cost

1. **A `decorative` verdict in `pdf-images.py`**, by coverage, with the basis
   recorded per image as `role: "decorative"` alongside the existing
   `basis: {method, coverage, ...}`. Cheapest, and it changes what "figure"
   means for every future ingest.
2. **Describe them.** ~200 alt texts for nav chrome across seven documents.
   Honest, useless to a reader, and it teaches the next agent that the way
   past this gate is bulk narration.
3. **Treat a browser print as its own INGEST RUNG.** The provenance is already
   captured — `Producer: Skia/PDF m152` on all four vendor captures — so the
   pipeline can know it is looking at a printed web page and classify
   accordingly. Most work, and the only one that fixes the cause rather than
   the symptom.

My reading is (3) with (1) as its mechanism, because the producer string is
EVIDENCE already in hand rather than a threshold somebody chose. But this is
the owner's call, not mine.

## Done when

- [ ] The owner picks, and the reason is recorded where the classifier is.
- [ ] Whatever is chosen, the verdict is CHECKABLE per image, not a silent
      reclassification — `images.json` already carries `basis`, and this must
      go there too.
- [ ] The seven staged documents promote, and `check:l1-complete` passes over
      all nine.
- [ ] A fixture proves the classifier still calls a real figure a figure; a
      change that makes everything decorative would pass the promotion gate
      and be worse than the bug.

## Where they are now

Staged under `cat-harness/ingest-staging/` (gitignored), NOT promoted. That is
the pipeline working: nothing crosses into `library/` until every requirement
is met, and nothing reads as ingested while it waits.
