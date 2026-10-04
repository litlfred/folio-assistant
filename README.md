# `cat/fhir-harness/ig-docs` — a route-keyed store

**Not a working branch. Do not merge it, and do not open a pull request from it.**
It is an orphan branch (no parent) holding the published output of ONE generator,
`fhir-harness/scripts/gen-ig-pages.ts`: the reader-facing pages of every FHIR
Implementation Guide whose artefact index a checkout holds. Bean `folio-assistant-lbz8`.

Owner, 2026-10-04: *"auto-docs (e.g. fhir) should be in cat/cat-harness/auto-docs so not
pollute main. or maybe cat/fhir-harness/ig-docs"*. Asked with options, the owner chose this
name: the branch belongs to the harness whose writer produces the pages, it names nothing
WHO-specific (which fhir-harness must not), and the same name serves every IG fork.

## What is here

| path | pages at seed | gate |
|---|---|---|
| `smart-trust/docs/` | 2160 | `smart-trust:pages:check` |
| `smart-base/docs/` | 305 | `smart-base:pages:check` |
| `smart-immunizations/docs/` | 756 | `smart-immunizations:pages:check` |

Paths mirror the checkout, so a reader finds a page where `main` used to hold it.

**Each directory's `README.md` is NOT here, on purpose.** It is written by a different
generator (bootstrap-tools' `subgraph-readmes.ts`), and a route-keyed store has one writer
per route. A page here that two generators write would be the premise failing.

## `keyedBy: "route"`

A rendered page is authored by nobody: the newer generation wins, the unit replaced is the
route, and a lost write costs a rerun. So a write carries no `expect`, and
`cat-harness/scripts/branch-store.ts` refuses one that does. This is the same mechanism and
reasoning as `cat/cat-harness/uml-overview` (bean `xsrv`).

## `main` is still authoritative

`manifest.json` says `"status": "seed"`, `"authoritative": false`. Nothing reads this branch
yet, and `main` keeps its copy. The cutover is `lbz8`'s remaining work, in order and
behind `xsrv`'s first family:

1. `gen-ig-pages --check` reads the branch, and a branch it cannot fetch reports
   **unknown**, never a pass;
2. the declarations set `storage: { branch: "cat/fhir-harness/ig-docs", keyedBy: "route" }`,
   after the reader migrates and never before;
3. the pages come off `main` **only on the owner's explicit go**
   (`deletion-requires-confirmation`).

In an IG fork (litlfred/smart-trust#5 first) the pages are already not committed. That
fork's own `cat/fhir-harness/ig-docs` takes the same layout, under `smart-base/docs/`.

## Verified at seed time

Every page's blob id here equals `main@63ec4fffc4`'s at the same path. That was checked
before the push and again from a cold fetch. The only differences are the three excluded
READMEs.
