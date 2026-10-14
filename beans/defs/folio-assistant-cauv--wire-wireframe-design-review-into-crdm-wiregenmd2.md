---
# folio-assistant-cauv
$schema: bean/1.0.0
title: Wire wireframe-design-review into CRDM (wiregen.md:24 instruction)
status: in-progress
type: task
priority: normal
created_at: 2026-10-14T17:30:00Z
updated_at: 2026-10-14T17:30:00Z
---

The owner, 2026-09-23 (`methodologies/wiregen.md:24`): *"make methodology/utilize/integrate into existing processes ... wireframe is part of design process for adjudication"*. `Process_WireframeDesignReview` was called by no BPMN, so a feature request that changed a rendered surface was implemented with no design the requester had chosen. Approved by the owner on 2026-10-14 ("Yes, fix it").

Branch: litlfred/cat-harness `claude/crdm-wireframes` (commit 15caa582), PR to be opened by the owner.

- `crdm-requirements-definition.bpmn`: `GW_RenderedSurface` after `A_DefineReqs`; yes calls `Process_WireframeDesignReview` (`Call_Wireframe`, agent lane), merging into `A_CompareOptions`; `BA_ReviewReqs` chooses a candidate before implementation.
- `crdm-deliver.bpmn` `A_Implement`: build against the chosen candidate; the delivery summary links it beside the after-screenshot.
- `crdm-requirements-workflow` (Phase 3 step 6, Phase 4b, Phase 6), `crdm-requirements-template` ("UI / wireframe" section).
- `wireframe-design-review`: candidates are assets of the proposal (`docs/proposals/<slug>/wireframes/`); requester/BA is the human reviewer; shown where the requester will look (staging-review deep-link rule, point 5); new input/output contracts with renderings, `changedAssets` and `stagingLinks`.
- `roles.json`: business-analyst carries `wireframe-design-review`.

## Done when

- [ ] The owner merges `claude/crdm-wireframes` into cat-harness main.
- [ ] After #201 lands, `schemas/staging.test.ts` passes with the wireframe-design-review output's inline `stagingLinks` copy.
- [ ] The next regen at folio-assistant's pins refreshes the derived subgraph JSON-LD and payloads the branch left to it.
- [ ] The first CRDM request that changes a rendered surface runs `Call_Wireframe`, and its proposal holds the chosen candidate.
