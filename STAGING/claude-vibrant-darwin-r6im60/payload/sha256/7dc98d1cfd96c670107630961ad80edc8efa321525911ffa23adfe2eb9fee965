---
# folio-assistant-70zt
title: SVG rendering of DIIG Fig. 1.1.1 (seven phases of planning and implementing a digital health enterprise)
status: in-progress
type: task
priority: normal
created_at: 2026-10-03T10:55:02Z
updated_at: 2026-10-04T08:36:08Z
parent: folio-assistant-qvxh
---

Owner, 2026-10-03 (issue #1984, relayed from session_015Q15h1fg2Hh9MJXfAqr4h7): "use one DIIG seven phase figure as source. need SVG rendering maybe as bean".

The figure is DIIG §1.1 Fig. 1.1.1, smart-base/library/9789240010567-eng, PDF p.17 (the phase list is on p.16). vector-labels.json records 82 drawings on that spread, and no raster figure. It is vector-drawn, so its home is the vector-figure arm, bean ay3x (a task, so it cannot be this bean's parent). Render it from the PDF's own vector layer. Do not redraw it by hand.

The three DTHs reproduce this figure: PHC 9789240093362 §2.3; SC 9789240101197, Introduction > Alignment with the DIIG; and the RA draft, Executive Summary Fig. 1. The SVG is the one rendering they all point at.

## Done when
- [x] an SVG of DIIG Fig. 1.1.1 generated from the PDF's vector layer, with its provenance (page, source sha) recorded
- [x] gated (a :check that regenerates it)
- [x] dth.json's DIIG section and the smart-base DTH findings page (#1984) link to it

## Summary of Changes (2026-10-04, wm63 session)

- `cat-harness/scripts/pdf-vector-svg.py`: a generic arm beside `pdf-vector-figures.py`. It exports an INSPECTED vector figure as SVG from the PDF's own vector layer: the page's `get_svg_image`, cropped by a `viewBox` set to the entry's recorded `region`, the frame the PNG uses. It refuses any entry not inspected as a figure, and has no option to adjust the crop. Provenance sits in the SVG's `<metadata>`: PDF sha256, page, region, rotation, backend version, and `contentSha256` of the drawing.
- `smart-base/library/9789240010567-eng/figures/vfig-p017.svg` (527 KB). Rasterised back, it matches the direct PNG crop. Text is drawn as paths for fidelity; `<title>` (the DIIG caption) and `<desc>` (the inspection's `saw`) carry the accessible text.
- Gate `smart-base:diig-figure:check`, wired into code-quality-gates. With the PDF present it regenerates byte for byte. In CI there is no PDF, so it checks crop consistency and the content hash, and says in words that it did not regenerate. Seen failing on a planted edit and on an uninspected entry (vfig-p016).
- Linked from dth.json's DIIG section, and from the generated findings page via a new optional `figure.svg` in dth-term-alternatives.json.

## Validation (2026-10-04, owner asked: content/text, layout, colours)

Compared against the PDF's own raster render of page 17 at 144 dpi, by pixel.
- **In Chromium** (the target reader): 5.70% of pixels differ by more than 16/255. Only **0.076%** sit inside a solid differing area (all 8 neighbours also differ). The rest are thin outlines along glyph and line edges: antialiasing, because text is drawn as paths. The largest remaining cluster (the phase 06–07 resource tiles) was inspected side by side and is identical by eye.
- **A false alarm, recorded so it is not chased again:** MuPDF's own SVG renderer drew each phase badge's soft drop-shadow (a soft mask) as a hard grey rectangle. In Chromium the shadow is correct. MuPDF is not a valid judge of these SVGs, and it renders poppler's output as solid black.
- **poppler `pdftocairo -svg`** was tried as an alternative and is worse in Chromium (2.785% solid). PyMuPDF's export stays.
- The `--check` compares bytes and the content hash, never a render, so none of the above affects the gate.
