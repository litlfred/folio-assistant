---
# folio-assistant-prc5
title: 'BROKEN IMAGE: a harness tile renders a missing-image placeholder, and two tiles are both titled folio-assistant'
status: completed
type: task
priority: high
created_at: 2026-09-21T10:50:42Z
updated_at: 2026-09-21T11:02:09Z
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

- [x] no tile emits an `<img>` whose `src` is not present in the published site
- [x] absent art renders the themed mark or nothing — never a placeholder
- [x] each tile's label identifies its subject uniquely; a duplicate is a finding
- [x] the SERVED HTML is where the defect was MEASURED (`origin/gh-pages`). The fix is
      asserted at the tile-data level, and that is a real limit rather than a shortcut:
      the sidebar is Liquid over `_data/harness.json`, which Jekyll renders, and this
      repository runs no Jekyll build in its test suite. `site-links.test.ts` is the
      nearest thing to a served-bytes check and it does not cover `_data`-driven `src`
      attributes. Naming the gap rather than ticking through it.

## What it actually was, 2026-09-21

Read out of `origin/gh-pages`, because egress to the published site is blocked
from this container and the branch is the only place the served bytes can be
had:

```
<img class="fa-harness-tile__mark"
     src="/folio-assistant/STAGING/<branch>/docs/assets/img/icons/cat-mark.svg">
```

`docs/` is the instance's site directory, and the build copies that
directory's CONTENTS to the mount — so the declared prefix is exactly what a
published URL does not carry.

**The helper could never have worked.** `siteRelative(src, siteDir)` was handed
an ABSOLUTE `siteDir` (`/…/cat-harness/docs`) and a RELATIVE `src`
(`docs/assets/…`), so its prefix test was false for every input and it passed
everything through unchanged. A helper that silently passes everything through
is indistinguishable from one that is working, which is why the replacement
takes the instance's own directory and derives the prefix from that instance's
OWN declaration — and returns `undefined` rather than guessing.

Three things follow, and each is now a test:

- the site directory's prefix is stripped;
- an instance mounted beneath the site root carries its mount, so
  `/sibling/assets/…` rather than `/assets/…`;
- **no mount means no icon and a finding**, never a placeholder. `pb04` one
  layer down: a broken `<img>` reads as a broken site, while a missing one
  reads as an instance with no art, and only the second is true.

The duplicate label was the same screenshot's other half. A title is a person's
choice and is not required to be unique; a LABEL in a list of links has to be,
or it is not a label. So `disambiguate` qualifies a repeated title with the
instance's directory name — which IS unique — and records a finding on every
tile involved. `name (name)` is never emitted, because it says nothing twice.

`bun run gates` — 83/83.
