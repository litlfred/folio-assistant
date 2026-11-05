---
# folio-assistant-pbv1
$schema: bean/1.0.0
title: 'BEANS BY PROCESS: processed-beans and processed-bean visualiser pages (BPMN with bean markers, filters, stalled search)'
status: completed
type: feature
priority: normal
created_at: 2026-11-02T18:45:00Z
updated_at: 2026-11-05T13:45:30Z
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
- [x] CI green on #1414, then owner review (`litlfred/cat-harness-tools#1414` merged at `4431b7cf8f44df9ab2eccc40c1f9c9f50d96d8f1` on `2026-11-02T19:14:11Z`, closing `#1413`)
- [x] optional short alias `/beans/processed-beans/` (`de623753` / `1e3c1a12` combined page across stores at `…/beans/beans-processed/`)

_2026-11-02T19:10Z_ — PR #1414 up, follow-up cat-harness#988 filed.

_2026-11-05T13:34:43Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: no other agent's commit in the window, no open PR naming it.

_2026-11-05T13:45:30Z_ — Completed on verified evidence: `litlfred/cat-harness-tools#1414` merged at `4431b7cf8f44df9ab2eccc40c1f9c9f50d96d8f1` (`2026-11-02T19:14:11Z`, closing `cat-harness-tools#1413`), follow-up commits `92d09253`, `9ce7ffca`, `eba6fd17`, `2921447f`, `de623753`, `1e3c1a12`, `bc4d213c` landed on `cat-harness-tools` `origin/main` (including the combined `/beans/beans-processed/` page), `workflow_start` / `workflow_next` / `workflow_complete` handlers verified on `origin/main` (`src/tools/workflow.ts`), and `bun test cat-harness-tools/scripts/tests/processed-beans.test.ts` passes all 24 tests (71 assertions). Follow-up `litlfred/cat-harness#988` tracks workflow instance recording.
