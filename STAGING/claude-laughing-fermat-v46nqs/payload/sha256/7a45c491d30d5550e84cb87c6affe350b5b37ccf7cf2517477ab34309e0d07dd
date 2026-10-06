---
# folio-assistant-jj2w
title: Migrate smart-kg L1 schema to Zod in litlfred/smart-base, with FSH logical models + value sets generated from it
status: in-progress
type: task
priority: normal
created_at: 2026-10-06T08:58:15Z
updated_at: 2026-10-06T09:39:53Z
parent: folio-assistant-ioa4
---

## Done when
- [x] the L1 ontology and the graph-document shape are Zod modules in litlfred/smart-base, the single source
- [x] generators write FSH Logical models, CodeSystems and ValueSets into input/fsh/, plus JSON Schema + ontology JSON; --check fails when stale
- [x] SUSHI compiles the generated FSH
- [x] the Zod validator matches validate.mjs on a passing graph and on negative cases

## Progress 2026-10-06
litlfred/smart-base@30007d7 (branch claude/happy-pasteur-pav8ba), kg/: Zod source; l1.json JSON-equal to WHO main; SUSHI 0 errors; generate_logical_model_schemas.py -> 22, generate_valueset_schemas.py -> 7; 17 tests pass with SMART_KG_HOME. Reuse: KGPublication Parent DublinCore, KGTerminologyCode Parent Coding, GRADE lists from cat-harness/code-lists (wg7r). All items done; left open until review.
