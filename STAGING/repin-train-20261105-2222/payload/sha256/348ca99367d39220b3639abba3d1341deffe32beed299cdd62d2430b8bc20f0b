---
# folio-assistant-ohpz
$schema: bean/1.0.0
title: 'CI speed II (d): diff-keyed reuse when only main moved'
status: completed
type: task
priority: normal
tags:
    - ci-speed-ii
created_at: 2026-11-05T08:26:16Z
updated_at: 2026-11-05T13:17:27Z
parent: folio-assistant-k3vv
---

When only main moved and the PR's own diff did not, most of the PR's verdicts still hold. Key reuse on the PR's diff and the files it reads, not on the head commit. Sibling "CI speed 2" of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

## Done when
- [x] a re-run after a main-only move reuses the verdicts whose inputs did not change (run IDs cited): Feature Staging run 42022802397, PR #2954

_2026-11-05T08:40:00Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk from the CI-speed analysis of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

_2026-11-05T08:33:31Z_ — Claimed by claude/ci-skip-main-only-reruns — pushed to cat/cat-harness/beans so sibling sessions see it before this branch has a PR (bean 35nj).

_2026-11-05T11:42:47Z_ — Verification attempt (owner card "Next k3vv" option 1): #2949 merged 10:37Z, but **not yet proven**. No qualifying event since: no `synchronize` push whose own diff was unchanged. #2950's merge from main (Feature Staging run 42012471733) resolved a conflict in feature-staging.yml, so its diff changed and `stage` rightly ran. No head carries `preview/own-diff-unchanged` yet, and no PR-event CQG run has reused a verdict. Look for both on the next agent merge from main into a PR. Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-05T13:17:27Z_ — Proven at 13:2xZ: Feature Staging run 42022802397 (PR #2954, head 212b132, synchronize at 11:55Z) skipped stage on an unchanged own-change key 101bc240ade8; the head carries preview/own-diff-unchanged: success (12:01:36Z). One preview build saved (~25 runner-min). PR/dispatch verdict reuse not yet seen on a runner (see the note file). Session https://claude.ai/code/session_01VQDpPeQPJxidbiuwAuo6zE.
