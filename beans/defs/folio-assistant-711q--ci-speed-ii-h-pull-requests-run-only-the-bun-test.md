---
# folio-assistant-711q
$schema: bean/1.0.0
title: 'CI speed II (j): pull requests run only the bun-test files their change can affect'
status: in-progress
type: task
priority: normal
created_at: 2026-11-05T12:06:06Z
updated_at: 2026-11-05T12:06:12Z
parent: folio-assistant-k3vv
---

Launched by session_01VQDpPffYARDQ8juksAZScf (owner litlfred: "do it all properly, shave every second"); worked by "CI speed 7" (session_01VQDpPfihRU4aFLjQGkhvs8).

On pull_request, the four typescript-test shards run only the test files the PR's change can affect: the relative-import closure of every changed file (cat-harness-tools scripts/affected-tests.ts, cat-harness-tools#1487) plus each test that names a changed file. A re-pin's changed files are the upstream diff between the two pinned SHAs, mapped through the lock's upstreamPath -> path. Push to main, merge_group, dispatch and nightly keep the whole suite. An empty shard writes "skipped — not affected" (never a pass).

Measured: ~21 runner-min of bun test per CQG run (4 shards, ~19,400 tests, 1534 files).

Depends on: (1) cat-harness-tools#1487 merged and re-pinned (until then the selector answers "all"); (2) cqg_judge reuse-check refusing a PR run whose bun-test was a selection (CI speed 3), else verdict-reuse would let main skip the full suite.

## Done when

[ ] folio-assistant PR with the scope step + wrapper merged
[x] cqg_judge reuse-check refuses partial PR records (CI speed 3) — #2963 merged
[x] affected-tests.ts re-pinned (#2954); before/after on #2962 itself: 4 bun-test shards 27.2 → 4.5 runner-min (runs 42037701198 → 42138687407), 30 of 1,554 test files selected
[x] gates (gates-kg / gates-docs / gates-unrun) scoped through the CI cone (work item 4rbc); records start on the next main push
