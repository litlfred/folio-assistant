---
# folio-assistant-txut
title: 'REVIEW VISUALISER: a review/ page per folio showing what changed from main, grouped by the folio/ graph'
status: todo
type: task
priority: normal
created_at: 2026-09-22T21:02:54Z
updated_at: 2026-09-22T21:04:44Z
parent: folio-assistant-q4jm
blocked_by:
    - folio-assistant-jwox
    - folio-assistant-ojcx
---

Owner: *"need a new visualizer under the harness maybe, like review/ which
shows things in folio diff from main"*.

**What.** A `review/` page per folio, reached from the navbar tile for that
folio and from the STAGING banner. It reads the ChangeSet (child 02) and shows:
- the changed blocks, grouped by the folio/ graph's chapter/section tree;
- counts per change kind;
- the MAIN and STAGING URLs for each block, looked up in the publish ref (as
  `staging-review` already does).

**Home.** `cat-harness/scripts/gen-review-viz.ts`, beside the eleven other
`gen-*-viz.ts` generators. It is declared as a `coverage.visualiser` so
`graph-tiles` lists it. It is a view OF the folio graph, not a new graph kind.

**Relations.**
- 7ofc: the folio/ visualiser. review/ is a MODE of viewing folio/, so the two
  should share the tree component rather than build two.
- 7m6g: the visualiser filter.
- sjic: the navbar component.

## Done when
- [ ] the page renders for a folio on STAGING with a non-empty ChangeSet, and on MAIN with an empty one ("nothing changed", not blank)
- [ ] it is declared, and `graph-tiles` lists it without an undeclared-projection finding
- [ ] it is keyboard-operable end to end (see child 06)
- [ ] rendered and inspected in a browser: `preview:site` plus a screenshot on the PR
