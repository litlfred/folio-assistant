---
# folio-assistant-7i8k
$schema: bean/1.0.0
title: 'packFromAst copied manifest files without checking they stay inside the AST'
status: completed
type: bug
priority: high
created_at: 2026-10-31T04:22:00Z
updated_at: 2026-10-31T04:22:00Z
parent: folio-assistant-33iz
tags:
    - security
    - security-review-2026-10-31
---

**Category:** security · **severity:** major

**What was wrong:** fhir-harness `scripts/build-ig-indexes.ts` `packFromAst` joined each manifest `file` to the AST directory without a containment check before packing it.

**Fix:** fhir-harness#244, merged as ab2d071: each file is checked with `realPathWithin` (symlinks included) and refused if it falls outside.

Held privately until the fix merged (owner's choice, 2026-10-31).

_2026-10-31T04:22Z_ — Filed after the fix merged, session https://claude.ai/code/session_01Qmmkt67jRwiqwomTe2Sw4b
