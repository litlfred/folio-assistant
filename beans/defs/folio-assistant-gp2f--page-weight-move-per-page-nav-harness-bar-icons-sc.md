---
# folio-assistant-gp2f
title: 'PAGE WEIGHT: move per-page nav, harness bar, icons, scripts and IG chrome CSS into shared cached assets (#1885)'
status: in-progress
type: task
created_at: 2026-10-02T16:39:55Z
updated_at: 2026-10-02T16:39:55Z
parent: folio-assistant-p5wm
---

Issue #1885.

Owner rulings, 2026-10-02:
- "~230KB per IG page mostly navigation/styling overhead... can we condense into common styling/libraries? so page size is small?"
- "1 do all."
- "first document workplan and /coordinate in case active work on pages happening"
- "(in genreal update agent-agent coorindation/hadover skills - if you are working on a refactor of the platform, review active agents/beans for impact and coordiante)"

## Measured
Deployed `smart-trust/menu/Home.html` is 225 KB, of which 4 KB is page content.

| part | size |
|---|---|
| nav (455 links, inlined per page) | 71 KB |
| harness bar / footer (desktop and mobile copies) | 2 × 25 KB |
| inline svg | 30 KB |
| inline script | 15 KB |
| inline style | 6.6 KB |

There are about 4,700 HTML pages, and each preview is a full copy of the site (#1868).

## Standing rules this follows (#1881)
- One materialized page per IRI on gh-pages.
- No 404 routing and no query strings.
- Pages are thin shells that load shared, published assets.

## Collision review (coordinate, 2026-10-02)
- **Navbar session** (session_01Cw8JgZEDT5VqQ5ergjdMjB, "UI issues: navbar, hamburger menu, avatar"; bean ob3m, stream 10uc). PRs #1804, #1805, #1808 and #1819 edit `docs-ui.css`, `docs-ui.js`, `_includes/generated/navbar-footer.html`, `harness_details.html` and `head_custom.html`. Overlaps phases B, C, D and E.
- **fhir-ast session** (session_01PricYFhYhFA5DuMJaWo3CE, bean wnhh). #1816 edits `fhir-harness/scripts/gen-ig-pages.ts`. Overlaps phase A.
- **#1766 session** (session_01DnFZtVpff4o7puqWazGvKN, smart-trust IG site). Edits the gen-ig-pages area. Overlaps phase A.
- #1875 and #1801 edit `docs-site.yml` (the build). Several more PRs touch only generated library and navbar files, which regeneration resolves.

## Workplan
Each phase is its own PR, with a before/after size table and a Chromium check at 1280 px and 390 px.

- [x] **0. Coordinate.** Post intent and asks to the three sessions above and agree the order.
- [ ] **A. IG chrome CSS.** `gen-ig-pages` emits one shared `ig-chrome.css` per chrome and references it, instead of inlining about 6.6 KB per IG page. Lands after #1816 and #1766, or is rebased onto them.
- [ ] **B. Icons.** One shared SVG sprite, referenced via `<use href>`. Saves about 30 KB per page.
- [ ] **C. Harness bar and footer.** Emitted once and made responsive with CSS. Saves about 25 KB per page. Inside the navbar session's area, so this phase is offered to that session or lands after its series.
- [ ] **D. Site navigation.** One shared, cached nav JSON rendered client-side. Every link is a real page, with a noscript fallback. Saves about 70 KB per page. Last, because it overlaps most with ob3m and p5wm.
- [ ] **E. Inline scripts.** Moved into shared, cached JS. Saves about 15 KB per page.
- [x] **F. Skills** (the coordination rule; done in 2814ee1). The site-page skill text lands with phases B–E.
  - The site-page skills say shared assets are never inlined per page.
  - The coordinate, bean-coordination and handover skills gain the owner's rule: a platform refactor first reviews active agents, PRs and beans for impact, and coordinates.

## Done when
- [ ] A sampled IG page is at most 20 KB, and the whole-site total is reported before and after.
- [ ] a11y (axe) and e2e pass, and the Chromium checks pass at both widths.
- [ ] The sibling sessions have acknowledged the order, or their overlapping PRs have landed before each overlapping phase.

## Coordination outcome, 2026-10-02
- **A:** #1766 already writes `assets/ig-chrome.css` and `assets/ig-pages.css` once per instance and links them (52 % less page CSS). Not rebuilt here. After #1766 merges, only the sharing across instances is added, reading the chrome through `chromeFileFor`. #1816 does not conflict, but use a distinct filename in `assets/` and relative links.
- **C:** owned here, at the navbar session's request. It waits for #1804, #1805, #1808 and #1819, and must respect `mountSidebarRail`, the avatar-only toggle, the strip hidden on first open, the e2e specs and `check:nav-names`. The theme emits `nav_footer_custom` in both `components/sidebar.html` and `components/footer.html`, so the fix is to override those two includes.
- **D:** keep a no-JS fallback. `mountSidebarRail` and the theme's DOMContentLoaded current-page highlight must run after the JSON nav is in the DOM, or the nav data loads synchronously. `check:nav-names` and `check:viewer-nav` read the nav JSON.

## Baseline (local `preview:site` of main `22ac68dc`; #1886 comment)
- 220.7 KB per IG page.
- Nav: 67.4 KB.
- Harness bar: 38.5 KB, emitted twice.
- Inline svg: about 31 KB.
- Inline script: about 14.5 KB.
- Whole site: 595 MiB, 89 % of it HTML.

