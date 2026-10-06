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
- [x] notice: give the English summary and body `lang="en" dir="ltr"` (or translate the notice through the gettext pipeline and keep it RTL), and make the one-line clip fall on the logical END (text-overflow: ellipsis with direction-aware alignment), not the start
- [ ] audit every other English-only chrome string the docs UI injects (badges: sweep state, translation status; tile titles; tooltips) for the same inherit-rtl defect
- [ ] check layout under dir=rtl: content column alignment, sidebar side, the right-hand tile rail (counts 3 / 529 / ?), the green banner's link order and the ↗ arrows
- [x] e2e: extend `cat-harness/test/translation-badges.e2e.ts` to load an Arabic page and assert the notice's computed direction is ltr (or the text is Arabic) and that its first word is visible
- [x] screenshot before/after in Arabic and one LTR language (rendered-verification)

_2026-10-06T14:10:58Z_ — Claimed by claude/laughing-ramanujan-uripip — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

*2026-10-06* — Worked (subagent of the claiming session). Done:

- **Notice**: `docs-ui.js` builds it from nodes (no innerHTML; `translationSource` is no longer interpolated into markup) and marks the `<details>` `lang="en" dir="ltr"` via a new `chromeText()` helper. The sentence is ONE flex item (`.fa-translation-warning__text`) with `text-overflow: ellipsis`, so it truncates at the logical end; opened, it wraps. Full sentence in the summary's `title`.
- **`[dir="rtl"] { text-align: right }` -> `start`**: `right` is physical and inherits, so every LTR island in an RTL page was right-aligned in its own box.
- **RTL content column**: `[dir="rtl"] .main { margin-right: 264px }` was the theme's OPEN sidebar width, stale since the sidebar rests as a `--fa-nav-collapsed` strip — a 240px dead band beside the rail at 1400px (column 32-1104 vs the mirrored 32-1312 now). Now mirrors `.side-bar + .main` with the same two variables inside the same 50rem query.
- **Badges**: coverage and sweep badges get `lang="en" dir="ltr"` on the badge (the row keeps the page's direction).
- **`_includes/harness_details.html`** ("What each harness holds", English on every locale) gets `lang="en" dir="ltr"`: full stops and colons were at the wrong end on the Arabic home page.
- e2e: three tests in `translation-badges.e2e.ts` (attrs + computed ltr on an RTL page; first glyph at the left edge, ellipsis, no overflow at 480px; badges marked English, row stays rtl) — fail on the old code, pass on the new.
- Screenshots (local `preview:site` build, AR + FR, desktop + 420px): before-*/after-* in the session scratchpad `rtl/`.

Remaining (why items 2 and 3 stay open):

- Item 2, NOT fixed — English chrome still unmarked on an RTL page: the Stickies/todo board panel, the QA panels the `TR` badge opens, the page-settings panel, the glass strip/handle ("Folio ▾"), the search band, the right-hand rail's tooltips and counts, the document index ("On this page" etc.), the generated `fa-page-qa-badges` `TR` badge (direction ltr via CSS only, no `lang`; it is emitted by `gen-docs-pages.ts` too, so it wants one change in both places). Per-element `title` tooltips inherit their element's direction. The right fix is probably a `chromeText()` call at each panel ROOT rather than per string.
- Item 3: checked locally — sidebar on the right, column now mirrors LTR, rail on the right with counts intact, language selector reversed (correct). NOT checked: the green staging banner's link order and arrows — it exists only on the staging preview (`staging-banner.ts`), not in a local build.

