---
# folio-assistant-cauv
$schema: bean/1.0.0
title: Wire wireframe-design-review into CRDM (wiregen.md:24 instruction)
status: completed
type: task
priority: normal
parent: folio-assistant-o3xy
created_at: 2026-10-14T17:30:00Z
updated_at: 2026-10-20T09:30:00Z
---

The owner, 2026-09-23 (`methodologies/wiregen.md:24`): *"make methodology/utilize/integrate into existing processes ... wireframe is part of design process for adjudication"*. `Process_WireframeDesignReview` was called by no BPMN in the CRDM workflow (#203), so a feature request that changed a rendered surface was implemented with no design the requester had chosen. Approved by the owner on 2026-10-14 ("Yes, fix it").

Branch: litlfred/cat-harness `claude/crdm-wireframes` (15caa582, merged with main as fa0d24f8): merged to cat-harness main as litlfred/cat-harness#210 (3db8589) on 2026-10-14 under the owner's merge-when-green window.

- `crdm-requirements-definition.bpmn`: `GW_RenderedSurface` after `A_DefineReqs`; yes calls `Process_WireframeDesignReview` (`Call_Wireframe`, agent lane), merging into `A_CompareOptions`; `BA_ReviewReqs` chooses a candidate before implementation.
- `crdm-deliver.bpmn` `A_Implement`: build against the chosen candidate; the delivery summary links it beside the after-screenshot.
- `crdm-requirements-workflow` (Phase 3 step 6, Phase 4b, Phase 6), `crdm-requirements-template` ("UI / wireframe" section).
- `wireframe-design-review`: candidates are assets of the proposal (`docs/proposals/<slug>/wireframes/`); requester/BA is the human reviewer; shown where the requester will look (staging-review deep-link rule, point 5); new input/output contracts with renderings, `changedAssets` and `stagingLinks`.
- `roles.json`: business-analyst carries `wireframe-design-review`.

## Done when

- [x] The owner merges `claude/crdm-wireframes` into cat-harness main (`litlfred/cat-harness#210`, `3db8589`, merged 2026-10-14).
- [x] After #201 lands, `schemas/staging.test.ts` passes with the wireframe-design-review output's inline `stagingLinks` copy (`bun test cat-harness/schemas/staging.test.ts`: 5 pass, 0 fail).
- [x] The next regen at folio-assistant's pins refreshes the derived subgraph JSON-LD and payloads the branch left to it (`gen-subgraph-jsonld --check`: 373 subgraph files, 389 payloads up to date).
- [ ] The first CRDM request that changes a rendered surface runs `Call_Wireframe`, and its proposal holds the chosen candidate.

**2026-10-20 — completed.** The wiring is merged (cat-harness#210). The last box, the first CRDM request that uses `Call_Wireframe`, is something to observe, not work to do, and the owner chose to close ("1-3 as recommended", 09:27Z). Session: https://claude.ai/code/session_01NUrhvvMEwU5MmPW4L2w9jP

## Merged from the cat-harness copy (bean dedupe, 2026-10-30)

These lines differed from the kept copy and could not be merged automatically (cat-harness-tools#459). They are kept here so nothing is lost.

Where: ## Done when

```text
- [ ] The owner merges `claude/crdm-wireframes` into cat-harness main.
- [ ] After #201 lands, `schemas/staging.test.ts` passes with the wireframe-design-review output's inline `stagingLinks` copy.
- [ ] The next regen at folio-assistant's pins refreshes the derived subgraph JSON-LD and payloads the branch left to it.
- [ ] The first CRDM request that changes a rendered surface runs `Call_Wireframe`, and its proposal holds the chosen candidate.

**2026-10-20 — completed.** The wiring is merged (cat-harness#210). The last box, the first CRDM request that uses `Call_Wireframe`, is something to observe, not work to do, and the owner chose to close ("1-3 as recommended", 09:27Z). Session: https://claude.ai/code/session_01NUrhvvMEwU5MmPW4L2w9jP
```
