---
# folio-assistant-ffu4
title: 'work-plan-restructure skill: taxonomy as data, a dry-run plan file, an owner gate, a reversible batched apply'
status: completed
type: feature
priority: normal
created_at: 2026-10-04T15:09:14Z
updated_at: 2026-10-04T15:30:37Z
parent: folio-assistant-ahvw
---

Evidence: qou work-plan analysis 2026-10-04 (session https://claude.ai/code/session_01NdDGeP1SyShmoUssLuRZ91). qou: 5,371 beans, 141 duplicate groups, ~307 open machine-generated template beans, 292 session-log epics. lsi-indexing says never apply in bulk; there is no sanctioned middle path between bulk and one bean at a time.

## Done when
- [x] skill text in cat-harness kg (sdlc-core), registered
- [x] plan-row shape (action, new parent, status, note), inverse plan, scrap-never-delete, lsi:epics as evidence


## Summary of Changes
_2026-10-04T15:30:37Z_ — PR #2107. New skill `cat-harness/skills/sdlc/sdlc-core/work-plan-restructure.md` (sdlc-core). It covers: the taxonomy as data at the head of the plan; one row per bean with from/to columns, so the plan is its own inverse; evidence classes (explicit / rule / latent), drawn from lsi:epics, sessionLogRootBeans, the duplicate groups, branch-archaeology, the stale-claim findings and check:bean-parents; the plan stored as bean notes, split by action class; the owner gate (class approval covers explicit and rule rows only, latent rows need row approval, scrap/close under deletion-requires-confirmation); a batched apply that re-reads each bean, respects live claims and uses one flag per update; scrap never delete; reversal by git revert or by the swapped plan. No script: the evidence tools exist, and a plan-file generator is a follow-up if the skill gets used.
