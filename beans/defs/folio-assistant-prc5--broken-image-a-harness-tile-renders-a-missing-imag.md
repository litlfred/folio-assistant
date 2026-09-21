---
# folio-assistant-prc5
title: 'BROKEN IMAGE: a harness tile renders a missing-image placeholder, and two tiles are both titled folio-assistant'
status: todo
type: task
priority: high
created_at: 2026-09-21T10:50:42Z
updated_at: 2026-09-21T10:50:42Z
parent: folio-assistant-6lb8
---

Issue: https://github.com/litlfred/folio-assistant/issues/602 — owner, 2026-09-21: *"broken image on LHS navbar"*, with a screenshot.

Two defects visible in the same screenshot, and they may share a cause:

1. **A broken image.** The topmost tile renders the browser's missing-image
   placeholder (`?`) where its mark should be. `harness-tiles.ts` resolves an
   icon and `nav_footer_custom.html` emits `<img src="{{ t.icon.src | relative_url }}">`
   — so either the resolved path does not exist on the published site, or the
   tile was given an icon it should not have had. **An `<img>` whose `src` 404s
   is worse than no `<img>`**: the same `pb04` rule as a dead link, one layer
   down. A tile with no art must render its themed mark or nothing, never a
   placeholder.

2. **Two tiles both labelled `folio-assistant`.** The repository root and the
   `cat-harness` instance both resolve to that title, so the list shows the same
   name twice with different counts. A reader cannot tell which one they are
   about to open, which is the `f76l` failure in another costume: a label that
   does not identify its subject.

Measure before fixing: fetch the built `index.html` and the referenced asset
path from `origin/gh-pages` (`git show origin/gh-pages:STAGING/<branch>/...`) —
egress to `litlfred.github.io` is blocked from this container, so the branch is
the only place the served bytes can be read.

## Done when

- [ ] no tile emits an `<img>` whose `src` is not present in the published site
- [ ] absent art renders the themed mark or nothing — never a placeholder
- [ ] each tile's label identifies its subject uniquely; a duplicate is a finding
- [ ] both asserted against the SERVED HTML, not against the tile data
