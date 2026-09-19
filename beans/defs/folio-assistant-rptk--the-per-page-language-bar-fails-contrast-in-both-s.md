---
# folio-assistant-rptk
title: The per-page language bar fails contrast in both schemes
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T01:28:38Z
updated_at: 2026-09-19T05:43:14Z
parent: folio-assistant-o3xy
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

PR https://github.com/litlfred/folio-assistant/pull/328 (branch `claude/rptk-language-bar-contrast`), open for review, NOT merged.

Both failing pairs are now per-scheme CSS custom properties on `.fa-page-lang-bar` in `docs/assets/css/docs-ui.css`, each with its measured ratio in a comment beside it. Before -> after, computed per WCAG relative luminance and confirmed by axe:

- not-yet-translated tab: 1.34:1 -> 4.98:1 light (#5a6472 on #e8eaed), 5.74:1 dark (#9aa4b2 on #232a33)
- current tab: 3.67:1 -> 6.70:1 light (#ffffff on #1d4ed8), 7.02:1 dark (#0f172a on #60a5fa)
- available locale: 5.56:1 light (#1d4ed8 on #e8eaed), 8.18:1 dark (#9ec5fe on #232a33)
- bar text/globe: 12.24:1 light, 11.90:1 dark. Hovered link: 4.78:1 light, 6.31:1 dark.

CORRECTION TO THIS BEAN'S OWN MEASUREMENT, since it matters for the next reader. The five 1.34:1 tabs are the NOT-YET-TRANSLATED ones, not "available-but-not-current", and `#93c5fd` is the SIDEBAR bar's literal, not this one's. `#cbd1d9` is `color:#94a3b8` at `opacity:0.4` blended over the bar — the opacity trap `ui-accessibility.md` names — and `#f0f0f0` is `rgba(128,128,128,0.12)` over a white page, so neither colour in that pair was written anywhere. `--fa-langbar-bg` is opaque now and no text carries `opacity`, so each ratio is a fact about the tokens rather than about one page.

GATE WIDENED. `.include(".side-bar")` is off the tiles' axe run in `tests/a11y.e2e.ts`; it is page-wide and clean in both schemes and both panel states, with no assertion weakened and no other pre-existing violation revealed. Two related fixes to that harness: its `jtd` stub was pinned to `"dark"` so `data-fa-scheme` never varied and the light/dark loop rendered the dark palette twice; and it stamps `fa-translation-meta` so the available-locale colour is actually on screen to be measured.

Verified: `rm -rf _kg` then `bunx playwright test` 60/60; tsc, eslint, kg:audit:check, kg:schema:check, check:workflows all exit 0. `bun test` = 2023 pass / 1 fail, the failure being `scripts/tests/folio-root.test.ts` asserting the checkout basename is `folio-assistant` — a git-worktree artefact, pre-existing, untouched by this diff.

Left for the human: whether the dark current-tab chip (bright blue, near-black text) reads right, and how the bar looks on a real just-the-docs page. Not marking this bean done — the PR is unmerged and unreviewed.
