---
# folio-assistant-nrrf
title: 'branch-archaeology skill: classify every remote branch against main by patch-id, report-only, content branches are salvage-review'
status: completed
type: feature
priority: normal
created_at: 2026-10-04T15:09:15Z
updated_at: 2026-10-04T15:30:37Z
parent: folio-assistant-ahvw
---

Evidence: qou work-plan analysis 2026-10-04 (session https://claude.ai/code/session_01NdDGeP1SyShmoUssLuRZ91). qou: 6,480 remote branches, 461 holding math not on main. Treeless fetch of all heads took 15 s.

## Done when
- [x] skill text in cat-harness kg (sdlc-core), registered
- [x] four classes (merged / landed-by-patch-id / partial / unlanded), content-protection rule, tip-sha cache, report-only


## Summary of Changes
_2026-10-04T15:30:37Z_ — PR #2107. New skill `cat-harness/skills/sdlc/sdlc-core/branch-archaeology.md`. It defines five classes (merged by ancestry; landed by merge-tree producing main's own tree, by per-commit patch-id via git cherry, or by combined-diff patch-id for squash; partial; unlanded; undetermined, never folded into a neighbour). It adds the open-pr and bean-id flags, the content-protection rule (a content/Lean branch goes to salvage-review, never to the delete-candidate list), salvage filed per cluster rather than per branch, the treeless fetch plus an ordering that fetches blobs only where needed, a tip-sha cache with merged/landed monotone, and the report shape. Report-only. Gap named, not invented: there is no declared home for a recurring census yet.
