---
# folio-assistant-rptk
title: The per-page language bar fails contrast in both schemes
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T01:28:38Z
updated_at: 2026-09-19T05:31:56Z
---


_2026-09-19T01:28:54Z_ — Measured 2026-09-19 by axe-core over the action-tile harness in tests/a11y.e2e.ts, while building 1le7. NOT caused by that change -- found because the new gate looked at a page the old one never did.

`mountPageLanguageBar()` in docs/assets/js/docs-ui.js renders an always-visible row of six locale tabs into `.main-content`. Its colours are INLINE STYLES on each tab, written as literals, and two pairs are below the WCAG 1.4.3 floor of 4.5:1:

- an available-but-not-current locale: `#cbd1d9` on `#f0f0f0` = **1.34:1**, five tabs. (The literal in the source is `color:#93c5fd`; `#cbd1d9` is what the tab computes to once the reading-preference and theme cascade is applied, which is itself worth checking -- a colour that is not the colour you wrote is a second defect hiding behind the first.)
- the current locale: `#ffffff` on `#3b82f6` = **3.67:1**, bold at 12.8px. Bold does NOT make this large text: SC 1.4.3's large-text exception starts at 18.66px bold, so 4.5:1 applies.

Two structural points, both of which this repo has already written down and then not applied here:

1. INLINE STYLE LITERALS. `skills/folio-core/ui-accessibility.md` says contrast is computed, not eyeballed, with the number written next to the token -- and a hex literal inside a JS string is the furthest thing from a token. The sidebar controls went through CSS custom properties for exactly this reason; this bar predates that and never moved.
2. ONE COLOUR, TWO SCHEMES. `#f0f0f0` is a light background and `#93c5fd`/`#3b82f6` were picked against the dark sidebar. This is the trap the skill names by name: "a colour written for one scheme and never rechecked in the other".

Scope note. The axe run in `tests/a11y.e2e.ts` for the tiles is scoped with `.include(".side-bar")`, with the reason stated in the spec: every control 1le7 mounts lives there, and asserting `.main-content` from a spec about the tiles would make that gate red for a reason that is not its own. Fixing THIS bean is what should widen the include, and the two should land together so the gate never asserts something that is not yet true.

Done when: the page language bar's colours are per-scheme CSS tokens with their measured ratios recorded beside them, both pairs are at or above 4.5:1 in light and dark, and the tiles' axe run drops `.include(".side-bar")` so the whole page is covered.
