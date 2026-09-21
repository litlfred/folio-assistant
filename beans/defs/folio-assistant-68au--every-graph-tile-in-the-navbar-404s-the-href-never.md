---
# folio-assistant-68au
title: Every graph tile in the navbar 404s — the href never gets the baseurl
status: in-progress
type: bug
priority: normal
created_at: 2026-09-21T20:47:15Z
updated_at: 2026-09-21T20:52:36Z
parent: folio-assistant-o3xy
---

Issue #801. `graph-tiles.ts` stores a site-root-relative href (`/beans/`), which is right as data. `docs-ui.js`'s `tileLink` writes it into an anchor with no `site.baseurl`, so under `baseurl: /folio-assistant` every one of the 12 tiles resolves against the ORIGIN and 404s. The owner found it from the other end: looking for the beans board and landing on https://litlfred.github.io/beans/ — which is exactly what the beans tile links to.

docs-ui.js already states the rule it breaks, on the other tile family: an absolute `/kg/` is a 404 rather than a wrong-looking link.

`test/graph-tiles.e2e.ts` did not catch it because it asserts the rendered href EQUALS the declared one — true only because the code does nothing, and the fixture serves at the origin root. Same shape as the `toRootFor` test PR #776 paid for.

## Done when
- [x] Tile hrefs composed against the site baseurl rather than emitted raw
- [x] The baseurl reaches the client explicitly, not inferred from an optional block that can be absent
- [x] graph-tiles.e2e.ts runs under a non-empty baseurl and fails without the fix
- [x] bun run gates green
