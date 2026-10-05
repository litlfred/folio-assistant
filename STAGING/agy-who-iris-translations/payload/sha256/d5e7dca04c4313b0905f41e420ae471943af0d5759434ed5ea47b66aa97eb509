---
# folio-assistant-ghgn
title: 'ORPHANED VIEWER PAGES: the schema-viewer and UML generators never remove the page of a retired instance (detangle''s is still published)'
status: completed
type: bug
priority: normal
created_at: 2026-09-24T05:40:27Z
updated_at: 2026-09-24T19:38:13Z
parent: folio-assistant-88mg
---

Found 2026-09-24 while retiring `bootstrap-tools` (bean 319n). `gen-schema-viz.ts` and `gen-uml-overview.ts` write one page per instance but never remove the page of an instance that no longer exists. So a retired instance keeps a published page that nothing links to.

- `bootstrap-tools`: its two orphans (`cat-harness/docs/cat-harness/schemas/bootstrap-tools/index.html` and `cat-harness/docs/uml/overview/bootstrap-tools/bootstrap-tools-schemas.md`) were removed by hand in the 319n PR, because that retirement was approved.
- **`detangle`** (retired 2026-09-23, bean `byql`): `cat-harness/docs/cat-harness/schemas/detangle/index.html` (48 KB) is still tracked and published. It was NOT removed here, because nobody has approved deleting it (deletion-requires-confirmation).

## Done when
- [x] Both generators report (or, with approval, remove) a page whose instance no longer exists, with a test
- [x] The owner decides on detangle's orphan page



## Summary of Changes (2026-09-24)
Closed on evidence; most of the work landed under other beans:
- `ankg` (1594d6a): `gen-schema-viz` prunes subject pages it owns, reports foreign ones, and in `--check` treats an orphan as a finding. Tested by `viewer-orphans.test.ts` and `orphan-pages.test.ts`.
- `gen-uml-overview` already removed its own orphans and reported them in `--check`, but the filter was inline and untested. It is now `umlOrphans()`, tested in `uml-overview-orphans.test.ts` (this PR).
- detangle's page: the owner decided on 2026-09-23 ("move it to the kept, unpublished trashcan"), and `byql` (1a93d1c) moved it into fsh-guts. It is no longer published.
