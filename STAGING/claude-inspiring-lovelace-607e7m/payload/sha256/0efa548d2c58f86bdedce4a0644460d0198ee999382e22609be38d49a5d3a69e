---
# folio-assistant-pbv1
$schema: bean/1.0.0
title: 'BEANS BY PROCESS: processed-beans and processed-bean visualiser pages (BPMN with bean markers, filters, stalled search)'
status: in-progress
type: feature
priority: normal
created_at: 2026-11-02T18:45:00Z
updated_at: 2026-11-02T19:10:00Z
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
- Code: cat-harness-tools draft PR #1414 (branch `claude/processed-beans`, fae97eb). Follow-up: cat-harness#988 (agents record instances again).

## What exists

- cat-harness-tools `scripts/workflow-view.ts` + `scripts/state-visualizer.ts` (bean v49e): one page PER INSTANCE at `<base>/<harness>/beans/<store>/workflows/<instance>/` with the token highlighted. No process-wide page, no bean-wide page, no filters.
- Diagrams are pre-rendered SVGs at `docs/assets/img/workflows/<name>.svg` (bpmn-js, `data-element-id` on each shape) and highlighted client-side.

## Data finding

12 instances / 4 processes on this branch. All 7 running ones last moved 33-43 days ago; 3 on completed beans, 3 on beans that no longer exist, 1 token on a step the diagram dropped (A_AnnounceBranch). Agents stopped recording instances in early October.

## Plan / checklist

- [x] `scripts/processed-beans.ts`: pure join (stuckStatesOf kinds + `node-missing`, `bean-missing`), page bodies, client script
- [x] 8 tests (scripts/tests/processed-beans.test.ts)
- [x] PATH IRIs ONLY (owner 18:42Z "no ?... want IRIs, make sure urls handle subgraphs"): `<base>/<harness>/beans/<store>/processed-beans/`, `.../processed-beans/<processId>/`, `.../processed-bean/<beanId>/`; filters stay in page state
- [x] wired into state-visualizer `drawWorkflows`; orphans pruned with the store's others
- [x] smoke test with real data: badges, filters, lazy diagrams OK
- [x] Q-PBV-1 = A (build + follow-up cat-harness#988); Q-PBV-2 = A (harness route; owner wants IRIs)
- [ ] CI green on #1414, then owner review
- [ ] optional short alias `/beans/processed-beans/`

_2026-11-02T19:10Z_ — PR #1414 up, follow-up cat-harness#988 filed.
