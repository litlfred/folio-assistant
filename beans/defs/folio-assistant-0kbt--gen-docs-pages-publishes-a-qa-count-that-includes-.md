---
# folio-assistant-0kbt
title: 'gen-docs-pages publishes a QA count that includes the witness files it deletes in the same run'
status: todo
type: bug
priority: normal
created_at: 2026-10-04T09:39:59Z
updated_at: 2026-10-04T09:39:59Z
---
The `qa` tile and `assets/qa/index.json` are projected BEFORE the orphan sweep removes witness files whose section no longer exists, so one run after a section is renamed or removed publishes a count that includes a file that run itself deleted.

MEASURED on the #1898 branch, 2026-10-04, while bean `vqlp` was being fixed. A section `the-basic-flow` was added, generated (writing `witnesses/document-ingestion/the-basic-flow.kg.json`, `counts.fail: 1`), then withdrawn in favour of hanging the figure on an existing section. The next run reported:

    - removed orphaned .../witnesses/document-ingestion/the-basic-flow.kg.json
    ...
    qa-witness/v1  files=146  fail=24

while the tree it had just finished writing held 145 such files summing to 23. Running the SAME generator again on the unchanged tree gave `files=145 fail=23`. Nothing else differed; the second run simply had no orphan left to count.

So the published number is a function of what the PREVIOUS run left behind, not of the tree. It is off by exactly the orphans, in both `files` and every bucket — here a `fail` that no longer had a witness anywhere.

This is the `tfqf` / C9 class — a generator asking a question that finds its own output — and the module already carries the scar: `QA_CORPUS` is captured at the top of the file with the comment "Asked HERE, before the first witness is emitted, because this generator recreates `witnesses/` itself and a question asked afterwards finds its own output — which is exactly how the `qa` tile went from 965 to 2". The same care was not applied to the ORPHAN SWEEP, which runs after the projection rather than before it.

WHY IT MATTERS more than the arithmetic: the inflated bucket was a `fail`. A reader of the tile saw one failure that no witness file supported, and a reader comparing against main would have read it as a regression introduced by the branch. It fails in the other direction too — an orphan with `pass` counts inflates `pass`.

## Done when
- [ ] the orphan sweep runs BEFORE the qa projection, or the projection excludes paths the sweep has queued
- [ ] a test writes an orphan witness, runs the generator once, and asserts the published count matches the tree the run leaves behind - not the tree it started from
- [ ] idempotence is pinned: two consecutive runs on an unchanged tree publish identical counts
