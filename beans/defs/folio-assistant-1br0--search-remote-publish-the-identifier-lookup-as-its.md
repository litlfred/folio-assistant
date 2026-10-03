---
# folio-assistant-1br0
title: 'SEARCH REMOTE: publish the identifier lookup as its own page and link it from the search box (#1972 step 3)'
status: in-progress
type: task
created_at: 2026-10-03T14:17:59Z
updated_at: 2026-10-03T14:17:59Z
parent: folio-assistant-whlc
---

Issue #1972 step 3 (remote/large graphs). The owner's choice of 2026-10-03,
from four options: **a separate page and a link** — publish the identifier
lookup as its own page OUTSIDE the docs pipeline, name it in the search
manifest as a `remote` scope, and have the search box show one link to it.

It keeps both standing decisions: bean `4pm8`'s ruling (title search over
referenced nodes is an accepted gap; identifier lookup is carried by the
sharded lookup) and the lookup client's own "never sits under the plain docs
pipeline".

## Measured before starting
- `who-iris/id-lookup/` holds the generated index: 10 referenced entries, 28 KB, two namespaces.
- `cat-harness-tools/id-lookup/` holds the client (`index.html`, `lookup.js`, `?index=<dir>`).
- Neither is published: no workflow copies either into the site.

## Done when
- [x] `cat-harness-tools/scripts/publish-id-lookup.ts --site <dir>` copies the client and every declared index into `<site>/id-lookup/` (after the build; not in the Jekyll source)
- [x] `search-split.ts` names each published index as a manifest `remote` entry (derived from the tree, never listed)
- [x] the search box shows one link per remote entry
- [x] `search-scopes` checks every remote href resolves to an index in the tree
- [x] wired into docs-site.yml and feature-staging.yml; gates classification
- [ ] tests; green on CI, PR ready

## Verified (2026-10-03, local build)

`publish-id-lookup.ts` on the built site: client + `who-iris` index (3
files). `search-split.ts` then names it — `remote who-iris, 10 entries →
id-lookup/?index=who-iris/` — and `search-scopes` passes with 18 checked (16
scopes, 1 remote, the manifest). Tests: `publish-id-lookup.test.ts` (2),
`search-split.test.ts` (+3), `publish-verify.test.ts` (+1, a missing index
and a missing page each a finding), `search-scoped.e2e.ts` (+2: the link
carries the query; no remote, no link) — mutation-checked (no link; link
without the query). The workflows' `paths:` now cover the script, the client
and every instance's `id-lookup/`.
