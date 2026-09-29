---
# folio-assistant-rtuo
title: State tags and badges fail colour contrast on the dark theme
status: todo
type: bug
tags:
    - wireframe-findings
    - ui
    - cross-cutting
created_at: 2026-09-23T10:36:13Z
updated_at: 2026-09-23T10:36:13Z
parent: folio-assistant-4ccr
---

Tag and badge colours are fixed hex values that measure about 2.0–2.7:1 on the dark ground, below the WCAG 4.5:1 minimum for small text. Move them onto theme tokens that are validated in both schemes.

Observed on: `external-schemas`, `fsh-guts`, `kg-viewer`, `methodologies`, `navbar`, `tools` (see each `cat-harness/docs/wireframes/<kind>/intent.md`). Per-page detail is in each visualiser's task under the epic.

## Re-verified 2026-09-29 on `main` 35402147f

Each finding re-measured on a local build of that commit, at 1280×800 and 390×844, both colour schemes where contrast is involved. 2 still present, 1 fixed, 3 could not be determined. FIXED means observed on the built page, not read from code.

- **STILL-PRESENT** — Tag colours fixed hex, ~2:1 on dark — tools: Dark scheme (emulated plus localStorage fa-color-scheme=dark, data-fa-scheme=dark), .tg-tag over the row background rgb(48,45,54) at 11.52px: tg-shell #0d6e5e 2.19:1, tg-inproc #1d5fa8 2.09, tg-mcp #6b5b95 2.29, tg-manual #a8430f 2.24. The light scheme passes (5.91–6.45). Inline <style> is unchanged. Screenshot rv/t…
- **STILL-PRESENT** — Tag colours fixed hex, ~2:1 on dark — methodologies: Dark scheme: .mv-tag.mv-ingested #0d6e5e 2.19:1 (16 tags), .mv-cited #8a6100 2.44:1 (10), at 11.52px. No .mv-dangling is rendered now. Light scheme is 5.54–6.16.
- **FIXED** — Tag colours fixed hex, ~2:1 on dark — external-schemas: The page was restructured (17 specifications, 'user|declared by' tables) and renders 0 elements with class xs-ok/xs-na/xs-missing. The fixed-hex .xs-* rules are still in the inline <style>, now dead. The tags went with the dependents/state column. — 1b2d10c7e
- **CANNOT-TELL** — Tag colours fixed hex, ~2:1 on dark — fsh-guts: /fsh-guts/ is publish: staging-only and is absent from this build (no fsh-guts/index.html). The source cat-harness/docs/fsh-guts/index.md still defines .fg-ok #0d6e5e, .fg-side #6b5b95, .fg-gap #a8430f, but that is code, not an observation. Side note: the 'Published graphs' page (/cat-harness/) links /fsh-guts/, whi…
- **CANNOT-TELL** — Tag colours fixed hex, ~2:1 on dark — kg-viewer: /cat-harness/ is now a just-the-docs 'Published graphs' page, and the standalone KG viewer (_kg/…) is not in this build. On /cat-harness/ no link, button or badge in the dark scheme is under 4.5:1. The kg-viewer intent itself says its colour difference 'is not a contrast failure'.
- **CANNOT-TELL** — Tag colours fixed hex, ~2:1 on dark — navbar: The navbar has no fixed-hex state tags. Measured in dark: .fa-nav-note 11.66:1, the counts (fa-doc-index/folders/pages) 8.1:1, fa-tile-count 8.33, fa-translation-badge 8.03, fa-qa-badge 10.07. The only low reading is .fa-node-badge on sticky avatars (white on translucent grey over an image, 2.8:1 dark / 3.03:1 light…
