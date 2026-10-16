---
# folio-assistant-2ipj
title: 'PROCESS CATALOGUES: clinical (smart-base-clinical holds none yet), public health and health system (from the DTH documents)'
status: todo
type: feature
priority: normal
created_at: 2026-10-10T14:06:52Z
updated_at: 2026-10-10T14:06:52Z
---

Owner, 2026-10-10: *"there is a WHO/smart-base-clinical ... which will be the catalog of clinical processes/encoutners. Assume that such analouges will exist for public health and health systems (these will come fromt he already ingested Digiatl Transformation Handbooks (for supply chain architecture, product catalogu,,,) and more are coming)."*

## Measured 2026-10-10
WorldHealthOrganization/smart-base-clinical and litlfred/smart-base-clinical (b2d0df3) hold **no** processes, encounters, personas, CodeSystems or ValueSets:
- 24 CPG-derived profiles (`sg-encounter`, `sg-careplan`, …)
- one extension
- the WHOCommon CQL library

smart-core is a pre-SUSHI data-element IG with no processes either. So the clinical catalogue does not exist yet. The public health and health-system catalogues would come from the DTH documents already ingested in smart-base's library.

## Done when
- [ ] a decision on where each catalogue lives (smart-base-clinical for clinical; new or existing IGs for public health and health system) and on its shape (BusinessProcessWorkflow + BPMN, with persona ActorDefinitions)
- [ ] the recommendation-scenario extraction looks catalogues up in its precedence order, and reports "catalogue absent" until they exist
