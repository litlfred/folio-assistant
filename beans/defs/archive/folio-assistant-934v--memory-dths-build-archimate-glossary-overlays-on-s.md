---
# folio-assistant-934v
$schema: bean/1.0.0
title: 'Memory: DTHs build ArchiMate/glossary overlays on smart-ra; never add DTH elements straight into the smart-ra model'
status: completed
type: task
priority: low
created_at: 2026-11-01T08:35:41Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dth-overlays-not-model.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: DTHs build ArchiMate/glossary overlays on smart-ra; never add DTH elements straight into the smart-ra model

A DTH (dth-phc, dth-sfp, dth-pc, ...) builds overlays onto the smart-ra model and does not add elements to smart-ra directly. The only smart-ra change allowed is for a real term/model conflict between a DTH and smart-ra: then file an issue on smart-ra AND on the DTH.

**Why:** owner, 2026-11-01 08:13Z, after smart-ra#182 added 267 PHC/SFP/shared-role items to the model.
**How to apply:** don't version-bump smart-ra ArchiMate for DTH content; #182 is held (draft.2 bump reverted, c984026). Card Q-RA1 asks: A overlays per DTH (recommended), B PHC only, C keep #182. Known clash: "Health worker" BusinessRole vs smart-ra "Health Worker" DataObject. smart-ra has no overlay tooling yet. See folio-assistant-wmmg.

Q-RA1 answered A (08:20Z). Done: PHC -> dth-phc#3 (f44be74, issues dth-phc#8/#9/#10, smart-ra#201). SFP -> draft dth-sfp#8 (stacked on #3, issue dth-sfp#7): tags overlay:owner / overlay:base (smart-ra copy) / overlay:dth (copy from another DTH overlay, here dth-phc's Point-of-service application + Health worker). Pattern: scripts/archimate/extract_overlay.py + archimate/README.md in each DTH; check:dth-glossary validates tags. Q-SFP1 answered A (08:39Z): keep borrowing from dth-phc via overlay:dth.
