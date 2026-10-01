---
# folio-assistant-rfuq
title: 'S4 direction and placement: zero wrong-direction edges; placement PR2-PR9; 9umr finale'
status: todo
type: task
priority: normal
created_at: 2026-10-01T08:14:34Z
updated_at: 2026-10-01T11:26:09Z
parent: folio-assistant-7x5n
blocked_by:
    - folio-assistant-hx65
---

Absorbs zlmp, yj6r, zhg2, r3gy, 2j2r, iirv pzwb/63wl/4fv8/tlat/apcg/8fq9/f8wp/p9bu, 9umr finale. Placement PRs run ONE AT A TIME.

## Done when
- [ ] import-direction and reference-direction at 0 wrong-direction edges
- [ ] 2j2r readers follow the checkout
- [ ] placement PR2..PR9 merged
- [ ] 9umr: last five tool skills out of folio-core


## Owner rulings 2026-10-01
- large-datasets -> subgraph of cat-harness. Blocker: 1 upward import (large-datasets/scripts/gen-id-lookup.ts -> folio-assistant-core/schemas/catalogue.js) + needs: folio-assistant-core.
- agent-skills -> library subgraph of cat-harness. 0 code imports from core; drop needs: folio-assistant-core.
- [ ] large-datasets folded into cat-harness
- [ ] agent-skills folded into cat-harness


## 2026-10-01 evidence from #1776 (S4 agent)
R5 26->0, R6 md 12->0, large-datasets core import 1->0, reference-direction 1667->1640 occurrences (381->372 files). R6 .ts x6 are emitted-file paths, not root refs. Remaining: gen-id-lookup SOURCE='who-iris' and large-datasets prose naming core; goes with the needs change.
## Owner rulings 2026-10-01 on the placement-audit questions (#1778)
Q1 watchers->sci (generic integration-watcher stays); Q2 editorial graph split; Q3 Milnor->sci, render-check split; Q4 maths pipeline split in S5; Q5 dissolve large-datasets/agent-skills into concern groups; Q6 rename skills/authoring->skills/content (PR2); Q7 core catalogue/dublin-core/fhir-artifact-index split.
