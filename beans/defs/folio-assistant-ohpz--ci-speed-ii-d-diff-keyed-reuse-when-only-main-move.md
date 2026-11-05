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
updated_at: 2026-11-05T08:33:31Z
parent: folio-assistant-k3vv
---

When only main moved and the PR's own diff did not, most of the PR's verdicts still hold. Key reuse on the PR's diff and the files it reads, not on the head commit. Sibling "CI speed 2" of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

## Done when
- [ ] a re-run after a main-only move reuses the verdicts whose inputs did not change (run IDs cited)

_2026-11-05T08:40:00Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk from the CI-speed analysis of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

_2026-11-05T08:33:31Z_ — Claimed by claude/ci-skip-main-only-reruns — pushed to cat/cat-harness/beans so sibling sessions see it before this branch has a PR (bean 35nj).
