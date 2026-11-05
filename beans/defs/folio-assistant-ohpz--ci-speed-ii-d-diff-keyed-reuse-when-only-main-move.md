---
# folio-assistant-ohpz
$schema: bean/1.0.0
title: 'CI speed II (d): diff-keyed reuse when only main moved'
status: in-progress
type: task
priority: normal
tags:
    - ci-speed-ii
created_at: 2026-11-05T08:26:16Z
updated_at: 2026-11-05T11:42:47Z
parent: folio-assistant-k3vv
---

When only main moved and the PR's own diff did not, most of the PR's verdicts still hold. Key reuse on the PR's diff and the files it reads, not on the head commit. Sibling "CI speed 2" of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

## Done when
- [ ] a re-run after a main-only move reuses the verdicts whose inputs did not change (run IDs cited)

_2026-11-05T08:40:00Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk from the CI-speed analysis of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

_2026-11-05T08:33:31Z_ — Claimed by claude/ci-skip-main-only-reruns — pushed to cat/cat-harness/beans so sibling sessions see it before this branch has a PR (bean 35nj).

_2026-11-05T11:42:47Z_ — Verification attempt (owner card "Next k3vv" option 1): #2949 merged 10:37Z, but **not yet proven**. No qualifying event since: no `synchronize` push whose own diff was unchanged. #2950's merge from main (Feature Staging run 42012471733) resolved a conflict in feature-staging.yml, so its diff changed and `stage` rightly ran. No head carries `preview/own-diff-unchanged` yet, and no PR-event CQG run has reused a verdict. Look for both on the next agent merge from main into a PR. Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.
