# `cat/cat-harness/uml-overview` — a route-keyed store

**Not a working branch. Do not merge it, and do not open a pull request from it.**
It is an orphan branch (no parent) holding the published output of ONE generator,
read through `cat-harness/scripts/branch-store.ts`. Bean `folio-assistant-xsrv`.

## What is here

| path | files at seed | writer |
|---|---|---|
| `cat-harness/docs/uml/overview/` | 132 | `scripts/gen-uml-overview.ts` (`DOCS_ROOT`) |
| `cat-harness/docs/assets/img/uml/overview/` | 262 | the same generator (`SVG_ROOT`) |

Paths mirror the checkout, so a reader finds a file where `main` used to hold it.

## `keyedBy: "route"`, and why that is not `"tip"`

A route-keyed write carries **no `expect`** and `branch-store.ts` *refuses* one that
does. A rendered page is authored by nobody: the newer generation wins, the unit
replaced is the route, and a lost write costs a rerun. An `expect` here would mean a
page has two writers — the premise failing, not a collision to resolve.

Both directories share this one branch deliberately: one generator owns them, and the
pages reference the SVGs, so a single branch makes an update atomic across both.

## `main` is still authoritative

`manifest.json` says `"status": "seed"`, `"authoritative": false`. Nothing reads this
branch yet and `main` keeps its copy. The cutover is `xsrv`'s remaining work, in order:

1. `uml:overview:check` reads the branch, and a branch it cannot fetch reports
   **unknown**, never a pass;
2. the declarations set `storage: { branch, keyedBy: "route" }` — **after** the reader
   migrates, never before (`DirectoryStorageSchema`, §"Not yet set on any declaration");
3. the files come off `main` **only on the owner's explicit go**
   (`deletion-requires-confirmation`).

Until step 3 the same bytes exist in two places on purpose, and this branch is the
copy that is not yet believed.

## Verified at seed time

Each path's git **tree id** here equals `main@066efdbfa2`'s, checked before the push
and again from a cold `git init` reader. Bean `2h76` set that standard when it seeded
`state`; a byte-compare would pass on a tree reassembled wrongly, a tree id will not.
