---
# folio-assistant-giiw
title: 'ARABIC (RTL) DISPLAY: the unverified-translation notice is English set right-to-left — reordered and clipped; audit the rest of the chrome under dir=rtl'
status: in-progress
type: bug
created_at: 2026-10-06T07:58:59Z
updated_at: 2026-10-06T14:11:01Z
parent: folio-assistant-bzyu
---

Owner, 2026-10-06, from a screenshot of the staging preview of #2261 (Arabic selected): "note bean up arabic display issues".

## Observed (screenshot, AR active in the language selector)
- The one-line notice reads "…matically and has — **Unverified translation** ⚠": the English sentence is laid out right-to-left, so its start ('⚠ Unverified translation —') sits at the RIGHT end, and the one-line <summary> clips the rest of the sentence off the LEFT edge.
- The page column looks left-aligned inside an RTL page, with the language selector's row reversed (ES RU FR EN ZH AR). The reversal is correct for RTL; whether the content column's alignment is right is to be checked, not assumed.

## Cause (measured in code)
`cat-harness/docs/assets/js/docs-ui.js` ~10427-10441 builds the notice with innerHTML in ENGLISH and sets neither `lang="en"` nor `dir="ltr"` (nor wraps it in <bdi>), so it inherits `dir=rtl` from the Arabic page. Same for its expanded body (`Source:`, `How to verify:`, tool names in <code>).

## Todo
- [ ] notice: give the English summary and body `lang="en" dir="ltr"` (or translate the notice through the gettext pipeline and keep it RTL), and make the one-line clip fall on the logical END (text-overflow: ellipsis with direction-aware alignment), not the start
- [ ] audit every other English-only chrome string the docs UI injects (badges: sweep state, translation status; tile titles; tooltips) for the same inherit-rtl defect
- [ ] check layout under dir=rtl: content column alignment, sidebar side, the right-hand tile rail (counts 3 / 529 / ?), the green banner's link order and the ↗ arrows
- [ ] e2e: extend `cat-harness/test/translation-badges.e2e.ts` to load an Arabic page and assert the notice's computed direction is ltr (or the text is Arabic) and that its first word is visible
- [ ] screenshot before/after in Arabic and one LTR language (rendered-verification)

_2026-10-06T14:10:58Z_ — Claimed by claude/laughing-ramanujan-uripip — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
