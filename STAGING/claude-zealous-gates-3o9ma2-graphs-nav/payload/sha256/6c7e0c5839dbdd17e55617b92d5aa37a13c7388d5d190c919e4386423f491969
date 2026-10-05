---
# folio-assistant-1br0
title: 'SEARCH REMOTE: publish the identifier lookup as its own page and link it from the search box (#1972 step 3)'
status: completed
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
- [x] tests; green on CI, PR ready — #2008 merged (`ready: 5e33f8abc`, 21/23 success + 2 intended skips); its staging preview ran the publish step, the split and `search-scopes` with the remote check, and deployed `id-lookup/`

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

## Summary of Changes

#2008 (merged). The owner's choice for #1972 step 3: a separate page and a
link, keeping both standing decisions (bean `4pm8`'s ruling; the lookup
client's "never under the plain docs pipeline").

- `cat-harness-tools/scripts/publish-id-lookup.ts` copies the lookup client
  and every declared instance's generated index into `<site>/id-lookup/`
  after the build, in `docs-site.yml` and `feature-staging.yml`.
- `search-split.ts` names each index published in the tree as a manifest
  `remote` entry; the search box shows one link per entry, carrying the
  reader's query, and loads nothing under `id-lookup/` itself.
- `search-scopes` fails a remote whose page or index is missing; both
  workflows' `paths:` cover the script, the client and every `*/id-lookup/`.

Not done, by decision: delegation to WHO IRIS's own search (would revisit
`4pm8`'s "accept the gap"), and large-slice loading (bean `q8ar`, another
session's).
