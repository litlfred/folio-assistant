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

## Evidence sweep 2: preview skip shown on run 42022802397; completed

Evidence sweep 2, 2026-11-05T13:2xZ. #2949 is on main (09b732e).

**Shown working: the preview skip when only main moved.**
- Feature Staging run 42022802397: a `pull_request` synchronize on PR #2954, head 212b132, 11:55Z.
- `conflict-gate` computed the PR's own-change key `101bc240ade8`. It equalled the live CI preview's `_build-patch.json`, so `stage` was skipped.
- The head carries `preview/own-diff-unchanged: success` (12:01:36Z).
- Saved: one full preview build, about 25 runner-min (measured stage ~25 min, job 127131330327).

**Not yet shown on a runner:**
- CQG `verdict-reuse` answering `reuse=true` on a `pull_request` or `workflow_dispatch` run. No such run since 10:37Z had an earlier green run on the same tree.
- `e2e-scope` on dispatches does run: dispatch runs 42030336059 and 42027693995 have `End-to-end scope = success`. Whether any answered `affected=false` is not read here.
- `dispatch-<ref>` supersession: dispatch run 42025861803 on claude/cqg-input-digest-cache was cancelled and 42030336059 followed on the same ref. That is consistent with supersession, but its cause is not verified here.

The done-when, "a re-run after a main-only move reuses the verdicts whose inputs did not change (run IDs cited)", is met by the preview skip above. Completed; the remaining items are noted for the CI-speed epic k3vv.
