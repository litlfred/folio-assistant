---
# folio-assistant-m4xy
title: 'INGEST ARM: pdf-images recovers the raster layer, and WHO''s real figures are vector'
status: todo
type: task
priority: normal
created_at: 2026-09-22T08:48:53Z
updated_at: 2026-09-22T10:11:33Z
parent: folio-assistant-2yyh
---

Surveyed across all seven entries 2026-09-22 (issue #877). Every count below was re-derived from `images.json` and the section text; the method and the re-runnable scripts are in the survey.

## The finding

`pdf-images.py` recovers the **raster** layer. WHO's conceptual figures — frameworks, maturity models, taxonomies, process flows — are drawn in **vector**, so they are never extracted. What IS extracted is furniture.

| entry | declared figures | extracted `figure` images | plausibly real content |
|---|---:|---:|---:|
| `9789240010567-eng` DIIG | 42 | 17 | **2** |
| `9789240081949-eng` Classification v2.0 | 1 | 10 | 0 |
| `9789240093362-eng` PHC handbook | 19 | 9 | 1 |
| `9789240120747-eng` SF medical products handbook | **6 figures + 18 tables** | **0** | **0** |
| `9789241509510-eng` MAPS Toolkit | 4 | 161 | 17 |
| `9789241511766-eng` M&E guide | 28 | 99 | 16 |
| `who-rhr-1806-eng` Classification v1.0 | 1 | 0 | 0 |

101 declared figures across the corpus. "Plausibly real content" is a keyword heuristic over the drafted narratives (logo, QR, barcode, fragment, "could not be determined") and is an estimate, not a measurement — it is the column to distrust first.

## The case that settles it

**`9789240120747-eng` extracts zero raster images and declares twenty-four numbered objects**, among them *"Fig. 3. DIIG digital health enterprise architecture framework"* and *"Fig. 4. Example workflow depicting the process of reporting substandard and falsified medical products"*.

Its `images.json` reads `0 placed images (determined: this document places none)` — and **that sentence is true about raster and misleading about figures**. This is one of the two entries that promoted FIRST, cleanly, with no narratives needed, precisely because it had no images to describe.

So an entry can be **L1-complete, gate-green, and missing every figure it declares**, with the output stating a determined empty. That is worse than the DIIG case (parts extracted, whole missed) because nothing anywhere signals a gap. It is the shape this repository keeps paying for: a check that passes over a subject it never saw.

DIIG is the other end of the same failure — 2 of 42 declared figures plausibly present, a 95% miss, and the page-92 case where five component logos came through while *Fig. 5.6.2*, the diagram they sit inside, did not.

## Empty narrative slots

`figure`-role images whose drafted narrative says "could not be determined from the extracted image": from 5.9% of figures (DIIG) to **72.7%** (`9789241511766-eng`). Each occupies a slot that reads downstream as a described figure.

## The role threshold: the data answers half the question

Every image in the corpus uses `basis.method: "geometry"`. The only role split ever exercised is `page-scan` vs `figure`, used **once**, at coverage ≈1.0. Within `figure` there is no second split at all, from 2-pixel fragments to diagrams covering 60% of a page.

Pooling all 296 figure-role coverage values there IS one genuinely empty stretch — **no images between coverage ≈0.00012 and ≈0.00033** — separating a cluster of 143 near-zero fragments (48% of the corpus) from everything else. Above that gap the distribution runs on continuously for roughly three more orders of magnitude with no second clean break.

So: the data supports a natural cut at the LOW end and does not suggest a second one higher up. **No number is proposed here.** A threshold chosen after seeing this corpus is a number chosen to fit the answer, and the gap's existence is the finding, not its value.

## What the survey could not determine

Two entries (`9789241509510-eng`, `9789241511766-eng`) have MORE plausible-content images than declared-figure captions — the reverse of every other entry. Whether that is an undercount in the caption regex or an overcount in the furniture heuristic was not resolved, and it is the one place these numbers should not be leaned on.

## Still NOT acted on

No rung changed, no threshold moved. What a fix needs, now that the pattern is measured rather than suspected:

- whether a vector-figure arm is wanted at all, or whether the captioned text beside a figure is the better handle — `9789240120747-eng` argues for the latter, since its figures are fully described in prose the ingest already holds
- who decides that a page region IS a figure, given `6xaz`'s rule that an inferred structure is refused rather than guessed
- **whether `image-descriptions` should report a third state** — "this document declares figures that the raster arm cannot see" — rather than passing silently on a determined empty. This is the cheapest of the three and the one that stops the silence.

## Done when
- [x] the pattern is checked across all seven entries rather than four
- [ ] the owner has said whether a vector-figure arm is wanted
- [ ] the role threshold is decided on a stated basis rather than on this corpus
- [ ] `image-descriptions` either covers vector figures or SAYS it does not, rather than passing silently
