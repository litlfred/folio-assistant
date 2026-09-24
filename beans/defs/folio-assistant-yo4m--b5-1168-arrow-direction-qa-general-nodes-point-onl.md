---
# folio-assistant-yo4m
title: 'B5 (#1168): arrow-direction QA — @general nodes point only at general nodes'
status: in-progress
type: task
created_at: 2026-09-24T12:11:06Z
updated_at: 2026-09-24T12:11:06Z
parent: folio-assistant-tr05
---

Part of s4sp (plan B5, 'QA check first, then fixes'). @general on RoleDef, SkillDefinition, RequirementStatement, GraphKindDef, CapabilityDefinition, ActorDef, ActorDefinition, ProcessId (owner: core six + Process). schema-graph reads the tag; scripts/arrow-direction.ts checks schema @refs and BPMN folio pointers; kg-audit criterion arrow-direction (major). Reports 19 findings for later fixes: 9 folio:implements workflow, 10 folio:link href.
