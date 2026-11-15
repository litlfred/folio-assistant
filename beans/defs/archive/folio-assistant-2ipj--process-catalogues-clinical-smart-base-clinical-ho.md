---
# folio-assistant-2ipj
$schema: bean/1.0.0
title: 'PROCESS CATALOGUES: clinical (smart-base-clinical holds none yet), public health and health system (from the DTH documents)'
status: completed
type: feature
priority: normal
created_at: 2026-10-10T14:06:52Z
updated_at: 2026-10-24T07:25:00Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-10: *"there is a WHO/smart-base-clinical ... which will be the catalog of clinical processes/encoutners. Assume that such analouges will exist for public health and health systems (these will come fromt he already ingested Digiatl Transformation Handbooks (for supply chain architecture, product catalogu,,,) and more are coming)."*

## Measured 2026-10-10

WorldHealthOrganization/smart-base-clinical and litlfred/smart-base-clinical (b2d0df3) hold **no** processes, encounters, personas, CodeSystems or ValueSets:
- 24 CPG-derived profiles (`sg-encounter`, `sg-careplan`, …)
- one extension
- the WHOCommon CQL library

smart-core is a pre-SUSHI data-element IG with no processes either. So the clinical catalogue does not exist yet. The public health and health-system catalogues would come from the DTH documents already ingested in smart-base's library.

## Done when

- [x] a decision on where each catalogue lives (smart-base-clinical for clinical; new or existing IGs for public health and health system) and on its shape (BusinessProcessWorkflow + BPMN, with persona ActorDefinitions)
- [x] the recommendation-scenario extraction looks catalogues up in its precedence order, and reports "catalogue absent" until they exist

_2026-10-16T10:45:00Z_ — Parented to `uhkv` (SMART STACK) by subject: it had no parent, so it sat under no epic or goal and failed the parent check on main (https://claude.ai/code/session_01NUrhvvMEwU5MmPW4L2w9jP).

_2026-10-24T07:40:00Z_ — Second done-when item checked on smart-base main (782f011): `scripts/l1-recommendation-scenarios.ts` looks a process up as guide → domain process catalogue → `could-not-determine` (decision D4) and reports "domain process catalogue absent"; `library/9789240116191-eng/l1-extraction/scenarios/scenario-warnings.md` shows it firing for all 18 DTH product-catalogue recommendations. The placement of the public-health and health-system catalogues is the one item left, put to the owner (https://claude.ai/code/session_01UbCbH19GrhqDNakmbgQTF3).

_2026-10-24T07:25:00Z_ — **Completed.** Owner ruled 2026-10-24: *"eventually we will have WHO/who-iris. leave in smart-base for now, but bean up migration once WHO/who-iris is live"*. So clinical goes to smart-base-clinical (2026-10-10), and public health and health system stay in smart-base, shaped as BusinessProcessWorkflow + BPMN with persona ActorDefinitions. The move to WHO/who-iris is bean `17iw`.

## Owner decision

_2026-10-20, smart-* lane (session https://claude.ai/code/session_016heucWhrncLm4uy52csBcz)._ Done-when item 2 is already met: `smart-base/scripts/l1-recommendation-scenarios.ts` looks a process up in the order the target guide's own processes, then a domain catalogue, then `could-not-determine`, and warns "domain process catalogue absent" (decision D4, lines 40-47 and 423-429 on smart-base main). Item 1 is yours. The shape is settled in practice: litlfred/smart-immunizations#65 puts processes in `input/business-processes/*.bpmn`, with lane ids that name actors and personas as `ActorDefinition` (smart-base retired SGPersona), and litlfred/smart-base#116 generates them from Visio figures. What is open is **where** the catalogues live:

1. **(Recommended)** Clinical in `smart-base-clinical`. Public health and health system each get a new IG of the same shape (for example `smart-base-publichealth` and `smart-base-healthsystem`), seeded from the DTH handbooks already in smart-base's library. Each catalogue sits in the guide that owns its domain, so the extraction's precedence list gains one entry per domain.
2. All three catalogues in `smart-base-clinical`, one directory per domain. One repository to look up, but it stretches "clinical" to cover public health and health systems.
3. Clinical in `smart-base-clinical`; public health and health system under `smart-base/processes/` in smart-base itself. No new repositories, but process content lands in the base layer.
4. Defer: build none until a DAK needs one. The extraction keeps reporting "catalogue absent".

**Default if you say nothing: 4.** Nothing is built and nothing breaks.

_2026-10-24T07:40:00Z_ — Second done-when item checked on smart-base main (782f011): `scripts/l1-recommendation-scenarios.ts` looks a process up as guide → domain process catalogue → `could-not-determine` (decision D4) and reports "domain process catalogue absent"; `library/9789240116191-eng/l1-extraction/scenarios/scenario-warnings.md` shows it firing for all 18 DTH product-catalogue recommendations. The placement of the public-health and health-system catalogues is the one item left, put to the owner (https://claude.ai/code/session_01UbCbH19GrhqDNakmbgQTF3).

_2026-10-24T07:25:00Z_ — **Completed.** Owner ruled 2026-10-24: *"eventually we will have WHO/who-iris. leave in smart-base for now, but bean up migration once WHO/who-iris is live"*. So clinical goes to smart-base-clinical (2026-10-10), and public health and health system stay in smart-base, shaped as BusinessProcessWorkflow + BPMN with persona ActorDefinitions. The move to WHO/who-iris is bean `17iw`.
