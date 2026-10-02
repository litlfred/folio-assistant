---
# folio-assistant-6vvv
title: PlantUML object model generated from the JSON Schemas
status: completed
type: task
priority: normal
created_at: 2026-09-22T23:25:34Z
updated_at: 2026-09-23T09:46:50Z
parent: folio-assistant-zzmr
---

Generate a .puml of the harness object model (deck slide 3: schema, scenario, process, state, test) whose class attributes are DERIVED from each model's JSON Schema — zod-to-json-schema for harness-owned models, the SMART DAK JSON Schema for User Story, the beans GraphQL schema for Bean — and whose relationships are asserted against those schemas.

## Todo
- [x] generator script
- [x] generated .puml committed
- [x] gates green
- [x] PR

## Summary of Changes

Landed in litlfred/folio-assistant#991 (merge 0bcf94bd), merged on the owner's instruction with CI green on 5b1aa15f.
