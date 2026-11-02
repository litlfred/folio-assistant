---
# folio-assistant-pbv1
$schema: bean/1.0.0
title: 'BEANS BY PROCESS: processed-beans and processed-bean visualiser pages (BPMN with bean markers, filters, stalled search)'
status: in-progress
type: feature
priority: normal
created_at: 2026-11-02T18:45:00Z
updated_at: 2026-11-02T18:45:00Z
parent: folio-assistant-yj32
tags:
    - visualiser
    - beans
    - workflow-state
    - handover
---

## How to resume (read this first)

Owner ask 2026-11-02 18:35Z (thread cmsg_017WNUkNK8kdDziPK58Pv6G9PqHijxfA1UbP1sLEYKpWLG): a page showing every process that has beans, each BPMN drawn with markers at the steps where beans sit, with filter/search/last-updated to find stalled beans; and the same view for one bean. Owner 18:40Z: "commit early commit often and push".

- Issue: litlfred/cat-harness-tools#1413
- Mockup (real data): https://claude.ai/artifact/BhKAqXAqj7Ay49YPeKrcEr
- Code branch: cat-harness-tools `claude/processed-beans` (draft PR to follow)

## What exists

- cat-harness-tools `scripts/workflow-view.ts` + `scripts/state-visualizer.ts` (bean v49e): one page PER INSTANCE at `<base>/<harness>/beans/<store>/workflows/<instance>/` with the token highlighted. No process-wide page, no bean-wide page, no filters.
- Diagrams are pre-rendered SVGs at `docs/assets/img/workflows/<name>.svg` (bpmn-js, `data-element-id` on each shape) and highlighted client-side.

## Data finding

12 instances / 4 processes on this branch. All 7 running ones last moved 33-43 days ago; 3 on completed beans, 3 on beans that no longer exist, 1 token on a step the diagram dropped (A_AnnounceBranch). Agents stopped recording instances in early October.

## Plan / checklist

- [ ] `scripts/processed-beans.ts`: pure join -> `processed-beans.json` (reuse workflow-view stuck kinds; add `node-missing`, `bean-missing`)
- [ ] tests for the join
- [ ] page `processed-beans/` (all processes) and `processed-bean/?bean=` (one bean), lazy-loaded diagrams, client filters in the URL
- [ ] wire into state-visualizer publish; declare visualisers in cat-harness `cat-harness.json`
- [ ] open questions carded to owner: route (literal /beans/en/... vs harness route rule) and what to do about unrecorded instances
