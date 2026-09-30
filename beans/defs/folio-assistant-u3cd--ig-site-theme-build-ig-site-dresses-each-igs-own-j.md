---
# folio-assistant-u3cd
title: 'IG SITE THEME: build-ig-site dresses each IG''s own just-the-docs site in the palette its instance declares'
status: in-progress
type: feature
priority: normal
created_at: 2026-09-30T21:48:48Z
updated_at: 2026-09-30T21:48:59Z
---

Issue #1682, owner 2026-09-30: theme the per-IG site at /<instance>/ig/ (bamf, #1670) reusing the webpage theme #1683 declares, not a second copy.

## Approach
- stage-ig-sites resolves the instance's ONE declared webpage theme through instanceThemes (platform, generic: fhir-harness never names WHO).
- build-ig-site writes it as a just-the-docs colour scheme (_sass/color_schemes/<instance>.scss + color_scheme in _config.yml): surface->background, ink->text/headings, accent->links/buttons/sidebar, edge->borders.
- Sidebar text is CHOSEN by computed WCAG contrast among palette roles, never a literal; below 4.5:1 is reported.
- No webpage theme declared -> no scheme, reported (not a silent default).

## Why not pageThemeCssVars
It sets --sidebar-color/--link-color/--border-color, which only folio-assistant's docs-ui.css reads. The /ig/ site is plain just-the-docs, so those would be inert there.

## Done when
- [ ] scheme written from a declared palette, with tests
- [ ] contrast chosen and reported
- [ ] staged smart-trust site rendered locally with #1683's palette and screenshotted
- [ ] PR green
