---
# folio-assistant-vhqq
title: 'WORK PLAN DASHBOARD: 60 beans declare blocked_by but readBeans reads only blocking, so the dashboard misses most blocking edges'
status: todo
type: bug
priority: normal
created_at: 2026-10-03T12:05:24Z
updated_at: 2026-10-03T12:05:37Z
parent: folio-assistant-ahvw
---

Found 2026-10-03 by the q8ar slice builder. `grep -c '^blocked_by:' beans/defs/*.md` → 60 files; `cat-harness/scripts/beans.ts` readBeans reads only `blocking:` (7 beans). So `docs/assets/beans/index.json` and `work-plan.js` show a fraction of the real blocking graph — the 'could not determine' rendered as 'none' shape.

## Done when
- [ ] readBeans reads both directions and normalises to one edge set (blocker → blocked), deduplicated
- [ ] the published beans index carries the edges; the dashboard draws them
- [ ] a test over the real corpus asserts the edge count equals the union of both declarations
