---
# folio-assistant-n7vv
title: 'BADGE PALETTE: the coverage and sweep badges are inline dark-palette literals, beside a themed TR badge on the same row'
status: completed
type: task
priority: normal
created_at: 2026-09-21T11:38:02Z
updated_at: 2026-09-21T13:16:37Z
parent: folio-assistant-bzyu
---

Seen directly while verifying PR #691 against the real generated page: the badge row under a title renders a dark-brown 2/6 languages chip and a dark-green Swept 8/289 chip next to a correctly themed light TR chip, on a light page.

fa-lang-coverage-badge and fa-sweep-badge are built in mountTranslationBadges with inline colour literals (#78350f, #14532d, #1e293b, #e2e8f0). Contrast WITHIN each chip is fine — light text on a dark fill — so this is not the rptk contrast failure; it is that they do not follow the scheme, and sit visibly apart from every other control on the row.

mountPageLanguageBar already carries the comment for why this is wrong (bean rptk) and was converted to per-scheme tokens in docs-ui.css with measured ratios. These two were not.

## Done when

- both badges take their colours from per-scheme tokens in docs-ui.css, with the measured ratio written beside each pair, the way the page language bar does;
- they read correctly in both light and dark;
- no inline colour literal is left in mountTranslationBadges.
