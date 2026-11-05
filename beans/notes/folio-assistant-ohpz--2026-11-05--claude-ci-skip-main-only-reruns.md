---
# note on folio-assistant-ohpz from claude/ci-skip-main-only-reruns
$schema: folio-bean-note/v1
bean: folio-assistant-ohpz
branch: "claude/ci-skip-main-only-reruns"
created: "2026-11-05"
---
## Evidence sweep 11:39Z: paths not exercised yet

Evidence sweep at 2026-11-05T11:39Z: #2949 landed as 09b732e at 10:37Z.

- **Preview skip:** not exercised yet.
  - The only finished Feature Staging `pull_request` run since then is 42012471733 (#2950, merge-from-main head 6bcc436). `stage` ran, as it should: no preview built before #2949 carried `_build-patch.json`.
  - A skip can fire only from a PR's second push after its first post-#2949 preview.
- **PR verdict reuse:** not exercised yet.
  - CQG `pull_request` runs 42012637449 (#2952) and 42012471605 (#2950) found no earlier green run on the same tree, so their shards ran (expected).
- **Dispatch paths** (e2e-scope, `dispatch-<ref>` supersession): no `workflow_dispatch` CQG run since the merge.
- **Not completed:** the done-when needs a run that reused; next sweep in ~2 h.
